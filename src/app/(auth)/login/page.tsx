"use client";

import { useEffect, useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal";

export default function LoginPage() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(true);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-primary-50/30 to-white">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Sign In with Lightning</h1>
          <p className="text-muted-foreground">Connect your Lightning wallet to continue</p>
        </div>
      </div>
      <LoginModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
