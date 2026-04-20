const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const documentPickerPath = path.resolve(__dirname, '..', 'node_modules', 'expo-document-picker');

config.watchFolders = [documentPickerPath];
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'expo-document-picker': documentPickerPath,
};

module.exports = config;
