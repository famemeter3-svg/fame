import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/shared/Header.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import TrendingCard from '../../components/cards/TrendingCard.jsx';
import themeStore from '../../context/themeStore.js';
import { fetchCardTrending } from '../../services/api.js';

/**
 * Trending Page
 * Displays top 5 trending celebrities with metrics and trend indicators
 */

export default function Trending() {
  const navigate = useNavigate();
  const { isDark } = themeStore();
  const [celebrities, setCelebrities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchCardTrending(5);
        setCelebrities(response.data?.celebrities || response.data || []);
      } catch (err) {
        console.error('Error fetching trending:', err);
        setError(err.message || 'Failed to load trending celebrities');
      } finally {
        setLoading(false);
      }
    };

    loadTrending();
  }, []);

  const handleCelebrityClick = (id) => {
    navigate(`/celebrity/${id}`);
  };

  const theme = isDark ? 'dark' : 'light';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-bg-primary' : 'bg-white'}`}>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className={`text-4xl font-display font-bold ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-2`}>
            🔥 Trending This Week
          </h1>
          <p className={`text-lg ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
            Watch the hottest celebrities rise in mentions and engagement
          </p>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading trending celebrities..." />
        ) : error ? (
          <div className={`p-6 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
            <div className="text-status-error font-semibold mb-2">Error</div>
            <p className={isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}>
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-neon-cyan text-dark-bg-primary rounded-lg hover:bg-neon-cyan/90 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div>
            <TrendingCard
              celebrities={celebrities}
              theme={theme}
              mode="interactive"
              onCelebrityClick={handleCelebrityClick}
              limit={5}
            />

            {celebrities.length === 0 && (
              <div className={`text-center py-12 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
                <p>No trending data available</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
