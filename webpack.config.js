'use strict';

const path = require('path');

const config = {
  node: {
    fs: "empty"
  },
  // Enable sourcemaps for debugging webpack's output.
  devtool: "eval-source-map",
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
                loader: "babel-loader",
                query: {
                  presets: ['@babel/preset-react', '@babel/preset-env'],
                  plugins: [
                    [
                      "@babel/plugin-proposal-class-properties"
                    ]
                  ],
                }
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

const transactionsConfig = Object.assign({}, config, {
  entry: "./src/network/transactions/transactions.tsx",
    output: {
        path: path.resolve(__dirname, 'out/network/transactions'),
        filename: "transactions.js",
        libraryTarget: 'umd',
      devtoolModuleFilenameTemplate: '../[resource-path]'
    }
});

const vaultqueryConfig = Object.assign({}, config, {
  entry: "./src/network/vaultquery/vaultquery.tsx",
    output: {
        path: path.resolve(__dirname, 'out/network/vaultquery'),
        filename: "vaultquery.js",
        libraryTarget: 'umd',
      devtoolModuleFilenameTemplate: '../[resource-path]'
    }
});

// const prereqsConfig = Object.assign({}, config, {
//   entry: "./src/static/prereqs.tsx",
//     output: {
//         path: path.resolve(__dirname, 'out/static'),
//         filename: "prereqs.js",
//         libraryTarget: 'umd',
//       devtoolModuleFilenameTemplate: '../[resource-path]'
//     }
// });

module.exports = [ logViewerConfig, networkMapConfig, transactionsConfig, vaultqueryConfig];