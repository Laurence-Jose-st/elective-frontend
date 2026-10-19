import prisma from '../lib/prisma.js';
import crypto from 'crypto';

export const adminController = {
  /**
   * Get all users for admin dashboard
   */
  async getAllUsers(req, res) {
    try {
      console.log('Fetching all users for admin dashboard');
      
      const users = await prisma.users.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          flagged: true,
          created_at: true,
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      console.log(`Found ${users.length} users`);
      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Flag or unflag a user
   */
  async toggleUserFlag(req, res) {
    try {
      const { id } = req.params;
      const { flagged } = req.body;

      console.log(`Toggling flag for user ${id} to ${flagged}`);

      const updatedUser = await prisma.users.update({
        where: { id: parseInt(id) },
        data: { flagged }
      });

      res.status(200).json({
        success: true,
        message: `User ${flagged ? 'flagged' : 'unflagged'} successfully`,
        data: updatedUser
      });
    } catch (error) {
      console.error('Error toggling user flag:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update user status',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Delete a user
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      console.log(`Deleting user ${id}`);

      await prisma.users.delete({
        where: { id: parseInt(id) }
      });

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete user',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Send broadcast notification
   */
  async sendBroadcast(req, res) {
    try {
      const { title, message, targetType, targetUserId } = req.body;
      const sentBy = req.user?.userId || 1; // Default to admin if not available

      console.log('Sending broadcast:', { title, message, targetType, targetUserId });

      if (!title || !message) {
        res.status(400).json({
          success: false,
          error: 'Title and message are required'
        });
        return;
      }

      let usersToNotify = [];

      if (targetType === 'all') {
        // Send to all users
        usersToNotify = await prisma.users.findMany({
          where: { role: 'REGISTERED' }
        });
      } else if (targetType === 'specific' && targetUserId) {
        // Send to specific user
        const user = await prisma.users.findUnique({
          where: { id: parseInt(targetUserId) }
        });
        if (user) {
          usersToNotify = [user];
        }
      }

      console.log(`Found ${usersToNotify.length} users to notify`);

      // Save broadcast to history
      const broadcast = await prisma.broadcasts.create({
        data: {
          title,
          message,
          target_type: targetType,
          target_user_id: targetType === 'specific' ? parseInt(targetUserId) : null,
          sent_by: parseInt(sentBy)
        }
      });

      // Create notifications for all target users
      let notifications = [];

      try {
        notifications = await Promise.all(
          usersToNotify.map(user =>
            prisma.notifications.create({
              data: {
                user_id: user.id,
                title,
                message,
                type: 'broadcast'
              }
            })
          )
        );
      } catch (notificationError) {
        console.error('Error creating notifications (table may not exist):', notificationError);
        // If notifications table doesn't exist, still save broadcast but warn
        res.status(200).json({
          success: true,
          message: `Broadcast saved to history. Note: Some users may not have received notifications.`,
          warning: 'Notifications table may not exist in database yet',
          usersNotified: usersToNotify.length,
          broadcast
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Broadcast sent to ${notifications.length} user(s)`,
        data: {
          broadcast,
          notifications,
          usersNotified: notifications.length
        }
      });
    } catch (error) {
      console.error('Error sending broadcast:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send broadcast',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Get broadcast history
   */
  async getBroadcastHistory(req, res) {
    try {
      console.log('Fetching broadcast history');

      const broadcasts = await prisma.broadcasts.findMany({
        orderBy: {
          created_at: 'desc'
        },
        take: 50
      });

      res.status(200).json({
        success: true,
        data: broadcasts
      });
    } catch (error) {
      console.error('Error fetching broadcast history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch broadcast history',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Delete broadcast from history
   */
  async deleteBroadcast(req, res) {
    try {
      const { id } = req.params;

      console.log(`Deleting broadcast ${id}`);

      await prisma.broadcasts.delete({
        where: { id: parseInt(id) }
      });

      res.status(200).json({
        success: true,
        message: 'Broadcast deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting broadcast:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete broadcast',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Get all food items
   */
  async getFoodItems(req, res) {
    try {
      console.log('Fetching food items');

      const foodItems = await prisma.food_items.findMany({
        orderBy: {
          created_at: 'desc'
        },
        take: 100
      });

      res.status(200).json({
        success: true,
        data: foodItems
      });
    } catch (error) {
      console.error('Error fetching food items:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch food items',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Get all exercises
   */
  async getExercises(req, res) {
    try {
      console.log('Fetching exercises');

      const exercises = await prisma.exercises.findMany({
        orderBy: {
          name: 'asc'
        },
        take: 100
      });

      res.status(200).json({
        success: true,
        data: exercises
      });
    } catch (error) {
      console.error('Error fetching exercises:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch exercises',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Delete food item
   */
  async deleteFoodItem(req, res) {
    try {
      const { id } = req.params;

      console.log(`Deleting food item ${id}`);

      await prisma.food_items.delete({
        where: { id: parseInt(id) }
      });

      res.status(200).json({
        success: true,
        message: 'Food item deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting food item:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete food item',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Delete exercise
   */
  async deleteExercise(req, res) {
    try {
      const { id } = req.params;

      console.log(`Deleting exercise ${id}`);

      await prisma.exercises.delete({
        where: { id }
      });

      res.status(200).json({
        success: true,
        message: 'Exercise deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting exercise:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete exercise',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Add food item to database
   */
  async addFoodItem(req, res) {
    try {
      const { name, category, calories, protein, carbs, fats, fiber } = req.body;

      console.log('Adding food item:', { name, category, calories });

      if (!name || !calories) {
        res.status(400).json({
          success: false,
          error: 'Name and calories are required'
        });
        return;
      }

      const foodItem = await prisma.food_items.create({
        data: {
          name: name.trim(),
          category: category || 'Uncategorized',
          calories: parseFloat(calories),
          protein: parseFloat(protein || 0),
          carbs: parseFloat(carbs || 0),
          fats: parseFloat(fats || 0),
          fiber: parseFloat(fiber || 0)
        }
      });

      res.status(201).json({
        success: true,
        message: 'Food item added successfully',
        data: foodItem
      });
    } catch (error) {
      console.error('Error adding food item:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add food item',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Add exercise to database
   */
  async addExercise(req, res) {
    try {
      const { name, body_part, target, equipment, gif_url } = req.body;

      console.log('Adding exercise:', { name, body_part, target });

      if (!name || !body_part || !target || !equipment) {
        res.status(400).json({
          success: false,
          error: 'Name, body part, target, and equipment are required'
        });
        return;
      }

      const exercise = await prisma.exercises.create({
        data: {
          id: crypto.randomUUID(),
          name: name.trim(),
          body_part: body_part.trim(),
          target: target.trim(),
          equipment: equipment.trim(),
          gif_url: gif_url || ''
        }
      });

      res.status(201).json({
        success: true,
        message: 'Exercise added successfully',
        data: exercise
      });
    } catch (error) {
      console.error('Error adding exercise:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add exercise',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Get notifications for current user
   */
  async getNotifications(req, res) {
    try {
      const userId = req.user?.userId || req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      console.log('Fetching notifications for user:', userId);

      // Check if notifications model exists in Prisma client
      if (!prisma.notifications) {
        console.log('Notifications model not found in Prisma client - table may not exist in database');
        res.status(200).json({
          success: true,
          data: [],
          warning: 'Notifications table not found in database'
        });
        return;
      }

      let notifications = [];
      try {
        notifications = await prisma.notifications.findMany({
          where: { user_id: parseInt(userId) },
          orderBy: { created_at: 'desc' },
          take: 20
        });
      } catch (notificationError) {
        console.error('Error fetching notifications (table may not exist):', notificationError);
        // If notifications table doesn't exist, return empty array
        notifications = [];
      }

      res.status(200).json({
        success: true,
        data: notifications
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch notifications',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Mark notification as read
   */
  async markNotificationRead(req, res) {
    try {
      const { id } = req.params;

      try {
        await prisma.notifications.update({
          where: { id: parseInt(id) },
          data: { read: true }
        });
      } catch (notificationError) {
        console.error('Error marking notification as read (table may not exist):', notificationError);
        // If notifications table doesn't exist, still return success
        res.status(200).json({
          success: true,
          message: 'Notification marked as read',
          warning: 'Notifications table may not exist in database yet'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update notification',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};
