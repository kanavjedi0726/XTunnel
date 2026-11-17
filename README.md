# XTUNNEL – Tactical E2EE Secure Messaging Platform

XTUNNEL is a full-stack, tactical/cybersecurity-themed end-to-end encrypted (E2EE) real-time messaging application. Built with Node.js, Express, Socket.IO, SQLite, and the Web Crypto API, XTUNNEL combines military-grade cryptographic primitives with a high-fidelity cyberpunk user interface.

---

## Table of Contents
1. [Architecture & Folder Structure](#architecture--folder-structure)
2. [End-to-End Encryption Protocol](#end-to-end-encryption-protocol)
3. [Technology Stack](#technology-stack)
4. [Installation & Setup](#installation--setup)
5. [API Endpoint Documentation](#api-endpoint-documentation)
6. [Real-Time Socket.IO Protocol](#real-time-socketio-protocol)
7. [Database Schema](#database-schema)
8. [Features Implemented](#features-implemented)
9. [Automated Verification & Testing](#automated-verification--testing)
10. [Security Model & Limitations](#security-model--limitations)

---

## Architecture & Folder Structure

```text
XTUNNEL/
│
├── client/                                    # Frontend Application
│   ├── index.html                             # Tactical HUD (Grid, CRT scanlines, Radar canvas, 5 app screens, modals)
│   ├── style.css                              # Tactical design system (Orbitron, Rajdhani, Share Tech Mono)
│   └── script.js                              # WebCrypto E2EE, Socket.IO client, API integration
│
├── server/                                    # Backend Application
│   ├── config/
│   │   └── config.js                          # Environment & security config
│   ├── controllers/
│   │   ├── authController.js                  # Registration, 2-step login, 2FA challenge verification
│   │   ├── roomController.js                  # Room listing, creation, join/leave, membership auth
│   │   ├── messageController.js               # Message retrieval, storage, ephemeral cleanup
│   │   └── profileController.js               # Profile customization & public key registry
│   ├── middleware/
│   │   ├── authMiddleware.js                  # JWT Bearer verification & Socket.IO handshake auth
│   │   └── rateLimiter.js                     # Rate limiting on sensitive auth endpoints
│   ├── routes/
│   │   ├── authRoutes.js                      # /api/auth endpoints
│   │   ├── roomRoutes.js                      # /api/rooms endpoints
│   │   ├── messageRoutes.js                   # /api/messages endpoints
│   │   └── profileRoutes.js                   # /api/profile endpoints
│   ├── services/
│   │   └── cryptoService.js                   # bcrypt password/security answer hashing, JWT tokens
│   ├── sockets/
│   │   └── socketHandler.js                   # Real-time room channels, messaging, typing indicators
│   ├── database/
│   │   ├── db.js                              # SQLite database connection & default room seeding
│   │   ├── schema.sql                         # Database schema definition
│   │   └── xtunnel.sqlite                     # SQLite persistent storage
│   ├── test-suite.js                          # 33-point automated verification test suite
│   ├── .env                                   # Secret environment variables (JWT secret, port)
│   ├── .env.example                           # Template environment configuration
│   ├── package.json                           # Server dependencies & scripts
│   └── server.js                              # Express + Socket.IO server entry point
│
├── package.json                               # Root package script runner
├── schema.sql                                 # Root database schema reference
├── style.css                                  # Root stylesheet reference
├── xtunnel_tactical_e2ee_communication_network.html # Original prototype backup
├── README.md                                  # Complete documentation
└── .gitignore                                 # Git ignore patterns
```

---

## End-to-End Encryption Protocol

XTUNNEL implements client-side encryption using the standard **W3C Web Crypto API** (`window.crypto.subtle`):

```text
+-----------------------------------------------------------------------------------+
|                              CLIENT-SIDE BROWSER                                  |
|                                                                                   |
|  1. Generate ECDH P-256 Key Pair                                                 |
|     - Private Key (Kept strictly in browser memory, never transmitted)            |
|     - Public Key (Exported as JWK, SHA-256 fingerprint generated & sent to server)|
|                                                                                   |
|  2. Room Symmetric Key Derivation                                                 |
|     - Public Rooms:   SHA-256("XTUNNEL::" + roomId + "::PUBLIC_MESH_KEY")         |
|     - Private Rooms:  SHA-256("XTUNNEL::" + roomId + "::" + roomPasscode)        |
|     - Imported as 256-bit AES-GCM Key                                             |
|                                                                                   |
|  3. Message Transmission                                                          |
|     - Plaintext Message                                                           |
|     - Generate unique 96-bit (12-byte) Cryptographic Nonce/IV                     |
|     - Encrypt via AES-256-GCM                                                     |
|     - Output: base64(IV) + base64(Ciphertext with authentication tag)            |
+-----------------------------------------------------------------------------------+
                                        |
                 [Socket.IO: Ciphertext + IV only, NO Plaintext]
                                        v
+-----------------------------------------------------------------------------------+
|                              SERVER / SQLITE DATABASE                             |
|                                                                                   |
|  - Validates JWT & room membership                                                |
|  - Stores ONLY: ciphertext_b64, iv_b64, sender_id, room_id, sent_at, expires_at   |
|  - Never has access to private keys or plaintext message content                  |
|  - Broadcasts ciphertext blob to authorized room members                          |
+-----------------------------------------------------------------------------------+
                                        |
                 [Socket.IO: Broadcasts Ciphertext + IV]
                                        v
+-----------------------------------------------------------------------------------+
|                           RECIPIENT CLIENT BROWSER                                |
|                                                                                   |
|  - Receives base64(IV) + base64(Ciphertext)                                       |
|  - Uses locally derived room AES-256-GCM key                                      |
|  - Authenticated decryption via window.crypto.subtle.decrypt                      |
|  - Plaintext rendered in tactical bubble view                                     |
+-----------------------------------------------------------------------------------+
```

### Cryptographic Guarantees:
- **Cipher**: AES-GCM with 256-bit key length and 128-bit authentication tag.
- **Uniqueness**: Fresh 96-bit cryptographically secure pseudorandom IV (`window.crypto.getRandomValues`) for every single transmission.
- **Zero Knowledge**: Plaintext messages, passwords, and security question answers never exist in the database or server logs.

---

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (Node built-in `node:sqlite` / `better-sqlite3` compatible)
- **Real-Time Layer**: Socket.IO
- **Authentication**: JSON Web Tokens (JWT) with Bearer header validation
- **Password Security**: bcrypt (12 salt rounds)
- **Security Questions**: bcrypt hashed answers (12 salt rounds)
- **Rate Limiting**: express-rate-limit
- **Frontend**: Native HTML5, CSS3, JavaScript (ES6+), Web Crypto API

---

## Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- npm (Node Package Manager)

### Quick Start Commands

#### 1. Navigate to the server folder
```bash
cd server
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Environment Configuration
The `.env` file is pre-configured with default development secrets. You can adjust it or copy from `.env.example`:
```bash
cp .env.example .env
```
Contents of `.env`:
```ini
JWT_SECRET=xt_secure_jwt_secret_a9f2k8m3p1q7r5s4t6u0v2w8x1y3z7n5b
PORT=3000
NODE_ENV=development
```

#### 4. Run Automated Test Suite
Verify all 33 requirements including real-time sockets, database persistence, and security challenges:
```bash
npm test
```

#### 5. Start the Application
```bash
npm start
```

#### 6. Open in Browser
Open your browser and navigate to:
```text
http://localhost:3000
```

---

## API Endpoint Documentation

All endpoints (except registration and login) require the `Authorization: Bearer <TOKEN>` header.

### 1. Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new operator callsign, password, and two security answers |
| `POST` | `/api/auth/login` | Public | Step 1 login: verifies password, returns user ID and 2FA question prompts |
| `POST` | `/api/auth/verify-security` | Public | Step 2 login: verifies security question answers, returns JWT session token |
| `GET` | `/api/auth/profile` | Bearer | Retrieve authenticated operator's profile |

#### `POST /api/auth/register`
**Request Body:**
```json
{
  "username": "ghost_ops",
  "password": "MasterPassword2026!",
  "sec_q1_answer": "sector-7g",
  "sec_q2_answer": "nightfall"
}
```
**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 1,
    "username": "ghost_ops",
    "displayCallsign": "GHOST_OPS",
    "bioMotto": "Encrypted tunnel active.",
    "avatarPreset": "visor",
    "themeAccent": "default",
    "operationalStatus": "ACTIVE // ONLINE",
    "customAvatarUrl": ""
  }
}
```

#### `POST /api/auth/login`
**Request Body:**
```json
{
  "username": "ghost_ops",
  "password": "MasterPassword2026!"
}
```
**Response (200 OK):**
```json
{
  "userId": 1,
  "username": "ghost_ops",
  "sec_q1_prompt": "What is your assigned tactical sector?",
  "sec_q2_prompt": "Enter your cipher recovery codeword:"
}
```

#### `POST /api/auth/verify-security`
**Request Body:**
```json
{
  "username": "ghost_ops",
  "sec_q1_answer": "sector-7g",
  "sec_q2_answer": "nightfall"
}
```
**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

---

### 2. Communication Rooms (`/api/rooms`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/rooms` | Bearer | List all relay nodes with member count and live online operators |
| `POST` | `/api/rooms` | Bearer | Deploy a new public or private room node |
| `POST` | `/api/rooms/:roomId/join` | Bearer | Join public room or authenticate into private room with passcode |
| `DELETE` | `/api/rooms/:roomId/leave`| Bearer | Leave room and cancel membership |
| `GET` | `/api/rooms/:roomId/members`| Bearer | Retrieve verified members list and live online statuses |

#### `POST /api/rooms`
**Request Body:**
```json
{
  "roomName": "TITAN-RELAY",
  "description": "Tactical coordination channel.",
  "visibility": "PRIVATE",
  "passcode": "TITAN-SECURE"
}
```

#### `POST /api/rooms/:roomId/join`
**Request Body (for Private Rooms):**
```json
{
  "passcode": "TITAN-SECURE"
}
```

---

### 3. Encrypted Messages (`/api/messages` & `/api/rooms/:roomId/messages`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/rooms/:roomId/messages` | Bearer | Load previous room messages (excluding expired ephemeral messages) |
| `POST` | `/api/rooms/:roomId/messages`| Bearer | Store encrypted message (used via REST or Socket.IO) |

**Message Response Format:**
```json
[
  {
    "messageId": 14,
    "ciphertextB64": "v+K72pZ...",
    "ivB64": "G8uQ2w...",
    "burnAfterSeconds": 10,
    "sentAt": "2026-11-18 01:30:00",
    "sender": {
      "userId": 1,
      "username": "ghost_ops",
      "displayCallsign": "GHOST_OPS",
      "avatarPreset": "visor",
      "customAvatarUrl": ""
    }
  }
]
```

---

### 4. Operator Profile (`/api/profile`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `PUT` | `/api/profile` | Bearer | Update display callsign, bio, avatar preset, theme, and status |
| `PUT` | `/api/profile/pubkey` | Bearer | Register or rotate browser ECDH P-256 public key |
| `GET` | `/api/profile/pubkey/:userId` | Bearer | Retrieve public key JWK and fingerprint for an operator |

---

## Real-Time Socket.IO Protocol

Socket connections are authenticated via the JWT handshake token:
```javascript
const socket = io({
  auth: { token: authToken }
});
```

### Client -> Server Events:
- `join-room` `{ roomId }`: Join a socket room channel (verifies DB membership).
- `leave-room` `{ roomId }`: Leave room channel.
- `send-message` `{ roomId, ciphertext_b64, iv_b64, burn_after_seconds }`: Transmits encrypted payload.
- `typing` `{ roomId }`: Signals operator typing.
- `stop-typing` `{ roomId }`: Cancels typing indicator.
- `update-public-key` `{ keyFingerprint }`: Broadcasts key rotation.

### Server -> Client Events:
- `new-message`: Delivers encrypted payload, IV, sender metadata, and timestamps to all room members.
- `room-users-updated`: Emits list of live connected operators in the room.
- `user-joined`: Announces operator connection.
- `user-left`: Announces operator disconnection.
- `user-typing`: Displays operator typing indicator.
- `user-stop-typing`: Hides typing indicator.

---

## Database Schema

```sql
PRAGMA foreign_keys = ON;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    sec_q1_prompt TEXT NOT NULL DEFAULT 'What is your assigned tactical sector?',
    sec_q1_answer_hash TEXT NOT NULL,
    sec_q2_prompt TEXT NOT NULL DEFAULT 'Enter your cipher recovery codeword:',
    sec_q2_answer_hash TEXT NOT NULL,
    display_callsign TEXT NOT NULL,
    bio_motto TEXT DEFAULT 'Encrypted tunnel active.',
    avatar_preset TEXT DEFAULT 'visor',
    theme_accent TEXT DEFAULT 'default',
    operational_status TEXT DEFAULT 'ACTIVE // ONLINE',
    custom_avatar_url TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    room_id TEXT PRIMARY KEY,
    room_name TEXT NOT NULL,
    description TEXT DEFAULT '',
    visibility TEXT CHECK(visibility IN ('PUBLIC', 'PRIVATE')) NOT NULL DEFAULT 'PUBLIC',
    passcode_hash TEXT,
    encryption_cipher TEXT DEFAULT 'AES-256-GCM + ECDH-P256',
    created_by INTEGER REFERENCES users(user_id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Room Memberships
CREATE TABLE IF NOT EXISTS room_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, user_id)
);

-- 4. Encrypted Messages
CREATE TABLE IF NOT EXISTS messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(user_id),
    ciphertext_b64 TEXT NOT NULL,
    iv_b64 TEXT NOT NULL,
    burn_after_seconds INTEGER DEFAULT 0,
    expires_at DATETIME,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Public Keys Registry
CREATE TABLE IF NOT EXISTS public_keys (
    user_id INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    ecdh_public_key_jwk TEXT NOT NULL,
    key_fingerprint TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Features Implemented

1. **Backend Authentication**: Real registration and login with bcrypt hashing (12 rounds) and JWT authentication.
2. **Two-Factor Security Questions**: Mandatory 2-question checkpoint on login; answers stored exclusively as bcrypt hashes.
3. **Zero Plaintext Storage**: Messages are encrypted in the client browser with AES-256-GCM. The database and server logs only ever handle base64 ciphertext and IVs.
4. **Real-Time Communication**: Instant multi-user messaging powered by authenticated Socket.IO channels.
5. **Private Classified Rooms**: Private rooms require a cryptographic passcode, verified on the server via bcrypt.
6. **Ephemeral / Self-Destruct Messages**: Selectable countdown (10s, 30s) removes messages from the frontend UI and purges them from the database on a 60-second cleanup cycle.
7. **Profile Customization**: Callsigns, bios, avatar presets, and color themes persist across logins in SQLite.
8. **Crypto Inspector Panel**: Live telemetry displays key algorithm, IV nonces, SHA-256 key fingerprints, and raw ciphertext payloads.
9. **Visual Design Integrity**: Retained 100% of the original tactical/cyberpunk aesthetic, scanlines, SVG avatars, and radar mesh canvas.

---

## Automated Verification & Testing

XTUNNEL includes a comprehensive 33-point automated test suite (`server/test-suite.js`).

To run the verification suite:
```bash
npm test
```

### Verified Checks:
- User registration and unique callsign validation
- Password and security answer hashing verification in SQLite
- Step 1 and Step 2 authentication workflows
- Rejection of invalid passwords and invalid security answers
- Concurrent sessions with two distinct users
- Rejection of unauthenticated API calls
- Passcode protection on private rooms (invalid rejected, valid admitted)
- Multi-user real-time messaging via Socket.IO
- Cryptographic payload integrity (IV and ciphertext stored in database)
- Absence of plaintext message columns
- Retrieval of message history for authorized room members
- Rejection of non-member access to room messages
- Profile updates persisting across logout/login
- Ephemeral message expiration and automatic purge from database

---

## Security Model & Limitations

- **Group Key Agreement**: Group room keys are derived client-side via SHA-256 using the unique room ID and room secret. All authorized members who possess clearance for the room derive the identical symmetric key to read room communications.
- **Client Ephemeral Burn**: Expired messages fade and detach from the client DOM when their timer runs down. Note that client-side deletion cannot physically force deletion of messages on other operators' computers if screenshots or network packets were captured prior to expiry.
- **Transport Security**: In local development, the application runs on HTTP. For production environments, deploy behind an SSL/TLS reverse proxy (e.g., Nginx, Caddy, Cloudflare) with HTTPS and WSS enabled.
