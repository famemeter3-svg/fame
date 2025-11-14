import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';

/**
 * Format date utilities
 */

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @param {string} dateFormat - Format string (default: 'MMM d, yyyy')
 * @returns {string} Formatted date
 */
export const formatDate = (date, dateFormat = 'MMM d, yyyy') => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, dateFormat);
  } catch {
    return 'Invalid date';
  }
};

/**
 * Format date relative to now (e.g., "2 days ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative date
 */
export const formatDateRelative = (date) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: zhTW });
  } catch {
    return 'Unknown time';
  }
};

/**
 * Format large numbers with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString('en-US');
};

/**
 * Format percentage
 * @param {number} value - Value to format (0-100)
 * @param {number} decimals - Decimal places (default: 1)
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (!Number.isFinite(value)) return '0%';
  return `${(value || 0).toFixed(decimals)}%`;
};

/**
 * Format metric with appropriate unit and scale
 * @param {number} value - Metric value
 * @returns {string} Formatted metric
 */
export const formatMetric = (value) => {
  if (!Number.isFinite(value)) return '0';

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return formatNumber(Math.round(value));
};

/**
 * Format text snippet (truncate with ellipsis)
 * @param {string} text - Text to format
 * @param {number} length - Max length (default: 100)
 * @returns {string} Truncated text
 */
export const formatSnippet = (text, length = 100) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return `${text.substring(0, length).trim()}...`;
};

/**
 * Format domain name from URL
 * @param {string} url - URL to extract domain from
 * @returns {string} Domain name
 */
export const formatDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
};

/**
 * Format sentiment score to emoji and text
 * @param {number} score - Sentiment score (-1 to 1)
 * @returns {object} { emoji, label, color }
 */
export const formatSentiment = (score) => {
  if (score > 0.3) {
    return { emoji: '😊', label: 'Positive', color: 'text-status-success' };
  }
  if (score < -0.3) {
    return { emoji: '😔', label: 'Negative', color: 'text-status-error' };
  }
  return { emoji: '😐', label: 'Neutral', color: 'text-light-text-secondary' };
};

/**
 * Format trending change indicator
 * @param {number} change - Change percentage
 * @returns {object} { icon, label, color }
 */
export const formatTrendingChange = (change) => {
  if (change > 0) {
    return { icon: '↑', label: `+${change.toFixed(1)}%`, color: 'text-status-success' };
  }
  if (change < 0) {
    return { icon: '↓', label: `${change.toFixed(1)}%`, color: 'text-status-error' };
  }
  return { icon: '→', label: 'stable', color: 'text-light-text-secondary' };
};
