import { z } from 'zod';

export const initiateCallSchema = z.object({
  callType: z.enum(['AUDIO', 'VIDEO']),
});

export const callIdParamSchema = z.object({
  callId: z.string().min(1).max(64),
});
