import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useGetBounties,
  useGetBounty,
  useGetBountiesByWorkspace,
  useGetBountiesByAssignee,
  useGetBountiesByCreator,
  bountyKeys,
} from "@/hooks/queries/use-bounty-queries";
import { bountyQueries } from "@/services/bounty/queries";
import type { ReactNode } from "react";

vi.mock("@/services/bounty/queries", () => ({
  bountyQueries: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getByWorkspaceId: vi.fn(),
    getByAssigneePubkey: vi.fn(),
    getByCreatorPubkey: vi.fn(),
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

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return Wrapper;
}

describe("bountyKeys", () => {
  it("generates correct query keys", () => {
    expect(bountyKeys.all).toEqual(["bounties"]);
    expect(bountyKeys.lists()).toEqual(["bounties", "list"]);
    expect(bountyKeys.list({ status: "OPEN" })).toEqual([
      "bounties",
      "list",
      { filters: { status: "OPEN" }, pagination: undefined, sort: undefined },
    ]);
    expect(bountyKeys.details()).toEqual(["bounties", "detail"]);
    expect(bountyKeys.detail("bounty123")).toEqual(["bounties", "detail", "bounty123"]);
    expect(bountyKeys.workspace("ws123")).toEqual(["bounties", "workspace", "ws123"]);
    expect(bountyKeys.assignee("pub123")).toEqual(["bounties", "assignee", "pub123"]);
    expect(bountyKeys.creator("pub456")).toEqual(["bounties", "creator", "pub456"]);
  });
});

describe("useGetBounties", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches bounties successfully", async () => {
    const mockData = {
      data: [
        { id: "1", title: "Bounty 1", amount: 1000 },
        { id: "2", title: "Bounty 2", amount: 2000 },
      ],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 2,
        totalPages: 1,
        hasMore: false,
      },
    };

    // @ts-expect-error - Mock data doesn't need all fields
    vi.mocked(bountyQueries.getAll).mockResolvedValue(mockData);

    const { result } = renderHook(() => useGetBounties(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(bountyQueries.getAll).toHaveBeenCalledWith(undefined, undefined, undefined);
  });

  it("applies filters and pagination", async () => {
    const mockData = {
      data: [],
      pagination: {
        page: 2,
        pageSize: 10,
        total: 0,
        totalPages: 0,
        hasMore: false,
      },
    };

    vi.mocked(bountyQueries.getAll).mockResolvedValue(mockData);

    const filters = { status: "OPEN" as const };
    const pagination = { page: 2, pageSize: 10 };
    const sort = { sortBy: "amount" as const, sortOrder: "desc" as const };

    const { result } = renderHook(() => useGetBounties(filters, pagination, sort), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(bountyQueries.getAll).toHaveBeenCalledWith(filters, pagination, sort);
  });

  it("handles error state", async () => {
    vi.mocked(bountyQueries.getAll).mockRejectedValue(new Error("Failed to fetch"));

    const { result } = renderHook(() => useGetBounties(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(new Error("Failed to fetch"));
  });

  it("returns loading state initially", () => {
    vi.mocked(bountyQueries.getAll).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useGetBounties(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });
});

describe("useGetBounty", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches single bounty successfully", async () => {
    const mockBounty = {
      id: "bounty123",
      title: "Test Bounty",
      amount: 5000,
      status: "OPEN",
    };

    // @ts-expect-error - Mock data doesn't need all fields
    vi.mocked(bountyQueries.getById).mockResolvedValue(mockBounty);

    const { result } = renderHook(() => useGetBounty("bounty123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockBounty);
    expect(bountyQueries.getById).toHaveBeenCalledWith("bounty123");
  });

  it("returns null when bounty not found", async () => {
    vi.mocked(bountyQueries.getById).mockResolvedValue(null);

    const { result } = renderHook(() => useGetBounty("nonexistent"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });

  it("respects enabled flag", () => {
    const { result } = renderHook(() => useGetBounty("bounty123", false), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(bountyQueries.getById).not.toHaveBeenCalled();
  });

  it("disables query when id is empty", () => {
    const { result } = renderHook(() => useGetBounty(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(bountyQueries.getById).not.toHaveBeenCalled();
  });

  it("handles error state", async () => {
    vi.mocked(bountyQueries.getById).mockRejectedValue(new Error("Bounty not found"));

    const { result } = renderHook(() => useGetBounty("bounty123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(new Error("Bounty not found"));
  });
});

describe("useGetBountiesByWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches workspace bounties successfully", async () => {
    const mockData = {
      data: [{ id: "1", title: "Workspace Bounty", workspaceId: "ws123" }],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
        hasMore: false,
      },
    };

    // @ts-expect-error - Mock data doesn't need all fields
    vi.mocked(bountyQueries.getByWorkspaceId).mockResolvedValue(mockData);

    const { result } = renderHook(() => useGetBountiesByWorkspace("ws123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(bountyQueries.getByWorkspaceId).toHaveBeenCalledWith("ws123", undefined, undefined);
  });

  it("disables query when workspaceId is empty", () => {
    const { result } = renderHook(() => useGetBountiesByWorkspace(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(bountyQueries.getByWorkspaceId).not.toHaveBeenCalled();
  });

  it("applies pagination and sort", async () => {
    const mockData = {
      data: [],
      pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0, hasMore: false },
    };

    vi.mocked(bountyQueries.getByWorkspaceId).mockResolvedValue(mockData);

    const pagination = { page: 1, pageSize: 10 };
    const sort = { sortBy: "createdAt" as const, sortOrder: "asc" as const };

    const { result } = renderHook(() => useGetBountiesByWorkspace("ws123", pagination, sort), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(bountyQueries.getByWorkspaceId).toHaveBeenCalledWith("ws123", pagination, sort);
  });
});

describe("useGetBountiesByAssignee", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches assignee bounties successfully", async () => {
    const mockData = {
      data: [{ id: "1", title: "Assigned Bounty", assigneePubkey: "pub123" }],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
        hasMore: false,
      },
    };

    // @ts-expect-error - Mock data doesn't need all fields
    vi.mocked(bountyQueries.getByAssigneePubkey).mockResolvedValue(mockData);

    const { result } = renderHook(() => useGetBountiesByAssignee("pub123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(bountyQueries.getByAssigneePubkey).toHaveBeenCalledWith("pub123", undefined, undefined);
  });

  it("disables query when assigneePubkey is empty", () => {
    const { result } = renderHook(() => useGetBountiesByAssignee(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(bountyQueries.getByAssigneePubkey).not.toHaveBeenCalled();
  });
});

describe("useGetBountiesByCreator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches creator bounties successfully", async () => {
    const mockData = {
      data: [{ id: "1", title: "Created Bounty", creatorPubkey: "pub456" }],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
        hasMore: false,
      },
    };

    // @ts-expect-error - Mock data doesn't need all fields
    vi.mocked(bountyQueries.getByCreatorPubkey).mockResolvedValue(mockData);

    const { result } = renderHook(() => useGetBountiesByCreator("pub456"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(bountyQueries.getByCreatorPubkey).toHaveBeenCalledWith("pub456", undefined, undefined);
  });

  it("disables query when creatorPubkey is empty", () => {
    const { result } = renderHook(() => useGetBountiesByCreator(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(bountyQueries.getByCreatorPubkey).not.toHaveBeenCalled();
  });

  it("applies pagination and sort", async () => {
    const mockData = {
      data: [],
      pagination: { page: 2, pageSize: 5, total: 0, totalPages: 0, hasMore: false },
    };

    vi.mocked(bountyQueries.getByCreatorPubkey).mockResolvedValue(mockData);

    const pagination = { page: 2, pageSize: 5 };
    const sort = { sortBy: "amount" as const, sortOrder: "desc" as const };

    const { result } = renderHook(() => useGetBountiesByCreator("pub456", pagination, sort), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(bountyQueries.getByCreatorPubkey).toHaveBeenCalledWith("pub456", pagination, sort);
  });
});
