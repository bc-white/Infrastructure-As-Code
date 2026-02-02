import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface LoginStore {
  currentStep: "userType" | "email" | "welcome" | "otp";
  mode: "login" | "register";
  setCurrentStep: (step: "userType" | "email" | "welcome" | "otp") => void;
  setMode: (mode: "login" | "register") => void;
  reset: () => void;
}

const useLoginStore = create<LoginStore>()(
  persist(
    (set) => ({
      currentStep: "userType",
      mode: "login",
      setCurrentStep: (step: "userType" | "email" | "welcome" | "otp") =>
        set({ currentStep: step }),
      setMode: (mode: "login" | "register") =>
        set({ mode, currentStep: mode === "register" ? "userType" : "email" }),
      reset: () => set({ currentStep: "userType", mode: "login" }),
    }),
    {
      name: "track-login",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useLoginStore;
