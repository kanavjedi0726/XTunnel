const express = require('express');
const router = express.Router();
const { updateProfile, updatePublicKey, getPublicKey } = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.put('/', authenticateToken, updateProfile);
router.put('/pubkey', authenticateToken, updatePublicKey);
router.get('/pubkey/:userId', authenticateToken, getPublicKey);

module.exports = router;
