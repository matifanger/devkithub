export type RenamerProvider = "off" | "ollama" | "compatible";
export interface NamingPreset {
  id: string;
  name: string;
  pattern: string;
  instructions: string;
  letterCase: "preserve" | "lower" | "upper";
  separator: " " | "-" | "_";
}
export interface OrganizeRule {
  id: string;
  field: "extension" | "name" | "content" | "type" | "vendor";
  contains: string;
  folder: string;
  enabled: boolean;
}
export interface RenamerSettings {
  provider: RenamerProvider;
  endpoint: string;
  model: string;
  language: string;
  vision: boolean;
  recursive: boolean;
  activePreset: string;
  presets: NamingPreset[];
  rules: OrganizeRule[];
}
export interface RenameItem {
  id: string;
  path: string;
  name: string;
  size: number;
  modified: number;
  fingerprint: string;
  proposedName: string;
  folder: string;
  content: string;
  fields: Record<string, string>;
  status: "new" | "ready" | "review" | "done" | "error";
  message: string;
}
export interface RenameHistory {
  id: string;
  undoOf?: string;
  from: string;
  to: string;
  hash: string;
  at: string;
  status: "pending" | "applied" | "undone" | "failed";
  error?: string;
}
export interface WatchFolder {
  id: string;
  path: string;
  enabled: boolean;
  automatic: boolean;
  presetId: string;
  error: string;
}
export interface RenamerSnapshot {
  settings: RenamerSettings;
  items: RenameItem[];
  history: RenameHistory[];
  watches: WatchFolder[];
  busy: boolean;
  progress: string;
}
export interface DuplicateGroup {
  hash: string;
  paths: string[];
  size: number;
}
export interface RenamerAPI {
  snapshot(): Promise<RenamerSnapshot>;
  pick(kind: "files" | "folder"): Promise<RenamerSnapshot>;
  add(paths: string[]): Promise<RenamerSnapshot>;
  configure(settings: RenamerSettings): Promise<RenamerSnapshot>;
  analyze(ids: string[]): Promise<RenamerSnapshot>;
  apply(
    edits: { id: string; name: string; folder: string }[],
  ): Promise<RenamerSnapshot>;
  undo(id: string): Promise<RenamerSnapshot>;
  clear(): Promise<RenamerSnapshot>;
  cancel(): Promise<void>;
  duplicates(): Promise<DuplicateGroup[]>;
  watch(
    action: "add" | "update" | "remove",
    value?: Partial<WatchFolder>,
  ): Promise<RenamerSnapshot>;
  reveal(id: string): Promise<void>;
  models(): Promise<string[]>;
  onChange(callback: (snapshot: RenamerSnapshot) => void): () => void;
}
declare global {
  interface Window {
    smartRenamer?: RenamerAPI;
  }
}

export const DEFAULT_RENAMER_SETTINGS: RenamerSettings = {
  provider: "off",
  endpoint: "http://127.0.0.1:11434",
  model: "",
  language: "English",
  vision: true,
  recursive: false,
  activePreset: "descriptive",
  presets: [
    {
      id: "descriptive",
      name: "Descriptive",
      pattern: "{title}",
      instructions:
        "Create a short, specific title based on the actual content.",
      letterCase: "preserve",
      separator: " ",
    },
    {
      id: "invoices",
      name: "Invoices & receipts",
      pattern: "{date}_{vendor}_{amount}",
      instructions:
        "Extract the document date, vendor, total with currency and invoice number. Never invent missing information.",
      letterCase: "preserve",
      separator: "_",
    },
    {
      id: "photos",
      name: "Photos & screenshots",
      pattern: "{title}",
      instructions:
        "Describe the visible subject in 3 to 6 words. Prefix screenshots with screenshot.",
      letterCase: "lower",
      separator: "-",
    },
    {
      id: "archive",
      name: "Dated archive (no AI needed)",
      pattern: "{modified}_{original}_{counter}",
      instructions: "",
      letterCase: "lower",
      separator: "-",
    },
  ],
  rules: [],
};
