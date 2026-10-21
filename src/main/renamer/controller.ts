import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import * as path from "path";
import { RenamerService } from "./service";
import type { RenamerAPI } from "../../types/smart-file-renamer";

export async function registerRenamer(
  rendererEntry: string,
): Promise<RenamerService> {
  const expected = new URL(rendererEntry);
  const trusted = (url: string): boolean => {
    try {
      const actual = new URL(url);
      return (
        actual.protocol === expected.protocol &&
        actual.host === expected.host &&
        actual.pathname === expected.pathname
      );
    } catch {
      return false;
    }
  };
  const service = new RenamerService(
    path.join(app.getPath("userData"), "smart-file-renamer.json"),
    (state) => {
      for (const window of BrowserWindow.getAllWindows())
        if (!window.isDestroyed() && trusted(window.webContents.getURL()))
          window.webContents.send("smart-renamer:changed", state);
    },
  );
  await service.initialize();
  const handlers: Omit<RenamerAPI, "onChange"> = {
    snapshot: async () => service.snapshot(),
    pick: async (kind) => {
      if (kind !== "files" && kind !== "folder")
        throw new Error("Unknown selection type.");
      const result = await dialog.showOpenDialog({
        title:
          kind === "folder"
            ? "Add folder to Smart File Renamer"
            : "Add files to Smart File Renamer",
        properties:
          kind === "folder"
            ? ["openDirectory"]
            : ["openFile", "multiSelections"],
      });
      return result.canceled
        ? service.snapshot()
        : service.add(result.filePaths);
    },
    add: (paths) => {
      if (!Array.isArray(paths) || paths.length > 1000)
        throw new Error("Invalid file selection.");
      return service.add(paths);
    },
    configure: (settings) => service.configure(settings),
    analyze: (ids) => service.analyze(ids),
    apply: (edits) => service.apply(edits),
    undo: (id) => service.undo(id),
    clear: () => service.clear(),
    cancel: async () => service.cancel(),
    duplicates: () => service.duplicates(),
    watch: async (action, value = {}) => {
      if (!["add", "update", "remove"].includes(action))
        throw new Error("Unknown watch action.");
      if (action === "add") {
        const result = await dialog.showOpenDialog({
          title: "Watch incoming files in a folder",
          properties: ["openDirectory"],
        });
        if (result.canceled) return service.snapshot();
        value = { path: result.filePaths[0] };
      }
      return service.watch(action, value);
    },
    reveal: async (id) => {
      const state = service.snapshot();
      const item = state.items.find((entry) => entry.id === id);
      if (!item) throw new Error("File no longer in the library.");
      shell.showItemInFolder(item.path);
    },
    models: () => service.models(),
  };
  for (const [method, handler] of Object.entries(handlers)) {
    ipcMain.handle(`smart-renamer:${method}`, (event, ...args: unknown[]) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (
        !window ||
        event.senderFrame !== event.sender.mainFrame ||
        !trusted(event.senderFrame.url)
      )
        throw new Error("Untrusted renamer request.");
      return (handler as (...input: unknown[]) => unknown)(...args);
    });
  }
  return service;
}
