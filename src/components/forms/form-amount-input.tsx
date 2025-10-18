import { forwardRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { formatNumber, formatSats, cn } from "@/lib/utils";

export interface FormAmountInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  label?: string;
  description?: string;
  value?: number;
  onValueChange?: (value: number | undefined) => void;
  showFormatted?: boolean;
}

export const FormAmountInput = forwardRef<HTMLInputElement, FormAmountInputProps>(
  (
    { label, description, value, onValueChange, showFormatted = true, className, ...props },
    ref
  ) => {
    const [inputValue, setInputValue] = useState(value?.toString() || "");
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      if (!isFocused && value !== undefined) {
        setInputValue(value.toString());
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/[^0-9]/g, "");
      setInputValue(rawValue);

      if (rawValue === "") {
        onValueChange?.(undefined);
      } else {
        const numValue = parseInt(rawValue, 10);
        if (!isNaN(numValue)) {
          onValueChange?.(numValue);
        }
      }
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
      if (inputValue && !isNaN(parseInt(inputValue, 10))) {
        const numValue = parseInt(inputValue, 10);
        setInputValue(numValue.toString());
      }
    };

    const displayValue = isFocused
      ? inputValue
      : inputValue && !isNaN(parseInt(inputValue, 10))
        ? formatNumber(parseInt(inputValue, 10))
        : inputValue;

    const formattedAmount = value !== undefined && value > 0 ? formatSats(value) : null;

    return (
      <FormItem>
        {label && (
          <div className="flex items-center justify-between">
            <FormLabel>{label}</FormLabel>
            {showFormatted && formattedAmount && (
              <span className="text-sm text-muted-foreground transition-colors">
                ≈ {formattedAmount}
              </span>
            )}
          </div>
        )}
        <FormControl>
          <div className="relative">
            <Input
              ref={ref}
              type="text"
              inputMode="numeric"
              value={displayValue}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={cn("pr-12", className)}
              {...props}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              sats
            </div>
          </div>
        </FormControl>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    );
  }
);

FormAmountInput.displayName = "FormAmountInput";
