import express from 'express';
import workoutRoutes from './workout.js';
import mealRoutes from './meal.js';
import authRoutes from './auth.js';
import calculatorRoutes from './calculator.js';
import { adminController } from '../controllers/adminController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.use('/workouts', workoutRoutes);
router.use('/meals', mealRoutes);
router.use('/auth', authRoutes);
router.use('/calculator', calculatorRoutes);

// User notifications (authenticated but not admin-only)
router.get('/notifications', verifyToken, adminController.getNotifications);
router.put('/notifications/:id/read', verifyToken, adminController.markNotificationRead);

export default router;
