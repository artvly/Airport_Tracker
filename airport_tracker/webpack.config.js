const path = require('path');

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
            presets: ['@babel/preset-react']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  }
};