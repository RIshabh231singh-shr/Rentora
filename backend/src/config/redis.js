const { createClient } = require("redis");
const env = require("./env");

const redisclient = createClient({
  username: "default",
  password: env.redis.password?.replace(/"/g, ""),
  pingInterval: 10000, // Send PING every 10 seconds to prevent cloud idle socket closure
  socket: {
    host: env.redis.host?.replace(/"/g, ""),
    port: parseInt(env.redis.port) || 17812,
    keepAlive: 5000, // Enable TCP keepalive every 5 seconds
    reconnectStrategy: (retries) => {
      if (retries > 25) return new Error("Redis max retries reached");
      return Math.min(retries * 100, 3000);
    },
  },
});

redisclient.on("error", (err) => {
  // Suppress transient socket close noise in log
  if (err.message && (err.message.includes("Socket closed") || err.message.includes("ECONNRESET"))) {
    return;
  }
  console.error("[Redis] Connection error:", err.message);
});

redisclient.on("reconnecting", () => {
  console.log("[Redis] Reconnecting...");
});

module.exports = redisclient;