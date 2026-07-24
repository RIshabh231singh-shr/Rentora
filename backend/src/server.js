const http = require("http");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const env = require("./config/env");
const connectDB = require("./config/db");
const redisClient = require("./config/redis");
const { initializeSocket } = require("./config/socket");

const authRoutes = require("./routes/auth");
const propertyRoutes = require("./routes/properties");
const amenityRoutes = require("./routes/amenities");
const bookingRoutes = require("./routes/bookings");
const maintenanceRoutes = require("./routes/maintenance");
const dashboardRoutes = require("./routes/dashboard");
const messageRoutes = require("./routes/messages");
const userRoutes = require("./routes/users");

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Middleware
app.use(cors({
    origin: env.clientOrigin,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/properties", propertyRoutes);
app.use("/api/amenities", amenityRoutes);
app.use("/amenities", amenityRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/bookings", bookingRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/maintenance", maintenanceRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/api/messages", messageRoutes);
app.use("/messages", messageRoutes);
app.use("/api/users", userRoutes);

const startServer = async () => {
    try {
        await connectDB();
        console.log("MongoDB connected successfully");
    } catch (dbErr) {
        console.error("MongoDB Connection Error:", dbErr.message);
        process.exit(1);
    }

    try {
        await redisClient.connect();
        console.log("Redis connected successfully");
    } catch (redisErr) {
        console.error("Redis Connection Error:", redisErr.message);
        process.exit(1);
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

startServer();
