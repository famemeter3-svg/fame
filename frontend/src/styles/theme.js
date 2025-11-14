/**
 * Theme configuration for Taiwan Celebrity Tracker
 * Contains color palettes and design tokens for light/dark modes
 */

export const lightTheme = {
  colors: {
    background: {
      primary: '#ffffff',
      secondary: '#f5f5f5',
      tertiary: '#eeeeee',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
      tertiary: '#999999',
    },
    accent: {
      primary: '#00d9ff', // Neon cyan
      secondary: '#ff00ff', // Neon magenta
      tertiary: '#00ff88', // Neon lime
    },
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    border: '#e5e7eb',
  },
};

export const darkTheme = {
  colors: {
    background: {
      primary: '#0f172a', // Dark blue
      secondary: '#1e293b', // Slate
      tertiary: '#334155',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      tertiary: '#94a3b8',
    },
    accent: {
      primary: '#00d9ff', // Neon cyan (same as light)
      secondary: '#ff00ff', // Neon magenta (same as light)
      tertiary: '#00ff88', // Neon lime (same as light)
    },
    status: {
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa',
    },
    border: '#334155',
  },
};

export const getTheme = (isDark) => (isDark ? darkTheme : lightTheme);

export const colors = {
  neon: {
    cyan: '#00d9ff',
    magenta: '#ff00ff',
    lime: '#00ff88',
  },
};
