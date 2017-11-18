const path = require('path');
const CommonsChunkPlugin = require('webpack/lib/optimize/CommonsChunkPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const package = require('./package.json');

module.exports = {
  entry: {
    main: [
      './src/js/bookingViewer.js',
      './src/js/datepicker.js',
      './src/js/user-account.js',
      './src/js/vendor-profile.js',
      './src/js/main.js'
    ],
    vendor: Object.keys(package.dependencies)
  },
  output: {
    filename: '[name].bundle.js',
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
        use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: ['css-loader'],
        })
      },
      {
        test: /\.(sass|scss)$/,
        use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: ['css-loader', 'sass-loader'],
        })
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin({
      filename: '[name].css'
    }),
    new HtmlWebpackPlugin({
      hash: true,
      template: 'src/script-block.html',
      filename: '../templates/components/script-block.html',
      inject: false
    })
  ]
};
