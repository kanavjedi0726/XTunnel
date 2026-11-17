const { getDb } = require('../database/db');

function getMessages(req, res) {
    try {
        const { roomId } = req.params;
        const userId = req.user.userId;
        const limit = parseInt(req.query.limit) || 50;
        
        const db = getDb();
        
        // Check membership
        const isMember = db.prepare('SELECT id FROM room_members WHERE room_id = ? AND user_id = ?').get(roomId, userId);
        if (!isMember) {
            return res.status(403).json({ error: 'You are not a member of this room.' });
        }
        
        // Get messages - filter expired ones
        const messages = db.prepare(`
            SELECT m.message_id, m.ciphertext_b64, m.iv_b64, m.burn_after_seconds, m.sent_at,
                   u.user_id as sender_id, u.username as sender_username,
                   u.display_callsign as sender_callsign, u.avatar_preset as sender_avatar,
                   u.custom_avatar_url as sender_custom_avatar
            FROM messages m
            JOIN users u ON m.sender_id = u.user_id
            WHERE m.room_id = ?
            AND (m.expires_at IS NULL OR m.expires_at > datetime('now'))
            ORDER BY m.sent_at DESC
            LIMIT ?
        `).all(roomId, limit);
        
        res.json(messages.reverse().map(m => ({
            messageId: m.message_id,
            ciphertextB64: m.ciphertext_b64,
            ivB64: m.iv_b64,
            burnAfterSeconds: m.burn_after_seconds,
            sentAt: m.sent_at,
            sender: {
                userId: m.sender_id,
                username: m.sender_username,
                displayCallsign: m.sender_callsign,
                avatarPreset: m.sender_avatar,
                customAvatarUrl: m.sender_custom_avatar || ''
            }
        })));
    } catch (err) {
        console.error('[Messages] Get error:', err.message);
        res.status(500).json({ error: 'Failed to retrieve messages.' });
    }
}

function storeMessage(req, res) {
    try {
        const { roomId } = req.params;
        const userId = req.user.userId;
        const { ciphertext_b64, iv_b64, burn_after_seconds } = req.body;
        
        if (!ciphertext_b64 || !iv_b64) {
            return res.status(400).json({ error: 'ciphertext_b64 and iv_b64 are required.' });
        }
        
        const db = getDb();
        
        const isMember = db.prepare('SELECT id FROM room_members WHERE room_id = ? AND user_id = ?').get(roomId, userId);
        if (!isMember) {
            return res.status(403).json({ error: 'You are not a member of this room.' });
        }
        
        const burnSeconds = parseInt(burn_after_seconds) || 0;
        const expiresAt = burnSeconds > 0 ? new Date(Date.now() + burnSeconds * 1000).toISOString().replace('T', ' ').slice(0, 19) : null;
        
        const result = db.prepare(`
            INSERT INTO messages (room_id, sender_id, ciphertext_b64, iv_b64, burn_after_seconds, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(roomId, userId, ciphertext_b64, iv_b64, burnSeconds, expiresAt);
        
        res.status(201).json({ messageId: result.lastInsertRowid });
    } catch (err) {
        console.error('[Messages] Store error:', err.message);
        res.status(500).json({ error: 'Failed to store message.' });
    }
}

function cleanExpiredMessages() {
    try {
        const db = getDb();
        const result = db.prepare("DELETE FROM messages WHERE expires_at IS NOT NULL AND expires_at <= datetime('now')").run();
        if (result.changes > 0) {
            console.log(`[DB] Cleaned ${result.changes} expired message(s).`);
        }
    } catch (err) {
        console.error('[Messages] Cleanup error:', err.message);
    }
}

module.exports = { getMessages, storeMessage, cleanExpiredMessages };
