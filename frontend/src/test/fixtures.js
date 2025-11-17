/**
 * Test fixtures and mock data for all components and pages
 */

export const mockCelebrities = [
  {
    id: 1,
    name: '蔡依林',
    name_english: 'Jolin Tsai',
    category: 'Singer',
    status: 'active',
    mention_count: 150,
    last_mention_date: '2025-11-17',
    last_scraped: '2025-11-17T10:30:00Z',
  },
  {
    id: 2,
    name: '周杰倫',
    name_english: 'Jay Chou',
    category: 'Singer',
    status: 'active',
    mention_count: 200,
    last_mention_date: '2025-11-16',
    last_scraped: '2025-11-16T15:00:00Z',
  },
  {
    id: 3,
    name: '林志玲',
    name_english: 'Lin Chi-Ling',
    category: 'Model',
    status: 'active',
    mention_count: 120,
    last_mention_date: '2025-11-15',
    last_scraped: '2025-11-15T12:00:00Z',
  },
];

export const mockCelebrity = mockCelebrities[0];

export const mockMetrics = {
  id: 1,
  frequency: 150,
  velocity: 2.14,
  trending_score: 85,
  popularity_index: 78,
  diversity: 42,
  keywords_json: JSON.stringify(['music', 'concert', 'new album', 'collaboration']),
};

export const mockMentions = [
  {
    mention_id: 1,
    domain: 'news.example.com',
    url: 'https://news.example.com/article/1',
    title: 'Celebrity releases new album',
    cleaned_text: 'The celebrity released a new album today with collaboration...',
    sentiment_score: 0.85,
    time_stamp: '2025-11-17T10:30:00Z',
  },
  {
    mention_id: 2,
    domain: 'entertainment.example.com',
    url: 'https://entertainment.example.com/article/2',
    title: 'Concert announcement',
    cleaned_text: 'Celebrity announces world tour concert...',
    sentiment_score: 0.92,
    time_stamp: '2025-11-16T14:00:00Z',
  },
  {
    mention_id: 3,
    domain: 'social.example.com',
    url: 'https://social.example.com/news/3',
    title: 'Fan reactions to latest news',
    cleaned_text: 'Fans excited about recent announcement...',
    sentiment_score: 0.88,
    time_stamp: '2025-11-15T09:00:00Z',
  },
];

export const mockStats = {
  total_celebrities: 100,
  total_mentions: 1800,
  avg_mentions_per_celeb: 18,
  trending_keywords: ['music', 'entertainment', 'news', 'concert', 'album'],
};

export const mockAdminStats = {
  total_celebrities: 100,
  total_mentions: 1800,
  total_jobs: 45,
  avg_mentions_per_celeb: 18,
  mentions_today: 12,
};

export const mockJobs = [
  {
    job_id: 'job_001',
    celebrity_id: null,
    job_type: 'batch',
    status: 'completed',
    progress: 100,
    mentions_found: 150,
    start_time: '2025-11-17T10:00:00Z',
    end_time: '2025-11-17T10:30:00Z',
  },
  {
    job_id: 'job_002',
    celebrity_id: 5,
    job_type: 'single',
    status: 'running',
    progress: 65,
    mentions_found: 42,
    start_time: '2025-11-17T11:00:00Z',
    end_time: null,
  },
  {
    job_id: 'job_003',
    celebrity_id: 10,
    job_type: 'single',
    status: 'failed',
    progress: 30,
    mentions_found: 0,
    start_time: '2025-11-17T09:30:00Z',
    end_time: '2025-11-17T09:35:00Z',
  },
];

export const mockTrendingData = {
  celebrities: [
    {
      id: 1,
      name: '蔡依林',
      category: 'Singer',
      mention_count: 250,
      velocity: 3.5,
      trending_score: 95,
      ranking_change: '+15%',
    },
    {
      id: 2,
      name: '周杰倫',
      category: 'Singer',
      mention_count: 220,
      velocity: 3.2,
      trending_score: 90,
      ranking_change: '+8%',
    },
    {
      id: 3,
      name: '林志玲',
      category: 'Model',
      mention_count: 200,
      velocity: 2.8,
      trending_score: 85,
      ranking_change: '-3%',
    },
    {
      id: 4,
      name: '劉德華',
      category: 'Actor',
      mention_count: 180,
      velocity: 2.5,
      trending_score: 80,
      ranking_change: '-5%',
    },
    {
      id: 5,
      name: '女神卡卡',
      category: 'Singer',
      mention_count: 160,
      velocity: 2.2,
      trending_score: 75,
      ranking_change: '-12%',
    },
  ],
};

export const mockCardData = {
  celebrity: {
    id: 1,
    name: '蔡依林',
    category: 'Singer',
    mention_count: 150,
    last_mention_date: '2025-11-17',
  },
  metrics: mockMetrics,
  mentions: mockMentions.slice(0, 5),
};

export const mockAuthToken = 'mock_jwt_token_1234567890';

export const mockUser = {
  id: 1,
  username: 'admin',
  role: 'admin',
  email: 'admin@example.com',
};

export const mockTheme = {
  light: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f5f5f5',
    textPrimary: '#1a1a1a',
    textSecondary: '#666666',
    accentPrimary: '#00d9ff',
    accentSecondary: '#ff00ff',
  },
  dark: {
    bgPrimary: '#0f172a',
    bgSecondary: '#1e293b',
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    accentPrimary: '#00d9ff',
    accentSecondary: '#ff00ff',
  },
};

/**
 * Fixture factory functions for creating customized test data
 */

export const createMockCelebrity = (overrides = {}) => ({
  ...mockCelebrity,
  ...overrides,
});

export const createMockMetrics = (overrides = {}) => ({
  ...mockMetrics,
  ...overrides,
});

export const createMockMention = (overrides = {}) => ({
  ...mockMentions[0],
  mention_id: Math.floor(Math.random() * 10000),
  ...overrides,
});

export const createMockJob = (overrides = {}) => ({
  ...mockJobs[0],
  job_id: `job_${Date.now()}`,
  ...overrides,
});

/**
 * Helper to create paginated response
 */
export const createPaginatedResponse = (items, limit = 20, offset = 0) => ({
  success: true,
  data: items,
  count: items.length,
  pagination: {
    limit,
    offset,
    total: items.length,
    hasMore: offset + limit < items.length,
  },
});

/**
 * Helper to create API error response
 */
export const createErrorResponse = (message = 'An error occurred', status = 500) => ({
  success: false,
  error: message,
  status,
});
