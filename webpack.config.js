const path = require('path');
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const WebpackCleanupPlugin = require('webpack-cleanup-plugin');
// const CompressionPlugin = require('compression-webpack-plugin');
const webpack = require('webpack');
const package = require('./package.json');

module.exports = {
  entry: {
    framework: [
      './src/vendor-plugins/framework.sass',
      'babel-polyfill',
      './src/vendor-plugins/framework.js'
    ],
    main: [
      './src/js/main.js',
      './src/css/style.css',
      './src/css/mainpage.css',
    ],
    vendorlist: [
      './src/js/vendor-list.js',
      './src/css/vendor-list.css'
    ],
    vendoracc: [
      './src/js/vendor-profile.js',
      './src/css/vendor-account.css'
    ],
    useracc: [
      './src/js/user-account.js',
      './src/css/user-account.css'
    ],
    login: './src/css/login.css'
  },
  output: {
    filename: '[name].[hash].js',
    path: path.resolve(__dirname, 'static'),
    publicPath: ""
  },
  resolve: {
    extensions: ['.js', '.jsx', '.css', '.sass', '.scss']
  },
  externals: {
    progressively: "progressively"
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
        test: /\.(css|sass|scss)$/,
        include: [
          path.resolve(__dirname, 'src/vendor-plugins'),
          path.resolve(__dirname, 'src/css')
        ],
        use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [
              {
                loader: 'css-loader',
                options: {
                  minimize: true
                }
              },
              {
                loader: 'postcss-loader'
              },
              {
                loader: 'sass-loader'
              }
            ],
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
      filename: '[name].[contenthash].css'
    }),
    new HtmlWebpackPlugin({
      template: 'src/templates/layout.html',
      filename: '../templates/layout.html',
      chunks: ['framework', 'main', 'commonstyles'],
      chunksSortMode: 'manual',
      inject: false
    }),
    new HtmlWebpackPlugin({
      template: 'src/templates/index.html',
      filename: '../templates/index.html',
      chunks: ['main'],
      inject: false
    }),
    new HtmlWebpackPlugin({
      template: 'src/templates/vendor-account.html',
      filename: '../templates/vendor-account.html',
      chunks: ['vendoracc'],
      chunksSortMode: 'manual',
      inject: false
    }),
    new HtmlWebpackPlugin({
      template: 'src/templates/vendor-list.html',
      filename: '../templates/vendor-list.html',
      chunks: ['vendorlist'],
      chunksSortMode: 'manual',
      inject: false
    }),
    new HtmlWebpackPlugin({
      template: 'src/templates/login.html',
      filename: '../templates/login.html',
      chunks: ['login'],
      inject: false
    })
    // new CompressionPlugin({
    //   asset: "[path].gz[query]",
    //   algorithm: "gzip",
    //   test: /\.js$|\.css$|\.html$/,
    //   threshold: 10240,
    //   minRatio: 0.8
    // })
  ]
};
