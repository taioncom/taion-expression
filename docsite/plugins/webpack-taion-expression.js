const path = require('path');

module.exports = function () {
  return {
    name: 'webpack-taion-expression',
    configureWebpack() {
      return {
        resolve: {
          alias: {
            'taion-expression': path.resolve(__dirname, '../../'),
          },
          symlinks: false,
        },
      };
    },
  };
};
