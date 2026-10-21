import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { nativeAssetsPlugin } from './webpack.native-assets';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

export const plugins = [
  nativeAssetsPlugin,
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure',
  }),
];
