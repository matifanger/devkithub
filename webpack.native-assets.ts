import type { Compiler, Compilation } from 'webpack';

const relocator = require('@vercel/webpack-asset-relocator-loader') as {
  initAssetCache: (compilation: Compilation, outputAssetBase: string) => void;
};

// Cached modules do not re-run their loaders. Reinstall the native asset runtime
// on each compilation so main/preload restarts can still resolve keytar/canvas.
export const nativeAssetsPlugin = {
  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap('DevKitHubNativeAssets', compilation => {
      relocator.initAssetCache(compilation, 'native_modules');
    });
  },
};
