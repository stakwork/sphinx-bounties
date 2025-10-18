import { toast as sonnerToast } from "sonner";

export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, { description });
  },

  error: (message: string, description?: string) => {
    sonnerToast.error(message, { description });
  },

  info: (message: string, description?: string) => {
    sonnerToast.info(message, { description });
  },

  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, { description });
  },

  loading: (message: string) => {
    return sonnerToast.loading(message);
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return sonnerToast.promise(promise, messages);
  },

  dismiss: (id?: string | number) => {
    sonnerToast.dismiss(id);
  },
};

export const showSuccess = toast.success;
export const showError = toast.error;
export const showInfo = toast.info;
export const showWarning = toast.warning;
export const showLoading = toast.loading;
export const dismissToast = toast.dismiss;
