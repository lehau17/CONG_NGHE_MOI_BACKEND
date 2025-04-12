import http from "http";
import { Server } from "socket.io";
const server = http.createServer(app);

export const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

export const connectedUsers = new Map();

io.on("connection", (socket) => {
    console.log("🟢 New socket connected:", socket.id);

    socket.on("register", (userId) => {
        const sockets = connectedUsers.get(userId) || [];
        if (!sockets.includes(socket.id)) {
            sockets.push(socket.id);
            connectedUsers.set(userId, sockets);
        }
        console.log(`✅ User ${userId} registered on socket ${socket.id}`);
    });

    socket.on("disconnect", () => {
        for (const [userId, socketList] of connectedUsers.entries()) {
            const updatedList = socketList.filter(id => id !== socket.id);
            if (updatedList.length > 0) {
                connectedUsers.set(userId, updatedList);
            } else {
                connectedUsers.delete(userId);
            }
        }
        console.log("🔌 Socket disconnected:", socket.id);
    });
});

