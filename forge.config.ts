import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import type { ForgeConfig } from '@electron-forge/shared-types';
import path from 'path';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const config: ForgeConfig = {
  packagerConfig: {
    icon: path.join(__dirname, 'src/assets/icons/icon'), // Ruta base sin extensión
    executableName: 'DevKitHub',
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      setupIcon: path.join(__dirname, 'src/assets/icons/windows/icon.ico'), // Ícono para el instalador en Windows
      name: 'DevKitHub',
    }),
    new MakerZIP({}, ['darwin']),
    new MakerDMG({
      icon: path.join(__dirname, 'src/assets/icons/mac/icon.icns'), // Ícono para el DMG en macOS
      name: 'DevKitHub',
    }),
    new MakerRpm({
      options: {
        icon: path.join(__dirname, 'src/assets/icons/linux/icon.png'), // Ícono para RPM en Linux
        name: 'DevKitHub',
        bin: 'DevKitHub',
        categories: ['Utility'],
      },
    }),
    new MakerDeb({
      options: {
        icon: path.join(__dirname, 'src/assets/icons/linux/icon.png'), // Ícono para DEB en Linux
        name: 'DevKitHub',
        bin: 'DevKitHub',
        categories: ['Utility'],
      },
    }),
  ],
  plugins: [
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer.ts',
            name: 'main_window',
            preload: {
              js: './src/preload.ts',
            },
          },
        ],
      },
    }),
  ],
};

export default config;
