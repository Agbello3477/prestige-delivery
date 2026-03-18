"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVendorOrderStatus = exports.getVendorOrders = exports.createVendorOrder = exports.getMyMenuItems = exports.getMenuItems = exports.addMenuItem = exports.getPublicPartners = exports.deletePartner = exports.updatePartner = exports.getPartners = exports.createPartner = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("@prisma/client");
const auth_1 = require("../utils/auth");
const socket_1 = require("../socket");
const notificationService_1 = require("../services/notificationService");
const auditService_1 = require("../services/auditService");
const zod_1 = require("zod");
const registerPartnerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().min(2),
    phone: zod_1.z.string().optional(),
    partnerType: zod_1.z.enum(['FOOD', 'ECOMMERCE', 'PHARMACY', 'AUTOMOBILE']),
    businessName: zod_1.z.string().min(2),
    address: zod_1.z.string().optional(),
    agreedPercentage: zod_1.z.number().optional()
});
const createPartner = async (req, res) => {
    try {
        const { email, password, name, phone, partnerType, businessName, address, agreedPercentage } = registerPartnerSchema.parse(req.body);
        const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await (0, auth_1.hashPassword)(password);
        const user = await prisma_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: client_1.Role.PARTNER,
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
        const token = (0, auth_1.generateToken)({ id: user.id, email: user.email, role: user.role });
        res.status(201).json({ message: 'Partner created successfully', user });
    }
    catch (error) {
        res.status(400).json({ message: 'Failed to create partner', error: error.message });
    }
};
exports.createPartner = createPartner;
const getPartners = async (req, res) => {
    try {
        const partners = await prisma_1.default.user.findMany({
            where: { role: client_1.Role.PARTNER },
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
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching partners', error: error.message });
    }
};
exports.getPartners = getPartners;
const updatePartner = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone, email, businessName, address, partnerType, agreedPercentage, isActive } = req.body;
        const adminId = req.user.id;
        const userId = parseInt(id);
        const partner = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: { partnerProfile: true }
        });
        if (!partner || partner.role !== client_1.Role.PARTNER) {
            return res.status(404).json({ message: 'Partner not found' });
        }
        const updatedPartner = await prisma_1.default.user.update({
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
        await (0, auditService_1.logActivity)(adminId, 'PARTNER_UPDATED', {
            partnerId: id,
            changes: req.body
        }, req.ip || '');
        res.json({ message: 'Partner updated successfully', partner: updatedPartner });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update partner', error: error.message });
    }
};
exports.updatePartner = updatePartner;
const deletePartner = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;
        const userId = parseInt(String(id));
        const partner = await prisma_1.default.user.findUnique({
            where: { id: userId },
            include: {
                partnerProfile: true,
                deliveriesAsRider: true,
                deliveriesAsCustomer: true
            }
        });
        if (!partner || partner.role !== client_1.Role.PARTNER) {
            return res.status(404).json({ message: 'Partner not found' });
        }
        const profileId = partner.partnerProfile?.id;
        // 1. Handle Audit Logs (Unlink but preserve history)
        await prisma_1.default.auditLog.updateMany({
            where: { userId },
            data: { userId: null }
        });
        // 2. Handle Messages (Delete conversations)
        await prisma_1.default.message.deleteMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            }
        });
        // 3. Handle Deliveries (Unlink from user records)
        if (partner.deliveriesAsCustomer.length > 0) {
            await prisma_1.default.delivery.deleteMany({ where: { customerId: userId } });
        }
        if (partner.deliveriesAsRider.length > 0) {
            // Should not happen for partners usually, but safe-guard
            await prisma_1.default.delivery.updateMany({
                where: { riderId: userId },
                data: { riderId: null }
            });
        }
        // 4. Handle Partner Profile specific records
        if (profileId) {
            await prisma_1.default.menuItem.deleteMany({ where: { partnerId: profileId } });
            await prisma_1.default.vendorOrder.deleteMany({ where: { partnerId: profileId } });
            await prisma_1.default.vehicle.updateMany({
                where: { partnerId: profileId },
                data: { partnerId: null }
            });
            await prisma_1.default.partnerProfile.delete({ where: { id: profileId } });
        }
        // 5. Finally delete the User
        await prisma_1.default.user.delete({ where: { id: userId } });
        await (0, auditService_1.logActivity)(adminId, 'PARTNER_DELETED', { partnerId: id, partnerName: partner.name }, req.ip || '');
        res.json({ message: 'Partner and all associated records deleted successfully' });
    }
    catch (error) {
        console.error('Delete partner error:', error);
        res.status(500).json({ message: 'Failed to delete partner', error: error.message });
    }
};
exports.deletePartner = deletePartner;
const getPublicPartners = async (req, res) => {
    try {
        const type = req.query.type;
        let whereClause = {};
        if (type) {
            whereClause = {
                partnerProfile: {
                    partnerType: type
                }
            };
        }
        const partners = await prisma_1.default.user.findMany({
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
    }
    catch (error) {
        console.error('Error fetching public partners:', error);
        res.status(500).json({ message: 'Failed to fetch partners', error: error.message });
    }
};
exports.getPublicPartners = getPublicPartners;
// ==========================================
// PARTNER VENDOR MENU ITEMS
// ==========================================
const addMenuItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await prisma_1.default.partnerProfile.findUnique({
            where: { userId }
        });
        if (!profile)
            return res.status(404).json({ message: 'Partner profile not found.' });
        const { name, description, price, imageUrl } = req.body;
        const menuItem = await prisma_1.default.menuItem.create({
            data: {
                partnerId: profile.id,
                name,
                description,
                price: price.toString(),
                imageUrl
            }
        });
        res.status(201).json(menuItem);
    }
    catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({ message: 'Failed to create menu item', error: error.message });
    }
};
exports.addMenuItem = addMenuItem;
const getMenuItems = async (req, res) => {
    try {
        const partnerId = req.params.partnerId;
        const menuItems = await prisma_1.default.menuItem.findMany({
            where: { partnerId: parseInt(partnerId) }
        });
        res.json(menuItems);
    }
    catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ message: 'Failed to fetch menu items', error: error.message });
    }
};
exports.getMenuItems = getMenuItems;
const getMyMenuItems = async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await prisma_1.default.partnerProfile.findUnique({
            where: { userId }
        });
        if (!profile)
            return res.status(404).json({ message: 'Partner profile not found.' });
        const menuItems = await prisma_1.default.menuItem.findMany({
            where: { partnerId: profile.id }
        });
        res.json(menuItems);
    }
    catch (error) {
        console.error('Error fetching my menu items:', error);
        res.status(500).json({ message: 'Failed to fetch my menu items', error: error.message });
    }
};
exports.getMyMenuItems = getMyMenuItems;
// ==========================================
// VENDOR ORDERS
// ==========================================
const createVendorOrder = async (req, res) => {
    try {
        const customerId = req.user.id;
        const { partnerId, items, prescriptionUrl, totalAmount, deliveryOption, deliveryAddress, deliveryFee } = req.body;
        const order = await prisma_1.default.vendorOrder.create({
            data: {
                partnerId: parseInt(partnerId),
                customerId,
                items,
                prescriptionUrl,
                totalAmount: totalAmount.toString(),
                deliveryOption: deliveryOption || 'PICKUP',
                deliveryAddress: deliveryAddress || null,
                deliveryFee: deliveryFee ? deliveryFee.toString() : null
            },
            include: { partner: true }
        });
        // Trigger Delivery creation if DELIVERY is selected
        if (order.deliveryOption === 'DELIVERY') {
            const partnerAddress = order.partner.address || 'Vendor Location';
            const delivery = await prisma_1.default.delivery.create({
                data: {
                    pickupAddress: partnerAddress,
                    dropoffAddress: deliveryAddress || 'Customer Location',
                    customerId,
                    status: client_1.DeliveryStatus.PENDING,
                    price: deliveryFee || 1200
                }
            });
            await prisma_1.default.vendorOrder.update({
                where: { id: order.id },
                data: { deliveryId: delivery.id }
            });
        }
        res.status(201).json(order);
    }
    catch (error) {
        console.error('Error creating vendor order:', error);
        res.status(500).json({ message: 'Failed to create vendor order', error: error.message });
    }
};
exports.createVendorOrder = createVendorOrder;
const getVendorOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await prisma_1.default.partnerProfile.findUnique({
            where: { userId }
        });
        if (!profile)
            return res.status(404).json({ message: 'Partner profile not found.' });
        const orders = await prisma_1.default.vendorOrder.findMany({
            where: { partnerId: profile.id },
            include: {
                delivery: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    }
    catch (error) {
        console.error('Error fetching vendor orders:', error);
        res.status(500).json({ message: 'Failed to fetch vendor orders', error: error.message });
    }
};
exports.getVendorOrders = getVendorOrders;
const updateVendorOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body; // PENDING, ACCEPTED, PREPARING, READY_FOR_PICKUP, COMPLETED, CANCELLED
        const order = await prisma_1.default.vendorOrder.update({
            where: { id: parseInt(orderId) },
            data: { status },
            include: {
                partner: { select: { businessName: true } }
            }
        });
        // Fetch customer explicitly since it lacks a direct relation on VendorOrder
        const customer = await prisma_1.default.user.findUnique({
            where: { id: order.customerId },
            select: { id: true, pushToken: true }
        });
        // Emit Socket.io event for real-time app update
        if (socket_1.io) {
            socket_1.io.to(order.customerId.toString()).emit('vendor_order_status', {
                orderId: order.id,
                status: order.status,
                vendorName: order.partner.businessName
            });
        }
        // Send Push Notification
        if (customer?.pushToken) {
            const messages = {
                'ACCEPTED': `Your order from ${order.partner.businessName} has been confirmed!`,
                'PREPARING': `Your order from ${order.partner.businessName} is being prepared.`,
                'READY_FOR_PICKUP': order.deliveryOption === 'DELIVERY'
                    ? `Your order from ${order.partner.businessName} is ready and waiting for a rider.`
                    : `Your order from ${order.partner.businessName} is ready for pickup!`,
                'COMPLETED': `Enjoy your order from ${order.partner.businessName}!`
            };
            const bodyMsg = messages[status];
            if (bodyMsg) {
                await (0, notificationService_1.sendPushNotification)([customer.pushToken], "Order Update 🍲", bodyMsg, { type: 'VENDOR_ORDER', orderId: order.id, status });
            }
        }
        res.json(order);
    }
    catch (error) {
        console.error('Error updating vendor order:', error);
        res.status(500).json({ message: 'Failed to update vendor order', error: error.message });
    }
};
exports.updateVendorOrderStatus = updateVendorOrderStatus;
