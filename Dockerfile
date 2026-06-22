# Multi-stage build for production-optimized image

# Stage 1: Build all workspaces (backend, frontend, shared)
FROM node:20-alpine AS builder
WORKDIR /build

# Install system dependencies needed for building
RUN apk add --no-cache python3 make g++ git

# Copy all package.json files first (for layer caching)
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/shared/package*.json ./packages/shared/

# Install all dependencies (including devDependencies) at root level
# This ensures npm workspaces are properly resolved
RUN echo "Installing dependencies with npm ci..." && \
    npm ci --legacy-peer-deps && \
    echo "Dependencies installed successfully" && \
    npm list --depth=0

# Copy configuration files
COPY tsconfig.json .eslintrc.json ./
COPY apps/frontend/vite.config.ts ./apps/frontend/

# Copy all source code
COPY apps/ ./apps/
COPY packages/ ./packages/
COPY scripts/ ./scripts/

# Build all packages using npm workspace commands
RUN echo "======================================" && \
    echo "Building shared package..." && \
    echo "======================================" && \
    npm run build --workspace=@reporting-engine/shared && \
    echo "✓ Shared package built successfully" && \
    ls -la packages/shared/dist/

RUN echo "======================================" && \
    echo "Building backend..." && \
    echo "======================================" && \
    npm run build --workspace=@reporting-engine/backend && \
    echo "✓ Backend built successfully" && \
    ls -la apps/backend/dist/ && \
    echo "Files in dist:" && \
    find apps/backend/dist -type f | head -20

RUN echo "======================================" && \
    echo "Building frontend..." && \
    echo "======================================" && \
    npm run build --workspace=@reporting-engine/frontend && \
    echo "✓ Frontend built successfully" && \
    ls -la apps/frontend/dist/ && \
    echo "Files in dist:" && \
    find apps/frontend/dist -type f | head -20

# Verify all builds succeeded
RUN echo "Verifying build outputs..." && \
    test -d apps/backend/dist && echo "✓ Backend dist exists" || (echo "✗ Backend dist missing"; exit 1) && \
    test -d apps/frontend/dist && echo "✓ Frontend dist exists" || (echo "✗ Frontend dist missing"; exit 1) && \
    echo "All builds verified successfully"

# Stage 2: Production Backend Runtime
FROM node:20-alpine AS backend-runtime
WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache dumb-init

# Copy only production dependencies and built output
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/apps/backend/dist ./dist
COPY --from=builder /build/package.json ./

# Verify runtime files exist
RUN echo "Backend runtime files:" && \
    ls -la && \
    echo "Dist directory:" && \
    ls -la dist/ && \
    test -f dist/index.js && echo "✓ dist/index.js exists" || echo "✗ dist/index.js missing"

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

ENTRYPOINT ["/sbin/dumb-init", "--"]
CMD ["node", "dist/index.js"]

# Stage 3: Production Frontend Runtime
FROM nginx:alpine AS frontend-runtime
COPY --from=builder /build/apps/frontend/dist /usr/share/nginx/html

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

# Default to backend
FROM backend-runtime
