import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Role, DeliveryStatus } from '@prisma/client';

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // Only Admins can see global stats
        if ((req as any).user.role !== Role.ADMIN) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

        // 1. Total Deliveries
        const totalDeliveries = await prisma.delivery.count();

        // 2. Active Riders (Online)
        const activeRiders = await prisma.user.count({
            where: {
                role: Role.RIDER,
                isOnline: true
            }
        });

        // 3. New Customers (Last 30 days)
        const newCustomers = await prisma.user.count({
            where: {
                role: Role.CUSTOMER,
                createdAt: {
                    gte: thirtyDaysAgo
                }
            }
        });

        // 4. Total Revenue (Sum of delivered delivery prices)
        const revenueAggregate = await prisma.delivery.aggregate({
            _sum: {
                price: true
            },
            where: {
                status: DeliveryStatus.DELIVERED
            }
        });

        const totalRevenue = Number(revenueAggregate._sum.price || 0);

        // Calculate trends (Simple mock trends for now based on current counts)
        // In a real production system, you'd compare current month vs last month
        res.json({
            stats: [
                { title: 'Total Deliveries', value: totalDeliveries.toLocaleString(), trend: '+0%', color: 'bg-blue-500' },
                { title: 'Active Riders', value: activeRiders.toLocaleString(), trend: '+0%', color: 'bg-green-500' },
                { title: 'New Customers', value: newCustomers.toLocaleString(), trend: '+0%', color: 'bg-indigo-500' },
                { title: 'Revenue', value: `₦ ${totalRevenue.toLocaleString()}`, trend: '+0%', color: 'bg-purple-500' },
            ]
        });
    } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
    }
};
