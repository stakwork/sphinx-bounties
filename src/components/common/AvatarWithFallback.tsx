import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarWithFallbackProps {
  src?: string | null;
  alt: string;
  fallbackText?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

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
    if (fallbackText) return fallbackText;
    const words = alt.split(" ");
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return alt.slice(0, 2).toUpperCase();
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {src && <AvatarImage src={src} alt={alt} />}
      <AvatarFallback className="bg-primary-100 text-primary-700">
        {getFallbackText()}
      </AvatarFallback>
    </Avatar>
  );
}
