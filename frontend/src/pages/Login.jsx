import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authStore from '../context/authStore.js';
import LoadingSpinner from '../components/shared/LoadingSpinner.jsx';

/**
 * Login page for admin access
 */

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = authStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    const success = await login(username, password);
    if (success) {
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-neon-cyan to-neon-magenta rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🌟</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-light-text-primary dark:text-dark-text-primary">
            Celebrity Tracker
          </h1>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mt-2">
            Admin Login
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 rounded-lg bg-status-error/10 border border-status-error text-status-error text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-4 py-2 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary placeholder-light-text-secondary dark:placeholder-dark-text-secondary focus:outline-none focus:border-neon-cyan"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary placeholder-light-text-secondary dark:placeholder-dark-text-secondary focus:outline-none focus:border-neon-cyan"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 rounded-lg bg-neon-cyan text-dark-bg-primary font-semibold hover:bg-neon-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Note for demo */}
        <div className="mt-6 p-4 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary border border-light-border dark:border-dark-border">
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
            <strong>Demo:</strong> Use any username/password. This is a placeholder for backend integration.
          </p>
        </div>
      </div>
    </div>
  );
}
