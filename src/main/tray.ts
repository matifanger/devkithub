import { app, BrowserWindow, ipcMain, Menu, nativeImage, Tray } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

function resolveTrayIcon(): Electron.NativeImage | null {
  const baseWebpack = path.join(app.getAppPath(), '.webpack/renderer', 'assets', 'icons');
  const baseSrc = path.join(process.cwd(), 'src', 'assets', 'icons');

  const platformFiles =
    process.platform === 'win32'
      ? ['windows/icon.ico', 'icon.ico']
      : process.platform === 'darwin'
        ? ['mac/icon.icns', 'icon.png', 'original/icon.png']
        : ['linux/icon.png', 'icon.png'];

  const bases = [baseWebpack, baseSrc];
  for (const base of bases) {
    for (const rel of platformFiles) {
      const candidate = path.join(base, rel);
      try {
        if (fs.existsSync(candidate)) {
          const img = nativeImage.createFromPath(candidate);
          if (!img.isEmpty()) {
            if (process.platform === 'darwin') img.setTemplateImage(true);
            return img;
          }
        }
      } catch (err) {
        console.warn('Failed loading tray icon candidate:', candidate, err);
      }
    }
  }
  return null;
}

export function createTray(showWindow: () => void, quitApp: () => void): Tray | null {
  try {
    const iconImage = resolveTrayIcon();
    if (!iconImage) {
      console.error('No valid tray icon found for platform:', process.platform);
      return null;
    }

    const tray = new Tray(iconImage);
    tray.setToolTip('DevKitHub');
    tray.on('click', showWindow);
    tray.on('double-click', showWindow);

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Show', click: showWindow },
      { label: 'Quit', click: quitApp },
    ]);
    tray.setContextMenu(contextMenu);

    return tray;
  } catch (error) {
    console.error('Failed to create tray:', error);
    return null;
  }
}

export function attachCloseBehavior(
  mainWindow: BrowserWindow,
  getClosePreference: () => string | null,
  setIsQuitting: (v: boolean) => void,
  getIsQuitting: () => boolean
) {
  mainWindow.on('close', async (e) => {
    if (getIsQuitting()) {
      // Allow close to proceed
      return;
    }
    // If we're quitting intentionally, allow it
    // The caller controls this flag
    // setIsQuitting is used elsewhere before quitting
    // so here we just read current behavior via getClosePreference
    try {
      const preference = getClosePreference();
      if (preference === 'true') {
        e.preventDefault();
        mainWindow.hide();
        return;
      }
      if (preference === 'false') {
        setIsQuitting(true);
        // Do not prevent default; allow window to close
        return;
      }

      e.preventDefault();
      mainWindow.webContents.send('show-close-dialog');
    } catch (error) {
      console.error('Error handling close event:', error);
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

export function registerCloseDialogIpc(
  setClosePreference: (value: 'true' | 'false') => void,
  getMainWindow: () => BrowserWindow | null,
  setIsQuitting: (v: boolean) => void
) {
  ipcMain.handle(
    'handle-close-dialog-selection',
    async (_evt, action: 'quit' | 'tray', remember: boolean) => {
      try {
        if (remember) setClosePreference(action === 'tray' ? 'true' : 'false');

        if (action === 'tray') {
          const win = getMainWindow();
          if (win) win.hide();
          return;
        }

        setIsQuitting(true);
        const win = getMainWindow();
        if (win) win.close();
        else app.quit();
      } catch (error) {
        console.error('Failed to process close dialog selection:', error);
      }
    }
  );
}
