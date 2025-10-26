import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WorkspaceRole } from "@/types/enums";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/hooks/use-auth";

vi.mock("@/hooks/use-auth");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "QueryWrapper";
  return Wrapper;
};

const mockUser = {
  id: "1",
  pubkey: "test-pubkey",
  username: "testuser",
  alias: null,
  description: null,
  avatarUrl: null,
  githubUsername: null,
  twitterUsername: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("usePermissions", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns loading state when not authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      logout: vi.fn(),
      isLoggingOut: false,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => usePermissions("workspace-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.role).toBeUndefined();
  });

  it("fetches and returns OWNER role", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      logout: vi.fn(),
      isLoggingOut: false,
      refetch: vi.fn(),
    });

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { role: WorkspaceRole.OWNER },
      }),
    } as Response);

    const { result } = renderHook(() => usePermissions("workspace-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.role).toBe(WorkspaceRole.OWNER);
    expect(result.current.isOwner).toBe(true);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.canManageWorkspace()).toBe(true);
    expect(result.current.canManageBounty()).toBe(true);
  });

  it("fetches and returns ADMIN role", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      logout: vi.fn(),
      isLoggingOut: false,
      refetch: vi.fn(),
    });

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { role: WorkspaceRole.ADMIN },
      }),
    } as Response);

    const { result } = renderHook(() => usePermissions("workspace-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.role).toBe(WorkspaceRole.ADMIN);
    expect(result.current.isOwner).toBe(false);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.canManageWorkspace()).toBe(true);
    expect(result.current.canManageBounty()).toBe(true);
  });

  it("fetches and returns CONTRIBUTOR role", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      logout: vi.fn(),
      isLoggingOut: false,
      refetch: vi.fn(),
    });

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { role: WorkspaceRole.CONTRIBUTOR },
      }),
    } as Response);

    const { result } = renderHook(() => usePermissions("workspace-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.role).toBe(WorkspaceRole.CONTRIBUTOR);
    expect(result.current.isContributor).toBe(true);
    expect(result.current.canContribute()).toBe(true);
    expect(result.current.canManageWorkspace()).toBe(false);
    expect(result.current.canManageBounty()).toBe(false);
  });

  it("fetches and returns VIEWER role", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      logout: vi.fn(),
      isLoggingOut: false,
      refetch: vi.fn(),
    });

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { role: WorkspaceRole.VIEWER },
      }),
    } as Response);

    const { result } = renderHook(() => usePermissions("workspace-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.role).toBe(WorkspaceRole.VIEWER);
    expect(result.current.canView()).toBe(true);
    expect(result.current.isContributor).toBe(false);
    expect(result.current.canContribute()).toBe(false);
  });

  it("handles role hierarchy correctly", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      logout: vi.fn(),
      isLoggingOut: false,
      refetch: vi.fn(),
    });

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { role: WorkspaceRole.ADMIN },
      }),
    } as Response);

    const { result } = renderHook(() => usePermissions("workspace-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasRole(WorkspaceRole.VIEWER)).toBe(true);
    expect(result.current.hasRole(WorkspaceRole.CONTRIBUTOR)).toBe(true);
    expect(result.current.hasRole(WorkspaceRole.ADMIN)).toBe(true);
    expect(result.current.hasRole(WorkspaceRole.OWNER)).toBe(false);
  });

  it("returns null role when user has no membership", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      logout: vi.fn(),
      isLoggingOut: false,
      refetch: vi.fn(),
    });

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const { result } = renderHook(() => usePermissions("workspace-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.role).toBeNull();
    expect(result.current.isMember).toBe(false);
    expect(result.current.canView()).toBe(false);
  });

  it("does not fetch when workspaceId is not provided", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      logout: vi.fn(),
      isLoggingOut: false,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.role).toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
