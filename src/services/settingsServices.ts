import apiInvoker from "@/lib/apiInvoker";
import { END_POINT } from "@/lib/apiURL";
import type { ApiData } from "@/services/apiShared";
import { getMessageFromApiPayload, unwrapData } from "@/services/apiShared";
import type {
  AppSettings,
  SettingsApiResponse,
  SettingsSaveApiResponse,
  SettingsSavePayload,
  TestEmailApiResponse,
  TestEmailPayload,
  TestEmailResponse,
} from "@/types";

/** Placeholder returned by GET and sent on POST to keep secrets unchanged. */
export const MASKED_SECRET_PLACEHOLDER = "••••••••••••••••";

const SECRET_FIELDS = [
  "smtp_pass",
  "scraper_api_key",
  "skip_trace_key",
  "bright_data_pass",
  "attom_api_key",
] as const satisfies ReadonlyArray<keyof SettingsSavePayload>;

export function isMaskedSecretValue(value: string): boolean {
  return /^•+$/.test(value);
}

function assertApiSuccess(payload: unknown, fallbackMessage: string): void {
  if (!payload || typeof payload !== "object" || !("success" in payload)) return;

  const envelope = payload as { success: boolean };
  if (!envelope.success) {
    throw new Error(getMessageFromApiPayload(payload) || fallbackMessage);
  }
}

function extractSettings(payload: unknown): AppSettings {
  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as SettingsApiResponse;
    assertApiSuccess(envelope, "Failed to load settings");
    return envelope.data;
  }

  const next = unwrapData(payload as ApiData<AppSettings>);
  if (next && typeof next === "object") return next as AppSettings;
  return payload as AppSettings;
}

function extractSaveSettingsResponse(payload: unknown): { ok: boolean; message?: string } {
  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as SettingsSaveApiResponse;
    assertApiSuccess(envelope, "Failed to save settings");
    return {
      ...(envelope.data ?? { ok: true }),
      message: getMessageFromApiPayload(payload),
    };
  }

  const next = unwrapData(payload as ApiData<{ ok: boolean; message?: string }>);
  if (next && typeof next === "object") {
    return { ...next, message: getMessageFromApiPayload(payload) ?? next.message };
  }
  return { ok: true, message: getMessageFromApiPayload(payload) };
}

function resolveSecretField(formValue: string | undefined, settingsValue: string): string {
  const value = formValue ?? "";
  const trimmed = value.trim();

  if (!trimmed) return "";

  if (isMaskedSecretValue(trimmed) || (trimmed === settingsValue && isMaskedSecretValue(settingsValue))) {
    return MASKED_SECRET_PLACEHOLDER;
  }

  return value;
}

/** Map form values to a partial-update payload, preserving unchanged secrets. */
export function prepareSettingsSavePayload(
  form: SettingsSavePayload,
  current: AppSettings,
): SettingsSavePayload {
  const payload: SettingsSavePayload = { ...form };

  for (const field of SECRET_FIELDS) {
    if (field in form) {
      payload[field] = resolveSecretField(form[field], current[field]);
    }
  }

  return payload;
}

export function settingsToFormValues(data: AppSettings): Record<string, string> {
  return {
    smtp_host: data.smtp_host || "",
    smtp_port: data.smtp_port || "587",
    smtp_user: data.smtp_user || "",
    smtp_pass: data.smtp_pass || "",
    smtp_from: data.smtp_from || "",
    email_recipients: data.email_recipients || "",
    auto_skip_trace: data.auto_skip_trace || "false",
    bright_data_user: data.bright_data_user || "",
    bright_data_pass: data.bright_data_pass || "",
    scraper_api_key: data.scraper_api_key || "",
    skip_trace_key: data.skip_trace_key || "",
    attom_api_key: data.attom_api_key || "",
  };
}

function extractTestEmailResponse(payload: unknown): TestEmailResponse {
  if (payload && typeof payload === "object" && "success" in payload) {
    const envelope = payload as TestEmailApiResponse;
    assertApiSuccess(envelope, "Failed to send test email");

    const data = envelope.data;
    return {
      ok: data?.ok ?? true,
      message: data?.message ?? getMessageFromApiPayload(payload),
    };
  }

  const next = unwrapData(payload as ApiData<TestEmailResponse>);
  if (next && typeof next === "object") {
    return {
      ok: next.ok ?? true,
      message: next.message ?? getMessageFromApiPayload(payload),
    };
  }

  return { ok: true, message: getMessageFromApiPayload(payload) };
}

export async function getSettings() {
  const data = await apiInvoker<SettingsApiResponse | ApiData<AppSettings> | AppSettings>(
    END_POINT.settings.get,
    "GET",
  );
  return extractSettings(data);
}

export async function saveSettings(payload: SettingsSavePayload) {
  const data = await apiInvoker<SettingsSaveApiResponse | ApiData<{ ok: boolean }>>(
    END_POINT.settings.save,
    "POST",
    payload,
  );
  const result = extractSaveSettingsResponse(data);
  const settings = await getSettings();
  return { settings, message: result.message };
}

export async function testEmailSettings(payload: TestEmailPayload) {
  const data = await apiInvoker<TestEmailApiResponse | ApiData<TestEmailResponse>>(
    END_POINT.settings.testEmail,
    "POST",
    payload,
  );
  return extractTestEmailResponse(data);
}
