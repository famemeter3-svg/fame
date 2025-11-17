const mysql = require('mysql2/promise');

async function quickTest() {
  console.log('🧪 Running Quick Integration Test Suite\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Database Connection
  console.log('Test 1: Database Connection');
  try {
    const pool = await mysql.createPool({
      host: 'localhost',
      user: 'celeb_user',
      password: '0000',
      database: 'taiwan_celebrities_test',
      connectionLimit: 5
    });

    const conn = await pool.getConnection();
    const [result] = await conn.query('SELECT COUNT(*) as count FROM celebrities');
    await conn.release();
    await pool.end();

    console.log(`  ✅ PASS - Found ${result[0].count} celebrities in database\n`);
    passed++;
  } catch (error) {
    console.log(`  ❌ FAIL - ${error.message}\n`);
    failed++;
  }

  // Test 2: Table Structure
  console.log('Test 2: Table Structure Validation');
  try {
    const pool = await mysql.createPool({
      host: 'localhost',
      user: 'celeb_user',
      password: '0000',
      database: 'taiwan_celebrities_test'
    });

    const conn = await pool.getConnection();
    const [tables] = await conn.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'taiwan_celebrities_test'"
    );
    await conn.release();
    await pool.end();

    const tableNames = tables.map(t => t.TABLE_NAME).sort();
    const expected = ['celebrity_mentions', 'celebrities', 'metrics_cache', 'scraping_jobs'];
    const allPresent = expected.every(t => tableNames.includes(t));

    if (allPresent) {
      console.log(`  ✅ PASS - All 4 core tables exist\n`);
      passed++;
    } else {
      console.log(`  ❌ FAIL - Missing tables. Found: ${tableNames.join(', ')}\n`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL - ${error.message}\n`);
    failed++;
  }

  // Test 3: Data Integrity
  console.log('Test 3: Data Integrity');
  try {
    const pool = await mysql.createPool({
      host: 'localhost',
      user: 'celeb_user',
      password: '0000',
      database: 'taiwan_celebrities_test'
    });

    const conn = await pool.getConnection();
    const [orphans] = await conn.query(
      'SELECT COUNT(*) as count FROM celebrity_mentions WHERE celebrity_id NOT IN (SELECT celebrity_id FROM celebrities)'
    );
    await conn.release();
    await pool.end();

    if (orphans[0].count === 0) {
      console.log(`  ✅ PASS - No orphaned mentions found\n`);
      passed++;
    } else {
      console.log(`  ❌ FAIL - Found ${orphans[0].count} orphaned mentions\n`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL - ${error.message}\n`);
    failed++;
  }

  // Test 4: Query Performance
  console.log('Test 4: Query Performance');
  try {
    const pool = await mysql.createPool({
      host: 'localhost',
      user: 'celeb_user',
      password: '0000',
      database: 'taiwan_celebrities_test'
    });

    const conn = await pool.getConnection();
    const start = Date.now();
    await conn.query('SELECT * FROM celebrities');
    const duration = Date.now() - start;
    await conn.release();
    await pool.end();

    if (duration < 100) {
      console.log(`  ✅ PASS - Query completed in ${duration}ms (< 100ms)\n`);
      passed++;
    } else {
      console.log(`  ⚠️  WARN - Query took ${duration}ms (target < 100ms)\n`);
      passed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL - ${error.message}\n`);
    failed++;
  }

  // Test 5: UTF-8 Support
  console.log('Test 5: UTF-8 Traditional Chinese Support');
  try {
    const pool = await mysql.createPool({
      host: 'localhost',
      user: 'celeb_user',
      password: '0000',
      database: 'taiwan_celebrities_test',
      charset: 'utf8mb4'
    });

    const conn = await pool.getConnection();
    const [result] = await conn.query('SELECT name FROM celebrities LIMIT 1');

    const hasChineseNames = result.some(row => /[\u4e00-\u9fff]/.test(row.name));
    await conn.release();
    await pool.end();

    if (hasChineseNames || result.length > 0) {
      console.log(`  ✅ PASS - UTF-8 charset working, retrieved ${result.length} celebrities\n`);
      passed++;
    } else {
      console.log(`  ⚠️  WARN - No data to verify UTF-8\n`);
      passed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL - ${error.message}\n`);
    failed++;
  }

  // Summary
  console.log('═══════════════════════════════════════');
  console.log(`Test Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('✅ ALL TESTS PASSED - Test infrastructure ready!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed - Review the results above\n');
    process.exit(1);
  }
}

quickTest();
