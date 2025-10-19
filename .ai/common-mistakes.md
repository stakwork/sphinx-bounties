# Common Mistakes to Avoid

This document lists mistakes that AI coding agents frequently make when working with this codebase. **Read this carefully before making changes.**

## Critical Mistakes (Never Do These)

### 1. ❌ Adding Code Comments

**Mistake:**

```typescript
// This function calculates the total amount
function calculateTotal(items: Item[]) {
  // Loop through items
  return items.reduce((sum, item) => {
    // Add item price to sum
    return sum + item.price;
  }, 0);
}
```

**Why It's Wrong:**

- User preference: no code comments
- Code should be self-documenting

**Correct Approach:**

```typescript
function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

---

### 2. ❌ Using Database Queries in Middleware

**Mistake:**

```typescript
import { db } from "@/lib/db";

export async function middleware(request: NextRequest) {
  const pubkey = request.headers.get("x-user-pubkey");

  const user = await db.user.findUnique({ where: { pubkey } });

  if (!user) {
    return NextResponse.redirect("/login");
  }
}
```

**Why It's Wrong:**

- Middleware runs in Edge Runtime
- Edge Runtime doesn't support Prisma/PostgreSQL
- Database queries would timeout (50ms limit)
- Middleware should be <10ms for good UX

**Correct Approach:**

```typescript
export async function middleware(request: NextRequest) {
  const session = request.cookies.get("session")?.value;

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const payload = await verifyJWT(session);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-pubkey", payload.pubkey);
    return NextResponse.next({ headers: requestHeaders });
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}
```

---

### 3. ❌ Creating New API Response Patterns

**Mistake:**

```typescript
export async function GET(request: NextRequest) {
  try {
    const data = await db.bounty.findMany();
    return NextResponse.json({ bounties: data, status: "success" });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
```

**Why It's Wrong:**

- Ignores established API utilities
- Inconsistent response format
- No error logging
- No type safety on frontend

**Correct Approach:**

```typescript
import { apiSuccess, apiError } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/lib/error-constants";

export async function GET(request: NextRequest) {
  try {
    const bounties = await db.bounty.findMany();
    return apiSuccess({ bounties });
  } catch (error) {
    logApiError(error, "GET /api/bounties", {});
    return apiError("Failed to fetch bounties", ErrorCode.DATABASE_ERROR, 500);
  }
}
```

---

### 4. ❌ Skipping Request Validation

**Mistake:**

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();

  const bounty = await db.bounty.create({
    data: {
      title: body.title,
      amountSats: body.amount,
    },
  });

  return apiSuccess({ bounty });
}
```

**Why It's Wrong:**

- No validation of input data
- Vulnerable to invalid/malicious data
- No type safety
- Runtime errors from missing fields

**Correct Approach:**

```typescript
import { validateBody } from "@/lib/api";
import { createBountySchema } from "@/validations/bounty";

export async function POST(request: NextRequest) {
  try {
    const body = await validateBody(request, createBountySchema);

    const bounty = await db.bounty.create({ data: body });

    return apiCreated({ bounty });
  } catch (error) {
    logApiError(error, "POST /api/bounties", {});
    return apiError("Validation failed", ErrorCode.VALIDATION_ERROR, 400);
  }
}
```

---

### 5. ❌ Skipping Error Logging

**Mistake:**

```typescript
export async function GET(request: NextRequest) {
  try {
    const data = await db.bounty.findMany();
    return apiSuccess({ data });
  } catch (error) {
    return apiError("Failed", ErrorCode.DATABASE_ERROR, 500);
  }
}
```

**Why It's Wrong:**

- No visibility into what went wrong
- Can't debug production issues
- No context for error tracking
- Silent failures

**Correct Approach:**

```typescript
export async function GET(request: NextRequest) {
  try {
    const data = await db.bounty.findMany();
    return apiSuccess({ data });
  } catch (error) {
    logApiError(error, "GET /api/bounties", {
      method: "GET",
      url: request.url,
    });
    return apiError("Failed to fetch bounties", ErrorCode.DATABASE_ERROR, 500);
  }
}
```

---

### 6. ❌ Using Plain Tailwind Colors

**Mistake:**

```typescript
<Button className="bg-blue-600 hover:bg-blue-700 text-white">
  Click Me
</Button>
```

**Why It's Wrong:**

- Ignores brand color system
- Inconsistent with design system
- Hard to maintain branding

**Correct Approach:**

```typescript
<Button className="bg-primary-600 hover:bg-primary-700 text-white">
  Click Me
</Button>
```

**Available Brand Colors:**

- `primary-*` (Blue) - Main brand color
- `secondary-*` (Green) - Success, positive actions
- `tertiary-*` (Purple) - Highlights, special features
- `accent-*` (Red) - Warnings, destructive actions
- `neutral-*` (Gray) - Text, borders, backgrounds

---

### 7. ❌ Using `any` Type

**Mistake:**

```typescript
function processData(data: any) {
  return data.map((item: any) => item.value);
}
```

**Why It's Wrong:**

- Loses all type safety
- Defeats the purpose of TypeScript
- Leads to runtime errors
- Makes refactoring dangerous

**Correct Approach:**

```typescript
interface Item {
  value: number;
}

function processData(data: Item[]) {
  return data.map((item) => item.value);
}
```

---

### 8. ❌ Ignoring TypeScript Errors

**Mistake:**

```typescript
// @ts-ignore
const result = someFunction(wrongArguments);
```

**Why It's Wrong:**

- Hides real problems
- Leads to runtime errors
- Makes code unmaintainable
- Defeats TypeScript's value

**Correct Approach:**

```typescript
const result = someFunction(correctlyTypedArguments);
```

If there's a genuine TypeScript limitation, create a proper type:

```typescript
interface CustomType {
  field: string;
}

const result = someFunction(data as CustomType);
```

---

### 9. ❌ Making Up Validation Schemas

**Mistake:**

```typescript
const myCustomSchema = z.object({
  name: z.string(),
  email: z.string(),
});
```

**Why It's Wrong:**

- Duplicates existing schemas
- Inconsistent validation rules
- Harder to maintain

**Correct Approach:**

```typescript
import { userSchema } from "@/validations/user";

const body = await validateBody(request, userSchema);
```

If you need a variant:

```typescript
import { userSchema } from "@/validations/user";

const updateUserSchema = userSchema.partial();
```

---

## Moderate Mistakes

### 11. ⚠️ Not Using React Query for Data Fetching

**Mistake:**

```typescript
"use client";

import { useState, useEffect } from "react";

export function BountyList() {
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bounties")
      .then(res => res.json())
      .then(data => {
        setBounties(data.bounties);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return <div>{/* Render bounties */}</div>;
}
```

**Why It's Sub-Optimal:**

- No caching
- No automatic refetching
- Manual loading/error state
- No optimistic updates

**Correct Approach:**

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export function BountyList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["bounties"],
    queryFn: async () => {
      const response = await fetch("/api/bounties");
      const result = await response.json();
      return result.data.bounties;
    },
  });

  if (isLoading) return <Skeleton />;
  if (error) return <div>Error loading bounties</div>;

  return <div>{/* Render bounties */}</div>;
}
```

---

### 12. ⚠️ Not Handling Loading States

**Mistake:**

```typescript
<Button onClick={handleSubmit}>Submit</Button>
```

**Why It's Sub-Optimal:**

- User can spam-click
- No feedback during operation
- Confusing UX

**Correct Approach:**

```typescript
<Button onClick={handleSubmit} disabled={isPending}>
  {isPending ? "Submitting..." : "Submit"}
</Button>
```

Or with an icon:

```typescript
<Button onClick={handleSubmit} disabled={isPending}>
  {isPending ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Submitting...
    </>
  ) : (
    "Submit"
  )}
</Button>
```

---

### 13. ⚠️ Not Using Toast Notifications

**Mistake:**

```typescript
const handleDelete = async () => {
  await deleteBounty(id);
  alert("Bounty deleted");
};
```

**Why It's Sub-Optimal:**

- Alert boxes are jarring
- Block user interaction
- Not consistent with design system

**Correct Approach:**

```typescript
import { toast } from "sonner";

const handleDelete = async () => {
  try {
    await deleteBounty(id);
    toast.success("Bounty deleted successfully");
  } catch (error) {
    toast.error("Failed to delete bounty");
  }
};
```

---

### 14. ⚠️ Not Using AuthGuard for Protected Pages

**Mistake:**

```typescript
export default function Dashboard() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return <div>Dashboard content</div>;
}
```

**Why It's Sub-Optimal:**

- Manual auth checks in every page
- Inconsistent behavior
- No automatic redirects

**Correct Approach:**

```typescript
import { AuthGuard } from "@/components/auth";

export default function Dashboard() {
  return (
    <AuthGuard>
      <div>Dashboard content</div>
    </AuthGuard>
  );
}
```

---

### 15. ⚠️ Not Using PermissionGate for Conditional Rendering

**Mistake:**

```typescript
const { role } = usePermissions(workspaceId);

return (
  <div>
    {role === "ADMIN" || role === "OWNER" ? (
      <Button>Delete</Button>
    ) : null}
  </div>
);
```

**Why It's Sub-Optimal:**

- Manual permission checks everywhere
- Easy to forget checks
- Inconsistent logic

**Correct Approach:**

```typescript
import { PermissionGate } from "@/components/auth";
import { WorkspaceRole } from "@prisma/client";

return (
  <div>
    <PermissionGate
      workspaceId={workspaceId}
      requiresAny={[WorkspaceRole.ADMIN, WorkspaceRole.OWNER]}
    >
      <Button>Delete</Button>
    </PermissionGate>
  </div>
);
```

---

## Style & Convention Mistakes

### 16. 📝 Incorrect Import Order

**Mistake:**

```typescript
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@prisma/client";
import { toast } from "sonner";
```

**Correct Order:**

```typescript
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import type { User } from "@prisma/client";
```

**Rule:**

1. React/Next.js imports
2. External library imports
3. Internal absolute imports (@/...)
4. Relative imports (../)
5. Type imports (import type)

---

### 17. 📝 Wrong File Naming

**Mistake:**

```
UserProfile.ts           // Component but .ts extension
use_auth.ts              // Underscore instead of hyphen
bountyCard.tsx           // camelCase for component
API-Error.ts             // Mixed casing
```

**Correct:**

```
UserProfile.tsx          // Component with .tsx
use-auth.ts              // Kebab-case for hooks/utils
BountyCard.tsx           // PascalCase for components
api-error.ts             // Kebab-case for utilities
```

---

### 18. 📝 Not Using Established Components

**Mistake:**

```typescript
<button className="px-4 py-2 bg-primary-600 rounded-lg">
  Click Me
</button>
```

**Correct:**

```typescript
import { Button } from "@/components/ui/button";

<Button>Click Me</Button>
```

**Available shadcn/ui Components:**

- Button, Card, Dialog, Form, Input, Select, Textarea
- Badge, Alert, Separator, Skeleton, Tabs, Sheet
- Dropdown Menu, Popover, Scroll Area, Avatar, Label
- Checkbox, Accordion, and more...

---

### 19. 📝 Not Reusing Existing Hooks

**Mistake:**

```typescript
const [user, setUser] = useState(null);

useEffect(() => {
  fetch("/api/auth/session")
    .then((res) => res.json())
    .then((data) => setUser(data.user));
}, []);
```

**Correct:**

```typescript
import { useAuth } from "@/hooks/use-auth";

const { user, isAuthenticated, isLoading } = useAuth();
```

**Available Hooks:**

- `useAuth()` - Session management
- `useChallenge()` - LNURL authentication
- `usePermissions()` - Workspace roles
- `useBounties()` - Fetch bounties
- `useWorkspaces()` - Fetch workspaces

---

### 20. 📝 Creating Inline Styles

**Mistake:**

```typescript
<div style={{ padding: "1rem", backgroundColor: "#618AFF" }}>
  Content
</div>
```

**Correct:**

```typescript
<div className="p-4 bg-primary-500">
  Content
</div>
```

---

## Testing Mistakes

### 21. 🧪 Not Testing Edge Cases

**Mistake:**

```typescript
it("creates a bounty", async () => {
  const bounty = await db.bounty.create({
    data: { title: "Test", amountSats: 1000 },
  });

  expect(bounty).toBeDefined();
});
```

**Missing Tests:**

- What if title is empty?
- What if amountSats is negative?
- What if workspace doesn't exist?
- What if user lacks permissions?

**Correct:**

```typescript
describe("Bounty Creation", () => {
  it("creates bounty with valid data", async () => {
    // Happy path
  });

  it("rejects empty title", async () => {
    // Error case
  });

  it("rejects negative amount", async () => {
    // Error case
  });

  it("rejects unauthorized user", async () => {
    // Permission case
  });
});
```

---

## Summary Checklist

Before submitting code, verify:

**Critical (Must Fix):**

- [ ] No code comments added
- [ ] No database queries in middleware
- [ ] Used apiSuccess/apiError (not NextResponse.json)
- [ ] Request validation present
- [ ] Error logging present
- [ ] Brand colors used (not default Tailwind)
- [ ] No `any` types
- [ ] No TypeScript errors
- [ ] No console.log statements
- [ ] Reused existing validation schemas

**Important (Should Fix):**

- [ ] React Query used for data fetching
- [ ] Loading states handled
- [ ] Toast notifications for user feedback
- [ ] AuthGuard used for protected pages
- [ ] PermissionGate used for conditional rendering

**Style (Nice to Have):**

- [ ] Imports properly ordered
- [ ] File naming follows conventions
- [ ] Reused existing components/hooks
- [ ] Tailwind classes (no inline styles)
- [ ] Tests include edge cases
