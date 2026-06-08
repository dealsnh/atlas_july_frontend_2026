import { create } from "zustand";
import type { AppSettings, SettingsSavePayload, TestEmailPayload, TestEmailResponse } from "@/types";
import {
  getSettings,
  saveSettings as saveSettingsApi,
  settingsToFormValues,
  testEmailSettings,
} from "@/services/settingsServices";

interface SettingsState {
  settings: AppSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  isTestingEmail: boolean;
  fetchSettings: () => Promise<AppSettings>;
  saveSettings: (payload: SettingsSavePayload) => Promise<{ settings: AppSettings; message?: string }>;
  testEmail: (payload: TestEmailPayload) => Promise<TestEmailResponse>;
  resetForSessionEnd: () => void;
}

const initialState = {
  settings: null as AppSettings | null,
  isLoading: false,
  isSaving: false,
  isTestingEmail: false,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  ...initialState,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await getSettings();
      set({ settings, isLoading: false });
      return settings;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  saveSettings: async (payload) => {
    set({ isSaving: true });
    try {
      const result = await saveSettingsApi(payload);
      set({ settings: result.settings, isSaving: false });
      return result;
    } catch (error) {
      set({ isSaving: false });
      throw error;
    }
  },

  testEmail: async (payload) => {
    set({ isTestingEmail: true });
    try {
      const result = await testEmailSettings(payload);
      set({ isTestingEmail: false });
      return result;
    } catch (error) {
      set({ isTestingEmail: false });
      throw error;
    }
  },

  resetForSessionEnd: () => set({ ...initialState }),
}));

export { settingsToFormValues };
