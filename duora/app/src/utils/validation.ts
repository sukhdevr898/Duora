import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().email('Enter a valid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(200, 'Password is too long');

export const displayNameSchema = z.string().trim().min(1, 'Display name is required').max(60);

export const loginForm = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerForm = z.object({
  email: emailSchema,
  displayName: displayNameSchema,
  password: passwordSchema,
});

export const resetForm = z.object({ email: emailSchema });

export const pairingCodeSchema = z
  .string()
  .trim()
  .regex(/^DUO-\d{6}$/, 'Use the full code, e.g. DUO-482913');

export const messageTextSchema = z.string().trim().min(1).max(4000);

export type LoginForm = z.infer<typeof loginForm>;
export type RegisterForm = z.infer<typeof registerForm>;
