"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      {/* Ambient gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
      <div
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl animate-pulse-slow"
        style={{ animationDelay: "1s" }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left side - Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                  Complete tasks and
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                  get paid, instantly.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-neutral-300 leading-relaxed max-w-xl">
                Welcome to the modern marketplace for work that gives you the freedom to earn
                Bitcoin for every bounty you complete.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/bounties">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-300"
                >
                  Start Earning
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/leaderboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-neutral-600 hover:border-neutral-500 bg-transparent hover:bg-neutral-800 text-white font-semibold px-8 py-6 text-lg rounded-xl transition-all duration-300"
                >
                  View Bounties
                </Button>
              </Link>
            </div>
          </div>

          {/* Right side - Glassmorphic Video Card */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl shadow-black/20">
              {/* Glass effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent pointer-events-none" />

              {/* Video container */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                  <source
                    src="https://stakwork-uploads.s3.amazonaws.com/admin_customers/admin/CodeGetPaid.mp4"
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* Bottom gradient fade */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
            </div>

            {/* Decorative glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-3xl blur-2xl -z-10 opacity-50" />
          </div>
        </div>
      </div>
    </section>
  );
}
