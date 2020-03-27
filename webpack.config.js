const path = require('path');
const tsImportPlugin = require('ts-import-plugin');

module.exports = {
    entry: {
        index: './src/index.js'
    },
    output: {
        path: path.resolve(__dirname, 'out'),
        filename: "[name].js"
    },
    module: {
        rules: [
              {
                test: /\.(js|jsx)?$/,
                    exclude: [/node_modules/, /MSSQL/],
                    use: {
                      loader: "babel-loader",
                      query: {
                        presets: ['@babel/preset-react', '@babel/preset-env'],
                        plugins: [
                          [
                            "@babel/plugin-proposal-class-properties"
                          ]
                        ],
                      }
                    }
              },
              {
                test: /\.css$/,
                    use: ["style-loader", "css-loader"]
              },
              { test: /.(png|jpg|woff|woff2|eot|ttf|svg|gif)$/, loader: 'url-loader?limit=1024000' }
              // {
              //   test: /\.svg$/,
              //   loader: "svg-inline-loader"
              // },
              // {
              //   test: /\.(png|jpe?g|gif)$/i,
              //   loader: 'file-loader?name=[path][name].[ext]'
              // }
            ]
    },
    
  };

