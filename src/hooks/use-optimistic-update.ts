import { useState, useCallback, useOptimistic } from "react";

export interface UseOptimisticUpdateOptions<TData> {
  onSuccess?: (data: TData) => void;
  onError?: (error: unknown) => void;
  rollbackOnError?: boolean;
}

export function useOptimisticUpdate<TData, TInput>(
  initialData: TData,
  updateFn: (current: TData, input: TInput) => TData,
  options: UseOptimisticUpdateOptions<TData> = {}
) {
  const { onSuccess, onError, rollbackOnError = true } = options;

  const [data, setData] = useState<TData>(initialData);
  const [optimisticData, addOptimisticUpdate] = useOptimistic(data, (current, newInput: TInput) =>
    updateFn(current, newInput)
  );

  const update = useCallback(
    async (input: TInput, serverAction: () => Promise<TData>) => {
      const previousData = data;

      try {
        addOptimisticUpdate(input);

        const result = await serverAction();
        setData(result);
        onSuccess?.(result);

        return result;
      } catch (error) {
        if (rollbackOnError) {
          setData(previousData);
        }
        onError?.(error);
        throw error;
      }
    },
    [data, addOptimisticUpdate, onSuccess, onError, rollbackOnError]
  );

  const reset = useCallback(() => {
    setData(initialData);
  }, [initialData]);

  return {
    data: optimisticData,
    update,
    reset,
  };
}
