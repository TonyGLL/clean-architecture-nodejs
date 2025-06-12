# Stage 1: Build
FROM node:lts-alpine AS builder
WORKDIR /app

# Copiar e instalar dependencias
COPY package.json ./
RUN npm install --force

# Copiar fuente y compilar
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:lts-alpine
WORKDIR /app

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Crear usuario no-root
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

# Copiar lo necesario desde la etapa de build
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Usar usuario no-root
USER nodejs

# Salud del contenedor
HEALTHCHECK --interval=30s --timeout=3s \
    CMD node -e "require('http').get('http://localhost:${PORT}/health', (res) => { \
    if(res.statusCode !== 200) throw new Error('Unhealthy'); \
    }).on('error', () => { throw new Error('Unhealthy') })"

# Puerto y comando de inicio
EXPOSE $PORT
CMD ["node", "dist/main/server.js"]