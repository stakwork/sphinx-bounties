import { LandingHeader } from "@/components/layout";
import { Hero } from "@/components/landing/Hero";
import { Community } from "@/components/landing/Community";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <LandingHeader />
      <Hero />
      <Community />
    </main>
  );
}
