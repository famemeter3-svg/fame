import { METRIC_ICONS } from '../../utils/constants.js';

/**
 * MetricsCard Component
 * Displays 6 key metrics for a celebrity
 *
 * Props:
 *  - metrics: { frequency, velocity, trending_score, popularity_index, diversity, keywords }
 *  - theme: 'light' | 'dark'
 *  - mode: 'interactive' | 'static' | 'svg'
 *  - onMetricClick: (metricKey) => void
 */

export default function MetricsCard({
  metrics = {
    frequency: 0,
    velocity: 0,
    trending_score: 0,
    popularity_index: 0,
    diversity: 0,
    keywords: [],
  },
  theme = 'dark',
  mode = 'interactive',
  onMetricClick,
}) {
  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-dark-bg-secondary' : 'bg-white';
  const gridBgClass = isDark ? 'bg-dark-bg-primary' : 'bg-light-bg-secondary';
  const textPrimaryClass = isDark ? 'text-dark-text-primary' : 'text-light-text-primary';
  const textSecondaryClass = isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary';
  const borderClass = isDark ? 'border-dark-border' : 'border-light-border';

  const metricData = [
    {
      key: 'frequency',
      label: 'Mention Frequency',
      value: Math.round(metrics.frequency || 0),
      icon: METRIC_ICONS.frequency,
      color: 'neon-cyan',
    },
    {
      key: 'velocity',
      label: 'Mention Velocity',
      value: (metrics.velocity || 0).toFixed(2),
      unit: '/day',
      icon: METRIC_ICONS.velocity,
      color: 'neon-magenta',
    },
    {
      key: 'trending_score',
      label: 'Trending Score',
      value: (metrics.trending_score || 0).toFixed(1),
      icon: METRIC_ICONS.trending_score,
      color: 'neon-lime',
    },
    {
      key: 'popularity_index',
      label: 'Popularity Index',
      value: Math.round(metrics.popularity_index || 0),
      unit: '%',
      icon: METRIC_ICONS.popularity_index,
      color: 'neon-cyan',
    },
    {
      key: 'diversity',
      label: 'Source Diversity',
      value: Math.round(metrics.diversity || 0),
      icon: METRIC_ICONS.diversity,
      color: 'neon-magenta',
    },
  ];

  const keywords = metrics.keywords || [];

  // Interactive and Static modes use same structure
  if (mode === 'interactive' || mode === 'static') {
    return (
      <div className={`${bgClass} ${borderClass} border rounded-lg p-6`}>
        <h3 className={`text-xl font-display font-bold ${textPrimaryClass} mb-6`}>
          📊 Metrics Overview
        </h3>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {metricData.map(({ key, label, value, unit, icon, color }) => (
            <div
              key={key}
              onClick={() => mode === 'interactive' && onMetricClick && onMetricClick(key)}
              className={`${gridBgClass} rounded-lg p-4 ${
                mode === 'interactive' ? 'cursor-pointer hover:border-neon-cyan transition-all' : ''
              } border ${borderClass}`}
            >
              <div className={`text-2xl mb-2`}>{icon}</div>
              <div className={`text-xs ${textSecondaryClass} mb-1`}>{label}</div>
              <div className={`text-xl font-bold text-${color}`}>
                {value}
                {unit && <span className="text-sm ml-1">{unit}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Keywords Section */}
        {keywords.length > 0 && (
          <>
            <div className={`border-t ${borderClass} pt-6`}>
              <h4 className={`text-sm font-semibold ${textPrimaryClass} mb-3`}>
                {METRIC_ICONS.keywords} Top Keywords
              </h4>
              <div className="flex flex-wrap gap-2">
                {keywords.slice(0, 8).map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // SVG Mode
  if (mode === 'svg') {
    const svgWidth = 600;
    const svgHeight = 400;
    const bgColor = isDark ? '#1e293b' : '#ffffff';
    const accentColor = '#00d9ff';

    return (
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        <defs>
          <linearGradient id="metricGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect width={svgWidth} height={svgHeight} fill={bgColor} />

        {/* Border */}
        <rect
          x="1"
          y="1"
          width={svgWidth - 2}
          height={svgHeight - 2}
          fill="none"
          stroke={accentColor}
          strokeWidth="2"
          rx="8"
        />

        {/* Title */}
        <text
          x="30"
          y="40"
          fontSize="24"
          fontWeight="bold"
          fill="#f8fafc"
          fontFamily="Space Grotesk, sans-serif"
        >
          📊 Metrics Overview
        </text>

        {/* Metric boxes */}
        {metricData.map((metric, idx) => {
          const row = Math.floor(idx / 3);
          const col = idx % 3;
          const x = 30 + col * 180;
          const y = 80 + row * 120;

          return (
            <g key={metric.key}>
              <rect
                x={x}
                y={y}
                width="160"
                height="100"
                fill="#334155"
                stroke={accentColor}
                strokeWidth="1"
                rx="6"
              />

              <text
                x={x + 10}
                y={y + 25}
                fontSize="12"
                fill="#cbd5e1"
                fontFamily="Inter, sans-serif"
              >
                {metric.label}
              </text>

              <text
                x={x + 10}
                y={y + 70}
                fontSize="28"
                fontWeight="bold"
                fill={accentColor}
                fontFamily="JetBrains Mono, monospace"
              >
                {metric.value}
              </text>

              {metric.unit && (
                <text
                  x={x + 120}
                  y={y + 70}
                  fontSize="14"
                  fill={accentColor}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {metric.unit}
                </text>
              )}
            </g>
          );
        })}

        {/* Footer */}
        <text
          x={svgWidth - 30}
          y={svgHeight - 15}
          fontSize="10"
          fill="#64748b"
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
        >
          Taiwan Celebrity Tracker
        </text>
      </svg>
    );
  }

  return null;
}
