import { toast } from '@/lib/toast';

interface ToastAsyncOptions<T> {
  loading: string;
  success: string | ((data: T) => string);
  error?: string | ((error: unknown) => string);
}
//Wrap async operations with automatic toast feedback
export function toastAsync<T>(
  promise: Promise<T>,
  options: ToastAsyncOptions<T>
): void {
  toast.promise(promise, {
    loading: options.loading,
    success: options.success,
    error: options.error || 'An error occurred',
  });
}

interface ToastMutationOptions<T> {
  loadingMessage: string;
  successMessage: string | ((data: T) => string);
  errorMessage?: string | ((error: unknown) => string);
}

// Helper for wrapping mutation functions with toasts
export function toastMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: ToastMutationOptions<TData>
) {
  return async (variables: TVariables) => {
    return toastAsync(mutationFn(variables), {
      loading: options.loadingMessage,
      success: options.successMessage,
      error: options.errorMessage,
    });
  };
}

//Generate onSuccess/onError handlers for queries/mutations
export function createToastHandler(
  successMessage: string,
  errorMessage?: string
) {
  return {
    onSuccess: () => toast.success(successMessage),
    onError: (error: unknown) => {
      const message = errorMessage || 'An error occurred';
      const description =
        error instanceof Error ? error.message : String(error);
      toast.error(message, description);
    },
  };
}
