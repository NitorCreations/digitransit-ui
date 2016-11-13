/* eslint-disable import/no-extraneous-dependencies, global-require, prefer-template,
   import/no-dynamic-require
*/

const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const autoprefixer = require('autoprefixer');
const csswring = require('csswring');
const StatsPlugin = require('stats-webpack-plugin');
const fs = require('fs');

require('babel-core/register')({
  presets: ['modern-node', 'stage-2'], // eslint-disable-line prefer-template
  plugins: [
    'transform-es2015-destructuring',
    'transform-es2015-parameters',
    'transform-class-properties',
    'transform-es2015-modules-commonjs',
  ],
  ignore: [
    /node_modules/,
    'app/util/piwik.js',
  ],
});

const port = process.env.HOT_LOAD_PORT || 9000;

function getRulesConfig(env) {
  if (env === 'development') {
    return ([
      { test: /\.css$/, loaders: ['style', 'css', 'postcss'] },
      { test: /\.json$/, loader: 'json' },
      { test: /\.scss$/, loaders: ['style', 'css', 'postcss', 'sass'] },
      { test: /\.(eot|png|ttf|woff|svg)$/, loader: 'file' },
      { test: /\.js$/,
        loader: 'babel',
        exclude: /node_modules/,
        options: {
          // loose is needed by older Androids < 4.3 and IE10
          presets: [['latest', { es2015: { loose: true, modules: false } }], 'react', 'stage-2'],
          plugins: [
            'transform-class-properties',
            path.join(__dirname, 'build/babelRelayPlugin'),
          ],
          ignore: [
            'app/util/piwik.js',
          ],
        },
      },
    ]);
  }
  return ([
    { test: /\.css$/, loader: ExtractTextPlugin.extract('css!postcss') },
    { test: /\.json$/, loader: 'json' },
    { test: /\.scss$/, loader: ExtractTextPlugin.extract('css!postcss!sass') },
    { test: /\.(eot|png|ttf|woff|svg)$/, loader: 'url-loader?limit=10000' },
    { test: /\.js$/,
      loader: 'babel',
      exclude: /node_modules/,
      options: {
        // loose is needed by older Androids < 4.3 and IE10
        presets: [['latest', { es2015: { loose: true, modules: false } }], 'react', 'stage-2'],
        plugins: [
          'transform-class-properties',
          path.join(__dirname, 'build/babelRelayPlugin'),
        ],
        ignore: [
          'app/util/piwik.js',
        ],
      },
    },
  ]);
}

function getAllPossibleLanguages() {
  const srcDirectory = 'app';
  return fs.readdirSync(srcDirectory)
    .filter(file => /^config\.\w+\.js$/.test(file))
    .filter(file => !/^config\.client\.js$/.test(file))
    .map(file => require('./' + srcDirectory + '/' + file).default.availableLanguages)
    .reduce((languages, languages2) => languages.concat(languages2))
    .filter((language, position, languages) => languages.indexOf(language) === position);
}

function getSourceMapPlugin(testPattern, prefix) {
  return new webpack.SourceMapDevToolPlugin({
    test: testPattern,
    filename: '[file].map',
    append: '\n//# sourceMappingURL=' + prefix + '[url]',
    module: true,
    columns: true,
    lineToLine: false,
  });
}

function getPluginsConfig(env) {
  const languageExpression = new RegExp('^./(' + getAllPossibleLanguages().join('|') + ')$');
  const momentExpression = /moment[/\\]src[/\\]locale$/;
  const reactIntlExpression = /react-intl[/\\]locale-data$/;
  const intlExpression = /intl[/\\]locale-data[/\\]jsonp$/;
  const themeExpression = /sass[/\\]themes$/;
  const selectedTheme = new RegExp(`^./(${process.env.CONFIG || 'default'})/main.scss$`);

  if (env === 'development') {
    return ([
      new webpack.HotModuleReplacementPlugin(),
      new webpack.ContextReplacementPlugin(momentExpression, languageExpression),
      new webpack.ContextReplacementPlugin(reactIntlExpression, languageExpression),
      new webpack.ContextReplacementPlugin(intlExpression, languageExpression),
      new webpack.ContextReplacementPlugin(themeExpression, selectedTheme),
      new webpack.DefinePlugin({ 'process.env': { NODE_ENV: JSON.stringify('development') } }),
      new webpack.LoaderOptionsPlugin({
        debug: true,
        options: {
          postcss: () => [autoprefixer({ browsers: ['last 3 version', '> 1%', 'IE 10'] })],
        },
      }),
      new webpack.NoErrorsPlugin(),
    ]);
  }
  return ([
    new webpack.ContextReplacementPlugin(momentExpression, languageExpression),
    new webpack.ContextReplacementPlugin(reactIntlExpression, languageExpression),
    new webpack.ContextReplacementPlugin(intlExpression, languageExpression),
    new webpack.DefinePlugin({ 'process.env': { NODE_ENV: JSON.stringify('production') } }),
    new webpack.PrefetchPlugin('react'),
    new webpack.PrefetchPlugin('leaflet'),
    new webpack.HashedModuleIdsPlugin(),
    new webpack.LoaderOptionsPlugin({
      debug: false,
      minimize: true,
      options: {
        postcss: () => [autoprefixer({ browsers: ['last 3 version', '> 1%', 'IE 10'] }), csswring],
      },
    }),
    getSourceMapPlugin(/\.(js)($|\?)/i, '/js/'),
    getSourceMapPlugin(/\.(css)($|\?)/i, '/css/'),
    new webpack.optimize.CommonsChunkPlugin({
      names: ['common', 'leaflet', 'manifest'],
    }),
    new StatsPlugin('../stats.json', { chunkModules: true }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false,
      },
      mangle: {
        except: ['$super', '$', 'exports', 'require', 'window'],
      },
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false,
    }),
    new ExtractTextPlugin({
      filename: 'css/[name].[contenthash].css',
      allChunks: true,
    }),
    new webpack.NoErrorsPlugin(),
  ]);
}

function getDirectories(srcDirectory) {
  return fs.readdirSync(srcDirectory).filter(file =>
    fs.statSync(path.join(srcDirectory, file)).isDirectory()
  );
}

function getDevelopmentEntry() {
  const entry = [
    'webpack-dev-server/client?http://localhost:' + port,
    'webpack/hot/dev-server',
    './app/client',
  ];
  return entry;
}

function getEntry() {
  const entry = {
    main: './app/client',
    common: [
      'react',
      'react-dom',
      'react-relay',
      'react-tap-event-plugin',
    ],
    leaflet: ['leaflet'],
  };

  const directories = getDirectories('./sass/themes');
  directories.forEach((theme) => {
    const entryPath = './sass/themes/' + theme + '/main.scss';
    entry[theme + '_theme'] = [entryPath];
  });

  return entry;
}

module.exports = {
  // prod mode sourcemaps are hand defined in plugins.
  devtool: (process.env.NODE_ENV === 'development') ? 'eval' : false,
  cache: true,
  entry: (process.env.NODE_ENV === 'development') ? getDevelopmentEntry() : getEntry(),
  output: {
    path: path.join(__dirname, '_static'),
    filename: (process.env.NODE_ENV === 'development') ?
      'js/bundle.js' : 'js/[name].[chunkhash].js',
    chunkFilename: 'js/[name].[chunkhash].js',
    publicPath: ((process.env.NODE_ENV === 'development') ?
      'http://localhost:' + port : (process.env.APP_PATH || '')) + '/',
  },
  plugins: getPluginsConfig(process.env.NODE_ENV),
  resolve: {
    extensions: ['.js'],
    modules: ['node_modules'],
    alias: {
      'lodash.merge': 'lodash/merge',
    },
    mainFields: ["browser", "module", "jsnext:main", "main"],
  },
  module: {
    rules: getRulesConfig(process.env.NODE_ENV),
  },
  node: {
    net: 'empty',
    tls: 'empty',
  },
  externals: {
    'core-js/library/fn/symbol': 'var Symbol',
    'core-js/library/fn/object/assign': 'var Object.assign',
    'core-js/library/fn/weak-map': 'var WeakMap',
    'core-js/library/es6/map': 'var Map',
    'core-js/library/fn/promise': 'var Promise',
    'core-js/library/fn/array/from': 'var Array.from',
    'core-js/library/fn/object/keys': 'var Object.keys',
    'core-js/library/fn/object/freeze': 'var Object.freeze',
    'core-js/library/fn/object/get-prototype-of': 'var Object.getPrototypeOf',
    'core-js/library/fn/object/set-prototype-of': 'var Object.setPrototypeOf',
    'core-js/library/fn/object/define-property': 'var Object.defineProperty',
    'core-js/library/fn/json/stringify': 'var JSON.stringify',
    'core-js/library/fn/object/create': 'var Object.create',
    'core-js/library/fn/symbol/iterator': 'var Symbol.iterator',
    'fbjs/lib/fetch': 'var fetch',
    './fetch': 'var fetch',
    'object-assign': 'var Object.assign',
  },
};
