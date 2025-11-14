/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light theme
        'light-bg-primary': '#ffffff',
        'light-bg-secondary': '#f5f5f5',
        'light-text-primary': '#1a1a1a',
        'light-text-secondary': '#666666',

        // Dark theme
        'dark-bg-primary': '#0f172a',
        'dark-bg-secondary': '#1e293b',
        'dark-text-primary': '#f8fafc',
        'dark-text-secondary': '#cbd5e1',

        // Neon accents
        'neon-cyan': '#00d9ff',
        'neon-magenta': '#ff00ff',
        'neon-lime': '#00ff88',

        // Status colors
        'status-success': '#10b981',
        'status-warning': '#f59e0b',
        'status-error': '#ef4444',
      },
      fontFamily: {
        'body': ['Inter', 'sans-serif'],
        'display': ['Space Grotesk', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(0, 217, 255, 0.3)',
        'neon-magenta': '0 0 10px rgba(255, 0, 255, 0.3)',
        'neon-lime': '0 0 10px rgba(0, 255, 136, 0.3)',
      },
      borderColor: {
        'neon-cyan': '#00d9ff',
        'neon-magenta': '#ff00ff',
        'neon-lime': '#00ff88',
      },
    },
  },
  plugins: [],
}
