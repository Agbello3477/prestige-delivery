"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentChats = exports.getMessages = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Get chat history between current user and another user
const getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const otherUserId = parseInt(req.params.id);
        if (isNaN(otherUserId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        const messages = await prisma_1.default.message.findMany({
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
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
};
exports.getMessages = getMessages;
// Get list of recent chats for the current user (Admin/Customer/Rider)
const getRecentChats = async (req, res) => {
    try {
        const userId = req.user.id;
        // Find all messages where user is sender or receiver
        // We'll get unique conversation partners
        const messages = await prisma_1.default.message.findMany({
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
    }
    catch (error) {
        console.error('Error fetching recent chats:', error);
        res.status(500).json({ message: 'Failed to fetch recent chats' });
    }
};
exports.getRecentChats = getRecentChats;
