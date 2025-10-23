import { LandingHeader, Footer } from "@/components/layout";
import { Hero } from "@/components/landing/Hero";
import { Community } from "@/components/landing/Community";
import { PaymentFeatures } from "@/components/landing/PaymentFeatures";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <LandingHeader />
      <Hero />
      <Community />
      <PaymentFeatures />
      <Footer />
    </main>
  );
}
