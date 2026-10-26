const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'wasm' to asset extensions so Metro can bundle it for web/Expo SQLite
config.resolver.assetExts.push('wasm');

module.exports = config;