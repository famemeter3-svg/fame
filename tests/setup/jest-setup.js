/**
 * Jest Setup Script
 * Initializes test database and environment before running tests
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const testConfig = require('../fixtures/test-config.js');

/**
 * Global setup for all Jest tests
 */
module.exports = async () => {
  console.log('🔧 Setting up test environment...');

  try {
    // Create test database connection (root level)
    const rootConnection = await mysql.createConnection({
      host: testConfig.testDB.host,
      user: 'root',
      password: process.env.MYSQL_ROOT_PASSWORD || '',
    });

    console.log('✅ Connected to MySQL');

    // Drop existing test database if it exists
    await rootConnection.execute(
      `DROP DATABASE IF EXISTS \`${testConfig.testDB.database}\``
    );
    console.log('✅ Dropped existing test database');

    // Create fresh test database
    await rootConnection.execute(
      `CREATE DATABASE \`${testConfig.testDB.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log('✅ Created new test database');

    await rootConnection.end();

    // Connect to test database and import schema
    const testConnection = await mysql.createConnection({
      host: testConfig.testDB.host,
      user: testConfig.testDB.user,
      password: testConfig.testDB.password,
      database: testConfig.testDB.database,
      multipleStatements: true,
    });

    console.log('✅ Connected to test database');

    // Read and execute schema
    const schemaPath = path.join(
      __dirname,
      '../../database/schema.sql'
    );
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Remove SQL comments and split into individual statements
    let cleanedSchema = schema
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    const statements = cleanedSchema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && stmt.length > 10);

    console.log(`📊 Executing ${statements.length} SQL statements...`);

    for (const statement of statements) {
      try {
        await testConnection.execute(statement + ';');
      } catch (error) {
        if (error.message.includes('already exists')) {
          // Table already exists - skip
        } else {
          throw error;
        }
      }
    }

    console.log('✅ Imported database schema');

    // Seed test data
    const testCelebrities = require('../fixtures/test-celebrities.json');
    const testMentions = require('../fixtures/test-mentions.json');

    // Insert test celebrities
    for (const celeb of testCelebrities) {
      await testConnection.execute(
        'INSERT INTO celebrities (celebrity_id, name, name_english, category, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [celeb.celebrity_id, celeb.name, celeb.name_english, celeb.category, celeb.status]
      );
    }
    console.log(`✅ Seeded ${testCelebrities.length} test celebrities`);

    // Insert test mentions
    for (const mention of testMentions) {
      await testConnection.execute(
        'INSERT INTO celebrity_mentions (celebrity_id, cleaned_text, original_url, domain, content_length, extraction_confidence, sentiment_score, keyword_tags, processing_time_ms, time_stamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          mention.celebrity_id,
          mention.cleaned_text,
          mention.original_url,
          mention.domain,
          mention.content_length,
          mention.extraction_confidence,
          mention.sentiment_score,
          mention.keyword_tags,
          mention.processing_time_ms,
          mention.time_stamp,
        ]
      );
    }
    console.log(`✅ Seeded ${testMentions.length} test mentions`);

    await testConnection.end();

    // Store config in global for tests to access
    global.testConfig = testConfig;

    console.log('✅ Test environment setup complete!\n');
  } catch (error) {
    console.error('❌ Error setting up test environment:', error);
    process.exit(1);
  }
};
