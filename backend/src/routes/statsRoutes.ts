import { Router } from 'express';
import { getDashboardStats } from '../controllers/statsController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/dashboard', authenticate, authorize([Role.ADMIN]), getDashboardStats);

export default router;
