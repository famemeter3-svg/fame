import express from 'express';
import { query } from '../config/database.js';
import { spawn } from 'child_process';

const router = express.Router();

// GET /api/admin/health - Health check endpoint
router.get('/health', async (req, res, next) => {
  try {
    // Check database connection
    const result = await query('SELECT 1 as connected');

    res.json({
      success: true,
      status: 'healthy',
      database: result.length > 0 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/admin/scrape - Trigger scraping job
router.post('/scrape', async (req, res, next) => {
  try {
    const { celebrity_id, batch = false } = req.body;

    // Create scraping job record
    const jobType = batch ? 'batch' : (celebrity_id ? 'single' : 'batch');
    const jobResult = await query(
      `INSERT INTO scraping_jobs (celebrity_id, job_type, status, start_time)
       VALUES (?, ?, 'running', NOW())`,
      [celebrity_id || null, jobType]
    );

    const jobId = jobResult.insertId;

    // Respond immediately (don't wait for scraper)
    res.json({
      success: true,
      message: 'Scraping job initiated',
      job_id: jobId,
      job_type: jobType,
    });

    // Run scraper in background (non-blocking)
    // In production, this would be a proper job queue (Bull, RabbitMQ, etc.)
    setImmediate(() => {
      runScraper(jobId, celebrity_id, jobType);
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/scrape/jobs - Get scraping jobs status
router.get('/scrape/jobs', async (req, res, next) => {
  try {
    const { status, limit = 20 } = req.query;

    let sql = 'SELECT * FROM scraping_jobs';
    const params = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY start_time DESC LIMIT ?';
    params.push(parseInt(limit));

    const results = await query(sql, params);

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/scrape/job/:job_id - Get specific job details
router.get('/scrape/job/:job_id', async (req, res, next) => {
  try {
    const { job_id } = req.params;

    const results = await query(
      'SELECT * FROM scraping_jobs WHERE job_id = ?',
      [job_id]
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    res.json({
      success: true,
      data: results[0],
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/stats - Get database statistics
router.get('/stats', async (req, res, next) => {
  try {
    const celebCount = await query('SELECT COUNT(*) as count FROM celebrities');
    const mentionCount = await query('SELECT COUNT(*) as count FROM celebrity_mentions');
    const metricsCount = await query('SELECT COUNT(*) as count FROM metrics_cache');
    const jobsCount = await query('SELECT COUNT(*) as count FROM scraping_jobs');

    res.json({
      success: true,
      data: {
        celebrities: celebCount[0]?.count || 0,
        mentions: mentionCount[0]?.count || 0,
        metrics: metricsCount[0]?.count || 0,
        jobs: jobsCount[0]?.count || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to run scraper in background
async function runScraper(jobId, celebrityId, jobType) {
  try {
    // Update job status to running
    await query(
      'UPDATE scraping_jobs SET status = ?, start_time = NOW() WHERE job_id = ?',
      ['running', jobId]
    );

    console.log(`🔄 Starting scraper job ${jobId} (${jobType})`);

    // In production, this would call the Python scraper
    // For now, just simulate completion
    setTimeout(async () => {
      try {
        await query(
          'UPDATE scraping_jobs SET status = ?, end_time = NOW() WHERE job_id = ?',
          ['completed', jobId]
        );
        console.log(`✅ Scraper job ${jobId} completed`);
      } catch (error) {
        console.error(`❌ Failed to update job ${jobId}:`, error);
      }
    }, 5000);
  } catch (error) {
    console.error(`❌ Scraper job ${jobId} failed:`, error);
    try {
      await query(
        'UPDATE scraping_jobs SET status = ?, error_message = ?, end_time = NOW() WHERE job_id = ?',
        ['failed', error.message, jobId]
      );
    } catch (updateError) {
      console.error('Failed to update job status:', updateError);
    }
  }
}

export default router;
