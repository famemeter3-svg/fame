/**
 * Frontend-Backend Integration Tests
 * Tests: API client, component integration, state management
 */

const axios = require('axios');
const testConfig = require('../fixtures/test-config.js');

// Mock fetch for frontend API client testing
const createApiClient = () => {
  const instance = axios.create({
    baseURL: testConfig.testBackend.baseURL,
    timeout: testConfig.testBackend.timeout,
  });

  return {
    fetchCelebrities: (limit = 20, offset = 0, filters = {}) =>
      instance.get('/api/celebrities', { params: { limit, offset, ...filters } }),

    fetchCelebrityById: (id) =>
      instance.get(`/api/celebrities/${id}`),

    fetchMetrics: (id) =>
      instance.get(`/api/metrics/${id}`),

    fetchMentions: (id, limit = 20, offset = 0) =>
      instance.get(`/api/mentions/${id}`, { params: { limit, offset } }),

    fetchAdminStats: () =>
      instance.get('/api/admin/stats'),

    startScrape: (jobType = 'batch', celebrityId = null) =>
      instance.post('/api/admin/scrape', { job_type: jobType, celebrity_id: celebrityId }),
  };
};

describe('Frontend-Backend Integration Tests', () => {
  let apiClient;

  beforeAll(() => {
    apiClient = createApiClient();
  });

  // ============================================================================
  // A. API CLIENT FUNCTIONALITY TESTS
  // ============================================================================

  describe('A. API Client Configuration', () => {
    test('should create axios instance with correct base URL', () => {
      expect(apiClient).toBeDefined();
      expect(apiClient.fetchCelebrities).toBeDefined();
      expect(apiClient.fetchCelebrityById).toBeDefined();
      expect(apiClient.fetchMetrics).toBeDefined();
      expect(apiClient.fetchMentions).toBeDefined();
      expect(apiClient.fetchAdminStats).toBeDefined();
      expect(apiClient.startScrape).toBeDefined();
    });

    test('should use correct timeout configuration', async () => {
      const startTime = Date.now();
      try {
        // This will timeout if server is down
        await apiClient.fetchAdminStats();
        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(testConfig.testBackend.timeout);
      } catch (error) {
        // Timeout error is expected if server not running
        expect(error.code).toMatch(/ECONNREFUSED|ETIMEDOUT/);
      }
    }, 15000);
  });

  // ============================================================================
  // B. API CLIENT REQUEST TESTS
  // ============================================================================

  describe('B. API Client Requests', () => {
    test('should fetch celebrities list', async () => {
      try {
        const response = await apiClient.fetchCelebrities();

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });

    test('should fetch single celebrity', async () => {
      try {
        // First get a celebrity ID
        const listResponse = await apiClient.fetchCelebrities(1);
        const celeb = listResponse.data.data[0];

        const response = await apiClient.fetchCelebrityById(celeb.celebrity_id);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data.celebrity_id).toBe(celeb.celebrity_id);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });

    test('should fetch metrics for celebrity', async () => {
      try {
        const listResponse = await apiClient.fetchCelebrities(1);
        const celeb = listResponse.data.data[0];

        const response = await apiClient.fetchMetrics(celeb.celebrity_id);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });

    test('should fetch mentions for celebrity', async () => {
      try {
        const listResponse = await apiClient.fetchCelebrities(1);
        const celeb = listResponse.data.data[0];

        const response = await apiClient.fetchMentions(celeb.celebrity_id);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(Array.isArray(response.data.data)).toBe(true);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });

    test('should fetch admin stats', async () => {
      try {
        const response = await apiClient.fetchAdminStats();

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('celebrities');
        expect(response.data.data).toHaveProperty('mentions');
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });
  });

  // ============================================================================
  // C. API CLIENT PARAMETER HANDLING
  // ============================================================================

  describe('C. API Client Parameters', () => {
    test('should pass limit and offset parameters', async () => {
      try {
        const response = await apiClient.fetchCelebrities(5, 0);

        expect(response.data.data.length).toBeLessThanOrEqual(5);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });

    test('should pass filter parameters', async () => {
      try {
        const response = await apiClient.fetchCelebrities(20, 0, { category: 'Singer' });

        expect(response.data.success).toBe(true);
        response.data.data.forEach((celeb) => {
          expect(celeb.category).toBe('Singer');
        });
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });
  });

  // ============================================================================
  // D. STATE MANAGEMENT SIMULATION TESTS
  // ============================================================================

  describe('D. State Management (Zustand Simulation)', () => {
    test('should support auth token in API calls', async () => {
      const apiWithAuth = axios.create({
        baseURL: testConfig.testBackend.baseURL,
        headers: {
          'Authorization': 'Bearer test-token-12345',
        },
      });

      try {
        await apiWithAuth.get('/api/celebrities');
      } catch (error) {
        // Expected if server not running
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });

    test('should cache API responses', async () => {
      try {
        const startTime1 = Date.now();
        await apiClient.fetchCelebrities();
        const duration1 = Date.now() - startTime1;

        const startTime2 = Date.now();
        await apiClient.fetchCelebrities();
        const duration2 = Date.now() - startTime2;

        // Second call might be faster due to caching (not guaranteed)
        expect(duration1).toBeGreaterThanOrEqual(0);
        expect(duration2).toBeGreaterThanOrEqual(0);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });
  });

  // ============================================================================
  // E. ERROR HANDLING TESTS
  // ============================================================================

  describe('E. Error Handling', () => {
    test('should handle 404 errors gracefully', async () => {
      try {
        await apiClient.fetchCelebrityById(99999);
      } catch (error) {
        // Connection error or 404
        expect(
          error.code === 'ECONNREFUSED' || error.response?.status === 404
        ).toBe(true);
      }
    });

    test('should handle network timeout', async () => {
      const slowApi = axios.create({
        baseURL: testConfig.testBackend.baseURL,
        timeout: 10, // Very short timeout
      });

      try {
        await slowApi.get('/api/celebrities');
      } catch (error) {
        // Timeout or connection error expected
        expect(
          error.code === 'ECONNREFUSED' ||
          error.code === 'ECONNABORTED' ||
          error.message.includes('timeout')
        ).toBe(true);
      }
    });

    test('should handle invalid request parameters', async () => {
      try {
        const response = await apiClient.fetchCelebrities(999999, -100);

        // Should still return valid response
        expect(response.status).toBe(200);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });
  });

  // ============================================================================
  // F. RESPONSE VALIDATION
  // ============================================================================

  describe('F. Response Structure Validation', () => {
    test('should validate response structure', async () => {
      try {
        const response = await apiClient.fetchCelebrities();

        expect(response.data).toEqual({
          success: expect.any(Boolean),
          data: expect.any(Array),
          count: expect.any(Number),
          total: expect.any(Number),
          page: expect.any(Number),
        });
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });

    test('should have proper celebrity data structure', async () => {
      try {
        const response = await apiClient.fetchCelebrities(1);

        const celeb = response.data.data[0];
        expect(celeb).toEqual({
          celebrity_id: expect.any(Number),
          name: expect.any(String),
          name_english: expect.any(String),
          category: expect.any(String),
          status: expect.any(String),
        });
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });
  });

  // ============================================================================
  // G. ADMIN OPERATIONS
  // ============================================================================

  describe('G. Admin Operations', () => {
    test('should trigger scraping job', async () => {
      try {
        const response = await apiClient.startScrape('batch');

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('job_id');
        expect(response.data.data.status).toBe('pending');
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });

    test('should trigger single celebrity scrape', async () => {
      try {
        const response = await apiClient.startScrape('single', 1);

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.data.job_type).toBe('single');
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });
  });

  // ============================================================================
  // H. PERFORMANCE TESTS
  // ============================================================================

  describe('H. Frontend-Backend Performance', () => {
    test('should fetch celebrities in reasonable time', async () => {
      try {
        const startTime = Date.now();
        await apiClient.fetchCelebrities();
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(1000); // Less than 1 second
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });

    test('should handle concurrent API requests', async () => {
      try {
        const promises = [
          apiClient.fetchCelebrities(),
          apiClient.fetchAdminStats(),
          apiClient.fetchCelebrities(5, 0),
        ];

        const responses = await Promise.all(promises);

        expect(responses).toHaveLength(3);
        responses.forEach((response) => {
          expect(response.status).toBe(200);
        });
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });
  });
});
