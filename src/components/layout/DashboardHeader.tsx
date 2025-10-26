"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { UserMenu } from "@/components/auth/UserMenu";
import { NotificationBell } from "./NotificationBell";

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
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-neutral-200/50 bg-white/80 backdrop-blur-xl px-4 sm:px-6 dark:border-neutral-800/50 dark:bg-neutral-900/80">
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
        <div className="relative hidden sm:block flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            type="search"
            placeholder="Search bounties..."
            className="pl-10 bg-neutral-50/50 dark:bg-neutral-800/50 border-neutral-200/50 dark:border-neutral-700/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}
