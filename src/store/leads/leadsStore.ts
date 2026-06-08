import { create } from "zustand";
import type { Lead, LeadsListParams, LeadsListResponse } from "@/types";
import { getLeads } from "@/services/leadsServices";

interface LeadsState {
  leads: Lead[];
  total: number;
  isLoading: boolean;
  fetchLeads: (params: LeadsListParams) => Promise<LeadsListResponse>;
  updateLeadInList: (id: string, patch: Partial<Lead>) => void;
  resetForSessionEnd: () => void;
}

const initialState = {
  leads: [] as Lead[],
  total: 0,
  isLoading: false,
};

export const useLeadsStore = create<LeadsState>((set) => ({
  ...initialState,

  fetchLeads: async (params) => {
    set({ isLoading: true });
    try {
      const result = await getLeads(params);
      set({ leads: result.leads, total: result.total, isLoading: false });
      return result;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateLeadInList: (id, patch) =>
    set((state) => ({
      leads: state.leads.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)),
    })),

  resetForSessionEnd: () => set({ ...initialState }),
}));
