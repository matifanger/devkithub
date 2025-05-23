import axios from 'axios';
import { differenceInDays } from 'date-fns';
import {
  CheckCircle,
  Download,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Monitor,
  Moon,
  Palette,
  Plus,
  Puzzle,
  Settings,
  Sun,
  Terminal,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import React, { useEffect, useState } from 'react';
import { UPDATE_PREFERENCE_KEY, UPDATE_THEME_KEY } from '../constants/settings-keys';
import { ActivateLicenseResponse } from '../types/types';
import { getBaseApiUrl } from '../utils/environment';
import { applyTheme, predefinedThemes, Theme } from '../utils/themes';
import { ThemeManagerModal } from './theme-manager-modal';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

import alfred from '../assets/images/alfred.png';
import raycast from '../assets/images/raycast.png';

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData: ActivateLicenseResponse | string | null;
}

// Settings keys
const SELECTED_THEME_KEY = 'selected-theme';
const CUSTOM_THEMES_KEY = 'custom-themes';

export function ProfileModal({ open, onOpenChange, userData }: ProfileModalProps) {
  const { theme: currentThemeMode, setTheme } = useTheme();
  const [showLicenseKey, setShowLicenseKey] = useState(false);
  const [updatesEnabled, setUpdatesEnabled] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('purple-default');
  const [customThemes, setCustomThemes] = useState<Theme[]>([]);

  // Theme manager modal state
  const [themeManagerOpen, setThemeManagerOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);

  // Notification dialog state
  const [notificationDialog, setNotificationDialog] = useState<{
    open: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  });

  // Confirmation dialog state for theme deletion
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    themeId: string;
    themeName: string;
  }>({
    open: false,
    themeId: '',
    themeName: '',
  });

  const [updateStatus, setUpdateStatus] = useState<{
    hasUpdate: boolean;
    latestVersion: string;
    currentVersion: string;
    isLoading: boolean;
    error: string | null;
    releaseNotes?: string;
  }>({
    hasUpdate: false,
    latestVersion: '',
    currentVersion: '',
    isLoading: true,
    error: null,
  });

  // If userData is a string, parse it as json
  const userDataJson: ActivateLicenseResponse | null =
    typeof userData === 'string' ? JSON.parse(userData) : userData;

  // Show notification dialog
  const showNotification = (type: 'success' | 'error', title: string, message: string) => {
    setNotificationDialog({
      open: true,
      type,
      title,
      message,
    });
  };

  // Load theme preferences
  useEffect(() => {
    async function loadThemePreferences() {
      try {
        const savedTheme = await window.electron.settingsStore.get(SELECTED_THEME_KEY);
        const savedCustomThemes = await window.electron.settingsStore.get(CUSTOM_THEMES_KEY);
        const savedThemeMode = await window.electron.settingsStore.get(UPDATE_THEME_KEY);

        if (savedTheme) {
          setSelectedTheme(savedTheme);
        }

        if (savedCustomThemes) {
          setCustomThemes(JSON.parse(savedCustomThemes));
        }

        if (savedThemeMode) {
          setTheme(savedThemeMode);
        }
      } catch (error) {
        console.error('Failed to load theme preferences:', error);
      }
    }

    loadThemePreferences();
  }, [setTheme]);

  // Apply theme when selection changes or theme mode changes
  useEffect(() => {
    const allThemes = [...predefinedThemes, ...customThemes];
    const theme = allThemes.find((t) => t.id === selectedTheme);
    if (theme && currentThemeMode) {
      applyTheme(theme, currentThemeMode);
    }
  }, [selectedTheme, customThemes, currentThemeMode]);

  // Load update preference
  useEffect(() => {
    async function loadUpdatePreference() {
      try {
        const preference = await window.electron.settingsStore.get(UPDATE_PREFERENCE_KEY);
        if (preference === null || preference === undefined) {
          // Default to true if not set
          await window.electron.settingsStore.set(UPDATE_PREFERENCE_KEY, 'true');
          setUpdatesEnabled(true);
        } else {
          setUpdatesEnabled(preference === 'true');
        }
      } catch (error) {
        console.error('Failed to load update preference:', error);
        setUpdatesEnabled(false);
      }
    }

    loadUpdatePreference();
  }, []);

  // Handle theme selection change
  const handleThemeChange = async (themeId: string) => {
    setSelectedTheme(themeId);
    await window.electron.settingsStore.set(SELECTED_THEME_KEY, themeId);
  };

  // Handle theme manager functions
  const handleThemeCreated = async (theme: Theme) => {
    const newCustomThemes = [...customThemes, theme];
    setCustomThemes(newCustomThemes);
    await window.electron.settingsStore.set(CUSTOM_THEMES_KEY, JSON.stringify(newCustomThemes));

    // Select the newly created theme
    setSelectedTheme(theme.id);
    await window.electron.settingsStore.set(SELECTED_THEME_KEY, theme.id);
  };

  const handleThemeUpdated = async (updatedTheme: Theme) => {
    const newCustomThemes = customThemes.map((theme) =>
      theme.id === updatedTheme.id ? updatedTheme : theme
    );
    setCustomThemes(newCustomThemes);
    await window.electron.settingsStore.set(CUSTOM_THEMES_KEY, JSON.stringify(newCustomThemes));

    // If currently selected theme was updated, re-apply it
    if (selectedTheme === updatedTheme.id) {
      if (currentThemeMode) {
        applyTheme(updatedTheme, currentThemeMode);
      }
    }
  };

  // Show confirmation dialog for theme deletion
  const showDeleteConfirmation = (themeId: string, themeName: string) => {
    setConfirmationDialog({
      open: true,
      themeId,
      themeName,
    });
  };

  // Confirm theme deletion
  const confirmThemeDeleted = async () => {
    const { themeId } = confirmationDialog;
    const newCustomThemes = customThemes.filter((theme) => theme.id !== themeId);
    setCustomThemes(newCustomThemes);
    await window.electron.settingsStore.set(CUSTOM_THEMES_KEY, JSON.stringify(newCustomThemes));

    // If currently selected theme was deleted, switch to default
    if (selectedTheme === themeId) {
      setSelectedTheme('purple-default');
      await window.electron.settingsStore.set(SELECTED_THEME_KEY, 'purple-default');
    }

    // Close confirmation dialog
    setConfirmationDialog({
      open: false,
      themeId: '',
      themeName: '',
    });
  };

  const handleThemeDeleted = async (themeId: string) => {
    const newCustomThemes = customThemes.filter((theme) => theme.id !== themeId);
    setCustomThemes(newCustomThemes);
    await window.electron.settingsStore.set(CUSTOM_THEMES_KEY, JSON.stringify(newCustomThemes));

    // If currently selected theme was deleted, switch to default
    if (selectedTheme === themeId) {
      setSelectedTheme('purple-default');
      await window.electron.settingsStore.set(SELECTED_THEME_KEY, 'purple-default');
    }
  };

  const openThemeManager = (theme?: Theme) => {
    setEditingTheme(theme || null);
    setThemeManagerOpen(true);
  };

  const getSelectedThemeObject = () => {
    const allThemes = [...predefinedThemes, ...customThemes];
    return allThemes.find((t) => t.id === selectedTheme);
  };

  // Handle update preference change
  const handleUpdatePreferenceChange = async (checked: boolean) => {
    setUpdatesEnabled(checked);
    await window.electron.settingsStore.set(UPDATE_PREFERENCE_KEY, checked.toString());
    console.log('Update preference changed to:', checked);
  };

  // Check for updates
  useEffect(() => {
    async function checkForUpdates() {
      try {
        setUpdateStatus((prev) => ({ ...prev, isLoading: true, error: null }));

        const baseApiUrl = await getBaseApiUrl();
        const response = await axios.get(baseApiUrl + '/api/version');
        const latestVersion = response.data.version;
        const currentVersion = await window.electron.env.get('npm_package_version');

        const hasUpdate = latestVersion !== currentVersion;

        setUpdateStatus({
          hasUpdate,
          latestVersion,
          currentVersion,
          isLoading: false,
          error: null,
          releaseNotes: response.data.releaseNotes,
        });
      } catch (error) {
        console.error('Failed to check for updates:', error);
        setUpdateStatus((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Failed to check for updates',
        }));
      }
    }

    if (open) {
      checkForUpdates();
    }
  }, [open]);

  // Handle theme mode change
  const handleThemeModeChange = async (newThemeMode: string) => {
    setTheme(newThemeMode);
    await window.electron.settingsStore.set(UPDATE_THEME_KEY, newThemeMode);
  };

  if (!userDataJson) return null;

  // Fecha de expiracion es 1 año desde la fecha de activacion
  const expiryDate = new Date(userDataJson.license?.created_at || '');
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const isExpired = expiryDate < new Date();
  const daysRemaining = differenceInDays(expiryDate, new Date());

  const allThemes = [...predefinedThemes, ...customThemes];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex flex-col max-w-4xl w-full h-[80vh]">
          <DialogHeader>
            <DialogTitle>Profile & Settings</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="general" className="flex flex-col h-full overflow-hidden">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="themes" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Themes
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

            {/* ScrollArea is used to make the tabs scrollable */}
            <TabsContent value="general" className="mt-0 border-0 flex-1 overflow-hidden">
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
            </TabsContent>

            <TabsContent value="themes" className="mt-0 border-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <Card className="bg-transparent border-none">
                  <CardHeader>
                    <CardTitle>Themes</CardTitle>
                    <CardDescription>
                      Customize the appearance with predefined themes or create your own
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label>Theme Mode</Label>
                      <Tabs
                        value={currentThemeMode || 'system'}
                        onValueChange={handleThemeModeChange}
                        className="w-full"
                      >
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="light" className="flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            Light
                          </TabsTrigger>
                          <TabsTrigger value="dark" className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            Dark
                          </TabsTrigger>
                          <TabsTrigger value="system" className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            System
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    <div className="border-t pt-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Current Theme</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openThemeManager()}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Create Theme
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Select value={selectedTheme} onValueChange={handleThemeChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a theme" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem
                                value="header"
                                disabled
                                className="font-semibold text-xs opacity-60"
                              >
                                PREDEFINED THEMES
                              </SelectItem>
                              {predefinedThemes.map((theme) => (
                                <SelectItem key={theme.id} value={theme.id}>
                                  {theme.name}
                                </SelectItem>
                              ))}
                              {customThemes.length > 0 && (
                                <>
                                  <SelectItem
                                    value="header2"
                                    disabled
                                    className="font-semibold text-xs opacity-60"
                                  >
                                    CUSTOM THEMES
                                  </SelectItem>
                                  {customThemes.map((theme) => (
                                    <SelectItem key={theme.id} value={theme.id}>
                                      {theme.name}
                                    </SelectItem>
                                  ))}
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {customThemes.length > 0 && (
                      <div className="border-t pt-6">
                        <Label>Your Custom Themes</Label>
                        <div className="mt-3 space-y-2">
                          {customThemes.map((theme) => (
                            <div
                              key={theme.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div>
                                <div className="font-medium">{theme.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  Created:{' '}
                                  {theme.createdAt
                                    ? new Date(theme.createdAt).toLocaleDateString()
                                    : 'Unknown'}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleThemeChange(theme.id)}
                                  disabled={selectedTheme === theme.id}
                                >
                                  {selectedTheme === theme.id ? 'Active' : 'Apply'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openThemeManager(theme)}
                                  className="px-2"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => showDeleteConfirmation(theme.id, theme.name)}
                                  className="px-2 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="integrations" className="mt-0 border-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <Card className="bg-transparent border-none">
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
              </ScrollArea>
            </TabsContent>

            <TabsContent value="updates" className="mt-0 border-0 flex-1 overflow-hidden">
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
                      <Switch
                        checked={updatesEnabled}
                        onCheckedChange={handleUpdatePreferenceChange}
                      />
                    </div>

                    <div className="border-t pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base">Version Information</Label>
                          {updateStatus.isLoading && <Badge variant="default">Checking...</Badge>}
                          {updateStatus.hasUpdate && !updateStatus.isLoading && (
                            <Badge variant="destructive">Update Available</Badge>
                          )}
                          {!updateStatus.hasUpdate &&
                            !updateStatus.isLoading &&
                            !updateStatus.error && <Badge variant="default">Up to date</Badge>}
                          {updateStatus.error && <Badge variant="default">Check failed</Badge>}
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Current version:</span>
                            <span className="font-mono">
                              {updateStatus.currentVersion || 'Loading...'}
                            </span>
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
                              <p className="text-sm text-muted-foreground">
                                {updateStatus.releaseNotes}
                              </p>
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  window.electron.openExternal('https://devkithub.com/downloads')
                                }
                                className="flex items-center gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  window.electron.openExternal('https://devkithub.com/changelog')
                                }
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
            </TabsContent>

            <TabsContent value="license" className="mt-0 border-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <Card className="bg-transparent border-none">
                  <CardHeader>
                    <CardTitle>License Information</CardTitle>
                    <CardDescription>Your current license details and status</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      {/* <div className="mb-4">
                            <div className="text-sm font-medium">License Type</div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">Normal</span>
                              <Badge variant={isExpired ? 'destructive' : 'default'}>
                                {isExpired ? 'Expired' : 'Active'}
                              </Badge>
                            </div>
                          </div> */}
                      <div className="mb-4">
                        <div className="text-sm font-medium">License Key</div>
                        <div className="relative">
                          <code className="text-sm bg-muted p-2 rounded block mt-1">
                            {showLicenseKey ? userDataJson.license.license_key : '••••••••••••••••'}
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
                            : `${daysRemaining} days remaining until your support period expires. You can extend your support period by renewing your license.`}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Notification Dialog */}
      <Dialog
        open={notificationDialog.open}
        onOpenChange={(open) => setNotificationDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {notificationDialog.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              {notificationDialog.title}
            </DialogTitle>
            <DialogDescription>{notificationDialog.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setNotificationDialog((prev) => ({ ...prev, open: false }))}
              className="w-full"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Theme Deletion */}
      <Dialog
        open={confirmationDialog.open}
        onOpenChange={(open) => setConfirmationDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Theme
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{confirmationDialog.themeName}"? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmationDialog((prev) => ({ ...prev, open: false }))}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmThemeDeleted} className="flex-1">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Theme Manager Modal */}
      <ThemeManagerModal
        open={themeManagerOpen}
        onOpenChange={setThemeManagerOpen}
        onThemeCreated={handleThemeCreated}
        onThemeUpdated={handleThemeUpdated}
        onThemeDeleted={handleThemeDeleted}
        editingTheme={editingTheme}
      />
    </>
  );
}
