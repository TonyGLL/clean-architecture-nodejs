# Stage 1: Build
FROM node:lts-alpine AS builder
WORKDIR /app

# Install dependencies only for production, then install dev if necessary
COPY package*.json ./
RUN npm install --force

# Copy everything and compile
COPY . .
RUN npm run build

# Stage 2: Prune node_modules for production
FROM node:lts-alpine AS production-deps
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
RUN npm prune --production

# Stage 3: Final (runtime)
FROM node:lts-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy final artifacts from previous stages
COPY --from=builder /app/dist ./dist
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Simple healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
    CMD node -e "require('http').get('http://localhost:${PORT}/health', res => { if (res.statusCode !== 200) process.exit(1) }).on('error', () => process.exit(1))"

EXPOSE $PORT

# Use the lightest possible command
CMD ["node", "dist/main/server.js"]
