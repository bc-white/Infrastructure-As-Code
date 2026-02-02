import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAuth0 } from '@auth0/auth0-react';
import { isAuthenticated as checkAuthStatus, getCurrentUser } from '../../service/api';
import Login from '../../pages/auth/Login';
import AuthenticatedLayout from '../layout/AuthenticatedLayout';
import { useNavigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole = null, requiredPermission = null, noLayout = false, requiredFeature = null }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { isAuthenticated: isAuth0Authenticated, isLoading: isAuth0Loading } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();

  // Combined authentication check
  const isUserAuthenticated = isAuthenticated || isAuth0Authenticated || checkAuthStatus();
  const isCombinedLoading = isLoading || isAuth0Loading;

  // Additional authentication check using API utilities
  useEffect(() => {
    if (!isCombinedLoading && !isUserAuthenticated) {
      navigate('/login');
    }
  }, [isUserAuthenticated, isCombinedLoading, navigate]);

  // Show loading state
  if (isCombinedLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isUserAuthenticated) {
    return <Login />;
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <AuthenticatedLayout>
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">🚫</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page. Please contact your administrator if you believe this is an error.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return (
      <AuthenticatedLayout>
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-yellow-600 text-2xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Insufficient Permissions</h2>
            <p className="text-gray-600 mb-6">
              You don't have the required permissions to access this feature. Please contact your administrator for access.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Render children with or without layout
  if (noLayout) {
    return children;
  }

  return (
    <AuthenticatedLayout>
      {children}
    </AuthenticatedLayout>
  );
};

// Helper function to check permissions
const hasPermission = (user, permission) => {
  if (!user || !user.permissions) return false;
  return user.permissions.includes('*') || user.permissions.includes(permission);
};

export default ProtectedRoute;
