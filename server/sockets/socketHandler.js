const { verifySocketToken } = require('../middleware/authMiddleware');
const { getDb } = require('../database/db');

// Track online users: userId -> Set of socketIds
const userSockets = new Map();
// Track room online counts: roomId -> Set of userIds
const roomOnline = new Map();

function setupSocketHandler(io, app) {
    io.use(verifySocketToken);
    
    io.on('connection', (socket) => {
        const userId = socket.user.userId;
        const username = socket.user.username;
        
        // Track socket
        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);
        
        // Update app.locals for HTTP routes to check online status
        if (!app.locals.onlineUsers) app.locals.onlineUsers = new Set();
        app.locals.onlineUsers.add(userId);
        
        console.log(`[Socket] User ${username} (${userId}) connected. Socket: ${socket.id}`);
        
        socket.on('join-room', async ({ roomId }) => {
            try {
                const db = getDb();
                const isMember = db.prepare('SELECT id FROM room_members WHERE room_id = ? AND user_id = ?').get(roomId, userId);
                if (!isMember) {
                    socket.emit('error', { message: 'Not a member of this room.' });
                    return;
                }
                
                socket.join(roomId);
                
                if (!roomOnline.has(roomId)) roomOnline.set(roomId, new Set());
                roomOnline.get(roomId).add(userId);
                
                // Update online counts for HTTP routes
                if (!app.locals.onlineCounts) app.locals.onlineCounts = {};
                app.locals.onlineCounts[roomId] = roomOnline.get(roomId).size;
                
                // Get user info to broadcast
                const user = db.prepare('SELECT username, display_callsign, avatar_preset, custom_avatar_url FROM users WHERE user_id = ?').get(userId);
                
                // Notify room of new user
                socket.to(roomId).emit('user-joined', {
                    userId,
                    username: user.username,
                    displayCallsign: user.display_callsign,
                    avatarPreset: user.avatar_preset,
                    customAvatarUrl: user.custom_avatar_url || ''
                });
                
                // Send room user list
                const onlineUserIds = Array.from(roomOnline.get(roomId));
                const onlineMembers = onlineUserIds.map(uid => {
                    const u = db.prepare('SELECT user_id, username, display_callsign, avatar_preset, custom_avatar_url FROM users WHERE user_id = ?').get(uid);
                    return u ? { userId: u.user_id, username: u.username, displayCallsign: u.display_callsign, avatarPreset: u.avatar_preset, customAvatarUrl: u.custom_avatar_url || '' } : null;
                }).filter(Boolean);
                
                io.to(roomId).emit('room-users-updated', { roomId, onlineUsers: onlineMembers });
                
            } catch (err) {
                console.error('[Socket] join-room error:', err.message);
                socket.emit('error', { message: 'Failed to join room.' });
            }
        });
        
        socket.on('leave-room', ({ roomId }) => {
            socket.leave(roomId);
            if (roomOnline.has(roomId)) {
                roomOnline.get(roomId).delete(userId);
                if (app.locals.onlineCounts) {
                    app.locals.onlineCounts[roomId] = roomOnline.get(roomId).size;
                }
                io.to(roomId).emit('room-users-updated', {
                    roomId,
                    onlineUsers: Array.from(roomOnline.get(roomId))
                });
            }
            socket.to(roomId).emit('user-left', { userId, username });
        });
        
        socket.on('send-message', async ({ roomId, ciphertext_b64, iv_b64, burn_after_seconds }) => {
            try {
                if (!roomId || !ciphertext_b64 || !iv_b64) {
                    socket.emit('error', { message: 'Invalid message data.' });
                    return;
                }
                
                const db = getDb();
                
                // Verify membership
                const isMember = db.prepare('SELECT id FROM room_members WHERE room_id = ? AND user_id = ?').get(roomId, userId);
                if (!isMember) {
                    socket.emit('error', { message: 'Not a member of this room.' });
                    return;
                }
                
                const burnSeconds = parseInt(burn_after_seconds) || 0;
                const expiresAt = burnSeconds > 0 ? new Date(Date.now() + burnSeconds * 1000).toISOString().replace('T', ' ').slice(0, 19) : null;
                
                const result = db.prepare(`
                    INSERT INTO messages (room_id, sender_id, ciphertext_b64, iv_b64, burn_after_seconds, expires_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(roomId, userId, ciphertext_b64, iv_b64, burnSeconds, expiresAt);
                
                const user = db.prepare('SELECT username, display_callsign, avatar_preset, custom_avatar_url FROM users WHERE user_id = ?').get(userId);
                
                const messageData = {
                    messageId: result.lastInsertRowid,
                    roomId,
                    sender: {
                        userId,
                        username: user.username,
                        displayCallsign: user.display_callsign,
                        avatarPreset: user.avatar_preset,
                        customAvatarUrl: user.custom_avatar_url || ''
                    },
                    ciphertextB64: ciphertext_b64,
                    ivB64: iv_b64,
                    burnAfterSeconds: burnSeconds,
                    sentAt: new Date().toISOString()
                };
                
                // Broadcast to ALL members in the room (including sender for confirmation)
                io.to(roomId).emit('new-message', messageData);
                
            } catch (err) {
                console.error('[Socket] send-message error:', err.message);
                socket.emit('error', { message: 'Failed to send message.' });
            }
        });
        
        socket.on('typing', ({ roomId }) => {
            socket.to(roomId).emit('user-typing', { userId, username });
        });
        
        socket.on('stop-typing', ({ roomId }) => {
            socket.to(roomId).emit('user-stop-typing', { userId });
        });
        
        socket.on('update-public-key', ({ keyFingerprint }) => {
            // Broadcast to all rooms this user is in
            socket.rooms.forEach(roomId => {
                if (roomId !== socket.id) {
                    socket.to(roomId).emit('user-key-updated', { userId, username, keyFingerprint });
                }
            });
        });
        
        socket.on('disconnect', () => {
            const sockets = userSockets.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    userSockets.delete(userId);
                    if (app.locals.onlineUsers) {
                        app.locals.onlineUsers.delete(userId);
                    }
                }
            }
            
            // Remove from all rooms
            roomOnline.forEach((users, roomId) => {
                if (users.has(userId) && (!userSockets.has(userId) || userSockets.get(userId).size === 0)) {
                    users.delete(userId);
                    if (app.locals.onlineCounts) {
                        app.locals.onlineCounts[roomId] = users.size;
                    }
                    io.to(roomId).emit('user-left', { userId, username });
                    io.to(roomId).emit('room-users-updated', {
                        roomId,
                        onlineUsers: Array.from(users)
                    });
                }
            });
            
            console.log(`[Socket] User ${username} (${userId}) disconnected.`);
        });
    });
}

module.exports = { setupSocketHandler };
