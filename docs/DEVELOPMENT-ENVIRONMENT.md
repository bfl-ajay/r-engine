# Development Environment Setup Guide

**Last Updated**: 2026-06-19  
**Version**: 1.0.0

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Development Setup](#development-setup)
4. [Docker Setup](#docker-setup)
5. [Database Setup](#database-setup)
6. [Running Services](#running-services)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Prerequisites

### System Requirements

- **Operating System**: macOS, Linux, or Windows (WSL2)
- **RAM**: Minimum 8GB (16GB recommended)
- **Disk Space**: 20GB free space

### Required Software

#### Node.js & npm
```bash
# Verify installation (should be 20.x or later)
node --version   # v20.4.0+
npm --version    # 10.0.0+
```

[Download Node.js](https://nodejs.org/) or use a version manager:
```bash
# Using nvm (macOS/Linux)
nvm install 20
nvm use 20

# Using fnm (fast node manager)
fnm install 20
fnm use 20
```

#### Docker & Docker Compose
```bash
# Verify installation
docker --version      # Docker 24.0+
docker-compose --version  # Docker Compose 2.20+
```

[Download Docker Desktop](https://www.docker.com/products/docker-desktop)

#### Git
```bash
git --version  # git 2.40+
```

#### Code Editor
- **Recommended**: Visual Studio Code with extensions:
  - ESLint
  - Prettier
  - TypeScript Vue Plugin
  - Thunder Client (for API testing)
  - Remote - Containers

---

## Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd report-generation
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your local configuration
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Environment
```bash
# Using Docker (recommended)
make docker-build
make docker-up

# OR start services individually
npm run dev
```

### 5. Access Applications
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Database Admin**: http://localhost:5050 (pgAdmin)
- **Message Queue**: http://localhost:15672 (RabbitMQ)

---

## Development Setup

### Project Structure

```
report-generation/
├── apps/
│   ├── frontend/           # React 18 application
│   │   ├── src/
│   │   ├── public/
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── backend/            # Node.js/Express backend
│       ├── src/
│       ├── prisma/
│       ├── scripts/
│       └── package.json
├── packages/
│   └── shared/             # Shared types and utilities
├── docs/                   # Architecture and API documentation
├── scripts/                # Database scripts
├── .github/workflows/      # CI/CD pipelines
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile              # Multi-stage Docker build
├── Makefile                # Development commands
├── package.json            # Root monorepo package.json
└── tsconfig.json          # Root TypeScript configuration
```

### Frontend Development

#### Setup
```bash
cd apps/frontend
npm install
npm run dev
```

#### Available Commands
```bash
npm run dev           # Start development server (port 3000)
npm run build         # Build for production
npm run preview       # Preview production build
npm run lint          # Lint code
npm run lint:fix      # Fix linting issues
npm run type-check    # Type check TypeScript
npm run test          # Run tests
npm run test:watch    # Run tests in watch mode
npm run format        # Format code
```

#### Project Structure
```
apps/frontend/src/
├── components/        # React components
│   ├── Designer/     # Report Designer
│   ├── Viewer/       # Report Viewer
│   ├── Common/       # Shared components
│   └── Layout/       # Layout components
├── pages/            # Page components
├── hooks/            # Custom React hooks
├── store/            # Redux store
├── api/              # API client
├── services/         # Business logic
├── types/            # TypeScript types
├── styles/           # Global styles
├── utils/            # Utility functions
└── main.tsx          # Application entry point
```

### Backend Development

#### Setup
```bash
cd apps/backend
npm install
npm run dev
```

#### Available Commands
```bash
npm run dev           # Start development server (port 8080)
npm run build         # Build for production
npm run start         # Run production build
npm run lint          # Lint code
npm run lint:fix      # Fix linting issues
npm run type-check    # Type check TypeScript
npm run test          # Run tests
npm run test:watch    # Run tests in watch mode
npm run db:migrate    # Run migrations
npm run db:seed       # Seed database
npm run db:studio     # Open Prisma Studio
```

#### Project Structure
```
apps/backend/src/
├── controllers/       # HTTP request handlers
├── services/          # Business logic
├── repositories/      # Data access layer
├── middlewares/       # Express middlewares
├── utils/             # Utility functions
├── types/             # TypeScript types
├── config/            # Configuration
├── database/          # Database utilities
└── index.ts           # Application entry point
```

---

## Docker Setup

### Build Docker Images

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend
docker-compose build frontend
```

### Start Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | - |
| Backend | http://localhost:8080 | - |
| pgAdmin | http://localhost:5050 | admin@example.com / admin |
| Adminer | http://localhost:8081 | - |
| RabbitMQ | http://localhost:15672 | guest / guest |
| PostgreSQL | localhost:5432 | reportuser / reportpass |
| Redis | localhost:6379 | - |

---

## Database Setup

### Automatic Setup (Recommended)

```bash
# Using Docker Compose
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
sleep 10

# Run migrations
npm run db:migrate

# Seed sample data (optional)
npm run db:seed
```

### Manual Setup

#### 1. Connect to Database
```bash
# Using psql
psql postgresql://reportuser:reportpass@localhost:5432/reporting_engine

# Or using pgAdmin at http://localhost:5050
```

#### 2. Create Schema
```sql
-- Creates all tables defined in prisma/schema.prisma
```

#### 3. Seed Data
```bash
npm run db:seed
```

### Database Schema Documentation

See `docs/database/01-DATABASE-DESIGN.md` for complete schema documentation.

### Prisma Studio

Interactive database viewer and editor:
```bash
npm run db:studio
```

Access at http://localhost:5555

---

## Running Services

### Option 1: Docker Compose (Recommended)

```bash
# Start all services
make docker-up

# View status
docker-compose ps

# View logs
make docker-logs

# Stop services
make docker-down
```

### Option 2: Individual Services

#### Terminal 1: PostgreSQL + Redis + RabbitMQ
```bash
docker-compose up postgres redis rabbitmq
```

#### Terminal 2: Backend
```bash
cd apps/backend
npm install
npm run dev
```

#### Terminal 3: Frontend
```bash
cd apps/frontend
npm install
npm run dev
```

### Option 3: Using Makefile

```bash
make setup          # Install + Docker build + DB migrate
make start          # docker-compose up
make stop           # docker-compose down
make restart        # Restart all services
make logs           # View logs
make clean          # Clean everything
```

---

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
```bash
# Frontend
cd apps/frontend
# Edit code, run tests: npm run test

# Backend
cd apps/backend
# Edit code, run tests: npm run test
```

### 3. Lint & Format
```bash
# Lint everything
npm run lint

# Fix issues automatically
npm run lint:fix

# Format code
npm run format
```

### 4. Type Check
```bash
npm run type-check
```

### 5. Run Tests
```bash
npm run test
npm run test:coverage
```

### 6. Commit & Push
```bash
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

### 7. Create Pull Request
- Go to GitHub/GitLab
- Create PR with description
- Wait for CI/CD to pass
- Request code review

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :8080  # Backend
lsof -i :3000  # Frontend

# Kill process (macOS/Linux)
kill -9 <PID>
```

### Database Connection Error

```bash
# Verify PostgreSQL is running
docker-compose logs postgres

# Check connection
docker-compose exec postgres psql -U reportuser -d reporting_engine

# Reset database
docker-compose down -v
docker-compose up -d postgres
npm run db:migrate
```

### Node Modules Issues

```bash
# Clear cache
npm cache clean --force

# Reinstall
rm -rf node_modules package-lock.json
npm install
```

### Docker Issues

```bash
# Remove all containers
docker-compose down -v
docker system prune -a

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

### API Connection Issues

```bash
# Check backend is running
curl http://localhost:8080/health

# Check frontend can reach backend
# In browser console, test:
fetch('http://localhost:8080/api/v1/health')
```

### TypeScript Errors

```bash
# Type check all workspaces
npm run type-check

# Rebuild TypeScript
npm run build
```

---

## Best Practices

### Code Quality

1. **Always run linter before committing**
   ```bash
   npm run lint:fix
   npm run format
   ```

2. **Type checking**
   ```bash
   npm run type-check  # Should have 0 errors
   ```

3. **Testing**
   ```bash
   npm run test:coverage  # Aim for >80% coverage
   ```

### Git Workflow

1. **Branch naming**
   - Feature: `feature/description`
   - Bugfix: `bugfix/description`
   - Hotfix: `hotfix/description`
   - Docs: `docs/description`

2. **Commit messages**
   - Use conventional commits: `type(scope): message`
   - Examples:
     - `feat(designer): add band editor`
     - `fix(api): correct error handling`
     - `docs(readme): update setup guide`

3. **Pull request**
   - Small, focused changes
   - Clear description
   - Link to issues
   - Request review

### Frontend Development

1. **Component structure**
   ```typescript
   // src/components/MyComponent.tsx
   import React from 'react';
   import styles from './MyComponent.module.css';

   interface Props {
     title: string;
     onClick: () => void;
   }

   export const MyComponent: React.FC<Props> = ({ title, onClick }) => {
     return <div onClick={onClick}>{title}</div>;
   };
   ```

2. **Use hooks properly**
   - Call hooks at top level only
   - Use custom hooks for shared logic
   - Keep hooks pure

3. **State management**
   - Use Redux for global state
   - Use React hooks for local state
   - Keep state close to components

### Backend Development

1. **API structure**
   ```typescript
   // controllers/reportController.ts
   export const getReport = async (req, res) => {
     const { reportId } = req.params;
     const report = await reportService.getReport(reportId);
     res.json(report);
   };
   ```

2. **Error handling**
   - Use proper HTTP status codes
   - Provide meaningful error messages
   - Log errors for debugging

3. **Database queries**
   - Use Prisma ORM
   - Leverage type safety
   - Optimize queries

### Environment Variables

```bash
# .env file (development only)
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://guest:guest@localhost:5672
JWT_SECRET=dev-secret-key
NODE_ENV=development
LOG_LEVEL=debug
```

**Never commit .env file!** Use `.env.example` for templates.

---

## Performance Tips

1. **Use VS Code's search and replace** to find TODOs/FIXMEs
2. **Enable auto-save** in VS Code
3. **Use Prettier** for consistent formatting
4. **ESLint** for catching issues early
5. **Run tests** frequently during development
6. **Monitor bundle size** with vite analyze

---

## Getting Help

- **Documentation**: See `docs/` folder
- **API Docs**: `docs/api/01-API-SPECIFICATIONS.md`
- **Architecture**: `docs/architecture/`
- **Issues**: Create GitHub/GitLab issue
- **Slack**: Team channel #reporting-engine

---

## References

- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**End of Development Environment Setup Guide**
