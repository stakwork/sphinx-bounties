"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";
import { toast } from "sonner";
import { useChallenge } from "@/hooks/use-challenge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, ExternalLink, Zap, AlertCircle, RefreshCw } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DEV_USERS = [
  {
    pubkey: "02a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
    name: "Alice",
    role: "Owner",
  },
  {
    pubkey: "03b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2",
    name: "Bob",
    role: "Contributor",
  },
  {
    pubkey: "04c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2",
    name: "Charlie",
    role: "Designer",
  },
];

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const router = useRouter();
  const [isDevLoggingIn, setIsDevLoggingIn] = useState(false);
  const {
    challenge,
    isGenerating,
    generateChallenge,
    isVerifying,
    startVerification,
    verificationData,
    error,
    hasError,
    isTimeout,
    reset,
    retry,
  } = useChallenge();

  useEffect(() => {
    if (isOpen && !challenge && !isGenerating) {
      generateChallenge();
    }
  }, [isOpen, challenge, isGenerating, generateChallenge]);

  useEffect(() => {
    if (challenge?.k1 && !isVerifying && !verificationData) {
      const timer = setTimeout(() => {
        startVerification(challenge.k1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [challenge?.k1, isVerifying, verificationData, startVerification]);

  useEffect(() => {
    if (verificationData) {
      onSuccess?.();
      reset();
      onClose();
      router.push("/bounties");
    }
  }, [verificationData, onSuccess, onClose, router, reset]);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleLoginWithSphinx = () => {
    if (challenge?.sphinxDeepLink) {
      window.location.href = challenge.sphinxDeepLink;
    }
  };

  const handleLoginWithLNAUTH = () => {
    if (challenge?.lnurl) {
      window.location.href = challenge.lnurl;
    }
  };

  const handleGetSphinx = () => {
    window.open("https://sphinx.chat", "_blank");
  };

  const handleDevLogin = async (pubkey: string, name: string) => {
    setIsDevLoggingIn(true);
    try {
      const response = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pubkey }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Dev login failed");
        return;
      }

      toast.success(`Logged in as ${name}!`);
      onSuccess?.();
      handleClose();
      router.push("/bounties");
    } catch {
      toast.error("Dev login failed. Is the seed data loaded?");
    } finally {
      setIsDevLoggingIn(false);
    }
  };

  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-primary-200 bg-gradient-to-b from-white to-primary-50/30">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold text-center text-neutral-900">
            Welcome
          </DialogTitle>
          <DialogDescription className="text-center text-neutral-600">
            Use Sphinx to login and create or edit your profile.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-4">
          {isGenerating || !challenge ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
              <p className="text-sm text-neutral-600">Generating authentication challenge...</p>
            </div>
          ) : (
            <div className="relative flex flex-col items-center space-y-4">
              <div className="relative p-4 bg-white rounded-2xl shadow-lg ring-1 ring-primary-100 animate-pulse-soft">
                <QRCodeSVG
                  value={challenge.sphinxDeepLink}
                  size={240}
                  level="M"
                  includeMargin={false}
                  className="rounded-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white p-2 rounded-xl shadow-md ring-4 ring-white">
                    <Image
                      src="/sphinx_icon.png"
                      alt="Sphinx"
                      width={48}
                      height={48}
                      className="rounded-lg"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-700">
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                    <span className="font-medium">Waiting for scan...</span>
                  </>
                ) : (
                  <span className="font-medium">Scan with Sphinx to continue</span>
                )}
              </div>

              {hasError && (
                <div className="w-full mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex flex-col items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-red-900">
                        {isTimeout ? "Authentication Timeout" : "Authentication Failed"}
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        {isTimeout
                          ? "No response received after 2 minutes. Please try again."
                          : error?.message || "Something went wrong. Please try again."}
                      </p>
                    </div>
                    <Button
                      onClick={retry}
                      size="sm"
                      variant="outline"
                      className="border-red-300 hover:bg-red-100 text-red-700"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col items-center space-y-3 w-full">
            <Button
              onClick={handleLoginWithSphinx}
              disabled={isGenerating || !challenge}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              Login with Sphinx
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>

            <Button
              onClick={handleLoginWithLNAUTH}
              disabled={isGenerating || !challenge}
              variant="outline"
              className="w-full border-2 border-primary-200 hover:border-primary-300 hover:bg-primary-50 text-primary-700 font-medium py-6 rounded-xl transition-all duration-200"
            >
              Login with LNAUTH
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="text-center space-y-3 pt-2">
            <p className="text-sm text-neutral-500">I don&apos;t have Sphinx!</p>
            <Button
              onClick={handleGetSphinx}
              variant="ghost"
              className="text-primary-600 hover:text-primary-700 hover:bg-primary-50 font-medium rounded-lg"
            >
              Get Sphinx
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {isDevelopment && (
            <>
              <Separator className="my-4" />
              <div className="w-full space-y-3">
                <div className="flex items-center gap-2 justify-center">
                  <Zap className="h-4 w-4 text-accent-600" />
                  <p className="text-sm font-medium text-neutral-700">Dev Quick Login</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {DEV_USERS.map((user) => (
                    <Button
                      key={user.pubkey}
                      onClick={() => handleDevLogin(user.pubkey, user.name)}
                      disabled={isDevLoggingIn}
                      variant="outline"
                      className="flex flex-col h-auto py-3 px-2 border-accent-200 hover:border-accent-400 hover:bg-accent-50 text-center"
                    >
                      {isDevLoggingIn ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <span className="font-semibold text-sm">{user.name}</span>
                          <span className="text-xs text-neutral-500">{user.role}</span>
                        </>
                      )}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-center text-neutral-400">
                  Development only • Run db:seed if users not found
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
