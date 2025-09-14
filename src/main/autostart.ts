import { app, BrowserWindow, ipcMain, LoginItemSettings } from 'electron';

export function applyAutostart(openAtLogin: boolean) {
  try {
    if (process.platform === 'darwin') {
      app.setLoginItemSettings({
        openAtLogin,
        openAsHidden: openAtLogin,
        args: openAtLogin ? ['--autostart'] : [],
      });
    } else {
      app.setLoginItemSettings({ openAtLogin, args: openAtLogin ? ['--autostart'] : [] });
    }
  } catch (error) {
    console.error('Failed to set login item settings:', error);
  }
}

export function attachAutostartPrompt(
  getMainWindow: () => BrowserWindow | null,
  getAutostartPreference: () => string | null
) {
  try {
    const win = getMainWindow();
    if (!win) return;

    const maybePrompt = () => {
      try {
        const pref = getAutostartPreference();
        if (pref === 'true' || pref === 'false') {
          applyAutostart(pref === 'true');
          return;
        }
        win.webContents.send('show-autostart-dialog');
      } catch (err) {
        console.error('Failed to evaluate autostart preference:', err);
      }
    };

    if (win.webContents.isLoading()) {
      win.webContents.once('did-finish-load', maybePrompt);
    } else {
      maybePrompt();
    }
  } catch (error) {
    console.error('Failed to attach autostart prompt:', error);
  }
}

export function registerAutostartIpc(
  setAutostartPreference: (value: 'true' | 'false') => void,
  apply: (openAtLogin: boolean) => void
) {
  ipcMain.handle('handle-autostart-selection', async (_evt, enable: boolean) => {
    try {
      setAutostartPreference(enable ? 'true' : 'false');
      apply(enable);
    } catch (error) {
      console.error('Failed to process autostart selection:', error);
    }
  });

  // Renderer can query if it should show the dialog (in case event arrived too early)
  ipcMain.handle('should-show-autostart-dialog', async (_evt, currentPref: string | null) => {
    try {
      // If renderer doesn't know pref (null), we return true when not decided
      if (currentPref === null) return true;
      return currentPref !== 'true' && currentPref !== 'false';
    } catch (error) {
      console.error('Failed to evaluate should-show-autostart-dialog:', error);
      return false;
    }
  });
}

export function shouldStartHidden(getAutostartPreference: () => string | null): boolean {
  try {
    const pref = getAutostartPreference();
    if (pref !== 'true') return false;
    const login = app.getLoginItemSettings();
    const launchedAtLogin = !!(login && (login as LoginItemSettings).wasOpenedAtLogin);
    const hasFlag = process.argv.includes('--autostart') || process.argv.includes('--background');
    // Start hidden when launched at login or explicit flag present
    return launchedAtLogin || hasFlag;
  } catch (error) {
    return false;
  }
}
