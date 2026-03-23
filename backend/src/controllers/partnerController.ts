import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { Role, DeliveryStatus } from '@prisma/client';
import { generateToken, hashPassword } from '../utils/auth';
import { io } from '../socket';
import { sendPushNotification } from '../services/notificationService';
import { logActivity } from '../services/auditService';
import { z } from 'zod';

const registerPartnerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    phone: z.string().optional(),
    partnerType: z.enum(['FOOD', 'ECOMMERCE', 'PHARMACY', 'AUTOMOBILE']),
    businessName: z.string().min(2),
    address: z.string().optional(),
    agreedPercentage: z.number().optional()
});

export const createPartner = async (req: Request, res: Response) => {
    try {
        const { email, password, name, phone, partnerType, businessName, address, agreedPercentage } = registerPartnerSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: Role.PARTNER,
                phone,
                isVerified: true, // Partners created by Admin are auto-verified
                partnerProfile: {
                    create: {
                        partnerType,
                        businessName,
                        address,
                        agreedPercentage
                    }
                }
            },
            include: {
                partnerProfile: true
            }
        });

        const token = generateToken({ id: user.id, email: user.email, role: user.role });
        res.status(201).json({ message: 'Partner created successfully', user });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            console.error('[VALIDATION ERROR] createPartner:', error.issues);
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: error.issues.map((issue) => ({ path: issue.path, message: issue.message }))
            });
        }
        console.error('[ERROR] createPartner:', error);
        res.status(400).json({ message: 'Failed to create partner', error: error.message });
    }
};

export const getPartners = async (req: Request, res: Response) => {
    try {
        const partners = await prisma.user.findMany({
            where: { role: Role.PARTNER, isArchived: false },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                createdAt: true,
                isVerified: true,
                partnerProfile: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(partners);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching partners', error: error.message });
    }
};

export const getArchivedPartners = async (req: Request, res: Response) => {
    try {
        const partners = await prisma.user.findMany({
            where: { role: Role.PARTNER, isArchived: true },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                createdAt: true,
                isVerified: true,
                partnerProfile: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(partners);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching archived partners', error: error.message });
    }
};

export const updatePartner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, phone, email, businessName, address, partnerType, agreedPercentage, isActive } = req.body;
        const adminId = (req as any).user.id;

        const userId = parseInt(id as string);

        const partner = await prisma.user.findUnique({
            where: { id: userId },
            include: { partnerProfile: true }
        });

        if (!partner || partner.role !== Role.PARTNER) {
            return res.status(404).json({ message: 'Partner not found' });
        }

        const updatedPartner = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                phone,
                email,
                partnerProfile: {
                    update: {
                        businessName,
                        address,
                        partnerType,
                        agreedPercentage,
                        isActive
                    }
                }
            },
            include: { partnerProfile: true }
        });

        await logActivity(adminId, 'PARTNER_UPDATED', {
            partnerId: id as string,
            changes: req.body as any
        }, req.ip || '');

        res.json({ message: 'Partner updated successfully', partner: updatedPartner });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to update partner', error: error.message });
    }
};

export const deletePartner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const adminId = (req as any).user.id;
        const userId = parseInt(String(id));

        const partner = await prisma.user.findUnique({
            where: { id: userId },
            include: { 
                partnerProfile: true
            }
        });

        if (!partner || partner.role !== Role.PARTNER) {
            return res.status(404).json({ message: 'Partner not found' });
        }

        // Soft Delete: Mark as archived and deactivate profile
        await prisma.user.update({
            where: { id: userId },
            data: { 
                isArchived: true,
                partnerProfile: partner.partnerProfile ? {
                    update: { isActive: false }
                } : undefined
            }
        });

        // 1. Optionally logout by invalidating sessions/setting isOnline false (If applicable)
        if (partner.isOnline) {
             await prisma.user.update({ where: { id: userId }, data: { isOnline: false, pushToken: null }});
        }

        await logActivity(adminId, 'PARTNER_ARCHIVED', { partnerId: id, partnerName: partner.name }, req.ip || '');

        res.json({ message: 'Partner archived successfully. Financial records are preserved.' });
    } catch (error: any) {
        console.error('Archive partner error:', error);
        res.status(500).json({ message: 'Failed to archive partner', error: error.message });
    }
};

export const restorePartner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const adminId = (req as any).user.id;
        const userId = parseInt(String(id));

        const partner = await prisma.user.findUnique({
            where: { id: userId },
            include: { 
                partnerProfile: true
            }
        });

        if (!partner || partner.role !== Role.PARTNER) {
            return res.status(404).json({ message: 'Partner not found' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { 
                isArchived: false,
                partnerProfile: partner.partnerProfile ? {
                    update: { isActive: true }
                } : undefined
            }
        });

        await logActivity(adminId, 'PARTNER_RESTORED', { partnerId: id, partnerName: partner.name }, req.ip || '');

        res.json({ message: 'Partner restored successfully.' });
    } catch (error: any) {
        console.error('Restore partner error:', error);
        res.status(500).json({ message: 'Failed to restore partner', error: error.message });
    }
};

export const getPublicPartners = async (req: Request, res: Response) => {
    try {
        const type = req.query.type as string;
        let whereClause: any = {};

        if (type) {
            whereClause = {
                partnerProfile: {
                    partnerType: type as string
                }
            };
        }

        const partners = await prisma.user.findMany({
            where: {
                role: 'PARTNER',
                ...whereClause
            },
            select: {
                id: true,
                name: true,
                partnerProfile: {
                    select: {
                        id: true,
                        businessName: true,
                        partnerType: true,
                        address: true
                    }
                }
            }
        });

        res.json(partners);
    } catch (error: any) {
        console.error('Error fetching public partners:', error);
        res.status(500).json({ message: 'Failed to fetch partners', error: error.message });
    }
};

// ==========================================
// PARTNER VENDOR MENU ITEMS
// ==========================================

export const addMenuItem = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        const profile = await prisma.partnerProfile.findUnique({
            where: { userId }
        });

        if (!profile) return res.status(404).json({ message: 'Partner profile not found.' });

        const { name, description, price, imageUrl } = req.body;

        const menuItem = await prisma.menuItem.create({
            data: {
                partnerId: profile.id,
                name,
                description,
                price: price.toString(),
                imageUrl
            }
        });

        res.status(201).json(menuItem);
    } catch (error: any) {
        console.error('Error creating menu item:', error);
        res.status(500).json({ message: 'Failed to create menu item', error: error.message });
    }
};

export const getMenuItems = async (req: Request, res: Response) => {
    try {
        const partnerId = req.params.partnerId;

        const menuItems = await prisma.menuItem.findMany({
            where: { partnerId: parseInt(partnerId as string) }
        });

        res.json(menuItems);
    } catch (error: any) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ message: 'Failed to fetch menu items', error: error.message });
    }
};

export const getMyMenuItems = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        const profile = await prisma.partnerProfile.findUnique({
            where: { userId }
        });

        if (!profile) return res.status(404).json({ message: 'Partner profile not found.' });

        const menuItems = await prisma.menuItem.findMany({
            where: { partnerId: profile.id }
        });

        res.json(menuItems);
    } catch (error: any) {
        console.error('Error fetching my menu items:', error);
        res.status(500).json({ message: 'Failed to fetch my menu items', error: error.message });
    }
};

// ==========================================
// VENDOR ORDERS
// ==========================================

export const createVendorOrder = async (req: Request, res: Response) => {
    try {
        const customerId = (req as any).user.id;
        const { partnerId, items, prescriptionUrl, totalAmount, deliveryOption, deliveryAddress, deliveryFee, deliveryNote } = req.body;

        const orderPayload = {
            partnerId: parseInt(partnerId),
            customerId,
            items,
            prescriptionUrl,
            totalAmount: totalAmount ? totalAmount.toString() : "0",
            deliveryOption: deliveryOption || 'PICKUP',
            deliveryAddress: deliveryAddress || null,
            deliveryFee: deliveryFee ? deliveryFee.toString() : null,
            deliveryNote: deliveryNote || null
        };

        console.log('[DEBUG] Creating Vendor Order Payload:', JSON.stringify(orderPayload, null, 2));

        const order = await prisma.vendorOrder.create({
            data: orderPayload,
            include: { partner: true }
        });

        // Trigger Delivery creation if DELIVERY is selected
        if (order.deliveryOption === 'DELIVERY') {
            const partnerAddress = order.partner.address || 'Vendor Location';
            
            console.log('[DEBUG] Triggering Delivery for Vendor Order:', order.id);
            const delivery = await prisma.delivery.create({
                data: {
                    pickupAddress: partnerAddress,
                    dropoffAddress: deliveryAddress || 'Customer Location',
                    customerId,
                    status: DeliveryStatus.PENDING,
                    price: deliveryFee || 1200,
                    deliveryNote: deliveryNote || null
                }
            });

            await prisma.vendorOrder.update({
                where: { id: order.id },
                data: { deliveryId: delivery.id }
            });
        }

        res.status(201).json(order);

        // Notify partner dashboard via Socket.io
        if (io) {
            console.log('[DEBUG] Emitting new_order to partner:', order.partnerId);
            io.emit('new_order', order);
            // Optionally emit to a private room
            io.to(order.partnerId.toString()).emit('new_order', order);
        }
    } catch (error: any) {
        console.error('[ERROR] createVendorOrder:', error);
        res.status(500).json({ 
            message: 'Failed to create vendor order', 
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack 
        });
    }
};

export const getVendorOrders = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        const profile = await prisma.partnerProfile.findUnique({
            where: { userId }
        });

        if (!profile) return res.status(404).json({ message: 'Partner profile not found.' });

        const orders = await prisma.vendorOrder.findMany({
            where: { partnerId: profile.id },
            include: {
                delivery: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(orders);
    } catch (error: any) {
        console.error('Error fetching vendor orders:', error);
        res.status(500).json({ message: 'Failed to fetch vendor orders', error: error.message });
    }
};

export const updateVendorOrderStatus = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body; // PENDING, ACCEPTED, PREPARING, READY_FOR_PICKUP, COMPLETED, CANCELLED

        const order = await prisma.vendorOrder.update({
            where: { id: parseInt(orderId as string) },
            data: { status },
            include: {
                partner: { select: { businessName: true } }
            }
        });

        // Fetch customer explicitly since it lacks a direct relation on VendorOrder
        const customer = await prisma.user.findUnique({
            where: { id: order.customerId },
            select: { id: true, pushToken: true }
        });

        // Emit Socket.io event for real-time app update
        if (io) {
            io.to(order.customerId.toString()).emit('vendor_order_status', {
                orderId: order.id,
                status: order.status,
                vendorName: order.partner.businessName
            });
        }

        // Send Push Notification
        if (customer?.pushToken) {
            const messages: any = {
                'ACCEPTED': `Your order from ${order.partner.businessName} has been confirmed!`,
                'PREPARING': `Your order from ${order.partner.businessName} is being prepared.`,
                'READY_FOR_PICKUP': order.deliveryOption === 'DELIVERY' 
                    ? `Your order from ${order.partner.businessName} is ready and waiting for a rider.`
                    : `Your order from ${order.partner.businessName} is ready for pickup!`,
                'COMPLETED': `Enjoy your order from ${order.partner.businessName}!`
            };

            const bodyMsg = messages[status];
            if (bodyMsg) {
                await sendPushNotification(
                    [customer.pushToken],
                    "Order Update 🍲",
                    bodyMsg,
                    { type: 'VENDOR_ORDER', orderId: order.id, status }
                );
            }
        }

        res.json(order);
    } catch (error: any) {
        console.error('Error updating vendor order:', error);
        res.status(500).json({ message: 'Failed to update vendor order', error: error.message });
    }
};
