import { formatNumber } from '../../utils/formatters.js';

/**
 * StatsCard Component
 * Displays system-wide statistics
 *
 * Props:
 *  - stats: {
 *      total_celebrities: number,
 *      total_mentions: number,
 *      avg_mentions: number,
 *      trending_keywords: Array<string>
 *    }
 *  - theme: 'light' | 'dark'
 *  - mode: 'interactive' | 'static' | 'svg'
 *  - onStatClick: (statKey) => void
 */

export default function StatsCard({
  stats = {
    total_celebrities: 0,
    total_mentions: 0,
    avg_mentions: 0,
    trending_keywords: [],
  },
  theme = 'dark',
  mode = 'interactive',
  onStatClick,
}) {
  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-dark-bg-secondary' : 'bg-white';
  const gridBgClass = isDark ? 'bg-dark-bg-primary' : 'bg-light-bg-secondary';
  const textPrimaryClass = isDark ? 'text-dark-text-primary' : 'text-light-text-primary';
  const textSecondaryClass = isDark ? 'text-dark-text-secondary' : 'text-light-text-secondary';
  const borderClass = isDark ? 'border-dark-border' : 'border-light-border';
  const hoverClass = isDark ? 'hover:border-neon-cyan' : 'hover:border-neon-cyan';

  const statBoxes = [
    {
      key: 'total_celebrities',
      label: 'Total Celebrities',
      value: formatNumber(stats.total_celebrities || 0),
      icon: '👥',
      color: 'neon-cyan',
    },
    {
      key: 'total_mentions',
      label: 'Total Mentions',
      value: formatNumber(stats.total_mentions || 0),
      icon: '📰',
      color: 'neon-magenta',
    },
    {
      key: 'avg_mentions',
      label: 'Average per Celebrity',
      value: (stats.avg_mentions || 0).toFixed(1),
      icon: '📊',
      color: 'neon-lime',
    },
  ];

  const keywords = stats.trending_keywords || [];

  // Interactive and Static modes
  if (mode === 'interactive' || mode === 'static') {
    return (
      <div className={`${bgClass} ${borderClass} border rounded-lg p-6`}>
        <h3 className={`text-xl font-display font-bold ${textPrimaryClass} mb-6`}>
          📈 System Statistics
        </h3>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {statBoxes.map(({ key, label, value, icon, color }) => (
            <div
              key={key}
              onClick={() => mode === 'interactive' && onStatClick && onStatClick(key)}
              className={`${gridBgClass} ${borderClass} border rounded-lg p-4 ${
                mode === 'interactive'
                  ? `cursor-pointer transition-all ${hoverClass}`
                  : ''
              }`}
            >
              <div className={`text-3xl mb-2`}>{icon}</div>
              <div className={`text-xs ${textSecondaryClass} mb-2`}>{label}</div>
              <div className={`text-3xl font-bold text-${color}`}>{value}</div>
            </div>
          ))}
        </div>

        {/* Trending Keywords */}
        {keywords.length > 0 && (
          <div className={`border-t ${borderClass} pt-6`}>
            <h4 className={`text-sm font-semibold ${textPrimaryClass} mb-3`}>
              🏷️ Trending Keywords
            </h4>
            <div className="flex flex-wrap gap-2">
              {keywords.slice(0, 10).map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-neon-lime/10 border border-neon-lime/30 text-neon-lime text-xs font-medium"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // SVG Mode
  if (mode === 'svg') {
    const svgWidth = 600;
    const svgHeight = 300;
    const bgColor = isDark ? '#1e293b' : '#ffffff';
    const accentColor = '#00ff88';

    return (
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
        <defs>
          <linearGradient id="statsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
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
          📈 System Statistics
        </text>

        {/* Stat boxes */}
        {statBoxes.map((stat, idx) => {
          const x = 30 + idx * 180;
          const y = 70;

          return (
            <g key={stat.key}>
              <rect
                x={x}
                y={y}
                width="160"
                height="120"
                fill="#334155"
                stroke={accentColor}
                strokeWidth="1"
                rx="6"
              />

              <text
                x={x + 10}
                y={y + 25}
                fontSize="28"
                fontWeight="bold"
                fill={accentColor}
                fontFamily="JetBrains Mono, monospace"
              >
                {stat.value}
              </text>

              <text
                x={x + 10}
                y={y + 65}
                fontSize="12"
                fill="#cbd5e1"
                fontFamily="Inter, sans-serif"
              >
                {stat.label}
              </text>

              <text
                x={x + 80}
                y={y + 35}
                fontSize="32"
                textAnchor="middle"
              >
                {stat.icon}
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
