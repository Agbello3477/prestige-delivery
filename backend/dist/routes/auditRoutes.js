"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auditController_1 = require("../controllers/auditController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.get('/', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)([client_1.Role.ADMIN]), auditController_1.getAuditLogs);
exports.default = router;
