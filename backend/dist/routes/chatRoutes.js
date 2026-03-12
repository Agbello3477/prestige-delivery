"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const chatController_1 = require("../controllers/chatController");
const router = express_1.default.Router();
// Get list of recent conversations
router.get('/recent', authMiddleware_1.authenticate, chatController_1.getRecentChats);
// Get chat history with a specific user
router.get('/:id', authMiddleware_1.authenticate, chatController_1.getMessages);
exports.default = router;
