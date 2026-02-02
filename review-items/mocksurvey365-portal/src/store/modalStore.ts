import { create } from 'zustand';

interface ModalState {
  isOpen: boolean;
  mode: 'create_schedule' | 'add_shift' | 'edit_shift' | 'bulk_generate' | 'copy_schedule' | 'add_employee' | 'edit_employee' | 'add_callout' | 'edit_callout' | 'view_callout' | 'assign_replacement';
  data?: any;
  setOpen: (open: boolean) => void;
  setMode: (mode: 'create_schedule' | 'add_shift' | 'edit_shift' | 'bulk_generate' | 'copy_schedule' | 'add_employee' | 'edit_employee' | 'add_callout' | 'edit_callout' | 'view_callout' | 'assign_replacement') => void;
  setData: (data?: any) => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  mode: 'add_shift',
  data: undefined,
  setOpen: (open) => set({ isOpen: open }),
  setMode: (mode) => set({ mode }),
  setData: (data) => set({ data }),
})); 