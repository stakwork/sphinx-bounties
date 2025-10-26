import { cn } from "@/lib/utils";
import type { BountyStatus } from "@/types/enums";
import { BOUNTY_STATUS_CONFIG } from "@/constants/status";

interface StatusBadgeProps {
  status: BountyStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const config = BOUNTY_STATUS_CONFIG[status];

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium border",
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        borderColor: config.color,
      }}
    >
      {config.label}
    </span>
  );
}
