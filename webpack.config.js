const path = require('path');
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const WebpackCleanupPlugin = require('webpack-cleanup-plugin');
const webpack = require('webpack');
const package = require('./package.json');

module.exports = {
  entry: {
    main: [
      './src/js/datepicker.js',
      './src/js/main.js',
    ],
    vendoracc: [
      './src/js/bookingViewer.js',
      './src/js/vendor-profile.js'
    ],
    useracc: './src/js/user-account.js',
    framework: [
      './src/vendor-plugins/framework.sass',
      './src/vendor-plugins/framework.js'
    ],
    commonstyles: [
      './src/css/login.css',
      './src/css/mainpage.css',
      './src/css/style.css',
      './src/css/user-account.css',
      './src/css/vendor-account.css',
      './src/css/vendor-list.css'
    ]
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'static'),
    publicPath: ""
  },
  watch: true,
  resolve: {
    extensions: ['.js', '.jsx', '.css', '.sass', '.scss']
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
        include: [
          path.resolve(__dirname, 'src/css')
        ],
        use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: ['css-loader'],
        })
      },
      {
        test: /\.(sass|scss)$/,
        include:[
          path.resolve(__dirname, 'src/vendor-plugins')
        ],
        use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: ['css-loader', 'sass-loader'],
        })
      },
      {
        test: /\.(eot|woff|woff2|svg|ttf|png|jpe?g)([\?]?.*)$/, 
        include: [
          path.resolve(__dirname, 'node_modules/mdi/fonts'),
          path.resolve(__dirname, 'src/images')
        ],
        loader: "file-loader"
      }
    ]
  },
  plugins: [
    new WebpackCleanupPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      comments: false
    }),
    new ExtractTextPlugin({
      filename: '[name].bundle.css'
    }),
    new HtmlWebpackPlugin({
      hash: true,
      template: 'src/layout.html',
      filename: '../templates/layout.html',
      chunks: ['framework', 'main', 'commonstyles'],
      inject: false
    }),
    new HtmlWebpackPlugin({
      hash: true,
      template: 'src/vendor-account.html',
      filename: '../templates/vendor-account.html',
      chunks: ['vendoracc'],
      inject: false
    })
  ]
};
