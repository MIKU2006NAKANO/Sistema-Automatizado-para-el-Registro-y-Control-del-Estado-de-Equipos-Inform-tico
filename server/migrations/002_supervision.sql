CREATE TABLE supervision_devices (
 id TEXT PRIMARY KEY, equipment_id TEXT NOT NULL UNIQUE REFERENCES equipment(id) ON DELETE CASCADE,
 token_hash TEXT NOT NULL UNIQUE, expires_at INTEGER NOT NULL
);
CREATE TABLE supervision_pair_codes (
 code_hash TEXT PRIMARY KEY, equipment_id TEXT NOT NULL UNIQUE REFERENCES equipment(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL
);
CREATE TABLE supervision_sessions (
 id TEXT PRIMARY KEY, equipment_id TEXT REFERENCES equipment(id) ON DELETE SET NULL,
 equipment_code TEXT NOT NULL, administrator_id TEXT REFERENCES users(id) ON DELETE SET NULL,
 administrator_name TEXT NOT NULL, requested_at TEXT NOT NULL, consented_at TEXT, ended_at TEXT,
 state TEXT NOT NULL, end_reason TEXT
);
CREATE INDEX supervision_session_dates ON supervision_sessions(requested_at DESC);
PRAGMA user_version=2;
