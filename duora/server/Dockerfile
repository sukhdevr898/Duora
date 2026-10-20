# Duora server — lightweight production image for Render / personal VPS
# Optimized for Render free tier: small image, low memory, fast cold start.
# Multi-stage build keeps the runtime image minimal (no build tools).
FROM node:20-alpine AS builder
WORKDIR /app

# Dependencies first — cache-friendly layer
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# ── Runtime ──
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# Render injects PORT; default 4000 for local docker run
ENV PORT=10000

RUN addgroup -S duora && adduser -S duora -G duora && \
    apk add --no-cache tini

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

USER duora
EXPOSE 4000 10000
ENTRYPOINT ["/sbin/tini", "--"]
# Prisma migrate is idempotent; then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-10000}/health || exit 1
# Lightweight: ~120MB Alpine + pruned deps, single Prisma client, no Redis.
