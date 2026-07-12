import { Router } from 'express';
import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController';
import { protect, authorizeRoles } from '../middlewares/authMiddleware';

const router = Router();

// Read access is open to all authenticated roles
router.get('/', protect, getExpenses);
router.get('/:id', protect, getExpenseById);

// Writes are restricted to Fleet Managers and Financial Analysts only
router.post('/', protect, authorizeRoles('Fleet Manager', 'Financial Analyst'), createExpense);
router.put('/:id', protect, authorizeRoles('Fleet Manager', 'Financial Analyst'), updateExpense);
router.delete('/:id', protect, authorizeRoles('Fleet Manager', 'Financial Analyst'), deleteExpense);

export default router;
