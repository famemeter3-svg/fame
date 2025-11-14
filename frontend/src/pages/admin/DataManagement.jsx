import { useEffect, useState } from 'react';
import Header from '../../components/shared/Header.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import themeStore from '../../context/themeStore.js';
import { fetchCelebrities } from '../../services/api.js';
import { formatNumber } from '../../utils/formatters.js';

/**
 * Data Management page
 * Manage celebrities and their data
 */

export default function DataManagement() {
  const { isDark } = themeStore();
  const [celebrities, setCelebrities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchCelebrities(100, 0);
        setCelebrities(res.data?.data || res.data || []);
      } catch (err) {
        console.error('Error loading celebrities:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-bg-primary' : 'bg-white'}`}>
      <Header isAdmin />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className={`text-4xl font-display font-bold ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-2`}>
          💾 Data Management
        </h1>
        <p className={`text-lg ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'} mb-8`}>
          View and manage all celebrities in the database
        </p>

        {loading ? (
          <LoadingSpinner message="Loading celebrities..." />
        ) : error ? (
          <div className={`p-6 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
            <p className="text-status-error font-semibold">{error}</p>
          </div>
        ) : (
          <div className={`p-6 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
            <h3 className={`text-lg font-bold ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-4`}>
              📊 Celebrities ({celebrities.length} total)
            </h3>

            <div className="overflow-x-auto">
              <table className={`w-full text-sm ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'}`}>
                <thead>
                  <tr className={`border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
                    <th className="text-left py-2 px-2 font-semibold">Name</th>
                    <th className="text-left py-2 px-2 font-semibold">English Name</th>
                    <th className="text-left py-2 px-2 font-semibold">Category</th>
                    <th className="text-left py-2 px-2 font-semibold">Mentions</th>
                    <th className="text-left py-2 px-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {celebrities.map((celeb) => (
                    <tr
                      key={celeb.id}
                      className={`border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}
                    >
                      <td className="py-2 px-2 font-semibold">{celeb.name}</td>
                      <td className="py-2 px-2 text-xs">{celeb.name_english || '-'}</td>
                      <td className="py-2 px-2">
                        <span className="px-2 py-1 rounded text-xs bg-neon-cyan/10 text-neon-cyan">
                          {celeb.category}
                        </span>
                      </td>
                      <td className="py-2 px-2">{formatNumber(celeb.mention_count || 0)}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          celeb.status === 'active'
                            ? 'bg-status-success/10 text-status-success'
                            : 'bg-status-error/10 text-status-error'
                        }`}>
                          {celeb.status || 'active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
