require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const main = require("./config/db");
const redisClient = require("./config/redis");
const authRoutes = require("./routes/auth");
const propertyRoutes = require("./routes/properties");
const amenityRoutes = require("./routes/amenities");
const bookingRoutes = require("./routes/bookings");
const maintenanceRoutes = require("./routes/maintenance");
const dashboardRoutes = require("./routes/dashboard");
const messageRoutes = require("./routes/messages");
const userRoutes = require("./routes/users");
const Message = require("./models/message");

const app = express();
const port = process.env.PORT || 5000;

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true
    }
});

global.io = io;

io.on("connection", (socket) => {
    console.log("WebSocket client connected:", socket.id);

    socket.on("register", (userId) => {
        socket.join(userId);
        console.log(`Socket ${socket.id} registered to user room ${userId}`);
    });

    socket.on("send_message", async (data) => {
        try {
            const { sender, receiver, text, image } = data;
            const newMsg = await Message.create({ sender, receiver, text, image, read: false });
            
            // Emit to receiver
            io.to(receiver).emit("new_message", newMsg);
            // Emit back to sender (for acknowledgment)
            io.to(sender).emit("message_sent", newMsg);
        } catch (err) {
            console.error("send_message error:", err);
        }
    });

    socket.on("mark_read", async (data) => {
        try {
            const { sender, receiver } = data;
            await Message.updateMany(
                { sender, receiver, read: false },
                { $set: { read: true } }
            );
            io.to(sender).emit("messages_read", { reader: receiver });
        } catch (err) {}
    });

    socket.on("disconnect", () => {
        console.log("WebSocket client disconnected:", socket.id);
    });
});

// Middleware
app.use(cors({
    origin: "http://localhost:5173",
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
        // Connect to Redis (mandatory)
        await redisClient.connect();
        console.log("Redis connected successfully");
    } catch (redisErr) {
        console.error("Redis Connection Error: Could not connect to Redis.", redisErr.message);
        process.exit(1); // Exit if Redis connection fails
    }

    try {
        server.listen(port, () => {
            console.log("Server is listening at port :", port);
        });
    } catch (err) {
        console.error("Server startup error:", err.message);
        process.exit(1);
    }
};

initializeConnection();

// Loaded new env variables for email
