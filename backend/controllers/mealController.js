import prisma from '../lib/prisma.js';

export const mealController = {
  /**
   * Search food items from the food_items table
   */
  async searchFoodItems(req, res) {
    try {
      const { query } = req.query;

      if (!query) {
        res.status(400).json({ success: false, error: 'Query parameter is required' });
        return;
      }

      const foodItems = await prisma.food_items.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: 20
      });

      res.json({ success: true, data: foodItems });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Log a new meal with detailed nutrient breakdown
   * Requires: calories, protein, fiber, carbs, fats, mealName, mealType
   */
  async logMeal(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { mealName, mealType, calories, proteinGrams, fiberGrams, carbsGrams, fatsGrams, notes, timestamp } = req.body;

      if (!mealName || calories === undefined || proteinGrams === undefined || carbsGrams === undefined || fatsGrams === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required meal parameters: mealName, calories, proteinGrams, carbsGrams, fatsGrams.',
          code: 'MEAL_PARAMS_MISSING',
        });
        return;
      }

      if (calories < 0 || proteinGrams < 0 || carbsGrams < 0 || fatsGrams < 0) {
        res.status(400).json({
          success: false,
          error: 'Nutrient values cannot be negative numbers.',
          code: 'NEGATIVE_NUTRIENTS',
        });
        return;
      }

      const meal = await prisma.meal_logs.create({
        data: {
          user_id: userId,
          food_name: mealName.trim(),
          meal_type: mealType || 'lunch',
          calories: Number(calories),
          protein: Number(proteinGrams),
          fiber: fiberGrams !== undefined ? Number(fiberGrams) : 0,
          carbs: Number(carbsGrams),
          fats: Number(fatsGrams),
          created_at: timestamp ? new Date(timestamp) : new Date(),
        }
      });

      res.status(201).json({
        success: true,
        message: 'Meal logged successfully.',
        data: meal,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get meals logged by the user with optional date filter
   */
  async getMeals(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { date, mealType } = req.query;
      let meals = await prisma.meal_logs.findMany({
        where: { user_id: userId }
      });

      if (date && typeof date === 'string') {
        const targetDate = new Date(date).toISOString().split('T')[0];
        meals = meals.filter((m) => new Date(m.created_at).toISOString().split('T')[0] === targetDate);
      }

      if (mealType && typeof mealType === 'string' && mealType !== 'all') {
        meals = meals.filter((m) => m.food_name.toLowerCase() === mealType.toLowerCase());
      }

      res.status(200).json({
        success: true,
        count: meals.length,
        data: meals,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get detailed historical meal plan logs formatted for pop-up data displays
   * Aggregates total macros, computes macro ratios, and formats timestamps
   */
  async getHistory(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const rawMeals = await prisma.meal_logs.findMany({
        where: { user_id: userId }
      });

      const formattedMeals = rawMeals.map((meal) => {
        const proteinKcal = meal.protein * 4;
        const carbsKcal = meal.carbs * 4;
        const fatsKcal = meal.fats * 9;
        const totalKcal = proteinKcal + carbsKcal + fatsKcal || 1;

        return {
          ...meal,
          formattedDate: new Date(meal.created_at).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          formattedTime: new Date(meal.created_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          macroRatio: {
            protein: Math.round((proteinKcal / totalKcal) * 100),
            carbs: Math.round((carbsKcal / totalKcal) * 100),
            fats: Math.round((fatsKcal / totalKcal) * 100),
          },
        };
      });

      const totalCalories = rawMeals.reduce((acc, m) => acc + m.calories, 0);
      const totalProtein = rawMeals.reduce((acc, m) => acc + m.protein, 0);
      const totalCarbs = rawMeals.reduce((acc, m) => acc + m.carbs, 0);
      const totalFats = rawMeals.reduce((acc, m) => acc + m.fats, 0);
      const totalFiber = rawMeals.reduce((acc, m) => acc + (m.fiber || 0), 0);

      res.status(200).json({
        success: true,
        summary: {
          totalMealsLogged: rawMeals.length,
          totalCaloriesLogged: Math.round(totalCalories),
          totalProteinGrams: Math.round(totalProtein * 10) / 10,
          totalCarbsGrams: Math.round(totalCarbs * 10) / 10,
          totalFatsGrams: Math.round(totalFats * 10) / 10,
          totalFiberGrams: Math.round(totalFiber * 10) / 10,
          averageCaloriesPerMeal: rawMeals.length > 0 ? Math.round(totalCalories / rawMeals.length) : 0,
        },
        data: formattedMeals,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Get daily nutrition summary & macro percentage distribution
   */
  async getDailySummary(req, res) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { date } = req.query;
      const targetDateStr = date && typeof date === 'string'
        ? new Date(date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      const user = await prisma.users.findUnique({
        where: { id: userId }
      });

      const userMeals = (await prisma.meal_logs.findMany({
        where: { user_id: userId }
      })).filter((m) => {
        return new Date(m.created_at).toISOString().split('T')[0] === targetDateStr;
      });

      const totals = userMeals.reduce(
        (acc, m) => {
          acc.calories += m.calories;
          acc.proteinGrams += m.protein;
          acc.fiberGrams += m.fiber || 0;
          acc.carbsGrams += m.carbs;
          acc.fatsGrams += m.fats;
          return acc;
        },
        { calories: 0, proteinGrams: 0, fiberGrams: 0, carbsGrams: 0, fatsGrams: 0 }
      );

      // Calculate macro calorie contributions (Protein: 4 kcal/g, Carbs: 4 kcal/g, Fats: 9 kcal/g)
      const proteinKcal = totals.proteinGrams * 4;
      const carbsKcal = totals.carbsGrams * 4;
      const fatsKcal = totals.fatsGrams * 9;
      const totalMacroKcal = proteinKcal + carbsKcal + fatsKcal || 1;

      const macroPercentages = {
        protein: Math.round((proteinKcal / totalMacroKcal) * 100),
        carbs: Math.round((carbsKcal / totalMacroKcal) * 100),
        fats: Math.round((fatsKcal / totalMacroKcal) * 100),
      };

      const calorieTarget = 2200; // Default target (can be enhanced with user profile)
      const proteinTarget = 150; // Default target (can be enhanced with user profile)

      res.status(200).json({
        success: true,
        date: targetDateStr,
        totals: {
          ...totals,
          proteinGrams: Math.round(totals.proteinGrams * 10) / 10,
          fiberGrams: Math.round(totals.fiberGrams * 10) / 10,
          carbsGrams: Math.round(totals.carbsGrams * 10) / 10,
          fatsGrams: Math.round(totals.fatsGrams * 10) / 10,
        },
        targets: {
          calories: calorieTarget,
          proteinGrams: proteinTarget,
        },
        progress: {
          caloriePercent: Math.min(100, Math.round((totals.calories / calorieTarget) * 100)),
          proteinPercent: Math.min(100, Math.round((totals.proteinGrams / proteinTarget) * 100)),
        },
        macroPercentages,
        loggedMealsCount: userMeals.length,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  /**
   * Delete a meal log
   */
  async deleteMeal(req, res) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const deleted = await prisma.meal_logs.deleteMany({
        where: {
          id: parseInt(id),
          user_id: userId
        }
      });

      if (deleted.count === 0) {
        res.status(404).json({ success: false, error: 'Meal log not found or already deleted.' });
        return;
      }

      res.status(200).json({ success: true, message: 'Meal log removed successfully.' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
};