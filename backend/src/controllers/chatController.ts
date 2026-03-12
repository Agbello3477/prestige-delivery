import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// Get chat history between current user and another user
export const getMessages = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const otherUserId = parseInt(req.params.id as string);

        if (isNaN(otherUserId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId }
                ]
            },
            orderBy: {
                timestamp: 'asc'
            },
            include: {
                sender: { select: { id: true, name: true, role: true } },
                receiver: { select: { id: true, name: true, role: true } }
            }
        });

        res.json(messages);
    } catch (error: any) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
};

// Get list of recent chats for the current user (Admin/Customer/Rider)
export const getRecentChats = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        // Find all messages where user is sender or receiver
        // We'll get unique conversation partners
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            orderBy: {
                timestamp: 'desc'
            },
            include: {
                sender: { select: { id: true, name: true, role: true } },
                receiver: { select: { id: true, name: true, role: true } }
            }
        });

        // Group by conversation partner to get the latest message per partner
        const recentChatsMap = new Map();

        messages.forEach(msg => {
            const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
            const partner = msg.senderId === userId ? msg.receiver : msg.sender;

            if (!recentChatsMap.has(partnerId)) {
                recentChatsMap.set(partnerId, {
                    partner,
                    lastMessage: msg,
                });
            }
        });

        const recentChatsList = Array.from(recentChatsMap.values());
        res.json(recentChatsList);

    } catch (error: any) {
        console.error('Error fetching recent chats:', error);
        res.status(500).json({ message: 'Failed to fetch recent chats' });
    }
};
