import { BrowserWindow, globalShortcut, ipcMain } from "electron";
import {
  ClipboardHistoryRule,
  ClipboardHistorySettings,
  ClipboardItemUpdate,
} from "../../types/clipboard-history";
import { ClipboardHistoryService } from "./history-service";

interface ClipboardHistoryControllerOptions {
  userDataPath: string;
  rendererEntry: string;
  preloadEntry: string;
  getMainWindow: () => BrowserWindow | null;
  onTrayChange: () => void;
}

export class ClipboardHistoryController {
  readonly service: ClipboardHistoryService;
  private quickWindow: BrowserWindow | null = null;
  private registeredShortcut: string | null = null;

  constructor(private readonly options: ClipboardHistoryControllerOptions) {
    this.service = new ClipboardHistoryService(options.userDataPath);
  }

  initialize() {
    this.registerIpc();
    this.service.onChange((state) => {
      for (const window of BrowserWindow.getAllWindows()) {
        if (!window.isDestroyed()) {
          window.webContents.send("clipboard-history:changed", state);
        }
      }
      this.options.onTrayChange();
    });
    this.service.initialize();
    this.registerShortcut();
  }

  dispose() {
    if (this.registeredShortcut) {
      globalShortcut.unregister(this.registeredShortcut);
      this.registeredShortcut = null;
    }
    this.service.dispose();
  }

  openQuickWindow() {
    if (this.quickWindow && !this.quickWindow.isDestroyed()) {
      if (this.quickWindow.isVisible() && this.quickWindow.isFocused()) {
        this.quickWindow.hide();
      } else {
        this.quickWindow.show();
        this.quickWindow.focus();
      }
      return;
    }

    this.quickWindow = new BrowserWindow({
      width: 920,
      height: 640,
      minWidth: 700,
      minHeight: 540,
      show: false,
      frame: false,
      titleBarStyle: "hidden",
      title: "DevKitHub Clipboard History",
      backgroundColor: "#0f1117",
      webPreferences: {
        preload: this.options.preloadEntry,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
      },
    });

    const separator = this.options.rendererEntry.includes("?") ? "&" : "?";
    this.quickWindow.loadURL(
      `${this.options.rendererEntry}${separator}standalone=true#/clipboard-quick`,
    );
    this.quickWindow.once("ready-to-show", () => {
      this.quickWindow?.show();
      this.quickWindow?.focus();
    });
    this.quickWindow.on("closed", () => {
      this.quickWindow = null;
    });
  }

  closeQuickWindow() {
    if (!this.quickWindow || this.quickWindow.isDestroyed()) return;
    this.quickWindow.hide();
  }

  openFullHistory() {
    const mainWindow = this.options.getMainWindow();
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send("navigate-to", "/clipboard-history");
  }

  openWithTool(id: string, route: string) {
    if (!/^\/[a-z0-9-]+$/i.test(route)) return false;
    if (!this.service.copyItem(id)) return false;
    const mainWindow = this.options.getMainWindow();
    if (!mainWindow || mainWindow.isDestroyed()) return false;
    this.closeQuickWindow();
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send("navigate-to", route);
    return true;
  }

  toggleMonitoring() {
    const enabled = !this.service.getState().settings.enabled;
    this.service.updateSettings({ enabled });
  }

  private registerShortcut() {
    if (this.registeredShortcut) {
      try {
        globalShortcut.unregister(this.registeredShortcut);
      } catch {
        // The shortcut may already have been released by the OS.
      }
      this.registeredShortcut = null;
    }

    const { shortcutEnabled, shortcut } = this.service.getState().settings;
    if (!shortcutEnabled) {
      this.service.setShortcutError();
      return { success: true };
    }

    try {
      const registered = globalShortcut.register(shortcut, () =>
        this.openQuickWindow(),
      );
      if (!registered) {
        const error = `Shortcut "${shortcut}" is already in use.`;
        this.service.setShortcutError(error);
        return { success: false, error };
      }
      this.registeredShortcut = shortcut;
      this.service.setShortcutError();
      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid shortcut format.";
      this.service.setShortcutError(message);
      return { success: false, error: message };
    }
  }

  private suspendShortcut() {
    if (!this.registeredShortcut) return;
    try {
      globalShortcut.unregister(this.registeredShortcut);
    } finally {
      this.registeredShortcut = null;
    }
  }

  private registerIpc() {
    ipcMain.handle("clipboard-history:get-state", () =>
      this.service.getState(),
    );
    ipcMain.handle(
      "clipboard-history:update-settings",
      (_event, patch: Partial<ClipboardHistorySettings>) => {
        this.service.updateSettings(patch);
        this.registerShortcut();
        return this.service.getState();
      },
    );
    ipcMain.handle(
      "clipboard-history:upsert-rule",
      (
        _event,
        rule: Partial<ClipboardHistoryRule> &
          Pick<ClipboardHistoryRule, "name" | "pattern">,
      ) => this.service.upsertRule(rule),
    );
    ipcMain.handle("clipboard-history:add-text-item", (_event, text: string) =>
      this.service.addTextItem(text),
    );
    ipcMain.handle("clipboard-history:delete-rule", (_event, id: string) =>
      this.service.deleteRule(id),
    );
    ipcMain.handle(
      "clipboard-history:copy-item",
      (_event, id: string, closeQuickWindow = false) => {
        const copied = this.service.copyItem(id);
        if (copied && closeQuickWindow) this.closeQuickWindow();
        return copied;
      },
    );
    ipcMain.handle(
      "clipboard-history:update-item",
      (_event, id: string, patch: ClipboardItemUpdate) =>
        this.service.updateItem(id, patch),
    );
    ipcMain.handle("clipboard-history:delete-item", (_event, id: string) =>
      this.service.deleteItem(id),
    );
    ipcMain.handle("clipboard-history:clear", (_event, includePinned = false) =>
      this.service.clear(includePinned),
    );
    ipcMain.handle("clipboard-history:open-quick", () => {
      this.openQuickWindow();
      return true;
    });
    ipcMain.handle("clipboard-history:close-quick", () => {
      this.closeQuickWindow();
      return true;
    });
    ipcMain.handle("clipboard-history:open-full", () => {
      this.closeQuickWindow();
      this.openFullHistory();
      return true;
    });
    ipcMain.handle(
      "clipboard-history:open-with-tool",
      (_event, id: string, route: string) => this.openWithTool(id, route),
    );
    ipcMain.handle("clipboard-history:shortcut-capture-start", () => {
      this.suspendShortcut();
      return true;
    });
    ipcMain.handle("clipboard-history:shortcut-capture-end", () => {
      this.registerShortcut();
      return true;
    });
  }
}
