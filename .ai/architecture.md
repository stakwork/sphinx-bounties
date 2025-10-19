# System Architecture

## Overview

Sphinx Bounties is a bounty management platform built on Next.js 15 with Bitcoin Lightning Network authentication via LNURL-auth. The system enables workspaces to create, manage, and distribute bounties to contributors with Bitcoin payments.

## Tech Stack

### Frontend

- **Framework:** Next.js 15.5.5 (App Router, React 19)
- **Language:** TypeScript 5.7 (strict mode)
- **Styling:** Tailwind CSS 4.0 + shadcn/ui components
- **State Management:** React Query (@tanstack/react-query v5)
- **Forms:** React Hook Form + Zod validation
- **Notifications:** Sonner (toast notifications)

### Backend

- **Runtime:** Node.js 20+ (server), Edge Runtime (middleware)
- **API:** Next.js API Routes (REST)
- **Database:** PostgreSQL 15+ with Prisma ORM 6.2
- **Authentication:** JWT (jose library) + LNURL-auth
- **Signature Verification:** @noble/secp256k1 (Bitcoin signatures)

### Testing

- **Unit/Integration:** Vitest + React Testing Library
- **E2E:** Playwright
- **Coverage:** 351/355 tests passing (98%)

### Development

- **Package Manager:** npm
- **Linting:** ESLint 9
- **Formatting:** Prettier (via ESLint)
- **Git Hooks:** (optional, not configured)

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  Next.js App Router + React 19 + Tailwind CSS + shadcn/ui      │
├─────────────────────────────────────────────────────────────────┤
│  React Query Hooks  │  Auth Components  │  UI Components        │
│  useAuth()          │  LoginModal       │  Button, Card, etc.   │
│  useChallenge()     │  UserMenu         │                       │
│  usePermissions()   │  AuthGuard        │                       │
│  useBounties()      │  PermissionGate   │                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP/REST + JSON
┌──────────────────────┴──────────────────────────────────────────┐
│                      EDGE MIDDLEWARE (Vercel)                    │
│  - JWT Session Validation (jose)                                │
│  - Header Injection (x-user-pubkey, x-workspace-id)             │
│  - No Database Queries (Edge Runtime Restriction)               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────────┐
│                    API ROUTES (Next.js)                          │
├─────────────────────────────────────────────────────────────────┤
│  /api/auth/           │  Authentication                          │
│    - challenge (POST) │  - Generate LNURL challenge             │
│    - verify (POST/GET)│  - Verify signature, create session     │
│    - session (GET)    │  - Get current user                     │
│    - logout (POST)    │  - Clear session cookie                 │
├─────────────────────────────────────────────────────────────────┤
│  /api/workspaces/     │  Workspace Management                   │
│    - list (GET)       │  - List user workspaces                 │
│    - create (POST)    │  - Create new workspace                 │
│    - [id] (GET/PATCH) │  - Get/update workspace                 │
│    - [id]/members     │  - Manage members                       │
├─────────────────────────────────────────────────────────────────┤
│  /api/bounties/       │  Bounty Management                      │
│    - list (GET)       │  - List public bounties                 │
│    - [id] (GET/PATCH) │  - Get/update bounty                    │
│    - [id]/assign      │  - Assign to user                       │
│    - [id]/submit      │  - Submit work                          │
├─────────────────────────────────────────────────────────────────┤
│  /api/users/          │  User Management                        │
│    - list (GET)       │  - List users                           │
│    - [pubkey] (GET)   │  - Get user profile                     │
│    - me (PATCH)       │  - Update own profile                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Prisma ORM
┌──────────────────────┴──────────────────────────────────────────┐
│                    DATABASE (PostgreSQL)                         │
├─────────────────────────────────────────────────────────────────┤
│  Users                │  Bitcoin pubkey (unique ID)             │
│  Workspaces           │  Team/organization containers           │
│  WorkspaceMembers     │  User roles (OWNER, ADMIN, etc.)        │
│  Bounties             │  Tasks with Bitcoin rewards             │
│  BountySubmissions    │  Work submissions                       │
│  AuthChallenges       │  LNURL-auth temporary challenges        │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

### LNURL-auth Authentication (Bitcoin Lightning)

```
1. User clicks "Login"
   ↓
2. Frontend calls POST /api/auth/challenge
   ↓
3. Backend generates random k1 (32 bytes)
   Backend creates LNURL: lnurl1... (encoded callback URL)
   Backend stores challenge in AuthChallenge table (5min expiry)
   ↓
4. Frontend displays QR code with LNURL
   Frontend starts polling GET /api/auth/session (every 2 seconds)
   ↓
5. User scans QR with Sphinx wallet
   ↓
6. Wallet signs k1 with user's Bitcoin private key
   Wallet calls GET /api/auth/verify?k1=...&sig=...&key=...
   ↓
7. Backend verifies signature with secp256k1
   Backend checks challenge not expired/used
   Backend creates/updates user record (pubkey = unique ID)
   Backend generates JWT with user data
   Backend sets HTTP-only cookie with JWT
   Backend marks challenge as used
   ↓
8. Frontend polling receives authenticated session
   Frontend redirects to dashboard
```

### Session Management

```
JWT Payload:
{
  pubkey: string,        // Bitcoin public key (user ID)
  username: string,      // Display username
  alias: string,         // Optional display name
  iat: number,           // Issued at timestamp
  exp: number            // Expiry (7 days default)
}

Cookie:
- Name: "session"
- HTTP-only: true
- Secure: true (production)
- SameSite: "lax"
- Max-Age: 7 days
- Path: "/"
```

### Authorization Layers

**Layer 1: Middleware (Edge Runtime)**

- Validates JWT signature and expiry
- Injects headers: x-user-pubkey, x-workspace-id, x-request-id
- Redirects unauthenticated users (protected routes)
- NO database queries (Edge runtime limitation)

**Layer 2: API Routes (Node.js Runtime)**

- Reads x-user-pubkey header from middleware
- Queries database for user/workspace data
- Validates workspace membership and roles
- Enforces permissions (OWNER, ADMIN, CONTRIBUTOR, VIEWER)

**Layer 3: Client Components**

- useAuth() hook provides session state
- usePermissions() hook provides role checks
- AuthGuard component protects pages
- PermissionGate component conditionally renders

## Database Schema

### Core Tables

**User**

```prisma
id              String   @id @default(cuid())
pubkey          String   @unique  // Bitcoin public key (primary identifier)
username        String   @unique  // Display name
alias           String?             // Optional friendly name
description     String?             // Bio
avatarUrl       String?             // Profile picture
githubUsername  String?             // GitHub integration
twitterUsername String?             // Twitter/X integration
createdAt       DateTime @default(now())
updatedAt       DateTime @updatedAt
lastLoginAt     DateTime?           // Last login timestamp
```

**Workspace**

```prisma
id          String   @id @default(cuid())
name        String
description String?
logoUrl     String?              // Workspace logo
isPublic    Boolean  @default(false)
createdAt   DateTime @default(now())
updatedAt   DateTime @updatedAt
members     WorkspaceMember[]    // Relations
bounties    Bounty[]             // Relations
budget      WorkspaceBudget?     // Relations
```

**WorkspaceMember**

```prisma
id          String        @id @default(cuid())
workspaceId String
workspace   Workspace     @relation(...)
userPubkey  String
user        User          @relation(...)
role        WorkspaceRole // OWNER, ADMIN, CONTRIBUTOR, VIEWER
joinedAt    DateTime      @default(now())

@@unique([workspaceId, userPubkey])
```

**Bounty**

```prisma
id              String       @id @default(cuid())
workspaceId     String
workspace       Workspace    @relation(...)
title           String
description     String
amountSats      Int          // Payment in satoshis
status          BountyStatus // OPEN, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
assignedToPubkey String?
assignedTo      User?        @relation(...)
skills          String[]     // Required skills (e.g., ["typescript", "react"])
createdByPubkey String
createdBy       User         @relation(...)
createdAt       DateTime     @default(now())
updatedAt       DateTime     @updatedAt
completedAt     DateTime?
submissions     BountySubmission[] // Relations
```

**AuthChallenge**

```prisma
k1        String   @id @db.VarChar(64)  // Random challenge (hex)
expiresAt DateTime                       // 5-minute expiry
used      Boolean  @default(false)      // Prevent replay attacks
createdAt DateTime @default(now())

@@index([expiresAt])
```

### Enums

**WorkspaceRole**

```typescript
OWNER; // Full control, can delete workspace
ADMIN; // Manage bounties, members (except owner)
CONTRIBUTOR; // Create submissions, comment
VIEWER; // Read-only access
```

**BountyStatus**

```typescript
OPEN; // Available to claim
ASSIGNED; // Assigned to a user
IN_PROGRESS; // User actively working
COMPLETED; // Finished and paid
CANCELLED; // No longer active
```

## Data Flow Examples

### Creating a Bounty

```
1. User authenticated via middleware (JWT validated)
   ↓
2. POST /api/workspaces/[id]/bounties
   Headers: x-user-pubkey, x-workspace-id
   ↓
3. API Route:
   - Validates request body (Zod schema)
   - Checks user is workspace member
   - Checks user has ADMIN or OWNER role
   - Creates bounty with Prisma
   - Returns success response
   ↓
4. Client receives response
   - React Query invalidates cache
   - Toast notification shown
   - UI updates optimistically
```

### Claiming a Bounty

```
1. User views bounty detail page
   ↓
2. POST /api/bounties/[id]/assign
   Headers: x-user-pubkey
   ↓
3. API Route:
   - Validates bounty is OPEN
   - Checks no existing assignment
   - Updates bounty status to ASSIGNED
   - Sets assignedToPubkey
   - Returns updated bounty
   ↓
4. Client receives update
   - Cache invalidated
   - UI shows "Assigned to you"
```

## File Structure

```
sphinx-bounties/
├── .ai/                          # AI documentation (this folder)
├── .cursorrules                  # Primary AI rules file
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # SQL migrations
├── public/                       # Static assets
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── api/                 # API routes
│   │   │   ├── auth/           # Authentication endpoints
│   │   │   ├── bounties/       # Bounty endpoints
│   │   │   ├── users/          # User endpoints
│   │   │   └── workspaces/     # Workspace endpoints
│   │   ├── (auth)/             # Auth route group
│   │   ├── login/              # Login page
│   │   ├── bounties/           # Bounty pages
│   │   ├── workspaces/         # Workspace pages
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── auth/               # Auth components
│   │   ├── common/             # Shared components
│   │   └── layout/             # Layout components
│   ├── hooks/                   # Custom React hooks
│   │   ├── use-auth.ts         # Session management
│   │   ├── use-challenge.ts    # LNURL flow
│   │   ├── use-permissions.ts  # Role checking
│   │   └── queries/            # React Query hooks
│   ├── lib/                     # Utilities and configs
│   │   ├── api.ts              # API utilities
│   │   ├── auth/               # Auth utilities
│   │   ├── db.ts               # Prisma client
│   │   ├── env.ts              # Environment validation
│   │   ├── error-constants.ts  # Error codes enum
│   │   ├── errors/             # Error handling
│   │   └── utils.ts            # General utilities
│   ├── services/                # Business logic (deprecated, use hooks/queries)
│   ├── validations/             # Zod schemas
│   │   ├── auth.ts             # Auth schemas
│   │   ├── bounty.ts           # Bounty schemas
│   │   ├── user.ts             # User schemas
│   │   └── workspace.ts        # Workspace schemas
│   ├── types/                   # TypeScript types
│   └── test/                    # Test setup
├── tests/
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # Playwright E2E tests
├── middleware.ts                # Edge middleware (auth)
└── vitest.config.ts            # Test configuration
```

## Key Design Decisions

### 1. Bitcoin Pubkey as User ID

**Decision:** Use Bitcoin public key (pubkey) as the primary user identifier instead of email.

**Rationale:**

- LNURL-auth uses Bitcoin keys for authentication
- No need for passwords or email verification
- Enables Lightning Network payments
- Privacy-focused (no email required)

**Implementation:**

- User table has `pubkey` as unique identifier
- All relations use `userPubkey` foreign key
- JWT contains `pubkey` in payload

### 2. Edge Middleware (No Database)

**Decision:** Middleware only validates JWT, never queries database.

**Rationale:**

- Edge runtime doesn't support Prisma/PostgreSQL
- Middleware needs <10ms latency for good UX
- Database queries would timeout in Edge
- Permission checks can happen in API routes

**Implementation:**

- Middleware validates JWT signature only
- Injects headers for API routes to use
- API routes query database for permissions

### 3. React Query for State Management

**Decision:** Use React Query instead of Redux/Zustand/Context.

**Rationale:**

- Server state synchronization built-in
- Automatic caching and refetching
- Optimistic updates support
- Loading/error states handled
- Less boilerplate than Redux

**Implementation:**

- All data fetching via useQuery hooks
- All mutations via useMutation hooks
- QueryClient configured in providers
- Cache invalidation on mutations

### 4. API Utilities Pattern

**Decision:** Standardize all API responses with apiSuccess/apiError utilities.

**Rationale:**

- Consistent response format across all endpoints
- Type-safe responses on frontend
- Built-in error logging
- Easier to debug and maintain

**Implementation:**

- Never use NextResponse.json directly
- Always use apiSuccess, apiError, apiCreated, apiPaginated
- All errors logged with logApiError

### 5. No Code Comments

**Decision:** Code should be self-documenting without comments.

**Rationale:**

- User preference
- Forces clear naming and structure
- Comments often become outdated
- Good code doesn't need explanation

**Implementation:**

- Use descriptive variable/function names
- Break complex logic into named functions
- Use TypeScript types for documentation

### 6. shadcn/ui Component Library

**Decision:** Use shadcn/ui instead of Material-UI or Chakra.

**Rationale:**

- Components are copied into codebase (full control)
- Built on Radix UI (accessible by default)
- Tailwind-based (consistent styling)
- No runtime JS overhead
- Easy to customize

**Implementation:**

- Install components with `npx shadcn@latest add <component>`
- Customize in src/components/ui/
- Use brand colors from Tailwind config

## Performance Considerations

### Database Queries

- Use proper indexes (pubkey, workspaceId, status, etc.)
- Avoid N+1 queries with Prisma `include`
- Use transactions for multi-step operations
- Clean up expired AuthChallenges periodically

### Caching Strategy

- React Query: 5-minute stale time for most queries
- Session: No refetch on window focus (manual refresh only)
- Optimistic updates for better UX
- Invalidate cache after mutations

### Edge Middleware

- JWT validation only (no DB queries)
- <10ms average response time
- Runs globally on Vercel Edge Network
- Minimal bundle size (jose library only)

## Security Measures

### Authentication

- HTTP-only cookies (no XSS)
- Secure flag in production (HTTPS)
- SameSite: lax (CSRF protection)
- JWT signature verification (HS256)
- Challenge replay protection (used flag)
- Challenge expiry (5 minutes)

### Authorization

- Permission checks in API routes
- Workspace membership validation
- Role-based access control
- Super admin env var only (no DB)

### Data Validation

- Zod schemas for all inputs
- Type-safe request handling
- SQL injection prevented (Prisma)
- XSS prevented (React escaping)

## Deployment

### Environment Requirements

- Node.js 20+
- PostgreSQL 15+
- Redis (optional, for future features)
- Vercel Edge Network (middleware)

### Environment Variables

```bash
DATABASE_URL              # PostgreSQL connection
NEXT_PUBLIC_APP_URL       # App URL for LNURL callbacks
JWT_SECRET                # Secret for JWT signing
JWT_EXPIRY_HOURS          # Session duration (default: 168 = 7 days)
SUPER_ADMINS              # CSV of pubkeys with full access
REDIS_URL                 # Optional Redis connection
```

### Build Process

1. Install dependencies: `npm install`
2. Generate Prisma client: `npx prisma generate`
3. Run migrations: `npx prisma migrate deploy`
4. Build Next.js: `npm run build`
5. Start server: `npm start`

### Monitoring & Logging

- Error logging with context metadata
- API request IDs for tracing
- User actions logged with pubkey
- Database query performance
- JWT validation failures

## Future Enhancements

### Planned Features

1. Lightning Network payments integration
2. Real-time notifications (WebSockets)
3. Bounty search with Elasticsearch
4. GitHub integration (sync issues)
5. Reputation system for contributors
6. Multi-signature workspace wallets
7. Automated bounty payouts
8. Discord/Slack notifications

### Technical Debt

- Migrate services/ to hooks/queries pattern
- Add Redis caching layer
- Implement rate limiting
- Add API versioning
- Improve test coverage (98% → 100%)
- Add Sentry error tracking
- Add analytics (PostHog/Plausible)
