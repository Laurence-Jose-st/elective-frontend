import express from 'express';
import { mealController } from '../controllers/mealController.js';
import { verifyToken, verifyRole } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken, verifyRole(['REGISTERED', 'ADMIN']));

router.get('/food/search', mealController.searchFoodItems);
router.post('/', mealController.logMeal);
router.get('/', mealController.getMeals);
router.get('/history', mealController.getHistory);
router.get('/daily-summary', mealController.getDailySummary);
router.delete('/:id', mealController.deleteMeal);
router.put('/:id', mealController.updateMeal);

export default router;