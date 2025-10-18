import { useCallback } from "react";
import type { FieldErrors, FieldValues, Path, UseFormSetError } from "react-hook-form";
import { AppError } from "@/lib/errors/base";
import { ErrorCode } from "@/types/error";

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export function useFormErrors<T extends FieldValues>(setError: UseFormSetError<T>) {
  const setFieldErrors = useCallback(
    (errors: ValidationErrorDetail[]) => {
      errors.forEach((error) => {
        setError(error.field as Path<T>, {
          type: "server",
          message: error.message,
        });
      });
    },
    [setError]
  );

  const setFormError = useCallback(
    (error: unknown, fallbackMessage = "An error occurred") => {
      if (error instanceof AppError) {
        if (error.code === ErrorCode.VALIDATION_ERROR && error.metadata?.fields) {
          const fields = error.metadata.fields as ValidationErrorDetail[];
          setFieldErrors(fields);
        } else {
          setError("root" as Path<T>, {
            type: "server",
            message: error.message || fallbackMessage,
          });
        }
      } else if (error instanceof Error) {
        setError("root" as Path<T>, {
          type: "server",
          message: error.message || fallbackMessage,
        });
      } else {
        setError("root" as Path<T>, {
          type: "server",
          message: fallbackMessage,
        });
      }
    },
    [setError, setFieldErrors]
  );

  const clearFormErrors = useCallback(() => {
    setError("root" as Path<T>, {
      type: "manual",
      message: undefined,
    });
  }, [setError]);

  const getFieldError = useCallback(
    (fieldName: Path<T>, errors: FieldErrors<T>): string | undefined => {
      const error = errors[fieldName];
      if (!error) return undefined;
      return error.message as string | undefined;
    },
    []
  );

  const hasFieldError = useCallback((fieldName: Path<T>, errors: FieldErrors<T>): boolean => {
    return !!errors[fieldName];
  }, []);

  const getRootError = useCallback((errors: FieldErrors<T>): string | undefined => {
    const rootError = errors.root;
    if (!rootError) return undefined;
    return rootError.message as string | undefined;
  }, []);

  return {
    setFieldErrors,
    setFormError,
    clearFormErrors,
    getFieldError,
    hasFieldError,
    getRootError,
  };
}
