const { Server } = require("socket.io");
const env = require("./env");
const { registerSocketHandlers } = require("../socket/socketHandler");

function initializeSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: (origin, callback) => callback(null, true),
            credentials: true
        }
    });

    global.io = io;
    registerSocketHandlers(io);
    return io;
}

module.exports = { initializeSocket };
