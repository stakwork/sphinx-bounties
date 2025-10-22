import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-background py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-foreground/70 ring-1 ring-primary-200 hover:ring-primary-300">
              Powered by Bitcoin Lightning <Zap className="ml-1 inline h-4 w-4 text-primary-500" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Freedom to Earn! <span className="text-primary-500">Get Paid in Bitcoin.</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-foreground/70">
            Connect with projects that need your skills. Complete bounties. Receive instant
            Lightning payments. No middlemen, no Delays.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg" className="gap-2">
              <Link href="/bounties">
                Browse Bounties <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/leaderboard">View Leaderboard</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
