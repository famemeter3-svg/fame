import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:5000';

// Mock data fixtures
const mockCelebrity = {
  id: 1,
  name: '蔡依林',
  name_english: 'Jolin Tsai',
  category: 'Singer',
  status: 'active',
  mention_count: 150,
  last_mention_date: '2025-11-17',
  last_scraped: '2025-11-17T10:30:00Z',
  metadata: {},
};

const mockMetrics = {
  id: 1,
  frequency: 150,
  velocity: 2.14,
  trending_score: 85,
  popularity_index: 78,
  diversity: 42,
  keywords_json: JSON.stringify(['music', 'concert', 'new album', 'collaboration']),
};

const mockMention = {
  mention_id: 1,
  domain: 'example.com',
  url: 'https://example.com/article/1',
  title: 'New Celebrity Story',
  cleaned_text: 'Celebrity mentioned in article...',
  sentiment_score: 0.75,
  time_stamp: '2025-11-17T10:30:00Z',
};

const mockStats = {
  total_celebrities: 100,
  total_mentions: 1800,
  avg_mentions_per_celeb: 18,
  trending_keywords: ['music', 'entertainment', 'news'],
};

const mockJob = {
  job_id: 'job_001',
  celebrity_id: 1,
  job_type: 'batch',
  status: 'completed',
  progress: 100,
  mentions_found: 150,
  start_time: '2025-11-17T10:00:00Z',
  end_time: '2025-11-17T10:30:00Z',
};

// MSW Handlers
export const handlers = [
  // Celebrities endpoints
  http.get(`${API_URL}/api/celebrities`, ({ request }) => {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') || 20;
    const offset = url.searchParams.get('offset') || 0;

    const celebrities = Array.from({ length: limit }, (_, i) => ({
      ...mockCelebrity,
      id: offset + i + 1,
      name: `Celebrity ${offset + i + 1}`,
      mention_count: Math.floor(Math.random() * 200) + 50,
    }));

    return HttpResponse.json({
      success: true,
      data: celebrities,
      count: 100,
    });
  }),

  http.get(`${API_URL}/api/celebrities/:id`, () => {
    return HttpResponse.json({
      success: true,
      data: mockCelebrity,
    });
  }),

  // Metrics endpoints
  http.get(`${API_URL}/api/metrics/:id`, () => {
    return HttpResponse.json({
      success: true,
      data: mockMetrics,
    });
  }),

  http.get(`${API_URL}/api/metrics/:id/history`, () => {
    const history = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      frequency: mockMetrics.frequency + Math.random() * 20 - 10,
      velocity: mockMetrics.velocity + Math.random() * 0.5 - 0.25,
      trending_score: mockMetrics.trending_score + Math.random() * 10 - 5,
    }));

    return HttpResponse.json({
      success: true,
      data: history,
    });
  }),

  // Mentions endpoints
  http.get(`${API_URL}/api/mentions/:id`, ({ request }) => {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') || 20;

    const mentions = Array.from({ length: limit }, (_, i) => ({
      ...mockMention,
      mention_id: i + 1,
      time_stamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      sentiment_score: Math.random(),
    }));

    return HttpResponse.json({
      success: true,
      data: mentions,
    });
  }),

  // Card-specific endpoints
  http.get(`${API_URL}/api/card/celebrity/:id`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 1,
        name: mockCelebrity.name,
        category: mockCelebrity.category,
        mention_count: mockCelebrity.mention_count,
        last_mention_date: mockCelebrity.last_mention_date,
      },
    });
  }),

  http.get(`${API_URL}/api/card/metrics/:id`, () => {
    return HttpResponse.json({
      success: true,
      data: mockMetrics,
    });
  }),

  http.get(`${API_URL}/api/card/mentions/:id`, ({ request }) => {
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit') || 5;

    const mentions = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      source: 'example.com',
      title: `Article ${i + 1}`,
      sentiment: Math.random() > 0.5 ? 'positive' : 'neutral',
    }));

    return HttpResponse.json({
      success: true,
      data: { mentions },
    });
  }),

  http.get(`${API_URL}/api/card/trending`, () => {
    const trending = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      name: `Celebrity ${i + 1}`,
      category: ['Singer', 'Actor', 'Actress', 'Host', 'Director'][i],
      mention_count: 200 - i * 30,
      velocity: 3 - i * 0.5,
      trending_score: 90 - i * 10,
      ranking_change: Math.random() > 0.5 ? '+15%' : '-5%',
    }));

    return HttpResponse.json({
      success: true,
      data: { celebrities: trending },
    });
  }),

  http.get(`${API_URL}/api/card/stats`, () => {
    return HttpResponse.json({
      success: true,
      data: mockStats,
    });
  }),

  http.get(`${API_URL}/api/card/:type/:id/svg`, ({ params }) => {
    const { type, id } = params;
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="#1a1a1a"/><text x="20" y="50" fill="white" font-size="24">Card ${type} ${id}</text></svg>`;

    return HttpResponse.text(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
      },
    });
  }),

  // Admin endpoints
  http.get(`${API_URL}/api/admin/stats`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        total_celebrities: 100,
        total_mentions: 1800,
        total_jobs: 45,
        avg_mentions_per_celeb: 18,
        mentions_today: 12,
      },
    });
  }),

  http.get(`${API_URL}/api/admin/jobs`, () => {
    const jobs = Array.from({ length: 5 }, (_, i) => ({
      ...mockJob,
      job_id: `job_${i.toString().padStart(3, '0')}`,
      status: ['completed', 'running', 'failed', 'pending'][i % 4],
      progress: i === 1 ? 65 : 100,
    }));

    return HttpResponse.json({
      success: true,
      data: jobs,
    });
  }),

  http.post(`${API_URL}/api/admin/scrape`, async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json({
      success: true,
      job_id: `job_${Date.now()}`,
      status: 'queued',
      message: `${body.job_type} scrape job created`,
    });
  }),

  // Health check
  http.get(`${API_URL}/health`, () => {
    return HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  }),

  // Auth endpoints
  http.post(`${API_URL}/api/auth/login`, async ({ request }) => {
    const body = await request.json();

    if (body.username === 'admin' && body.password === 'password') {
      return HttpResponse.json({
        success: true,
        token: 'mock_jwt_token_' + Date.now(),
        user: {
          id: 1,
          username: 'admin',
          role: 'admin',
        },
      });
    }

    return HttpResponse.json(
      {
        success: false,
        error: 'Invalid credentials',
      },
      { status: 401 }
    );
  }),

  http.post(`${API_URL}/api/auth/logout`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Logged out',
    });
  }),
];
