import rateLimit from 'express-rate-limit';

// In-memory limiters are correct for the single-service deployment described in
// the architecture doc. Multi-instance deployments swap in a Redis store.
const base = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'rate_limited', message: 'Too many requests, slow down' } },
} as const;

export const loginLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, max: 10 });
export const registerLimiter = rateLimit({ ...base, windowMs: 60 * 60 * 1000, max: 5 });
export const invitationLimiter = rateLimit({ ...base, windowMs: 60 * 1000, max: 12 });
export const verifyLimiter = rateLimit({ ...base, windowMs: 60 * 1000, max: 20 });
export const messageSendLimiter = rateLimit({ ...base, windowMs: 60 * 1000, max: 60 });
export const callLimiter = rateLimit({ ...base, windowMs: 60 * 1000, max: 20 });
export const globalLimiter = rateLimit({ ...base, windowMs: 60 * 1000, max: 300 });
