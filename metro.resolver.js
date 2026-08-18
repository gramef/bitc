const path = require("path");

module.exports = function resolveRequest(context, realModuleName, platform) {
  const map = {
    "ws": path.resolve(__dirname, "shims/ws/index.js"),
    "ws/lib/websocket": path.resolve(__dirname, "shims/ws/lib/websocket.js"),
    "ws/lib/websocket.js": path.resolve(__dirname, "shims/ws/lib/websocket.js"),
    "ws/lib/websocket-server": path.resolve(__dirname, "shims/ws/lib/websocket-server.js"),
    "ws/lib/websocket-server.js": path.resolve(__dirname, "shims/ws/lib/websocket-server.js"),
    "ws/lib/stream": path.resolve(__dirname, "shims/ws/lib/stream.js"),
    "ws/lib/stream.js": path.resolve(__dirname, "shims/ws/lib/stream.js"),
  };
  if (map[realModuleName]) {
    return { type: "sourceFile", filePath: map[realModuleName] };
  }
  return context.resolveRequest(context, realModuleName, platform);
};
