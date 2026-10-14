import express from 'express';
import { workoutController } from '../controllers/workoutController.js';
import { verifyToken, verifyRole } from '../middleware/auth.js';

const router = express.Router();

router.use(verifyToken, verifyRole(['REGISTERED', 'ADMIN']));

router.get('/', workoutController.getWorkouts);
router.post('/', workoutController.logWorkout);
router.get('/exercises/search', workoutController.searchExercises);

// Session endpoints
router.get('/sessions/active', workoutController.getActiveSession);
router.post('/sessions/start', workoutController.startSession);
router.put('/sessions/:sessionId/complete', workoutController.completeSession);
router.delete('/sessions/:sessionId/cancel', workoutController.cancelSession);
router.post('/sessions/exercises', workoutController.addExerciseToSession);
router.post('/sessions', workoutController.saveSession);
router.get('/sessions/completed', workoutController.getCompletedSessions);
router.get('/progressive-overload', workoutController.getProgressiveOverload);

export default router;