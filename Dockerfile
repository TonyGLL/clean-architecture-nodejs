# Stage 1: Build
FROM node:lts-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@12.15.0

# Install dependencies from the lockfile (reproducible), then build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Stage 2: Production-only dependencies
FROM node:lts-alpine AS production-deps
WORKDIR /app
RUN npm install -g pnpm@12.15.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Stage 3: Runtime
FROM node:lts-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create log directory and set strict permissions
RUN mkdir -p /app/logs && \
    chown node:node /app/logs && \
    chmod 700 /app/logs

# Copy build output and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Database migrations (run with `node scripts/migrate.js up`)
COPY migrations ./migrations
COPY scripts/migrate.js ./scripts/migrate.js

# Run as the unprivileged user built into the node image
USER node

# Simple healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
    CMD node -e "require('http').get('http://localhost:${PORT}/health', res => { if (res.statusCode !== 200) process.exit(1) }).on('error', () => process.exit(1))"

# Expose the app port
EXPOSE $PORT

# Start the application
CMD ["node", "dist/main/server.js"]
