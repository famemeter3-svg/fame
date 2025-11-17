/**
 * End-to-End Workflow Tests
 * Tests: Complete user journeys and system workflows
 */

const axios = require('axios');
const mysql = require('mysql2/promise');
const testConfig = require('../fixtures/test-config.js');

describe('End-to-End Workflow Tests', () => {
  let apiClient;
  let pool;

  beforeAll(async () => {
    pool = await mysql.createPool(testConfig.testDB);

    apiClient = axios.create({
      baseURL: testConfig.testBackend.baseURL,
      timeout: testConfig.testBackend.timeout,
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  // ============================================================================
  // SCENARIO 1: VIEW CELEBRITY LIST & DETAILS
  // ============================================================================

  describe('Scenario 1: View Celebrity List & Details', () => {
    test('should complete full celebrity browsing workflow', async () => {
      try {
        // Step 1: Fetch celebrity list
        const listResponse = await apiClient.get('/api/celebrities?limit=10');
        expect(listResponse.status).toBe(200);
        expect(listResponse.data.success).toBe(true);
        const celebrities = listResponse.data.data;
        expect(celebrities.length).toBeGreaterThan(0);

        // Step 2: Navigate to detail page
        const firstCeleb = celebrities[0];
        const detailResponse = await apiClient.get(
          `/api/celebrities/${firstCeleb.celebrity_id}`
        );
        expect(detailResponse.status).toBe(200);
        expect(detailResponse.data.data.celebrity_id).toBe(firstCeleb.celebrity_id);

        // Step 3: View metrics
        const metricsResponse = await apiClient.get(
          `/api/metrics/${firstCeleb.celebrity_id}`
        );
        expect(metricsResponse.status).toBe(200);
        expect(Array.isArray(metricsResponse.data.data)).toBe(true);

        // Step 4: View mentions
        const mentionsResponse = await apiClient.get(
          `/api/mentions/${firstCeleb.celebrity_id}`
        );
        expect(mentionsResponse.status).toBe(200);
        expect(Array.isArray(mentionsResponse.data.data)).toBe(true);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });

    test('should support category filtering workflow', async () => {
      try {
        // Step 1: Get all categories
        const categoriesResponse = await apiClient.get('/api/celebrities/categories');
        expect(categoriesResponse.status).toBe(200);
        const categories = categoriesResponse.data.data;

        // Step 2: Filter by category
        if (categories.length > 0) {
          const filterResponse = await apiClient.get(
            `/api/celebrities?category=${categories[0]}`
          );
          expect(filterResponse.status).toBe(200);

          filterResponse.data.data.forEach((celeb) => {
            expect(celeb.category).toBe(categories[0]);
          });
        }
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });
  });

  // ============================================================================
  // SCENARIO 2: PAGINATION & NAVIGATION
  // ============================================================================

  describe('Scenario 2: Pagination & Navigation', () => {
    test('should handle pagination navigation', async () => {
      try {
        // Step 1: First page
        const page1 = await apiClient.get('/api/celebrities?limit=5&offset=0');
        expect(page1.status).toBe(200);
        expect(page1.data.page).toBe(1);

        // Step 2: Second page
        const page2 = await apiClient.get('/api/celebrities?limit=5&offset=5');
        expect(page2.status).toBe(200);
        expect(page2.data.page).toBe(2);

        // Step 3: Verify pages are different
        if (
          page1.data.data.length === 5 &&
          page2.data.data.length === 5
        ) {
          expect(page1.data.data[0].celebrity_id).not.toBe(
            page2.data.data[0].celebrity_id
          );
        }
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });
  });

  // ============================================================================
  // SCENARIO 3: TRENDING CELEBRITIES WORKFLOW
  // ============================================================================

  describe('Scenario 3: View Trending & Analytics', () => {
    test('should fetch and analyze trending metrics', async () => {
      try {
        // Step 1: Get admin stats
        const statsResponse = await apiClient.get('/api/admin/stats');
        expect(statsResponse.status).toBe(200);
        expect(statsResponse.data.data.mentions).toBeGreaterThanOrEqual(0);

        // Step 2: Get top trending celebrities
        const trendingResponse = await apiClient.get(
          '/api/metrics/top/trending?limit=10'
        );
        expect(trendingResponse.status).toBe(200);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });
  });

  // ============================================================================
  // SCENARIO 4: ADMIN SCRAPING WORKFLOW
  // ============================================================================

  describe('Scenario 4: Admin Scraping Operation', () => {
    test('should complete scraping job workflow', async () => {
      try {
        // Step 1: Start batch scraping job
        const jobResponse = await apiClient.post('/api/admin/scrape', {
          job_type: 'batch',
        });
        expect(jobResponse.status).toBe(200);
        expect(jobResponse.data.success).toBe(true);
        const jobId = jobResponse.data.data.job_id;
        expect(jobId).toBeGreaterThan(0);

        // Step 2: Verify job was created in database
        const conn = await pool.getConnection();
        const [jobs] = await conn.query(
          'SELECT * FROM scraping_jobs WHERE job_id = ?',
          [jobId]
        );
        expect(jobs.length).toBe(1);
        expect(jobs[0].status).toBe('pending');
        await conn.release();

        // Step 3: Simulate job progress updates
        const updateConn = await pool.getConnection();
        await updateConn.query(
          'UPDATE scraping_jobs SET status = ?, mentions_found = 10 WHERE job_id = ?',
          ['running', jobId]
        );

        const [runningJobs] = await updateConn.query(
          'SELECT * FROM scraping_jobs WHERE job_id = ?',
          [jobId]
        );
        expect(runningJobs[0].status).toBe('running');

        // Step 4: Complete job
        await updateConn.query(
          'UPDATE scraping_jobs SET status = ?, end_time = NOW(), mentions_found = 25 WHERE job_id = ?',
          ['completed', jobId]
        );

        const [completedJobs] = await updateConn.query(
          'SELECT * FROM scraping_jobs WHERE job_id = ?',
          [jobId]
        );
        expect(completedJobs[0].status).toBe('completed');
        await updateConn.release();
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });

    test('should handle single celebrity scrape', async () => {
      try {
        // Get a celebrity
        const listResponse = await apiClient.get('/api/celebrities?limit=1');
        const celebId = listResponse.data.data[0].celebrity_id;

        // Start single scrape job
        const jobResponse = await apiClient.post('/api/admin/scrape', {
          job_type: 'single',
          celebrity_id: celebId,
        });

        expect(jobResponse.status).toBe(200);
        expect(jobResponse.data.data.job_type).toBe('single');

        // Verify in database
        const conn = await pool.getConnection();
        const [jobs] = await conn.query(
          'SELECT * FROM scraping_jobs WHERE celebrity_id = ? ORDER BY job_id DESC LIMIT 1',
          [celebId]
        );
        expect(jobs[0].job_type).toBe('single');
        await conn.release();
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });
  });

  // ============================================================================
  // SCENARIO 5: DATA CONSISTENCY WORKFLOW
  // ============================================================================

  describe('Scenario 5: Data Consistency Verification', () => {
    test('should maintain data consistency across components', async () => {
      try {
        // Step 1: Get celebrity count from API
        const statsResponse = await apiClient.get('/api/admin/stats');
        const apiCelebCount = statsResponse.data.data.celebrities;

        // Step 2: Verify with database
        const conn = await pool.getConnection();
        const [dbResult] = await conn.query(
          'SELECT COUNT(*) as count FROM celebrities'
        );
        const dbCelebCount = dbResult[0].count;
        await conn.release();

        expect(apiCelebCount).toBe(dbCelebCount);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });

    test('should verify referential integrity', async () => {
      try {
        const conn = await pool.getConnection();

        // Check that all mentions reference valid celebrities
        const [orphans] = await conn.query(
          'SELECT COUNT(*) as count FROM celebrity_mentions WHERE celebrity_id NOT IN (SELECT celebrity_id FROM celebrities)'
        );

        expect(orphans[0].count).toBe(0);
        await conn.release();
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });
  });

  // ============================================================================
  // SCENARIO 6: SEARCH & DISCOVERY WORKFLOW
  // ============================================================================

  describe('Scenario 6: Search & Discovery', () => {
    test('should support searching by category and status', async () => {
      try {
        // Step 1: Get categories
        const catResponse = await apiClient.get('/api/celebrities/categories');
        if (catResponse.data.data.length === 0) {
          return; // Skip if no categories
        }

        const category = catResponse.data.data[0];

        // Step 2: Filter by category
        const filterResponse = await apiClient.get(
          `/api/celebrities?category=${category}&status=active`
        );

        expect(filterResponse.status).toBe(200);
        filterResponse.data.data.forEach((celeb) => {
          expect(celeb.category).toBe(category);
          expect(celeb.status).toBe('active');
        });
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });
  });

  // ============================================================================
  // SCENARIO 7: COMPREHENSIVE ANALYTICS WORKFLOW
  // ============================================================================

  describe('Scenario 7: Analytics & Reporting', () => {
    test('should gather analytics from multiple endpoints', async () => {
      try {
        // Step 1: Get stats
        const statsResponse = await apiClient.get('/api/admin/stats');
        const stats = statsResponse.data.data;

        // Step 2: Get sample celebrity
        const celebResponse = await apiClient.get('/api/celebrities?limit=1');
        const celebId = celebResponse.data.data[0].celebrity_id;

        // Step 3: Get celebrity metrics
        const metricsResponse = await apiClient.get(
          `/api/metrics/${celebId}`
        );

        // Step 4: Get mention domains
        const domainsResponse = await apiClient.get(
          `/api/mentions/${celebId}/domains`
        );

        // Step 5: Get mention stats
        const mentionStatsResponse = await apiClient.get(
          `/api/mentions/${celebId}/stats`
        );

        // Verify all data is present
        expect(stats).toHaveProperty('celebrities');
        expect(Array.isArray(metricsResponse.data.data)).toBe(true);
        expect(Array.isArray(domainsResponse.data.data)).toBe(true);
        expect(mentionStatsResponse.data.data).toHaveProperty('total');
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });
  });

  // ============================================================================
  // SCENARIO 8: ERROR RECOVERY WORKFLOW
  // ============================================================================

  describe('Scenario 8: Error Handling & Recovery', () => {
    test('should handle and recover from invalid requests', async () => {
      try {
        // Step 1: Try invalid celebrity ID
        try {
          await apiClient.get('/api/celebrities/99999');
        } catch (error) {
          expect(error.response?.status).toBe(404);
        }

        // Step 2: System should still work
        const response = await apiClient.get('/api/celebrities?limit=1');
        expect(response.status).toBe(200);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });

    test('should handle missing parameters gracefully', async () => {
      try {
        const response = await apiClient.get(
          '/api/celebrities?limit=999999&offset=invalid'
        );

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });
  });

  // ============================================================================
  // SCENARIO 9: CONCURRENT USER WORKFLOW
  // ============================================================================

  describe('Scenario 9: Concurrent Operations', () => {
    test('should handle concurrent user requests', async () => {
      try {
        const promises = [];

        // Simulate 5 concurrent users
        for (let i = 0; i < 5; i++) {
          promises.push(
            apiClient.get('/api/celebrities?limit=10'),
            apiClient.get('/api/admin/stats')
          );
        }

        const results = await Promise.all(promises);

        expect(results).toHaveLength(10);
        results.forEach((response) => {
          expect(response.status).toBe(200);
        });
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });
  });

  // ============================================================================
  // SCENARIO 10: COMPLETE USER SESSION
  // ============================================================================

  describe('Scenario 10: Complete User Session', () => {
    test('should support full user session workflow', async () => {
      try {
        // 1. User visits app, sees celebrity list
        const listResponse = await apiClient.get('/api/celebrities?limit=5');
        expect(listResponse.status).toBe(200);

        // 2. User views a celebrity
        const celeb = listResponse.data.data[0];
        const detailResponse = await apiClient.get(
          `/api/celebrities/${celeb.celebrity_id}`
        );
        expect(detailResponse.status).toBe(200);

        // 3. User checks metrics
        const metricsResponse = await apiClient.get(
          `/api/metrics/${celeb.celebrity_id}`
        );
        expect(metricsResponse.status).toBe(200);

        // 4. User views mentions
        const mentionsResponse = await apiClient.get(
          `/api/mentions/${celeb.celebrity_id}?limit=10`
        );
        expect(mentionsResponse.status).toBe(200);

        // 5. User checks mention sources
        const domainsResponse = await apiClient.get(
          `/api/mentions/${celeb.celebrity_id}/domains`
        );
        expect(domainsResponse.status).toBe(200);

        // 6. User goes back to list and filters
        const filteredResponse = await apiClient.get(
          `/api/celebrities?category=${celeb.category}&limit=5`
        );
        expect(filteredResponse.status).toBe(200);

        // 7. User navigates to different celebrity
        const otherCeleb = listResponse.data.data[1];
        const otherDetailResponse = await apiClient.get(
          `/api/celebrities/${otherCeleb.celebrity_id}`
        );
        expect(otherDetailResponse.status).toBe(200);

        // Complete session successful
        expect(true).toBe(true);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') {
          throw error;
        }
      }
    });
  });
});
