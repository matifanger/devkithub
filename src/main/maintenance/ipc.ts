import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import type { IpcMainInvokeEvent } from "electron";
import * as os from "os";
import * as path from "path";
import {
  analyzeDirectory,
  cleanSnapshot,
  scanTemporaryFiles,
  selectedCandidates,
} from "./files";
import type { CleanupSnapshot } from "./files";
import { listStartup, toggleStartup, windowsDrives } from "./windows";
import type {
  MaintenanceProgress,
  SystemOverview,
} from "../../types/maintenance";

export function registerMaintenanceIpc(
  getWindow: () => BrowserWindow | null,
  rendererEntry: string,
): void {
  const trustedPage = new URL(rendererEntry);
  let controller: AbortController | null = null;
  let snapshot: CleanupSnapshot | null = null;
  let startupEntries: Awaited<ReturnType<typeof listStartup>> = [];
  const revealable = new Set<string>();
  const authorize = (event: IpcMainInvokeEvent) => {
    const win = getWindow();
    if (
      !win ||
      event.sender !== win.webContents ||
      event.senderFrame !== event.sender.mainFrame
    )
      throw new Error(
        "Maintenance is only available in the main application window.",
      );
    const page = new URL(event.senderFrame.url);
    if (
      page.protocol !== trustedPage.protocol ||
      page.host !== trustedPage.host ||
      page.pathname !== trustedPage.pathname
    )
      throw new Error("Maintenance is not available to external pages.");
    return win;
  };
  const windowsOnly = () => {
    if (process.platform !== "win32")
      throw new Error("This feature is currently available on Windows only.");
  };
  async function exclusive<T>(
    event: IpcMainInvokeEvent,
    action: (
      signal: AbortSignal,
      progress: (value: MaintenanceProgress) => void,
    ) => Promise<T>,
  ): Promise<T> {
    authorize(event);
    if (controller)
      throw new Error(
        "Another maintenance operation is running. Wait or cancel it first.",
      );
    const current = new AbortController();
    controller = current;
    const cancel = () => current.abort();
    event.sender.once("destroyed", cancel);
    event.sender.once("did-start-loading", cancel);
    try {
      return await action(current.signal, (value) => {
        if (!event.sender.isDestroyed())
          event.sender.send("maintenance:progress", value);
      });
    } finally {
      event.sender.removeListener("destroyed", cancel);
      event.sender.removeListener("did-start-loading", cancel);
      controller = null;
    }
  }
  ipcMain.handle("maintenance:overview", async (event) => {
    authorize(event);
    const result: SystemOverview = {
      platform: process.platform,
      hostname: os.hostname(),
      release: os.release(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      drives: [],
    };
    if (process.platform === "win32") {
      try {
        result.drives = await windowsDrives();
      } catch {
        result.driveError =
          "Drive information could not be read. Folder analysis is still available.";
      }
    }
    return result;
  });
  ipcMain.handle("maintenance:disk", (event) =>
    exclusive(event, async (signal, progress) => {
      const win = authorize(event);
      const selection = await dialog.showOpenDialog(win, {
        title: "Choose a folder or drive to analyze",
        properties: ["openDirectory"],
      });
      if (selection.canceled || !selection.filePaths[0] || signal.aborted)
        return null;
      const result = await analyzeDirectory(
        selection.filePaths[0],
        signal,
        progress,
      );
      revealable.clear();
      revealable.add(result.root);
      [...result.items, ...result.largest].forEach((item) =>
        revealable.add(item.path),
      );
      return result;
    }),
  );
  ipcMain.handle("maintenance:scan-cleanup", (event) =>
    exclusive(event, async (signal, progress) => {
      windowsOnly();
      snapshot = null;
      // Use fixed OS folders, not TEMP or a renderer-supplied deletion path.
      const localAppData =
        process.env.LOCALAPPDATA ||
        path.join(app.getPath("home"), "AppData", "Local");
      const roots = [
        {
          id: "user-temp",
          label: "User temporary files",
          root: path.resolve(localAppData, "Temp"),
        },
        {
          id: "windows-temp",
          label: "Windows temporary files",
          root: path.resolve(process.env.SystemRoot || "C:\\Windows", "Temp"),
        },
      ];
      snapshot = await scanTemporaryFiles(roots, signal, progress);
      return snapshot.result;
    }),
  );
  ipcMain.handle(
    "maintenance:clean",
    (event, scanId: unknown, groupIds: unknown) =>
      exclusive(event, async (signal, progress) => {
        windowsOnly();
        if (
          typeof scanId !== "string" ||
          !snapshot ||
          snapshot.result.id !== scanId ||
          !Array.isArray(groupIds) ||
          groupIds.length > 10
        )
          throw new Error("Scan temporary files again before cleaning.");
        const selected = selectedCandidates(snapshot, groupIds);
        if (!selected.length)
          throw new Error("The selected categories have no eligible files.");
        const bytes = selected.reduce((sum, file) => sum + file.size, 0);
        const confirmation = await dialog.showMessageBox(authorize(event), {
          type: "warning",
          title: "Delete temporary files?",
          message: `Permanently delete ${selected.length.toLocaleString()} temporary files?`,
          detail: `Selected size: ${(bytes / 1024 / 1024).toFixed(1)} MB. Only files last modified at least 7 days ago are included. Changed, linked or inaccessible files will be skipped. This cannot be undone. Close other applications before continuing.`,
          buttons: ["Cancel", "Delete temporary files"],
          defaultId: 0,
          cancelId: 0,
          noLink: true,
        });
        if (confirmation.response !== 1 || signal.aborted) return null;
        const current = snapshot;
        snapshot = null; // A confirmed snapshot is consumed, even on partial failure.
        return cleanSnapshot(current, groupIds, signal, progress);
      }),
  );
  ipcMain.handle("maintenance:cancel", (event) => {
    authorize(event);
    controller?.abort();
  });
  ipcMain.handle("maintenance:reveal", (event, target: unknown) => {
    authorize(event);
    if (typeof target !== "string" || !revealable.has(target))
      throw new Error("Analyze the folder before opening this location.");
    shell.showItemInFolder(target);
  });
  ipcMain.handle("maintenance:startup-list", (event) =>
    exclusive(event, async () => {
      windowsOnly();
      startupEntries = await listStartup();
      return startupEntries;
    }),
  );
  ipcMain.handle(
    "maintenance:startup-toggle",
    (event, id: unknown, enabled: unknown) =>
      exclusive(event, async (signal) => {
        windowsOnly();
        if (typeof id !== "string" || typeof enabled !== "boolean")
          throw new Error("Invalid startup change.");
        const entry = startupEntries.find((row) => row.id === id);
        if (!entry?.manageable)
          throw new Error(
            "Refresh the startup list and select a manageable entry.",
          );
        const confirmation = await dialog.showMessageBox(authorize(event), {
          type: "question",
          title: "Change startup registration",
          message: `${enabled ? "Restore" : "Disable"} ${entry.name}?`,
          detail: enabled
            ? "Restore its original startup registration for future sign-ins. Windows startup settings may separately block this app."
            : "Its startup registration will be saved so you can restore it here. This does not close the running application.",
          buttons: [
            "Cancel",
            enabled ? "Restore registration" : "Disable registration",
          ],
          defaultId: 0,
          cancelId: 0,
          noLink: true,
        });
        if (confirmation.response !== 1 || signal.aborted)
          return startupEntries;
        await toggleStartup(entry, enabled);
        startupEntries = await listStartup();
        return startupEntries;
      }),
  );
  ipcMain.handle("maintenance:startup-settings", async (event) => {
    authorize(event);
    windowsOnly();
    await shell.openExternal("ms-settings:startupapps");
  });
}
