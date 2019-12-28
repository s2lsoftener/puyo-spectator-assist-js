/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin').CleanWebpackPlugin;
const CopyWebpackPlugin = require('copy-webpack-plugin');
// const WriteFilePlugin = require('write-file-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  devtool: process.env.NODE_ENV === 'development' && 'inline-source-map',
  devServer: {
    contentBase: path.join(__dirname, 'build'),
    watchContentBase: true,
    disableHostCheck: true,
    writeToDisk: true,
  },
  entry: {
    background: './src/ts/background.ts',
    options: './src/ts/options.ts',
    popup: './src/ts/popup.ts',
    contentScript: './src/ts/contentScript.ts',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'build'),
  },
  // externals: {
  //   '@mjyc/opencv.js': 'cv',
  // },
  // externals: [/(opencv\.js)$/i],
  externals: {
    '../js/opencv.js': 'cv',
    '../../js/opencv.js': 'cv',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            // options: {
            //   outputPath: 'images',
            // },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    // Cleans the build folder
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
    }),

    // Copy manifest.json
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, 'src', 'manifest.json'),
        to: path.join(__dirname, 'build'),
        force: true,
      },
      {
        from: path.join(__dirname, 'src', 'js', 'opencv.js'),
        to: path.join(__dirname, 'build'),
        force: true,
      },
    ]),

    // Creates the output html files with their corresponding .js injected
    new HtmlWebpackPlugin({
      template: './src/views/popup.html',
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
      template: './src/views/options.html',
      filename: 'options.html',
      chunks: ['options'],
    }),
    new HtmlWebpackPlugin({
      template: './src/views/background.html',
      filename: 'background.html',
      chunks: ['background'],
    }),

    // Forces webpack dev server to write to disk, so Chrome can reload its extension files
    // new WriteFilePlugin(),
  ],

  // Because of opencv.js, webpack will throw error: "Can't resolve 'fs' in ...opencv.js"
  // Setting this fixes that somehow.
  // https://github.com/webpack-contrib/css-loader/issues/447
  node: {
    fs: 'empty',
  },
};
