const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './frontend/static/frontend/js/app.jsx',
  output: {
    path: path.resolve(__dirname, 'frontend/static/frontend/dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {

          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-react'
            ],
            plugins:["@babel/plugin-transform-modules-commonjs"]

          }
        }
      },

      { // НОВОЕ ПРАВИЛО ДЛЯ CSS
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
};