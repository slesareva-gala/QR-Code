const path = require('path');

module.exports = {
  context: path.resolve(__dirname, 'src'),
  entry: {
    QRCreator: './QRCreator.js',
  },
  output: {
    filename: 'js/[name].js',
    path: path.resolve(__dirname, 'docs')
  },
  devServer: {
    hot: true,
    allowedHosts: ['all'],
    static: {
      directory: './docs',
      watch: true
    }
  }
};


