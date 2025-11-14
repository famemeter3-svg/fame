import { create } from 'zustand';

/**
 * Authentication state management using Zustand
 * Handles login, logout, and token persistence
 */

const authStore = create((set) => ({
  token: localStorage.getItem('auth_token') || null,
  user: null,
  isAuthenticated: !!localStorage.getItem('auth_token'),
  isLoading: false,
  error: null,

  /**
   * Login with credentials
   * @param {string} username - Username or email
   * @param {string} password - Password
   */
  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      const token = data.token;

      localStorage.setItem('auth_token', token);
      set({
        token,
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (err) {
      set({
        error: err.message,
        isLoading: false,
        isAuthenticated: false,
      });
      return false;
    }
  },

  /**
   * Logout and clear auth data
   */
  logout: () => {
    localStorage.removeItem('auth_token');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  /**
   * Set token directly (for session restoration)
   */
  setToken: (token) => {
    if (token) {
      localStorage.setItem('auth_token', token);
      set({ token, isAuthenticated: true });
    } else {
      localStorage.removeItem('auth_token');
      set({ token: null, isAuthenticated: false });
    }
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),
}));

export default authStore;
