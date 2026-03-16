import React from 'react';
import { useAuth } from '../../../contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { ScrollArea } from '../../ui/scroll-area';
import { Switch } from '../../ui/switch';

export function DevTab() {
  const { isAuthenticated, setDevAuthenticated } = useAuth();
  const isDev = process.env.NODE_ENV !== 'production';

  if (!isDev) {
    return (
      <ScrollArea className="h-full">
        <Card className="h-full bg-transparent border-none p-0">
          <CardHeader>
            <CardTitle>Developer</CardTitle>
            <CardDescription>Developer settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This tab is only available in development mode.
            </p>
          </CardContent>
        </Card>
      </ScrollArea>
    );
  }

  const handleToggle = () => {
    setDevAuthenticated(!isAuthenticated);
  };

  return (
    <ScrollArea className="h-full">
      <Card className="h-full bg-transparent border-none p-0">
        <CardHeader>
          <CardTitle>Developer</CardTitle>
          <CardDescription>Development options and testing tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">License Simulation</h3>
                <p className="text-xs text-muted-foreground">
                  Toggle authentication state for testing premium features
                </p>
              </div>
              <Switch checked={isAuthenticated} onCheckedChange={handleToggle} />
            </div>
          </div>
        </CardContent>
      </Card>
    </ScrollArea>
  );
}
