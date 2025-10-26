"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { LayoutDashboard, Target, Building, Trophy, Settings } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard/analytics", icon: LayoutDashboard },
  { label: "Bounties", href: "/bounties", icon: Target },
  { label: "Workspaces", href: "/workspaces", icon: Building },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
];

const secondaryItems = [{ label: "Settings", href: "/profile/settings", icon: Settings }];

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b border-neutral-200/50 px-4 py-3 dark:border-neutral-800/50">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 shadow-sm">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Sphinx
            </span>
          </SheetTitle>
        </SheetHeader>

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
                    isActive && "bg-primary-50 text-primary-500 hover:bg-primary-100"
                  )}
                  asChild
                  onClick={() => onOpenChange(false)}
                >
                  <Link href={item.href}>
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
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
                    isActive && "bg-primary-50 text-primary-500 hover:bg-primary-100"
                  )}
                  asChild
                  onClick={() => onOpenChange(false)}
                >
                  <Link href={item.href}>
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
