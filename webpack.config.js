const path = require('path');
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const WebpackCleanupPlugin = require('webpack-cleanup-plugin');
const package = require('./package.json');

module.exports = {
  entry: {
    main: [
      './src/js/datepicker.js',
      './src/js/main.js'
    ],
    vendoracc: [
      './src/js/bookingViewer.js',
      './src/js/vendor-profile.js'
    ],
    useracc: './src/js/user-account.js',
    vendor: './src/vendor-plugins/framework.sass'
  },
  output: {
    filename: '[name].[hash].bundle.js',
    path: path.resolve(__dirname, 'static')
  },
  watch: true,
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      },
      {
        test: /\.css$/,
        include: path.resolve(__dirname, 'src/css'),
        use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: ['css-loader'],
        })
      },
      {
        test: /\.(sass|scss)$/,
        include:[
          path.resolve(__dirname, 'src/vendor-plugins'),
          path.resolve(__dirname, 'node_modules/bulma'),
          path.resolve(__dirname, 'node_modules/bulma-extensions')
        ],
        use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: ['css-loader', 'sass-loader'],
        })
      }
    ]
  },
  plugins: [
    new WebpackCleanupPlugin(),
    new ExtractTextPlugin({
      filename: '[name].[contenthash].bundle.css'
    }),
    new HtmlWebpackPlugin({
      template: 'src/layout.html',
      filename: '../templates/layout.html',
      chunks: ['vendor', 'main'],
      inject: false
    }),
    new HtmlWebpackPlugin({
      template: 'src/vendor-account.html',
      filename: '../templates/vendor-account.html',
      chunks: ['vendoracc'],
      inject: false
    })
  ]
};
