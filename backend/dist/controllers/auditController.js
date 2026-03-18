"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const getAuditLogs = async (req, res) => {
    try {
        const logs = await prisma_1.default.auditLog.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            },
            orderBy: {
                timestamp: 'desc'
            },
            take: 100 // Limit to last 100 logs
        });
        // Format logs to be more human-readable
        const formattedLogs = logs.map(log => {
            let readableDetails = log.details;
            try {
                const detailsObj = JSON.parse(log.details || '{}');
                if (detailsObj.details) {
                    readableDetails = detailsObj.details; // Use the descriptive text if present
                }
                else if (log.action === 'USER_REGISTERED') {
                    readableDetails = `New ${detailsObj.role || 'user'} registered: ${detailsObj.name || detailsObj.email}`;
                }
            }
            catch (e) {
                // Keep raw details if parsing fails
            }
            return {
                ...log,
                displayDetails: readableDetails
            };
        });
        res.json(formattedLogs);
    }
    catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: 'Failed to fetch activity logs', error: error.message });
    }
};
exports.getAuditLogs = getAuditLogs;
