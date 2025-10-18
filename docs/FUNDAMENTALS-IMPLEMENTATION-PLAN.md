# Fundamentals Implementation Plan
## Building a Solid Foundation Before Features

**Philosophy**: Establish patterns, standards, and infrastructure FIRST. Then build features on top of this solid foundation.

---

## Prioritization Rationale

### Why Fundamentals First?

1. **Consistency**: All features will use the same patterns from day 1
2. **Avoid Refactoring**: No painful migrations when standards change mid-project
3. **Faster Development**: Clear patterns = less decision-making per feature
4. **Better Testing**: Test infrastructure ready before writing feature tests
5. **Code Quality**: Standards enforced from the start

### What Are "Fundamentals"?

Infrastructure that EVERY feature will use:
- API response formats
- Error handling
- Loading states
- User feedback (toasts)
- Form patterns
- Data fetching
- Code organization
- Testing utilities

### What Comes After?

Feature-specific implementations that USE the fundamentals:
- Authentication (uses forms, API, errors, toasts, loading)
- Lightning integration (feature-specific, we'll tackle later)
- Real-time updates (feature-specific, we'll tackle later)

---

## Implementation Order

### Phase 1: API Response Standards & Validation
**Duration**: 2 days  
**Priority**: CRITICAL - Foundation for all API endpoints  
**Dependencies**: None

### Phase 2: Error Handling System
**Duration**: 2 days  
**Priority**: CRITICAL - Foundation for all error cases  
**Dependencies**: Phase 1 (uses API error format)

### Phase 3: Loading States & Skeletons
**Duration**: 2 days  
**Priority**: HIGH - Foundation for all UI  
**Dependencies**: None (can run parallel with Phase 1-2)

### Phase 4: Toast Notifications System
**Duration**: 1 day  
**Priority**: HIGH - Foundation for user feedback  
**Dependencies**: Phase 2 (uses error types)

### Phase 5: Code Organization & Constants
**Duration**: 1 day  
**Priority**: HIGH - Foundation for clean code  
**Dependencies**: None

### Phase 6: Form Handling & Validation
**Duration**: 2 days  
**Priority**: HIGH - Foundation for all forms  
**Dependencies**: Phase 1 (validation), Phase 2 (errors), Phase 4 (toasts)

### Phase 7: Data Fetching Patterns
**Duration**: 2 days  
**Priority**: HIGH - Foundation for all queries  
**Dependencies**: Phase 1 (API client), Phase 2 (errors), Phase 4 (toasts)

### Phase 8: Development Tools & Testing Infrastructure
**Duration**: 2 days  
**Priority**: MEDIUM - Foundation for quality  
**Dependencies**: Phases 1-7 (tests patterns established)

**Total Fundamentals Time**: ~14 days

---

## Phase 1: API Response Standards & Validation

### Goals
- Consistent response format across ALL API routes
- Standardized error responses
- Request validation with Zod
- Pagination utilities
- Type-safe API responses

### File Structure
```
src/
├── lib/
│   └── api/
│       ├── index.ts              # Main exports
│       ├── response.ts           # Response builders
│       ├── validation.ts         # Request validation
│       └── pagination.ts         # Pagination utilities
└── types/
    └── api.ts                    # API type definitions
```

### Deliverables

#### 1.1 Response Type Definitions (`src/types/api.ts`)
```typescript
// Standard response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  meta?: ApiMeta
}

export interface ApiError {
  code: string           // Machine-readable error code
  message: string        // Human-readable message
  details?: any          // Additional error context
  field?: string         // For validation errors
}

export interface ApiMeta {
  timestamp: string
  requestId?: string
  // Pagination meta (when applicable)
  pagination?: {
    page: number
    pageSize: number
    totalPages: number
    totalCount: number
    hasMore: boolean
  }
}

// Pagination request params
export interface PaginationParams {
  page?: number
  pageSize?: number
  cursor?: string
}

// Sorting params
export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Filter params (generic)
export interface FilterParams {
  [key: string]: any
}
```

#### 1.2 Response Builders (`src/lib/api/response.ts`)
```typescript
import { NextResponse } from 'next/server'
import { ApiResponse, ApiError, ApiMeta } from '@/types/api'

// Success response
export function apiSuccess<T>(
  data: T,
  meta?: Partial<ApiMeta>,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    },
    { status }
  )
}

// Error response
export function apiError(
  error: ApiError,
  status = 400,
  meta?: Partial<ApiMeta>
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    },
    { status }
  )
}

// Paginated response
export function apiPaginated<T>(
  data: T[],
  pagination: {
    page: number
    pageSize: number
    totalCount: number
  },
  meta?: Partial<ApiMeta>,
  status = 200
): NextResponse<ApiResponse<T[]>> {
  const { page, pageSize, totalCount } = pagination
  const totalPages = Math.ceil(totalCount / pageSize)
  const hasMore = page < totalPages

  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
        pagination: {
          page,
          pageSize,
          totalPages,
          totalCount,
          hasMore,
        },
      },
    },
    { status }
  )
}

// Created response (201)
export function apiCreated<T>(data: T, meta?: Partial<ApiMeta>) {
  return apiSuccess(data, meta, 201)
}

// No content response (204)
export function apiNoContent() {
  return new NextResponse(null, { status: 204 })
}
```

#### 1.3 Validation Utilities (`src/lib/api/validation.ts`)
```typescript
import { z, ZodSchema } from 'zod'
import { NextRequest } from 'next/server'
import { apiError } from './response'

// Validate request body
export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T | null; error: ReturnType<typeof apiError> | null }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { data, error: null }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        data: null,
        error: apiError(
          {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: err.errors,
          },
          400
        ),
      }
    }
    return {
      data: null,
      error: apiError(
        {
          code: 'INVALID_JSON',
          message: 'Invalid JSON in request body',
        },
        400
      ),
    }
  }
}

// Validate query params
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): { data: T | null; error: ReturnType<typeof apiError> | null } {
  try {
    // Convert URLSearchParams to object
    const params = Object.fromEntries(searchParams.entries())
    const data = schema.parse(params)
    return { data, error: null }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        data: null,
        error: apiError(
          {
            code: 'VALIDATION_ERROR',
            message: 'Query parameter validation failed',
            details: err.errors,
          },
          400
        ),
      }
    }
    return { data: null, error: null }
  }
}

// Common validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export const idSchema = z.object({
  id: z.string().uuid(),
})

export const pubkeySchema = z.object({
  pubkey: z.string().min(64).max(66),
})
```

#### 1.4 Pagination Utilities (`src/lib/api/pagination.ts`)
```typescript
import { PaginationParams } from '@/types/api'

// Calculate skip/take for Prisma
export function getPaginationValues(params: PaginationParams) {
  const page = params.page || 1
  const pageSize = params.pageSize || 20
  const skip = (page - 1) * pageSize
  const take = pageSize

  return { skip, take, page, pageSize }
}

// Generate pagination meta
export function getPaginationMeta(
  page: number,
  pageSize: number,
  totalCount: number
) {
  const totalPages = Math.ceil(totalCount / pageSize)
  const hasMore = page < totalPages

  return {
    page,
    pageSize,
    totalPages,
    totalCount,
    hasMore,
  }
}
```

### Testing Requirements
- [ ] Unit tests for response builders (success, error, paginated)
- [ ] Unit tests for validation (body, query, invalid cases)
- [ ] Unit tests for pagination utilities
- [ ] Integration tests: Sample API route using all patterns

### Success Criteria
- [ ] All response builders work correctly
- [ ] Validation catches invalid requests
- [ ] Pagination calculates correctly
- [ ] Types are fully type-safe
- [ ] Example route demonstrates usage

---

## Phase 2: Error Handling System

### Goals
- Custom error classes for all error types
- Error boundaries for React
- Error display components
- Error logging
- Consistent error mapping

### File Structure
```
src/
├── lib/
│   └── errors/
│       ├── index.ts              # Main exports
│       ├── base.ts               # Base AppError class
│       ├── classes.ts            # Specific error classes
│       ├── mapper.ts             # Error mapping utilities
│       └── logger.ts             # Error logging
├── components/
│   └── errors/
│       ├── index.ts              # Exports
│       ├── error-card.tsx        # Error display component
│       └── error-boundary.tsx    # Client error boundary
└── app/
    ├── error.tsx                 # Enhanced route error
    ├── global-error.tsx          # Enhanced global error
    ├── not-found.tsx             # Enhanced 404
    └── unauthorized.tsx          # New 401 page
```

### Deliverables

#### 2.1 Base Error Class (`src/lib/errors/base.ts`)
```typescript
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean
  public readonly metadata?: Record<string, any>

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true,
    metadata?: Record<string, any>
  ) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational
    this.metadata = metadata

    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.metadata,
    }
  }
}
```

#### 2.2 Specific Error Classes (`src/lib/errors/classes.ts`)
```typescript
import { AppError } from './base'

// 400 Bad Request
export class ValidationError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', true, metadata)
  }
}

// 401 Unauthorized
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', metadata?: Record<string, any>) {
    super(message, 401, 'UNAUTHORIZED', true, metadata)
  }
}

// 403 Forbidden
export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions', metadata?: Record<string, any>) {
    super(message, 403, 'FORBIDDEN', true, metadata)
  }
}

// 404 Not Found
export class NotFoundError extends AppError {
  constructor(resource: string, metadata?: Record<string, any>) {
    super(`${resource} not found`, 404, 'NOT_FOUND', true, metadata)
  }
}

// 409 Conflict
export class ConflictError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 409, 'CONFLICT', true, metadata)
  }
}

// 429 Rate Limit
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', metadata?: Record<string, any>) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true, metadata)
  }
}

// 500 Internal Server Error
export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', metadata?: Record<string, any>) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', false, metadata)
  }
}

// Database errors
export class DatabaseError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 500, 'DATABASE_ERROR', false, metadata)
  }
}
```

#### 2.3 Error Mapper (`src/lib/errors/mapper.ts`)
```typescript
import { AppError, ValidationError, NotFoundError, DatabaseError } from './classes'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'

export function mapErrorToAppError(error: unknown): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error
  }

  // Zod validation error
  if (error instanceof ZodError) {
    return new ValidationError('Validation failed', {
      errors: error.errors,
    })
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return new ValidationError('Unique constraint violation', {
          fields: error.meta?.target,
        })
      case 'P2025':
        return new NotFoundError('Record', {
          model: error.meta?.modelName,
        })
      default:
        return new DatabaseError(`Database error: ${error.code}`, {
          code: error.code,
        })
    }
  }

  // Generic error
  if (error instanceof Error) {
    return new AppError(
      error.message,
      500,
      'UNKNOWN_ERROR',
      false
    )
  }

  // Unknown error
  return new AppError(
    'An unknown error occurred',
    500,
    'UNKNOWN_ERROR',
    false
  )
}
```

#### 2.4 Error Display Component (`src/components/errors/error-card.tsx`)
```typescript
'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface ErrorCardProps {
  title?: string
  message: string
  code?: string
  onRetry?: () => void
  showDetails?: boolean
  details?: any
}

export function ErrorCard({
  title = 'Error',
  message,
  code,
  onRetry,
  showDetails = false,
  details,
}: ErrorCardProps) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <div className="ml-2 flex-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm mt-1">{message}</p>
        {code && (
          <p className="text-xs text-muted-foreground mt-1">Code: {code}</p>
        )}
        {showDetails && details && (
          <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto">
            {JSON.stringify(details, null, 2)}
          </pre>
        )}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    </Alert>
  )
}
```

#### 2.5 Enhanced Error Pages
```typescript
// app/error.tsx (route-level errors)
'use client'

import { useEffect } from 'react'
import { ErrorCard } from '@/components/errors/error-card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error('Route error:', error)
  }, [error])

  return (
    <div className="container mx-auto py-10">
      <ErrorCard
        title="Something went wrong"
        message={error.message || 'An unexpected error occurred'}
        code={error.digest}
        onRetry={reset}
      />
    </div>
  )
}

// app/not-found.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container mx-auto py-20 text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">Page not found</p>
      <Button asChild>
        <Link href="/">Go home</Link>
      </Button>
    </div>
  )
}

// app/unauthorized.tsx (new)
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Unauthorized() {
  return (
    <div className="container mx-auto py-20 text-center">
      <h1 className="text-4xl font-bold mb-4">401</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Authentication required
      </p>
      <Button asChild>
        <Link href="/login">Sign in</Link>
      </Button>
    </div>
  )
}
```

### Testing Requirements
- [ ] Unit tests for all error classes
- [ ] Unit tests for error mapper (Prisma, Zod, generic)
- [ ] Component tests for ErrorCard
- [ ] Integration tests for error pages

### Success Criteria
- [ ] All error types have corresponding classes
- [ ] Error mapping handles all common cases
- [ ] Error display is consistent and user-friendly
- [ ] Error pages render correctly

---

## Phase 3: Loading States & Skeletons

### Goals
- Skeleton components for all UI patterns
- Loading states for all routes
- Suspense boundaries

### File Structure
```
src/
├── components/
│   └── loading/
│       ├── index.ts              # Exports
│       ├── page-skeleton.tsx     # Full page skeleton
│       ├── card-skeleton.tsx     # Card skeleton
│       ├── table-skeleton.tsx    # Table skeleton
│       ├── bounty-skeleton.tsx   # Bounty card skeleton
│       └── profile-skeleton.tsx  # Profile skeleton
└── app/
    ├── loading.tsx               # Root loading
    ├── bounties/
    │   └── loading.tsx
    ├── workspaces/
    │   └── loading.tsx
    ├── people/
    │   └── loading.tsx
    └── admin/
        └── loading.tsx
```

### Deliverables

#### 3.1 Base Skeleton Component
```typescript
import { Skeleton } from '@/components/ui/skeleton'

export function PageSkeleton() {
  return (
    <div className="container mx-auto py-10 space-y-6">
      <Skeleton className="h-10 w-1/3" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="border rounded-lg">
      <div className="p-4 border-b">
        <Skeleton className="h-6 w-1/4" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-4 border-b flex gap-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/6" />
        </div>
      ))}
    </div>
  )
}

export function BountySkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-4 items-center mt-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24 ml-auto" />
      </div>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  )
}
```

#### 3.2 Route Loading States
```typescript
// app/bounties/loading.tsx
import { PageSkeleton, BountySkeleton } from '@/components/loading'

export default function Loading() {
  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <BountySkeleton />
        <BountySkeleton />
        <BountySkeleton />
        <BountySkeleton />
      </div>
    </div>
  )
}
```

### Testing Requirements
- [ ] Visual tests for all skeleton components
- [ ] Component tests for loading states

### Success Criteria
- [ ] All routes have loading.tsx files
- [ ] Skeletons match final UI layout
- [ ] Loading states are smooth and quick

---

## Phase 4: Toast Notifications System

### Goals
- Enhanced Sonner configuration
- Toast templates for common cases
- Toast action patterns

### File Structure
```
src/
├── lib/
│   ├── toast.ts                  # Enhanced (already exists)
│   └── notifications/
│       ├── index.ts              # Exports
│       └── templates.ts          # Toast templates
└── components/
    └── ui/
        └── sonner.tsx            # Enhanced (already exists)
```

### Deliverables

#### 4.1 Enhanced Toast Utilities (`src/lib/toast.ts`)
```typescript
import { toast as sonnerToast } from 'sonner'

export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, { description })
  },

  error: (message: string, description?: string) => {
    sonnerToast.error(message, { description })
  },

  info: (message: string, description?: string) => {
    sonnerToast.info(message, { description })
  },

  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, { description })
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return sonnerToast.promise(promise, messages)
  },

  loading: (message: string) => {
    return sonnerToast.loading(message)
  },

  dismiss: (id?: string | number) => {
    sonnerToast.dismiss(id)
  },
}
```

#### 4.2 Toast Templates (`src/lib/notifications/templates.ts`)
```typescript
import { toast } from '@/lib/toast'

// Auth toasts
export const authToasts = {
  loginSuccess: () => toast.success('Welcome back!'),
  loginError: () => toast.error('Login failed', 'Please try again'),
  logoutSuccess: () => toast.success('Logged out successfully'),
  unauthorized: () => toast.error('Authentication required'),
}

// CRUD toasts
export const crudToasts = {
  createSuccess: (resource: string) =>
    toast.success(`${resource} created successfully`),
  createError: (resource: string) =>
    toast.error(`Failed to create ${resource}`),
  updateSuccess: (resource: string) =>
    toast.success(`${resource} updated successfully`),
  updateError: (resource: string) =>
    toast.error(`Failed to update ${resource}`),
  deleteSuccess: (resource: string) =>
    toast.success(`${resource} deleted successfully`),
  deleteError: (resource: string) =>
    toast.error(`Failed to delete ${resource}`),
}

// Form toasts
export const formToasts = {
  validationError: () => toast.error('Please check the form for errors'),
  saveSuccess: () => toast.success('Changes saved'),
  saveError: () => toast.error('Failed to save changes'),
}

// Network toasts
export const networkToasts = {
  offline: () => toast.error('You are offline'),
  reconnected: () => toast.success('Connection restored'),
  timeout: () => toast.error('Request timed out', 'Please try again'),
}
```

### Testing Requirements
- [ ] Unit tests for toast utilities
- [ ] Visual tests for toast appearances

### Success Criteria
- [ ] Toast templates cover common cases
- [ ] Toasts are consistent in appearance
- [ ] Toast actions work correctly

---

## Phase 5: Code Organization & Constants

### Goals
- Centralized constants
- Utility functions
- Clean imports

### File Structure
```
src/
├── lib/
│   ├── constants/
│   │   ├── index.ts              # Main exports
│   │   ├── routes.ts             # Route paths
│   │   ├── roles.ts              # Role definitions
│   │   ├── statuses.ts           # Status constants
│   │   └── limits.ts             # Limits & quotas
│   └── utils/
│       ├── index.ts              # Enhanced exports
│       ├── format.ts             # Formatting utilities
│       ├── dates.ts              # Date utilities
│       └── validation.ts         # Validation helpers
```

### Deliverables

#### 5.1 Route Constants (`src/lib/constants/routes.ts`)
```typescript
export const ROUTES = {
  HOME: '/',
  BOUNTIES: '/bounties',
  BOUNTY_DETAIL: (id: string) => `/bounties/${id}`,
  BOUNTY_CREATE: '/bounties/create',
  WORKSPACES: '/workspaces',
  WORKSPACE_DETAIL: (id: string) => `/workspaces/${id}`,
  WORKSPACE_SETTINGS: (id: string) => `/workspaces/${id}/settings`,
  PEOPLE: '/people',
  PERSON_DETAIL: (pubkey: string) => `/people/${pubkey}`,
  ADMIN: '/admin',
  LEADERBOARD: '/leaderboard',
  SETTINGS: '/settings',
  LOGIN: '/login',
  UNAUTHORIZED: '/unauthorized',
} as const

export const API_ROUTES = {
  AUTH: {
    CHALLENGE: '/api/auth/challenge',
    VERIFY: '/api/auth/verify',
    LOGOUT: '/api/auth/logout',
    SESSION: '/api/auth/session',
  },
  BOUNTIES: '/api/bounties',
  WORKSPACES: '/api/workspaces',
  USERS: '/api/users',
} as const
```

#### 5.2 Status Constants (`src/lib/constants/statuses.ts`)
```typescript
import {
  BountyStatus,
  WorkspaceRole,
  TransactionStatus,
  InvoiceStatus,
  NotificationType,
} from '@prisma/client'

// Status display configurations
export const BOUNTY_STATUS_CONFIG = {
  [BountyStatus.DRAFT]: {
    label: 'Draft',
    color: 'gray',
  },
  [BountyStatus.OPEN]: {
    label: 'Open',
    color: 'green',
  },
  [BountyStatus.IN_PROGRESS]: {
    label: 'In Progress',
    color: 'blue',
  },
  [BountyStatus.IN_REVIEW]: {
    label: 'In Review',
    color: 'yellow',
  },
  [BountyStatus.COMPLETED]: {
    label: 'Completed',
    color: 'green',
  },
  [BountyStatus.CANCELLED]: {
    label: 'Cancelled',
    color: 'red',
  },
} as const

export const ROLE_CONFIG = {
  [WorkspaceRole.OWNER]: {
    label: 'Owner',
    description: 'Full control',
  },
  [WorkspaceRole.ADMIN]: {
    label: 'Admin',
    description: 'Manage workspace',
  },
  [WorkspaceRole.MEMBER]: {
    label: 'Member',
    description: 'Create bounties',
  },
  [WorkspaceRole.VIEWER]: {
    label: 'Viewer',
    description: 'View only',
  },
} as const

// Role hierarchy
export const ROLE_HIERARCHY = {
  [WorkspaceRole.OWNER]: 4,
  [WorkspaceRole.ADMIN]: 3,
  [WorkspaceRole.MEMBER]: 2,
  [WorkspaceRole.VIEWER]: 1,
} as const

export function hasHigherRole(
  userRole: WorkspaceRole,
  requiredRole: WorkspaceRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}
```

#### 5.3 Utility Functions (`src/lib/utils/format.ts`)
```typescript
// Format satoshis
export function formatSats(sats: bigint | number): string {
  const amount = typeof sats === 'bigint' ? Number(sats) : sats
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format sats with unit
export function formatSatsWithUnit(sats: bigint | number): string {
  return `${formatSats(sats)} sats`
}

// Truncate pubkey
export function truncatePubkey(pubkey: string, length = 8): string {
  if (pubkey.length <= length * 2) return pubkey
  return `${pubkey.slice(0, length)}...${pubkey.slice(-length)}`
}

// Format relative time
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return d.toLocaleDateString()
}
```

### Testing Requirements
- [ ] Unit tests for all utilities
- [ ] Type tests for constants

### Success Criteria
- [ ] All constants centralized
- [ ] Utilities well-tested
- [ ] Clean import paths

---

## Phases 6-8: Quick Overview

### Phase 6: Form Handling & Validation
**Focus**: react-hook-form + Zod integration, reusable form components

### Phase 7: Data Fetching Patterns
**Focus**: TanStack Query setup, API client wrapper, custom hooks

### Phase 8: Development Tools & Testing
**Focus**: Seeding scripts, mock generators, test utilities

---

## Success Metrics

### Code Quality
- [ ] TypeScript strict mode enabled
- [ ] No `any` types (except where truly necessary)
- [ ] ESLint passing with no warnings
- [ ] Prettier formatting consistent

### Testing
- [ ] >80% unit test coverage for utilities
- [ ] Integration tests for API patterns
- [ ] Component tests for UI patterns

### Developer Experience
- [ ] Clear patterns documented
- [ ] Easy to add new features
- [ ] Fast feedback loops
- [ ] Minimal decision fatigue

---

## Timeline Summary

| Phase | Duration | Can Start |
|-------|----------|-----------|
| Phase 1: API Standards | 2 days | Immediately |
| Phase 2: Error Handling | 2 days | After Phase 1 |
| Phase 3: Loading States | 2 days | Immediately (parallel) |
| Phase 4: Toasts | 1 day | After Phase 2 |
| Phase 5: Code Organization | 1 day | Immediately (parallel) |
| Phase 6: Forms | 2 days | After 1, 2, 4 |
| Phase 7: Data Fetching | 2 days | After 1, 2, 4 |
| Phase 8: Dev Tools | 2 days | After 1-7 |
| **TOTAL** | **~14 days** | |

Then we tackle **Phase 9: Authentication** with all fundamentals in place!

---

## Questions Before We Start

1. **Phase Order**: Start with Phase 1 (API Standards)?
2. **Parallel Work**: Can we work on Phase 3 (Loading) and Phase 5 (Constants) while doing Phase 1?
3. **Testing Depth**: How comprehensive should initial tests be?
4. **Documentation**: Should we document patterns as we go, or at the end?

---

**Ready to build on solid foundations! 🚀**
