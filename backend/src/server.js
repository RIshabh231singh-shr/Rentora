const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const main = require("./config/db");
const redisClient = require("./config/redis");
const authRoutes = require("./routes/auth");
const propertyRoutes = require("./routes/properties");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/auth", authRoutes);
app.use("/api/properties", propertyRoutes);

const initializeConnection = async () => {
    try {
        // Connect to MongoDB (mandatory)
        await main();
        console.log("MongoDB connected successfully");
    } catch (dbErr) {
        console.error("MongoDB Connection Error:", dbErr.message);
        process.exit(1); // Exit if database connection fails
    }

    try {
        // Connect to Redis (optional during dev)
        await redisClient.connect();
        console.log("Redis connected successfully");
    } catch (redisErr) {
        console.warn("Redis Connection Warning: Could not connect to Redis. Logout token blacklisting will be disabled.", redisErr.message);
    }

    try {
        app.listen(port, () => {
            console.log("Server is listening at port :", port);
        });
    } catch (err) {
        console.error("Server startup error:", err.message);
    }
};

initializeConnection();
