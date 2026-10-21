import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import * as notes from './notes.service';

const createSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().max(2000).optional(),
  category: z.enum(['ALL', 'PLAN', 'DAYS']).optional(),
  imageUrl: z.string().nullable().optional(),
  mood: z.string().max(40).nullable().optional(),
});

const updateSchema = createSchema.partial();

export const notesRouter = Router();
notesRouter.use(requireAuth);

notesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ notes: await notes.listNotes(req.user!.id) });
  }),
);

notesRouter.post(
  '/',
  validate(createSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json({ note: await notes.createNote(req.user!.id, req.body as never) });
  }),
);

notesRouter.patch(
  '/:noteId',
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    res.json({ note: await notes.updateNote(req.user!.id, req.params.noteId, req.body as never) });
  }),
);

notesRouter.delete(
  '/:noteId',
  asyncHandler(async (req, res) => {
    await notes.deleteNote(req.user!.id, req.params.noteId);
    res.status(204).send();
  }),
);
