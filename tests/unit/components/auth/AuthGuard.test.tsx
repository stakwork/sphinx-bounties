import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/hooks/use-auth";

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
Wrapper.displayName = "QueryClientWrapper";

describe("AuthGuard", () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue(mockRouter as ReturnType<typeof useRouter>);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state while checking authentication", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      logout: vi.fn(),
      isLoggingOut: false,
      refetch: vi.fn(),
    });

    render(
      <Wrapper>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </Wrapper>
    );

    expect(screen.getByText("Authenticating...")).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
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

    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      logout: vi.fn(),
      isLoggingOut: false,
      refetch: vi.fn(),
    });

    render(
      <Wrapper>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </Wrapper>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
    expect(screen.queryByText("Authenticating...")).not.toBeInTheDocument();
  });

  it("redirects to /login when not authenticated", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      logout: vi.fn(),
      isLoggingOut: false,
      refetch: vi.fn(),
    });

    render(
      <Wrapper>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </Wrapper>
    );

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/login");
    });

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("redirects to custom path when specified", async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      logout: vi.fn(),
      isLoggingOut: false,
      refetch: vi.fn(),
    });

    render(
      <Wrapper>
        <AuthGuard redirectTo="/custom-login">
          <div>Protected Content</div>
        </AuthGuard>
      </Wrapper>
    );

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/custom-login");
    });
  });

  it("shows custom fallback while loading", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      logout: vi.fn(),
      isLoggingOut: false,
      refetch: vi.fn(),
    });

    render(
      <Wrapper>
        <AuthGuard fallback={<div>Custom Loading...</div>}>
          <div>Protected Content</div>
        </AuthGuard>
      </Wrapper>
    );

    expect(screen.getByText("Custom Loading...")).toBeInTheDocument();
    expect(screen.queryByText("Authenticating...")).not.toBeInTheDocument();
  });
});
