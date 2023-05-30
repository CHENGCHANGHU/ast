const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const package = require('./package.json');
const externalDependencies = [
  ...Object.keys(package.dependencies || {}),
  ...Object.keys(package.peerDependencies || {}),
];

// console.log(process.argv);
console.log('mode:', process.env.mode);
console.log('minimize:', process.env.minimize);

function getWebpackConfig (commandParams) {
  console.log(commandParams);
  // console.log(process.env.mode, typeof process.env.mode, process.env.mode === 'production');
  // console.log(JSON.stringify(process.env.mode), JSON.stringify(process.env.mode) === 'production');
  return {
    mode: process.env.mode,
    devtool: process.env.mode === 'development' ? 'source-map': undefined,
    optimization: {
      minimize: JSON.parse(process.env.minimize),
    },
    entry: {
      index: path.join(__dirname, 'src', 'index.ts'),
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'index.js',
      globalObject: 'typeof self === \'undefined\' ? this : self',
      library: {
        name: 'Template',
        type: 'umd',
      },
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: path.join(__dirname, '..', 'node_modules')
        },
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          exclude: [/node_modules/],
        },
      ],
    },
    plugins: [
      new CleanWebpackPlugin(),
    ],
    externals: [
      ({ request }, callback) => {
        if (externalDependencies.some(dep => dep === request || request.startsWith(`${dep}/`))) {
          return callback(null, {
            commonjs2: request,
            commonjs: request,
            module: request,
          });
        }
        callback();
      },
    ],
  };
}

module.exports = getWebpackConfig;
