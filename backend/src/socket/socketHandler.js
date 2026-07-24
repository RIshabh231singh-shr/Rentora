const Message = require("../models/message");

function registerSocketHandlers(io) {
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
            } catch (err) {
                console.error("mark_read error:", err);
            }
        });

        socket.on("disconnect", () => {
            console.log("WebSocket client disconnected:", socket.id);
        });
    });
}

module.exports = { registerSocketHandlers };
