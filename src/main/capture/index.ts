import {
  app,
  BrowserWindow,
  clipboard,
  desktopCapturer,
  dialog,
  globalShortcut,
  ipcMain,
  nativeImage,
  protocol,
} from "electron";
import * as fs from "fs/promises";
import * as path from "path";
import { spawn, ChildProcess } from "child_process";
import { randomUUID } from "crypto";
import * as keytar from "keytar";
import axios from "axios";
import { CaptureLibrary } from "./library";
import {
  cleanName,
  MEDIA_TYPES,
  validateExport,
  videoArguments,
} from "./media-policy";
import type { CaptureApi, VideoExportOptions } from "../../types/capture";

export async function registerCaptureStudio(
  getWindow: () => BrowserWindow | null,
) {
  const library = new CaptureLibrary(
    path.join(app.getPath("userData"), "captures"),
  );
  await library.initialize();
  let exportProcess: ChildProcess | null = null;
  let exportOwner: number | null = null;
  let recordingOwner: number | null = null;
  let recordingId: string | null = null;
  const observedRenderers = new WeakSet<Electron.WebContents>();
  const cloudFile = path.join(library.root, "cloud-settings");
  const ffmpegPath = () =>
    path.join(
      app.isPackaged
        ? process.resourcesPath
        : path.join(app.getAppPath(), "node_modules"),
      "ffmpeg-static",
      process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg",
    );
  const readAsset = async (id: string) => {
    const asset = await library.get(id);
    if (asset.kind !== "video" || asset.duration) return asset;
    // Raw MediaRecorder WebM can lack a duration header. Scan packet timestamps
    // without decoding so recovered/imported recordings are still editable.
    let duration = 0,
      stderr = "";
    await new Promise<void>((resolve, reject) => {
      const probe = spawn(
        ffmpegPath(),
        [
          "-hide_banner",
          "-protocol_whitelist",
          "file,pipe",
          "-i",
          library.file(id, asset.extension),
          "-map",
          "0:v:0",
          "-c",
          "copy",
          "-f",
          "null",
          "-",
          "-progress",
          "pipe:1",
          "-nostats",
        ],
        { windowsHide: true },
      );
      let buffer = "";
      const timeout = setTimeout(() => {
        probe.kill();
        reject(new Error("Media inspection timed out"));
      }, 60000);
      probe.stdout.on("data", (data) => {
        buffer += data.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines)
          if (line.startsWith("out_time_us=")) {
            const value = Number(line.slice(12)) / 1000000;
            if (Number.isFinite(value)) duration = Math.max(duration, value);
          }
      });
      probe.stderr.on("data", (data) => {
        stderr = (stderr + data.toString()).slice(-8000);
      });
      probe.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      probe.on("close", (code) => {
        clearTimeout(timeout);
        code === 0 || duration > 0
          ? resolve()
          : reject(new Error("This video could not be inspected"));
      });
    });
    const dimensions = /Video:.*?\b(\d{2,5})x(\d{2,5})\b/.exec(stderr);
    if (duration > 0)
      return library.write({
        ...asset,
        duration,
        ...(dimensions
          ? { width: Number(dimensions[1]), height: Number(dimensions[2]) }
          : {}),
      });
    return asset;
  };
  const readCloud = async () => {
    try {
      return JSON.parse(await fs.readFile(cloudFile, "utf8")) as {
        url: string;
      };
    } catch {
      return { url: "" };
    }
  };
  const secret = () =>
    keytar.getPassword("DevKitHub Capture Cloud", "upload-token");

  protocol.registerFileProtocol("capture-media", (request, callback) => {
    try {
      const url = new URL(request.url);
      const match = /^\/([a-f0-9-]{36})\.([a-z0-9]+)$/.exec(url.pathname);
      if (url.hostname !== "library" || !match || !MEDIA_TYPES[match[2]])
        throw new Error("Invalid media path");
      callback({
        path: library.file(match[1], match[2]),
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    } catch {
      callback({ error: -6 });
    }
  });

  const handle = <K extends keyof CaptureApi>(
    name: K,
    fn: (
      event: Electron.IpcMainInvokeEvent,
      ...args: Parameters<CaptureApi[K]>
    ) => unknown,
  ) => {
    ipcMain.handle(`capture:${name}`, (event, ...args) => {
      // Only the application's main renderer may read or mutate the capture library.
      if (
        event.sender !== getWindow()?.webContents ||
        event.senderFrame !== event.sender.mainFrame
      )
        throw new Error("Untrusted capture request");
      return fn(event, ...(args as Parameters<CaptureApi[K]>));
    });
  };
  handle("platform", () => process.platform);
  handle("sources", async () =>
    (
      await desktopCapturer.getSources({
        types: ["screen", "window"],
        thumbnailSize: { width: 320, height: 200 },
        fetchWindowIcons: false,
      })
    ).map((s) => ({
      id: s.id,
      name: s.name,
      thumbnail: s.thumbnail.toDataURL(),
      kind: s.id.startsWith("screen:") ? "screen" : "window",
    })),
  );
  handle("list", () => library.list());
  handle("get", (_, id) => readAsset(id));
  handle("saveImage", async (_, data: ArrayBuffer, name: string) => {
    if (!data?.byteLength || data.byteLength > 80 * 1024 * 1024)
      throw new Error("Images must be smaller than 80 MB");
    const img = nativeImage.createFromBuffer(Buffer.from(data));
    if (img.isEmpty()) throw new Error("This image could not be decoded");
    const { width, height } = img.getSize();
    return library.add(img.toPNG(), "png", name, {
      width,
      height,
      thumbnail: img.resize({ width: 320 }).toDataURL(),
    });
  });
  handle("beginRecording", async (event, name, mime) => {
    const id = await library.begin(name, mime);
    recordingOwner = event.sender.id;
    recordingId = id;
    event.sender.setBackgroundThrottling(false);
    if (!observedRenderers.has(event.sender)) {
      observedRenderers.add(event.sender);
      const rendererGone = () => {
        if (recordingOwner === event.sender.id && recordingId) {
          library.detach(recordingId);
          recordingId = null;
          recordingOwner = null;
        }
        if (exportOwner === event.sender.id) exportProcess?.kill();
      };
      event.sender.on('render-process-gone', rendererGone);
      event.sender.once('destroyed', rendererGone);
    }
    return id;
  });
  handle("appendRecording", (event, id, data) => {
    if (event.sender.id !== recordingOwner || id !== recordingId)
      throw new Error("Recording owner mismatch");
    return library.append(id, data);
  });
  handle("finishRecording", async (event, id, details) => {
    if (event.sender.id !== recordingOwner || id !== recordingId)
      throw new Error("Recording owner mismatch");
    try {
      return await library.finish(id, details);
    } finally {
      library.detach(id);
      recordingOwner = null;
      recordingId = null;
      if (!event.sender.isDestroyed()) event.sender.setBackgroundThrottling(true);
    }
  });
  handle("abortRecording", async (event, id) => {
    if (event.sender.id !== recordingOwner || id !== recordingId) return;
    await library.abort(id);
    recordingId = null;
    recordingOwner = null;
    if (!event.sender.isDestroyed()) event.sender.setBackgroundThrottling(true);
  });
  handle("importMedia", async (_, kind) => {
    const result = await dialog.showOpenDialog(getWindow()!, {
      properties: ["openFile"],
      filters: [
        {
          name: "Media",
          extensions:
            kind === "image"
              ? ["png", "jpg", "jpeg", "webp"]
              : ["mp4", "webm", "mov"],
        },
      ],
    });
    if (result.canceled) return null;
    const input = result.filePaths[0],
      ext = path.extname(input).slice(1).toLowerCase();
    if (!MEDIA_TYPES[ext]) throw new Error("Unsupported media type");
    if ((await fs.stat(input)).size > 2 * 1024 * 1024 * 1024)
      throw new Error("Import limit is 2 GB");
    const id = randomUUID();
    await fs.copyFile(input, library.file(id, ext));
    return library.write({
      id,
      name: cleanName(path.basename(input, path.extname(input))),
      extension: ext,
      mime: MEDIA_TYPES[ext],
      kind,
      createdAt: Date.now(),
      size: (await fs.stat(input)).size,
    });
  });
  handle("download", async (_, id) => {
    const a = await library.get(id);
    const result = await dialog.showSaveDialog(getWindow()!, {
      defaultPath: `${cleanName(a.name)}.${a.extension}`,
      filters: [{ name: a.mime, extensions: [a.extension] }],
    });
    if (result.canceled || !result.filePath) return false;
    if (
      path.resolve(result.filePath) !==
      path.resolve(library.file(id, a.extension))
    )
      await fs.copyFile(library.file(id, a.extension), result.filePath);
    return true;
  });
  handle("remove", (_, id) => library.remove(id));
  handle("rename", async (_, id, name) => {
    const a = await library.get(id);
    await library.write({ ...a, name: cleanName(name) });
  });
  handle("copyImage", async (_, id) => {
    const a = await library.get(id);
    if (a.kind !== "image") throw new Error("Choose an image");
    clipboard.writeImage(
      nativeImage.createFromPath(library.file(id, a.extension)),
    );
  });
  handle("pin", async (_, id) => {
    const a = await library.get(id);
    if (a.kind !== "image") throw new Error("Only images can be pinned");
    const win = new BrowserWindow({
      title: a.name,
      width: Math.min(a.width || 700, 1000),
      height: Math.min(a.height || 500, 800),
      alwaysOnTop: true,
      autoHideMenuBar: true,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    await win.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(`<html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src capture-media:; style-src 'unsafe-inline'"><style>body{margin:0;background:#111;display:grid;place-items:center;height:100vh}img{max-width:100%;max-height:100%}</style><img src="${a.url}" alt="Pinned capture"></html>`)}`,
    );
  });
  handle(
    "exportVideo",
    async (event, id: string, options: VideoExportOptions) => {
      if (exportProcess) throw new Error("An export is already running");
      const a = await library.get(id),
        o = validateExport(options);
      if (a.kind !== "video" || (a.duration && o.end > a.duration + 0.1))
        throw new Error("Invalid video or trim range");
      const binary = ffmpegPath();
      await fs.access(binary).catch(() => {
        throw new Error(
          "FFmpeg is missing. Reinstall DevKitHub to enable video export.",
        );
      });
      // Re-check after asynchronous file reads before claiming the encoder.
      if (exportProcess) throw new Error("An export is already running");
      const newId = randomUUID(),
        output = library.file(newId, o.format);
      let canceled = false;
      const proc = spawn(
        binary,
        videoArguments(library.file(id, a.extension), output, o),
        { windowsHide: true },
      );
      exportProcess = proc;
      exportOwner = event.sender.id;
      (proc as ChildProcess & { cancel?: () => void }).cancel = () => {
        canceled = true;
        proc.kill();
      };
      let stderr = "",
        progressBuffer = "";
      try {
        await new Promise<void>((resolve, reject) => {
          proc.stderr.on("data", (d) => {
            stderr = (stderr + d.toString()).slice(-3000);
          });
          proc.stdout.on("data", (d) => {
            progressBuffer += d.toString();
            const lines = progressBuffer.split("\n");
            progressBuffer = lines.pop() || "";
            for (const line of lines)
              if (line.startsWith("out_time_us=")) {
                const percent = Math.min(
                  99,
                  (Number(line.slice(12)) /
                    1000000 /
                    ((o.end - o.start) / o.speed)) *
                    100,
                );
                if (Number.isFinite(percent) && !event.sender.isDestroyed())
                  event.sender.send("capture:export-progress", percent);
              }
          });
          proc.on("error", reject);
          proc.on("close", (code) =>
            code === 0 && !canceled
              ? resolve()
              : reject(
                  new Error(
                    canceled
                      ? "Export canceled"
                      : `Video export failed: ${stderr.slice(-600)}`,
                  ),
                ),
          );
        });
        const result = await library.write({
          id: newId,
          name: `${a.name} — edited`,
          kind: o.format === "gif" ? "image" : "video",
          extension: o.format,
          mime: MEDIA_TYPES[o.format],
          createdAt: Date.now(),
          size: (await fs.stat(output)).size,
          duration: (o.end - o.start) / o.speed,
          width: o.width + (o.padding || 0) * 2,
          ...(o.height ? { height: Math.floor(o.height / 2) * 2 + (o.padding || 0) * 2 } : {}),
        });
        if (!event.sender.isDestroyed())
          event.sender.send("capture:export-progress", 100);
        return result;
      } catch (error) {
        await fs.unlink(output).catch(() => {});
        throw error;
      } finally {
        exportProcess = null;
        exportOwner = null;
      }
    },
  );
  handle("cancelExport", (event) => {
    if (exportOwner === event.sender.id)
      (exportProcess as ChildProcess & { cancel?: () => void })?.cancel?.();
  });
  handle("cloudSettings", async () => ({
    ...(await readCloud()),
    configured: !!(await secret()),
  }));
  handle("configureCloud", async (_, input: string, token: string) => {
    const url = new URL(input);
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/" ||
      (url.protocol !== "https:" &&
        !(
          url.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(url.hostname)
        ))
    )
      throw new Error(
        "Use an HTTPS server origin (or localhost for development)",
      );
    if (token && token.length < 32)
      throw new Error("Use the server upload token (at least 32 characters)");
    const previous = await readCloud();
    if (!token && previous.url !== url.origin)
      throw new Error("Enter the token for this server");
    if (token)
      await keytar.setPassword(
        "DevKitHub Capture Cloud",
        "upload-token",
        token,
      );
    await fs.writeFile(cloudFile, JSON.stringify({ url: url.origin }));
    return { url: url.origin, configured: !!(await secret()) };
  });
  handle("share", async (_, id: string, days: number, password: string) => {
    const a = await library.get(id),
      config = await readCloud(),
      token = await secret();
    if (!config.url || !token)
      throw new Error("Configure your Capture Cloud server first");
    if (
      ![1, 7, 30].includes(days) ||
      typeof password !== "string" ||
      password.length > 128
    )
      throw new Error("Invalid sharing options");
    if (a.size > 50 * 1024 * 1024)
      throw new Error(
        "Cloud uploads are limited to 50 MB. Trim or compress this recording first.",
      );
    if (a.share && a.share.expiresAt > Date.now())
      throw new Error("Revoke the existing link before creating a new one");
    const { data } = await axios.post(
      `${config.url}/api/captures`,
      await fs.readFile(library.file(id, a.extension)),
      {
        maxRedirects: 0,
        timeout: 120000,
        maxBodyLength: 50 * 1024 * 1024,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": a.mime,
          "X-Capture-Name": encodeURIComponent(a.name),
          "X-Capture-Days": String(days),
          "X-Capture-Password": encodeURIComponent(password),
        },
      },
    );
    if (!/^[a-f0-9-]{36}$/.test(data.id) || !Number.isFinite(data.expiresAt))
      throw new Error("Invalid cloud response");
    return library.write({
      ...a,
      share: {
        id: data.id,
        url: `${config.url}/capture/${data.id}`,
        expiresAt: data.expiresAt,
        server: config.url,
      },
    });
  });
  handle("revokeShare", async (_, id: string) => {
    const a = await library.get(id);
    if (!a.share) return;
    const config = await readCloud();
    if (a.share.server !== config.url)
      throw new Error(
        "Reconnect the server that owns this link before revoking it",
      );
    await axios.delete(`${a.share.server}/api/captures/${a.share.id}`, {
      maxRedirects: 0,
      timeout: 15000,
      headers: { Authorization: `Bearer ${await secret()}` },
    });
    const { share, ...rest } = a;
    await library.write(rest);
  });
  const shortcuts = [
    ["CommandOrControl+Shift+2", "capture"],
    ["CommandOrControl+Shift+R", "record"],
    ["CommandOrControl+Shift+P", "pause"],
  ] as const;
  for (const [key, action] of shortcuts) {
    const ok = globalShortcut.register(key, () => {
      const win = getWindow();
      if (!win) return;
      if (action === "capture" || (action === "record" && !recordingId)) {
        win.show();
        win.focus();
        win.webContents.send(
          "navigate-to",
          action === "capture" ? "/screenshot-studio" : "/screen-recorder",
        );
      }
      win.webContents.send("capture:shortcut", action);
    });
    if (!ok) console.warn(`Capture shortcut unavailable: ${key}`);
  }
  app.on("will-quit", () => {
    exportProcess?.kill();
    for (const [key] of shortcuts) globalShortcut.unregister(key);
  });
}
