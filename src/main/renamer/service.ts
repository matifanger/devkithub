import * as fs from "fs/promises";
import { createReadStream } from "fs";
import * as path from "path";
import { createHash, randomUUID } from "crypto";
import type {
  DuplicateGroup,
  RenameHistory,
  RenameItem,
  RenamerSettings,
  RenamerSnapshot,
  WatchFolder,
} from "../../types/smart-file-renamer";
import { DEFAULT_RENAMER_SETTINGS } from "../../types/smart-file-renamer";
import {
  formatName,
  matchFolder,
  validateFolder,
  validateName,
  validateSettings,
} from "./naming";
import { extractContent } from "./extract";
import { inferFields, listModels } from "./ai";

const MAX_FILES = 1000;
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);
const key = (file: string) =>
  process.platform === "win32" ? file.toLowerCase() : file;
const exists = async (file: string) => {
  try {
    await fs.lstat(file);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
};
const fingerprint = (stat: Awaited<ReturnType<typeof fs.stat>>) =>
  `${stat.dev}:${stat.ino}:${stat.size}:${stat.mtimeMs}`;

export async function hashFile(file: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

export class RenamerService {
  private state: RenamerSnapshot = {
    settings: structuredClone(DEFAULT_RENAMER_SETTINGS),
    items: [],
    history: [],
    watches: [],
    busy: false,
    progress: "",
  };
  private abort: AbortController | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private seen: Record<string, string> = {};
  private settling = new Map<string, string>();
  private saveChain: Promise<void> = Promise.resolve();
  constructor(
    private storage: string,
    private changed: (state: RenamerSnapshot) => void = () => undefined,
  ) {}

  async initialize(startWatching = true): Promise<void> {
    if (await exists(this.storage)) {
      try {
        const saved = JSON.parse(await fs.readFile(this.storage, "utf8"));
        validateSettings(saved.settings);
        if (
          !Array.isArray(saved.items) ||
          !Array.isArray(saved.history) ||
          !Array.isArray(saved.watches)
        )
          throw new Error("Invalid saved library.");
        this.state = {
          ...this.state,
          settings: saved.settings,
          items: saved.items,
          history: saved.history,
          watches: saved.watches,
        };
        this.seen = saved.seen || {};
      } catch (error) {
        // Do not overwrite a damaged history or silently discard recovery information.
        throw new Error(
          `Cannot read the file renamer library. Preserve ${this.storage} for recovery. ${errorMessage(error)}`,
        );
      }
    }
    await this.recover();
    if (startWatching)
      this.timer = setInterval(() => {
        void this.tick().catch((error) => {
          this.state.progress = errorMessage(error);
          this.emit();
        });
      }, 5000);
  }
  dispose(): void {
    if (this.timer) clearInterval(this.timer);
    this.cancel();
  }
  snapshot(): RenamerSnapshot {
    return structuredClone(this.state);
  }
  private emit(): void {
    this.changed(this.snapshot());
  }
  private async save(): Promise<void> {
    const data = JSON.stringify({
      ...this.state,
      busy: false,
      progress: "",
      seen: this.seen,
    });
    const operation = this.saveChain
      .catch(() => undefined)
      .then(async () => {
        await fs.mkdir(path.dirname(this.storage), { recursive: true });
        const temp = `${this.storage}.tmp`;
        const handle = await fs.open(temp, "w", 0o600);
        try {
          await handle.writeFile(data);
          await handle.sync();
        } finally {
          await handle.close();
        }
        // Windows indexers can briefly lock the destination. Retry atomic
        // replacement without ever deleting the last durable journal.
        for (let attempt = 0; ; attempt++) {
          try {
            await fs.rename(temp, this.storage);
            break;
          } catch (error) {
            const code = (error as NodeJS.ErrnoException).code;
            if (attempt >= 5 || !["EPERM", "EACCES", "EBUSY"].includes(code))
              throw error;
            await new Promise((resolve) =>
              setTimeout(resolve, 40 * (attempt + 1)),
            );
          }
        }
      });
    this.saveChain = operation;
    await operation;
    this.emit();
  }
  private async exclusive<T>(action: () => Promise<T>): Promise<T> {
    if (this.state.busy)
      throw new Error(
        "Another file operation is running. Wait or cancel it first.",
      );
    this.state.busy = true;
    this.abort = new AbortController();
    this.emit();
    try {
      return await action();
    } finally {
      this.state.busy = false;
      this.abort = null;
      this.state.progress = "";
      await this.save();
    }
  }
  cancel(): void {
    this.abort?.abort();
  }
  async configure(settings: RenamerSettings): Promise<RenamerSnapshot> {
    await this.exclusive(async () => {
      validateSettings(settings);
      this.state.settings = structuredClone(settings);
      // A changed template/rule must never silently apply an older preview.
      this.state.items.forEach((item) => {
        if (item.status !== "done") {
          item.status = "new";
          item.message =
            "Settings changed. Analyze again to refresh this preview.";
        }
      });
      this.state.watches.forEach((watch) => {
        if (!settings.presets.some((preset) => preset.id === watch.presetId)) {
          watch.enabled = false;
          watch.error = "The selected preset was removed.";
        }
      });
    });
    return this.snapshot();
  }
  async models(): Promise<string[]> {
    return listModels(this.state.settings);
  }

  private async walk(inputs: string[], recursive: boolean): Promise<string[]> {
    const files: string[] = [];
    let entriesVisited = 0;
    const visit = async (file: string, descend: boolean) => {
      if (this.abort?.signal.aborted) return;
      if (++entriesVisited > 10000 || files.length >= MAX_FILES)
        throw new Error(
          "This selection is too large. Select a folder with fewer than 1,000 files and 10,000 entries.",
        );
      const stat = await fs.lstat(file);
      if (stat.isSymbolicLink()) return;
      if (stat.isFile()) files.push(await fs.realpath(file));
      else if (stat.isDirectory() && descend) {
        for (const child of (await fs.readdir(file)).sort()) {
          if (child.startsWith(".")) continue;
          const childPath = path.join(file, child);
          const info = await fs.lstat(childPath);
          if (!info.isDirectory() || recursive)
            await visit(childPath, recursive);
        }
      }
    };
    for (const input of inputs) {
      if (typeof input !== "string" || !path.isAbsolute(input))
        throw new Error("Select absolute file or folder paths.");
      await visit(input, true);
    }
    return [...new Set(files)];
  }
  private async addFiles(files: string[]): Promise<string[]> {
    const ids: string[] = [];
    for (const file of files) {
      const stat = await fs.lstat(file);
      if (!stat.isFile() || stat.isSymbolicLink()) continue;
      let item = this.state.items.find(
        (entry) => key(entry.path) === key(file),
      );
      if (item && item.fingerprint === fingerprint(stat)) continue;
      if (!item && this.state.items.length >= MAX_FILES)
        throw new Error(
          "Library limit reached (1,000 files). Clear the library before adding more.",
        );
      const next: RenameItem = {
        id: item?.id || randomUUID(),
        path: file,
        name: path.basename(file),
        size: stat.size,
        modified: stat.mtimeMs,
        fingerprint: fingerprint(stat),
        proposedName: path.basename(file),
        folder: "",
        content: "",
        fields: {},
        status: "new",
        message: "",
      };
      if (item) Object.assign(item, next);
      else {
        item = next;
        this.state.items.push(item);
      }
      ids.push(item.id);
    }
    return ids;
  }
  async add(inputs: string[]): Promise<RenamerSnapshot> {
    await this.exclusive(async () => {
      await this.addFiles(
        await this.walk(inputs, this.state.settings.recursive),
      );
    });
    return this.snapshot();
  }
  async clear(): Promise<RenamerSnapshot> {
    await this.exclusive(async () => {
      this.state.items = [];
    });
    return this.snapshot();
  }

  private async analyzeItems(
    ids: string[],
    presetId = this.state.settings.activePreset,
  ): Promise<void> {
    const settings = this.state.settings;
    const preset = settings.presets.find((entry) => entry.id === presetId);
    if (!preset) throw new Error("The naming preset no longer exists.");
    const selected = this.state.items.filter(
      (item) => ids.includes(item.id) && item.status !== "done",
    );
    let counter = 0;
    for (const item of selected) {
      if (this.abort?.signal.aborted) break;
      this.state.progress = `Analyzing ${++counter}/${selected.length}: ${item.name}`;
      this.emit();
      try {
        const stat = await fs.lstat(item.path);
        if (
          !stat.isFile() ||
          stat.isSymbolicLink() ||
          fingerprint(stat) !== item.fingerprint
        )
          throw new Error(
            "File changed since import. Add it again before analyzing.",
          );
        const base: Record<string, string> = {
          original: path.parse(item.name).name,
          extension: path.extname(item.name).slice(1),
          parent: path.basename(path.dirname(item.path)),
          modified: new Date(stat.mtimeMs).toISOString().slice(0, 10),
          created: new Date(stat.birthtimeMs).toISOString().slice(0, 10),
          counter: String(counter).padStart(3, "0"),
          size: String(stat.size),
          year: new Date(stat.mtimeMs).toISOString().slice(0, 4),
        };
        let fields: Record<string, string> = {};
        let confidence = 1;
        let warning = "";
        if (settings.provider !== "off") {
          const content = await extractContent(item.path, settings.vision);
          const result = await inferFields(
            settings,
            preset,
            item.name,
            content,
            this.abort.signal,
          );
          item.content = content.text;
          fields = result.fields;
          confidence = result.confidence;
          warning = content.warning;
        } else {
          // Content search still works without AI for supported text/document formats.
          try {
            item.content = (await extractContent(item.path, false)).text;
          } catch {
            item.content = "";
          }
        }
        const after = await fs.lstat(item.path);
        if (fingerprint(after) !== item.fingerprint)
          throw new Error("File changed during analysis. Import it again.");
        item.fields = { ...fields, ...base };
        const formatted = formatName(item.name, preset, item.fields);
        item.proposedName = formatted.name;
        item.folder = matchFolder(
          settings.rules,
          item.name,
          item.content,
          item.fields,
        );
        const messages = [warning];
        if (formatted.missing.length)
          messages.push(
            `Missing fields: ${formatted.missing.join(", ")}. Edit the name or select a local AI model.`,
          );
        if (confidence < 0.9)
          messages.push("AI confidence is below 90%. Review this suggestion.");
        item.status = messages.some(Boolean) ? "review" : "ready";
        item.message = messages.filter(Boolean).join(" ");
      } catch (error) {
        item.status = "error";
        item.message = this.abort?.signal.aborted
          ? "Analysis canceled. Retry when ready."
          : errorMessage(error);
      }
      await this.save();
    }
  }
  async analyze(ids: string[]): Promise<RenamerSnapshot> {
    await this.exclusive(() => this.analyzeItems(ids));
    return this.snapshot();
  }

  private async safeDestination(
    source: string,
    folder: string,
    name: string,
  ): Promise<string> {
    validateName(name, path.basename(source));
    const relative = validateFolder(folder);
    const root = path.dirname(source);
    if (key(await fs.realpath(root)) !== key(root))
      throw new Error(
        "The source folder now resolves through a link. Import the file again.",
      );
    let directory = root;
    for (const part of relative ? relative.split(path.sep) : []) {
      directory = path.join(directory, part);
      if (!(await exists(directory))) await fs.mkdir(directory);
      const stat = await fs.lstat(directory);
      if (!stat.isDirectory() || stat.isSymbolicLink())
        throw new Error("Organization folders cannot contain symbolic links.");
    }
    return path.join(directory, name);
  }
  private async moveWithoutOverwrite(from: string, to: string): Promise<void> {
    // link() is atomic and refuses an existing target, unlike rename() on Unix.
    // Both paths are on the same volume because organization stays below the source.
    await fs.link(from, to);
    try {
      await fs.unlink(from);
    } catch (error) {
      await fs.unlink(to).catch(() => undefined);
      throw error;
    }
  }
  private async applyItems(
    edits: { id: string; name: string; folder: string }[],
  ): Promise<void> {
    if (new Set(edits.map((edit) => edit.id)).size !== edits.length)
      throw new Error("The same file was selected more than once.");
    for (const edit of edits) {
      if (this.abort?.signal.aborted) break;
      const item = this.state.items.find((entry) => entry.id === edit.id);
      if (!item || item.status === "done") continue;
      this.state.progress = `Applying: ${item.name}`;
      this.emit();
      let history: RenameHistory | undefined;
      try {
        const stat = await fs.lstat(item.path);
        if (
          !stat.isFile() ||
          stat.isSymbolicLink() ||
          fingerprint(stat) !== item.fingerprint
        )
          throw new Error(
            "File changed since preview. Add it again before applying.",
          );
        const to = await this.safeDestination(
          item.path,
          edit.folder,
          edit.name,
        );
        if (to === item.path) {
          item.message = "No change needed.";
          continue;
        }
        if (await exists(to))
          throw new Error(
            "Destination already exists. Choose another name; no files were overwritten.",
          );
        const hash = await hashFile(item.path);
        if (fingerprint(await fs.lstat(item.path)) !== item.fingerprint)
          throw new Error("File changed while preparing the rename.");
        history = {
          id: randomUUID(),
          from: item.path,
          to,
          hash,
          at: new Date().toISOString(),
          status: "pending",
        };
        this.state.history.unshift(history);
        await this.save(); // Write-ahead journal must be durable before touching files.
        await this.moveWithoutOverwrite(item.path, to);
        history.status = "applied";
        item.path = to;
        item.name = path.basename(to);
        item.proposedName = item.name;
        item.folder = "";
        item.fingerprint = fingerprint(await fs.lstat(to));
        item.status = "done";
        item.message = "Renamed. You can undo this in History.";
        this.seen[key(to)] = item.fingerprint;
      } catch (error) {
        if (history?.status === "pending") {
          history.status = "failed";
          history.error = errorMessage(error);
        }
        item.status = "error";
        item.message = errorMessage(error);
      }
      await this.save();
    }
  }
  async apply(
    edits: { id: string; name: string; folder: string }[],
  ): Promise<RenamerSnapshot> {
    await this.exclusive(() => this.applyItems(edits));
    return this.snapshot();
  }
  async undo(id: string): Promise<RenamerSnapshot> {
    await this.exclusive(async () => {
      const entry = this.state.history.find((history) => history.id === id);
      if (!entry || entry.status !== "applied")
        throw new Error("This rename cannot be undone.");
      const stat = await fs.lstat(entry.to);
      if (
        !stat.isFile() ||
        stat.isSymbolicLink() ||
        (await hashFile(entry.to)) !== entry.hash
      )
        throw new Error(
          "The renamed file was changed. Undo was blocked to protect your work.",
        );
      if (await exists(entry.from))
        throw new Error(
          "The original path is occupied. Undo will never overwrite another file.",
        );
      if (
        key(await fs.realpath(path.dirname(entry.from))) !==
        key(path.dirname(entry.from))
      )
        throw new Error("The original folder has changed.");
      // Persist undo as its own recoverable operation, too.
      const undo: RenameHistory = {
        id: randomUUID(),
        undoOf: entry.id,
        from: entry.to,
        to: entry.from,
        hash: entry.hash,
        at: new Date().toISOString(),
        status: "pending",
      };
      this.state.history.unshift(undo);
      await this.save();
      try {
        await this.moveWithoutOverwrite(entry.to, entry.from);
      } catch (error) {
        undo.status = "failed";
        undo.error = errorMessage(error);
        throw error;
      }
      undo.status = "undone";
      entry.status = "undone";
      const item = this.state.items.find((file) => file.path === entry.to);
      if (item) {
        item.path = entry.from;
        item.name = path.basename(entry.from);
        item.proposedName = item.name;
        item.folder = "";
        item.status = "new";
        item.message = "Rename undone.";
        item.fingerprint = fingerprint(await fs.lstat(entry.from));
      }
      this.seen[key(entry.from)] = fingerprint(await fs.lstat(entry.from));
    });
    return this.snapshot();
  }
  private async recover(): Promise<void> {
    for (const entry of this.state.history.filter(
      (item) => item.status === "pending",
    )) {
      try {
        if (
          (await exists(entry.to)) &&
          !(await exists(entry.from)) &&
          (await hashFile(entry.to)) === entry.hash
        ) {
          entry.status = entry.undoOf ? "undone" : "applied";
          if (entry.undoOf) {
            const original = this.state.history.find(
              (record) => record.id === entry.undoOf,
            );
            if (original) original.status = "undone";
          }
          const item = this.state.items.find(
            (file) => file.path === entry.from,
          );
          if (item) {
            item.path = entry.to;
            item.name = path.basename(entry.to);
            item.proposedName = item.name;
            item.folder = "";
            item.status = entry.undoOf ? "new" : "done";
            item.fingerprint = fingerprint(await fs.lstat(entry.to));
          }
          this.seen[key(entry.to)] = fingerprint(await fs.lstat(entry.to));
        } else {
          entry.status = "failed";
          entry.error =
            "Interrupted operation. Inspect both paths; recovery did not modify any files.";
        }
      } catch (error) {
        entry.status = "failed";
        entry.error = errorMessage(error);
      }
    }
    await this.save();
  }
  async duplicates(): Promise<DuplicateGroup[]> {
    return this.exclusive(async () => {
      const sizes = new Map<number, RenameItem[]>();
      for (const item of this.state.items)
        sizes.set(item.size, [...(sizes.get(item.size) || []), item]);
      const groups = new Map<string, DuplicateGroup>();
      for (const items of sizes.values()) {
        if (items.length < 2) continue;
        for (const item of items) {
          if (this.abort?.signal.aborted) return [];
          this.state.progress = `Comparing: ${item.name}`;
          this.emit();
          const stat = await fs.lstat(item.path);
          if (
            !stat.isFile() ||
            stat.isSymbolicLink() ||
            fingerprint(stat) !== item.fingerprint
          )
            throw new Error(
              `${item.name} changed. Add it again before comparing duplicates.`,
            );
          const hash = await hashFile(item.path);
          if (fingerprint(await fs.lstat(item.path)) !== item.fingerprint)
            throw new Error(`${item.name} changed while comparing duplicates.`);
          const group = groups.get(hash) || {
            hash,
            paths: [],
            size: item.size,
          };
          group.paths.push(item.path);
          groups.set(hash, group);
        }
      }
      return [...groups.values()].filter((group) => group.paths.length > 1);
    });
  }
  async watch(
    action: "add" | "update" | "remove",
    value: Partial<WatchFolder>,
  ): Promise<RenamerSnapshot> {
    await this.exclusive(async () => {
      if (action === "add") {
        const folder = await fs.realpath(value.path);
        if (!(await fs.stat(folder)).isDirectory())
          throw new Error("Choose a folder to watch.");
        if (this.state.watches.some((watch) => key(watch.path) === key(folder)))
          throw new Error("This folder is already watched.");
        const files = await this.walk([folder], this.state.settings.recursive);
        for (const file of files)
          this.seen[key(file)] = fingerprint(await fs.stat(file));
        this.state.watches.push({
          id: randomUUID(),
          path: folder,
          enabled: true,
          automatic: false,
          presetId: this.state.settings.activePreset,
          error: "",
        });
      } else {
        const watch = this.state.watches.find((entry) => entry.id === value.id);
        if (!watch) throw new Error("Watch folder not found.");
        if (action === "remove")
          this.state.watches = this.state.watches.filter(
            (entry) => entry.id !== value.id,
          );
        else {
          if (typeof value.enabled === "boolean") watch.enabled = value.enabled;
          if (typeof value.automatic === "boolean")
            watch.automatic = value.automatic;
          if (value.presetId) {
            if (
              !this.state.settings.presets.some(
                (preset) => preset.id === value.presetId,
              )
            )
              throw new Error("Preset not found.");
            watch.presetId = value.presetId;
          }
          watch.error = "";
        }
      }
    });
    return this.snapshot();
  }
  async tick(): Promise<void> {
    if (this.state.busy || !this.state.watches.some((watch) => watch.enabled))
      return;
    await this.exclusive(async () => {
      for (const watch of this.state.watches.filter((entry) => entry.enabled)) {
        if (this.abort?.signal.aborted) break;
        try {
          const incoming: string[] = [];
          for (const file of await this.walk(
            [watch.path],
            this.state.settings.recursive,
          )) {
            const signature = fingerprint(await fs.stat(file));
            if (this.seen[key(file)] === signature) continue;
            if (this.settling.get(key(file)) !== signature) {
              this.settling.set(key(file), signature);
              continue;
            }
            incoming.push(file);
          }
          const ids = await this.addFiles(incoming);
          for (const file of incoming) {
            this.seen[key(file)] = fingerprint(await fs.stat(file));
            this.settling.delete(key(file));
          }
          if (ids.length) {
            await this.analyzeItems(ids, watch.presetId);
            if (watch.automatic && !this.abort?.signal.aborted)
              await this.applyItems(
                this.state.items
                  .filter(
                    (item) => ids.includes(item.id) && item.status === "ready",
                  )
                  .map((item) => ({
                    id: item.id,
                    name: item.proposedName,
                    folder: item.folder,
                  })),
              );
          }
          watch.error = "";
        } catch (error) {
          watch.error = errorMessage(error);
        }
      }
    });
  }
}
