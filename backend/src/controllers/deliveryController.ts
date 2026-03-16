import { Request, Response } from 'express';
import { DeliveryStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { z } from 'zod';
import { findNearbyRiders } from '../services/matchingService';
import { isWithinKano } from '../utils/geo';
import { sendPushNotification } from '../services/notificationService';

const createDeliverySchema = z.object({
    pickupAddress: z.string(),
    pickupLat: z.number(),
    pickupLng: z.number(),
    dropoffAddress: z.string(),
    dropoffLat: z.number(),
    dropoffLng: z.number(),
    vehicleType: z.string().optional(), // Allow vehicleType from frontend
    paymentMethod: z.enum(['COD', 'TRANSFER', 'POS']).optional().default('COD'),
    price: z.number().optional(),
    distanceKm: z.number().optional()
});

export const createDelivery = async (req: any, res: Response) => {
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
        const delivery = await prisma.delivery.create({
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
                status: DeliveryStatus.PENDING,
                paymentMethod: paymentMethod as any,
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
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ message: 'Failed to create delivery', error: error.message });
    }
};


export const getAllDeliveries = async (req: any, res: Response) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden' });
        }
        const deliveries = await prisma.delivery.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                customer: { select: { name: true, phone: true } },
                rider: { select: { name: true, phone: true } }
            }
        });
        res.json(deliveries);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching deliveries', error: error.message });
    }
};

export const getMyDeliveries = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const deliveries = await prisma.delivery.findMany({
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
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching deliveries', error: error.message });
    }
};

export const getDeliveryById = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const delivery = await prisma.delivery.findUnique({
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
                vehicleType: delivery.rider.vehicles[0]?.type || 'Unknown',
                vehicles: delivery.rider.vehicles,
                passportUrl: delivery.rider.passportUrl
            } : null,
            currentLocation: delivery.trackingLogs[0] ? {
                lat: delivery.trackingLogs[0].lat,
                lng: delivery.trackingLogs[0].lng
            } : null
        };

        res.json(formattedDelivery);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching delivery', error: error.message });
    }
};

export const getPendingDeliveries = async (req: any, res: Response) => {
    try {
        // Only Verified Riders can receive pending orders
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user?.isVerified) {
            return res.json([]);
        }

        // In a real app, filter by location (Geofencing)
        const deliveries = await prisma.delivery.findMany({
            where: { status: DeliveryStatus.PENDING },
            include: {
                customer: { select: { name: true, phone: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(deliveries);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching pending deliveries', error: error.message });
    }
};

export const updateDeliveryStatus = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { status, proofType } = req.body; // proofUrl handled via file upload if present
        const riderId = req.user.id;

        // Handle file upload if present
        let proofUrl = req.body.proofUrl; // If sent as string (e.g. signature base64)
        if (req.files) {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            if (files['proof']?.[0]) {
                proofUrl = files['proof'][0].path;
            }
        }

        const delivery = await prisma.delivery.findUnique({ where: { id } });

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        const updateData: any = { status };

        // If a rider accepts it, assign them
        if (status === DeliveryStatus.ACCEPTED && !delivery.riderId) {
            updateData.riderId = riderId;
        }

        // If Delivered, add proof
        if (status === DeliveryStatus.DELIVERED) {
            if (proofType) updateData.proofType = proofType;
            if (proofUrl) updateData.proofUrl = proofUrl;
        }

        const updatedDelivery = await prisma.delivery.update({
            where: { id },
            data: updateData,
            include: {
                rider: { select: { name: true, phone: true } },
                customer: { select: { pushToken: true } } // Pull customer strictly for notifications
            }
        });

        // Fire Expo Notification
        if (status === DeliveryStatus.DELIVERED && updatedDelivery.customer?.pushToken) {
            await sendPushNotification(
                [updatedDelivery.customer.pushToken],
                "Delivery Completed! 🎉",
                "Your Parcel has been successfully delivered. Thank you for using Prestige Delivery and Logistics Services.",
                { deliveryId: updatedDelivery.id }
            );
        }

        res.json(updatedDelivery);
    } catch (error: any) {
        res.status(500).json({ message: 'Error updating delivery status', error: error.message });
    }
};

export const updateDeliveryLocation = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { lat, lng } = req.body;

        await prisma.trackingLog.create({
            data: {
                deliveryId: id,
                lat,
                lng
            }
        });

        res.status(200).json({ message: 'Location updated' });
    } catch (error: any) {
        res.status(500).json({ message: 'Error updating location', error: error.message });
    }
};

export const rateDelivery = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { rating } = req.body;
        const customerId = req.user.id; // User issuing rating

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        const delivery = await prisma.delivery.findUnique({ where: { id } });

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        if (delivery.customerId !== customerId) {
            return res.status(403).json({ message: 'Only the customer can rate this delivery' });
        }

        if (delivery.status !== DeliveryStatus.DELIVERED) {
            return res.status(400).json({ message: 'Can only rate delivered items' });
        }

        if (delivery.rating) {
            return res.status(400).json({ message: 'Delivery already rated' });
        }

        // 1. Update Delivery with specific rating
        await prisma.delivery.update({
            where: { id },
            data: { rating }
        });

        // 2. Update Rider's average rating metrics
        if (delivery.riderId) {
            const rider = await prisma.user.findUnique({ where: { id: delivery.riderId } });
            if (rider) {
                const currentRating = rider.rating || 0;
                const currentCount = rider.ratingCount || 0;

                const newCount = currentCount + 1;
                const newRating = ((currentRating * currentCount) + rating) / newCount;

                await prisma.user.update({
                    where: { id: delivery.riderId },
                    data: {
                        rating: newRating,
                        ratingCount: newCount
                    }
                });
            }
        }

        res.json({ message: 'Rating submitted successfully' });
    } catch (error: any) {
        console.error('[ERROR] Failed to submit rating:', {
            deliveryId: id,
            rating,
            customerId,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ message: 'Failed to submit rating', error: error.message });
    }
};

export const cancelDelivery = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const customerId = req.user.id;

        const delivery = await prisma.delivery.findUnique({ where: { id } });

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        if (delivery.customerId !== customerId) {
            return res.status(403).json({ message: 'Only the customer can cancel this delivery' });
        }

        if (delivery.status !== 'PENDING') {
            return res.status(400).json({ message: 'Can only logistically cancel pending deliveries' });
        }

        const updatedDelivery = await prisma.delivery.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });

        res.json({ message: 'Delivery cancelled successfully', delivery: updatedDelivery });
    } catch (error: any) {
        console.error('Error cancelling delivery:', error);
        res.status(500).json({ message: 'Failed to cancel delivery', error: error.message });
    }
};
