const express = require('express');
const router = express.Router();
const { getMessages, storeMessage } = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Supports /api/messages/:roomId and /api/messages/:roomId/messages
router.get('/:roomId', authenticateToken, getMessages);
router.post('/:roomId', authenticateToken, storeMessage);
router.get('/:roomId/messages', authenticateToken, getMessages);
router.post('/:roomId/messages', authenticateToken, storeMessage);

module.exports = router;
