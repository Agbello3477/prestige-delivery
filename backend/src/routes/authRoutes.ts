import { Router, Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();

import { register, login, updateStatus, savePushToken, logout, changePassword, forgotPassword, resetPassword, googleAuth } from '../controllers/authController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { Role } from '@prisma/client';
import prisma from '../lib/prisma';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and management
 */

import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

console.log('[DEBUG] Cloudinary Config Initialization...');
console.log('[DEBUG] Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('[DEBUG] API Key present:', !!process.env.CLOUDINARY_API_KEY);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'prestige_delivery_riders',
        public_id: (req: Request, file: Express.Multer.File) => `${Date.now()}-${file.originalname?.split('.')[0] || 'document'}`
    } as any,
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

// Debug routes removed from here and moved to app.ts for higher visibility

router.get('/debug/cloudinary-test', async (req: Request, res: Response) => {
    try {
        console.log('[DEBUG] Testing Cloudinary connection...');
        const result = await cloudinary.uploader.upload('https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png', {
            folder: 'prestige_test'
        });
        res.json({ success: true, url: result.secure_url, public_id: result.public_id });
    } catch (error: any) {
        console.error('[ERROR] Cloudinary Test Fail:', error);
        res.status(500).json({ success: false, error: error.message || error });
    }
});

const registerWithUpload = (req: Request, res: Response, next: any) => {
    console.log('[DEBUG] registerWithUpload: Request started');
    console.log('[DEBUG] Content-Type:', req.headers['content-type']);
    console.log('[DEBUG] Content-Length:', req.headers['content-length']);
    
    const uploadFields = upload.fields([{ name: 'passport', maxCount: 1 }, { name: 'ninSlip', maxCount: 1 }]);
    
    uploadFields(req, res, (err: any) => {
        if (err) {
            console.error('[ERROR] Multer/Cloudinary Upload Fail:', err);
            return res.status(500).json({ 
                message: 'Internal Server Error during file upload', 
                error: err.message || err 
            });
        }
        console.log('[DEBUG] Multer processed. Body fields:', Object.keys(req.body));
        console.log('[DEBUG] Received files fields:', req.files ? Object.keys(req.files) : 'NONE');
        
        if (req.files) {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            if (files['passport']) console.log('[DEBUG] Passport File detected:', files['passport'][0].originalname, 'size:', files['passport'][0].size);
            if (files['ninSlip']) console.log('[DEBUG] NIN Slip File detected:', files['ninSlip'][0].originalname, 'size:', files['ninSlip'][0].size);
        }
        next();
    });
};

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, RIDER, CUSTOMER]
 *               nin:
 *                 type: string
 *               address:
 *                 type: string
 *               stateOfOrigin:
 *                 type: string
 *               isBikeOwner:
 *                 type: boolean
 *               plateNumber:
 *                 type: string
 *               passport:
 *                 type: string
 *                 format: binary
 *               ninSlip:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: User already exists or validation error
 */
router.post('/register', registerWithUpload, register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login);
router.post('/google', googleAuth);

/**
 * @swagger
 * /auth/status:
 *   patch:
 *     summary: Update user online status
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isOnline
 *             properties:
 *               isOnline:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/status', authenticate, updateStatus);

/**
 * @swagger
 * /auth/push-token:
 *   post:
 *     summary: Save Expo Push Token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 */
router.post('/push-token', authenticate, savePushToken);
router.post('/logout', authenticate, logout);

// Password Management
router.patch('/change-password', authenticate, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
