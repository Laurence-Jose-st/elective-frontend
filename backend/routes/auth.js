import express from 'express';
import { authController } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', verifyToken, authController.getMe);
router.put('/profile', verifyToken, authController.updateProfile);

export default router;