import express from 'express';
import { createPartner, getPartners, getArchivedPartners, restorePartner, getPublicPartners, addMenuItem, getMenuItems, getMyMenuItems, createVendorOrder, getVendorOrders, updateVendorOrderStatus, updatePartner, deletePartner } from '../controllers/partnerController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = express.Router();

// Only Admins can manage partners
router.post('/', authenticate, authorize(['ADMIN']), createPartner);
router.get('/', authenticate, authorize(['ADMIN']), getPartners);
router.get('/archived', authenticate, authorize(['ADMIN']), getArchivedPartners);
router.put('/:id', authenticate, authorize(['ADMIN']), updatePartner);
router.delete('/:id', authenticate, authorize(['ADMIN']), deletePartner);
router.post('/:id/restore', authenticate, authorize(['ADMIN']), restorePartner);

// Public Partners (for Customers to browse)
router.get('/public', authenticate, authorize(['CUSTOMER', 'ADMIN']), getPublicPartners);

// Menu Items
router.post('/menu', authenticate, authorize(['PARTNER']), addMenuItem);
router.get('/my-menu', authenticate, authorize(['PARTNER']), getMyMenuItems);
router.get('/menu/:partnerId', authenticate, getMenuItems); // Customers & Partners

// Vendor Orders
router.post('/orders', authenticate, authorize(['CUSTOMER']), createVendorOrder);
router.get('/orders', authenticate, authorize(['PARTNER']), getVendorOrders);
router.patch('/orders/:orderId/status', authenticate, authorize(['PARTNER']), updateVendorOrderStatus);

export default router;
