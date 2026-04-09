module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Class fields / private methods come from @react-native/babel-preset (via babel-preset-expo).
      // Do not duplicate those plugins here — running them twice can break RN's DOM Event polyfill
      // ("Cannot assign to read-only property 'NONE'").
      'react-native-reanimated/plugin', // must be last
    ],
  };
};