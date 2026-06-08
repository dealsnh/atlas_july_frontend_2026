import { AxiosError } from "axios";
import { toast } from "sonner";
import { getMessageFromApiPayload } from "@/services/apiShared";

const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";
const DEFAULT_SUCCESS_MESSAGE = "Success";

/** Extract error message from API error (AxiosError.response.data). */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const fromBody = getMessageFromApiPayload(error.response?.data);
    if (fromBody) return fromBody;

    const data = error.response?.data;
    if (data && typeof data === "object") {
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

/** Extract a success message from a resolved API response body. */
export function getApiSuccessMessage(payload: unknown, fallback = DEFAULT_SUCCESS_MESSAGE): string {
  return getMessageFromApiPayload(payload) ?? fallback;
}

export function showApiErrorToast(error: unknown): void {
  if (typeof error === "string" && error.trim()) {
    toast.error(error.trim());
    return;
  }
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
