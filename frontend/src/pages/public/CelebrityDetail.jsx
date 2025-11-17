import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/shared/Header.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import CelebrityCard from '../../components/cards/CelebrityCard.jsx';
import MetricsCard from '../../components/cards/MetricsCard.jsx';
import MentionsCard from '../../components/cards/MentionsCard.jsx';
import themeStore from '../../context/themeStore.js';
import { fetchCelebrityById, fetchMetrics, fetchMentions } from '../../services/api.js';
import { formatNumber } from '../../utils/formatters.js';

/**
 * Celebrity Detail page
 * Full profile with tabs for metrics, mentions, and sharing
 */

export default function CelebrityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = themeStore();
  const [celebrity, setCelebrity] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [mentions, setMentions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('metrics');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [celebRes, metricsRes, mentionsRes] = await Promise.all([
          fetchCelebrityById(id),
          fetchMetrics(id),
          fetchMentions(id, 10),
        ]);

        setCelebrity(celebRes.data?.data || celebRes.data);
        setMetrics(metricsRes.data?.data || metricsRes.data);
        setMentions(mentionsRes.data?.data || mentionsRes.data || []);
      } catch (err) {
        console.error('Error fetching celebrity details:', err);
        setError(err.message || 'Failed to load celebrity details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  const theme = isDark ? 'dark' : 'light';
  const tabs = ['metrics', 'mentions', 'sources', 'share'];

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-dark-bg-primary' : 'bg-white'}`}>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <LoadingSpinner message="Loading celebrity details..." />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-dark-bg-primary' : 'bg-white'}`}>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className={`p-6 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
            <div className="text-status-error font-semibold mb-2">Error</div>
            <p className={isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}>
              {error}
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-neon-cyan text-dark-bg-primary rounded-lg hover:bg-neon-cyan/90 transition-colors font-medium"
            >
              Back to List
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!celebrity) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-dark-bg-primary' : 'bg-white'}`}>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className={isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}>
            Celebrity not found
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-bg-primary' : 'bg-white'}`}>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header with celebrity card */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="mb-4 text-neon-cyan hover:text-neon-magenta transition-colors text-sm font-medium"
          >
            ← Back to List
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <CelebrityCard
                celebrity={celebrity}
                metrics={metrics}
                theme={theme}
                mode="static"
              />
            </div>

            <div className="md:col-span-2">
              <div className={`${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} rounded-lg p-6 border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
                <h1 className={`text-3xl font-display font-bold ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-2`}>
                  {celebrity.name}
                </h1>
                <p className={`text-lg ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'} mb-4`}>
                  {celebrity.name_english || celebrity.name}
                </p>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className={`text-2xl font-bold text-neon-cyan`}>
                      {formatNumber(celebrity.mention_count || 0)}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
                      Total Mentions
                    </div>
                  </div>
                  {metrics && (
                    <>
                      <div>
                        <div className={`text-2xl font-bold text-neon-magenta`}>
                          {(metrics.velocity || 0).toFixed(2)}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
                          Mentions/Day
                        </div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold text-neon-lime`}>
                          {(metrics.trending_score || 0).toFixed(1)}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
                          Trending Score
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`border-b ${isDark ? 'border-dark-border' : 'border-light-border'} mb-8`}>
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 font-medium transition-colors ${
                  activeTab === tab
                    ? 'text-neon-cyan border-b-2 border-neon-cyan'
                    : `${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'} hover:text-neon-cyan`
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'metrics' && metrics && (
          <MetricsCard metrics={metrics} theme={theme} mode="static" />
        )}

        {activeTab === 'mentions' && (
          <MentionsCard mentions={mentions} theme={theme} mode="static" />
        )}

        {activeTab === 'sources' && (
          <div className={`${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} rounded-lg p-6 border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
            <h3 className={`text-xl font-bold ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-6`}>
              📊 Source Breakdown
            </h3>
            {mentions && mentions.length > 0 ? (
              <div className="space-y-4">
                {/* Domain Diversity Stats */}
                {(() => {
                  const domainCount = new Map();
                  mentions.forEach(m => {
                    const domain = m.domain || 'Unknown';
                    domainCount.set(domain, (domainCount.get(domain) || 0) + 1);
                  });
                  const sortedDomains = Array.from(domainCount.entries())
                    .sort((a, b) => b[1] - a[1]);
                  const totalMentions = mentions.length;
                  const uniqueDomains = sortedDomains.length;

                  return (
                    <>
                      {/* Summary Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className={`p-4 rounded-lg ${isDark ? 'bg-dark-bg-primary' : 'bg-light-bg-primary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
                          <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>Total Mentions</p>
                          <p className="text-2xl font-bold text-neon-cyan">{totalMentions}</p>
                        </div>
                        <div className={`p-4 rounded-lg ${isDark ? 'bg-dark-bg-primary' : 'bg-light-bg-primary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
                          <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>Unique Domains</p>
                          <p className="text-2xl font-bold text-neon-magenta">{uniqueDomains}</p>
                        </div>
                        <div className={`p-4 rounded-lg ${isDark ? 'bg-dark-bg-primary' : 'bg-light-bg-primary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
                          <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>Top Source</p>
                          <p className="text-lg font-bold text-neon-lime">{sortedDomains[0]?.[0]?.split('/')[2] || 'N/A'}</p>
                        </div>
                        <div className={`p-4 rounded-lg ${isDark ? 'bg-dark-bg-primary' : 'bg-light-bg-primary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
                          <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>Diversity Score</p>
                          <p className="text-2xl font-bold text-neon-cyan">
                            {((uniqueDomains / totalMentions) * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      {/* Domain List */}
                      <div className="space-y-3">
                        <h4 className={`font-semibold ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'}`}>Top Sources</h4>
                        {sortedDomains.slice(0, 15).map(([domain, count]) => {
                          const percentage = ((count / totalMentions) * 100).toFixed(1);
                          return (
                            <div key={domain} className="flex items-center gap-3">
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'}`}>
                                  {domain}
                                </p>
                              </div>
                              <div className="w-32 h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <div className={`text-right text-sm font-semibold ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
                                {count} ({percentage}%)
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <p className={isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}>
                No mentions data available
              </p>
            )}
          </div>
        )}

        {activeTab === 'share' && (
          <div className={`${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} rounded-lg p-6 border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
            <h3 className={`text-xl font-bold ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-4`}>
              🔗 Share Celebrity Card
            </h3>
            <div className="space-y-3">
              <p className={`text-sm ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
                Get a shareable card link for this celebrity:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}/card/celebrity/${id}`}
                  readOnly
                  className={`flex-1 px-3 py-2 rounded-lg ${isDark ? 'bg-dark-bg-primary text-dark-text-primary' : 'bg-white text-light-text-primary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}
                />
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/card/celebrity/${id}`)}
                  className="px-4 py-2 bg-neon-cyan text-dark-bg-primary rounded-lg hover:bg-neon-cyan/90 transition-colors font-medium"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
