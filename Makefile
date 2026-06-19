.PHONY: help install dev build test lint format clean docker-up docker-down db-migrate

help:
	@echo "Reporting Engine - Development Commands"
	@echo "========================================"
	@echo "make install           - Install all dependencies"
	@echo "make dev               - Start development environment"
	@echo "make dev-frontend      - Start frontend development server"
	@echo "make dev-backend       - Start backend development server"
	@echo "make build             - Build all applications"
	@echo "make build-frontend    - Build frontend only"
	@echo "make build-backend     - Build backend only"
	@echo "make test              - Run all tests"
	@echo "make test-watch        - Run tests in watch mode"
	@echo "make test-coverage     - Run tests with coverage report"
	@echo "make lint              - Run linters"
	@echo "make lint-fix          - Fix linting issues"
	@echo "make format            - Format code with Prettier"
	@echo "make type-check        - Type check TypeScript"
	@echo "make docker-build      - Build Docker images"
	@echo "make docker-up         - Start Docker containers"
	@echo "make docker-down       - Stop Docker containers"
	@echo "make docker-logs       - View Docker logs"
	@echo "make docker-clean      - Remove Docker containers and volumes"
	@echo "make db-migrate        - Run database migrations"
	@echo "make db-seed           - Seed database with sample data"
	@echo "make clean             - Clean build artifacts"

install:
	npm install

dev:
	npm run dev

dev-frontend:
	npm run dev:frontend

dev-backend:
	npm run dev:backend

build:
	npm run build

build-frontend:
	npm run build:frontend

build-backend:
	npm run build:backend

test:
	npm run test

test-watch:
	npm run test:watch

test-coverage:
	npm run test:coverage

lint:
	npm run lint

lint-fix:
	npm run lint:fix

format:
	npm run format

type-check:
	npm run type-check

docker-build:
	docker-compose build

docker-up:
	docker-compose up -d
	@echo "Services starting up..."
	@echo "Frontend:    http://localhost:3000"
	@echo "Backend:     http://localhost:8080"
	@echo "Adminer:     http://localhost:8081"
	@echo "PgAdmin:     http://localhost:5050"
	@echo "RabbitMQ:    http://localhost:15672"

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

docker-clean:
	docker-compose down -v
	docker system prune -f

db-migrate:
	npm run db:migrate

db-seed:
	npm run db:seed

clean:
	npm run clean

# Development workflow aliases
.PHONY: setup start stop restart logs
setup: install docker-build db-migrate
start: docker-up
stop: docker-down
restart: docker-down docker-up
logs: docker-logs
