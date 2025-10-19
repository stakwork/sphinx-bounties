import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useChallenge } from "@/hooks/use-challenge";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

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

describe("useChallenge", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it.skip("generates challenge successfully", async () => {
    const mockChallenge = {
      k1: "test-k1-value",
      lnurl: "lnurl1test",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockChallenge,
      }),
    } as Response);

    const { result } = renderHook(() => useChallenge(), {
      wrapper: createWrapper(),
    });

    expect(result.current.challenge).toBeUndefined();

    await act(async () => {
      result.current.generateChallenge();
    });

    await waitFor(() => {
      expect(result.current.isGenerating).toBe(false);
    });

    expect(result.current.challenge).toEqual(mockChallenge);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth/challenge",
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  it.skip("handles challenge generation failure", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to generate challenge",
        },
      }),
    } as Response);

    const { result } = renderHook(() => useChallenge(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.generateChallenge();
      await vi.waitFor(
        () => {
          expect(result.current.isGenerating).toBe(false);
        },
        { timeout: 3000 }
      );
    });

    expect(result.current.challenge).toBeUndefined();
    expect(result.current.error).toBeTruthy();
  });

  it.skip("polls for verification and succeeds", async () => {
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

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            authenticated: true,
            user: mockUser,
          },
        }),
      } as Response);

    const { result } = renderHook(() => useChallenge(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.startVerification("test-k1");
    });

    expect(result.current.isVerifying).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    await waitFor(() => {
      expect(result.current.isVerifying).toBe(false);
    });

    expect(result.current.verificationData).toEqual({
      user: mockUser,
      token: undefined,
    });
  });

  it.skip("stops polling after max attempts", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    const { result } = renderHook(() => useChallenge(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.startVerification("test-k1");
    });

    expect(result.current.isVerifying).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000 * 61);
    });

    await waitFor(() => {
      expect(result.current.isVerifying).toBe(false);
    });

    expect(result.current.verificationData).toBeUndefined();
    expect(result.current.error).toBeTruthy();
  });
});
