import { LandingHeader } from "@/components/layout";
import { Hero } from "@/components/landing/Hero";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-900">
      <LandingHeader />
      <Hero />
    </main>
  );
}
