/** Local Whisper transcription. No hosted speech service or API key. */

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Mic,
  MicOff,
  Trash2,
  Copy,
  Check,
  Loader2,
  Download,
  CheckCircle2,
  AlertCircle,
  Settings2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  ToolPageContainer,
  ToolPageHeader,
} from "../components/tool-page-layout";
import {
  VOICE_WHISPER_MODEL_KEY,
  VOICE_WHISPER_LANGUAGE_KEY,
  VOICE_WHISPER_TRANSLATE_KEY,
  VOICE_AUTO_START_KEY,
} from "../constants/settings-keys";


const WHISPER_LANGUAGES = [
  { value: "auto", label: "Auto-detect" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "ar", label: "Arabic" },
  { value: "nl", label: "Dutch" },
  { value: "pl", label: "Polish" },
  { value: "tr", label: "Turkish" },
  { value: "hi", label: "Hindi" },
  { value: "uk", label: "Ukrainian" },
  { value: "sv", label: "Swedish" },
  { value: "da", label: "Danish" },
  { value: "fi", label: "Finnish" },
  { value: "no", label: "Norwegian" },
  { value: "he", label: "Hebrew" },
  { value: "th", label: "Thai" },
  { value: "vi", label: "Vietnamese" },
  { value: "id", label: "Indonesian" },
];

export function VoiceTranscriptionPage() {
  const [isListening, setIsListening] = useState(false);
  const [fullText, setFullText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // ─── Configuration state ────────────────────────────────────────────
  const voiceMode = "whisper-local";
  const [whisperModel, setWhisperModel] = useState("ggml-tiny");
  const [whisperLanguage, setWhisperLanguage] = useState("auto");
  const [whisperTranslate, setWhisperTranslate] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  // ─── Whisper download state ─────────────────────────────────────────
  const [modelDownloadStatus, setModelDownloadStatus] = useState<
    "idle" | "downloading" | "ready" | "error"
  >("idle");
  const [modelDownloadProgress, setModelDownloadProgress] = useState(0);
  const [modelDownloadDetail, setModelDownloadDetail] = useState("");
  const [modelDownloadError, setModelDownloadError] = useState("");

  // ─── Refs ───────────────────────────────────────────────────────────
  const textEndRef = useRef<HTMLDivElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const whisperActiveRef = useRef(false);
  const chunkTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const autoStartFiredRef = useRef(false);
  const pendingRestartRef = useRef(false);

  // ─── Load configuration ─────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        if (!window.electron?.voice || !window.electron?.settingsStore) {
          setConfigLoaded(true);
          return;
        }
        const [model, lang, translatePref, autoStartPref] = await Promise.all([
          window.electron.settingsStore.get(VOICE_WHISPER_MODEL_KEY),
          window.electron.settingsStore.get(VOICE_WHISPER_LANGUAGE_KEY),
          window.electron.settingsStore.get(VOICE_WHISPER_TRANSLATE_KEY),
          window.electron.settingsStore.get(VOICE_AUTO_START_KEY),
        ]);
        if (model) setWhisperModel(model);
        if (lang) setWhisperLanguage(lang);
        if (translatePref === "true") setWhisperTranslate(true);
        if (autoStartPref === "true") setAutoStart(true);

        {
          const status = await window.electron.voice.getStatus(model || "ggml-tiny");
          if (status.modelInstalled && status.binaryInstalled) {
            setModelDownloadStatus("ready");
          }
        }
      } catch {}
      setConfigLoaded(true);
    };
    load();
  }, []);

  // ─── Whisper IPC transcript listener ────────────────────────────────
  useEffect(() => {
    if (!window.electron?.voice) return;
    window.electron.voice.onTranscript((data) => {
      if (data.error) {
        setError(data.error);
        return;
      }
      if (data.text) {
        setFullText((prev) => {
          const separator = prev.length > 0 ? " " : "";
          return prev + separator + data.text;
        });
        setInterimText("");
      }
    });

    return () => {
      window.electron.voice.removeAllListeners();
    };
  }, []);

  // ─── Whisper Local (whisper.cpp via IPC) ────────────────────────────

  const startWhisperListening = useCallback(async () => {
    setError("");

    const status = await window.electron.voice.getStatus(whisperModel);
    if (!status.binaryInstalled || !status.modelInstalled) {
      setError("Whisper binary/model not installed. Download it first from the settings panel.");
      return;
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const result = await window.electron.voice.startLocalSession(
      sessionId,
      whisperModel,
      whisperLanguage,
      whisperTranslate,
    );

    if (!result.success) {
      setError(result.error || "Failed to start whisper session");
      return;
    }

    sessionIdRef.current = sessionId;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      whisperActiveRef.current = true;

      recorder.ondataavailable = async (e) => {
        if (e.data.size > 0 && whisperActiveRef.current && sessionIdRef.current) {
          const arrayBuffer = await e.data.arrayBuffer();
          await window.electron.voice.pushAudioChunk(sessionIdRef.current, arrayBuffer);
        }
      };

      recorder.start();
      setIsListening(true);

      chunkTimerRef.current = setInterval(() => {
        if (recorder.state === "recording") {
          recorder.stop();
          recorder.start();
        }
      }, 4000);
    } catch (err: any) {
      setError(`Microphone error: ${err?.message || err}`);
      await window.electron.voice.stopLocalSession(sessionId);
      sessionIdRef.current = null;
    }
  }, [whisperModel, whisperLanguage, whisperTranslate]);

  const stopWhisperListening = useCallback(async () => {
    whisperActiveRef.current = false;

    if (chunkTimerRef.current) {
      clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    mediaRecorderRef.current = null;

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }

    if (sessionIdRef.current) {
      await window.electron.voice.stopLocalSession(sessionIdRef.current);
      sessionIdRef.current = null;
    }

    setIsListening(false);
    setInterimText("");
  }, []);

  // ─── Unified controls ──────────────────────────────────────────────

  const startListening = startWhisperListening;
  const stopListening = stopWhisperListening;

  // ─── Auto-start on mount ───────────────────────────────────────────
  useEffect(() => {
    if (!configLoaded || autoStartFiredRef.current) return;
    autoStartFiredRef.current = true;

    if (!autoStart) return;

    if (voiceMode === "whisper-local" && modelDownloadStatus === "ready") {
      const timer = setTimeout(() => startWhisperListening(), 100);
      return () => clearTimeout(timer);
    }
  }, [configLoaded, autoStart, voiceMode, modelDownloadStatus, startWhisperListening]);

  useEffect(() => {
    return () => {
      stopWhisperListening();
    };
  }, [stopWhisperListening]);

  useEffect(() => {
    textEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [fullText, interimText]);

  // ─── Configuration handlers ────────────────────────────────────────

  const handleModelChange = async (model: string) => {
    const wasListening = isListening;
    if (wasListening) {
      pendingRestartRef.current = true;
      await stopWhisperListening();
    }
    setModelDownloadStatus("idle");
    setModelDownloadProgress(0);
    setWhisperModel(model);
    window.electron.settingsStore.set(VOICE_WHISPER_MODEL_KEY, model);

    const status = await window.electron.voice.getStatus(model);
    if (status.modelInstalled && status.binaryInstalled) {
      setModelDownloadStatus("ready");
      if (wasListening) {
        pendingRestartRef.current = false;
        setTimeout(() => startWhisperListening(), 200);
      }
    } else {
      pendingRestartRef.current = false;
    }
  };

  const handleLanguageChange = async (lang: string) => {
    const wasListening = isListening && voiceMode === "whisper-local";
    if (wasListening) await stopWhisperListening();
    setWhisperLanguage(lang);
    window.electron.settingsStore.set(VOICE_WHISPER_LANGUAGE_KEY, lang);
    if (wasListening) setTimeout(() => startWhisperListening(), 200);
  };

  const handleTranslateChange = async (checked: boolean) => {
    const wasListening = isListening && voiceMode === "whisper-local";
    if (wasListening) await stopWhisperListening();
    setWhisperTranslate(checked);
    window.electron.settingsStore.set(VOICE_WHISPER_TRANSLATE_KEY, checked ? "true" : "false");
    if (wasListening) setTimeout(() => startWhisperListening(), 200);
  };

  const handleAutoStartChange = (checked: boolean) => {
    setAutoStart(checked);
    window.electron.settingsStore.set(VOICE_AUTO_START_KEY, checked ? "true" : "false");
  };

  const handleDownloadModel = async () => {
    setModelDownloadStatus("downloading");
    setModelDownloadProgress(0);
    setModelDownloadError("");
    setModelDownloadDetail("");

    window.electron.voice.onModelProgress((progress) => {
      setModelDownloadProgress(progress.percent);
      if (progress.detail) setModelDownloadDetail(progress.detail);
      if (progress.status === "done") {
        setModelDownloadStatus("ready");
      }
    });

    const result = await window.electron.voice.downloadModel(whisperModel);

    if (!result.success) {
      setModelDownloadStatus("error");
      setModelDownloadError(result.error || "Download failed");
    }
  };

  // ─── Copy / clear ──────────────────────────────────────────────────

  const handleCopy = async () => {
    if (!fullText) return;
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleClear = () => {
    setFullText("");
    setInterimText("");
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  // ─── Render ────────────────────────────────────────────────────────

  const modeLabel = "Whisper (Local)";
  const hasText = fullText.length > 0 || interimText.length > 0;

  return (
    <ToolPageContainer>
      <ToolPageHeader
        title="Voice Transcription"
        description="Speak and see text appear in real-time."
      />

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          onClick={toggleListening}
          variant={isListening ? "destructive" : "default"}
          className="gap-2"
          disabled={voiceMode === "whisper-local" && modelDownloadStatus !== "ready"}
        >
          {isListening ? (
            <>
              <MicOff className="h-4 w-4" />
              Stop
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              Start
            </>
          )}
        </Button>

        {fullText && (
          <>
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear} className="gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          </>
        )}

        {isListening && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            Listening…
          </div>
        )}

        {/* ── Settings popover ──────────────────────────────────── */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto gap-1.5">
              <Settings2 className="h-3.5 w-3.5" />
              {modeLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              {/* Auto-start toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="voice-autostart" className="text-xs font-medium">
                  Auto-start on open
                </Label>
                <Switch
                  id="voice-autostart"
                  checked={autoStart}
                  onCheckedChange={handleAutoStartChange}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Engine</Label>
                <Select value={voiceMode} disabled>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>

                    <SelectItem value="whisper-local">
                      Whisper (Local)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {voiceMode === "whisper-local" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Model</Label>
                    <Select
                      value={whisperModel}
                      onValueChange={handleModelChange}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ggml-tiny">Tiny (~75 MB)</SelectItem>
                        <SelectItem value="ggml-base">Base (~142 MB)</SelectItem>
                        <SelectItem value="ggml-small">Small (~466 MB)</SelectItem>
                        <SelectItem value="ggml-medium-q5_0">Medium Q5 (~514 MB)</SelectItem>
                        <SelectItem value="ggml-large-v3-turbo-q5_0">Large v3 Turbo Q5 (~547 MB)</SelectItem>
                        <SelectItem value="ggml-large-v3-q5_0">Large v3 Q5 (~1 GB)</SelectItem>
                        <SelectItem value="ggml-large-v3">Large v3 Full (~2.9 GB)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Language</Label>
                    <Select
                      value={whisperLanguage}
                      onValueChange={handleLanguageChange}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WHISPER_LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="voice-translate" className="text-xs font-medium">
                      Translate to English
                    </Label>
                    <Switch
                      id="voice-translate"
                      checked={whisperTranslate}
                      onCheckedChange={handleTranslateChange}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {modelDownloadStatus === "idle" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 w-full"
                        onClick={handleDownloadModel}
                      >
                        <Download className="h-3.5 w-3.5" />
                        Download Binary &amp; Model
                      </Button>
                    )}
                    {modelDownloadStatus === "downloading" && (
                      <div className="space-y-1.5 w-full">
                        <div className="flex items-center gap-2 w-full">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
                          <div className="flex-1">
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-300"
                                style={{ width: `${modelDownloadProgress}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {modelDownloadProgress}%
                          </span>
                        </div>
                        {modelDownloadDetail && (
                          <p className="text-[11px] text-muted-foreground truncate">
                            {modelDownloadDetail}
                          </p>
                        )}
                      </div>
                    )}
                    {modelDownloadStatus === "ready" && (
                      <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-medium">
                          Ready to use
                        </span>
                      </div>
                    )}
                    {modelDownloadStatus === "error" && (
                      <div className="space-y-1.5 w-full">
                        <div className="flex items-center gap-1.5 text-destructive">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          <span className="text-xs truncate">
                            {modelDownloadError}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 w-full"
                          onClick={() => setModelDownloadStatus("idle")}
                        >
                          Retry
                        </Button>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Runs 100% offline using whisper.cpp. Larger models are
                    more accurate for non-English languages. Settings changes
                    auto-restart the active session.
                  </p>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* ── Error banner ────────────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      {/* ── Transcription text area ──────────────────────────────── */}
      <div className="flex-1 min-h-[calc(100vh-20rem)] rounded-lg border bg-muted/20 p-6 flex flex-col">
        {!hasText ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Mic className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-sm">
              {isListening
                ? "Speak now… your words will appear here"
                : "Click Start to begin transcription"}
            </p>
          </div>
        ) : (
          <div className="flex-1">
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {fullText}
              {interimText && (
                <span className="text-muted-foreground opacity-60">
                  {fullText ? " " : ""}{interimText}
                </span>
              )}
              {isListening && voiceMode === "whisper-local" && !interimText && (
                <span className="text-muted-foreground opacity-50 text-sm">
                  {fullText ? " " : ""}Transcribing…
                </span>
              )}
              {isListening && (
                <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 align-text-bottom animate-pulse" />
              )}
            </p>
            <div ref={textEndRef} />
          </div>
        )}
      </div>
    </ToolPageContainer>
  );
}
