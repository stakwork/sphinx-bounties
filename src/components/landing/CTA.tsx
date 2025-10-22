import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { LogIn, Target } from "lucide-react";

export function CTA() {
  return (
    <section className="bg-primary-50">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to start earning?
            <br />
            Join the Bitcoin bounty revolution.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-foreground/70">
            Whether you&apos;re a developer looking for work or a project looking for talent, Sphinx
            Bounties connects the right people to get things done.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/login" className={buttonVariants({ size: "lg" })}>
              <LogIn className="h-4 w-4" />
              Sign In with Lightning
            </Link>
            <Link href="/bounties" className={buttonVariants({ variant: "outline", size: "lg" })}>
              <Target className="h-4 w-4" />
              Explore Bounties
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
