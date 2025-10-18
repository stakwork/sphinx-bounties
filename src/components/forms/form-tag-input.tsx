import type { KeyboardEvent } from "react";
import { forwardRef, useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

export interface FormTagInputProps {
  label?: string;
  description?: string;
  placeholder?: string;
  value?: string[];
  onValueChange?: (tags: string[]) => void;
  maxTags?: number;
  disabled?: boolean;
  name?: string;
}

export const FormTagInput = forwardRef<HTMLInputElement, FormTagInputProps>(
  (
    {
      label,
      description,
      placeholder = "Type and press Enter",
      value = [],
      onValueChange,
      maxTags,
      disabled,
      name,
    },
    ref
  ) => {
    const [inputValue, setInputValue] = useState("");

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag();
      } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
        removeTag(value.length - 1);
      }
    };

    const addTag = () => {
      const trimmedValue = inputValue.trim().toLowerCase();

      if (!trimmedValue) return;

      if (value.includes(trimmedValue)) {
        setInputValue("");
        return;
      }

      if (maxTags && value.length >= maxTags) {
        return;
      }

      onValueChange?.([...value, trimmedValue]);
      setInputValue("");
    };

    const removeTag = (index: number) => {
      const newTags = value.filter((_, i) => i !== index);
      onValueChange?.(newTags);
    };

    return (
      <FormItem>
        {label && (
          <div className="flex items-center justify-between">
            <FormLabel>{label}</FormLabel>
            {maxTags && (
              <span
                className={cn(
                  "text-xs transition-colors",
                  value.length >= maxTags ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {value.length}/{maxTags}
              </span>
            )}
          </div>
        )}
        <FormControl>
          <div
            className={cn(
              "flex flex-wrap gap-2 rounded-md border border-input bg-background p-2 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {value.map((tag, index) => (
              <Badge key={index} variant="secondary" className="gap-1 transition-colors">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  disabled={disabled}
                  className="ml-1 hover:text-destructive transition-colors"
                  aria-label={`Remove ${tag} tag`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Input
              ref={ref}
              name={name}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={addTag}
              placeholder={value.length === 0 ? placeholder : ""}
              disabled={disabled || (maxTags !== undefined && value.length >= maxTags)}
              className="flex-1 min-w-[120px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto bg-transparent"
            />
          </div>
        </FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    );
  }
);

FormTagInput.displayName = "FormTagInput";
