/**
 * Application constants
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const CELEBRITY_CATEGORIES = [
  'Singer',
  'Actor',
  'Actress',
  'Host',
  'Director',
  'Dancer',
  'Model',
];

export const SORT_OPTIONS = [
  { label: 'A-Z', value: 'name_asc' },
  { label: 'Z-A', value: 'name_desc' },
  { label: 'Trending', value: 'trending' },
  { label: 'Most Mentioned', value: 'mentions_desc' },
  { label: 'Recently Updated', value: 'updated_desc' },
];

export const CELEBRITY_STATUSES = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

export const CACHE_DURATION = {
  METRICS: 6 * 24 * 60 * 60 * 1000, // 6 days
  MENTIONS: 24 * 60 * 60 * 1000, // 1 day
  CELEBRITIES: 24 * 60 * 60 * 1000, // 1 day
  TRENDING: 2 * 60 * 60 * 1000, // 2 hours
  STATS: 60 * 60 * 1000, // 1 hour
};

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  DEFAULT_OFFSET: 0,
  MAX_LIMIT: 100,
};

export const SCRAPE_JOB_TYPES = {
  BATCH: 'batch',
  SINGLE: 'single',
};

export const SCRAPE_JOB_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

export const ROUTES = {
  // Public routes
  HOME: '/',
  TRENDING: '/trending',
  CELEBRITY_LIST: '/celebrities',
  CELEBRITY_DETAIL: '/celebrity/:id',
  MENTIONS_DETAIL: '/celebrity/:id/mentions',
  CARD_EMBED: '/card/:type/:id',

  // Admin routes
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  SCRAPE_CONTROL: '/admin/scrape',
  DATA_MANAGEMENT: '/admin/data',
  ANALYTICS: '/admin/analytics',

  // Auth routes
  LOGIN: '/login',
  LOGOUT: '/logout',
};

export const METRICS_LABELS = {
  frequency: 'Mention Frequency',
  velocity: 'Mention Velocity',
  trending_score: 'Trending Score',
  popularity_index: 'Popularity Index',
  diversity: 'Source Diversity',
  keywords: 'Top Keywords',
};

export const METRIC_ICONS = {
  frequency: '📊',
  velocity: '📈',
  trending_score: '🔥',
  popularity_index: '⭐',
  diversity: '🌐',
  keywords: '🏷️',
};
