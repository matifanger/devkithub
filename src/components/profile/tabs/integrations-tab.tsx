import { Terminal } from 'lucide-react';
import React from 'react';
import { alfred, raycast } from '../../../constants/profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { ScrollArea } from '../../ui/scroll-area';

export function IntegrationsTab() {
  return (
    <ScrollArea className="h-full">
      <Card className="bg-transparent border-none">
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Integrations with other tools to enhance your workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 opacity-50">
              <Terminal className="h-10 w-10" />
              <div>
                <div className="font-medium">Terminal/CLI</div>
                <div className="text-sm text-muted-foreground">Coming soon</div>
              </div>
            </div>
            <div className="flex items-center gap-3 opacity-50">
              <img src={raycast} className="h-10 w-10" alt="Raycast" />
              <div>
                <div className="font-medium">Raycast</div>
                <div className="text-sm text-muted-foreground">Coming soon</div>
              </div>
            </div>
            <div className="flex items-center gap-3 opacity-50">
              <img src={alfred} className="h-10 w-10" alt="Alfred" />
              <div>
                <div className="font-medium">Alfred</div>
                <div className="text-sm text-muted-foreground">Coming soon</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ScrollArea>
  );
}
