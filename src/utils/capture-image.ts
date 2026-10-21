export type MarkKind =
  | "arrow"
  | "rectangle"
  | "ellipse"
  | "highlight"
  | "redact"
  | "text"
  | "step"
  | "pen";
export interface Point {
  x: number;
  y: number;
}
export interface Mark {
  kind: MarkKind;
  x: number;
  y: number;
  x2: number;
  y2: number;
  color: string;
  size: number;
  text?: string;
  points?: Point[];
}
export interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface ShotStyle {
  background: "gradient" | "solid" | "dots" | "grid" | "image" | "transparent";
  color: string;
  color2: string;
  padding: number;
  radius: number;
  shadow: number;
  ratio: "auto" | "1:1" | "16:9" | "4:3" | "9:16";
  frame: boolean;
  watermark: string;
  alignment: "center" | "top" | "bottom";
}
export const DEFAULT_SHOT_STYLE: ShotStyle = {
  background: "gradient",
  color: "#6366f1",
  color2: "#d946ef",
  padding: 64,
  radius: 16,
  shadow: 32,
  ratio: "auto",
  frame: false,
  watermark: "",
  alignment: "center",
};
export const SHOT_PRESETS = [
  ["Aurora", "#6366f1", "#d946ef"],
  ["Ocean", "#0369a1", "#2dd4bf"],
  ["Sunset", "#f97316", "#ec4899"],
  ["Midnight", "#0f172a", "#334155"],
  ["Forest", "#14532d", "#86efac"],
  ["Sand", "#a16207", "#fde68a"],
  ["Rose", "#be123c", "#fda4af"],
  ["Ice", "#e0f2fe", "#a5b4fc"],
  ["Slate", "#e2e8f0", "#94a3b8"],
  ["Grape", "#4c1d95", "#c084fc"],
  ["Mint", "#064e3b", "#6ee7b7"],
  ["Ember", "#7f1d1d", "#fb923c"],
] as const;

export function normalizeCrop(
  start: Point,
  end: Point,
  width: number,
  height: number,
): Crop {
  const x = Math.max(0, Math.min(width, Math.min(start.x, end.x))),
    y = Math.max(0, Math.min(height, Math.min(start.y, end.y)));
  return {
    x,
    y,
    width: Math.max(0, Math.min(width, Math.max(start.x, end.x)) - x),
    height: Math.max(0, Math.min(height, Math.max(start.y, end.y)) - y),
  };
}
export function shotLayout(width: number, height: number, style: ShotStyle) {
  const pad = Math.max(0, Math.min(300, style.padding)),
    header = style.frame ? 40 : 0;
  let w = width + pad * 2,
    h = height + pad * 2 + header;
  if (style.ratio !== "auto") {
    const [a, b] = style.ratio.split(":").map(Number);
    if (w / h < a / b) w = (h * a) / b;
    else h = (w * b) / a;
  }
  const y =
    style.alignment === "top"
      ? pad
      : style.alignment === "bottom"
        ? h - pad - height - header
        : (h - height - header) / 2;
  return {
    width: Math.ceil(w),
    height: Math.ceil(h),
    x: (w - width) / 2,
    y: y + header,
    header,
  };
}
export function drawMark(ctx: CanvasRenderingContext2D, m: Mark) {
  ctx.save();
  ctx.strokeStyle = m.color;
  ctx.fillStyle = m.color;
  ctx.lineWidth = m.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const r = normalizeCrop(
    { x: m.x, y: m.y },
    { x: m.x2, y: m.y2 },
    100000,
    100000,
  );
  if (m.kind === "redact") {
    ctx.fillStyle = "#111827";
    ctx.fillRect(r.x, r.y, r.width, r.height);
  } else if (m.kind === "highlight") {
    ctx.globalAlpha = 0.35;
    ctx.fillRect(r.x, r.y, r.width, r.height);
  } else if (m.kind === "rectangle")
    ctx.strokeRect(r.x, r.y, r.width, r.height);
  else if (m.kind === "ellipse") {
    ctx.beginPath();
    ctx.ellipse(
      r.x + r.width / 2,
      r.y + r.height / 2,
      r.width / 2,
      r.height / 2,
      0,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  } else if (m.kind === "text") {
    ctx.font = `600 ${Math.max(18, m.size * 6)}px system-ui`;
    ctx.textBaseline = "top";
    ctx.fillText(m.text || "", m.x, m.y);
  } else if (m.kind === "step") {
    const radius = Math.max(16, m.size * 4);
    ctx.beginPath();
    ctx.arc(m.x, m.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${radius}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(m.text || "1", m.x, m.y);
  } else {
    ctx.beginPath();
    ctx.moveTo(m.x, m.y);
    if (m.kind === "pen") for (const p of m.points || []) ctx.lineTo(p.x, p.y);
    else ctx.lineTo(m.x2, m.y2);
    ctx.stroke();
    if (m.kind === "arrow") {
      const angle = Math.atan2(m.y2 - m.y, m.x2 - m.x),
        len = Math.max(16, m.size * 4);
      ctx.beginPath();
      ctx.moveTo(
        m.x2 - len * Math.cos(angle - Math.PI / 6),
        m.y2 - len * Math.sin(angle - Math.PI / 6),
      );
      ctx.lineTo(m.x2, m.y2);
      ctx.lineTo(
        m.x2 - len * Math.cos(angle + Math.PI / 6),
        m.y2 - len * Math.sin(angle + Math.PI / 6),
      );
      ctx.stroke();
    }
  }
  ctx.restore();
}
export function renderShot(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  style: ShotStyle,
  marks: Mark[],
  crop: Crop | null,
  scale = 1,
  backgroundImage?: HTMLImageElement | null,
) {
  const c = crop || {
    x: 0,
    y: 0,
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
  const layout = shotLayout(c.width, c.height, style);
  if (
    layout.width * scale > 8192 ||
    layout.height * scale > 8192 ||
    layout.width * layout.height * scale * scale > 40000000
  )
    throw new Error(
      "Output is too large. Crop the image or choose a smaller export scale (maximum 8192 px / 40 megapixels).",
    );
  canvas.width = Math.ceil(layout.width * scale);
  canvas.height = Math.ceil(layout.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable");
  ctx.scale(scale, scale);
  if (style.background !== "transparent") {
    const gradient = ctx.createLinearGradient(
      0,
      0,
      layout.width,
      layout.height,
    );
    gradient.addColorStop(0, style.color);
    gradient.addColorStop(1, style.color2);
    ctx.fillStyle = style.background === "gradient" ? gradient : style.color;
    ctx.fillRect(0, 0, layout.width, layout.height);
    if (style.background === "image" && backgroundImage) {
      const k = Math.max(
        layout.width / backgroundImage.naturalWidth,
        layout.height / backgroundImage.naturalHeight,
      );
      ctx.drawImage(
        backgroundImage,
        (layout.width - backgroundImage.naturalWidth * k) / 2,
        (layout.height - backgroundImage.naturalHeight * k) / 2,
        backgroundImage.naturalWidth * k,
        backgroundImage.naturalHeight * k,
      );
    }
    if (style.background === "dots" || style.background === "grid") {
      ctx.fillStyle = style.color2;
      ctx.strokeStyle = style.color2;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 1;
      for (let x = 0; x < layout.width; x += 24)
        for (let y = 0; y < layout.height; y += 24) {
          if (style.background === "dots") {
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
          } else ctx.strokeRect(x, y, 24, 24);
        }
      ctx.globalAlpha = 1;
    }
  }
  const frameY = layout.y - layout.header,
    radius = Math.min(style.radius, c.width / 2, c.height / 2);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.35)";
  ctx.shadowBlur = style.shadow;
  ctx.shadowOffsetY = style.shadow / 3;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.roundRect(layout.x, frameY, c.width, c.height + layout.header, radius);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(layout.x, frameY, c.width, c.height + layout.header, radius);
  ctx.clip();
  if (style.frame) {
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(layout.x, frameY, c.width, layout.header);
    ["#fb7185", "#fbbf24", "#34d399"].forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(layout.x + 18 + i * 18, frameY + 20, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.save();
  ctx.beginPath();
  ctx.rect(layout.x, layout.y, c.width, c.height);
  ctx.clip();
  ctx.drawImage(
    image,
    c.x,
    c.y,
    c.width,
    c.height,
    layout.x,
    layout.y,
    c.width,
    c.height,
  );
  ctx.translate(layout.x - c.x, layout.y - c.y);
  // Redactions are applied last, so earlier labels or strokes cannot disclose their contents.
  marks.filter((m) => m.kind !== "redact").forEach((m) => drawMark(ctx, m));
  marks.filter((m) => m.kind === "redact").forEach((m) => drawMark(ctx, m));
  ctx.restore();
  ctx.restore();
  if (style.watermark) {
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#000";
    ctx.shadowBlur = 4;
    ctx.font = "500 16px system-ui";
    ctx.textAlign = "right";
    ctx.fillText(
      style.watermark.slice(0, 100),
      layout.width - 20,
      layout.height - 16,
    );
  }
  return layout;
}
export function canvasBlob(
  canvas: HTMLCanvasElement,
  mime = "image/png",
): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Image export failed")),
      mime,
      0.95,
    ),
  );
}
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (url.startsWith("capture-media:")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load this image"));
    img.src = url;
  });
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
