import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-14 items-center">
          <h1 className="text-lg font-semibold">Admin Dashboard</h1>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
}
