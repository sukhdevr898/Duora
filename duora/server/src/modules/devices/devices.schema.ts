import { z } from 'zod';

export const deviceSchema = z.object({
  pushToken: z.string().min(8),
  platform: z.enum(['android', 'ios', 'web']),
  deviceId: z.string().max(120).optional(),
});
