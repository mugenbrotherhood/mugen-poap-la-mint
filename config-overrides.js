const webpack = require('webpack');

module.exports = function override(config) {
  // Add fallbacks for Node.js modules - disable server-only modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    // Essential browser polyfills
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"), 
    "buffer": require.resolve("buffer"),
    "util": require.resolve("util"),
    "url": require.resolve("url"),
    "path": require.resolve("path-browserify"),
    "querystring": require.resolve("querystring-es3"),
    "assert": require.resolve("assert"),
    
    // Disable server-only modules
    "zlib": false,
    "https": false,
    "http": false,
    "os": false,
    "fs": false,
    "net": false,
    "tls": false,
    "child_process": false,
    "dns": false,
    "constants": false,
    "vm": false,
    "module": false,
    "cluster": false,
    "readline": false,
  };

  // Add plugins for polyfills
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
  ];

  // Ignore warnings about missing modules
  config.ignoreWarnings = [
    {
      module: /node_modules/,
      message: /Critical dependency/,
    },
    {
      module: /node_modules/,
      message: /Can't resolve/,
    },
  ];

  return config;
};