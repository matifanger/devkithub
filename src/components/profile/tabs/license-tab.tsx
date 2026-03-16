import { differenceInDays } from "date-fns";
import { Check, Crown, Eye, EyeOff, Sparkles, Zap } from "lucide-react";
import React, { useState } from "react";
import { useAuth } from "../../../contexts/auth-context";
import { ActivateLicenseResponse } from "../../../types/types";
import { Button } from "../../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { ScrollArea } from "../../ui/scroll-area";

interface LicenseTabProps {
  userData: ActivateLicenseResponse;
}

export function LicenseTab({ userData }: LicenseTabProps) {
  const [showLicenseKey, setShowLicenseKey] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [licenseKey, setLicenseKey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  if (!userData?.license) {
    const features = [
      "Access to all premium tools",
      "Advanced features",
      "Priority support",
    ];

    const handleGetPro = () => {
      window.electron.openExternal("https://devkithub.com/pricing");
    };

    const handleActivate = async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);

      try {
        const { success, message } = await login(licenseKey);
        if (success) {
          setShowActivateModal(false);
          setLicenseKey("");
        } else {
          setError(message || "Invalid license key");
        }
      } catch {
        setError("Failed to activate license. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <ScrollArea className="h-full">
        <div className="flex flex-col items-center justify-center min-h-full p-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 rounded-xl w-full max-w-sm">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-amber-500/20 to-transparent" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />

            <div className="relative p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Crown className="w-10 h-10 text-amber-950" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center border-2 border-slate-800">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-white mb-2">
                Upgrade to{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">
                  Pro
                </span>
              </h2>
              <p className="text-slate-400 mb-6">
                Unlock all premium features and take your workflow to the next
                level
              </p>

              <ul className="space-y-3 mb-8 text-left">
                {features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-3 text-slate-300"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={handleGetPro}
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-950 font-semibold text-lg rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Zap className="w-5 h-5 mr-2" />
                Get Pro Now
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowActivateModal(true)}
                className="w-full mt-2 text-slate-400 hover:text-white hover:bg-slate-700/50 underline underline-offset-4"
              >
                Already have a license? Activate it
              </Button>
            </div>
          </div>

          <Dialog open={showActivateModal} onOpenChange={setShowActivateModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Activate License</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleActivate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseKey">License Key</Label>
                  <Input
                    id="licenseKey"
                    type="text"
                    value={licenseKey}
                    onChange={(e) => {
                      setError("");
                      setLicenseKey(e.target.value);
                    }}
                    placeholder="Enter your license key"
                    disabled={isLoading}
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowActivateModal(false);
                      setLicenseKey("");
                      setError("");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !licenseKey.trim()}
                    className="flex-1"
                  >
                    {isLoading ? "Activating..." : "Activate"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </ScrollArea>
    );
  }

  const expiryDate = new Date(userData.license.created_at || "");
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const isExpired = expiryDate < new Date();
  const daysRemaining = differenceInDays(expiryDate, new Date());

  return (
    <ScrollArea className="h-full">
      <Card className="bg-transparent border-none">
        <CardHeader>
          <CardTitle>License Information</CardTitle>
          <CardDescription>
            Your current license details and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-4">
              <div className="text-sm font-medium">License Key</div>
              <div className="relative">
                <code className="text-sm bg-muted p-2 rounded block mt-1">
                  {showLicenseKey
                    ? userData.license?.license_key || "N/A"
                    : "••••••••••••••••"}
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
                  ? "Your support period has expired"
                  : `${daysRemaining} days remaining until your support period expires. You can extend your support period by renewing your license.`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ScrollArea>
  );
}
