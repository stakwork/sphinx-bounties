import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useGetWorkspaces,
  useGetWorkspace,
  useGetWorkspacesByOwner,
  useGetWorkspacesByMember,
  useGetWorkspaceMembers,
  useGetWorkspaceBudget,
  useGetUserRole,
  workspaceKeys,
} from "@/hooks/queries/use-workspace-queries";
import { workspaceQueries } from "@/services/workspace/queries";
import type { ReactNode } from "react";

vi.mock("@/services/workspace/queries", () => ({
  workspaceQueries: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getByOwnerPubkey: vi.fn(),
    getByMemberPubkey: vi.fn(),
    getMembersByWorkspaceId: vi.fn(),
    getBudget: vi.fn(),
    getUserRole: vi.fn(),
  },
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("workspaceKeys", () => {
  it("generates correct query keys", () => {
    expect(workspaceKeys.all).toEqual(["workspaces"]);
    expect(workspaceKeys.lists()).toEqual(["workspaces", "list"]);
    expect(workspaceKeys.list({ ownerPubkey: "pub123" })).toEqual([
      "workspaces",
      "list",
      { filters: { ownerPubkey: "pub123" }, pagination: undefined, sort: undefined },
    ]);
    expect(workspaceKeys.details()).toEqual(["workspaces", "detail"]);
    expect(workspaceKeys.detail("ws123")).toEqual(["workspaces", "detail", "ws123"]);
    expect(workspaceKeys.members("ws123")).toEqual(["workspaces", "members", "ws123"]);
    expect(workspaceKeys.budget("ws123")).toEqual(["workspaces", "budget", "ws123"]);
    expect(workspaceKeys.owner("pub123")).toEqual(["workspaces", "owner", "pub123"]);
    expect(workspaceKeys.member("pub456")).toEqual(["workspaces", "member", "pub456"]);
    expect(workspaceKeys.userRole("ws123", "pub456")).toEqual([
      "workspaces",
      "role",
      "ws123",
      "pub456",
    ]);
  });
});

describe("useGetWorkspaces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches workspaces successfully", async () => {
    const mockData = {
      data: [
        { id: "ws1", name: "Workspace 1", ownerPubkey: "pub1" },
        { id: "ws2", name: "Workspace 2", ownerPubkey: "pub2" },
      ],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 2,
        totalPages: 1,
        hasMore: false,
      },
    };

    // @ts-expect-error - Mock return value
    vi.mocked(workspaceQueries.getAll).mockResolvedValue(mockData);

    const { result } = renderHook(() => useGetWorkspaces(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(workspaceQueries.getAll).toHaveBeenCalledWith(undefined, undefined, undefined);
  });

  it("applies filters, pagination, and sort", async () => {
    const mockData = {
      data: [],
      pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0, hasMore: false },
    };

    vi.mocked(workspaceQueries.getAll).mockResolvedValue(mockData);

    const filters = { hasActiveBounties: true };
    const pagination = { page: 1, pageSize: 10 };
    const sort = { sortBy: "name" as const, sortOrder: "asc" as const };

    const { result } = renderHook(() => useGetWorkspaces(filters, pagination, sort), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(workspaceQueries.getAll).toHaveBeenCalledWith(filters, pagination, sort);
  });

  it("handles error state", async () => {
    vi.mocked(workspaceQueries.getAll).mockRejectedValue(new Error("Failed to fetch"));

    const { result } = renderHook(() => useGetWorkspaces(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(new Error("Failed to fetch"));
  });
});

describe("useGetWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches workspace by id successfully", async () => {
    const mockWorkspace = {
      id: "ws123",
      name: "Test Workspace",
      ownerPubkey: "pub123",
    };

    // @ts-expect-error - Mock return value
    vi.mocked(workspaceQueries.getById).mockResolvedValue(mockWorkspace);

    const { result } = renderHook(() => useGetWorkspace("ws123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockWorkspace);
    expect(workspaceQueries.getById).toHaveBeenCalledWith("ws123");
  });

  it("returns null when workspace not found", async () => {
    vi.mocked(workspaceQueries.getById).mockResolvedValue(null);

    const { result } = renderHook(() => useGetWorkspace("nonexistent"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });

  it("respects enabled flag", () => {
    const { result } = renderHook(() => useGetWorkspace("ws123", false), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(workspaceQueries.getById).not.toHaveBeenCalled();
  });

  it("disables query when id is empty", () => {
    const { result } = renderHook(() => useGetWorkspace(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(workspaceQueries.getById).not.toHaveBeenCalled();
  });
});

describe("useGetWorkspacesByOwner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches owner workspaces successfully", async () => {
    const mockData = {
      data: [{ id: "ws1", name: "Workspace 1", ownerPubkey: "pub123" }],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1, hasMore: false },
    };

    // @ts-expect-error - Mock return value
    vi.mocked(workspaceQueries.getByOwnerPubkey).mockResolvedValue(mockData);

    const { result } = renderHook(() => useGetWorkspacesByOwner("pub123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(workspaceQueries.getByOwnerPubkey).toHaveBeenCalledWith("pub123", undefined, undefined);
  });

  it("disables query when ownerPubkey is empty", () => {
    const { result } = renderHook(() => useGetWorkspacesByOwner(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(workspaceQueries.getByOwnerPubkey).not.toHaveBeenCalled();
  });
});

describe("useGetWorkspacesByMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches member workspaces successfully", async () => {
    const mockData = {
      data: [{ id: "ws1", name: "Workspace 1", memberRole: "CONTRIBUTOR" }],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1, hasMore: false },
    };

    // @ts-expect-error - Mock return value
    vi.mocked(workspaceQueries.getByMemberPubkey).mockResolvedValue(mockData);

    const { result } = renderHook(() => useGetWorkspacesByMember("pub123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(workspaceQueries.getByMemberPubkey).toHaveBeenCalledWith("pub123", undefined, undefined);
  });

  it("disables query when memberPubkey is empty", () => {
    const { result } = renderHook(() => useGetWorkspacesByMember(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(workspaceQueries.getByMemberPubkey).not.toHaveBeenCalled();
  });
});

describe("useGetWorkspaceMembers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches workspace members successfully", async () => {
    const mockMembers = [
      { id: "mem1", role: "OWNER", user: { pubkey: "pub1", username: "alice" } },
      { id: "mem2", role: "CONTRIBUTOR", user: { pubkey: "pub2", username: "bob" } },
    ];

    // @ts-expect-error - Mock return value
    vi.mocked(workspaceQueries.getMembersByWorkspaceId).mockResolvedValue(mockMembers);

    const { result } = renderHook(() => useGetWorkspaceMembers("ws123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockMembers);
    expect(workspaceQueries.getMembersByWorkspaceId).toHaveBeenCalledWith("ws123");
  });

  it("disables query when workspaceId is empty", () => {
    const { result } = renderHook(() => useGetWorkspaceMembers(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(workspaceQueries.getMembersByWorkspaceId).not.toHaveBeenCalled();
  });
});

describe("useGetWorkspaceBudget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches workspace budget successfully", async () => {
    const mockBudget = {
      workspaceId: "ws123",
      totalAmount: 100000,
      allocatedAmount: 50000,
      remainingAmount: 50000,
    };

    // @ts-expect-error - Mock return value
    vi.mocked(workspaceQueries.getBudget).mockResolvedValue(mockBudget);

    const { result } = renderHook(() => useGetWorkspaceBudget("ws123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockBudget);
    expect(workspaceQueries.getBudget).toHaveBeenCalledWith("ws123");
  });

  it("disables query when workspaceId is empty", () => {
    const { result } = renderHook(() => useGetWorkspaceBudget(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(workspaceQueries.getBudget).not.toHaveBeenCalled();
  });
});

describe("useGetUserRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches user role successfully", async () => {
    vi.mocked(workspaceQueries.getUserRole).mockResolvedValue("ADMIN");

    const { result } = renderHook(() => useGetUserRole("ws123", "pub123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBe("ADMIN");
    expect(workspaceQueries.getUserRole).toHaveBeenCalledWith("ws123", "pub123");
  });

  it("returns null when user has no role", async () => {
    vi.mocked(workspaceQueries.getUserRole).mockResolvedValue(null);

    const { result } = renderHook(() => useGetUserRole("ws123", "pub123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });

  it("disables query when workspaceId is empty", () => {
    const { result } = renderHook(() => useGetUserRole("", "pub123"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(workspaceQueries.getUserRole).not.toHaveBeenCalled();
  });

  it("disables query when userPubkey is empty", () => {
    const { result } = renderHook(() => useGetUserRole("ws123", ""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(workspaceQueries.getUserRole).not.toHaveBeenCalled();
  });
});
