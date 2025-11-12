#!/bin/bash

# Database backup script for Taiwan Celebrity Tracker
# Creates timestamped backup files and manages retention policy

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
BACKUP_DIR="${BACKUP_DIR:-.}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
BACKUP_COMPRESSED="${BACKUP_FILE}.gz"

echo -e "${YELLOW}Taiwan Celebrity Tracker - Database Backup${NC}"
echo "=================================================="

# Check if MySQL is installed
if ! command -v mysqldump &> /dev/null; then
    echo -e "${RED}Error: mysqldump is not installed or not in PATH${NC}"
    exit 1
fi

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    echo -e "${GREEN}✓ Created backup directory: ${BACKUP_DIR}${NC}"
fi

echo -e "${YELLOW}Backing up database '${DB_NAME}'...${NC}"
echo "Backup file: ${BACKUP_COMPRESSED}"

# Create backup
mysqldump \
    -h "${DB_HOST}" \
    -u "${DB_USER}" \
    -p"${DB_PASSWORD}" \
    --single-transaction \
    --quick \
    --lock-tables=false \
    --routines \
    --triggers \
    "${DB_NAME}" | gzip > "${BACKUP_COMPRESSED}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup completed successfully${NC}"

    # Get backup file size
    BACKUP_SIZE=$(du -h "${BACKUP_COMPRESSED}" | cut -f1)
    echo -e "${GREEN}✓ Backup size: ${BACKUP_SIZE}${NC}"

    # Get backup file count
    BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "backup_*.sql.gz" 2>/dev/null | wc -l)
    echo -e "${YELLOW}Total backups: ${BACKUP_COUNT}${NC}"

    # Verify backup integrity (optional - enable with VERIFY_BACKUP=true)
    if [ "${VERIFY_BACKUP:-false}" = "true" ]; then
        echo ""
        echo -e "${YELLOW}Verifying backup integrity...${NC}"
        if gunzip -t "${BACKUP_COMPRESSED}" 2>/dev/null; then
            echo -e "${GREEN}✓ Backup integrity verified${NC}"
        else
            echo -e "${RED}⚠ Backup verification failed - file may be corrupted${NC}"
        fi
    fi
else
    echo -e "${RED}✗ Backup failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Cleaning up old backups (retention: ${RETENTION_DAYS} days)...${NC}"

# Remove backups older than retention period
find "${BACKUP_DIR}" -name "backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo -e "${GREEN}✓ Old backups cleaned up${NC}"

# List recent backups
echo ""
echo -e "${YELLOW}Recent backups:${NC}"
ls -lh "${BACKUP_DIR}"/backup_*.sql.gz 2>/dev/null | tail -5

echo ""
echo -e "${GREEN}=================================================="
echo "Backup completed successfully!"
echo "=================================================="
echo ""
echo -e "${YELLOW}Backup details:${NC}"
echo "  File: ${BACKUP_COMPRESSED}"
echo "  Size: ${BACKUP_SIZE}"
echo "  Date: $(date)"
echo ""
echo -e "${YELLOW}To restore this backup:${NC}"
echo "  gunzip -c ${BACKUP_COMPRESSED} | mysql -u ${DB_USER} -p ${DB_NAME}"
echo "  OR use: bash scripts/restore-db.sh ${BACKUP_COMPRESSED}"
echo ""
echo -e "${NC}"
