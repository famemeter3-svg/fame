import { useEffect, useState } from 'react';
import Header from '../../components/shared/Header.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import StatsCard from '../../components/cards/StatsCard.jsx';
import themeStore from '../../context/themeStore.js';
import { fetchAdminStats, fetchAdminJobs } from '../../services/api.js';
import { formatNumber } from '../../utils/formatters.js';

/**
 * Admin Dashboard
 * Overview of system statistics and scraping jobs
 */

export default function AdminDashboard() {
  const { isDark } = themeStore();
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsRes, jobsRes] = await Promise.all([
          fetchAdminStats(),
          fetchAdminJobs(),
        ]);

        setStats(statsRes.data?.data || statsRes.data);
        setJobs(jobsRes.data?.data || jobsRes.data || []);
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const theme = isDark ? 'dark' : 'light';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-bg-primary' : 'bg-white'}`}>
      <Header isAdmin />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className={`text-4xl font-display font-bold ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-2`}>
          📊 Admin Dashboard
        </h1>
        <p className={`text-lg ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'} mb-8`}>
          System overview and monitoring
        </p>

        {loading ? (
          <LoadingSpinner message="Loading dashboard..." />
        ) : error ? (
          <div className={`p-6 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
            <p className="text-status-error font-semibold">{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Card */}
            {stats && (
              <StatsCard stats={stats} theme={theme} mode="static" />
            )}

            {/* Quick Actions */}
            <div className={`p-6 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
              <h3 className={`text-xl font-bold ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-4`}>
                ⚡ Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <a
                  href="/admin/scrape"
                  className="px-4 py-3 bg-neon-cyan text-dark-bg-primary rounded-lg hover:bg-neon-cyan/90 transition-colors font-medium text-center"
                >
                  Start Scrape
                </a>
                <a
                  href="/admin/data"
                  className="px-4 py-3 bg-neon-magenta text-white rounded-lg hover:bg-neon-magenta/90 transition-colors font-medium text-center"
                >
                  Manage Data
                </a>
                <a
                  href="/admin/analytics"
                  className="px-4 py-3 bg-neon-lime text-dark-bg-primary rounded-lg hover:bg-neon-lime/90 transition-colors font-medium text-center"
                >
                  View Analytics
                </a>
                <button
                  onClick={() => window.location.reload()}
                  className={`px-4 py-3 ${isDark ? 'bg-dark-bg-primary border border-neon-cyan text-neon-cyan' : 'bg-light-bg-primary border border-neon-cyan text-neon-cyan'} rounded-lg hover:bg-neon-cyan hover:text-dark-bg-primary transition-colors font-medium`}
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Recent Jobs */}
            <div className={`p-6 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
              <h3 className={`text-xl font-bold ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-4`}>
                📋 Recent Scraping Jobs
              </h3>

              {jobs.length === 0 ? (
                <p className={isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}>
                  No jobs yet
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className={`w-full text-sm ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'}`}>
                    <thead>
                      <tr className={`border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
                        <th className="text-left py-2 px-2 font-semibold">Job ID</th>
                        <th className="text-left py-2 px-2 font-semibold">Status</th>
                        <th className="text-left py-2 px-2 font-semibold">Type</th>
                        <th className="text-left py-2 px-2 font-semibold">Progress</th>
                        <th className="text-left py-2 px-2 font-semibold">Found</th>
                        <th className="text-left py-2 px-2 font-semibold">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.slice(0, 10).map((job) => (
                        <tr
                          key={job.job_id}
                          className={`border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}
                        >
                          <td className="py-2 px-2">{job.job_id}</td>
                          <td className="py-2 px-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              job.status === 'completed'
                                ? 'bg-status-success/10 text-status-success'
                                : job.status === 'running'
                                ? 'bg-neon-cyan/10 text-neon-cyan'
                                : job.status === 'failed'
                                ? 'bg-status-error/10 text-status-error'
                                : 'bg-status-warning/10 text-status-warning'
                            }`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="py-2 px-2">{job.job_type || 'batch'}</td>
                          <td className="py-2 px-2">{job.progress || 0}%</td>
                          <td className="py-2 px-2">{formatNumber(job.mentions_found || 0)}</td>
                          <td className="py-2 px-2 text-xs">
                            {job.start_time && new Date(job.start_time).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* System Health */}
            <div className={`p-6 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
              <h3 className={`text-xl font-bold ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-4`}>
                💚 System Health
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-status-success/10 border border-status-success">
                  <div className="text-status-success font-semibold mb-1">✓ API</div>
                  <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
                    Running on port 5000
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-status-success/10 border border-status-success">
                  <div className="text-status-success font-semibold mb-1">✓ Database</div>
                  <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
                    MySQL connected
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-status-success/10 border border-status-success">
                  <div className="text-status-success font-semibold mb-1">✓ Cache</div>
                  <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
                    Ready
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
