import express from 'express';
import { updateLocation, getOnlineRiders, getAllRiders, approveRider, assignBike, notifyNoBike, declineRider, getRiderAnalytics, getReconciliationReport, suspendRider, blockRider, liftSuspension } from '../controllers/userController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

// Update current user's location (Rider)
router.patch('/location', authenticate, updateLocation);

// Get all online riders (Customer/Admin)
router.get('/riders/online', authenticate, getOnlineRiders);

// Get all registered riders (Admin)
router.get('/riders', authenticate, getAllRiders);

// Get global COD reconciliation report (Admin)
router.get('/riders/reconciliation', authenticate, getReconciliationReport);

// Approve a rider (Admin)
router.patch('/riders/:id/approve', authenticate, approveRider);

// Decline a rider (Admin)
router.post('/riders/:id/decline', authenticate, declineRider);

// Assign a bike to a rider (Admin)
router.post('/riders/:id/assign-bike', authenticate, assignBike);

// Notify rider of no available bikes (Admin)
router.post('/riders/:id/notify-no-bike', authenticate, notifyNoBike);

// Get Rider Analytics (Admin)
router.get('/riders/:id/analytics', authenticate, getRiderAnalytics);

// Suspend a rider (Admin)
router.post('/riders/:id/suspend', authenticate, suspendRider);

// Block a rider (Admin)
router.post('/riders/:id/block', authenticate, blockRider);

// Lift Rider Suspension/Block (Admin)
router.post('/riders/:id/lift-suspension', authenticate, liftSuspension);

export default router;
