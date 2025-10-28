"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AvatarWithFallback } from "@/components/common";
import { User, LogOut, Settings, Loader2 } from "lucide-react";

export function UserMenu() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoggingOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  const handleProfile = () => {
    router.push("/settings/profile");
    setIsOpen(false);
  };

  const handleSettings = () => {
    router.push("/settings");
    setIsOpen(false);
  };

  const displayName = user.alias || user.username || `${user.pubkey.slice(0, 8)}...`;
  const fallbackText = user.alias || user.username || user.pubkey;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          <AvatarWithFallback
            src={user.avatarUrl || undefined}
            alt={displayName}
            fallbackText={fallbackText}
            size="md"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 border-primary-100 shadow-lg" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-3">
              <AvatarWithFallback
                src={user.avatarUrl || undefined}
                alt={displayName}
                fallbackText={fallbackText}
                size="lg"
              />
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-neutral-900 leading-none">{displayName}</p>
                {user.username && user.alias && (
                  <p className="text-xs text-neutral-500 leading-none">@{user.username}</p>
                )}
                <p className="text-xs text-neutral-400 font-mono leading-none">
                  {user.pubkey.slice(0, 12)}...
                </p>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-primary-100" />

        <DropdownMenuItem
          onClick={handleProfile}
          className="cursor-pointer hover:bg-primary-50 focus:bg-primary-50"
        >
          <User className="mr-2 h-4 w-4 text-primary-600" />
          <span>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleSettings}
          className="cursor-pointer hover:bg-primary-50 focus:bg-primary-50"
        >
          <Settings className="mr-2 h-4 w-4 text-primary-600" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-primary-100" />

        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600"
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Logging out...</span>
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
