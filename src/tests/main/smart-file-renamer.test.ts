// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { RenamerService } from "../../main/renamer/service";
import { DEFAULT_RENAMER_SETTINGS } from "../../types/smart-file-renamer";
import {
  formatName,
  localEndpoint,
  safeName,
  validateFolder,
  validateName,
} from "../../main/renamer/naming";

let root: string;
let service: RenamerService;
let storage: string;
beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "devkithub-renamer-test-"));
  storage = path.join(root, "state", "renamer.json");
  service = new RenamerService(storage);
  await service.initialize(false);
  await service.configure({
    ...structuredClone(DEFAULT_RENAMER_SETTINGS),
    activePreset: "archive",
  });
});
afterEach(async () => {
  service?.dispose();
  if (root) await fs.rm(root, { recursive: true, force: true });
});
async function add(
  name = "scan.txt",
  content = "Invoice for Acme. Total EUR 42.00.",
) {
  const file = path.join(root, name);
  await fs.writeFile(file, content);
  await service.add([file]);
  return service.snapshot().items.find((item) => item.path === file);
}

describe("Safe filenames", () => {
  it("cleans reserved characters and Windows device names", () => {
    expect(safeName("CON")).toBe("_CON");
    expect(safeName("NUL.txt")).toBe("_NUL.txt");
    expect(safeName("client: report / 2026. ")).toBe("client- report - 2026");
    expect(Buffer.byteLength(safeName("😊".repeat(200)))).toBeLessThanOrEqual(
      180,
    );
  });
  it("rejects path traversal, absolute paths, links disguised as names and changed extensions", () => {
    for (const folder of [
      "../secret",
      "a/../../secret",
      "/tmp",
      "C:\\Windows",
      "a//b",
      "CON",
    ])
      expect(() => validateFolder(folder)).toThrow();
    for (const name of [
      "../other.txt",
      "other.exe",
      "NUL.txt",
      "trailing.txt.",
    ])
      expect(() => validateName(name, "scan.txt")).toThrow();
    expect(validateFolder("Finance/Invoices")).toBe(
      path.join("Finance", "Invoices"),
    );
  });
  it("preserves extensions and flags unknown fields rather than inventing values", () => {
    const preset = {
      ...DEFAULT_RENAMER_SETTINGS.presets[1],
      letterCase: "lower" as const,
    };
    expect(
      formatName("scan.PDF", preset, {
        date: "2026-09-19",
        vendor: "Acme Ltd",
      }),
    ).toEqual({ name: "2026-09-19_acme_ltd_unknown.PDF", missing: ["amount"] });
  });
  it("accepts only explicit loopback AI servers", () => {
    expect(localEndpoint("http://127.0.0.1:1234/v1/")).toBe(
      "http://127.0.0.1:1234/v1",
    );
    for (const url of [
      "https://remote.example/v1",
      "http://192.168.1.2",
      "http://localhost.evil.test",
      "http://user:pass@localhost",
      "file:///etc/passwd",
    ])
      expect(() => localEndpoint(url)).toThrow();
  });
});

describe("Real filesystem workflow", () => {
  it("analyzes, previews, organizes, persists and undoes without altering content or mtime", async () => {
    const item = await add();
    const before = await fs.stat(item.path);
    await service.analyze([item.id]);
    expect(service.snapshot().items[0].status).toBe("ready");
    expect(service.snapshot().items[0].content).toContain("Acme");
    const state = await service.apply([
      { id: item.id, name: "Acme.txt", folder: "Finance/Invoices" },
    ]);
    const target = path.join(root, "Finance", "Invoices", "Acme.txt");
    expect(await fs.readFile(target, "utf8")).toContain("EUR 42.00");
    expect((await fs.stat(target)).mtimeMs).toBe(before.mtimeMs);
    await expect(fs.stat(item.path)).rejects.toThrow();
    const reopened = new RenamerService(storage);
    await reopened.initialize(false);
    expect(reopened.snapshot().items[0].path).toBe(target);
    await reopened.undo(state.history[0].id);
    expect(await fs.readFile(item.path, "utf8")).toContain("Acme");
    expect(
      reopened.snapshot().history.filter((entry) => entry.status === "undone"),
    ).toHaveLength(2);
    await expect(fs.stat(target)).rejects.toThrow();
    reopened.dispose();
  });
  it("refuses an existing destination and retains the original", async () => {
    const item = await add();
    await fs.writeFile(path.join(root, "existing.txt"), "Do not overwrite");
    const state = await service.apply([
      { id: item.id, name: "existing.txt", folder: "" },
    ]);
    expect(state.items[0].status).toBe("error");
    expect(state.items[0].message).toContain("already exists");
    expect(await fs.readFile(path.join(root, "existing.txt"), "utf8")).toBe(
      "Do not overwrite",
    );
    expect(await fs.readFile(item.path, "utf8")).toContain("Acme");
  });
  it("handles batch collisions per file without overwriting", async () => {
    const first = await add("one.txt");
    const second = await add("two.txt", "Different");
    const state = await service.apply(
      [first, second].map((item) => ({
        id: item.id,
        name: "same.txt",
        folder: "",
      })),
    );
    expect(state.items.map((item) => item.status)).toEqual(["done", "error"]);
    expect(await fs.readFile(second.path, "utf8")).toBe("Different");
  });
  it("rejects changed source files and changed undo contents", async () => {
    const item = await add();
    await fs.appendFile(item.path, "changed");
    expect(
      (await service.apply([{ id: item.id, name: "renamed.txt", folder: "" }]))
        .items[0].status,
    ).toBe("error");
    await service.add([item.path]);
    const applied = await service.apply([
      { id: item.id, name: "renamed.txt", folder: "" },
    ]);
    await fs.appendFile(applied.items[0].path, " changed again");
    await expect(service.undo(applied.history[0].id)).rejects.toThrow(
      "changed",
    );
  });
  it("rejects occupied undo paths", async () => {
    const item = await add();
    const applied = await service.apply([
      { id: item.id, name: "renamed.txt", folder: "" },
    ]);
    await fs.writeFile(item.path, "New original");
    await expect(service.undo(applied.history[0].id)).rejects.toThrow(
      "occupied",
    );
    expect(await fs.readFile(item.path, "utf8")).toBe("New original");
  });
  it("prevents traversal in destinations", async () => {
    const item = await add();
    const state = await service.apply([
      { id: item.id, name: "renamed.txt", folder: "../outside" },
    ]);
    expect(state.items[0].status).toBe("error");
    expect(await fs.readFile(item.path, "utf8")).toContain("Acme");
  });
  it("rejects destination directory junctions", async () => {
    const item = await add();
    const outside = path.join(root, "outside");
    await fs.mkdir(outside);
    await fs.symlink(outside, path.join(root, "linked"), "junction");
    const state = await service.apply([
      { id: item.id, name: "renamed.txt", folder: "linked" },
    ]);
    expect(state.items[0].message).toContain("symbolic links");
    expect(await fs.readdir(outside)).toEqual([]);
  });
  it("groups only byte-identical files and keeps duplicates untouched", async () => {
    await add("one.txt", "same");
    await add("two.txt", "same");
    await add("three.txt", "diff");
    const groups = await service.duplicates();
    expect(groups).toHaveLength(1);
    expect(groups[0].paths).toHaveLength(2);
    expect(groups[0].size).toBe(4);
    expect(await fs.readFile(path.join(root, "two.txt"), "utf8")).toBe("same");
  });
  it("clears extracted content while retaining files and history", async () => {
    const item = await add();
    await service.apply([{ id: item.id, name: "renamed.txt", folder: "" }]);
    await service.clear();
    expect(service.snapshot().items).toEqual([]);
    expect(service.snapshot().history).toHaveLength(1);
    expect(await fs.readFile(path.join(root, "renamed.txt"), "utf8")).toContain(
      "Acme",
    );
  });
  it("flags missing AI fields for review in metadata mode", async () => {
    await service.configure(structuredClone(DEFAULT_RENAMER_SETTINGS));
    const item = await add();
    await service.analyze([item.id]);
    expect(service.snapshot().items[0].status).toBe("review");
    expect(service.snapshot().items[0].message).toContain("title");
  });
  it("applies the first matching organization rule", async () => {
    const settings = service.snapshot().settings;
    settings.rules = [
      {
        id: "first",
        enabled: true,
        field: "content",
        contains: "ACME",
        folder: "Clients",
      },
      {
        id: "second",
        enabled: true,
        field: "extension",
        contains: "txt",
        folder: "Text",
      },
    ];
    await service.configure(settings);
    const item = await add();
    await service.analyze([item.id]);
    expect(service.snapshot().items[0].folder).toBe("Clients");
  });
  it("watches stable new files, preserves the baseline and avoids repeated renames", async () => {
    const folder = path.join(root, "inbox");
    await fs.mkdir(folder);
    await fs.writeFile(path.join(folder, "existing.txt"), "existing");
    await service.watch("add", { path: folder });
    const watch = service.snapshot().watches[0];
    await service.watch("update", { id: watch.id, automatic: true });
    await fs.writeFile(path.join(folder, "new.txt"), "incoming");
    await service.tick();
    expect(service.snapshot().items).toHaveLength(0);
    await service.tick();
    expect(service.snapshot().items).toHaveLength(1);
    expect(service.snapshot().items[0].status).toBe("done");
    await service.tick();
    await service.tick();
    expect(service.snapshot().history).toHaveLength(1);
    expect(await fs.readFile(path.join(folder, "existing.txt"), "utf8")).toBe(
      "existing",
    );
  });
  it("keeps incomplete watched suggestions for review even in automatic mode", async () => {
    await service.configure(structuredClone(DEFAULT_RENAMER_SETTINGS));
    const folder = path.join(root, "inbox");
    await fs.mkdir(folder);
    await service.watch("add", { path: folder });
    await service.watch("update", {
      id: service.snapshot().watches[0].id,
      automatic: true,
    });
    await fs.writeFile(path.join(folder, "new.txt"), "hello");
    await service.tick();
    await service.tick();
    expect(service.snapshot().items[0].status).toBe("review");
    expect(service.snapshot().history).toHaveLength(0);
  });
  it("recovers a durable pending rename after restart", async () => {
    const item = await add();
    const applied = await service.apply([
      { id: item.id, name: "renamed.txt", folder: "" },
    ]);
    const saved = JSON.parse(await fs.readFile(storage, "utf8"));
    saved.history[0].status = "pending";
    saved.items[0] = item;
    await fs.writeFile(storage, JSON.stringify(saved));
    const restarted = new RenamerService(storage);
    await restarted.initialize(false);
    expect(restarted.snapshot().history[0].status).toBe("applied");
    expect(restarted.snapshot().items[0].path).toBe(applied.items[0].path);
    restarted.dispose();
  });
  it("never discards corrupt recovery history", async () => {
    await fs.writeFile(storage, "not JSON");
    const restarted = new RenamerService(storage);
    await expect(restarted.initialize(false)).rejects.toThrow("Preserve");
    expect(await fs.readFile(storage, "utf8")).toBe("not JSON");
  });
  it("reconciles an interrupted undo with its original history record", async () => {
    const item = await add();
    const applied = await service.apply([
      { id: item.id, name: "renamed.txt", folder: "" },
    ]);
    await service.undo(applied.history[0].id);
    const saved = JSON.parse(await fs.readFile(storage, "utf8"));
    saved.history[0].status = "pending";
    saved.history[1].status = "applied";
    saved.items[0] = applied.items[0];
    await fs.writeFile(storage, JSON.stringify(saved));
    const restarted = new RenamerService(storage);
    await restarted.initialize(false);
    expect(restarted.snapshot().history.map((entry) => entry.status)).toEqual([
      "undone",
      "undone",
    ]);
    expect(restarted.snapshot().items[0].path).toBe(item.path);
    expect(restarted.snapshot().items[0].status).toBe("new");
    restarted.dispose();
  });
  it("cancels a batch between files and leaves remaining files untouched", async () => {
    const first = await add("one.txt");
    const second = await add("two.txt");
    const cancellable = new RenamerService(storage, (state) => {
      if (state.progress.startsWith("Analyzing 1/")) cancellable.cancel();
    });
    await cancellable.initialize(false);
    await cancellable.analyze([first.id, second.id]);
    expect(cancellable.snapshot().items[1].status).toBe("new");
    expect(cancellable.snapshot().busy).toBe(false);
    expect(await fs.readFile(second.path, "utf8")).toContain("Acme");
    cancellable.dispose();
  });
});
