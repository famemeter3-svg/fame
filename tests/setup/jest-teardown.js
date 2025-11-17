/**
 * Jest Teardown Script
 * Cleans up test environment after running tests
 */

const mysql = require('mysql2/promise');
const testConfig = require('../fixtures/test-config.js');

/**
 * Global teardown for all Jest tests
 */
module.exports = async () => {
  console.log('\n🧹 Cleaning up test environment...');

  try {
    // Connect to MySQL as root to drop database
    const rootConnection = await mysql.createConnection({
      host: testConfig.testDB.host,
      user: 'root',
      password: process.env.MYSQL_ROOT_PASSWORD || '',
    });

    console.log('✅ Connected to MySQL');

    // Drop test database
    await rootConnection.execute(
      `DROP DATABASE IF EXISTS \`${testConfig.testDB.database}\``
    );
    console.log('✅ Dropped test database');

    await rootConnection.end();

    console.log('✅ Test environment cleanup complete!\n');
  } catch (error) {
    console.error('⚠️  Warning during cleanup:', error.message);
    // Don't exit with error on teardown - tests already ran
  }
};
