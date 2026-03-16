import React from "react";
import {
  CLOSE_TO_TRAY_KEY,
  LAUNCH_ON_STARTUP_KEY,
} from "../../../constants/settings-keys";
import { useClipboardSettings } from "../../../hooks/use-clipboard-settings";
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
