const { hashPassword, verifyPassword, hashAnswer, verifyAnswer, generateToken } = require('../services/cryptoService');
const { getDb } = require('../database/db');

function validateUsername(username) {
    return /^[a-zA-Z0-9_]{3,30}$/.test(username);
}

function validatePassword(password) {
    return password && password.length >= 8;
}

async function register(req, res) {
    try {
        const { username, password, sec_q1_answer, sec_q2_answer } = req.body;
        
        if (!username || !password || !sec_q1_answer || !sec_q2_answer) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        
        if (!validateUsername(username)) {
            return res.status(400).json({ error: 'Username must be 3-30 characters, alphanumeric and underscores only.' });
        }
        
        if (!validatePassword(password)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters.' });
        }
        
        if (sec_q1_answer.trim().length < 2 || sec_q2_answer.trim().length < 2) {
            return res.status(400).json({ error: 'Security answers must be at least 2 characters.' });
        }
        
        const db = getDb();
        const existing = db.prepare('SELECT user_id FROM users WHERE username = ?').get(username);
        if (existing) {
            return res.status(409).json({ error: 'Operator callsign already exists in database.' });
        }
        
        const [passwordHash, answerHash1, answerHash2] = await Promise.all([
            hashPassword(password),
            hashAnswer(sec_q1_answer),
            hashAnswer(sec_q2_answer)
        ]);
        
        const displayCallsign = username.toUpperCase();
        const result = db.prepare(`
            INSERT INTO users (username, password_hash, sec_q1_answer_hash, sec_q2_answer_hash, display_callsign)
            VALUES (?, ?, ?, ?, ?)
        `).run(username.toLowerCase(), passwordHash, answerHash1, answerHash2, displayCallsign);
        
        const userId = result.lastInsertRowid;
        const token = generateToken({ userId, username: username.toLowerCase() });
        
        res.status(201).json({
            token,
            user: {
                userId,
                username: username.toLowerCase(),
                displayCallsign,
                bioMotto: 'Encrypted tunnel active.',
                avatarPreset: 'visor',
                themeAccent: 'default',
                operationalStatus: 'ACTIVE // ONLINE',
                customAvatarUrl: ''
            }
        });
    } catch (err) {
        console.error('[Auth] Register error:', err.message);
        res.status(500).json({ error: 'Internal server error during registration.' });
    }
}

async function login(req, res) {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }
        
        const db = getDb();
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.toLowerCase());
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid operator callsign or password.' });
        }
        
        const valid = await verifyPassword(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid operator callsign or password.' });
        }
        
        // Return minimal info - no password hash, no answer hashes
        res.json({
            userId: user.user_id,
            username: user.username,
            sec_q1_prompt: user.sec_q1_prompt,
            sec_q2_prompt: user.sec_q2_prompt
        });
    } catch (err) {
        console.error('[Auth] Login error:', err.message);
        res.status(500).json({ error: 'Internal server error during login.' });
    }
}

async function verifySecurityQuestions(req, res) {
    try {
        const { username, sec_q1_answer, sec_q2_answer } = req.body;
        
        if (!username || !sec_q1_answer || !sec_q2_answer) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        
        const db = getDb();
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.toLowerCase());
        
        if (!user) {
            return res.status(401).json({ error: 'Operator not found.' });
        }
        
        const [valid1, valid2] = await Promise.all([
            verifyAnswer(sec_q1_answer, user.sec_q1_answer_hash),
            verifyAnswer(sec_q2_answer, user.sec_q2_answer_hash)
        ]);
        
        if (!valid1 || !valid2) {
            return res.status(401).json({ error: 'Security verification failed. Answers do not match database records.' });
        }
        
        const token = generateToken({ userId: user.user_id, username: user.username });
        
        res.json({
            token,
            user: {
                userId: user.user_id,
                username: user.username,
                displayCallsign: user.display_callsign,
                bioMotto: user.bio_motto,
                avatarPreset: user.avatar_preset,
                themeAccent: user.theme_accent,
                operationalStatus: user.operational_status,
                customAvatarUrl: user.custom_avatar_url || ''
            }
        });
    } catch (err) {
        console.error('[Auth] Security verify error:', err.message);
        res.status(500).json({ error: 'Internal server error during verification.' });
    }
}

function getProfile(req, res) {
    try {
        const db = getDb();
        const user = db.prepare('SELECT user_id, username, display_callsign, bio_motto, avatar_preset, theme_accent, operational_status, custom_avatar_url, created_at FROM users WHERE user_id = ?').get(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        
        res.json({
            userId: user.user_id,
            username: user.username,
            displayCallsign: user.display_callsign,
            bioMotto: user.bio_motto,
            avatarPreset: user.avatar_preset,
            themeAccent: user.theme_accent,
            operationalStatus: user.operational_status,
            customAvatarUrl: user.custom_avatar_url || '',
            createdAt: user.created_at
        });
    } catch (err) {
        console.error('[Auth] Get profile error:', err.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
}

module.exports = { register, login, verifySecurityQuestions, getProfile };
