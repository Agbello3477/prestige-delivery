"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const partnerController_1 = require("../controllers/partnerController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Only Admins can manage partners
router.post('/', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['ADMIN']), partnerController_1.createPartner);
router.get('/', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['ADMIN']), partnerController_1.getPartners);
router.put('/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['ADMIN']), partnerController_1.updatePartner);
router.delete('/:id', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['ADMIN']), partnerController_1.deletePartner);
// Public Partners (for Customers to browse)
router.get('/public', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['CUSTOMER', 'ADMIN']), partnerController_1.getPublicPartners);
// Menu Items
router.post('/menu', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['PARTNER']), partnerController_1.addMenuItem);
router.get('/my-menu', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['PARTNER']), partnerController_1.getMyMenuItems);
router.get('/menu/:partnerId', authMiddleware_1.authenticate, partnerController_1.getMenuItems); // Customers & Partners
// Vendor Orders
router.post('/orders', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['CUSTOMER']), partnerController_1.createVendorOrder);
router.get('/orders', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['PARTNER']), partnerController_1.getVendorOrders);
router.patch('/orders/:orderId/status', authMiddleware_1.authenticate, (0, authMiddleware_1.authorize)(['PARTNER']), partnerController_1.updateVendorOrderStatus);
exports.default = router;
