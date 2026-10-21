/**
 * Screenshot Studio
 * Capture a screen/window, paste or drop images, annotate, crop and style locally.
 * Includes gradient/pattern/photo backgrounds, frames, shadows, numbered steps,
 * opaque redaction, undo/redo, PNG/JPEG/WebP export and reusable style presets.
 * Choose a source or import an image, draw on the preview, then save or export.
 * Only flattened exports enter Capture Library; original pixels are never uploaded.
 */
import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Camera,
  Upload,
  Download,
  Copy,
  Undo2,
  Redo2,
  Save,
  Crop as CropIcon,
  Sparkles,
  Pin,
} from "lucide-react";
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
  desktopStream,
  errorMessage,
  Field,
  selectClass,
} from "../components/capture/shared";
import { useToolState } from "../hooks/useToolState";
import {
  canvasBlob,
  Crop,
  DEFAULT_SHOT_STYLE,
  downloadBlob,
  loadImage,
  Mark,
  MarkKind,
  normalizeCrop,
  Point,
  renderShot,
  SHOT_PRESETS,
  ShotStyle,
  shotLayout,
} from "../utils/capture-image";

interface Edit {
  marks: Mark[];
  crop: Crop | null;
}
export function ScreenshotStudioPage() {
  const [prefs, setPrefs, clearPrefs] = useToolState("screenshot-studio", {
    style: DEFAULT_SHOT_STYLE,
    presets: [] as { name: string; style: ShotStyle }[],
  });
  const [image, setImage] = useState<HTMLImageElement | null>(null),
    [background, setBackground] = useState<HTMLImageElement | null>(null);
  const [edit, setEdit] = useState<Edit>({ marks: [], crop: null }),
    [past, setPast] = useState<Edit[]>([]),
    [future, setFuture] = useState<Edit[]>([]);
  const [source, setSource] = useState(""),
    [tool, setTool] = useState<MarkKind | "crop">("arrow"),
    [color, setColor] = useState("#ef4444"),
    [size, setSize] = useState(4),
    [text, setText] = useState("Look here");
  const [name, setName] = useState("Screenshot"),
    [error, setError] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [delay, setDelay] = useState(0),
    [scale, setScale] = useState(1),
    [format, setFormat] = useState("image/png");
  const [draft, setDraft] = useState<Mark | null>(null),
    [cropDraft, setCropDraft] = useState<Crop | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null),
    drag = useRef<Point | null>(null),
    input = useRef<HTMLInputElement>(null),
    mounted = useRef(true),
    importVersion = useRef(0);
  const [params] = useSearchParams(),
    navigate = useNavigate();
  const style = prefs.style;
  const change = (value: Partial<ShotStyle>) =>
    setPrefs((p) => ({ ...p, style: { ...p.style, ...value } }));
  const commit = (next: Edit) => {
    setPast((p) => [...p.slice(-29), edit]);
    setEdit(next);
    setFuture([]);
  };
  const undo = () => {
    if (!past.length) return;
    setFuture((f) => [edit, ...f]);
    setEdit(past[past.length - 1]);
    setPast(past.slice(0, -1));
  };
  const redo = () => {
    if (!future.length) return;
    setPast((p) => [...p, edit]);
    setEdit(future[0]);
    setFuture(future.slice(1));
  };
  const acceptImage = async (url: string, title = "Screenshot") => {
    const version = ++importVersion.current;
    const img = await loadImage(url);
    if (img.naturalWidth * img.naturalHeight > 32000000)
      throw new Error("Choose an image under 32 megapixels");
    if (!mounted.current || version !== importVersion.current) return;
    setImage(img);
    setName(title);
    setEdit({ marks: [], crop: null });
    setPast([]);
    setFuture([]);
    setError("");
    setStatus("");
  };
  const acceptFile = async (file?: File) => {
    if (!file) return;
    try {
      if (
        !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
        file.size > 50 * 1024 * 1024
      )
        throw new Error("Choose a PNG, JPEG or WebP image smaller than 50 MB");
      const url = URL.createObjectURL(file);
      try {
        await acceptImage(url, file.name.replace(/\.[^.]+$/, ""));
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      importVersion.current++;
    };
  }, []);
  useEffect(() => {
    const id = params.get("asset");
    if (id)
      captureApi()
        .get(id)
        .then((a) => acceptImage(a.url, a.name))
        .catch((e) => setError(errorMessage(e)));
  }, [params.get("asset")]);
  useEffect(() => {
    const paste = (event: ClipboardEvent) => {
      const file = Array.from(event.clipboardData?.files || []).find((f) =>
        f.type.startsWith("image/"),
      );
      if (file) {
        event.preventDefault();
        void acceptFile(file);
      }
    };
    window.addEventListener("paste", paste);
    return () => window.removeEventListener("paste", paste);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).matches(
          "input,textarea,[contenteditable=true]",
        )
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if (e.key === "Escape") {
        drag.current = null;
        setDraft(null);
        setCropDraft(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [past, future, edit]);
  useEffect(() => {
    if (!image || !canvas.current) return;
    try {
      const layout = renderShot(
        canvas.current,
        image,
        style,
        draft ? [...edit.marks, draft] : edit.marks,
        edit.crop,
        1,
        background,
      );
      if (cropDraft) {
        const ctx = canvas.current.getContext("2d")!;
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(
          cropDraft.x + layout.x - (edit.crop?.x || 0),
          cropDraft.y + layout.y - (edit.crop?.y || 0),
          cropDraft.width,
          cropDraft.height,
        );
      }
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [image, style, edit, draft, cropDraft, background]);
  const capture = async () => {
    setBusy(true);
    setError("");
    let stream: MediaStream | undefined;
    try {
      for (let i = delay; i > 0; i--) {
        setStatus(`Capturing in ${i}…`);
        await new Promise((r) => setTimeout(r, 1000));
        if (!mounted.current) return;
      }
      stream = await desktopStream(source);
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("The source did not provide a frame")),
          8000,
        );
        video.requestVideoFrameCallback(() => {
          clearTimeout(timer);
          resolve();
        });
      });
      const c = document.createElement("canvas");
      c.width = video.videoWidth;
      c.height = video.videoHeight;
      c.getContext("2d")!.drawImage(video, 0, 0);
      await acceptImage(
        c.toDataURL("image/png"),
        `Capture ${new Date().toLocaleTimeString()}`,
      );
      video.srcObject = null;
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      stream?.getTracks().forEach((t) => t.stop());
      if (mounted.current) {
        setBusy(false);
        setStatus("");
      }
    }
  };
  const position = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect(),
      c = edit.crop || {
        x: 0,
        y: 0,
        width: image!.naturalWidth,
        height: image!.naturalHeight,
      },
      l = shotLayout(c.width, c.height, style);
    return {
      x: Math.max(
        c.x,
        Math.min(
          c.x + c.width,
          ((e.clientX - bounds.left) * l.width) / bounds.width - l.x + c.x,
        ),
      ),
      y: Math.max(
        c.y,
        Math.min(
          c.y + c.height,
          ((e.clientY - bounds.top) * l.height) / bounds.height - l.y + c.y,
        ),
      ),
    };
  };
  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!image || busy || e.button !== 0) return;
    const p = position(e);
    drag.current = p;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (tool === "crop") {
      setCropDraft({ ...p, width: 0, height: 0 });
      return;
    }
    setDraft({
      kind: tool,
      ...p,
      x2: p.x,
      y2: p.y,
      color,
      size,
      text:
        tool === "step"
          ? String(edit.marks.filter((m) => m.kind === "step").length + 1)
          : text,
      points: [p],
    });
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current || !image) return;
    const p = position(e);
    if (tool === "crop")
      setCropDraft(
        normalizeCrop(drag.current, p, image.naturalWidth, image.naturalHeight),
      );
    else
      setDraft((d) =>
        d
          ? {
              ...d,
              x2: p.x,
              y2: p.y,
              points: d.kind === "pen" ? [...(d.points || []), p] : d.points,
            }
          : d,
      );
  };
  const end = () => {
    if (!drag.current) return;
    if (cropDraft && cropDraft.width > 4 && cropDraft.height > 4)
      commit({ ...edit, crop: cropDraft });
    else if (draft) commit({ ...edit, marks: [...edit.marks, draft] });
    drag.current = null;
    setDraft(null);
    setCropDraft(null);
  };
  const output = async (mime = format) => {
    if (!image) throw new Error("Import or capture an image first");
    const c = document.createElement("canvas");
    renderShot(c, image, style, edit.marks, edit.crop, scale, background);
    return canvasBlob(c, mime);
  };
  const act = async (action: "download" | "copy" | "save" | "pin") => {
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const blob = await output(action === "download" ? format : "image/png");
      if (action === "download")
        downloadBlob(
          blob,
          `${name || "Screenshot"}.${format.split("/")[1] === "jpeg" ? "jpg" : format.split("/")[1]}`,
        );
      else if (action === "copy")
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
      else {
        const asset = await captureApi().saveImage(
          await blob.arrayBuffer(),
          name,
        );
        if (action === "pin") await captureApi().pin(asset.id);
      }
      setStatus(
        action === "copy"
          ? "Image copied"
          : action === "save"
            ? "Saved to Capture Library"
            : action === "pin"
              ? "Pinned above other windows"
              : "Image exported",
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const sample = async () => {
    const c = document.createElement("canvas");
    c.width = 960;
    c.height = 600;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, 960, 600);
    ctx.fillStyle = "#818cf8";
    ctx.font = "600 20px system-ui";
    ctx.fillText("DEVKITHUB / CAPTURE STUDIO", 64, 88);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 58px system-ui";
    ctx.fillText("Make the details", 64, 230);
    ctx.fillText("worth sharing.", 64, 304);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "24px system-ui";
    ctx.fillText("Capture. Annotate. Create something clear.", 64, 374);
    ctx.fillStyle = "#6366f1";
    ctx.beginPath();
    ctx.roundRect(64, 446, 228, 60, 12);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "600 20px system-ui";
    ctx.fillText("Your next great idea", 80, 484);
    await acceptImage(c.toDataURL(), "My screenshot");
  };
  return (
    <ToolPageContainer>
      <CaptureNav />
      <ToolPageHeader
        title="Screenshot Studio"
        description="A little polish. A much clearer story. Capture, annotate and make it yours."
      />
      <ToolErrorBanner error={error} />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => input.current?.click()}
          variant="outline"
          disabled={busy}
        >
          <Upload className="mr-2 h-4 w-4" />
          Import image
        </Button>
        <Button onClick={sample} variant="ghost" disabled={busy}>
          <Sparkles className="mr-2 h-4 w-4" />
          Try a sample
        </Button>
        <Input
          aria-label="Capture name"
          className="max-w-xs"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <ToolClearButton
          disabled={busy}
          onClear={() => {
            importVersion.current++;
            setImage(null);
            setBackground(null);
            setEdit({ marks: [], crop: null });
            setPast([]);
            setFuture([]);
            setError("");
            setStatus("");
            void clearPrefs();
          }}
        />
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          void acceptFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <details className="rounded-xl border p-4">
        <summary className="cursor-pointer font-medium">
          Capture a screen or window · Ctrl/⌘ Shift 2
        </summary>
        <div className="mt-4">
          <SourcePicker
            selected={source}
            onSelect={setSource}
            disabled={busy}
          />
          <div className="mt-3 flex gap-3">
            <select
              aria-label="Capture delay"
              className={`${selectClass} max-w-40`}
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
            >
              <option value={0}>No delay</option>
              <option value={3}>3 second delay</option>
              <option value={5}>5 second delay</option>
              <option value={10}>10 second delay</option>
            </select>
            <Button disabled={!source || busy} onClick={capture}>
              <Camera className="mr-2 h-4 w-4" />
              Capture
            </Button>
          </div>
        </div>
      </details>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-3">
          <div
            role="toolbar"
            aria-label="Annotation tools"
            className="flex flex-wrap gap-1 rounded-xl border p-2"
          >
            {(
              [
                "arrow",
                "rectangle",
                "ellipse",
                "pen",
                "text",
                "step",
                "highlight",
                "redact",
                "crop",
              ] as const
            ).map((t) => (
              <Button
                key={t}
                size="sm"
                variant={tool === t ? "default" : "ghost"}
                onClick={() => setTool(t)}
                aria-pressed={tool === t}
              >
                {t === "crop" && <CropIcon className="mr-1 h-3 w-3" />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Button>
            ))}
            <Button
              size="icon"
              variant="ghost"
              aria-label="Undo"
              disabled={!past.length}
              onClick={undo}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Redo"
              disabled={!future.length}
              onClick={redo}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label>
              Ink{" "}
              <input
                aria-label="Annotation color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="ml-2 h-7 w-8 align-middle"
              />
            </label>
            <label>
              Size{" "}
              <input
                aria-label="Annotation size"
                type="range"
                min={2}
                max={12}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="ml-2 w-24 align-middle"
              />
            </label>
            {tool === "text" && (
              <Input
                aria-label="Annotation text"
                className="max-w-60"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            )}
            {edit.crop && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => commit({ ...edit, crop: null })}
              >
                Reset crop
              </Button>
            )}
          </div>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void acceptFile(e.dataTransfer.files[0]);
            }}
            className="flex min-h-[380px] items-center justify-center overflow-hidden rounded-2xl border bg-muted/40 p-5"
            style={{
              backgroundImage:
                "radial-gradient(#94a3b833 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          >
            {image ? (
              <canvas
                ref={canvas}
                aria-label="Screenshot canvas. Drag to annotate or crop."
                onPointerDown={start}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={() => {
                  drag.current = null;
                  setDraft(null);
                  setCropDraft(null);
                }}
                className="max-h-[65vh] max-w-full object-contain touch-none cursor-crosshair"
              />
            ) : (
              <div className="py-16 text-center">
                <Camera className="mx-auto mb-5 h-12 w-12 text-primary/70" />
                <h2 className="text-xl font-semibold">
                  Start with something worth sharing
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Drop an image here, paste with Ctrl/⌘ V, or capture a window.
                </p>
                <Button className="mt-6" onClick={() => input.current?.click()}>
                  Choose an image
                </Button>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {tool === "redact"
              ? "Drag over sensitive content. Exports permanently replace these pixels with an opaque fill."
              : tool === "crop"
                ? "Drag to select the area to keep. Undo restores the previous crop."
                : "Drag to draw. Click to place text or a numbered step. Ctrl/⌘ Z to undo."}
          </p>
        </div>
        <aside className="space-y-5 rounded-xl border p-4">
          <Field label="Background">
            <select
              className={selectClass}
              value={style.background}
              onChange={(e) =>
                change({
                  background: e.target.value as ShotStyle["background"],
                })
              }
            >
              {[
                "gradient",
                "solid",
                "dots",
                "grid",
                "image",
                "transparent",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-6 gap-2">
            {SHOT_PRESETS.map(([label, color, color2]) => (
              <button
                key={label}
                title={label}
                aria-label={`${label} background`}
                className="h-8 rounded-lg border transition hover:scale-110"
                style={{
                  background: `linear-gradient(135deg,${color},${color2})`,
                }}
                onClick={() =>
                  change({ color, color2, background: "gradient" })
                }
              />
            ))}
          </div>
          <div className="flex gap-3">
            <input
              aria-label="Background color"
              type="color"
              value={style.color}
              onChange={(e) => change({ color: e.target.value })}
            />
            <input
              aria-label="Secondary background color"
              type="color"
              value={style.color2}
              onChange={(e) => change({ color2: e.target.value })}
            />
          </div>
          {style.background === "image" && (
            <Field label="Background photo">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="w-full text-xs"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const url = URL.createObjectURL(f);
                  try {
                    setBackground(await loadImage(url));
                  } catch (error) {
                    setError(errorMessage(error));
                  } finally {
                    URL.revokeObjectURL(url);
                  }
                }}
              />
            </Field>
          )}
          {(["padding", "radius", "shadow"] as const).map((k) => (
            <Field
              key={k}
              label={`${k.charAt(0).toUpperCase() + k.slice(1)} · ${style[k]} px`}
            >
              <input
                aria-label={k}
                type="range"
                min={0}
                max={k === "padding" ? 200 : 80}
                value={style[k]}
                onChange={(e) => change({ [k]: Number(e.target.value) })}
                className="w-full accent-primary"
              />
            </Field>
          ))}
          <Field label="Canvas ratio">
            <select
              className={selectClass}
              value={style.ratio}
              onChange={(e) =>
                change({ ratio: e.target.value as ShotStyle["ratio"] })
              }
            >
              {["auto", "1:1", "16:9", "4:3", "9:16"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Alignment">
            <select
              className={selectClass}
              value={style.alignment}
              onChange={(e) =>
                change({ alignment: e.target.value as ShotStyle["alignment"] })
              }
            >
              {["center", "top", "bottom"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={style.frame}
              onChange={(e) => change({ frame: e.target.checked })}
            />
            Browser frame
          </label>
          <Field label="Signature">
            <Input
              placeholder="Your name or brand"
              maxLength={100}
              value={style.watermark}
              onChange={(e) => change({ watermark: e.target.value })}
            />
          </Field>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() =>
              setPrefs((p) => ({
                ...p,
                presets: [
                  ...p.presets.slice(-9),
                  {
                    name: `Style ${p.presets.length + 1}`,
                    style: { ...style },
                  },
                ],
              }))
            }
          >
            <Save className="mr-2 h-3 w-3" />
            Save style preset
          </Button>
          {!!prefs.presets.length && (
            <select
              aria-label="Saved style presets"
              className={selectClass}
              value=""
              onChange={(e) =>
                change(prefs.presets[Number(e.target.value)].style)
              }
            >
              <option value="">Apply saved style…</option>
              {prefs.presets.map((p, i) => (
                <option key={i} value={i}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </aside>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border p-4">
        <select
          aria-label="Export format"
          className={`${selectClass} w-28`}
          value={format}
          onChange={(e) => setFormat(e.target.value)}
        >
          <option value="image/png">PNG</option>
          <option value="image/jpeg">JPEG</option>
          <option value="image/webp">WebP</option>
        </select>
        <select
          aria-label="Export scale"
          className={`${selectClass} w-24`}
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
        >
          {[0.5, 1, 2, 3].map((v) => (
            <option key={v} value={v}>
              {v}×
            </option>
          ))}
        </select>
        <Button disabled={!image || busy} onClick={() => act("download")}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button
          variant="outline"
          disabled={!image || busy}
          onClick={() => act("copy")}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy image
        </Button>
        <Button
          variant="outline"
          disabled={!image || busy}
          onClick={() => act("save")}
        >
          <Save className="mr-2 h-4 w-4" />
          Save to library
        </Button>
        <Button
          variant="ghost"
          disabled={!image || busy}
          onClick={() => act("pin")}
        >
          <Pin className="mr-2 h-4 w-4" />
          Pin
        </Button>
        <Button variant="ghost" onClick={() => navigate("/capture-library")}>
          Open library →
        </Button>
      </div>
      {status && (
        <p role="status" className="text-sm text-primary">
          {status}
        </p>
      )}
    </ToolPageContainer>
  );
}
