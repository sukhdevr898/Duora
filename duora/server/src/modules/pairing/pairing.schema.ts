import { z } from 'zod';

export const createInvitationSchema = z.object({}).strict();

export const verifyCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^DUO-\d{6}$/, 'Enter the full code, e.g. DUO-482913'),
});

export const acceptInvitationSchema = z
  .object({
    code: z.string().trim().regex(/^DUO-\d{6}$/).optional(),
    token: z.string().min(20).max(512).optional(),
  })
  .refine((v) => Boolean(v.code || v.token), { message: 'Provide a code or invitation token' });

export const unpairSchema = z.object({
  confirm: z.literal('UNPAIR'),
});
