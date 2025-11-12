#!/bin/bash

# Slow Query Monitoring Script for Taiwan Celebrity Tracker
# Identifies and reports queries that exceed performance thresholds
# Run periodically to monitor database performance

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DB_NAME="taiwan_celebrities"
DB_USER="celeb_user"
DB_PASSWORD="${DB_PASSWORD:-secure_password_here}"
DB_HOST="localhost"
THRESHOLD_MS="${SLOW_QUERY_THRESHOLD:-2000}"  # milliseconds

echo -e "${BLUE}=================================="
echo "Slow Query Monitor"
echo "==================================${NC}"
echo ""
echo -e "${YELLOW}Database: ${DB_NAME}${NC}"
echo -e "${YELLOW}Slow Query Threshold: ${THRESHOLD_MS}ms${NC}"
echo ""

# Check if slow query log is enabled
echo -e "${YELLOW}Checking if slow query log is enabled...${NC}"
SLOW_LOG_STATUS=$(mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" \
    -N -e "SELECT @@slow_query_log;" 2>/dev/null)

if [ "$SLOW_LOG_STATUS" != "1" ]; then
    echo -e "${RED}⚠ Slow query log is NOT enabled${NC}"
    echo ""
    echo -e "${YELLOW}To enable slow query logging, run:${NC}"
    echo "  mysql -u root -p"
    echo "  SET GLOBAL slow_query_log = 'ON';"
    echo "  SET GLOBAL long_query_time = 2;"
    echo "  SET GLOBAL log_queries_not_using_indexes = 'ON';"
    echo ""
    echo -e "${YELLOW}Or add to /etc/mysql/my.cnf:${NC}"
    echo "  [mysqld]"
    echo "  slow_query_log = 1"
    echo "  long_query_time = 2"
    echo "  log-queries-not-using-indexes"
    echo ""
fi

# Get current slow query threshold
echo -e "${YELLOW}Current slow query threshold: ${THRESHOLD_MS}ms${NC}"
CURRENT_THRESHOLD=$(mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" \
    -N -e "SELECT @@long_query_time;" 2>/dev/null)
echo -e "${YELLOW}Database setting: ${CURRENT_THRESHOLD}s${NC}"

# Show recent slow queries
echo ""
echo -e "${BLUE}=================================="
echo "Recent Slow Queries"
echo "==================================${NC}"

mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" << 'EOF' 2>/dev/null
-- Find tables with most queries (from information_schema)
SELECT 'MOST ACCESSED TABLES' as analysis_type;
SELECT
    OBJECT_SCHEMA,
    OBJECT_NAME,
    COUNT_READ + COUNT_WRITE as total_accesses,
    COUNT_READ,
    COUNT_WRITE
FROM performance_schema.table_io_waits_summary_by_table
WHERE OBJECT_SCHEMA NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')
ORDER BY total_accesses DESC
LIMIT 5;

-- Find inefficient indexes
SELECT '' as separator;
SELECT 'UNUSED INDEXES' as analysis_type;
SELECT
    OBJECT_SCHEMA,
    OBJECT_NAME,
    INDEX_NAME
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE OBJECT_SCHEMA NOT IN ('information_schema', 'performance_schema', 'mysql', 'sys')
  AND INDEX_NAME != 'PRIMARY'
  AND COUNT_STAR = 0
  AND INDEX_NAME != 'idx_name'  -- Don't remove redundant idx_name yet
LIMIT 10;

-- Show table and index statistics
SELECT '' as separator;
SELECT 'TABLE SIZE ANALYSIS' as analysis_type;
SELECT
    TABLE_NAME,
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as 'Size(MB)',
    TABLE_ROWS,
    ROUND((INDEX_LENGTH / 1024 / 1024), 2) as 'Index(MB)'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'taiwan_celebrities'
ORDER BY DATA_LENGTH + INDEX_LENGTH DESC;
EOF

echo ""
echo -e "${BLUE}=================================="
echo "Performance Recommendations"
echo "==================================${NC}"
echo ""
echo -e "${YELLOW}Tips to improve query performance:${NC}"
echo "1. Ensure all indexes are being used:"
echo "   SELECT * FROM performance_schema.table_io_waits_summary_by_index_usage"
echo ""
echo "2. Check slow query log:"
echo "   tail -f /var/log/mysql/slow.log"
echo ""
echo "3. Optimize tables regularly:"
echo "   bash scripts/optimize-tables.sh"
echo ""
echo "4. Monitor table growth:"
echo "   bash scripts/check-table-growth.sh"
echo ""
echo -e "${NC}"
