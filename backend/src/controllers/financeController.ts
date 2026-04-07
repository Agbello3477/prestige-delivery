import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Role, DeliveryStatus, VendorOrderStatus } from '@prisma/client';
import { startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay, subDays } from 'date-fns';

export const getFinanceStats = async (req: Request, res: Response) => {
    try {
        // 1. Authorization Check
        if ((req as any).user.role !== Role.ADMIN) {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        const { timeframe, partnerId, riderId } = req.query;

        // 2. Date Range Logic
        const now = new Date();
        let startDate = startOfMonth(now);
        let endDate = endOfDay(now);

        if (timeframe === 'day') {
            startDate = startOfDay(now);
        } else if (timeframe === 'week') {
            startDate = startOfWeek(now);
        } else if (timeframe === 'year') {
            startDate = startOfYear(now);
        }

        const dateFilter = {
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        };

        // 3. Aggregate Deliveries (Direct & Vendor)
        const deliveryWhere: any = {
            ...dateFilter,
            status: DeliveryStatus.DELIVERED
        };
        if (riderId) deliveryWhere.riderId = parseInt(riderId as string);

        const deliveries = await prisma.delivery.findMany({
            where: deliveryWhere,
            select: {
                price: true,
                createdAt: true,
                riderId: true
            }
        });

        // 4. Aggregate Vendor Orders (Item Totals)
        const orderWhere: any = {
            ...dateFilter,
            status: VendorOrderStatus.COMPLETED
        };
        if (partnerId) orderWhere.partnerId = parseInt(partnerId as string);

        const orders = await prisma.vendorOrder.findMany({
            where: orderWhere,
            select: {
                totalAmount: true,
                deliveryFee: true,
                createdAt: true,
                partner: {
                    select: {
                        agreedPercentage: true
                    }
                }
            }
        });

        // 5. Calculate Metrics
        // Defaults: Platform takes 20% of delivery fee, 15% of vendor items
        let totalRevenue = 0;
        let totalProfit = 0;
        let riderPayouts = 0;
        let partnerPayouts = 0;

        deliveries.forEach(d => {
            const price = Number(d.price || 0);
            totalRevenue += price;
            riderPayouts += price * 0.8;
            totalProfit += price * 0.2;
        });

        orders.forEach(o => {
            const itemsAmount = Number(o.totalAmount || 0);
            const deliveryFee = Number(o.deliveryFee || 0);
            const commissionRate = (o.partner?.agreedPercentage || 15) / 100;

            totalRevenue += itemsAmount + deliveryFee;
            partnerPayouts += itemsAmount * (1 - commissionRate);
            riderPayouts += deliveryFee * 0.8;
            totalProfit += (itemsAmount * commissionRate) + (deliveryFee * 0.2);
        });

        // 6. Generate Chart Data (Grouped by date)
        const chartDataMap: { [key: string]: { date: string; revenue: number; profit: number } } = {};
        
        // Helper to format date based on timeframe
        const formatDate = (date: Date) => {
            if (timeframe === 'year') return date.toLocaleString('default', { month: 'short' });
            return date.toISOString().split('T')[0];
        };

        [...deliveries, ...orders].forEach(item => {
            const dateKey = formatDate(item.createdAt);
            if (!chartDataMap[dateKey]) {
                chartDataMap[dateKey] = { date: dateKey, revenue: 0, profit: 0 };
            }
            
            if ('price' in item) {
                const price = Number((item as any).price || 0);
                chartDataMap[dateKey].revenue += price;
                chartDataMap[dateKey].profit += price * 0.2;
            } else {
                const itemsAmount = Number((item as any).totalAmount || 0);
                const deliveryFee = Number((item as any).deliveryFee || 0);
                const partner = (item as any).partner;
                const commissionRate = (partner?.agreedPercentage || 15) / 100;
                
                chartDataMap[dateKey].revenue += itemsAmount + deliveryFee;
                chartDataMap[dateKey].profit += (itemsAmount * commissionRate) + (deliveryFee * 0.2);
            }
        });

        const chartData = Object.values(chartDataMap).sort((a, b) => a.date.localeCompare(b.date));

        res.json({
            summary: {
                totalRevenue,
                totalProfit,
                riderPayouts,
                partnerPayouts,
                orderCount: orders.length + deliveries.length
            },
            chartData,
            filters: {
                timeframe,
                startDate,
                endDate
            }
        });

    } catch (error: any) {
        console.error('[ERROR] getFinanceStats:', error);
        res.status(500).json({ message: 'Failed to fetch financial statistics', error: error.message });
    }
};
