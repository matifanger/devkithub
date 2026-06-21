import { app } from "electron";
import * as fs from "fs";
import * as path from "path";
import { spawn, ChildProcess, execFile } from "child_process";
import * as https from "https";
import * as http from "http";

// ─── Constants ──────────────────────────────────────────────────────────

const WHISPER_VERSION = "v1.8.4";

const BINARY_URLS: Record<string, string> = {
  "win32-x64": `https://github.com/ggml-org/whisper.cpp/releases/download/${WHISPER_VERSION}/whisper-bin-x64.zip`,
  "win32-ia32": `https://github.com/ggml-org/whisper.cpp/releases/download/${WHISPER_VERSION}/whisper-bin-Win32.zip`,
};

const MODEL_BASE_URL =
  "https://huggingface.co/ggerganov/whisper.cpp/resolve/main";

const AVAILABLE_MODELS: Record<string, { file: string; sizeMB: number }> = {
  "ggml-tiny": { file: "ggml-tiny.bin", sizeMB: 75 },
  "ggml-base": { file: "ggml-base.bin", sizeMB: 142 },
  "ggml-small": { file: "ggml-small.bin", sizeMB: 466 },
  "ggml-medium-q5_0": { file: "ggml-medium-q5_0.bin", sizeMB: 514 },
  "ggml-large-v3-turbo-q5_0": { file: "ggml-large-v3-turbo-q5_0.bin", sizeMB: 547 },
  "ggml-large-v3-q5_0": { file: "ggml-large-v3-q5_0.bin", sizeMB: 1031 },
  "ggml-large-v3": { file: "ggml-large-v3.bin", sizeMB: 2952 },
};

// Strips all bracket/parenthesis annotations whisper.cpp produces:
// [BLANK_AUDIO], [Music], [Spanish], [Laughter], (inaudible), etc.
const WHISPER_ARTIFACTS_REGEX = /\[[^\]]*\]|\((?:BLANK_AUDIO|music|silence|inaudible|background[^)]*|laughing|applause|laughter)\)/gi;

type ProgressCallback = (progress: {
  status: string;
  percent: number;
  detail?: string;
}) => void;

interface TranscriptResult {
  text: string;
  error?: string;
}

interface SessionState {
  model: string;
  language: string;
  translate: boolean;
  active: boolean;
  processing: boolean;
  queue: Buffer[];
  sessionDir: string;
  chunkIndex: number;
}

// ─── Path helpers ───────────────────────────────────────────────────────

function getWhisperBaseDir(): string {
  return path.join(app.getPath("userData"), "whisper");
}

function getBinDir(): string {
  return path.join(getWhisperBaseDir(), "bin");
}

function getModelsDir(): string {
  return path.join(getWhisperBaseDir(), "models");
}

function getSessionsDir(): string {
  return path.join(getWhisperBaseDir(), "sessions");
}

function getWhisperBinaryPath(): string {
  const binDir = getBinDir();
  if (process.platform === "win32") {
    return path.join(binDir, "whisper-cli.exe");
  }
  return path.join(binDir, "whisper-cli");
}

function getModelPath(modelName: string): string {
  const info = AVAILABLE_MODELS[modelName];
  if (!info) throw new Error(`Unknown model: ${modelName}`);
  return path.join(getModelsDir(), info.file);
}

function getFfmpegPath(): string {
  if (app.isPackaged) {
    const ext = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
    return path.join(process.resourcesPath, "ffmpeg-static", ext);
  }
  // Dev mode: resolve from node_modules
  try {
    const ffmpegStatic = eval("require")("ffmpeg-static");
    if (typeof ffmpegStatic === "string") return ffmpegStatic;
  } catch {}
  const ext = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  return path.join(
    __dirname,
    "..",
    "..",
    "node_modules",
    "ffmpeg-static",
    ext,
  );
}

// ─── Download helpers ───────────────────────────────────────────────────

function resolveRedirects(
  url: string,
  maxRedirects = 10,
): Promise<{ finalUrl: string }> {
  return new Promise((resolve, reject) => {
    const doGet = (getUrl: string, count: number) => {
      if (count > maxRedirects) {
        reject(new Error("Too many redirects"));
        return;
      }
      const client = getUrl.startsWith("https") ? https : http;
      const req = client.get(getUrl, (res) => {
        if (
          res.statusCode &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          res.resume();
          doGet(res.headers.location, count + 1);
          return;
        }
        res.resume();
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} for ${getUrl}`));
          return;
        }
        resolve({ finalUrl: getUrl });
      });
      req.on("error", reject);
    };
    doGet(url, 0);
  });
}

function downloadFile(
  url: string,
  destPath: string,
  onProgress?: (downloaded: number, total: number) => void,
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const tmpPath = destPath + ".tmp";

    try {
      const { finalUrl } = await resolveRedirects(url);

      const client = finalUrl.startsWith("https") ? https : http;
      client
        .get(finalUrl, (response) => {
          if (response.statusCode && response.statusCode >= 400) {
            response.resume();
            reject(new Error(`HTTP ${response.statusCode} downloading ${finalUrl}`));
            return;
          }

          const totalBytes = parseInt(
            response.headers["content-length"] || "0",
            10,
          );
          let downloaded = 0;

          const file = fs.createWriteStream(tmpPath);

          response.on("data", (chunk: Buffer) => {
            downloaded += chunk.length;
            if (onProgress && totalBytes > 0) {
              onProgress(downloaded, totalBytes);
            }
          });

          response.pipe(file);

          file.on("finish", () => {
            file.close(() => {
              try {
                fs.renameSync(tmpPath, destPath);
                resolve();
              } catch (err) {
                reject(err);
              }
            });
          });

          file.on("error", (err) => {
            try { fs.unlinkSync(tmpPath); } catch {}
            reject(err);
          });

          response.on("error", (err) => {
            file.close();
            try { fs.unlinkSync(tmpPath); } catch {}
            reject(err);
          });
        })
        .on("error", (err) => {
          try { fs.unlinkSync(tmpPath); } catch {}
          reject(err);
        });
    } catch (err) {
      try { fs.unlinkSync(tmpPath); } catch {}
      reject(err);
    }
  });
}

async function extractZip(zipPath: string, destDir: string): Promise<void> {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  return new Promise((resolve, reject) => {
    if (process.platform === "win32") {
      const ps = spawn("powershell", [
        "-NoProfile",
        "-Command",
        `Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force`,
      ]);
      let stderr = "";
      ps.stderr.on("data", (d) => (stderr += d.toString()));
      ps.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Expand-Archive failed: ${stderr}`));
      });
      ps.on("error", reject);
    } else {
      execFile("unzip", ["-o", zipPath, "-d", destDir], (err) => {
        if (err) reject(err);
        else resolve();
      });
    }
  });
}

function findExecutable(dir: string, name: string): string | null {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isFile() && entry.name.startsWith(name)) {
      return fullPath;
    }
    if (entry.isDirectory()) {
      const found = findExecutable(fullPath, name);
      if (found) return found;
    }
  }
  return null;
}

// ─── Public API ─────────────────────────────────────────────────────────

const sessions = new Map<string, SessionState>();

export function isBinaryInstalled(): boolean {
  const binPath = getWhisperBinaryPath();
  return fs.existsSync(binPath);
}

export function isModelInstalled(modelName: string): boolean {
  try {
    const modelPath = getModelPath(modelName);
    return fs.existsSync(modelPath);
  } catch {
    return false;
  }
}

export function getStatus(modelName: string): {
  binaryInstalled: boolean;
  modelInstalled: boolean;
  platform: string;
  arch: string;
  supported: boolean;
} {
  const key = `${process.platform}-${process.arch}`;
  return {
    binaryInstalled: isBinaryInstalled(),
    modelInstalled: isModelInstalled(modelName),
    platform: process.platform,
    arch: process.arch,
    supported: key in BINARY_URLS,
  };
}

export async function downloadBinary(
  onProgress?: ProgressCallback,
): Promise<void> {
  const key = `${process.platform}-${process.arch}`;
  const url = BINARY_URLS[key];

  if (!url) {
    throw new Error(
      `No pre-built whisper.cpp binary for ${process.platform}/${process.arch}. ` +
        `Install whisper-cli manually and ensure it is in your PATH.`,
    );
  }

  const binDir = getBinDir();
  const zipName = path.basename(url);
  const zipPath = path.join(app.getPath("temp"), zipName);

  onProgress?.({
    status: "downloading",
    percent: 0,
    detail: "Downloading whisper binary…",
  });

  await downloadFile(url, zipPath, (downloaded, total) => {
    onProgress?.({
      status: "downloading",
      percent: Math.round((downloaded / total) * 50),
      detail: "Downloading whisper binary…",
    });
  });

  onProgress?.({
    status: "extracting",
    percent: 50,
    detail: "Extracting binary…",
  });

  await extractZip(zipPath, binDir);

  // Find the executable inside the extracted directory (may be nested)
  const exeName = process.platform === "win32" ? "whisper-cli" : "whisper-cli";
  const found = findExecutable(binDir, exeName);

  if (found) {
    const targetPath = getWhisperBinaryPath();
    if (found !== targetPath) {
      // Move binary and DLLs to top-level binDir
      const foundDir = path.dirname(found);
      if (foundDir !== binDir) {
        const files = fs.readdirSync(foundDir);
        for (const f of files) {
          const src = path.join(foundDir, f);
          const dest = path.join(binDir, f);
          if (src !== dest) {
            if (fs.existsSync(dest)) fs.unlinkSync(dest);
            fs.renameSync(src, dest);
          }
        }
      }
    }
  }

  // Make executable on Unix
  if (process.platform !== "win32") {
    const binPath = getWhisperBinaryPath();
    if (fs.existsSync(binPath)) {
      fs.chmodSync(binPath, 0o755);
    }
  }

  // Cleanup ZIP
  try {
    fs.unlinkSync(zipPath);
  } catch {}

  if (!isBinaryInstalled()) {
    throw new Error(
      "Binary extraction succeeded but whisper-cli not found. Check the release archive structure.",
    );
  }

  onProgress?.({ status: "done", percent: 100, detail: "Binary ready" });
}

export async function downloadModel(
  modelName: string,
  onProgress?: ProgressCallback,
): Promise<void> {
  const info = AVAILABLE_MODELS[modelName];
  if (!info) throw new Error(`Unknown model: ${modelName}`);

  // Ensure binary is installed first
  if (!isBinaryInstalled()) {
    await downloadBinary(onProgress);
  }

  const modelPath = getModelPath(modelName);
  if (fs.existsSync(modelPath)) {
    onProgress?.({ status: "done", percent: 100, detail: "Model already downloaded" });
    return;
  }

  const url = `${MODEL_BASE_URL}/${info.file}?download=true`;

  onProgress?.({
    status: "downloading",
    percent: 0,
    detail: `Downloading ${info.file} (~${info.sizeMB} MB)…`,
  });

  await downloadFile(url, modelPath, (downloaded, total) => {
    const pct = total > 0 ? Math.round((downloaded / total) * 100) : 0;
    onProgress?.({
      status: "downloading",
      percent: pct,
      detail: `Downloading ${info.file} (${Math.round(downloaded / 1024 / 1024)}/${info.sizeMB} MB)…`,
    });
  });

  onProgress?.({ status: "done", percent: 100, detail: "Model ready" });
}

// ─── Session-based transcription ────────────────────────────────────────

export function startSession(
  sessionId: string,
  modelName: string,
  language = "auto",
  translate = false,
): { success: boolean; error?: string } {
  if (sessions.has(sessionId)) {
    return { success: false, error: "Session already exists" };
  }

  if (!isBinaryInstalled()) {
    return { success: false, error: "Whisper binary not installed" };
  }

  if (!isModelInstalled(modelName)) {
    return { success: false, error: `Model ${modelName} not installed` };
  }

  const sessionDir = path.join(getSessionsDir(), sessionId);
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  sessions.set(sessionId, {
    model: modelName,
    language,
    translate,
    active: true,
    processing: false,
    queue: [],
    sessionDir,
    chunkIndex: 0,
  });

  return { success: true };
}

export async function pushChunk(
  sessionId: string,
  audioData: Buffer,
): Promise<TranscriptResult | null> {
  const session = sessions.get(sessionId);
  if (!session || !session.active) return null;

  session.queue.push(audioData);

  if (session.processing) return null;

  return processNextChunk(sessionId);
}

async function processNextChunk(
  sessionId: string,
): Promise<TranscriptResult | null> {
  const session = sessions.get(sessionId);
  if (!session || session.queue.length === 0) return null;

  session.processing = true;

  // Merge all queued chunks
  const chunks = session.queue.splice(0);
  const merged = Buffer.concat(chunks);
  const chunkIdx = session.chunkIndex++;

  const webmPath = path.join(session.sessionDir, `chunk_${chunkIdx}.webm`);
  const wavPath = path.join(session.sessionDir, `chunk_${chunkIdx}.wav`);

  try {
    fs.writeFileSync(webmPath, merged);

    await convertToWav(webmPath, wavPath);
    const raw = await runWhisperCli(session.model, wavPath, session.language, session.translate);

    // Cleanup temp files
    try {
      fs.unlinkSync(webmPath);
    } catch {}
    try {
      fs.unlinkSync(wavPath);
    } catch {}

    session.processing = false;

    if (session.active && session.queue.length > 0) {
      processNextChunk(sessionId).catch(console.error);
    }

    // Strip whisper artifacts like [BLANK_AUDIO], then collapse whitespace
    const cleaned = raw
      .replace(WHISPER_ARTIFACTS_REGEX, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!cleaned) return null;
    return { text: cleaned };
  } catch (err: any) {
    // Cleanup on error
    try {
      fs.unlinkSync(webmPath);
    } catch {}
    try {
      fs.unlinkSync(wavPath);
    } catch {}

    session.processing = false;
    return { text: "", error: err?.message || "Transcription failed" };
  }
}

export function stopSession(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.active = false;
  session.queue = [];
  sessions.delete(sessionId);

  // Cleanup session directory
  try {
    if (fs.existsSync(session.sessionDir)) {
      const files = fs.readdirSync(session.sessionDir);
      for (const f of files) {
        try {
          fs.unlinkSync(path.join(session.sessionDir, f));
        } catch {}
      }
      fs.rmdirSync(session.sessionDir);
    }
  } catch {}
}

// ─── Audio conversion ───────────────────────────────────────────────────

function convertToWav(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpegPath = getFfmpegPath();

    if (!fs.existsSync(ffmpegPath)) {
      reject(
        new Error(
          `ffmpeg not found at ${ffmpegPath}. Ensure ffmpeg-static is bundled.`,
        ),
      );
      return;
    }

    const proc = spawn(ffmpegPath, [
      "-y",
      "-i",
      inputPath,
      "-ar",
      "16000",
      "-ac",
      "1",
      "-c:a",
      "pcm_s16le",
      outputPath,
    ]);

    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg conversion failed (code ${code}): ${stderr.slice(-500)}`));
    });

    proc.on("error", reject);
  });
}

// ─── Whisper CLI execution ──────────────────────────────────────────────

function runWhisperCli(
  modelName: string,
  wavPath: string,
  language = "auto",
  translate = false,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const binPath = getWhisperBinaryPath();
    const modelPath = getModelPath(modelName);

    if (!fs.existsSync(binPath)) {
      reject(new Error("whisper-cli binary not found"));
      return;
    }

    if (!fs.existsSync(modelPath)) {
      reject(new Error(`Model file not found: ${modelPath}`));
      return;
    }

    const args = ["-m", modelPath, "-f", wavPath, "-nt", "--no-prints"];
    if (language && language !== "auto") {
      args.push("-l", language);
    }
    if (translate) {
      args.push("--translate");
    }

    const proc = spawn(binPath, args, {
      cwd: path.dirname(binPath),
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));

    const timeout = setTimeout(() => {
      proc.kill("SIGKILL");
      reject(new Error("whisper-cli timed out (30s)"));
    }, 30000);

    proc.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(
          new Error(
            `whisper-cli exited with code ${code}: ${stderr.slice(-500)}`,
          ),
        );
      }
    });

    proc.on("error", reject);
  });
}
