export interface CaptureSource {
  id: string;
  name: string;
  thumbnail: string;
  kind: "screen" | "window";
}
export interface CaptureAsset {
  id: string;
  name: string;
  kind: "image" | "video";
  mime: string;
  extension: string;
  createdAt: number;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  url: string;
  thumbnail?: string;
  share?: { id: string; url: string; expiresAt: number; server: string };
}
export interface VideoExportOptions {
  start: number;
  end: number;
  format: "mp4" | "webm" | "gif";
  width: number;
  fps: number;
  mute: boolean;
  volume: number;
  speed: number;
  height?: number;
  padding?: number;
  background?: string;
  zoom?: { start: number; end: number; scale: number; x: number; y: number };
}
export interface CloudSettings {
  url: string;
  configured: boolean;
}
export interface CaptureApi {
  sources(): Promise<CaptureSource[]>;
  platform(): Promise<string>;
  list(): Promise<CaptureAsset[]>;
  get(id: string): Promise<CaptureAsset>;
  saveImage(data: ArrayBuffer, name: string): Promise<CaptureAsset>;
  beginRecording(name: string, mime: string): Promise<string>;
  appendRecording(id: string, data: ArrayBuffer): Promise<void>;
  finishRecording(
    id: string,
    details: { duration: number; width: number; height: number },
  ): Promise<CaptureAsset>;
  abortRecording(id: string): Promise<void>;
  importMedia(kind: "image" | "video"): Promise<CaptureAsset | null>;
  download(id: string): Promise<boolean>;
  remove(id: string): Promise<void>;
  rename(id: string, name: string): Promise<void>;
  copyImage(id: string): Promise<void>;
  pin(id: string): Promise<void>;
  exportVideo(id: string, options: VideoExportOptions): Promise<CaptureAsset>;
  cancelExport(): Promise<void>;
  onExportProgress(callback: (percent: number) => void): () => void;
  onShortcut(
    callback: (action: "capture" | "record" | "pause") => void,
  ): () => void;
  cloudSettings(): Promise<CloudSettings>;
  configureCloud(url: string, token: string): Promise<CloudSettings>;
  share(id: string, days: number, password: string): Promise<CaptureAsset>;
  revokeShare(id: string): Promise<void>;
}
