import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/shared/Header.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import CelebrityCard from '../../components/cards/CelebrityCard.jsx';
import themeStore from '../../context/themeStore.js';
import { fetchCelebrities } from '../../services/api.js';
import { CELEBRITY_CATEGORIES } from '../../utils/constants.js';

/**
 * Celebrity List page
 * Displays all celebrities with filtering and search
 */

export default function CelebrityList() {
  const navigate = useNavigate();
  const { isDark } = themeStore();
  const [celebrities, setCelebrities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const LIMIT = 20;

  useEffect(() => {
    const loadCelebrities = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchCelebrities(LIMIT, page * LIMIT, {
          ...(selectedCategory && { category: selectedCategory }),
          ...(search && { search }),
        });
        setCelebrities(response.data?.data || response.data || []);
        setTotalCount(response.data?.count || 0);
      } catch (err) {
        console.error('Error fetching celebrities:', err);
        setError(err.message || 'Failed to load celebrities');
      } finally {
        setLoading(false);
      }
    };

    loadCelebrities();
  }, [page, selectedCategory, search]);

  const handleCelebrityClick = (id) => {
    navigate(`/celebrity/${id}`);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setPage(0);
  };

  const maxPages = Math.ceil(totalCount / LIMIT);
  const theme = isDark ? 'dark' : 'light';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-bg-primary' : 'bg-white'}`}>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className={`text-4xl font-display font-bold ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-2`}>
            👥 Celebrity Directory
          </h1>
          <p className={`text-lg ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
            Browse all {totalCount} Taiwan entertainment celebrities
          </p>
        </div>

        {/* Filters */}
        <div className={`mb-8 p-6 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={handleSearchChange}
              className={`px-4 py-2 rounded-lg ${isDark ? 'bg-dark-bg-primary text-dark-text-primary border-dark-border' : 'bg-white text-light-text-primary border-light-border'} border focus:outline-none focus:border-neon-cyan transition-colors`}
            />

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className={`px-4 py-2 rounded-lg ${isDark ? 'bg-dark-bg-primary text-dark-text-primary border-dark-border' : 'bg-white text-light-text-primary border-light-border'} border focus:outline-none focus:border-neon-cyan transition-colors`}
            >
              <option value="">All Categories</option>
              {CELEBRITY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSpinner message="Loading celebrities..." />
        ) : error ? (
          <div className={`p-6 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'} text-center`}>
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
          <>
            {/* Grid */}
            {celebrities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {celebrities.map((celeb) => (
                  <CelebrityCard
                    key={celeb.id}
                    celebrity={celeb}
                    theme={theme}
                    mode="interactive"
                    onCardClick={handleCelebrityClick}
                  />
                ))}
              </div>
            ) : (
              <div className={`text-center py-12 ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
                <p>No celebrities found matching your criteria</p>
              </div>
            )}

            {/* Pagination */}
            {maxPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className={`px-4 py-2 rounded-lg ${page === 0 ? 'opacity-50 cursor-not-allowed' : ''} bg-neon-cyan text-dark-bg-primary hover:bg-neon-cyan/90 transition-colors font-medium`}
                >
                  ← Previous
                </button>

                <div className={`px-4 py-2 ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'}`}>
                  Page {page + 1} of {maxPages}
                </div>

                <button
                  onClick={() => setPage(Math.min(maxPages - 1, page + 1))}
                  disabled={page >= maxPages - 1}
                  className={`px-4 py-2 rounded-lg ${page >= maxPages - 1 ? 'opacity-50 cursor-not-allowed' : ''} bg-neon-cyan text-dark-bg-primary hover:bg-neon-cyan/90 transition-colors font-medium`}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
