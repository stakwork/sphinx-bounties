import { Zap, Key, Sun } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PaymentFeatures() {
  const features = [
    {
      icon: Zap,
      iconBg: "from-yellow-400 to-yellow-500",
      title: "Instant payments after approval.",
      description:
        "No more waiting days or weeks to get paid. Once your work is approved, payment is sent to your wallet in seconds. Complete a bounty in the morning and have Bitcoin in your wallet by lunch.",
    },
    {
      icon: Key,
      iconBg: "from-primary-500 to-primary-600",
      title: "Full control of your earnings.",
      description:
        "Your earnings go directly into your personal Sphinx wallet. You have complete control over your Bitcoin with no restrictions. Hold it, spend it, or send it anywhere in the world instantly.",
    },
    {
      icon: Sun,
      iconBg: "from-yellow-400 to-orange-500",
      title: "No hidden costs or surprises.",
      description:
        "Know exactly what you'll earn before you start. The amount shown on each bounty is what you'll receive. No hidden fees, no surprise deductions, no payment processing costs.",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 py-24 sm:py-32">
      <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
      <div
        className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-secondary-500/20 rounded-full blur-3xl animate-pulse-slow"
        style={{ animationDelay: "1s" }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center space-y-6 mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
            Everything you need to know about
            <br />
            <span className="bg-gradient-to-r from-primary-400 via-secondary-400 to-primary-400 bg-clip-text text-transparent">
              getting paid as a Bounty Hunter.
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-neutral-300 leading-relaxed max-w-2xl mx-auto">
            We&apos;ve made the payment process simple, fast and transparent. When your work is
            approved, you&apos;ll have Bitcoin in your wallet within seconds. Here&apos;s how the
            payment system works on Bounties.
          </p>

          <div className="pt-4">
            <Link href="/bounties">
              <Button
                size="lg"
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-300"
              >
                Start Earning
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="group relative">
                <div className="relative h-full rounded-2xl backdrop-blur-xl bg-white/95 border border-neutral-200 p-8 shadow-xl shadow-black/20 hover:border-neutral-300 hover:shadow-2xl hover:shadow-black/30 transition-all duration-300 hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent rounded-2xl pointer-events-none" />

                  <div className="relative space-y-4">
                    <div className="inline-flex">
                      <div
                        className={`p-4 rounded-xl bg-gradient-to-br ${feature.iconBg} shadow-lg`}
                      >
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-neutral-900 leading-tight">
                      {feature.title}
                    </h3>

                    <p className="text-neutral-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>

                <div
                  className={`absolute -inset-2 bg-gradient-to-br ${feature.iconBg.replace("from-", "from-").replace("to-", "to-")}/20 rounded-2xl blur-2xl -z-10 opacity-0 group-hover:opacity-60 transition-opacity duration-300`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
