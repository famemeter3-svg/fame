import mysql from 'mysql2/promise.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'celeb_user',
  password: process.env.DB_PASSWORD || 'secure_password_here',
  database: process.env.DB_NAME || 'taiwan_celebrities',
  port: process.env.DB_PORT || 3306,
};

async function seedCelebrities() {
  let connection;

  try {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║     🌟 Taiwan Celebrity Tracker - Seeding Script 🌟       ║
╚════════════════════════════════════════════════════════════╝
    `);

    // Read celebrities data
    const dataPath = path.join(__dirname, '../../database/seeds/celebrities.json');
    console.log(`\n📖 Loading celebrities data from: ${dataPath}`);

    if (!fs.existsSync(dataPath)) {
      throw new Error(`Celebrities data file not found: ${dataPath}`);
    }

    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const celebrities = JSON.parse(rawData);

    if (!Array.isArray(celebrities) || celebrities.length === 0) {
      throw new Error('Invalid celebrities data format');
    }

    console.log(`✅ Loaded ${celebrities.length} celebrities`);

    // Connect to database
    console.log(`\n🔌 Connecting to database...`);
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Database: ${dbConfig.database}`);

    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Verify table exists
    console.log(`\n🔍 Verifying celebrities table...`);
    const [tables] = await connection.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'celebrities'",
      [dbConfig.database]
    );

    if (tables.length === 0) {
      throw new Error('celebrities table not found. Run database/scripts/init-db.sh first');
    }
    console.log('✅ celebrities table exists');

    // Get current count
    const [countResult] = await connection.query('SELECT COUNT(*) as count FROM celebrities');
    const currentCount = countResult[0]?.count || 0;

    if (currentCount > 0) {
      console.log(`\n⚠️  Database already contains ${currentCount} celebrities`);
      console.log('   Proceeding to insert additional celebrities...');
    }

    // Seed celebrities
    console.log(`\n🌱 Seeding ${celebrities.length} celebrities...`);
    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (let i = 0; i < celebrities.length; i++) {
      const celeb = celebrities[i];
      const progress = `[${i + 1}/${celebrities.length}]`;

      try {
        // Validate required fields
        if (!celeb.name || !celeb.name_english) {
          throw new Error('Missing required fields: name or name_english');
        }

        // Insert celebrity
        const [result] = await connection.query(
          `INSERT INTO celebrities (name, name_english, category, status)
           VALUES (?, ?, ?, 'active')`,
          [celeb.name, celeb.name_english, celeb.category || 'Other']
        );

        successCount++;
        // Show progress every 10 celebrities
        if ((i + 1) % 10 === 0) {
          console.log(`${progress} ✅ ${successCount} inserted`);
        }
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          duplicateCount++;
          if ((i + 1) % 10 === 0) {
            console.log(`${progress} ⏭️  ${duplicateCount} duplicates skipped`);
          }
        } else {
          errorCount++;
          console.error(`${progress} ❌ Error: ${error.message}`);
        }
      }
    }

    // Final results
    console.log(`\n
╔════════════════════════════════════════════════════════════╗
║                  🎉 SEEDING COMPLETE 🎉                   ║
╚════════════════════════════════════════════════════════════╝

📊 Results:
  ✅ Successfully inserted: ${successCount}
  ⏭️  Duplicates skipped: ${duplicateCount}
  ❌ Errors: ${errorCount}

📈 Database Statistics:
  Total celebrities: ${currentCount + successCount}
  Categories: ${[...new Set(celebrities.map(c => c.category))].join(', ')}

✨ Next Steps:
  1. Start the backend: npm start
  2. Test the API: curl http://localhost:5000/api/celebrities
  3. Trigger scraping: curl -X POST http://localhost:5000/api/admin/scrape

════════════════════════════════════════════════════════════════
    `);

    // Verify final count
    const [finalCount] = await connection.query('SELECT COUNT(*) as count FROM celebrities');
    console.log(`✅ Final celebrity count: ${finalCount[0]?.count || 0}`);

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the seed script
seedCelebrities();
