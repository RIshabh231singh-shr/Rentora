const { createClient } = require("redis");

const redisclient = createClient({
  username: "default",
  password: process.env.REDIS_PASS?.replace(/"/g, ""),
  socket: {
    host: process.env.REDIS_HOST?.replace(/"/g, ""),
    port: parseInt(process.env.REDIS_PORT) || 17812,
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