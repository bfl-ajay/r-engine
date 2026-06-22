# Multi-stage build for production-optimized image

# Stage 1: Build backend
FROM node:20-alpine AS backend-builder
WORKDIR /build
RUN npm install -g npm@latest
COPY package*.json ./
COPY apps/backend/ ./apps/backend/
COPY packages/ ./packages/
COPY tsconfig.json .eslintrc.json ./
RUN npm install --legacy-peer-deps
RUN npm run build --workspace=@reporting-engine/backend

# Stage 2: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /build
RUN npm install -g npm@latest
COPY package*.json ./
COPY apps/frontend/ ./apps/frontend/
COPY packages/ ./packages/
COPY tsconfig.json .eslintrc.json ./
RUN npm install --legacy-peer-deps
RUN npm run build --workspace=@reporting-engine/frontend

# Stage 3: Runtime - Backend
FROM node:20-alpine AS backend-runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache dumb-init
# Copy pre-built node_modules and compiled output from builder
COPY --from=backend-builder /build/node_modules ./node_modules
COPY --from=backend-builder /build/apps/backend/dist ./dist
COPY --from=backend-builder /build/apps/backend/prisma ./prisma
COPY --from=backend-builder /build/package.json ./package.json
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
ENTRYPOINT ["/sbin/dumb-init", "--"]
CMD ["node", "dist/index.js"]

# Stage 4: Runtime - Frontend (nginx)
FROM nginx:alpine AS frontend-runtime
COPY --from=frontend-builder /build/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/nginx.conf
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1
CMD ["nginx", "-g", "daemon off;"]

# Final image: Choose between backend or frontend based on build arg
FROM backend-runtime AS default
