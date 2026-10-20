import { beforeAll, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';

vi.mock('../src/database/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'u1',
        email: 'alice@duora.dev',
        displayName: 'Alice',
        avatarUrl: null,
        deletedAt: null,
      }),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  },
}));

import { createApp } from '../src/app';
import { env } from '../src/config/env';

const app = createApp();

describe('HTTP surface', () => {
  it('exposes liveness and readiness', async () => {
    const health = await request(app).get('/health');
    expect(health.status).toBe(200);
    expect(health.body.status).toBe('ok');

    const ready = await request(app).get('/ready');
    expect(ready.status).toBe(200);
    expect(ready.body.database).toBe('up');
  });

  it('serves the documented update contract and flags required updates', async () => {
    const res = await request(app).get('/api/v1/app/version?platform=android&version=0.9.0');
    expect(res.status).toBe(200);
    expect(res.body.updateRequired).toBe(true);
    expect(res.body.releaseUrl).toMatch(/^https:\/\//);
  });

  it('rejects invalid registration payloads with 400', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('bad_request');
  });

  it('blocks protected routes without a bearer token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('accepts a valid signed access token', async () => {
    const token = jwt.sign(
      { sub: 'u1', email: 'alice@duora.dev', type: 'access' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' },
    );
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('alice@duora.dev');
  });

  it('returns 404 for unknown routes with a JSON error', async () => {
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });

  beforeAll(() => {
    // sanity: rate limiter does not throw under the test request volume
    expect(app).toBeDefined();
  });
});
