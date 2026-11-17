const { getDb } = require('../database/db');

async function updateProfile(req, res) {
    try {
        const userId = req.user.userId;
        const { displayCallsign, bioMotto, avatarPreset, themeAccent, operationalStatus, customAvatarUrl } = req.body;
        
        if (displayCallsign && displayCallsign.trim().length > 30) {
            return res.status(400).json({ error: 'Display callsign max 30 chars.' });
        }
        
        const db = getDb();
        db.prepare(`
            UPDATE users SET
                display_callsign = COALESCE(?, display_callsign),
                bio_motto = COALESCE(?, bio_motto),
                avatar_preset = COALESCE(?, avatar_preset),
                theme_accent = COALESCE(?, theme_accent),
                operational_status = COALESCE(?, operational_status),
                custom_avatar_url = COALESCE(?, custom_avatar_url),
                updated_at = datetime('now')
            WHERE user_id = ?
        `).run(
            displayCallsign ? displayCallsign.trim().toUpperCase() : null,
            bioMotto !== undefined ? bioMotto.trim() : null,
            avatarPreset || null,
            themeAccent || null,
            operationalStatus || null,
            customAvatarUrl !== undefined ? customAvatarUrl.trim() : null,
            userId
        );
        
        const user = db.prepare('SELECT user_id, username, display_callsign, bio_motto, avatar_preset, theme_accent, operational_status, custom_avatar_url FROM users WHERE user_id = ?').get(userId);
        
        res.json({
            userId: user.user_id,
            username: user.username,
            displayCallsign: user.display_callsign,
            bioMotto: user.bio_motto,
            avatarPreset: user.avatar_preset,
            themeAccent: user.theme_accent,
            operationalStatus: user.operational_status,
            customAvatarUrl: user.custom_avatar_url || ''
        });
    } catch (err) {
        console.error('[Profile] Update error:', err.message);
        res.status(500).json({ error: 'Failed to update profile.' });
    }
}

function updatePublicKey(req, res) {
    try {
        const userId = req.user.userId;
        const { ecdhPublicKeyJwk, keyFingerprint } = req.body;
        
        if (!ecdhPublicKeyJwk || !keyFingerprint) {
            return res.status(400).json({ error: 'ecdhPublicKeyJwk and keyFingerprint are required.' });
        }
        
        const db = getDb();
        db.prepare(`
            INSERT INTO public_keys (user_id, ecdh_public_key_jwk, key_fingerprint, updated_at)
            VALUES (?, ?, ?, datetime('now'))
            ON CONFLICT(user_id) DO UPDATE SET
                ecdh_public_key_jwk = excluded.ecdh_public_key_jwk,
                key_fingerprint = excluded.key_fingerprint,
                updated_at = datetime('now')
        `).run(userId, JSON.stringify(ecdhPublicKeyJwk), keyFingerprint);
        
        res.json({ success: true, keyFingerprint });
    } catch (err) {
        console.error('[Profile] PubKey update error:', err.message);
        res.status(500).json({ error: 'Failed to update public key.' });
    }
}

function getPublicKey(req, res) {
    try {
        const { userId } = req.params;
        const db = getDb();
        
        const key = db.prepare('SELECT ecdh_public_key_jwk, key_fingerprint, updated_at FROM public_keys WHERE user_id = ?').get(parseInt(userId));
        
        if (!key) {
            return res.status(404).json({ error: 'Public key not found for this user.' });
        }
        
        res.json({
            ecdhPublicKeyJwk: JSON.parse(key.ecdh_public_key_jwk),
            keyFingerprint: key.key_fingerprint,
            updatedAt: key.updated_at
        });
    } catch (err) {
        console.error('[Profile] Get pubkey error:', err.message);
        res.status(500).json({ error: 'Failed to retrieve public key.' });
    }
}

module.exports = { updateProfile, updatePublicKey, getPublicKey };
