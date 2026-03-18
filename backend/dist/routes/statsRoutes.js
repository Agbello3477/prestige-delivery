"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const statsController_1 = require("../controllers/statsController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.get('/dashboard', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([client_1.Role.ADMIN]), statsController_1.getDashboardStats);
exports.default = router;
