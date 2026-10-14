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

  /**
   * Save a complete workout session with all exercises and sets
   */
  async saveSession(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { name, durationMinutes, weightUnit, notes, exercises } = req.body;

      console.log('Saving session:', { name, durationMinutes, weightUnit, notes, exercisesCount: exercises?.length });

      // Generate session UUID
      const sessionUUID = randomUUID();

      // Create session
      const session = await prisma.workout_sessions.create({
        data: {
          user_id: sessionUUID,
          name: name || 'Workout Session',
          status: 'completed',
          start_time: new Date(),
          end_time: new Date(),
          duration_seconds: durationMinutes * 60,
          notes: JSON.stringify({ userId, sessionNotes: notes, weightUnit })
        }
      });

      // Process each exercise
      for (const exercise of exercises) {
        // Find or create exercise in database
        let exerciseRecord = await prisma.exercises.findFirst({
          where: { name: { equals: exercise.exerciseName, mode: 'insensitive' } }
        });

        if (!exerciseRecord) {
          // Create custom exercise with generated UUID
          exerciseRecord = await prisma.exercises.create({
            data: {
              id: randomUUID(),
              name: exercise.exerciseName,
              body_part: exercise.bodyPart || 'custom',
              target: exercise.target || 'custom',
              equipment: exercise.equipment || 'custom',
              gif_url: ''
            }
          });
        }

        // Create session exercise
        const sessionExercise = await prisma.session_exercises.create({
          data: {
            session_id: session.id,
            exercise_id: exerciseRecord.id,
            order_in_session: exercises.indexOf(exercise) + 1
          }
        });

        // Create workout sets
        for (const set of exercise.sets) {
          await prisma.workout_sets.create({
            data: {
              session_exercise_id: sessionExercise.id,
              session_id: session.id,
              user_id: sessionUUID,
              exercise_id: exerciseRecord.id,
              set_number: set.setNumber,
              weight: set.weight,
              reps: set.reps,
              is_warmup: set.isWarmup || false
            }
          });
        }

        // Log to workout_logs for history
        if (exercise.sets && exercise.sets.length > 0) {
          const firstSet = exercise.sets[0];
          const avgWeight = exercise.sets.reduce((sum, s) => sum + s.weight, 0) / exercise.sets.length;
          const avgReps = exercise.sets.reduce((sum, s) => sum + s.reps, 0) / exercise.sets.length;

          await prisma.workout_logs.create({
            data: {
              user_id: parseInt(userId),
              exercise_name: exercise.exerciseName,
              reps: Math.round(avgReps),
              weight: Math.round(avgWeight),
              duration: durationMinutes,
              sets: exercise.sets.length
            }
          });
        }
      }

      res.status(201).json({ success: true, data: session });
    } catch (error) {
      console.error('Error saving session:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get completed workout sessions for history
   */
  async getCompletedSessions(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const allSessions = await prisma.workout_sessions.findMany({
        where: {
          status: 'completed'
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
        },
        orderBy: {
          start_time: 'desc'
        }
      });

      // Filter sessions where notes contains the user ID
      const sessions = allSessions.filter(s => {
        try {
          const notes = JSON.parse(s.notes || '{}');
          return notes.userId === userId;
        } catch {
          return false;
        }
      });

      res.json({ success: true, data: sessions });
    } catch (error) {
      console.error('Error getting completed sessions:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get progressive overload data for exercises
   */
  async getProgressiveOverload(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { exerciseName } = req.query;

      // Get workout logs for this exercise or all exercises
      const logs = await prisma.workout_logs.findMany({
        where: {
          user_id: parseInt(userId),
          ...(exerciseName && exerciseName !== 'all' && { exercise_name: { contains: exerciseName, mode: 'insensitive' } })
        },
        orderBy: {
          created_at: 'desc'
        },
        take: 50
      });

      // Group by exercise name for "All Exercises" view
      const exerciseGroups = {};
      logs.forEach(log => {
        if (!exerciseGroups[log.exercise_name]) {
          exerciseGroups[log.exercise_name] = [];
        }
        exerciseGroups[log.exercise_name].push(log);
      });

      // Calculate metrics and improvements
      const metrics = logs.map(log => ({
        date: log.created_at,
        exerciseName: log.exercise_name,
        weight: log.weight,
        reps: log.reps,
        sets: log.sets,
        volume: log.weight * log.reps * log.sets
      }));

      // Calculate improvements (only for specific exercise or per exercise)
      const improvements = [];
      if (exerciseName && exerciseName !== 'all') {
        for (let i = 0; i < metrics.length - 1; i++) {
          const current = metrics[i];
          const previous = metrics[i + 1];
          improvements.push({
            date: current.date,
            exerciseName: current.exerciseName,
            weightChange: current.weight - previous.weight,
            volumeChange: current.volume - previous.volume,
            repsChange: current.reps - previous.reps
          });
        }
      } else {
        // For "All Exercises", calculate improvements per exercise
        Object.keys(exerciseGroups).forEach(exName => {
          const exLogs = exerciseGroups[exName];
          for (let i = 0; i < exLogs.length - 1; i++) {
            const current = exLogs[i];
            const previous = exLogs[i + 1];
            improvements.push({
              date: current.created_at,
              exerciseName: exName,
              weightChange: current.weight - previous.weight,
              volumeChange: (current.weight * current.reps * current.sets) - (previous.weight * previous.reps * previous.sets),
              repsChange: current.reps - previous.reps
            });
          }
        });
      }

      // Calculate current PR
      let currentPR = null;
      if (exerciseName && exerciseName !== 'all') {
        // For specific exercise, get the PR
        if (metrics.length > 0) {
          currentPR = metrics[0];
        }
      } else {
        // For "All Exercises", find the overall max weight
        let maxWeight = 0;
        let maxVolume = 0;
        let maxExercise = '';
        let maxReps = 0;
        let maxSets = 0;

        Object.keys(exerciseGroups).forEach(exName => {
          const exLogs = exerciseGroups[exName];
          exLogs.forEach(log => {
            if (log.weight > maxWeight) {
              maxWeight = log.weight;
              maxExercise = exName;
              maxReps = log.reps;
              maxSets = log.sets;
            }
            const volume = log.weight * log.reps * log.sets;
            if (volume > maxVolume) {
              maxVolume = volume;
            }
          });
        });

        if (maxExercise) {
          currentPR = {
            date: new Date(),
            exerciseName: maxExercise,
            weight: maxWeight,
            reps: maxReps,
            sets: maxSets,
            volume: maxVolume
          };
        }
      }

      res.json({
        success: true,
        data: {
          metrics,
          improvements,
          currentPR
        }
      });
    } catch (error) {
      console.error('Error getting progressive overload:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
};
