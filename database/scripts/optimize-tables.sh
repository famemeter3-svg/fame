#!/bin/bash

# Table Optimization Script for Taiwan Celebrity Tracker
# Defragments tables and reclaims disk space from deleted records

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

echo -e "${BLUE}=================================="
echo "Database Optimization Tool"
echo "==================================${NC}"
echo ""
echo -e "${YELLOW}Database: ${DB_NAME}${NC}"
echo ""

# Show current table statistics
echo -e "${YELLOW}Gathering current table statistics...${NC}"
echo ""

echo -e "${BLUE}BEFORE OPTIMIZATION:${NC}"
mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" << 'EOF' 2>/dev/null
SELECT
    TABLE_NAME,
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as 'Size(MB)',
    TABLE_ROWS as 'Rows',
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / TABLE_ROWS), 2) as 'Bytes/Row'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'taiwan_celebrities'
ORDER BY DATA_LENGTH + INDEX_LENGTH DESC;
EOF

echo ""
echo -e "${YELLOW}Optimizing tables (this may take a few minutes)...${NC}"
echo ""

# Optimize each table
for TABLE in celebrities celebrity_mentions metrics_cache scraping_jobs; do
    echo -e "${YELLOW}Optimizing ${TABLE}...${NC}"
    mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" \
        -e "OPTIMIZE TABLE ${TABLE};" 2>/dev/null | grep -E "OK|Table does not support"
done

echo ""
echo -e "${GREEN}✓ Optimization complete${NC}"
echo ""

echo -e "${BLUE}AFTER OPTIMIZATION:${NC}"
mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" << 'EOF' 2>/dev/null
SELECT
    TABLE_NAME,
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as 'Size(MB)',
    TABLE_ROWS as 'Rows',
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / TABLE_ROWS), 2) as 'Bytes/Row'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'taiwan_celebrities'
ORDER BY DATA_LENGTH + INDEX_LENGTH DESC;
EOF

echo ""
echo -e "${YELLOW}Optimization Summary:${NC}"
echo "• Reclaimed fragmented space"
echo "• Updated table statistics"
echo "• Optimized index performance"
echo "• Improved query execution"
echo ""

echo -e "${YELLOW}Scheduling regular optimization:${NC}"
echo "Add to crontab for weekly optimization:"
echo "  0 3 * * 0 bash /path/to/database/scripts/optimize-tables.sh"
echo ""

echo -e "${YELLOW}Alternative: Use InnoDB table compression (for new tables):${NC}"
echo "  ALTER TABLE celebrities ROW_FORMAT=COMPRESSED;"
echo "  ALTER TABLE celebrity_mentions ROW_FORMAT=COMPRESSED;"
echo "  ALTER TABLE metrics_cache ROW_FORMAT=COMPRESSED;"
echo "  ALTER TABLE scraping_jobs ROW_FORMAT=COMPRESSED;"
echo ""

echo -e "${NC}"
