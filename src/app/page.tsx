import { cookies } from "next/headers";
import { LandingHeader, Footer } from "@/components/layout";
import { Hero } from "@/components/landing/Hero";
import { Community } from "@/components/landing/Community";
import { PaymentFeatures } from "@/components/landing/PaymentFeatures";
import { GateForm } from "@/components/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const cookieStore = await cookies();
  const hasGateAccess = cookieStore.has("gate-access");

  if (!hasGateAccess) {
    return <GateForm />;
  }

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
