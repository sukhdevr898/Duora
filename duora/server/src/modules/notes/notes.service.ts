import { db } from '../../db/client';
import { ApiError } from '../../utils/ApiError';
import { id, nowIso } from '../../utils/ids';

export type NoteRow = {
  id: string;
  owner_id: string;
  title: string;
  body: string;
  category: string;
  image_url: string | null;
  mood: string | null;
  created_at: string;
  updated_at: string;
};

export type NoteItem = {
  id: string;
  title: string;
  lines: string[];
  date: string;
  image: string | null;
  category: string;
  mood: string | null;
  createdAt: string;
};

export async function listNotes(userId: string): Promise<NoteItem[]> {
  const rows = await db().all<NoteRow>(
    'SELECT * FROM notes WHERE owner_id = ? ORDER BY created_at DESC',
    [userId],
  );
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    lines: row.body ? row.body.split('\n').filter(Boolean) : [],
    date: new Date(row.created_at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    image: row.image_url,
    category: row.category,
    mood: row.mood,
    createdAt: row.created_at,
  }));
}

export async function createNote(
  userId: string,
  input: { title: string; body?: string; category?: string; imageUrl?: string | null; mood?: string | null },
): Promise<NoteItem> {
  const now = nowIso();
  const noteId = id('note');
  await db().run(
    `INSERT INTO notes (id, owner_id, title, body, category, image_url, mood, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      noteId,
      userId,
      input.title,
      input.body ?? '',
      input.category ?? 'PLAN',
      input.imageUrl ?? null,
      input.mood ?? null,
      now,
      now,
    ],
  );
  const notes = await listNotes(userId);
  return notes.find((n) => n.id === noteId)!;
}

export async function updateNote(
  userId: string,
  noteId: string,
  patch: { title?: string; body?: string; category?: string; imageUrl?: string | null; mood?: string | null },
): Promise<NoteItem> {
  const row = await db().one<NoteRow>('SELECT * FROM notes WHERE id = ? AND owner_id = ?', [
    noteId,
    userId,
  ]);
  if (!row) throw ApiError.notFound('Note not found');

  const fields: string[] = [];
  const params: unknown[] = [];
  if (patch.title !== undefined) {
    fields.push('title = ?');
    params.push(patch.title);
  }
  if (patch.body !== undefined) {
    fields.push('body = ?');
    params.push(patch.body);
  }
  if (patch.category !== undefined) {
    fields.push('category = ?');
    params.push(patch.category);
  }
  if (patch.imageUrl !== undefined) {
    fields.push('image_url = ?');
    params.push(patch.imageUrl);
  }
  if (patch.mood !== undefined) {
    fields.push('mood = ?');
    params.push(patch.mood);
  }
  if (fields.length) {
    fields.push('updated_at = ?');
    params.push(nowIso(), noteId, userId);
    await db().run(`UPDATE notes SET ${fields.join(', ')} WHERE id = ? AND owner_id = ?`, params);
  }
  const notes = await listNotes(userId);
  return notes.find((n) => n.id === noteId)!;
}

export async function deleteNote(userId: string, noteId: string): Promise<void> {
  const result = await db().run('DELETE FROM notes WHERE id = ? AND owner_id = ?', [noteId, userId]);
  if (result.changes === 0) throw ApiError.notFound('Note not found');
}
