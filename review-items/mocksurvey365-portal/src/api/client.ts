import axios from "axios";
import { useAuthStore } from "@/store/auth";

const apiClient = axios.create({
  baseURL: "https://apistaging.mocksurvey365.com/api/v1",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    // Add authorization header if token exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Send user role for server-side RBAC enforcement
    try {
      const auth = useAuthStore.getState().user as any;
      const role = auth?.role;
      if (role) {
        (config.headers as any)["X-User-Role"] = role;
      }
      const userId = auth?.id;
      if (userId) {
        (config.headers as any)["X-User-Id"] = userId;
      }
    } catch (_) {}
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API error:", error);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      
      // Import and use auth store to logout
      import('@/store/auth').then(({ useAuthStore }) => {
        const { logout } = useAuthStore.getState();
        logout();
      });
      
      // Redirect to login if not already there (skip hard reload in dev to aid debugging)
      const isDev = import.meta.env.DEV;
      if (!isDev) {
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
