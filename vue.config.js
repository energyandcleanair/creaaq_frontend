const path = require('path')
const webpack = require('webpack')
const dotenvExpand = require('dotenv-expand')
const dotenvFlow = require('dotenv-flow')

let env = process.env

if (process.env.NODE_ENV === 'development') {
  env = dotenvExpand(dotenvFlow.config({path: './', silent: true})).parsed
}

const envVars = Object
  .keys(env)
  .reduce((m, key) => {
    if (/^VUE_APP_/.test(key) || env[`VUE_APP_${key}`]) return m
    m[`VUE_APP_${key}`] = JSON.stringify(env[key])
    process.env[`VUE_APP_${key}`] = env[key]
    return m
  }, {})

process.env.PORT = Number(process.env.VUE_APP_PORT) ||
  Number(process.env.PORT) ||
  8080;

module.exports = {

  // The base URL your application bundle will be deployed
  publicPath: process.env.VUE_APP_BASE_URL || '/',

  outputDir: 'dist',
  assetsDir: '',

  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    plugins: [
      new webpack.DefinePlugin({'process.env': envVars})
    ]
  },
  chainWebpack: config => {
    config
      .plugin('html')
      .tap(args => {
        args[0].title = process.env.VUE_APP_APP_PUBLIC_NAME
        return args
      })
  },

  devServer: {
    port: process.env.VUE_APP_PORT,
    clientLogLevel: 'info',
    disableHostCheck: true
  },

  /**
   * By default babel-loader ignores all files inside node_modules. If you want
   * to explicitly transpile a dependency with Babel, you can list it in this option.
   */
  transpileDependencies: [
    'vuetify'
  ],
  productionSourceMap: false
}
