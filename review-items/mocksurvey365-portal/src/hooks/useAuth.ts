import { useAuthStore } from "@/store/auth";

export const useAuth = () => {
  const { user, token, login, logout } = useAuthStore();

  return { user, token, login, logout, isAuthenticated: !!token };
};
