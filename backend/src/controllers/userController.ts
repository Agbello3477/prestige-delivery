
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Role } from '@prisma/client';
import { sendSMS } from '../utils/sms';
import { logActivity } from '../services/auditService';

export const updateLocation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { lat, lng } = req.body;

        if (!lat || !lng) {
            return res.status(400).json({ message: 'Latitude and Longitude are required' });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                lastLat: parseFloat(lat),
                lastLng: parseFloat(lng),
                isOnline: true // Implicitly set online when updating location
            }
        });

        res.json({ message: 'Location updated', location: { lat: user.lastLat, lng: user.lastLng } });
    } catch (error: any) {
        console.error('Update location error:', error);
        res.status(500).json({ message: 'Failed to update location' });
    }
};

export const getOnlineRiders = async (req: Request, res: Response) => {
    try {
        // Fetch riders who are online and have a valid location
        // Optionally filter by proximity if lat/lng are provided in query
        const riders = await prisma.user.findMany({
            where: {
                role: Role.RIDER,
                isOnline: true,
                lastLat: { not: null },
                lastLng: { not: null }
            },
            select: {
                id: true,
                name: true,
                phone: true,
                lastLat: true,
                lastLng: true,
                vehicles: {
                    select: { type: true, plateNumber: true }
                }
            }
        });

        res.json(riders);
    } catch (error: any) {
        console.error('Get online riders error:', error);
        res.status(500).json({ message: 'Failed to fetch riders' });
    }
};

export const getAllRiders = async (req: Request, res: Response) => {
    try {
        if ((req as any).user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const riders = await prisma.user.findMany({
            where: { role: Role.RIDER },
            orderBy: { id: 'desc' },
            include: { 
                vehicles: true,
                approvedBy: {
                    select: { name: true }
                },
                declinedBy: {
                    select: { name: true }
                },
                guarantor: true
            }
        });

        res.json(riders);
    } catch (error: any) {
        console.error('Error fetching all riders', error);
        res.status(500).json({ message: 'Failed to fetch riders' });
    }
};

export const getAllCustomers = async (req: Request, res: Response) => {
    try {
        if ((req as any).user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const customers = await prisma.user.findMany({
            where: { role: Role.CUSTOMER },
            orderBy: { id: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                createdAt: true,
                isSuspended: true,
                isBlocked: true,
                suspensionEndDate: true,
                _count: {
                    select: { deliveriesAsCustomer: true }
                }
            }
        });

        res.json(customers);
    } catch (error: any) {
        console.error('Error fetching all customers', error);
        res.status(500).json({ message: 'Failed to fetch customers' });
    }
};

export const approveRider = async (req: Request, res: Response) => {
    try {
        if ((req as any).user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const adminId = (req as any).user.id;
        const riderId = parseInt(req.params.id as string);
        const updatedUser = await prisma.user.update({
            where: { id: riderId },
            data: { 
                isVerified: true, 
                isRejected: false, 
                rejectionReason: null,
                approvedById: adminId,
                approvedAt: new Date()
            }
        });

        // Notify Rider via Socket
        io.to(riderId.toString()).emit('system_notification', {
            title: 'Account Approved',
            message: 'Your rider account has been successfully verified.',
            type: 'INFO'
        });

        // Dispatch SMS Notification
        if (updatedUser.phone) {
            await sendSMS(updatedUser.phone, 'PRESTIGE: Your rider account has been approved. You can now go online and accept deliveries.');
        }

        // Descriptive Audit Log
        await logActivity(adminId, 'RIDER_APPROVED', {
            riderId: updatedUser.id,
            riderName: updatedUser.name,
            details: `Admin approved rider application for ${updatedUser.name}.`
        }, req.ip);

        res.json(updatedUser);
    } catch (error: any) {
        console.error('Error approving rider', error);
        res.status(500).json({ message: 'Failed to approve rider' });
    }
};

import { io } from '../socket';

export const assignBike = async (req: Request, res: Response) => {
    try {
        if ((req as any).user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const riderId = parseInt(req.params.id as string);
        const { plateNumber, model, chassisNumber } = req.body;

        if (!plateNumber || !model) {
            return res.status(400).json({ message: 'Plate Number and Model are required' });
        }

        const vehicle = await prisma.vehicle.create({
            data: {
                type: 'BIKE',
                plateNumber,
                model,
                chassisNumber,
                riderId
            }
        });

        // Notify Rider via Socket
        io.to(riderId.toString()).emit('system_notification', {
            title: 'Bike Assigned',
            message: `A bike (${model} - ${plateNumber}) has been assigned to your account. You can now start accepting deliveries.`,
            type: 'INFO'
        });

        res.json(vehicle);
    } catch (error: any) {
        console.error('Error assigning bike', error);
        res.status(500).json({ message: 'Failed to assign bike' });
    }
};

export const notifyNoBike = async (req: Request, res: Response) => {
    try {
        if ((req as any).user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const riderId = parseInt(req.params.id as string);

        // Notify Rider via Socket
        io.to(riderId.toString()).emit('system_notification', {
            title: 'No Bikes Available',
            message: 'No available bikes at the moment, one would be assign to you when its available.',
            type: 'WARNING'
        });

        res.json({ message: 'Notification sent successfully' });
    } catch (error: any) {
        console.error('Error notifying rider', error);
        res.status(500).json({ message: 'Failed to notify rider' });
    }
};

export const suspendUser = async (req: Request, res: Response) => {
    try {
        if ((req as any).user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const targetUserId = parseInt(req.params.id as string);
        const { duration, unit } = req.body; // duration: number, unit: 'days' | 'weeks' | 'months'

        if (!duration || !unit) {
            return res.status(400).json({ message: 'Duration and unit are required' });
        }

        const endDate = new Date();
        if (unit === 'days') endDate.setDate(endDate.getDate() + duration);
        else if (unit === 'weeks') endDate.setDate(endDate.getDate() + (duration * 7));
        else if (unit === 'months') endDate.setMonth(endDate.getMonth() + duration);

        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: {
                isSuspended: true,
                suspensionEndDate: endDate,
                isOnline: false // Force offline
            }
        });

        io.to(targetUserId.toString()).emit('system_notification', {
            title: 'Account Suspended',
            message: `You are suspended for at the moment please check back in ${duration} ${unit} or contact admin for more Information.`,
            type: 'WARNING'
        });

        res.json(updatedUser);
    } catch (error: any) {
        console.error('Error suspending rider', error);
        res.status(500).json({ message: 'Failed to suspend rider' });
    }
};

export const blockUser = async (req: Request, res: Response) => {
    try {
        if ((req as any).user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const targetUserId = parseInt(req.params.id as string);

        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: {
                isBlocked: true,
                isOnline: false // Force offline
            }
        });

        io.to(targetUserId.toString()).emit('system_notification', {
            title: 'Account Blocked',
            message: `You are currently blocked and will not receive any requests. Please contact admin for more information.`,
            type: 'ERROR'
        });

        res.json(updatedUser);
    } catch (error: any) {
        console.error('Error blocking rider', error);
        res.status(500).json({ message: 'Failed to block rider' });
    }
};

export const liftSuspension = async (req: Request, res: Response) => {
    try {
        if ((req as any).user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const targetUserId = parseInt(req.params.id as string);

        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: {
                isSuspended: false,
                suspensionEndDate: null,
                isBlocked: false
            }
        });

        io.to(targetUserId.toString()).emit('system_notification', {
            title: 'Suspension Lifted',
            message: 'Your account status has been restored. You can now go online.',
            type: 'INFO'
        });

        res.json(updatedUser);
    } catch (error: any) {
        console.error('Error lifting suspension', error);
        res.status(500).json({ message: 'Failed to lift suspension' });
    }
};

export const declineRider = async (req: Request, res: Response) => {
    try {
        if ((req as any).user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const adminId = (req as any).user.id;
        const riderId = parseInt(req.params.id as string);
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: riderId },
            data: { 
                isRejected: true, 
                rejectionReason: reason,
                declinedById: adminId,
                declinedAt: new Date()
            }
        });

        // Notify Rider via Socket
        io.to(riderId.toString()).emit('system_notification', {
            title: 'Account Declined',
            message: `Your rider account has been declined. Reason: ${reason}`,
            type: 'ERROR'
        });

        // Dispatch SMS Notification
        if (updatedUser.phone) {
            await sendSMS(updatedUser.phone, `PRESTIGE: Your rider account application was declined. Reason: ${reason}`);
        }

        // Descriptive Audit Log
        await logActivity(adminId, 'RIDER_DECLINED', {
            riderId: updatedUser.id,
            riderName: updatedUser.name,
            reason,
            details: `Admin declined rider application for ${updatedUser.name}. Reason: ${reason}`
        }, req.ip);

        res.json(updatedUser);
    } catch (error: any) {
        console.error('Error declining rider', error);
        res.status(500).json({ message: 'Failed to decline rider' });
    }
};

export const getRiderAnalytics = async (req: Request, res: Response) => {
    try {
        const requestingUser = (req as any).user;
        const riderId = parseInt(req.params.id as string);

        // Allow Admin to see any rider, but Rider can only see themselves
        if (requestingUser.role !== 'ADMIN' && requestingUser.id !== riderId) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const deliveries = await prisma.delivery.findMany({
            where: {
                riderId: riderId,
                status: 'DELIVERED'
            }
        });

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let dailyCount = 0;
        let weeklyCount = 0;
        let monthlyCount = 0;

        let totalRevenue = 0;
        let totalRiderCommission = 0;
        const revenueByMethod = {
            COD: 0,
            TRANSFER: 0,
            POS: 0
        };

        // For Daily Summary (Unsettled)
        let dailyCODToRemit = 0;
        let dailyCompanyOwesRider = 0;

        deliveries.forEach(d => {
            const date = new Date(d.updatedAt);
            if (date >= startOfDay) dailyCount++;
            if (date >= startOfWeek) weeklyCount++;
            if (date >= startOfMonth) monthlyCount++;

            const totalPrice = d.price ? Number(d.price) : 0;
            const basePrice = totalPrice > 100 ? totalPrice - 100 : totalPrice;
            
            totalRevenue += totalPrice;
            revenueByMethod[d.paymentMethod] += totalPrice;
            
            const riderEarning = (basePrice * 0.70) - (totalPrice > 100 ? 100 : 0);
            totalRiderCommission += riderEarning;

            // Settlement logic for "Expectation"
            if (!d.isSettled) {
                if (d.paymentMethod === 'COD') {
                    // Rider holds the full cash, owes company (Base * 0.30) + 200
                    // But effectively they have "Cash to Remit" = TotalPrice - RiderEarning
                    dailyCODToRemit += (totalPrice - riderEarning);
                } else {
                    // Company holds the money, owes rider their earning
                    dailyCompanyOwesRider += riderEarning;
                }
            }
        });

        const riderCommission = totalRiderCommission;
        const codRemittance = revenueByMethod.COD - riderCommission;

        res.json({
            deliveries: {
                daily: dailyCount,
                weekly: weeklyCount,
                monthly: monthlyCount,
                total: deliveries.length
            },
            revenue: {
                total: totalRevenue,
                byMethod: revenueByMethod,
                riderCommission: riderCommission,
                codRemittance: codRemittance
            },
            summary: {
                cashToRemit: dailyCODToRemit,
                companyOwesRider: dailyCompanyOwesRider,
                netBalance: dailyCompanyOwesRider - dailyCODToRemit
            }
        });
    } catch (error: any) {
        console.error('Error fetching rider analytics', error);
        res.status(500).json({ message: 'Failed to fetch rider analytics' });
    }
};

export const getReconciliationReport = async (req: Request, res: Response) => {
    try {
        if ((req as any).user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const riders = await prisma.user.findMany({
            where: { role: Role.RIDER, isVerified: true },
            select: { id: true, name: true, phone: true }
        });

        const rawReports = await Promise.all(riders.map(async (rider) => {
            const deliveries = await prisma.delivery.findMany({
                where: { 
                    riderId: rider.id, 
                    status: 'DELIVERED',
                    isSettled: false // Only unsettled deliveries for clearance
                }
            });

            if (deliveries.length === 0) return null;

            let totalDeliveries = deliveries.length;
            let totalRevenue = 0;
            let totalRiderCommission = 0;
            let totalCompanyRevenue = 0;
            let totalCOD = 0;
            let totalTransfer = 0;
            let totalPOS = 0;

            deliveries.forEach(d => {
                const totalPrice = d.price ? Number(d.price) : 0;
                totalRevenue += totalPrice;
                if (d.paymentMethod === 'COD') totalCOD += totalPrice;
                if (d.paymentMethod === 'TRANSFER') totalTransfer += totalPrice;
                if (d.paymentMethod === 'POS') totalPOS += totalPrice;

                const basePrice = totalPrice > 100 ? totalPrice - 100 : totalPrice;
                const riderEarning = (basePrice * 0.70) - (totalPrice > 100 ? 100 : 0);
                totalRiderCommission += riderEarning;
                totalCompanyRevenue += (basePrice * 0.30) + (totalPrice > 100 ? 200 : 0);
            });

            const riderCommission = totalRiderCommission;
            const companyRevenue = totalCompanyRevenue;
            const codRemittance = totalCOD - riderCommission;

            // If rider doesn't owe anything and wasn't owed anything (unlikely if deliveries > 0), skip
            if (totalCOD === 0 && totalDeliveries > 0 && riderCommission === 0) return null;

            return {
                id: rider.id,
                name: rider.name,
                phone: rider.phone,
                totalDeliveries,
                financials: {
                    totalRevenue,
                    totalCOD,
                    totalTransfer,
                    totalPOS,
                    riderCommission,
                    companyRevenue,
                    codRemittance
                }
            };
        }));

        // Filter out nulls and riders with 0 COD if that's the primary goal
        const reports = rawReports.filter(r => r !== null && r.financials.totalCOD > 0);

        res.json(reports);
    } catch (error: any) {
        console.error('Error fetching reconciliation report', error);
        res.status(500).json({ message: 'Failed to fetch reconciliation report', error: error.message });
    }
};

export const settleRiderCOD = async (req: Request, res: Response) => {
    try {
        if ((req as any).user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });

        const riderId = parseInt(req.params.id as string);

        const result = await prisma.delivery.updateMany({
            where: {
                riderId: riderId,
                status: 'DELIVERED',
                paymentMethod: 'COD',
                isSettled: false
            },
            data: {
                isSettled: true
            }
        });

        res.json({ message: `Successfully settled ${result.count} deliveries for rider.`, count: result.count });
    } catch (error: any) {
        console.error('Error settling rider COD:', error);
        res.status(500).json({ message: 'Failed to settle rider COD' });
    }
};
