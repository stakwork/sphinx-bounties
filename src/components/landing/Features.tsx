import { Zap, Shield, Globe, Users, Wallet, TrendingUp } from "lucide-react";

const features = [
  {
    name: "Lightning Fast Payments",
    description: "Get paid instantly in Bitcoin via Lightning Network. No waiting, no delays.",
    icon: Zap,
  },
  {
    name: "Open & Transparent",
    description:
      "Every bounty, payment, and contribution is visible. Build trust through transparency.",
    icon: Globe,
  },
  {
    name: "Secure & Self-Sovereign",
    description:
      "Non-custodial authentication with LNURL. You control your keys, you control your funds.",
    icon: Shield,
  },
  {
    name: "Global Talent Pool",
    description:
      "Connect with developers worldwide. No borders, no banks, just pure collaboration.",
    icon: Users,
  },
  {
    name: "Your Wallet, Your Rules",
    description:
      "Receive payments directly to your Lightning wallet. No platform fees, no middlemen.",
    icon: Wallet,
  },
  {
    name: "Reputation System",
    description: "Build your on-chain reputation. Earn badges, climb the leaderboard, get noticed.",
    icon: TrendingUp,
  },
];

export function Features() {
  return (
    <section className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-500">
            Everything you need
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            A better way to work and get paid
          </p>
          <p className="mt-6 text-lg leading-8 text-foreground/70">
            Built for developers, by developers. Powered by Bitcoin.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
                  <feature.icon className="h-5 w-5 flex-none text-primary-500" aria-hidden="true" />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-foreground/70">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
