#!/bin/bash

# Database restore script for Taiwan Celebrity Tracker
# Restores database from backup files (SQL or compressed)

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="taiwan_celebrities"
DB_USER="celeb_user"
DB_PASSWORD="${DB_PASSWORD:-secure_password_here}"
DB_HOST="localhost"

echo -e "${YELLOW}Taiwan Celebrity Tracker - Database Restore${NC}"
echo "=================================================="

# Check arguments
if [ $# -lt 1 ]; then
    echo -e "${RED}Usage: $0 <backup_file>${NC}"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  bash restore-db.sh backup_20240101_120000.sql"
    echo "  bash restore-db.sh backup_20240101_120000.sql.gz"
    echo ""
    echo -e "${YELLOW}Available backups:${NC}"
    ls -lh ./backup_*.sql* 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_FILE="$1"
BACKUP_DIR=$(dirname "$BACKUP_FILE")

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

echo -e "${YELLOW}Restore configuration:${NC}"
echo "  Database: ${DB_NAME}"
echo "  User: ${DB_USER}"
echo "  Backup file: ${BACKUP_FILE}"
echo "  Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"

echo ""
echo -e "${YELLOW}WARNING: This will overwrite the current database!${NC}"
echo -e "${RED}All existing data in '${DB_NAME}' will be lost.${NC}"
echo ""
read -p "Do you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}Restore cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Creating backup of current database before restore...${NC}"

# Create emergency backup of current database
EMERGENCY_BACKUP="./backup_before_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
mysqldump \
    -h "${DB_HOST}" \
    -u "${DB_USER}" \
    -p"${DB_PASSWORD}" \
    --single-transaction \
    --quick \
    --lock-tables=false \
    "${DB_NAME}" | gzip > "${EMERGENCY_BACKUP}" 2>/dev/null || true

if [ -f "$EMERGENCY_BACKUP" ]; then
    echo -e "${GREEN}✓ Emergency backup created: ${EMERGENCY_BACKUP}${NC}"
fi

echo ""
echo -e "${YELLOW}Restoring database...${NC}"

# Determine if file is compressed based on extension
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Restoring from compressed backup..."
    gunzip -c "$BACKUP_FILE" | mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}"
else
    echo "Restoring from uncompressed backup..."
    mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" < "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database restored successfully${NC}"
else
    echo -e "${RED}✗ Restore failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Verifying restored data...${NC}"

# Verify restore
CELEB_COUNT=$(mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" -N -e "SELECT COUNT(*) FROM celebrities;")
MENTION_COUNT=$(mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" -N -e "SELECT COUNT(*) FROM celebrity_mentions;")
METRICS_COUNT=$(mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" -N -e "SELECT COUNT(*) FROM metrics_cache;")
JOBS_COUNT=$(mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" -N -e "SELECT COUNT(*) FROM scraping_jobs;")

echo -e "${GREEN}✓ Celebrities: ${CELEB_COUNT}${NC}"
echo -e "${GREEN}✓ Mentions: ${MENTION_COUNT}${NC}"
echo -e "${GREEN}✓ Metrics: ${METRICS_COUNT}${NC}"
echo -e "${GREEN}✓ Jobs: ${JOBS_COUNT}${NC}"

echo ""
echo -e "${GREEN}=================================================="
echo "Restore completed successfully!"
echo "=================================================="
echo ""
echo -e "${YELLOW}Restored data statistics:${NC}"
echo "  Celebrities: ${CELEB_COUNT}"
echo "  Mentions: ${MENTION_COUNT}"
echo "  Metrics: ${METRICS_COUNT}"
echo "  Jobs: ${JOBS_COUNT}"
echo ""
echo -e "${YELLOW}Emergency backup location:${NC}"
echo "  ${EMERGENCY_BACKUP}"
echo ""
echo -e "${NC}"
