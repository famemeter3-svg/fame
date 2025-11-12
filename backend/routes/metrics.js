import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

// GET /api/metrics/:celebrity_id - Get latest metrics for a celebrity
router.get('/:celebrity_id', async (req, res, next) => {
  try {
    const { celebrity_id } = req.params;

    // Verify celebrity exists
    const celeb = await query(
      'SELECT celebrity_id FROM celebrities WHERE celebrity_id = ?',
      [celebrity_id]
    );

    if (celeb.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Celebrity not found',
      });
    }

    // Get latest metrics (today's or most recent)
    const results = await query(
      `SELECT metric_id, celebrity_id, metric_type, metric_value, calculated_date, calculation_period_days
       FROM metrics_cache
       WHERE celebrity_id = ?
       ORDER BY calculated_date DESC, metric_type
       LIMIT 100`,
      [celebrity_id]
    );

    // Group by date (get most recent day's metrics)
    const metricsByDate = {};
    results.forEach(row => {
      const date = row.calculated_date;
      if (!metricsByDate[date]) {
        metricsByDate[date] = {};
      }
      metricsByDate[date][row.metric_type] = parseFloat(row.metric_value);
    });

    res.json({
      success: true,
      data: {
        celebrity_id,
        metrics_by_date: metricsByDate,
        latest_date: Object.keys(metricsByDate)[0] || null,
      },
      count: Object.keys(metricsByDate).length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/metrics/:celebrity_id/history - Get metrics history over time
router.get('/:celebrity_id/history', async (req, res, next) => {
  try {
    const { celebrity_id } = req.params;
    const { metric_type, days = 30 } = req.query;

    // Verify celebrity exists
    const celeb = await query(
      'SELECT celebrity_id FROM celebrities WHERE celebrity_id = ?',
      [celebrity_id]
    );

    if (celeb.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Celebrity not found',
      });
    }

    // Build query
    let sql = `
      SELECT metric_type, metric_value, calculated_date
      FROM metrics_cache
      WHERE celebrity_id = ?
      AND calculated_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `;
    const params = [celebrity_id, parseInt(days)];

    if (metric_type) {
      sql += ' AND metric_type = ?';
      params.push(metric_type);
    }

    sql += ' ORDER BY metric_type, calculated_date ASC';

    const results = await query(sql, params);

    res.json({
      success: true,
      data: results,
      count: results.length,
      filters: {
        celebrity_id,
        metric_type: metric_type || 'all',
        days: parseInt(days),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/metrics/top/:metric_type - Get top celebrities by metric
router.get('/top/:metric_type', async (req, res, next) => {
  try {
    const { metric_type } = req.params;
    const { limit = 10 } = req.query;

    const results = await query(
      `SELECT c.celebrity_id, c.name, c.name_english, m.metric_value, m.calculated_date
       FROM metrics_cache m
       JOIN celebrities c ON m.celebrity_id = c.celebrity_id
       WHERE m.metric_type = ?
       AND m.calculated_date = (
         SELECT MAX(calculated_date)
         FROM metrics_cache
         WHERE metric_type = ?
       )
       ORDER BY m.metric_value DESC
       LIMIT ?`,
      [metric_type, metric_type, parseInt(limit)]
    );

    res.json({
      success: true,
      data: results,
      count: results.length,
      metric_type,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
