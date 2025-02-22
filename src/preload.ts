// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import crypto from 'crypto';
import { contextBridge, ipcRenderer, shell } from 'electron';
import {
  createBLAKE2b,
  createBLAKE2s,
  createBLAKE3,
  createMD4,
  createMD5,
  createRIPEMD160,
  createSHA1,
  createSHA224,
  createSHA256,
  createSHA3,
  createSHA384,
  createSHA512,
  createSM3,
  createWhirlpool,
} from 'hash-wasm';
import { md2 } from './utils/md2';

// Exponiendo funciones específicas al renderer
contextBridge.exposeInMainWorld('cryptoAPI', {
  hash: async (algorithm: string, data: string) => {
    try {
      // Custom MD2 implementation
      if (algorithm === 'md2') {
        return md2(data);
      }

      const inputData = new TextEncoder().encode(data);

      // hash-wasm implementations
      switch (algorithm) {
        case 'md4': {
          const hasher = await createMD4();
          hasher.init();
          hasher.update(inputData);
          return hasher.digest('hex');
        }
        case 'md5': {
          const hasher = await createMD5();
          hasher.init();
          hasher.update(inputData);
          return hasher.digest('hex');
        }
        case 'sha1': {
          const hasher = await createSHA1();
          hasher.init();
          hasher.update(inputData);
          return hasher.digest('hex');
        }
        case 'sha224': {
          const hasher = await createSHA224();
          hasher.init();
          hasher.update(inputData);
          return hasher.digest('hex');
        }
        case 'sha256': {
          const hasher = await createSHA256();
          hasher.init();
          hasher.update(inputData);
          return hasher.digest('hex');
        }
        case 'sha384': {
          const hasher = await createSHA384();
          hasher.init();
          hasher.update(inputData);
          return hasher.digest('hex');
        }
        case 'sha512': {
          const hasher = await createSHA512();
          hasher.init();
          hasher.update(inputData);
          return hasher.digest('hex');
        }
        case 'ripemd160': {
          const hasher = await createRIPEMD160();
          hasher.init();
          hasher.update(inputData);
          return hasher.digest('hex');
        }
        case 'whirlpool': {
          const hasher = await createWhirlpool();
          hasher.init();
          hasher.update(inputData);
          return hasher.digest('hex');
        }
        case 'sm3': {
          const hasher = await createSM3();
          hasher.init();
          hasher.update(inputData);
          return hasher.digest('hex');
        }
        case 'sha3-224': {
          const hasher = await createSHA3(224);
          hasher.update(inputData);
          return hasher.digest('hex');
        }
        case 'sha3-256': {
          const hasher = await createSHA3(256);
          hasher.update(inputData);
          return hasher.digest('hex');
        }
        case 'sha3-384': {
          const hasher = await createSHA3(384);
          hasher.update(inputData);
          return hasher.digest('hex');
        }
        case 'sha3-512': {
          const hasher = await createSHA3(512);
          hasher.update(inputData);
          return hasher.digest('hex');
        }
        case 'blake2b': {
          const hasher = await createBLAKE2b();
          hasher.init();
          hasher.update(inputData);
          return hasher.digest('hex');
        }
        case 'blake2s': {
          const hasher = await createBLAKE2s();
          hasher.init();
          hasher.update(inputData);
          return hasher.digest('hex');
        }
        case 'blake3': {
          const hasher = await createBLAKE3();
          hasher.init();
          hasher.update(inputData);
          return hasher.digest('hex');
        }
      }

      // Fallback to Node's crypto for other algorithms
      return crypto.createHash(algorithm).update(data).digest('hex');
    } catch (err) {
      console.error('Error al calcular hash:', err);
      return null;
    }
  },
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
  openExternal: (url: string) => {
    if (shell && shell.openExternal) {
      shell.openExternal(url).catch((err) => {
        console.error('Error opening external URL:', err);
      });
    } else {
      console.error('shell.openExternal is not available');
    }
  },
});
