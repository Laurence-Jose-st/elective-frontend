import express from 'express';
import workoutRoutes from './workout.js';
import mealRoutes from './meal.js';
import authRoutes from './auth.js';


const router = express.Router();

router.use('/workouts', workoutRoutes);
router.use('/meals', mealRoutes);
router.use('/auth', authRoutes);

export default router;
