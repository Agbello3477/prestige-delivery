import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import prisma from '../lib/prisma';
import { comparePassword, generateToken, hashPassword } from '../utils/auth';
import { logActivity } from '../services/auditService';
import { z } from 'zod';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.nativeEnum(Role).optional(),
    phone: z.string().optional(),
    nin: z.string().optional(),
    address: z.string().optional(),
    stateOfOrigin: z.string().optional(),
    isBikeOwner: z.string().transform((val) => val === 'true').optional(), // Multipart sends booleans as strings
    plateNumber: z.string().optional(),
});

const registerWithGenderSchema = registerSchema.extend({
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

const changePasswordSchema = z.object({
    oldPassword: z.string(),
    newPassword: z.string().min(6),
});

const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

const resetPasswordSchema = z.object({
    email: z.string().email(),
    token: z.string().length(6),
    newPassword: z.string().min(6),
});

export const register = async (req: Request, res: Response) => {
    console.log(`[DEBUG] Register request: ${req.method} ${req.url}`);
    console.log('[DEBUG] Content-Type:', req.headers['content-type']);
    console.log('[DEBUG] Body Keys:', Object.keys(req.body));
    console.log('[DEBUG] Files Object:', !!(req as any).files);
    if ((req as any).files) {
        console.log('[DEBUG] Files Fields:', Object.keys((req as any).files));
    }
    
    // Check Cloudinary Config Status
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    console.log('[DEBUG] Cloudinary Cloud Name set:', !!cloudName);
    try {
        // Parse body with fallback to empty object to get descriptive Zod errors
        const body = req.body || {};
        const parsedData = registerWithGenderSchema.parse(body);
        const { email, password, name, role, phone, nin, address, stateOfOrigin, isBikeOwner, plateNumber, gender } = parsedData;

        // Security: Prevent public ADMIN registration
        if (role === Role.ADMIN) {
            return res.status(403).json({ message: 'Unauthorized role assignment' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Handle Files
        const files = (req as any).files as { [fieldname: string]: any[] };
        console.log('[DEBUG] Files Object in Controller:', JSON.stringify(files, (key, value) => {
            if (key === 'buffer') return '[BUFFER]';
            if (key === 'stream') return '[STREAM]';
            return value;
        }, 2));
        
        const passportUrl = files?.['passport']?.[0]?.path;
        const ninSlipUrl = files?.['ninSlip']?.[0]?.path;
        
        console.log('[DEBUG] Resolved Passport URL:', passportUrl);
        console.log('[DEBUG] Resolved NIN Slip URL:', ninSlipUrl);

        // FAIL FAST: If Rider, ensure both images are present
        if (role === Role.RIDER) {
            if (!passportUrl || !ninSlipUrl) {
                console.error('[ERROR] Rider registration missing images:', { passport: !!passportUrl, nin: !!ninSlipUrl });
                return res.status(400).json({ 
                    message: 'Rider registration requires both Passport and NIN Slip photos.',
                    details: { passport: !!passportUrl, ninSlip: !!ninSlipUrl }
                });
            }
        }

        const hashedPassword = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || Role.CUSTOMER,
                phone,
                nin,
                address,
                stateOfOrigin,
                isBikeOwner: isBikeOwner || false,
                passportUrl,
                ninSlipUrl,
                gender: (gender as any) || null
            },
        });

        // If Rider and has vehicle info
        if (role === Role.RIDER && (isBikeOwner || plateNumber)) {
            if (plateNumber) {
                await prisma.vehicle.create({
                    data: {
                        type: 'BIKE',
                        plateNumber,
                        riderId: user.id
                    }
                });
            }
        }

        const token = generateToken({ id: user.id, email: user.email, role: user.role });
        const { password: _, ...userWithoutPassword } = user;

        await logActivity(user.id, 'USER_REGISTERED', { 
            role: user.role, 
            name: user.name,
            email: user.email,
            details: `New ${user.role.toLowerCase()} registration completed.`
        }, req.ip);

        res.status(201).json({ token, user: userWithoutPassword });
    } catch (error: any) {
        console.error('Registration error:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: error.issues });
        }
        res.status(400).json({ message: 'Registration failed', error: error.message });
    }
};

export const googleAuth = async (req: Request, res: Response) => {
    try {
        const { googleToken, role } = req.body;
        console.log('[DEBUG] Google Auth Skeleton Triggered:', { role });
        res.json({ message: 'Google Authentication logic initialized (Skeleton)', token: 'google_mock_token' });
    } catch (error: any) {
        res.status(500).json({ message: 'Google Auth failed', error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        console.log('Login attempt:', req.body);
        const { email, password } = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log('User not found:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            console.log('Password mismatch for:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateToken({ id: user.id, email: user.email, role: user.role });
        console.log('Login successful for:', email);
        const { password: _, ...userWithoutPassword } = user;

        await logActivity(user.id, 'LOGIN', { email: user.email }, req.ip);

        res.json({ token, user: userWithoutPassword });
    } catch (error: any) {
        console.error('Login error:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: error.issues[0].message, error: error.issues });
        }
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
};

export const updateStatus = async (req: Request, res: Response) => {
    try {
        const { isOnline } = req.body;
        // @ts-ignore
        const userId = req.user.id;

        const user = await prisma.user.update({
            where: { id: userId },
            data: { isOnline }
        });

        res.json({ message: 'Status updated', isOnline: user.isOnline });
    } catch (error: any) {
        res.status(400).json({ message: 'Failed to update status', error: error.message });
    }
};

export const savePushToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        // @ts-ignore
        const userId = req.user.id;

        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: { pushToken: token }
        });

        res.json({ message: 'Push token saved', token: user.pushToken });
    } catch (error: any) {
        console.error('Save Push Token error:', error);
        res.status(500).json({ message: 'Failed to save push token', error: error.message });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        await logActivity(userId, 'LOGOUT', {}, req.ip);
        res.json({ message: 'Logged out successfully' });
    } catch (error: any) {
        res.status(500).json({ message: 'Logout failed' });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const { oldPassword, newPassword } = changePasswordSchema.parse(req.body);
        const userId = (req as any).user.id;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await comparePassword(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });

        const hashed = await hashPassword(newPassword);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashed }
        });

        await logActivity(userId, 'PASSWORD_CHANGED', {}, req.ip);
        res.json({ message: 'Password updated successfully' });
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ message: error.issues[0].message });
        res.status(500).json({ message: 'Failed to change password', error: error.message });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // Security: don't reveal if user exists, but for debugging/admin we might.
            // For now, let's keep it friendly for the user.
            return res.status(404).json({ message: 'No account found with this email' });
        }

        // Generate 6-digit PIN
        const token = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken: token, resetTokenExpiry: expiry }
        });

        // In a real app, send email here. For this demo, we log it.
        console.log(`RESET TOKEN FOR ${email}: ${token}`);
        await logActivity(user.id, 'PASSWORD_RESET_REQUESTED', { token_sent: 'true' }, req.ip);

        res.json({ message: 'A reset code has been sent to your email (check console logs for now)' });
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ message: error.issues[0].message });
        res.status(500).json({ message: 'Failed to process request', error: error.message });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, token, newPassword } = resetPasswordSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.resetToken !== token || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired reset code' });
        }

        const hashed = await hashPassword(newPassword);
        await prisma.user.update({
            where: { id: user.id },
            data: { 
                password: hashed,
                resetToken: null,
                resetTokenExpiry: null
            } as any
        });

        await logActivity(user.id, 'PASSWORD_RESET_COMPLETED', {}, req.ip);
        res.json({ message: 'Password reset successfully. You can now login with your new password.' });
    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ message: error.issues[0].message });
        res.status(500).json({ message: 'Failed to reset password', error: error.message });
    }
};
