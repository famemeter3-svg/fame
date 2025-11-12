#!/bin/bash

# Database initialization script for Taiwan Celebrity Tracker
# This script creates the database and user with proper permissions

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

echo -e "${YELLOW}Taiwan Celebrity Tracker - Database Initialization${NC}"
echo "=================================================="

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}Error: MySQL is not installed or not in PATH${NC}"
    exit 1
fi

echo -e "${YELLOW}Creating database and user...${NC}"

# Create database and user (using TCP/IP to avoid socket issues)
mysql -h 127.0.0.1 -u root <<EOF
-- Drop existing database and user if they exist (optional)
-- DROP DATABASE IF EXISTS \`${DB_NAME}\`;
-- DROP USER IF EXISTS '${DB_USER}'@'${DB_HOST}';

-- Create database with UTF8MB4 charset
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER IF NOT EXISTS '${DB_USER}'@'${DB_HOST}' IDENTIFIED BY '${DB_PASSWORD}';

-- Grant privileges
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'${DB_HOST}';
FLUSH PRIVILEGES;

-- Verify
SELECT user, host FROM mysql.user WHERE user = '${DB_USER}';
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database and user created successfully${NC}"
else
    echo -e "${RED}✗ Failed to create database and user${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Applying schema...${NC}"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SCHEMA_FILE="${SCRIPT_DIR}/../schema.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}Error: schema.sql not found at ${SCHEMA_FILE}${NC}"
    exit 1
fi

# Apply schema (using TCP/IP)
mysql -h 127.0.0.1 -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" < "${SCHEMA_FILE}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Schema applied successfully${NC}"
else
    echo -e "${RED}✗ Failed to apply schema${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Verifying tables...${NC}"

# Verify tables were created (using TCP/IP)
mysql -h 127.0.0.1 -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" -e "SHOW TABLES;"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ All tables verified${NC}"
else
    echo -e "${RED}✗ Failed to verify tables${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Checking celebrities table structure...${NC}"
mysql -h 127.0.0.1 -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" -e "DESCRIBE celebrities;"

echo ""
echo -e "${GREEN}=================================================="
echo "Database initialization complete!"
echo "=================================================="
echo ""
echo -e "${YELLOW}Connection details:${NC}"
echo "  Host: ${DB_HOST}"
echo "  Database: ${DB_NAME}"
echo "  User: ${DB_USER}"
echo "  Password: ${DB_PASSWORD}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Seed 100 celebrities: cd backend && node scripts/seed-celebrities.js"
echo "  2. Test connection: mysql -u ${DB_USER} -p ${DB_NAME} -e 'SELECT COUNT(*) FROM celebrities;'"
echo ""
echo -e "${NC}"
