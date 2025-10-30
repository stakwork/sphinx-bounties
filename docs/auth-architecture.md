# Sphinx Tribes Authentication Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SPHINX TRIBES ECOSYSTEM                       │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │◄───────►│   Backend    │◄───────►│ Sphinx Chat  │
│   (Next.js)  │         │   (Go API)   │         │  V2 Bot      │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │                         │
       │                        │                         │
       ▼                        ▼                         ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  WebSocket   │         │  In-Memory   │         │  Lightning   │
│  Connection  │         │    Cache     │         │   Network    │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │                         │
       │                        ▼                         │
       │                 ┌──────────────┐                │
       │                 │  PostgreSQL  │                │
       │                 │   Database   │                │
       │                 └──────────────┘                │
       │                                                  │
       └──────────────────────────────────────────────────┘
```

## Component Breakdown

### Frontend Layer (Next.js)

```
┌─────────────────────────────────────┐
│         Frontend Components         │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐ │
│  │     Auth Components           │ │
│  │  - LoginModal.tsx            │ │
│  │  - QRCodeDisplay.tsx         │ │
│  │  - AuthProvider.tsx          │ │
│  │  - ProtectedRoute.tsx        │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │     Auth Managers             │ │
│  │  - websocket.ts              │ │
│  │  - lnauth.ts                 │ │
│  │  - jwt.ts                    │ │
│  │  - api.ts                    │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │     Custom Hooks              │ │
│  │  - useAuth()                 │ │
│  │  - useAuthContext()          │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### Backend Layer (Go)

```
┌─────────────────────────────────────────┐
│          Backend Architecture           │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      HTTP Routes                  │ │
│  │  /lnauth                         │ │
│  │  /lnauth_login                   │ │
│  │  /refresh_jwt                    │ │
│  │  /websocket                      │ │
│  │  /ask, /verify, /poll           │ │
│  └───────────────────────────────────┘ │
│                 │                       │
│                 ▼                       │
│  ┌───────────────────────────────────┐ │
│  │      Middleware                   │ │
│  │  - PubKeyContext                 │ │
│  │  - PubKeyContextSuperAdmin       │ │
│  │  - CombinedAuthContext           │ │
│  │  - ConnectionCodeContext         │ │
│  └───────────────────────────────────┘ │
│                 │                       │
│                 ▼                       │
│  ┌───────────────────────────────────┐ │
│  │      Handlers                     │ │
│  │  - AuthHandler                   │ │
│  │  - GetLnurlAuth                  │ │
│  │  - ReceiveLnAuthData             │ │
│  │  - RefreshToken                  │ │
│  └───────────────────────────────────┘ │
│                 │                       │
│                 ▼                       │
│  ┌───────────────────────────────────┐ │
│  │      Auth Package                 │ │
│  │  - JWT Encode/Decode             │ │
│  │  - Signature Verification        │ │
│  │  - LNURL Encoding                │ │
│  │  - Timestamp Verification        │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

## Data Flow Architecture

### LNURL-Auth Flow

```
┌──────────┐
│  Start   │
└────┬─────┘
     │
     ▼
┌─────────────────────────────┐
│  1. WebSocket Connection    │
│  - Client connects to /ws   │
│  - Gets unique socketKey    │
│  - Connection stored        │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  2. Request Challenge       │
│  GET /lnauth?socketKey=xxx  │
│  - Generate K1 (32 bytes)   │
│  - Create callback URL      │
│  - Encode as LNURL          │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  3. Cache Storage           │
│  Cache[K1] = {              │
│    k1: string,              │
│    key: "",                 │
│    status: false            │
│  }                          │
│  Cache[K1[0:20]] = Socket   │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  4. Display QR Code         │
│  - Show LNURL as QR         │
│  - User scans with wallet   │
│  - Wallet decodes LNURL     │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  5. Wallet Signs Challenge  │
│  - Extract K1 from URL      │
│  - Sign with private key    │
│  - Send back signature      │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  6. Verify Signature        │
│  GET /lnauth_login          │
│  ?key=pubkey                │
│  &k1=challenge              │
│  &sig=signature             │
│  - Verify DER signature     │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  7. Create/Get User         │
│  - CreateLnUser(pubkey)     │
│  - GetPersonByPubkey()      │
│  - Generate JWT token       │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  8. Update Cache            │
│  Cache[K1] = {              │
│    k1: string,              │
│    key: pubkey,             │
│    status: true             │
│  }                          │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  9. Send via WebSocket      │
│  socket.send({              │
│    msg: "lnauth_success",   │
│    jwt: token,              │
│    user: userData           │
│  })                         │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  10. Client Receives        │
│  - Store JWT in localStorage│
│  - Store user data          │
│  - Redirect to dashboard    │
└────────────┬────────────────┘
             │
             ▼
        ┌────────┐
        │  End   │
        └────────┘
```

## JWT Token Structure

```
┌─────────────────────────────────────────┐
│            JWT Token                    │
├─────────────────────────────────────────┤
│                                         │
│  Header (Algorithm)                     │
│  ┌───────────────────────────────────┐ │
│  │ {                                 │ │
│  │   "alg": "HS256",                │ │
│  │   "typ": "JWT"                   │ │
│  │ }                                 │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Payload (Claims)                       │
│  ┌───────────────────────────────────┐ │
│  │ {                                 │ │
│  │   "pubkey": "03a1b2c3...",       │ │
│  │   "exp": 1704067200              │ │
│  │ }                                 │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Signature                              │
│  ┌───────────────────────────────────┐ │
│  │ HMACSHA256(                       │ │
│  │   base64UrlEncode(header) + "." + │ │
│  │   base64UrlEncode(payload),      │ │
│  │   secret                          │ │
│  │ )                                 │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘

Usage in Requests:
┌─────────────────────────────────────────┐
│  Header:                                │
│  x-jwt: eyJhbGciOiJIUzI1NiIsInR5cCI... │
│                                         │
│  OR Query Parameter:                    │
│  ?token=eyJhbGciOiJIUzI1NiIsInR5cCI... │
└─────────────────────────────────────────┘
```

## Cache Architecture

```
┌─────────────────────────────────────────────────────────┐
│              In-Memory Cache (Redis-like)               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Challenge Cache (10 min expiry)                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Key: challenge-uuid                               │ │
│  │ Value: {                                          │ │
│  │   challenge: string,                              │ │
│  │   timestamp: number,                              │ │
│  │   user_data?: object                              │ │
│  │ }                                                  │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  LNURL Cache (120 sec expiry)                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Key: K1 (hex string)                              │ │
│  │ Value: {                                          │ │
│  │   k1: string,                                     │ │
│  │   key: string (pubkey),                           │ │
│  │   status: boolean                                 │ │
│  │ }                                                  │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  WebSocket Cache (No expiry until disconnect)          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Key: socketKey or K1[0:20]                        │ │
│  │ Value: {                                          │ │
│  │   host: string,                                   │ │
│  │   conn: WebSocket                                 │ │
│  │ }                                                  │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Invoice Cache (6 min expiry)                          │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Key: "INVOICELIST"                                │ │
│  │ Value: []InvoiceStoreData                         │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Database Schema (Relevant Tables)

```sql
-- Users/People Table
CREATE TABLE people (
    id SERIAL PRIMARY KEY,
    owner_pubkey VARCHAR(66) UNIQUE NOT NULL,
    owner_alias VARCHAR(255),
    owner_contact_key VARCHAR(255),
    img TEXT,
    description TEXT,
    tags TEXT[],
    unique_name VARCHAR(255),
    created TIMESTAMP DEFAULT NOW(),
    updated TIMESTAMP DEFAULT NOW(),
    last_login BIGINT,
    price_to_meet BIGINT DEFAULT 0,
    extras JSONB
);

-- Connection Codes Table
CREATE TABLE connectioncodes (
    id SERIAL PRIMARY KEY,
    connection_string TEXT NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    date_created TIMESTAMP DEFAULT NOW()
);

-- Tribes Table
CREATE TABLE tribes (
    uuid VARCHAR(255) PRIMARY KEY,
    owner_pubkey VARCHAR(66) NOT NULL,
    owner_alias VARCHAR(255),
    name VARCHAR(255),
    description TEXT,
    img TEXT,
    created TIMESTAMP DEFAULT NOW(),
    updated TIMESTAMP DEFAULT NOW()
);
```

## Sphinx Chat V2 Bot Integration

```
┌─────────────────────────────────────────────────────────┐
│            Sphinx Chat V2 Bot API                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Base URL: https://bot-v2.sphinx.chat                  │
│  Authentication: x-admin-token header                   │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  POST /invite                                     │ │
│  │  Create connection code with payment              │ │
│  │  Body: {                                          │ │
│  │    amt_msat: 100000,                              │ │
│  │    alias: "new_user",                             │ │
│  │    inviter_pubkey: "03...",                       │ │
│  │    inviter_route_hint: "..."                      │ │
│  │  }                                                 │ │
│  │  Response: { invite: "sphinx.chat::/..." }       │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  POST /pay_invoice                                │ │
│  │  Pay Lightning invoice                            │ │
│  │  Body: {                                          │ │
│  │    bolt11: "lnbc...",                             │ │
│  │    wait: true                                     │ │
│  │  }                                                 │ │
│  │  Response: {                                      │ │
│  │    tag: "payment-id",                             │ │
│  │    msat: "1000000",                               │ │
│  │    payment_hash: "..."                            │ │
│  │  }                                                 │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  GET /sends/{tag}                                 │ │
│  │  Check payment status                             │ │
│  │  Response: {                                      │ │
│  │    tag: "payment-id",                             │ │
│  │    ts: 1234567890,                                │ │
│  │    status: "COMPLETE|PENDING|FAILED",             │ │
│  │    error: ""                                      │ │
│  │  }                                                 │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  GET /account                                     │ │
│  │  Get bot account info                             │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Security Layer

```
┌─────────────────────────────────────────────────────────┐
│                  Security Measures                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Signature Verification                                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │  • DER Signature (ECDSA)                          │  │
│  │  • secp256k1 curve                                │  │
│  │  • Double SHA256 hash                             │  │
│  │  • "Lightning Signed Message:" prefix             │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Token Security                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  • HS256 HMAC signing                             │  │
│  │  • 7-day expiration                               │  │
│  │  • Server-side verification                       │  │
│  │  • Automatic refresh before expiry                │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Challenge Security                                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  • 32-byte random K1                              │  │
│  │  • 5-minute timestamp window                      │  │
│  │  • One-time use                                   │  │
│  │  • Auto-expiration after use                      │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Transport Security                                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  • HTTPS/TLS for API                              │  │
│  │  • WSS for WebSocket                              │  │
│  │  • CORS configured                                │  │
│  │  • Rate limiting enabled                          │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌──────────────────────────────────────────────────────────┐
│                    Error Scenarios                       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  WebSocket Errors                                        │
│  Connection Failed → Retry with backoff                  │
│  Disconnected → Auto-reconnect                           │
│  Timeout → Show "Please try again"                       │
│                                                          │
│  Authentication Errors                                   │
│  Invalid Signature → Return 401                          │
│  Expired Token → Attempt refresh                         │
│  Missing Token → Redirect to login                       │
│                                                          │
│  Challenge Errors                                        │
│  Challenge Not Found → Invalid/expired                   │
│  Timestamp Too Old → 5-minute window exceeded            │
│  Timestamp Too New → Clock sync issue                    │
│                                                          │
│  V2 Bot Errors                                           │
│  Connection Failed → Fallback mode                       │
│  Invalid Token → Check configuration                     │
│  Payment Failed → Show error to user                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Performance Considerations

```
┌─────────────────────────────────────────────────────────┐
│              Performance Optimizations                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Frontend                                               │
│  • WebSocket connection pooling                         │
│  • QR code caching                                      │
│  • Lazy loading of auth components                      │
│  • Debounced token refresh                              │
│                                                         │
│  Backend                                                │
│  • In-memory cache for hot data                         │
│  • Database connection pooling                          │
│  • Middleware early exit on invalid tokens              │
│  • Async WebSocket message sending                      │
│                                                         │
│  Network                                                │
│  • WebSocket reduces polling overhead                   │
│  • JWT eliminates session store lookups                 │
│  • LNURL reduces redirect chains                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Monitoring & Logging

```
┌─────────────────────────────────────────────────────────┐
│              Logging Architecture                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Authentication Events                                  │
│  • Login attempts (success/failure)                     │
│  • Token generation                                     │
│  • Token refresh                                        │
│  • Signature verification                               │
│                                                         │
│  WebSocket Events                                       │
│  • Connection established                               │
│  • Connection closed                                    │
│  • Message sent/received                                │
│  • Pool size changes                                    │
│                                                         │
│  Security Events                                        │
│  • Invalid signatures                                   │
│  • Expired tokens                                       │
│  • Rate limit hits                                      │
│  • Admin access attempts                                │
│                                                         │
│  Performance Metrics                                    │
│  • Response times                                       │
│  • Cache hit rates                                      │
│  • Active connections                                   │
│  • Database query times                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Production Deployment                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│         ┌──────────────┐                                │
│         │   CloudFlare │                                │
│         │      CDN     │                                │
│         └──────┬───────┘                                │
│                │                                        │
│         ┌──────▼────────┐                               │
│         │  Load Balancer│                               │
│         │    (nginx)    │                               │
│         └──────┬────────┘                               │
│                │                                        │
│         ┌──────┴────────┐                               │
│         │               │                               │
│    ┌────▼─────┐    ┌────▼─────┐                         │
│    │ Next.js  │    │ Next.js  │                         │
│    │ Instance │    │ Instance │                         │
│    └────┬─────┘    └────┬─────┘                         │
│         │               │                               │
│         └──────┬────────┘                               │
│                │                                        │
│         ┌──────▼────────┐                               │
│         │   API Gateway │                               │
│         └──────┬────────┘                               │
│                │                                        │
│         ┌──────┴────────┐                               │
│         │               │                               │
│    ┌────▼─────┐    ┌────▼─────┐                         │
│    │  Go API  │    │  Go API  │                         │
│    │ Instance │    │ Instance │                         │
│    └────┬─────┘    └────┬─────┘                         │
│         │               │                               │
│         └──────┬────────┘                               │
│                │                                        │
│         ┌──────▼────────┐                               │
│         │   PostgreSQL  │                               │
│         │   (Primary)   │                               │
│         └───────────────┘                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

**Last Updated:** October 30, 2025
**Version:** 2.0
