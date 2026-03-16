import { Router, Request, Response } from 'express';
import dotenv from 'dotenv';
dotenv.config();

import { register, login, updateStatus, savePushToken, logout, changePassword, forgotPassword, resetPassword } from '../controllers/authController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { Role } from '@prisma/client';

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
        allowed_formats: ['jpg', 'png', 'jpeg'],
        public_id: (req: Request, file: Express.Multer.File) => `${Date.now()}-${file.originalname?.split('.')[0] || 'document'}`
    } as any,
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

const registerWithUpload = (req: Request, res: Response, next: any) => {
    console.log('[DEBUG] registerWithUpload: Request started');
    console.log('[DEBUG] Content-Type:', req.headers['content-type']);
    
    const uploadFields = upload.fields([{ name: 'passport', maxCount: 1 }, { name: 'ninSlip', maxCount: 1 }]);
    
    uploadFields(req, res, (err: any) => {
        if (err) {
            console.error('[ERROR] Multer/Cloudinary Upload Fail:', err);
            return res.status(500).json({ 
                message: 'Internal Server Error during file upload', 
                error: err.message || err 
            });
        }
        console.log('[DEBUG] registerWithUpload: Files uploaded successfully');
        if (req.files) {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            console.log('[DEBUG] Passport File:', !!files['passport']);
            console.log('[DEBUG] NIN Slip File:', !!files['ninSlip']);
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
