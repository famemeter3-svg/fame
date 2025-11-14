import { useEffect, useState } from 'react';
import Header from '../../components/shared/Header.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import themeStore from '../../context/themeStore.js';
import { fetchAdminJobs, startScrape, fetchCelebrities } from '../../services/api.js';

/**
 * Scrape Control page
 * Manage and trigger scraping jobs
 */

export default function ScrapeControl() {
  const { isDark } = themeStore();
  const [jobs, setJobs] = useState([]);
  const [celebrities, setCelebrities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCelebrity, setSelectedCelebrity] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [jobsRes, celebRes] = await Promise.all([
          fetchAdminJobs(),
          fetchCelebrities(100, 0),
        ]);

        setJobs(jobsRes.data?.data || jobsRes.data || []);
        setCelebrities(celebRes.data?.data || celebRes.data || []);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleStartBatchScrape = async () => {
    try {
      setScraping(true);
      setError(null);
      await startScrape('batch');
      alert('Batch scrape started!');
      // Reload jobs
      const res = await fetchAdminJobs();
      setJobs(res.data?.data || res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to start scrape');
    } finally {
      setScraping(false);
    }
  };

  const handleStartSingleScrape = async () => {
    if (!selectedCelebrity) {
      alert('Please select a celebrity');
      return;
    }

    try {
      setScraping(true);
      setError(null);
      await startScrape('single', parseInt(selectedCelebrity));
      alert('Single scrape started!');
      setSelectedCelebrity('');
      // Reload jobs
      const res = await fetchAdminJobs();
      setJobs(res.data?.data || res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to start scrape');
    } finally {
      setScraping(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-bg-primary' : 'bg-white'}`}>
      <Header isAdmin />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className={`text-4xl font-display font-bold ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-2`}>
          ⚙️ Scrape Control
        </h1>
        <p className={`text-lg ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'} mb-8`}>
          Start and monitor scraping jobs
        </p>

        {loading ? (
          <LoadingSpinner message="Loading scrape control..." />
        ) : error ? (
          <div className={`p-6 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'} mb-8`}>
            <p className="text-status-error font-semibold">{error}</p>
          </div>
        ) : null}

        <div className="space-y-8">
          {/* Job Controls */}
          <div className={`p-6 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
            <h3 className={`text-xl font-bold ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-4`}>
              🚀 Start New Job
            </h3>

            <div className="space-y-4">
              {/* Batch Scrape */}
              <div>
                <h4 className={`font-semibold ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-2`}>
                  Batch Scrape All Celebrities
                </h4>
                <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'} mb-3`}>
                  Scrape all 100 celebrities. This may take a while.
                </p>
                <button
                  onClick={handleStartBatchScrape}
                  disabled={scraping}
                  className="px-6 py-2 bg-neon-cyan text-dark-bg-primary rounded-lg hover:bg-neon-cyan/90 disabled:opacity-50 transition-colors font-medium"
                >
                  {scraping ? 'Starting...' : 'Start Batch Scrape'}
                </button>
              </div>

              {/* Single Celebrity Scrape */}
              <div className={`p-4 border-t ${isDark ? 'border-dark-border' : 'border-light-border'} pt-4`}>
                <h4 className={`font-semibold ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-2`}>
                  Scrape Single Celebrity
                </h4>
                <div className="flex gap-2">
                  <select
                    value={selectedCelebrity}
                    onChange={(e) => setSelectedCelebrity(e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-lg ${isDark ? 'bg-dark-bg-primary text-dark-text-primary border-dark-border' : 'bg-white text-light-text-primary border-light-border'} border`}
                  >
                    <option value="">Select a celebrity...</option>
                    {celebrities.map((celeb) => (
                      <option key={celeb.id} value={celeb.id}>
                        {celeb.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleStartSingleScrape}
                    disabled={scraping || !selectedCelebrity}
                    className="px-6 py-2 bg-neon-magenta text-white rounded-lg hover:bg-neon-magenta/90 disabled:opacity-50 transition-colors font-medium"
                  >
                    {scraping ? 'Starting...' : 'Scrape'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Jobs */}
          <div className={`p-6 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
            <h3 className={`text-xl font-bold ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-4`}>
              📋 Recent Jobs
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
                      <th className="text-left py-2 px-2 font-semibold">Progress</th>
                      <th className="text-left py-2 px-2 font-semibold">Found</th>
                      <th className="text-left py-2 px-2 font-semibold">Started</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr
                        key={job.job_id}
                        className={`border-b ${isDark ? 'border-dark-border' : 'border-light-border'}`}
                      >
                        <td className="py-2 px-2 font-mono text-xs">{job.job_id}</td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            job.status === 'completed'
                              ? 'bg-status-success/10 text-status-success'
                              : job.status === 'running'
                              ? 'bg-neon-cyan/10 text-neon-cyan'
                              : 'bg-status-error/10 text-status-error'
                          }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          <div className="w-32 h-2 rounded-full bg-gray-300 overflow-hidden">
                            <div
                              className="h-full bg-neon-cyan"
                              style={{ width: `${job.progress || 0}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-2 px-2">{job.mentions_found || 0}</td>
                        <td className="py-2 px-2 text-xs">
                          {job.start_time && new Date(job.start_time).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
