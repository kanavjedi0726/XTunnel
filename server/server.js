require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const { getDb } = require('./database/db');
const { setupSocketHandler } = require('./sockets/socketHandler');
const { cleanExpiredMessages } = require('./controllers/messageController');

const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const messageRoutes = require('./routes/messageRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Initialize app.locals
app.locals.onlineCounts = {};
app.locals.onlineUsers = new Set();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve client static files
app.use(express.static(path.join(__dirname, '../client')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/profile', profileRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'XTUNNEL CORE ONLINE', timestamp: new Date().toISOString() });
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Setup Socket.IO
setupSocketHandler(io, app);

// Initialize database
getDb();

// Clean expired messages every 60 seconds
setInterval(cleanExpiredMessages, 60 * 1000);

// Start server
server.listen(config.port, () => {
    console.log(`\n╔══════════════════════════════════════════╗`);
    console.log(`║  XTUNNEL TACTICAL E2EE MESH ONLINE       ║`);
    console.log(`║  Port: ${config.port}  Mode: ${config.nodeEnv.toUpperCase().padEnd(12)}       ║`);
    console.log(`║  http://localhost:${config.port}                   ║`);
    console.log(`╚══════════════════════════════════════════╝\n`);
});

module.exports = { app, server };
