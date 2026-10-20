// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// react-native-webrtc ships native + JS; ensure its package is transformed.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
