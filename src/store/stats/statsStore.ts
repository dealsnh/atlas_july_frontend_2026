import { create } from "zustand";
import type { LeadStats } from "@/types";
import { getLeadStats } from "@/services/leadsServices";

interface StatsState {
  stats: LeadStats | null;
  isLoading: boolean;
  fetchStats: () => Promise<LeadStats>;
  resetForSessionEnd: () => void;
}

const initialState = {
  stats: null as LeadStats | null,
  isLoading: false,
};

export const useStatsStore = create<StatsState>((set) => ({
  ...initialState,

  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const stats = await getLeadStats();
      set({ stats, isLoading: false });
      return stats;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  resetForSessionEnd: () => set({ ...initialState }),
}));
