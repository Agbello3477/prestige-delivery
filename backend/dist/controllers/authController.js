"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.savePushToken = exports.updateStatus = exports.login = exports.register = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../utils/auth");
const zod_1 = require("zod");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().min(2),
    role: zod_1.z.nativeEnum(client_1.Role).optional(),
    phone: zod_1.z.string().optional(),
    nin: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    stateOfOrigin: zod_1.z.string().optional(),
    isBikeOwner: zod_1.z.string().transform((val) => val === 'true').optional(), // Multipart sends booleans as strings
    plateNumber: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
const register = async (req, res) => {
    try {
        // Parse body
        const { email, password, name, role, phone, nin, address, stateOfOrigin, isBikeOwner, plateNumber } = registerSchema.parse(req.body);
        const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // Handle Files
        const files = req.files;
        const passportUrl = files?.['passport']?.[0]?.path;
        const ninSlipUrl = files?.['ninSlip']?.[0]?.path;
        const hashedPassword = await (0, auth_1.hashPassword)(password);
        const user = await prisma_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || client_1.Role.CUSTOMER,
                phone,
                nin,
                address,
                stateOfOrigin,
                isBikeOwner: isBikeOwner || false,
                passportUrl,
                ninSlipUrl,
            },
        });
        // If Rider and has vehicle info
        if (role === client_1.Role.RIDER && (isBikeOwner || plateNumber)) {
            if (plateNumber) {
                await prisma_1.default.vehicle.create({
                    data: {
                        type: 'BIKE',
                        plateNumber,
                        riderId: user.id
                    }
                });
            }
        }
        const token = (0, auth_1.generateToken)({ id: user.id, email: user.email, role: user.role });
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({ token, user: userWithoutPassword });
    }
    catch (error) {
        console.error('Registration error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: error.issues });
        }
        res.status(400).json({ message: 'Registration failed', error: error.message });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        console.log('Login attempt:', req.body);
        const { email, password } = loginSchema.parse(req.body);
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            console.log('User not found:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await (0, auth_1.comparePassword)(password, user.password);
        if (!isMatch) {
            console.log('Password mismatch for:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = (0, auth_1.generateToken)({ id: user.id, email: user.email, role: user.role });
        console.log('Login successful for:', email);
        const { password: _, ...userWithoutPassword } = user;
        res.json({ token, user: userWithoutPassword });
    }
    catch (error) {
        console.error('Login error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: error.issues[0].message, error: error.issues });
        }
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
};
exports.login = login;
const updateStatus = async (req, res) => {
    try {
        const { isOnline } = req.body;
        // @ts-ignore
        const userId = req.user.id;
        const user = await prisma_1.default.user.update({
            where: { id: userId },
            data: { isOnline }
        });
        res.json({ message: 'Status updated', isOnline: user.isOnline });
    }
    catch (error) {
        res.status(400).json({ message: 'Failed to update status', error: error.message });
    }
};
exports.updateStatus = updateStatus;
const savePushToken = async (req, res) => {
    try {
        const { token } = req.body;
        // @ts-ignore
        const userId = req.user.id;
        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }
        const user = await prisma_1.default.user.update({
            where: { id: userId },
            data: { pushToken: token }
        });
        res.json({ message: 'Push token saved', token: user.pushToken });
    }
    catch (error) {
        console.error('Save Push Token error:', error);
        res.status(500).json({ message: 'Failed to save push token', error: error.message });
    }
};
exports.savePushToken = savePushToken;
