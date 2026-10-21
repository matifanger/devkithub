// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import {
  analyzeDirectory,
  assertNoLinks,
  cleanSnapshot,
  isWithin,
  MIN_AGE_MS,
  scanTemporaryFiles,
  selectedCandidates,
} from "../../main/maintenance/files";

let fixture: string;
const progress = vi.fn();
const signal = () => new AbortController().signal;
beforeEach(async () => {
  fixture = await fs.realpath(await fs.mkdtemp(
    path.join(os.tmpdir(), "devkithub-maintenance-test-"),
  ));
  progress.mockClear();
});
afterEach(async () => {
  if (
    !path.basename(fixture).startsWith("devkithub-maintenance-test-") ||
    path.dirname(fixture) !== await fs.realpath(os.tmpdir())
  )
    throw new Error("Invalid test cleanup target");
  await fs.rm(fixture, { recursive: true, force: true });
});
async function file(relative: string, data: string, old = false) {
  const target = path.join(fixture, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, data);
  if (old) {
    const date = new Date(Date.now() - MIN_AGE_MS * 2);
    await fs.utimes(target, date, date);
  }
  return target;
}
const roots = () => [
  { id: "temp", label: "Test temp", root: path.join(fixture, "temp") },
];

describe("maintenance file operations", () => {
  it("aggregates nested folders and ranks files without modifying them", async () => {
    await file("one.txt", "abc");
    await file("nested/two.txt", "12345");
    await file("nested/deeper/three.txt", "12");
    const result = await analyzeDirectory(fixture, signal(), progress);
    expect(result.bytes).toBe(10);
    expect(result.files).toBe(3);
    expect(result.items[0]).toMatchObject({
      name: "nested",
      files: 2,
      bytes: 7,
      kind: "folder",
    });
    expect(result.largest[0].bytes).toBe(5);
    expect(await fs.readFile(path.join(fixture, "one.txt"), "utf8")).toBe(
      "abc",
    );
  });
  it("reports partial results at the entry limit", async () => {
    await file("a", "a");
    await file("b", "b");
    const result = await analyzeDirectory(fixture, signal(), progress, 1);
    expect(result.limited).toBe(true);
    expect(result.files).toBe(1);
  });
  it("returns cancelled results instead of presenting a completed scan", async () => {
    await file("a", "a");
    const abort = new AbortController();
    abort.abort();
    const result = await analyzeDirectory(fixture, abort.signal, progress);
    expect(result.cancelled).toBe(true);
    expect(result.files).toBe(0);
  });
  it("skips junctions, including links to data outside the scan root", async () => {
    await file("outside/keep.txt", "important");
    await fs.mkdir(path.join(fixture, "temp"));
    await fs.symlink(
      path.join(fixture, "outside"),
      path.join(fixture, "temp/link"),
      "junction",
    );
    const result = await analyzeDirectory(
      path.join(fixture, "temp"),
      signal(),
      progress,
    );
    expect(result.files).toBe(0);
    expect(result.skipped).toBe(1);
    await expect(
      assertNoLinks(path.join(fixture, "temp/link/keep.txt")),
    ).rejects.toThrow("Linked");
  });
  it("scans only old regular files and reports missing locations", async () => {
    const old = await file("temp/old.tmp", "old", true);
    await file("temp/new.tmp", "new");
    const snapshot = await scanTemporaryFiles(
      [
        ...roots(),
        {
          id: "missing",
          label: "Missing",
          root: path.join(fixture, "missing"),
        },
      ],
      signal(),
      progress,
    );
    expect(snapshot.candidates.map((candidate) => candidate.path)).toEqual([
      old,
    ]);
    expect(snapshot.result.groups[0]).toMatchObject({
      bytes: 3,
      files: 1,
      skipped: 1,
    });
    expect(snapshot.result.groups[1].unavailable).toBeTruthy();
  });
  it("excludes hard links from cleanup", async () => {
    const original = await file("outside.txt", "keep", true);
    await fs.mkdir(path.join(fixture, "temp"));
    await fs.link(original, path.join(fixture, "temp/hardlink"));
    const snapshot = await scanTemporaryFiles(roots(), signal(), progress);
    expect(snapshot.candidates).toHaveLength(0);
  });
  it("deletes only selected, unchanged scanned files", async () => {
    const old = await file("temp/old", "old", true);
    const keep = await file("other/keep", "keep", true);
    const snapshot = await scanTemporaryFiles(
      [
        ...roots(),
        { id: "other", label: "Other", root: path.join(fixture, "other") },
      ],
      signal(),
      progress,
    );
    const createdLater = await file("temp/later", "keep", true);
    const result = await cleanSnapshot(snapshot, ["temp"], signal(), progress);
    expect(result).toMatchObject({ deleted: 1, bytes: 3, skipped: 0 });
    await expect(fs.stat(old)).rejects.toThrow();
    expect(await fs.readFile(keep, "utf8")).toBe("keep");
    expect(await fs.readFile(createdLater, "utf8")).toBe("keep");
  });
  it("skips files changed since the preview and continues with eligible files", async () => {
    const changed = await file("temp/changed", "old", true);
    await file("temp/eligible", "okay", true);
    const snapshot = await scanTemporaryFiles(roots(), signal(), progress);
    await fs.writeFile(changed, "new content");
    const result = await cleanSnapshot(snapshot, ["temp"], signal(), progress);
    expect(result).toMatchObject({ deleted: 1, skipped: 1, bytes: 4 });
    expect(await fs.readFile(changed, "utf8")).toBe("new content");
  });
  it("refuses a folder replaced by a junction after scanning", async () => {
    await file("temp/nested/file", "old", true);
    const outside = await file("outside/file", "keep", true);
    const snapshot = await scanTemporaryFiles(roots(), signal(), progress);
    await fs.rename(
      path.join(fixture, "temp/nested"),
      path.join(fixture, "original"),
    );
    await fs.symlink(
      path.join(fixture, "outside"),
      path.join(fixture, "temp/nested"),
      "junction",
    );
    const result = await cleanSnapshot(snapshot, ["temp"], signal(), progress);
    expect(result).toMatchObject({ deleted: 0, skipped: 1 });
    expect(await fs.readFile(outside, "utf8")).toBe("keep");
  });
  it("rejects cancelled, expired and unknown category selections", async () => {
    await file("temp/old", "old", true);
    const snapshot = await scanTemporaryFiles(roots(), signal(), progress);
    expect(() => selectedCandidates(snapshot, ["other"])).toThrow("valid");
    expect(() =>
      selectedCandidates(snapshot, ["temp"], Date.now() + 31 * 60_000),
    ).toThrow("expired");
    snapshot.result.cancelled = true;
    expect(() => selectedCandidates(snapshot, ["temp"])).toThrow("new scan");
  });
  it("stops cleanup without deleting remaining files", async () => {
    const target = await file("temp/old", "keep", true);
    const snapshot = await scanTemporaryFiles(roots(), signal(), progress);
    const abort = new AbortController();
    abort.abort();
    const result = await cleanSnapshot(
      snapshot,
      ["temp"],
      abort.signal,
      progress,
    );
    expect(result.cancelled).toBe(true);
    expect(result.deleted).toBe(0);
    expect(await fs.readFile(target, "utf8")).toBe("keep");
  });
  it("does not mistake a sibling with the same prefix for a descendant", () => {
    expect(
      isWithin(
        path.join(fixture, "temp"),
        path.join(fixture, "temp-other/file"),
      ),
    ).toBe(false);
    expect(isWithin(fixture, fixture)).toBe(false);
    expect(isWithin(fixture, path.join(fixture, "file"))).toBe(true);
  });
});
