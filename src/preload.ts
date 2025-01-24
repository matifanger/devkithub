// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge } from 'electron';
import crypto from 'crypto';

// Exponiendo funciones específicas al renderer
contextBridge.exposeInMainWorld('cryptoAPI', {
    hash: (algorithm: string, data: string) => {
      try {
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