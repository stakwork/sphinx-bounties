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

async function refreshSession(): Promise<User> {
  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to refresh session");
  }

  const result: SessionResponse = await response.json();

  if (!result.success || !result.data?.user) {
    throw new Error("Failed to refresh session");
  }

  return result.data.user;
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

  const refreshMutation = useMutation({
    mutationFn: refreshSession,
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "session"], user);
    },
    onError: () => {
      queryClient.setQueryData(["auth", "session"], null);
      router.replace("/login");
    },
  });

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
    refresh: () => refreshMutation.mutate(),
    isRefreshing: refreshMutation.isPending,
    refetch,
  };
}
