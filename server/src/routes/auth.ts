import { Router } from 'express';
import {
  register,
  login,
  getMe,
  changePassword,
  updateProfile,
  logout,
} from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new system account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: Lancelot du Lac
 *               email:
 *                 type: string
 *                 example: safety@transitops.com
 *               password:
 *                 type: string
 *                 example: Password@123
 *               role:
 *                 type: string
 *                 enum: [Fleet Manager, Dispatcher, Safety Officer, Financial Analyst]
 *                 example: Safety Officer
 *     responses:
 *       201:
 *         description: Account successfully registered
 *       400:
 *         description: Email duplicate or formatting invalid
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user credentials and issue session JWT
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: manager@transitops.com
 *               password:
 *                 type: string
 *                 example: Password@123
 *     responses:
 *       200:
 *         description: JWT issued successfully
 *       401:
 *         description: Invalid login email or password
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Invalidate user session
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Session terminated
 */
router.post('/logout', logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Retrieve currently logged-in user profile details
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information payload
 *       401:
 *         description: Unauthorized token missing
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /auth/change-password:
 *   put:
 *     summary: Update account password credentials
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Current password mismatch
 */
router.put('/change-password', protect, changePassword);

/**
 * @swagger
 * /auth/update-profile:
 *   put:
 *     summary: Modify user display details (name/avatar)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile details updated
 */
router.put('/update-profile', protect, updateProfile);

export default router;
