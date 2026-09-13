export type ClipboardHistoryItemType =
  | "text"
  | "code"
  | "url"
  | "html"
  | "image"
  | "files";

export type ClipboardRuleMatchType = "contains" | "regex";
export type ClipboardRuleAction = "ignore" | "expire";

export interface ClipboardHistoryRule {
  id: string;
  name: string;
  enabled: boolean;
  matchType: ClipboardRuleMatchType;
  pattern: string;
  caseSensitive: boolean;
  action: ClipboardRuleAction;
  expiresAfterMinutes: number | null;
}

export interface ClipboardHistorySettings {
  enabled: boolean;
  shortcutEnabled: boolean;
  shortcut: string;
  storeSecretContent: boolean;
  secretRetentionDays: number;
  defaultRetentionDays: number;
  maxItems: number;
  maxItemSizeMb: number;
  maxHistorySizeMb: number;
  pollIntervalMs: number;
}

export interface ClipboardHistoryItem {
  id: string;
  type: ClipboardHistoryItemType;
  text: string;
  html?: string;
  rtf?: string;
  imageDataUrl?: string;
  formats: string[];
  signature: string;
  createdAt: number;
  updatedAt: number;
  lastCopiedAt?: number;
  expiresAt: number | null;
  pinned: boolean;
  tags: string[];
  collection: string;
  byteSize: number;
  secret: boolean;
}

export interface ClipboardHistoryState {
  version: 1;
  items: ClipboardHistoryItem[];
  rules: ClipboardHistoryRule[];
  settings: ClipboardHistorySettings;
  monitoring: boolean;
  shortcutError?: string;
}

export interface ClipboardRuleEvaluation {
  ignore: boolean;
  expiresAt: number | null;
  matchedRuleIds: string[];
}

export interface ClipboardItemUpdate {
  text?: string;
  pinned?: boolean;
  tags?: string[];
  collection?: string;
  expiresAt?: number | null;
}

export interface ClipboardHistoryApi {
  getState: () => Promise<ClipboardHistoryState>;
  updateSettings: (
    patch: Partial<ClipboardHistorySettings>,
  ) => Promise<ClipboardHistoryState>;
  upsertRule: (
    rule: Partial<ClipboardHistoryRule> &
      Pick<ClipboardHistoryRule, "name" | "pattern">,
  ) => Promise<ClipboardHistoryState>;
  addTextItem: (text: string) => Promise<ClipboardHistoryState>;
  deleteRule: (id: string) => Promise<ClipboardHistoryState>;
  copyItem: (id: string, closeQuickWindow?: boolean) => Promise<boolean>;
  updateItem: (
    id: string,
    patch: ClipboardItemUpdate,
  ) => Promise<ClipboardHistoryState>;
  deleteItem: (id: string) => Promise<ClipboardHistoryState>;
  clear: (includePinned?: boolean) => Promise<ClipboardHistoryState>;
  openQuickWindow: () => Promise<boolean>;
  closeQuickWindow: () => Promise<boolean>;
  openFullHistory: () => Promise<boolean>;
  openWithTool: (id: string, route: string) => Promise<boolean>;
  beginShortcutCapture: () => Promise<boolean>;
  endShortcutCapture: () => Promise<boolean>;
  onChanged: (callback: (state: ClipboardHistoryState) => void) => void;
  removeChangedListeners: () => void;
}
