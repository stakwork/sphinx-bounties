"use client";

import { Button } from "@/components/ui/button";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { UserMenu } from "@/components/auth/UserMenu";

interface DashboardHeaderProps {
  isCollapsed: boolean;
  onToggleSidebar: () => void;
  onToggleMobileMenu: () => void;
}

export function DashboardHeader({
  isCollapsed,
  onToggleSidebar,
  onToggleMobileMenu,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:flex"
        onClick={onToggleSidebar}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <PanelLeftOpen className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onToggleMobileMenu}
        aria-label="Toggle mobile menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex flex-1 items-center gap-4">
        <WorkspaceSwitcher />
      </div>

      <div className="flex items-center gap-2">
        <UserMenu />
      </div>
    </header>
  );
}
