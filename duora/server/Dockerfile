# Duora API — Node 22 + Express + Socket.IO
# Multi-stage: build with the full toolchain, ship only what the runtime needs.
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts
# Avatars + memory photos are served straight from the API.
COPY public ./public

EXPOSE 10000
# Render injects PORT; the server reads it from the environment.
CMD ["node", "dist/index.js"]
