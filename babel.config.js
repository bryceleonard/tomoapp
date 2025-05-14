module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        safe: true,
        allowUndefined: false,
        envName: 'APP_ENV',
        blacklist: null,
        whitelist: ['EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY']
      }],
    ],
  };
};
