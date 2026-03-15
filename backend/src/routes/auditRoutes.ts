import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', authenticate, authorize([Role.ADMIN]), getAuditLogs);

export default router;
