import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin-only routes
router.use(verifyToken);
router.use(verifyAdmin);

// User Management
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/flag', adminController.toggleUserFlag);
router.delete('/users/:id', adminController.deleteUser);

// Broadcast Messaging
router.post('/broadcast', adminController.sendBroadcast);

// Database Management
router.post('/food', adminController.addFoodItem);
router.post('/exercises', adminController.addExercise);

export default router;
