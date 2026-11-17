const express = require('express');
const router = express.Router();
const { listRooms, createRoom, joinRoom, leaveRoom, getRoomMembers } = require('../controllers/roomController');
const { getMessages, storeMessage } = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, listRooms);
router.post('/', authenticateToken, createRoom);
router.post('/:roomId/join', authenticateToken, joinRoom);
router.delete('/:roomId/leave', authenticateToken, leaveRoom);
router.get('/:roomId/members', authenticateToken, getRoomMembers);

// Support /api/rooms/:roomId/messages
router.get('/:roomId/messages', authenticateToken, getMessages);
router.post('/:roomId/messages', authenticateToken, storeMessage);

module.exports = router;
