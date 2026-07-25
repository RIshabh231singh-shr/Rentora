const env = require("./config/env");
const connectDB = require("./config/db");
const redisClient = require("./config/redis");
const { app, server } = require("./app");

const startServer = async () => {
    try {
        await connectDB();
        console.log("MongoDB connected successfully");
    } catch (dbErr) {
        console.error("MongoDB Connection Error:", dbErr.message);
        process.exit(1);
    }

    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
        console.log("Redis connected successfully");
    } catch (redisErr) {
        console.error("Redis Connection Error:", redisErr.message);
        // Non-blocking fallback for development/test if redis fails
    }

    try {
        server.listen(env.port, () => {
            console.log("Server is listening at port:", env.port);
        });
    } catch (err) {
        console.error("Server startup error:", err.message);
        process.exit(1);
    }
};

if (require.main === module) {
    startServer();
}

module.exports = { app, server, startServer };

