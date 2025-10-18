import { useState, useCallback } from "react";
import { toast } from "@/lib/toast";
import { mapErrorToAppError } from "@/lib/errors/mapper";

export interface UseServerActionOptions<TData, TInput> {
  action: (input: TInput) => Promise<TData>;
  onSuccess?: (data: TData) => void | Promise<void>;
  onError?: (error: unknown) => void;
  successMessage?: string;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export interface UseServerActionReturn<TData, TInput> {
  execute: (input: TInput) => Promise<TData | undefined>;
  isLoading: boolean;
  error: Error | null;
  data: TData | null;
  reset: () => void;
}

export function useServerAction<TData, TInput>({
  action,
  onSuccess,
  onError,
  successMessage,
  errorMessage,
  showSuccessToast = true,
  showErrorToast = true,
}: UseServerActionOptions<TData, TInput>): UseServerActionReturn<TData, TInput> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const execute = useCallback(
    async (input: TInput): Promise<TData | undefined> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await action(input);
        setData(result);

        if (showSuccessToast && successMessage) {
          toast.success(successMessage);
        }

        await onSuccess?.(result);
        return result;
      } catch (err) {
        const appError = mapErrorToAppError(err);
        setError(appError);

        if (showErrorToast) {
          const message = errorMessage || appError.message;
          toast.error("Error", message);
        }

        onError?.(err);
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [action, onSuccess, onError, successMessage, errorMessage, showSuccessToast, showErrorToast]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    isLoading,
    error,
    data,
    reset,
  };
}
