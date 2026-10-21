import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowUpRight,
  CheckCircle2,
  FolderOpen,
  HardDrive,
  Loader2,
  Monitor,
  Power,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  ToolPageContainer,
  ToolPageHeader,
} from "../components/tool-page-layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import type {
  CleanupResult,
  CleanupScan,
  DiskScan,
  MaintenanceProgress,
  StartupEntry,
  SystemOverview,
} from "../types/maintenance";

export function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  const index = Math.min(4, Math.floor(Math.log(value) / Math.log(1024)));
  return `${(value / 1024 ** index).toLocaleString(undefined, { maximumFractionDigits: index ? 1 : 0 })} ${["B", "KB", "MB", "GB", "TB"][index]}`;
}
const tabs = [
  { id: "overview", label: "Overview", icon: Monitor },
  { id: "disk", label: "Disk space", icon: HardDrive },
  { id: "cleanup", label: "Temporary files", icon: Sparkles },
  { id: "startup", label: "Startup apps", icon: Power },
] as const;
type Tab = (typeof tabs)[number]["id"];
const panel = "rounded-xl border bg-card p-5 space-y-4";

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className={panel}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

export function PcMaintenancePage() {
  const api = window.electron?.maintenance;
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get("tab");
  const tab: Tab = tabs.some((item) => item.id === requestedTab)
    ? (requestedTab as Tab)
    : "overview";
  const [system, setSystem] = useState<SystemOverview | null>(null);
  const [disk, setDisk] = useState<DiskScan | null>(null);
  const [cleanup, setCleanup] = useState<CleanupScan | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [cleaned, setCleaned] = useState<CleanupResult | null>(null);
  const [startup, setStartup] = useState<StartupEntry[] | null>(null);
  const [busy, setBusy] = useState("");
  const [progress, setProgress] = useState<MaintenanceProgress | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [diskView, setDiskView] = useState<"items" | "largest">("items");
  const [sort, setSort] = useState<"size" | "name">("size");
  const [startupFilter, setStartupFilter] = useState("all");
  const [stopping, setStopping] = useState(false);
  const mounted = useRef(true);
  const running = useRef(false);
  const windows = system?.platform === "win32";

  useEffect(() => {
    mounted.current = true;
    if (!api) return;
    api
      .overview()
      .then((value) => {
        if (mounted.current) setSystem(value);
      })
      .catch((err) => {
        if (mounted.current) setError(String(err.message || err));
      });
    const unsubscribe = api.onProgress((value) => {
      if (mounted.current) setProgress(value);
    });
    return () => {
      mounted.current = false;
      unsubscribe();
      if (running.current) void api.cancel().catch(() => undefined);
    };
  }, [api]);

  async function run(label: string, task: () => Promise<void>) {
    if (running.current) return;
    running.current = true;
    setBusy(label);
    setError("");
    setProgress(null);
    setStopping(false);
    try {
      await task();
    } catch (err) {
      if (mounted.current)
        setError(
          err instanceof Error
            ? err.message.replace(
                /^Error invoking remote method '[^']+': (Error: )?/,
                "",
              )
            : String(err),
        );
    } finally {
      running.current = false;
      if (mounted.current) {
        setBusy("");
        setProgress(null);
        setStopping(false);
      }
    }
  }
  function navigate(next: Tab) {
    if (busy) return;
    setParams(next === "overview" ? {} : { tab: next });
    setQuery("");
    setError("");
  }
  const scanDisk = () =>
    run("Analyzing folder", async () => {
      const value = await api.analyzeDisk();
      if (mounted.current && value) setDisk(value);
    });
  const scanCleanup = () =>
    run("Scanning temporary files", async () => {
      setCleanup(null);
      setSelected([]);
      setCleaned(null);
      const value = await api.scanCleanup();
      if (mounted.current) {
        setCleanup(value);
        setSelected([]);
      }
    });
  const loadStartup = () =>
    run("Reading startup apps", async () => {
      const value = await api.startupList();
      if (mounted.current) setStartup(value);
    });
  const selectedGroups =
    cleanup?.groups.filter((group) => selected.includes(group.id)) || [];
  const selectedBytes = selectedGroups.reduce(
    (sum, group) => sum + group.bytes,
    0,
  );
  const selectedFiles = selectedGroups.reduce(
    (sum, group) => sum + group.files,
    0,
  );
  const cancelled = disk?.cancelled || disk?.limited;
  const diskItems = (disk?.[diskView] || [])
    .filter((item) => item.path.toLowerCase().includes(query.toLowerCase()))
    .slice()
    .sort((a, b) =>
      sort === "size" ? b.bytes - a.bytes : a.name.localeCompare(b.name),
    );
  const startupItems = (startup || []).filter(
    (item) =>
      `${item.name} ${item.command} ${item.source}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (startupFilter === "all" ||
        (startupFilter === "registered" ? item.enabled : !item.enabled)),
  );

  if (!api)
    return (
      <ToolPageContainer>
        <ToolPageHeader
          title="PC Maintenance"
          description="Analyze storage, clean temporary files and manage startup apps."
        />
        <Notice>
          Open this tool in the DevKitHub desktop app to access your computer.
        </Notice>
      </ToolPageContainer>
    );

  return (
    <ToolPageContainer>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <ToolPageHeader
          title="PC Maintenance"
          description="More room for what matters. Take control of storage and startup."
        />
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Local tools · Your files stay on this PC
        </span>
      </div>
      <nav
        aria-label="Maintenance tools"
        className="flex flex-wrap gap-1 rounded-xl border bg-muted/30 p-1.5"
      >
        {tabs.map((item) => (
          <Button
            key={item.id}
            variant={tab === item.id ? "secondary" : "ghost"}
            className="gap-2"
            disabled={!!busy}
            aria-current={tab === item.id ? "page" : undefined}
            onClick={() => navigate(item.id)}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Button>
        ))}
      </nav>
      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <span className="break-words min-w-0">{error}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Dismiss error"
            onClick={() => setError("")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {busy && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="h-4 w-4 animate-spin" />
              {stopping ? "Stopping after the current file…" : busy}
            </span>
            {progress && (
              <Button
                size="sm"
                variant="outline"
                disabled={stopping}
                onClick={() => {
                  setStopping(true);
                  void api.cancel().catch((err) => {
                    setError(String(err));
                    setStopping(false);
                  });
                }}
              >
                Stop
              </Button>
            )}
          </div>
          {progress && (
            <>
              <p className="text-xs text-muted-foreground">
                {progress.visited.toLocaleString()} entries processed ·{" "}
                {formatBytes(progress.bytes)}{" "}
                {progress.job === "delete" ? "deleted" : "found"}
              </p>
              <p
                className="truncate text-xs text-muted-foreground"
                title={progress.current}
              >
                {progress.current}
              </p>
            </>
          )}
        </div>
      )}
      {system && !windows && (
        <Notice>
          Folder analysis is available on this platform. Temporary file cleanup
          and startup management currently require Windows.
        </Notice>
      )}
      {tab === "overview" && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric
              label="Storage used"
              value={
                system?.drives.length
                  ? formatBytes(
                      system.drives.reduce(
                        (n, drive) => n + drive.total - drive.free,
                        0,
                      ),
                    )
                  : "—"
              }
              detail={
                system?.drives.length
                  ? `Across ${system.drives.length} local drive(s)`
                  : "Local drive information"
              }
            />
            <Metric
              label="Cleanup available"
              value={
                cleanup && !cleanup.cancelled
                  ? formatBytes(
                      cleanup.groups.reduce((n, group) => n + group.bytes, 0),
                    )
                  : "Not scanned"
              }
              detail="Temporary files last modified at least 7 days ago"
            />
            <Metric
              label="Startup registrations"
              value={
                startup
                  ? String(startup.filter((item) => item.enabled).length)
                  : "Not checked"
              }
              detail="Run entries and Startup folders"
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {
                id: "disk" as Tab,
                icon: HardDrive,
                title: "Find what's taking space",
                description:
                  "Explore folder sizes and the largest files before deciding what to keep.",
                action: "Analyze a folder",
              },
              {
                id: "cleanup" as Tab,
                icon: Sparkles,
                title: "Clear old temporary files",
                description:
                  "Review eligible files by location, then choose which categories to clean.",
                action: "Review temporary files",
              },
              {
                id: "startup" as Tab,
                icon: Power,
                title: "Take control of startup",
                description:
                  "Disable personal startup registrations and restore them whenever you need.",
                action: "Manage startup apps",
              },
            ].map((item) => (
              <div key={item.id} className={`${panel} flex flex-col`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h2 className="font-semibold">{item.title}</h2>
                <p className="flex-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
                <Button
                  variant="outline"
                  className="justify-between"
                  disabled={!!busy || (item.id !== "disk" && !windows)}
                  onClick={() => navigate(item.id)}
                >
                  {item.action}
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          {system?.driveError && <Notice>{system.driveError}</Notice>}
          {!!system?.drives.length && (
            <section className={panel}>
              <h2 className="font-semibold">Your drives</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {system.drives.map((drive) => (
                  <div key={drive.name} className="space-y-2">
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="font-medium">{drive.name}</span>
                      <span className="text-muted-foreground">
                        {formatBytes(drive.free)} free of{" "}
                        {formatBytes(drive.total)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${drive.total ? Math.min(100, Math.max(0, ((drive.total - drive.free) / drive.total) * 100)) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {system && (
            <p className="text-xs text-muted-foreground">
              {system.hostname} · {windows ? "Windows" : system.platform}{" "}
              {system.release} · {formatBytes(system.totalMemory)} RAM ·{" "}
              {formatBytes(system.freeMemory)} currently available
            </p>
          )}
        </>
      )}
      {tab === "disk" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Disk Space Analyzer</h2>
              <p className="text-sm text-muted-foreground">
                Choose a folder or drive. Analysis does not change your files.
              </p>
            </div>
            <Button className="gap-2" disabled={!!busy} onClick={scanDisk}>
              <FolderOpen className="h-4 w-4" />
              Choose folder
            </Button>
          </div>
          {!disk && !busy && (
            <div className={`${panel} py-14 text-center`}>
              <HardDrive className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="font-medium">See where your storage goes</h3>
              <p className="text-sm text-muted-foreground">
                Start with Downloads, a project folder or an entire drive.
              </p>
            </div>
          )}
          {disk && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Metric
                  label={cancelled ? "Size scanned so far" : "Files size"}
                  value={formatBytes(disk.bytes)}
                  detail="Logical file sizes; not allocated disk space"
                />
                <Metric
                  label="Files found"
                  value={disk.files.toLocaleString()}
                  detail="Links are excluded"
                />
                <Metric
                  label="Entries skipped"
                  value={disk.skipped.toLocaleString()}
                  detail="Linked, inaccessible or unavailable entries"
                />
              </div>
              {cancelled && (
                <Notice>
                  {disk.cancelled
                    ? "Scan stopped."
                    : "Scan reached the 200,000-entry limit."}{" "}
                  These results are partial. Choose a smaller folder for a
                  complete scan.
                </Notice>
              )}
              <section className={panel}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="min-w-0 break-all text-sm font-medium">
                    {disk.root}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!!busy}
                    onClick={() =>
                      void run("Opening folder", () => api.reveal(disk.root))
                    }
                  >
                    Show in Explorer
                    <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={diskView === "items" ? "secondary" : "ghost"}
                    onClick={() => setDiskView("items")}
                  >
                    Folders & files
                  </Button>
                  <Button
                    size="sm"
                    variant={diskView === "largest" ? "secondary" : "ghost"}
                    onClick={() => setDiskView("largest")}
                  >
                    Largest files
                  </Button>
                  <Input
                    aria-label="Filter scanned files"
                    className="sm:ml-auto sm:max-w-xs"
                    placeholder="Filter by name or path…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  <select
                    aria-label="Sort scan results"
                    className="rounded-md border bg-background px-3 text-sm"
                    value={sort}
                    onChange={(event) =>
                      setSort(event.target.value as "size" | "name")
                    }
                  >
                    <option value="size">Largest first</option>
                    <option value="name">Name A–Z</option>
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">
                  {diskView === "items"
                    ? "Up to 500 largest immediate children, including nested file sizes."
                    : "Up to 100 largest files across all scanned subfolders."}{" "}
                  Scanned {new Date(disk.scannedAt).toLocaleString()}.
                </p>
                <div className="divide-y">
                  {diskItems.map((item) => (
                    <div
                      key={item.path}
                      className="flex items-center gap-3 py-3"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <p
                          className="truncate text-sm font-medium"
                          title={item.path}
                        >
                          {item.name}
                        </p>
                        <p
                          className="truncate text-xs text-muted-foreground"
                          title={item.path}
                        >
                          {diskView === "largest"
                            ? item.path
                            : item.kind === "folder"
                              ? `${item.files.toLocaleString()} files`
                              : "File"}
                        </p>
                        <div className="h-1 rounded-full bg-muted">
                          <div
                            className="h-1 rounded-full bg-primary/60"
                            style={{
                              width: `${disk.bytes ? (item.bytes / disk.bytes) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="whitespace-nowrap text-sm tabular-nums">
                        {formatBytes(item.bytes)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Show ${item.name} in Explorer`}
                        disabled={!!busy}
                        onClick={() =>
                          void run("Opening location", () =>
                            api.reveal(item.path),
                          )
                        }
                      >
                        <FolderOpen className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                {!diskItems.length && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {query
                      ? "No matching files in these results."
                      : "No regular files found in this scan."}
                  </p>
                )}
              </section>
            </>
          )}
        </>
      )}
      {tab === "cleanup" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Temporary File Cleaner</h2>
              <p className="text-sm text-muted-foreground">
                Review first. Clean only the locations you select.
              </p>
            </div>
            <Button
              className="gap-2"
              disabled={!!busy || !windows}
              onClick={scanCleanup}
            >
              <Search className="h-4 w-4" />
              Scan temporary files
            </Button>
          </div>
          <Notice>
            Scans user and Windows temporary folders for files last modified at
            least 7 days ago. Documents, downloads, browser history and
            passwords are not cleanup targets. Close other apps before deleting
            temporary files.
          </Notice>
          {cleaned && (
            <div
              role="status"
              className={`${panel} border-emerald-500/30 bg-emerald-500/5`}
            >
              <h3 className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                {cleaned.cancelled ? "Cleanup stopped" : "Cleanup finished"}
              </h3>
              <p className="text-sm">
                {cleaned.deleted.toLocaleString()} files deleted (
                {formatBytes(cleaned.bytes)}).{" "}
                {cleaned.skipped.toLocaleString()} skipped. Actual free space
                can differ from logical file sizes.
              </p>
              {cleaned.errors.length > 0 && (
                <details>
                  <summary className="cursor-pointer text-sm">
                    View skipped files (first {cleaned.errors.length})
                  </summary>
                  <ul className="mt-2 max-h-60 overflow-auto space-y-1 text-xs text-muted-foreground">
                    {cleaned.errors.map((message, i) => (
                      <li key={i} className="break-all">
                        {message}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <p className="text-xs text-muted-foreground">
                Run a new scan before cleaning again.
              </p>
            </div>
          )}
          {!cleanup && !cleaned && !busy && (
            <div className={`${panel} py-12 text-center`}>
              <Sparkles className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="font-medium">Find old temporary files</h3>
              <p className="text-sm text-muted-foreground">
                Nothing is deleted during the scan. Review the results before
                selecting a category.
              </p>
            </div>
          )}
          {cleanup && (
            <>
              {(cleanup.cancelled || cleanup.limited) && (
                <Notice>
                  {cleanup.cancelled
                    ? "Scan stopped. Run a complete scan before cleaning."
                    : "Scan reached the entry limit. Only files included in this preview can be cleaned."}
                </Notice>
              )}
              {cleanup.groups.map((group) => (
                <section key={group.id} className={panel}>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-primary"
                      checked={selected.includes(group.id)}
                      disabled={!!busy || !group.files || cleanup.cancelled}
                      onChange={(event) =>
                        setSelected((values) =>
                          event.target.checked
                            ? [...values, group.id]
                            : values.filter((id) => id !== group.id),
                        )
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{group.label}</span>
                      <span className="block break-all text-xs text-muted-foreground">
                        {group.root}
                      </span>
                    </span>
                    <span className="whitespace-nowrap text-right">
                      <span className="block font-semibold">
                        {formatBytes(group.bytes)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {group.files.toLocaleString()} files
                      </span>
                    </span>
                  </label>
                  {group.unavailable ? (
                    <p className="text-xs text-muted-foreground">
                      {group.unavailable}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {group.skipped.toLocaleString()} recent, linked or
                      inaccessible entries excluded.
                    </p>
                  )}
                  {!!group.samples.length && (
                    <details>
                      <summary className="cursor-pointer text-sm text-muted-foreground">
                        Preview files · first {group.samples.length} of{" "}
                        {group.files.toLocaleString()}
                      </summary>
                      <div className="mt-3 max-h-64 overflow-auto divide-y">
                        {group.samples.map((file) => (
                          <div
                            key={file.path}
                            className="flex gap-3 py-2 text-xs"
                          >
                            <span className="min-w-0 flex-1 break-all">
                              {file.path}
                            </span>
                            <span className="whitespace-nowrap text-muted-foreground">
                              {formatBytes(file.bytes)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </section>
              ))}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5">
                <div>
                  <p className="font-semibold">
                    {formatBytes(selectedBytes)} selected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedFiles.toLocaleString()} files · Permanent deletion
                    · Confirmation required
                  </p>
                </div>
                <Button
                  variant="destructive"
                  disabled={!!busy || !selectedFiles || cleanup.cancelled}
                  onClick={() =>
                    void run("Cleaning temporary files", async () => {
                      const result = await api.clean(cleanup.id, selected);
                      if (mounted.current && result) {
                        setCleaned(result);
                        setCleanup(null);
                        setSelected([]);
                        api
                          .overview()
                          .then((value) => {
                            if (mounted.current) setSystem(value);
                          })
                          .catch(() => undefined);
                      }
                    })
                  }
                >
                  Delete selected temporary files
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Scanned {new Date(cleanup.scannedAt).toLocaleString()}. The
                preview expires after 30 minutes. Every file is checked again
                before deletion.
              </p>
            </>
          )}
        </>
      )}
      {tab === "startup" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Startup Manager</h2>
              <p className="text-sm text-muted-foreground">
                Manage registrations for future sign-ins. Running apps stay
                open.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={!!busy || !windows}
                onClick={() =>
                  void run("Opening Windows settings", () =>
                    api.openStartupSettings(),
                  )
                }
              >
                Windows settings
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                className="gap-2"
                disabled={!!busy || !windows}
                onClick={loadStartup}
              >
                <RefreshCw className="h-4 w-4" />
                {startup ? "Refresh" : "Load startup apps"}
              </Button>
            </div>
          </div>
          <Notice>
            Includes Run registry entries and Startup folders. Personal entries
            can be disabled and restored here; shared entries are read-only.
            “Registered” means the entry exists: Windows may separately block it
            in Startup settings. Services, scheduled tasks and Store app startup
            tasks are not included.
          </Notice>
          {startup && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Metric
                  label="Registered"
                  value={String(startup.filter((item) => item.enabled).length)}
                  detail="Check Windows settings for effective startup state"
                />
                <Metric
                  label="Disabled here"
                  value={String(startup.filter((item) => !item.enabled).length)}
                  detail="Original registrations kept for restoration"
                />
                <Metric
                  label="Manageable"
                  value={String(
                    startup.filter((item) => item.manageable).length,
                  )}
                  detail="Personal entries available for changes"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Input
                  aria-label="Search startup apps"
                  className="sm:max-w-sm"
                  placeholder="Search apps, commands or locations…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <select
                  aria-label="Filter startup apps"
                  className="rounded-md border bg-background px-3 text-sm"
                  value={startupFilter}
                  onChange={(event) => setStartupFilter(event.target.value)}
                >
                  <option value="all">All entries</option>
                  <option value="registered">Registered</option>
                  <option value="disabled">Disabled here</option>
                </select>
              </div>
              <section className="overflow-hidden rounded-xl border divide-y">
                {startupItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center gap-4 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-all text-sm font-medium">
                          {item.name || "Unnamed entry"}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] ${item.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                        >
                          {item.enabled ? "Registered" : "Disabled here"}
                        </span>
                      </div>
                      <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                        {item.command}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.source}
                        {item.reason ? ` · ${item.reason}` : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!busy || !item.manageable}
                      aria-label={`${item.enabled ? "Disable" : "Restore"} ${item.name}`}
                      onClick={() =>
                        void run("Updating startup registration", async () => {
                          const rows = await api.startupToggle(
                            item.id,
                            !item.enabled,
                          );
                          if (mounted.current) setStartup(rows);
                        })
                      }
                    >
                      {item.manageable
                        ? item.enabled
                          ? "Disable"
                          : "Restore"
                        : "Read-only"}
                    </Button>
                  </div>
                ))}
                {!startupItems.length && (
                  <p className="p-8 text-center text-sm text-muted-foreground">
                    {query || startupFilter !== "all"
                      ? "No matching startup entries."
                      : "No startup registrations found in the supported locations."}
                  </p>
                )}
              </section>
            </>
          )}
          {!startup && !busy && (
            <div className={`${panel} py-12 text-center`}>
              <Power className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="font-medium">
                Decide what starts with your session
              </h3>
              <p className="text-sm text-muted-foreground">
                Load your startup registrations to review their names, commands
                and locations.
              </p>
            </div>
          )}
        </>
      )}
    </ToolPageContainer>
  );
}
