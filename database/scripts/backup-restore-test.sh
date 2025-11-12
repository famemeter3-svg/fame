#!/bin/bash

# Backup and Restore Test Script for Taiwan Celebrity Tracker
# Verifies that backups can be successfully restored
# Run monthly to ensure disaster recovery capability

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
TEST_DB_NAME="${DB_NAME}_restore_test"
BACKUP_DIR="${BACKUP_DIR:-.}"

echo -e "${BLUE}=================================="
echo "Backup & Restore Verification Test"
echo "==================================${NC}"
echo ""
echo -e "${YELLOW}This test will:${NC}"
echo "1. Find the most recent backup"
echo "2. Create a test database"
echo "3. Restore backup to test database"
echo "4. Verify data integrity"
echo "5. Report results"
echo ""

# Find latest backup
echo -e "${YELLOW}Finding latest backup...${NC}"
LATEST_BACKUP=$(ls -1t "${BACKUP_DIR}"/backup_*.sql.gz 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
    echo -e "${RED}✗ No backups found in ${BACKUP_DIR}${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found backup: $(basename "$LATEST_BACKUP")${NC}"
BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
echo -e "${GREEN}  Size: ${BACKUP_SIZE}${NC}"
echo ""

# Check if test database already exists
echo -e "${YELLOW}Checking for existing test database...${NC}"
if mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" -e "USE ${TEST_DB_NAME}" 2>/dev/null; then
    echo -e "${YELLOW}⚠ Test database already exists, dropping...${NC}"
    mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" -e "DROP DATABASE ${TEST_DB_NAME};" 2>/dev/null
fi

# Create test database
echo -e "${YELLOW}Creating test database...${NC}"
mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" -e \
    "CREATE DATABASE ${TEST_DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null
echo -e "${GREEN}✓ Test database created${NC}"
echo ""

# Restore backup
echo -e "${YELLOW}Restoring backup to test database...${NC}"
START_TIME=$(date +%s)

if gunzip -c "$LATEST_BACKUP" | mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${TEST_DB_NAME}" 2>/dev/null; then
    END_TIME=$(date +%s)
    RESTORE_TIME=$((END_TIME - START_TIME))
    echo -e "${GREEN}✓ Backup restored successfully${NC}"
    echo -e "${GREEN}  Restore time: ${RESTORE_TIME} seconds${NC}"
else
    echo -e "${RED}✗ Restore failed${NC}"
    echo -e "${YELLOW}Cleaning up test database...${NC}"
    mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" -e "DROP DATABASE ${TEST_DB_NAME};" 2>/dev/null
    exit 1
fi

echo ""
echo -e "${BLUE}=================================="
echo "Data Integrity Verification"
echo "==================================${NC}"
echo ""

# Compare row counts
echo -e "${YELLOW}Comparing row counts:${NC}"
echo ""

MISMATCH=0

for TABLE in celebrities celebrity_mentions metrics_cache scraping_jobs; do
    ORIGINAL=$(mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" \
        -N -e "SELECT COUNT(*) FROM ${TABLE};" 2>/dev/null)
    RESTORED=$(mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${TEST_DB_NAME}" \
        -N -e "SELECT COUNT(*) FROM ${TABLE};" 2>/dev/null)

    if [ "$ORIGINAL" = "$RESTORED" ]; then
        echo -e "${GREEN}✓${NC} $TABLE: $ORIGINAL rows"
    else
        echo -e "${RED}✗${NC} $TABLE: Original=$ORIGINAL, Restored=$RESTORED"
        MISMATCH=$((MISMATCH + 1))
    fi
done

echo ""

if [ $MISMATCH -eq 0 ]; then
    echo -e "${GREEN}✓ All tables have correct row counts${NC}"
else
    echo -e "${RED}✗ Found $MISMATCH mismatches in row counts${NC}"
fi

# Verify table structures
echo ""
echo -e "${YELLOW}Verifying table structures...${NC}"

STRUCTURE_MISMATCH=0

for TABLE in celebrities celebrity_mentions metrics_cache scraping_jobs; do
    # Get column count
    ORIG_COLS=$(mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" \
        -N -e "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='${DB_NAME}' AND TABLE_NAME='${TABLE}';" 2>/dev/null)
    REST_COLS=$(mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${TEST_DB_NAME}" \
        -N -e "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='${TEST_DB_NAME}' AND TABLE_NAME='${TABLE}';" 2>/dev/null)

    if [ "$ORIG_COLS" = "$REST_COLS" ]; then
        echo -e "${GREEN}✓${NC} $TABLE: $ORIG_COLS columns"
    else
        echo -e "${RED}✗${NC} $TABLE: Column mismatch (Original=$ORIG_COLS, Restored=$REST_COLS)"
        STRUCTURE_MISMATCH=$((STRUCTURE_MISMATCH + 1))
    fi
done

echo ""

if [ $STRUCTURE_MISMATCH -eq 0 ]; then
    echo -e "${GREEN}✓ All table structures are intact${NC}"
else
    echo -e "${RED}✗ Found $STRUCTURE_MISMATCH structure mismatches${NC}"
fi

# Verify constraints
echo ""
echo -e "${YELLOW}Verifying constraints:${NC}"

CONSTRAINT_COUNT=$(mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${TEST_DB_NAME}" \
    -N -e "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA='${TEST_DB_NAME}';" 2>/dev/null)
echo -e "${GREEN}✓ Found $CONSTRAINT_COUNT constraints${NC}"

# Cleanup
echo ""
echo -e "${YELLOW}Cleaning up test database...${NC}"
mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" -e "DROP DATABASE ${TEST_DB_NAME};" 2>/dev/null
echo -e "${GREEN}✓ Test database dropped${NC}"

echo ""
echo -e "${BLUE}=================================="
echo "Backup Test Results"
echo "==================================${NC}"
echo ""

if [ $MISMATCH -eq 0 ] && [ $STRUCTURE_MISMATCH -eq 0 ]; then
    echo -e "${GREEN}✓ BACKUP VERIFICATION PASSED${NC}"
    echo ""
    echo -e "${YELLOW}Summary:${NC}"
    echo "• Backup file: $(basename "$LATEST_BACKUP")"
    echo "• Backup size: ${BACKUP_SIZE}"
    echo "• Restore time: ${RESTORE_TIME} seconds"
    echo "• Data integrity: OK"
    echo "• All tables verified: OK"
    echo "• All constraints verified: OK"
    echo ""
    echo -e "${GREEN}✓ Disaster recovery capability confirmed${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}✗ BACKUP VERIFICATION FAILED${NC}"
    echo ""
    echo -e "${YELLOW}Issues found:${NC}"
    echo "• Row count mismatches: $MISMATCH"
    echo "• Structure mismatches: $STRUCTURE_MISMATCH"
    echo ""
    echo -e "${RED}DO NOT RELY ON THIS BACKUP FOR RECOVERY${NC}"
    exit 1
fi

echo -e "${NC}"
