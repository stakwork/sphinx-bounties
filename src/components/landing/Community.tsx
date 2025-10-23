import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bitcoin, Calendar, Zap } from "lucide-react";

export function Community() {
  const features = [
    {
      icon: Bitcoin,
      title: "Freedom to earn from anywhere in the world.",
      description:
        "Work on bounties from any country without restrictions or barriers. Our global community welcomes talent from everywhere. All you need is an internet connection.",
      color: "from-yellow-400 to-orange-500",
      bgGlow: "bg-gradient-to-br from-yellow-500/30 to-orange-500/20",
    },
    {
      icon: Calendar,
      title: "Complete bounties that fit your schedule.",
      description:
        "Take control of your earning potential. Apply for bounties that match your schedule and skills. Complete more bounties to increase your earnings.",
      color: "from-accent-500 to-accent-600",
      bgGlow: "bg-gradient-to-br from-accent-500/30 to-accent-600/20",
    },
    {
      icon: Zap,
      title: "Get paid instantly in Bitcoin.",
      description:
        "No more waiting for payments or dealing with traditional banking delays. Complete a bounty and get paid in Bitcoin immediately. Your earnings are yours to keep or spend right away.",
      color: "from-primary-500 to-primary-700",
      bgGlow: "bg-gradient-to-br from-primary-500/30 to-secondary-500/20",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-neutral-50/50 to-primary-50/30 py-24 sm:py-32">
      {/* Ambient gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-primary-200/40 to-tertiary-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-secondary-200/40 to-primary-200/30 rounded-full blur-3xl" />
      <div className="absolute top-2/3 left-1/2 w-[400px] h-[400px] bg-gradient-to-br from-tertiary-200/30 to-accent-200/20 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center space-y-6 mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="text-neutral-900">Join a community of Bounty Hunters</span>
            <br />
            <span className="text-neutral-900">built for freedom, flexibility and</span>
            <br />
            <span className="bg-gradient-to-r from-secondary-600 via-primary-600 to-tertiary-600 bg-clip-text text-transparent">
              instant rewards.
            </span>
          </h2>

          <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed max-w-2xl mx-auto">
            Join a growing community of skilled professionals earning their way. We&apos;ve built a
            platform where talent meets opportunity and rewards are instant. Our bounty hunters work
            with freedom, get paid faster, and grow their earnings on their terms.
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
                {/* Glassmorphic card */}
                <div className="relative h-full rounded-2xl backdrop-blur-xl bg-white/90 border border-neutral-200 p-8 shadow-xl shadow-neutral-900/5 hover:border-neutral-300 hover:shadow-2xl hover:shadow-neutral-900/10 transition-all duration-300 hover:scale-[1.02]">
                  {/* Glass effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-transparent rounded-2xl pointer-events-none" />

                  {/* Content */}
                  <div className="relative space-y-4">
                    {/* Icon */}
                    <div className="inline-flex">
                      <div
                        className={`p-4 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}
                      >
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-neutral-900 leading-tight">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-neutral-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>

                {/* Decorative glow */}
                <div
                  className={`absolute -inset-2 ${feature.bgGlow} rounded-2xl blur-2xl -z-10 opacity-0 group-hover:opacity-60 transition-opacity duration-300`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
