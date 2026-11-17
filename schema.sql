-- XTUNNEL Tactical E2EE Chat Database Schema (SQLite / MySQL compatible)
PRAGMA foreign_keys = ON;

-- 1. Operators (Users + Profile Customization + 2 Security Questions + Public Key)
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    sec_q1_prompt TEXT NOT NULL,
    sec_q1_answer_hash TEXT NOT NULL,
    sec_q2_prompt TEXT NOT NULL,
    sec_q2_answer_hash TEXT NOT NULL,
    display_callsign TEXT NOT NULL,
    bio_motto TEXT DEFAULT 'Encrypted tunnel active.',
    avatar_preset TEXT DEFAULT 'cyber-wolf',
    theme_accent TEXT DEFAULT '#ff1f2d',
    ecdh_public_key_jwk TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Servers / Channels (Public & Private Nodes)
CREATE TABLE IF NOT EXISTS servers (
    server_id TEXT PRIMARY KEY,
    server_name TEXT NOT NULL,
    description TEXT,
    visibility TEXT CHECK(visibility IN ('PUBLIC', 'PRIVATE')) NOT NULL,
    access_passcode_hash TEXT,
    encryption_cipher TEXT DEFAULT 'AES-256-GCM + ECDH-P256',
    created_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. End-to-End Encrypted Messages (Only Ciphertext + IV stored on server)
CREATE TABLE IF NOT EXISTS messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id TEXT NOT NULL REFERENCES servers(server_id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(user_id),
    ciphertext_b64 TEXT NOT NULL,
    iv_b64 TEXT NOT NULL,
    auth_tag_fingerprint TEXT NOT NULL,
    burn_after_seconds INTEGER DEFAULT 0,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
