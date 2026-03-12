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
exports.default = router;
