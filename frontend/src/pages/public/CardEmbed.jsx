import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import Header from '../../components/shared/Header.jsx';
import LoadingSpinner from '../../components/shared/LoadingSpinner.jsx';
import CelebrityCard from '../../components/cards/CelebrityCard.jsx';
import MetricsCard from '../../components/cards/MetricsCard.jsx';
import TrendingCard from '../../components/cards/TrendingCard.jsx';
import StatsCard from '../../components/cards/StatsCard.jsx';
import themeStore from '../../context/themeStore.js';
import { fetchCardCelebrity, fetchCardMetrics, fetchCardTrending, fetchCardStats } from '../../services/api.js';

/**
 * CardEmbed page
 * Displays embeddable cards in SVG or static HTML mode
 * URL: /card/:type/:id?theme=dark
 * Types: celebrity, metrics, trending, stats
 */

export default function CardEmbed() {
  const { type, id } = useParams();
  const [searchParams] = useSearchParams();
  const { isDark } = themeStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const themeParam = searchParams.get('theme') || (isDark ? 'dark' : 'light');
  const modeParam = searchParams.get('mode') || 'svg';

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        let response;
        switch (type) {
          case 'celebrity':
            response = await fetchCardCelebrity(id);
            break;
          case 'metrics':
            response = await fetchCardMetrics(id);
            break;
          case 'trending':
            response = await fetchCardTrending(5);
            break;
          case 'stats':
            response = await fetchCardStats();
            break;
          default:
            throw new Error('Invalid card type');
        }

        setData(response.data?.data || response.data);
      } catch (err) {
        console.error('Error loading card:', err);
        setError(err.message || 'Failed to load card');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [type, id]);

  const handleDownload = () => {
    const svg = document.querySelector('svg');
    if (svg) {
      const svgString = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-${id || 'card'}.svg`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleCopyEmbed = () => {
    const embedCode = `<img src="${window.location.href}" alt="${type} card" />`;
    navigator.clipboard.writeText(embedCode);
    alert('Embed code copied to clipboard!');
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-dark-bg-primary' : 'bg-white'}`}>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <LoadingSpinner message="Generating card..." />
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
            <p className="text-status-error font-semibold">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-dark-bg-primary' : 'bg-white'}`}>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <p className={isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}>
            Card not found
          </p>
        </main>
      </div>
    );
  }

  let cardComponent = null;

  if (type === 'celebrity' && data.id) {
    cardComponent = (
      <CelebrityCard
        celebrity={data}
        theme={themeParam}
        mode={modeParam}
      />
    );
  } else if (type === 'metrics') {
    cardComponent = (
      <MetricsCard
        metrics={data}
        theme={themeParam}
        mode={modeParam}
      />
    );
  } else if (type === 'trending') {
    cardComponent = (
      <TrendingCard
        celebrities={Array.isArray(data) ? data : data.celebrities || []}
        theme={themeParam}
        mode={modeParam}
        limit={5}
      />
    );
  } else if (type === 'stats') {
    cardComponent = (
      <StatsCard
        stats={data}
        theme={themeParam}
        mode={modeParam}
      />
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-bg-primary' : 'bg-white'}`}>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className={`text-3xl font-display font-bold ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-2`}>
            🎴 Shareable Card
          </h1>
          <p className={`text-lg ${isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary'}`}>
            Embed this card on your website or README
          </p>
        </div>

        {/* Card Display */}
        <div className={`mb-8 p-8 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'} flex justify-center`}>
          <div className="overflow-auto">
            {cardComponent}
          </div>
        </div>

        {/* Controls */}
        <div className={`p-6 rounded-lg ${isDark ? 'bg-dark-bg-secondary' : 'bg-light-bg-secondary'} border ${isDark ? 'border-dark-border' : 'border-light-border'}`}>
          <h3 className={`text-lg font-bold ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-4`}>
            Share Options
          </h3>

          <div className="space-y-4">
            {/* Current URL */}
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-2`}>
                Card URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={window.location.href}
                  readOnly
                  className={`flex-1 px-3 py-2 rounded-lg ${isDark ? 'bg-dark-bg-primary text-dark-text-primary' : 'bg-white text-light-text-primary'} border ${isDark ? 'border-dark-border' : 'border-light-border'} text-sm`}
                />
                <button
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                  className="px-4 py-2 bg-neon-cyan text-dark-bg-primary rounded-lg hover:bg-neon-cyan/90 transition-colors font-medium text-sm"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Embed Code */}
            <div>
              <label className={`block text-sm font-medium ${isDark ? 'text-dark-text-primary' : 'text-light-text-primary'} mb-2`}>
                Embed Code
              </label>
              <div className="flex gap-2">
                <textarea
                  value={`<img src="${window.location.href}" alt="${type} card" />`}
                  readOnly
                  className={`flex-1 px-3 py-2 rounded-lg ${isDark ? 'bg-dark-bg-primary text-dark-text-primary' : 'bg-white text-light-text-primary'} border ${isDark ? 'border-dark-border' : 'border-light-border'} text-sm font-mono h-20`}
                />
                <button
                  onClick={handleCopyEmbed}
                  className="px-4 py-2 bg-neon-magenta text-white rounded-lg hover:bg-neon-magenta/90 transition-colors font-medium text-sm whitespace-nowrap"
                >
                  Copy Code
                </button>
              </div>
            </div>

            {/* Download Button */}
            <div>
              <button
                onClick={handleDownload}
                className="w-full px-4 py-3 bg-neon-lime text-dark-bg-primary rounded-lg hover:bg-neon-lime/90 transition-colors font-medium"
              >
                ⬇️ Download as SVG
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
