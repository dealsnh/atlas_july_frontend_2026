import apiInvoker from "@/lib/apiInvoker";
import { END_POINT } from "@/lib/apiURL";
import type { ApiData } from "@/services/apiShared";
import { unwrapData } from "@/services/apiShared";
import type { AppSettings, SettingsSavePayload, TestEmailPayload, TestEmailResponse } from "@/types";

function extractSettings(payload: unknown): AppSettings {
  const next = unwrapData(payload as ApiData<AppSettings>);
  if (next && typeof next === "object") return next as AppSettings;
  return payload as AppSettings;
}

function extractTestEmailResponse(payload: unknown): TestEmailResponse {
  const next = unwrapData(payload as ApiData<TestEmailResponse>);
  if (next && typeof next === "object") return next as TestEmailResponse;
  if (payload && typeof payload === "object") return payload as TestEmailResponse;
  return {};
}

export async function getSettings() {
  const data = await apiInvoker<ApiData<AppSettings> | AppSettings>(END_POINT.settings.get, "GET");
  return extractSettings(data);
}

export async function saveSettings(payload: SettingsSavePayload) {
  await apiInvoker<unknown>(END_POINT.settings.save, "POST", payload);
  return getSettings();
}

export async function testEmailSettings(payload: TestEmailPayload) {
  const data = await apiInvoker<ApiData<TestEmailResponse> | TestEmailResponse>(
    END_POINT.settings.testEmail,
    "POST",
    payload,
  );
  return extractTestEmailResponse(data);
}
