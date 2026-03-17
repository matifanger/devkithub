// Extends the window object with the cryptoAPI object
type CryptoEncoding = "utf8" | "hex" | "base64" | "latin1";

interface EncryptOptions {
  algorithm: string;
  data: string;
  key: string;
  iv?: string;
  inputEncoding?: CryptoEncoding;
  outputEncoding?: CryptoEncoding;
  keyEncoding?: CryptoEncoding;
  ivEncoding?: CryptoEncoding;
  aad?: string;
  aadEncoding?: CryptoEncoding;
  authTagLength?: number;
  autoPadding?: boolean;
}

interface DecryptOptions extends Omit<EncryptOptions, "outputEncoding"> {
  outputEncoding?: CryptoEncoding;
  authTag?: string;
  authTagEncoding?: CryptoEncoding;
}

interface Window {
  cryptoAPI: {
    hash: (algorithm: string, data: string) => Promise<string | null>;
    encrypt: (
      options: EncryptOptions,
    ) => Promise<{ output: string; authTag: string | null }>;
    decrypt: (options: DecryptOptions) => Promise<string>;
    getCiphers: () => Promise<string[]>;
    generateRandomBytes: (size: number) => string;
  };
  electron: {
    store: {
      get: (key: string) => Promise<string | null>;
      set: (key: string, value: string) => Promise<boolean>;
      delete: (key: string) => Promise<boolean>;
    };
    settingsStore: {
      get: (key: string) => Promise<string | null>;
      set: (key: string, value: string) => Promise<boolean>;
      delete: (key: string) => Promise<boolean>;
    };
    env: {
      get: (key: string) => Promise<string>;
    };
    getSimpleHwid: () => Promise<string>;
    openExternal: (url: string) => Promise<void>;
    isPackaged: () => Promise<boolean>;
    window: {
      minimize: () => Promise<void>;
      maximize: () => Promise<void>;
      close: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
    };
    onShowCloseDialog: (callback: () => void) => void;
    sendCloseDialogSelection: (
      action: "quit" | "tray",
      remember: boolean,
    ) => Promise<void>;
    onShowAutostartDialog: (callback: () => void) => void;
    sendAutostartSelection: (enable: boolean) => Promise<void>;
    shouldShowAutostartDialog: (currentPref: string | null) => Promise<boolean>;
  };
  recorder: {
    setSelectedSource: (
      sourceId: string,
      captureAudio: boolean,
    ) => Promise<boolean>;
    getSources: () => Promise<any[]>;
    getPrimaryDisplay: () => Promise<{
      width: number;
      height: number;
      scaleFactor: number;
    }>;
    getAllDisplays: () => Promise<any[]>;
    generateId: () => Promise<string>;
    getPath: () => Promise<string>;
    saveChunk: (chunk: ArrayBuffer, filePath: string) => Promise<boolean>;
    saveCursorData: (data: string, filePath: string) => Promise<boolean>;
    saveMetadata: (data: string, filePath: string) => Promise<boolean>;
    finalizeVideo: (
      tempPath: string,
      finalPath: string,
    ) => Promise<{ success: boolean; path?: string; error?: string }>;
    saveFileDialog: (defaultName: string) => Promise<string | null>;
    openFolder: (folderPath: string) => Promise<void>;
  };
  cursor: {
    startTracking: () => Promise<boolean>;
    stopTracking: () => Promise<any[]>;
    addPosition: (
      x: number,
      y: number,
      click?: "left" | "right" | "double",
    ) => Promise<boolean>;
    getPositions: () => Promise<any[]>;
    clear: () => Promise<boolean>;
    getScreenSize: () => Promise<{
      width: number;
      height: number;
      scaleFactor: number;
    }>;
  };
  shortcuts: {
    register: (customShortcuts?: any) => Promise<boolean>;
    unregister: () => Promise<boolean>;
    getCurrent: () => Promise<any>;
    isRegistered: () => Promise<boolean>;
    onToggleRecording: (callback: () => void) => void;
    onPauseRecording: (callback: () => void) => void;
  };
  ffmpegRecorder: {
    isAvailable: () => Promise<boolean>;
    diagnostics: () => Promise<{
      ffmpegPath: string;
      exists: boolean;
      isPackaged: boolean;
      resourcesPath: string;
      platform: string;
      arch: string;
    }>;
    getDefaultConfig: () => Promise<Record<string, any>>;
    listAudioDevices: () => Promise<{
      system: string[];
      microphones: string[];
    }>;
    start: (
      config: any,
    ) => Promise<{ success: boolean; error?: string; outputPath?: string }>;
    pause: () => Promise<{ success: boolean; error?: string }>;
    resume: () => Promise<{ success: boolean; error?: string }>;
    stop: () => Promise<{
      success: boolean;
      outputPath?: string;
      error?: string;
    }>;
    getStatus: () => Promise<{
      state: string;
      duration: number;
      fileSize: number;
      fps: number;
      bitrate: number;
      droppedFrames: number;
      outputPath: string | null;
      error: string | null;
    }>;
    getRecordingsPath: () => Promise<string>;
    listRecordings: () => Promise<
      Array<{
        name: string;
        path: string;
        size: number;
        createdAt: number;
        modifiedAt: number;
      }>
    >;
    deleteRecording: (
      filePath: string,
    ) => Promise<{ success: boolean; error?: string }>;
    openRecordingsFolder: () => Promise<boolean>;
    onStatus: (callback: (status: any) => void) => void;
  };
  exporter: {
    getPresets: () => Promise<any>;
    start: (
      settings: any,
      outputPath: string,
    ) => Promise<{ success: boolean; path?: string; error?: string }>;
    cancel: () => Promise<{ success: boolean }>;
    isExporting: () => Promise<boolean>;
    showSaveDialog: (
      defaultName: string,
      format: string,
    ) => Promise<string | null>;
    onProgress: (callback: (progress: any) => void) => void;
  };
  project: {
    new: (name: string) => Promise<any>;
    save: (
      project: any,
    ) => Promise<{ success: boolean; path?: string; error?: string }>;
    load: (
      projectId: string,
    ) => Promise<{ success: boolean; project?: any; error?: string }>;
    saveDialog: (defaultName: string) => Promise<string | null>;
    openDialog: () => Promise<string | null>;
    getRecent: () => Promise<any[]>;
    delete: (
      projectId: string,
    ) => Promise<{ success: boolean; error?: string }>;
    list: () => Promise<any[]>;
    getPath: () => Promise<string>;
  };
  figlet: {
    text: (text: string, font: string) => Promise<string>;
  };
}

declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "*.jpeg" {
  const value: string;
  export default value;
}

declare module "*.gif" {
  const value: string;
  export default value;
}

declare module "*.svg" {
  const value: string;
  export default value;
}
