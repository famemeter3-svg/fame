import mysql from 'mysql2/promise.js';
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool for database operations
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'celeb_user',
  password: process.env.DB_PASSWORD || 'secure_password_here',
  database: process.env.DB_NAME || 'taiwan_celebrities',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
});

// Test database connection on startup
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Get database connection from pool
export async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('Error getting database connection:', error);
    throw error;
  }
}

// Execute query with automatic connection release
export async function query(sql, values = []) {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.query(sql, values);
    return results;
  } finally {
    connection.release();
  }
}

// Get database pool for manual operations
export function getPool() {
  return pool;
}

export default pool;
