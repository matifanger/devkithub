/**
 * Smart File Renamer
 *
 * Renames and organizes real desktop files with editable previews, reusable naming
 * presets, local AI (Ollama or LM Studio), document extraction and vision-based OCR.
 * Includes ordered folder rules, persistent watch folders, text search, exact
 * duplicate comparison, CSV export and a durable history with protected undo.
 *
 * Add files, choose a preset, configure a local model if needed, analyze, then
 * review and apply selected suggestions. Metadata presets work without AI.
 * Watch folders run while DevKitHub is open; automatic mode only applies complete,
 * high-confidence suggestions. Use History to undo unchanged files safely.
 * Original extensions are retained and existing destinations are never replaced.
 */
import React, { useEffect, useState } from "react";
import {
  Check,
  Copy,
  FileEdit,
  Files,
  FolderOpen,
  History,
  Loader2,
  Plus,
  Search,
  Settings,
  Sparkles,
  Undo2,
  X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { ToolClearButton, ToolCopyButton } from "../components/tool-actions";
import {
  ToolPageContainer,
  ToolPageHeader,
  ToolErrorBanner,
} from "../components/tool-page-layout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { useToolState } from "../hooks/useToolState";
import { DEFAULT_RENAMER_SETTINGS } from "../types/smart-file-renamer";
import type {
  DuplicateGroup,
  NamingPreset,
  OrganizeRule,
  RenameItem,
  RenamerSettings,
  RenamerSnapshot,
} from "../types/smart-file-renamer";

const selectClass =
  "h-10 rounded-md border border-input bg-background px-3 text-sm w-full";
const tabs = [
  "Library",
  "Presets",
  "Rules",
  "Watch folders",
  "Duplicates",
  "History",
  "Settings",
] as const;
type Tab = (typeof tabs)[number];
const empty: RenamerSnapshot = {
  settings: DEFAULT_RENAMER_SETTINGS,
  items: [],
  history: [],
  watches: [],
  busy: false,
  progress: "",
};
const viewDefaults = {
  tab: "Library" as Tab,
  query: "",
  filter: "all",
  edits: {} as Record<string, { name: string; folder: string }>,
};
const bytes = (size: number) =>
  size < 1024
    ? `${size} B`
    : size < 1024 ** 2
      ? `${(size / 1024).toFixed(1)} KB`
      : `${(size / 1024 ** 2).toFixed(1)} MB`;
const csvCell = (value: unknown) =>
  `"${String(value ?? "")
    .replace(/^[=+@\-\t\r]/, (char) => `'${char}`)
    .replace(/"/g, '""')}"`;
export function renamerCsv(rows: Record<string, unknown>[]): string {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return [
    columns.map(csvCell).join(","),
    ...rows.map((row) =>
      columns.map((column) => csvCell(row[column])).join(","),
    ),
  ].join("\r\n");
}
function downloadCsv(name: string, rows: Record<string, unknown>[]) {
  const url = URL.createObjectURL(
    new Blob(["\ufeff", renamerCsv(rows)], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function SmartFileRenamerPage() {
  const api = window.smartRenamer;
  const [snapshot, setSnapshot] = useState(empty);
  const [config, setConfig] = useState<RenamerSettings>(
    structuredClone(DEFAULT_RENAMER_SETTINGS),
  );
  const [view, setView, clearView] = useToolState(
    "smart-file-renamer",
    viewDefaults,
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [groups, setGroups] = useState<DuplicateGroup[] | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<
    { id: string; name: string; folder: string }[] | null
  >(null);
  const busy = pending || snapshot.busy;
  const dirty = JSON.stringify(config) !== JSON.stringify(snapshot.settings);

  useEffect(() => {
    if (!api) {
      setLoaded(true);
      return;
    }
    let mounted = true;
    const unsubscribe = api.onChange((state) => {
      if (mounted) setSnapshot(state);
    });
    api
      .snapshot()
      .then((state) => {
        if (!mounted) return;
        setSnapshot(state);
        setConfig(structuredClone(state.settings));
        setLoaded(true);
      })
      .catch((failure) => {
        if (mounted) {
          setError(String(failure));
          setLoaded(true);
        }
      });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [api]);

  const run = async (operation: () => Promise<unknown>) => {
    setPending(true);
    setError("");
    setNotice("");
    try {
      await operation();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      setPending(false);
    }
  };
  const update = async (operation: Promise<RenamerSnapshot>) => {
    const state = await operation;
    setSnapshot(state);
    setGroups(null);
    return state;
  };
  const saveConfig = () =>
    run(async () => {
      const state = await update(api.configure(config));
      setConfig(structuredClone(state.settings));
      setView((previous) => ({ ...previous, edits: {} }));
      setNotice("Settings saved. Analyze files to refresh their previews.");
    });
  const items = snapshot.items.filter(
    (item) =>
      (view.filter === "all" || item.status === view.filter) &&
      `${item.name} ${item.proposedName} ${item.path} ${item.content} ${Object.values(item.fields).join(" ")}`
        .toLowerCase()
        .includes(view.query.toLowerCase()),
  );
  const selectedItems = snapshot.items.filter(
    (item) => selected.includes(item.id) && item.status !== "done",
  );
  const editable = items.filter((item) => item.status !== "done");
  const activePreset =
    config.presets.find((preset) => preset.id === config.activePreset) ||
    config.presets[0];
  const editFor = (item: RenameItem) =>
    view.edits[item.id] || { name: item.proposedName, folder: item.folder };
  const setEdit = (
    item: RenameItem,
    changes: Partial<{ name: string; folder: string }>,
  ) =>
    setView((previous) => ({
      ...previous,
      edits: { ...previous.edits, [item.id]: { ...editFor(item), ...changes } },
    }));
  const changePreset = (changes: Partial<NamingPreset>) =>
    setConfig((previous) => ({
      ...previous,
      presets: previous.presets.map((preset) =>
        preset.id === activePreset.id ? { ...preset, ...changes } : preset,
      ),
    }));
  const changeRule = (id: string, changes: Partial<OrganizeRule>) =>
    setConfig((previous) => ({
      ...previous,
      rules: previous.rules.map((rule) =>
        rule.id === id ? { ...rule, ...changes } : rule,
      ),
    }));
  const readyCount = snapshot.items.filter(
    (item) => item.status === "ready",
  ).length;
  const reviewCount = snapshot.items.filter(
    (item) => item.status === "review" || item.status === "error",
  ).length;

  return (
    <ToolPageContainer>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <ToolPageHeader
          title="Smart File Renamer"
          description="Turn scattered files into a searchable, organized library. Preview every change, keep control."
        />
        <span className="rounded-full border border-teal-500/25 bg-teal-500/10 px-3 py-1.5 text-xs text-teal-600 dark:text-teal-400">
          Local files · Local AI
        </span>
      </div>
      {!api && (
        <div className="rounded-lg border p-4 text-sm">
          Open this tool in the DevKitHub desktop app to select and rename
          files.
        </div>
      )}
      <ToolErrorBanner error={error} />
      {notice && (
        <div
          role="status"
          className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-3 text-sm"
        >
          {notice}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Files in library", snapshot.items.length],
          ["Ready to rename", readyCount],
          ["Need review", reviewCount],
          [
            "Watching folders",
            snapshot.watches.filter((watch) => watch.enabled).length,
          ],
        ].map(([label, count]) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{count}</p>
          </div>
        ))}
      </div>
      <div
        className="flex flex-wrap gap-1 border-b pb-2"
        role="tablist"
        aria-label="File renamer sections"
      >
        {tabs.map((tab) => (
          <Button
            key={tab}
            role="tab"
            aria-selected={view.tab === tab}
            variant={view.tab === tab ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView((previous) => ({ ...previous, tab }))}
          >
            {tab}
          </Button>
        ))}
      </div>
      {busy && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            <span className="truncate">{snapshot.progress || "Working…"}</span>
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              api?.cancel().catch((failure) => setError(String(failure)))
            }
          >
            Cancel
          </Button>
        </div>
      )}
      {dirty && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
          <span>You have unsaved preset, rule or AI settings.</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfig(structuredClone(snapshot.settings))}
            >
              Discard
            </Button>
            <Button size="sm" disabled={busy || !api} onClick={saveConfig}>
              Save settings
            </Button>
          </div>
        </div>
      )}

      {view.tab === "Library" && (
        <section className="space-y-4" aria-label="File library">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              disabled={!api || busy || !loaded}
              onClick={() => run(() => update(api.pick("files")))}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add files
            </Button>
            <Button
              variant="outline"
              disabled={!api || busy}
              onClick={() => run(() => update(api.pick("folder")))}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Add folder
            </Button>
            <div className="w-full sm:w-60">
              <label className="sr-only" htmlFor="library-preset">
                Naming preset
              </label>
              <select
                id="library-preset"
                className={selectClass}
                value={config.activePreset}
                disabled={busy}
                onChange={(event) =>
                  setConfig((previous) => ({
                    ...previous,
                    activePreset: event.target.value,
                  }))
                }
              >
                {config.presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="secondary"
              disabled={
                !api ||
                busy ||
                dirty ||
                !snapshot.items.some((item) => item.status !== "done")
              }
              onClick={() =>
                run(async () => {
                  const ids = selectedItems.length
                    ? selectedItems.map((item) => item.id)
                    : snapshot.items
                        .filter((item) => item.status !== "done")
                        .map((item) => item.id);
                  setView((previous) => ({
                    ...previous,
                    edits: Object.fromEntries(
                      Object.entries(previous.edits).filter(
                        ([id]) => !ids.includes(id),
                      ),
                    ),
                  }));
                  await update(api.analyze(ids));
                })
              }
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze {selectedItems.length ? "selected" : "files"}
            </Button>
            <Button
              disabled={!api || busy || dirty || !selectedItems.length}
              onClick={() =>
                setConfirm(
                  selectedItems.map((item) => ({
                    id: item.id,
                    ...editFor(item),
                  })),
                )
              }
            >
              <Check className="mr-2 h-4 w-4" />
              Apply selected ({selectedItems.length})
            </Button>
            <ToolClearButton
              disabled={!api || busy || !snapshot.items.length}
              onClear={() =>
                run(async () => {
                  await update(api.clear());
                  setSelected([]);
                  await clearView();
                })
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {snapshot.settings.provider === "off"
              ? "AI is off. Use Dated archive for metadata-only names, or connect a local model in Settings."
              : `${snapshot.settings.provider === "ollama" ? "Ollama" : "Local compatible server"} · ${snapshot.settings.model || "No model selected"}`}{" "}
            · Clear removes library entries; files and undo history are kept.
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-48 flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="Search files and extracted content"
                className="pl-9"
                placeholder="Search filenames, extracted text or metadata…"
                value={view.query}
                onChange={(event) =>
                  setView((previous) => ({
                    ...previous,
                    query: event.target.value,
                  }))
                }
              />
            </div>
            <select
              aria-label="Filter by status"
              className={`${selectClass} sm:w-40`}
              value={view.filter}
              onChange={(event) =>
                setView((previous) => ({
                  ...previous,
                  filter: event.target.value,
                }))
              }
            >
              {["all", "new", "ready", "review", "done", "error"].map(
                (status) => (
                  <option key={status} value={status}>
                    {status === "all" ? "All statuses" : status}
                  </option>
                ),
              )}
            </select>
            <Button
              variant="outline"
              disabled={!snapshot.items.length}
              onClick={() =>
                downloadCsv(
                  "file-renames.csv",
                  snapshot.items.map((item) => ({
                    ...item.fields,
                    original: item.path,
                    proposed: editFor(item).name,
                    folder: editFor(item).folder,
                    status: item.status,
                  })),
                )
              }
            >
              Export CSV
            </Button>
          </div>
          <div
            className="rounded-xl border bg-card"
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (!api || busy) return;
              const paths = Array.from(event.dataTransfer.files)
                .map((file) => (file as File & { path?: string }).path)
                .filter(Boolean) as string[];
              if (paths.length) void run(() => update(api.add(paths)));
              else
                setError(
                  "Could not read dropped file paths. Use Add files instead.",
                );
            }}
          >
            {!snapshot.items.length ? (
              <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                <div className="mb-4 rounded-2xl bg-teal-500/10 p-4">
                  <Files className="h-8 w-8 text-teal-500" />
                </div>
                <h2 className="font-semibold">A clearer name for every file</h2>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Drop files or a folder here, then analyze their content. Your
                  original files stay in place until you apply a preview.
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  PDFs · Images · Office documents · Text · Metadata for any
                  file
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 border-b px-4 py-3 text-xs text-muted-foreground">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      aria-label="Select all visible files"
                      disabled={busy || !editable.length}
                      checked={
                        !!editable.length &&
                        editable.every((item) => selected.includes(item.id))
                      }
                      onChange={(event) =>
                        setSelected((previous) =>
                          event.target.checked
                            ? [
                                ...new Set([
                                  ...previous,
                                  ...editable.map((item) => item.id),
                                ]),
                              ]
                            : previous.filter(
                                (id) =>
                                  !editable.some((item) => item.id === id),
                              ),
                        )
                      }
                    />
                    {items.length} files shown
                  </label>
                  <span>Original → Preview</span>
                </div>
                {!items.length && (
                  <p className="p-8 text-center text-sm text-muted-foreground">
                    No files match your search.
                  </p>
                )}
                <div className="divide-y">
                  {items.map((item) => (
                    <article key={item.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <input
                          className="mt-3"
                          type="checkbox"
                          aria-label={`Select ${item.name}`}
                          checked={
                            selected.includes(item.id) && item.status !== "done"
                          }
                          disabled={busy || item.status === "done"}
                          onChange={(event) =>
                            setSelected((previous) =>
                              event.target.checked
                                ? [...previous, item.id]
                                : previous.filter((id) => id !== item.id),
                            )
                          }
                        />
                        <div className="grid min-w-0 flex-1 gap-3 lg:grid-cols-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <FileEdit className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <span
                                className="truncate text-sm font-medium"
                                title={item.name}
                              >
                                {item.name}
                              </span>
                              <span
                                className={`shrink-0 rounded px-2 py-0.5 text-[11px] ${item.status === "error" ? "bg-red-500/10 text-red-500" : item.status === "review" ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"}`}
                              >
                                {item.status}
                              </span>
                            </div>
                            <p
                              className="mt-1 truncate text-xs text-muted-foreground"
                              title={item.path}
                            >
                              {item.path}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {bytes(item.size)} ·{" "}
                              {new Date(item.modified).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-3">
                            <Input
                              className="sm:col-span-2"
                              aria-label={`New name for ${item.name}`}
                              value={editFor(item).name}
                              disabled={busy || item.status === "done"}
                              onChange={(event) =>
                                setEdit(item, { name: event.target.value })
                              }
                            />
                            <Input
                              aria-label={`Subfolder for ${item.name}`}
                              placeholder="Subfolder (optional)"
                              value={editFor(item).folder}
                              disabled={busy || item.status === "done"}
                              onChange={(event) =>
                                setEdit(item, { folder: event.target.value })
                              }
                            />
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Show ${item.name} in folder`}
                          disabled={!api}
                          onClick={() => run(() => api.reveal(item.id))}
                        >
                          <FolderOpen className="h-4 w-4" />
                        </Button>
                      </div>
                      {item.message && (
                        <p className="mt-2 pl-6 text-xs text-muted-foreground">
                          {item.message}
                        </p>
                      )}
                      {(item.content ||
                        Object.keys(item.fields).length > 0) && (
                        <details className="mt-2 pl-6 text-xs text-muted-foreground">
                          <summary className="cursor-pointer">
                            Extracted content & fields
                          </summary>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(item.fields).map(
                              ([field, value]) => (
                                <span
                                  key={field}
                                  className="rounded bg-muted px-2 py-1 break-all"
                                >
                                  {field}: {value || "—"}
                                </span>
                              ),
                            )}
                          </div>
                          {item.content && (
                            <>
                              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded bg-muted p-3">
                                {item.content}
                              </pre>
                              <ToolCopyButton
                                className="mt-2"
                                value={item.content}
                                label="Copy extracted text"
                              />
                            </>
                          )}
                        </details>
                      )}
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {view.tab === "Presets" && (
        <section className="grid gap-6 md:grid-cols-[240px_1fr]">
          <div className="space-y-2">
            {config.presets.map((preset) => (
              <Button
                className="w-full justify-start truncate"
                key={preset.id}
                variant={preset.id === activePreset.id ? "secondary" : "ghost"}
                onClick={() =>
                  setConfig((previous) => ({
                    ...previous,
                    activePreset: preset.id,
                  }))
                }
              >
                {preset.name}
              </Button>
            ))}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const preset = {
                  ...activePreset,
                  id: crypto.randomUUID(),
                  name: "New preset",
                };
                setConfig((previous) => ({
                  ...previous,
                  activePreset: preset.id,
                  presets: [...previous.presets, preset],
                }));
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New preset
            </Button>
          </div>
          <div className="space-y-4 rounded-xl border p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Naming preset</h2>
              <Button
                size="sm"
                variant="ghost"
                disabled={config.presets.length < 2}
                onClick={() =>
                  setConfig((previous) => {
                    const presets = previous.presets.filter(
                      (preset) => preset.id !== activePreset.id,
                    );
                    return {
                      ...previous,
                      presets,
                      activePreset: presets[0].id,
                    };
                  })
                }
              >
                Delete preset
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset name</Label>
              <Input
                id="preset-name"
                value={activePreset.name}
                onChange={(event) => changePreset({ name: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preset-pattern">Filename template</Label>
              <Input
                id="preset-pattern"
                className="font-mono"
                value={activePreset.pattern}
                onChange={(event) =>
                  changePreset({ pattern: event.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                The original extension is added automatically. Missing fields
                appear as “unknown” and always require review.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                "title",
                "date",
                "vendor",
                "amount",
                "type",
                "invoice",
                "original",
                "modified",
                "created",
                "parent",
                "year",
                "counter",
                "size",
              ].map((field) => (
                <Button
                  key={field}
                  size="sm"
                  variant="outline"
                  className="h-7 font-mono text-xs"
                  onClick={() =>
                    changePreset({
                      pattern: `${activePreset.pattern}{${field}}`,
                    })
                  }
                >{`{${field}}`}</Button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="preset-instructions">
                AI extraction instructions
              </Label>
              <Textarea
                id="preset-instructions"
                rows={5}
                value={activePreset.instructions}
                placeholder="Describe what to extract and how to name these files…"
                onChange={(event) =>
                  changePreset({ instructions: event.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Custom fields are supported: add {"{client}"} to the template
                and explain “client” here. Date refers to the document date;
                modified and created use file metadata.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="preset-case">Letter case</Label>
                <select
                  id="preset-case"
                  className={selectClass}
                  value={activePreset.letterCase}
                  onChange={(event) =>
                    changePreset({
                      letterCase: event.target
                        .value as NamingPreset["letterCase"],
                    })
                  }
                >
                  <option value="preserve">Preserve</option>
                  <option value="lower">lowercase</option>
                  <option value="upper">UPPERCASE</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preset-separator">
                  Spaces inside field values
                </Label>
                <select
                  id="preset-separator"
                  className={selectClass}
                  value={activePreset.separator}
                  onChange={(event) =>
                    changePreset({
                      separator: event.target
                        .value as NamingPreset["separator"],
                    })
                  }
                >
                  <option value=" ">Keep spaces</option>
                  <option value="-">Hyphens</option>
                  <option value="_">Underscores</option>
                </select>
              </div>
            </div>
            <Button disabled={busy || !api || !dirty} onClick={saveConfig}>
              Save preset
            </Button>
          </div>
        </section>
      )}

      {view.tab === "Rules" && (
        <section className="space-y-4">
          <div>
            <h2 className="font-semibold">Organize into folders</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The first matching rule wins. Matches ignore case. Destinations
              are subfolders of each file’s current folder.
            </p>
          </div>
          {config.rules.map((rule, index) => (
            <div
              key={rule.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border p-4"
            >
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  aria-label={`Enable rule ${index + 1}`}
                  checked={rule.enabled}
                  onChange={(event) =>
                    changeRule(rule.id, { enabled: event.target.checked })
                  }
                />
                {index + 1}.
              </label>
              <select
                aria-label={`Field for rule ${index + 1}`}
                className={`${selectClass} sm:w-36`}
                value={rule.field}
                onChange={(event) =>
                  changeRule(rule.id, {
                    field: event.target.value as OrganizeRule["field"],
                  })
                }
              >
                {["extension", "name", "content", "type", "vendor"].map(
                  (field) => (
                    <option key={field}>{field}</option>
                  ),
                )}
              </select>
              <Input
                aria-label={`Match for rule ${index + 1}`}
                className="min-w-40 flex-1"
                placeholder="Contains…"
                value={rule.contains}
                onChange={(event) =>
                  changeRule(rule.id, { contains: event.target.value })
                }
              />
              <span className="text-muted-foreground">→</span>
              <Input
                aria-label={`Folder for rule ${index + 1}`}
                className="min-w-40 flex-1"
                placeholder="Finance/Invoices"
                value={rule.folder}
                onChange={(event) =>
                  changeRule(rule.id, { folder: event.target.value })
                }
              />
              <Button
                variant="ghost"
                size="sm"
                disabled={index === 0}
                onClick={() =>
                  setConfig((previous) => {
                    const rules = [...previous.rules];
                    [rules[index - 1], rules[index]] = [
                      rules[index],
                      rules[index - 1],
                    ];
                    return { ...previous, rules };
                  })
                }
              >
                Move up
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Delete rule ${index + 1}`}
                onClick={() =>
                  setConfig((previous) => ({
                    ...previous,
                    rules: previous.rules.filter(
                      (entry) => entry.id !== rule.id,
                    ),
                  }))
                }
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {!config.rules.length && (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Keep invoices, screenshots and project files in their own folders.
              Add your first rule below.
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                setConfig((previous) => ({
                  ...previous,
                  rules: [
                    ...previous.rules,
                    {
                      id: crypto.randomUUID(),
                      field: "extension",
                      contains: "pdf",
                      folder: "Documents",
                      enabled: true,
                    },
                  ],
                }))
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add rule
            </Button>
            <Button disabled={!api || busy || !dirty} onClick={saveConfig}>
              Save rules
            </Button>
          </div>
        </section>
      )}

      {view.tab === "Watch folders" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">A home for incoming files</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                New or changed files are checked every 5 seconds while DevKitHub
                is running. Files must remain stable across two checks. Existing
                files are skipped when you first add a watch.
              </p>
            </div>
            <Button
              disabled={!api || busy || dirty}
              onClick={() => run(() => update(api.watch("add")))}
            >
              <Plus className="mr-2 h-4 w-4" />
              Watch a folder
            </Button>
          </div>
          {snapshot.watches.map((watch) => (
            <div key={watch.id} className="space-y-3 rounded-xl border p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="break-all text-sm font-medium">{watch.path}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() =>
                    run(() => update(api.watch("remove", { id: watch.id })))
                  }
                >
                  Remove
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-5">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={watch.enabled}
                    disabled={busy}
                    onChange={(event) =>
                      run(() =>
                        update(
                          api.watch("update", {
                            id: watch.id,
                            enabled: event.target.checked,
                          }),
                        ),
                      )
                    }
                  />
                  Enabled
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={watch.automatic}
                    disabled={busy}
                    onChange={(event) =>
                      run(() =>
                        update(
                          api.watch("update", {
                            id: watch.id,
                            automatic: event.target.checked,
                          }),
                        ),
                      )
                    }
                  />
                  Apply confident suggestions automatically
                </label>
                <select
                  aria-label={`Preset for ${watch.path}`}
                  className={`${selectClass} sm:w-64`}
                  value={watch.presetId}
                  disabled={busy}
                  onChange={(event) =>
                    run(() =>
                      update(
                        api.watch("update", {
                          id: watch.id,
                          presetId: event.target.value,
                        }),
                      ),
                    )
                  }
                >
                  {snapshot.settings.presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </div>
              {watch.error && (
                <p className="text-sm text-red-500">{watch.error}</p>
              )}
            </div>
          ))}
          {!snapshot.watches.length && (
            <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              No watched folders yet. Start with a downloads or scanner folder.
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Review mode is the default. In automatic mode, missing fields,
            extraction limits, errors and AI confidence below 90% stay in the
            library for review. Closing DevKitHub stops monitoring.
          </p>
        </section>
      )}

      {view.tab === "Duplicates" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">Exact duplicate finder</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Compares file sizes and SHA-256 hashes across your library.
                Review copies in their folders.
              </p>
            </div>
            <Button
              disabled={!api || busy || snapshot.items.length < 2}
              onClick={() => run(async () => setGroups(await api.duplicates()))}
            >
              <Copy className="mr-2 h-4 w-4" />
              Compare files
            </Button>
          </div>
          {groups === null ? (
            <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              Add files to the library, then compare their contents.
            </p>
          ) : groups.length === 0 ? (
            <p
              role="status"
              className="rounded-xl border p-8 text-center text-sm"
            >
              No exact duplicates found.
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.hash} className="rounded-xl border p-4">
                <h3 className="mb-3 text-sm font-semibold">
                  {group.paths.length} identical files ·{" "}
                  {bytes(group.size * (group.paths.length - 1))} in extra copies
                </h3>
                {group.paths.map((file) => (
                  <div
                    key={file}
                    className="flex items-center justify-between gap-3 py-1"
                  >
                    <span className="break-all text-sm">{file}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        run(() =>
                          api.reveal(
                            snapshot.items.find((item) => item.path === file)
                              .id,
                          ),
                        )
                      }
                    >
                      Show in folder
                    </Button>
                  </div>
                ))}
              </div>
            ))
          )}
          <p className="text-xs text-muted-foreground">
            Files are never deleted by this tool. Visually similar images with
            different contents are not exact duplicates.
          </p>
        </section>
      )}

      {view.tab === "History" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">Every rename, accounted for</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Undo checks file contents and refuses to overwrite an existing
                original path.
              </p>
            </div>
            <Button
              variant="outline"
              disabled={!snapshot.history.length}
              onClick={() =>
                downloadCsv(
                  "rename-history.csv",
                  snapshot.history.map((entry) => ({
                    date: entry.at,
                    from: entry.from,
                    to: entry.to,
                    status: entry.status,
                    error: entry.error,
                  })),
                )
              }
            >
              Export history
            </Button>
          </div>
          {!snapshot.history.length && (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <History className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Applied renames will appear here, including after a restart.
              </p>
            </div>
          )}
          {snapshot.history.map((entry) => (
            <article
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.at).toLocaleString()} · {entry.status}
                </p>
                <p className="mt-2 break-all text-sm">{entry.from}</p>
                <p className="mt-1 break-all text-sm text-teal-600 dark:text-teal-400">
                  → {entry.to}
                </p>
                {entry.error && (
                  <p className="mt-2 text-xs text-red-500">{entry.error}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={!api || busy || entry.status !== "applied"}
                onClick={() =>
                  run(async () => {
                    await update(api.undo(entry.id));
                    setView((previous) => ({ ...previous, edits: {} }));
                  })
                }
              >
                <Undo2 className="mr-2 h-4 w-4" />
                Undo
              </Button>
            </article>
          ))}
        </section>
      )}

      {view.tab === "Settings" && (
        <section className="max-w-3xl space-y-5 rounded-xl border p-5">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h2 className="font-semibold">Local intelligence, your choice</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Connect to Ollama or an LM Studio compatible server running on this
            computer. Document text and images go only to that local endpoint.
            Model downloads and your server’s configuration are managed
            separately.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ai-provider">AI provider</Label>
              <select
                id="ai-provider"
                className={selectClass}
                value={config.provider}
                onChange={(event) =>
                  setConfig((previous) => ({
                    ...previous,
                    provider: event.target.value as RenamerSettings["provider"],
                    endpoint:
                      event.target.value === "compatible"
                        ? "http://127.0.0.1:1234/v1"
                        : "http://127.0.0.1:11434",
                    model: "",
                  }))
                }
              >
                <option value="off">Off — metadata only</option>
                <option value="ollama">Ollama</option>
                <option value="compatible">
                  LM Studio / compatible local server
                </option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-language">Naming language</Label>
              <Input
                id="ai-language"
                value={config.language}
                onChange={(event) =>
                  setConfig((previous) => ({
                    ...previous,
                    language: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          {config.provider !== "off" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="ai-endpoint">Local server URL</Label>
                <Input
                  id="ai-endpoint"
                  value={config.endpoint}
                  onChange={(event) =>
                    setConfig((previous) => ({
                      ...previous,
                      endpoint: event.target.value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Ollama: http://127.0.0.1:11434 · LM Studio:
                  http://127.0.0.1:1234/v1
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-model">Model name</Label>
                <div className="flex gap-2">
                  <Input
                    id="ai-model"
                    list="renamer-models"
                    value={config.model}
                    placeholder="Enter an installed model name"
                    onChange={(event) =>
                      setConfig((previous) => ({
                        ...previous,
                        model: event.target.value,
                      }))
                    }
                  />
                  <datalist id="renamer-models">
                    {models.map((model) => (
                      <option key={model} value={model} />
                    ))}
                  </datalist>
                  <Button
                    variant="outline"
                    disabled={!api || busy || dirty}
                    onClick={() =>
                      run(async () => {
                        const available = await api.models();
                        setModels(available);
                        setNotice(
                          available.length
                            ? `Connected. ${available.length} models available; choose a model and save.`
                            : "Connected, but no models were returned. Load a model in your local server.",
                        );
                      })
                    }
                  >
                    Test connection
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Save the server settings first, test the connection, then
                  choose a model. Images and scanned PDFs require a vision
                  model.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={config.vision}
                  onChange={(event) =>
                    setConfig((previous) => ({
                      ...previous,
                      vision: event.target.checked,
                    }))
                  }
                />
                Analyze images and scanned PDFs with vision
              </label>
            </>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.recursive}
              onChange={(event) =>
                setConfig((previous) => ({
                  ...previous,
                  recursive: event.target.checked,
                }))
              }
            />
            Include subfolders when importing and watching folders
          </label>
          <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-xs text-muted-foreground">
            <p>
              Content analysis: files up to 40 MB; text up to 24,000 characters;
              PDF up to 10 pages with vision on up to 3 scanned pages;
              spreadsheets up to 5 sheets and 200 rows each. Truncated analysis
              always requires review.
            </p>
            <p>
              Library: up to 1,000 files. Extracted text, filenames and rename
              history are stored locally in the DevKitHub application data
              folder. Clear removes the library’s extracted content and keeps
              the undo history.
            </p>
            <p>
              Supported content includes PDF, PNG/JPEG/WebP/GIF/BMP/TIFF,
              DOCX/PPTX, XLS/XLSX/XLSB, ODT/ODS/ODP, EPUB and common text/code
              formats. Metadata naming works with other formats.
              Password-protected or unsupported documents report an error for
              review.
            </p>
          </div>
          <Button disabled={!api || busy || !dirty} onClick={saveConfig}>
            Save settings
          </Button>
        </section>
      )}

      <Dialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Apply {confirm?.length || 0} file changes?
            </DialogTitle>
            <DialogDescription>
              These changes affect real files. Existing destination files will
              never be replaced. You can undo unchanged files from History.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-72 space-y-3 overflow-auto">
            {confirm?.map((edit) => (
              <div key={edit.id} className="rounded border p-3 text-sm">
                <p className="break-all text-muted-foreground">
                  {snapshot.items.find((item) => item.id === edit.id)?.path}
                </p>
                <p className="mt-1 break-all">
                  → {edit.folder ? `${edit.folder}/` : ""}
                  {edit.name}
                </p>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Back to review
            </Button>
            <Button
              disabled={busy}
              onClick={() => {
                const edits = confirm;
                setConfirm(null);
                void run(async () => {
                  await update(api.apply(edits));
                  setSelected([]);
                  setView((previous) => ({ ...previous, edits: {} }));
                });
              }}
            >
              Apply changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ToolPageContainer>
  );
}
