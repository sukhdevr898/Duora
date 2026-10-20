import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().max(200).toLowerCase(),
  password: z.string().min(8).max(200),
  displayName: z.string().trim().min(1).max(60),
});

export const loginSchema = z.object({
  email: z.string().email().max(200).toLowerCase(),
  password: z.string().min(1).max(200),
  device: z
    .object({
      pushToken: z.string().max(4096).optional(),
      platform: z.enum(['android', 'ios', 'web']).default('android'),
      deviceId: z.string().max(200).optional(),
    })
    .optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20).max(512),
});

export const resetPasswordSchema = z.object({
  email: z.string().email().max(200).toLowerCase(),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(20).max(512),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
