const { getDb } = require('../database/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

function listRooms(req, res) {
    try {
        const db = getDb();
        const rooms = db.prepare(`
            SELECT r.room_id, r.room_name, r.description, r.visibility, r.encryption_cipher, r.created_at,
                   COUNT(DISTINCT rm.user_id) as member_count
            FROM rooms r
            LEFT JOIN room_members rm ON r.room_id = rm.room_id
            GROUP BY r.room_id
            ORDER BY r.created_at ASC
        `).all();
        
        // Get online counts from socket handler (passed via app.locals)
        const onlineCounts = req.app.locals.onlineCounts || {};
        
        res.json(rooms.map(r => ({
            roomId: r.room_id,
            roomName: r.room_name,
            description: r.description,
            visibility: r.visibility,
            encryptionCipher: r.encryption_cipher,
            memberCount: r.member_count,
            onlineCount: onlineCounts[r.room_id] || 0,
            createdAt: r.created_at
        })));
    } catch (err) {
        console.error('[Rooms] List error:', err.message);
        res.status(500).json({ error: 'Failed to retrieve rooms.' });
    }
}

async function createRoom(req, res) {
    try {
        const { roomName, description, visibility, passcode } = req.body;
        const userId = req.user.userId;
        
        if (!roomName || roomName.trim().length < 2) {
            return res.status(400).json({ error: 'Room name is required (min 2 chars).' });
        }
        
        if (!['PUBLIC', 'PRIVATE'].includes(visibility)) {
            return res.status(400).json({ error: 'Visibility must be PUBLIC or PRIVATE.' });
        }
        
        if (visibility === 'PRIVATE' && (!passcode || passcode.trim().length < 4)) {
            return res.status(400).json({ error: 'Private rooms require a passcode (min 4 chars).' });
        }
        
        const rawName = roomName.trim().toUpperCase().replace(/\s+/g, '-');
        const roomId = rawName.toLowerCase() + '-' + uuidv4().slice(0, 6);
        
        let passcodeHash = null;
        if (visibility === 'PRIVATE' && passcode) {
            passcodeHash = await bcrypt.hash(passcode.trim(), 12);
        }
        
        const db = getDb();
        db.prepare(`
            INSERT INTO rooms (room_id, room_name, description, visibility, passcode_hash, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(roomId, rawName, description || '', visibility, passcodeHash, userId);
        
        // Auto-join creator
        db.prepare('INSERT OR IGNORE INTO room_members (room_id, user_id) VALUES (?, ?)').run(roomId, userId);
        
        res.status(201).json({
            roomId,
            roomName: rawName,
            description: description || '',
            visibility,
            createdAt: new Date().toISOString()
        });
    } catch (err) {
        console.error('[Rooms] Create error:', err.message);
        res.status(500).json({ error: 'Failed to create room.' });
    }
}

async function joinRoom(req, res) {
    try {
        const { roomId } = req.params;
        const { passcode } = req.body;
        const userId = req.user.userId;
        
        const db = getDb();
        const room = db.prepare('SELECT * FROM rooms WHERE room_id = ?').get(roomId);
        
        if (!room) {
            return res.status(404).json({ error: 'Room not found.' });
        }
        
        if (room.visibility === 'PRIVATE') {
            if (!passcode) {
                return res.status(403).json({ error: 'Passcode required for private room.' });
            }
            const valid = await bcrypt.compare(passcode.trim(), room.passcode_hash);
            if (!valid) {
                return res.status(403).json({ error: 'Invalid room cipher passphrase. Access denied.' });
            }
        }
        
        db.prepare('INSERT OR IGNORE INTO room_members (room_id, user_id) VALUES (?, ?)').run(roomId, userId);
        
        res.json({ success: true, roomId, roomName: room.room_name, visibility: room.visibility });
    } catch (err) {
        console.error('[Rooms] Join error:', err.message);
        res.status(500).json({ error: 'Failed to join room.' });
    }
}

function leaveRoom(req, res) {
    try {
        const { roomId } = req.params;
        const userId = req.user.userId;
        
        const db = getDb();
        db.prepare('DELETE FROM room_members WHERE room_id = ? AND user_id = ?').run(roomId, userId);
        
        res.json({ success: true });
    } catch (err) {
        console.error('[Rooms] Leave error:', err.message);
        res.status(500).json({ error: 'Failed to leave room.' });
    }
}

function getRoomMembers(req, res) {
    try {
        const { roomId } = req.params;
        const userId = req.user.userId;
        
        const db = getDb();
        
        // Check membership
        const isMember = db.prepare('SELECT id FROM room_members WHERE room_id = ? AND user_id = ?').get(roomId, userId);
        if (!isMember) {
            return res.status(403).json({ error: 'You are not a member of this room.' });
        }
        
        const members = db.prepare(`
            SELECT u.user_id, u.username, u.display_callsign, u.avatar_preset, u.operational_status, u.custom_avatar_url
            FROM room_members rm
            JOIN users u ON rm.user_id = u.user_id
            WHERE rm.room_id = ?
        `).all(roomId);
        
        const onlineUsers = req.app.locals.onlineUsers || new Set();
        
        res.json(members.map(m => ({
            userId: m.user_id,
            username: m.username,
            displayCallsign: m.display_callsign,
            avatarPreset: m.avatar_preset,
            operationalStatus: m.operational_status,
            customAvatarUrl: m.custom_avatar_url || '',
            isOnline: onlineUsers.has(m.user_id)
        })));
    } catch (err) {
        console.error('[Rooms] Members error:', err.message);
        res.status(500).json({ error: 'Failed to retrieve members.' });
    }
}

module.exports = { listRooms, createRoom, joinRoom, leaveRoom, getRoomMembers };
