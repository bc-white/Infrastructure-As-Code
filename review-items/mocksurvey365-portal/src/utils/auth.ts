import { useAuthStore } from "@/store/auth";

export const logout = () => {
  const { logout } = useAuthStore.getState();
  
  // Clear auth store
  logout();
  
  // Clear localStorage
  localStorage.removeItem('token');
  
  // Redirect to login
  window.location.href = '/login';
};

export const isAuthenticated = () => {
  const { checkAuth } = useAuthStore.getState();
  return checkAuth();
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const setToken = (token: string) => {
  localStorage.setItem('token', token);
}; 