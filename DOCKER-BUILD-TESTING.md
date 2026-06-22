# Docker Build Testing Guide

## Quick Start

The Docker build has been fixed to properly handle the npm monorepo structure. Follow these steps to test:

### Prerequisites
- Docker Desktop installed (with daemon running)
- ~20GB free disk space (for images and volumes)
- ~10 minutes (for initial build)

### Option 1: Use the Automated Test Script (Recommended)

```bash
cd /Users/ajaysingh33/Documents/APIM-Portal-Solution/report-generation

# Run the test script
./docker-build-test.sh
```

This script will:
1. Verify Docker is installed and running
2. Clean up old containers and images
3. Build all Docker images
4. Start all services
5. Verify services are healthy
6. Display access URLs and logs

### Option 2: Manual Docker Build

```bash
cd /Users/ajaysingh33/Documents/APIM-Portal-Solution/report-generation

# Stop existing services
docker-compose down

# Build and start services
docker-compose up -d --build

# View logs
docker-compose logs -f
```

---

## Expected Build Output

When running the build, you should see output like:

```
[+] Building 45.3s (XX/XX)
 => [builder] FROM node:20-alpine
 => [builder] RUN apk add --no-cache python3 make g++ git
 => [builder] COPY package*.json ./
 => [builder] RUN npm ci --legacy-peer-deps
Installing dependencies with npm ci...
Dependencies installed successfully
npm list output...

 => [builder] RUN npm run build --workspace=@reporting-engine/shared
======================================
Building shared package...
======================================
✓ Shared package built successfully
packages/shared/dist/: (listing of files)

 => [builder] RUN npm run build --workspace=@reporting-engine/backend
======================================
Building backend...
======================================
✓ Backend built successfully
apps/backend/dist/: (listing of files)

 => [builder] RUN npm run build --workspace=@reporting-engine/frontend
======================================
Building frontend...
======================================
✓ Frontend built successfully
apps/frontend/dist/: (listing of files)
All builds verified successfully

 => [backend-runtime] FROM node:20-alpine
 => [backend-runtime] COPY --from=builder ...
 => [frontend-runtime] FROM nginx:alpine
 => [frontend-runtime] COPY --from=builder ...

Successfully built abc123def456
Successfully tagged reporting-engine:latest
```

---

## What Changed in the Docker Build

### Previous Issues
- ❌ Frontend: `vite: not found` - Vite wasn't installed
- ❌ Backend: `Cannot find module '/app/dist/index.js'` - Build didn't run

### Fixes Applied

1. **Single Builder Stage** (instead of separate stages)
   - All npm dependencies installed together
   - npm workspaces properly resolved

2. **Correct Build Order**
   - Shared package built first
   - Backend built second
   - Frontend built third

3. **Verification Steps**
   - Each build step verifies success
   - dist/ folders checked before copying
   - Explicit error messages if anything fails

4. **Proper File Copying**
   - Only dist/ folders copied to runtime
   - node_modules included for backend
   - Static files served by Nginx for frontend

---

## After Build: Verify Services

### Check Service Status

```bash
# List running containers
docker-compose ps

# Should show:
# NAME                        STATUS              PORTS
# reporting-engine-backend    Up (healthy)        0.0.0.0:8080->8080/tcp
# reporting-engine-frontend   Up (healthy)        0.0.0.0:3000->3000/tcp
# reporting-engine-postgres   Up (healthy)        0.0.0.0:5432->5432/tcp
# reporting-engine-redis      Up (healthy)        0.0.0.0:6379->6379/tcp
# reporting-engine-rabbitmq   Up (healthy)        0.0.0.0:5672->5672/tcp
```

### Test Backend API

```bash
# Health check
curl http://localhost:8080/health

# Should return: {"status":"ok"}
```

### Test Frontend

```bash
# Open in browser
open http://localhost:3000

# Should load the React app
```

### View Database

```bash
# Adminer (simple database UI)
open http://localhost:8081

# pgAdmin (full PostgreSQL management)
open http://localhost:5050
# Login: admin@example.com / admin
```

### View RabbitMQ

```bash
open http://localhost:15672
# Login: guest / guest
```

---

## Troubleshooting

### Build Fails with npm Errors

```bash
# Try with legacy peer deps (already in Dockerfile)
docker-compose build --no-cache

# Check npm version in image
docker run --rm node:20-alpine npm --version
```

### Build Fails with "vite: not found"

This means Vite (a devDependency) wasn't installed. Causes:
- npm install failed silently
- Build layer wasn't running npm ci
- Docker context missing package.json

Fix:
```bash
# Rebuild without cache
docker-compose build --no-cache backend

# Check Dockerfile
cat Dockerfile | grep -A 5 "npm ci"
```

### Backend Fails with "Cannot find module"

This means the backend dist/ folder wasn't created. Causes:
- TypeScript compilation failed
- Shared package build failed
- Dist folder not copied properly

Fix:
```bash
# Rebuild and check logs
docker-compose build --no-cache backend 2>&1 | tail -100

# Check builder stage output
docker build --target builder . --progress=plain 2>&1 | tail -50
```

### Containers Won't Start

```bash
# Check container logs
docker-compose logs backend
docker-compose logs frontend

# Restart services
docker-compose restart

# Full restart
docker-compose down
docker-compose up -d
```

### Port Already in Use

```bash
# Change ports in docker-compose.yml or .env
# Or kill the process using the port:
lsof -i :8080
kill -9 <PID>
```

### Out of Disk Space

```bash
# Clean up Docker
docker system prune -a --volumes

# Verify space
docker system df
```

---

## Files Modified for Docker Fix

1. **Dockerfile** (Major overhaul)
   - Unified builder stage
   - npm ci for reproducible builds
   - Verbose output for debugging
   - Proper dependency resolution

2. **docker-compose.yml** (Updated services)
   - Frontend now uses Dockerfile build
   - Removed development volumes
   - Added restart policies
   - Set production environment

3. **.dockerignore** (New)
   - Excludes unnecessary files
   - Reduces Docker context size

4. **docker-build-test.sh** (New)
   - Automated build testing
   - Service verification
   - Health checks

---

## Environment Variables

Required (or use defaults):

```bash
# Database
DATABASE_NAME=reporting_engine
DATABASE_USER=reportuser
DATABASE_PASSWORD=reportpass
DATABASE_PORT=5432

# Redis
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_PORT=5672

# Backend
BACKEND_PORT=8080
NODE_ENV=production
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000

# Frontend
FRONTEND_PORT=3000
VITE_API_URL=http://localhost:8080/api/v1
```

Create a `.env` file in the project root to override defaults:

```bash
cat > .env << EOF
DATABASE_PASSWORD=your-strong-password
JWT_SECRET=your-very-secret-key
NODE_ENV=production
EOF

docker-compose up -d --build
```

---

## Performance Notes

- **First Build**: 5-10 minutes (downloads dependencies, compiles TypeScript)
- **Subsequent Builds**: 1-3 minutes (Docker layer caching)
- **Image Sizes**: 
  - Backend: ~500MB (includes Node.js + dependencies)
  - Frontend: ~100MB (Nginx + static files)
- **Runtime Memory**: ~1.5GB total (backend, frontend, database, cache)

---

## Next Steps After Successful Build

1. **Run Integration Tests**
   ```bash
   npm run test --workspace=@reporting-engine/backend
   npm run test --workspace=@reporting-engine/frontend
   ```

2. **Load Test Data** (if available)
   ```bash
   # Load seed data into database
   npm run seed --workspace=@reporting-engine/backend
   ```

3. **Verify Functionality**
   - Create a report
   - Run a schedule
   - Export in different formats
   - Check logs for errors

4. **Proceed to Phase 9**
   - Add unit tests
   - Add integration tests
   - Setup CI/CD pipeline
   - Add monitoring and logging

---

## Getting Help

If the build fails:

1. Check the build output (saved to `build.log`)
2. Review Dockerfile for the specific failing step
3. Check `.dockerignore` for excluded files
4. Verify all source files are committed to git
5. Run `docker system prune -a` if space is low
6. Check Docker Desktop logs for system errors

Common fixes:
- `docker-compose build --no-cache` (rebuild everything)
- `docker system prune -a` (clean up)
- Restart Docker Desktop
- Update Docker to latest version

