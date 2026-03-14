import { Router } from 'express';
import { register, login } from '../controllers/authController';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and management
 */

import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';

type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

const storage = multer.diskStorage({
    destination: (req: Request, file: any, cb: DestinationCallback) => {
        cb(null, 'uploads/');
    },
    filename: (req: Request, file: any, cb: FileNameCallback) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

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
router.post('/register', authenticate, authorize([Role.ADMIN]), upload.fields([{ name: 'passport', maxCount: 1 }, { name: 'ninSlip', maxCount: 1 }]), register);

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
import { authenticate } from '../middleware/authMiddleware';
import { updateStatus, savePushToken } from '../controllers/authController';
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

export default router;
