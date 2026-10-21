/**
 * Screen Recorder — record a display, window or rectangular area with optional
 * system audio, microphone and a circular webcam overlay. Set FPS, quality and
 * countdown, then start; pause/resume and stop also work with global shortcuts.
 * Recordings are written to disk incrementally and remain available in the library.
 */
import React, {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Link } from "react-router-dom";
import { Circle, Pause, Play, Square, Video } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  ToolPageContainer,
  ToolPageHeader,
  ToolErrorBanner,
} from "../components/tool-page-layout";
import { ToolClearButton } from "../components/tool-actions";
import {
  CaptureNav,
  SourcePicker,
  captureApi,
  Field,
  formatDuration,
  selectClass,
} from "../components/capture/shared";
import { captureRecorder } from "../services/capture-recorder";
import { useToolState } from "../hooks/useToolState";

export function ScreenRecorderPage() {
  const [prefs, setPrefs, clearPrefs] = useToolState("screen-recorder", {
    fps: 30,
    microphone: false,
    systemAudio: false,
    camera: false,
    delay: 3,
    quality: 8,
    region: false,
    x: 0,
    y: 0,
    width: 1280,
    height: 720,
  });
  const [source, setSource] = useState(""),
    [platform, setPlatform] = useState("");
  const state = useSyncExternalStore(
      captureRecorder.subscribe,
      captureRecorder.snapshot,
    ),
    preview = useRef<HTMLVideoElement>(null);
  const active = state.phase !== "idle";
  useEffect(() => {
    captureApi()
      .platform()
      .then(setPlatform)
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (preview.current) {
      preview.current.srcObject = state.stream;
      if (state.stream) void preview.current.play().catch(() => {});
    }
  }, [state.stream]);
  const start = () =>
    captureRecorder.start({
      ...prefs,
      systemAudio: platform === "win32" && prefs.systemAudio,
      source,
      crop: prefs.region
        ? { x: prefs.x, y: prefs.y, width: prefs.width, height: prefs.height }
        : null,
    });
  return (
    <ToolPageContainer>
      <CaptureNav />
      <ToolPageHeader
        title="Screen Recorder"
        description="Record a clear walkthrough. Keep the screen, your voice and your camera together."
      />
      <ToolErrorBanner error={state.error} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <SourcePicker
            selected={source}
            onSelect={setSource}
            disabled={active}
          />
          <div className="relative flex min-h-[350px] items-center justify-center overflow-hidden rounded-2xl border bg-slate-950">
            <video
              ref={preview}
              muted
              playsInline
              className={
                state.stream ? "max-h-[55vh] w-full object-contain" : "hidden"
              }
            />
            {!state.stream && (
              <div className="p-12 text-center text-slate-400">
                <Video className="mx-auto mb-4 h-14 w-14 text-indigo-400" />
                <p className="text-xl font-medium text-slate-100">
                  Your next walkthrough starts here
                </p>
                <p className="mt-2 text-sm">
                  Choose a source, set your audio, and press Record.
                </p>
              </div>
            )}
            {state.phase === "countdown" && (
              <div className="absolute inset-0 grid place-items-center bg-black/40 text-7xl font-bold text-white">
                {state.countdown || "Ready"}
              </div>
            )}
            {["recording", "paused"].includes(state.phase) && (
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-medium text-white">
                <span
                  className={`h-2 w-2 rounded-full ${state.phase === "recording" ? "animate-pulse bg-red-500" : "bg-amber-400"}`}
                />
                {state.phase === "recording" ? "REC" : "PAUSED"}{" "}
                {formatDuration(state.seconds)}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" disabled={active || !source} onClick={start}>
              <Circle className="mr-2 h-4 w-4 fill-current" />
              Record
            </Button>
            <Button
              variant="outline"
              disabled={!["recording", "paused"].includes(state.phase)}
              onClick={() => captureRecorder.pause()}
            >
              {state.phase === "paused" ? (
                <Play className="mr-2 h-4 w-4" />
              ) : (
                <Pause className="mr-2 h-4 w-4" />
              )}
              {state.phase === "paused" ? "Resume" : "Pause"}
            </Button>
            <Button
              variant="destructive"
              disabled={!active || state.phase === "saving"}
              onClick={() => captureRecorder.stop()}
            >
              <Square className="mr-2 h-4 w-4" />
              {["preparing", "countdown"].includes(state.phase)
                ? "Cancel"
                : "Stop"}
            </Button>
            <span role="status" className="font-mono text-xl tabular-nums">
              {formatDuration(state.seconds)}
            </span>
            {state.phase === "saving" && (
              <span className="text-sm text-muted-foreground">
                Saving to your library…
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Ctrl/⌘ Shift R: stop · Ctrl/⌘ Shift P: pause/resume. You can switch
            tools while recording.
          </p>
          {state.asset && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
              <p className="font-medium">Saved: {state.asset.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your recording is safely stored in Capture Library.
              </p>
              <div className="mt-4 flex gap-2">
                <Button asChild>
                  <Link to={`/video-editor?asset=${state.asset.id}`}>
                    Edit & export
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/capture-library">Open library</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
        <aside className="space-y-5 rounded-xl border p-5">
          <h2 className="font-semibold">Recording setup</h2>
          <fieldset disabled={active} className="space-y-5">
            <Field label="Frame rate">
              <select
                className={selectClass}
                value={prefs.fps}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, fps: Number(e.target.value) }))
                }
              >
                {[15, 30, 60].map((n) => (
                  <option key={n} value={n}>
                    {n} fps
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Quality">
              <select
                className={selectClass}
                value={prefs.quality}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, quality: Number(e.target.value) }))
                }
              >
                <option value={3}>Compact · 3 Mbps</option>
                <option value={8}>High · 8 Mbps</option>
                <option value={16}>Very high · 16 Mbps</option>
              </select>
            </Field>
            <Field label="Countdown">
              <select
                className={selectClass}
                value={prefs.delay}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, delay: Number(e.target.value) }))
                }
              >
                {[0, 3, 5, 10].map((n) => (
                  <option key={n} value={n}>
                    {n ? `${n} seconds` : "Start immediately"}
                  </option>
                ))}
              </select>
            </Field>
            {(["microphone", "systemAudio", "camera", "region"] as const).map(
              (k) => (
                <label key={k} className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={
                      k === "systemAudio"
                        ? prefs[k] && platform === "win32"
                        : prefs[k]
                    }
                    disabled={k === "systemAudio" && platform !== "win32"}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, [k]: e.target.checked }))
                    }
                  />
                  {
                    {
                      microphone: "Microphone",
                      systemAudio: "System audio (Windows)",
                      camera: "Webcam bubble",
                      region: "Record a rectangular area",
                    }[k]
                  }
                </label>
              ),
            )}
            {prefs.region && (
              <div className="grid grid-cols-2 gap-3">
                {(["x", "y", "width", "height"] as const).map((k) => (
                  <Field key={k} label={k}>
                    <Input
                      type="number"
                      min={k === "width" || k === "height" ? 16 : 0}
                      value={prefs[k]}
                      onChange={(e) =>
                        setPrefs((p) => ({ ...p, [k]: Number(e.target.value) }))
                      }
                    />
                  </Field>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Capture stays local. Save WebM recordings, then export MP4, WebM
              or GIF in Video Editor.
            </p>
            <ToolClearButton
              onClear={() => {
                void clearPrefs();
                captureRecorder.clear();
              }}
            />
          </fieldset>
        </aside>
      </div>
    </ToolPageContainer>
  );
}
