import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, isAuthenticated as checkAuthStatus, getCurrentUser, setUserSession, logout as apiLogout } from '../service/api';

// User roles - will be populated from API response
export const USER_ROLES = {};

// Auth action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  sessionExpiry: null
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        sessionExpiry: action.payload.sessionExpiry,
        error: null
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState
      };
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

// Auth context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on app load
  useEffect(() => {
    if (checkAuthStatus()) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: currentUser,
            sessionExpiry: new Date(localStorage.getItem('mocksurvey_session_expiry'))
          }
        });
      }
    }
  }, []);

  // Auto logout on session expiry
  useEffect(() => {
    if (state.sessionExpiry) {
      const timeUntilExpiry = new Date(state.sessionExpiry).getTime() - Date.now();
      
      if (timeUntilExpiry > 0) {
        const timeoutId = setTimeout(() => {
          logout();
        }, timeUntilExpiry);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [state.sessionExpiry]);

  // Auth functions
  // Login function - only handles email login (sending OTP)
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      // Email-only login - this should trigger OTP sending
      const response = await authAPI.login({ email: credentials.email });

      const result = {
        success: response.statusCode === 200,
        message: response.message || 'OTP sent successfully',
        error: response.message || 'Failed to send OTP'
      };
      
      if (result.success) {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
        return { success: true, message: result.message };
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: result.error
        });
        return { success: false, error: result.error };
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message || 'Network error. Please try again.'
      });
      return { success: false, error: error.message || 'Network error. Please try again.' };
    }
  };

  // Verify OTP function - separate from login
  const verifyOtp = async (otp) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      // Get rememberMe from localStorage (set before this call)
      const rememberMe = localStorage.getItem('mocksurvey_remember') === 'true';
      const response = await authAPI.verifyOtp(otp, rememberMe);

      // Handle different possible response structures
      // API might return: { statusCode: 200, data: {...}, accessToken: "...", refreshToken: "..." }
      // or: { status: 200, data: {...}, accessToken: "...", refreshToken: "..." }
      // or: { success: true, data: {...}, accessToken: "...", refreshToken: "..." }
      const isSuccess = response.statusCode === 200 || 
                       response.status === 200 || 
                       (response.status && response.statusCode === 200) ||
                       response.success === true ||
                       (response.status && response.status === true);
      
      const userData = response.data || response.user || response;
      const accessToken = response.accessToken || response.token || response.data?.accessToken || response.data?.token;
      const refreshToken = response.refreshToken || response.data?.refreshToken;

      // Extract token from nested data if not found at top level
      const finalToken = accessToken || (response.data && (response.data.accessToken || response.data.token));
      

      if (isSuccess && userData) {
        // Use the backend's rememberMe flag if available, otherwise fallback to local preference
        const backendRememberMe = userData.rememberMe === true;
        const localRememberMe = localStorage.getItem('mocksurvey_remember') === 'true';
        const rememberMe = backendRememberMe || localRememberMe;
        
        const sessionExpiry = new Date(Date.now() + (rememberMe ? 14 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000));
        
        // Store session using API utility
        setUserSession(userData, finalToken, refreshToken, rememberMe);
        
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: userData,
            sessionExpiry
          }
        });
        
        // Verify authentication state was set
        setTimeout(() => {
          const token = localStorage.getItem('mocksurvey_token');
          const user = localStorage.getItem('mocksurvey_user');
        }, 100);
        
        return { success: true, user: userData };
      } else {
        const errorMessage = response.message || response.error || 'OTP verification failed';
       
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: errorMessage
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
     
      const errorMessage = error.message || 'Network error. Please try again.';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  // Verify MFA function - for 2FA authentication
  const verifyMfa = async (code, email) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const response = await authAPI.verify2fa(code, email);

      const isSuccess = response.statusCode === 200 || 
                       response.status === 200 || 
                       (response.status && response.statusCode === 200) ||
                       response.success === true;
      
      const userData = response.data;
      const accessToken = response.accessToken;
      const refreshToken = response.refreshToken;

      if (isSuccess && userData) {
        const rememberMe = userData.rememberMe === true || localStorage.getItem('mocksurvey_remember') === 'true';
        const sessionExpiry = new Date(Date.now() + (rememberMe ? 14 * 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000));
        
        // Store session using API utility
        setUserSession(userData, accessToken, refreshToken, rememberMe);
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: userData,
            sessionExpiry
          }
        });
        
        return { success: true, user: userData };
      } else {
        const errorMessage = response.message || 'MFA verification failed';
       
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: errorMessage
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
    
      const errorMessage = error.message || 'Network error. Please try again.';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    // Clear localStorage explicitly
    localStorage.removeItem('mocksurvey_token');
    localStorage.removeItem('mocksurvey_refresh_token');
    localStorage.removeItem('mocksurvey_session_expiry');
    localStorage.removeItem('mocksurvey_user');
    localStorage.removeItem('mocksurvey_remember');
    
    // Call API logout for any additional cleanup
    apiLogout();
    
    // Dispatch logout action to clear state
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    
    // Redirect to login page
    window.location.href = '/login';
  };

  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const updateUser = (userData) => {
    dispatch({ type: AUTH_ACTIONS.SET_USER, payload: userData });
    // Update localStorage with new user data
    const currentUser = getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('mocksurvey_user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    ...state,
    login,
    verifyOtp,
    verifyMfa,
    logout,
    clearError,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => { 
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  } 
  return context;
};

// Helper functions for role checking
export const hasPermission = (user, permission) => {
  if (!user || !user.roleId || !user.roleId.permissions) return false;
  
  // Admin has all permissions
  if (user.roleId.permissions.includes('*')) return true;
  
  return user.roleId.permissions.includes(permission);
};

export const isAdmin = (user) => {
  return user?.roleId?.name === 'Admin';
};

export const isDemoUser = (user) => {
  return user?.isDemoMode === true;
};
