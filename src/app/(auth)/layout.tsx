import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50 to-background px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
