import prisma from '../lib/prisma';

export const logActivity = async (
    userId: number | null,
    action: string,
    details?: any,
    ipAddress?: string
) => {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                details: details ? JSON.stringify(details) : null,
                ipAddress
            }
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // We don't throw error here to prevent blocking the main process if logging fails
    }
};
