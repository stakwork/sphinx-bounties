import { useState, useCallback, useTransition } from "react";
import { toastAsync } from "@/lib/notifications/actions";

export interface UseAsyncActionOptions<TResult> {
  onSuccess?: (result: TResult) => void | Promise<void>;
  onError?: (error: unknown) => void;
  successMessage?: string;
  errorMessage?: string;
  loadingMessage?: string;
}

export interface UseAsyncActionReturn<TResult, TArgs extends unknown[]> {
  execute: (...args: TArgs) => Promise<TResult | undefined>;
  isLoading: boolean;
  error: Error | null;
  data: TResult | null;
  reset: () => void;
}

export function useAsyncAction<TResult, TArgs extends unknown[] = []>(
  action: (...args: TArgs) => Promise<TResult>,
  options: UseAsyncActionOptions<TResult> = {}
): UseAsyncActionReturn<TResult, TArgs> {
  const {
    onSuccess,
    onError,
    successMessage = "Action completed successfully",
    errorMessage = "An error occurred",
    loadingMessage = "Processing...",
  } = options;

  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TResult | null>(null);

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      setIsLoading(true);
      setError(null);

      return new Promise((resolve) => {
        startTransition(async () => {
          try {
            const actionPromise = action(...args);

            toastAsync(actionPromise, {
              loading: loadingMessage,
              success: successMessage,
              error: errorMessage,
            });

            const result = await actionPromise;
            setData(result);
            await onSuccess?.(result);
            resolve(result);
          } catch (err) {
            const errorObj = err instanceof Error ? err : new Error(String(err));
            setError(errorObj);
            onError?.(err);
            resolve(undefined);
          } finally {
            setIsLoading(false);
          }
        });
      });
    },
    [action, onSuccess, onError, successMessage, errorMessage, loadingMessage]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    execute,
    isLoading: isLoading || isPending,
    error,
    data,
    reset,
  };
}
