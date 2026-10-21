/* Build an isolated renderer from the real capture pages and preload. */
const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const root = path.resolve(__dirname, '..'), output = path.join(root, '.capture-smoke');
fs.mkdirSync(output, { recursive: true });
const base = { mode: 'development', devtool: false, context: root, resolve: { extensions: ['.ts', '.tsx', '.js', '.json'] }, module: { rules: [{ test: /\.tsx?$/, exclude: /node_modules/, use: { loader: 'ts-loader', options: { transpileOnly: true } } }, { test: /\.css$/, use: ['style-loader', 'css-loader', 'postcss-loader'] }, { test: /\.(woff2?|ttf|otf)$/, type: 'asset/resource' }] } };
webpack([{ ...base, target: 'web', entry: './src/tests/e2e/capture-renderer.tsx', output: { path: output, filename: 'renderer.js' } }, { ...base, target: 'electron-preload', entry: './src/preload/capture.ts', output: { path: output, filename: 'preload.js' } }], (error, stats) => {
  if (error || stats.hasErrors()) { console.error(error || stats.toString({ all: false, errors: true })); process.exitCode = 1; return; }
  fs.writeFileSync(path.join(output, 'index.html'), '<!doctype html><html class="dark"><head><meta charset="utf-8"><title>Capture smoke test</title></head><body><div id="app"></div><script src="renderer.js"></script></body></html>');
  console.log('Capture smoke renderer and preload built.');
});
