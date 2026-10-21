/**
 * Capture Library — persistent local screenshots and recordings in one place.
 * Search, filter, rename, preview, copy, pin, download or edit captures. Optional
 * Capture Cloud creates expiring, password-protected links and revokes them.
 * Configure your own server and upload token; nothing uploads automatically.
 */
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Cloud,
  Copy,
  Download,
  Edit,
  Image,
  Library,
  Pin,
  RefreshCw,
  Search,
  Share2,
  Trash2,
  Video,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  ToolPageContainer,
  ToolPageHeader,
  ToolErrorBanner,
} from "../components/tool-page-layout";
import { ToolClearButton, ToolCopyButton } from "../components/tool-actions";
import {
  CaptureNav,
  captureApi,
  errorMessage,
  Field,
  formatBytes,
  formatDuration,
  selectClass,
} from "../components/capture/shared";
import { CaptureAsset } from "../types/capture";
import { useToolState } from "../hooks/useToolState";

export function CaptureLibraryPage() {
  const [prefs, setPrefs, clearPrefs] = useToolState("capture-library", {
    search: "",
    filter: "all",
    days: 7,
  });
  const [assets, setAssets] = useState<CaptureAsset[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [preview, setPreview] = useState<CaptureAsset | null>(null),
    [sharing, setSharing] = useState<CaptureAsset | null>(null),
    [deleting, setDeleting] = useState<CaptureAsset | null>(null);
  const [server, setServer] = useState(""),
    [token, setToken] = useState(""),
    [configured, setConfigured] = useState(false),
    [password, setPassword] = useState(""),
    [rename, setRename] = useState("");
  const refresh = async () => {
    const [items, cloud] = await Promise.all([
      captureApi().list(),
      captureApi().cloudSettings(),
    ]);
    setAssets(items);
    setServer(cloud.url);
    setConfigured(cloud.configured);
  };
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void run(refresh);
  }, []);
  const shown = assets.filter(
    (a) =>
      (prefs.filter === "all" ||
        a.kind === prefs.filter ||
        (prefs.filter === "shared" && !!a.share)) &&
      a.name.toLowerCase().includes(prefs.search.toLowerCase()),
  );
  return (
    <ToolPageContainer>
      <CaptureNav />
      <ToolPageHeader
        title="Capture Library"
        description="Everything you captured, ready for the next conversation. Local by default; share when you choose."
      />
      <ToolErrorBanner error={error} />
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Search captures"
            placeholder="Find a capture…"
            className="pl-9"
            value={prefs.search}
            onChange={(e) =>
              setPrefs((p) => ({ ...p, search: e.target.value }))
            }
          />
        </div>
        <select
          aria-label="Filter captures"
          className={`${selectClass} w-40`}
          value={prefs.filter}
          onChange={(e) => setPrefs((p) => ({ ...p, filter: e.target.value }))}
        >
          <option value="all">All captures</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="shared">Shared links</option>
        </select>
        <Button variant="outline" disabled={busy} onClick={() => run(refresh)}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
        <ToolClearButton
          label="Clear filters"
          onClear={() => {
            void clearPrefs();
          }}
        />
      </div>
      <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
        <span>{assets.length} captures</span>
        <span>
          {formatBytes(assets.reduce((s, a) => s + a.size, 0))} stored locally
        </span>
        <span>
          {
            assets.filter((a) => a.share && a.share.expiresAt > Date.now())
              .length
          }{" "}
          active links
        </span>
      </div>
      {!shown.length && (
        <div className="rounded-2xl border border-dashed py-20 text-center">
          <Library className="mx-auto mb-4 h-12 w-12 text-primary/60" />
          <h2 className="text-xl font-semibold">
            {assets.length
              ? "No matching captures"
              : "Your best explanations belong here"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {assets.length
              ? "Try a different search or filter."
              : "Save an image from Screenshot Studio or record your first walkthrough."}
          </p>
          <Button asChild className="mt-6">
            <Link to="/screenshot-studio">Create a capture</Link>
          </Button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((a) => (
          <article
            key={a.id}
            className="overflow-hidden rounded-xl border bg-card transition hover:shadow-md"
          >
            <button
              aria-label={`Preview ${a.name}`}
              className="block h-44 w-full bg-muted/50"
              onClick={() => {
                setPreview(a);
                setRename(a.name);
              }}
            >
              {a.kind === "image" ? (
                <img
                  src={a.thumbnail || a.url}
                  alt={a.name}
                  loading="lazy"
                  className="h-full w-full object-contain p-3"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3">
                  <Video className="h-10 w-10 text-primary/70" />
                  <span className="font-mono text-sm">
                    {a.duration
                      ? formatDuration(a.duration)
                      : "Video recording"}
                  </span>
                </div>
              )}
            </button>
            <div className="space-y-3 p-4">
              <h2 className="truncate font-medium" title={a.name}>
                {a.name}
              </h2>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{a.extension.toUpperCase()}</span>
                <span>· {formatBytes(a.size)}</span>
                <span>· {new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
              {a.share && (
                <p className="text-xs text-primary">
                  {a.share.expiresAt > Date.now()
                    ? `Link expires ${new Date(a.share.expiresAt).toLocaleDateString()}`
                    : "Shared link expired"}
                </p>
              )}
              <div className="flex flex-wrap gap-1">
                <Button asChild size="sm" variant="outline">
                  <Link
                    to={`${a.kind === "image" ? "/screenshot-studio" : "/video-editor"}?asset=${a.id}`}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => run(() => captureApi().download(a.id))}
                  aria-label={`Download ${a.name}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    setSharing(a);
                    setPassword("");
                  }}
                  aria-label={`Share ${a.name}`}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                {a.kind === "image" && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => run(() => captureApi().copyImage(a.id))}
                      aria-label={`Copy ${a.name}`}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => run(() => captureApi().pin(a.id))}
                      aria-label={`Pin ${a.name}`}
                    >
                      <Pin className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setDeleting(a)}
                  aria-label={`Delete ${a.name}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <details className="rounded-xl border p-5">
        <summary className="cursor-pointer font-medium">
          <Cloud className="mr-2 inline h-4 w-4" />
          Capture Cloud · {configured ? "Connected" : "Set up your server"}
        </summary>
        <div className="mt-4 max-w-xl space-y-4">
          <p className="text-sm text-muted-foreground">
            Connect a DevKitHub Capture Cloud server to create share links. The
            upload token is stored in your operating system credential vault.
            Uploads are limited to 50 MB.
          </p>
          <Field label="Server URL">
            <Input
              placeholder="https://your-devkithub-server.com"
              value={server}
              onChange={(e) => setServer(e.target.value)}
            />
          </Field>
          <Field label="Upload token">
            <Input
              type="password"
              autoComplete="off"
              placeholder={
                configured
                  ? "Leave blank to keep the current token"
                  : "Server upload token"
              }
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </Field>
          <Button
            disabled={busy || !server}
            onClick={() =>
              run(async () => {
                const settings = await captureApi().configureCloud(
                  server,
                  token,
                );
                setConfigured(settings.configured);
                setServer(settings.url);
                setToken("");
              })
            }
          >
            Save connection
          </Button>
        </div>
      </details>
      <Dialog
        open={!!preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
            <DialogDescription>
              Stored on this device. Rename it or open the editor to create a
              new version.
            </DialogDescription>
          </DialogHeader>
          {preview?.kind === "image" ? (
            <img
              src={preview.url}
              alt={preview.name}
              className="max-h-[60vh] w-full object-contain rounded"
            />
          ) : (
            preview && (
              <video
                src={preview.url}
                controls
                className="max-h-[60vh] w-full"
              />
            )
          )}
          <div className="flex gap-2">
            <Input
              aria-label="Rename capture"
              value={rename}
              onChange={(e) => setRename(e.target.value)}
            />
            <Button
              disabled={busy || !rename.trim()}
              onClick={() =>
                run(async () => {
                  await captureApi().rename(preview!.id, rename);
                  setPreview((p) => (p ? { ...p, name: rename } : null));
                  await refresh();
                })
              }
            >
              Rename
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!sharing}
        onOpenChange={(open) => {
          if (!open && !busy) setSharing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share {sharing?.name}</DialogTitle>
            <DialogDescription>
              Anyone with the link can view this capture until it expires or you
              revoke it.
            </DialogDescription>
          </DialogHeader>
          {sharing?.share ? (
            <div className="space-y-4">
              <Input
                aria-label="Share link"
                readOnly
                value={sharing.share.url}
              />
              <ToolCopyButton value={sharing.share.url} label="Copy link" />
              <p className="text-sm text-muted-foreground">
                Expires {new Date(sharing.share.expiresAt).toLocaleString()}
              </p>
              <Button
                variant="destructive"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await captureApi().revokeShare(sharing.id);
                    setSharing(await captureApi().get(sharing.id));
                    await refresh();
                  })
                }
              >
                Revoke link
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {!configured && (
                <p className="text-sm text-amber-600">
                  Configure your Capture Cloud server below the library first.
                </p>
              )}
              <Field label="Link expires after">
                <select
                  className={selectClass}
                  value={prefs.days}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, days: Number(e.target.value) }))
                  }
                >
                  {[1, 7, 30].map((d) => (
                    <option key={d} value={d}>
                      {d} {d === 1 ? "day" : "days"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Password (optional)">
                <Input
                  type="password"
                  autoComplete="new-password"
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <p className="text-xs text-muted-foreground">
                Only this exported file is uploaded. Editable source images and
                recording originals are not included.
              </p>
              <Button
                disabled={busy || !configured}
                onClick={() =>
                  run(async () => {
                    const a = await captureApi().share(
                      sharing!.id,
                      prefs.days,
                      password,
                    );
                    setSharing(a);
                    setPassword("");
                    await refresh();
                  })
                }
              >
                {busy ? "Uploading…" : "Upload & create link"}
              </Button>
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open && !busy) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this local capture?</DialogTitle>
            <DialogDescription>
              {deleting?.name}. This removes the file from this device.
              {deleting?.share
                ? " Its shared link remains available; revoke it first if you want to remove the cloud copy too."
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await captureApi().remove(deleting!.id);
                  setDeleting(null);
                  await refresh();
                })
              }
            >
              Delete capture
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ToolPageContainer>
  );
}
