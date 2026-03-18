"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const logActivity = async (userId, action, details, ipAddress) => {
    try {
        await prisma_1.default.auditLog.create({
            data: {
                userId,
                action,
                details: details ? JSON.stringify(details) : null,
                ipAddress
            }
        });
    }
    catch (error) {
        console.error('Failed to create audit log:', error);
        // We don't throw error here to prevent blocking the main process if logging fails
    }
};
exports.logActivity = logActivity;
