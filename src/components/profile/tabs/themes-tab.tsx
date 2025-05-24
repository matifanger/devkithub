import { Edit, Monitor, Moon, Plus, Sun, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { ConfirmationDialog as ConfirmationDialogType } from '../../../types/profile';
import { getAllThemes } from '../../../utils/profile/theme-utils';
import { Theme, predefinedThemes } from '../../../utils/themes';
import { ThemeManagerModal } from '../../theme-manager-modal';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Label } from '../../ui/label';
import { ScrollArea } from '../../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Tabs, TabsList, TabsTrigger } from '../../ui/tabs';
import { ConfirmationDialog } from '../dialogs/confirmation-dialog';

interface ThemesTabProps {
  selectedTheme: string;
  customThemes: Theme[];
  currentThemeMode?: string;
  onThemeChange: (themeId: string) => void;
  onThemeModeChange: (mode: string) => void;
  onThemeCreated: (theme: Theme) => void;
  onThemeUpdated: (theme: Theme) => void;
  onThemeDeleted: (themeId: string) => void;
}

export function ThemesTab({
  selectedTheme,
  customThemes,
  currentThemeMode,
  onThemeChange,
  onThemeModeChange,
  onThemeCreated,
  onThemeUpdated,
  onThemeDeleted,
}: ThemesTabProps) {
  const [themeManagerOpen, setThemeManagerOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [confirmationDialog, setConfirmationDialog] = useState<ConfirmationDialogType>({
    open: false,
    themeId: '',
    themeName: '',
  });

  const allThemes = getAllThemes(customThemes);

  const openThemeManager = (theme?: Theme) => {
    setEditingTheme(theme || null);
    setThemeManagerOpen(true);
  };

  const showDeleteConfirmation = (themeId: string, themeName: string) => {
    setConfirmationDialog({
      open: true,
      themeId,
      themeName,
    });
  };

  const confirmThemeDeleted = async () => {
    const { themeId } = confirmationDialog;
    onThemeDeleted(themeId);
    setConfirmationDialog({
      open: false,
      themeId: '',
      themeName: '',
    });
  };

  return (
    <>
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
                onValueChange={onThemeModeChange}
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
                  <Select value={selectedTheme} onValueChange={onThemeChange}>
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
                          onClick={() => onThemeChange(theme.id)}
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

      {/* Confirmation Dialog for Theme Deletion */}
      <ConfirmationDialog
        dialog={confirmationDialog}
        onOpenChange={(open) => setConfirmationDialog((prev) => ({ ...prev, open }))}
        onConfirm={confirmThemeDeleted}
      />

      {/* Theme Manager Modal */}
      <ThemeManagerModal
        open={themeManagerOpen}
        onOpenChange={setThemeManagerOpen}
        onThemeCreated={onThemeCreated}
        onThemeUpdated={onThemeUpdated}
        onThemeDeleted={onThemeDeleted}
        editingTheme={editingTheme}
      />
    </>
  );
}
