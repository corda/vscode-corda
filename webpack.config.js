'use strict';

const path = require('path');

const config = {
  node: {
    fs: "empty"
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json']
  },
  externals: {
    vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
  },
  module: {
      rules: [
            {
              test: /\.(ts|tsx)$/,
              exclude: [/node_modules/, /MSSQL/],
              use: [{
                loader: "ts-loader"
              }]
            },
            {
              test: /\.(js|jsx)$/,
              exclude: [/node_modules/, /MSSQL/],
              use: [{
                loader: "babel-loader"
              }]
            },
            {
              test: /\.css$/,
                  use: ["style-loader", "css-loader"]
            },
            { test: /.(png|jpg|woff|woff2|eot|ttf|svg|gif)$/, loader: 'url-loader?limit=1024000' }
          ]
  }
};

const logViewerConfig = Object.assign({}, config, {
  entry: "./src/logviewer/index.tsx",
    output: {
        path: path.resolve(__dirname, 'out/logviewer/'),
        filename: "index.js",
        libraryTarget: 'umd',
      devtoolModuleFilenameTemplate: '../[resource-path]'
    }
});

const networkMapConfig = Object.assign({}, config, {
  entry: "./src/network/networkmap/networkmap.tsx",
    output: {
        path: path.resolve(__dirname, 'out/network/networkmap'),
        filename: "networkmap.js",
        libraryTarget: 'umd',
      devtoolModuleFilenameTemplate: '../[resource-path]'
    }
});

module.exports = [ logViewerConfig, networkMapConfig ];