"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Update current user's location (Rider)
router.patch('/location', authMiddleware_1.authenticate, userController_1.updateLocation);
// Get all online riders (Customer/Admin)
router.get('/riders/online', authMiddleware_1.authenticate, userController_1.getOnlineRiders);
// Get all registered riders (Admin)
router.get('/riders', authMiddleware_1.authenticate, userController_1.getAllRiders);
// Get all registered customers (Admin)
router.get('/customers', authMiddleware_1.authenticate, userController_1.getAllCustomers);
// Get global COD reconciliation report (Admin)
router.get('/riders/reconciliation', authMiddleware_1.authenticate, userController_1.getReconciliationReport);
// Clear Rider COD (Admin)
router.post('/riders/:id/clear-cod', authMiddleware_1.authenticate, userController_1.settleRiderCOD);
// Approve a rider (Admin)
router.patch('/riders/:id/approve', authMiddleware_1.authenticate, userController_1.approveRider);
// Decline a rider (Admin)
router.post('/riders/:id/decline', authMiddleware_1.authenticate, userController_1.declineRider);
// Assign a bike to a rider (Admin)
router.post('/riders/:id/assign-bike', authMiddleware_1.authenticate, userController_1.assignBike);
// Notify rider of no available bikes (Admin)
router.post('/riders/:id/notify-no-bike', authMiddleware_1.authenticate, userController_1.notifyNoBike);
// Get Rider Analytics (Admin)
router.get('/riders/:id/analytics', authMiddleware_1.authenticate, userController_1.getRiderAnalytics);
// Suspend a user (Admin)
router.post('/riders/:id/suspend', authMiddleware_1.authenticate, userController_1.suspendUser);
// Block a user (Admin)
router.post('/riders/:id/block', authMiddleware_1.authenticate, userController_1.blockUser);
// Lift User Suspension/Block (Admin)
router.post('/:id/lift-suspension', authMiddleware_1.authenticate, userController_1.liftSuspension);
// Customer specific routes (Admin)
router.post('/customers/:id/suspend', authMiddleware_1.authenticate, userController_1.suspendUser);
router.post('/customers/:id/block', authMiddleware_1.authenticate, userController_1.blockUser);
router.post('/customers/:id/lift-suspension', authMiddleware_1.authenticate, userController_1.liftSuspension);
exports.default = router;
