#!/bin/bash

# Enterprise Reporting Engine - Docker Build & Test Script
# This script verifies that the Docker build configuration works correctly

set -e

PROJECT_ROOT="/Users/ajaysingh33/Documents/APIM-Portal-Solution/report-generation"
cd "$PROJECT_ROOT"

echo "=========================================="
echo "Enterprise Reporting Engine"
echo "Docker Build Verification Script"
echo "=========================================="
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    echo "Please install Docker Desktop and try again"
    exit 1
fi

echo "✓ Docker found: $(docker --version)"
echo ""

# Check if Docker daemon is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker daemon is not running"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

echo "✓ Docker daemon is running"
echo ""

# Display current configuration
echo "=========================================="
echo "Build Configuration"
echo "=========================================="
echo ""
echo "Project Root: $PROJECT_ROOT"
echo "Dockerfile: Dockerfile (multi-stage build)"
echo "Docker Compose: docker-compose.yml"
echo ""
echo "Services to build:"
echo "  - backend (target: backend-runtime)"
echo "  - frontend (target: frontend-runtime)"
echo "  - postgres (image: postgres:15-alpine)"
echo "  - redis (image: redis:7-alpine)"
echo "  - rabbitmq (image: rabbitmq:3.12-management-alpine)"
echo ""

# Ask for confirmation
echo "=========================================="
read -p "Continue with Docker build? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted"
    exit 1
fi

echo ""
echo "=========================================="
echo "Step 1: Clean Up"
echo "=========================================="
echo ""

# Stop and remove existing containers
echo "Stopping existing containers..."
docker-compose down 2>/dev/null || true
echo "✓ Containers stopped"
echo ""

# Optional: Remove images
echo "Removing old images (optional)..."
docker rmi reporting-engine:latest 2>/dev/null || true
echo "✓ Old images removed"
echo ""

echo "=========================================="
echo "Step 2: Build Images"
echo "=========================================="
echo ""

echo "Building Docker images (this may take 5-10 minutes)..."
echo ""

# Build with detailed output
docker-compose build 2>&1 | tee build.log

BUILD_STATUS=${PIPESTATUS[0]}

echo ""
if [ $BUILD_STATUS -eq 0 ]; then
    echo "✓ Build successful!"
else
    echo "❌ Build failed!"
    echo ""
    echo "Build log saved to: build.log"
    echo ""
    echo "Common issues:"
    echo "1. Insufficient disk space: docker system prune -a"
    echo "2. npm dependency issues: check npm-debug.log"
    echo "3. TypeScript errors: check build output above"
    exit 1
fi

echo ""
echo "=========================================="
echo "Step 3: Start Services"
echo "=========================================="
echo ""

echo "Starting services..."
docker-compose up -d

echo ""
echo "Waiting for services to be ready (30 seconds)..."
sleep 30

echo ""
echo "=========================================="
echo "Step 4: Verify Services"
echo "=========================================="
echo ""

# Function to check if service is healthy
check_service() {
    local name=$1
    local port=$2
    local endpoint=$3
    
    echo -n "Checking $name... "
    if curl -s "http://localhost:$port$endpoint" > /dev/null 2>&1; then
        echo "✓ OK (http://localhost:$port$endpoint)"
        return 0
    else
        echo "❌ FAILED"
        return 1
    fi
}

echo "Service Health Check:"
echo ""

BACKEND_OK=0
FRONTEND_OK=0
DB_OK=0

check_service "Backend" 8080 "/health" && BACKEND_OK=1 || true
check_service "Frontend" 3000 "/" && FRONTEND_OK=1 || true

# Check database
echo -n "Checking PostgreSQL... "
if docker-compose exec -T postgres pg_isready -U reportuser > /dev/null 2>&1; then
    echo "✓ OK"
    DB_OK=1
else
    echo "❌ FAILED (might need more time to start)"
fi

echo ""
echo "=========================================="
echo "Step 5: View Logs"
echo "=========================================="
echo ""

echo "To view container logs, use:"
echo ""
echo "  Backend logs:"
echo "    docker-compose logs -f backend"
echo ""
echo "  Frontend logs:"
echo "    docker-compose logs -f frontend"
echo ""
echo "  Database logs:"
echo "    docker-compose logs -f postgres"
echo ""
echo "  All logs:"
echo "    docker-compose logs -f"
echo ""

echo "=========================================="
echo "Build Complete!"
echo "=========================================="
echo ""

if [ $BACKEND_OK -eq 1 ] && [ $FRONTEND_OK -eq 1 ] && [ $DB_OK -eq 1 ]; then
    echo "✓ All services are running!"
    echo ""
    echo "Access the application:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:8080"
    echo "  Database (Adminer): http://localhost:8081"
    echo "  Database (pgAdmin): http://localhost:5050"
    echo "  RabbitMQ: http://localhost:15672 (guest/guest)"
    echo ""
else
    echo "⚠ Some services may still be starting..."
    echo "Check logs to verify all services are healthy"
    echo ""
fi

echo "To stop services: docker-compose down"
echo "To remove volumes:  docker-compose down -v"
echo ""
