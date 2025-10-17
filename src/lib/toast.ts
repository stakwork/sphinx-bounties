import { toast } from "sonner";

export const showSuccess = (message: string, description?: string) => {
  toast.success(message, {
    description,
  });
};

export const showError = (message: string, description?: string) => {
  toast.error(message, {
    description,
  });
};

export const showInfo = (message: string, description?: string) => {
  toast.info(message, {
    description,
  });
};

export const showWarning = (message: string, description?: string) => {
  toast.warning(message, {
    description,
  });
};

export const showLoading = (message: string) => {
  return toast.loading(message);
};

export const updateToast = (
  toastId: string | number,
  options: Record<string, unknown>
) => {
  toast(toastId, options);
};

export const dismissToast = (toastId?: string | number) => {
  toast.dismiss(toastId);
};
