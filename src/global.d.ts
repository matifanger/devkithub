// Extends the window object with the cryptoAPI object
type CryptoEncoding = 'utf8' | 'hex' | 'base64' | 'latin1';

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

interface DecryptOptions extends Omit<EncryptOptions, 'outputEncoding'> {
  outputEncoding?: CryptoEncoding;
  authTag?: string;
  authTagEncoding?: CryptoEncoding;
}

interface Window {
  cryptoAPI: {
    hash: (algorithm: string, data: string) => Promise<string | null>;
    encrypt: (
      options: EncryptOptions
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
    // Window close dialog events
    onShowCloseDialog: (callback: () => void) => void;
    sendCloseDialogSelection: (action: 'quit' | 'tray', remember: boolean) => Promise<void>;
    // Autostart dialog events
    onShowAutostartDialog: (callback: () => void) => void;
    sendAutostartSelection: (enable: boolean) => Promise<void>;
    shouldShowAutostartDialog: (currentPref: string | null) => Promise<boolean>;
  };
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}
