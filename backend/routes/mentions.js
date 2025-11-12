import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

// GET /api/mentions/:celebrity_id - Get mentions for a celebrity
router.get('/:celebrity_id', async (req, res, next) => {
  try {
    const { celebrity_id } = req.params;
    const { limit = 20, offset = 0, days = 30, domain, sort = 'time_stamp', order = 'DESC' } = req.query;

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

    // Build WHERE clause
    const whereConditions = ['celebrity_id = ?'];
    const params = [celebrity_id];

    if (days) {
      whereConditions.push('time_stamp >= DATE_SUB(NOW(), INTERVAL ? DAY)');
      params.push(parseInt(days));
    }

    if (domain) {
      whereConditions.push('domain = ?');
      params.push(domain);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM celebrity_mentions WHERE ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0]?.total || 0;

    // Validate sort
    const validSorts = ['time_stamp', 'sentiment_score', 'extraction_confidence', 'created_at'];
    const sortBy = validSorts.includes(sort) ? sort : 'time_stamp';
    const validOrders = ['ASC', 'DESC'];
    const sortOrder = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

    // Get paginated results
    const sql = `
      SELECT
        mention_id, celebrity_id, cleaned_text, source, time_stamp, domain,
        sentiment_score, extraction_confidence, keyword_tags, content_length
      FROM celebrity_mentions
      WHERE ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const results = await query(sql, [...params, parseInt(limit), parseInt(offset)]);

    // Parse JSON fields
    const parsedResults = results.map(row => ({
      ...row,
      keyword_tags: row.keyword_tags ? JSON.parse(row.keyword_tags) : [],
    }));

    res.json({
      success: true,
      data: parsedResults,
      count: parsedResults.length,
      total,
      page: Math.ceil(parseInt(offset) / parseInt(limit)) + 1,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/mentions/:celebrity_id/domains - Get unique domains for a celebrity
router.get('/:celebrity_id/domains', async (req, res, next) => {
  try {
    const { celebrity_id } = req.params;

    const results = await query(
      `SELECT DISTINCT domain, COUNT(*) as mention_count
       FROM celebrity_mentions
       WHERE celebrity_id = ?
       AND domain IS NOT NULL
       GROUP BY domain
       ORDER BY mention_count DESC`,
      [celebrity_id]
    );

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/mentions/:celebrity_id/stats - Get mention statistics
router.get('/:celebrity_id/stats', async (req, res, next) => {
  try {
    const { celebrity_id } = req.params;

    // Get various statistics
    const totalResult = await query(
      'SELECT COUNT(*) as total FROM celebrity_mentions WHERE celebrity_id = ?',
      [celebrity_id]
    );

    const recentResult = await query(
      'SELECT COUNT(*) as recent FROM celebrity_mentions WHERE celebrity_id = ? AND time_stamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
      [celebrity_id]
    );

    const domainsResult = await query(
      'SELECT COUNT(DISTINCT domain) as unique_domains FROM celebrity_mentions WHERE celebrity_id = ?',
      [celebrity_id]
    );

    const sentimentResult = await query(
      'SELECT AVG(sentiment_score) as avg_sentiment, MIN(sentiment_score) as min_sentiment, MAX(sentiment_score) as max_sentiment FROM celebrity_mentions WHERE celebrity_id = ?',
      [celebrity_id]
    );

    res.json({
      success: true,
      data: {
        total_mentions: totalResult[0]?.total || 0,
        recent_mentions_30d: recentResult[0]?.recent || 0,
        unique_domains: domainsResult[0]?.unique_domains || 0,
        avg_sentiment: parseFloat(sentimentResult[0]?.avg_sentiment || 0).toFixed(2),
        sentiment_range: {
          min: parseFloat(sentimentResult[0]?.min_sentiment || 0).toFixed(2),
          max: parseFloat(sentimentResult[0]?.max_sentiment || 0).toFixed(2),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
