import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { ScrollArea } from '../../ui/scroll-area';

export function GeneralTab() {
  return (
    <ScrollArea className="h-full">
      <Card className="h-full bg-transparent border-none p-0">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Manage your account preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              More general settings will be available here in future updates.
            </div>
          </div>
        </CardContent>
      </Card>
    </ScrollArea>
  );
}
