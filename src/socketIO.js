import dotenv from "dotenv";
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import { Server } from "socket.io";
import envConfig from "./config/env.config.js";
import mongoDbConnection from "./config/mongoDB.config.js";
import app from "./server.js";
import { getMyConversations } from "./services/conversation.service.js";
import { UnauthorizedError } from './utils/errorHandler.js';
dotenv.config()

class SocketIO {
    constructor() {
        this.connectedUsers = new Map();
        mongoDbConnection.createConnection()

        this.app = app()
        this.server = createServer(this.app);
        this.server.timeout = 5 * 60 * 1000;
        this.io = new Server(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        this.io.use((socket, next) => {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new UnauthorizedError("Authentication required"));
            try {
                const payload = jwt.verify(token, envConfig.JWT_SECRET);
                socket.user = payload;
                next();
            } catch (err) {
                return next(new UnauthorizedError("Invalid token"));
            }
        });

        this.io.on("connection", (socket) => {
            console.log("🟢 New socket connected:", socket.id);

            socket.on("register", async (userId) => {
                this.register(userId, socket.id);
                getMyConversations(socket.user.user_id).then(e => {
                    e.map(e => {
                        socket.join(e._id.toString())
                        console.log("Socket join rooom>>>", e._id.toString())
                    })
                })
            });

            socket.on("call-user", ({ to, from, conversationId, token }) => {
                const targetSocketIds = this.connectedUsers.get(to) || []; // hoặc Map.get(to)
                targetSocketIds.forEach(id => {
                    this.io.to(id).emit("incoming-call", { from, conversationId, token });
                });
            });

            socket.on("join-room", (roomId) => {
                if (roomId) {
                    socket.join(roomId);
                    console.log(`✅ Socket ${socket.id} joined room ${roomId}`);
                } else {
                    console.warn(`⚠️ Không có roomId để join`);
                }
            });





            socket.on("disconnect", () => {
                this.unregister(socket.id);
                console.log("🔌 Socket disconnected:", socket.id);
            });
        });
    }

    register(userId, socketId) {
        const sockets = this.connectedUsers.get(userId) || [];
        if (!sockets.includes(socketId)) {
            sockets.push(socketId);
            console.log("cjeck data tại registrer", userId, socketId)
            this.connectedUsers.set(userId, sockets);
        }
    }
    unregister(socketId) {
        for (const [userId, socketList] of this.connectedUsers.entries()) {
            const updatedList = socketList.filter(id => id !== socketId);
            if (updatedList.length > 0) {
                this.connectedUsers.set(userId, updatedList);
            } else {
                this.connectedUsers.delete(userId);
            }
        }
    }

    joinUserToRoom(userId, room) {
        const socketIds = this.getSocketIds(userId);
        socketIds.forEach(socketId => {
            const socket = this.getSocketById(socketId);
            if (socket) {
                socket.join(room);
                console.log(`✅ Socket ${socket.id} (user ${userId}) joined room ${room}`);
            }
        });
    }
    getSocketIds(userId) {
        return this.connectedUsers.get(userId) || [];
    }
    emitToUser(userId, event, data) {
        const socketIds = this.getSocketIds(userId);
        socketIds.forEach(socketId => {
            this.io.to(socketId).emit(event, data);
        });
    }
    emitToAll(event, data) {
        this.io.emit(event, data);
    }
    emitToRoom(room, event, data) {
        this.io.to(room).emit(event, data);
    }
    joinRoom(socketId, room) {
        this.io.to(socketId).join(room);
    }
    leaveRoom(socketId, room) {
        this.io.to(socketId).leave(room);
    }
    getAllSockets() {
        return Array.from(this.connectedUsers.values()).flat();
    }
    getAllUsers() {
        return Array.from(this.connectedUsers.keys());
    }
    getAllRooms() {
        return Array.from(this.io.sockets.adapter.rooms.keys());
    }
    getAllSocketIds() {
        return Array.from(this.io.sockets.sockets.keys());
    }
    getSocketCount() {
        return this.io.engine.clientsCount;
    }
    getSocketById(socketId) {
        return this.io.sockets.sockets.get(socketId);
    }
    getSocketByUserId(userId) {
        const socketIds = this.getSocketIds(userId);
        return socketIds.map(socketId => this.io.sockets.sockets.get(socketId));
    }
    getSocketByRoom(room) {
        return this.io.sockets.adapter.rooms.get(room);
    }
    getSocketByNamespace(namespace) {
        return this.io.of(namespace).sockets;
    }
    getSocketByNamespaceAndRoom(namespace, room) {
        return this.io.of(namespace).adapter.rooms.get(room);
    }
    getSocketByNamespaceAndUserId(namespace, userId) {
        const socketIds = this.getSocketIds(userId);
        return socketIds.map(socketId => this.io.of(namespace).sockets.get(socketId));
    }
    getSocketByNamespaceAndSocketId(namespace, socketId) {
        return this.io.of(namespace).sockets.get(socketId);
    }
    getSocketByNamespaceAndRoomAndUserId(namespace, room, userId) {
        const socketIds = this.getSocketIds(userId);
        return socketIds.map(socketId => this.io.of(namespace).adapter.rooms.get(room));
    }
    getSocketByNamespaceAndRoomAndSocketId(namespace, room, socketId) {
        return this.io.of(namespace).adapter.rooms.get(room).sockets.get(socketId);
    }
    getSocketByNamespaceAndUserIdAndRoom(namespace, userId, room) {
        const socketIds = this.getSocketIds(userId);
        return socketIds.map(socketId => this.io.of(namespace).adapter.rooms.get(room));
    }
    getSocketByNamespaceAndUserIdAndSocketId(namespace, userId, socketId) {
        const socketIds = this.getSocketIds(userId);
        return socketIds.map(socketId => this.io.of(namespace).sockets.get(socketId));
    }
    getSocketByNamespaceAndRoomAndUserIdAndSocketId(namespace, room, userId, socketId) {
        const socketIds = this.getSocketIds(userId);
        return socketIds.map(socketId => this.io.of(namespace).adapter.rooms.get(room).sockets.get(socketId));
    }
    getSocketByNamespaceAndRoomAndUserIdAndSocketIdAndEvent(namespace, room, userId, socketId, event) {
        const socketIds = this.getSocketIds(userId);
        return socketIds.map(socketId => this.io.of(namespace).adapter.rooms.get(room).sockets.get(socketId).emit(event));
    }
}

const appSocket = new SocketIO();
export default appSocket;
