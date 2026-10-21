import path from "path";
import type { Configuration } from "webpack";

import CopyWebpackPlugin from "copy-webpack-plugin";
import { plugins } from "./webpack.plugins";
import { getRules } from "./webpack.rules";

const assets = ["assets"];

const copyPlugins = new CopyWebpackPlugin({
  patterns: assets.map((asset) => ({
    from: path.resolve(__dirname, "src", asset),
    to: path.resolve(__dirname, ".webpack/renderer", asset),
  })),
});

export const rendererConfig: Configuration = {
  experiments: {
    asyncWebAssembly: true,
    topLevelAwait: true,
  },
  module: {
    rules: getRules("esnext"),
  },
  plugins: [...plugins, copyPlugins],
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".css"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      vm: require.resolve("vm-browserify"),
      assert: require.resolve("assert-browserify"),
      zlib: require.resolve("browserify-zlib"),
      util: require.resolve("util"),
      timers: require.resolve("timers-browserify"),
      buffer: require.resolve("buffer"),
    },
    modules: ["node_modules", path.resolve(__dirname, "src")],
  },
};
