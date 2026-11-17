require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'fallback_dev_secret_change_in_production',
    port: parseInt(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    bcryptRounds: 12,
    jwtExpiry: '24h'
};
