import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

let mockRecognitionInstance: any = null;

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = "";
  onstart: (() => void) | null = null;
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;

  constructor() {
    mockRecognitionInstance = this;
  }

  start() {
    setTimeout(() => this.onstart?.(), 0);
  }

  stop() {
    setTimeout(() => this.onend?.(), 0);
  }

  abort() {
    setTimeout(() => this.onend?.(), 0);
  }
}

Object.defineProperty(window, "webkitSpeechRecognition", {
  writable: true,
  value: MockSpeechRecognition,
});

Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

Element.prototype.scrollIntoView = vi.fn();

(window as any).electron = {
  settingsStore: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(true),
    delete: vi.fn().mockResolvedValue(true),
  },
  voice: {
    registerShortcut: vi.fn().mockResolvedValue({ success: true }),
    unregisterShortcut: vi.fn().mockResolvedValue({ success: true }),
    getConfig: vi.fn().mockResolvedValue({ mode: "google", model: "ggml-tiny", googleApiKey: "" }),
    getStatus: vi.fn().mockResolvedValue({
      binaryInstalled: false,
      modelInstalled: false,
      platform: "win32",
      arch: "x64",
      supported: true,
    }),
    downloadModel: vi.fn().mockResolvedValue({ success: true }),
    startLocalSession: vi.fn().mockResolvedValue({ success: true }),
    pushAudioChunk: vi.fn().mockResolvedValue(null),
    stopLocalSession: vi.fn().mockResolvedValue({ success: true }),
    onModelProgress: vi.fn(),
    onTranscript: vi.fn(),
    removeAllListeners: vi.fn(),
  },
  clipboardReadText: vi.fn().mockResolvedValue(""),
};

import { VoiceTranscriptionPage } from "../../pages/voice-transcription";

async function renderAndWait() {
  render(<VoiceTranscriptionPage />);
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
  await act(async () => {
    vi.advanceTimersByTime(200);
  });
}

/**
 * Render with auto-start enabled in google mode, so recognition fires automatically.
 */
async function renderWithAutoStart() {
  (window as any).electron.settingsStore.get.mockImplementation((key: string) => {
    if (key === "voiceTranscriptionMode") return Promise.resolve("google");
    if (key === "voiceAutoStart") return Promise.resolve("true");
    return Promise.resolve(null);
  });
  await renderAndWait();
}

describe("VoiceTranscriptionPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockRecognitionInstance = null;
    (window as any).electron.settingsStore.get.mockImplementation((key: string) => {
      if (key === "voiceTranscriptionMode") return Promise.resolve("google");
      return Promise.resolve(null);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders page title", () => {
    render(<VoiceTranscriptionPage />);
    expect(screen.getByText("Voice Transcription")).toBeDefined();
  });

  it("renders page description", () => {
    render(<VoiceTranscriptionPage />);
    expect(
      screen.getByText("Speak and see text appear in real-time."),
    ).toBeDefined();
  });

  it("does not auto-start when autoStart is off", async () => {
    await renderAndWait();
    expect(mockRecognitionInstance).toBeNull();
  });

  it("auto-starts recognition when autoStart is on in google mode", async () => {
    await renderWithAutoStart();
    expect(mockRecognitionInstance).not.toBeNull();
    expect(mockRecognitionInstance.continuous).toBe(true);
    expect(mockRecognitionInstance.interimResults).toBe(true);
  });

  it("shows Listening indicator when recognition starts", async () => {
    await renderWithAutoStart();
    expect(screen.getByText(/Listening/)).toBeDefined();
  });

  it("accumulates final results into continuous text", async () => {
    await renderWithAutoStart();

    await act(async () => {
      mockRecognitionInstance.onresult({
        resultIndex: 0,
        results: [
          { isFinal: true, 0: { transcript: "Hello world" }, length: 1 },
        ],
      });
    });

    await act(async () => {
      mockRecognitionInstance.onresult({
        resultIndex: 1,
        results: [
          { isFinal: true, 0: { transcript: "Hello world" }, length: 1 },
          { isFinal: true, 0: { transcript: "how are you" }, length: 1 },
        ],
      });
    });

    expect(screen.getByText(/Hello world how are you/)).toBeDefined();
  });

  it("shows interim text inline while speaking", async () => {
    await renderWithAutoStart();

    await act(async () => {
      mockRecognitionInstance.onresult({
        resultIndex: 0,
        results: [
          { isFinal: false, 0: { transcript: "Hello wor" }, length: 1 },
        ],
      });
    });

    expect(screen.getByText("Hello wor")).toBeDefined();
  });

  it("copies full text when Copy is clicked", async () => {
    await renderWithAutoStart();

    await act(async () => {
      mockRecognitionInstance.onresult({
        resultIndex: 0,
        results: [
          { isFinal: true, 0: { transcript: "Copy me" }, length: 1 },
        ],
      });
    });

    const copyButton = screen.getByText("Copy");
    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Copy me");
  });

  it("stops recognition when Stop is clicked", async () => {
    await renderWithAutoStart();

    const stopButton = screen.getByText("Stop");
    await act(async () => {
      fireEvent.click(stopButton);
      vi.advanceTimersByTime(10);
    });

    expect(screen.getByText("Start")).toBeDefined();
  });

  it("shows error on fatal recognition error", async () => {
    await renderWithAutoStart();

    await act(async () => {
      mockRecognitionInstance.onerror({ error: "not-allowed" });
    });

    expect(
      screen.getByText("Recognition error: not-allowed"),
    ).toBeDefined();
  });

  it("shows not supported message when SpeechRecognition is unavailable", async () => {
    const original = (window as any).webkitSpeechRecognition;
    try {
      (window as any).webkitSpeechRecognition = undefined;
      (window as any).SpeechRecognition = undefined;

      (window as any).electron.settingsStore.get.mockImplementation((key: string) => {
        if (key === "voiceTranscriptionMode") return Promise.resolve("google");
        if (key === "voiceAutoStart") return Promise.resolve("true");
        return Promise.resolve(null);
      });

      await renderAndWait();

      expect(screen.getByText("Not Supported")).toBeDefined();
    } finally {
      (window as any).webkitSpeechRecognition = original;
    }
  });

  it("clears text when Clear is clicked", async () => {
    await renderWithAutoStart();

    await act(async () => {
      mockRecognitionInstance.onresult({
        resultIndex: 0,
        results: [
          { isFinal: true, 0: { transcript: "Some text" }, length: 1 },
        ],
      });
    });

    expect(screen.getByText(/Some text/)).toBeDefined();

    const clearButton = screen.getByText("Clear");
    await act(async () => {
      fireEvent.click(clearButton);
    });

    expect(screen.queryByText(/Some text/)).toBeNull();
  });

  it("shows engine label in the settings button", async () => {
    await renderAndWait();
    expect(screen.getByText("Google Web Speech")).toBeDefined();
  });

  it("disables start button in whisper mode when model is not ready", async () => {
    (window as any).electron.settingsStore.get.mockImplementation((key: string) => {
      if (key === "voiceTranscriptionMode") return Promise.resolve("whisper-local");
      if (key === "voiceWhisperModel") return Promise.resolve("ggml-tiny");
      return Promise.resolve(null);
    });
    (window as any).electron.voice.getStatus.mockResolvedValue({
      binaryInstalled: false,
      modelInstalled: false,
      platform: "win32",
      arch: "x64",
      supported: true,
    });

    await renderAndWait();

    const startButton = screen.getByText("Start").closest("button")!;
    expect(startButton.disabled).toBe(true);
  });

  it("enables start button in whisper mode when model is ready", async () => {
    (window as any).electron.settingsStore.get.mockImplementation((key: string) => {
      if (key === "voiceTranscriptionMode") return Promise.resolve("whisper-local");
      if (key === "voiceWhisperModel") return Promise.resolve("ggml-tiny");
      return Promise.resolve(null);
    });
    (window as any).electron.voice.getStatus.mockResolvedValue({
      binaryInstalled: true,
      modelInstalled: true,
      platform: "win32",
      arch: "x64",
      supported: true,
    });

    await renderAndWait();

    const startButton = screen.getByText("Start").closest("button")!;
    expect(startButton.disabled).toBe(false);
  });

  it("checks whisper status on load in whisper-local mode", async () => {
    (window as any).electron.settingsStore.get.mockImplementation((key: string) => {
      if (key === "voiceTranscriptionMode") return Promise.resolve("whisper-local");
      if (key === "voiceWhisperModel") return Promise.resolve("ggml-tiny");
      return Promise.resolve(null);
    });

    await renderAndWait();

    expect((window as any).electron.voice.getStatus).toHaveBeenCalledWith("ggml-tiny");
  });

  it("registers transcript listener on mount", () => {
    render(<VoiceTranscriptionPage />);
    expect((window as any).electron.voice.onTranscript).toHaveBeenCalled();
  });

  it("manually starts and stops with Start/Stop buttons", async () => {
    await renderAndWait();

    expect(mockRecognitionInstance).toBeNull();

    const startButton = screen.getByText("Start");
    await act(async () => {
      fireEvent.click(startButton);
      vi.advanceTimersByTime(10);
    });

    expect(mockRecognitionInstance).not.toBeNull();
    expect(screen.getByText(/Listening/)).toBeDefined();
  });
});
