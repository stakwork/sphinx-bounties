"use client";

import { useState, type ReactNode } from "react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { MobileNav } from "@/components/layout/MobileNav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden lg:block">
        <DashboardSidebar isCollapsed={sidebarCollapsed} />
      </aside>

      <MobileNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          isCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-muted/10 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
