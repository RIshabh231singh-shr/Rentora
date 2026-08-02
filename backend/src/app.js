const http = require("http");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const env = require("./config/env");
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

const allowedOrigins = [
  "https://rentora231.netlify.app",
  "http://localhost:5173",
  "http://localhost:5000",
  env.clientOrigin
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true
}));
app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health Check Endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

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

module.exports = { app, server };
