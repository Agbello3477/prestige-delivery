"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateDelivery = exports.updateDeliveryLocation = exports.updateDeliveryStatus = exports.getPendingDeliveries = exports.getDeliveryById = exports.getMyDeliveries = exports.getAllDeliveries = exports.createDelivery = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../lib/prisma"));
const zod_1 = require("zod");
const notificationService_1 = require("../services/notificationService");
const createDeliverySchema = zod_1.z.object({
    pickupAddress: zod_1.z.string(),
    pickupLat: zod_1.z.number(),
    pickupLng: zod_1.z.number(),
    dropoffAddress: zod_1.z.string(),
    dropoffLat: zod_1.z.number(),
    dropoffLng: zod_1.z.number(),
    vehicleType: zod_1.z.string().optional(), // Allow vehicleType from frontend
    paymentMethod: zod_1.z.enum(['COD', 'TRANSFER', 'POS']).optional().default('COD'),
    price: zod_1.z.number().optional(),
    distanceKm: zod_1.z.number().optional()
});
const createDelivery = async (req, res) => {
    try {
        const { pickupAddress, pickupLat, pickupLng, dropoffAddress, dropoffLat, dropoffLng, paymentMethod, price, distanceKm } = createDeliverySchema.parse(req.body);
        // 1. Geofence Check (Kano State Logic)
        // Bypass geofence for testing - simulators often use default coordinates outside Kano
        // if (!isWithinKano({ lat: pickupLat, lng: pickupLng })) {
        //     return res.status(400).json({ message: 'Pickup location is outside the service area (Kano State).' });
        // }
        const userId = req.user.id;
        // Generate Tracking Number (e.g., ORD-ABC12)
        const trackingNumber = `ORD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        // 2. Create Delivery Record
        const delivery = await prisma_1.default.delivery.create({
            data: {
                customerId: userId,
                trackingNumber,
                pickupAddress,
                pickupLat,
                pickupLng,
                dropoffAddress,
                dropoffLat,
                dropoffLng,
                price,
                distanceKm,
                status: client_1.DeliveryStatus.PENDING,
                paymentMethod: paymentMethod,
            },
        });
        // 3. Trigger Matching (Async)
        // In a real system, this would be a queue job. Here we just call the service.
        // We are not assigning yet, just acknowledging creation.
        // const riders = await findNearbyRiders({ lat: pickupLat, lng: pickupLng });
        // if (riders.length > 0) {
        //    // Notify riders...
        // }
        console.log(`Delivery ${delivery.id} created. Matching logic initiated.`);
        res.status(201).json({ message: 'Delivery request created', delivery });
    }
    catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Failed to create delivery', error: error.message });
    }
};
exports.createDelivery = createDelivery;
const getAllDeliveries = async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const deliveries = await prisma_1.default.delivery.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                customer: { select: { name: true, phone: true } },
                rider: { select: { name: true, phone: true } }
            }
        });
        res.json(deliveries);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching deliveries', error: error.message });
    }
};
exports.getAllDeliveries = getAllDeliveries;
const getMyDeliveries = async (req, res) => {
    try {
        const userId = req.user.id;
        const deliveries = await prisma_1.default.delivery.findMany({
            where: {
                OR: [
                    { customerId: userId },
                    { riderId: userId }
                ]
            },
            include: {
                rider: { select: { name: true, phone: true } },
                customer: { select: { name: true, phone: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(deliveries);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching deliveries', error: error.message });
    }
};
exports.getMyDeliveries = getMyDeliveries;
const getDeliveryById = async (req, res) => {
    try {
        const { id } = req.params;
        const delivery = await prisma_1.default.delivery.findUnique({
            where: { id },
            include: {
                rider: {
                    select: {
                        name: true,
                        phone: true,
                        passportUrl: true,
                        vehicles: {
                            select: { type: true, plateNumber: true }
                        }
                    }
                },
                customer: { select: { name: true, phone: true } },
                trackingLogs: {
                    orderBy: { timestamp: 'desc' },
                    take: 1
                }
            }
        });
        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }
        const formattedDelivery = {
            ...delivery,
            rider: delivery.rider ? {
                name: delivery.rider.name,
                phone: delivery.rider.phone,
                vehicleType: delivery.rider.vehicles[0]?.type || 'Unknown'
            } : null,
            currentLocation: delivery.trackingLogs[0] ? {
                lat: delivery.trackingLogs[0].lat,
                lng: delivery.trackingLogs[0].lng
            } : null
        };
        res.json(formattedDelivery);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching delivery', error: error.message });
    }
};
exports.getDeliveryById = getDeliveryById;
const getPendingDeliveries = async (req, res) => {
    try {
        // Only Verified Riders can receive pending orders
        const user = await prisma_1.default.user.findUnique({ where: { id: req.user.id } });
        if (!user?.isVerified) {
            return res.json([]);
        }
        // In a real app, filter by location (Geofencing)
        const deliveries = await prisma_1.default.delivery.findMany({
            where: { status: client_1.DeliveryStatus.PENDING },
            include: {
                customer: { select: { name: true, phone: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(deliveries);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching pending deliveries', error: error.message });
    }
};
exports.getPendingDeliveries = getPendingDeliveries;
const updateDeliveryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, proofType } = req.body; // proofUrl handled via file upload if present
        const riderId = req.user.id;
        // Handle file upload if present
        let proofUrl = req.body.proofUrl; // If sent as string (e.g. signature base64)
        if (req.files) {
            const files = req.files;
            if (files['proof']?.[0]) {
                proofUrl = files['proof'][0].path;
            }
        }
        const delivery = await prisma_1.default.delivery.findUnique({ where: { id } });
        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }
        const updateData = { status };
        // If a rider accepts it, assign them
        if (status === client_1.DeliveryStatus.ACCEPTED && !delivery.riderId) {
            updateData.riderId = riderId;
        }
        // If Delivered, add proof
        if (status === client_1.DeliveryStatus.DELIVERED) {
            if (proofType)
                updateData.proofType = proofType;
            if (proofUrl)
                updateData.proofUrl = proofUrl;
        }
        const updatedDelivery = await prisma_1.default.delivery.update({
            where: { id },
            data: updateData,
            include: {
                rider: { select: { name: true, phone: true } },
                customer: { select: { pushToken: true } } // Pull customer strictly for notifications
            }
        });
        // Fire Expo Notification
        if (status === client_1.DeliveryStatus.DELIVERED && updatedDelivery.customer?.pushToken) {
            await (0, notificationService_1.sendPushNotification)([updatedDelivery.customer.pushToken], "Delivery Completed! 🎉", "Your Parcel has been successfully delivered. Thank you for using Prestige Delivery and Logistics Services.", { deliveryId: updatedDelivery.id });
        }
        res.json(updatedDelivery);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating delivery status', error: error.message });
    }
};
exports.updateDeliveryStatus = updateDeliveryStatus;
const updateDeliveryLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const { lat, lng } = req.body;
        await prisma_1.default.trackingLog.create({
            data: {
                deliveryId: id,
                lat,
                lng
            }
        });
        res.status(200).json({ message: 'Location updated' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating location', error: error.message });
    }
};
exports.updateDeliveryLocation = updateDeliveryLocation;
const rateDelivery = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating } = req.body;
        const customerId = req.user.id; // User issuing rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }
        const delivery = await prisma_1.default.delivery.findUnique({ where: { id } });
        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }
        if (delivery.customerId !== customerId) {
            return res.status(403).json({ message: 'Only the customer can rate this delivery' });
        }
        if (delivery.status !== client_1.DeliveryStatus.DELIVERED) {
            return res.status(400).json({ message: 'Can only rate delivered items' });
        }
        if (delivery.rating) {
            return res.status(400).json({ message: 'Delivery already rated' });
        }
        // 1. Update Delivery with specific rating
        await prisma_1.default.delivery.update({
            where: { id },
            data: { rating }
        });
        // 2. Update Rider's average rating metrics
        if (delivery.riderId) {
            const rider = await prisma_1.default.user.findUnique({ where: { id: delivery.riderId } });
            if (rider) {
                const currentRating = rider.rating || 0;
                const currentCount = rider.ratingCount || 0;
                const newCount = currentCount + 1;
                const newRating = ((currentRating * currentCount) + rating) / newCount;
                await prisma_1.default.user.update({
                    where: { id: delivery.riderId },
                    data: {
                        rating: newRating,
                        ratingCount: newCount
                    }
                });
            }
        }
        res.json({ message: 'Rating submitted successfully' });
    }
    catch (error) {
        console.error('Error rating delivery:', error);
        res.status(500).json({ message: 'Failed to submit rating', error: error.message });
    }
};
exports.rateDelivery = rateDelivery;
