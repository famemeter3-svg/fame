import axios from 'axios';
import cacheAdapter from 'axios-cache-adapter';
import authStore from '../context/authStore.js';

/**
 * API Client Service
 * Handles all HTTP requests to the backend with caching and auth
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000;
const CACHE_DURATION = parseInt(import.meta.env.VITE_CACHE_DURATION || 21600000); // 6 hours default

// Configure cache adapter
const cache = cacheAdapter.setupCache({
  maxAge: CACHE_DURATION, // Cache for 6 hours (21600000ms)
  exclude: {
    query: false,
    // Don't cache mutations (POST, PUT, PATCH, DELETE)
    methods: ['put', 'patch', 'delete', 'post'],
  },
});

// Create axios instance with cache adapter
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  adapter: cache.adapter, // Use cache adapter
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = authStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

/**
 * CELEBRITY ENDPOINTS
 */

export const fetchCelebrities = (limit = 20, offset = 0, filters = {}) => {
  return apiClient.get('/api/celebrities', {
    params: { limit, offset, ...filters },
  });
};

export const fetchCelebrityById = (id) => {
  return apiClient.get(`/api/celebrities/${id}`);
};

/**
 * METRICS ENDPOINTS
 */

export const fetchMetrics = (id) => {
  return apiClient.get(`/api/metrics/${id}`);
};

export const fetchMetricsHistory = (id) => {
  return apiClient.get(`/api/metrics/${id}/history`);
};

/**
 * MENTIONS ENDPOINTS
 */

export const fetchMentions = (id, limit = 20, offset = 0) => {
  return apiClient.get(`/api/mentions/${id}`, {
    params: { limit, offset },
  });
};

/**
 * CARD DATA ENDPOINTS (Optimized for card rendering)
 */

export const fetchCardCelebrity = (id) => {
  return apiClient.get(`/api/card/celebrity/${id}`);
};

export const fetchCardMetrics = (id) => {
  return apiClient.get(`/api/card/metrics/${id}`);
};

export const fetchCardMentions = (id, limit = 5) => {
  return apiClient.get(`/api/card/mentions/${id}`, {
    params: { limit },
  });
};

export const fetchCardTrending = (limit = 5) => {
  return apiClient.get('/api/card/trending', {
    params: { limit },
  });
};

export const fetchCardStats = () => {
  return apiClient.get('/api/card/stats');
};

/**
 * SVG EXPORT ENDPOINTS
 */

export const fetchCardSVG = (type, id, theme = 'dark') => {
  return apiClient.get(`/api/card/${type}/${id}/svg`, {
    params: { theme },
  });
};

/**
 * ADMIN ENDPOINTS
 */

export const fetchAdminStats = () => {
  return apiClient.get('/api/admin/stats');
};

export const fetchAdminJobs = () => {
  return apiClient.get('/api/admin/jobs');
};

export const startScrape = (jobType, celebrityId = null) => {
  return apiClient.post('/api/admin/scrape', {
    job_type: jobType,
    celebrity_id: celebrityId,
  });
};

export const fetchAdminHealth = () => {
  return apiClient.get('/api/admin/health');
};

/**
 * HEALTH CHECK
 */

export const checkHealth = () => {
  return apiClient.get('/health');
};

export default apiClient;
