import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface ChallengeResponse {
  success: boolean;
  data?: {
    k1: string;
    lnurl: string;
    sphinxDeepLink: string;
    expiresAt: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface VerifyResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      pubkey: string;
      username: string;
      alias: string | null;
      avatarUrl: string | null;
    };
    token: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

async function generateChallenge() {
  const response = await fetch("/api/auth/challenge", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to generate challenge");
  }

  const result: ChallengeResponse = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || "Failed to generate challenge");
  }

  return result.data;
}

async function pollVerification(k1: string, maxAttempts = 60, signal?: AbortSignal) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal?.aborted) {
      throw new Error("Authentication cancelled");
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (signal?.aborted) {
      throw new Error("Authentication cancelled");
    }

    try {
      const statusResponse = await fetch(`/api/auth/challenge/${k1}/status`, {
        credentials: "include",
        signal,
      });

      if (statusResponse.ok) {
        const statusResult = await statusResponse.json();
        if (statusResult.success && statusResult.data?.authenticated) {
          const sessionResponse = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ k1 }),
            signal,
          });

          if (sessionResponse.ok) {
            const sessionResult: VerifyResponse = await sessionResponse.json();
            if (sessionResult.success && sessionResult.data) {
              return sessionResult.data;
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Authentication cancelled");
      }
    }
  }

  throw new Error("Authentication timeout - Please try again");
}

export function useChallenge() {
  const abortControllerRef = { current: null as AbortController | null };

  const challengeMutation = useMutation({
    mutationFn: generateChallenge,
    onError: (error: Error) => {
      const message = error.message || "Failed to generate LNURL challenge";
      if (!message.includes("cancelled")) {
        toast.error(message);
      }
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (k1: string) => {
      abortControllerRef.current = new AbortController();
      return pollVerification(k1, 60, abortControllerRef.current.signal);
    },
    onSuccess: () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    },
    onError: (error: Error) => {
      const message = error.message || "Authentication failed";
      if (!message.includes("cancelled")) {
        toast.error(message);
      }
    },
  });

  const reset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    challengeMutation.reset();
    verifyMutation.reset();
  };

  const retry = () => {
    reset();
    challengeMutation.mutate();
  };

  return {
    challenge: challengeMutation.data,
    isGenerating: challengeMutation.isPending,
    generateChallenge: () => challengeMutation.mutate(),
    isVerifying: verifyMutation.isPending,
    startVerification: (k1: string) => verifyMutation.mutate(k1),
    verificationData: verifyMutation.data,
    error: challengeMutation.error || verifyMutation.error,
    hasError: !!(challengeMutation.error || verifyMutation.error),
    isTimeout: verifyMutation.error?.message?.includes("timeout") || false,
    reset,
    retry,
  };
}
