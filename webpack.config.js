const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin'); // Import CopyWebpackPlugin
const webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'build'), // Output to 'build' directory
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      title: 'Roulette Game',
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'], // Polyfill Buffer
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'public', // Copy everything from the 'public' directory
          to: '.', // Paste into the root of the 'build' directory
          globOptions: {
            ignore: ['**/index.html'], // Ignore index.html (handled by HtmlWebpackPlugin)
          },
        },
      ],
    }),
  ],
  resolve: {
    fallback: {
      buffer: require.resolve('buffer'), // Polyfill Buffer
    },
  },
  devServer: {
    static: path.resolve(__dirname, 'build'), // Serve from the 'build' directory
    compress: true,
    port: 9000,
    open: true,
    hot: true,
  },
};