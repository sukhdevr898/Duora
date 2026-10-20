import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    displayName: z.string().trim().min(1).max(60).optional(),
    avatarUrl: z.string().url().max(2000).optional(),
    partnerNickname: z.string().trim().max(60).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

export const updateSettingsSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']).optional(),
  messageNotifications: z.boolean().optional(),
  callNotifications: z.boolean().optional(),
  ringtone: z.string().max(60).optional(),
  vibration: z.boolean().optional(),
  hidePreview: z.boolean().optional(),
  lowData: z.boolean().optional(),
});
