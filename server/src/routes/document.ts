import { Router } from 'express';
import { protect, authorizeRoles } from '../middlewares/authMiddleware';
import { getDocuments, uploadDocument, deleteDocument } from '../controllers/documentController';

const router = Router();

router.use(protect);

router.get('/', getDocuments);
router.post('/', authorizeRoles('Fleet Manager', 'Safety Officer'), uploadDocument);
router.delete('/:id', authorizeRoles('Fleet Manager', 'Safety Officer'), deleteDocument);

export default router;
