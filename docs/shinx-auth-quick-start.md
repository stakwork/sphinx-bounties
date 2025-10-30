# Sphinx Tribes Authentication - Quick Start Guide

## 🎯 Overview

Sphinx Tribes uses Lightning Network-based authentication (LNURL-auth) as the primary authentication method, integrated with Sphinx Chat V2 Bot for payment infrastructure.

## 🔑 Key Concepts

### Authentication Flow Summary

```
User → Opens App → WebSocket Connection → Request QR Code →
Scan with Lightning Wallet → Sign Challenge → Verify Signature →
Receive JWT Token → Authenticated ✅
```

### Core Components

1. **LNURL-Auth**: Lightning Network authentication protocol
2. **JWT Tokens**: 7-day expiration, contains user's pubkey
3. **WebSocket**: Real-time communication for auth status
4. **Sphinx Chat V2 Bot**: Payment infrastructure
5. **In-Memory Cache**: Temporary storage for challenges and connections

## 🚀 Implementation Steps for Next.js

### 1. Install Dependencies

```bash
npm install qrcode
npm install --save-dev @types/qrcode
```

### 2. Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5002
```

### 3. Basic Authentication Flow

```typescript
// 1. Connect WebSocket
const ws = new WebSocket('ws://localhost:5002/websocket');

// 2. Request LNURL Challenge
const response = await fetch('/lnauth?socketKey=unique-id');
const { encode } = await response.json();

// 3. Display QR Code
<QRCode value={encode.toUpperCase()} />

// 4. Listen for Success
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.msg === 'lnauth_success') {
    localStorage.setItem('jwt', data.jwt);
    // Redirect to dashboard
  }
};
```

### 4. Making Authenticated Requests

```typescript
fetch("/api/protected-endpoint", {
  headers: {
    "x-jwt": localStorage.getItem("jwt"),
  },
});
```

## 📊 Authentication Methods Comparison

| Method               | Use Case       | Duration  | Requires            |
| -------------------- | -------------- | --------- | ------------------- |
| **LNURL-Auth**       | Primary login  | One-time  | Lightning Wallet    |
| **JWT Token**        | API requests   | 7 days    | LNURL-Auth first    |
| **Token Refresh**    | Extend session | 7 days    | Valid JWT           |
| **Signed Timestamp** | Alternative    | 5 minutes | Private key signing |

## 🔐 Security Best Practices

1. **Token Storage**: Use localStorage for web, secure storage for mobile
2. **Auto-Refresh**: Refresh JWT before 7-day expiration
3. **HTTPS/WSS**: Always use secure connections in production
4. **Never Expose**: Keep V2_BOT_TOKEN server-side only
5. **Rate Limiting**: Implement on all auth endpoints

## 🛠️ Backend Configuration

### Required Environment Variables

```bash
# Core
LN_SERVER_BASE_URL=https://your-domain.com
LN_JWT_KEY=your-secret-key

# Sphinx Chat V2 Bot
V2_BOT_URL=https://bot-v2.sphinx.chat
V2_BOT_TOKEN=your-admin-token

# Admin
ADMINS=pubkey1,pubkey2,pubkey3
```

## 📝 Key Endpoints

### Public Endpoints

```
GET  /lnauth?socketKey={id}          # Get LNURL challenge
GET  /lnauth_login?key={}&k1={}&sig={} # Wallet callback
GET  /refresh_jwt                      # Refresh token
GET  /websocket                        # WebSocket connection
```

### Protected Endpoints (Requires JWT)

```
GET  /admin/auth                       # Verify admin status
POST /connectioncodes                  # Create invite codes
GET  /connectioncodes                  # Get unused code
```

## 🎨 UI/UX Flow

### Login Page Flow

```
1. User clicks "Login with Lightning"
2. WebSocket connects
3. QR code displays
4. User scans with wallet (Sphinx, Zeus, etc.)
5. Wallet signs challenge
6. Success message via WebSocket
7. Redirect to dashboard
```

### Error Handling

```typescript
try {
  const { qrCode } = await login();
  setQRCode(qrCode);
} catch (error) {
  if (error.message.includes("WebSocket")) {
    // Show: "Connection failed, please refresh"
  } else if (error.message.includes("timeout")) {
    // Show: "Login timed out, please try again"
  } else {
    // Show: "Something went wrong"
  }
}
```

## 🧪 Testing Authentication

### Test LNURL Generation

```bash
curl "http://localhost:5002/lnauth?socketKey=test-123"
```

Expected response:

```json
{
  "k1": "a1b2c3d4e5f6...",
  "encode": "LNURL1DP68GURN8GHJ..."
}
```

### Test Protected Endpoint

```bash
curl -H "x-jwt: YOUR_TOKEN" http://localhost:5002/admin/auth
```

## 🔄 Token Refresh Strategy

```typescript
// Check token every hour
setInterval(
  async () => {
    const token = localStorage.getItem("jwt");
    if (isTokenExpiringSoon(token)) {
      await refreshToken();
    }
  },
  60 * 60 * 1000
);

function isTokenExpiringSoon(token: string): boolean {
  const payload = JSON.parse(atob(token.split(".")[1]));
  const expiresIn = payload.exp * 1000 - Date.now();
  return expiresIn < 24 * 60 * 60 * 1000; // Less than 1 day
}
```

## 📱 Wallet Compatibility

Compatible Lightning wallets:

- ✅ Sphinx Chat
- ✅ Zeus
- ✅ Blue Wallet
- ✅ Phoenix
- ✅ Breez
- ✅ Any wallet supporting LNURL-auth

## 🐛 Common Issues & Solutions

### Issue: QR Code Not Displaying

**Solution**: Check WebSocket connection first

```typescript
if (ws.readyState !== WebSocket.OPEN) {
  await reconnectWebSocket();
}
```

### Issue: "Token Expired" Error

**Solution**: Implement automatic refresh

```typescript
if (response.status === 401) {
  await refreshToken();
  // Retry request
}
```

### Issue: WebSocket Disconnects

**Solution**: Auto-reconnect with exponential backoff

```typescript
let reconnectAttempts = 0;
ws.onclose = () => {
  setTimeout(() => {
    reconnectAttempts++;
    reconnect();
  }, 1000 * reconnectAttempts);
};
```

## 📚 Complete Code Examples

All complete implementations are in the main documentation:

- `AUTHENTICATION_WORKFLOW.md` - Full detailed guide
- See "Implementation Guide for Next.js" section for:
  - WebSocket Manager
  - LNURL-Auth Manager
  - JWT Manager
  - React Hooks
  - Complete UI Components

## 🌐 Production Checklist

Before deploying to production:

- [ ] Change all `ws://` to `wss://`
- [ ] Change all `http://` to `https://`
- [ ] Set secure JWT secret key
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up monitoring
- [ ] Test token refresh flow
- [ ] Verify WebSocket reconnection
- [ ] Test error scenarios
- [ ] Add analytics/logging

## 🔗 Additional Resources

- Full Documentation: `AUTHENTICATION_WORKFLOW.md`
- LNURL Spec: https://github.com/fiatjaf/lnurl-rfc
- Sphinx Chat: https://sphinx.chat/
- Lightning Network: https://lightning.network/

## 💡 Pro Tips

1. **Cache QR Codes**: Generate once, reuse while valid
2. **Timeout Handling**: Set 2-minute timeout for QR scan
3. **Mobile Support**: Deep link to wallet apps
4. **Fallback UI**: Show manual LNURL string for copying
5. **Loading States**: Always show clear loading indicators

## 🎓 Learning Path

1. ✅ Read this Quick Start
2. ✅ Review `AUTHENTICATION_WORKFLOW.md` for details
3. ✅ Implement basic login flow
4. ✅ Add token refresh
5. ✅ Handle edge cases
6. ✅ Test thoroughly
7. ✅ Deploy!

---

**Need Help?** Check the full documentation in `AUTHENTICATION_WORKFLOW.md`

**Last Updated:** October 30, 2025
