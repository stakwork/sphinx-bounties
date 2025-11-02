"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, redirectTo = "/login", fallback }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = pathname;
      const currentSearch = searchParams.toString();
      const fullPath = currentSearch ? `${currentPath}?${currentSearch}` : currentPath;

      const loginUrl = new URL(redirectTo, window.location.origin);
      if (currentPath !== redirectTo && currentPath !== "/login") {
        loginUrl.searchParams.set("redirect", fullPath);
      }
      router.push(loginUrl.pathname + loginUrl.search);
    }
  }, [isLoading, isAuthenticated, redirectTo, router, pathname, searchParams]);

  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-primary-50/30 to-white">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
          <p className="text-sm font-medium text-neutral-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
