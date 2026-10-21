import { Key, Palette, Puzzle, Settings, Terminal, Wrench } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useThemeManagement } from "../../hooks/profile/use-theme-management";
import { useUpdateManagement } from "../../hooks/profile/use-update-management";
import {
  NotificationDialog as NotificationDialogType,
  ProfileModalProps,
} from "../../types/profile";
import { ActivateLicenseResponse } from "../../types/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { NotificationDialog } from "./dialogs/notification-dialog";
import { DevTab } from "./tabs/dev-tab";
import { GeneralTab } from "./tabs/general-tab";
import { IntegrationsTab } from "./tabs/integrations-tab";
import { LicenseTab } from "./tabs/license-tab";
import { ThemesTab } from "./tabs/themes-tab";
import { UpdatesTab } from "./tabs/updates-tab";

export function ProfileModal({
  open,
  onOpenChange,
  userData,
  activeTab = "general",
  onTabChange,
}: ProfileModalProps) {
  // Parse userData if it's a string
  const userDataJson: ActivateLicenseResponse | null =
    typeof userData === "string" ? JSON.parse(userData) : userData;

  // State for notifications
  const [notificationDialog, setNotificationDialog] =
    useState<NotificationDialogType>({
      open: false,
      type: "success",
      title: "",
      message: "",
    });

  // Dev mode detection
  const [isDev, setIsDev] = useState(false);
  useEffect(() => {
    window.electron?.isPackaged?.().then((packaged) => setIsDev(!packaged));
  }, []);

  // Internal tab state
  const [currentTab, setCurrentTab] = useState(activeTab);

  // Sync internal tab when activeTab prop changes
  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    onTabChange?.(value);
  };

  // Custom hooks for state management
  const {
    selectedTheme,
    customThemes,
    currentThemeMode,
    handleThemeChange,
    handleThemeModeChange,
    handleThemeCreated,
    handleThemeUpdated,
    handleThemeDeleted,
  } = useThemeManagement();

  const {
    updatesEnabled,
    updateStatus,
    handleUpdatePreferenceChange,
    handleDownloadUpdate,
    handleViewChangelog,
  } = useUpdateManagement(open);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex flex-col max-w-4xl w-full h-[80vh]">
          <DialogHeader>
            <DialogTitle>Profile & Settings</DialogTitle>
          </DialogHeader>
          <Tabs
            value={currentTab}
            onValueChange={handleTabChange}
            className="flex flex-col h-full overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="themes" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Themes
              </TabsTrigger>
              <TabsTrigger
                value="integrations"
                className="flex items-center gap-2"
              >
                <Puzzle className="h-4 w-4" />
                Integrations
              </TabsTrigger>
              <TabsTrigger value="updates" className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Updates
              </TabsTrigger>
              <TabsTrigger value="license" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Open source
              </TabsTrigger>
              {isDev && (
                <TabsTrigger value="dev" className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Dev
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent
              value="general"
              className="mt-0 border-0 flex-1 overflow-hidden"
            >
              <GeneralTab />
            </TabsContent>

            <TabsContent
              value="themes"
              className="mt-0 border-0 flex-1 overflow-hidden"
            >
              <ThemesTab
                selectedTheme={selectedTheme}
                customThemes={customThemes}
                currentThemeMode={currentThemeMode}
                onThemeChange={handleThemeChange}
                onThemeModeChange={handleThemeModeChange}
                onThemeCreated={handleThemeCreated}
                onThemeUpdated={handleThemeUpdated}
                onThemeDeleted={handleThemeDeleted}
              />
            </TabsContent>

            <TabsContent
              value="integrations"
              className="mt-0 border-0 flex-1 overflow-hidden"
            >
              <IntegrationsTab />
            </TabsContent>

            <TabsContent
              value="updates"
              className="mt-0 border-0 flex-1 overflow-hidden"
            >
              <UpdatesTab
                updatesEnabled={updatesEnabled}
                updateStatus={updateStatus}
                onUpdatePreferenceChange={handleUpdatePreferenceChange}
                onDownloadUpdate={handleDownloadUpdate}
                onViewChangelog={handleViewChangelog}
              />
            </TabsContent>

            <TabsContent
              value="license"
              className="mt-0 border-0 flex-1 overflow-hidden"
            >
              <LicenseTab userData={userDataJson} />
            </TabsContent>

            {isDev && (
              <TabsContent
                value="dev"
                className="mt-0 border-0 flex-1 overflow-hidden"
              >
                <DevTab />
              </TabsContent>
            )}
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Notification Dialog */}
      <NotificationDialog
        dialog={notificationDialog}
        onOpenChange={(open) =>
          setNotificationDialog((prev) => ({ ...prev, open }))
        }
      />
    </>
  );
}
