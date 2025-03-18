const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'build'), // Output to 'build' directory
    clean: true,
    publicPath: '/', // Ensure correct paths for assets
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
        generator: {
          filename: 'images/[name][ext]', // Organize images in a subdirectory
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html', // Use the correct template path
      title: 'Roulette Game',
      favicon: './public/favicon.ico', // Ensure favicon is included
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
    historyApiFallback: true, // Enable client-side routing
  },
};