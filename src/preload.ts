// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import crypto, {
  CipherCCMOptions,
  CipherGCMOptions,
  CipherOCBOptions,
} from 'crypto';
import { contextBridge, ipcRenderer, shell } from 'electron';
import {
  adler32 as wasmAdler32,
  blake2b,
  blake2s,
  blake3,
  crc64 as wasmCrc64,
  keccak,
  md4 as wasmMd4,
  md5 as wasmMd5,
  ripemd160 as wasmRipemd160,
  sha1 as wasmSha1,
  sha224 as wasmSha224,
  sha256 as wasmSha256,
  sha384 as wasmSha384,
  sha512 as wasmSha512,
  sha3 as wasmSha3,
  sm3 as wasmSm3,
  whirlpool as wasmWhirlpool,
  xxhash128,
  xxhash32,
  xxhash3,
  xxhash64,
} from 'hash-wasm';
import { md2 } from './utils/md2';
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

const textEncoder = new TextEncoder();

type SupportedEncoding = 'utf8' | 'hex' | 'base64' | 'latin1';

const normalizeEncoding = (
  encoding: SupportedEncoding = 'utf8'
): BufferEncoding => encoding;

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

type CipherOption =
  | CipherGCMOptions
  | CipherCCMOptions
  | CipherOCBOptions
  | undefined;

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
  'xxh32': (input) => xxhash32(input),
  'xxh64': (input) => xxhash64(input),
  'xxh3': (input) => xxhash3(input),
  'xxh128': (input) => xxhash128(input),
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

const nodeHashers: Record<
  string,
  { algorithm: string; outputLength?: number }
> = {
  shake128: { algorithm: 'shake128', outputLength: 32 },
  shake256: { algorithm: 'shake256', outputLength: 64 },
};

const getCipherOptions = (authTagLength?: number): CipherOption =>
  typeof authTagLength === 'number'
    ? ({ authTagLength } as CipherGCMOptions)
    : undefined;

const resolveIvArgument = (iv: Buffer | null) =>
  iv && iv.length > 0 ? iv : Buffer.alloc(0);

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
        return nodeHasher
          .update(data)
          .digest('hex');
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

      if (aad && typeof (cipher as crypto.CipherGCM).setAAD === 'function') {
        (cipher as crypto.CipherGCM).setAAD(toBuffer(aad, aadEncoding));
      }

      const encrypted = Buffer.concat([
        cipher.update(toBuffer(data, inputEncoding)),
        cipher.final(),
      ]);

      let authTag: string | null = null;
      if (typeof (cipher as crypto.CipherGCM).getAuthTag === 'function') {
        try {
          authTag = (cipher as crypto.CipherGCM).getAuthTag().toString('hex');
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

      if (aad && typeof (decipher as crypto.DecipherGCM).setAAD === 'function') {
        (decipher as crypto.DecipherGCM).setAAD(toBuffer(aad, aadEncoding));
      }

      if (authTag && typeof (decipher as crypto.DecipherGCM).setAuthTag === 'function') {
        (decipher as crypto.DecipherGCM).setAuthTag(toBuffer(authTag, authTagEncoding));
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
  // Close behavior prompt
  onShowCloseDialog: (callback: () => void) => {
    ipcRenderer.on('show-close-dialog', () => callback());
  },
  sendCloseDialogSelection: (action: 'quit' | 'tray', remember: boolean) =>
    ipcRenderer.invoke('handle-close-dialog-selection', action, remember),
  // Autostart prompt
  onShowAutostartDialog: (callback: () => void) => {
    ipcRenderer.on('show-autostart-dialog', () => callback());
  },
  sendAutostartSelection: (enable: boolean) =>
    ipcRenderer.invoke('handle-autostart-selection', enable),
  shouldShowAutostartDialog: (currentPref: string | null) =>
    ipcRenderer.invoke('should-show-autostart-dialog', currentPref),
});
