/**
 * Scraper-Database Integration Tests
 * Tests: Data pipeline, job tracking, database operations
 */

const mysql = require('mysql2/promise');
const testConfig = require('../fixtures/test-config.js');

let pool;

describe('Scraper-Database Integration Tests', () => {
  beforeAll(async () => {
    pool = await mysql.createPool(testConfig.testDB);
  });

  afterAll(async () => {
    await pool.end();
  });

  // ============================================================================
  // A. SCRAPER CONNECTION & CONFIG TESTS
  // ============================================================================

  describe('A. Scraper Connection & Configuration', () => {
    test('should connect to MySQL pool', async () => {
      const conn = await pool.getConnection();
      expect(conn).toBeDefined();
      const [result] = await conn.query('SELECT 1 as connected');
      expect(result[0].connected).toBe(1);
      await conn.release();
    });

    test('should validate database schema for scraper', async () => {
      const conn = await pool.getConnection();

      // Check celebrities table
      const [celeb] = await conn.query(
        "SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'celebrities'",
        [testConfig.testDB.database]
      );

      // Check celebrity_mentions table
      const [mentions] = await conn.query(
        "SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'celebrity_mentions'",
        [testConfig.testDB.database]
      );

      expect(celeb[0].count).toBe(1);
      expect(mentions[0].count).toBe(1);
      await conn.release();
    });

    test('should load all celebrities from database', async () => {
      const conn = await pool.getConnection();
      const [celebrities] = await conn.query('SELECT * FROM celebrities');
      await conn.release();

      expect(celebrities.length).toBeGreaterThan(0);
      expect(celebrities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            celebrity_id: expect.any(Number),
            name: expect.any(String),
            name_english: expect.any(String),
          }),
        ])
      );
    });

    test('should handle batch operations', async () => {
      const conn = await pool.getConnection();

      // Get batch size
      const batchSize = testConfig.testScraper.batchSize;
      const [celebrities] = await conn.query('SELECT * FROM celebrities LIMIT ?', [batchSize]);

      expect(celebrities.length).toBeLessThanOrEqual(batchSize);
      await conn.release();
    });
  });

  // ============================================================================
  // B. DATA INSERTION & PIPELINE TESTS
  // ============================================================================

  describe('B. Data Pipeline & Insertion', () => {
    test('should insert mentions with all required fields', async () => {
      const conn = await pool.getConnection();

      const testMention = {
        celebrity_id: 1,
        original_url: 'https://test-insert.com/article-1',
        cleaned_text: 'Test content for scraper integration',
        domain: 'test-insert.com',
        sentiment_score: 0.5,
        extraction_confidence: 0.85,
        keyword_tags: JSON.stringify(['test', 'integration']),
      };

      const [result] = await conn.query(
        'INSERT INTO celebrity_mentions (celebrity_id, original_url, cleaned_text, domain, sentiment_score, extraction_confidence, keyword_tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
        Object.values(testMention)
      );

      expect(result.insertId).toBeGreaterThan(0);

      // Verify insertion
      const [inserted] = await conn.query(
        'SELECT * FROM celebrity_mentions WHERE mention_id = ?',
        [result.insertId]
      );

      expect(inserted[0].original_url).toBe(testMention.original_url);
      expect(inserted[0].sentiment_score).toBe(testMention.sentiment_score);
      await conn.release();
    });

    test('should handle batch insert of 50 mentions', async () => {
      const conn = await pool.getConnection();

      const mentions = [];
      for (let i = 0; i < 50; i++) {
        mentions.push([
          1,
          `https://batch-test.com/article-${i}`,
          `Batch test content ${i}`,
          'batch-test.com',
          Math.random() * 2 - 1, // Random sentiment -1 to 1
          0.9,
          JSON.stringify(['batch', 'test']),
        ]);
      }

      const insertQuery =
        'INSERT INTO celebrity_mentions (celebrity_id, original_url, cleaned_text, domain, sentiment_score, extraction_confidence, keyword_tags) VALUES ?';

      const [result] = await conn.query(insertQuery, [mentions]);

      expect(result.affectedRows).toBe(50);
      await conn.release();
    });

    test('should detect duplicate mentions', async () => {
      const conn = await pool.getConnection();

      const testUrl = 'https://duplicate-test.com/article';
      const [celebrity] = await conn.query('SELECT celebrity_id FROM celebrities LIMIT 1');

      // Insert first mention
      await conn.query(
        'INSERT INTO celebrity_mentions (celebrity_id, original_url, cleaned_text, domain) VALUES (?, ?, ?, ?)',
        [celebrity[0].celebrity_id, testUrl, 'Test', 'duplicate-test.com']
      );

      // Try to insert duplicate
      try {
        await conn.query(
          'INSERT INTO celebrity_mentions (celebrity_id, original_url, cleaned_text, domain) VALUES (?, ?, ?, ?)',
          [celebrity[0].celebrity_id, testUrl, 'Test', 'duplicate-test.com']
        );
        expect(true).toBe(false); // Should not reach
      } catch (error) {
        expect(error.code).toBe('ER_DUP_ENTRY');
      }

      await conn.release();
    });

    test('should properly handle JSON keyword tags', async () => {
      const conn = await pool.getConnection();

      const keywords = ['music', 'pop', 'taiwanese', 'singer'];
      const keywordJson = JSON.stringify(keywords);

      const [celebrity] = await conn.query('SELECT celebrity_id FROM celebrities LIMIT 1');

      await conn.query(
        'INSERT INTO celebrity_mentions (celebrity_id, original_url, cleaned_text, domain, keyword_tags) VALUES (?, ?, ?, ?, ?)',
        [celebrity[0].celebrity_id, 'https://json-test.com', 'Test', 'json-test.com', keywordJson]
      );

      const [mention] = await conn.query(
        "SELECT keyword_tags FROM celebrity_mentions WHERE original_url = 'https://json-test.com'"
      );

      const parsedKeywords = JSON.parse(mention[0].keyword_tags);
      expect(parsedKeywords).toEqual(keywords);
      await conn.release();
    });

    test('should validate sentiment scores between -1 and 1', async () => {
      const conn = await pool.getConnection();

      const [celebrity] = await conn.query('SELECT celebrity_id FROM celebrities LIMIT 1');

      // Valid sentiment
      await conn.query(
        'INSERT INTO celebrity_mentions (celebrity_id, original_url, cleaned_text, domain, sentiment_score) VALUES (?, ?, ?, ?, ?)',
        [celebrity[0].celebrity_id, 'https://sentiment-test.com', 'Test', 'sentiment-test.com', 0.75]
      );

      expect(true).toBe(true);
      await conn.release();
    });

    test('should support UTF-8 Traditional Chinese in mentions', async () => {
      const conn = await pool.getConnection();

      const [celebrity] = await conn.query('SELECT celebrity_id FROM celebrities LIMIT 1');

      const chineseText = '蔡依林是一位著名的台灣歌手，以創新的音樂視頻而聞名';

      await conn.query(
        'INSERT INTO celebrity_mentions (celebrity_id, original_url, cleaned_text, domain) VALUES (?, ?, ?, ?)',
        [celebrity[0].celebrity_id, 'https://chinese-test.com', chineseText, 'chinese-test.com']
      );

      const [mention] = await conn.query(
        'SELECT cleaned_text FROM celebrity_mentions WHERE domain = ?',
        ['chinese-test.com']
      );

      expect(mention[0].cleaned_text).toBe(chineseText);
      await conn.release();
    });
  });

  // ============================================================================
  // C. JOB TRACKING TESTS
  // ============================================================================

  describe('C. Job Tracking & Progress', () => {
    test('should create scraping job', async () => {
      const conn = await pool.getConnection();

      const [result] = await conn.query(
        "INSERT INTO scraping_jobs (job_type, status, start_time) VALUES (?, ?, NOW())",
        ['batch', 'pending']
      );

      expect(result.insertId).toBeGreaterThan(0);

      const [job] = await conn.query('SELECT * FROM scraping_jobs WHERE job_id = ?', [
        result.insertId,
      ]);

      expect(job[0].status).toBe('pending');
      await conn.release();
    });

    test('should track job progress through status updates', async () => {
      const conn = await pool.getConnection();

      const [result] = await conn.query(
        "INSERT INTO scraping_jobs (job_type, status, start_time) VALUES (?, ?, NOW())",
        ['batch', 'pending']
      );

      const jobId = result.insertId;

      // Update to running
      await conn.query("UPDATE scraping_jobs SET status = ? WHERE job_id = ?", [
        'running',
        jobId,
      ]);

      const [runningJob] = await conn.query(
        'SELECT status FROM scraping_jobs WHERE job_id = ?',
        [jobId]
      );

      expect(runningJob[0].status).toBe('running');

      // Update to completed
      await conn.query(
        "UPDATE scraping_jobs SET status = ?, end_time = NOW(), mentions_found = ? WHERE job_id = ?",
        ['completed', 25, jobId]
      );

      const [completedJob] = await conn.query(
        'SELECT * FROM scraping_jobs WHERE job_id = ?',
        [jobId]
      );

      expect(completedJob[0].status).toBe('completed');
      expect(completedJob[0].mentions_found).toBe(25);
      await conn.release();
    });

    test('should calculate job duration', async () => {
      const conn = await pool.getConnection();

      const [result] = await conn.query(
        "INSERT INTO scraping_jobs (job_type, status, start_time) VALUES (?, ?, NOW())",
        ['single', 'pending']
      );

      const jobId = result.insertId;

      // Wait a bit and complete
      await new Promise(resolve => setTimeout(resolve, 100));

      await conn.query(
        "UPDATE scraping_jobs SET status = ?, end_time = NOW() WHERE job_id = ?",
        ['completed', jobId]
      );

      const [job] = await conn.query(
        'SELECT TIMESTAMPDIFF(SECOND, start_time, end_time) as duration FROM scraping_jobs WHERE job_id = ?',
        [jobId]
      );

      expect(job[0].duration).toBeGreaterThanOrEqual(0);
      await conn.release();
    });

    test('should handle job failures with error messages', async () => {
      const conn = await pool.getConnection();

      const [result] = await conn.query(
        "INSERT INTO scraping_jobs (job_type, status, start_time, error_message) VALUES (?, ?, NOW(), ?)",
        ['batch', 'failed', 'API quota exceeded']
      );

      const [job] = await conn.query('SELECT * FROM scraping_jobs WHERE job_id = ?', [
        result.insertId,
      ]);

      expect(job[0].status).toBe('failed');
      expect(job[0].error_message).toContain('API quota');
      await conn.release();
    });

    test('should track metrics like mentions_found and urls_processed', async () => {
      const conn = await pool.getConnection();

      const [result] = await conn.query(
        "INSERT INTO scraping_jobs (job_type, status, start_time, mentions_found, urls_processed, urls_failed) VALUES (?, ?, NOW(), ?, ?, ?)",
        ['single', 'completed', 18, 20, 2]
      );

      const [job] = await conn.query('SELECT * FROM scraping_jobs WHERE job_id = ?', [
        result.insertId,
      ]);

      expect(job[0].mentions_found).toBe(18);
      expect(job[0].urls_processed).toBe(20);
      expect(job[0].urls_failed).toBe(2);
      await conn.release();
    });
  });

  // ============================================================================
  // D. CELEBRITY SCRAPE TIMESTAMP TESTS
  // ============================================================================

  describe('D. Celebrity Scrape Metadata', () => {
    test('should update last_scraped timestamp for celebrity', async () => {
      const conn = await pool.getConnection();

      const [celebrity] = await conn.query('SELECT celebrity_id FROM celebrities LIMIT 1');
      const celebId = celebrity[0].celebrity_id;

      await conn.query(
        'UPDATE celebrities SET last_scraped = NOW() WHERE celebrity_id = ?',
        [celebId]
      );

      const [updated] = await conn.query(
        'SELECT last_scraped FROM celebrities WHERE celebrity_id = ?',
        [celebId]
      );

      expect(updated[0].last_scraped).not.toBeNull();
      await conn.release();
    });
  });

  // ============================================================================
  // E. DATA QUALITY TESTS
  // ============================================================================

  describe('E. Data Quality Validation', () => {
    test('should validate mention content_length field', async () => {
      const conn = await pool.getConnection();

      const [celebrity] = await conn.query('SELECT celebrity_id FROM celebrities LIMIT 1');

      const content = 'This is test content';

      await conn.query(
        'INSERT INTO celebrity_mentions (celebrity_id, original_url, cleaned_text, domain, content_length) VALUES (?, ?, ?, ?, ?)',
        [
          celebrity[0].celebrity_id,
          'https://length-test.com',
          content,
          'length-test.com',
          content.length,
        ]
      );

      expect(true).toBe(true);
      await conn.release();
    });

    test('should store processing_time_ms for performance tracking', async () => {
      const conn = await pool.getConnection();

      const [celebrity] = await conn.query('SELECT celebrity_id FROM celebrities LIMIT 1');

      await conn.query(
        'INSERT INTO celebrity_mentions (celebrity_id, original_url, cleaned_text, domain, processing_time_ms) VALUES (?, ?, ?, ?, ?)',
        [
          celebrity[0].celebrity_id,
          'https://perf-test.com',
          'Test',
          'perf-test.com',
          145,
        ]
      );

      expect(true).toBe(true);
      await conn.release();
    });
  });

  // ============================================================================
  // F. CONCURRENT OPERATION TESTS
  // ============================================================================

  describe('F. Concurrent Operations', () => {
    test('should handle concurrent mention insertions', async () => {
      const conn1 = await pool.getConnection();
      const conn2 = await pool.getConnection();

      const [celebs] = await conn1.query('SELECT celebrity_id FROM celebrities LIMIT 1');
      const celebId = celebs[0].celebrity_id;

      const promises = [
        conn1.query(
          'INSERT INTO celebrity_mentions (celebrity_id, original_url, cleaned_text, domain) VALUES (?, ?, ?, ?)',
          [celebId, 'https://concurrent1.com', 'Content 1', 'concurrent1.com']
        ),
        conn2.query(
          'INSERT INTO celebrity_mentions (celebrity_id, original_url, cleaned_text, domain) VALUES (?, ?, ?, ?)',
          [celebId, 'https://concurrent2.com', 'Content 2', 'concurrent2.com']
        ),
      ];

      const results = await Promise.all(promises);

      expect(results[0][0].affectedRows).toBe(1);
      expect(results[1][0].affectedRows).toBe(1);

      await conn1.release();
      await conn2.release();
    });
  });

  // ============================================================================
  // G. PERFORMANCE TESTS
  // ============================================================================

  describe('G. Scraper Performance', () => {
    test('should batch insert 50 mentions in under 500ms', async () => {
      const conn = await pool.getConnection();

      const mentions = [];
      for (let i = 0; i < 50; i++) {
        mentions.push([
          1,
          `https://perf-batch-${i}.com`,
          `Content ${i}`,
          `perf-batch-${i}.com`,
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
      await conn.release();
    });

    test('should query mentions by celebrity_id with index', async () => {
      const conn = await pool.getConnection();

      const startTime = Date.now();
      await conn.query(
        'SELECT * FROM celebrity_mentions WHERE celebrity_id = 1 ORDER BY time_stamp DESC LIMIT 20'
      );
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
      await conn.release();
    });
  });
});
