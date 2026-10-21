// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  validateExport,
  videoArguments,
} from "../../main/capture/media-policy";
import {
  DEFAULT_SHOT_STYLE,
  normalizeCrop,
  shotLayout,
} from "../../utils/capture-image";
import {
  accessSignature,
  equalSecret,
  matchesMime,
  parseRange,
  passwordRecord,
} from "../../../../frontend/server/utils/capture-policy";
const options = {
  start: 2,
  end: 6,
  format: "mp4" as const,
  width: 1280,
  fps: 30,
  speed: 2,
  mute: false,
  volume: 1,
};
describe("Capture media output", () => {
  it("clamps reverse-drag crops to image bounds", () => {
    expect(
      normalizeCrop({ x: 110, y: 120 }, { x: -20, y: 30 }, 100, 100),
    ).toEqual({ x: 0, y: 30, width: 100, height: 70 });
  });
  it("fits a portrait into a wide canvas without cropping and positions frames", () => {
    const layout = shotLayout(300, 600, {
      ...DEFAULT_SHOT_STYLE,
      ratio: "16:9",
      frame: true,
    });
    expect(layout.width / layout.height).toBeCloseTo(16 / 9, 2);
    expect(layout.y).toBeGreaterThanOrEqual(40);
    expect(layout.x).toBeGreaterThan(64);
  });
  it("adjusts output duration for speed and encodes audio explicitly", () => {
    const args = videoArguments("input.webm", "output.mp4", options);
    expect(args[args.indexOf("-t") + 1]).toBe("2");
    expect(args).toContain("atempo=2,volume=1");
    expect(args).toContain("libx264");
    expect(args).toContain("+faststart");
  });
  it("generates actual GIF palette encoding and removes audio", () => {
    const args = videoArguments("input.webm", "output.gif", {
      ...options,
      format: "gif",
    });
    expect(args.join(" ")).toContain("palettegen");
    expect(args).toContain("-an");
    expect(args).not.toContain("aac");
  });
  it("rejects invalid input and filter injection", () => {
    for (const change of [
      { start: -1 },
      { end: 1 },
      { speed: NaN },
      { fps: 500 },
      { background: "red;movie=/etc/passwd" },
      { padding: -1 },
      { zoom: { start: 0, end: 3, scale: 2, x: 0.5, y: 0.5 } },
    ])
      expect(() => validateExport({ ...options, ...change })).toThrow();
  });
  it("adds eased zoom and padding to encoded pixels", () => {
    const args = videoArguments("a.webm", "b.mp4", {
      ...options,
      height: 720,
      padding: 32,
      zoom: { start: 3, end: 5, scale: 2, x: 0.8, y: 0.2 },
    });
    expect(args.join(" ")).toContain("zoompan");
    expect(args.join(" ")).toContain("pad=iw+64:ih+64");
  });
});
describe("Cloud access and streaming", () => {
  it("salts passwords and verifies only the matching password", () => {
    const a = passwordRecord("correct horse battery staple");
    expect(passwordRecord("correct horse battery staple").hash).not.toBe(
      a.hash,
    );
    expect(
      equalSecret(
        passwordRecord("correct horse battery staple", a.salt).hash,
        a.hash,
      ),
    ).toBe(true);
    expect(equalSecret(passwordRecord("wrong", a.salt).hash, a.hash)).toBe(
      false,
    );
  });
  it("binds access cookies to capture, expiry and server secret", () => {
    const a = accessSignature("id", "1000", "secret");
    expect(accessSignature("other", "1000", "secret")).not.toBe(a);
    expect(accessSignature("id", "1001", "secret")).not.toBe(a);
    expect(accessSignature("id", "1000", "other")).not.toBe(a);
  });
  it("serves normal, open-ended and suffix ranges, rejecting malformed ranges", () => {
    expect(parseRange("bytes=2-4", 10)).toEqual({ start: 2, end: 4 });
    expect(parseRange("bytes=5-", 10)).toEqual({ start: 5, end: 9 });
    expect(parseRange("bytes=-3", 10)).toEqual({ start: 7, end: 9 });
    expect(parseRange(undefined, 10)).toBeNull();
    for (const r of [
      "bytes=10-",
      "bytes=5-3",
      "bytes=0-1,3-4",
      "bytes=-0",
      "bytes=-",
    ])
      expect(() => parseRange(r, 10)).toThrow();
  });
  it("rejects HTML and mismatched content types disguised as images", () => {
    expect(matchesMime(Buffer.from("<html>secret</html>"), "image/png")).toBe(
      false,
    );
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(matchesMime(png, "image/png")).toBe(true);
    expect(matchesMime(png, "video/webm")).toBe(false);
  });
});
