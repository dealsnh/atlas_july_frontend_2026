import { AxiosError } from "axios";
import { toast } from "sonner";

const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";

/** Extract error message from API error (AxiosError.response.data). */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (data && typeof data === "object") {
      const err = (data as { error?: string }).error;
      if (typeof err === "string" && err.trim()) return err;
      const msg = (data as { message?: string }).message;
      if (typeof msg === "string" && msg.trim()) return msg;
      const errors = (data as { errors?: unknown[] }).errors;
      if (Array.isArray(errors) && errors.length > 0) {
        const first = errors[0];
        const str =
          typeof first === "string"
            ? first
            : ((first as { message?: string })?.message ?? JSON.stringify(first));
        if (str && str !== "{}") return str;
      }
    }
  }
  if (error instanceof Error && error.message?.trim()) return error.message;
  return DEFAULT_ERROR_MESSAGE;
}

export function showApiErrorToast(error: unknown): void {
  toast.error(getApiErrorMessage(error));
}

export function showApiSuccessToast(message: string): void {
  const normalized = message?.trim();
  toast.success(normalized || "Success");
}

export function showApiWarningToast(message: string): void {
  const normalized = message?.trim();
  toast.warning(normalized || "Warning");
}
