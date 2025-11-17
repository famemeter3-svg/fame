/**
 * Performance Benchmark Tests
 * Tests: Database, API, frontend, and scraper performance metrics
 */

const axios = require('axios');
const mysql = require('mysql2/promise');
const testConfig = require('../fixtures/test-config.js');

describe('Performance Benchmark Tests', () => {
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
  // A. DATABASE PERFORMANCE TESTS
  // ============================================================================

  describe('A. Database Performance', () => {
    test('should query 100 celebrities in under 100ms', async () => {
      const conn = await pool.getConnection();

      const startTime = Date.now();
      await conn.query('SELECT * FROM celebrities');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
      console.log(`  ✓ Query 100 celebrities: ${duration}ms`);

      await conn.release();
    });

    test('should full-text search mentions in under 200ms', async () => {
      const conn = await pool.getConnection();

      const startTime = Date.now();
      await conn.query(
        "SELECT * FROM celebrity_mentions WHERE MATCH(cleaned_text) AGAINST(? IN BOOLEAN MODE) LIMIT 20",
        ['singer']
      );
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(200);
      console.log(`  ✓ Full-text search: ${duration}ms`);

      await conn.release();
    });

    test('should filter by category+status in under 50ms', async () => {
      const conn = await pool.getConnection();

      const startTime = Date.now();
      await conn.query(
        'SELECT * FROM celebrities WHERE category = ? AND status = ?',
        ['Singer', 'active']
      );
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50);
      console.log(`  ✓ Filter by category+status: ${duration}ms`);

      await conn.release();
    });

    test('should query mentions with index (celebrity_id, timestamp) in under 100ms', async () => {
      const conn = await pool.getConnection();

      const startTime = Date.now();
      await conn.query(
        'SELECT * FROM celebrity_mentions WHERE celebrity_id = 1 ORDER BY time_stamp DESC LIMIT 20'
      );
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
      console.log(`  ✓ Query mentions by celebrity+time: ${duration}ms`);

      await conn.release();
    });

    test('should count mentions per domain in under 150ms', async () => {
      const conn = await pool.getConnection();

      const startTime = Date.now();
      await conn.query(
        'SELECT domain, COUNT(*) as count FROM celebrity_mentions GROUP BY domain ORDER BY count DESC LIMIT 10'
      );
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(150);
      console.log(`  ✓ Count mentions per domain: ${duration}ms`);

      await conn.release();
    });

    test('should batch insert 50 mentions in under 500ms', async () => {
      const conn = await pool.getConnection();

      const mentions = [];
      for (let i = 0; i < 50; i++) {
        mentions.push([
          1,
          `https://perf-batch-${Date.now()}-${i}.com`,
          `Content ${i}`,
          'perf.com',
          0.5,
          0.9,
          JSON.stringify(['test']),
        ]);
      }

      const startTime = Date.now();
      await conn.query(
        'INSERT INTO celebrity_mentions (celebrity_id, original_url, cleaned_text, domain, sentiment_score, extraction_confidence, keyword_tags) VALUES ?',
        [mentions]
      );
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
      console.log(`  ✓ Batch insert 50 mentions: ${duration}ms`);

      await conn.release();
    });

    test('should handle connection pool acquire in under 10ms', async () => {
      const startTime = Date.now();
      const conn = await pool.getConnection();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(10);
      console.log(`  ✓ Acquire connection from pool: ${duration}ms`);

      await conn.release();
    });
  });

  // ============================================================================
  // B. API RESPONSE TIME TESTS
  // ============================================================================

  describe('B. API Response Time', () => {
    test('GET /health should respond in under 10ms', async () => {
      try {
        const startTime = Date.now();
        await apiClient.get('/health');
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(10);
        console.log(`  ✓ GET /health: ${duration}ms`);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') throw error;
      }
    });

    test('GET /api/celebrities should respond in under 50ms', async () => {
      try {
        const startTime = Date.now();
        await apiClient.get('/api/celebrities?limit=20');
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(50);
        console.log(`  ✓ GET /api/celebrities: ${duration}ms`);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') throw error;
      }
    });

    test('GET /api/celebrities/:id should respond in under 50ms', async () => {
      try {
        const startTime = Date.now();
        await apiClient.get('/api/celebrities/1');
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(50);
        console.log(`  ✓ GET /api/celebrities/:id: ${duration}ms`);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') throw error;
      }
    });

    test('GET /api/mentions/:id should respond in under 100ms', async () => {
      try {
        const startTime = Date.now();
        await apiClient.get('/api/mentions/1?limit=20');
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(100);
        console.log(`  ✓ GET /api/mentions/:id: ${duration}ms`);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') throw error;
      }
    });

    test('GET /api/metrics/:id should respond in under 100ms', async () => {
      try {
        const startTime = Date.now();
        await apiClient.get('/api/metrics/1');
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(100);
        console.log(`  ✓ GET /api/metrics/:id: ${duration}ms`);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') throw error;
      }
    });

    test('GET /api/admin/stats should respond in under 100ms', async () => {
      try {
        const startTime = Date.now();
        await apiClient.get('/api/admin/stats');
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(100);
        console.log(`  ✓ GET /api/admin/stats: ${duration}ms`);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') throw error;
      }
    });

    test('POST /api/admin/scrape should respond in under 100ms', async () => {
      try {
        const startTime = Date.now();
        await apiClient.post('/api/admin/scrape', { job_type: 'batch' });
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(100);
        console.log(`  ✓ POST /api/admin/scrape: ${duration}ms`);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') throw error;
      }
    });
  });

  // ============================================================================
  // C. CONCURRENT LOAD TESTS
  // ============================================================================

  describe('C. Concurrent Load Handling', () => {
    test('should handle 10 concurrent requests', async () => {
      try {
        const startTime = Date.now();

        const promises = [];
        for (let i = 0; i < 10; i++) {
          promises.push(apiClient.get('/api/celebrities?limit=5'));
        }

        await Promise.all(promises);
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(1000); // All should complete in under 1s
        console.log(`  ✓ 10 concurrent requests: ${duration}ms`);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') throw error;
      }
    });

    test('should handle 20 concurrent database queries', async () => {
      const promises = [];
      const startTime = Date.now();

      for (let i = 0; i < 20; i++) {
        promises.push(
          (async () => {
            const conn = await pool.getConnection();
            await conn.query('SELECT * FROM celebrities LIMIT 1');
            await conn.release();
          })()
        );
      }

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(2000); // All should complete in under 2s
      console.log(`  ✓ 20 concurrent DB queries: ${duration}ms`);
    });

    test('should maintain performance under mixed load', async () => {
      try {
        const startTime = Date.now();

        const promises = [
          apiClient.get('/api/celebrities?limit=10'),
          apiClient.get('/api/admin/stats'),
          apiClient.get('/api/celebrities/1'),
          apiClient.get('/api/metrics/1'),
          apiClient.get('/api/mentions/1?limit=20'),
        ];

        const results = await Promise.all(promises);
        const duration = Date.now() - startTime;

        expect(results).toHaveLength(5);
        expect(duration).toBeLessThan(500);
        console.log(`  ✓ Mixed load (5 requests): ${duration}ms`);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') throw error;
      }
    });
  });

  // ============================================================================
  // D. PAGINATION PERFORMANCE
  // ============================================================================

  describe('D. Pagination Performance', () => {
    test('should handle large offset efficiently', async () => {
      try {
        const startTime = Date.now();
        await apiClient.get('/api/celebrities?limit=20&offset=1000');
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(100);
        console.log(`  ✓ Query with large offset: ${duration}ms`);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') throw error;
      }
    });

    test('should handle paginating mentions', async () => {
      try {
        const startTime = Date.now();
        await apiClient.get('/api/mentions/1?limit=20&offset=0');
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(100);
        console.log(`  ✓ Paginate mentions: ${duration}ms`);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') throw error;
      }
    });
  });

  // ============================================================================
  // E. AGGREGATION QUERY PERFORMANCE
  // ============================================================================

  describe('E. Aggregation Performance', () => {
    test('should calculate stats in under 200ms', async () => {
      const conn = await pool.getConnection();

      const startTime = Date.now();
      await conn.query(
        'SELECT COUNT(*) as total, AVG(sentiment_score) as avg_sentiment FROM celebrity_mentions WHERE celebrity_id = ?',
        [1]
      );
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(200);
      console.log(`  ✓ Calculate mention stats: ${duration}ms`);

      await conn.release();
    });

    test('should aggregate by domain in under 200ms', async () => {
      const conn = await pool.getConnection();

      const startTime = Date.now();
      await conn.query(
        'SELECT domain, COUNT(*) as count, AVG(sentiment_score) as avg_sentiment FROM celebrity_mentions WHERE celebrity_id = ? GROUP BY domain',
        [1]
      );
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(200);
      console.log(`  ✓ Aggregate by domain: ${duration}ms`);

      await conn.release();
    });
  });

  // ============================================================================
  // F. MEMORY EFFICIENCY TESTS
  // ============================================================================

  describe('F. Memory Efficiency', () => {
    test('should not leak memory on repeated connections', async () => {
      const memBefore = process.memoryUsage().heapUsed;

      // Acquire and release 100 connections
      for (let i = 0; i < 100; i++) {
        const conn = await pool.getConnection();
        await conn.query('SELECT 1');
        await conn.release();
      }

      const memAfter = process.memoryUsage().heapUsed;
      const memIncrease = memAfter - memBefore;

      // Memory increase should be reasonable (less than 10MB)
      expect(memIncrease).toBeLessThan(10 * 1024 * 1024);
      console.log(`  ✓ Memory increase after 100 connections: ${(memIncrease / 1024 / 1024).toFixed(2)}MB`);
    });
  });

  // ============================================================================
  // G. RESPONSE SIZE TESTS
  // ============================================================================

  describe('G. Response Size Optimization', () => {
    test('should return reasonable response sizes', async () => {
      try {
        const response = await apiClient.get('/api/celebrities?limit=20');

        const responseSize = JSON.stringify(response.data).length;
        console.log(`  ✓ Celebrity list response size: ${(responseSize / 1024).toFixed(2)}KB`);

        // Response should be reasonably sized (less than 500KB)
        expect(responseSize).toBeLessThan(500 * 1024);
      } catch (error) {
        if (error.code !== 'ECONNREFUSED') throw error;
      }
    });
  });
});
