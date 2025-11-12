import { query } from '../config/database.js';

/**
 * Calculate 6 key metrics for a celebrity
 * 1. Mention Frequency - Total count of mentions
 * 2. Mention Velocity - Mentions per day
 * 3. Trending Score - Weighted momentum
 * 4. Popularity Index - Overall fame level (0-100)
 * 5. Source Diversity - Number of unique domains
 * 6. Top Keywords - Most frequent keywords
 */

export async function calculateMetrics(celebrityId, periodDays = 30) {
  try {
    const date = new Date().toISOString().split('T')[0];

    // Get mentions in period
    const mentions = await query(
      `SELECT mention_id, sentiment_score, time_stamp, domain, keyword_tags
       FROM celebrity_mentions
       WHERE celebrity_id = ?
       AND time_stamp >= DATE_SUB(?, INTERVAL ? DAY)
       ORDER BY time_stamp DESC`,
      [celebrityId, date, periodDays]
    );

    // Calculate metrics
    const metrics = {};

    // 1. Mention Frequency
    metrics.mention_frequency = mentions.length;

    // 2. Mention Velocity (mentions per day)
    metrics.mention_velocity = (mentions.length / periodDays).toFixed(2);

    // 3. Trending Score (weighted by recency)
    let trendingScore = 0;
    mentions.forEach((m, index) => {
      const weight = 1 - (index / mentions.length); // Recent mentions weighted higher
      trendingScore += weight;
    });
    metrics.trending_score = trendingScore.toFixed(2);

    // 4. Popularity Index (0-100)
    // Based on frequency normalized to scale
    metrics.popularity_index = Math.min(
      100,
      (mentions.length / periodDays * 10).toFixed(2)
    );

    // 5. Source Diversity (unique domains)
    const domains = new Set();
    mentions.forEach(m => {
      if (m.domain) domains.add(m.domain);
    });
    metrics.source_diversity = domains.size;

    // 6. Top Keywords (most frequent)
    const keywordFreq = {};
    mentions.forEach(m => {
      if (m.keyword_tags) {
        try {
          const keywords = JSON.parse(m.keyword_tags);
          if (Array.isArray(keywords)) {
            keywords.forEach(kw => {
              keywordFreq[kw] = (keywordFreq[kw] || 0) + 1;
            });
          }
        } catch (e) {
          // Skip if invalid JSON
        }
      }
    });

    const topKeywords = Object.entries(keywordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([kw]) => kw);

    metrics.top_keywords = JSON.stringify(topKeywords);

    // Store metrics in database
    const metricTypes = [
      'mention_frequency',
      'mention_velocity',
      'trending_score',
      'popularity_index',
      'source_diversity',
      'top_keywords',
    ];

    for (const metricType of metricTypes) {
      await query(
        `INSERT INTO metrics_cache (celebrity_id, metric_type, metric_value, calculated_date, calculation_period_days)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         metric_value = VALUES(metric_value),
         created_at = NOW()`,
        [celebrityId, metricType, metrics[metricType], date, periodDays]
      );
    }

    return metrics;
  } catch (error) {
    console.error(`Error calculating metrics for celebrity ${celebrityId}:`, error);
    throw error;
  }
}

/**
 * Calculate metrics for all celebrities
 */
export async function calculateAllMetrics(periodDays = 30) {
  try {
    // Get all celebrities
    const celebrities = await query('SELECT celebrity_id FROM celebrities WHERE status = "active"');

    const results = [];

    for (const { celebrity_id } of celebrities) {
      const metrics = await calculateMetrics(celebrity_id, periodDays);
      results.push({
        celebrity_id,
        metrics,
      });
    }

    console.log(`✅ Calculated metrics for ${results.length} celebrities`);
    return results;
  } catch (error) {
    console.error('Error calculating all metrics:', error);
    throw error;
  }
}

/**
 * Get cached metrics for celebrity
 */
export async function getMetrics(celebrityId) {
  try {
    const results = await query(
      `SELECT metric_type, metric_value, calculated_date
       FROM metrics_cache
       WHERE celebrity_id = ?
       ORDER BY calculated_date DESC
       LIMIT 6`,
      [celebrityId]
    );

    const metrics = {};
    results.forEach(r => {
      metrics[r.metric_type] = r.metric_value;
    });

    return metrics;
  } catch (error) {
    console.error(`Error getting metrics for celebrity ${celebrityId}:`, error);
    throw error;
  }
}

/**
 * Get metrics for multiple celebrities
 */
export async function getMetricsForMultiple(celebrityIds) {
  try {
    const placeholders = celebrityIds.map(() => '?').join(',');

    const results = await query(
      `SELECT celebrity_id, metric_type, metric_value
       FROM metrics_cache
       WHERE celebrity_id IN (${placeholders})
       AND calculated_date = CURDATE()
       ORDER BY celebrity_id, metric_type`,
      celebrityIds
    );

    const metricsById = {};
    results.forEach(r => {
      if (!metricsById[r.celebrity_id]) {
        metricsById[r.celebrity_id] = {};
      }
      metricsById[r.celebrity_id][r.metric_type] = r.metric_value;
    });

    return metricsById;
  } catch (error) {
    console.error('Error getting metrics for multiple celebrities:', error);
    throw error;
  }
}
