import type { VideoExportOptions } from "../../types/capture";

export const MEDIA_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  gif: "image/gif",
};
export function validId(id: string): string {
  if (typeof id !== "string" || !/^[a-f0-9-]{36}$/.test(id))
    throw new Error("Invalid capture identifier");
  return id;
}
export function cleanName(name: string): string {
  // File names cannot contain OS control characters.
  return (
    String(name)
      // eslint-disable-next-line no-control-regex
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
      .trim()
      .slice(0, 120) || "Untitled capture"
  );
}
export function validateExport(
  options: VideoExportOptions,
): VideoExportOptions {
  const { start, end, width, fps, volume, speed, format } = options;
  if (
    ![start, end, width, fps, volume, speed].every(Number.isFinite) ||
    start < 0 ||
    end <= start ||
    end - start > 86400
  )
    throw new Error("Choose a valid trim range");
  if (
    !["mp4", "webm", "gif"].includes(format) ||
    width < 160 ||
    width > 3840 ||
    !Number.isInteger(width) ||
    fps < 1 ||
    fps > 60 ||
    volume < 0 ||
    volume > 2 ||
    speed < 0.5 ||
    speed > 2
  )
    throw new Error("Invalid export settings");
  if (
    options.height !== undefined &&
    (!Number.isInteger(options.height) ||
      options.height < 16 ||
      options.height > 3840)
  )
    throw new Error("Invalid export height");
  if (
    options.padding !== undefined &&
    (!Number.isInteger(options.padding) ||
      options.padding < 0 ||
      options.padding > 200)
  )
    throw new Error("Invalid padding");
  if (options.background && !/^#[a-fA-F0-9]{6}$/.test(options.background))
    throw new Error("Invalid background color");
  if (options.zoom) {
    const z = options.zoom;
    if (
      !options.height ||
      ![z.start, z.end, z.scale, z.x, z.y].every(Number.isFinite) ||
      z.start < start ||
      z.end > end ||
      z.end <= z.start ||
      z.scale < 1 ||
      z.scale > 3 ||
      z.x < 0 ||
      z.x > 1 ||
      z.y < 0 ||
      z.y > 1
    )
      throw new Error("Invalid zoom segment");
  }
  return { ...options, width: Math.floor(width / 2) * 2 };
}
export function videoArguments(
  input: string,
  output: string,
  options: VideoExportOptions,
): string[] {
  const o = validateExport(options);
  const height = o.height ? Math.floor(o.height / 2) * 2 : -2;
  let filter = `setpts=(PTS-STARTPTS)/${o.speed},scale=${o.width}:${height}:flags=lanczos,fps=${o.fps}`;
  if (o.zoom) {
    const z = o.zoom,
      a = (z.start - o.start) / o.speed,
      b = (z.end - o.start) / o.speed;
    const ease = `(0.5-0.5*cos(PI*max(0,min(1,min((on/${o.fps}-${a})/0.3,(${b}-on/${o.fps})/0.3)))))`;
    filter += `,zoompan=z='1+${z.scale - 1}*${ease}':x='max(0,min(iw-iw/zoom,iw*${z.x}-iw/zoom/2))':y='max(0,min(ih-ih/zoom,ih*${z.y}-ih/zoom/2))':d=1:s=${o.width}x${height}:fps=${o.fps}`;
  }
  if (o.padding)
    filter += `,pad=iw+${o.padding * 2}:ih+${o.padding * 2}:${o.padding}:${o.padding}:color=${o.background || "#0f172a"}`;
  const args = [
    "-hide_banner",
    "-y",
    "-ss",
    String(o.start),
    "-protocol_whitelist",
    "file,pipe",
    "-i",
    input,
    "-t",
    String((o.end - o.start) / o.speed),
  ];
  if (o.format === "gif")
    args.push(
      "-filter_complex",
      `[0:v]${filter},split[a][b];[a]palettegen[p];[b][p]paletteuse`,
      "-an",
      "-loop",
      "0",
    );
  else {
    args.push("-vf", filter, "-map", "0:v:0");
    if (o.mute) args.push("-an");
    else
      args.push(
        "-map",
        "0:a?",
        "-af",
        `atempo=${o.speed},volume=${o.volume}`,
        "-c:a",
        o.format === "mp4" ? "aac" : "libopus",
      );
    args.push(
      "-c:v",
      o.format === "mp4" ? "libx264" : "libvpx-vp9",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
    );
    if (o.format === "mp4")
      args.push("-preset", "veryfast", "-movflags", "+faststart");
    else args.push("-b:v", "0", "-deadline", "realtime", "-cpu-used", "6");
  }
  return [...args, "-progress", "pipe:1", "-nostats", output];
}
