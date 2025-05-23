// Extends the window object with the cryptoAPI object
interface Window {
  cryptoAPI: {
    hash: (algorithm: string, data: string) => Promise<string>;
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
