const path = require('path');
const tsImportPlugin = require('ts-import-plugin');

module.exports = {
    entry: {
        vaultview: './src/view/index.js'
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
                    /*
                    use: {
                      loader: "babel-loader"
                      query: {
                        presets: ['react', 'es2015', 'stage-0'],
                      }
                    }*/
    
                    use: {
                      loader: "babel-loader",
                      query: {
                        presets: ['@babel/preset-react', '@babel/preset-env'],
                      }
                    }
              },
              {
                test: /\.css$/,
                    use: ["style-loader", "css-loader"]
              },
              {
                test: /\.svg$/,
                    use: ["react-svg-loader"]
              }
            ]
    }
  };

