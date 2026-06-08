import { create } from "zustand";
import type { AuthUser } from "@/types";
import { logout as logoutApi } from "@/services/authServices";
import {
  clearAuthState,
  getAccessToken,
  getStoredUser,
  loadAuthState,
  saveAuthState,
} from "@/utils/authStorage";
import { useScrapeStore } from "@/store/scrape/scrapeStore";
import { useSettingsStore } from "@/store/settings/settingsStore";
import { useLeadsStore } from "@/store/leads/leadsStore";
import { useStatsStore } from "@/store/stats/statsStore";

function resetClientStoresAfterSessionEnd() {
  useScrapeStore.getState().resetForSessionEnd();
  useSettingsStore.getState().resetForSessionEnd();
  useStatsStore.getState().resetForSessionEnd();
  useLeadsStore.getState().resetForSessionEnd();
}

type HydratedAuth = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
};

function getHydratedAuth(): HydratedAuth {
  if (typeof window === "undefined") {
    return { user: null, token: null, isAuthenticated: false };
  }

  const persisted = loadAuthState();
  if (!persisted?.accessToken || !persisted.user) {
    return { user: null, token: null, isAuthenticated: false };
  }
  return { user: persisted.user, token: persisted.accessToken, isAuthenticated: true };
}

const hydrated = getHydratedAuth();

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setCredentials: (payload: { user: AuthUser; token: string; refreshToken?: string }) => void;
  logout: () => Promise<{ success: boolean; message: string; error?: unknown }>;
  initializeAuth: () => void;
  clearSessionDueToUnauthorized: () => void;
  applyRefreshedSession: (
    accessToken: string,
    refreshToken: string,
    userFromPayload?: AuthUser | null,
  ) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: hydrated.user,
  token: hydrated.token,
  isAuthenticated: hydrated.isAuthenticated,
  isLoading: !hydrated.token,

  setCredentials: ({ user, token, refreshToken }) => {
    saveAuthState({
      accessToken: token,
      refreshToken: refreshToken ?? null,
      user,
    });
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    const accessToken = getAccessToken();
    try {
      const response = await logoutApi(accessToken);
      const message =
        typeof response?.message === "string" && response.message.trim()
          ? response.message
          : "Logged out successfully";
      return { success: true, message };
    } catch (error) {
      return { success: false, message: "Logged out locally due to server error.", error };
    } finally {
      clearAuthState();
      resetClientStoresAfterSessionEnd();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearSessionDueToUnauthorized: () => {
    clearAuthState();
    resetClientStoresAfterSessionEnd();
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  applyRefreshedSession: (accessToken, refreshToken, userFromPayload) => {
    const user = userFromPayload ?? get().user ?? getStoredUser();
    if (!user) return false;
    saveAuthState({ accessToken, refreshToken, user });
    set({ token: accessToken, user, isAuthenticated: true, isLoading: false });
    return true;
  },

  initializeAuth: () => {
    const persisted = loadAuthState();
    if (persisted?.accessToken && persisted.user) {
      set({
        user: persisted.user,
        token: persisted.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
      return;
    }
    clearAuthState();
    resetClientStoresAfterSessionEnd();
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
}));
