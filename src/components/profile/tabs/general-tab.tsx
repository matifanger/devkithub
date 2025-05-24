import React from 'react';
import { useClipboardSettings } from '../../../hooks/use-clipboard-settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { ScrollArea } from '../../ui/scroll-area';
import { Switch } from '../../ui/switch';

export function GeneralTab() {
  const { isEnabled, isLoading, toggleEnabled } = useClipboardSettings();

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

            <div className="text-sm text-muted-foreground pt-4 border-t">
              More general settings will be available here in future updates.
            </div>
          </div>
        </CardContent>
      </Card>
    </ScrollArea>
  );
}
