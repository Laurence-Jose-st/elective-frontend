import prisma from '../lib/prisma.js';
import { randomUUID } from 'crypto';

export const workoutController = {
  /**
   * Get all workout logs for the authenticated user
   */
  async getWorkouts(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const workouts = await prisma.workout_logs.findMany({
        where: { user_id: userId }
      });
      res.json(workouts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Log a new workout
   */
  async logWorkout(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const workout = await prisma.workout_logs.create({
        data: {
          ...req.body,
          user_id: userId
        }
      });
      res.status(201).json(workout);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Search exercises from the exercises table
   */
  async searchExercises(req, res) {
    try {
      const { query } = req.query;

      if (!query) {
        res.status(400).json({ success: false, error: 'Query parameter is required' });
        return;
      }

      const exercises = await prisma.exercises.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { body_part: { contains: query, mode: 'insensitive' } },
            { target: { contains: query, mode: 'insensitive' } },
            { equipment: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 20
      });

      res.json({ success: true, data: exercises });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get active workout session for the user
   */
  async getActiveSession(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      // Find sessions where notes contains the user ID
      const allSessions = await prisma.workout_sessions.findMany({
        where: {
          status: 'in_progress'
        },
        include: {
          session_exercises: {
            include: {
              exercises: true,
              workout_sets: true
            },
            orderBy: {
              order_in_session: 'asc'
            }
          }
        }
      });

      // Filter sessions where notes contains the user ID
      const session = allSessions.find(s => {
        try {
          const notes = JSON.parse(s.notes || '{}');
          return notes.userId === userId;
        } catch {
          return false;
        }
      });

      res.json({ success: true, data: session || null });
    } catch (error) {
      console.error('Error getting active session:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Start a new workout session
   */
  async startSession(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { name } = req.body;

      console.log('Starting session for user:', userId);

      // Generate a proper UUID for the session
      // We'll store the actual user_id in the session name or notes for reference
      const sessionUUID = randomUUID();

      const session = await prisma.workout_sessions.create({
        data: {
          user_id: sessionUUID,
          name: name || 'Workout Session',
          status: 'in_progress',
          start_time: new Date(),
          notes: JSON.stringify({ userId }) // Store actual user ID in notes
        }
      });

      res.status(201).json({ success: true, data: session });
    } catch (error) {
      console.error('Error starting session:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Cancel a workout session
   */
  async cancelSession(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { sessionId } = req.params;

      // Get session to verify ownership
      const session = await prisma.workout_sessions.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        res.status(404).json({ success: false, error: 'Session not found' });
        return;
      }

      // Verify session belongs to user by checking notes
      try {
        const notes = JSON.parse(session.notes || '{}');
        if (notes.userId !== userId) {
          res.status(403).json({ success: false, error: 'Session does not belong to user' });
          return;
        }
      } catch {
        res.status(403).json({ success: false, error: 'Invalid session data' });
        return;
      }

      // Delete the session (cascade delete will handle session_exercises and workout_sets)
      await prisma.workout_sessions.delete({
        where: { id: sessionId }
      });

      res.json({ success: true, message: 'Session cancelled' });
    } catch (error) {
      console.error('Error canceling session:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Complete a workout session
   */
  async completeSession(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { sessionId } = req.params;

      // Get current session to calculate duration
      const currentSession = await prisma.workout_sessions.findUnique({
        where: { id: sessionId },
        include: {
          session_exercises: {
            include: {
              exercises: true,
              workout_sets: true
            }
          }
        }
      });

      if (!currentSession) {
        res.status(404).json({ success: false, error: 'Session not found' });
        return;
      }

      const durationSeconds = Math.floor((new Date().getTime() - new Date(currentSession.start_time).getTime()) / 1000);

      // Log all exercises to workout_logs when session is completed
      for (const sessionExercise of currentSession.session_exercises) {
        if (sessionExercise.workout_sets && sessionExercise.workout_sets.length > 0) {
          const firstSet = sessionExercise.workout_sets[0];
          const totalDuration = sessionExercise.workout_sets.reduce((sum, set) => sum + (set.duration || 0), 0);
          const numberOfSets = sessionExercise.workout_sets.length;

          await prisma.workout_logs.create({
            data: {
              user_id: parseInt(userId),
              exercise_name: sessionExercise.exercises.name,
              reps: firstSet.reps,
              weight: firstSet.weight,
              duration: totalDuration,
              sets: numberOfSets
            }
          });
        }
      }

      const session = await prisma.workout_sessions.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          end_time: new Date(),
          duration_seconds: durationSeconds
        }
      });

      res.json({ success: true, data: session });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Add exercise to current session
   */
  async addExerciseToSession(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { sessionId, exerciseId, sets, reps, weight, duration } = req.body;

      console.log('Adding exercise to session:', { sessionId, exerciseId, sets, reps, weight, duration, userId });

      // Get session to verify ownership
      const session = await prisma.workout_sessions.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        res.status(404).json({ success: false, error: 'Session not found' });
        return;
      }

      // Verify session belongs to user by checking notes
      try {
        const notes = JSON.parse(session.notes || '{}');
        if (notes.userId !== userId) {
          res.status(403).json({ success: false, error: 'Session does not belong to user' });
          return;
        }
      } catch {
        res.status(403).json({ success: false, error: 'Invalid session data' });
        return;
      }

      // Get current max order in session
      const currentMax = await prisma.session_exercises.findFirst({
        where: { session_id: sessionId },
        orderBy: { order_in_session: 'desc' }
      });

      const nextOrder = (currentMax?.order_in_session || 0) + 1;

      // Add session exercise
      const sessionExercise = await prisma.session_exercises.create({
        data: {
          session_id: sessionId,
          exercise_id: exerciseId,
          order_in_session: nextOrder
        }
      });

      // Add workout sets
      for (let i = 0; i < sets; i++) {
        await prisma.workout_sets.create({
          data: {
            session_exercise_id: sessionExercise.id,
            session_id: sessionId,
            user_id: session.user_id,
            exercise_id: exerciseId,
            set_number: i + 1,
            weight: weight,
            reps: reps
          }
        });
      }

      res.status(201).json({ success: true, data: sessionExercise });
    } catch (error) {
      console.error('Error adding exercise to session:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
