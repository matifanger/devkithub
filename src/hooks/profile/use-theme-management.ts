import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { loadThemePreferences, saveThemeMode } from '../../utils/profile/settings-utils';
import {
  getSelectedThemeObject,
  handleThemeChange as utilHandleThemeChange,
  handleThemeCreated as utilHandleThemeCreated,
  handleThemeDeleted as utilHandleThemeDeleted,
  handleThemeUpdated as utilHandleThemeUpdated,
} from '../../utils/profile/theme-utils';
import { Theme, applyTheme } from '../../utils/themes';

export function useThemeManagement() {
  const { theme: currentThemeMode, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState('purple-default');
  const [customThemes, setCustomThemes] = useState<Theme[]>([]);

  // Load theme preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      const {
        selectedTheme: saved,
        customThemes: savedCustom,
        themeMode,
      } = await loadThemePreferences();
      setSelectedTheme(saved);
      setCustomThemes(savedCustom);
      if (themeMode) {
        setTheme(themeMode);
      }
    }
    loadPreferences();
  }, [setTheme]);

  // Apply theme when selection or mode changes
  useEffect(() => {
    const theme = getSelectedThemeObject(selectedTheme, customThemes);
    if (theme && currentThemeMode) {
      applyTheme(theme, currentThemeMode);
    }
  }, [selectedTheme, customThemes, currentThemeMode]);

  const handleThemeChange = async (themeId: string) => {
    await utilHandleThemeChange(themeId, customThemes, currentThemeMode);
    setSelectedTheme(themeId);
  };

  const handleThemeModeChange = async (newThemeMode: string) => {
    setTheme(newThemeMode);
    await saveThemeMode(newThemeMode);
  };

  const handleThemeCreated = async (theme: Theme) => {
    const newCustomThemes = await utilHandleThemeCreated(theme, customThemes);
    setCustomThemes(newCustomThemes);
    setSelectedTheme(theme.id);
  };

  const handleThemeUpdated = async (updatedTheme: Theme) => {
    const newCustomThemes = await utilHandleThemeUpdated(
      updatedTheme,
      customThemes,
      currentThemeMode
    );
    setCustomThemes(newCustomThemes);
  };

  const handleThemeDeleted = async (themeId: string) => {
    const { newCustomThemes, newSelectedTheme } = await utilHandleThemeDeleted(
      themeId,
      customThemes,
      selectedTheme
    );
    setCustomThemes(newCustomThemes);
    setSelectedTheme(newSelectedTheme);
  };

  return {
    selectedTheme,
    customThemes,
    currentThemeMode,
    handleThemeChange,
    handleThemeModeChange,
    handleThemeCreated,
    handleThemeUpdated,
    handleThemeDeleted,
    getSelectedThemeObject: () => getSelectedThemeObject(selectedTheme, customThemes),
  };
}
