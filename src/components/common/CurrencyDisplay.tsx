import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number | string;
  currency?: "sats" | "BTC" | "USD";
  size?: "sm" | "md" | "lg";
  showSymbol?: boolean;
  className?: string;
}

export function CurrencyDisplay({
  amount,
  currency = "sats",
  size = "md",
  showSymbol = true,
  className,
}: CurrencyDisplayProps) {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  const formatAmount = () => {
    if (currency === "sats") {
      return numericAmount.toLocaleString("en-US");
    }
    if (currency === "BTC") {
      return (numericAmount / 100000000).toFixed(8);
    }
    return numericAmount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  const getCurrencySymbol = () => {
    if (!showSymbol) return "";
    if (currency === "sats") return " sats";
    if (currency === "BTC") return " ₿";
    return "";
  };

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <span className={cn("font-semibold tabular-nums", sizeClasses[size], className)}>
      {formatAmount()}
      <span className="font-normal text-muted-foreground">{getCurrencySymbol()}</span>
    </span>
  );
}
