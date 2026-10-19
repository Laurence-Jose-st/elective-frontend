const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : 'https://my-working-backend.vercel.app/api');

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

export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
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
  },

  register: async (credentials: { username: string; email: string; password: string }): Promise<AuthResponse> => {
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
  },

  getCurrentUser: async (): Promise<User> => {
    const token = localStorage.getItem('token');
    const headers: { 'Content-Type': string; Authorization?: string } = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/users/auth/me`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch user');
    }

    return data.data;
  },

  updateProfile: async (profile: { username?: string }): Promise<User> => {
    const token = localStorage.getItem('token');
    const headers: { 'Content-Type': string; Authorization?: string } = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/users/auth/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(profile),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update profile');
    }

    return data.data;
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE}/users/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send password reset email');
    }

    return data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE}/users/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to reset password');
    }

    return data;
  },

  sendWelcomeEmail: async (email: string, username: string): Promise<{ success: boolean; message: string }> => {
    const token = localStorage.getItem('token');
    const headers: { 'Content-Type': string; Authorization?: string } = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/users/auth/send-welcome-email`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, username }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send welcome email');
    }

    return data;
  },

  sendNotificationEmail: async (email: string, subject: string, message: string): Promise<{ success: boolean; message: string }> => {
    const token = localStorage.getItem('token');
    const headers: { 'Content-Type': string; Authorization?: string } = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/users/auth/send-notification-email`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, subject, message }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send notification email');
    }

    return data;
  },

  sendPasswordResetConfirmationEmail: async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE}/users/auth/send-password-reset-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send password reset confirmation email');
    }

    return data;
  },
};
