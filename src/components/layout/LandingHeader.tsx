"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/hooks/use-auth";
import { UserMenu } from "@/components/auth/UserMenu";
import { Menu, X } from "lucide-react";

export function LandingHeader() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-neutral-900/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 lg:gap-10">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/sphinx_icon.png"
                alt="Sphinx Bounties"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <span className="hidden font-bold text-xl sm:inline-block bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                SPHINX BOUNTIES
              </span>
            </Link>

            <div className="hidden md:flex md:gap-10">
              <Link
                href="/bounties"
                className="text-base font-semibold text-white/80 hover:text-white transition-colors"
              >
                Bounties
              </Link>
              <Link
                href="/leaderboard"
                className="text-base font-semibold text-white/80 hover:text-white transition-colors"
              >
                Leaderboard
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/bounties">
                  <Button variant="ghost" className="hidden sm:inline-flex">
                    Dashboard
                  </Button>
                </Link>
                <UserMenu />
              </>
            ) : (
              <>
                <Button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="hidden sm:inline-flex bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 font-semibold px-6 rounded-lg transition-all duration-300"
                >
                  Sign in
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </nav>

        {isMobileMenuOpen && (
          <div className="border-t border-white/10 md:hidden bg-neutral-900/95">
            <div className="space-y-1 px-4 pb-3 pt-2">
              <Link
                href="/bounties"
                className="block rounded-md px-3 py-2 text-base font-medium text-white/80 hover:bg-white/10 hover:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Bounties
              </Link>
              <Link
                href="/leaderboard"
                className="block rounded-md px-3 py-2 text-base font-medium text-white/80 hover:bg-white/10 hover:text-white"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Leaderboard
              </Link>

              {!isAuthenticated && (
                <div className="pt-4 space-y-2">
                  <Button
                    className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border border-white/20"
                    onClick={() => {
                      setIsLoginModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Sign in
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </>
  );
}
