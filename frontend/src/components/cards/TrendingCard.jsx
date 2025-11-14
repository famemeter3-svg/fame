import { formatNumber, formatTrendingChange } from '../../utils/formatters.js';

/**
 * TrendingCard Component
 * Displays ranked list of trending celebrities
 *
 * Props:
 *  - celebrities: Array<{ id, name, category, mention_count, velocity, trending_score, ranking_change }>
 *  - theme: 'light' | 'dark'
 *  - mode: 'interactive' | 'static' | 'svg'
 *  - onCelebrityClick: (id) => void
 *  - limit: number (default: 5)
 */

export default function TrendingCard({
  celebrities = [],
  theme = 'dark',
  mode = 'interactive',
  onCelebrityClick,
  limit = 5,
}) {
  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-dark-bg-secondary' : 'bg-white';
  const itemBgClass = isDark ? 'bg-dark-bg-primary' : 'bg-light-bg-secondary';
  const textPrimaryClass = isDark ? 'text-dark-text-primary' : 'text-light-text-primary';
  const textSecondaryClass = isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary';
  const borderClass = isDark ? 'border-dark-border' : 'border-light-border';
  const hoverClass = isDark
    ? 'hover:bg-dark-bg-secondary'
    : 'hover:bg-light-bg-primary';

  const trendingList = celebrities.slice(0, limit);

  // Interactive and Static modes
  if (mode === 'interactive' || mode === 'static') {
    return (
      <div className={`${bgClass} ${borderClass} border rounded-lg overflow-hidden`}>
        <div className="p-6 border-b" style={{ borderColor: `var(--border-color-${isDark ? 'dark' : 'light'})` }}>
          <h3 className={`text-2xl font-display font-bold ${textPrimaryClass}`}>
            🔥 Trending This Week
          </h3>
          <p className={`text-sm ${textSecondaryClass} mt-1`}>
            Top {limit} celebrities by trending score
          </p>
        </div>

        <div className="divide-y" style={{ borderColor: `var(--border-color-${isDark ? 'dark' : 'light'})` }}>
          {trendingList.map((celebrity, idx) => {
            const ranking = idx + 1;
            const change = formatTrendingChange(celebrity.ranking_change || 0);

            return (
              <div
                key={celebrity.id}
                onClick={() => mode === 'interactive' && onCelebrityClick && onCelebrityClick(celebrity.id)}
                className={`p-4 ${mode === 'interactive' ? `cursor-pointer transition-all ${hoverClass}` : ''}`}
              >
                <div className="flex items-start justify-between">
                  {/* Rank + Info */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Ranking Badge */}
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neon-cyan/10 border-2 border-neon-cyan flex-shrink-0">
                      <span className="text-xl font-bold text-neon-cyan">#{ranking}</span>
                    </div>

                    {/* Celebrity Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold ${textPrimaryClass} truncate`}>
                        {celebrity.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded text-xs bg-neon-cyan/10 text-neon-cyan">
                          {celebrity.category}
                        </span>
                        <span className={`text-xs ${textSecondaryClass}`}>
                          {formatNumber(celebrity.mention_count)} mentions
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metrics + Change Indicator */}
                  <div className="text-right">
                    <div className={`text-xl font-bold ${change.color}`}>
                      {change.icon}
                    </div>
                    <div className={`text-xs font-semibold ${change.color} mt-1`}>
                      {change.label}
                    </div>
                    <div className={`text-xs ${textSecondaryClass} mt-2`}>
                      Score: <span className="text-neon-lime">{(celebrity.trending_score || 0).toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar for trending score */}
                <div className={`mt-3 h-2 rounded-full ${itemBgClass} overflow-hidden`}>
                  <div
                    className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta"
                    style={{ width: `${Math.min((celebrity.trending_score || 0) / 100 * 100, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // SVG Mode
  if (mode === 'svg') {
    const svgWidth = 500;
    const svgHeight = 400;
    const bgColor = isDark ? '#1e293b' : '#ffffff';
    const accentColor = '#ff00ff';

    return (
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        <defs>
          <linearGradient id="trendingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.15" />
            <stop offset="100%" stopColor="#00ff88" stopOpacity="0.15" />
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
          🔥 Trending This Week
        </text>

        {/* Rankings */}
        {trendingList.map((celebrity, idx) => {
          const y = 80 + idx * 55;
          const ranking = idx + 1;
          const scorePct = Math.min((celebrity.trending_score || 0) / 100 * 100, 100);

          return (
            <g key={celebrity.id}>
              {/* Rank circle */}
              <circle cx="50" cy={y + 15} r="14" fill={accentColor} />
              <text
                x="50"
                y={y + 22}
                textAnchor="middle"
                fontSize="14"
                fontWeight="bold"
                fill="#0f172a"
              >
                {ranking}
              </text>

              {/* Name */}
              <text
                x="80"
                y={y + 15}
                fontSize="14"
                fontWeight="bold"
                fill="#f8fafc"
                fontFamily="Space Grotesk, sans-serif"
              >
                {celebrity.name.substring(0, 20)}
              </text>

              {/* Score bar background */}
              <rect x="80" y={y + 25} width="350" height="6" fill="#334155" rx="3" />

              {/* Score bar fill */}
              <rect
                x="80"
                y={y + 25}
                width={350 * (scorePct / 100)}
                height="6"
                fill={accentColor}
                rx="3"
              />

              {/* Score value */}
              <text
                x={450}
                y={y + 30}
                fontSize="11"
                fill="#cbd5e1"
                textAnchor="end"
              >
                {(celebrity.trending_score || 0).toFixed(1)}
              </text>
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
