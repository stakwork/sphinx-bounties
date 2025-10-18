# Phase 1: Authentication & Authorization System
## Implementation Plan & Deliverables

**Goal**: Build a production-ready, secure authentication system for sphinx-bounties using LNURL-auth, JWT sessions, and workspace-scoped role-based access control.

---

## Overview

### Key Decisions
- ✅ **LNURL-auth**: Lightning Network pubkey-based authentication
- ✅ **JWT in HTTP-only cookies**: Secure session storage, edge-compatible
- ✅ **Workspace-scoped roles**: OWNER, ADMIN, MEMBER, VIEWER (from Prisma schema)
- ✅ **Next.js middleware**: Edge runtime for fast auth checks on every request
- ✅ **Server Actions**: For login/logout/session mutations
- ✅ **Standardized errors**: Consistent auth error responses

### Security Best Practices
- HTTP-only, Secure, SameSite=Lax cookies
- Edge middleware for performance
- Short JWT expiry (7 days) with refresh mechanism
- Rate limiting on auth endpoints
- CSRF protection via Server Actions
- No client-side token storage

---

## File Structure

```
src/
├── lib/
│   ├── auth/
│   │   ├── index.ts              # Main exports
│   │   ├── lnurl.ts              # LNURL-auth challenge/verify
│   │   ├── jwt.ts                # JWT sign/verify/decode
│   │   ├── session.ts            # Session management (cookies)
│   │   ├── permissions.ts        # Role checking utilities
│   │   └── constants.ts          # Auth constants (expiry, cookie names)
│   └── errors/
│       ├── index.ts              # Error exports
│       └── auth-errors.ts        # Auth-specific error classes
├── middleware.ts                 # Next.js middleware (auth + role checks)
├── actions/
│   └── auth.ts                   # Server Actions (login, logout, refresh)
├── app/
│   └── api/
│       └── auth/
│           ├── challenge/
│           │   └── route.ts      # POST /api/auth/challenge
│           ├── verify/
│           │   └── route.ts      # POST /api/auth/verify
│           ├── logout/
│           │   └── route.ts      # POST /api/auth/logout
│           └── session/
│               └── route.ts      # GET /api/auth/session
├── hooks/
│   ├── use-auth.ts               # useAuth hook (session state)
│   ├── use-session.ts            # useSession hook (user data)
│   └── use-permissions.ts        # usePermissions hook (role checks)
└── types/
    └── auth.ts                   # Auth type definitions
```

---

## Implementation Steps

### Step 1: Core Auth Library
**Deliverables**: JWT utilities, session management, LNURL-auth helpers

#### 1.1 JWT Library (`src/lib/auth/jwt.ts`)
```typescript
// Functions to implement:
- signJWT(payload: JWTPayload): Promise<string>
- verifyJWT(token: string): Promise<JWTPayload | null>
- decodeJWT(token: string): JWTPayload | null (no verification)
- generateRefreshToken(): string

// JWTPayload structure (improved from Go backend):
{
  pubkey: string           // User's Lightning pubkey
  iat: number             // Issued at (unix timestamp)
  exp: number             // Expires at (unix timestamp)
  jti: string             // JWT ID (for revocation)
  role?: WorkspaceRole    // Optional: default workspace role
  workspaceId?: string    // Optional: active workspace context
}
```

**Dependencies**: `jose` library (edge-compatible JWT)
**Testing**: Unit tests for sign/verify/decode, expired tokens, invalid signatures

---

#### 1.2 Session Management (`src/lib/auth/session.ts`)
```typescript
// Functions to implement:
- setSession(response: NextResponse, token: string): void
- clearSession(response: NextResponse): void
- getSessionFromCookies(request: NextRequest): Promise<Session | null>
- getSessionFromHeaders(headers: Headers): Promise<Session | null>
- refreshSession(oldToken: string): Promise<string | null>

// Session type:
interface Session {
  pubkey: string
  expiresAt: Date
  user?: User  // Optional: cached user data
}
```

**Cookie config**: 
- Name: `sphinx_session`
- HTTP-only: `true`
- Secure: `process.env.NODE_ENV === 'production'`
- SameSite: `Lax`
- Path: `/`
- Max-Age: `7 days`

**Testing**: Unit tests for set/get/clear, edge cases (expired, missing cookies)

---

#### 1.3 LNURL-auth Implementation (`src/lib/auth/lnurl.ts`)
```typescript
// Functions to implement:
- generateChallenge(): Promise<LNURLChallenge>
- verifySignature(params: VerifyParams): Promise<boolean>
- storeChallengeInCache(k1: string, expiresIn: number): Promise<void>
- getChallengeFromCache(k1: string): Promise<string | null>

// Types:
interface LNURLChallenge {
  k1: string              // 32-byte hex challenge
  lnurl: string           // bech32-encoded LNURL
  expiresAt: Date         // Challenge expiry (5 minutes)
}

interface VerifyParams {
  k1: string              // Challenge from URL
  sig: string             // DER signature
  key: string             // User's pubkey (hex)
}
```

**Storage**: Use Redis/Upstash for challenge storage (5-min TTL)
**Dependencies**: `@synonymdev/lnurl` or custom implementation
**Testing**: Unit tests for challenge generation, signature verification, expiry

---

#### 1.4 Permission Utilities (`src/lib/auth/permissions.ts`)
```typescript
// Functions to implement:
- hasWorkspaceRole(userId: string, workspaceId: string, role: WorkspaceRole): Promise<boolean>
- hasAnyWorkspaceRole(userId: string, workspaceId: string, roles: WorkspaceRole[]): Promise<boolean>
- getUserWorkspaceRole(userId: string, workspaceId: string): Promise<WorkspaceRole | null>
- canManageBounty(userId: string, bountyId: string): Promise<boolean>
- canManageWorkspace(userId: string, workspaceId: string): Promise<boolean>
- isSuperAdmin(pubkey: string): boolean  // For backwards compatibility

// Role hierarchy (higher includes lower):
OWNER > ADMIN > MEMBER > VIEWER
```

**Database queries**: Use Prisma to check `UserWorkspace.role`
**Testing**: Integration tests with test database, various role combinations

---

#### 1.5 Auth Error Classes (`src/lib/errors/auth-errors.ts`)
```typescript
// Classes to implement:
- UnauthorizedError (401)
- ForbiddenError (403)
- InvalidTokenError (401)
- ExpiredTokenError (401)
- InvalidSignatureError (401)
- ChallengeExpiredError (401)
- InsufficientPermissionsError (403)

// All extend base AppError with:
- statusCode: number
- code: string (e.g., 'UNAUTHORIZED')
- message: string
- metadata?: Record<string, any>
```

**Testing**: Unit tests for error creation, serialization

---

### Step 2: API Routes
**Deliverables**: Auth endpoints for challenge, verify, logout, session

#### 2.1 Challenge Endpoint (`/api/auth/challenge`)
```typescript
// POST /api/auth/challenge
// Body: { callbackUrl?: string }
// Response: { k1: string, lnurl: string, expiresAt: string }

// Steps:
1. Generate 32-byte challenge (k1)
2. Store k1 in cache with 5-min expiry
3. Encode LNURL with callback to /api/auth/verify
4. Return challenge to client
```

**Rate limiting**: 10 requests per IP per minute
**Testing**: Integration tests for generation, expiry

---

#### 2.2 Verify Endpoint (`/api/auth/verify`)
```typescript
// POST /api/auth/verify
// Body: { k1: string, sig: string, key: string }
// Response: { success: true, redirectTo?: string } + Set-Cookie

// Steps:
1. Retrieve k1 from cache (check expiry)
2. Verify signature using key (pubkey) and k1
3. Find or create user by pubkey
4. Generate JWT with user data
5. Set HTTP-only session cookie
6. Return success + optional redirect
```

**Error responses**: 
- 401 if signature invalid
- 401 if challenge expired/not found
- 500 if user creation fails

**Testing**: Integration tests for valid/invalid signatures, expired challenges

---

#### 2.3 Logout Endpoint (`/api/auth/logout`)
```typescript
// POST /api/auth/logout
// Response: { success: true } + Clear-Cookie

// Steps:
1. Get session from cookies
2. Optionally: Add JWT to revocation list (Redis)
3. Clear session cookie
4. Return success
```

**Testing**: Integration tests for successful logout

---

#### 2.4 Session Endpoint (`/api/auth/session`)
```typescript
// GET /api/auth/session
// Response: { user: User, expiresAt: string } | { user: null }

// Steps:
1. Get session from cookies
2. Verify JWT
3. Fetch user from database (with workspaces)
4. Return user data or null if invalid
```

**Caching**: Consider caching user data for 1 minute to reduce DB queries
**Testing**: Integration tests for valid/invalid/expired sessions

---

### Step 3: Next.js Middleware
**Deliverables**: Edge middleware for auth and role-based route protection

#### 3.1 Middleware Implementation (`src/middleware.ts`)
```typescript
// Middleware logic:
1. Extract JWT from cookies
2. Verify JWT (lightweight, no DB query on edge)
3. Check route against protection rules
4. Allow/deny/redirect based on auth status

// Route protection patterns:
- /api/auth/* → Public (except /session requires auth)
- /api/* → Require auth (extract pubkey to headers)
- /admin → Require super admin
- /workspaces/[id]/settings → Require workspace owner/admin
- /bounties/create → Require auth
- / → Public
```

**Performance**: Runs on edge, <10ms overhead
**Headers**: Add `x-user-pubkey` header for downstream route handlers
**Redirects**: 
- Unauthenticated → `/login?redirect={current}`
- Unauthorized → `/unauthorized`

**Testing**: Integration tests for various routes and auth states

---

#### 3.2 Middleware Helpers (`src/lib/auth/middleware-helpers.ts`)
```typescript
// Functions for use in middleware:
- isPublicRoute(pathname: string): boolean
- requiresAuth(pathname: string): boolean
- requiresRole(pathname: string): WorkspaceRole | null
- extractWorkspaceId(pathname: string): string | null
```

**Testing**: Unit tests for route matching

---

### Step 4: Server Actions
**Deliverables**: Server Actions for auth mutations

#### 4.1 Auth Actions (`src/actions/auth.ts`)
```typescript
// Server Actions:
'use server'

- login(k1: string, sig: string, key: string): Promise<LoginResult>
- logout(): Promise<void>
- refreshSession(): Promise<void>
- updateActiveWorkspace(workspaceId: string): Promise<void>

// LoginResult type:
interface LoginResult {
  success: boolean
  error?: string
  redirectTo?: string
}
```

**Usage**: Forms with progressive enhancement
**Testing**: Integration tests with mock session

---

### Step 5: Client Hooks
**Deliverables**: React hooks for auth state in client components

#### 5.1 useAuth Hook (`src/hooks/use-auth.ts`)
```typescript
// Hook exports:
const {
  isAuthenticated,     // boolean
  isLoading,          // boolean
  user,               // User | null
  login,              // (k1, sig, key) => Promise<void>
  logout,             // () => Promise<void>
  refresh,            // () => Promise<void>
} = useAuth()

// Implementation:
- Fetch /api/auth/session on mount
- Use TanStack Query for caching
- Optimistic updates on login/logout
- Auto-refresh before expiry
```

**Testing**: Component tests with MSW for API mocking

---

#### 5.2 useSession Hook (`src/hooks/use-session.ts`)
```typescript
// Hook exports:
const {
  user,               // User | null
  expiresAt,          // Date | null
  workspaces,         // Workspace[]
  activeWorkspace,    // Workspace | null
  switchWorkspace,    // (id: string) => Promise<void>
} = useSession()

// Implementation:
- Wraps useAuth with workspace context
- Fetches user workspaces on login
- Manages active workspace in Zustand
```

**Testing**: Component tests with mock user data

---

#### 5.3 usePermissions Hook (`src/hooks/use-permissions.ts`)
```typescript
// Hook exports:
const {
  canManageBounty,       // (bountyId: string) => boolean
  canManageWorkspace,    // (workspaceId: string) => boolean
  hasWorkspaceRole,      // (workspaceId: string, role: WorkspaceRole) => boolean
  isSuperAdmin,          // boolean
} = usePermissions()

// Implementation:
- Uses session data for role checks
- Client-side permission helpers
- Works with server-validated data
```

**Testing**: Unit tests with various user roles

---

### Step 6: Auth UI Components
**Deliverables**: Login modal, logout button, auth guards

#### 6.1 LoginModal Component (`src/components/auth/login-modal.tsx`)
```typescript
// Features:
- Display LNURL-auth QR code
- Show loading states during verification
- Handle errors (expired, invalid signature)
- Redirect after successful login
- Optional: Lightning wallet connect button
```

**Testing**: Component tests for render, user interactions

---

#### 6.2 LogoutButton Component (`src/components/auth/logout-button.tsx`)
```typescript
// Features:
- Confirm logout action
- Show loading state
- Handle errors
- Redirect to home after logout
```

**Testing**: Component tests for click handling

---

#### 6.3 AuthGuard Component (`src/components/auth/auth-guard.tsx`)
```typescript
// Usage: Wrap protected client components
<AuthGuard fallback={<LoginPrompt />}>
  <ProtectedContent />
</AuthGuard>

// Features:
- Check auth status
- Show fallback if unauthenticated
- Optional: role-based guards
```

**Testing**: Component tests with auth/unauth states

---

### Step 7: Type Definitions
**Deliverables**: TypeScript types for auth system

#### 7.1 Auth Types (`src/types/auth.ts`)
```typescript
// Types to define:
- JWTPayload
- Session
- LNURLChallenge
- VerifyParams
- LoginResult
- AuthError
- PermissionCheck
- WorkspaceContext
```

**Testing**: Type-level tests with `expectType` (Vitest)

---

## Testing Strategy

### Unit Tests
- JWT sign/verify/decode
- Session management (set/get/clear)
- LNURL challenge generation
- Signature verification
- Permission utilities
- Error classes

### Integration Tests
- Challenge endpoint → verify endpoint flow
- Login flow end-to-end
- Logout flow
- Session refresh
- Middleware route protection
- Permission checks with database

### E2E Tests (Playwright)
- Complete LNURL-auth flow
- Login → protected page → logout
- Role-based access (admin vs member)
- Session expiry handling

---

## Security Checklist

- [ ] HTTP-only cookies for JWT storage
- [ ] Secure flag in production
- [ ] SameSite=Lax for CSRF protection
- [ ] JWT expiry (7 days max)
- [ ] Challenge expiry (5 minutes)
- [ ] Rate limiting on auth endpoints
- [ ] Signature verification for LNURL-auth
- [ ] No client-side token storage
- [ ] HTTPS enforced in production
- [ ] Environment variables for secrets (`JWT_SECRET`)
- [ ] Revocation list for logout (optional)
- [ ] Audit logging for auth events

---

## Environment Variables

```bash
# Required
JWT_SECRET=<random-256-bit-secret>
JWT_EXPIRY_HOURS=168  # 7 days

# Optional
REDIS_URL=<upstash-redis-url>  # For challenge storage
SUPER_ADMINS=<comma-separated-pubkeys>  # Legacy admin list
NODE_ENV=production  # For cookie security
```

---

## Dependencies to Install

```bash
npm install jose                    # Edge-compatible JWT
npm install @upstash/redis         # Challenge storage
npm install @synonymdev/lnurl      # LNURL utilities (or custom)
```

---

## Rollout Plan

### Phase 1a: Core Library (Days 1-2)
- [ ] JWT utilities
- [ ] Session management
- [ ] LNURL-auth helpers
- [ ] Permission utilities
- [ ] Error classes

### Phase 1b: API Routes (Days 3-4)
- [ ] Challenge endpoint
- [ ] Verify endpoint
- [ ] Logout endpoint
- [ ] Session endpoint

### Phase 1c: Middleware (Day 5)
- [ ] Next.js middleware
- [ ] Route protection rules
- [ ] Header injection

### Phase 1d: Server Actions (Day 6)
- [ ] Login action
- [ ] Logout action
- [ ] Refresh action

### Phase 1e: Client Hooks (Day 7)
- [ ] useAuth hook
- [ ] useSession hook
- [ ] usePermissions hook

### Phase 1f: UI Components (Day 8)
- [ ] LoginModal
- [ ] LogoutButton
- [ ] AuthGuard

### Phase 1g: Testing (Days 9-10)
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] E2E tests

---

## Success Criteria

- [ ] Users can log in with LNURL-auth
- [ ] Session persists across page reloads
- [ ] Logout clears session
- [ ] Protected routes redirect to login
- [ ] Workspace roles enforce permissions
- [ ] Admin routes require super admin
- [ ] All tests passing (unit + integration + e2e)
- [ ] No client-side token exposure
- [ ] Performance: <10ms middleware overhead
- [ ] Security: All checklist items addressed

---

## Future Enhancements (Post-Phase 1)

- [ ] Refresh tokens (extend session beyond 7 days)
- [ ] Session revocation list (Redis-based)
- [ ] Multi-factor authentication (optional TOTP)
- [ ] Social login (optional, in addition to LNURL)
- [ ] Audit log for auth events (login, logout, permission changes)
- [ ] Rate limiting per user (not just IP)
- [ ] Workspace invitations with role assignment
- [ ] Permission presets (templates for common role configs)

---

## References

- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [jose JWT Library](https://github.com/panva/jose)
- [LNURL Spec](https://github.com/lnurl/luds)
- [Upstash Redis](https://docs.upstash.com/redis)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

---

## Questions / Decisions Needed

1. **Challenge Storage**: Use Redis (Upstash) or PostgreSQL for k1 storage?
   - Recommendation: Redis (faster, auto-expiry)

2. **Refresh Tokens**: Implement now or later?
   - Recommendation: Later (Phase 1 uses 7-day JWT, refresh in Phase 2)

3. **Super Admin List**: Keep env var or move to database?
   - Recommendation: Keep env var for now, migrate to DB in Phase 10

4. **LNURL Library**: Use `@synonymdev/lnurl` or custom implementation?
   - Recommendation: Custom for control, or use library if mature

5. **Session Caching**: Cache user data on edge or always fetch from DB?
   - Recommendation: JWT contains pubkey only, fetch user from DB in API routes

---

**End of Phase 1 Plan**
