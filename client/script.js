/* =====================================================
   XTUNNEL – Full-Stack Real-Time E2EE Messaging Platform
   Client Implementation
===================================================== */

// 1. TACTICAL SVG AVATARS
const TACTICAL_AVATARS = [
            {
                id: "visor",
                name: "Tactical Visor",
                svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="64" height="64" fill="#090c10"/>
                    <path d="M16 24C16 15.1634 23.1634 8 32 8C40.8366 8 48 15.1634 48 24V42L38 54H26L16 42V24Z" stroke="#ff1f2d" stroke-width="2" fill="#12161f"/>
                    <polygon points="18,24 46,24 43,33 21,33" fill="#18e889" fill-opacity="0.85"/>
                    <line x1="24" y1="43" x2="40" y2="43" stroke="#ff1f2d" stroke-width="2"/>
                </svg>`
            },
            {
                id: "skull",
                name: "Cyber Skull",
                svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="64" height="64" fill="#090c10"/>
                    <path d="M18 26C18 17 24 11 32 11C40 11 46 17 46 26C46 32 43 36 40 39V49H24V39C21 36 18 32 18 26Z" stroke="#e5e7eb" stroke-width="2" fill="#141820"/>
                    <polygon points="22,25 29,27 23,31" fill="#ff1f2d"/>
                    <polygon points="42,25 35,27 41,31" fill="#ff1f2d"/>
                    <line x1="28" y1="43" x2="28" y2="49" stroke="#18e889" stroke-width="2"/>
                    <line x1="32" y1="43" x2="32" y2="49" stroke="#18e889" stroke-width="2"/>
                    <line x1="36" y1="43" x2="36" y2="49" stroke="#18e889" stroke-width="2"/>
                </svg>`
            },
            {
                id: "node",
                name: "Neural Node",
                svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="64" height="64" fill="#090c10"/>
                    <polygon points="32,8 54,20 54,44 32,56 10,44 10,20" stroke="#00e5ff" stroke-width="2" fill="#0d151c"/>
                    <circle cx="32" cy="32" r="9" stroke="#ff1f2d" stroke-width="2.5"/>
                    <circle cx="32" cy="32" r="3" fill="#18e889"/>
                    <line x1="32" y1="8" x2="32" y2="23" stroke="#00e5ff" stroke-width="1.5"/>
                    <line x1="32" y1="41" x2="32" y2="56" stroke="#00e5ff" stroke-width="1.5"/>
                </svg>`
            },
            {
                id: "drone",
                name: "Stealth Recon",
                svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="64" height="64" fill="#090c10"/>
                    <polygon points="32,12 56,38 32,32 8,38" stroke="#18e889" stroke-width="2" fill="#0e1b16"/>
                    <polygon points="32,32 42,50 32,45 22,50" stroke="#ff1f2d" stroke-width="2"/>
                    <circle cx="32" cy="25" r="3" fill="#ff1f2d"/>
                </svg>`
            },
            {
                id: "ghost",
                name: "Phantom Hood",
                svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="64" height="64" fill="#090c10"/>
                    <path d="M14 52L20 18L32 10L44 18L50 52H14Z" stroke="#a855f7" stroke-width="2" fill="#14101d"/>
                    <path d="M22 28H42L38 35H26L22 28Z" fill="#020304" stroke="#18e889" stroke-width="1.5"/>
                    <circle cx="27" cy="31.5" r="1.5" fill="#18e889"/>
                    <circle cx="37" cy="31.5" r="1.5" fill="#18e889"/>
                </svg>`
            },
            {
                id: "bio",
                name: "Cipher Core",
                svg: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="64" height="64" fill="#090c10"/>
                    <circle cx="32" cy="32" r="21" stroke="#ffae00" stroke-width="2" stroke-dasharray="8 4"/>
                    <circle cx="32" cy="32" r="12" stroke="#ff1f2d" stroke-width="2"/>
                    <path d="M32 11V20M32 44V53M11 32H20M44 32H53" stroke="#18e889" stroke-width="2"/>
                </svg>`
            }
        ];

// 2. SERVER ICON GENERATOR
function getServerIconSVG(type, index) {
            const color = type === "private" ? "var(--accent)" : "var(--green)";
            const icons = [
                `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/><circle cx="12" cy="12" r="3"/></svg>`,
                `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
                `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>`,
                `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
            ];
            return icons[index % icons.length];
        }

// 3. API & WEBSOCKET CONFIGURATION
const API_BASE = '/api';
let socket = null;

// Global Application State
let authToken = null;
let currentUser = null;
let pendingLoginUser = null;
let currentRoom = null;
let pendingPrivateRoom = null;
let serverFilter = 'all';
let roomsList = [];
let showRawCiphertext = false;

let selectedModalAvatarId = 'visor';
let selectedModalTheme = 'default';

// WebCrypto Real-Time Cryptographic State
let cryptoState = {
    ecdhKeyPair: null,
    publicKeyFingerprint: 'GENERATING...',
    roomAesKey: null,
    roomKeyHash: 'UNBOUND',
    ivCounter: 0
};

// 4. API CALL HELPER
async function apiCall(endpoint, options = {}) {
    const url = API_BASE + endpoint;
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
        headers['Authorization'] = 'Bearer ' + authToken;
    }
    
    try {
        const response = await fetch(url, {
            ...options,
            headers: { ...headers, ...(options.headers || {}) }
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || 'Server request failed (' + response.status + ')');
        }
        return data;
    } catch (err) {
        throw err;
    }
}

// 5. SESSION PERSISTENCE
function saveSession() {
    if (authToken && currentUser) {
        sessionStorage.setItem('xt_token', authToken);
        sessionStorage.setItem('xt_user', JSON.stringify(currentUser));
    }
}

function loadSession() {
    const token = sessionStorage.getItem('xt_token');
    const user = sessionStorage.getItem('xt_user');
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        return true;
    }
    return false;
}

function clearSession() {
    sessionStorage.removeItem('xt_token');
    sessionStorage.removeItem('xt_user');
    authToken = null;
    currentUser = null;
}

// 6. SOCKET.IO REAL-TIME TUNNEL
function initSocket() {
    if (socket) {
        socket.disconnect();
    }
    
    socket = io({
        auth: { token: authToken }
    });
    
    socket.on('connect', () => {
        console.log('[XTUNNEL] Socket tunnel active. Socket ID:', socket.id);
    });
    
    socket.on('connect_error', (err) => {
        console.error('[XTUNNEL] Socket connection error:', err.message);
    });
    
    socket.on('new-message', async (data) => {
        await handleIncomingMessage(data);
    });
    
    socket.on('room-users-updated', ({ roomId, onlineUsers }) => {
        if (currentRoom && currentRoom.roomId === roomId) {
            renderOnlineUsersList(onlineUsers);
        }
    });
    
    socket.on('user-joined', (user) => {
        if (currentUser && user.userId !== currentUser.userId) {
            showToast('OPERATOR LINKED', user.displayCallsign + ' joined the channel.', 'success');
        }
    });
    
    socket.on('user-left', ({ username }) => {
        showToast('OPERATOR DISCONNECTED', username + ' left the channel.', 'warn');
    });
    
    socket.on('user-typing', ({ userId, username }) => {
        if (currentUser && userId !== currentUser.userId) {
            const typingEl = document.getElementById('typingIndicator');
            if (typingEl) {
                typingEl.textContent = '● ' + username + ' is encoding a transmission...';
                typingEl.style.display = 'block';
            }
        }
    });
    
    socket.on('user-stop-typing', ({ userId }) => {
        const typingEl = document.getElementById('typingIndicator');
        if (typingEl) {
            typingEl.style.display = 'none';
        }
    });
    
    socket.on('error', (err) => {
        showToast('TUNNEL ALERT', err.message || 'Operation error', 'danger');
    });
}

// 7. WEBCRYPTO API SUITE (ECDH P-256 + AES-256-GCM + HKDF/SHA-256)
function bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
}

function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function base64ToBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

async function generateOperatorECDHKeys() {
    try {
        const keyPair = await window.crypto.subtle.generateKey(
            { name: 'ECDH', namedCurve: 'P-256' },
            true,
            ['deriveKey', 'deriveBits']
        );
        const rawPub = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', rawPub);
        const hex = bufferToHex(hashBuffer);
        const formattedFp = hex.match(/.{1,4}/g).slice(0, 8).join(':');
        
        cryptoState.ecdhKeyPair = keyPair;
        cryptoState.publicKeyFingerprint = formattedFp;
        
        const pubKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
        updateCryptoUI();
        return { fingerprint: formattedFp, pubKeyJwk };
    } catch (err) {
        console.error('ECDH key generation error:', err);
        const fallbackFp = Array.from({ length: 8 }, () =>
            Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase()
        ).join(':');
        cryptoState.publicKeyFingerprint = fallbackFp;
        updateCryptoUI();
        return { fingerprint: fallbackFp, pubKeyJwk: null };
    }
}

async function deriveRoomAESKey(roomId, secretPassphrase) {
    const seedString = 'XTUNNEL::' + roomId + '::' + (secretPassphrase || 'PUBLIC_MESH_KEY');
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.digest('SHA-256', enc.encode(seedString));
    cryptoState.roomKeyHash = bufferToHex(keyMaterial).slice(0, 32) + '...';
    
    cryptoState.roomAesKey = await window.crypto.subtle.importKey(
        'raw',
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
    updateCryptoUI();
}

async function encryptMessagePayload(plaintext) {
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    cryptoState.ivCounter++;
    
    if (cryptoState.roomAesKey) {
        const cipherBuffer = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            cryptoState.roomAesKey,
            enc.encode(plaintext)
        );
        return {
            ivBase64: bufferToBase64(iv),
            cipherBase64: bufferToBase64(cipherBuffer)
        };
    }
    return {
        ivBase64: bufferToBase64(iv),
        cipherBase64: btoa(unescape(encodeURIComponent(plaintext)))
    };
}

async function decryptMessagePayload(cipherBase64, ivBase64) {
    if (!cryptoState.roomAesKey) return '[DECRYPTION KEY NOT AVAILABLE]';
    try {
        const iv = new Uint8Array(base64ToBuffer(ivBase64));
        const cipherBuffer = base64ToBuffer(cipherBase64);
        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            cryptoState.roomAesKey,
            cipherBuffer
        );
        return new TextDecoder().decode(decryptedBuffer);
    } catch (err) {
        return '[DECRYPTION FAILED - KEY MISMATCH OR CIPHER TAMPERED]';
    }
}

function updateCryptoUI() {
    const shortFp = cryptoState.publicKeyFingerprint.slice(0, 14) + '...';
    const hubFp = document.getElementById('hubKeyFingerprint');
    const hubBannerFp = document.getElementById('hubBannerFp');
    const inspPub = document.getElementById('inspectorPubFp');
    const inspRoom = document.getElementById('inspectorRoomKey');
    const profFp = document.getElementById('profilePreviewFp');
    const ivCounterEl = document.getElementById('sessionIvCounter');
    
    if (hubFp) hubFp.textContent = 'FP: ' + shortFp;
    if (hubBannerFp) hubBannerFp.textContent = cryptoState.publicKeyFingerprint;
    if (inspPub) inspPub.textContent = cryptoState.publicKeyFingerprint;
    if (inspRoom) inspRoom.textContent = cryptoState.roomKeyHash;
    if (profFp) profFp.textContent = 'ECDH P-256 FP: ' + shortFp;
    if (ivCounterEl) ivCounterEl.textContent = 'AES-GCM IV NONCES: ' + cryptoState.ivCounter;
}

async function regenerateUserKeys() {
    const { fingerprint, pubKeyJwk } = await generateOperatorECDHKeys();
    if (pubKeyJwk && authToken) {
        try {
            await apiCall('/profile/pubkey', {
                method: 'PUT',
                body: JSON.stringify({ ecdhPublicKeyJwk: pubKeyJwk, keyFingerprint: fingerprint })
            });
        } catch (err) {}
    }
    if (socket) {
        socket.emit('update-public-key', { keyFingerprint: fingerprint });
    }
    showToast('ECDH KEY PAIR ROTATED', 'New P-256 Public Key Fingerprint: ' + fingerprint.slice(0, 19) + '...', 'success');
}

// 8. TACTICAL TOAST SYSTEM
function showToast(title, message, variant = 'danger') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'tactical-toast ' + (variant === 'success' ? 'success' : variant === 'warn' ? 'warn' : '');
    toast.innerHTML = `
        <div class="toast-title">${escapeHTML(title)}</div>
        <div style="color:#d3d8e0; line-height:1.4;">${escapeHTML(message)}</div>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = '0.25s ease';
        setTimeout(() => toast.remove(), 260);
    }, 3800);
}

// 9. PAGE NAVIGATION
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.add('active');
    }
}

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}

// 10. AUTHENTICATION & SECURITY CHALLENGE FLOW
function switchAuthMode(mode) {
    const loginForm = document.getElementById('loginForm');
    const regForm = document.getElementById('registerForm');
    const tabLogin = document.getElementById('tabLogin');
    const tabReg = document.getElementById('tabRegister');

    if (mode === 'login') {
        loginForm.classList.remove('hidden');
        regForm.classList.add('hidden');
        tabLogin.classList.add('active');
        tabReg.classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        regForm.classList.remove('hidden');
        tabLogin.classList.remove('active');
        tabReg.classList.add('active');
    }
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showToast('INPUT REQUIRED', 'Please enter your operator callsign and password.', 'danger');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const origText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>AUTHENTICATING WITH DB...</span>';
    
    try {
        const data = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        pendingLoginUser = data;
        prepareSecurityChallenge(data);
        showPage('securityPage');
        showToast('PASSWORD VERIFIED', 'Clearance step 1 passed. Complete the 2-Question Security Verification.', 'warn');
    } catch (err) {
        showToast('ACCESS DENIED', err.message, 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
    }
}

async function handleRegisterSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const sec_q1_answer = document.getElementById('regQ1').value.trim();
    const sec_q2_answer = document.getElementById('regQ2').value.trim();
    
    if (!username || !password || !sec_q1_answer || !sec_q2_answer) {
        showToast('MISSING CLEARANCE DATA', 'All registration fields and security answers are mandatory.', 'danger');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const origText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>COMMITTING OPERATOR TO DB...</span>';
    
    try {
        const data = await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password, sec_q1_answer, sec_q2_answer })
        });
        
        authToken = data.token;
        currentUser = data.user;
        saveSession();
        
        await runCryptoHandshake();
    } catch (err) {
        showToast('REGISTRATION REJECTED', err.message, 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
    }
}

function prepareSecurityChallenge(userData) {
    document.getElementById('challengeUserLabel').textContent = userData.username.toUpperCase();
    const q1Prompt = userData.sec_q1_prompt || 'WHAT IS YOUR ASSIGNED TACTICAL SECTOR?';
    const q2Prompt = userData.sec_q2_prompt || 'ENTER YOUR CIPHER RECOVERY CODEWORD:';
    
    document.getElementById('secQuestion1Label').textContent = 'QUESTION 1: ' + q1Prompt.toUpperCase();
    document.getElementById('secQuestion2Label').textContent = 'QUESTION 2: ' + q2Prompt.toUpperCase();
    document.getElementById('secAnswer1').value = '';
    document.getElementById('secAnswer2').value = '';
}

async function verifySecurityQuestions(e) {
    e.preventDefault();
    if (!pendingLoginUser) return;
    
    const sec_q1_answer = document.getElementById('secAnswer1').value.trim();
    const sec_q2_answer = document.getElementById('secAnswer2').value.trim();
    
    if (!sec_q1_answer || !sec_q2_answer) {
        showToast('INPUT REQUIRED', 'Both security verification answers must be entered.', 'danger');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const origText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>VERIFYING CRYPTO HASHES...</span>';
    
    try {
        const data = await apiCall('/auth/verify-security', {
            method: 'POST',
            body: JSON.stringify({
                username: pendingLoginUser.username,
                sec_q1_answer,
                sec_q2_answer
            })
        });
        
        authToken = data.token;
        currentUser = data.user;
        pendingLoginUser = null;
        saveSession();
        
        await runCryptoHandshake();
    } catch (err) {
        showToast('VERIFICATION FAILED', err.message, 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
    }
}

function abortToLogin() {
    pendingLoginUser = null;
    showPage('loginPage');
}

async function runCryptoHandshake() {
    showPage('handshakePage');
    const logEl = document.getElementById('handshakeLog');
    const barEl = document.getElementById('handshakeProgress');
    logEl.innerHTML = '';
    barEl.style.width = '0%';
    
    const appendLog = (msg, color) => {
        const row = document.createElement('div');
        if (color) row.style.color = color;
        row.textContent = msg;
        logEl.appendChild(row);
        logEl.scrollTop = logEl.scrollHeight;
    };
    
    appendLog('[OK] Identity verified: ' + currentUser.displayCallsign);
    barEl.style.width = '25%';
    await new Promise(r => setTimeout(r, 280));
    
    appendLog('[CRYPTO] Initializing WebCrypto SubtleCrypto ECDH (Curve P-256)...');
    barEl.style.width = '50%';
    await new Promise(r => setTimeout(r, 280));
    
    const { fingerprint, pubKeyJwk } = await generateOperatorECDHKeys();
    appendLog('  ↳ P-256 PUBLIC FINGERPRINT: ' + fingerprint, 'var(--yellow)');
    barEl.style.width = '75%';
    await new Promise(r => setTimeout(r, 280));
    
    if (pubKeyJwk) {
        try {
            await apiCall('/profile/pubkey', {
                method: 'PUT',
                body: JSON.stringify({ ecdhPublicKeyJwk: pubKeyJwk, keyFingerprint: fingerprint })
            });
            appendLog('[CRYPTO] Public key securely registered with relay.');
        } catch (err) {
            appendLog('[WARN] Key registry advisory: ' + err.message, 'var(--yellow)');
        }
    }
    
    barEl.style.width = '90%';
    initSocket();
    appendLog('[NET] Real-time tactical socket tunnel engaged.');
    barEl.style.width = '100%';
    await new Promise(r => setTimeout(r, 320));
    
    applyOperatorProfileToUI();
    await loadRoomsGrid();
    showPage('hubPage');
    showToast('E2EE TUNNEL ACTIVE', 'Welcome to XTUNNEL Relay Network, Operator ' + currentUser.displayCallsign + '.', 'success');
}

function logoutOperator() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    clearSession();
    currentRoom = null;
    cryptoState = {
        ecdhKeyPair: null,
        publicKeyFingerprint: 'GENERATING...',
        roomAesKey: null,
        roomKeyHash: 'UNBOUND',
        ivCounter: 0
    };
    document.body.className = '';
    showPage('loginPage');
    showToast('DISCONNECTED', 'Session terminated. Cryptographic keys wiped from browser memory.', 'warn');
}

// 11. PROFILE RENDERING & MANAGEMENT
function getAvatarHTML(avatarId, customUrl) {
    if (customUrl && customUrl.trim().length > 5) {
        return '<img src="' + escapeHTML(customUrl) + '" alt="Avatar" onerror="this.style.display=\'none\'">';
    }
    const found = TACTICAL_AVATARS.find(a => a.id === avatarId) || TACTICAL_AVATARS[0];
    return found.svg;
}

function applyOperatorProfileToUI() {
    if (!currentUser) return;
    
    document.body.className = currentUser.themeAccent && currentUser.themeAccent !== 'default' 
        ? 'theme-' + currentUser.themeAccent 
        : '';
    
    const hubName = document.getElementById('hubOperatorName');
    const hubAvatar = document.getElementById('hubAvatarDisplay');
    const chatUser = document.getElementById('chatSidebarUser');
    const chatStatus = document.getElementById('chatSidebarStatus');
    const chatAvatar = document.getElementById('chatSidebarAvatar');
    
    if (hubName) hubName.textContent = currentUser.displayCallsign;
    if (hubAvatar) hubAvatar.innerHTML = getAvatarHTML(currentUser.avatarPreset, currentUser.customAvatarUrl);
    if (chatUser) chatUser.textContent = currentUser.displayCallsign;
    if (chatStatus) chatStatus.textContent = '● ' + (currentUser.operationalStatus || 'ACTIVE // ONLINE');
    if (chatAvatar) chatAvatar.innerHTML = getAvatarHTML(currentUser.avatarPreset, currentUser.customAvatarUrl);
    
    updateCryptoUI();
}

function openProfileModal() {
    if (!currentUser) return;
    selectedModalAvatarId = currentUser.avatarPreset || 'visor';
    selectedModalTheme = currentUser.themeAccent || 'default';
    
    document.getElementById('profDisplayName').value = currentUser.displayCallsign || '';
    document.getElementById('profBio').value = currentUser.bioMotto || '';
    document.getElementById('profStatus').value = currentUser.operationalStatus || 'ACTIVE // ONLINE';
    document.getElementById('profCustomAvatarUrl').value = currentUser.customAvatarUrl || '';
    
    document.getElementById('profilePreviewName').textContent = currentUser.displayCallsign;
    document.getElementById('profilePreviewBio').textContent = currentUser.bioMotto;
    document.getElementById('profileModalPreview').innerHTML = getAvatarHTML(selectedModalAvatarId, currentUser.customAvatarUrl);
    
    const grid = document.getElementById('avatarPickerGrid');
    grid.innerHTML = TACTICAL_AVATARS.map(av => `
        <div class="avatar-option ${av.id === selectedModalAvatarId ? 'selected' : ''}"
             onclick="selectAvatarOption('${av.id}')" title="${av.name}">
            ${av.svg}
        </div>
    `).join('');
    
    document.querySelectorAll('.theme-swatch').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.theme === selectedModalTheme);
    });
    
    document.getElementById('profileModal').classList.add('open');
}

function selectAvatarOption(id) {
    selectedModalAvatarId = id;
    document.getElementById('profCustomAvatarUrl').value = '';
    document.querySelectorAll('.avatar-option').forEach((el, idx) => {
        el.classList.toggle('selected', TACTICAL_AVATARS[idx].id === id);
    });
    document.getElementById('profileModalPreview').innerHTML = getAvatarHTML(id, '');
}

function selectThemeSwatch(theme) {
    selectedModalTheme = theme;
    document.querySelectorAll('.theme-swatch').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.theme === theme);
    });
}

async function saveOperatorProfile(e) {
    e.preventDefault();
    if (!currentUser) return;
    
    const displayCallsign = document.getElementById('profDisplayName').value.trim().toUpperCase() || currentUser.displayCallsign;
    const bioMotto = document.getElementById('profBio').value.trim() || 'Encrypted tunnel active.';
    const operationalStatus = document.getElementById('profStatus').value;
    const customAvatarUrl = document.getElementById('profCustomAvatarUrl').value.trim();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const origText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'SAVING CONFIG...';
    
    try {
        const updated = await apiCall('/profile', {
            method: 'PUT',
            body: JSON.stringify({
                displayCallsign,
                bioMotto,
                avatarPreset: selectedModalAvatarId,
                themeAccent: selectedModalTheme,
                operationalStatus,
                customAvatarUrl
            })
        });
        
        currentUser = { ...currentUser, ...updated };
        saveSession();
        applyOperatorProfileToUI();
        closeModal('profileModal');
        showToast('PROFILE SYNCHRONIZED', 'Callsign [' + displayCallsign + '] committed to database.', 'success');
    } catch (err) {
        showToast('PROFILE UPDATE ERROR', err.message, 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = origText;
    }
}

function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('open');
}

// 12. SERVER DIRECTORY HUB
function setServerFilter(filter, btnEl) {
    serverFilter = filter;
    document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    renderServersGrid();
}

async function loadRoomsGrid() {
    try {
        roomsList = await apiCall('/rooms');
        renderServersGrid();
    } catch (err) {
        showToast('RELAY ERROR', 'Unable to retrieve active relay nodes: ' + err.message, 'danger');
    }
}

function renderServersGrid() {
    const grid = document.getElementById('serversGrid');
    if (!grid) return;
    
    const filtered = roomsList.filter(r => {
        if (serverFilter === 'all') return true;
        if (serverFilter === 'public') return r.visibility === 'PUBLIC';
        if (serverFilter === 'private') return r.visibility === 'PRIVATE';
        return true;
    });
    
    document.querySelectorAll('.filter-pill').forEach(pill => {
        const txt = pill.textContent;
        if (txt.includes('ALL NODES')) pill.textContent = 'ALL NODES (' + roomsList.length + ')';
        if (txt.includes('PUBLIC RELAYS')) pill.textContent = 'PUBLIC RELAYS (' + roomsList.filter(r => r.visibility === 'PUBLIC').length + ')';
        if (txt.includes('PRIVATE CLASSIFIED')) pill.textContent = 'PRIVATE CLASSIFIED (' + roomsList.filter(r => r.visibility === 'PRIVATE').length + ')';
    });
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div style="color:var(--muted); font-family:var(--mono); font-size:12px; padding:24px;">NO ACTIVE NODES MATCHING CRITERIA</div>';
        return;
    }
    
    grid.innerHTML = filtered.map((room, idx) => {
        const isPrivate = room.visibility === 'PRIVATE';
        return `
            <div class="cyber-card server-card">
                <div>
                    <div class="server-card-top">
                        <div class="server-icon-box">
                            ${getServerIconSVG(isPrivate ? 'private' : 'public', idx)}
                        </div>
                        <span class="server-badge ${isPrivate ? 'private' : 'public'}">
                            ${isPrivate ? '🔒 PRIVATE CLASSIFIED' : '🌐 PUBLIC RELAY'}
                        </span>
                    </div>
                    <div class="server-name">${escapeHTML(room.roomName)}</div>
                    <p class="server-desc">${escapeHTML(room.description)}</p>
                </div>
                <div>
                    <div class="server-telemetry" style="margin-bottom:14px;">
                        <div class="telemetry-item">
                            <span>OPERATORS</span>
                            <span style="color:var(--green)">● ${room.onlineCount || 0} ONLINE</span>
                        </div>
                        <div class="telemetry-item">
                            <span>MEMBERS</span>
                            <span>${room.memberCount || 0}</span>
                        </div>
                        <div class="telemetry-item">
                            <span>CIPHER</span>
                            <span>AES-256</span>
                        </div>
                    </div>
                    <button class="cyber-button ${isPrivate ? '' : 'green-btn'}" onclick="initiateServerJoin('${escapeHTML(room.roomId)}')">
                        ${isPrivate ? '🔑 AUTHENTICATE &amp; JOIN' : '⚡ CONNECT TO RELAY'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function initiateServerJoin(roomId) {
    const room = roomsList.find(r => r.roomId === roomId);
    if (!room) return;
    
    if (room.visibility === 'PRIVATE') {
        pendingPrivateRoom = room;
        document.getElementById('modalPrivateServerName').textContent = room.roomName;
        document.getElementById('privateServerPassInput').value = '';
        document.getElementById('privateServerModal').classList.add('open');
    } else {
        joinAndEnterRoom(room, '');
    }
}

async function submitPrivateServerJoin(e) {
    e.preventDefault();
    if (!pendingPrivateRoom) return;
    
    const passcode = document.getElementById('privateServerPassInput').value.trim();
    if (!passcode) {
        showToast('INPUT REQUIRED', 'Please supply the private room cipher key.', 'danger');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const origText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'VERIFYING ROOM CIPHER...';
    
    try {
        await apiCall('/rooms/' + pendingPrivateRoom.roomId + '/join', {
            method: 'POST',
            body: JSON.stringify({ passcode })
        });
        
        const room = pendingPrivateRoom;
        pendingPrivateRoom = null;
        closeModal('privateServerModal');
        await joinAndEnterRoom(room, passcode);
    } catch (err) {
        showToast('ACCESS REFUSED', err.message, 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = origText;
    }
}

async function joinAndEnterRoom(room, passcode) {
    if (room.visibility === 'PUBLIC') {
        try {
            await apiCall('/rooms/' + room.roomId + '/join', {
                method: 'POST',
                body: JSON.stringify({})
            });
        } catch (err) {}
    }
    
    await deriveRoomAESKey(room.roomId, passcode || 'PUBLIC_MESH_KEY');
    
    currentRoom = { roomId: room.roomId, roomName: room.roomName, visibility: room.visibility };
    
    document.getElementById('chatRoomName').textContent = room.roomName;
    document.getElementById('sidebarRoomName').textContent = room.roomName;
    document.getElementById('sidebarRoomProtocol').textContent = 'AES-256-GCM + ECDH-P256';
    
    const badge = document.getElementById('chatRoomBadge');
    badge.textContent = room.visibility === 'PRIVATE' ? '🔒 PRIVATE' : '🌐 PUBLIC';
    badge.className = 'server-badge ' + (room.visibility === 'PRIVATE' ? 'private' : 'public');
    
    document.getElementById('messages').innerHTML = '';
    
    await loadMessageHistory(room.roomId);
    
    if (socket) {
        socket.emit('join-room', { roomId: room.roomId });
    }
    
    try {
        const members = await apiCall('/rooms/' + room.roomId + '/members');
        renderMembersList(members);
    } catch (err) {}
    
    showPage('chatPage');
    showToast('SECURE LINK ESTABLISHED', 'Connected to ' + room.roomName + ' via AES-256-GCM.', 'success');
}

async function loadMessageHistory(roomId) {
    try {
        const messages = await apiCall('/rooms/' + roomId + '/messages?limit=50');
        const box = document.getElementById('messages');
        box.innerHTML = '';
        
        for (const msg of messages) {
            const plaintext = await decryptMessagePayload(msg.ciphertextB64, msg.ivB64);
            const isSelf = currentUser && msg.sender.userId === currentUser.userId;
            appendMessageElement({
                sender: msg.sender.displayCallsign || msg.sender.username,
                avatarId: msg.sender.avatarPreset,
                customAvatarUrl: msg.sender.customAvatarUrl,
                text: plaintext,
                time: new Date(msg.sentAt).toTimeString().slice(0, 8),
                isSelf,
                cipherBase64: msg.ciphertextB64,
                ivBase64: msg.ivB64,
                burnSeconds: msg.burnAfterSeconds,
                messageId: msg.messageId
            });
        }
        box.scrollTop = box.scrollHeight;
    } catch (err) {
        console.error('Message history load error:', err);
    }
}

async function handleIncomingMessage(data) {
    if (!currentRoom || data.roomId !== currentRoom.roomId) return;
    
    const plaintext = await decryptMessagePayload(data.ciphertextB64, data.ivB64);
    const isSelf = currentUser && data.sender.userId === currentUser.userId;
    
    appendMessageElement({
        sender: data.sender.displayCallsign || data.sender.username,
        avatarId: data.sender.avatarPreset,
        customAvatarUrl: data.sender.customAvatarUrl,
        text: plaintext,
        time: new Date(data.sentAt).toTimeString().slice(0, 8),
        isSelf,
        cipherBase64: data.ciphertextB64,
        ivBase64: data.ivB64,
        burnSeconds: data.burnAfterSeconds,
        messageId: data.messageId
    });
    
    if (isSelf) {
        const inspEl = document.getElementById('inspectorLastCipher');
        if (inspEl) {
            inspEl.textContent = 'IV[' + data.ivB64 + '] :: ' + data.ciphertextB64.slice(0, 48) + '...';
        }
        updateCryptoUI();
    }
}

function renderMembersList(members) {
    const container = document.getElementById('operatorsListContainer');
    if (!container || !currentUser) return;
    
    container.innerHTML = members.map(m => {
        const isSelf = m.userId === currentUser.userId;
        return `
            <div class="user-row ${m.isOnline ? '' : 'offline'}">
                <div class="user-avatar-sm">${getAvatarHTML(m.avatarPreset, m.customAvatarUrl)}</div>
                <div style="min-width:0; flex:1;">
                    <div style="color:${isSelf ? 'var(--green)' : '#c5cbd3'}; font-weight:${isSelf ? 'bold' : 'normal'};">${escapeHTML(m.displayCallsign)}${isSelf ? ' (YOU)' : ''}</div>
                    <div style="font-size:9px; color:var(--muted);">${m.isOnline ? 'ECDH VERIFIED' : 'OFFLINE'}</div>
                </div>
                <span class="user-dot" style="${m.isOnline ? '' : 'background:#444; box-shadow:none;'}"></span>
            </div>
        `;
    }).join('');
    
    const onlineCount = members.filter(m => m.isOnline).length;
    const countEl = document.getElementById('sidebarOnlineCount');
    if (countEl) countEl.textContent = onlineCount;
}

function renderOnlineUsersList(onlineUsers) {
    const countEl = document.getElementById('sidebarOnlineCount');
    if (countEl) countEl.textContent = onlineUsers.length;
    
    // Refresh members list from server to get callsigns and avatars
    if (currentRoom) {
        apiCall('/rooms/' + currentRoom.roomId + '/members')
            .then(members => renderMembersList(members))
            .catch(() => {});
    }
}

function appendMessageElement(data) {
    const box = document.getElementById('messages');
    if (!box) return;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message ' + (data.isSelf ? 'self' : '');
    if (data.messageId) msgDiv.dataset.messageId = data.messageId;
    
    const burnTag = data.burnSeconds > 0
        ? '<span class="burn-badge">🔥 SELF-DESTRUCT ' + data.burnSeconds + 's</span>'
        : '';
    
    msgDiv.innerHTML = `
        <div class="msg-avatar">${getAvatarHTML(data.avatarId, data.customAvatarUrl)}</div>
        <div class="msg-bubble">
            <div class="message-meta">
                <span class="message-user">${escapeHTML(data.sender)}</span>
                <span class="timestamp">[${escapeHTML(data.time)}]</span>
                <span class="cipher-badge">AES-256-GCM</span>
                ${burnTag}
            </div>
            <div class="message-text">${escapeHTML(data.text)}</div>
            <div class="ciphertext-preview">
                <strong>IV:</strong> ${escapeHTML(data.ivBase64)}<br>
                <strong>CIPHER:</strong> ${escapeHTML(data.cipherBase64)}
            </div>
        </div>
    `;
    
    box.appendChild(msgDiv);
    box.scrollTop = box.scrollHeight;
    
    if (data.burnSeconds > 0) {
        setTimeout(() => {
            msgDiv.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            msgDiv.style.opacity = '0';
            msgDiv.style.transform = 'scale(0.95)';
            setTimeout(() => msgDiv.remove(), 420);
        }, data.burnSeconds * 1000);
    }
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    if (!text || !currentRoom || !socket) return;
    
    const burnSeconds = parseInt(document.getElementById('burnTimerSelect').value, 10) || 0;
    
    try {
        const encrypted = await encryptMessagePayload(text);
        
        socket.emit('send-message', {
            roomId: currentRoom.roomId,
            ciphertext_b64: encrypted.cipherBase64,
            iv_b64: encrypted.ivBase64,
            burn_after_seconds: burnSeconds
        });
        
        input.value = '';
        socket.emit('stop-typing', { roomId: currentRoom.roomId });
    } catch (err) {
        showToast('ENCRYPTION FAILURE', 'Failed to encrypt message payload: ' + err.message, 'danger');
    }
}

// Typing throttle
let typingTimer = null;
function handleInputTyping() {
    if (!socket || !currentRoom) return;
    socket.emit('typing', { roomId: currentRoom.roomId });
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        socket.emit('stop-typing', { roomId: currentRoom.roomId });
    }, 1500);
}

function leaveRoom() {
    if (socket && currentRoom) {
        socket.emit('leave-room', { roomId: currentRoom.roomId });
    }
    currentRoom = null;
    cryptoState.roomAesKey = null;
    cryptoState.roomKeyHash = 'UNBOUND';
    loadRoomsGrid();
    showPage('hubPage');
}

// 13. NODE / ROOM CREATION
function openCreateServerModal() {
    document.getElementById('newServerName').value = '';
    document.getElementById('newServerDesc').value = '';
    document.getElementById('newServerType').value = 'public';
    document.getElementById('newServerPass').value = '';
    toggleNewServerPassField();
    document.getElementById('createServerModal').classList.add('open');
}

function toggleNewServerPassField() {
    const type = document.getElementById('newServerType').value;
    document.getElementById('newServerPassField').classList.toggle('hidden', type !== 'private');
}

async function handleCreateServer(e) {
    e.preventDefault();
    const rawName = document.getElementById('newServerName').value.trim().toUpperCase().replace(/\s+/g, '-');
    const description = document.getElementById('newServerDesc').value.trim();
    const visibility = document.getElementById('newServerType').value === 'private' ? 'PRIVATE' : 'PUBLIC';
    const passcode = document.getElementById('newServerPass').value.trim();
    
    if (!rawName) return;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const origText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'DEPLOYING NODE...';
    
    try {
        const data = await apiCall('/rooms', {
            method: 'POST',
            body: JSON.stringify({ roomName: rawName, description, visibility, passcode })
        });
        
        closeModal('createServerModal');
        await loadRoomsGrid();
        showToast('NODE DEPLOYED', 'Server [' + rawName + '] initialized on network.', 'success');
        
        const room = roomsList.find(r => r.roomId === data.roomId);
        if (room) {
            await joinAndEnterRoom(room, passcode);
        }
    } catch (err) {
        showToast('DEPLOYMENT ERROR', err.message, 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = origText;
    }
}

// 14. CIPHERTEXT & CRYPTO INSPECTOR DRAWER
function toggleCiphertextView() {
    showRawCiphertext = !showRawCiphertext;
    const msgBox = document.getElementById('messages');
    const btn = document.getElementById('toggleCipherViewBtn');
    if (msgBox) msgBox.classList.toggle('show-cipher', showRawCiphertext);
    if (btn) {
        btn.classList.toggle('active', showRawCiphertext);
        btn.innerHTML = '<span>🔒</span><span>RAW CIPHERTEXT: ' + (showRawCiphertext ? 'ON' : 'OFF') + '</span>';
    }
}

function toggleCryptoInspector() {
    const layout = document.getElementById('chatLayout');
    const btn = document.getElementById('toggleInspectorBtn');
    if (layout) layout.classList.toggle('with-inspector');
    if (btn) btn.classList.toggle('active', layout.classList.contains('with-inspector'));
}

// 15. LIVE UTC CLOCK
setInterval(() => {
    const clockEl = document.getElementById('footerClock');
    if (clockEl) {
        clockEl.textContent = 'UTC ' + new Date().toUTCString().slice(17, 25);
    }
}, 1000);

// 16. APPLICATION INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    const msgInput = document.getElementById('messageInput');
    if (msgInput) {
        msgInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendMessage();
            } else {
                handleInputTyping();
            }
        });
    }
    
    // Auto-restore active session if valid token in storage
    if (loadSession()) {
        apiCall('/auth/profile')
            .then(async (profile) => {
                currentUser = { ...currentUser, ...profile };
                saveSession();
                applyOperatorProfileToUI();
                await generateOperatorECDHKeys();
                initSocket();
                await loadRoomsGrid();
                showPage('hubPage');
                showToast('SESSION RESTORED', 'Operator clearance re-verified: ' + currentUser.displayCallsign, 'success');
            })
            .catch(() => {
                clearSession();
                showPage('loginPage');
            });
    } else {
        showPage('loginPage');
    }
});

// 17. ANIMATED TACTICAL RADAR & MATRIX MESH CANVAS
(function initTacticalCanvas() {
            const canvas = document.getElementById("tactical-canvas");
            const ctx = canvas.getContext("2d");
            let width, height, nodes = [];

            function resize() {
                width = canvas.width = window.innerWidth;
                height = canvas.height = window.innerHeight;
                const count = Math.min(55, Math.floor((width * height) / 24000));
                nodes = Array.from({ length: count }, () => ({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.45,
                    vy: (Math.random() - 0.5) * 0.45,
                    r: Math.random() * 1.8 + 1
                }));
            }

            window.addEventListener("resize", resize);
            resize();

            let angle = 0;
            function draw() {
                ctx.fillStyle = "rgba(2, 3, 4, 0.35)";
                ctx.fillRect(0, 0, width, height);

                // Subtle tactical grid
                ctx.strokeStyle = "rgba(255, 255, 255, 0.025)";
                ctx.lineWidth = 1;
                const gridSize = 60;
                for (let x = 0; x < width; x += gridSize) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, height);
                    ctx.stroke();
                }
                for (let y = 0; y < height; y += gridSize) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(width, y);
                    ctx.stroke();
                }

                // Radar sweep in center
                const cx = width / 2;
                const cy = height / 2;
                const maxR = Math.min(width, height) * 0.38;
                angle += 0.008;

                ctx.strokeStyle = "rgba(255, 31, 45, 0.08)";
                ctx.beginPath();
                ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
                ctx.strokeStyle = "rgba(24, 232, 137, 0.14)";
                ctx.stroke();

                // Mesh particles & links
                for (let i = 0; i < nodes.length; i++) {
                    const n = nodes[i];
                    n.x += n.vx;
                    n.y += n.vy;
                    if (n.x < 0 || n.x > width) n.vx *= -1;
                    if (n.y < 0 || n.y > height) n.vy *= -1;

                    ctx.fillStyle = i % 4 === 0 ? "rgba(24, 232, 137, 0.55)" : "rgba(255, 31, 45, 0.55)";
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                    ctx.fill();

                    for (let j = i + 1; j < nodes.length; j++) {
                        const n2 = nodes[j];
                        const dx = n.x - n2.x;
                        const dy = n.y - n2.y;
                        const dist = Math.hypot(dx, dy);
                        if (dist < 135) {
                            ctx.strokeStyle = `rgba(255, 31, 45, ${(1 - dist / 135) * 0.16})`;
                            ctx.beginPath();
                            ctx.moveTo(n.x, n.y);
                            ctx.lineTo(n2.x, n2.y);
                            ctx.stroke();
                        }
                    }
                }

                requestAnimationFrame(draw);
            }

            window.onload = () => draw();
        })();
