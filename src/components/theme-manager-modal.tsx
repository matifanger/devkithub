import { CheckCircle, Edit, ExternalLink, Info, Plus, Trash2, XCircle } from 'lucide-react';
import React, { useState } from 'react';
import { parseThemeFromCss, Theme } from '../utils/themes';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface ThemeManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onThemeCreated: (theme: Theme) => void;
  onThemeUpdated: (theme: Theme) => void;
  onThemeDeleted: (themeId: string) => void;
  editingTheme?: Theme | null;
}

export function ThemeManagerModal({
  open,
  onOpenChange,
  onThemeCreated,
  onThemeUpdated,
  onThemeDeleted,
  editingTheme,
}: ThemeManagerModalProps) {
  const [themeName, setThemeName] = useState('');
  const [themeCss, setThemeCss] = useState('');

  // Notification dialog state (same as profile-modal)
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
  }>({
    open: false,
  });

  const isEditing = Boolean(editingTheme);

  // Show notification dialog (same as profile-modal)
  const showNotification = (type: 'success' | 'error', title: string, message: string) => {
    setNotificationDialog({
      open: true,
      type,
      title,
      message,
    });
  };

  // Reset form when modal opens/closes or editing theme changes
  React.useEffect(() => {
    if (open) {
      if (editingTheme) {
        setThemeName(editingTheme.name);
        // Convert theme back to CSS format
        const cssContent = `@layer base {
  :root {
    ${Object.entries(editingTheme.cssVariables.light)
      .map(([property, value]) => `${property}: ${value};`)
      .join('\n    ')}
  }

  .dark {
    ${Object.entries(editingTheme.cssVariables.dark)
      .map(([property, value]) => `${property}: ${value};`)
      .join('\n    ')}
  }
}`;
        setThemeCss(cssContent);
      } else {
        setThemeName('');
        setThemeCss('');
      }
    }
    // Reset notification when modal opens/closes
    setNotificationDialog((prev) => ({ ...prev, open: false }));
  }, [open, editingTheme]);

  const handleSave = () => {
    if (!themeName.trim()) {
      showNotification('error', 'Missing Theme name', 'Please enter a theme name');
      return;
    }

    if (!themeCss.trim()) {
      showNotification('error', 'Missing Theme CSS', 'Please enter theme CSS variables');
      return;
    }

    try {
      const parsedTheme = parseThemeFromCss(themeCss, themeName.trim());
      if (!parsedTheme) {
        showNotification(
          'error',
          'Invalid CSS Format',
          'The CSS format is invalid. Please check your CSS and make sure it includes both :root and .dark sections with CSS variables.'
        );
        return;
      }

      if (isEditing && editingTheme) {
        // Update existing theme
        const updatedTheme: Theme = {
          ...parsedTheme,
          id: editingTheme.id, // Keep original ID
          createdAt: editingTheme.createdAt, // Keep original creation date
        };
        onThemeUpdated(updatedTheme);
        showNotification(
          'success',
          'Theme Updated Successfully',
          `"${updatedTheme.name}" has been updated and applied.`
        );
      } else {
        // Create new theme
        onThemeCreated(parsedTheme);
        showNotification(
          'success',
          'Theme Created Successfully',
          `"${parsedTheme.name}" has been created and applied.`
        );
      }

      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    } catch (error) {
      showNotification(
        'error',
        'Parse Error',
        'Failed to parse theme CSS. Please check the format and try again.'
      );
    }
  };

  const handleDelete = () => {
    if (editingTheme && window.confirm(`Are you sure you want to delete "${editingTheme.name}"?`)) {
      onThemeDeleted(editingTheme.id);
      onOpenChange(false);
    }
  };

  // Show confirmation dialog for theme deletion
  const showDeleteConfirmation = () => {
    setConfirmationDialog({
      open: true,
    });
  };

  // Confirm theme deletion
  const confirmThemeDeleted = () => {
    if (editingTheme) {
      onThemeDeleted(editingTheme.id);
      setConfirmationDialog({
        open: false,
      });
      onOpenChange(false);
      showNotification(
        'success',
        'Theme Deleted',
        `"${editingTheme.name}" has been successfully deleted.`
      );
    }
  };

  const sampleCss = `@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 224 71.4% 4.1%;
    --muted: 220 14.3% 95.9%;
    --muted-foreground: 220 8.9% 46.1%;
    --popover: 0 0% 100%;
    --popover-foreground: 224 71.4% 4.1%;
    --card: 0 0% 100%;
    --card-foreground: 224 71.4% 4.1%;
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --primary: 220.9 39.3% 11%;
    --primary-foreground: 210 20% 98%;
    --secondary: 220 14.3% 95.9%;
    --secondary-foreground: 220.9 39.3% 11%;
    --accent: 220 14.3% 95.9%;
    --accent-foreground: 220.9 39.3% 11%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 20% 98%;
    --ring: 224 71.4% 4.1%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 224 71.4% 4.1%;
    --foreground: 210 20% 98%;
    --muted: 215 27.9% 16.9%;
    --muted-foreground: 217.9 10.6% 64.9%;
    --popover: 224 71.4% 4.1%;
    --popover-foreground: 210 20% 98%;
    --card: 224 71.4% 4.1%;
    --card-foreground: 210 20% 98%;
    --border: 215 27.9% 16.9%;
    --input: 215 27.9% 16.9%;
    --primary: 210 20% 98%;
    --primary-foreground: 220.9 39.3% 11%;
    --secondary: 215 27.9% 16.9%;
    --secondary-foreground: 210 20% 98%;
    --accent: 215 27.9% 16.9%;
    --accent-foreground: 210 20% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 20% 98%;
    --ring: 216 12.2% 83.9%;
  }
}`;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl w-full flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Edit className="h-5 w-5" />
                  Edit theme
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Create new theme
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Modify your custom theme'
                : 'Create a custom theme by providing CSS variables or import from ui.jln.dev'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme-name">Theme name</Label>
              <Input
                id="theme-name"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                placeholder="Enter theme name"
                spellCheck={false}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <Label htmlFor="theme-css">Theme CSS</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.electron.openExternal('https://ui.jln.dev')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open ui.jln.dev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setThemeCss(sampleCss)}
                    disabled={isEditing}
                  >
                    Load sample
                  </Button>
                </div>
              </div>
              <Textarea
                id="theme-css"
                value={themeCss}
                onChange={(e) => setThemeCss(e.target.value)}
                placeholder="Paste your theme CSS here..."
                className="flex-1 min-h-[300px] font-mono text-sm"
                spellCheck={false}
              />
              <div className="flex items-center border gap-1 p-2.5 text-muted-foreground">
                <Info className="h-4 w-4" />
                <p className="text-sm">
                  In some cases, when creating a custom theme, you may need to restart the app to
                  see the changes properly.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            {isEditing && editingTheme?.isEditable && (
              <Button variant="destructive" onClick={showDeleteConfirmation} className="mr-auto">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{isEditing ? 'Update theme' : 'Create theme'}</Button>
          </DialogFooter>
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
              Are you sure you want to delete "{editingTheme?.name}"? This action cannot be undone.
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
    </>
  );
}
