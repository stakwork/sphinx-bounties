import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface ChallengeResponse {
  success: boolean;
  data?: {
    k1: string;
    lnurl: string;
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

async function pollVerification(k1: string, maxAttempts = 60) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const response = await fetch("/api/auth/session", {
      credentials: "include",
    });

    if (response.ok) {
      const result: VerifyResponse = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
    }
  }

  throw new Error("Authentication timeout");
}

export function useChallenge() {
  const challengeMutation = useMutation({
    mutationFn: generateChallenge,
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate LNURL challenge");
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (k1: string) => pollVerification(k1),
    onError: (error: Error) => {
      toast.error(error.message || "Authentication failed");
    },
  });

  const reset = () => {
    challengeMutation.reset();
    verifyMutation.reset();
  };

  return {
    challenge: challengeMutation.data,
    isGenerating: challengeMutation.isPending,
    generateChallenge: () => challengeMutation.mutate(),
    isVerifying: verifyMutation.isPending,
    startVerification: (k1: string) => verifyMutation.mutate(k1),
    verificationData: verifyMutation.data,
    error: challengeMutation.error || verifyMutation.error,
    reset,
  };
}
