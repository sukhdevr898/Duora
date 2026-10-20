module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo automatically enables the Reanimated 4 worklets plugin.
    presets: ['babel-preset-expo'],
  };
};
