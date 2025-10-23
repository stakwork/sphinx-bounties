"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import Image from "next/image";
import { useChallenge } from "@/hooks/use-challenge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const router = useRouter();
  const {
    challenge,
    isGenerating,
    generateChallenge,
    isVerifying,
    startVerification,
    verificationData,
    reset,
  } = useChallenge();

  useEffect(() => {
    if (isOpen && !challenge && !isGenerating) {
      generateChallenge();
    }
  }, [isOpen, challenge, isGenerating, generateChallenge]);

  useEffect(() => {
    if (challenge?.k1 && !isVerifying) {
      // Start polling after a short delay to let user see the QR code first
      const timer = setTimeout(() => {
        startVerification(challenge.k1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [challenge, isVerifying, startVerification]);

  useEffect(() => {
    if (verificationData) {
      onSuccess?.();
      onClose();
      router.push("/dashboard");
    }
  }, [verificationData, onSuccess, onClose, router]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleLoginWithSphinx = () => {
    if (challenge?.lnurl) {
      window.location.href = challenge.lnurl;
    }
  };

  const handleGetSphinx = () => {
    window.open("https://sphinx.chat", "_blank");
  };

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
                  value={challenge.lnurl}
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
            </div>
          )}

          <div className="flex flex-col items-center space-y-3 w-full">
            <Button
              onClick={handleLoginWithSphinx}
              disabled={isGenerating || isVerifying || !challenge}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
            >
              Login with Sphinx
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>

            <Button
              onClick={handleLoginWithSphinx}
              disabled={isGenerating || isVerifying || !challenge}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
