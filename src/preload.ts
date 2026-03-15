// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import type {
  CipherCCMOptions,
  CipherGCM,
  CipherGCMOptions,
  CipherOCBOptions,
  DecipherGCM,
} from 'crypto';
import { contextBridge, ipcRenderer, shell } from 'electron';
import {
  blake2b,
  blake2s,
  blake3,
  keccak,
  adler32 as wasmAdler32,
  crc64 as wasmCrc64,
  md4 as wasmMd4,
  md5 as wasmMd5,
  ripemd160 as wasmRipemd160,
  sha1 as wasmSha1,
  sha224 as wasmSha224,
  sha256 as wasmSha256,
  sha3 as wasmSha3,
  sha384 as wasmSha384,
  sha512 as wasmSha512,
  sm3 as wasmSm3,
  whirlpool as wasmWhirlpool,
  xxhash128,
  xxhash3,
  xxhash32,
  xxhash64,
} from 'hash-wasm';
import {
  crc32 as crc32Basic,
  crc32c,
  fnv132,
  fnv164,
  fnv1a32,
  fnv1a64,
  joaat,
  murmur3a,
  murmur3c,
  murmur3f,
} from './utils/custom-hashers';
import { md2 } from './utils/md2';
declare const __non_webpack_require__: NodeRequire | undefined;
const getNodeRequire = (): NodeRequire => {
  if (typeof __non_webpack_require__ === 'function') {
    return __non_webpack_require__;
  }
  return eval('require');
};
const crypto: typeof import('crypto') = getNodeRequire()('crypto');

const textEncoder = new TextEncoder();

type SupportedEncoding = 'utf8' | 'hex' | 'base64' | 'latin1';

const normalizeEncoding = (encoding: SupportedEncoding = 'utf8'): BufferEncoding => encoding;

const toBuffer = (value: string, encoding: SupportedEncoding): Buffer =>
  Buffer.from(value, normalizeEncoding(encoding));

const toOptionalBuffer = (
  value: string | undefined | null,
  encoding: SupportedEncoding
): Buffer | null => {
  if (value === undefined || value === null) return null;
  if (value.length === 0) return null;
  return Buffer.from(value, normalizeEncoding(encoding));
};

type CipherOption = CipherGCMOptions | CipherCCMOptions | CipherOCBOptions | undefined;

interface EncryptOptions {
  algorithm: string;
  data: string;
  key: string;
  iv?: string;
  inputEncoding?: SupportedEncoding;
  outputEncoding?: SupportedEncoding;
  keyEncoding?: SupportedEncoding;
  ivEncoding?: SupportedEncoding;
  aad?: string;
  aadEncoding?: SupportedEncoding;
  authTagLength?: number;
  autoPadding?: boolean;
}

interface DecryptOptions extends Omit<EncryptOptions, 'outputEncoding'> {
  outputEncoding?: SupportedEncoding;
  authTag?: string;
  authTagEncoding?: SupportedEncoding;
}

const wasmHashers: Record<string, (input: Uint8Array) => Promise<string>> = {
  md4: (input) => wasmMd4(input),
  md5: (input) => wasmMd5(input),
  sha1: (input) => wasmSha1(input),
  sha224: (input) => wasmSha224(input),
  sha256: (input) => wasmSha256(input),
  sha384: (input) => wasmSha384(input),
  sha512: (input) => wasmSha512(input),
  'sha3-224': (input) => wasmSha3(input, 224),
  'sha3-256': (input) => wasmSha3(input, 256),
  'sha3-384': (input) => wasmSha3(input, 384),
  'sha3-512': (input) => wasmSha3(input, 512),
  blake2b: (input) => blake2b(input),
  blake2s: (input) => blake2s(input),
  blake3: (input) => blake3(input),
  ripemd160: (input) => wasmRipemd160(input),
  whirlpool: (input) => wasmWhirlpool(input),
  sm3: (input) => wasmSm3(input),
  adler32: (input) => wasmAdler32(input),
  crc64: (input) => wasmCrc64(input),
  xxh32: (input) => xxhash32(input),
  xxh64: (input) => xxhash64(input),
  xxh3: (input) => xxhash3(input),
  xxh128: (input) => xxhash128(input),
  'keccak-224': (input) => keccak(input, 224),
  'keccak-256': (input) => keccak(input, 256),
  'keccak-384': (input) => keccak(input, 384),
  'keccak-512': (input) => keccak(input, 512),
};

const customHashers: Record<string, (input: Uint8Array) => string> = {
  fnv132: (input) => fnv132(input),
  fnv1a32: (input) => fnv1a32(input),
  fnv164: (input) => fnv164(input),
  fnv1a64: (input) => fnv1a64(input),
  joaat: (input) => joaat(input),
  murmur3a: (input) => murmur3a(input),
  murmur3c: (input) => murmur3c(input),
  murmur3f: (input) => murmur3f(input),
  crc32: (input) => crc32Basic(input),
  crc32b: (input) => crc32Basic(input),
  crc32c: (input) => crc32c(input),
};

const nodeHashers: Record<string, { algorithm: string; outputLength?: number }> = {
  shake128: { algorithm: 'shake128', outputLength: 32 },
  shake256: { algorithm: 'shake256', outputLength: 64 },
};

const getCipherOptions = (authTagLength?: number): CipherOption =>
  typeof authTagLength === 'number' ? ({ authTagLength } as CipherGCMOptions) : undefined;

const resolveIvArgument = (iv: Buffer | null) => (iv && iv.length > 0 ? iv : Buffer.alloc(0));

const createCipherInstance = (
  algorithm: string,
  key: Buffer,
  iv: Buffer | null,
  authTagLength?: number
) => {
  const options = getCipherOptions(authTagLength);
  const ivArg = resolveIvArgument(iv);
  return options
    ? crypto.createCipheriv(algorithm, key, ivArg, options)
    : crypto.createCipheriv(algorithm, key, ivArg);
};

const createDecipherInstance = (
  algorithm: string,
  key: Buffer,
  iv: Buffer | null,
  authTagLength?: number
) => {
  const options = getCipherOptions(authTagLength);
  const ivArg = resolveIvArgument(iv);
  return options
    ? crypto.createDecipheriv(algorithm, key, ivArg, options)
    : crypto.createDecipheriv(algorithm, key, ivArg);
};

// Exponiendo funciones específicas al renderer
contextBridge.exposeInMainWorld('cryptoAPI', {
  hash: async (algorithm: string, data: string) => {
    const normalized = algorithm.toLowerCase();

    try {
      if (normalized === 'md2') {
        return md2(data);
      }

      const inputData = textEncoder.encode(data);

      if (normalized in wasmHashers) {
        return await wasmHashers[normalized](inputData);
      }

      if (normalized in customHashers) {
        return customHashers[normalized](inputData);
      }

      if (normalized in nodeHashers) {
        const { algorithm: algoName, outputLength } = nodeHashers[normalized];
        const nodeHasher = outputLength
          ? crypto.createHash(algoName, { outputLength })
          : crypto.createHash(algoName);
        return nodeHasher.update(data).digest('hex');
      }

      return crypto.createHash(normalized).update(data).digest('hex');
    } catch (err) {
      console.error(`Error al calcular hash (${algorithm}):`, err);
      return null;
    }
  },
  encrypt: async (options: EncryptOptions) => {
    const {
      algorithm,
      data,
      key,
      iv,
      inputEncoding = 'utf8',
      outputEncoding = 'base64',
      keyEncoding = 'utf8',
      ivEncoding = 'utf8',
      aad,
      aadEncoding = 'utf8',
      authTagLength,
      autoPadding = true,
    } = options;

    try {
      const keyBuffer = toBuffer(key, keyEncoding);
      const ivBuffer = toOptionalBuffer(iv, ivEncoding);
      const cipher = createCipherInstance(algorithm, keyBuffer, ivBuffer, authTagLength);

      cipher.setAutoPadding(autoPadding);

      if (aad && typeof (cipher as CipherGCM).setAAD === 'function') {
        (cipher as CipherGCM).setAAD(toBuffer(aad, aadEncoding));
      }

      const encrypted = Buffer.concat([
        cipher.update(toBuffer(data, inputEncoding)),
        cipher.final(),
      ]);

      let authTag: string | null = null;
      if (typeof (cipher as CipherGCM).getAuthTag === 'function') {
        try {
          authTag = (cipher as CipherGCM).getAuthTag().toString('hex');
        } catch {
          authTag = null;
        }
      }

      return {
        output: encrypted.toString(normalizeEncoding(outputEncoding)),
        authTag,
      };
    } catch (err) {
      console.error('Error al cifrar:', err);
      throw err;
    }
  },
  decrypt: async (options: DecryptOptions) => {
    const {
      algorithm,
      data,
      key,
      iv,
      inputEncoding = 'base64',
      outputEncoding = 'utf8',
      keyEncoding = 'utf8',
      ivEncoding = 'utf8',
      aad,
      aadEncoding = 'utf8',
      authTag,
      authTagEncoding = 'hex',
      authTagLength,
      autoPadding = true,
    } = options;

    try {
      const keyBuffer = toBuffer(key, keyEncoding);
      const ivBuffer = toOptionalBuffer(iv, ivEncoding);
      const decipher = createDecipherInstance(algorithm, keyBuffer, ivBuffer, authTagLength);

      decipher.setAutoPadding(autoPadding);

      if (aad && typeof (decipher as DecipherGCM).setAAD === 'function') {
        (decipher as DecipherGCM).setAAD(toBuffer(aad, aadEncoding));
      }

      if (authTag && typeof (decipher as DecipherGCM).setAuthTag === 'function') {
        (decipher as DecipherGCM).setAuthTag(toBuffer(authTag, authTagEncoding));
      }

      const decrypted = Buffer.concat([
        decipher.update(toBuffer(data, inputEncoding)),
        decipher.final(),
      ]);

      return decrypted.toString(normalizeEncoding(outputEncoding));
    } catch (err) {
      console.error('Error al descifrar:', err);
      throw err;
    }
  },
  getCiphers: async () => crypto.getCiphers(),
  generateRandomBytes: (size: number) => {
    try {
      return crypto.randomBytes(size).toString('hex');
    } catch (err) {
      console.error('Error al generar random bytes:', err);
      return null;
    }
  },
});

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  store: {
    get: (key: string) => ipcRenderer.invoke('get-secure-store', key),
    set: (key: string, value: string) => ipcRenderer.invoke('set-secure-store', key, value),
    delete: (key: string) => ipcRenderer.invoke('delete-secure-store', key),
  },
  // General settings store
  settingsStore: {
    get: (key: string) => ipcRenderer.invoke('get-store', key),
    set: (key: string, value: string) => ipcRenderer.invoke('set-store', key, value),
    delete: (key: string) => ipcRenderer.invoke('delete-store', key),
  },
  env: {
    get: (key: string) => ipcRenderer.invoke('get-env', key),
  },
  getSimpleHwid: () => ipcRenderer.invoke('getSimpleHwid'),
  openExternal: (url: string) => {
    if (shell && shell.openExternal) {
      shell.openExternal(url).catch((err) => {
        console.error('Error opening external URL:', err);
      });
    } else {
      console.error('shell.openExternal is not available');
    }
  },
  isPackaged: () => ipcRenderer.invoke('isPackaged'),
  onShowCloseDialog: (callback: () => void) => {
    ipcRenderer.on('show-close-dialog', () => callback());
  },
  sendCloseDialogSelection: (action: 'quit' | 'tray', remember: boolean) =>
    ipcRenderer.invoke('handle-close-dialog-selection', action, remember),
  onShowAutostartDialog: (callback: () => void) => {
    ipcRenderer.on('show-autostart-dialog', () => callback());
  },
  sendAutostartSelection: (enable: boolean) =>
    ipcRenderer.invoke('handle-autostart-selection', enable),
  shouldShowAutostartDialog: (currentPref: string | null) =>
    ipcRenderer.invoke('should-show-autostart-dialog', currentPref),
});

contextBridge.exposeInMainWorld('cursor', {
  startTracking: () => ipcRenderer.invoke('cursor:start-tracking'),
  stopTracking: () => ipcRenderer.invoke('cursor:stop-tracking'),
  addPosition: (x: number, y: number, click?: 'left' | 'right' | 'double') =>
    ipcRenderer.invoke('cursor:add-position', x, y, click),
  getPositions: () => ipcRenderer.invoke('cursor:get-positions'),
  clear: () => ipcRenderer.invoke('cursor:clear'),
  getScreenSize: () => ipcRenderer.invoke('cursor:get-screen-size'),
});

contextBridge.exposeInMainWorld('recorder', {
  setSelectedSource: (sourceId: string, captureAudio: boolean) =>
    ipcRenderer.invoke('recorder:set-source', sourceId, captureAudio),
  getSources: () => ipcRenderer.invoke('recorder:get-sources'),
  getPrimaryDisplay: () => ipcRenderer.invoke('recorder:get-primary-display'),
  getAllDisplays: () => ipcRenderer.invoke('recorder:get-all-displays'),
  generateId: () => ipcRenderer.invoke('recorder:generate-id'),
  getPath: () => ipcRenderer.invoke('recorder:get-path'),
  saveChunk: (chunk: ArrayBuffer, filePath: string) =>
    ipcRenderer.invoke('recorder:save-chunk', chunk, filePath),
  saveCursorData: (data: string, filePath: string) =>
    ipcRenderer.invoke('recorder:save-cursor-data', data, filePath),
  saveMetadata: (data: string, filePath: string) =>
    ipcRenderer.invoke('recorder:save-metadata', data, filePath),
  finalizeVideo: (tempPath: string, finalPath: string) =>
    ipcRenderer.invoke('recorder:finalize-video', tempPath, finalPath),
  saveFileDialog: (defaultName: string) =>
    ipcRenderer.invoke('recorder:save-file-dialog', defaultName),
  openFolder: (folderPath: string) => ipcRenderer.invoke('recorder:open-folder', folderPath),
});

contextBridge.exposeInMainWorld('shortcuts', {
  register: (customShortcuts?: any) => ipcRenderer.invoke('shortcuts:register', customShortcuts),
  unregister: () => ipcRenderer.invoke('shortcuts:unregister'),
  getCurrent: () => ipcRenderer.invoke('shortcuts:get-current'),
  isRegistered: () => ipcRenderer.invoke('shortcuts:is-registered'),
  onToggleRecording: (callback: () => void) => {
    ipcRenderer.on('shortcut:toggle-recording', () => callback());
  },
  onPauseRecording: (callback: () => void) => {
    ipcRenderer.on('shortcut:pause-recording', () => callback());
  },
});

contextBridge.exposeInMainWorld('ffmpegRecorder', {
  isAvailable: () => ipcRenderer.invoke('ffmpeg-recorder:is-available'),
  diagnostics: () => ipcRenderer.invoke('ffmpeg-recorder:diagnostics'),
  getDefaultConfig: () => ipcRenderer.invoke('ffmpeg-recorder:get-default-config'),
  listAudioDevices: () => ipcRenderer.invoke('ffmpeg-recorder:list-audio-devices'),
  start: (config: any) => ipcRenderer.invoke('ffmpeg-recorder:start', config),
  pause: () => ipcRenderer.invoke('ffmpeg-recorder:pause'),
  resume: () => ipcRenderer.invoke('ffmpeg-recorder:resume'),
  stop: () => ipcRenderer.invoke('ffmpeg-recorder:stop'),
  getStatus: () => ipcRenderer.invoke('ffmpeg-recorder:get-status'),
  getRecordingsPath: () => ipcRenderer.invoke('ffmpeg-recorder:get-recordings-path'),
  listRecordings: () => ipcRenderer.invoke('ffmpeg-recorder:list-recordings'),
  deleteRecording: (filePath: string) =>
    ipcRenderer.invoke('ffmpeg-recorder:delete-recording', filePath),
  openRecordingsFolder: () => ipcRenderer.invoke('ffmpeg-recorder:open-recordings-folder'),
  onStatus: (callback: (status: any) => void) => {
    ipcRenderer.on('ffmpeg-recorder:status', (_, status) => callback(status));
  },
});

contextBridge.exposeInMainWorld('exporter', {
  getPresets: () => ipcRenderer.invoke('exporter:get-presets'),
  start: (settings: any, outputPath: string) =>
    ipcRenderer.invoke('exporter:start', settings, outputPath),
  cancel: () => ipcRenderer.invoke('exporter:cancel'),
  isExporting: () => ipcRenderer.invoke('exporter:is-exporting'),
  showSaveDialog: (defaultName: string, format: string) =>
    ipcRenderer.invoke('exporter:show-save-dialog', defaultName, format),
  onProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('exporter:progress', (_, progress) => callback(progress));
  },
});

contextBridge.exposeInMainWorld('project', {
  new: (name: string) => ipcRenderer.invoke('project:new', name),
  save: (project: any) => ipcRenderer.invoke('project:save', project),
  load: (projectId: string) => ipcRenderer.invoke('project:load', projectId),
  saveDialog: (defaultName: string) => ipcRenderer.invoke('project:save-dialog', defaultName),
  openDialog: () => ipcRenderer.invoke('project:open-dialog'),
  getRecent: () => ipcRenderer.invoke('project:get-recent'),
  delete: (projectId: string) => ipcRenderer.invoke('project:delete', projectId),
  list: () => ipcRenderer.invoke('project:list'),
  getPath: () => ipcRenderer.invoke('project:get-path'),
});
