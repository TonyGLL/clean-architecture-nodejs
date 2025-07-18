# Stage 1: Build
FROM node:lts-alpine AS builder
WORKDIR /app

# Instalar dependencias solo para producción, luego instalar dev si es necesario
COPY package*.json ./
RUN npm install --force

# Copiar todo y compilar
COPY . .
RUN npm run build

# Stage 2: Prune node_modules para producción
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

# Copiar artefactos finales desde las etapas anteriores
COPY --from=builder /app/dist ./dist
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Healthcheck simple
HEALTHCHECK --interval=30s --timeout=3s \
    CMD node -e "require('http').get('http://localhost:${PORT}/health', res => { if (res.statusCode !== 200) process.exit(1) }).on('error', () => process.exit(1))"

EXPOSE $PORT

# Usa el comando más ligero posible
CMD ["node", "dist/main/server.js"]
