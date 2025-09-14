import React from 'react';
import {
  EDITOR_FONT_SIZE_KEY,
  EDITOR_THEME_KEY,
  UPDATE_THEME_KEY,
} from '../constants/settings-keys';

type EditorSettingsContextType = {
  fontSize: number;
  setFontSize: (size: number) => Promise<void>;
  themeMode: string | null;
  editorThemeId: string;
  setEditorThemeId: (id: string) => Promise<void>;
};

const EditorSettingsContext = React.createContext<EditorSettingsContextType | undefined>(undefined);

export function EditorSettingsProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = React.useState<number>(12);
  const [themeMode, setThemeMode] = React.useState<string | null>(null);
  const [editorThemeId, setEditorThemeIdState] = React.useState<string>('aura');

  React.useEffect(() => {
    const load = async () => {
      try {
        const savedSize = await window.electron.settingsStore.get(EDITOR_FONT_SIZE_KEY);
        if (savedSize && !Number.isNaN(Number(savedSize))) {
          setFontSizeState(Number(savedSize));
        }
      } catch (err) {
        console.error('Failed to load editor font size:', err);
      }
      try {
        const savedEditorTheme = await window.electron.settingsStore.get(EDITOR_THEME_KEY);
        const canonical = normalizeEditorTheme(savedEditorTheme);
        setEditorThemeIdState(canonical);
        if (savedEditorTheme !== canonical) {
          await window.electron.settingsStore.set(EDITOR_THEME_KEY, canonical);
        }
      } catch (err) {
        console.error('Failed to load editor theme:', err);
      }
      try {
        const savedTheme = await window.electron.settingsStore.get(UPDATE_THEME_KEY);
        setThemeMode(savedTheme);
      } catch (err) {
        console.error('Failed to load app theme mode:', err);
      }
    };
    load();
  }, []);

  React.useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const savedTheme = await window.electron.settingsStore.get(UPDATE_THEME_KEY);
        setThemeMode(savedTheme);
      } catch (err) {
        console.error('Failed to poll app theme mode:', err);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const setFontSize = async (size: number) => {
    const clamped = Math.max(4, Math.min(30, size));
    setFontSizeState(clamped);
    await window.electron.settingsStore.set(EDITOR_FONT_SIZE_KEY, String(clamped));
  };

  const setEditorThemeId = async (id: string) => {
    const canonical = normalizeEditorTheme(id);
    setEditorThemeIdState(canonical);
    await window.electron.settingsStore.set(EDITOR_THEME_KEY, canonical);
  };

  const value: EditorSettingsContextType = React.useMemo(
    () => ({ fontSize, setFontSize, themeMode, editorThemeId, setEditorThemeId }),
    [fontSize, themeMode, editorThemeId]
  );

  return <EditorSettingsContext.Provider value={value}>{children}</EditorSettingsContext.Provider>;
}

function normalizeEditorTheme(val: string | null): string {
  if (!val) return 'aura';
  const v = String(val);
  // Collapse dark/light variants into a single key
  if (v === 'default') return 'aura';
  if (v === 'basicDark' || v === 'basicLight') return 'basic';
  if (v === 'githubDark' || v === 'githubLight') return 'github';
  if (v === 'xcodeDark' || v === 'xcodeLight') return 'xcode';
  if (v === 'duotoneDark' || v === 'duotoneLight') return 'duotone';
  if (v === 'solarizedDark' || v === 'solarizedLight') return 'solarized';
  if (v === 'gruvboxDark' || v === 'gruvboxLight') return 'gruvbox';
  if (v === 'tokyoNight' || v === 'tokyoNightDay' || v === 'tokyoNightStorm') return 'tokyo';
  // If user stored a specific theme id from the full list, accept it
  const allowed = new Set([
    'aura',
    'abcdef',
    'abyss',
    'androidstudio',
    'andromeda',
    'basic',
    'bbedit',
    'bespin',
    'copilot',
    'darcula',
    'dracula',
    'duotone',
    'eclipse',
    'github',
    'gruvbox',
    'kimbie',
    'material',
    'monokai',
    'noctisLilac',
    'nord',
    'quietlight',
    'solarized',
    'sublime',
    'tokyo',
    'tomorrowNightBlue',
    'vscodeDark',
    'xcode',
  ]);
  return allowed.has(v) ? v : 'aura';
}

export function useEditorSettings() {
  const ctx = React.useContext(EditorSettingsContext);
  if (!ctx) throw new Error('useEditorSettings must be used within EditorSettingsProvider');
  return ctx;
}
