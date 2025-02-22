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
    openExternal: (url: string) => Promise<void>;
  };
}
