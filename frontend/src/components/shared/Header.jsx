import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle.jsx';
import authStore from '../../context/authStore.js';

/**
 * Header component
 * Navigation bar with logo, menu, and theme toggle
 */

export default function Header({ isAdmin = false }) {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = authStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-dark-bg-primary border-b border-light-border dark:border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isAdmin ? '/admin' : '/'} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-neon-cyan to-neon-magenta rounded-lg flex items-center justify-center">
              <span className="text-white font-display font-bold">🌟</span>
            </div>
            <span className="font-display font-bold text-lg bg-gradient-to-r from-neon-cyan to-neon-magenta bg-clip-text text-transparent hidden sm:inline">
              Celebrity Tracker
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {!isAdmin && (
              <>
                <Link to="/" className="text-light-text-secondary dark:text-dark-text-secondary hover:text-neon-cyan transition-colors">
                  All Celebrities
                </Link>
                <Link to="/trending" className="text-light-text-secondary dark:text-dark-text-secondary hover:text-neon-cyan transition-colors">
                  Trending
                </Link>
              </>
            )}
            {isAdmin && isAuthenticated && (
              <>
                <Link to="/admin/dashboard" className="text-light-text-secondary dark:text-dark-text-secondary hover:text-neon-cyan transition-colors">
                  Dashboard
                </Link>
                <Link to="/admin/scrape" className="text-light-text-secondary dark:text-dark-text-secondary hover:text-neon-cyan transition-colors">
                  Scraping
                </Link>
                <Link to="/admin/data" className="text-light-text-secondary dark:text-dark-text-secondary hover:text-neon-cyan transition-colors">
                  Data
                </Link>
                <Link to="/admin/analytics" className="text-light-text-secondary dark:text-dark-text-secondary hover:text-neon-cyan transition-colors">
                  Analytics
                </Link>
              </>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            <ThemeToggle />

            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-status-error text-white hover:bg-status-error/90 transition-colors text-sm font-medium"
              >
                Logout
              </button>
            ) : (
              !isAdmin && (
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg bg-neon-cyan text-dark-bg-primary hover:bg-neon-cyan/90 transition-colors text-sm font-medium"
                >
                  Admin
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
