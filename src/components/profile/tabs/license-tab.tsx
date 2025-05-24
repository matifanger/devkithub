import { differenceInDays } from 'date-fns';
import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { ActivateLicenseResponse } from '../../../types/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { ScrollArea } from '../../ui/scroll-area';

interface LicenseTabProps {
  userData: ActivateLicenseResponse;
}

export function LicenseTab({ userData }: LicenseTabProps) {
  const [showLicenseKey, setShowLicenseKey] = useState(false);

  // Calculate expiry date (1 year from activation)
  const expiryDate = new Date(userData.license?.created_at || '');
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const isExpired = expiryDate < new Date();
  const daysRemaining = differenceInDays(expiryDate, new Date());

  return (
    <ScrollArea className="h-full">
      <Card className="bg-transparent border-none">
        <CardHeader>
          <CardTitle>License Information</CardTitle>
          <CardDescription>Your current license details and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-4">
              <div className="text-sm font-medium">License Key</div>
              <div className="relative">
                <code className="text-sm bg-muted p-2 rounded block mt-1">
                  {showLicenseKey ? userData.license.license_key : '••••••••••••••••'}
                </code>
                <button
                  onClick={() => setShowLicenseKey(!showLicenseKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showLicenseKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium">Support Status</div>
              <div className="text-sm text-muted-foreground">
                {isExpired
                  ? 'Your support period has expired'
                  : `${daysRemaining} days remaining until your support period expires. You can extend your support period by renewing your license.`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ScrollArea>
  );
}
