import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import prisma from './lib/prisma';

export let io: SocketIOServer;

export const initSocket = (httpServer: HttpServer) => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        },
        transports: ['websocket', 'polling']
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Join a room based on user ID (for private messages)
        socket.on('join', (userId: string) => {
            console.log(`[DEBUG] User attempting to join room: ${userId}`);
            socket.join(userId);
            console.log(`[DEBUG] User ${userId} joined room ${userId}`);
        });

        // Handle sending messages
        socket.on('send_message', async (data) => {
            const { senderId, receiverId, content } = data;

            try {
                // Save to database
                const message = await prisma.message.create({
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
                io.to(receiverId.toString()).emit('receive_message', message);

                // Also emit back to sender (optional, if not handled optimistically on client)
                socket.emit('message_sent', message);

                console.log(`Message sent from ${senderId} to ${receiverId}`);
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    return io;
};
