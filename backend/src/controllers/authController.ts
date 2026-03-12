import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import prisma from '../lib/prisma';
import { generateToken, hashPassword, comparePassword } from '../utils/auth';
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

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const register = async (req: Request, res: Response) => {
    try {
        // Parse body
        const { email, password, name, role, phone, nin, address, stateOfOrigin, isBikeOwner, plateNumber } = registerSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Handle Files
        const files = (req as any).files as { [fieldname: string]: any[] };
        const passportUrl = files?.['passport']?.[0]?.path;
        const ninSlipUrl = files?.['ninSlip']?.[0]?.path;

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
        res.status(201).json({ token, user: userWithoutPassword });
    } catch (error: any) {
        console.error('Registration error:', error);
        if (error instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation failed', errors: error.issues });
        }
        res.status(400).json({ message: 'Registration failed', error: error.message });
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
