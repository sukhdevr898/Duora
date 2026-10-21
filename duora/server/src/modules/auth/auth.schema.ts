import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(1, 'Tell us your name').max(40),
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(40).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  partnerNickname: z.string().min(1).max(40).nullable().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
