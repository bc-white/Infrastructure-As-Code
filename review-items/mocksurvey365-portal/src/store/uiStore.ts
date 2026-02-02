import { create } from 'zustand';
import type { RefObject } from 'react';

interface UIState {
  showBottomNav: boolean;
  setShowBottomNav: (show: boolean) => void;
  mainRef: RefObject<HTMLElement> | null;
  setMainRef: (ref: RefObject<HTMLElement>) => void;
}

export const useUIStore = create<UIState>((set) => ({
  showBottomNav: true,
  setShowBottomNav: (show) => set({ showBottomNav: show }),
  mainRef: null,
  setMainRef: (ref) => set({ mainRef: ref }),
}));
