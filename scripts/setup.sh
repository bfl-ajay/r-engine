#!/bin/bash

# Reporting Engine Development Environment Setup Script
# This script automates the setup of the development environment

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Reporting Engine - Development Environment Setup             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_step() {
    echo -e "${GREEN}▶${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 20+"
        exit 1
    fi
    NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        print_error "Node.js 20+ is required. Current version: $(node -v)"
        exit 1
    fi
    print_success "Node.js $(node -v) found"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed. Some features may not work."
    else
        print_success "Docker $(docker --version | awk '{print $3}') found"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        if ! docker compose version &> /dev/null; then
            print_warning "Docker Compose is not installed. Please install Docker Compose."
        else
            print_success "Docker Compose found"
        fi
    else
        print_success "Docker Compose found"
    fi
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    print_success "Git $(git --version | awk '{print $3}') found"
}

# Setup environment
setup_environment() {
    print_step "Setting up environment..."
    
    if [ -f .env ]; then
        print_warning ".env file already exists"
    else
        cp .env.example .env
        print_success ".env file created from template"
    fi
}

# Install dependencies
install_dependencies() {
    print_step "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
}

# Build Docker images
build_docker() {
    print_step "Building Docker images..."
    docker-compose build
    print_success "Docker images built"
}

# Start services
start_services() {
    print_step "Starting services..."
    docker-compose up -d
    
    # Wait for services to be healthy
    print_step "Waiting for services to be ready..."
    sleep 10
    
    # Check if PostgreSQL is ready
    if docker-compose exec -T postgres pg_isready -U reportuser &> /dev/null; then
        print_success "PostgreSQL is ready"
    else
        print_warning "PostgreSQL may still be starting..."
    fi
}

# Run migrations
run_migrations() {
    print_step "Running database migrations..."
    npm run db:migrate
    print_success "Database migrations completed"
}

# Seed database
seed_database() {
    print_step "Seeding database with sample data..."
    npm run db:seed
    print_success "Database seeded"
}

# Main execution
main() {
    check_prerequisites
    setup_environment
    install_dependencies
    
    read -p "Do you want to start Docker services? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        build_docker
        start_services
        run_migrations
        
        read -p "Do you want to seed the database? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            seed_database
        fi
    fi
    
    print_success "Setup completed!"
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║  Next Steps:                                                   ║"
    echo "║  1. Start development: make dev                               ║"
    echo "║  2. Frontend:          http://localhost:3000                  ║"
    echo "║  3. Backend:           http://localhost:8080                  ║"
    echo "║  4. Database Admin:    http://localhost:5050                  ║"
    echo "║  5. RabbitMQ Admin:    http://localhost:15672                 ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
}

main "$@"
