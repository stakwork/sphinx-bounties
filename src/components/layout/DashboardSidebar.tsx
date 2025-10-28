"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { LayoutDashboard, Target, Building, Trophy, Settings } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard/analytics", icon: LayoutDashboard },
  { label: "Bounties", href: "/bounties", icon: Target },
  { label: "Workspaces", href: "/workspaces", icon: Building },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
];

const secondaryItems = [{ label: "Settings", href: "/settings", icon: Settings }];

interface DashboardSidebarProps {
  isCollapsed: boolean;
}

export function DashboardSidebar({ isCollapsed }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r border-neutral-200/50 bg-white/80 backdrop-blur-xl transition-all duration-300",
        "dark:border-neutral-800/50 dark:bg-neutral-900/80",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-neutral-200/50 px-4 dark:border-neutral-800/50",
          isCollapsed && "justify-center"
        )}
      >
        <Link href="/dashboard/analytics" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 shadow-sm">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-lg text-neutral-900 dark:text-neutral-100">Sphinx</span>
          )}
        </Link>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive && "bg-primary-50 text-primary-500 hover:bg-primary-100",
                  isCollapsed && "justify-center px-2"
                )}
                asChild
              >
                <Link href={item.href}>
                  <>
                    <Icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </>
                </Link>
              </Button>
            );
          })}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          {secondaryItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3",
                  isActive && "bg-primary-50 text-primary-500 hover:bg-primary-100",
                  isCollapsed && "justify-center px-2"
                )}
                asChild
              >
                <Link href={item.href}>
                  <>
                    <Icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </>
                </Link>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
