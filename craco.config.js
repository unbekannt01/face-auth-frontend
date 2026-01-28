module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
        util: false, 
      };
      return webpackConfig;
    },
  },
};
