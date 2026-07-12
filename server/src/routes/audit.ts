import { Router } from 'express';
import { protect, authorizeRoles } from '../middlewares/authMiddleware';
import { getAuditLogs } from '../controllers/auditController';

const router = Router();

router.get('/', protect, authorizeRoles('Fleet Manager', 'Safety Officer'), getAuditLogs);

export default router;
