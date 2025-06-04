const webpack = require('webpack');

module.exports = function override(config) {
  // Add fallbacks for Node.js modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer"),
    "os": require.resolve("os-browserify/browser"),
    "path": require.resolve("path-browserify"),
    "fs": false,
    "net": false,
    "tls": false,
    "child_process": false,
  };

  // Add plugins for polyfills
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
  ];

  return config;
}; 