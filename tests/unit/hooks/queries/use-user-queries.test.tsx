import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useGetUsers,
  useGetUser,
  useGetUserByUsername,
  useGetUserProfile,
  useSearchUsers,
  useGetGithubVerifiedUsers,
  useGetTwitterVerifiedUsers,
  userKeys,
} from "@/hooks/queries/use-user-queries";
import { userQueries } from "@/services/user/queries";
import type { ReactNode } from "react";

vi.mock("@/services/user/queries", () => ({
  userQueries: {
    getAll: vi.fn(),
    getByPubkey: vi.fn(),
    getByUsername: vi.fn(),
    getProfileByPubkey: vi.fn(),
    search: vi.fn(),
    getGithubVerified: vi.fn(),
    getTwitterVerified: vi.fn(),
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

describe("userKeys", () => {
  it("generates correct query keys", () => {
    expect(userKeys.all).toEqual(["users"]);
    expect(userKeys.lists()).toEqual(["users", "list"]);
    expect(userKeys.list({ search: "john" })).toEqual([
      "users",
      "list",
      { filters: { search: "john" }, pagination: undefined, sort: undefined },
    ]);
    expect(userKeys.details()).toEqual(["users", "detail"]);
    expect(userKeys.detail("pub123")).toEqual(["users", "detail", "pub123"]);
    expect(userKeys.detailByUsername("alice")).toEqual(["users", "detail", "username", "alice"]);
    expect(userKeys.profile("pub123")).toEqual(["users", "profile", "pub123"]);
    expect(userKeys.githubVerified()).toEqual(["users", "github-verified"]);
    expect(userKeys.twitterVerified()).toEqual(["users", "twitter-verified"]);
  });
});

describe("useGetUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches users successfully", async () => {
    const mockData = {
      data: [
        { pubkey: "pub1", username: "alice", alias: "Alice" },
        { pubkey: "pub2", username: "bob", alias: "Bob" },
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
    vi.mocked(userQueries.getAll).mockResolvedValue(mockData);

    const { result } = renderHook(() => useGetUsers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(userQueries.getAll).toHaveBeenCalledWith(undefined, undefined, undefined);
  });

  it("applies filters, pagination, and sort", async () => {
    const mockData = {
      data: [],
      pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0, hasMore: false },
    };

    vi.mocked(userQueries.getAll).mockResolvedValue(mockData);

    const filters = { githubVerified: true };
    const pagination = { page: 1, pageSize: 10 };
    const sort = { sortBy: "username" as const, sortOrder: "asc" as const };

    const { result } = renderHook(() => useGetUsers(filters, pagination, sort), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(userQueries.getAll).toHaveBeenCalledWith(filters, pagination, sort);
  });

  it("handles error state", async () => {
    vi.mocked(userQueries.getAll).mockRejectedValue(new Error("Failed to fetch users"));

    const { result } = renderHook(() => useGetUsers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(new Error("Failed to fetch users"));
  });
});

describe("useGetUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches user by pubkey successfully", async () => {
    const mockUser = {
      pubkey: "pub123",
      username: "alice",
      alias: "Alice",
      description: "Developer",
    };

    // @ts-expect-error - Mock data doesn't need all fields
    vi.mocked(userQueries.getByPubkey).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useGetUser("pub123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockUser);
    expect(userQueries.getByPubkey).toHaveBeenCalledWith("pub123");
  });

  it("returns null when user not found", async () => {
    vi.mocked(userQueries.getByPubkey).mockResolvedValue(null);

    const { result } = renderHook(() => useGetUser("nonexistent"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });

  it("respects enabled flag", () => {
    const { result } = renderHook(() => useGetUser("pub123", false), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(userQueries.getByPubkey).not.toHaveBeenCalled();
  });

  it("disables query when pubkey is empty", () => {
    const { result } = renderHook(() => useGetUser(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(userQueries.getByPubkey).not.toHaveBeenCalled();
  });
});

describe("useGetUserByUsername", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches user by username successfully", async () => {
    const mockUser = {
      pubkey: "pub123",
      username: "alice",
      alias: "Alice",
    };

    // @ts-expect-error - Mock data doesn't need all fields
    vi.mocked(userQueries.getByUsername).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useGetUserByUsername("alice"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockUser);
    expect(userQueries.getByUsername).toHaveBeenCalledWith("alice");
  });

  it("disables query when username is empty", () => {
    const { result } = renderHook(() => useGetUserByUsername(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(userQueries.getByUsername).not.toHaveBeenCalled();
  });

  it("respects enabled flag", () => {
    const { result } = renderHook(() => useGetUserByUsername("alice", false), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(userQueries.getByUsername).not.toHaveBeenCalled();
  });
});

describe("useGetUserProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches user profile successfully", async () => {
    const mockProfile = {
      pubkey: "pub123",
      username: "alice",
      stats: {
        workspacesOwned: 5,
        bountiesCreated: 10,
        bountiesCompleted: 8,
      },
    };

    // @ts-expect-error - Mock data doesn't need all fields
    vi.mocked(userQueries.getProfileByPubkey).mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useGetUserProfile("pub123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockProfile);
    expect(userQueries.getProfileByPubkey).toHaveBeenCalledWith("pub123");
  });

  it("disables query when pubkey is empty", () => {
    const { result } = renderHook(() => useGetUserProfile(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(userQueries.getProfileByPubkey).not.toHaveBeenCalled();
  });
});

describe("useSearchUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("searches users successfully", async () => {
    const mockData = {
      data: [{ pubkey: "pub1", username: "alice", alias: "Alice" }],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1, hasMore: false },
    };

    // @ts-expect-error - Mock data doesn't need all fields
    vi.mocked(userQueries.search).mockResolvedValue(mockData);

    const { result } = renderHook(() => useSearchUsers("ali"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(userQueries.search).toHaveBeenCalledWith("ali", undefined);
  });

  it("disables query when query is empty", () => {
    const { result } = renderHook(() => useSearchUsers(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(userQueries.search).not.toHaveBeenCalled();
  });

  it("disables query when query is less than 2 characters", () => {
    const { result } = renderHook(() => useSearchUsers("a"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(userQueries.search).not.toHaveBeenCalled();
  });

  it("applies pagination", async () => {
    const mockData = {
      data: [],
      pagination: { page: 2, pageSize: 10, total: 0, totalPages: 0, hasMore: false },
    };

    vi.mocked(userQueries.search).mockResolvedValue(mockData);

    const pagination = { page: 2, pageSize: 10 };

    const { result } = renderHook(() => useSearchUsers("alice", pagination), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(userQueries.search).toHaveBeenCalledWith("alice", pagination);
  });
});

describe("useGetGithubVerifiedUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches github verified users successfully", async () => {
    const mockData = {
      data: [
        { pubkey: "pub1", username: "alice", githubVerified: true },
        { pubkey: "pub2", username: "bob", githubVerified: true },
      ],
      pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1, hasMore: false },
    };

    // @ts-expect-error - Mock data doesn't need all fields
    vi.mocked(userQueries.getGithubVerified).mockResolvedValue(mockData);

    const { result } = renderHook(() => useGetGithubVerifiedUsers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(userQueries.getGithubVerified).toHaveBeenCalledWith(undefined);
  });

  it("applies pagination", async () => {
    const mockData = {
      data: [],
      pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0, hasMore: false },
    };

    vi.mocked(userQueries.getGithubVerified).mockResolvedValue(mockData);

    const pagination = { page: 1, pageSize: 10 };

    const { result } = renderHook(() => useGetGithubVerifiedUsers(pagination), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(userQueries.getGithubVerified).toHaveBeenCalledWith(pagination);
  });
});

describe("useGetTwitterVerifiedUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches twitter verified users successfully", async () => {
    const mockData = {
      data: [
        { pubkey: "pub1", username: "alice", twitterVerified: true },
        { pubkey: "pub2", username: "bob", twitterVerified: true },
      ],
      pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1, hasMore: false },
    };

    // @ts-expect-error - Mock data doesn't need all fields
    vi.mocked(userQueries.getTwitterVerified).mockResolvedValue(mockData);

    const { result } = renderHook(() => useGetTwitterVerifiedUsers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(userQueries.getTwitterVerified).toHaveBeenCalledWith(undefined);
  });

  it("applies pagination", async () => {
    const mockData = {
      data: [],
      pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0, hasMore: false },
    };

    vi.mocked(userQueries.getTwitterVerified).mockResolvedValue(mockData);

    const pagination = { page: 1, pageSize: 10 };

    const { result } = renderHook(() => useGetTwitterVerifiedUsers(pagination), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(userQueries.getTwitterVerified).toHaveBeenCalledWith(pagination);
  });
});
