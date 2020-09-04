'use strict';

const path = require('path');

module.exports = {
    entry: "./src/frontend/index.tsx",
    output: {
        path: path.resolve(__dirname, 'out/frontend/'),
        filename: "index.js",
        libraryTarget: 'umd',
      devtoolModuleFilenameTemplate: '../[resource-path]'
    },
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
    },
    
  };