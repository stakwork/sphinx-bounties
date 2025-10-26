import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4", className)}>
      {Icon && (
        <div className="mb-4 rounded-full bg-neutral-100 p-4">
          <Icon className="h-8 w-8 text-neutral-400" />
        </div>
      )}
      <h3 className="mb-2 text-lg font-semibold text-neutral-900">{title}</h3>
      <p className="mb-6 max-w-md text-center text-sm text-neutral-500">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
}
