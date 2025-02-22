import React from 'react';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

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
  if (!userData) return null;

  const expiryDate = new Date(userData.license.expires);
  const isExpired = expiryDate < new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Profile & Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="license" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="license">License</TabsTrigger>
          </TabsList>
          <TabsContent value="license">
            <Card>
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
                    <code className="text-sm bg-muted p-2 rounded block mt-1">
                      {userData.license.key}
                    </code>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Expiration Date</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(userData.license.expires).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
