# Coding Conventions

This document outlines naming conventions, file structure rules, and coding standards for the Sphinx Bounties codebase.

## File Naming

### Components (PascalCase)

```
✅ UserMenu.tsx
✅ BountyCard.tsx
✅ LoginModal.tsx
✅ WorkspaceSettings.tsx

❌ userMenu.tsx         // camelCase
❌ bounty-card.tsx      // kebab-case
❌ login_modal.tsx      // snake_case
```

### Hooks (kebab-case, prefix: use-)

```
✅ use-auth.ts
✅ use-challenge.ts
✅ use-permissions.ts
✅ use-bounties.ts

❌ useAuth.ts           // camelCase
❌ auth-hook.ts         // wrong prefix
❌ use_auth.ts          // snake_case
```

### Utilities (kebab-case)

```
✅ api-error.ts
✅ format-date.ts
✅ string-utils.ts
✅ validation-helpers.ts

❌ apiError.ts          // camelCase
❌ format_date.ts       // snake_case
❌ StringUtils.ts       // PascalCase
```

### Types (kebab-case, suffix: .types)

```
✅ user.types.ts
✅ bounty.types.ts
✅ workspace.types.ts

❌ UserTypes.ts         // PascalCase
❌ user_types.ts        // snake_case
❌ user.ts              // missing suffix
```

### Tests (match source, suffix: .test)

```
✅ use-auth.test.ts
✅ UserMenu.test.tsx
✅ api-error.test.ts

❌ use-auth.spec.ts     // use .test not .spec
❌ user-menu.test.tsx   // should match UserMenu
```

### API Routes (kebab-case or [dynamic])

```
✅ route.ts             // Standard route file
✅ [id]/route.ts        // Dynamic route
✅ [slug]/route.ts

❌ bounty.route.ts      // Don't add .route suffix
❌ [ID]/route.ts        // Use lowercase [id]
```

## Directory Structure

### Organized by Feature

```
src/
├── app/
│   ├── api/
│   │   ├── auth/              # Authentication endpoints
│   │   ├── bounties/          # Bounty endpoints
│   │   ├── users/             # User endpoints
│   │   └── workspaces/        # Workspace endpoints
│   ├── (auth)/                # Auth route group
│   ├── bounties/              # Bounty pages
│   │   ├── page.tsx           # List page
│   │   └── [id]/              # Detail pages
│   │       └── page.tsx
│   └── workspaces/            # Workspace pages
│       ├── page.tsx
│       └── [id]/
│           ├── page.tsx
│           └── settings/
│               └── page.tsx
├── components/
│   ├── ui/                    # shadcn components
│   ├── auth/                  # Auth components
│   │   ├── LoginModal.tsx
│   │   ├── AuthGuard.tsx
│   │   ├── UserMenu.tsx
│   │   └── index.ts           # Export all
│   ├── bounty/                # Bounty components
│   │   ├── BountyCard.tsx
│   │   ├── BountyForm.tsx
│   │   └── index.ts
│   └── common/                # Shared components
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── index.ts
└── hooks/
    ├── use-auth.ts
    ├── use-challenge.ts
    ├── index.ts               # Export all
    └── queries/               # React Query hooks
        ├── use-bounty-queries.ts
        └── use-workspace-queries.ts
```

### Index Files

Every directory with multiple exports should have an `index.ts`:

```typescript
export { LoginModal } from "./LoginModal";
export { AuthGuard } from "./AuthGuard";
export { UserMenu } from "./UserMenu";
export { PermissionGate } from "./PermissionGate";
```

This allows clean imports:

```typescript
import { LoginModal, AuthGuard } from "@/components/auth";
```

## Import Organization

### Standard Order

1. React/Next.js imports
2. External library imports (alphabetical)
3. Internal absolute imports (@/... alphabetical by path)
4. Relative imports (../)
5. Type imports (import type)
6. CSS imports

### Example

```typescript
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiSuccess, apiError } from "@/lib/api";
import { db } from "@/lib/db";
import { someLocalUtil } from "../utils";
import type { User } from "@prisma/client";
import type { BountyStatus } from "@/types/bounty";
import "./styles.css";
```

### Group Spacing

Add blank line between groups:

```typescript
import { useState } from "react";

import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

import type { User } from "@prisma/client";
```

## Variable Naming

### Constants (SCREAMING_SNAKE_CASE)

```typescript
const MAX_BOUNTY_AMOUNT = 1000000;
const DEFAULT_PAGE_SIZE = 20;
const JWT_EXPIRY_DAYS = 7;
```

### Variables (camelCase)

```typescript
const userName = "Alice";
const bountyCount = 42;
const isAuthenticated = true;
```

### Functions (camelCase, verb-noun)

```typescript
function getBounties() {}
function createWorkspace() {}
function validateUser() {}
function formatCurrency() {}
```

### React Components (PascalCase)

```typescript
function UserMenu() {}
function BountyCard() {}
function LoginModal() {}
```

### Types/Interfaces (PascalCase)

```typescript
interface User {}
type BountyStatus = "OPEN" | "CLOSED";
interface ApiResponse<T> {}
```

### Boolean Variables (is/has/can prefix)

```typescript
const isLoading = true;
const hasPermission = false;
const canEdit = true;
const shouldRedirect = false;
```

## Component Structure

### Component Order

```typescript
import { ... } from "...";

interface Props {
  // Props first
}

export function MyComponent({ prop1, prop2 }: Props) {
  // 1. Hooks
  const router = useRouter();
  const { user } = useAuth();

  // 2. State
  const [isOpen, setIsOpen] = useState(false);

  // 3. Queries/Mutations
  const { data, isLoading } = useQuery({ ... });
  const mutation = useMutation({ ... });

  // 4. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  // 5. Event Handlers
  const handleClick = () => {
    // Handler logic
  };

  // 6. Computed Values
  const displayName = user?.alias || user?.username;

  // 7. Early Returns
  if (isLoading) return <Skeleton />;
  if (!data) return <EmptyState />;

  // 8. Main Return
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### Props Interface

Always define props interface above component:

```typescript
interface BountyCardProps {
  bounty: Bounty;
  onSelect?: (id: string) => void;
  showActions?: boolean;
}

export function BountyCard({ bounty, onSelect, showActions = true }: BountyCardProps) {
  // Component logic
}
```

## TypeScript Conventions

### Use `interface` for Objects

```typescript
✅ interface User {
  id: string;
  name: string;
}

❌ type User = {
  id: string;
  name: string;
}
```

### Use `type` for Unions/Primitives

```typescript
✅ type Status = "open" | "closed";
✅ type ID = string | number;

❌ interface Status {
  value: "open" | "closed";
}
```

### Generic Type Parameters (T, U, V or descriptive)

```typescript
✅ interface ApiResponse<T> {
  data: T;
  success: boolean;
}

✅ interface ApiResponse<TData> {
  data: TData;
  success: boolean;
}

❌ interface ApiResponse<Type> {
  data: Type;
  success: boolean;
}
```

### Avoid Optional Chains When Possible

```typescript
✅ if (!user) return null;
   return <div>{user.name}</div>;

⚠️ return <div>{user?.name}</div>;
```

### Use Type Guards

```typescript
function isUser(value: unknown): value is User {
  return typeof value === "object" && value !== null && "id" in value && "name" in value;
}

if (isUser(data)) {
  // TypeScript knows data is User
}
```

## Zod Schema Conventions

### Schema Naming (suffix: Schema)

```typescript
export const createBountySchema = z.object({ ... });
export const updateUserSchema = z.object({ ... });
export const loginSchema = z.object({ ... });
```

### Reuse Base Schemas

```typescript
const baseBountySchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string(),
  amountSats: z.number().positive(),
});

export const createBountySchema = baseBountySchema;

export const updateBountySchema = baseBountySchema.partial();
```

### Refine for Complex Validation

```typescript
export const bountySchema = z
  .object({
    startDate: z.string(),
    endDate: z.string(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
  });
```

## API Route Conventions

### File Structure

```typescript
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/lib/error-constants";

export async function GET(request: NextRequest) {
  try {
    // Route logic
    return apiSuccess({ data });
  } catch (error) {
    logApiError(error, "GET /api/route", { context });
    return apiError("Error message", ErrorCode.ERROR_TYPE, 500);
  }
}

export async function POST(request: NextRequest) {
  // Similar structure
}
```

### Status Codes

- `200` - Success (apiSuccess)
- `201` - Created (apiCreated)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (authenticated but no permission)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Internal Server Error

### Error Codes (from ErrorCode enum)

```typescript
ErrorCode.VALIDATION_ERROR; // 400
ErrorCode.UNAUTHORIZED; // 401
ErrorCode.FORBIDDEN; // 403
ErrorCode.NOT_FOUND; // 404
ErrorCode.DUPLICATE_ENTRY; // 409
ErrorCode.DATABASE_ERROR; // 500
ErrorCode.INTERNAL_ERROR; // 500
```

## CSS/Tailwind Conventions

### Class Order

1. Layout (flex, grid, block)
2. Positioning (relative, absolute)
3. Size (w-, h-, max-w-)
4. Spacing (p-, m-, space-, gap-)
5. Typography (text-, font-)
6. Colors (bg-, text-, border-)
7. Effects (shadow-, rounded-, opacity-)
8. Transitions (transition-, duration-)
9. States (hover:, focus:, disabled:)
10. Responsive (sm:, md:, lg:)

### Example

```typescript
<div className="
  flex flex-col
  relative
  w-full max-w-md
  p-6 space-y-4
  text-sm font-medium
  bg-white text-neutral-900
  rounded-xl shadow-lg
  transition-all duration-200
  hover:shadow-xl
  sm:p-8 md:max-w-lg
">
  Content
</div>
```

### Use Brand Colors

```typescript
✅ bg-primary-600         // Brand blue
✅ text-secondary-700     // Brand green
✅ border-tertiary-400    // Brand purple

❌ bg-blue-600            // Generic blue
❌ text-green-700         // Generic green
```

### Consistent Spacing

```typescript
✅ space-y-4             // 1rem vertical spacing
✅ gap-6                 // 1.5rem gap
✅ p-8                   // 2rem padding

⚠️ space-y-3.5           // Odd spacing
⚠️ gap-7                 // Non-standard
```

## Database Query Conventions

### Use Proper Types

```typescript
✅ const user = await db.user.findUnique({ where: { id } });
   // user: User | null

❌ const user = await db.user.findUnique({ where: { id } }) as User;
   // Forces type, could be null
```

### Include Relations Explicitly

```typescript
const workspace = await db.workspace.findUnique({
  where: { id },
  include: {
    members: true,
    bounties: {
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
    },
  },
});
```

### Use Transactions for Multi-Step Operations

```typescript
const result = await db.$transaction(async (tx) => {
  const workspace = await tx.workspace.create({ data: workspaceData });
  await tx.workspaceMember.create({ data: memberData });
  await tx.workspaceBudget.create({ data: budgetData });
  return workspace;
});
```

## Testing Conventions

### Test File Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("Feature Name", () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe("Sub-feature", () => {
    it("should do something specific", () => {
      // Arrange
      const input = "test";

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe("expected");
    });
  });
});
```

### Test Naming

```typescript
✅ it("creates user with valid data", ...)
✅ it("rejects invalid email format", ...)
✅ it("returns 401 when not authenticated", ...)

❌ it("test 1", ...)
❌ it("works", ...)
❌ it("should work correctly", ...)  // Too vague
```

## Comments (FORBIDDEN)

### ❌ Never Add Comments

```typescript
❌ // This function calculates total
   function calculateTotal() {}

❌ // TODO: Implement this
   function pending() {}

❌ /**
    * Calculates the total amount
    * @param items - Array of items
    * @returns Total sum
    */
   function calculateTotal(items: Item[]) {}
```

### ✅ Write Self-Documenting Code

```typescript
✅ function calculateTotalAmount(items: Item[]): number {
     return items.reduce((sum, item) => sum + item.price, 0);
   }
```

If logic is complex, extract to named functions:

```typescript
✅ function processPayment(amount: number) {
     validateAmount(amount);
     const fee = calculateProcessingFee(amount);
     const total = addFeeToAmount(amount, fee);
     return deductFromBalance(total);
   }
```

## Summary Checklist

### File Naming

- [ ] Components: PascalCase.tsx
- [ ] Hooks: use-name.ts
- [ ] Utils: kebab-case.ts
- [ ] Tests: source-name.test.ts

### Imports

- [ ] Ordered by category
- [ ] Blank lines between groups
- [ ] Type imports last

### Variables

- [ ] camelCase for variables
- [ ] PascalCase for components/types
- [ ] SCREAMING_SNAKE_CASE for constants
- [ ] is/has/can prefix for booleans

### TypeScript

- [ ] interface for objects
- [ ] type for unions
- [ ] No any types
- [ ] Proper generics

### Styling

- [ ] Brand colors used
- [ ] Class order logical
- [ ] Consistent spacing

### Code Quality

- [ ] No comments
- [ ] Self-documenting names
- [ ] Proper error handling
- [ ] Type-safe throughout
