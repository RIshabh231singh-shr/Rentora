const Message = require("../models/message");

function registerSocketHandlers(io) {
    io.on("connection", (socket) => {
        console.log("WebSocket client connected:", socket.id);

        socket.on("register", (userId) => {
            if (userId) {
                const roomName = userId.toString();
                socket.join(roomName);
                console.log(`Socket ${socket.id} registered to user room ${roomName}`);
            }
        });

        socket.on("send_message", async (data) => {
            try {
                const { sender, receiver, text, image } = data;
                if (!sender || !receiver || (!text && !image)) return;

                const newMsg = await Message.create({ sender, receiver, text, image, read: false });
                const senderRoom = sender.toString();
                const receiverRoom = receiver.toString();

                // Emit to receiver's room
                io.to(receiverRoom).emit("new_message", newMsg);
                // Emit back to sender's room (acknowledgment)
                io.to(senderRoom).emit("message_sent", newMsg);
            } catch (err) {
                console.error("send_message error:", err);
            }
        });

        socket.on("mark_read", async (data) => {
            try {
                const { sender, receiver } = data;
                if (!sender || !receiver) return;
                await Message.updateMany(
                    { sender, receiver, read: false },
                    { $set: { read: true } }
                );
                io.to(sender.toString()).emit("messages_read", { reader: receiver });
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
