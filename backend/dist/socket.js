"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = exports.io = void 0;
const socket_io_1 = require("socket.io");
const prisma_1 = __importDefault(require("./lib/prisma"));
const initSocket = (httpServer) => {
    exports.io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        },
        transports: ['websocket', 'polling']
    });
    exports.io.on('connection', (socket) => {
        console.log('User connected:', socket.id);
        // Join a room based on user ID (for private messages)
        socket.on('join', (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined room ${userId}`);
        });
        // Handle sending messages
        socket.on('send_message', async (data) => {
            const { senderId, receiverId, content } = data;
            try {
                // Save to database
                const message = await prisma_1.default.message.create({
                    data: {
                        senderId: parseInt(senderId),
                        receiverId: parseInt(receiverId),
                        content
                    },
                    include: {
                        sender: { select: { id: true, name: true, role: true } },
                        receiver: { select: { id: true, name: true, role: true } }
                    }
                });
                // Emit to receiver's room
                exports.io.to(receiverId.toString()).emit('receive_message', message);
                // Also emit back to sender (optional, if not handled optimistically on client)
                socket.emit('message_sent', message);
                console.log(`Message sent from ${senderId} to ${receiverId}`);
            }
            catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
    return exports.io;
};
exports.initSocket = initSocket;
