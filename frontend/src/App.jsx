import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Pages
import Login from './pages/Login.jsx';

// Public pages
import CelebrityList from './pages/public/CelebrityList.jsx';
import Trending from './pages/public/Trending.jsx';
import CelebrityDetail from './pages/public/CelebrityDetail.jsx';
import MentionsDetail from './pages/public/MentionsDetail.jsx';
import CardEmbed from './pages/public/CardEmbed.jsx';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ScrapeControl from './pages/admin/ScrapeControl.jsx';
import DataManagement from './pages/admin/DataManagement.jsx';
import Analytics from './pages/admin/Analytics.jsx';

/**
 * Main App component with routing
 */

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />

        {/* Public routes */}
        <Route path="/" element={<CelebrityList />} />
        <Route path="/trending" element={<Trending />} />
        <Route path="/celebrity/:id" element={<CelebrityDetail />} />
        <Route path="/celebrity/:id/mentions" element={<MentionsDetail />} />
        <Route path="/card/:type/:id" element={<CardEmbed />} />

        {/* Admin routes (protected) */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/scrape"
          element={
            <ProtectedRoute>
              <ScrapeControl />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/data"
          element={
            <ProtectedRoute>
              <DataManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
