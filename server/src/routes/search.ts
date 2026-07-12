import { Router } from 'express';
import { protect } from '../middlewares/authMiddleware';
import { globalSearch } from '../controllers/searchController';

const router = Router();

router.get('/', protect, globalSearch);

export default router;
