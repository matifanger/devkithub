import React from 'react';
import { CLOSE_TO_TRAY_KEY } from '../../../constants/settings-keys';
import { useClipboardSettings } from '../../../hooks/use-clipboard-settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { ScrollArea } from '../../ui/scroll-area';
import { Switch } from '../../ui/switch';

export function GeneralTab() {
  const { isEnabled, isLoading, toggleEnabled } = useClipboardSettings();
  const [closeToTray, setCloseToTray] = React.useState<boolean>(false);
  const [loadingClosePref, setLoadingClosePref] = React.useState<boolean>(true);

  React.useEffect(() => {
    const loadPref = async () => {
      const pref = await window.electron.settingsStore.get(CLOSE_TO_TRAY_KEY);
      if (pref === null) {
        setCloseToTray(false);
      } else {
        setCloseToTray(pref === 'true');
      }
      setLoadingClosePref(false);
    };
    loadPref();
  }, []);

  const toggleCloseToTray = async (value: boolean) => {
    setCloseToTray(value);
    await window.electron.settingsStore.set(CLOSE_TO_TRAY_KEY, value ? 'true' : 'false');
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
            {/* Clipboard Recommendations Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Clipboard Recommendations</h3>
                <p className="text-xs text-muted-foreground">
                  Automatically detect clipboard content and suggest relevant tools
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
                    <span className="text-xs text-muted-foreground ml-1">(Loading...)</span>
                  )}
                </Label>
              </div>

              {isEnabled && !isLoading && (
                <div className="text-xs text-muted-foreground pl-6">
                  <p>• Detects JSON, URLs, Base64, HTML, and 20+ other content types</p>
                  <p>• Updates when window gains focus or becomes visible</p>
                  <p>• All processing happens locally - no data is sent externally</p>
                </div>
              )}
            </div>

            {/* Close Behavior Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Close Behavior</h3>
                <p className="text-xs text-muted-foreground">
                  Elige si al cerrar la ventana la app se quede en el tray o salga.
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
                  Mantener en la bandeja del sistema al cerrar
                  {loadingClosePref && (
                    <span className="text-xs text-muted-foreground ml-1">(Cargando...)</span>
                  )}
                </Label>
              </div>
            </div>

            <div className="text-sm text-muted-foreground pt-4 border-t">
              More general settings will be available here in future updates.
            </div>
          </div>
        </CardContent>
      </Card>
    </ScrollArea>
  );
}
