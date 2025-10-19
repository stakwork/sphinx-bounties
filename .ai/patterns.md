# Code Patterns & Examples

This document contains concrete examples of established patterns in the Sphinx Bounties codebase. **Always follow these patterns** - never invent new ones.

## Table of Contents

- [API Routes](#api-routes)
- [Authentication & Authorization](#authentication--authorization)
- [Database Operations](#database-operations)
- [React Components](#react-components)
- [Custom Hooks](#custom-hooks)
- [Error Handling](#error-handling)
- [Testing](#testing)

---

## API Routes

### Basic GET Route

```typescript
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/lib/error-constants";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const data = await db.model.findMany();
    return apiSuccess({ items: data, total: data.length });
  } catch (error) {
    logApiError(error, "GET /api/resource", { method: "GET" });
    return apiError("Failed to fetch resources", ErrorCode.DATABASE_ERROR, 500);
  }
}
```

### POST Route with Validation

```typescript
import { NextRequest } from "next/server";
import { apiCreated, apiError, validateBody } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/lib/error-constants";
import { createResourceSchema } from "@/validations/resource";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await validateBody(request, createResourceSchema);

    const resource = await db.resource.create({
      data: body,
    });

    return apiCreated({ resource });
  } catch (error) {
    logApiError(error, "POST /api/resource", { body: request.body });
    return apiError("Failed to create resource", ErrorCode.VALIDATION_ERROR, 400);
  }
}
```

### Protected Route (Requires Auth)

```typescript
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/lib/error-constants";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const pubkey = request.headers.get("x-user-pubkey");

    if (!pubkey) {
      return apiError("Authentication required", ErrorCode.UNAUTHORIZED, 401);
    }

    const user = await db.user.findUnique({ where: { pubkey } });

    if (!user) {
      return apiError("User not found", ErrorCode.USER_NOT_FOUND, 404);
    }

    return apiSuccess({ user });
  } catch (error) {
    logApiError(error, "GET /api/user/me", { pubkey });
    return apiError("Failed to fetch user", ErrorCode.DATABASE_ERROR, 500);
  }
}
```

### Route with Workspace Permission Check

```typescript
import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/lib/error-constants";
import { db } from "@/lib/db";
import { WorkspaceRole } from "@prisma/client";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const pubkey = request.headers.get("x-user-pubkey");
    const workspaceId = params.id;

    if (!pubkey) {
      return apiError("Authentication required", ErrorCode.UNAUTHORIZED, 401);
    }

    const member = await db.workspaceMember.findUnique({
      where: {
        workspaceId_userPubkey: { workspaceId, userPubkey: pubkey },
      },
    });

    if (!member || member.role === WorkspaceRole.VIEWER) {
      return apiError("Insufficient permissions", ErrorCode.FORBIDDEN, 403);
    }

    const body = await validateBody(request, updateWorkspaceSchema);

    const workspace = await db.workspace.update({
      where: { id: workspaceId },
      data: body,
    });

    return apiSuccess({ workspace });
  } catch (error) {
    logApiError(error, "PATCH /api/workspaces/[id]", { workspaceId });
    return apiError("Failed to update workspace", ErrorCode.DATABASE_ERROR, 500);
  }
}
```

### Paginated List Route

```typescript
import { NextRequest } from "next/server";
import { apiPaginated, apiError, validateQuery } from "@/lib/api";
import { logApiError } from "@/lib/errors/logger";
import { ErrorCode } from "@/lib/error-constants";
import { paginationSchema } from "@/validations/common";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const query = await validateQuery(request, paginationSchema);
    const { page = 1, limit = 20 } = query;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      db.resource.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.resource.count(),
    ]);

    return apiPaginated(
      { items },
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    );
  } catch (error) {
    logApiError(error, "GET /api/resources", { query });
    return apiError("Failed to fetch resources", ErrorCode.DATABASE_ERROR, 500);
  }
}
```

---

## Authentication & Authorization

### Get Authenticated User in API Route

```typescript
const pubkey = request.headers.get("x-user-pubkey");

if (!pubkey) {
  return apiError("Authentication required", ErrorCode.UNAUTHORIZED, 401);
}

const user = await db.user.findUnique({ where: { pubkey } });
```

### Check Super Admin

```typescript
import { env } from "@/lib/env";

const pubkey = request.headers.get("x-user-pubkey");
const superAdmins = env.SUPER_ADMINS.split(",").filter(Boolean);

if (!superAdmins.includes(pubkey)) {
  return apiError("Super admin access required", ErrorCode.FORBIDDEN, 403);
}
```

### Check Workspace Role

```typescript
import { WorkspaceRole } from "@prisma/client";

const member = await db.workspaceMember.findUnique({
  where: {
    workspaceId_userPubkey: { workspaceId, userPubkey: pubkey },
  },
});

const hasAdminAccess = member?.role === WorkspaceRole.ADMIN || member?.role === WorkspaceRole.OWNER;

if (!hasAdminAccess) {
  return apiError("Admin access required", ErrorCode.FORBIDDEN, 403);
}
```

---

## Database Operations

### Create with Transaction

```typescript
const result = await db.$transaction(async (tx) => {
  const workspace = await tx.workspace.create({
    data: {
      name: "New Workspace",
      description: "Description",
    },
  });

  await tx.workspaceMember.create({
    data: {
      workspaceId: workspace.id,
      userPubkey: pubkey,
      role: WorkspaceRole.OWNER,
    },
  });

  await tx.workspaceBudget.create({
    data: {
      workspaceId: workspace.id,
      totalSats: 0,
    },
  });

  return workspace;
});
```

### Update with Optimistic Locking

```typescript
const bounty = await db.bounty.update({
  where: {
    id: bountyId,
    updatedAt: previousUpdatedAt,
  },
  data: {
    status: BountyStatus.IN_PROGRESS,
  },
});
```

### Query with Relations

```typescript
const workspace = await db.workspace.findUnique({
  where: { id: workspaceId },
  include: {
    members: {
      include: {
        user: {
          select: {
            pubkey: true,
            username: true,
            alias: true,
            avatarUrl: true,
          },
        },
      },
    },
    bounties: {
      where: { status: BountyStatus.OPEN },
      orderBy: { createdAt: "desc" },
      take: 10,
    },
  },
});
```

### Upsert Pattern

```typescript
const user = await db.user.upsert({
  where: { pubkey },
  create: {
    pubkey,
    username: `user_${pubkey.slice(0, 8)}`,
    alias: "",
  },
  update: {
    lastLoginAt: new Date(),
  },
});
```

---

## React Components

### Client Component with Auth Hook

```typescript
"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LoginModal } from "@/components/auth";
import { useState } from "react";

export function ProtectedFeature() {
  const { isAuthenticated, user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (!isAuthenticated) {
    return (
      <>
        <Button onClick={() => setShowLogin(true)}>Login Required</Button>
        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
        />
      </>
    );
  }

  return (
    <div>
      <h2>Welcome, {user.alias || user.username}!</h2>
    </div>
  );
}
```

### Component with Permission Gate

```typescript
"use client";

import { PermissionGate } from "@/components/auth";
import { WorkspaceRole } from "@prisma/client";
import { Button } from "@/components/ui/button";

interface Props {
  workspaceId: string;
}

export function WorkspaceSettings({ workspaceId }: Props) {
  return (
    <div>
      <h2>Workspace Settings</h2>

      <PermissionGate
        workspaceId={workspaceId}
        requires={WorkspaceRole.ADMIN}
        fallback={<p>Admin access required</p>}
      >
        <Button>Delete Workspace</Button>
      </PermissionGate>
    </div>
  );
}
```

### Form Component with React Query

```typescript
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { createBountySchema } from "@/validations/bounty";
import type { z } from "zod";

type FormData = z.infer<typeof createBountySchema>;

export function CreateBountyForm({ workspaceId }: { workspaceId: string }) {
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(createBountySchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch(`/api/workspaces/${workspaceId}/bounties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create bounty");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Bounty created successfully");
      queryClient.invalidateQueries({ queryKey: ["bounties", workspaceId] });
      form.reset();
    },
    onError: () => {
      toast.error("Failed to create bounty");
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))}>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <Input {...field} />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Creating..." : "Create Bounty"}
        </Button>
      </form>
    </Form>
  );
}
```

---

## Custom Hooks

### Data Fetching Hook

```typescript
import { useQuery } from "@tanstack/react-query";

interface Bounty {
  id: string;
  title: string;
  status: string;
}

async function fetchBounties(workspaceId: string): Promise<Bounty[]> {
  const response = await fetch(`/api/workspaces/${workspaceId}/bounties`);

  if (!response.ok) throw new Error("Failed to fetch bounties");

  const result = await response.json();
  return result.data.items;
}

export function useBounties(workspaceId: string) {
  return useQuery({
    queryKey: ["bounties", workspaceId],
    queryFn: () => fetchBounties(workspaceId),
    staleTime: 5 * 60 * 1000,
  });
}
```

### Mutation Hook

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface UpdateBountyData {
  title?: string;
  description?: string;
  status?: string;
}

export function useUpdateBounty(bountyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateBountyData) => {
      const response = await fetch(`/api/bounties/${bountyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update bounty");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Bounty updated");
      queryClient.invalidateQueries({ queryKey: ["bounties"] });
      queryClient.invalidateQueries({ queryKey: ["bounty", bountyId] });
    },
    onError: () => {
      toast.error("Failed to update bounty");
    },
  });
}
```

---

## Error Handling

### API Route Error Handling

```typescript
try {
  const result = await someOperation();
  return apiSuccess({ data: result });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return apiError("Resource already exists", ErrorCode.DUPLICATE_ENTRY, 409);
    }
    if (error.code === "P2025") {
      return apiError("Resource not found", ErrorCode.NOT_FOUND, 404);
    }
  }

  logApiError(error, "Operation description", { context: "data" });
  return apiError("Internal server error", ErrorCode.INTERNAL_ERROR, 500);
}
```

### Client-Side Error Handling

```typescript
const mutation = useMutation({
  mutationFn: async (data) => {
    const response = await fetch("/api/endpoint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Operation failed");
    }

    return response.json();
  },
  onSuccess: () => {
    toast.success("Operation successful");
  },
  onError: (error: Error) => {
    toast.error(error.message || "Operation failed");
  },
});
```

---

## Testing

### API Route Test

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/resource/route";
import { db } from "@/lib/db";

describe("POST /api/resource", () => {
  beforeEach(async () => {
    await db.resource.deleteMany();
  });

  it("creates resource successfully", async () => {
    const request = new Request("http://localhost/api/resource", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-pubkey": "test-pubkey",
      },
      body: JSON.stringify({
        name: "Test Resource",
        description: "Test",
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.resource).toBeDefined();
  });
});
```

### Hook Test

```typescript
import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBounties } from "@/hooks/use-bounties";

describe("useBounties", () => {
  it("fetches bounties successfully", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { items: [{ id: "1", title: "Test" }] },
          }),
      })
    ) as any;

    const queryClient = new QueryClient();
    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useBounties("workspace-1"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });
});
```

### Integration Test

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";

describe("Bounty Flow Integration", () => {
  let workspaceId: string;
  let bountyId: string;

  beforeAll(async () => {
    const workspace = await db.workspace.create({
      data: { name: "Test Workspace", description: "Test" },
    });
    workspaceId = workspace.id;
  });

  afterAll(async () => {
    await db.bounty.deleteMany({ where: { workspaceId } });
    await db.workspace.delete({ where: { id: workspaceId } });
  });

  it("creates and updates bounty", async () => {
    const bounty = await db.bounty.create({
      data: {
        workspaceId,
        title: "Test Bounty",
        description: "Test",
        amountSats: 1000,
        status: "OPEN",
      },
    });

    expect(bounty.id).toBeDefined();
    bountyId = bounty.id;

    const updated = await db.bounty.update({
      where: { id: bountyId },
      data: { status: "IN_PROGRESS" },
    });

    expect(updated.status).toBe("IN_PROGRESS");
  });
});
```

---

## Summary

**Key Takeaways:**

1. Always use API utilities (apiSuccess, apiError, etc.)
2. Always validate request data with Zod schemas
3. Always log errors with proper context
4. Always use brand colors from Tailwind config
5. Always use React Query for data fetching
6. Always use Sonner for toast notifications
7. Never add comments to code
8. Never query database in middleware or client components
9. Never create new patterns without approval

**When in doubt, search the codebase for similar examples!**
