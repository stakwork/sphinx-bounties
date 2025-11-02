import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const cardStyles = [
  {
    gradient: "from-violet-500/10 via-purple-500/10 to-fuchsia-500/10",
    iconGradient: "from-violet-400 to-fuchsia-600",
  },
  {
    gradient: "from-blue-500/10 via-cyan-500/10 to-teal-500/10",
    iconGradient: "from-blue-400 to-cyan-600",
  },
  {
    gradient: "from-emerald-500/10 via-green-500/10 to-lime-500/10",
    iconGradient: "from-emerald-400 to-green-600",
  },
  {
    gradient: "from-orange-500/10 via-amber-500/10 to-yellow-500/10",
    iconGradient: "from-orange-400 to-yellow-600",
  },
];

let cardStyleIndex = 0;

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  const style = cardStyles[cardStyleIndex % cardStyles.length];
  cardStyleIndex++;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border border-neutral-200/50 backdrop-blur-sm bg-gradient-to-br",
        style.gradient,
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900 transition-colors">
          {title}
        </CardTitle>
        {Icon && (
          <div
            className={cn(
              "p-2 rounded-lg bg-gradient-to-br backdrop-blur-sm transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300",
              style.iconGradient
            )}
          >
            <Icon className="h-4 w-4 text-white drop-shadow-lg" />
          </div>
        )}
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold bg-gradient-to-br from-neutral-900 to-neutral-700 bg-clip-text text-transparent">
          {value}
        </div>
        {(description || trend) && (
          <div className="flex items-center gap-2 mt-2">
            {description && <p className="text-xs text-neutral-600 font-medium">{description}</p>}
            {trend && (
              <span
                className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm",
                  trend.isPositive
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-red-100 text-red-700 border border-red-200"
                )}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
