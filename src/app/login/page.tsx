"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginModal } from "@/components/auth";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);

  const handleSuccess = () => {
    router.push("/");
  };

  const handleClose = () => {
    setShowModal(false);
    router.push("/");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-primary-50/30 to-white">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-neutral-900">Sphinx Bounties</h1>
        <p className="text-lg text-neutral-600">Please login to continue</p>
        <Button onClick={() => setShowModal(true)} className="bg-primary-600 hover:bg-primary-700">
          Open Login
        </Button>
      </div>

      <LoginModal isOpen={showModal} onClose={handleClose} onSuccess={handleSuccess} />
    </div>
  );
}
