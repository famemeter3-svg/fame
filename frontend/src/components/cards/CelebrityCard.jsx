import { formatNumber, formatMetric } from '../../utils/formatters.js';

/**
 * CelebrityCard Component
 *
 * A reusable card displaying celebrity information
 * Supports three rendering modes: interactive, static, and SVG
 *
 * Props:
 *  - celebrity: { id, name, category, mention_count, last_mention_date }
 *  - metrics: { mention_count, velocity, trending_score }
 *  - theme: 'light' | 'dark'
 *  - mode: 'interactive' | 'static' | 'svg'
 *  - onCardClick: (id) => void
 *  - showRanking: boolean
 *  - ranking: number (1-100)
 */

export default function CelebrityCard({
  celebrity = {},
  metrics = {},
  theme = 'dark',
  mode = 'interactive',
  onCardClick,
  showRanking = false,
  ranking = null,
}) {
  const {
    id = 1,
    name = 'Unknown Celebrity',
    category = 'Singer',
    mention_count = 0,
    last_mention_date = new Date().toISOString(),
  } = celebrity;

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-dark-bg-secondary' : 'bg-white';
  const textPrimaryClass = isDark ? 'text-dark-text-primary' : 'text-light-text-primary';
  const textSecondaryClass = isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary';
  const borderClass = isDark ? 'border-dark-border' : 'border-light-border';

  // Interactive Mode
  if (mode === 'interactive') {
    return (
      <div
        onClick={() => onCardClick && onCardClick(id)}
        className={`relative ${bgClass} ${borderClass} border rounded-lg p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-neon-cyan/30`}
      >
        {showRanking && ranking && (
          <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-neon-cyan flex items-center justify-center font-bold text-dark-bg-primary text-sm">
            {ranking}
          </div>
        )}

        <div className="relative">
          <h3 className={`text-xl font-display font-bold ${textPrimaryClass} mb-2 line-clamp-2`}>
            {name}
          </h3>

          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan text-neon-cyan text-xs font-medium">
              {category}
            </span>
          </div>

          <div className="space-y-2">
            <div className={`text-sm ${textSecondaryClass}`}>
              <span className="font-medium">Mentions:</span>{' '}
              <span className="text-neon-cyan font-bold">{formatNumber(mention_count)}</span>
            </div>

            {metrics?.velocity && (
              <div className={`text-sm ${textSecondaryClass}`}>
                <span className="font-medium">Velocity:</span>{' '}
                <span className="text-neon-magenta">{metrics.velocity.toFixed(2)}/day</span>
              </div>
            )}

            {metrics?.trending_score && (
              <div className={`text-sm ${textSecondaryClass}`}>
                <span className="font-medium">Trending:</span>{' '}
                <span className="text-neon-lime">{metrics.trending_score.toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className={`mt-4 pt-4 border-t ${borderClass} text-xs ${textSecondaryClass}`}>
            Updated {new Date(last_mention_date).toLocaleDateString()}
          </div>
        </div>
      </div>
    );
  }

  // Static Mode (non-interactive)
  if (mode === 'static') {
    return (
      <div className={`relative ${bgClass} ${borderClass} border rounded-lg p-6`}>
        {showRanking && ranking && (
          <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-neon-cyan flex items-center justify-center font-bold text-dark-bg-primary text-sm">
            {ranking}
          </div>
        )}

        <div>
          <h3 className={`text-xl font-display font-bold ${textPrimaryClass} mb-2 line-clamp-2`}>
            {name}
          </h3>

          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan text-neon-cyan text-xs font-medium">
              {category}
            </span>
          </div>

          <div className="space-y-2">
            <div className={`text-sm ${textSecondaryClass}`}>
              <span className="font-medium">Mentions:</span>{' '}
              <span className="text-neon-cyan font-bold">{formatNumber(mention_count)}</span>
            </div>

            {metrics?.velocity && (
              <div className={`text-sm ${textSecondaryClass}`}>
                <span className="font-medium">Velocity:</span>{' '}
                <span className="text-neon-magenta">{metrics.velocity.toFixed(2)}/day</span>
              </div>
            )}

            {metrics?.trending_score && (
              <div className={`text-sm ${textSecondaryClass}`}>
                <span className="font-medium">Trending:</span>{' '}
                <span className="text-neon-lime">{metrics.trending_score.toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className={`mt-4 pt-4 border-t ${borderClass} text-xs ${textSecondaryClass}`}>
            Updated {new Date(last_mention_date).toLocaleDateString()}
          </div>
        </div>
      </div>
    );
  }

  // SVG Mode (for embedding/sharing)
  if (mode === 'svg') {
    const svgWidth = 300;
    const svgHeight = 350;
    const bgColor = isDark ? '#1e293b' : '#ffffff';
    const textColor = isDark ? '#f8fafc' : '#1a1a1a';
    const accentColor = '#00d9ff';

    return (
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.1" />
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

        {/* Content background */}
        <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="url(#gradient)" rx="8" />

        {/* Ranking badge */}
        {showRanking && ranking && (
          <>
            <circle
              cx={svgWidth - 30}
              cy="30"
              r="18"
              fill={accentColor}
            />
            <text
              x={svgWidth - 30}
              y="37"
              textAnchor="middle"
              fontSize="16"
              fontWeight="bold"
              fill="#0f172a"
            >
              {ranking}
            </text>
          </>
        )}

        {/* Name */}
        <text
          x="20"
          y="50"
          fontSize="20"
          fontWeight="bold"
          fill={textColor}
          fontFamily="Space Grotesk, sans-serif"
        >
          {name.substring(0, 20)}
        </text>

        {/* Category badge background */}
        <rect
          x="20"
          y="65"
          width="80"
          height="25"
          fill="none"
          stroke={accentColor}
          strokeWidth="1"
          rx="4"
        />

        {/* Category text */}
        <text
          x="30"
          y="82"
          fontSize="12"
          fill={accentColor}
          fontFamily="Inter, sans-serif"
        >
          {category}
        </text>

        {/* Mentions metric */}
        <text
          x="20"
          y="130"
          fontSize="12"
          fill="#cbd5e1"
          fontFamily="Inter, sans-serif"
        >
          Mentions:
        </text>
        <text
          x="20"
          y="155"
          fontSize="24"
          fontWeight="bold"
          fill={accentColor}
          fontFamily="JetBrains Mono, monospace"
        >
          {formatMetric(mention_count)}
        </text>

        {/* Velocity */}
        {metrics?.velocity && (
          <>
            <text
              x="20"
              y="200"
              fontSize="12"
              fill="#cbd5e1"
              fontFamily="Inter, sans-serif"
            >
              Velocity:
            </text>
            <text
              x="20"
              y="225"
              fontSize="18"
              fontWeight="bold"
              fill="#ff00ff"
              fontFamily="JetBrains Mono, monospace"
            >
              {metrics.velocity.toFixed(2)}/day
            </text>
          </>
        )}

        {/* Footer */}
        <line x1="20" y1="270" x2={svgWidth - 20} y2="270" stroke={accentColor} strokeWidth="1" />
        <text
          x="20"
          y="295"
          fontSize="11"
          fill="#94a3b8"
          fontFamily="Inter, sans-serif"
        >
          Updated {new Date(last_mention_date).toLocaleDateString()}
        </text>

        {/* Powered by text */}
        <text
          x={svgWidth - 20}
          y={svgHeight - 10}
          fontSize="9"
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
