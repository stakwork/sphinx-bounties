import { forwardRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  showCharCount?: boolean;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, description, showCharCount, maxLength, value, onChange, ...props }, ref) => {
    const [charCount, setCharCount] = useState(typeof value === "string" ? value.length : 0);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    return (
      <FormItem>
        {label && (
          <div className="flex items-center justify-between">
            <FormLabel>{label}</FormLabel>
            {showCharCount && maxLength && (
              <span
                className={cn(
                  "text-xs transition-colors",
                  charCount > maxLength ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {charCount}/{maxLength}
              </span>
            )}
          </div>
        )}
        <FormControl>
          <Textarea
            ref={ref}
            value={value}
            maxLength={maxLength}
            onChange={handleChange}
            {...props}
          />
        </FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    );
  }
);

FormTextarea.displayName = "FormTextarea";
