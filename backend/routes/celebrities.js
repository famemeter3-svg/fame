import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

// GET /api/celebrities - List all celebrities with filters and pagination
// GET /api/celebrities/categories - Get unique categories (MUST be before /:id)
router.get('/categories', async (req, res, next) => {
  try {
    const results = await query(
      'SELECT DISTINCT category FROM celebrities WHERE category IS NOT NULL ORDER BY category'
    );

    const categories = results.map(r => r.category);

    res.json({
      success: true,
      data: categories,
      count: categories.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/celebrities - List all celebrities with filters and pagination
router.get('/', async (req, res, next) => {
  try {
    const { status, category, limit = 20, offset = 0, sort = 'name', order = 'ASC' } = req.query;

    // Build WHERE clause
    const whereConditions = [];
    const params = [];

    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    if (category) {
      whereConditions.push('category = ?');
      params.push(category);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Validate sort order
    const validOrders = ['ASC', 'DESC'];
    const sortOrder = validOrders.includes(order.toUpperCase()) ? order.toUpperCase() : 'ASC';
    const validSorts = ['name', 'name_english', 'category', 'status', 'created_at'];
    const sortBy = validSorts.includes(sort) ? sort : 'name';

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM celebrities ${whereClause}`;
    const countResult = await query(countSql, params);
    const total = countResult[0]?.total || 0;

    // Get paginated results
    const sql = `
      SELECT celebrity_id, name, name_english, category, status, last_scraped, created_at, updated_at
      FROM celebrities
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    const results = await query(sql, [...params, parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      data: results,
      count: results.length,
      total,
      page: Math.ceil(parseInt(offset) / parseInt(limit)) + 1,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/celebrities/:id - Get single celebrity with statistics
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get celebrity
    const results = await query(
      'SELECT celebrity_id, name, name_english, category, status, last_scraped, metadata, created_at, updated_at FROM celebrities WHERE celebrity_id = ?',
      [id]
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Celebrity not found',
      });
    }

    const celebrity = results[0];

    // Get mention count
    const mentionResult = await query(
      'SELECT COUNT(*) as mention_count FROM celebrity_mentions WHERE celebrity_id = ?',
      [id]
    );
    celebrity.mention_count = mentionResult[0]?.mention_count || 0;

    // Get recent mentions count (last 30 days)
    const recentResult = await query(
      'SELECT COUNT(*) as recent_count FROM celebrity_mentions WHERE celebrity_id = ? AND time_stamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
      [id]
    );
    celebrity.recent_mentions = recentResult[0]?.recent_count || 0;

    res.json({
      success: true,
      data: celebrity,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
