#!/bin/bash

# Amani School System - Database Backup Script
# This script creates a backup of the PostgreSQL database

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/amani_backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Validate required environment variables
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL is not set${NC}"
    exit 1
fi

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\).*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\).*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Starting database backup...${NC}"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "User: $DB_USER"
echo "Backup file: $BACKUP_FILE"

# Create backup using pg_dump
export PGPASSWORD="$DB_PASSWORD"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --format=plain \
    --no-owner \
    --no-privileges \
    --verbose \
    > "$BACKUP_FILE" 2>&1

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Backup created successfully${NC}"
    
    # Compress the backup
    echo -e "${YELLOW}Compressing backup...${NC}"
    gzip "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Backup compressed successfully${NC}"
        echo "Compressed file: $COMPRESSED_FILE"
        
        # Get file size
        FILE_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
        echo "File size: $FILE_SIZE"
    else
        echo -e "${RED}Error compressing backup${NC}"
        exit 1
    fi
else
    echo -e "${RED}Error creating backup${NC}"
    exit 1
fi

# Clean up old backups
echo -e "${YELLOW}Cleaning up old backups (older than $RETENTION_DAYS days)...${NC}"
find "$BACKUP_DIR" -name "amani_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# Count remaining backups
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "amani_backup_*.sql.gz" -type f | wc -l)
echo -e "${GREEN}Cleanup complete. $BACKUP_COUNT backup(s) remaining.${NC}"

# List recent backups
echo -e "\n${YELLOW}Recent backups:${NC}"
ls -lh "$BACKUP_DIR"/amani_backup_*.sql.gz 2>/dev/null | tail -5

echo -e "\n${GREEN}Backup process completed successfully!${NC}"
