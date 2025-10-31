"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GateForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError("Invalid password");
        setIsLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="flex w-full max-w-md flex-col items-center gap-8 px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600">
          <Image src="/sphinx_icon.png" alt="Sphinx" width={48} height={48} className="h-12 w-12" />
        </div>

        <h1 className="text-3xl font-bold text-white">Welcome to Sphinx Bounties</h1>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 border-zinc-800 bg-zinc-900/50 text-white placeholder:text-zinc-500"
              disabled={isLoading}
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>

          <Button
            type="submit"
            className="h-12 w-full bg-zinc-700 text-white hover:bg-zinc-600"
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
