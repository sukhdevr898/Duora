# Duora server — production image
FROM node:20-slim AS base
WORKDIR /app
ENV NODE_ENV=production

# Install dependencies (include dev deps for prisma generate + build)
COPY package.json package-lock.json* ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Prune dev dependencies
RUN npm prune --omit=dev && npm cache clean --force

EXPOSE 4000
USER node
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
