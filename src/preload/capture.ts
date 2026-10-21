import { contextBridge, ipcRenderer } from "electron";
import type { CaptureApi } from "../types/capture";

const captureCall = (method: string, ...args: unknown[]) =>
  ipcRenderer.invoke(`capture:${method}`, ...args);
const captureListener = <T>(channel: string, callback: (value: T) => void) => {
  const listener = (_: Electron.IpcRendererEvent, value: T) => callback(value);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};
const captureBridge: CaptureApi = {
  sources: () => captureCall("sources"),
  platform: () => captureCall("platform"),
  list: () => captureCall("list"),
  get: (id) => captureCall("get", id),
  saveImage: (data, name) => captureCall("saveImage", data, name),
  beginRecording: (name, mime) => captureCall("beginRecording", name, mime),
  appendRecording: (id, data) => captureCall("appendRecording", id, data),
  finishRecording: (id, details) => captureCall("finishRecording", id, details),
  abortRecording: (id) => captureCall("abortRecording", id),
  importMedia: (kind) => captureCall("importMedia", kind),
  download: (id) => captureCall("download", id),
  remove: (id) => captureCall("remove", id),
  rename: (id, name) => captureCall("rename", id, name),
  copyImage: (id) => captureCall("copyImage", id),
  pin: (id) => captureCall("pin", id),
  exportVideo: (id, options) => captureCall("exportVideo", id, options),
  cancelExport: () => captureCall("cancelExport"),
  onExportProgress: (callback) =>
    captureListener("capture:export-progress", callback),
  onShortcut: (callback) => captureListener("capture:shortcut", callback),
  cloudSettings: () => captureCall("cloudSettings"),
  configureCloud: (url, token) => captureCall("configureCloud", url, token),
  share: (id, days, password) => captureCall("share", id, days, password),
  revokeShare: (id) => captureCall("revokeShare", id),
};
contextBridge.exposeInMainWorld("captureStudio", captureBridge);
