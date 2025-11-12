-- Taiwan Celebrity Tracker Database Migration
-- Version: 1.0 → 2.0 (Production-Hardened Schema)
-- Date: November 11, 2025
-- Description: Upgrade existing databases with enhanced data types, constraints, and indexes
--
-- IMPORTANT: Always backup your database before running this migration!
-- BACKUP COMMAND: mysqldump -u celeb_user -p taiwan_celebrities > backup_before_v2_migration.sql

-- ============================================================================
-- MIGRATION STEP 1: UPDATE celebrities TABLE
-- ============================================================================

-- Add new columns for extensibility
ALTER TABLE celebrities
ADD COLUMN last_scraped DATETIME DEFAULT NULL AFTER status,
ADD COLUMN metadata JSON DEFAULT NULL AFTER last_scraped;

-- Make name_english NOT NULL
ALTER TABLE celebrities
MODIFY name_english VARCHAR(255) NOT NULL;

-- Make category NOT NULL with default
ALTER TABLE celebrities
MODIFY category VARCHAR(100) NOT NULL DEFAULT 'Other';

-- Add new composite index for filtering
ALTER TABLE celebrities
ADD INDEX idx_status_category (status, category);

-- Add index for last_scraped tracking
ALTER TABLE celebrities
ADD INDEX idx_last_scraped (last_scraped);

-- Remove redundant idx_name (UNIQUE constraint already provides index)
-- Note: This step is optional if you want to keep backward compatibility
-- ALTER TABLE celebrities DROP INDEX idx_name;

-- ============================================================================
-- MIGRATION STEP 2: UPDATE celebrity_mentions TABLE
-- ============================================================================

-- Fix FLOAT to DECIMAL for sentiment_score
ALTER TABLE celebrity_mentions
MODIFY sentiment_score DECIMAL(3,2) NOT NULL DEFAULT 0;

-- Fix FLOAT to DECIMAL for extraction_confidence
ALTER TABLE celebrity_mentions
MODIFY extraction_confidence DECIMAL(3,2) NOT NULL DEFAULT 1.00;

-- Improve time_stamp precision
ALTER TABLE celebrity_mentions
MODIFY time_stamp DATETIME(6) NOT NULL;

-- Make original_url NOT NULL (every mention must have source)
ALTER TABLE celebrity_mentions
MODIFY original_url TEXT NOT NULL;

-- Make domain NOT NULL with default
ALTER TABLE celebrity_mentions
MODIFY domain VARCHAR(255) NOT NULL DEFAULT 'unknown';

-- Make content_category NOT NULL with default
ALTER TABLE celebrity_mentions
MODIFY content_category VARCHAR(100) NOT NULL DEFAULT 'uncategorized';

-- Make processing_time_ms NOT NULL with default
ALTER TABLE celebrity_mentions
MODIFY processing_time_ms INT UNSIGNED NOT NULL DEFAULT 0;

-- Make content_length NOT NULL with default
ALTER TABLE celebrity_mentions
MODIFY content_length INT UNSIGNED NOT NULL DEFAULT 0;

-- Fix extracted_at to have default
ALTER TABLE celebrity_mentions
MODIFY extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add index on extraction_confidence for quality filtering
ALTER TABLE celebrity_mentions
ADD INDEX idx_confidence (extraction_confidence);

-- Add CHECK constraints for data validation
ALTER TABLE celebrity_mentions
ADD CONSTRAINT chk_sentiment_range
  CHECK (sentiment_score >= -1.0 AND sentiment_score <= 1.0),
ADD CONSTRAINT chk_confidence_range
  CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1.0);

-- ============================================================================
-- MIGRATION STEP 3: UPDATE metrics_cache TABLE
-- ============================================================================

-- Fix FLOAT to DECIMAL for metric_value
ALTER TABLE metrics_cache
MODIFY metric_value DECIMAL(10,4) NOT NULL;

-- Make calculation_period_days NOT NULL
ALTER TABLE metrics_cache
MODIFY calculation_period_days INT UNSIGNED NOT NULL DEFAULT 30;

-- Add composite index for metric type queries
ALTER TABLE metrics_cache
ADD INDEX idx_metric_type_date (metric_type, calculated_date);

-- Add CHECK constraint for positive metrics
ALTER TABLE metrics_cache
ADD CONSTRAINT chk_metric_positive CHECK (metric_value >= 0);

-- ============================================================================
-- MIGRATION STEP 4: UPDATE scraping_jobs TABLE
-- ============================================================================

-- Add new columns for performance tracking
ALTER TABLE scraping_jobs
ADD COLUMN avg_sentiment DECIMAL(3,2) DEFAULT NULL AFTER urls_failed,
ADD COLUMN duration_seconds INT UNSIGNED DEFAULT NULL AFTER avg_sentiment,
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER duration_seconds;

-- Make job_type NOT NULL
ALTER TABLE scraping_jobs
MODIFY job_type ENUM('single', 'batch') NOT NULL DEFAULT 'single';

-- Make start_time NOT NULL
ALTER TABLE scraping_jobs
MODIFY start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Make status NOT NULL
ALTER TABLE scraping_jobs
MODIFY status ENUM('pending', 'running', 'completed', 'failed') NOT NULL DEFAULT 'pending';

-- Make mentions_found NOT NULL
ALTER TABLE scraping_jobs
MODIFY mentions_found INT UNSIGNED NOT NULL DEFAULT 0;

-- Make urls_processed NOT NULL
ALTER TABLE scraping_jobs
MODIFY urls_processed INT UNSIGNED NOT NULL DEFAULT 0;

-- Make urls_failed NOT NULL
ALTER TABLE scraping_jobs
MODIFY urls_failed INT UNSIGNED NOT NULL DEFAULT 0;

-- Make error_message explicitly nullable
ALTER TABLE scraping_jobs
MODIFY error_message TEXT DEFAULT NULL;

-- Add index on end_time for timing analysis
ALTER TABLE scraping_jobs
ADD INDEX idx_end_time (end_time);

-- Add index on job_type for batch analysis
ALTER TABLE scraping_jobs
ADD INDEX idx_job_type (job_type);

-- Add CHECK constraints for data validation
ALTER TABLE scraping_jobs
ADD CONSTRAINT chk_job_sentiment
  CHECK (avg_sentiment IS NULL OR (avg_sentiment >= -1.0 AND avg_sentiment <= 1.0)),
ADD CONSTRAINT chk_job_duration
  CHECK (duration_seconds IS NULL OR duration_seconds >= 0);

-- ============================================================================
-- MIGRATION STEP 5: VERIFICATION & CLEANUP
-- ============================================================================

-- Verify all tables were updated successfully
SELECT 'celebrities' as table_name, COUNT(*) as row_count FROM celebrities
UNION ALL
SELECT 'celebrity_mentions', COUNT(*) FROM celebrity_mentions
UNION ALL
SELECT 'metrics_cache', COUNT(*) FROM metrics_cache
UNION ALL
SELECT 'scraping_jobs', COUNT(*) FROM scraping_jobs;

-- Show table structure after migration
-- Uncomment to verify (requires client support)
-- SHOW CREATE TABLE celebrities;
-- SHOW CREATE TABLE celebrity_mentions;
-- SHOW CREATE TABLE metrics_cache;
-- SHOW CREATE TABLE scraping_jobs;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
-- 1. ✓ celebrities: Added last_scraped, metadata, improved indexes
-- 2. ✓ celebrity_mentions: Fixed FLOAT→DECIMAL, added NOT NULL, added constraints
-- 3. ✓ metrics_cache: Fixed FLOAT→DECIMAL, added constraints
-- 4. ✓ scraping_jobs: Added avg_sentiment, duration_seconds, improved NOT NULL
-- 5. ✓ All tables: Added or improved CHECK constraints
--
-- Post-Migration Tasks:
-- 1. Verify row counts match before migration
-- 2. Test application thoroughly
-- 3. Run: OPTIMIZE TABLE celebrities, celebrity_mentions, metrics_cache, scraping_jobs;
-- 4. Update application code to use new DECIMAL precision (if needed)
-- 5. Backup the migrated database
-- ============================================================================
