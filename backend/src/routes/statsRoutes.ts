import { Router } from 'express';
import { getDashboardStats } from '../controllers/statsController';
import { getFinanceStats } from '../controllers/financeController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/dashboard', authenticate, authorize([Role.ADMIN]), getDashboardStats);
router.get('/finances', authenticate, authorize([Role.ADMIN]), getFinanceStats);

export default router;
