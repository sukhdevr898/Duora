-- Duora — SQLite schema (local dev / single instance)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id                TEXT PRIMARY KEY,
  email             TEXT NOT NULL UNIQUE,
  password_hash     TEXT NOT NULL,
  display_name      TEXT NOT NULL,
  avatar_url        TEXT,
  partner_nickname  TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS refresh_sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  user_agent  TEXT,
  ip          TEXT,
  expires_at  TEXT NOT NULL,
  revoked_at  TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_sessions(user_id);

CREATE TABLE IF NOT EXISTS devices (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  push_token  TEXT NOT NULL UNIQUE,
  platform    TEXT NOT NULL,
  device_id   TEXT,
  created_at  TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id);

CREATE TABLE IF NOT EXISTS pairings (
  id          TEXT PRIMARY KEY,
  user_a_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at  TEXT NOT NULL,
  unlinked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_pairings_a ON pairings(user_a_id, status);
CREATE INDEX IF NOT EXISTS idx_pairings_b ON pairings(user_b_id, status);

CREATE TABLE IF NOT EXISTS pairing_invitations (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  token         TEXT NOT NULL UNIQUE,
  created_by_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consumed_by_id TEXT REFERENCES users(id),
  status        TEXT NOT NULL DEFAULT 'PENDING',
  attempt_count INTEGER NOT NULL DEFAULT 0,
  expires_at    TEXT NOT NULL,
  used_at       TEXT,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON pairing_invitations(status, expires_at);

CREATE TABLE IF NOT EXISTS conversations (
  id          TEXT PRIMARY KEY,
  pairing_id  TEXT NOT NULL UNIQUE REFERENCES pairings(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at       TEXT NOT NULL,
  PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_participants_user ON conversation_participants(user_id);

CREATE TABLE IF NOT EXISTS messages (
  id                TEXT PRIMARY KEY,
  conversation_id   TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_message_id TEXT NOT NULL,
  type              TEXT NOT NULL DEFAULT 'TEXT',
  text              TEXT NOT NULL,
  sticker_id        TEXT,
  attachment_url    TEXT,
  reply_to_id       TEXT,
  deleted_for_all_at TEXT,
  created_at        TEXT NOT NULL,
  UNIQUE (conversation_id, client_message_id)
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS message_receipts (
  message_id   TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delivered_at TEXT,
  read_at      TEXT,
  PRIMARY KEY (message_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_receipts_user ON message_receipts(user_id, read_at);

CREATE TABLE IF NOT EXISTS hidden_messages (
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hidden_at  TEXT NOT NULL,
  PRIMARY KEY (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS reactions (
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS call_sessions (
  id           TEXT PRIMARY KEY,
  caller_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  callee_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  call_type    TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'RINGING',
  end_reason   TEXT,
  started_at   TEXT,
  connected_at TEXT,
  ended_at     TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_calls_caller ON call_sessions(caller_id, created_at);
CREATE INDEX IF NOT EXISTS idx_calls_callee ON call_sessions(callee_id, created_at);

CREATE TABLE IF NOT EXISTS presence (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  online      INTEGER NOT NULL DEFAULT 0,
  last_seen_at TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id               TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme                 TEXT NOT NULL DEFAULT 'system',
  accent                TEXT NOT NULL DEFAULT 'violet',
  love_mode             INTEGER NOT NULL DEFAULT 0,
  heart_motion          INTEGER NOT NULL DEFAULT 1,
  glass                 INTEGER NOT NULL DEFAULT 1,
  message_notifications INTEGER NOT NULL DEFAULT 1,
  call_notifications    INTEGER NOT NULL DEFAULT 1,
  ringtone              TEXT NOT NULL DEFAULT 'default',
  vibration             INTEGER NOT NULL DEFAULT 1,
  hide_preview          INTEGER NOT NULL DEFAULT 0,
  low_data              INTEGER NOT NULL DEFAULT 0,
  updated_at            TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id         TEXT PRIMARY KEY,
  owner_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL DEFAULT '',
  category   TEXT NOT NULL DEFAULT 'PLAN',
  image_url  TEXT,
  mood       TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notes_owner ON notes(owner_id, created_at);

CREATE TABLE IF NOT EXISTS special_days (
  id         TEXT PRIMARY KEY,
  owner_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  event_date TEXT NOT NULL,
  emoji      TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_days_owner ON special_days(owner_id);
