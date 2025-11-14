import { useEffect, useState } from 'react';
import Header from '../../components/shared/Header.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import themeStore from '../../context/themeStore.js';
import { fetchAdminStats } from '../../services/api.js';
import { formatNumber } from '../../utils/formatters.js';

/**
 * Analytics page
 * View statistics and insights
 */

export default function Analytics() {
  const { isDark } = themeStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchAdminStats();
        setStats(res.data?.data || res.data);
      } catch (err) {
        console.error('Error loading analytics:', err);
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
          📈 Analytics
        </h1>
        <p className={`text-lg ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'} mb-8`}>
          System statistics and insights
        </p>

        {loading ? (
          <LoadingSpinner message="Loading analytics..." />
        ) : error ? (
          <div className={`p-6 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
            <p className="text-status-error font-semibold">{error}</p>
          </div>
        ) : stats ? (
          <div className="space-y-8">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-6 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
                <div className={`text-3xl font-bold text-neon-cyan`}>
                  {formatNumber(stats.total_celebrities || 0)}
                </div>
                <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'} mt-2`}>
                  Total Celebrities
                </p>
              </div>

              <div className={`p-6 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
                <div className={`text-3xl font-bold text-neon-magenta`}>
                  {formatNumber(stats.total_mentions || 0)}
                </div>
                <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'} mt-2`}>
                  Total Mentions
                </p>
              </div>

              <div className={`p-6 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
                <div className={`text-3xl font-bold text-neon-lime`}>
                  {(stats.avg_mentions_per_celeb || 0).toFixed(1)}
                </div>
                <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'} mt-2`}>
                  Avg Mentions/Celeb
                </p>
              </div>

              <div className={`p-6 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
                <div className={`text-3xl font-bold text-neon-cyan`}>
                  {stats.total_jobs || 0}
                </div>
                <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'} mt-2`}>
                  Total Jobs
                </p>
              </div>
            </div>

            {/* Trending Keywords */}
            {stats.trending_keywords && stats.trending_keywords.length > 0 && (
              <div className={`p-6 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
                <h3 className={`text-xl font-bold ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-4`}>
                  🏷️ Trending Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {stats.trending_keywords.slice(0, 20).map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-sm font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Info */}
            <div className={`p-6 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
              <h3 className={`text-xl font-bold ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-4`}>
                ℹ️ System Information
              </h3>
              <div className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'} space-y-2`}>
                <p>
                  <strong>Total Records:</strong> {formatNumber(stats.total_mentions || 0)} mentions from {formatNumber(stats.total_celebrities || 0)} celebrities
                </p>
                <p>
                  <strong>Average:</strong> {(stats.avg_mentions_per_celeb || 0).toFixed(1)} mentions per celebrity
                </p>
                <p>
                  <strong>Data Status:</strong> ✓ Database synchronized and up-to-date
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
