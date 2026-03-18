"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.changePassword = exports.logout = exports.savePushToken = exports.updateStatus = exports.login = exports.googleAuth = exports.register = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../utils/auth");
const auditService_1 = require("../services/auditService");
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
    guarantorName: zod_1.z.string().optional(),
    guarantorPhone: zod_1.z.string().optional(),
    guarantorAddress: zod_1.z.string().optional(),
    guarantorRelationship: zod_1.z.string().optional(),
    guarantorNin: zod_1.z.string().optional(),
    bankName: zod_1.z.string().optional(),
    accountName: zod_1.z.string().optional(),
    accountNumber: zod_1.z.string().optional(),
});
const registerWithGenderSchema = registerSchema.extend({
    gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
const changePasswordSchema = zod_1.z.object({
    oldPassword: zod_1.z.string(),
    newPassword: zod_1.z.string().min(6),
});
const forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
const resetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    token: zod_1.z.string().length(6),
    newPassword: zod_1.z.string().min(6),
});
const register = async (req, res) => {
    console.log(`[DEBUG] Register request: ${req.method} ${req.url}`);
    console.log('[DEBUG] Content-Type:', req.headers['content-type']);
    console.log('[DEBUG] Body Keys:', Object.keys(req.body));
    console.log('[DEBUG] Files Object:', !!req.files);
    if (req.files) {
        console.log('[DEBUG] Files Fields:', Object.keys(req.files));
    }
    // Check Cloudinary Config Status
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    console.log('[DEBUG] Cloudinary Cloud Name set:', !!cloudName);
    try {
        // Parse body with fallback to empty object to get descriptive Zod errors
        const body = req.body || {};
        const parsedData = registerWithGenderSchema.parse(body);
        const { email, password, name, role, phone, nin, address, stateOfOrigin, isBikeOwner, plateNumber, gender, guarantorName, guarantorPhone, guarantorAddress, guarantorRelationship, guarantorNin, bankName, accountName, accountNumber } = parsedData;
        // Security: Prevent public ADMIN registration
        if (role === client_1.Role.ADMIN) {
            return res.status(403).json({ message: 'Unauthorized role assignment' });
        }
        const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const files = req.files;
        console.log('[DEBUG] Files status:', {
            hasPassport: !!files?.['passport']?.[0],
            hasNinSlip: !!files?.['ninSlip']?.[0],
            passportDetails: files?.['passport']?.[0] ? {
                path: files['passport'][0].path,
                size: files['passport'][0].size,
                mimetype: files['passport'][0].mimetype
            } : 'Missing',
            ninDetails: files?.['ninSlip']?.[0] ? {
                path: files['ninSlip'][0].path,
                size: files['ninSlip'][0].size,
                mimetype: files['ninSlip'][0].mimetype
            } : 'Missing'
        });
        const passportUrl = files?.['passport']?.[0]?.path;
        const ninSlipUrl = files?.['ninSlip']?.[0]?.path;
        console.log('[DEBUG] Resolved Passport URL:', passportUrl);
        console.log('[DEBUG] Resolved NIN Slip URL:', ninSlipUrl);
        // FAIL FAST: If Rider, ensure both images are present
        if (role === client_1.Role.RIDER) {
            if (!passportUrl || !ninSlipUrl) {
                console.error('[ERROR] Rider registration missing images:', { passport: !!passportUrl, nin: !!ninSlipUrl });
                return res.status(400).json({
                    message: 'Rider registration requires both Passport and NIN Slip photos.',
                    details: { passport: !!passportUrl, ninSlip: !!ninSlipUrl }
                });
            }
        }
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
                gender: gender || null,
                guarantor: (role === client_1.Role.RIDER && guarantorName) ? {
                    create: {
                        name: guarantorName,
                        phone: guarantorPhone,
                        address: guarantorAddress,
                        relationship: guarantorRelationship,
                        nin: guarantorNin
                    }
                } : undefined,
                bankName,
                accountName,
                accountNumber
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
        await (0, auditService_1.logActivity)(user.id, 'USER_REGISTERED', {
            role: user.role,
            name: user.name,
            email: user.email,
            details: `New ${user.role.toLowerCase()} registration completed.`
        }, req.ip);
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
const googleAuth = async (req, res) => {
    try {
        const { googleToken, role } = req.body;
        console.log('[DEBUG] Google Auth Skeleton Triggered:', { role });
        res.json({ message: 'Google Authentication logic initialized (Skeleton)', token: 'google_mock_token' });
    }
    catch (error) {
        res.status(500).json({ message: 'Google Auth failed', error: error.message });
    }
};
exports.googleAuth = googleAuth;
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
        await (0, auditService_1.logActivity)(user.id, 'LOGIN', { email: user.email }, req.ip);
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
const logout = async (req, res) => {
    try {
        const userId = req.user.id;
        await (0, auditService_1.logActivity)(userId, 'LOGOUT', {}, req.ip);
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Logout failed' });
    }
};
exports.logout = logout;
const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);
        const userId = req.user.id;
        const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const isMatch = await (0, auth_1.comparePassword)(oldPassword, user.password);
        if (!isMatch)
            return res.status(400).json({ message: 'Incorrect current password' });
        const hashed = await (0, auth_1.hashPassword)(newPassword);
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { password: hashed }
        });
        await (0, auditService_1.logActivity)(userId, 'PASSWORD_CHANGED', {}, req.ip);
        res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ message: error.issues[0].message });
        res.status(500).json({ message: 'Failed to change password', error: error.message });
    }
};
exports.changePassword = changePassword;
const forgotPassword = async (req, res) => {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            // Security: don't reveal if user exists, but for debugging/admin we might.
            // For now, let's keep it friendly for the user.
            return res.status(404).json({ message: 'No account found with this email' });
        }
        // Generate 6-digit PIN
        const token = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: { resetToken: token, resetTokenExpiry: expiry }
        });
        // In a real app, send email here. For this demo, we log it.
        console.log(`RESET TOKEN FOR ${email}: ${token}`);
        await (0, auditService_1.logActivity)(user.id, 'PASSWORD_RESET_REQUESTED', { token_sent: 'true' }, req.ip);
        res.json({ message: 'A reset code has been sent to your email (check console logs for now)' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ message: error.issues[0].message });
        res.status(500).json({ message: 'Failed to process request', error: error.message });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    try {
        const { email, token, newPassword } = resetPasswordSchema.parse(req.body);
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user || user.resetToken !== token || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired reset code' });
        }
        const hashed = await (0, auth_1.hashPassword)(newPassword);
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                password: hashed,
                resetToken: null,
                resetTokenExpiry: null
            }
        });
        await (0, auditService_1.logActivity)(user.id, 'PASSWORD_RESET_COMPLETED', {}, req.ip);
        res.json({ message: 'Password reset successfully. You can now login with your new password.' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError)
            return res.status(400).json({ message: error.issues[0].message });
        res.status(500).json({ message: 'Failed to reset password', error: error.message });
    }
};
exports.resetPassword = resetPassword;
