#!/bin/bash

# Table Growth Monitor for Taiwan Celebrity Tracker
# Tracks database and table sizes, alerts if growth exceeds thresholds

set -e

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
ALERT_THRESHOLD_MB="${DB_SIZE_ALERT_THRESHOLD:-500}"  # Alert when DB > 500MB

echo -e "${BLUE}=================================="
echo "Table Growth Monitor"
echo "==================================${NC}"
echo ""
echo -e "${YELLOW}Database: ${DB_NAME}${NC}"
echo -e "${YELLOW}Alert Threshold: ${ALERT_THRESHOLD_MB}MB${NC}"
echo ""

# Get database size
echo -e "${YELLOW}Calculating database size...${NC}"
DB_SIZE=$(mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" -N -e "
SELECT ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2)
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = '${DB_NAME}';" 2>/dev/null)

echo -e "${BLUE}=================================="
echo "Database Summary"
echo "==================================${NC}"
echo -e "Total Size: ${YELLOW}${DB_SIZE} MB${NC}"

# Check if size exceeds threshold
if (( $(echo "$DB_SIZE > $ALERT_THRESHOLD_MB" | bc -l) )); then
    echo -e "${RED}⚠ WARNING: Database size exceeds ${ALERT_THRESHOLD_MB}MB threshold!${NC}"
else
    echo -e "${GREEN}✓ Database size within acceptable limits${NC}"
fi

echo ""
echo -e "${BLUE}=================================="
echo "Table Sizes"
echo "==================================${NC}"

mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" << 'EOF' 2>/dev/null
SELECT
    TABLE_NAME,
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as 'Size(MB)',
    ROUND((DATA_LENGTH / 1024 / 1024), 2) as 'Data(MB)',
    ROUND((INDEX_LENGTH / 1024 / 1024), 2) as 'Index(MB)',
    TABLE_ROWS as 'Rows',
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / TABLE_ROWS), 2) as 'Bytes/Row'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'taiwan_celebrities'
ORDER BY DATA_LENGTH + INDEX_LENGTH DESC;
EOF

echo ""
echo -e "${BLUE}=================================="
echo "Growth Analysis"
echo "==================================${NC}"
echo ""

# Calculate estimated growth
echo -e "${YELLOW}Growth Rate Estimates:${NC}"

mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" << 'EOF' 2>/dev/null
SELECT
    TABLE_NAME,
    TABLE_ROWS as 'Current Rows',
    CONCAT(
        'At current rate: ',
        CASE
            WHEN TABLE_ROWS > 0 THEN CONCAT(
                ROUND(TABLE_ROWS / 100 * 10),
                ' rows/month (~',
                ROUND((TABLE_ROWS / 100 * 10 * 12) / 1000),
                'k/year)'
            )
            ELSE '0 rows'
        END
    ) as 'Estimated Growth'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'taiwan_celebrities'
  AND TABLE_ROWS > 0
ORDER BY TABLE_ROWS DESC;
EOF

echo ""
echo -e "${BLUE}=================================="
echo "Storage Projections"
echo "==================================${NC}"
echo ""
echo -e "${YELLOW}If current row counts grow 10x:${NC}"

mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" << 'EOF' 2>/dev/null
SELECT
    TABLE_NAME,
    TABLE_ROWS as 'Current Rows',
    ROUND(TABLE_ROWS * 10) as 'Projected (10x)',
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024) * 10, 2) as 'Projected Size(MB)'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'taiwan_celebrities'
ORDER BY DATA_LENGTH + INDEX_LENGTH DESC;
EOF

echo ""
echo -e "${BLUE}=================================="
echo "Recommendations"
echo "==================================${NC}"
echo ""

if [ "${DB_SIZE%.*}" -gt "100" ]; then
    echo -e "${YELLOW}Current database is ${DB_SIZE}MB. Consider:${NC}"
    echo "1. Archive mentions older than 1 year"
    echo "2. Implement table partitioning by date"
    echo "3. Set up automated archival process"
fi

if [ "${DB_SIZE%.*}" -gt "500" ]; then
    echo -e "${RED}Database is large (${DB_SIZE}MB). Recommend:${NC}"
    echo "1. Implement partitioning immediately"
    echo "2. Archive old data to separate storage"
    echo "3. Consider read replicas for analytics"
fi

echo ""
echo -e "${YELLOW}Archival Strategy:${NC}"
echo "To archive old mentions (> 1 year):"
echo "  mysql -u ${DB_USER} -p ${DB_NAME} << 'ARCHIVESQL'"
echo "  CREATE TABLE celebrity_mentions_archive LIKE celebrity_mentions;"
echo "  INSERT INTO celebrity_mentions_archive"
echo "  SELECT * FROM celebrity_mentions"
echo "  WHERE time_stamp < DATE_SUB(NOW(), INTERVAL 1 YEAR);"
echo "  DELETE FROM celebrity_mentions"
echo "  WHERE time_stamp < DATE_SUB(NOW(), INTERVAL 1 YEAR);"
echo "  ARCHIVESQL"
echo ""

echo -e "${YELLOW}To schedule daily growth checks:${NC}"
echo "Add to crontab:"
echo "  0 2 * * * bash /path/to/database/scripts/check-table-growth.sh >> /var/log/table-growth.log"
echo ""
echo -e "${NC}"
