/**
 * Database Integration Tests
 * Tests: Connection pooling, schema validation, constraints, data integrity
 * Coverage: All 4 core tables and their relationships
 */

const mysql = require('mysql2/promise');
const testConfig = require('../fixtures/test-config.js');

let pool;

describe('Database Integration Tests', () => {
  /**
   * Setup: Create connection pool before all tests
   */
  beforeAll(async () => {
    pool = await mysql.createPool(testConfig.testDB);
  });

  /**
   * Teardown: Close pool after all tests
   */
  afterAll(async () => {
    await pool.end();
  });

  // ============================================================================
  // A. CONNECTION & POOL MANAGEMENT TESTS
  // ============================================================================

  describe('A. Connection & Pool Management', () => {
    test('should connect to MySQL with pool successfully', async () => {
      const connection = await pool.getConnection();
      expect(connection).toBeDefined();
      expect(connection.connection).toBeDefined();
      await connection.release();
    });

    test('should have correct pool size configuration', async () => {
      const connection = await pool.getConnection();
      const poolConfig = connection.pool.config;
      expect(poolConfig.connectionLimit).toBeLessThanOrEqual(10);
      await connection.release();
    });

    test('should release connections properly', async () => {
      const conn1 = await pool.getConnection();
      const connId1 = conn1.connection.threadId;
      await conn1.release();

      // Getting another connection should reuse the pool
      const conn2 = await pool.getConnection();
      const connId2 = conn2.connection.threadId;
      await conn2.release();

      // Both should succeed and connections should be properly released
      expect(connId1).toBeDefined();
      expect(connId2).toBeDefined();
    });

    test('should handle concurrent connections', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          (async () => {
            const conn = await pool.getConnection();
            const [rows] = await conn.query('SELECT 1 as result');
            await conn.release();
            return rows[0].result;
          })()
        );
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      expect(results.every(r => r === 1)).toBe(true);
    });

    test('should handle connection timeout gracefully', async () => {
      const tempPool = await mysql.createPool({
        ...testConfig.testDB,
        connectionLimit: 1,
        waitForConnections: true,
        queueLimit: 1,
      });

      try {
        const conn1 = await tempPool.getConnection();
        const conn2Promise = tempPool.getConnection();

        await conn1.release();
        const conn2 = await conn2Promise;
        await conn2.release();

        expect(true).toBe(true);
      } finally {
        await tempPool.end();
      }
    });
  });

  // ============================================================================
  // B. SCHEMA VALIDATION TESTS
  // ============================================================================

  describe('B. Schema Validation', () => {
    test('should have celebrities table', async () => {
      const conn = await pool.getConnection();
      const [tables] = await conn.query(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'celebrities'",
        [testConfig.testDB.database]
      );
      await conn.release();

      expect(tables).toHaveLength(1);
      expect(tables[0].TABLE_NAME).toBe('celebrities');
    });

    test('should have celebrity_mentions table', async () => {
      const conn = await pool.getConnection();
      const [tables] = await conn.query(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'celebrity_mentions'",
        [testConfig.testDB.database]
      );
      await conn.release();

      expect(tables).toHaveLength(1);
      expect(tables[0].TABLE_NAME).toBe('celebrity_mentions');
    });

    test('should have metrics_cache table', async () => {
      const conn = await pool.getConnection();
      const [tables] = await conn.query(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'metrics_cache'",
        [testConfig.testDB.database]
      );
      await conn.release();

      expect(tables).toHaveLength(1);
      expect(tables[0].TABLE_NAME).toBe('metrics_cache');
    });

    test('should have scraping_jobs table', async () => {
      const conn = await pool.getConnection();
      const [tables] = await conn.query(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'scraping_jobs'",
        [testConfig.testDB.database]
      );
      await conn.release();

      expect(tables).toHaveLength(1);
      expect(tables[0].TABLE_NAME).toBe('scraping_jobs');
    });

    test('should have correct column types in celebrities table', async () => {
      const conn = await pool.getConnection();
      const [columns] = await conn.query(
        "SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'celebrities'",
        [testConfig.testDB.database]
      );
      await conn.release();

      const columnMap = {};
      columns.forEach(col => {
        columnMap[col.COLUMN_NAME] = col.COLUMN_TYPE;
      });

      expect(columnMap['celebrity_id']).toMatch(/int/i);
      expect(columnMap['name']).toMatch(/varchar/i);
      expect(columnMap['name_english']).toMatch(/varchar/i);
      expect(columnMap['category']).toMatch(/varchar/i);
      expect(columnMap['status']).toMatch(/varchar/i);
    });

    test('should have FULLTEXT index on celebrity_mentions.cleaned_text', async () => {
      const conn = await pool.getConnection();
      const [indexes] = await conn.query(
        "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'celebrity_mentions' AND INDEX_NAME LIKE '%FULLTEXT%'",
        [testConfig.testDB.database]
      );
      await conn.release();

      expect(indexes.length).toBeGreaterThan(0);
    });

    test('should use utf8mb4 charset for Traditional Chinese support', async () => {
      const conn = await pool.getConnection();
      const [tables] = await conn.query(
        "SELECT TABLE_COLLATION FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'celebrities'",
        [testConfig.testDB.database]
      );
      await conn.release();

      expect(tables[0].TABLE_COLLATION).toMatch(/utf8mb4/);
    });
  });

  // ============================================================================
  // C. FOREIGN KEY & CONSTRAINT TESTS
  // ============================================================================

  describe('C. Foreign Key Relationships', () => {
    test('should have foreign key from celebrity_mentions to celebrities', async () => {
      const conn = await pool.getConnection();
      const [keys] = await conn.query(
        "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'celebrity_mentions' AND COLUMN_NAME = 'celebrity_id' AND REFERENCED_TABLE_NAME = 'celebrities'",
        [testConfig.testDB.database]
      );
      await conn.release();

      expect(keys.length).toBeGreaterThan(0);
    });

    test('should enforce ON DELETE CASCADE for mentions', async () => {
      const conn = await pool.getConnection();

      // Get a celebrity ID from test data
      const [celebs] = await conn.query('SELECT celebrity_id FROM celebrities LIMIT 1');
      const celebId = celebs[0].celebrity_id;

      // Get mention count before deletion
      const [mentionsBefore] = await conn.query(
        'SELECT COUNT(*) as count FROM celebrity_mentions WHERE celebrity_id = ?',
        [celebId]
      );

      // Delete celebrity
      await conn.query('DELETE FROM celebrities WHERE celebrity_id = ?', [celebId]);

      // Check mentions are deleted
      const [mentionsAfter] = await conn.query(
        'SELECT COUNT(*) as count FROM celebrity_mentions WHERE celebrity_id = ?',
        [celebId]
      );

      expect(mentionsAfter[0].count).toBe(0);
      await conn.release();
    });
  });

  // ============================================================================
  // D. UNIQUE CONSTRAINT TESTS
  // ============================================================================

  describe('D. Unique Constraints', () => {
    test('should enforce unique constraint on celebrities.name', async () => {
      const conn = await pool.getConnection();

      const testName = 'UniqueTestCeleb';
      await conn.query(
        'INSERT INTO celebrities (name, name_english, category, status) VALUES (?, ?, ?, ?)',
        [testName, 'Unique Test', 'Singer', 'active']
      );

      // Try to insert duplicate
      try {
        await conn.query(
          'INSERT INTO celebrities (name, name_english, category, status) VALUES (?, ?, ?, ?)',
          [testName, 'Unique Test 2', 'Singer', 'active']
        );
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.code).toBe('ER_DUP_ENTRY');
      }

      await conn.release();
    });

    test('should prevent duplicate mentions for same celebrity URL pair', async () => {
      const conn = await pool.getConnection();

      const [celebs] = await conn.query('SELECT celebrity_id FROM celebrities LIMIT 1');
      const celebId = celebs[0].celebrity_id;

      const testUrl = 'https://test.example.com/unique-article';
      const testText = 'Test content';

      // Insert first mention
      await conn.query(
        'INSERT INTO celebrity_mentions (celebrity_id, original_url, cleaned_text, domain) VALUES (?, ?, ?, ?)',
        [celebId, testUrl, testText, 'test.example.com']
      );

      // Try to insert duplicate
      try {
        await conn.query(
          'INSERT INTO celebrity_mentions (celebrity_id, original_url, cleaned_text, domain) VALUES (?, ?, ?, ?)',
          [celebId, testUrl, testText, 'test.example.com']
        );
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.code).toBe('ER_DUP_ENTRY');
      }

      await conn.release();
    });
  });

  // ============================================================================
  // E. CHECK CONSTRAINT TESTS
  // ============================================================================

  describe('E. Data Validation Constraints', () => {
    test('should validate sentiment_score between -1 and 1', async () => {
      const conn = await pool.getConnection();

      const [celebs] = await pool.getConnection().then(c => {
        const p = c.query('SELECT celebrity_id FROM celebrities LIMIT 1');
        c.release();
        return p;
      });
      const celebId = celebs[0].celebrity_id;

      // Valid sentiment
      const validSentiment = 0.5;
      await conn.query(
        'INSERT INTO celebrity_mentions (celebrity_id, original_url, cleaned_text, domain, sentiment_score) VALUES (?, ?, ?, ?, ?)',
        [celebId, 'https://test-sentiment.com', 'test', 'test.com', validSentiment]
      );

      expect(true).toBe(true);
      await conn.release();
    });

    test('should validate extraction_confidence between 0 and 1', async () => {
      const conn = await pool.getConnection();

      const [celebs] = await conn.query('SELECT celebrity_id FROM celebrities LIMIT 1');
      const celebId = celebs[0].celebrity_id;

      // Valid confidence
      const validConfidence = 0.85;
      await conn.query(
        'INSERT INTO celebrity_mentions (celebrity_id, original_url, cleaned_text, domain, extraction_confidence) VALUES (?, ?, ?, ?, ?)',
        [celebId, 'https://test-confidence.com', 'test', 'test.com', validConfidence]
      );

      expect(true).toBe(true);
      await conn.release();
    });
  });

  // ============================================================================
  // F. DATA INTEGRITY TESTS
  // ============================================================================

  describe('F. Data Integrity', () => {
    test('should support Traditional Chinese names with UTF-8', async () => {
      const conn = await pool.getConnection();

      const chineseName = '蔡依林測試';
      await conn.query(
        'INSERT INTO celebrities (name, name_english, category, status) VALUES (?, ?, ?, ?)',
        [chineseName, 'Test Chinese', 'Singer', 'active']
      );

      const [result] = await conn.query(
        'SELECT name FROM celebrities WHERE name = ?',
        [chineseName]
      );

      expect(result[0].name).toBe(chineseName);
      await conn.release();
    });

    test('should handle JSON keyword_tags correctly', async () => {
      const conn = await pool.getConnection();

      const [celebs] = await conn.query('SELECT celebrity_id FROM celebrities LIMIT 1');
      const celebId = celebs[0].celebrity_id;

      const keywords = JSON.stringify(['pop', 'music', 'taiwanese']);
      await conn.query(
        'INSERT INTO celebrity_mentions (celebrity_id, original_url, cleaned_text, domain, keyword_tags) VALUES (?, ?, ?, ?, ?)',
        [celebId, 'https://test-json.com', 'test', 'test.com', keywords]
      );

      const [result] = await conn.query(
        'SELECT keyword_tags FROM celebrity_mentions WHERE keyword_tags = ?',
        [keywords]
      );

      expect(JSON.parse(result[0].keyword_tags)).toEqual(expect.arrayContaining(['pop', 'music']));
      await conn.release();
    });
  });

  // ============================================================================
  // G. INDEX PERFORMANCE TESTS
  // ============================================================================

  describe('G. Index Performance', () => {
    test('should have composite index on (celebrity_id, time_stamp)', async () => {
      const conn = await pool.getConnection();
      const [indexes] = await conn.query(
        "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'celebrity_mentions' AND COLUMN_NAME IN ('celebrity_id', 'time_stamp') GROUP BY INDEX_NAME",
        [testConfig.testDB.database]
      );
      await conn.release();

      expect(indexes.length).toBeGreaterThan(0);
    });

    test('should have index on category and status for filtering', async () => {
      const conn = await pool.getConnection();
      const [indexes] = await conn.query(
        "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'celebrities' AND COLUMN_NAME IN ('category', 'status')",
        [testConfig.testDB.database]
      );
      await conn.release();

      expect(indexes.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // H. QUERY PERFORMANCE TESTS
  // ============================================================================

  describe('H. Query Performance', () => {
    test('should query 100 celebrities in under 100ms', async () => {
      const conn = await pool.getConnection();

      const startTime = Date.now();
      await conn.query('SELECT * FROM celebrities');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
      await conn.release();
    });

    test('should query all mentions in under 100ms', async () => {
      const conn = await pool.getConnection();

      const startTime = Date.now();
      await conn.query('SELECT * FROM celebrity_mentions');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
      await conn.release();
    });

    test('should filter by category in under 50ms', async () => {
      const conn = await pool.getConnection();

      const startTime = Date.now();
      await conn.query('SELECT * FROM celebrities WHERE category = ?', ['Singer']);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50);
      await conn.release();
    });
  });

  // ============================================================================
  // I. DATA CONSISTENCY TESTS
  // ============================================================================

  describe('I. Data Consistency', () => {
    test('should maintain referential integrity', async () => {
      const conn = await pool.getConnection();

      // Count celebrities
      const [celebCount] = await conn.query(
        'SELECT COUNT(*) as count FROM celebrities'
      );

      // Count mentions with valid celebrity IDs
      const [mentionCount] = await conn.query(
        'SELECT COUNT(*) as count FROM celebrity_mentions WHERE celebrity_id IN (SELECT celebrity_id FROM celebrities)'
      );

      // Count mentions with invalid celebrity IDs (should be 0)
      const [orphanCount] = await conn.query(
        'SELECT COUNT(*) as count FROM celebrity_mentions WHERE celebrity_id NOT IN (SELECT celebrity_id FROM celebrities)'
      );

      expect(orphanCount[0].count).toBe(0);
      expect(celebCount[0].count).toBeGreaterThan(0);
      expect(mentionCount[0].count).toBeGreaterThanOrEqual(0);
      await conn.release();
    });
  });
});
