import { randomUUID } from "crypto";
import * as fs from "fs/promises";
import * as path from "path";
import { CaptureAsset } from "../../types/capture";
import { cleanName, MEDIA_TYPES, validId } from "./media-policy";

type StoredAsset = Omit<CaptureAsset, "url">;
export class CaptureLibrary {
  private writes = new Map<string, Promise<CaptureAsset>>();
  private recording = new Map<
    string,
    { name: string; mime: string; size: number }
  >();
  constructor(readonly root: string) {}
  async initialize() {
    await fs.mkdir(this.root, { recursive: true });
    for (const file of await fs.readdir(this.root)) {
      if (!/^[a-f0-9-]{36}\.partial$/.test(file)) continue;
      const id = file.slice(0, -8),
        stat = await fs.stat(this.file(id, "partial"));
      if (!stat.size) {
        await fs.unlink(this.file(id, "partial"));
        continue;
      }
      await fs.rename(this.file(id, "partial"), this.file(id, "webm"));
      await this.write({
        id,
        name: "Recovered recording",
        extension: "webm",
        mime: "video/webm",
        kind: "video",
        size: stat.size,
        createdAt: stat.mtimeMs,
      });
    }
  }
  file(id: string, ext: string) {
    validId(id);
    if (
      !MEDIA_TYPES[ext] &&
      ext !== "partial" &&
      ext !== "json" &&
      ext !== "tmp"
    )
      throw new Error("Invalid media extension");
    return path.join(this.root, `${id}.${ext}`);
  }
  async write(asset: StoredAsset): Promise<CaptureAsset> {
    const write = (this.writes.get(asset.id) || Promise.resolve())
      .catch(() => {})
      .then(async () => {
        const tmp = this.file(asset.id, "tmp");
        await fs.writeFile(tmp, JSON.stringify(asset), "utf8");
        await fs.rename(tmp, this.file(asset.id, "json"));
        return this.present(asset);
      });
    this.writes.set(asset.id, write);
    try {
      return await write;
    } finally {
      if (this.writes.get(asset.id) === write) this.writes.delete(asset.id);
    }
  }
  private present(asset: StoredAsset): CaptureAsset {
    return {
      ...asset,
      url: `capture-media://library/${asset.id}.${asset.extension}`,
    };
  }
  async get(id: string): Promise<CaptureAsset> {
    const asset: StoredAsset = JSON.parse(
      await fs.readFile(this.file(id, "json"), "utf8"),
    );
    if (asset.id !== id || !MEDIA_TYPES[asset.extension])
      throw new Error("Invalid capture metadata");
    return this.present(asset);
  }
  async list(): Promise<CaptureAsset[]> {
    const files = (await fs.readdir(this.root)).filter((f) =>
      f.endsWith(".json"),
    );
    const results = await Promise.all(
      files.map(async (f) => {
        try {
          const a = await this.get(f.slice(0, -5));
          await fs.access(this.file(a.id, a.extension));
          return a;
        } catch {
          return null;
        }
      }),
    );
    return results
      .filter((a): a is CaptureAsset => !!a)
      .sort((a, b) => b.createdAt - a.createdAt);
  }
  async add(
    data: Uint8Array,
    extension: string,
    name: string,
    details: Partial<StoredAsset> = {},
  ): Promise<CaptureAsset> {
    if (!MEDIA_TYPES[extension] || !data.byteLength)
      throw new Error("Unsupported or empty capture");
    const id = randomUUID();
    await fs.writeFile(this.file(id, extension), data);
    try {
      return await this.write({
        ...details,
        id,
        name: cleanName(name),
        extension,
        mime: MEDIA_TYPES[extension],
        kind: MEDIA_TYPES[extension].startsWith("video") ? "video" : "image",
        size: data.byteLength,
        createdAt: Date.now(),
      });
    } catch (error) {
      await fs.unlink(this.file(id, extension)).catch(() => {});
      throw error;
    }
  }
  async begin(name: string, mime: string) {
    if (!mime.startsWith("video/webm") || this.recording.size >= 1)
      throw new Error(
        "A recording is already active or its format is unsupported",
      );
    const id = randomUUID();
    this.recording.set(id, {
      name: cleanName(name),
      mime: "video/webm",
      size: 0,
    });
    try { await fs.writeFile(this.file(id, "partial"), new Uint8Array()); }
    catch (error) { this.recording.delete(id); throw error; }
    return id;
  }
  async append(id: string, data: ArrayBuffer) {
    const recording = this.recording.get(id);
    if (!recording || !data || data.byteLength > 32 * 1024 * 1024)
      throw new Error("Invalid recording chunk");
    await fs.appendFile(this.file(id, "partial"), Buffer.from(data));
    recording.size += data.byteLength;
  }
  async finish(
    id: string,
    details: { duration: number; width: number; height: number },
  ) {
    const recording = this.recording.get(id);
    if (!recording?.size) throw new Error("Recording is empty");
    if (
      ![details.duration, details.width, details.height].every(
        (n) => Number.isFinite(n) && n > 0,
      )
    )
      throw new Error("Invalid recording metadata");
    await fs.rename(this.file(id, "partial"), this.file(id, "webm"));
    const asset = await this.write({
      id,
      name: recording.name,
      mime: recording.mime,
      extension: "webm",
      kind: "video",
      createdAt: Date.now(),
      size: recording.size,
      ...details,
    });
    this.recording.delete(id);
    return asset;
  }
  async abort(id: string) {
    if (!this.recording.has(id)) return;
    await fs.unlink(this.file(id, "partial")).catch(() => {});
    this.recording.delete(id);
  }
  detach(id: string) {
    this.recording.delete(id);
  }
  async remove(id: string) {
    if (this.recording.has(id))
      throw new Error("Stop the recording before deleting it");
    const asset = await this.get(id);
    await fs.unlink(this.file(id, asset.extension));
    await fs.unlink(this.file(id, "json"));
  }
}
