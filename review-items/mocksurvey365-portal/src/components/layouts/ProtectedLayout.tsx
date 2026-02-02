import { useAuth } from "@/hooks/useAuth";
import { Navigate, Outlet } from "react-router";

const ProtectedLayout = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return <Outlet />;
};

export default ProtectedLayout;
