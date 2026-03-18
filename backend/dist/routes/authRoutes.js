"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and management
 */
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
console.log('[DEBUG] Cloudinary Config Initialization...');
console.log('[DEBUG] Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('[DEBUG] API Key present:', !!process.env.CLOUDINARY_API_KEY);
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: {
        folder: 'prestige_delivery_riders',
        public_id: (req, file) => `${Date.now()}-${file.originalname?.split('.')[0] || 'document'}`
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});
// Debug routes removed from here and moved to app.ts for higher visibility
const registerWithUpload = (req, res, next) => {
    console.log('[DEBUG] registerWithUpload: Request started');
    console.log('[DEBUG] Content-Type:', req.headers['content-type']);
    console.log('[DEBUG] Content-Length:', req.headers['content-length']);
    const uploadFields = upload.fields([{ name: 'passport', maxCount: 1 }, { name: 'ninSlip', maxCount: 1 }]);
    uploadFields(req, res, (err) => {
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
            const files = req.files;
            if (files['passport'])
                console.log('[DEBUG] Passport File detected:', files['passport'][0].originalname, 'size:', files['passport'][0].size);
            if (files['ninSlip'])
                console.log('[DEBUG] NIN Slip File detected:', files['ninSlip'][0].originalname, 'size:', files['ninSlip'][0].size);
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
router.post('/register', registerWithUpload, authController_1.register);
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
router.post('/login', authController_1.login);
router.post('/google', authController_1.googleAuth);
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
router.patch('/status', authMiddleware_1.authenticate, authController_1.updateStatus);
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
router.post('/push-token', authMiddleware_1.authenticate, authController_1.savePushToken);
router.post('/logout', authMiddleware_1.authenticate, authController_1.logout);
// Password Management
router.patch('/change-password', authMiddleware_1.authenticate, authController_1.changePassword);
router.post('/forgot-password', authController_1.forgotPassword);
router.post('/reset-password', authController_1.resetPassword);
exports.default = router;
