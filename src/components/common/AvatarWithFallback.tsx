import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarWithFallbackProps {
  src?: string | null;
  alt: string;
  fallbackText?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const gradientPalette = [
  "from-primary-400 to-primary-600",
  "from-secondary-400 to-secondary-600",
  "from-tertiary-400 to-tertiary-600",
  "from-accent-400 to-accent-600",
  "from-primary-500 to-secondary-500",
  "from-secondary-500 to-tertiary-500",
  "from-tertiary-500 to-accent-500",
  "from-accent-500 to-primary-500",
];

export function AvatarWithFallback({
  src,
  alt,
  fallbackText,
  size = "md",
  className,
}: AvatarWithFallbackProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  };

  const getFallbackText = () => {
    const text = fallbackText || alt || "??";
    const words = text.trim().split(/\s+/);

    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return text.slice(0, 2).toUpperCase();
  };

  const getGradientClass = () => {
    const text = fallbackText || alt || "default";
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradientPalette.length;
    return gradientPalette[index];
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {src && <AvatarImage src={src} alt={alt} />}
      <AvatarFallback
        className={cn("bg-gradient-to-br text-white font-semibold", getGradientClass())}
      >
        {getFallbackText()}
      </AvatarFallback>
    </Avatar>
  );
}
