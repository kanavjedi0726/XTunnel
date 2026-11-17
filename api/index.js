process.env.VERCEL = '1';

let appHandler;
try {
    const { app } = require('../server/server');
    appHandler = app;
} catch (err) {
    console.error('Fatal initialization error:', err);
    appHandler = (req, res) => {
        res.status(500).json({
            error: 'Server Initialization Failure',
            message: err.message,
            stack: err.stack
        });
    };
}

module.exports = appHandler;
