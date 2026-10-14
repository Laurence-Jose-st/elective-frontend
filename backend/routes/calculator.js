import express from 'express';
import { calculatorController } from '../controllers/calculatorController.js';

const router = express.Router();

// Public BMI and caloric guidelines endpoint (No JWT required)
router.post('/bmi', calculatorController.calculateBmi);

export default router;
