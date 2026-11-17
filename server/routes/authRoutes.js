const express = require('express');
const router = express.Router();
const { register, login, verifySecurityQuestions, getProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/verify-security', authLimiter, verifySecurityQuestions);
router.get('/profile', authenticateToken, getProfile);

module.exports = router;
