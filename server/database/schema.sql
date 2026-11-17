PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    sec_q1_prompt TEXT NOT NULL DEFAULT 'What is your assigned tactical sector?',
    sec_q1_answer_hash TEXT NOT NULL,
    sec_q2_prompt TEXT NOT NULL DEFAULT 'Enter your cipher recovery codeword:',
    sec_q2_answer_hash TEXT NOT NULL,
    display_callsign TEXT NOT NULL,
    bio_motto TEXT DEFAULT 'Encrypted tunnel active.',
    avatar_preset TEXT DEFAULT 'visor',
    theme_accent TEXT DEFAULT 'default',
    operational_status TEXT DEFAULT 'ACTIVE // ONLINE',
    custom_avatar_url TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
    room_id TEXT PRIMARY KEY,
    room_name TEXT NOT NULL,
    description TEXT DEFAULT '',
    visibility TEXT CHECK(visibility IN ('PUBLIC', 'PRIVATE')) NOT NULL DEFAULT 'PUBLIC',
    passcode_hash TEXT,
    encryption_cipher TEXT DEFAULT 'AES-256-GCM + ECDH-P256',
    created_by INTEGER REFERENCES users(user_id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS room_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(user_id),
    ciphertext_b64 TEXT NOT NULL,
    iv_b64 TEXT NOT NULL,
    burn_after_seconds INTEGER DEFAULT 0,
    expires_at DATETIME,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public_keys (
    user_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    ecdh_public_key_jwk TEXT NOT NULL,
    key_fingerprint TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent ON messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_messages_expires ON messages(expires_at);
CREATE INDEX IF NOT EXISTS idx_room_members_room ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user ON room_members(user_id);
