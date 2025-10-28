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

  if (
    typeof window !== "undefined" &&
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_MOCK_USER_PUBKEY
  ) {
    return {
      user: {
        id: "mock-alice-id",
        pubkey: process.env.NEXT_PUBLIC_MOCK_USER_PUBKEY,
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
