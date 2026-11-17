const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'xtunnel.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

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
        
        // Run schema
        const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
        db.exec(schema);
        
        // Seed default rooms
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
