import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface User {
  id: string;
  pubkey: string;
  username: string;
  alias: string | null;
  avatarUrl: string | null;
}

interface SessionResponse {
  success: boolean;
  data?: {
    authenticated: boolean;
    user: User;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface LogoutResponse {
  success: boolean;
  data?: {
    message: string;
  };
}

async function fetchSession(): Promise<User | null> {
  const response = await fetch("/api/auth/session", {
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  const result: SessionResponse = await response.json();

  if (!result.success || !result.data?.authenticated) {
    return null;
  }

  return result.data.user;
}

async function logout(): Promise<void> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Logout failed");
  }

  const result: LogoutResponse = await response.json();

  if (!result.success) {
    throw new Error(result.data?.message || "Logout failed");
  }
}

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["auth", "session"],
    queryFn: fetchSession,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["auth", "session"], null);
      queryClient.invalidateQueries();
      queryClient.clear();
      toast.success("Logged out successfully");
      router.replace("/");
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to logout");
    },
  });

  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    return {
      user: {
        id: "mock-alice-id",
        pubkey: "02a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
        username: "Alice",
        alias: null,
        avatarUrl: null,
      },
      isAuthenticated: true,
      isLoading: false,
      error: null,
      logout: () => logoutMutation.mutate(),
      isLoggingOut: logoutMutation.isPending,
      refetch,
    };
  }

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
    refetch,
  };
}
