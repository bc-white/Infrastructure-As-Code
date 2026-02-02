import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SavedState {
  savedDiscountIds: string[];
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
  clearAll: () => void;
}

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      savedDiscountIds: [],

      toggleSaved: (id: string) => {
        const { savedDiscountIds } = get();
        const isSaved = savedDiscountIds.includes(id);

        if (isSaved) {
          // Remove from saved
          set({ savedDiscountIds: savedDiscountIds.filter((discountId) => discountId !== id) });
        } else {
          // Add to saved
          set({ savedDiscountIds: [...savedDiscountIds, id] });
        }
      },

      isSaved: (id: string) => {
        const { savedDiscountIds } = get();
        return savedDiscountIds.includes(id);
      },

      clearAll: () => {
        set({ savedDiscountIds: [] });
      },
    }),
    {
      name: 'saved-discounts-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
