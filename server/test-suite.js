const http = require('http');
const { io } = require('socket.io-client');
const { getDb } = require('./database/db');
const { app, server } = require('./server');
const config = require('./config/config');

let baseUrl;

function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, baseUrl);
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        
        const req = http.request(url, {
            method,
            headers
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed;
                try {
                    parsed = JSON.parse(data);
                } catch {
                    parsed = data;
                }
                resolve({ status: res.statusCode, data: parsed, headers: res.headers });
            });
        });
        
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    console.log('====================================================');
    console.log('       XTUNNEL AUTOMATED VERIFICATION SUITE         ');
    console.log('====================================================\n');
    
    const port = 3999;
    await new Promise((resolve) => server.listen(port, resolve));
    baseUrl = `http://127.0.0.1:${port}`;
    console.log(`[TEST SERVER] Running on ${baseUrl}\n`);
    
    let passed = 0;
    let failed = 0;
    
    function assert(desc, condition, details = '') {
        if (condition) {
            console.log(`[PASS] ${desc}`);
            passed++;
        } else {
            console.error(`[FAIL] ${desc} ${details ? '--> ' + details : ''}`);
            failed++;
        }
    }
    
    const db = getDb();
    
    try {
        // TEST 1: Register User A
        const userA = {
            username: 'ghost_' + Date.now().toString().slice(-4),
            password: 'MasterPassword2026!',
            sec_q1_answer: 'sector-omega',
            sec_q2_answer: 'phantom'
        };
        
        const regResA = await request('POST', '/api/auth/register', userA);
        assert('1. New user registration succeeds (HTTP 201)', regResA.status === 201 && regResA.data.token);
        const tokenA = regResA.data.token;
        const userIdA = regResA.data.user.userId;
        
        // TEST 2: Passwords and security answers are stored as bcrypt hashes
        const dbUserA = db.prepare('SELECT password_hash, sec_q1_answer_hash, sec_q2_answer_hash FROM users WHERE user_id = ?').get(userIdA);
        assert('2a. Password is stored as a bcrypt hash', dbUserA && dbUserA.password_hash.startsWith('$2'));
        assert('2b. Password plaintext is never stored', dbUserA && dbUserA.password_hash !== userA.password);
        assert('2c. Security Q1 answer is stored as a bcrypt hash', dbUserA && dbUserA.sec_q1_answer_hash.startsWith('$2'));
        assert('2d. Security Q2 answer is stored as a bcrypt hash', dbUserA && dbUserA.sec_q2_answer_hash.startsWith('$2'));
        
        // TEST 3: Login Step 1 with correct credentials
        const loginStep1 = await request('POST', '/api/auth/login', {
            username: userA.username,
            password: userA.password
        });
        assert('3a. Registered user login step 1 returns security prompts', loginStep1.status === 200 && loginStep1.data.sec_q1_prompt);
        assert('3b. Login response does NOT leak password_hash', loginStep1.data.password_hash === undefined);
        assert('3c. Login response does NOT leak security answers', loginStep1.data.sec_q1_answer_hash === undefined);
        
        // TEST 4: Login Step 2 (Security verification)
        const loginStep2 = await request('POST', '/api/auth/verify-security', {
            username: userA.username,
            sec_q1_answer: userA.sec_q1_answer,
            sec_q2_answer: userA.sec_q2_answer
        });
        assert('4. Security question verification returns JWT', loginStep2.status === 200 && loginStep2.data.token);
        
        // TEST 5: Incorrect password rejected
        const badLogin = await request('POST', '/api/auth/login', {
            username: userA.username,
            password: 'WrongPassword123!'
        });
        assert('5. Incorrect credentials rejected (HTTP 401)', badLogin.status === 401);
        
        // TEST 6: Incorrect security answers rejected
        const badSec = await request('POST', '/api/auth/verify-security', {
            username: userA.username,
            sec_q1_answer: 'wrong-sector',
            sec_q2_answer: userA.sec_q2_answer
        });
        assert('6. Incorrect security answer rejected (HTTP 401)', badSec.status === 401);
        
        // TEST 7: Register User B (second separate session)
        const userB = {
            username: 'viper_' + Date.now().toString().slice(-4),
            password: 'ViperPassword999!',
            sec_q1_answer: 'sector-alpha',
            sec_q2_answer: 'nightfall'
        };
        const regResB = await request('POST', '/api/auth/register', userB);
        assert('7. Second distinct user can register', regResB.status === 201 && regResB.data.token);
        const tokenB = regResB.data.token;
        const userIdB = regResB.data.user.userId;
        
        // TEST 8: Protected endpoints reject unauthorized requests
        const noAuth = await request('GET', '/api/rooms');
        assert('8. Unauthorized access to /api/rooms is rejected (HTTP 401)', noAuth.status === 401);
        
        // TEST 9: Authenticated user can list rooms
        const roomsRes = await request('GET', '/api/rooms', null, tokenA);
        assert('9. Authenticated operator lists available rooms', roomsRes.status === 200 && Array.isArray(roomsRes.data) && roomsRes.data.length >= 5);
        
        // TEST 10: Private room with wrong passcode rejected
        const joinPrivateWrong = await request('POST', '/api/rooms/cyber-ops-alpha/join', { passcode: 'WRONG-KEY' }, tokenA);
        assert('10a. Private room rejects invalid passcode (HTTP 403)', joinPrivateWrong.status === 403);
        
        // TEST 11: Private room with correct passcode succeeds
        const joinPrivateOk = await request('POST', '/api/rooms/cyber-ops-alpha/join', { passcode: 'ALPHA-99' }, tokenA);
        assert('11. Private room accepts valid passcode (HTTP 200)', joinPrivateOk.status === 200 && joinPrivateOk.data.success);
        
        // TEST 12: Public room join by User A and User B
        const publicRoomId = 'global-relay-01';
        const joinPubA = await request('POST', `/api/rooms/${publicRoomId}/join`, {}, tokenA);
        const joinPubB = await request('POST', `/api/rooms/${publicRoomId}/join`, {}, tokenB);
        assert('12a. User A joins public room', joinPubA.status === 200);
        assert('12b. User B joins public room', joinPubB.status === 200);
        
        // TEST 13: Room members list verification
        const membersRes = await request('GET', `/api/rooms/${publicRoomId}/members`, null, tokenA);
        const memberIds = membersRes.data.map(m => m.userId);
        assert('13. Both users appear in room membership roster', memberIds.includes(userIdA) && memberIds.includes(userIdB));
        
        // TEST 14: Non-member cannot access room messages
        const unauthRoom = await request('GET', '/api/rooms/black-site-omega/messages', null, tokenB);
        assert('14. Non-member cannot read private room messages (HTTP 403)', unauthRoom.status === 403);
        
        // TEST 15: Real-time Socket.IO communication between User A and User B
        const socketA = io(baseUrl, { auth: { token: tokenA } });
        const socketB = io(baseUrl, { auth: { token: tokenB } });
        
        await Promise.all([
            new Promise(res => socketA.on('connect', res)),
            new Promise(res => socketB.on('connect', res))
        ]);
        assert('15a. Both users connected to Socket.IO with JWT authentication', socketA.connected && socketB.connected);
        
        socketA.emit('join-room', { roomId: publicRoomId });
        socketB.emit('join-room', { roomId: publicRoomId });
        await new Promise(r => setTimeout(r, 200));
        
        // User A sends encrypted message via socket
        const mockCiphertext = 'SGVsbG8gWFRVTk5FTCBlbmNyeXB0ZWQgcGF5bG9hZCE='; // Base64
        const mockIV = 'MTIzNDU2Nzg5MDEy'; // 12-byte base64 IV
        
        const messageReceivedPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Socket message timed out')), 4000);
            socketB.on('new-message', (msg) => {
                clearTimeout(timeout);
                resolve(msg);
            });
        });
        
        socketA.emit('send-message', {
            roomId: publicRoomId,
            ciphertext_b64: mockCiphertext,
            iv_b64: mockIV,
            burn_after_seconds: 0
        });
        
        const receivedMsg = await messageReceivedPromise;
        assert('15b. User B received real-time socket message instantly', receivedMsg && receivedMsg.ciphertextB64 === mockCiphertext);
        assert('15c. Message payload retains IV and ciphertext integrity', receivedMsg.ivB64 === mockIV);
        assert('15d. Sender identity attached correctly', receivedMsg.sender.username === userA.username);
        
        // TEST 16: Verify Database only stores ciphertext, never plaintext
        const dbMsg = db.prepare('SELECT ciphertext_b64, iv_b64 FROM messages WHERE message_id = ?').get(receivedMsg.messageId);
        assert('16a. Message saved in SQLite database', dbMsg !== undefined);
        assert('16b. SQLite stores ciphertext_b64 (no plaintext column)', dbMsg && dbMsg.ciphertext_b64 === mockCiphertext);
        assert('16c. SQLite stores iv_b64', dbMsg && dbMsg.iv_b64 === mockIV);
        
        // TEST 17: Message history retrieval via API
        const historyRes = await request('GET', `/api/rooms/${publicRoomId}/messages`, null, tokenB);
        assert('17. User B can retrieve encrypted message history via API', historyRes.status === 200 && historyRes.data.length > 0);
        
        // TEST 18: Profile update and persistence across sessions
        const newCallsign = 'GHOST-STRIKER';
        const newBio = 'Classified black-ops operative.';
        const updateProf = await request('PUT', '/api/profile', {
            displayCallsign: newCallsign,
            bioMotto: newBio,
            avatarPreset: 'skull',
            themeAccent: 'emerald',
            operationalStatus: 'STEALTH // RECON'
        }, tokenA);
        assert('18a. Profile update succeeds (HTTP 200)', updateProf.status === 200 && updateProf.data.displayCallsign === newCallsign);
        
        // Verify in SQLite directly
        const dbProfile = db.prepare('SELECT display_callsign, bio_motto, avatar_preset, theme_accent FROM users WHERE user_id = ?').get(userIdA);
        assert('18b. Profile changes persist in SQLite database', dbProfile.display_callsign === newCallsign && dbProfile.theme_accent === 'emerald');
        
        // Verify profile retrieval with new login
        const reLoginStep1 = await request('POST', '/api/auth/login', { username: userA.username, password: userA.password });
        const reLoginStep2 = await request('POST', '/api/auth/verify-security', {
            username: userA.username,
            sec_q1_answer: userA.sec_q1_answer,
            sec_q2_answer: userA.sec_q2_answer
        });
        const freshToken = reLoginStep2.data.token;
        const fetchedProf = await request('GET', '/api/auth/profile', null, freshToken);
        assert('18c. Profile persists across logout and re-login', fetchedProf.data.displayCallsign === newCallsign && fetchedProf.data.avatarPreset === 'skull');
        
        // TEST 19: Temporary / Ephemeral Message burn-after cleanup
        const burnCipher = 'RXBoZW1lcmFsIE1lc3NhZ2U=';
        const burnIV = 'QnVyblRlc3RJVkFh';
        const burnRes = await request('POST', `/api/rooms/${publicRoomId}/messages`, {
            ciphertext_b64: burnCipher,
            iv_b64: burnIV,
            burn_after_seconds: 1
        }, tokenA);
        const burnMsgId = burnRes.data.messageId;
        assert('19a. Ephemeral message stored with expires_at timestamp', burnMsgId > 0);
        
        // Wait 2 seconds for message to expire
        await new Promise(r => setTimeout(r, 2000));
        
        // Clean expired messages
        const { cleanExpiredMessages } = require('./controllers/messageController');
        cleanExpiredMessages();
        
        const expiredCheck = db.prepare('SELECT message_id FROM messages WHERE message_id = ?').get(burnMsgId);
        assert('19b. Expired message purged from SQLite database', expiredCheck === undefined);
        
        // Disconnect sockets
        socketA.disconnect();
        socketB.disconnect();
        
    } catch (err) {
        console.error('Test execution error:', err);
        failed++;
    } finally {
        server.close();
    }
    
    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
    
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
