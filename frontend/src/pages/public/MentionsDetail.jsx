import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/shared/Header.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import MentionsCard from '../../components/cards/MentionsCard.jsx';
import themeStore from '../../context/themeStore.js';
import { fetchMentions, fetchCelebrityById } from '../../services/api.js';

/**
 * Mentions Detail page
 * Timeline of all mentions for a celebrity
 */

export default function MentionsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = themeStore();
  const [celebrity, setCelebrity] = useState(null);
  const [mentions, setMentions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [celebRes, mentionsRes] = await Promise.all([
          fetchCelebrityById(id),
          fetchMentions(id, 100),
        ]);

        setCelebrity(celebRes.data?.data || celebRes.data);
        setMentions(mentionsRes.data?.data || mentionsRes.data || []);
      } catch (err) {
        console.error('Error fetching mentions:', err);
        setError(err.message || 'Failed to load mentions');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  const theme = isDark ? 'dark' : 'light';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-bg-primary' : 'bg-white'}`}>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => navigate(`/celebrity/${id}`)}
          className="mb-4 text-neon-cyan hover:text-neon-magenta transition-colors text-sm font-medium"
        >
          ← Back to Profile
        </button>

        <div className="mb-8">
          <h1 className={`text-4xl font-display font-bold ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-2`}>
            📰 Mention Timeline
          </h1>
          {celebrity && (
            <p className={`text-lg ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
              All mentions for {celebrity.name}
            </p>
          )}
        </div>

        {loading ? (
          <LoadingSpinner message="Loading mentions..." />
        ) : error ? (
          <div className={`p-6 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
            <div className="text-status-error font-semibold mb-2">Error</div>
            <p className={isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}>
              {error}
            </p>
          </div>
        ) : (
          <MentionsCard
            mentions={mentions}
            theme={theme}
            mode="static"
          />
        )}
      </main>
    </div>
  );
}
