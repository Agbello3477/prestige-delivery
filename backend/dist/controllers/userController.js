"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReconciliationReport = exports.getRiderAnalytics = exports.declineRider = exports.liftSuspension = exports.blockRider = exports.suspendRider = exports.notifyNoBike = exports.assignBike = exports.approveRider = exports.getAllRiders = exports.getOnlineRiders = exports.updateLocation = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("@prisma/client");
const sms_1 = require("../utils/sms");
const auditService_1 = require("../services/auditService");
const updateLocation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { lat, lng } = req.body;
        if (!lat || !lng) {
            return res.status(400).json({ message: 'Latitude and Longitude are required' });
        }
        const user = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                lastLat: parseFloat(lat),
                lastLng: parseFloat(lng),
                isOnline: true // Implicitly set online when updating location
            }
        });
        res.json({ message: 'Location updated', location: { lat: user.lastLat, lng: user.lastLng } });
    }
    catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({ message: 'Failed to update location' });
    }
};
exports.updateLocation = updateLocation;
const getOnlineRiders = async (req, res) => {
    try {
        // Fetch riders who are online and have a valid location
        // Optionally filter by proximity if lat/lng are provided in query
        const riders = await prisma_1.default.user.findMany({
            where: {
                role: client_1.Role.RIDER,
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
    }
    catch (error) {
        console.error('Get online riders error:', error);
        res.status(500).json({ message: 'Failed to fetch riders' });
    }
};
exports.getOnlineRiders = getOnlineRiders;
const getAllRiders = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN')
            return res.status(403).json({ message: 'Forbidden' });
        const riders = await prisma_1.default.user.findMany({
            where: { role: client_1.Role.RIDER },
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
    }
    catch (error) {
        console.error('Error fetching all riders', error);
        res.status(500).json({ message: 'Failed to fetch riders' });
    }
};
exports.getAllRiders = getAllRiders;
const approveRider = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN')
            return res.status(403).json({ message: 'Forbidden' });
        const adminId = req.user.id;
        const riderId = parseInt(req.params.id);
        const updatedUser = await prisma_1.default.user.update({
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
        socket_1.io.to(riderId.toString()).emit('system_notification', {
            title: 'Account Approved',
            message: 'Your rider account has been successfully verified.',
            type: 'INFO'
        });
        // Dispatch SMS Notification
        if (updatedUser.phone) {
            await (0, sms_1.sendSMS)(updatedUser.phone, 'PRESTIGE: Your rider account has been approved. You can now go online and accept deliveries.');
        }
        // Descriptive Audit Log
        await (0, auditService_1.logActivity)(adminId, 'RIDER_APPROVED', {
            riderId: updatedUser.id,
            riderName: updatedUser.name,
            details: `Admin approved rider application for ${updatedUser.name}.`
        }, req.ip);
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Error approving rider', error);
        res.status(500).json({ message: 'Failed to approve rider' });
    }
};
exports.approveRider = approveRider;
const socket_1 = require("../socket");
const assignBike = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN')
            return res.status(403).json({ message: 'Forbidden' });
        const riderId = parseInt(req.params.id);
        const { plateNumber, model, chassisNumber } = req.body;
        if (!plateNumber || !model) {
            return res.status(400).json({ message: 'Plate Number and Model are required' });
        }
        const vehicle = await prisma_1.default.vehicle.create({
            data: {
                type: 'BIKE',
                plateNumber,
                model,
                chassisNumber,
                riderId
            }
        });
        // Notify Rider via Socket
        socket_1.io.to(riderId.toString()).emit('system_notification', {
            title: 'Bike Assigned',
            message: `A bike (${model} - ${plateNumber}) has been assigned to your account. You can now start accepting deliveries.`,
            type: 'INFO'
        });
        res.json(vehicle);
    }
    catch (error) {
        console.error('Error assigning bike', error);
        res.status(500).json({ message: 'Failed to assign bike' });
    }
};
exports.assignBike = assignBike;
const notifyNoBike = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN')
            return res.status(403).json({ message: 'Forbidden' });
        const riderId = parseInt(req.params.id);
        // Notify Rider via Socket
        socket_1.io.to(riderId.toString()).emit('system_notification', {
            title: 'No Bikes Available',
            message: 'No available bikes at the moment, one would be assign to you when its available.',
            type: 'WARNING'
        });
        res.json({ message: 'Notification sent successfully' });
    }
    catch (error) {
        console.error('Error notifying rider', error);
        res.status(500).json({ message: 'Failed to notify rider' });
    }
};
exports.notifyNoBike = notifyNoBike;
const suspendRider = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN')
            return res.status(403).json({ message: 'Forbidden' });
        const riderId = parseInt(req.params.id);
        const { duration, unit } = req.body; // duration: number, unit: 'days' | 'weeks' | 'months'
        if (!duration || !unit) {
            return res.status(400).json({ message: 'Duration and unit are required' });
        }
        const endDate = new Date();
        if (unit === 'days')
            endDate.setDate(endDate.getDate() + duration);
        else if (unit === 'weeks')
            endDate.setDate(endDate.getDate() + (duration * 7));
        else if (unit === 'months')
            endDate.setMonth(endDate.getMonth() + duration);
        const updatedUser = await prisma_1.default.user.update({
            where: { id: riderId },
            data: {
                isSuspended: true,
                suspensionEndDate: endDate,
                isOnline: false // Force offline
            }
        });
        socket_1.io.to(riderId.toString()).emit('system_notification', {
            title: 'Account Suspended',
            message: `You are suspended for at the moment please check back in ${duration} ${unit} or contact admin for more Information.`,
            type: 'WARNING'
        });
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Error suspending rider', error);
        res.status(500).json({ message: 'Failed to suspend rider' });
    }
};
exports.suspendRider = suspendRider;
const blockRider = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN')
            return res.status(403).json({ message: 'Forbidden' });
        const riderId = parseInt(req.params.id);
        const updatedUser = await prisma_1.default.user.update({
            where: { id: riderId },
            data: {
                isBlocked: true,
                isOnline: false // Force offline
            }
        });
        socket_1.io.to(riderId.toString()).emit('system_notification', {
            title: 'Account Blocked',
            message: `You are currently blocked and will not receive any requests. Please contact admin for more information.`,
            type: 'ERROR'
        });
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Error blocking rider', error);
        res.status(500).json({ message: 'Failed to block rider' });
    }
};
exports.blockRider = blockRider;
const liftSuspension = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN')
            return res.status(403).json({ message: 'Forbidden' });
        const riderId = parseInt(req.params.id);
        const updatedUser = await prisma_1.default.user.update({
            where: { id: riderId },
            data: {
                isSuspended: false,
                suspensionEndDate: null,
                isBlocked: false
            }
        });
        socket_1.io.to(riderId.toString()).emit('system_notification', {
            title: 'Suspension Lifted',
            message: 'Your account status has been restored. You can now go online.',
            type: 'INFO'
        });
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Error lifting suspension', error);
        res.status(500).json({ message: 'Failed to lift suspension' });
    }
};
exports.liftSuspension = liftSuspension;
const declineRider = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN')
            return res.status(403).json({ message: 'Forbidden' });
        const adminId = req.user.id;
        const riderId = parseInt(req.params.id);
        const { reason } = req.body;
        if (!reason) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }
        const updatedUser = await prisma_1.default.user.update({
            where: { id: riderId },
            data: {
                isRejected: true,
                rejectionReason: reason,
                declinedById: adminId,
                declinedAt: new Date()
            }
        });
        // Notify Rider via Socket
        socket_1.io.to(riderId.toString()).emit('system_notification', {
            title: 'Account Declined',
            message: `Your rider account has been declined. Reason: ${reason}`,
            type: 'ERROR'
        });
        // Dispatch SMS Notification
        if (updatedUser.phone) {
            await (0, sms_1.sendSMS)(updatedUser.phone, `PRESTIGE: Your rider account application was declined. Reason: ${reason}`);
        }
        // Descriptive Audit Log
        await (0, auditService_1.logActivity)(adminId, 'RIDER_DECLINED', {
            riderId: updatedUser.id,
            riderName: updatedUser.name,
            reason,
            details: `Admin declined rider application for ${updatedUser.name}. Reason: ${reason}`
        }, req.ip);
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Error declining rider', error);
        res.status(500).json({ message: 'Failed to decline rider' });
    }
};
exports.declineRider = declineRider;
const getRiderAnalytics = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN')
            return res.status(403).json({ message: 'Forbidden' });
        const riderId = parseInt(req.params.id);
        const deliveries = await prisma_1.default.delivery.findMany({
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
        const revenueByMethod = {
            COD: 0,
            TRANSFER: 0,
            POS: 0
        };
        deliveries.forEach(d => {
            const date = new Date(d.updatedAt);
            if (date >= startOfDay)
                dailyCount++;
            if (date >= startOfWeek)
                weeklyCount++;
            if (date >= startOfMonth)
                monthlyCount++;
            const price = d.price ? Number(d.price) : 0;
            totalRevenue += price;
            revenueByMethod[d.paymentMethod] += price;
        });
        // Calculate 70% rider cut
        const riderCommission = totalRevenue * 0.70;
        // Calculate COD Remittance: How much cash the rider holds vs how much they actually earned
        // Positive number = Rider owes Company. Negative number = Company owes Rider.
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
            }
        });
    }
    catch (error) {
        console.error('Error fetching rider analytics', error);
        res.status(500).json({ message: 'Failed to fetch rider analytics' });
    }
};
exports.getRiderAnalytics = getRiderAnalytics;
const getReconciliationReport = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN')
            return res.status(403).json({ message: 'Forbidden' });
        // Retrieve all Riders
        const riders = await prisma_1.default.user.findMany({
            where: { role: client_1.Role.RIDER, isVerified: true },
            select: { id: true, name: true, phone: true }
        });
        // Compute total financial state for every rider
        const reports = await Promise.all(riders.map(async (rider) => {
            const deliveries = await prisma_1.default.delivery.findMany({
                where: { riderId: rider.id, status: 'DELIVERED' }
            });
            let totalDeliveries = deliveries.length;
            let totalRevenue = 0;
            let totalCOD = 0;
            let totalTransfer = 0;
            let totalPOS = 0;
            deliveries.forEach(d => {
                const price = d.price ? Number(d.price) : 0;
                totalRevenue += price;
                if (d.paymentMethod === 'COD')
                    totalCOD += price;
                if (d.paymentMethod === 'TRANSFER')
                    totalTransfer += price;
                if (d.paymentMethod === 'POS')
                    totalPOS += price;
            });
            const riderCommission = totalRevenue * 0.70;
            const companyRevenue = totalRevenue * 0.30;
            const codRemittance = totalCOD - riderCommission;
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
        res.json(reports);
    }
    catch (error) {
        console.error('Error fetching reconciliation report', error);
        res.status(500).json({ message: 'Failed to fetch reconciliation report', error: error.message });
    }
};
exports.getReconciliationReport = getReconciliationReport;
