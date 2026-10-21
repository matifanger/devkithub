// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { CaptureLibrary } from "../../main/capture/library";

describe("Capture Library persistence", () => {
  let root: string, library: CaptureLibrary;
  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), "devkithub-capture-test-"));
    library = new CaptureLibrary(root);
    await library.initialize();
  });
  it('reserves the recorder before disk IO to reject simultaneous starts', async () => {
    const results = await Promise.allSettled([library.begin('One', 'video/webm'), library.begin('Two', 'video/webm')]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(r => r.status === 'rejected')).toHaveLength(1);
  });
  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });
  it("recovers interrupted recordings on restart", async () => {
    const id = await library.begin("Interrupted", "video/webm");
    await library.append(
      id,
      new Uint8Array([26, 69, 223, 163, 1, 2, 3]).buffer,
    );
    const restarted = new CaptureLibrary(root);
    await restarted.initialize();
    const items = await restarted.list();
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("Recovered recording");
    expect(items[0].size).toBe(7);
  });
  it("serializes concurrent metadata writes without losing the file", async () => {
    const a = await library.add(new Uint8Array([1]), "png", "Original");
    await Promise.all([
      library.write({ ...a, name: "First" }),
      library.write({ ...a, name: "Last" }),
    ]);
    expect((await library.get(a.id)).name).toBe("Last");
  });
  it("persists captures across service restarts and isolates paths", async () => {
    const a = await library.add(
      new Uint8Array([1, 2, 3]),
      "png",
      "../../<Screenshot>",
    );
    const restarted = new CaptureLibrary(root);
    expect((await restarted.list())[0].id).toBe(a.id);
    expect((await restarted.get(a.id)).name).toBe("....Screenshot");
    expect(() => restarted.file("../../settings", "json")).toThrow();
    expect(() => restarted.file(a.id, "../../x")).toThrow();
    expect(await fs.readFile(library.file(a.id, "png"))).toEqual(
      Buffer.from([1, 2, 3]),
    );
  });
  it("writes chunks in order and does not list unfinished recordings", async () => {
    const id = await library.begin("Demo", "video/webm;codecs=vp9");
    await library.append(id, new Uint8Array([1, 2]).buffer);
    await library.append(id, new Uint8Array([3, 4]).buffer);
    expect(await library.list()).toHaveLength(0);
    const a = await library.finish(id, {
      duration: 2.5,
      width: 1280,
      height: 720,
    });
    expect(a.size).toBe(4);
    expect(a.duration).toBe(2.5);
    expect(await fs.readFile(library.file(id, "webm"))).toEqual(
      Buffer.from([1, 2, 3, 4]),
    );
    expect((await library.list())[0].url).toBe(
      `capture-media://library/${id}.webm`,
    );
  });
  it("rejects concurrent, empty and invalid recordings and can abort", async () => {
    const id = await library.begin("One", "video/webm");
    await expect(library.begin("Two", "video/webm")).rejects.toThrow();
    await expect(
      library.finish(id, { duration: 0, width: 0, height: 0 }),
    ).rejects.toThrow();
    await library.abort(id);
    expect(await fs.readdir(root)).toHaveLength(0);
    await expect(library.begin("New", "video/webm")).resolves.toBeTypeOf(
      "string",
    );
  });
  it("removes only the chosen capture and survives corrupt metadata", async () => {
    const a = await library.add(new Uint8Array([1]), "png", "A"),
      b = await library.add(new Uint8Array([2]), "png", "B");
    await fs.writeFile(path.join(root, "bad.json"), "{");
    await library.remove(a.id);
    expect((await library.list()).map((v) => v.id)).toEqual([b.id]);
    await expect(fs.access(library.file(a.id, "png"))).rejects.toThrow();
  });
});
