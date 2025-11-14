import { Navigate } from 'react-router-dom';
import authStore from '../context/authStore.js';

/**
 * Protected Route component
 * Redirects to login if user is not authenticated
 */

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = authStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
