import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { isAuthenticated as checkAuthStatus, getCurrentUser } from '../../service/api';
import Login from '../../pages/auth/Login';

const AuthGuard = ({ 
  children, 
  requiredRole = null, 
  requiredPermission = null, 
  redirectTo = '/login',
  fallback = null 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      if (!isLoading) {
        // Double-check authentication status
        const apiAuthStatus = checkAuthStatus();
        const currentUser = getCurrentUser();
        
        if (!apiAuthStatus || !currentUser) {
          // Store the intended destination for after login
          localStorage.setItem('mocksurvey_intended_route', location.pathname);
          navigate(redirectTo);
          return;
        }

        // Check role-based access
        if (requiredRole && currentUser.role !== requiredRole) {
          navigate('/access-denied');
          return;
        }

        // Check permission-based access
        if (requiredPermission && !hasPermission(currentUser, requiredPermission)) {
          navigate('/insufficient-permissions');
          return;
        }

        setIsChecking(false);
      }
    };

    checkAuthentication();
  }, [isAuthenticated, isLoading, navigate, location.pathname, redirectTo, requiredRole, requiredPermission]);

  // Show loading state
  if (isLoading || isChecking) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Render children if all checks pass
  return children;
};

// Helper function to check permissions
const hasPermission = (user, permission) => {
  if (!user || !user.permissions) return false;
  return user.permissions.includes('*') || user.permissions.includes(permission);
};

export default AuthGuard; 