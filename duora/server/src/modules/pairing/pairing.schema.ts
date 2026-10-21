import { z } from 'zod';

export const acceptByCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, 'The pairing code has 6 characters')
    .max(6, 'The pairing code has 6 characters')
    .regex(/^[A-Za-z0-9]+$/, 'The pairing code only uses letters and numbers')
    .transform((s) => s.toUpperCase()),
});

export const acceptByTokenSchema = z.object({
  token: z.string().min(8),
});

export const scanSchema = z.object({
  data: z.string().min(8),
});
