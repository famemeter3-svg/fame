import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { testConnection, getPool } from './config/database.js';
import { config } from './config/environment.js';
import { corsMiddleware } from './middleware/cors.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import celebritiesRouter from './routes/celebrities.js';
import metricsRouter from './routes/metrics.js';
import mentionsRouter from './routes/mentions.js';
import adminRouter from './routes/admin.js';

const app = express();
const port = config.server.port;

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// Security
app.use(helmet());

// Logging
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(corsMiddleware);

// Rate limiting (except health checks)
app.use(apiLimiter);

// ============================================================================
// ROUTES
// ============================================================================

// Health check (no rate limiting)
app.get('/health', async (req, res) => {
  try {
    const pool = getPool();
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
    });
  }
});

// API Routes
app.use('/api/celebrities', celebritiesRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/mentions', mentionsRouter);
app.use('/api/admin', adminRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Taiwan Celebrity Tracker API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      celebrities: '/api/celebrities',
      metrics: '/api/metrics',
      mentions: '/api/mentions',
      admin: '/api/admin',
    },
  });
});

// 404 handler
app.use(notFound);

// Error handling
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function start() {
  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    const isConnected = await testConnection();

    if (!isConnected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }

    // Start server
    app.listen(port, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║   🎉 Taiwan Celebrity Tracker API Started                  ║
╚════════════════════════════════════════════════════════════╝

✅ Server: http://localhost:${port}
✅ Health: http://localhost:${port}/health
✅ API: http://localhost:${port}/api/celebrities

📚 Available Endpoints:
  GET  /api/celebrities          - List all celebrities
  GET  /api/celebrities/:id      - Get specific celebrity
  GET  /api/metrics/:id          - Get metrics for celebrity
  GET  /api/mentions/:id         - Get mentions for celebrity
  GET  /api/admin/health         - Admin health check
  POST /api/admin/scrape         - Trigger scraping job

⚙️  Configuration:
  Environment: ${config.server.nodeEnv}
  Database: ${config.database.host}:${config.database.port}/${config.database.name}
  Rate Limit: ${config.rateLimit.max} requests per ${config.rateLimit.windowMs / 60000} minutes

💡 Next Steps:
  1. Seed celebrities: npm run seed
  2. Test API: curl http://localhost:${port}/api/celebrities
  3. View metrics: curl http://localhost:${port}/api/metrics/1

════════════════════════════════════════════════════════════════
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⏹️  SIGTERM received, shutting down gracefully...');
  const pool = getPool();
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('⏹️  SIGINT received, shutting down gracefully...');
  const pool = getPool();
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

// Start the server
start();
