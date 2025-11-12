import dotenv from 'dotenv';
import process from 'process';

dotenv.config();

// Validate required environment variables
function validateEnv() {
  const required = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
  ];

  const missing = required.filter(env => !process.env[env]);

  if (missing.length > 0) {
    console.warn(`⚠️  Warning: Missing environment variables: ${missing.join(', ')}`);
    console.warn('Using default values where available');
  }
}

// Environment configuration object
export const config = {
  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'celeb_user',
    password: process.env.DB_PASSWORD || 'secure_password_here',
    name: process.env.DB_NAME || 'taiwan_celebrities',
    port: parseInt(process.env.DB_PORT || '3306'),
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  },

  // Server
  server: {
    port: parseInt(process.env.PORT || '5000'),
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Frontend
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '15 * 60 * 1000'),  // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),  // 100 requests per window
  },

  // Scraper
  scraper: {
    resultsPerCelebrity: parseInt(process.env.SCRAPER_RESULTS_PER_CELEBRITY || '20'),
    delayBetweenRequests: parseInt(process.env.SCRAPER_DELAY_BETWEEN_REQUESTS || '1000'),
    timeout: parseInt(process.env.SCRAPER_TIMEOUT || '30000'),
    retries: parseInt(process.env.SCRAPER_RETRIES || '3'),
    schedule: process.env.SCRAPER_SCHEDULE || '0 2 * * *',  // 2am daily
  },

  // Metrics
  metrics: {
    cacheDays: parseInt(process.env.METRICS_CACHE_DAYS || '1'),
    defaultPeriodDays: parseInt(process.env.METRICS_DEFAULT_PERIOD_DAYS || '30'),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
  },
};

// Initialize environment
validateEnv();

export default config;
