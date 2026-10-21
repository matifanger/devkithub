import type { ModuleOptions } from 'webpack';

export const getRules = (module: 'commonjs' | 'esnext' = 'commonjs'): Required<ModuleOptions>['rules'] => [
  // Add support for native node modules
  {
    // We're specifying native_modules in the test because the asset relocator loader generates a
    // "fake" .node file which is really a cjs file.
    test: /native_modules[/\\].+\.node$/,
    use: 'node-loader',
  },
  {
    test: /[/\\]node_modules[/\\].+\.(m?js|node)$/,
    parser: { amd: false },
    use: {
      loader: '@vercel/webpack-asset-relocator-loader',
      options: {
        outputAssetBase: 'native_modules',
      },
    },
  },
  {
    test: /\.tsx?$/,
    exclude: /(node_modules|\.webpack)/,
    use: {
      loader: 'ts-loader',
      options: {
        transpileOnly: true,
        // Preserve import() so Webpack can load tools on demand.
        compilerOptions: { module },
      },
    },
  },
  {
    test: /\.css$/,
    use: [{ loader: 'style-loader' }, { loader: 'css-loader' }, { loader: 'postcss-loader' }],
  },
  {
    test: /\.(woff2?|eot|ttf|otf)$/i,
    type: 'asset/resource',
  },
  {
    test: /\.(png|jpg|gif|svg|glb)$/,
    type: 'asset/resource',
  },
];

export const rules = getRules();
