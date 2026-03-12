import express from 'express';
import { createDelivery, getMyDeliveries, getDeliveryById, getPendingDeliveries, updateDeliveryStatus, updateDeliveryLocation, getAllDeliveries, rateDelivery, cancelDelivery } from '../controllers/deliveryController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Deliveries
 *   description: Delivery management
 */

/**
 * @swagger
 * /deliveries/all:
 *   get:
 *     summary: Get all deliveries (Admin only)
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all deliveries
 *       403:
 *         description: Forbidden
 */
router.get('/all', authenticate, getAllDeliveries);

/**
 * @swagger
 * /deliveries/pending:
 *   post:
 *     summary: Create a new delivery
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pickupAddress
 *               - dropoffAddress
 *               - pickupLat
 *               - pickupLng
 *               - dropoffLat
 *               - dropoffLng
 *             properties:
 *               pickupAddress:
 *                 type: string
 *               dropoffAddress:
 *                 type: string
 *               pickupLat:
 *                 type: number
 *               pickupLng:
 *                 type: number
 *               dropoffLat:
 *                 type: number
 *               dropoffLng:
 *                 type: number
 *     responses:
 *       201:
 *         description: Delivery created successfully
 *       400:
 *         description: Validation error or out of service area
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, createDelivery);

/**
 * @swagger
 * /deliveries/pending:
 *   get:
 *     summary: Get valid pending deliveries
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending deliveries
 */
router.get('/pending', authenticate, getPendingDeliveries);

/**
 * @swagger
 * /deliveries/my-deliveries:
 *   get:
 *     summary: Get user's deliveries
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of deliveries
 *       401:
 *         description: Unauthorized
 */
router.get('/my-deliveries', authenticate, getMyDeliveries);

/**
 * @swagger
 * /deliveries/{id}:
 *   get:
 *     summary: Get delivery by ID
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Delivery details
 *       404:
 *         description: Not found
 */
router.get('/:id', authenticate, getDeliveryById);

/**
 * @swagger
 * /deliveries/{id}/status:
 *   patch:
 *     summary: Update delivery status
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, ACCEPTED, PICKED_UP, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Delivery updated
 */
import { upload } from '../middleware/upload';

// ...

// Update status with optional proof file
router.patch('/:id/status', authenticate, upload.fields([{ name: 'proof', maxCount: 1 }]), updateDeliveryStatus);

/**
 * @swagger
 * /deliveries/{id}/location:
 *   patch:
 *     summary: Update delivery location (Rider only)
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lat
 *               - lng
 *             properties:
 *               lat:
 *                 type: number
 *               lng:
 *                 type: number
 *     responses:
 *       200:
 *         description: Location updated
 */
router.patch('/:id/location', authenticate, updateDeliveryLocation);

// Cancel a pending delivery (Customer only)
router.post('/:id/cancel', authenticate, cancelDelivery);

export default router;
