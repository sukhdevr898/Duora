# Deployment guide

The server is a single modular Node.js service (Express + Socket.IO + Prisma).
The first deployment intentionally avoids microservices; horizontal scaling is
addressed at the end.

## 1. Provision PostgreSQL

Any managed Postgres (≥ 14) works — RDS, Neon, Supabase, Cloud SQL, or a local
instance. Create a database and an application role:

```sql
CREATE DATABASE duora;
CREATE USER duora WITH ENCRYPTED PASSWORD '<strong-password>';
GRANT ALL PRIVILEGES ON DATABASE duora TO duora;
```

## 2. Configure environment

```bash
cd server
cp .env.example .env
```

Minimum required values:

| Variable | Guidance |
| --- | --- |
| `DATABASE_URL` | `postgresql://duora:<password>@host:5432/duora?schema=public` |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` — two distinct values |
| `PUBLIC_BASE_URL` | Public HTTPS origin of the service |
| `CORS_ORIGINS` | Comma-separated allowed origins (mobile clients send no Origin and are always permitted) |
| `FIREBASE_*` | Service account for FCM (optional; push degrades gracefully) |
| `TURN_SECRET`, `TURN_URLS`, `STUN_URLS` | coturn credentials for restrictive NATs |
| `ANDROID_*` | Update-contract values and the verified Play release URL |

Never commit `.env`. Production must expose the service over HTTPS/WSS only.

## 3. Migrations and seed

```bash
npm ci
npx prisma migrate deploy     # applies committed migrations
npx prisma generate           # client generation (also in Docker build)
npm run db:seed               # optional demo data — skip in production
npm run build
npm start                     # node dist/server.js
```

`/ready` returns 503 until the database is reachable, suitable for load
balancer health checks alongside `/health`.

## 4. Docker

A multi-stage `Dockerfile` builds, generates the Prisma client, prunes dev
dependencies and runs `prisma migrate deploy` before starting:

```bash
docker build -t duora-server:latest ./server
docker run --rm --env-file ./server/.env -p 4000:4000 duora-server:latest
```

Compose sketch for a full local stack (Postgres + server):

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: duora
      POSTGRES_PASSWORD: duora
      POSTGRES_DB: duora
    volumes: ["pgdata:/var/lib/postgresql/data"]
  api:
    build: ./server
    env_file: ./server/.env
    ports: ["4000:4000"]
    depends_on: [db]
volumes:
  pgdata:
```

## 5. Reverse proxy and WebSockets

Nginx must allow the Socket.IO upgrade:

```nginx
location / {
  proxy_pass http://127.0.0.1:4000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_read_timeout 300s;
}
```

The app's `EXPO_PUBLIC_API_BASE_URL` becomes
`https://api.example.com/api/v1` and `EXPO_PUBLIC_WS_URL` becomes
`https://api.example.com` (Socket.IO upgrades to WSS automatically).

## 6. Process and graceful shutdown

Under systemd or a container orchestrator, SIGTERM triggers: stop accepting
connections → close Socket.IO → close HTTP → disconnect Prisma → exit, with a
10-second hard ceiling. The cleanup interval marks missed ringing calls,
expired invitations and expired refresh sessions every 60 seconds.

## 7. Push and TURN

- FCM: grant the service account the Firebase Cloud Messaging Admin role;
  invalid tokens are pruned automatically on send failure.
- TURN: host coturn (see [android-build.md](./android-build.md)) and keep
  `TURN_SECRET` identical on both sides. Relay bandwidth is separately metered
  by your provider.

## 8. Scaling beyond one instance

The only process-local state is the socket registry
(`server/src/websocket/socketState.ts`). To run multiple instances:

1. Add the Socket.IO Redis adapter (`@socket.io/redis-adapter`).
2. Swap the in-memory express rate limiters for a Redis store.
3. Keep Prisma/PostgreSQL as the single durable source of truth — no domain
   data lives in memory.

## 9. Security checklist

- [ ] HTTPS/WSS enforced; HSTS via `helmet` (already enabled)
- [ ] Strong distinct JWT secrets; access tokens short-lived, refresh rotated
- [ ] Rate limits tuned to your traffic
- [ ] Database backups and retention for soft-deleted accounts
- [ ] FCM service account key stored as a secret, never in git
- [ ] Log redaction verified (authorization headers, tokens, SDP redacted)
- [ ] CORS origins restricted for browser clients
- [ ] TURN secret rotated periodically; credentials remain short-lived

## 10. Data retention

- `RefreshSession` expired rows are deleted by the cleanup job; logout/account
  deletion revokes them immediately.
- Account deletion is soft (`deletedAt`); define a hard-delete window per your
  policy and schedule it against users, messages and call records.
- "Delete for me" hides rows per user without destroying the partner's copy;
  "delete for everyone" blanks content but preserves the record for receipt
  integrity.
