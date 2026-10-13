const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper to get auth headers with token
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

