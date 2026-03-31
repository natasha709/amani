#!/bin/bash

# Amani School System - Deployment Script
# This script deploys the application to production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
DEPLOY_DIR="/opt/amani"
BACKUP_DIR="${DEPLOY_DIR}/backups"
LOG_FILE="${DEPLOY_DIR}/logs/deploy.log"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Log function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "This script must be run as root"
    exit 1
fi

log "Starting deployment to ${ENVIRONMENT} environment..."

# Check prerequisites
log "Checking prerequisites..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
fi

log_success "All prerequisites are met"

# Create deployment directory
log "Creating deployment directory..."
mkdir -p "$DEPLOY_DIR"
mkdir -p "$BACKUP_DIR"

# Backup current deployment
if [ -d "${DEPLOY_DIR}/current" ]; then
    log "Backing up current deployment..."
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
    cp -r "${DEPLOY_DIR}/current" "${BACKUP_DIR}/${BACKUP_NAME}"
    log_success "Backup created: ${BACKUP_NAME}"
fi

# Pull latest code
log "Pulling latest code from repository..."
cd "$DEPLOY_DIR"
if [ -d "current" ]; then
    cd current
    git pull origin main
else
    git clone https://github.com/natasha709/amani.git current
    cd current
fi
log_success "Code updated successfully"

# Install dependencies
log "Installing dependencies..."
npm ci
cd backend && npm ci
cd ../frontend && npm ci
cd ..
log_success "Dependencies installed"

# Build backend
log "Building backend..."
cd backend
npm run build
cd ..
log_success "Backend built successfully"

# Build frontend
log "Building frontend..."
cd frontend
npm run build
cd ..
log_success "Frontend built successfully"

# Run database migrations
log "Running database migrations..."
cd backend
npx prisma migrate deploy
cd ..
log_success "Database migrations completed"

# Generate Prisma client
log "Generating Prisma client..."
cd backend
npx prisma generate
cd ..
log_success "Prisma client generated"

# Stop existing containers
log "Stopping existing containers..."
docker-compose down
log_success "Containers stopped"

# Start new containers
log "Starting new containers..."
docker-compose up -d
log_success "Containers started"

# Wait for services to be healthy
log "Waiting for services to be healthy..."
sleep 10

# Check if backend is healthy
log "Checking backend health..."
for i in {1..30}; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "Backend is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "Backend health check failed"
        exit 1
    fi
    sleep 2
done

# Check if frontend is healthy
log "Checking frontend health..."
for i in {1..30}; do
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_success "Frontend is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "Frontend health check failed"
        exit 1
    fi
    sleep 2
done

# Clean up old backups (keep last 5)
log "Cleaning up old backups..."
cd "$BACKUP_DIR"
ls -t | tail -n +6 | xargs -r rm -rf
log_success "Old backups cleaned up"

# Display deployment summary
log_success "Deployment completed successfully!"
echo ""
echo "=========================================="
echo "Deployment Summary"
echo "=========================================="
echo "Environment: ${ENVIRONMENT}"
echo "Deploy Directory: ${DEPLOY_DIR}"
echo "Backend URL: http://localhost:3000"
echo "Frontend URL: http://localhost:3001"
echo "API Documentation: http://localhost:3000/api/v1"
echo "Health Check: http://localhost:3000/api/health"
echo "=========================================="
echo ""

# Show running containers
log "Running containers:"
docker-compose ps
