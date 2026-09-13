import { formatDistanceToNow } from "date-fns";
import {
  Check,
  Clipboard,
  ClipboardCopy,
  Code2,
  ExternalLink,
  File,
  FileText,
  Folder,
  Image as ImageIcon,
  Link2,
  LockKeyhole,
  Pause,
  Pin,
  PinOff,
  Play,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useClipboardHistory } from "../../hooks/use-clipboard-history";
import { cn } from "../../lib/utils";
import { ClipboardDetector } from "../../services/clipboard/clipboard-detector";
import { ToolRecommender } from "../../services/clipboard/tool-recommender";
import {
  ClipboardHistoryItem,
  ClipboardHistoryItemType,
  ClipboardHistoryRule,
  ClipboardHistorySettings,
} from "../../types/clipboard-history";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ScrollArea } from "../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";

const TYPE_LABELS: Record<ClipboardHistoryItemType, string> = {
  text: "Text",
  code: "Code",
  url: "Link",
  html: "Text",
  image: "Image",
  files: "Files",
};

const TYPE_ICONS: Record<ClipboardHistoryItemType, React.ElementType> = {
  text: FileText,
  code: Code2,
  url: Link2,
  html: FileText,
  image: ImageIcon,
  files: File,
};

const FILTERS: Array<{
  value: "all" | ClipboardHistoryItemType;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "text", label: "Text" },
  { value: "code", label: "Code" },
  { value: "url", label: "Links" },
  { value: "image", label: "Images" },
  { value: "files", label: "Files" },
];

function itemPreview(item: ClipboardHistoryItem) {
  if (item.text.trim()) return item.text.replace(/\s+/g, " ").trim();
  if (item.html)
    return item.html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  if (item.imageDataUrl) return "Copied image";
  return "Clipboard item";
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function expiryLabel(expiresAt: number | null) {
  if (!expiresAt) return "Never expires";
  return `Expires ${formatDistanceToNow(new Date(expiresAt), { addSuffix: true })}`;
}

function keyboardEventToAccelerator(
  event: React.KeyboardEvent<HTMLInputElement>,
) {
  if (["Control", "Shift", "Alt", "Meta"].includes(event.key)) return null;

  const modifiers: string[] = [];
  if (event.ctrlKey || event.metaKey) modifiers.push("CommandOrControl");
  if (event.altKey) modifiers.push("Alt");
  if (event.shiftKey) modifiers.push("Shift");

  const aliases: Record<string, string> = {
    " ": "Space",
    ArrowUp: "Up",
    ArrowDown: "Down",
    ArrowLeft: "Left",
    ArrowRight: "Right",
    Escape: "Esc",
    "+": "Plus",
  };
  const key =
    aliases[event.key] ||
    (event.key.length === 1 ? event.key.toUpperCase() : event.key);

  return [...modifiers, key].join("+");
}

function HistoryItemRow({
  item,
  selected,
  onSelect,
  onCopy,
}: {
  item: ClipboardHistoryItem;
  selected: boolean;
  onSelect: () => void;
  onCopy: () => void;
}) {
  const Icon = TYPE_ICONS[item.type];
  return (
    <div
      className={cn(
        "group relative w-full min-w-0 overflow-hidden rounded-lg border transition-colors",
        selected
          ? "border-primary bg-primary/8 shadow-sm"
          : "border-transparent hover:border-border hover:bg-muted/60",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        onDoubleClick={onCopy}
        className="block w-full min-w-0 p-3 pr-12 text-left"
        title="Select item; double-click to copy"
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-0.5 rounded-md bg-muted p-1.5 text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {TYPE_LABELS[item.type]}
              </span>
              {item.secret && (
                <LockKeyhole className="h-3 w-3 text-amber-500" />
              )}
              {item.pinned && <Pin className="h-3 w-3 text-primary" />}
              {item.expiresAt && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              )}
            </div>
            <p className="mt-1 line-clamp-2 break-all text-sm leading-5">
              {itemPreview(item)}
            </p>
            <div className="mt-2 flex min-w-0 items-center gap-2 overflow-hidden text-[10px] text-muted-foreground">
              <span className="shrink-0">
                {formatDistanceToNow(new Date(item.createdAt), {
                  addSuffix: true,
                })}
              </span>
              {item.collection !== "Clipboard" && (
                <span className="truncate">· {item.collection}</span>
              )}
              {item.tags.length > 0 && (
                <span className="truncate">
                  · {item.tags.slice(0, 2).join(", ")}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={onCopy}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground opacity-70 transition-colors hover:bg-background hover:text-foreground hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Copy item"
        title="Copy item"
      >
        <ClipboardCopy className="h-4 w-4" />
      </button>
    </div>
  );
}

function ItemDetail({
  item,
  quickWindow,
  onCopy,
  onDelete,
  onUpdate,
  onOpenTool,
}: {
  item: ClipboardHistoryItem | null;
  quickWindow: boolean;
  onCopy: (item: ClipboardHistoryItem) => void;
  onDelete: (item: ClipboardHistoryItem) => void;
  onUpdate: (
    item: ClipboardHistoryItem,
    patch: Partial<ClipboardHistoryItem>,
  ) => void;
  onOpenTool: (item: ClipboardHistoryItem, route: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [tags, setTags] = useState("");
  const [collection, setCollection] = useState("Clipboard");
  const recommendedTools = useMemo(() => {
    if (!item?.text.trim()) return [];
    const detection = ClipboardDetector.detectContentType(item.text);
    return ToolRecommender.getRecommendedTools(
      detection.type,
      detection.confidence,
    ).slice(0, 3);
  }, [item?.id, item?.text]);

  useEffect(() => {
    setEditing(false);
    setDraft(item?.text || "");
    setTags(item?.tags.join(", ") || "");
    setCollection(item?.collection || "Clipboard");
  }, [item?.id]);

  if (!item) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center text-muted-foreground">
        <Clipboard className="mb-3 h-10 w-10 opacity-25" />
        <p className="text-sm">Select an item to preview it</p>
      </div>
    );
  }

  const saveMetadata = () => {
    onUpdate(item, {
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      collection: collection.trim() || "Clipboard",
    });
  };

  const saveEdit = () => {
    onUpdate(item, { text: draft });
    setEditing(false);
  };

  const setExpiry = (value: string) => {
    const minutes: Record<string, number> = {
      "1h": 60,
      "1d": 1440,
      "3d": 4320,
      "7d": 10080,
      "30d": 43200,
    };
    onUpdate(item, {
      expiresAt:
        value === "never" ? null : Date.now() + minutes[value] * 60_000,
    });
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <div
        className={cn(
          "flex min-w-0 items-center justify-between gap-2 border-b px-4",
          quickWindow ? "py-2" : "py-3",
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Badge variant="secondary">{TYPE_LABELS[item.type]}</Badge>
          {item.secret && (
            <Badge variant="outline" className="gap-1 text-amber-600">
              <LockKeyhole className="h-3 w-3" /> Secret
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            className="h-8 w-8 p-0"
            variant="ghost"
            title={item.pinned ? "Unpin" : "Pin"}
            onClick={() => onUpdate(item, { pinned: !item.pinned })}
          >
            {item.pinned ? <PinOff /> : <Pin />}
          </Button>
          <Button
            size="sm"
            className="h-8 w-8 p-0"
            variant="ghost"
            title="Delete"
            onClick={() => onDelete(item)}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          quickWindow ? "gap-3 p-3" : "gap-4 p-4",
        )}
      >
        {item.imageDataUrl ? (
          <ScrollArea
            className={cn(
              "min-h-0 min-w-0 rounded-lg border",
              quickWindow ? "h-32 shrink-0" : "flex-1 max-h-72",
            )}
          >
            <div className="flex min-h-48 min-w-0 items-center justify-center bg-[linear-gradient(45deg,hsl(var(--muted))_25%,transparent_25%),linear-gradient(-45deg,hsl(var(--muted))_25%,transparent_25%),linear-gradient(45deg,transparent_75%,hsl(var(--muted))_75%),linear-gradient(-45deg,transparent_75%,hsl(var(--muted))_75%)] bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] p-3">
              <img
                src={item.imageDataUrl}
                alt="Clipboard preview"
                className="max-h-[360px] max-w-full rounded object-contain shadow"
              />
            </div>
          </ScrollArea>
        ) : editing ? (
          <div
            className={cn(
              "flex min-h-0 flex-col gap-2",
              quickWindow ? "h-40 shrink-0" : "flex-1",
            )}
          >
            <Textarea
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-h-0 flex-1 resize-none font-mono text-sm"
            />
            <div className="flex shrink-0 justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={saveEdit}>
                <Check className="h-3.5 w-3.5" /> Save
              </Button>
            </div>
          </div>
        ) : (
          <ScrollArea
            className={cn(
              "min-h-0 min-w-0 rounded-lg border bg-muted/20",
              quickWindow ? "h-32 shrink-0" : "flex-1 max-h-72",
            )}
          >
            <button
              type="button"
              onDoubleClick={() => setEditing(true)}
              className={cn(
                "block min-h-full w-full min-w-0 max-w-full whitespace-pre-wrap break-words [overflow-wrap:anywhere] p-4 text-left text-sm leading-6",
                item.type === "code" && "font-mono",
              )}
              title="Double-click to edit"
            >
              {item.text || itemPreview(item)}
            </button>
          </ScrollArea>
        )}

        {!item.imageDataUrl && !editing && (
          <div className="shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              Edit text
            </Button>
          </div>
        )}

        <div className="grid shrink-0 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label
              htmlFor="clipboard-collection"
              className="flex items-center gap-1.5 text-xs"
            >
              <Folder className="h-3.5 w-3.5" /> Collection
            </Label>
            <Input
              id="clipboard-collection"
              value={collection}
              onChange={(event) => setCollection(event.target.value)}
              onBlur={saveMetadata}
              onKeyDown={(event) => event.key === "Enter" && saveMetadata()}
              className="h-8"
            />
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="clipboard-tags"
              className="flex items-center gap-1.5 text-xs"
            >
              <Tag className="h-3.5 w-3.5" /> Tags
            </Label>
            <Input
              id="clipboard-tags"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              onBlur={saveMetadata}
              onKeyDown={(event) => event.key === "Enter" && saveMetadata()}
              placeholder="work, important"
              className="h-8"
            />
          </div>
        </div>

        <div className="shrink-0 rounded-lg border p-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{expiryLabel(item.expiresAt)}</span>
            <Select onValueChange={setExpiry}>
              <SelectTrigger className="h-7 w-36 text-xs">
                <SelectValue placeholder="Change expiry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="1h">In 1 hour</SelectItem>
                <SelectItem value="1d">In 1 day</SelectItem>
                <SelectItem value="3d">In 3 days</SelectItem>
                <SelectItem value="7d">In 7 days</SelectItem>
                <SelectItem value="30d">In 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-2 flex min-w-0 flex-wrap gap-x-4 gap-y-1 [overflow-wrap:anywhere]">
            <span>{formatBytes(item.byteSize)}</span>
            <span>{item.collection}</span>
            <span>{new Date(item.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {recommendedTools.length > 0 && (
          <div className="shrink-0 space-y-2">
            <Label className="text-xs">Open with DevKitHub</Label>
            <div className="flex flex-wrap gap-2">
              {recommendedTools.map((tool) => (
                <Button
                  key={tool.id}
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenTool(item, tool.url)}
                >
                  <tool.icon className="h-3.5 w-3.5" /> {tool.title}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={cn("border-t", quickWindow ? "p-2" : "p-3")}>
        <Button className="w-full" onClick={() => onCopy(item)}>
          <ClipboardCopy className="h-4 w-4" /> Copy to clipboard
        </Button>
      </div>
    </div>
  );
}

interface RuleDraft {
  id?: string;
  name: string;
  pattern: string;
  matchType: "contains" | "regex";
  action: "ignore" | "expire";
  expiresAfterMinutes: number;
  expiryUnit: "minutes" | "hours" | "days";
  caseSensitive: boolean;
  enabled: boolean;
}

const EMPTY_RULE: RuleDraft = {
  name: "",
  pattern: "",
  matchType: "contains",
  action: "ignore",
  expiresAfterMinutes: 1440,
  expiryUnit: "days",
  caseSensitive: false,
  enabled: true,
};

function ClipboardSettingsDialog({
  open,
  onOpenChange,
  settings,
  rules,
  shortcutError,
  onSettings,
  onRule,
  onDeleteRule,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ClipboardHistorySettings;
  rules: ClipboardHistoryRule[];
  shortcutError?: string;
  onSettings: (patch: Partial<ClipboardHistorySettings>) => Promise<void>;
  onRule: (rule: RuleDraft) => Promise<void>;
  onDeleteRule: (id: string) => Promise<void>;
}) {
  const [shortcut, setShortcut] = useState(settings.shortcut);
  const [draft, setDraft] = useState<RuleDraft>(EMPTY_RULE);
  const [ruleError, setRuleError] = useState("");

  useEffect(() => setShortcut(settings.shortcut), [settings.shortcut]);

  const saveRule = async () => {
    if (!draft.name.trim() || !draft.pattern) {
      setRuleError("Name and match value are required.");
      return;
    }
    if (draft.matchType === "regex") {
      try {
        new RegExp(draft.pattern, draft.caseSensitive ? "" : "i");
      } catch {
        setRuleError("The regular expression is invalid.");
        return;
      }
    }
    if (draft.action === "expire" && draft.expiresAfterMinutes <= 0) {
      setRuleError("Expiration must be greater than zero.");
      return;
    }
    setRuleError("");
    await onRule(draft);
    setDraft(EMPTY_RULE);
  };

  const editRule = (rule: ClipboardHistoryRule) => {
    setDraft({
      id: rule.id,
      name: rule.name,
      pattern: rule.pattern,
      matchType: rule.matchType,
      action: rule.action,
      expiresAfterMinutes: rule.expiresAfterMinutes || 1440,
      expiryUnit:
        rule.expiresAfterMinutes && rule.expiresAfterMinutes % 1440 === 0
          ? "days"
          : rule.expiresAfterMinutes && rule.expiresAfterMinutes % 60 === 0
            ? "hours"
            : "minutes",
      caseSensitive: rule.caseSensitive,
      enabled: rule.enabled,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          void window.electron.clipboardHistory.endShortcutCapture();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="h-[min(88vh,760px)] max-w-3xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Clipboard history settings</DialogTitle>
          <DialogDescription>
            Control capture, retention, the quick-window shortcut and
            private-content rules.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 pr-3">
          <div className="space-y-6 pr-1">
            <section className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label>Capture clipboard changes</Label>
                  <p className="text-xs text-muted-foreground">
                    Runs locally while DevKitHub is open.
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(enabled) => void onSettings({ enabled })}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label>Quick-window shortcut</Label>
                  <p className="text-xs text-muted-foreground">
                    Opens an independent clipboard window.
                  </p>
                </div>
                <Switch
                  checked={settings.shortcutEnabled}
                  onCheckedChange={(shortcutEnabled) =>
                    void onSettings({ shortcutEnabled })
                  }
                />
              </div>
              {settings.shortcutEnabled && (
                <div className="space-y-1.5 pl-2">
                  <Label htmlFor="history-shortcut" className="text-xs">
                    Electron accelerator
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="history-shortcut"
                      value={shortcut}
                      readOnly
                      onPointerDown={() =>
                        void window.electron.clipboardHistory.beginShortcutCapture()
                      }
                      onFocus={(event) => {
                        event.currentTarget.select();
                        void window.electron.clipboardHistory.beginShortcutCapture();
                      }}
                      onBlur={() =>
                        void window.electron.clipboardHistory.endShortcutCapture()
                      }
                      onKeyDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        const accelerator = keyboardEventToAccelerator(event);
                        if (accelerator) setShortcut(accelerator);
                      }}
                      className="h-8"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void onSettings({ shortcut })}
                    >
                      Apply
                    </Button>
                  </div>
                  {shortcutError && (
                    <p className="text-xs text-destructive">{shortcutError}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Focus this field and press the shortcut you want to use.
                  </p>
                </div>
              )}
            </section>

            <section className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Store content marked as
                    secret
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Password managers can mark a clipboard value as private.
                    Keep it, or ignore it completely.
                  </p>
                </div>
                <Switch
                  checked={settings.storeSecretContent}
                  onCheckedChange={(storeSecretContent) =>
                    void onSettings({ storeSecretContent })
                  }
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {settings.storeSecretContent && (
                  <div className="space-y-1.5">
                    <Label htmlFor="secret-days" className="text-xs">
                      Secret retention in days
                    </Label>
                    <Input
                      id="secret-days"
                      type="number"
                      min="0"
                      defaultValue={settings.secretRetentionDays}
                      onBlur={(event) =>
                        void onSettings({
                          secretRetentionDays: Number(event.target.value),
                        })
                      }
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Use 0 to keep secret items indefinitely.
                    </p>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="default-days" className="text-xs">
                    Default retention in days
                  </Label>
                  <Input
                    id="default-days"
                    type="number"
                    min="0"
                    defaultValue={settings.defaultRetentionDays}
                    onBlur={(event) =>
                      void onSettings({
                        defaultRetentionDays: Number(event.target.value),
                      })
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Use 0 to keep ordinary items indefinitely.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="max-items" className="text-xs">
                    Maximum items
                  </Label>
                  <Input
                    id="max-items"
                    type="number"
                    min="10"
                    defaultValue={settings.maxItems}
                    onBlur={(event) =>
                      void onSettings({ maxItems: Number(event.target.value) })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="max-size" className="text-xs">
                    Maximum item size (MB)
                  </Label>
                  <Input
                    id="max-size"
                    type="number"
                    min="0.1"
                    step="0.1"
                    defaultValue={settings.maxItemSizeMb}
                    onBlur={(event) =>
                      void onSettings({
                        maxItemSizeMb: Number(event.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="max-history-size" className="text-xs">
                    Maximum history size (MB)
                  </Label>
                  <Input
                    id="max-history-size"
                    type="number"
                    min="10"
                    defaultValue={settings.maxHistorySizeMb}
                    onBlur={(event) =>
                      void onSettings({
                        maxHistorySizeMb: Number(event.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-lg border p-4">
              <div>
                <Label>Content rules</Label>
                <p className="text-xs text-muted-foreground">
                  Match new copies by simple text or a regular expression, then
                  skip the item or give it a shorter lifetime.
                </p>
              </div>

              {rules.length > 0 && (
                <div className="space-y-2">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center gap-3 rounded-md border px-3 py-2"
                    >
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) =>
                          void onRule({
                            ...rule,
                            expiresAfterMinutes:
                              rule.expiresAfterMinutes || 1440,
                            expiryUnit:
                              rule.expiresAfterMinutes &&
                              rule.expiresAfterMinutes % 1440 === 0
                                ? "days"
                                : rule.expiresAfterMinutes &&
                                    rule.expiresAfterMinutes % 60 === 0
                                  ? "hours"
                                  : "minutes",
                            enabled,
                          })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => editRule(rule)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate text-sm font-medium">
                          {rule.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {rule.matchType}: {rule.pattern} ·{" "}
                          {rule.action === "ignore"
                            ? "do not store"
                            : `expire in ${rule.expiresAfterMinutes && rule.expiresAfterMinutes % 1440 === 0 ? `${rule.expiresAfterMinutes / 1440} day(s)` : rule.expiresAfterMinutes && rule.expiresAfterMinutes % 60 === 0 ? `${rule.expiresAfterMinutes / 60} hour(s)` : `${rule.expiresAfterMinutes} minute(s)`}`}
                        </p>
                      </button>
                      <Button
                        size="sm"
                        className="h-8 w-8 p-0"
                        variant="ghost"
                        onClick={() => void onDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 rounded-md bg-muted/35 p-3">
                <div className="flex items-center justify-between">
                  <Label>{draft.id ? "Edit rule" : "Add rule"}</Label>
                  {draft.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDraft(EMPTY_RULE)}
                    >
                      Cancel edit
                    </Button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    value={draft.name}
                    onChange={(event) =>
                      setDraft({ ...draft, name: event.target.value })
                    }
                    placeholder="Rule name"
                  />
                  <Input
                    value={draft.pattern}
                    onChange={(event) =>
                      setDraft({ ...draft, pattern: event.target.value })
                    }
                    placeholder={
                      draft.matchType === "regex"
                        ? "e.g. xvideos\\.com"
                        : "e.g. xvideos.com"
                    }
                  />
                  <Select
                    value={draft.matchType}
                    onValueChange={(matchType: "contains" | "regex") =>
                      setDraft({ ...draft, matchType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contains">Contains text</SelectItem>
                      <SelectItem value="regex">Regular expression</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={draft.action}
                    onValueChange={(action: "ignore" | "expire") =>
                      setDraft({ ...draft, action })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ignore">Do not store</SelectItem>
                      <SelectItem value="expire">Store, then expire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {draft.action === "expire" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="rule-expiry" className="text-xs">
                      Expire after
                    </Label>
                    <div className="grid grid-cols-[1fr_140px] gap-2">
                      <Input
                        id="rule-expiry"
                        type="number"
                        min="1"
                        value={
                          draft.expiresAfterMinutes /
                          (draft.expiryUnit === "days"
                            ? 1440
                            : draft.expiryUnit === "hours"
                              ? 60
                              : 1)
                        }
                        onChange={(event) => {
                          const factor =
                            draft.expiryUnit === "days"
                              ? 1440
                              : draft.expiryUnit === "hours"
                                ? 60
                                : 1;
                          setDraft({
                            ...draft,
                            expiresAfterMinutes:
                              Number(event.target.value) * factor,
                          });
                        }}
                      />
                      <Select
                        value={draft.expiryUnit}
                        onValueChange={(
                          expiryUnit: "minutes" | "hours" | "days",
                        ) => {
                          const oldFactor =
                            draft.expiryUnit === "days"
                              ? 1440
                              : draft.expiryUnit === "hours"
                                ? 60
                                : 1;
                          const nextFactor =
                            expiryUnit === "days"
                              ? 1440
                              : expiryUnit === "hours"
                                ? 60
                                : 1;
                          const displayedValue =
                            draft.expiresAfterMinutes / oldFactor;
                          setDraft({
                            ...draft,
                            expiryUnit,
                            expiresAfterMinutes: displayedValue * nextFactor,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minutes">Minutes</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="days">Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={draft.caseSensitive}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          caseSensitive: event.target.checked,
                        })
                      }
                    />
                    Case sensitive
                  </label>
                  <Button size="sm" onClick={() => void saveRule()}>
                    <Plus className="h-3.5 w-3.5" />{" "}
                    {draft.id ? "Save rule" : "Add rule"}
                  </Button>
                </div>
                {ruleError && (
                  <p className="text-xs text-destructive">{ruleError}</p>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function ClipboardHistoryView({
  quickWindow = false,
}: {
  quickWindow?: boolean;
}) {
  const { state, setState, loading, error } = useClipboardHistory();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | ClipboardHistoryItemType
  >("all");
  const [collectionFilter, setCollectionFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [newItemOpen, setNewItemOpen] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const collections = useMemo(() => {
    if (!state) return [];
    return Array.from(
      new Set(state.items.map((item) => item.collection)),
    ).sort();
  }, [state]);

  const items = useMemo(() => {
    if (!state) return [];
    const needle = query.toLocaleLowerCase().trim();
    return state.items.filter((item) => {
      const visibleType = item.type === "html" ? "text" : item.type;
      if (typeFilter !== "all" && visibleType !== typeFilter) return false;
      if (collectionFilter !== "all" && item.collection !== collectionFilter)
        return false;
      if (!needle) return true;
      return [
        item.text,
        item.html || "",
        item.collection,
        item.tags.join(" "),
        item.type,
      ]
        .join("\n")
        .toLocaleLowerCase()
        .includes(needle);
    });
  }, [state, query, typeFilter, collectionFilter]);

  useEffect(() => {
    if (items.length === 0) setSelectedId(null);
    else if (!selectedId || !items.some((item) => item.id === selectedId)) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId]);

  useEffect(() => {
    if (quickWindow) setTimeout(() => searchRef.current?.focus(), 50);
  }, [quickWindow]);

  const selectedItem = items.find((item) => item.id === selectedId) || null;

  const copyItem = async (item: ClipboardHistoryItem) => {
    await window.electron.clipboardHistory.copyItem(item.id, quickWindow);
  };

  const updateItem = async (
    item: ClipboardHistoryItem,
    patch: Partial<ClipboardHistoryItem>,
  ) => {
    const next = await window.electron.clipboardHistory.updateItem(item.id, {
      text: patch.text,
      pinned: patch.pinned,
      tags: patch.tags,
      collection: patch.collection,
      expiresAt: patch.expiresAt,
    });
    setState(next);
  };

  const deleteItem = async (item: ClipboardHistoryItem) => {
    const next = await window.electron.clipboardHistory.deleteItem(item.id);
    setState(next);
  };

  const openWithTool = async (item: ClipboardHistoryItem, route: string) => {
    await window.electron.clipboardHistory.openWithTool(item.id, route);
  };

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const inTextarea = target?.tagName === "TEXTAREA";
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "n") {
        event.preventDefault();
        setNewItemOpen(true);
        return;
      }
      if (event.key === "Escape" && quickWindow) {
        void window.electron.clipboardHistory.closeQuickWindow();
        return;
      }
      if (inTextarea || items.length === 0) return;
      const index = Math.max(
        0,
        items.findIndex((item) => item.id === selectedId),
      );
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const offset = event.key === "ArrowDown" ? 1 : -1;
        const next = Math.min(items.length - 1, Math.max(0, index + offset));
        setSelectedId(items[next].id);
      } else if (event.key === "Enter" && selectedItem) {
        event.preventDefault();
        void copyItem(selectedItem);
      } else if (
        event.key === "Delete" &&
        selectedItem &&
        target?.tagName !== "INPUT"
      ) {
        event.preventDefault();
        void deleteItem(selectedItem);
      }
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [quickWindow, items, selectedId, selectedItem]);

  if (loading || !state) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading clipboard history…
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-background",
        quickWindow && "fixed inset-0",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-start justify-between gap-4",
          quickWindow ? "px-3 pb-2 pt-3" : "px-6 pb-4 pt-6",
        )}
        style={
          quickWindow
            ? ({ WebkitAppRegion: "drag" } as React.CSSProperties)
            : undefined
        }
      >
        <div>
          <h1
            className={cn(
              "flex items-center gap-2 font-bold",
              quickWindow ? "text-xl" : "text-2xl",
            )}
          >
            <Clipboard className="h-6 w-6 text-primary" /> Clipboard History
          </h1>
          <p
            className={cn(
              "mt-1 text-muted-foreground",
              quickWindow ? "text-xs" : "text-sm",
            )}
          >
            Search, organize and restore anything you copied.
          </p>
        </div>
        <div
          className="flex gap-2"
          style={
            quickWindow
              ? ({ WebkitAppRegion: "no-drag" } as React.CSSProperties)
              : undefined
          }
        >
          <Button
            variant="outline"
            size={quickWindow ? "icon" : "default"}
            className={quickWindow ? "h-8 w-8" : undefined}
            aria-label={quickWindow ? "New item" : undefined}
            title={quickWindow ? "New item" : undefined}
            onClick={() => setNewItemOpen(true)}
          >
            <Plus /> {!quickWindow && "New item"}
          </Button>
          <Button
            variant="outline"
            size={quickWindow ? "icon" : "default"}
            className={quickWindow ? "h-8 w-8" : undefined}
            aria-label={
              quickWindow ? (state.monitoring ? "Pause" : "Resume") : undefined
            }
            title={
              quickWindow ? (state.monitoring ? "Pause" : "Resume") : undefined
            }
            onClick={() =>
              void window.electron.clipboardHistory
                .updateSettings({ enabled: !state.settings.enabled })
                .then(setState)
            }
          >
            {state.monitoring ? <Pause /> : <Play />}
            {!quickWindow && (state.monitoring ? "Pause" : "Resume")}
          </Button>
          <Button
            variant="outline"
            size={quickWindow ? "icon" : "default"}
            className={quickWindow ? "h-8 w-8" : undefined}
            aria-label={quickWindow ? "Settings" : undefined}
            title={quickWindow ? "Settings" : undefined}
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 /> {!quickWindow && "Settings"}
          </Button>
          {quickWindow && (
            <Button
              size="icon"
              className="h-8 w-8"
              variant="outline"
              aria-label="Open full view"
              title="Open full view"
              onClick={() =>
                void window.electron.clipboardHistory.openFullHistory()
              }
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          {quickWindow && (
            <Button
              size="icon"
              className="-mr-1 h-8 w-8"
              variant="ghost"
              aria-label="Close"
              title="Close"
              onClick={() =>
                void window.electron.clipboardHistory.closeQuickWindow()
              }
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex shrink-0 flex-wrap items-center gap-2 border-b",
          quickWindow ? "px-3 py-2" : "px-6 py-3",
        )}
      >
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search clipboard history…"
            className="pl-9"
          />
        </div>
        <Select value={collectionFilter} onValueChange={setCollectionFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Collection" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All collections</SelectItem>
            {collections.map((collection) => (
              <SelectItem key={collection} value={collection}>
                {collection}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 overflow-x-auto">
          {FILTERS.map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              variant={typeFilter === filter.value ? "secondary" : "ghost"}
              onClick={() => setTypeFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {!state.monitoring && (
        <div className="flex items-center justify-between border-b bg-amber-500/10 px-4 py-2 text-xs text-amber-700 dark:text-amber-300">
          <span>Clipboard monitoring is paused.</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              void window.electron.clipboardHistory
                .updateSettings({ enabled: true })
                .then(setState)
            }
          >
            Resume
          </Button>
        </div>
      )}

      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(260px,38%)_minmax(0,1fr)] overflow-hidden">
        <div className="min-h-0 min-w-0 overflow-hidden border-r">
          <ScrollArea className="h-full min-h-0 min-w-0">
            <div className="min-w-0 space-y-1 p-2">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-16 text-center text-muted-foreground">
                  <Search className="mb-3 h-9 w-9 opacity-25" />
                  <p className="text-sm font-medium">
                    No clipboard items found
                  </p>
                  <p className="mt-1 text-xs">
                    Copy something or adjust the filters.
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <HistoryItemRow
                    key={item.id}
                    item={item}
                    selected={selectedId === item.id}
                    onSelect={() => setSelectedId(item.id)}
                    onCopy={() => void copyItem(item)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
        <div className="min-h-0 min-w-0 overflow-hidden">
          <ItemDetail
            item={selectedItem}
            quickWindow={quickWindow}
            onCopy={(item) => void copyItem(item)}
            onDelete={(item) => void deleteItem(item)}
            onUpdate={(item, patch) => void updateItem(item, patch)}
            onOpenTool={(item, route) => void openWithTool(item, route)}
          />
        </div>
      </div>

      <div
        className={cn(
          "flex shrink-0 items-center justify-between border-t text-xs text-muted-foreground",
          quickWindow ? "px-3 py-1.5" : "px-6 py-2",
        )}
      >
        <span>
          {state.items.length} saved · {items.length} shown · stored locally
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive"
          onClick={() => setClearOpen(true)}
        >
          <Trash2 className="h-3.5 w-3.5" /> Clear unpinned
        </Button>
      </div>

      <ClipboardSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={state.settings}
        rules={state.rules}
        shortcutError={state.shortcutError}
        onSettings={async (patch) =>
          setState(await window.electron.clipboardHistory.updateSettings(patch))
        }
        onRule={async (rule) =>
          setState(await window.electron.clipboardHistory.upsertRule(rule))
        }
        onDeleteRule={async (id) =>
          setState(await window.electron.clipboardHistory.deleteRule(id))
        }
      />

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear clipboard history?</DialogTitle>
            <DialogDescription>
              Pinned items will be kept. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setClearOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                void window.electron.clipboardHistory
                  .clear(false)
                  .then((next) => {
                    setState(next);
                    setClearOpen(false);
                  })
              }
            >
              Clear unpinned items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newItemOpen} onOpenChange={setNewItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New clipboard item</DialogTitle>
            <DialogDescription>
              Create a reusable note or snippet without replacing the current
              system clipboard.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            value={newItemText}
            onChange={(event) => setNewItemText(event.target.value)}
            placeholder="Type or paste content…"
            className="min-h-48 font-mono text-sm"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewItemOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!newItemText.trim()}
              onClick={() =>
                void window.electron.clipboardHistory
                  .addTextItem(newItemText)
                  .then((next) => {
                    setState(next);
                    setNewItemText("");
                    setNewItemOpen(false);
                  })
              }
            >
              Add item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
