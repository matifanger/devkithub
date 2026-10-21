import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Camera, Clapperboard, Library, Video, RefreshCw } from "lucide-react";
import { CaptureSource } from "../../types/capture";
import { Button } from "../ui/button";

export const captureApi = () => {
  if (!window.captureStudio)
    throw new Error("Open this tool in the DevKitHub desktop app.");
  return window.captureStudio;
};
export const errorMessage = (e: unknown) =>
  e instanceof Error
    ? e.message.replace(/^Error invoking remote method '[^']+': Error: /, "")
    : "Something went wrong. Please try again.";
export function CaptureNav() {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Capture tools" className="flex flex-wrap gap-2">
      {[
        ["/screenshot-studio", "Screenshot Studio", Camera],
        ["/screen-recorder", "Screen Recorder", Video],
        ["/video-editor", "Video Editor", Clapperboard],
        ["/capture-library", "Capture Library", Library],
      ].map(([href, label, Icon]) => (
        <Button
          asChild
          key={href as string}
          variant={pathname === href ? "default" : "outline"}
          size="sm"
        >
          <Link to={href as string}>
            <Icon className="mr-2 h-4 w-4" />
            {label as string}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
export function SourcePicker({
  selected,
  onSelect,
  disabled = false,
}: {
  selected: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  const [sources, setSources] = useState<CaptureSource[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      setSources(await captureApi().sources());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void refresh();
  }, []);
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">Choose a screen or window</h2>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled || loading}
          onClick={refresh}
        >
          <RefreshCw className="mr-2 h-3 w-3" />
          Refresh
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {loading && (
        <p className="text-sm text-muted-foreground">
          Finding capture sources…
        </p>
      )}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {sources.map((s) => (
          <button
            type="button"
            key={s.id}
            disabled={disabled}
            aria-pressed={selected === s.id}
            onClick={() => onSelect(s.id)}
            className={`w-44 shrink-0 rounded-xl border p-2 text-left transition ${selected === s.id ? "border-primary bg-primary/10 ring-1 ring-primary" : "hover:bg-muted"}`}
          >
            <img
              src={s.thumbnail}
              alt=""
              className="h-24 w-full rounded-md object-contain bg-black/10"
            />
            <span className="mt-2 block truncate text-xs font-medium">
              {s.name}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {s.kind}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
export async function desktopStream(source: string, audio = false, fps = 30) {
  if (!source) throw new Error("Choose a screen or window first");
  return navigator.mediaDevices.getUserMedia({
    audio: audio
      ? ({
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: source,
          },
        } as unknown as MediaTrackConstraints)
      : false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source,
        maxFrameRate: fps,
        maxWidth: 7680,
        maxHeight: 4320,
      },
    } as unknown as MediaTrackConstraints,
  });
}
export function formatDuration(seconds: number) {
  const s = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(s / 60)
    .toString()
    .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}
export function formatBytes(n: number) {
  return n < 1048576
    ? `${(n / 1024).toFixed(0)} KB`
    : `${(n / 1048576).toFixed(1)} MB`;
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2 text-sm [&>select]:w-full">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}
export const selectClass =
  "h-9 min-w-0 max-w-full rounded-md border border-input bg-background px-3 text-sm";
