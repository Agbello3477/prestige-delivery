import express from 'express';
import { authenticate } from '../middleware/authMiddleware';
import { getMessages, getRecentChats } from '../controllers/chatController';

const router = express.Router();

// Get list of recent conversations
router.get('/recent', authenticate, getRecentChats);

// Get chat history with a specific user
router.get('/:id', authenticate, getMessages);

export default router;
