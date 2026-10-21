import React from "react";
import { render, screen, fireEvent, act, cleanup, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { VoiceTranscriptionPage } from "../../pages/voice-transcription";

let transcript: (data: { text?: string; error?: string }) => void;
const voice = {
  getStatus: vi.fn(), startLocalSession: vi.fn(), stopLocalSession: vi.fn(), pushAudioChunk: vi.fn(),
  onTranscript: vi.fn((cb) => { transcript = cb; }), removeAllListeners: vi.fn(),
  onModelProgress: vi.fn(), downloadModel: vi.fn(),
};
const settings = { get: vi.fn(), set: vi.fn() };
const stopTrack = vi.fn();
class Recorder {
  static isTypeSupported() { return true; }
  state = "inactive";
  start() { this.state = "recording"; }
  stop() { this.state = "inactive"; }
}
beforeEach(() => {
  vi.clearAllMocks();
  settings.get.mockResolvedValue(null);
  voice.getStatus.mockResolvedValue({ binaryInstalled: true, modelInstalled: true });
  voice.startLocalSession.mockResolvedValue({ success: true });
  voice.stopLocalSession.mockResolvedValue({ success: true });
  voice.downloadModel.mockResolvedValue({ success: true });
  vi.stubGlobal("electron", { voice, settingsStore: settings });
  vi.stubGlobal("MediaRecorder", Recorder);
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] }) } });
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } });
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
async function open() {
  render(<VoiceTranscriptionPage />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Start" })).toBeEnabled());
}
describe("local voice transcription without API keys", () => {
  it("uses Whisper without cloud credentials on installations previously set to Google", async () => {
    settings.get.mockImplementation(async key => key === "voiceTranscriptionMode" ? "google" : null);
    await open();
    expect(screen.getByText("Whisper (Local)")).toBeInTheDocument();
    expect(settings.get).not.toHaveBeenCalledWith("voiceGoogleApiKey");
    expect(voice.startLocalSession).not.toHaveBeenCalled();
  });
  it("starts and stops a local session and releases the microphone", async () => {
    await open(); fireEvent.click(screen.getByRole("button", { name: "Start" }));
    await screen.findByRole("button", { name: "Stop" });
    expect(voice.startLocalSession).toHaveBeenCalledWith(expect.any(String), "ggml-tiny", "auto", false);
    fireEvent.click(screen.getByRole("button", { name: "Stop" }));
    await screen.findByRole("button", { name: "Start" });
    expect(stopTrack).toHaveBeenCalled(); expect(voice.stopLocalSession).toHaveBeenCalled();
  });
  it("appends transcripts, copies them and clears the text", async () => {
    await open();
    act(() => { transcript({ text: "Hello" }); transcript({ text: "world" }); });
    expect(screen.getByText("Hello world")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Copy/ }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Hello world"));
    fireEvent.click(screen.getByRole("button", { name: /Clear/ }));
    expect(screen.queryByText("Hello world")).not.toBeInTheDocument();
  });
  it("disables recording until the local runtime and model are installed", async () => {
    voice.getStatus.mockResolvedValue({ binaryInstalled: false, modelInstalled: false });
    render(<VoiceTranscriptionPage />);
    await waitFor(() => expect(voice.getStatus).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "Start" })).toBeDisabled();
  });
  it("reports microphone failures and closes the local session", async () => {
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(new Error("Permission denied"));
    await open(); fireEvent.click(screen.getByRole("button", { name: "Start" }));
    expect(await screen.findByText("Microphone error: Permission denied")).toBeInTheDocument();
    expect(voice.stopLocalSession).toHaveBeenCalled();
  });
  it("shows local engine errors", async () => {
    await open(); act(() => transcript({ error: "Local model unavailable" }));
    expect(screen.getByText("Local model unavailable")).toBeInTheDocument();
  });
});
