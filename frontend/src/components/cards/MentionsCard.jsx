import { formatDateRelative, formatDomain, formatSentiment } from '../../utils/formatters.js';

/**
 * MentionsCard Component
 * Displays a list of recent mentions for a celebrity
 * Supports: interactive and static modes only (no SVG mode)
 *
 * Props:
 *  - mentions: Array<{ mention_id, domain, url, title, cleaned_text, sentiment_score, time_stamp }>
 *  - theme: 'light' | 'dark'
 *  - mode: 'interactive' | 'static'
 *  - onMentionClick: (mentionId, url) => void
 */

export default function MentionsCard({
  mentions = [],
  theme = 'dark',
  mode = 'interactive',
  onMentionClick,
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

  if (mentions.length === 0) {
    return (
      <div className={`${bgClass} ${borderClass} border rounded-lg p-6 text-center`}>
        <p className={textSecondaryClass}>No mentions found</p>
      </div>
    );
  }

  return (
    <div className={`${bgClass} ${borderClass} border rounded-lg overflow-hidden`}>
      <div className="p-6 border-b" style={{ borderColor: `var(--border-color-${isDark ? 'dark' : 'light'})` }}>
        <h3 className={`text-xl font-display font-bold ${textPrimaryClass}`}>
          📰 Recent Mentions
        </h3>
        <p className={`text-sm ${textSecondaryClass} mt-1`}>
          {mentions.length} mention{mentions.length !== 1 ? 's' : ''} found
        </p>
      </div>

      <div className="divide-y" style={{ borderColor: `var(--border-color-${isDark ? 'dark' : 'light'})` }}>
        {mentions.map((mention, idx) => {
          const sentiment = formatSentiment(mention.sentiment_score || 0);
          const domain = formatDomain(mention.url || '');
          const date = formatDateRelative(mention.time_stamp);

          const itemClass = mode === 'interactive'
            ? `cursor-pointer transition-all ${hoverClass}`
            : '';

          return (
            <div
              key={mention.mention_id || idx}
              onClick={() => mode === 'interactive' && onMentionClick && onMentionClick(mention.mention_id, mention.url)}
              className={`p-4 ${itemClass}`}
            >
              {/* Header: Domain + Sentiment */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <a
                    href={mention.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neon-cyan hover:text-neon-magenta transition-colors text-sm font-medium"
                  >
                    {domain}
                  </a>
                  <div className={`text-xs ${textSecondaryClass} mt-0.5`}>
                    {date}
                  </div>
                </div>

                <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-opacity-10 ${sentiment.color}`}>
                  <span className="text-sm">{sentiment.emoji}</span>
                  <span className={`text-xs font-medium ${sentiment.color}`}>
                    {sentiment.label}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h4 className={`font-semibold ${textPrimaryClass} mb-2 line-clamp-2 text-sm`}>
                {mention.title || 'Untitled'}
              </h4>

              {/* Preview text */}
              <p className={`text-sm ${textSecondaryClass} line-clamp-2`}>
                {mention.cleaned_text || 'No content available'}
              </p>

              {/* Action hint */}
              {mode === 'interactive' && (
                <div className="mt-2 text-xs text-neon-cyan">
                  Click to view full mention →
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
