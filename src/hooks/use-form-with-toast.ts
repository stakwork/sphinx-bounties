import { useForm, UseFormProps, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { toast } from "@/lib/toast";
import { formToasts } from "@/lib/notifications/templates";

export interface UseFormWithToastProps<T extends FieldValues> extends Omit<UseFormProps<T>, 'resolver'> {
  schema: ZodType<T>;
  onSubmitSuccess?: (data: T) => void | Promise<void>;
  onSubmitError?: (error: unknown) => void;
  successMessage?: string;
  errorMessage?: string;
  showToastOnValidationError?: boolean;
}

export function useFormWithToast<T extends FieldValues>({
  schema,
  onSubmitSuccess,
  onSubmitError,
  successMessage,
  errorMessage,
  showToastOnValidationError = false,
  ...formProps
}: UseFormWithToastProps<T>) {
  const form = useForm<T>({
    // @ts-expect-error - zodResolver type issue with generic schemas
    resolver: zodResolver(schema),
    ...formProps,
  });

  const handleSubmitWithToast = form.handleSubmit(
    async (data) => {
      try {
        // @ts-expect-error - react-hook-form generic type inference issue
        await onSubmitSuccess?.(data);
        if (successMessage) {
          toast.success(successMessage);
        }
      } catch (error) {
        console.error("Form submission error:", error);
        
        if (errorMessage) {
          toast.error(errorMessage);
        } else {
          formToasts.saveError();
        }
        
        onSubmitError?.(error);
      }
    },
    (errors) => {
      console.error("Form validation errors:", errors);
      
      if (showToastOnValidationError) {
        const firstError = Object.values(errors)[0];
        if (firstError?.message) {
          toast.error("Validation Error", firstError.message as string);
        } else {
          formToasts.validationError();
        }
      }
    }
  );

  return {
    ...form,
    handleSubmitWithToast,
  };
}
