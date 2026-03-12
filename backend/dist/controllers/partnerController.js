"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVendorOrderStatus = exports.getVendorOrders = exports.createVendorOrder = exports.getMenuItems = exports.addMenuItem = exports.getPartners = exports.createPartner = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("@prisma/client");
const auth_1 = require("../utils/auth");
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
        const { partnerId } = req.params;
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
// ==========================================
// VENDOR ORDERS
// ==========================================
const createVendorOrder = async (req, res) => {
    try {
        const customerId = req.user.id;
        const { partnerId, items, prescriptionUrl, totalAmount } = req.body;
        const order = await prisma_1.default.vendorOrder.create({
            data: {
                partnerId: parseInt(partnerId),
                customerId,
                items,
                prescriptionUrl,
                totalAmount: totalAmount.toString(),
            }
        });
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
            data: { status }
        });
        // Trigger socket/notification logic here if necessary
        // e.g., if (status === 'READY_FOR_PICKUP') -> Auto-create a Delivery mapping!
        res.json(order);
    }
    catch (error) {
        console.error('Error updating vendor order:', error);
        res.status(500).json({ message: 'Failed to update vendor order', error: error.message });
    }
};
exports.updateVendorOrderStatus = updateVendorOrderStatus;
