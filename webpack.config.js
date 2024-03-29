const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin').CleanWebpackPlugin;
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');

console.log(process.env.NODE_ENV === 'development' && 'inline-source-map');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  devtool: process.env.NODE_ENV === 'development' && 'inline-source-map',
  devServer: {
    open: false,
    contentBase: './build',
    watchContentBase: true,
  },
  entry: {
    background: './src/js/background.js',
    options: './src/js/options.js',
    popup: './src/js/popup.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'build'),
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'file-loader',
        ],
      },
    ],
  },
  plugins: [
    // Cleans the build folder
    new CleanWebpackPlugin(),

    // Copy manifest.json
    new CopyWebpackPlugin([
      {
        from: "./src/manifest.json",
        to: "./"
      }
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
      chunks: ['background']
    }),

    // Forces webpack dev server to write to disk, so Chrome can reload its extension files
    new WriteFilePlugin(),
  ],

  // Because of opencv.js, webpack will throw error: "Can't resolve 'fs' in ...opencv.js"
  // Setting this fixes that somehow.
  // https://github.com/webpack-contrib/css-loader/issues/447
  node: {
    fs: 'empty'
  }
};