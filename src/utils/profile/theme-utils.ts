import { Theme, applyTheme, predefinedThemes } from '../themes';
import { saveCustomThemes, saveThemeSelection } from './settings-utils';

export function getAllThemes(customThemes: Theme[]): Theme[] {
  return [...predefinedThemes, ...customThemes];
}

export function getSelectedThemeObject(
  selectedTheme: string,
  customThemes: Theme[]
): Theme | undefined {
  const allThemes = getAllThemes(customThemes);
  return allThemes.find((t) => t.id === selectedTheme);
}

export async function handleThemeChange(
  themeId: string,
  customThemes: Theme[],
  currentThemeMode?: string
) {
  await saveThemeSelection(themeId);

  // Apply the theme immediately
  const theme = getSelectedThemeObject(themeId, customThemes);
  if (theme && currentThemeMode) {
    applyTheme(theme, currentThemeMode);
  }
}

export async function handleThemeCreated(newTheme: Theme, customThemes: Theme[]): Promise<Theme[]> {
  const newCustomThemes = [...customThemes, newTheme];
  await saveCustomThemes(newCustomThemes);

  // Select the newly created theme
  await saveThemeSelection(newTheme.id);

  return newCustomThemes;
}

export async function handleThemeUpdated(
  updatedTheme: Theme,
  customThemes: Theme[],
  currentThemeMode?: string
): Promise<Theme[]> {
  const newCustomThemes = customThemes.map((theme) =>
    theme.id === updatedTheme.id ? updatedTheme : theme
  );
  await saveCustomThemes(newCustomThemes);

  // If currently selected theme was updated, re-apply it
  if (currentThemeMode) {
    applyTheme(updatedTheme, currentThemeMode);
  }

  return newCustomThemes;
}

export async function handleThemeDeleted(
  themeId: string,
  customThemes: Theme[],
  selectedTheme: string
): Promise<{ newCustomThemes: Theme[]; newSelectedTheme: string }> {
  const newCustomThemes = customThemes.filter((theme) => theme.id !== themeId);
  await saveCustomThemes(newCustomThemes);

  let newSelectedTheme = selectedTheme;
  // If currently selected theme was deleted, switch to default
  if (selectedTheme === themeId) {
    newSelectedTheme = 'elegant-luxury';
    await saveThemeSelection('elegant-luxury');
  }

  return { newCustomThemes, newSelectedTheme };
}
