/**
 * Video Editor — import recordings, trim precisely, adjust playback speed and
 * audio, add a guided zoom segment and background, then export with FFmpeg.
 * MP4/WebM/GIF files are real encodes, with progress, cancellation and originals
 * preserved. Use the timeline or numeric in/out fields, preview and export.
 */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Clapperboard, Download, Upload, Camera, Scissors } from "lucide-react";
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
  captureApi,
  errorMessage,
  Field,
  formatDuration,
  selectClass,
} from "../components/capture/shared";
import { CaptureAsset, VideoExportOptions } from "../types/capture";
import { useToolState } from "../hooks/useToolState";
import { canvasBlob } from "../utils/capture-image";

export function VideoEditorPage() {
  const [prefs, setPrefs, clearPrefs] = useToolState("video-editor", {
    format: "mp4" as VideoExportOptions["format"],
    width: 1280,
    fps: 30,
    mute: false,
    volume: 1,
    speed: 1,
    padding: 32,
    background: "#0f172a",
  });
  const [asset, setAsset] = useState<CaptureAsset | null>(null),
    [duration, setDuration] = useState(0),
    [start, setStart] = useState(0),
    [end, setEnd] = useState(0),
    [time, setTime] = useState(0);
  const [zoom, setZoom] = useState(false),
    [zoomStart, setZoomStart] = useState(0),
    [zoomEnd, setZoomEnd] = useState(0),
    [zoomScale, setZoomScale] = useState(1.5),
    [focus, setFocus] = useState({ x: 0.5, y: 0.5 });
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [result, setResult] = useState<CaptureAsset | null>(null),
    [playing, setPlaying] = useState(false);
  const video = useRef<HTMLVideoElement>(null),
    [params, setParams] = useSearchParams(),
    navigate = useNavigate();
  useEffect(() => {
    const id = params.get("asset");
    if (!id) return;
    setError("");
    setResult(null);
    setStart(0);
    setEnd(0);
    setDuration(0);
    setZoom(false);
    setTime(0);
    captureApi()
      .get(id)
      .then((a) => {
        if (a.kind !== "video") throw new Error("Choose a video recording");
        setAsset(a);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [params.get("asset")]);
  useEffect(() => window.captureStudio?.onExportProgress(setProgress), []);
  useEffect(() => {
    if (video.current) {
      video.current.playbackRate = prefs.speed;
      video.current.volume = Math.min(1, prefs.volume);
      video.current.muted = prefs.mute;
    }
  }, [prefs.speed, prefs.volume, prefs.mute, asset]);
  const importVideo = async () => {
    try {
      const a = await captureApi().importMedia("video");
      if (a) setParams({ asset: a.id });
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  const loaded = () => {
    const v = video.current!;
    const d = Number.isFinite(v.duration) ? v.duration : asset?.duration || 0;
    if (!d) {
      setError(
        "This video has no readable duration. Try exporting it as MP4 from its original application.",
      );
      return;
    }
    setDuration(d);
    setEnd(d);
    setZoomStart(Math.min(1, d / 4));
    setZoomEnd(Math.min(4, d * 0.75));
  };
  const seek = (t: number) => {
    if (video.current) video.current.currentTime = t;
    setTime(t);
  };
  const exportVideo = async () => {
    if (!asset || !video.current) return;
    setBusy(true);
    setError("");
    setProgress(0);
    setResult(null);
    video.current.pause();
    try {
      const output = await captureApi().exportVideo(asset.id, {
        ...prefs,
        start,
        end,
        height: Math.max(
          16,
          Math.round(
            (prefs.width * video.current.videoHeight) /
              video.current.videoWidth /
              2,
          ) * 2,
        ),
        zoom: zoom
          ? { start: zoomStart, end: zoomEnd, scale: zoomScale, ...focus }
          : undefined,
      });
      setResult(output);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const grabFrame = async () => {
    if (!video.current) return;
    try {
      const v = video.current,
        c = document.createElement("canvas");
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      c.getContext("2d")!.drawImage(v, 0, 0);
      const a = await captureApi().saveImage(
        await (await canvasBlob(c)).arrayBuffer(),
        `${asset?.name} — ${formatDuration(time)}`,
      );
      navigate(`/screenshot-studio?asset=${a.id}`);
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  const canExport =
    !!asset &&
    duration > 0 &&
    start >= 0 &&
    end <= duration &&
    end > start &&
    (!zoom || (zoomStart >= start && zoomEnd <= end && zoomEnd > zoomStart));
  const ramp = zoom
    ? Math.max(
        0,
        Math.min(
          1,
          (time - zoomStart) / (0.3 * prefs.speed),
          (zoomEnd - time) / (0.3 * prefs.speed),
        ),
      )
    : 0;
  const previewZoom =
    1 + (zoomScale - 1) * (0.5 - 0.5 * Math.cos(Math.PI * ramp));
  const cropX = Math.max(
    0,
    Math.min(1 - 1 / previewZoom, focus.x - 1 / (2 * previewZoom)),
  );
  const cropY = Math.max(
    0,
    Math.min(1 - 1 / previewZoom, focus.y - 1 / (2 * previewZoom)),
  );
  return (
    <ToolPageContainer>
      <CaptureNav />
      <ToolPageHeader
        title="Video Editor"
        description="Keep the useful part. Guide attention. Export a walkthrough that feels finished."
      />
      <ToolErrorBanner error={error} />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={busy} onClick={importVideo}>
          <Upload className="mr-2 h-4 w-4" />
          Import video
        </Button>
        <Button
          variant="ghost"
          disabled={busy}
          onClick={() => navigate("/capture-library")}
        >
          Choose from library
        </Button>
        <ToolClearButton
          disabled={busy}
          onClear={() => {
            setAsset(null);
            setParams({});
            setResult(null);
            setError("");
            setDuration(0);
            setStart(0);
            setEnd(0);
            setZoom(false);
            void clearPrefs();
          }}
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-4">
          <div
            className="rounded-2xl border p-4"
            style={{
              background: prefs.background,
              padding: `${Math.min(64, prefs.padding)}px`,
            }}
          >
            <div
              className="overflow-hidden rounded-lg bg-black"
              onClick={(e) => {
                if (!zoom) return;
                const r = e.currentTarget.getBoundingClientRect();
                setFocus({
                  x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
                  y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
                });
              }}
            >
              {asset ? (
                <video
                  crossOrigin="anonymous"
                  key={asset.id}
                  ref={video}
                  src={asset.url}
                  playsInline
                  className="max-h-[55vh] w-full"
                  style={{
                    transform: `scale(${previewZoom}) translate(${-cropX * 100}%, ${-cropY * 100}%)`,
                    transformOrigin: "0 0",
                  }}
                  onLoadedMetadata={loaded}
                  onError={() =>
                    setError(
                      "This video could not be played. Import an MP4 or WebM file with a supported codec.",
                    )
                  }
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onTimeUpdate={() => {
                    const v = video.current!;
                    setTime(v.currentTime);
                    if (v.currentTime >= end && end > start && !v.paused) {
                      v.pause();
                      seek(start);
                    }
                  }}
                />
              ) : (
                <div className="grid min-h-[350px] place-items-center p-10 text-center text-slate-300">
                  <div>
                    <Clapperboard className="mx-auto mb-4 h-14 w-14 text-indigo-400" />
                    <h2 className="text-xl font-medium">
                      From recording to ready
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Import a video or open a recording from your library.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          {!!asset && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  disabled={!duration || busy}
                  onClick={() => {
                    const v = video.current!;
                    if (v.paused) {
                      if (v.currentTime < start || v.currentTime >= end)
                        seek(start);
                      void v.play().catch((e) => setError(errorMessage(e)));
                    } else v.pause();
                  }}
                >
                  {playing ? "Pause" : "Play selection"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={!duration || busy}
                  onClick={() => seek(Math.max(start, time - 1 / prefs.fps))}
                >
                  −1 frame
                </Button>
                <Button
                  variant="ghost"
                  disabled={!duration || busy}
                  onClick={() => seek(Math.min(end, time + 1 / prefs.fps))}
                >
                  +1 frame
                </Button>
                <span className="font-mono text-sm">
                  {formatDuration(time)} / {formatDuration(duration)}
                </span>
                <Button
                  variant="outline"
                  disabled={!duration || busy}
                  onClick={grabFrame}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Extract frame
                </Button>
              </div>
              <div className="space-y-3 rounded-xl border p-4">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{asset.name}</span>
                  <span>
                    {((end - start) / prefs.speed).toFixed(2)}s output
                  </span>
                </div>
                <div className="relative h-12 overflow-hidden rounded-lg bg-muted">
                  <div
                    className="absolute inset-y-0 bg-primary/25 border-x-2 border-primary"
                    style={{
                      left: `${(start / (duration || 1)) * 100}%`,
                      width: `${((end - start) / (duration || 1)) * 100}%`,
                    }}
                  />
                  {zoom && (
                    <div
                      className="absolute bottom-0 h-2 rounded bg-amber-400"
                      style={{
                        left: `${(zoomStart / (duration || 1)) * 100}%`,
                        width: `${((zoomEnd - zoomStart) / (duration || 1)) * 100}%`,
                      }}
                    />
                  )}
                  <input
                    aria-label="Video playhead"
                    type="range"
                    min={0}
                    max={duration || 1}
                    step={1 / prefs.fps}
                    value={time}
                    onChange={(e) => seek(Number(e.target.value))}
                    className="absolute inset-0 w-full accent-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Trim start (seconds)">
                    <Input
                      type="number"
                      min={0}
                      max={end}
                      step={0.01}
                      value={start}
                      onChange={(e) => setStart(Number(e.target.value))}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setStart(Math.min(time, end - 0.01))}
                    >
                      <Scissors className="mr-1 h-3 w-3" />
                      Set at playhead
                    </Button>
                  </Field>
                  <Field label="Trim end (seconds)">
                    <Input
                      type="number"
                      min={start}
                      max={duration}
                      step={0.01}
                      value={end}
                      onChange={(e) => setEnd(Number(e.target.value))}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEnd(Math.max(time, start + 0.01))}
                    >
                      Set at playhead
                    </Button>
                  </Field>
                </div>
              </div>
            </>
          )}
          {result && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <p className="font-medium">
                Export ready · {result.extension.toUpperCase()}
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  onClick={() =>
                    captureApi()
                      .download(result.id)
                      .catch((e) => setError(errorMessage(e)))
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  Save file
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/capture-library")}
                >
                  Share from library
                </Button>
              </div>
            </div>
          )}
        </div>
        <aside className="space-y-4 rounded-xl border p-4">
          <fieldset disabled={busy} className="space-y-4">
            <Field label="Format">
              <select
                className={selectClass}
                value={prefs.format}
                onChange={(e) =>
                  setPrefs((p) => ({
                    ...p,
                    format: e.target.value as VideoExportOptions["format"],
                  }))
                }
              >
                <option value="mp4">MP4 · H.264</option>
                <option value="webm">WebM · VP9</option>
                <option value="gif">Animated GIF</option>
              </select>
            </Field>
            <Field label="Video width">
              <select
                className={selectClass}
                value={prefs.width}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, width: Number(e.target.value) }))
                }
              >
                {[640, 960, 1280, 1920, 2560, 3840].map((n) => (
                  <option key={n} value={n}>
                    {n} px
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Frame rate">
              <select
                className={selectClass}
                value={prefs.fps}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, fps: Number(e.target.value) }))
                }
              >
                {[10, 15, 24, 30, 60].map((n) => (
                  <option key={n} value={n}>
                    {n} fps
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Playback speed">
              <select
                className={selectClass}
                value={prefs.speed}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, speed: Number(e.target.value) }))
                }
              >
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((n) => (
                  <option key={n} value={n}>
                    {n}×
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={prefs.mute}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, mute: e.target.checked }))
                }
              />
              Mute audio
            </label>
            <Field label={`Volume · ${Math.round(prefs.volume * 100)}%`}>
              <input
                type="range"
                min={0}
                max={2}
                step={0.05}
                value={prefs.volume}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, volume: Number(e.target.value) }))
                }
                className="w-full"
              />
            </Field>
            {prefs.volume > 1 && (
              <p className="text-xs text-muted-foreground">
                Amplification above 100% is applied during export.
              </p>
            )}
            <Field label={`Background padding · ${prefs.padding}px`}>
              <input
                type="range"
                min={0}
                max={160}
                step={2}
                value={prefs.padding}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, padding: Number(e.target.value) }))
                }
                className="w-full"
              />
            </Field>
            <input
              aria-label="Video background"
              type="color"
              value={prefs.background}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, background: e.target.value }))
              }
            />
            <label className="flex gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={zoom}
                onChange={(e) => setZoom(e.target.checked)}
              />
              Guided zoom
            </label>
            {zoom && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Click the preview to choose a focus point. The camera eases in
                  and out during this segment.
                </p>
                <Field label="Zoom start">
                  <Input
                    type="number"
                    step={0.1}
                    value={zoomStart}
                    onChange={(e) => setZoomStart(Number(e.target.value))}
                  />
                </Field>
                <Field label="Zoom end">
                  <Input
                    type="number"
                    step={0.1}
                    value={zoomEnd}
                    onChange={(e) => setZoomEnd(Number(e.target.value))}
                  />
                </Field>
                <Field label={`Zoom · ${zoomScale}×`}>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoomScale}
                    onChange={(e) => setZoomScale(Number(e.target.value))}
                    className="w-full"
                  />
                </Field>
              </div>
            )}
          </fieldset>
          <Button
            className="w-full"
            disabled={!canExport || busy}
            onClick={exportVideo}
          >
            <Download className="mr-2 h-4 w-4" />
            {busy ? `Exporting ${Math.round(progress)}%` : "Export video"}
          </Button>
          {busy && (
            <>
              <progress
                className="w-full"
                max={100}
                value={progress}
                aria-label="Export progress"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  captureApi()
                    .cancelExport()
                    .catch((e) => setError(errorMessage(e)))
                }
              >
                Cancel export
              </Button>
            </>
          )}
          <p className="text-xs text-muted-foreground">
            Your original stays untouched. Edited files are saved to Capture
            Library.
          </p>
        </aside>
      </div>
    </ToolPageContainer>
  );
}
