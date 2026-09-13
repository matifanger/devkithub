import { clipboard, nativeImage, safeStorage } from "electron";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import {
  ClipboardHistoryItem,
  ClipboardHistoryRule,
  ClipboardHistorySettings,
  ClipboardHistoryState,
  ClipboardItemUpdate,
} from "../../types/clipboard-history";
import {
  classifyClipboardContent,
  evaluateClipboardRules,
  isValidClipboardRule,
  purgeAndLimitHistory,
} from "../../services/clipboard/history-policy";

const ENCRYPTED_HEADER = Buffer.from("DKH1E");
const PLAIN_HEADER = Buffer.from("DKH1P");

export const DEFAULT_CLIPBOARD_HISTORY_SETTINGS: ClipboardHistorySettings = {
  enabled: true,
  shortcutEnabled: true,
  shortcut: "CommandOrControl+Shift+H",
  storeSecretContent: true,
  secretRetentionDays: 3,
  defaultRetentionDays: 0,
  maxItems: 500,
  maxItemSizeMb: 10,
  maxHistorySizeMb: 100,
  pollIntervalMs: 750,
};

interface PersistedClipboardHistory {
  version: 1;
  items: ClipboardHistoryItem[];
  rules: ClipboardHistoryRule[];
  settings: ClipboardHistorySettings;
}

interface ClipboardSnapshot {
  text: string;
  html: string;
  rtf: string;
  imageDataUrl?: string;
  formats: string[];
  signature: string;
  byteSize: number;
  secret: boolean;
}

type ChangeListener = (state: ClipboardHistoryState) => void;

function clampNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function earliestExpiry(...values: Array<number | null>): number | null {
  const valid = values.filter((value): value is number => value !== null);
  return valid.length ? Math.min(...valid) : null;
}

export class ClipboardHistoryService {
  private readonly storageFile: string;
  private state: PersistedClipboardHistory = {
    version: 1,
    items: [],
    rules: [],
    settings: { ...DEFAULT_CLIPBOARD_HISTORY_SETTINGS },
  };
  private monitorTimer: ReturnType<typeof setInterval> | null = null;
  private purgeTimer: ReturnType<typeof setInterval> | null = null;
  private lastClipboardSignature = "";
  private shortcutError = "";
  private listeners = new Set<ChangeListener>();

  constructor(userDataPath: string) {
    const directory = path.join(userDataPath, "clipboard-history");
    this.storageFile = path.join(directory, "history.dat");
    fs.mkdirSync(directory, { recursive: true });
  }

  initialize() {
    this.load();
    this.purgeExpired(false);
    if (this.state.settings.enabled) this.startMonitoring();
    this.purgeTimer = setInterval(() => this.purgeExpired(true), 60_000);
  }

  dispose() {
    this.stopMonitoring();
    if (this.purgeTimer) clearInterval(this.purgeTimer);
    this.purgeTimer = null;
    this.listeners.clear();
  }

  onChange(listener: ChangeListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): ClipboardHistoryState {
    this.purgeExpired(false);
    return {
      version: 1,
      items: this.state.items.map((item) => ({
        ...item,
        tags: [...item.tags],
        formats: [...item.formats],
      })),
      rules: this.state.rules.map((rule) => ({ ...rule })),
      settings: { ...this.state.settings },
      monitoring: this.monitorTimer !== null,
      shortcutError: this.shortcutError || undefined,
    };
  }

  getRecentItems(limit = 8) {
    return this.getState().items.slice(0, limit);
  }

  setShortcutError(error = "") {
    if (this.shortcutError === error) return;
    this.shortcutError = error;
    this.emitChange();
  }

  updateSettings(patch: Partial<ClipboardHistorySettings>) {
    const current = this.state.settings;
    this.state.settings = {
      enabled:
        typeof patch.enabled === "boolean" ? patch.enabled : current.enabled,
      shortcutEnabled:
        typeof patch.shortcutEnabled === "boolean"
          ? patch.shortcutEnabled
          : current.shortcutEnabled,
      shortcut:
        typeof patch.shortcut === "string" && patch.shortcut.trim()
          ? patch.shortcut.trim().slice(0, 120)
          : current.shortcut,
      storeSecretContent:
        typeof patch.storeSecretContent === "boolean"
          ? patch.storeSecretContent
          : current.storeSecretContent,
      secretRetentionDays: clampNumber(
        patch.secretRetentionDays,
        current.secretRetentionDays,
        0,
        3650,
      ),
      defaultRetentionDays: clampNumber(
        patch.defaultRetentionDays,
        current.defaultRetentionDays,
        0,
        3650,
      ),
      maxItems: Math.round(
        clampNumber(patch.maxItems, current.maxItems, 10, 20_000),
      ),
      maxItemSizeMb: clampNumber(
        patch.maxItemSizeMb,
        current.maxItemSizeMb,
        0.1,
        100,
      ),
      maxHistorySizeMb: clampNumber(
        patch.maxHistorySizeMb,
        current.maxHistorySizeMb,
        10,
        10_000,
      ),
      pollIntervalMs: Math.round(
        clampNumber(patch.pollIntervalMs, current.pollIntervalMs, 250, 10_000),
      ),
    };

    this.state.items = purgeAndLimitHistory(
      this.state.items,
      this.state.settings.maxItems,
      Date.now(),
      this.state.settings.maxHistorySizeMb * 1024 * 1024,
    );
    this.save();

    this.stopMonitoring();
    if (this.state.settings.enabled) this.startMonitoring();
    this.emitChange();
    return this.getState();
  }

  upsertRule(
    input: Partial<ClipboardHistoryRule> &
      Pick<ClipboardHistoryRule, "name" | "pattern">,
  ) {
    const rule: ClipboardHistoryRule = {
      id: input.id || crypto.randomUUID(),
      name: input.name.trim().slice(0, 100),
      enabled: input.enabled !== false,
      matchType: input.matchType === "regex" ? "regex" : "contains",
      pattern: input.pattern.slice(0, 2000),
      caseSensitive: input.caseSensitive === true,
      action: input.action === "expire" ? "expire" : "ignore",
      expiresAfterMinutes:
        input.action === "expire"
          ? clampNumber(input.expiresAfterMinutes, 1440, 1, 5_256_000)
          : null,
    };

    if (!isValidClipboardRule(rule)) {
      throw new Error("The clipboard rule is invalid.");
    }

    const index = this.state.rules.findIndex(
      (candidate) => candidate.id === rule.id,
    );
    if (index === -1) this.state.rules.push(rule);
    else this.state.rules[index] = rule;
    this.saveAndEmit();
    return this.getState();
  }

  deleteRule(id: string) {
    this.state.rules = this.state.rules.filter((rule) => rule.id !== id);
    this.saveAndEmit();
    return this.getState();
  }

  addTextItem(text: string) {
    const value = text.slice(
      0,
      this.state.settings.maxItemSizeMb * 1024 * 1024,
    );
    if (!value.trim()) return this.getState();

    const now = Date.now();
    const signature = this.createPayloadSignature(value, "", "", "");
    this.state.items = this.state.items.filter(
      (item) => item.signature !== signature,
    );
    this.state.items.unshift({
      id: crypto.randomUUID(),
      type: classifyClipboardContent(value, "", false, ["text/plain"]),
      text: value,
      formats: ["text/plain"],
      signature,
      createdAt: now,
      updatedAt: now,
      expiresAt:
        this.state.settings.defaultRetentionDays > 0
          ? now + this.state.settings.defaultRetentionDays * 86_400_000
          : null,
      pinned: false,
      tags: [],
      collection: "Clipboard",
      byteSize: Buffer.byteLength(value, "utf8"),
      secret: false,
    });
    this.state.items = purgeAndLimitHistory(
      this.state.items,
      this.state.settings.maxItems,
      now,
      this.state.settings.maxHistorySizeMb * 1024 * 1024,
    );
    this.saveAndEmit();
    return this.getState();
  }

  updateItem(id: string, patch: ClipboardItemUpdate) {
    const item = this.state.items.find((candidate) => candidate.id === id);
    if (!item) return this.getState();

    if (typeof patch.text === "string") {
      item.text = patch.text.slice(
        0,
        this.state.settings.maxItemSizeMb * 1024 * 1024,
      );
      item.html = undefined;
      item.rtf = undefined;
      item.imageDataUrl = undefined;
      item.formats = ["text/plain"];
      item.type = classifyClipboardContent(item.text, "", false, item.formats);
      item.byteSize = Buffer.byteLength(item.text, "utf8");
      item.signature = this.createPayloadSignature(item.text, "", "", "");
    }
    if (typeof patch.pinned === "boolean") item.pinned = patch.pinned;
    if (Array.isArray(patch.tags)) {
      item.tags = Array.from(
        new Set(patch.tags.map((tag) => tag.trim()).filter(Boolean)),
      ).slice(0, 20);
    }
    if (typeof patch.collection === "string") {
      item.collection = patch.collection.trim().slice(0, 80) || "Clipboard";
    }
    if (patch.expiresAt === null || typeof patch.expiresAt === "number") {
      item.expiresAt = patch.expiresAt;
    }
    item.updatedAt = Date.now();
    this.saveAndEmit();
    return this.getState();
  }

  deleteItem(id: string) {
    this.state.items = this.state.items.filter((item) => item.id !== id);
    this.saveAndEmit();
    return this.getState();
  }

  clear(includePinned = false) {
    this.state.items = includePinned
      ? []
      : this.state.items.filter((item) => item.pinned);
    this.saveAndEmit();
    return this.getState();
  }

  copyItem(id: string) {
    const item = this.state.items.find((candidate) => candidate.id === id);
    if (!item) return false;

    try {
      const payload: Electron.Data = {};
      let restoredSignature: string;
      if (item.imageDataUrl) {
        const image = nativeImage.createFromDataURL(item.imageDataUrl);
        if (!image.isEmpty()) payload.image = image;
        restoredSignature = this.createPayloadSignature(
          "",
          "",
          "",
          item.imageDataUrl,
        );
      } else {
        const restoredText =
          item.text ||
          item.html
            ?.replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim() ||
          "";
        payload.text = restoredText;
        restoredSignature = this.createPayloadSignature(
          restoredText,
          "",
          "",
          "",
        );
      }
      clipboard.write(payload);
      this.lastClipboardSignature = restoredSignature;
      item.lastCopiedAt = Date.now();
      item.updatedAt = item.lastCopiedAt;
      this.saveAndEmit();
      return true;
    } catch (error) {
      console.error("Failed to restore clipboard history item:", error);
      return false;
    }
  }

  private startMonitoring() {
    if (this.monitorTimer || !this.state.settings.enabled) return;
    void this.captureClipboard();
    this.monitorTimer = setInterval(
      () => void this.captureClipboard(),
      this.state.settings.pollIntervalMs,
    );
  }

  private stopMonitoring() {
    if (this.monitorTimer) clearInterval(this.monitorTimer);
    this.monitorTimer = null;
  }

  private async captureClipboard() {
    try {
      const snapshot = this.readClipboardSnapshot();
      if (!snapshot || snapshot.signature === this.lastClipboardSignature)
        return;
      this.lastClipboardSignature = snapshot.signature;

      if (snapshot.byteSize > this.state.settings.maxItemSizeMb * 1024 * 1024) {
        return;
      }
      if (snapshot.secret && !this.state.settings.storeSecretContent) return;

      const ruleTarget = [
        snapshot.text,
        snapshot.html,
        snapshot.formats.join(" "),
      ]
        .filter(Boolean)
        .join("\n");
      const policy = evaluateClipboardRules(ruleTarget, this.state.rules);
      if (policy.ignore) return;

      const now = Date.now();
      const secretExpiry =
        snapshot.secret && this.state.settings.secretRetentionDays > 0
          ? now + this.state.settings.secretRetentionDays * 86_400_000
          : null;
      const defaultExpiry =
        this.state.settings.defaultRetentionDays > 0
          ? now + this.state.settings.defaultRetentionDays * 86_400_000
          : null;
      const expiresAt = earliestExpiry(
        policy.expiresAt,
        secretExpiry,
        defaultExpiry,
      );

      const existingIndex = this.state.items.findIndex(
        (item) => item.signature === snapshot.signature,
      );
      if (existingIndex >= 0) {
        const [existing] = this.state.items.splice(existingIndex, 1);
        Object.assign(existing, {
          text: snapshot.text,
          html: snapshot.html || undefined,
          rtf: snapshot.rtf || undefined,
          imageDataUrl: snapshot.imageDataUrl,
          formats: snapshot.formats,
          createdAt: now,
          updatedAt: now,
          expiresAt,
          byteSize: snapshot.byteSize,
          secret: snapshot.secret,
          type: classifyClipboardContent(
            snapshot.text,
            snapshot.html,
            Boolean(snapshot.imageDataUrl),
            snapshot.formats,
          ),
        });
        this.state.items.unshift(existing);
      } else {
        this.state.items.unshift({
          id: crypto.randomUUID(),
          type: classifyClipboardContent(
            snapshot.text,
            snapshot.html,
            Boolean(snapshot.imageDataUrl),
            snapshot.formats,
          ),
          text: snapshot.text,
          html: snapshot.html || undefined,
          rtf: snapshot.rtf || undefined,
          imageDataUrl: snapshot.imageDataUrl,
          formats: snapshot.formats,
          signature: snapshot.signature,
          createdAt: now,
          updatedAt: now,
          expiresAt,
          pinned: false,
          tags: [],
          collection: "Clipboard",
          byteSize: snapshot.byteSize,
          secret: snapshot.secret,
        });
      }

      this.state.items = purgeAndLimitHistory(
        this.state.items,
        this.state.settings.maxItems,
        now,
        this.state.settings.maxHistorySizeMb * 1024 * 1024,
      );
      this.saveAndEmit();
    } catch (error) {
      console.warn("Clipboard monitoring failed:", error);
    }
  }

  private readClipboardSnapshot(): ClipboardSnapshot | null {
    const formats = clipboard.availableFormats();
    const text = clipboard.readText() || this.readFilePaths(formats);
    const html = clipboard.readHTML() || "";
    const rtf = clipboard.readRTF() || "";
    const image = clipboard.readImage();
    const imageDataUrl = image.isEmpty() ? undefined : image.toDataURL();

    if (!text && !html && !rtf && !imageDataUrl) return null;

    const signature = this.createPayloadSignature(
      text,
      html,
      rtf,
      imageDataUrl || "",
    );
    const byteSize =
      Buffer.byteLength(text, "utf8") +
      Buffer.byteLength(html, "utf8") +
      Buffer.byteLength(rtf, "utf8") +
      Buffer.byteLength(imageDataUrl || "", "utf8");

    return {
      text,
      html,
      rtf,
      imageDataUrl,
      formats,
      signature,
      byteSize,
      secret: this.isSecretClipboard(formats),
    };
  }

  private readFilePaths(formats: string[]) {
    const candidates = formats.filter((format) => {
      const lower = format.toLocaleLowerCase();
      return (
        lower.includes("filename") ||
        lower === "text/uri-list" ||
        lower === "public.file-url"
      );
    });

    for (const format of candidates) {
      try {
        const buffer = clipboard.readBuffer(format);
        const lower = format.toLocaleLowerCase();
        const decoded = lower.includes("filename")
          ? buffer.toString("utf16le")
          : buffer.toString("utf8");
        const paths = decoded
          .split(/[\r\n\0]+/)
          .map((value) => value.trim())
          .filter((value) => value && !value.startsWith("#"))
          .map((value) => {
            if (!value.toLocaleLowerCase().startsWith("file://")) return value;
            try {
              const url = new URL(value);
              let pathname = decodeURIComponent(url.pathname);
              if (/^\/[a-z]:/i.test(pathname)) pathname = pathname.slice(1);
              return pathname.replace(/\//g, path.sep);
            } catch {
              return value;
            }
          });
        if (paths.length) return paths.join("\n");
      } catch {
        // Try the next file-list clipboard format.
      }
    }
    return "";
  }

  private isSecretClipboard(formats: string[]) {
    const normalized = formats.map((format) => format.toLocaleLowerCase());
    if (
      normalized.some(
        (format) =>
          format === "clipboard viewer ignore" ||
          format === "excludeclipboardcontentfrommonitorprocessing" ||
          format === "application/x-nspasteboard-concealed-type" ||
          format === "x-kde-passwordmanagerhint",
      )
    ) {
      return true;
    }

    return formats.some((format) => {
      const lower = format.toLocaleLowerCase();
      if (
        lower !== "canincludeinclipboardhistory" &&
        lower !== "canuploadtocloudclipboard"
      ) {
        return false;
      }
      try {
        const buffer = clipboard.readBuffer(format);
        const printable = buffer.toString("utf8").replace(/\0/g, "").trim();
        return printable === "0" || buffer.every((value) => value === 0);
      } catch {
        return false;
      }
    });
  }

  private createSignature(value: string) {
    return crypto.createHash("sha256").update(value).digest("hex");
  }

  private createPayloadSignature(
    text: string,
    html: string,
    rtf: string,
    imageDataUrl: string,
  ) {
    return this.createSignature([text, html, rtf, imageDataUrl].join("\u0000"));
  }

  private purgeExpired(emit: boolean) {
    const before = this.state.items.length;
    this.state.items = purgeAndLimitHistory(
      this.state.items,
      this.state.settings.maxItems,
      Date.now(),
      this.state.settings.maxHistorySizeMb * 1024 * 1024,
    );
    if (this.state.items.length !== before) {
      this.save();
      if (emit) this.emitChange();
    }
  }

  private load() {
    if (!fs.existsSync(this.storageFile)) return;
    try {
      const raw = fs.readFileSync(this.storageFile);
      const header = raw.subarray(0, ENCRYPTED_HEADER.length);
      let json: string;
      if (header.equals(ENCRYPTED_HEADER)) {
        json = safeStorage.decryptString(raw.subarray(ENCRYPTED_HEADER.length));
      } else if (header.equals(PLAIN_HEADER)) {
        json = raw.subarray(PLAIN_HEADER.length).toString("utf8");
      } else {
        json = raw.toString("utf8");
      }

      const parsed = JSON.parse(json) as Partial<PersistedClipboardHistory>;
      this.state = {
        version: 1,
        items: Array.isArray(parsed.items) ? parsed.items : [],
        rules: Array.isArray(parsed.rules) ? parsed.rules : [],
        settings: {
          ...DEFAULT_CLIPBOARD_HISTORY_SETTINGS,
          ...(parsed.settings || {}),
        },
      };
    } catch (error) {
      console.error("Failed to load clipboard history:", error);
    }
  }

  private save() {
    try {
      const json = JSON.stringify(this.state);
      const encrypted = safeStorage.isEncryptionAvailable();
      const body = encrypted
        ? safeStorage.encryptString(json)
        : Buffer.from(json, "utf8");
      const header = encrypted ? ENCRYPTED_HEADER : PLAIN_HEADER;
      const temporary = `${this.storageFile}.tmp`;
      fs.writeFileSync(temporary, Buffer.concat([header, body]));
      fs.copyFileSync(temporary, this.storageFile);
      fs.unlinkSync(temporary);
    } catch (error) {
      console.error("Failed to save clipboard history:", error);
    }
  }

  private saveAndEmit() {
    this.save();
    this.emitChange();
  }

  private emitChange() {
    const state = this.getState();
    for (const listener of this.listeners) listener(state);
  }
}
