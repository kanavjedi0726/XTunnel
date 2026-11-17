const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.VERCEL
    ? path.join('/tmp', 'xtunnel.sqlite')
    : path.join(__dirname, 'xtunnel.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const EMBEDDED_SCHEMA = `
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
`;

let db;

function createDbConnection() {
    try {
        const BetterSqlite = require('better-sqlite3');
        const instance = new BetterSqlite(DB_PATH);
        instance.pragma('journal_mode = WAL');
        instance.pragma('foreign_keys = ON');
        return instance;
    } catch (e) {
        const { DatabaseSync } = require('node:sqlite');
        const instance = new DatabaseSync(DB_PATH);
        instance.exec('PRAGMA journal_mode = WAL;');
        instance.exec('PRAGMA foreign_keys = ON;');
        instance.pragma = (pragmaStr) => {
            try {
                instance.exec(`PRAGMA ${pragmaStr};`);
            } catch (err) {}
        };
        return instance;
    }
}

function getDb() {
    if (!db) {
        db = createDbConnection();
        
        let schema = EMBEDDED_SCHEMA;
        try {
            if (fs.existsSync(SCHEMA_PATH)) {
                schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
            }
        } catch (e) {}
        
        db.exec(schema);
        seedDefaultRooms();
    }
    return db;
}

function seedDefaultRooms() {
    const database = db;
    const count = database.prepare('SELECT COUNT(*) as c FROM rooms').get();
    if (count && count.c > 0) return;
    
    const alphaPass = bcrypt.hashSync('ALPHA-99', 12);
    const omegaPass = bcrypt.hashSync('OMEGA-7', 12);

    const defaultRooms = [
        {
            room_id: 'global-relay-01',
            room_name: 'GLOBAL-RELAY-01',
            description: 'Open tactical mesh frequency for verified field operators. Automatic ECDH key exchange.',
            visibility: 'PUBLIC',
            passcode_hash: null
        },
        {
            room_id: 'netrunner-lounge',
            room_name: 'NETRUNNER-LOUNGE',
            description: 'Public cryptography research, zero-day defense intel, and mesh protocol testing.',
            visibility: 'PUBLIC',
            passcode_hash: null
        },
        {
            room_id: 'open-intel-hub',
            room_name: 'OPEN-INTEL-HUB',
            description: 'Decentralized OSINT feed and regional relay status broadcasts.',
            visibility: 'PUBLIC',
            passcode_hash: null
        },
        {
            room_id: 'cyber-ops-alpha',
            room_name: 'CYBER-OPS-ALPHA',
            description: 'Classified command & control node. Restricted to operators holding the Alpha cipher key.',
            visibility: 'PRIVATE',
            passcode_hash: alphaPass
        },
        {
            room_id: 'black-site-omega',
            room_name: 'BLACK-SITE-OMEGA',
            description: 'Ultra-secure darknet vault for high-priority incident response and ephemeral messaging.',
            visibility: 'PRIVATE',
            passcode_hash: omegaPass
        }
    ];
    
    const insertRoom = database.prepare(`
        INSERT OR IGNORE INTO rooms (room_id, room_name, description, visibility, passcode_hash)
        VALUES (?, ?, ?, ?, ?)
    `);
    
    for (const room of defaultRooms) {
        insertRoom.run(room.room_id, room.room_name, room.description, room.visibility, room.passcode_hash);
    }
    console.log('[DB] Default rooms initialized successfully.');
}

module.exports = { getDb };
