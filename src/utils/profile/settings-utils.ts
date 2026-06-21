import { CUSTOM_THEMES_KEY, SELECTED_THEME_KEY } from '../../constants/profile';
import { UPDATE_PREFERENCE_KEY, UPDATE_THEME_KEY } from '../../constants/settings-keys';
import { Theme } from '../themes';

export async function loadThemePreferences() {
  try {
    const savedTheme = await window.electron.settingsStore.get(SELECTED_THEME_KEY);
    const savedCustomThemes = await window.electron.settingsStore.get(CUSTOM_THEMES_KEY);
    const savedThemeMode = await window.electron.settingsStore.get(UPDATE_THEME_KEY);

    return {
      selectedTheme: savedTheme || 'elegant-luxury',
      customThemes: savedCustomThemes ? JSON.parse(savedCustomThemes) : [],
      themeMode: savedThemeMode,
    };
  } catch (error) {
    console.error('Failed to load theme preferences:', error);
    return {
      selectedTheme: 'elegant-luxury',
      customThemes: [],
      themeMode: null,
    };
  }
}

export async function saveThemeSelection(themeId: string) {
  await window.electron.settingsStore.set(SELECTED_THEME_KEY, themeId);
}

export async function saveCustomThemes(themes: Theme[]) {
  await window.electron.settingsStore.set(CUSTOM_THEMES_KEY, JSON.stringify(themes));
}

export async function saveThemeMode(mode: string) {
  await window.electron.settingsStore.set(UPDATE_THEME_KEY, mode);
}

export async function loadUpdatePreference() {
  try {
    const preference = await window.electron.settingsStore.get(UPDATE_PREFERENCE_KEY);
    if (preference === null || preference === undefined) {
      // Default to true if not set
      await window.electron.settingsStore.set(UPDATE_PREFERENCE_KEY, 'true');
      return true;
    }
    return preference === 'true';
  } catch (error) {
    console.error('Failed to load update preference:', error);
    return false;
  }
}

export async function saveUpdatePreference(enabled: boolean) {
  await window.electron.settingsStore.set(UPDATE_PREFERENCE_KEY, enabled.toString());
}
