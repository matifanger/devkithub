import { differenceInDays } from 'date-fns';
import { Eye, EyeOff, Key, Puzzle, Settings, Terminal } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ThemeToggle } from './ui/theme-toggle';

import alfred from '../assets/images/alfred.png';
import raycast from '../assets/images/raycast.png';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: {
    name: string;
    email: string;
    license: {
      type: string;
      expires: string;
      key: string;
    };
  } | null;
}

export function ProfileModal({ open, onOpenChange, userData }: ProfileModalProps) {
  const [showLicenseKey, setShowLicenseKey] = useState(false);

  if (!userData) return null;

  const expiryDate = new Date(userData.license.expires);
  const isExpired = expiryDate < new Date();
  const daysRemaining = differenceInDays(expiryDate, new Date());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col">
        <DialogHeader>
          <DialogTitle>Profile & Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="general" className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Puzzle className="h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="updates" className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Updates
            </TabsTrigger>
            <TabsTrigger value="license" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              License
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 h-[400px]">
            <ScrollArea className="h-full">
              <div className="h-full">
                <TabsContent value="general" className="mt-0 border-0 h-full">
                  <Card className="h-full bg-transparent border-none p-0">
                    <CardHeader>
                      <CardTitle>General Settings</CardTitle>
                      <CardDescription>Manage your account preferences</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Theme Preference</Label>
                          <ThemeToggle />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="integrations" className="mt-0 border-0 h-full">
                  <Card className="h-full bg-transparent border-none">
                    <CardHeader>
                      <CardTitle>Integrations</CardTitle>
                      <CardDescription>
                        Integrations with other tools to enhance your workflow
                      </CardDescription>
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
                </TabsContent>

                <TabsContent value="updates" className="mt-0 border-0 h-full">
                  <Card className="h-full bg-transparent border-none">
                    <CardHeader>
                      <CardTitle>Updates</CardTitle>
                      <CardDescription>Manage automatic updates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Automatic Updates</Label>
                          <p className="text-sm text-muted-foreground">
                            Keep the app up to date automatically (Active)
                          </p>
                        </div>
                        <Switch checked disabled />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="license" className="mt-0 border-0 h-full">
                  <Card className="h-full bg-transparent border-none">
                    <CardHeader>
                      <CardTitle>License Information</CardTitle>
                      <CardDescription>Your current license details and status</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="mb-4">
                          <div className="text-sm font-medium">License Type</div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{userData.license.type}</span>
                            <Badge variant={isExpired ? 'destructive' : 'default'}>
                              {isExpired ? 'Expired' : 'Active'}
                            </Badge>
                          </div>
                        </div>
                        <div className="mb-4">
                          <div className="text-sm font-medium">License Key</div>
                          <div className="relative">
                            <code className="text-sm bg-muted p-2 rounded block mt-1">
                              {showLicenseKey ? userData.license.key : '••••••••••••••••'}
                            </code>
                            <button
                              onClick={() => setShowLicenseKey(!showLicenseKey)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showLicenseKey ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Support Status</div>
                          <div className="text-sm text-muted-foreground">
                            {isExpired
                              ? 'Your support period has expired'
                              : `${daysRemaining} days remaining in your support period`}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
