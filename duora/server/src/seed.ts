/** Demo data so a fresh database is instantly usable. */
import bcrypt from 'bcryptjs';
import { db } from './db';
import { env, logger } from './env';
import { id, nowIso } from './util';

/**
 * Seeds a real, workable couple: two accounts, a live pairing, a conversation
 * with history, notes, call history and settings.
 *
 *   npm run seed
 *
 * Credentials: sukhdev@duora.app / love1234  ·  ruhi@duora.app / love1234
 */

type SeedUser = {
  id: string;
  email: string;
  displayName: string;
  nickname: string | null;
  avatarUrl: string | null;
  passwordHash: string;
};

export async function seed(options: { quiet?: boolean } = {}): Promise<void> {
  const log = options.quiet
    ? () => undefined
    : (payload: unknown, message: string) => logger.info({ detail: String(payload) }, message);
  const now = nowIso();
  const base = (env.PUBLIC_BASE_URL || `http://localhost:${env.PORT}`).replace(/\/$/, '');

  const passwordHash = await bcrypt.hash('love1234', 10);

  const sukhdev: SeedUser = {
    id: 'usr_sukhdev',
    email: 'sukhdev@duora.app',
    displayName: 'Sukhdev',
    nickname: null,
    avatarUrl: `${base}/img/me.jpg`,
    passwordHash,
  };
  const ruhi: SeedUser = {
    id: 'usr_ruhi',
    email: 'ruhi@duora.app',
    displayName: 'Ruhi',
    nickname: null,
    avatarUrl:
      `${base}/img/partner.jpg`,
    passwordHash,
  };

  await db().run(
    `INSERT INTO users (id, email, password_hash, display_name, avatar_url, partner_nickname, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET
       password_hash = excluded.password_hash,
       display_name = excluded.display_name,
       avatar_url = excluded.avatar_url,
       updated_at = excluded.updated_at`,
    [sukhdev.id, sukhdev.email, sukhdev.passwordHash, sukhdev.displayName, sukhdev.avatarUrl, 'ruhi', now, now],
  );
  await db().run(
    `INSERT INTO users (id, email, password_hash, display_name, avatar_url, partner_nickname, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET
       password_hash = excluded.password_hash,
       display_name = excluded.display_name,
       avatar_url = excluded.avatar_url,
       updated_at = excluded.updated_at`,
    [ruhi.id, ruhi.email, ruhi.passwordHash, ruhi.displayName, ruhi.avatarUrl, 'sukhdev', now, now],
  );

  for (const user of [sukhdev, ruhi]) {
    await db().run(
      `INSERT INTO user_settings (user_id, updated_at) VALUES (?, ?)
       ON CONFLICT(user_id) DO UPDATE SET updated_at = excluded.updated_at`,
      [user.id, now],
    );
    await db().run(
      `INSERT INTO presence (user_id, online, last_seen_at, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET last_seen_at = excluded.last_seen_at`,
      [user.id, user.id === ruhi.id ? 1 : 0, now, now],
    );
  }

  /* ---------------- pairing + conversation ---------------- */
  const existingPairing = await db().one<{ id: string }>(
    `SELECT id FROM pairings WHERE status = 'ACTIVE' AND (user_a_id = ? OR user_b_id = ?)`,
    [sukhdev.id, sukhdev.id],
  );

  const pairingId = existingPairing?.id ?? 'pr_seed';
  const conversationId = 'cv_seed';
  const pairedAt = new Date(Date.now() - 12 * 86_400_000).toISOString();

  if (!existingPairing) {
    await db().run(
      `INSERT INTO pairings (id, user_a_id, user_b_id, status, created_at) VALUES (?, ?, ?, 'ACTIVE', ?)`,
      [pairingId, sukhdev.id, ruhi.id, pairedAt],
    );
    await db().run(
      `INSERT INTO conversations (id, pairing_id, created_at, updated_at) VALUES (?, ?, ?, ?)`,
      [conversationId, pairingId, pairedAt, now],
    );
    await db().run(
      `INSERT INTO conversation_participants (conversation_id, user_id, joined_at) VALUES (?, ?, ?), (?, ?, ?)`,
      [conversationId, sukhdev.id, pairedAt, conversationId, ruhi.id, pairedAt],
    );
    // The code that paired the two of us — shown on the pairing screen.
    await db().run(
      `INSERT INTO pairing_invitations (id, code, token, created_by_id, status, attempt_count, expires_at, created_at)
       VALUES (?, ?, ?, ?, 'USED', 1, ?, ?)`,
      [id('inv'), 'LOVE24', id('tok'), sukhdev.id, now, pairedAt],
    );
  }

  /* ---------------- messages ---------------- */
  const messageCount = await db().one<{ c: number }>(
    'SELECT COUNT(*) AS c FROM messages WHERE conversation_id = ?',
    [conversationId],
  );
  if (Number(messageCount?.c ?? 0) === 0) {
    const script: { from: string; text?: string; sticker?: string; minutesAgo: number }[] = [
      { from: ruhi.id, text: 'hello', minutesAgo: 4000 },
      { from: sukhdev.id, text: 'how much', minutesAgo: 3960 },
      { from: sukhdev.id, text: 'Call me 💖', minutesAgo: 3900 },
      { from: sukhdev.id, text: 'Miss you ✨', minutesAgo: 3700 },
      { from: ruhi.id, sticker: 'shy', minutesAgo: 3680 },
      { from: sukhdev.id, text: 'Love you 💜', minutesAgo: 3400 },
      { from: ruhi.id, text: 'Same. Always 💗', minutesAgo: 3300 },
    ];

    for (const [index, entry] of script.entries()) {
      const createdAt = new Date(Date.now() - entry.minutesAgo * 60_000).toISOString();
      const messageId = id('msg');
      await db().run(
        `INSERT INTO messages (id, conversation_id, sender_id, client_message_id, type, text, sticker_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          messageId,
          conversationId,
          entry.from,
          `seed-${index}`,
          entry.sticker ? 'STICKER' : 'TEXT',
          entry.text ?? '',
          entry.sticker ?? null,
          createdAt,
        ],
      );
      await db().run(
        `INSERT INTO message_receipts (message_id, user_id, delivered_at, read_at) VALUES (?, ?, ?, ?)`,
        [messageId, sukhdev.id, createdAt, createdAt],
      );
      await db().run(
        `INSERT INTO message_receipts (message_id, user_id, delivered_at, read_at) VALUES (?, ?, ?, ?)`,
        [messageId, ruhi.id, createdAt, createdAt],
      );
    }
    await db().run('UPDATE conversations SET updated_at = ? WHERE id = ?', [now, conversationId]);
  }

  /* ---------------- notes ---------------- */
  const noteCount = await db().one<{ c: number }>('SELECT COUNT(*) AS c FROM notes WHERE owner_id = ?', [
    sukhdev.id,
  ]);
  if (Number(noteCount?.c ?? 0) === 0) {
    const notes = [
      {
        title: 'Our First Call 💖',
        body: 'That moment when we first\ntalked...',
        category: 'DAYS',
        image:
          `${base}/img/note-1.jpg`,
      },
      {
        title: 'Things I Love About You 🩷',
        body: 'Your voice\nYour laugh',
        category: 'ALL',
        image:
          `${base}/img/note-2.jpg`,
      },
      {
        title: 'Future Plans ✨',
        body: 'Travel together\nWatch movies\nCreate more memories...',
        category: 'PLAN',
        image:
          `${base}/img/note-3.jpg`,
      },
      {
        title: 'Special Days ❤️',
        body: 'Our moments\nOur happiness\nAlways together...',
        category: 'DAYS',
        image:
          `${base}/img/note-4.jpg`,
      },
    ];
    for (const [index, note] of notes.entries()) {
      await db().run(
        `INSERT INTO notes (id, owner_id, title, body, category, image_url, mood, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `note_seed_${index}`,
          sukhdev.id,
          note.title,
          note.body,
          note.category,
          note.image,
          null,
          new Date(Date.now() - (index + 1) * 2 * 86_400_000).toISOString(),
          now,
        ],
      );
    }
  }

  /* ---------------- call history ---------------- */
  const callCount = await db().one<{ c: number }>(
    'SELECT COUNT(*) AS c FROM call_sessions WHERE caller_id = ? OR callee_id = ?',
    [sukhdev.id, sukhdev.id],
  );
  if (Number(callCount?.c ?? 0) === 0) {
    const calls = [
      { kind: 'AUDIO', status: 'ENDED', mins: 12, caller: true },
      { kind: 'AUDIO', status: 'ENDED', mins: 4, caller: false },
      { kind: 'AUDIO', status: 'MISSED', mins: 0, caller: true },
      { kind: 'VIDEO', status: 'ENDED', mins: 28, caller: true },
      { kind: 'AUDIO', status: 'ENDED', mins: 9, caller: true },
      { kind: 'VIDEO', status: 'ENDED', mins: 17, caller: false },
    ];
    for (const [index, call] of calls.entries()) {
      const createdAt = new Date(Date.now() - (index + 1) * 86_400_000).toISOString();
      const startedAt = new Date(new Date(createdAt).getTime() + 20_000).toISOString();
      const endedAt =
        call.status === 'MISSED'
          ? null
          : new Date(new Date(startedAt).getTime() + call.mins * 60_000).toISOString();
      await db().run(
        `INSERT INTO call_sessions
           (id, caller_id, callee_id, call_type, status, started_at, connected_at, ended_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `call_seed_${index}`,
          call.caller ? sukhdev.id : ruhi.id,
          call.caller ? ruhi.id : sukhdev.id,
          call.kind,
          call.status,
          startedAt,
          call.status === 'MISSED' ? null : startedAt,
          endedAt,
          createdAt,
          createdAt,
        ],
      );
    }
  }

  /* ---------------- settings ---------------- */
  await db().run(
    `UPDATE user_settings SET theme = 'light', accent = 'violet', love_mode = 0, updated_at = ?
      WHERE user_id = ?`,
    [now, sukhdev.id],
  );

  log(
    {
      users: 2,
      conversation: conversationId,
      driver: db().dialect,
    },
    'seed complete',
  );
}

if (require.main === module) {
  seed()
    .then(async () => {
      console.log('✅ Seeded. Login with sukhdev@duora.app / love1234');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seed failed', err);
      process.exit(1);
    });
}
