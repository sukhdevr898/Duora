# Duora server — lightweight production image for Render / personal VPS
# Optimized for Render free tier: small image, low memory, fast cold start.
# Multi-stage build keeps the runtime image minimal (no build tools).
#
# Build:  docker build -t duora-server ./server
# Run:    docker run --rm --env-file ./server/.env -p 4000:10000 duora-server
# Migrate (one-off, needs the Prisma CLI which is pruned from the runtime image):
#         docker build -t duora-migrate --target migrate ./server
#         docker run --rm --env-file ./server/.env duora-migrate

FROM node:22-alpine AS builder
WORKDIR /app

# Dependencies first — cache-friendly layer.
# --include=dev: tsc, @types/node and prisma are devDependencies and are needed
# to build. Never rely on a bare `npm ci` here — if NODE_ENV=production leaks
# into the build, npm silently skips them and tsc disappears.
COPY package.json package-lock.json* ./
RUN npm ci --include=dev --ignore-scripts

COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
# `npm run build` runs `prisma generate` then tsc → dist/server.js
RUN npm run build && npm prune --omit=dev

# ── Runtime ──
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
# Render injects PORT; default 10000 for docker run (server binds 0.0.0.0:${PORT})
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
# Migrations are applied outside the runtime image (see `migrate` target below or
# Render's `npx prisma migrate deploy` start command on the native runtime).
CMD ["node", "dist/server.js"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-10000}/health || exit 1

# ── Optional migration target (keeps the Prisma CLI) ──
#   docker build --target migrate -t duora-migrate ./server
#   docker run --rm --env-file ./server/.env duora-migrate
FROM builder AS migrate
WORKDIR /app
ENTRYPOINT ["npx", "prisma"]
CMD ["migrate", "deploy"]
# Lightweight: ~120MB Alpine + pruned deps, single Prisma client, no Redis.
