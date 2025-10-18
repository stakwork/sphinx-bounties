import { forwardRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export interface FormSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface FormSelectProps {
  label?: string;
  description?: string;
  placeholder?: string;
  options: FormSelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

export const FormSelect = forwardRef<HTMLButtonElement, FormSelectProps>(
  ({ label, description, placeholder, options, value, onValueChange, disabled }, ref) => {
    return (
      <FormItem>
        {label && <FormLabel>{label}</FormLabel>}
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <FormControl>
            <SelectTrigger ref={ref}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {description && <FormDescription>{description}</FormDescription>}
        <FormMessage />
      </FormItem>
    );
  }
);

FormSelect.displayName = "FormSelect";
