import React from "react";
import {
  CLOSE_TO_TRAY_KEY,
  LAUNCH_ON_STARTUP_KEY,
  VOICE_TRANSCRIPTION_ENABLED_KEY,
  VOICE_TRANSCRIPTION_SHORTCUT_KEY,
} from "../../../constants/settings-keys";
import { useAutosaveSettings } from "../../../contexts/autosave-settings-context";
import { useClipboardSettings } from "../../../hooks/use-clipboard-settings";
import { Input } from "../../ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Label } from "../../ui/label";
import { ScrollArea } from "../../ui/scroll-area";
import { Switch } from "../../ui/switch";

export function GeneralTab() {
  const { isEnabled, isLoading, toggleEnabled } = useClipboardSettings();
  const {
    autoSaveEnabled,
    saveIndicatorVisible,
    isLoading: autoSaveLoading,
    toggleAutoSave,
    toggleSaveIndicator,
  } = useAutosaveSettings();
  const [voiceEnabled, setVoiceEnabled] = React.useState(false);
  const [voiceShortcut, setVoiceShortcut] = React.useState("CommandOrControl+Shift+V");
  const [loadingVoice, setLoadingVoice] = React.useState(true);

  React.useEffect(() => {
    const loadVoice = async () => {
      const enabled = await window.electron.settingsStore.get(VOICE_TRANSCRIPTION_ENABLED_KEY);
      if (enabled !== null) setVoiceEnabled(enabled === "true");
      const shortcut = await window.electron.settingsStore.get(VOICE_TRANSCRIPTION_SHORTCUT_KEY);
      if (shortcut) setVoiceShortcut(shortcut);
      setLoadingVoice(false);
    };
    loadVoice();
  }, []);

  const [voiceShortcutError, setVoiceShortcutError] = React.useState("");
  const shortcutTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleVoice = async (value: boolean) => {
    setVoiceEnabled(value);
    setVoiceShortcutError("");
    await window.electron.settingsStore.set(VOICE_TRANSCRIPTION_ENABLED_KEY, String(value));
    if (value) {
      const result = await window.electron.voice.registerShortcut();
      if (!result.success) {
        setVoiceShortcutError(result.error || "Failed to register shortcut.");
      }
    } else {
      await window.electron.voice.unregisterShortcut();
    }
  };

  const updateVoiceShortcut = (shortcut: string) => {
    setVoiceShortcut(shortcut);
    setVoiceShortcutError("");
    if (shortcutTimerRef.current) clearTimeout(shortcutTimerRef.current);
    shortcutTimerRef.current = setTimeout(async () => {
      await window.electron.settingsStore.set(VOICE_TRANSCRIPTION_SHORTCUT_KEY, shortcut);
      if (voiceEnabled) {
        const result = await window.electron.voice.registerShortcut();
        if (!result.success) {
          setVoiceShortcutError(result.error || "Failed to register shortcut.");
        }
      }
    }, 600);
  };
  const [closeToTray, setCloseToTray] = React.useState<boolean>(false);
  const [loadingClosePref, setLoadingClosePref] = React.useState<boolean>(true);
  const [launchOnStartup, setLaunchOnStartup] = React.useState<boolean>(false);
  const [loadingAutostartPref, setLoadingAutostartPref] =
    React.useState<boolean>(true);

  React.useEffect(() => {
    const loadPref = async () => {
      const pref = await window.electron.settingsStore.get(CLOSE_TO_TRAY_KEY);
      if (pref === null) {
        setCloseToTray(false);
      } else {
        setCloseToTray(pref === "true");
      }
      setLoadingClosePref(false);
    };
    loadPref();
  }, []);

  const toggleCloseToTray = async (value: boolean) => {
    setCloseToTray(value);
    await window.electron.settingsStore.set(
      CLOSE_TO_TRAY_KEY,
      value ? "true" : "false",
    );
  };

  React.useEffect(() => {
    const loadAutostartPref = async () => {
      const pref = await window.electron.settingsStore.get(
        LAUNCH_ON_STARTUP_KEY,
      );
      if (pref === null) {
        setLaunchOnStartup(false);
      } else {
        setLaunchOnStartup(pref === "true");
      }
      setLoadingAutostartPref(false);
    };
    loadAutostartPref();
  }, []);

  const toggleAutostart = async (value: boolean) => {
    setLaunchOnStartup(value);
    await window.electron.settingsStore.set(
      LAUNCH_ON_STARTUP_KEY,
      value ? "true" : "false",
    );
  };

  return (
    <ScrollArea className="h-full">
      <Card className="h-full bg-transparent border-none p-0">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Manage your account preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Startup Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Startup</h3>
                <p className="text-xs text-muted-foreground">
                  Launch the app automatically when you sign in
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="launch-on-startup"
                  checked={!!launchOnStartup}
                  onCheckedChange={(v) => toggleAutostart(!!v)}
                  disabled={loadingAutostartPref}
                />
                <Label htmlFor="launch-on-startup" className="text-sm">
                  Launch DevKitHub at system startup
                  {loadingAutostartPref && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (Loading...)
                    </span>
                  )}
                </Label>
              </div>
            </div>

            {/* Clipboard Recommendations Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">
                  Clipboard Recommendations
                </h3>
                <p className="text-xs text-muted-foreground">
                  Automatically detect clipboard content and suggest relevant
                  tools
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="clipboard-recommendations"
                  checked={isEnabled}
                  onCheckedChange={toggleEnabled}
                  disabled={isLoading}
                />
                <Label htmlFor="clipboard-recommendations" className="text-sm">
                  Enable smart tool recommendations based on clipboard content
                  {isLoading && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (Loading...)
                    </span>
                  )}
                </Label>
              </div>

              {isEnabled && !isLoading && (
                <div className="text-xs text-muted-foreground pl-6">
                  <p>
                    • Detects JSON, URLs, Base64, HTML, and 20+ other content
                    types
                  </p>
                  <p>• Updates when window gains focus or becomes visible</p>
                  <p>
                    • All processing happens locally - no data is sent
                    externally
                  </p>
                </div>
              )}
            </div>

            {/* Voice Transcription Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Voice Transcription</h3>
                <p className="text-xs text-muted-foreground">
                  Activate a global shortcut to open voice transcription from
                  anywhere
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="voice-transcription"
                  checked={voiceEnabled}
                  onCheckedChange={(v) => toggleVoice(!!v)}
                  disabled={loadingVoice}
                />
                <Label htmlFor="voice-transcription" className="text-sm">
                  Enable voice transcription shortcut
                  {loadingVoice && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (Loading...)
                    </span>
                  )}
                </Label>
              </div>

              {voiceEnabled && !loadingVoice && (
                <div className="space-y-2 pl-6">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm whitespace-nowrap">
                      Global Shortcut:
                    </Label>
                    <Input
                      value={voiceShortcut}
                      onChange={(e) => updateVoiceShortcut(e.target.value)}
                      placeholder="e.g. CommandOrControl+Shift+V"
                      className="max-w-[280px] h-8 text-sm"
                    />
                  </div>
                  {voiceShortcutError ? (
                    <p className="text-xs text-destructive">
                      {voiceShortcutError}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Use Electron accelerator format (e.g.
                      CommandOrControl+Shift+V)
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Auto-Save Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Auto-Save</h3>
                <p className="text-xs text-muted-foreground">
                  Automatically save tool state so it persists across sessions
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-save"
                  checked={autoSaveEnabled}
                  onCheckedChange={(v) => toggleAutoSave(!!v)}
                  disabled={autoSaveLoading}
                />
                <Label htmlFor="auto-save" className="text-sm">
                  Enable auto-save globally
                  {autoSaveLoading && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (Loading...)
                    </span>
                  )}
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="save-indicator"
                  checked={saveIndicatorVisible}
                  onCheckedChange={(v) => toggleSaveIndicator(!!v)}
                  disabled={autoSaveLoading}
                />
                <Label htmlFor="save-indicator" className="text-sm">
                  Show save status indicator
                </Label>
              </div>

              {autoSaveEnabled && !autoSaveLoading && (
                <div className="text-xs text-muted-foreground pl-6">
                  <p>• Tool state is saved after 500ms of inactivity</p>
                  <p>• Data is stored locally in settings.json</p>
                  <p>• Individual tools can override this setting</p>
                </div>
              )}
            </div>

            {/* Close Behavior Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Close Behavior</h3>
                <p className="text-xs text-muted-foreground">
                  Choose if the app stays in the tray when closing or quits.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="close-to-tray"
                  checked={!!closeToTray}
                  onCheckedChange={(v) => toggleCloseToTray(!!v)}
                  disabled={loadingClosePref}
                />
                <Label htmlFor="close-to-tray" className="text-sm">
                  Keep in tray when closing
                  {loadingClosePref && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (Loading...)
                    </span>
                  )}
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ScrollArea>
  );
}
