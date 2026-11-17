const { verifyToken } = require('../services/cryptoService');
const { getDb } = require('../database/db');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
        return res.status(401).json({ error: 'ACCESS DENIED: No authentication token provided.' });
    }
    
    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'ACCESS DENIED: Invalid or expired token.' });
    }
}

function verifySocketToken(socket, next) {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication required'));
    }
    try {
        const decoded = verifyToken(token);
        socket.user = decoded;
        next();
    } catch (err) {
        return next(new Error('Invalid or expired token'));
    }
}

module.exports = { authenticateToken, verifySocketToken };
