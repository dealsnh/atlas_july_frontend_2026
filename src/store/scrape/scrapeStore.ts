import { create } from "zustand";
import type { ScrapeRun } from "@/types";

interface ScrapeState {
  scraping: boolean;
  scrapeLog: string[];
  runHistory: ScrapeRun[];
  setScraping: (scraping: boolean) => void;
  setScrapeLog: (log: string[]) => void;
  setRunHistory: (runs: ScrapeRun[]) => void;
  resetForSessionEnd: () => void;
}

const initialState = {
  scraping: false,
  scrapeLog: [] as string[],
  runHistory: [] as ScrapeRun[],
};

export const useScrapeStore = create<ScrapeState>((set) => ({
  ...initialState,

  setScraping: (scraping) => set({ scraping }),

  setScrapeLog: (scrapeLog) => set({ scrapeLog }),

  setRunHistory: (runHistory) => set({ runHistory }),

  resetForSessionEnd: () => set({ ...initialState }),
}));
