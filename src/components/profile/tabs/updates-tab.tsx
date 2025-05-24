import { Download, ExternalLink } from 'lucide-react';
import React from 'react';
import { UpdateStatus } from '../../../types/profile';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { ScrollArea } from '../../ui/scroll-area';
import { Switch } from '../../ui/switch';

interface UpdatesTabProps {
  updatesEnabled: boolean;
  updateStatus: UpdateStatus;
  onUpdatePreferenceChange: (checked: boolean) => void;
  onDownloadUpdate: () => void;
  onViewChangelog: () => void;
}

export function UpdatesTab({
  updatesEnabled,
  updateStatus,
  onUpdatePreferenceChange,
  onDownloadUpdate,
  onViewChangelog,
}: UpdatesTabProps) {
  return (
    <ScrollArea className="h-full">
      <Card className="bg-transparent border-none">
        <CardHeader>
          <CardTitle>Updates</CardTitle>
          <CardDescription>Manage automatic updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label>Automatic Updates</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications when a new version is available
              </p>
            </div>
            <Switch checked={updatesEnabled} onCheckedChange={onUpdatePreferenceChange} />
          </div>

          <div className="border-t pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Version Information</Label>
                {updateStatus.isLoading && <Badge variant="default">Checking...</Badge>}
                {updateStatus.hasUpdate && !updateStatus.isLoading && (
                  <Badge variant="destructive">Update Available</Badge>
                )}
                {!updateStatus.hasUpdate && !updateStatus.isLoading && !updateStatus.error && (
                  <Badge variant="default">Up to date</Badge>
                )}
                {updateStatus.error && <Badge variant="default">Check failed</Badge>}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current version:</span>
                  <span className="font-mono">{updateStatus.currentVersion || 'Loading...'}</span>
                </div>
                {updateStatus.latestVersion && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Latest version:</span>
                    <span className="font-mono">{updateStatus.latestVersion}</span>
                  </div>
                )}
              </div>

              {updateStatus.hasUpdate && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="font-medium text-sm">New version available!</div>
                  {updateStatus.releaseNotes && (
                    <p className="text-sm text-muted-foreground">{updateStatus.releaseNotes}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={onDownloadUpdate}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onViewChangelog}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Changelog
                    </Button>
                  </div>
                </div>
              )}

              {updateStatus.error && (
                <div className="text-sm text-muted-foreground">{updateStatus.error}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </ScrollArea>
  );
}
