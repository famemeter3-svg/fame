import { create } from 'zustand';

/**
 * Theme state management using Zustand
 * Handles light/dark mode toggle and persistence
 */

const themeStore = create((set) => ({
  isDark: localStorage.getItem('theme') === 'dark' || false,

  /**
   * Toggle between light and dark theme
   */
  toggleTheme: () => {
    set((state) => {
      const newIsDark = !state.isDark;
      localStorage.setItem('theme', newIsDark ? 'dark' : 'light');

      // Update document class for CSS
      if (newIsDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      return { isDark: newIsDark };
    });
  },

  /**
   * Set theme explicitly
   */
  setTheme: (isDark) => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    set({ isDark });
  },

  /**
   * Initialize theme from localStorage
   */
  initializeTheme: () => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark';

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    set({ isDark });
  },
}));

export default themeStore;
