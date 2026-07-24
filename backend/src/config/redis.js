const { createClient } = require("redis");
const env = require("./env");

const redisclient = createClient({
  username: "default",
  password: env.redis.password?.replace(/"/g, ""),
  socket: {
    host: env.redis.host?.replace(/"/g, ""),
    port: parseInt(env.redis.port) || 17812,
    reconnectStrategy: (retries) => {
      if (retries > 10) return new Error("Redis max retries reached");
      return Math.min(retries * 200, 3000);
    },
  },
});

redisclient.on("error", (err) => {
  console.error("[Redis] Connection error:", err.message);
});

redisclient.on("reconnecting", () => {
  console.log("[Redis] Reconnecting...");
});

module.exports = redisclient;