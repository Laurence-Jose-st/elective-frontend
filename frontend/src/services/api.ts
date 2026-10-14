const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : 'https://my-working-backend.vercel.app/api');

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers: { 'Content-Type': string; Authorization?: string } = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  flagged: boolean;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export const loginUser = async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE}/users/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to login');
  }

  return data;
};

export const registerUser = async (credentials: { username: string; email: string; password: string }): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE}/users/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to register');
  }

  return data;
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await fetch(`${API_BASE}/users/auth/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch user');
  }

  return data.data;
};

export const updateProfile = async (profile: { username?: string }): Promise<User> => {
  const response = await fetch(`${API_BASE}/users/auth/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(profile),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update profile');
  }

  return data.data;
};

// Workout API
export const workoutService = {
  getWorkouts: async () => {
    const response = await fetch(`${API_BASE}/users/workouts`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch workouts');
    }

    return data;
  },

  createWorkout: async (workout: any) => {
    const response = await fetch(`${API_BASE}/users/workouts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(workout),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create workout');
    }

    return data;
  },

  saveSession: async (sessionData: any) => {
    const response = await fetch(`${API_BASE}/users/workouts/sessions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(sessionData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save session');
    }

    return data;
  },

  getCompletedSessions: async () => {
    const response = await fetch(`${API_BASE}/users/workouts/sessions/completed`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch completed sessions');
    }

    return data;
  },

  getProgressiveOverload: async (exerciseName?: string) => {
    const url = exerciseName
      ? `${API_BASE}/users/workouts/progressive-overload?exerciseName=${encodeURIComponent(exerciseName)}`
      : `${API_BASE}/users/workouts/progressive-overload`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch progressive overload data');
    }

    return data;
  },

  searchExercises: async (query: string) => {
    const response = await fetch(`${API_BASE}/users/workouts/exercises/search?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to search exercises');
    }

    return data;
  },

  getActiveSession: async () => {
    const response = await fetch(`${API_BASE}/users/workouts/sessions/active`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch active session');
    }

    return data;
  },

  startSession: async (name: string) => {
    const response = await fetch(`${API_BASE}/users/workouts/sessions/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to start session');
    }

    return data;
  },

  completeSession: async (sessionId: string) => {
    const response = await fetch(`${API_BASE}/users/workouts/sessions/${sessionId}/complete`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to complete session');
    }

    return data;
  },

  cancelSession: async (sessionId: string) => {
    const response = await fetch(`${API_BASE}/users/workouts/sessions/${sessionId}/cancel`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to cancel session');
    }

    return data;
  },

  addExerciseToSession: async (sessionId: string, exerciseId: string, data: { sets: number; reps: number; weight: number; duration: number }) => {
    const response = await fetch(`${API_BASE}/users/workouts/sessions/exercises`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId, exerciseId, ...data }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to add exercise to session');
    }

    return responseData;
  },
};

// Meal API
export const mealService = {
  searchFoodItems: async (query: string) => {
    const response = await fetch(`${API_BASE}/users/meals/food/search?query=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to search food items');
    }

    return data;
  },

  getMeals: async () => {
    const response = await fetch(`${API_BASE}/users/meals`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch meals');
    }

    console.log('API getMeals response:', data);
    return data;
  },

  updateMeal: async (id: number, mealData: any) => {
    const response = await fetch(`${API_BASE}/users/meals/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(mealData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update meal');
    }

    return data;
  },

  createMeal: async (meal: any) => {
    const response = await fetch(`${API_BASE}/users/meals`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(meal),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create meal');
    }

    return data;
  },

  getMealHistory: async () => {
    const response = await fetch(`${API_BASE}/users/meals/history`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch meal history');
    }

    return data;
  },

  getDailySummary: async (date?: string) => {
    const url = date
      ? `${API_BASE}/users/meals/daily-summary?date=${date}`
      : `${API_BASE}/users/meals/daily-summary`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch daily summary');
    }

    return data;
  },

  deleteMeal: async (id: number) => {
    const response = await fetch(`${API_BASE}/users/meals/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete meal');
    }

    return data;
  },
};

// Admin API
export const adminService = {
  getAllUsers: async () => {
    const response = await fetch(`${API_BASE}/admin/users`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch users');
    }

    return data;
  },

  toggleUserFlag: async (userId: number, flagged: boolean) => {
    const response = await fetch(`${API_BASE}/admin/users/${userId}/flag`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ flagged }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update user');
    }

    return data;
  },

  deleteUser: async (userId: number) => {
    const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete user');
    }

    return data;
  },

  sendBroadcast: async (title: string, message: string, targetType: 'all' | 'specific', targetUserId?: number) => {
    const response = await fetch(`${API_BASE}/admin/broadcast`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, message, targetType, targetUserId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send broadcast');
    }

    return data;
  },

  addFoodItem: async (foodData: { name: string; category?: string; calories: number; protein?: number; carbs?: number; fats?: number; fiber?: number }) => {
    const response = await fetch(`${API_BASE}/admin/food`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(foodData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add food item');
    }

    return data;
  },

  addExercise: async (exerciseData: { name: string; body_part: string; target: string; equipment: string; gif_url?: string }) => {
    const response = await fetch(`${API_BASE}/admin/exercises`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(exerciseData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to add exercise');
    }

    return data;
  },

  getNotifications: async () => {
    const response = await fetch(`${API_BASE}/users/notifications`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch notifications');
    }

    return data;
  },

  markNotificationRead: async (notificationId: number) => {
    const response = await fetch(`${API_BASE}/users/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to mark notification as read');
    }

    return data;
  },
};

// Calculator API (Public - No authentication required)
export const calculatorService = {
  calculateBmi: async (data: {
    weightKg: number;
    heightCm: number;
    age?: number;
    gender?: string;
    activityLevel?: string;
  }) => {
    const response = await fetch(`${API_BASE}/calculator/bmi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to calculate BMI');
    }

    return result;
  },
};

