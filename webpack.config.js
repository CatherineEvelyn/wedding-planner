const path = require('path');

module.exports = {
  entry: {
    main: "./static/"
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
};

const webpack = require('webpack'),
      glob = require('glob');

let config = {
  entry: {
    'vendor': [
      'react',
      'angular',
      'jquery'
    ],
    // Auto-detect all pages in directory.
    'myPages': glob.sync('./path/to/**/*.js'),
  },
  module: {
    loaders: [
      // Javascript: js, jsx
      {
        test: /\.jsx?$/,
        loader: 'babel-loader'
      },
      // CSS: scss, css
      {
        test: /\.s?css$/,
        loaders: ['style', 'css', 'sass', 'postcss-loader']
      },
      // SVGs: svg, svg?something
      {
        test: /\.svg(\?.*$|$)/,
        loader: 'file-loader?name=/img/[name].[ext]'
      },
      // Images: png, gif, jpg, jpeg
      {
        test: /\.(png|gif|jpe?g)$/,
        loader: 'file?name=/img/[name].[ext]'
      },
      // HTML: htm, html
      {
        test: /\.html?$/,
        loader: "file?name=[name].[ext]"
      },
      // Font files: eot, ttf, woff, woff2
      {
        test: /\.(eot|ttf|woff2?)(\?.*$|$)/,
        loader: 'file?name=/fonts/[name].[ext]'
      }
    ]
  },
  output: {
    path: './dist',
    filename: 'bundle--[name].js'
  },
  plugins: [
    // Pro-tip: Order matters here.
    new webpack.optimize.CommonsChunkPlugin(['myPages', 'vendor'], 'bundle--[name].js'),
    // Minify assets.
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false // https://github.com/webpack/webpack/issues/1496
      }
    })
  ]
};

module.exports = config;