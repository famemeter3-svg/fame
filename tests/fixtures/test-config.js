/**
 * Shared Test Configuration
 * Used across all integration tests
 */

module.exports = {
  // Test Database Configuration
  testDB: {
    host: process.env.TEST_DB_HOST || 'localhost',
    user: process.env.TEST_DB_USER || 'celeb_user',
    password: process.env.TEST_DB_PASS || '0000',
    database: process.env.TEST_DB_NAME || 'taiwan_celebrities_test',
    port: process.env.TEST_DB_PORT || 3306,
    connectionLimit: 5, // Smaller pool for tests
    waitForConnections: true,
    queueLimit: 0,
  },

  // Test Backend Configuration
  testBackend: {
    host: 'localhost',
    port: process.env.TEST_BACKEND_PORT || 5001,
    baseURL: process.env.TEST_BACKEND_URL || 'http://localhost:5001',
    timeout: 10000,
  },

  // Test Frontend Configuration
  testFrontend: {
    url: 'http://localhost:3000',
    headless: true,
    timeout: 30000,
  },

  // Test Scraper Configuration
  testScraper: {
    batchSize: 2, // Small batch for tests
    resultsPerCelebrity: 3, // Limited results for speed
    delaySeconds: 0, // No delay in tests
    timeoutSeconds: 30,
    maxRetries: 2,
  },

  // Test Data Configuration
  testData: {
    testCelebrities: [
      {
        id: 1,
        name: '蔡依林',
        name_english: 'Jolin Tsai',
        category: 'Singer',
        status: 'active',
      },
      {
        id: 2,
        name: '范冰冰',
        name_english: 'Fan Bingbing',
        category: 'Actress',
        status: 'active',
      },
      {
        id: 3,
        name: '林志玲',
        name_english: 'Chiling Lin',
        category: 'Model',
        status: 'active',
      },
      {
        id: 4,
        name: '周杰倫',
        name_english: 'Jay Chou',
        category: 'Singer',
        status: 'active',
      },
      {
        id: 5,
        name: '劉德華',
        name_english: 'Andy Lau',
        category: 'Actor',
        status: 'active',
      },
    ],

    testMentions: [
      {
        celebrity_id: 1,
        original_url: 'https://en.wikipedia.org/wiki/Jolin_Tsai',
        domain: 'wikipedia.org',
        cleaned_text: 'Jolin Tsai is a Taiwanese singer...',
        sentiment_score: 0.5,
        keyword_tags: JSON.stringify(['singer', 'taiwan', 'pop']),
      },
      {
        celebrity_id: 1,
        original_url: 'https://www.instagram.com/jolintsai',
        domain: 'instagram.com',
        cleaned_text: 'Follow Jolin Tsai on Instagram...',
        sentiment_score: 0.7,
        keyword_tags: JSON.stringify(['instagram', 'follow']),
      },
    ],
  },

  // Timeout configurations
  timeouts: {
    unit: 5000,
    integration: 10000,
    e2e: 30000,
    performance: 60000,
  },

  // Performance benchmarks (in milliseconds)
  benchmarks: {
    dbQueryMax: 100,
    apiResponseMax: 50,
    pageLoadMax: 3000,
    scraperSingleMax: 15000,
    scraperBatchMax: 900000, // 15 minutes
  },
};
