const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

async function hashPassword(password) {
    return bcrypt.hash(password, config.bcryptRounds);
}

async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

async function hashAnswer(answer) {
    return bcrypt.hash(answer.toLowerCase().trim(), config.bcryptRounds);
}

async function verifyAnswer(answer, hash) {
    return bcrypt.compare(answer.toLowerCase().trim(), hash);
}

function generateToken(payload) {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiry });
}

function verifyToken(token) {
    return jwt.verify(token, config.jwtSecret);
}

function generateRoomId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30) + '-' + uuidv4().slice(0, 6);
}

module.exports = { hashPassword, verifyPassword, hashAnswer, verifyAnswer, generateToken, verifyToken, generateRoomId };
