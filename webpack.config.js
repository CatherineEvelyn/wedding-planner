const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const package = require('./package.json');

module.exports = {
  entry: {
    main: "./src/js/main.js",
    vendor: Object.keys(package.dependencies),
    bookingViewer: "./src/js/bookingViewer.js",
    datepicker: "./src/js/datepicker.js",
    vendorProfile: "./src/js/vendor-profile.js",
    userAccount: "./src/js/user-account.js"
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'static')
  },
  watch: true,
  resolve: { extensions: [".js"] },
  plugins: [
    new HtmlWebpackPlugin({
      hash: true,
      title: "My Wedding Planner",
      my
    })
  ]
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      }
    ]
  },
};
