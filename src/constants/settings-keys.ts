// Usage
// await window.electron.settingsStore.set(UPDATE_THEME_KEY, newTheme);

// Settings keys
export const UPDATE_PREFERENCE_KEY = 'update-preference';
export const UPDATE_THEME_KEY = 'update-theme';
export const FAVORITE_TOOLS_KEY = 'favoriteTools';
export const REJECTED_VERSION_KEY = 'rejected-version';
export const CLIPBOARD_RECOMMENDATIONS_ENABLED_KEY = 'clipboardRecommendationsEnabled';
// Window close behavior: 'true' => close to tray; 'false' => quit; null => ask
export const CLOSE_TO_TRAY_KEY = 'close-to-tray';
// Launch on OS startup: 'true' | 'false'; if missing => ask once
export const LAUNCH_ON_STARTUP_KEY = 'launch-on-startup';

// Editor settings
export const EDITOR_FONT_SIZE_KEY = 'editor-font-size';
export const EDITOR_THEME_KEY = 'editor-theme';

// Keytar constants
export const SERVICE_NAME = 'devkithub';
export const ACCOUNT_NAME = 'default';
