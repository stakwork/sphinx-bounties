import { forwardRef, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn, formatDate } from "@/lib/utils";

export interface FormDatePickerProps {
  label?: string;
  description?: string;
  placeholder?: string;
  value?: Date;
  onValueChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  disablePast?: boolean;
  disableFuture?: boolean;
}

export const FormDatePicker = forwardRef<HTMLButtonElement, FormDatePickerProps>(
  (
    {
      label,
      description,
      placeholder = "Pick a date",
      value,
      onValueChange,
      disabled,
      disablePast,
      disableFuture,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);

    const handleSelect = (date: Date | undefined) => {
      onValueChange?.(date);
      setOpen(false);
    };

    const getMinDate = () => {
      if (disablePast) {
        return new Date().toISOString().split('T')[0];
      }
      return undefined;
    };

    const getMaxDate = () => {
      if (disableFuture) {
        return new Date().toISOString().split('T')[0];
      }
      return undefined;
    };

    return (
      <FormItem>
        {label && <FormLabel>{label}</FormLabel>}
        <Popover open={open} onOpenChange={setOpen}>
          <FormControl>
            <PopoverTrigger asChild>
              <Button
                ref={ref}
                variant="outline"
                disabled={disabled}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? formatDate(value) : placeholder}
              </Button>
            </PopoverTrigger>
          </FormControl>
          <PopoverContent className="w-auto p-0" align="start">
            <input
              type="date"
              value={value ? value.toISOString().split('T')[0] : ''}
              onChange={(e) => handleSelect(e.target.value ? new Date(e.target.value) : undefined)}
              min={getMinDate()}
              max={getMaxDate()}
              className="w-full p-3 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </PopoverContent>
        </Popover>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    );
  }
);

FormDatePicker.displayName = "FormDatePicker";
