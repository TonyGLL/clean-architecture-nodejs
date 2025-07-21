# Stage 1: Build
FROM node:lts-alpine AS builder
WORKDIR /app

# Copy package.json and lock file, then install dependencies
COPY package*.json ./
RUN npm install --force

# Copy the rest of the source code and build it
COPY . .
RUN npm run build

# Stage 2: Prune unnecessary dependencies for production
FROM node:lts-alpine AS production-deps
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
RUN npm prune --production

# Stage 3: Runtime
FROM node:lts-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create log directory
RUN mkdir -p /app/logs

# Copy build output and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Simple healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
    CMD node -e "require('http').get('http://localhost:${PORT}/health', res => { if (res.statusCode !== 200) process.exit(1) }).on('error', () => process.exit(1))"

# Expose the app port
EXPOSE $PORT

# Start the application
CMD ["node", "dist/main/server.js"]
