import type { CaptureAsset } from "../types/capture";
import {
  captureApi,
  desktopStream,
  errorMessage,
} from "../components/capture/shared";

export interface RecorderOptions {
  source: string;
  fps: number;
  microphone: boolean;
  systemAudio: boolean;
  camera: boolean;
  delay: number;
  quality: number;
  crop: { x: number; y: number; width: number; height: number } | null;
}
export interface RecorderState {
  phase: "idle" | "preparing" | "countdown" | "recording" | "paused" | "saving";
  seconds: number;
  countdown: number;
  error: string;
  asset: CaptureAsset | null;
  stream: MediaStream | null;
}

// A single renderer session survives route changes; the recording is owned by the app,
// not by the page component. Every chunk reaches disk before finalization.
export class CaptureRecorder {
  private state: RecorderState = {
    phase: "idle",
    seconds: 0,
    countdown: 0,
    error: "",
    asset: null,
    stream: null,
  };
  private listeners = new Set<() => void>();
  private streams: MediaStream[] = [];
  private media: MediaRecorder | null = null;
  private audio: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private frame: ReturnType<typeof setInterval> | null = null;
  private videos: HTMLVideoElement[] = [];
  private id: string | null = null;
  private pending: Promise<void> = Promise.resolve();
  private writeError: unknown = null;
  private started = 0;
  private elapsed = 0;
  private canceled = false;
  private queuedBytes = 0;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  snapshot = () => this.state;
  private update(patch: Partial<RecorderState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }
  private time() {
    return (
      this.elapsed +
      (this.state.phase === "recording"
        ? (performance.now() - this.started) / 1000
        : 0)
    );
  }
  private async video(stream: MediaStream) {
    const v = document.createElement("video");
    v.srcObject = stream;
    v.muted = true;
    this.videos.push(v);
    await v.play();
    return v;
  }
  async start(options: RecorderOptions) {
    if (this.state.phase !== "idle") return;
    this.canceled = false;
    this.elapsed = 0;
    this.pending = Promise.resolve();
    this.writeError = null;
    this.queuedBytes = 0;
    this.update({ phase: "preparing", error: "", asset: null, seconds: 0 });
    try {
      const screen = await desktopStream(
        options.source,
        options.systemAudio,
        options.fps,
      );
      this.streams.push(screen);
      if (this.canceled) throw new Error("Recording canceled");
      if (options.systemAudio && !screen.getAudioTracks().length)
        throw new Error(
          "System audio is unavailable for this source. Disable system audio or choose another screen.",
        );
      const screenVideo = await this.video(screen);
      let camera: HTMLVideoElement | null = null;
      if (options.camera) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
        this.streams.push(stream);
        camera = await this.video(stream);
      }
      const audioTracks = [...screen.getAudioTracks()];
      if (options.microphone) {
        const mic = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: false,
        });
        this.streams.push(mic);
        audioTracks.push(...mic.getAudioTracks());
      }
      if (this.canceled) throw new Error("Recording canceled");
      let output = screen;
      if (options.crop || camera) {
        const c = options.crop || {
          x: 0,
          y: 0,
          width: screenVideo.videoWidth,
          height: screenVideo.videoHeight,
        };
        if (
          ![c.x, c.y, c.width, c.height].every(Number.isFinite) ||
          c.width < 16 ||
          c.height < 16 ||
          c.x < 0 ||
          c.y < 0 ||
          c.x + c.width > screenVideo.videoWidth ||
          c.y + c.height > screenVideo.videoHeight
        )
          throw new Error(
            `Crop must fit inside ${screenVideo.videoWidth} × ${screenVideo.videoHeight}`,
          );
        const canvas = document.createElement("canvas");
        canvas.width = c.width;
        canvas.height = c.height;
        const ctx = canvas.getContext("2d")!;
        const draw = () => {
          ctx.drawImage(
            screenVideo,
            c.x,
            c.y,
            c.width,
            c.height,
            0,
            0,
            c.width,
            c.height,
          );
          if (camera) {
            const radius = Math.max(8, Math.min(c.width, c.height) * 0.12),
              cx = c.width - radius - 16,
              cy = c.height - radius - 16;
            const side = Math.min(camera.videoWidth, camera.videoHeight);
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(
              camera,
              (camera.videoWidth - side) / 2,
              (camera.videoHeight - side) / 2,
              side,
              side,
              cx - radius,
              cy - radius,
              radius * 2,
              radius * 2,
            );
            ctx.restore();
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.stroke();
          }
        };
        draw();
        this.frame = setInterval(draw, 1000 / options.fps);
        output = canvas.captureStream(options.fps);
        this.streams.push(output);
      }
      const combined = new MediaStream(output.getVideoTracks());
      if (audioTracks.length) {
        this.audio = new AudioContext();
        await this.audio.resume();
        const destination = this.audio.createMediaStreamDestination();
        for (const track of audioTracks)
          this.audio
            .createMediaStreamSource(new MediaStream([track]))
            .connect(destination);
        destination.stream
          .getAudioTracks()
          .forEach((t) => combined.addTrack(t));
        this.streams.push(destination.stream);
      }
      this.update({ stream: combined, phase: "countdown" });
      for (let i = options.delay; i > 0; i--) {
        this.update({ countdown: i });
        await new Promise((r) => setTimeout(r, 1000));
        if (this.canceled) throw new Error("Recording canceled");
      }
      if (this.canceled) throw new Error("Recording canceled");
      const mime = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ].find((m) => MediaRecorder.isTypeSupported(m));
      if (!mime) throw new Error("This system does not support WebM recording");
      const media = new MediaRecorder(combined, {
        mimeType: mime,
        videoBitsPerSecond: options.quality * 1000000,
      });
      this.media = media;
      this.id = await captureApi().beginRecording(
        `Recording ${new Date().toLocaleString()}`,
        mime,
      );
      if (this.canceled) throw new Error("Recording canceled");
      const id = this.id;
      media.ondataavailable = (event) => {
        if (!event.data.size) return;
        if (this.queuedBytes + event.data.size > 64 * 1024 * 1024) {
          this.writeError = new Error(
            "The disk could not keep up with recording. Try a lower bitrate.",
          );
          this.stop();
          return;
        }
        this.queuedBytes += event.data.size;
        this.pending = this.pending
          .then(async () => {
            if (!this.writeError)
              await captureApi().appendRecording(
                id,
                await event.data.arrayBuffer(),
              );
          })
          .catch((error) => {
            this.writeError = error;
            this.update({
              error: `Could not save recording: ${errorMessage(error)}`,
            });
            this.stop();
          })
          .finally(() => {
            this.queuedBytes -= event.data.size;
          });
      };
      media.onerror = () => {
        this.writeError = new Error("Recording encoder failed");
        this.stop();
      };
      media.onstop = async () => {
        this.update({ phase: "saving" });
        try {
          await this.pending;
          const settings = combined.getVideoTracks()[0].getSettings();
          const asset = await captureApi().finishRecording(id, {
            duration: Math.max(0.01, this.elapsed),
            width: settings.width || screenVideo.videoWidth,
            height: settings.height || screenVideo.videoHeight,
          });
          this.update({
            asset,
            error: this.writeError
              ? `Saved a partial recording after a disk error: ${errorMessage(this.writeError)}`
              : "",
          });
        } catch (e) {
          this.update({ error: errorMessage(e) });
        } finally {
          this.cleanup();
          this.id = null;
          this.update({ phase: "idle", stream: null, countdown: 0 });
        }
      };
      screen.getVideoTracks()[0].onended = () => this.stop();
      this.started = performance.now();
      this.update({ phase: "recording", countdown: 0 });
      media.start(1000);
      this.timer = setInterval(
        () => this.update({ seconds: this.time() }),
        250,
      );
    } catch (e) {
      if (this.id)
        await captureApi()
          .abortRecording(this.id)
          .catch(() => {});
      this.id = null;
      this.cleanup();
      this.update({
        phase: "idle",
        stream: null,
        countdown: 0,
        error: errorMessage(e),
      });
    }
  }
  pause() {
    if (this.media?.state === "recording") {
      this.elapsed = this.time();
      this.media.pause();
      this.update({ phase: "paused", seconds: this.elapsed });
    } else if (this.media?.state === "paused") {
      this.media.resume();
      this.started = performance.now();
      this.update({ phase: "recording" });
    }
  }
  stop() {
    if (this.state.phase === "preparing" || this.state.phase === "countdown") {
      this.canceled = true;
      return;
    }
    if (
      !this.media ||
      this.media.state === "inactive" ||
      this.state.phase === "saving"
    )
      return;
    this.elapsed = this.time();
    this.update({ seconds: this.elapsed, phase: "saving" });
    this.media.stop();
  }
  clear() {
    if (this.state.phase === "idle")
      this.update({ seconds: 0, error: "", asset: null });
  }
  private cleanup() {
    if (this.timer) clearInterval(this.timer);
    if (this.frame) clearInterval(this.frame);
    this.timer = null;
    this.frame = null;
    for (const stream of this.streams)
      for (const track of stream.getTracks()) {
        track.onended = null;
        track.stop();
      }
    this.streams = [];
    this.videos.forEach((v) => {
      v.pause();
      v.srcObject = null;
    });
    this.videos = [];
    void this.audio?.close();
    this.audio = null;
    this.media = null;
  }
}
export const captureRecorder = new CaptureRecorder();
