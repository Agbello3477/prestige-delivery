import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Role } from '@prisma/client';

export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const logs = await prisma.auditLog.findMany({
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

        res.json(logs);
    } catch (error: any) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: 'Failed to fetch activity logs', error: error.message });
    }
};
