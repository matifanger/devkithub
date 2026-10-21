import * as fs from "fs/promises";
import * as path from "path";
import { randomUUID } from "crypto";
import type { Stats } from "fs";
import type {
  CleanupGroup,
  CleanupResult,
  CleanupScan,
  DiskItem,
  DiskScan,
  MaintenanceProgress,
} from "../../types/maintenance";

const MAX_ENTRIES = 200_000;
export const MIN_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_SCAN_AGE_MS = 30 * 60 * 1000;
export interface CleanupRoot {
  id: string;
  label: string;
  root: string;
}
interface Candidate {
  path: string;
  root: string;
  group: string;
  size: number;
  mtime: number;
  ctime: number;
  ino: number;
  dev: number;
}
export interface CleanupSnapshot {
  result: CleanupScan;
  candidates: Candidate[];
  createdAt: number;
}
type Progress = (value: MaintenanceProgress) => void;

export function isWithin(root: string, target: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  return (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

// Check every component, including the root's ancestors: junctions must never
// turn a cleanup target into a different directory.
export async function assertNoLinks(target: string): Promise<void> {
  const absolute = path.resolve(target);
  const volume = path.parse(absolute).root;
  let current = volume;
  for (const component of absolute
    .slice(volume.length)
    .split(path.sep)
    .filter(Boolean)) {
    current = path.join(current, component);
    if ((await fs.lstat(current)).isSymbolicLink())
      throw new Error("Linked folders are excluded.");
  }
}

interface WalkStats {
  visited: number;
  skipped: number;
  limited: boolean;
}
async function walk(
  root: string,
  signal: AbortSignal,
  visit: (file: string, stat: Stats) => void,
  report: (file: string) => void,
  limit = MAX_ENTRIES,
): Promise<WalkStats> {
  const stats = { visited: 0, skipped: 0, limited: false };
  const queue = [root];
  while (queue.length && !signal.aborted && !stats.limited) {
    const directory = queue.pop()!;
    try {
      await assertNoLinks(directory);
      const handle = await fs.opendir(directory);
      for await (const entry of handle) {
        if (signal.aborted) break;
        if (stats.visited >= limit) {
          stats.limited = true;
          break;
        }
        stats.visited++;
        const target = path.join(directory, entry.name);
        report(target);
        try {
          const stat = await fs.lstat(target);
          if (stat.isSymbolicLink()) {
            stats.skipped++;
            continue;
          }
          if (stat.isDirectory()) queue.push(target);
          else if (stat.isFile()) visit(target, stat);
          else stats.skipped++;
        } catch {
          stats.skipped++;
        }
      }
    } catch {
      stats.skipped++;
    }
  }
  return stats;
}

export async function analyzeDirectory(
  root: string,
  signal: AbortSignal,
  progress: Progress,
  limit = MAX_ENTRIES,
): Promise<DiskScan> {
  root = path.resolve(root);
  await assertNoLinks(root);
  if (!(await fs.lstat(root)).isDirectory())
    throw new Error("Select a folder to analyze.");
  const buckets = new Map<string, DiskItem>();
  const largest: DiskItem[] = [];
  let bytes = 0,
    files = 0,
    visited = 0,
    lastReport = 0;
  const stats = await walk(
    root,
    signal,
    (file, stat) => {
      bytes += stat.size;
      files++;
      const relative = path.relative(root, file);
      const first = relative.split(path.sep)[0];
      const folder = relative.includes(path.sep);
      const bucket = buckets.get(first) || {
        name: first,
        path: path.join(root, first),
        kind: folder ? "folder" : "file",
        bytes: 0,
        files: 0,
      };
      bucket.bytes += stat.size;
      bucket.files++;
      buckets.set(first, bucket as DiskItem);
      largest.push({
        name: path.basename(file),
        path: file,
        bytes: stat.size,
        files: 1,
        kind: "file",
      });
      if (largest.length > 200) {
        largest.sort((a, b) => b.bytes - a.bytes);
        largest.length = 100;
      }
    },
    (current) => {
      visited++;
      if (Date.now() - lastReport > 150) {
        progress({ job: "disk", visited, bytes, current });
        lastReport = Date.now();
      }
    },
    limit,
  );
  return {
    root,
    bytes,
    files,
    skipped: stats.skipped,
    limited: stats.limited,
    cancelled: signal.aborted,
    items: [...buckets.values()]
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 500),
    largest: largest.sort((a, b) => b.bytes - a.bytes).slice(0, 100),
    scannedAt: new Date().toISOString(),
  };
}

export async function scanTemporaryFiles(
  roots: CleanupRoot[],
  signal: AbortSignal,
  progress: Progress,
  now = Date.now(),
): Promise<CleanupSnapshot> {
  const candidates: Candidate[] = [];
  const groups: CleanupGroup[] = [];
  let visited = 0,
    bytes = 0,
    lastReport = 0,
    limited = false;
  for (const definition of roots) {
    if (signal.aborted || limited) break;
    const group: CleanupGroup = {
      ...definition,
      bytes: 0,
      files: 0,
      skipped: 0,
      samples: [],
    };
    groups.push(group);
    try {
      await assertNoLinks(definition.root);
      if (!(await fs.lstat(definition.root)).isDirectory())
        throw new Error("Not a folder");
      const result = await walk(
        definition.root,
        signal,
        (file, stat) => {
          if (stat.mtimeMs > now - MIN_AGE_MS || stat.nlink > 1) {
            group.skipped++;
            return;
          }
          candidates.push({
            path: file,
            root: definition.root,
            group: definition.id,
            size: stat.size,
            mtime: stat.mtimeMs,
            ctime: stat.ctimeMs,
            ino: stat.ino,
            dev: stat.dev,
          });
          group.files++;
          group.bytes += stat.size;
          bytes += stat.size;
          if (group.samples.length < 100)
            group.samples.push({ path: file, bytes: stat.size });
        },
        (current) => {
          visited++;
          if (Date.now() - lastReport > 150) {
            progress({ job: "cleanup", visited, bytes, current });
            lastReport = Date.now();
          }
        },
        Math.max(0, MAX_ENTRIES - visited),
      );
      group.skipped += result.skipped;
      limited = limited || result.limited;
    } catch {
      group.unavailable = "Folder unavailable or linked; no files selected.";
    }
  }
  return {
    createdAt: now,
    candidates,
    result: {
      id: randomUUID(),
      groups,
      scannedAt: new Date(now).toISOString(),
      cancelled: signal.aborted,
      limited,
    },
  };
}

export function selectedCandidates(
  snapshot: CleanupSnapshot,
  ids: string[],
  now = Date.now(),
): Candidate[] {
  if (now - snapshot.createdAt > MAX_SCAN_AGE_MS)
    throw new Error("This scan expired. Scan again before cleaning.");
  if (snapshot.result.cancelled)
    throw new Error("Complete a new scan before cleaning.");
  if (
    !Array.isArray(ids) ||
    !ids.length ||
    ids.some(
      (id) =>
        typeof id !== "string" ||
        !snapshot.result.groups.some((group) => group.id === id),
    )
  )
    throw new Error("Select valid cleanup categories.");
  return snapshot.candidates.filter((candidate) =>
    ids.includes(candidate.group),
  );
}

export async function cleanSnapshot(
  snapshot: CleanupSnapshot,
  ids: string[],
  signal: AbortSignal,
  progress: Progress,
): Promise<CleanupResult> {
  const candidates = selectedCandidates(snapshot, ids);
  const result: CleanupResult = {
    deleted: 0,
    bytes: 0,
    skipped: 0,
    cancelled: signal.aborted,
    errors: [],
  };
  let visited = 0,
    lastReport = 0;
  for (const candidate of candidates) {
    if (signal.aborted) {
      result.cancelled = true;
      break;
    }
    try {
      if (!isWithin(candidate.root, candidate.path))
        throw new Error("Outside cleanup folder");
      await assertNoLinks(candidate.path);
      const stat = await fs.lstat(candidate.path);
      if (
        !stat.isFile() ||
        stat.nlink > 1 ||
        stat.size !== candidate.size ||
        stat.mtimeMs !== candidate.mtime ||
        stat.ctimeMs !== candidate.ctime ||
        stat.ino !== candidate.ino ||
        stat.dev !== candidate.dev ||
        stat.mtimeMs > Date.now() - MIN_AGE_MS
      )
        throw new Error("File changed since scan");
      // Delete only an individual, previously scanned file. Never recursively
      // remove directories or accept paths supplied by the renderer.
      await fs.unlink(candidate.path);
      result.deleted++;
      result.bytes += candidate.size;
    } catch (error) {
      result.skipped++;
      if (result.errors.length < 20)
        result.errors.push(
          `${candidate.path}: ${error instanceof Error ? error.message : "File unavailable"}`,
        );
    }
    visited++;
    if (Date.now() - lastReport > 150) {
      progress({
        job: "delete",
        visited,
        bytes: result.bytes,
        current: candidate.path,
      });
      lastReport = Date.now();
    }
  }
  return result;
}
