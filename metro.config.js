const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Enable SVG support
const { transformer, resolver } = config;
config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
};
config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...resolver.sourceExts, "svg"],
  extraNodeModules: {
    ...(resolver.extraNodeModules || {}),
    stream: path.resolve(__dirname, "shims/stream.js"),
    crypto: path.resolve(__dirname, "shims/crypto.js"),
    ws: path.resolve(__dirname, "shims/ws/index.js"),
    "ws/websocket": path.resolve(__dirname, "shims/ws/websocket.js"),
    "ws/stream": path.resolve(__dirname, "shims/ws/stream.js"),
    "ws/websocket-server": path.resolve(__dirname, "shims/ws/websocket-server.js"),
  },
};

module.exports = config;
