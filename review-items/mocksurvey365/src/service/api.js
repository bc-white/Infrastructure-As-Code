import baseUrl from '../../baseUrl.js';
import { io } from 'socket.io-client';

// API utility functions
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const makeRequest = async (endpoint, options = {}) => {
  const url = `${baseUrl}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add authorization header if token exists
  const token = localStorage.getItem('mocksurvey_token');
  if (token) {
    defaultOptions.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, defaultOptions); 
    return await handleResponse(response);
  } catch (error) {
    // Enhanced error handling for different error types
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw error;
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to reach the API server');
    } else {
      throw error;
    }
  }
}; 

// User Authentication APIs
export const authAPI = {
  // User signup
  signup: async (userData) => {
    const payload = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      organization: userData.organization,
      phoneNumber: userData.phoneNumber,
      agreementConfirmation: userData.agreementConfirmation || true,
      src: "web",
      roleId: userData.roleId || "689634cedb9e2674c11bab2f"
    };

    return makeRequest('user/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // User login (OTP-based)
  login: async (credentials) => {
    const payload = {
      email: credentials.email,
    };

    return makeRequest('user/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Verify OTP
  verifyOtp: async (otp, rememberMe = false) => {
    const payload = {
      otp: otp,
     rememberMe:  rememberMe,
    };

    return makeRequest('user/verifyOtp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Verify MFA (2FA) code
  verify2fa: async (code, email) => {
    const payload = {
      code: code,
      email: email,
    };

    return makeRequest('user/verify2fa', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Resend OTP
  resendOtp: async (email) => {
    const payload = {
      email: email,
    };

    return makeRequest('user/resendOtp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Forgot password
  forgotPassword: async (email) => {
    const payload = {
      email: email,
    };

    return makeRequest('user/forgetPassword', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Reset password with OTP
  resetPassword: async (otp, newPassword, confirmPassword) => {
    const payload = {
      otp: otp,
      newPassword: newPassword,
      confirmPassword: confirmPassword,
    };

    return makeRequest('user/resetPassword', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Refresh access token
  refreshToken: async (refreshToken) => {
    const payload = {
      refreshToken: refreshToken,
    };

    return makeRequest('user/refreshToken', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Get all available roles
  getRoles: async () => {
    return makeRequest('admin/roles', {
      method: 'GET',
    });
  },

  // SSO authentication
  sso: async () => {
    return makeRequest('user/sso', {
      method: 'GET',
    });
  },

  // Auth0 login - authenticate user with Auth0 token
  auth0Login: async (userData) => {
    const payload = {
      email: userData.email,
      auth0Id: userData.auth0Id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      token: userData.token,
    };

    return makeRequest('user/auth0Login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Set invited status for a user
  setInvited: async (userId, invited) => {
    return makeRequest('user/setInVited', {
      method: 'POST',
      body: JSON.stringify({
        userId: userId,
        invited: invited
      }),
    });
  },
};

// User Management APIs (Admin only)
export const userManagementAPI = {
  // Get all users with pagination and filters
  getUsers: async (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return makeRequest(`usermanagement/users?${queryParams}`);
  },

  // Get user by ID
  getUserById: async (userId) => {
    return makeRequest(`usermanagement/users/${userId}`, {
      method: 'GET',
    });
  }, 

  // Get all roles
  getRoles: async (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return makeRequest(`usermanagement/roles?${queryParams}`);
  },

  // Block/Unblock user
  blockUnblockUser: async (userId, isLocked) => {
    return makeRequest('usermanagement/blockunblock', {
      method: 'PUT',
      body: JSON.stringify({ userId, isLocked }),
    });
  },

  // Invite team member
  inviteTeamMember: async (inviteData) => {
    return makeRequest('usermanagement/invite', {
      method: 'POST',
      body: JSON.stringify(inviteData),
    });
  },

  // Get user workload data
  getUserWorkload: async (userId, params = {}) => {
    const queryParams = new URLSearchParams(params);
    return makeRequest(`usermanagement/workload/${userId}?${queryParams}`);
  },

  // Get user performance data
  getUserPerformance: async (userId, params = {}) => {
    const queryParams = new URLSearchParams(params);
    return makeRequest(`usermanagement/performance/${userId}?${queryParams}`);
  },

  // Get team overview statistics
  getTeamOverview: async (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return makeRequest(`usermanagement/overview?${queryParams}`);
  },

  // Update user role
  updateUserRole: async (userId, roleId) => {
    return makeRequest(`usermanagement/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ roleId }),
    });
  },

  // Delete user
  deleteUser: async (userId) => {
    return makeRequest(`usermanagement/users/${userId}`, {
      method: 'DELETE',
    });
  },

  // Get user's assigned surveys
  getUserSurveys: async (userId, params = {}) => {
    const queryParams = new URLSearchParams(params);
    return makeRequest(`usermanagement/users/${userId}/surveys?${queryParams}`);
  },
};

// User Profile Management APIs
export const profileAPI = {
  // Update user profile
  updateProfile: async (profileData) => {
    const payload = {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      organization: profileData.organization,
      phoneNumber: profileData.phoneNumber,
    };

    return makeRequest('user/updateProfile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // Change password
  changePassword: async (passwordData) => {
    const payload = {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
      confirmPassword: passwordData.confirmPassword,
    };

    return makeRequest('user/changePassword', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // Update user preferences
  updatePreferences: async (preferences) => {
    const payload = {
      emailNotification: preferences.emailNotification,
      surveyResponsesNotification: preferences.surveyResponsesNotification,
      weeklyReportNotification: preferences.weeklyReportNotification,
    };

    return makeRequest('user/updatePreferences', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // Get user profile
  getProfile: async () => {
    return makeRequest('admin/me', {
      method: 'GET',
    });
  },

  // Setup MFA (2FA)
  setupMfa: async (isMfaActive) => {
    const payload = {
      isMfaActive: isMfaActive,
    };

    return makeRequest('user/2faSetup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Reset MFA (2FA)
  resetMfa: async (isMfaActive) => {
    const payload = {
      isMfaActive: isMfaActive,
    };

    return makeRequest('user/reset2fa', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// User APIs
export const userAPI = {
  // Upload file
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return makeRequest('user/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type, let browser set it with boundary for FormData
      },
    });
  },
};

// Admin APIs
export const adminAPI = {
  // Get admin profile
  getAdminProfile: async () => {
    return makeRequest('admin/me', {
      method: 'GET',
    });
  },
};

// Notification APIs
export const notificationAPI = {
  /**
   * Update FCM token - Sends FCM token to backend for push notification registration
   * @param {string} fcmToken - Firebase Cloud Messaging token
   * @returns {Promise} Backend response
   * 
   * Endpoint: POST /api/v1/user/fcmtoken
   * Payload: { fcmtoken: string }
   * 
   * Backend should:
   * - Accept POST request with fcmtoken in body
   * - Authenticate using Bearer token from Authorization header
   * - Store/update FCM token associated with authenticated user
   * - Return success response (200 statusCode or success: true)
   */
  updateFcmToken: async (fcmToken) => {
    const payload = {
      fcmtoken: fcmToken,
    };

    return makeRequest('user/fcmtoken', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};

// Facility Management APIs
export const facilityAPI = {
  // Get all facilities with optional filters (admin only)
  getAllFacilities: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters as query parameters
    if (filters.name) queryParams.append('name', filters.name);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.state) queryParams.append('state', filters.state);
    if (filters.city) queryParams.append('city', filters.city);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `config/facility?${queryString}` : 'config/facility';
    
    return makeRequest(endpoint, {
      method: 'GET',
    });
  },

  // Get user's facilities
  // getUserFacilities: async () => {
  //   return makeRequest('facility/user', {
  //     method: 'GET',
  //   });
  // },

  // Get specific facility by ID
  getFacility: async (facilityId) => {
    return makeRequest(`config/viewFacility/${facilityId}`, {
      method: 'GET',
    });
  },

  // Add new facility
  addFacility: async (facilityData) => {
    return makeRequest('config/addFacility', {
      method: 'POST',
      body: JSON.stringify(facilityData),
    });
  },

  // Update existing facility
  updateFacility: async (facilityId, facilityData) => {
    return makeRequest('config/updateFacility', {
      method: 'PUT',
      body: JSON.stringify(facilityData),
    });
  },

  // Delete facility
  deleteFacility: async (facilityId) => {
    return makeRequest(`config/deleteFacility/${facilityId}`, {
      method: 'DELETE',
    });
  },

  // Get facility users
  getFacilityUsers: async (facilityId) => {
    return makeRequest(`facility/${facilityId}/users`, {
      method: 'GET',
    });
  },

  // Add user to facility
  addUserToFacility: async (facilityId, userData) => {
    return makeRequest(`facility/${facilityId}/users`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Update user in facility
  updateUserInFacility: async (facilityId, userId, userData) => {
    return makeRequest(`facility/${facilityId}/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // Remove user from facility
  removeUserFromFacility: async (facilityId, userId) => {
    return makeRequest(`facility/${facilityId}/users/${userId}`, {
      method: 'DELETE',
    });
  },

  // Get facility statistics
  getFacilityStats: async (facilityId) => {
    return makeRequest(`facility/${facilityId}/stats`, {
      method: 'GET',
    });
  },

  // Search facilities
  searchFacilities: async (searchTerm, filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add search term and filters as query parameters
   // if (searchTerm) queryParams.append('name', searchTerm);
    if (filters.name) queryParams.append('name', filters.name);
    if (filters.state) queryParams.append('state', filters.state);
    if (filters.city) queryParams.append('city', filters.city);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.location) queryParams.append('location', filters.location);

    return makeRequest(`config/facility?${queryParams.toString()}`, {
      method: 'GET',
    });
  },

  // Get facility types
  getFacilityTypes: async () => {
    return makeRequest('config/allFacilityTypes', {
      method: 'GET',
    });
  },

  // Get facility statuses
  getFacilityStatuses: async () => {
    return makeRequest('facility/statuses', {
      method: 'GET',
    });
  },

  // Get surveys under a specific facility
  getFacilitySurveys: async (facilityId, filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters as query parameters
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    const queryString = queryParams.toString();
    const endpoint = `surveybuilder/viewSurveysUnderFacility/${facilityId}${queryString ? `?${queryString}` : ''}`;
    
    return makeRequest(endpoint, {
      method: 'GET',
    });
  },

  // Search nursing homes database
  searchNursingHomes: async (name) => {
    const queryParams = new URLSearchParams();
    if (name) queryParams.append('name', name);
    
    const endpoint = `config/allNursingHomes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return makeRequest(endpoint, {
      method: 'GET',
    });
  },

  // Search nursing homes providers database
  searchNursingHomesProviders: async (name, address, city, state) => {
    const queryParams = new URLSearchParams();
    if (name) queryParams.append('name', name);
    if (address) queryParams.append('address', address);
    if (city) queryParams.append('city', city);
    if (state) queryParams.append('state', state);
    
    const endpoint = `config/allNursingHomesProviders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return makeRequest(endpoint, {
      method: 'GET',
    });
  },

  // Get multi-facility metrics and analytics
  getMultiFacilityMetrics: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add optional filters as query parameters
    if (filters.facilityName) queryParams.append('facilityName', filters.facilityName);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.state) queryParams.append('state', filters.state);
    if (filters.city) queryParams.append('city', filters.city);
    if (filters.status) queryParams.append('status', filters.status);
    
    const queryString = queryParams.toString();
    const endpoint = `config/multiFacilityMetric${queryString ? `?${queryString}` : ''}`;
    
    return makeRequest(endpoint, {
      method: 'GET',
    });
  },

  // Get dashboard overview metrics
  getDashboardMatrix: async (filters = {}) => {
    const queryParams = new URLSearchParams();

    if (filters.facilityName) queryParams.append('facilityName', filters.facilityName);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.state) queryParams.append('state', filters.state);
    if (filters.city) queryParams.append('city', filters.city);
    if (filters.status) queryParams.append('status', filters.status);

    const queryString = queryParams.toString();
    const endpoint = `surveyMain/dashboardMatrix${queryString ? `?${queryString}` : ''}`;

    return makeRequest(endpoint, {
      method: 'GET',
    });
  },
};

// Health Check APIs with enhanced features
export const healthAPI = {
  // Cache for health status (5 minute TTL)
  _statusCache: null,
  _statusCacheTime: null,
  _STATUS_CACHE_TTL: 5 * 60 * 1000, // 5 minutes in milliseconds

  // Get API status with caching
  getStatus: async (forceRefresh = false) => {
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh && healthAPI._statusCache && healthAPI._statusCacheTime) {
      const now = Date.now();
      if (now - healthAPI._statusCacheTime < healthAPI._STATUS_CACHE_TTL) {
        return healthAPI._statusCache;
      }
    }

    try {
      const status = await makeRequest('health/status', {
        method: 'GET',
        // Add timeout for health checks
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
      
      // Cache the successful response
      healthAPI._statusCache = status;
      healthAPI._statusCacheTime = Date.now();
      
      return status;
    } catch (error) {
      // Clear cache on error
      healthAPI._statusCache = null;
      healthAPI._statusCacheTime = null;
      
      if (error.name === 'TimeoutError') {
        throw new Error('Health check timeout: API status request took too long');
      }
      throw new Error(`Health check failed: ${error.message}`);
    }
  },

  // Ping API with timeout
  ping: async () => {
    try {
      return await makeRequest('health/ping', {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout for ping
      });
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new Error('Ping timeout: API ping request took too long');
      }
      throw new Error(`Ping failed: ${error.message}`);
    }
  },

  // Get user address information with timeout
  getUserAddress: async () => {
    try {
      return await makeRequest('health/address', {
        method: 'GET',
        signal: AbortSignal.timeout(8000), // 8 second timeout for address lookup
      });
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new Error('Address lookup timeout: Request took too long');
      }
      throw new Error(`Address lookup failed: ${error.message}`);
    }
  },

  // Clear health status cache
  clearStatusCache: () => {
    healthAPI._statusCache = null;
    healthAPI._statusCacheTime = null;
  },

  // Get cache status
  getCacheStatus: () => {
    if (!healthAPI._statusCache || !healthAPI._statusCacheTime) {
      return { cached: false, age: null };
    }
    
    const now = Date.now();
    const age = now - healthAPI._statusCacheTime;
    const isExpired = age >= healthAPI._STATUS_CACHE_TTL;
    
    return {
      cached: !isExpired,
      age: age,
      expiresIn: Math.max(0, healthAPI._STATUS_CACHE_TTL - age),
      ttl: healthAPI._STATUS_CACHE_TTL
    };
  },

  // Comprehensive health check (all endpoints)
  comprehensiveCheck: async () => {
    const results = {
      timestamp: new Date().toISOString(),
      overall: 'unknown',
      checks: {}
    };

    try {
      // Check API status
      try {
        results.checks.status = await healthAPI.getStatus();
        results.checks.statusCheck = 'success';
      } catch (error) {
        results.checks.statusCheck = 'failed';
        results.checks.statusError = error.message;
      }

      // Check ping
      try {
        results.checks.ping = await healthAPI.ping();
        results.checks.pingCheck = 'success';
      } catch (error) {
        results.checks.pingCheck = 'failed';
        results.checks.pingError = error.message;
      }

      // Check address lookup
      try {
        results.checks.address = await healthAPI.getUserAddress();
        results.checks.addressCheck = 'success';
      } catch (error) {
        results.checks.addressCheck = 'failed';
        results.checks.addressError = error.message;
      }

      // Determine overall status
      const failedChecks = Object.values(results.checks).filter(check => 
        typeof check === 'string' && check === 'failed'
      ).length;

      if (failedChecks === 0) {
        results.overall = 'healthy';
      } else if (failedChecks === 1) {
        results.overall = 'degraded';
      } else {
        results.overall = 'unhealthy';
      }

      return results;
    } catch (error) {
      results.overall = 'error';
      results.error = error.message;
      return results;
    }
  }
};

// Utility function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('mocksurvey_token');
  const expiry = localStorage.getItem('mocksurvey_session_expiry');
  
  if (!token || !expiry) {
    return false;
  }
  
  // Check if token has expired
  const expiryDate = new Date(expiry);
  if (expiryDate <= new Date()) {
    // Clear expired session
    localStorage.removeItem('mocksurvey_token');
    localStorage.removeItem('mocksurvey_session_expiry');
    localStorage.removeItem('mocksurvey_user');
    return false;
  }
  
  return true;
};

// Utility function to refresh access token if expired
export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('mocksurvey_refresh_token');
  if (!refreshToken) {
    return false;
  }

  try {
    const response = await authAPI.refreshToken(refreshToken);
    if (response.statusCode === 200 && response.accessToken) {
      // Update the stored access token
      localStorage.setItem('mocksurvey_token', response.accessToken);
      
      // Update session expiry
      const rememberMe = localStorage.getItem('mocksurvey_remember') === 'true';
      const expiryHours = rememberMe ? 24 * 14 : 8;
      const expiryDate = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
      localStorage.setItem('mocksurvey_session_expiry', expiryDate.toISOString());
      
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

// Utility function to logout user
export const logout = () => {
  localStorage.removeItem('mocksurvey_token');
  localStorage.removeItem('mocksurvey_refresh_token');
  localStorage.removeItem('mocksurvey_session_expiry');
  localStorage.removeItem('mocksurvey_user');
  localStorage.removeItem('mocksurvey_remember');
  localStorage.clear();
  
  // Redirect to login page
  window.location.href = '/login';
};

// Utility function to get current user
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('mocksurvey_user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      return null;
    }
  }
  return null;
};

// Utility function to get refresh token
export const getRefreshToken = () => {
  return localStorage.getItem('mocksurvey_refresh_token');
};

// F-Tag Management APIs
export const fTagAPI = {
  // Get all F-Tags with pagination and filters
  getAllFTags: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add optional filters
    if (params.ftag) queryParams.append('ftag', params.ftag);
    if (params.category) queryParams.append('category', params.category);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const endpoint = `config/allFtagSetup${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return makeRequest(endpoint, {
      method: 'GET',
    });
  },

  // Get specific F-Tag by ID
  getFTagById: async (ftagId) => {
    return makeRequest(`config/viewFtagSetup/${ftagId}`, {
      method: 'GET',
    });
  },

  // Search F-Tags
  searchFTags: async (searchTerm, filters = {}) => {
    const queryParams = new URLSearchParams();
    if (searchTerm) queryParams.append('search', searchTerm);
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    return makeRequest(`config/searchFtags?${queryParams.toString()}`, {
      method: 'GET',
    });
  },

  // Add new F-Tag
  addFTag: async (ftagData) => {
    return makeRequest('config/addFtagSetup', {
      method: 'POST',
      body: JSON.stringify(ftagData),
    });
  },

  // Update existing F-Tag
  updateFTag: async (ftagId, ftagData) => {
    return makeRequest(`config/updateFtagSetup/${ftagId}`, {
      method: 'PUT',
      body: JSON.stringify(ftagData),
    });
  },

  // Delete F-Tag
  deleteFTag: async (ftagId) => {
    return makeRequest(`config/deleteFtagSetup/${ftagId}`, {
      method: 'DELETE',
    });
  },
};

// Health Assistant APIs
export const healthAssistantAPI = {
  // Ask Mocky365 conversational agent
  askMocky: async (payload) => {
    try {
      const response = await makeRequest('health-assistant/askMocky365', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const normalizedData =
        response?.data ??
        response?.answer ??
        response?.result ??
        response;

      return {
        success: response?.status ?? response?.success ?? true,
        statusCode: response?.statusCode ?? 200,
        message: response?.message ?? 'Ask Mocky365 response received successfully',
        data: normalizedData,
      };
    } catch (error) {
      throw new Error(`Failed to contact Ask Mocky365: ${error.message}`);
    }
  },

  // Get F-Tag information for Initial Assessments probes
  getFTagInfo: async (question, answer) => {
    try {
      const response = await makeRequest('health-assistant/ftag', {
        method: 'POST',
        body: JSON.stringify({
          question: question,
          answer: answer
        }),
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'F-Tag information retrieved successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to fetch F-Tag information: ${error.message}`);
    }
  }, 

  // Get residents for a specific survey - This endpoint returns residents data
  getResidents: async (surveyId) => {
    try {
      const response = await makeRequest(`surveyMain/generateInitialPool/${surveyId}`, {
        method: 'GET',
      });
      
      // Ensure the response has the expected structure
      if (response && typeof response === 'object') {
        return {
          success: response.status || response.success || true,
          statusCode: response.statusCode || 200,
          message: response.message || 'Residents retrieved successfully',
          data: response.data || []
        };
      }
      
      return response;
    } catch (error) {
      throw new Error(`Failed to fetch residents: ${error.message}`);
    }
  },

  // Update resident data
  updateResident: async (surveyId, residentId, residentData) => {
    try {
      const response = await makeRequest(`health-assistant/residents/${surveyId}/${residentId}`, {
        method: 'PUT',
        body: JSON.stringify(residentData),
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Resident updated successfully',
        data: response.data || residentData
      };
    } catch (error) {
      throw new Error(`Failed to update resident: ${error.message}`);
    }
  },

  // Add new resident to survey
  addResident: async (surveyId, residentData) => {
    try {
      const response = await makeRequest(`health-assistant/residents/${surveyId}`, {
        method: 'POST',
        body: JSON.stringify(residentData),
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 201,
        message: response.message || 'Resident added successfully',
        data: response.data || residentData
      };
    } catch (error) {
      throw new Error(`Failed to add resident: ${error.message}`);
    }
  },

  // Delete resident from survey
  deleteResident: async (surveyId, residentId) => {
    try {
      const response = await makeRequest(`health-assistant/residents/${surveyId}/${residentId}`, {
        method: 'DELETE',
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Resident deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete resident: ${error.message}`);
    }
  },

  // Save or Update Investigation Residents
  saveInvestigationResidents: async (payload) => {
    try {
      const response = await makeRequest('surveyMain/InvestigationResidents', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Investigation residents saved successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to save investigation residents: ${error.message}`);
    }
  },

  // Save Investigation for Team Member
  saveInvestigationTeamMember: async (payload) => {
    try {
      const response = await makeRequest('surveyMain/addInvestigationTeamMember', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Check if the API response indicates failure (status: false)
      const isSuccess = response.status !== false && response.success !== false;

      return {
        success: isSuccess,
        statusCode: response.statusCode || (isSuccess ? 200 : 400),
        message: response.message || (isSuccess ? 'Team member investigation saved successfully' : 'Failed to save investigation'),
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to save team member investigation: ${error.message}`);
    }
  },

  // Get survey wizard data
  getSurveyWizard: async (surveyId) => {
    try {
      const response = await makeRequest(`surveybuilder/viewSurveyWizard/${surveyId}`, {
        method: 'GET',
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Survey wizard data retrieved successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to fetch survey wizard: ${error.message}`);
    }
  },


  // Get resident interview data
  getResidentInterview: async (surveyId, residentId) => {
    try {
      const response = await makeRequest(`health-assistant/residents/${surveyId}/${residentId}/interview`, {
        method: 'GET',
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Interview data retrieved successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to fetch interview data: ${error.message}`);
    }
  },

  // Get final sample selection from AI analysis
  getFinalSampleSelection: async (surveyId) => {
    try {
      const response = await makeRequest(`surveyMain/generateFinalSample/${surveyId}`, {
        method: 'GET',
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Final sample selection retrieved successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to get final sample selection: ${error.message}`);
    }
  },

  // Save final sample selection (POST - create/update)
  saveFinalSampleSelection: async (sampleData) => {
    try {
      const response = await makeRequest('surveyMain/finalSample', {
        method: 'POST',
        body: JSON.stringify(sampleData),
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Final sample selection saved successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to save final sample selection: ${error.message}`);
    }
  },

  // Update final sample selection (PUT - update)
  updateFinalSampleSelection: async (surveyId, sampleData) => {
    try {
      const response = await makeRequest(`surveybuilder/finalSampleSelection/${surveyId}`, {
        method: 'PUT',
        body: JSON.stringify(sampleData),
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Final sample selection updated successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to update final sample selection: ${error.message}`);
    }
  },

  // Get final sample investigation data
  getFinalSampleInvestigation: async (surveyId) => {
    try {
      const response = await makeRequest(`surveyMain/generateInvestigation/${surveyId}`, {
        method: 'GET',
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Final sample investigation retrieved successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to get final sample investigation: ${error.message}`);
    }
  },

  // Get saved investigations (view mode)
  getSavedInvestigations: async (surveyId) => {
    try {
      const response = await makeRequest(`surveyMain/viewInvestigations/${surveyId}`, {
        method: 'GET',
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Saved investigations retrieved successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to get saved investigations: ${error.message}`);
    }
  },

  // Generate citation report for a survey
  generateCitationReport: async (surveyId) => {
    try {
      const response = await makeRequest(`surveyMain/generateCitationReport/${surveyId}`, {
        method: 'GET',
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Citation report generated successfully',
        data: response.data || {},
        disclaimer: response.disclaimer || null
      };
    } catch (error) {
      throw new Error(`Failed to generate citation report: ${error.message}`);
    }
  },

  // Get citation report for a survey
  getCitationReport: async (surveyId) => {
    try {
      const response = await makeRequest(`health-assistant/citationReport/${surveyId}`, {
        method: 'GET',
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Citation report retrieved successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to get citation report: ${error.message}`);
    }
  },

  // Save citation report
  saveCitationReport: async (citationData) => {
    try {
      const response = await makeRequest(`surveybuilder/citationreport`, {
        method: 'POST',
        body: JSON.stringify(citationData),
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Citation report saved successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to save citation report: ${error.message}`);
    }
  },

  // Generate Plan of Correction
  generatePlanOfCorrection: async (pocData) => {
    try {
      const response = await makeRequest('surveyMain/generatePlanOfCorrection', {
        method: 'POST',
        body: JSON.stringify(pocData),
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Plan of Correction generated successfully',
        data: {
          ...response.data,
          disclaimer: response.disclaimer || null,
        },
        disclaimer: response.disclaimer || null,
      };
    } catch (error) {
      throw new Error(`Failed to generate Plan of Correction: ${error.message}`);
    }
  },

  // Get probes/findings for a survey
  getProbes: async (surveyId) => {
    try {
      const response = await makeRequest(`health-assistant/probes/${surveyId}`, {
        method: 'GET',
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Probes retrieved successfully',
        data: response.data || []
      };
    } catch (error) {
      throw new Error(`Failed to fetch probes: ${error.message}`);
    }
  },
}; 

// Resource Center APIs
export const resourceAPI = {
  // Get all long-term care regulations
  getAllLongTermRegulations: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add optional filters
    if (filters.name) queryParams.append('name', filters.name);
    if (filters.state) queryParams.append('state', filters.state);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    const endpoint = `config/allLongTermRegulations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return makeRequest(endpoint, {
      method: 'GET',
    });
  },

  // Get specific regulation by ID
  getRegulationById: async (regulationId) => { 
    return makeRequest(`config/longTermRegulation/${regulationId}`, {
      method: 'GET',
    });
  },

  // Search regulations
  searchRegulations: async (searchTerm, filters = {}) => {
    const queryParams = new URLSearchParams();
    if (searchTerm) queryParams.append('search', searchTerm);
    if (filters.state) queryParams.append('state', filters.state);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    return makeRequest(`config/searchRegulations?${queryParams.toString()}`, {
      method: 'GET',
    });
  },

  // Add new long-term regulation
  addLongTermRegulation: async (regulationData) => {
    return makeRequest('config/addLongTermRegulations', {
      method: 'POST',
      body: JSON.stringify(regulationData),
    });
  },

  // Get critical elements pathway files
  getCriticalElements: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add optional filters
    if (filters.name) queryParams.append('name', filters.name);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    const endpoint = `config/criticalElements${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return makeRequest(endpoint, {
      method: 'GET',
    });
  },

  // Add new critical element
  addCriticalElement: async (elementData) => {
    return makeRequest('config/addCriticalElement', {
      method: 'POST',
      body: JSON.stringify(elementData),
    });
  },

  // Update existing critical element
  updateCriticalElement: async (elementData) => {
    return makeRequest('config/updateCriticalElement', {
      method: 'POST',
      body: JSON.stringify(elementData),
    });
  },

  // Get all mandatory tasks
  getAllMandatoryTasks: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add optional filters
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    const endpoint = `config/allMandatoryTask${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return makeRequest(endpoint, {
      method: 'GET',
    });
  },

  // View facility mandatory task by survey ID
  viewFacilityMandatoryTask: async (surveyId) => {
    return makeRequest(`surveyMain/viewFacilityMandatoryTask/${surveyId}`, {
      method: 'GET',
    });
  },

  // View team member mandatory facility task by survey ID
  viewTeamMemberMandatoryFaciltyTask: async (surveyId) => {
    return makeRequest(`surveyMain/viewTeamMemberMandatoryFaciltyTask/${surveyId}`, {
      method: 'GET',
    });
  },

  // Save facility tasks
  saveFacilityTasks: async (payload) => {
    return makeRequest('surveyMain/facilityTasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Save mandatory and update facility tasks
  saveMandatoryAndUpdate: async (payload) => {
    return makeRequest('surveyMain/saveMandatoryAndUpdate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Save team member mandatory facility task
  saveTeamMemberMandatoryTask: async (payload) => {
    return makeRequest('surveyMain/saveTeamMemberMandatoryTask', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Get facility task critical elements pathway files
  getFacilityTaskCEPathways: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add optional filters
    if (filters.name) queryParams.append('name', filters.name);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    const endpoint = `config/facilityTaskCEPathways${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return makeRequest(endpoint, {
      method: 'GET',
    });
  },

  // View/Download resource
  viewResource: async (resourceId) => {
    const url = `${baseUrl}config/viewResources/${resourceId}`;
    
    // Add authorization header if token exists
    const token = localStorage.getItem('mocksurvey_token');
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parse the JSON response
      const responseData = await response.json();
      
      // Check if the response is successful and contains the required data
      if (!responseData.status || !responseData.data || !responseData.data.pdflink) {
        throw new Error(responseData.message || 'Invalid resource data received');
      }

      const { data } = responseData;
      const { pdflink, name } = data;

      // Download the file from the S3 link
      const fileResponse = await fetch(pdflink);
      if (!fileResponse.ok) {
        throw new Error(`Failed to download file from server`);
      }

      // Get the blob data for file download
      const blob = await fileResponse.blob();
      
      // Use the name from the API response or extract filename from URL
      let filename = name || 'download';
      
      // If no extension in the name, try to extract from the URL
      if (!filename.includes('.')) {
        const urlPath = new URL(pdflink).pathname;
        const urlFilename = urlPath.split('/').pop();
        if (urlFilename && urlFilename.includes('.')) {
          filename = urlFilename;
        }
      }

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      return { success: true, filename, resourceData: data };
    } catch (error) {
      throw error;
    }
  },
};

// Subscription APIs
export const subscriptionAPI = {
  // Get all subscription plans
  getAllSubscriptions: async () => {
    return makeRequest('subscription/allSubscription', {
      method: 'GET',
    });
  },

  // Get single subscription plan by ID
  getSubscriptionById: async (planId) => {
    return makeRequest(`subscription/viewSubscription/${planId}`, {
      method: 'GET',
    });
  },

  // Create subscription
  createSubscription: async (subscriptionData) => {
    return makeRequest('subscription/create', {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    });
  },

  // Update subscription
  updateSubscription: async (subscriptionId, updates) => {
    return makeRequest(`subscription/updateSubscription/${subscriptionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Cancel subscription
  cancelSubscription: async (subscriptionId) => {
    return makeRequest(`subscription/cancelSubscription/${subscriptionId}`, {
      method: 'POST',
    });
  },

  // Get user's subscription
  getUserSubscription: async () => {
    return makeRequest('subscription/user', {
      method: 'GET',
    });
  },
};

// Resident Management APIs
export const residentAPI = {
  // Add new resident
  addResident: async (residentData) => {
    return makeRequest('resident/add', {
      method: 'POST',
      body: JSON.stringify(residentData),
    });
  },

  // Get all residents for a facility
  getFacilityResidents: async (facilityId, filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters as query parameters
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.search) queryParams.append('search', filters.search);
    
    const queryString = queryParams.toString();
    const endpoint = `resident/facility/${facilityId}${queryString ? `?${queryString}` : ''}`;
    
    return makeRequest(endpoint, {
      method: 'GET',
    });
  },

  // Get specific resident by ID
  getResident: async (residentId) => {
    return makeRequest(`resident/${residentId}`, {
      method: 'GET',
    });
  },

  // Update resident
  updateResident: async (residentData) => {
    return makeRequest('resident/update', {
      method: 'PUT',
      body: JSON.stringify(residentData),
    });
  },

  // Delete resident
  deleteResident: async (residentId) => {
    return makeRequest(`resident/${residentId}`, {
      method: 'DELETE',
    });
  },
};

// Survey Management APIs
export const surveyAPI = {
  // Create a new survey
  createSurvey: async (surveyData) => {
    const payload = {
      surveyCreationDate: surveyData.surveyCreationDate,
      surveyCategory: surveyData.surveyCategory,
      facilityInfo: {
        facilityName: surveyData.facilityName,
        ccn: surveyData.ccn,
        address: surveyData.address,
        city: surveyData.city,
        state: surveyData.state,
        zipCode: surveyData.zipCode,
        phone: surveyData.phone,
        email: surveyData.email,
      },
      teamMembers: surveyData.teamMembers || [],
      teamCoordinator: surveyData.teamCoordinator,
      preSurveyRequirements: surveyData.preSurveyRequirements || {},
      status: 'setup', // Initial status
      createdAt: new Date().toISOString(),
    };

    return makeRequest('survey/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Add survey wizard (new endpoint)
  addSurveyWizard: async (surveyData) => {
    return makeRequest('surveyMain/surveyFirstPage', {
      method: 'POST',
      body: JSON.stringify(surveyData),
    });
  },

  // Update survey wizard (new endpoint)
  updateSurveyWizard: async (surveyData) => {
    return makeRequest('surveyMain/updateSurveyFirstPage', {
      method: 'PUT',
      body: JSON.stringify(surveyData),
    });
  },

  // Remove team member from survey
  removeTeamMemberFromSurvey: async (data) => {
    return makeRequest('surveyMain/removeTeamMemberFromSurvey', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Remove team member from initial pool
  removeTeamMemberInitialPool: async (data) => {
    return makeRequest('surveyMain/removeTeamMemberInitialPool', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Check survey generation status (initial pool, final sample, investigation)
  surveyCheck: async (surveyId) => {
    return makeRequest(`surveyMain/surveyCheck/${surveyId}`, {
      method: 'GET',
    });
  },

  // Get survey first page data
  getSurveyFirstPage: async (surveyId) => {
    return makeRequest(`surveyMain/viewSurveyFirstPage/${surveyId}`, {
      method: 'GET',
    });
  },

  // Get offsite pre-survey data
  getOffsitePreSurvey: async (surveyId) => {
    return makeRequest(`surveyMain/viewOffsitePreSurvey/${surveyId}`, {
      method: 'GET',
    });
  }, 

  // Add risk-based process setup
  addRiskBasedSetup: async (setupData) => {
    return makeRequest('surveybuilder/riskBasedSetup', {
      method: 'POST',
      body: JSON.stringify(setupData),
    });
  },

  // Submit initial pool data for team member
  submitInitialPoolTeamMember: async (payload) => {
    return makeRequest('surveyMain/addInitialPoolTeamMember', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Get initial pool data
  getInitialPool: async (surveyId) => {
    return makeRequest(`surveyMain/viewInitialPool/${surveyId}`, {
      method: 'GET',
    });
  },

  // Get final sample data
  getFinalSample: async (surveyId) => {
    return makeRequest(`surveyMain/viewFinalSample/${surveyId}`, {
      method: 'GET',
    });
  },

  // Check if resident is already assigned to a team member
  checkResidentAssignment: async (payload) => {
    return makeRequest('surveyMain/teamMemberInitialPoolResidents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Get risk-based process setup
  getRiskBasedSetup: async (surveyId) => {
    return makeRequest(`surveybuilder/riskBasedSetup/${surveyId}`, {
      method: 'GET',
    });
  },

  // Get team member's assigned residents
  getTeamMemberResidents: async (surveyId, teamMemberUserId) => {
    return makeRequest('surveyMain/getTeamMemberResidents', {
      method: 'POST',
      body: JSON.stringify({
        surveyId,
        teamMemberUserId,
      }),
    });
  },

  // Get team members in a survey
  viewTeamMembersInSurvey: async (surveyId) => {
    return makeRequest(`surveyMain/viewTeamMembersInSurvey/${surveyId}`, {
      method: 'GET',
    });
  },

  // Check team member survey access type (team lead vs team member)
  getTeamMemberSurveyAccess: async (surveyId, teamMemberUserId) => {
    return makeRequest('surveyMain/teamMemberSurveyAccess', {
      method: 'POST',
      body: JSON.stringify({
        surveyId,
        teamMemberUserId,
      }),
    });
  },

  // Get facility-based risk setup (for non-resident-based surveys)
  getFacilityRiskBasedSetup: async (surveyId) => {
    return makeRequest(`surveybuilder/facilityRiskBasedSetup/${surveyId}`, {
      method: 'GET',
    });
  },

  // Get user/resident-based risk setup (for resident-based surveys)
  getUserRiskBasedSetup: async (surveyId) => {
    return makeRequest(`surveybuilder/userRiskBasedSetup/${surveyId}`, {
      method: 'GET',
    });
  },

  // Get all risk-based surveys for a facility
  getAllRiskBasedSetups: async (facilityId, startDate = '', endDate = '') => {
    const params = new URLSearchParams();
    if (facilityId) params.append('facility', facilityId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    return makeRequest(`surveybuilder/userRiskBasedSetup${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  // Get risk-based surveys for invited users
  getInvitedUsersSurveyRiskBasedList: async (facilityId, startDate = '', endDate = '') => {
    const params = new URLSearchParams();
    if (facilityId) params.append('facility', facilityId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const queryString = params.toString();
    return makeRequest(`surveybuilder/invitedUsersSurveyRiskBasedList${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
    });
  },

  // Update risk-based process setup
  updateRiskBasedSetup: async (surveyId, setupData) => {
    return makeRequest(`surveybuilder/riskBasedSetup`, {
      method: 'PUT',
      body: JSON.stringify({ ...setupData, id: surveyId }),
    });
  },

  // Delete risk-based survey
  deleteRiskBasedSurvey: async (surveyId) => {
    return makeRequest(`surveybuilder/removeRiskBasedSurvey/${surveyId}`, {
      method: 'DELETE',
    });
  },

  // Get survey categories
  getSurveyCategories: async () => {
    return makeRequest('surveybuilder/surveyCategories', {
      method: 'GET',
    });
  },

  // Get special types for residents
  getSpecialTypes: async () => {
    return makeRequest('surveybuilder/specialtypes', {
      method: 'GET',
    });
  },

  // Update existing survey
  updateSurvey: async (surveyId, updateData) => {
    return makeRequest(`survey/${surveyId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  // Get all surveys for current user
  getUserSurveys: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);

    return makeRequest(`survey/user?${queryParams.toString()}`, {
      method: 'GET',
    });
  },

  // Get user survey list with filters (survey builder endpoint)
  getUserSurveyList: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters as query parameters
    if (filters.facility) queryParams.append('facility', filters.facility);
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);

    const queryString = queryParams.toString();
    const endpoint = `surveyMain/mySurvey${queryString ? `?${queryString}` : ''}`;
    
    return makeRequest(endpoint, {
      method: 'GET',
    });
  }, 

  // Get specific survey by ID
  getSurvey: async (surveyId) => {
    return makeRequest(`survey/${surveyId}`, {
      method: 'GET',
    });
  },

  // Get survey wizard data by ID
  getSurveyWizard: async (surveyId) => {
    return makeRequest(`surveybuilder/viewSurveyWizard/${surveyId}`, {
      method: 'GET',
    });
  },

  // Delete survey
  deleteSurvey: async (surveyId) => {
    return makeRequest(`survey/${surveyId}`, {
      method: 'DELETE',
    });
  },

  // Delete survey wizard
  deleteSurveyWizard: async (surveyId) => {
    return makeRequest(`surveyMain/removeSurvey/${surveyId}`, {
      method: 'DELETE',
    });
  },

  // Submit survey for next step (for team leads)
  submitSurveyStep: async (surveyId, stepData) => {
    const payload = {
      // surveyId: surveyId,
      currentStep: stepData.currentStep,
      stepData: stepData.data,
      completedAt: new Date().toISOString(),
    };

    return makeRequest(`surveybuilder/${surveyId}/step`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Submit offsite pre-survey data
  submitOffsitePreSurvey: async (payload) => {
    return makeRequest('surveyMain/offsitePreSurvey', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Submit initial pool data
  submitInitialPool: async (payload) => {
    return makeRequest('surveyMain/initialPool', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Submit facility entrance data
  submitFacilityEntrance: async (payload) => {
    return makeRequest('surveyMain/facilityEntrance', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Get facility entrance data
  getFacilityEntrance: async (surveyId) => {
    return makeRequest(`surveyMain/viewFacilityEntrance/${surveyId}`, {
      method: 'GET',
    });
  },

  // Remove resident from facility entrance
  removeResidentFacilityEntrance: async (payload) => {
    return makeRequest('surveyMain/removeResidentFacilityEntrance', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // View offsite pre-survey data
  viewOffsitePreSurvey: async (surveyId) => {
    return makeRequest(`surveyMain/viewOffsitePreSurvey/${surveyId}`, {
      method: 'GET',
    });
  },

  // Submit team member work (separate endpoint to prevent data conflicts)
  submitTeamMemberWork: async (surveyId, teamMemberData) => {
    const payload = {
      currentStep: teamMemberData.currentStep,
      surveyId: teamMemberData.surveyId,
      userId: teamMemberData.userId,
      teamMemberPayload: teamMemberData.teamMemberPayload,
      completedAt: new Date().toISOString(),
    };

    return makeRequest(`surveybuilder/${surveyId}/team-member-work`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Get survey statistics
  getSurveyStats: async () => {
    return makeRequest('survey/stats', {
      method: 'GET',
    });
  },

  // Request email for pre-survey requirements
  requestEmail: async (emailData) => {
    const payload = {
      to: emailData.to,
      subject: emailData.subject,
      message: emailData.message,
      fileUrl: emailData.fileUrl || "", // Ensure fileUrl is sent to prevent "undefined" in backend
    };

    return makeRequest('surveybuilder/requestEmail', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Invite team members
  inviteTeamMembers: async (memberData) => {
    const payload = {
      name: memberData.name,
      email: memberData.email,
      role: memberData.role,
      surveyId: memberData.surveyId,
      assignedFacilityTasks: memberData.assignedFacilityTasks || [],
    };

    return makeRequest('surveybuilder/inviteTeamMembers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Update team members (for assigning residents)
  updateTeamMembers: async (memberData) => {
    const payload = {
      id: memberData.id,
      name: memberData.name,
      email: memberData.email,
      role: memberData.role,
      surveyId: memberData.surveyId,
      assignedFacilityTasks: memberData.assignedFacilityTasks || [],
      assignedResidents: memberData.assignedResidents || [],
    };

    return makeRequest('surveybuilder/inviteTeamMembers', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // Get users invited under a survey
  getUsersInvitedUnderSurvey: async (surveyId) => {
    return makeRequest(`surveybuilder/usersInvitedUnderSurvey/${surveyId}`, {
      method: 'GET',
    });
  },

  // Get invited user's survey list
  getInvitedUserSurveyList: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters as query parameters
    if (filters.facility) queryParams.append('facility', filters.facility);
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);

    const queryString = queryParams.toString();
    const endpoint = `surveyMain/teamMemberSuvey${queryString ? `?${queryString}` : ''}`;
    
    return makeRequest(endpoint, {
      method: 'GET',
    });
  },

  // Submit facility tasks
  submitFacilityTasks: async (stepData) => {
    return makeRequest('survey/facilityTasks', {
      method: 'POST',
      body: JSON.stringify(stepData),
    });
  },

    // Update facility tasks
    updateFacilityTasks: async (id, stepData) => {
      return makeRequest(`survey/facilityTasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(stepData),
      });
    },

    // Submit team meeting
    submitTeamMeeting: async (payload) => {
      return makeRequest('surveyMain/teamMeeting', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    // Submit or update team member meeting (for invited team members)
    submitTeamMemberMeeting: async (payload) => {
      return makeRequest('surveyMain/teamMemberMeeting', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    // View team meeting
    viewTeamMeeting: async (surveyId) => {
      return makeRequest(`surveyMain/viewTeamMeeting/${surveyId}`, {
        method: 'GET',
      });
    },

    // Submit survey closure
    submitSurveyClosure: async (payload) => {
      return makeRequest('surveyMain/closure', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    // View survey closure
    viewSurveyClosure: async (surveyId) => {
      return makeRequest(`surveyMain/viewClosure/${surveyId}`, {
        method: 'GET',
      });
    },

    // Submit final team meeting
    submitFinalTeamMeeting: async (stepData) => {
      return makeRequest('survey/finalTeamMeeting', {
        method: 'POST',
        body: JSON.stringify(stepData),
      });
    },

    // Update final team meeting
    updateFinalTeamMeeting: async (id, stepData) => {
      return makeRequest(`survey/finalTeamMeeting/${id}`, {
        method: 'PUT',
        body: JSON.stringify(stepData),
      });
    },

    // Submit exit conference
    submitExitConference: async (payload) => {
      return makeRequest('surveyMain/existConference', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    // View exit conference
    viewExitConference: async (surveyId) => {
      return makeRequest(`surveyMain/viewExistConference/${surveyId}`, {
        method: 'GET',
      });
    },

  // Submit facility entrance
  submitFacilityEntrance: async (stepData) => {
    return makeRequest('surveyMain/facilityEntrance', {
      method: 'POST',
      body: JSON.stringify(stepData),
    });
  },

  // Update facility entrance
  updateFacilityEntrance: async (id, stepData) => {
    return makeRequest(`surveyMain/facilityEntrance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(stepData),
    });
  },

  // Submit offsite preparation
  submitOffsitePreparation: async (stepData) => {
    return makeRequest('survey/offsitePreparation', {
      method: 'POST',
      body: JSON.stringify(stepData),
    });
  }, 

  // Update offsite preparation
  updateOffsitePreparation: async (id, stepData) => {
    return makeRequest(`surveybuilder/${id}/step`, {
      method: 'PUT',
      body: JSON.stringify(stepData),
    });
  },

  // Generic step submission
  submitStep: async (id, stepData) => {
    return makeRequest(`surveybuilder/${id}/step`, {
      method: 'POST',
      body: JSON.stringify(stepData),
    });
  },


  // Create investigations
  createInvestigations: async (investigationData) => {
    try {
      const response = await makeRequest('surveybuilder/investigations', {
        method: 'POST',
        body: JSON.stringify(investigationData),
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Investigations created successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to create investigations: ${error.message}`);
    }
  },

  // Update investigations
  updateInvestigations: async (investigationId, investigationData) => {
    try {
      const response = await makeRequest(`surveybuilder/investigations/${investigationId}`, {
        method: 'PUT',
        body: JSON.stringify(investigationData),
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Investigations updated successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to update investigations: ${error.message}`);
    }
  },

  // Create team member investigations (separate endpoint for team members)
  createTeamMemberInvestigations: async (teamMemberInvestigationData) => {
    try {
      const response = await makeRequest('surveybuilder/teamMemberInvestigations', {
        method: 'POST',
        body: JSON.stringify(teamMemberInvestigationData),
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Team member investigations created successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to create team member investigations: ${error.message}`);
    }
  },

  // Update team member investigations (separate endpoint for team members)
  updateTeamMemberInvestigations: async (teamMemberId, teamMemberInvestigationData) => {
    try {
      const response = await makeRequest(`surveybuilder/teamMemberInvestigations/${teamMemberId}`, {
        method: 'PUT',
        body: JSON.stringify(teamMemberInvestigationData),
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Team member investigations updated successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to update team member investigations: ${error.message}`);
    }
  },

  // Submit life safety survey
  submitLifeSafetySurvey: async (lifeSafetyData) => {
    return makeRequest('surveybuilder/lifeSafetySurvey', {
      method: 'POST',
      body: JSON.stringify(lifeSafetyData),
    });
  },

  // Get life safety survey data
  getLifeSafetySurvey: async (surveyId) => {
    return makeRequest(`surveybuilder/lifeSafetySurvey/${surveyId}`, {
      method: 'GET',
    });
  },

  // Update life safety survey
  updateLifeSafetySurvey: async (id, lifeSafetyData) => {
    return makeRequest(`surveybuilder/lifeSafetySurvey/${id}`, {
      method: 'PUT',
      body: JSON.stringify(lifeSafetyData),
    });
  },

  // Submit facility initiated survey
  submitFacilityInitiatedSurvey: async (facilityInitiatedData) => {
    return makeRequest('surveybuilder/facilityInitiatedSurvey', {
      method: 'POST',
      body: JSON.stringify(facilityInitiatedData),
    });
  },

  // Get facility initiated survey data
  getFacilityInitiatedSurvey: async (surveyId) => {
    return makeRequest(`surveybuilder/facilityInitiatedSurvey/${surveyId}`, {
      method: 'GET',
    });
  },

  // Update facility initiated survey
  updateFacilityInitiatedSurvey: async (surveyId, facilityInitiatedData) => {
    return makeRequest(`surveybuilder/facilityInitiatedSurvey/${surveyId}`, {
      method: 'PUT',
      body: JSON.stringify(facilityInitiatedData),
    });
  },

  // K-Tag Assessment APIs
  // Update K-Tag assessment for a specific section
  updateKTagAssessment: async (surveyId, sectionId, kTagId, assessmentData) => {
    return makeRequest(`surveybuilder/lifeSafetySurvey/${surveyId}/kTag/${sectionId}/${kTagId}`, {
      method: 'PUT',
      body: JSON.stringify(assessmentData),
    });
  },

  // Get K-Tag assessment for a specific section
  getKTagAssessment: async (surveyId, sectionId, kTagId) => {
    return makeRequest(`surveybuilder/lifeSafetySurvey/${surveyId}/kTag/${sectionId}/${kTagId}`, {
      method: 'GET',
    });
  },

  // Add custom K-Tag to a section
  addCustomKTag: async (surveyId, sectionId, kTagData) => {
    return makeRequest(`surveybuilder/lifeSafetySurvey/${surveyId}/kTag/${sectionId}/custom`, {
      method: 'POST',
      body: JSON.stringify(kTagData),
    });
  },

  // Remove K-Tag from a section
  removeKTag: async (surveyId, sectionId, kTagId) => {
    return makeRequest(`surveybuilder/lifeSafetySurvey/${surveyId}/kTag/${sectionId}/${kTagId}`, {
      method: 'DELETE',
    });
  },

  // Get all K-Tag assessments for a section
  getSectionKTagAssessments: async (surveyId, sectionId) => {
    return makeRequest(`surveybuilder/lifeSafetySurvey/${surveyId}/kTag/${sectionId}`, {
      method: 'GET',
    });
  },

  // Bulk update K-Tag assessments for a section
  updateSectionKTagAssessments: async (surveyId, sectionId, assessmentsData) => {
    return makeRequest(`surveybuilder/lifeSafetySurvey/${surveyId}/kTag/${sectionId}/bulk`, {
      method: 'PUT',
      body: JSON.stringify(assessmentsData),
    });
  },

  // Utility functions for K-Tag management
  // Validate scope and severity values
  validateScopeSeverity: (value) => {
    const validValues = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    return validValues.includes(value);
  },

  // Validate compliance status
  validateComplianceStatus: (value) => {
    const validValues = ['Compliant', 'Non-Compliant', 'Not Applicable', 'Not Observed'];
    return validValues.includes(value);
  },

  // Get scope and severity description
  getScopeSeverityDescription: (value) => { 
    const descriptions = {
      'A': 'No actual harm with potential for minimal harm (Isolated)',
      'B': 'No actual harm with potential for minimal harm (Pattern)',
      'C': 'No actual harm with potential for minimal harm (Widespread)',
      'D': 'No actual harm with potential for more than minimal harm (Isolated)',
      'E': 'No actual harm with potential for more than minimal harm (Pattern)',
      'F': 'No actual harm with potential for more than minimal harm (Widespread)',
      'G': 'Actual harm that is not Immediate Jeopardy (Isolated)',
      'H': 'Actual harm that is not Immediate Jeopardy (Pattern)',
      'I': 'Actual harm that is not Immediate Jeopardy (Widespread)',
      'J': 'Immediate Jeopardy to resident health or safety (Isolated)',
      'K': 'Immediate Jeopardy to resident health or safety (Pattern)',
      'L': 'Immediate Jeopardy to resident health or safety (Widespread)'
    };
    return descriptions[value] || '';
  },

  // Get scope and severity color class
  getScopeSeverityColor: (value) => {
    const colors = {
      'A': 'bg-green-100 text-green-800 border-green-200',
      'B': 'bg-green-100 text-green-800 border-green-200',
      'C': 'bg-green-100 text-green-800 border-green-200',
      'D': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'E': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'F': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'G': 'bg-orange-100 text-orange-800 border-orange-200',
      'H': 'bg-orange-100 text-orange-800 border-orange-200',
      'I': 'bg-orange-100 text-orange-800 border-orange-200',
      'J': 'bg-red-100 text-red-800 border-red-200',
      'K': 'bg-red-100 text-red-800 border-red-200',
      'L': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[value] || 'bg-gray-100 text-gray-800 border-gray-200';
  },

  // Generate K-Tag ID for custom tags
  generateCustomKTagId: (sectionId, existingTags = []) => {
    const baseId = `K${Date.now().toString().slice(-3)}`;
    let counter = 1;
    let kTagId = baseId;
    
    while (existingTags.includes(kTagId)) {
      kTagId = `${baseId}_${counter}`;
      counter++;
    }
    
    return kTagId;
  },

  // Format K-Tag assessment data for API
  formatKTagAssessmentData: (kTagData) => {
    return {
      status: kTagData.status || '',
      remarks: kTagData.remarks || '',
      scopeSeverity: kTagData.scopeSeverity || '',
      isCustom: kTagData.isCustom || false,
      title: kTagData.title || '',
      description: kTagData.description || '',
      fTag: kTagData.fTag || '',
      updatedAt: new Date().toISOString()
    };
  },

  // Get all my Plan of Corrections
  getMyPlanOfCorrections: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add pagination parameters
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      
      const queryString = queryParams.toString();
      const endpoint = `surveyMain/myPlanOfCorrections${queryString ? `?${queryString}` : ''}`;
      
      const response = await makeRequest(endpoint, {
        method: 'GET',
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Plan of Corrections retrieved successfully',
        data: response.data || []
      };
    } catch (error) {
      throw new Error(`Failed to retrieve Plan of Corrections: ${error.message}`);
    }
  },

  // Delete Plan of Correction
  deletePlanOfCorrection: async (pocId) => {
    try {
      const response = await makeRequest(`surveyMain/removePlanOfCorrections/${pocId}`, {
        method: 'DELETE',
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Plan of Correction deleted successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to delete Plan of Correction: ${error.message}`);
    }
  },

  // Submit Plan of Correction
  submitPlanOfCorrection: async (pocData) => {
    try {
 
      const response = await makeRequest('surveyMain/planOfCorrection', {
        method: 'POST',
        body: JSON.stringify(pocData),
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Plan of Correction submitted successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to submit Plan of Correction: ${error.message}`);
    }
  },

  // View saved Plan of Corrections by surveyId
  viewPlanOfCorrections: async (surveyId) => {
    try {
      const response = await makeRequest(`surveyMain/viewPlanOfCorrections/${surveyId}`, {
        method: 'GET',
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Plan of Corrections retrieved successfully',
        data: response.data || null
      };
    } catch (error) {
      // Return null data if not found (404) - this is expected for new surveys
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return {
          success: false,
          statusCode: 404,
          message: 'No Plan of Corrections found for this survey',
          data: null
        };
      }
      throw new Error(`Failed to retrieve Plan of Corrections: ${error.message}`);
    }
  },

  // View single Plan of Correction by POC ID
  viewMyPlanOfCorrection: async (pocId) => {
    try {
      const response = await makeRequest(`surveyMain/viewmyplanofcorrections/${pocId}`, {
        method: 'GET',
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Plan of Correction retrieved successfully',
        data: response.data || null
      };
    } catch (error) {
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return {
          success: false,
          statusCode: 404,
          message: 'Plan of Correction not found',
          data: null
        };
      }
      throw new Error(`Failed to retrieve Plan of Correction: ${error.message}`);
    }
  },

  // View saved Citation Report by surveyId
  viewCitationReport: async (surveyId) => {
    try {
      const response = await makeRequest(`surveyMain/viewCitationReport/${surveyId}`, {
        method: 'GET',
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Citation Report retrieved successfully',
        data: response.data || null
      };
    } catch (error) {
      // Return null data if not found (404) - this is expected for new surveys
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        return {
          success: false,
          statusCode: 404,
          message: 'No Citation Report found for this survey',
          data: null
        };
      }
      throw new Error(`Failed to retrieve Citation Report: ${error.message}`);
    }
  },

  // Submit/Update Citation Report
  submitCitationReport: async (citationData) => {
    try {
      const response = await makeRequest('surveyMain/citationReport', {
        method: 'POST',
        body: JSON.stringify(citationData),
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Citation Report saved successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to save Citation Report: ${error.message}`);
    }
  },

  // Update Plan of Correction
  updatePlanOfCorrection: async (surveyId, pocData) => {
    try {
      const response = await makeRequest(`surveybuilder/planofcorrection/${surveyId}`, {
        method: 'PUT',
        body: JSON.stringify(pocData),
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Plan of Correction updated successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to update Plan of Correction: ${error.message}`);
    }
  },

  // Submit Resources & Help
  submitResourcesHelp: async (resourcesData) => {
    try {
      const response = await makeRequest('surveybuilder/resourceshelp', {
        method: 'POST',
        body: JSON.stringify(resourcesData),
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Resources and help data submitted successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to submit resources help: ${error.message}`);
    }
  },

  // Update Resources & Help
  updateResourcesHelp: async (surveyId, resourcesData) => {
    try {
      const response = await makeRequest(`surveybuilder/resourceshelp/${surveyId}`, {
        method: 'PUT',
        body: JSON.stringify(resourcesData),
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Resources and help data updated successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to update resources help: ${error.message}`);
    }
  },

  // Submit Survey Closure
  submitSurveyClosure: async (closureData) => {
    try {
      const response = await makeRequest('surveyMain/closure', {
        method: 'POST',
        body: JSON.stringify(closureData),
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Survey closure submitted successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to submit survey closure: ${error.message}`);
    }
  },

  // Get Survey Closure
  getSurveyClosure: async (surveyId) => {
    try {
      const response = await makeRequest(`surveyMain/viewClosure/${surveyId}`, {
        method: 'GET',
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Survey closure retrieved successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to get survey closure: ${error.message}`);
    }
  },

  // Update Survey Closure
  updateSurveyClosure: async (surveyId, closureData) => {
    try {
      const response = await makeRequest(`surveybuilder/surveyclosure/${surveyId}`, {
        method: 'PUT',
        body: JSON.stringify(closureData),
      });
      
      return {
        success: response.status || response.success || true,
        statusCode: response.statusCode || 200,
        message: response.message || 'Survey closure updated successfully',
        data: response.data || {}
      };
    } catch (error) {
      throw new Error(`Failed to update survey closure: ${error.message}`);
    }
  },

  // Get reports data with filters and pagination
  getReports: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters as query parameters
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.surveyCategory) queryParams.append('surveyCategory', filters.surveyCategory);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    const queryString = queryParams.toString();
    const endpoint = `surveyMain/reports${queryString ? `?${queryString}` : ''}`;
    
    return makeRequest(endpoint, {
      method: 'GET',
    });
  },

  // Get survey notes by survey ID
  getSurveyNotes: async (surveyId) => {
    return makeRequest(`surveyMain/surveyNotes/${surveyId}`, {
      method: 'GET',
    });
  },

  // Get all survey notes list
  getSurveyNotesList: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);
    
    const queryString = queryParams.toString();
    const endpoint = `surveyMain/surveyNotes${queryString ? `?${queryString}` : ''}`;
    
    return makeRequest(endpoint, {
      method: 'GET',
    });
  },

  // Convert JSON notes data to Word document HTML format
  formatNotesAsWordDocument: (notesData, surveyId) => {
    const data = notesData?.data || notesData || {};
    
    // Helper function to escape HTML
    const escapeHtml = (text) => {
      if (text === null || text === undefined) return '';
      const str = String(text);
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return str.replace(/[&<>"']/g, m => map[m]);
    };

    // Helper function to format key names
    const formatKeyName = (key) => {
      return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
    };

    // Helper function to format arrays
    const formatArray = (arr, title) => {
      if (!Array.isArray(arr) || arr.length === 0) return '';
      let html = title ? `<h4 style="margin-top: 15px; margin-bottom: 10px;">${escapeHtml(title)}</h4>` : '';
      arr.forEach((item, index) => {
        if (typeof item === 'string') {
          html += `<p style="margin: 5px 0; padding-left: 20px;">${index + 1}. ${escapeHtml(item)}</p>`;
        } else if (typeof item === 'object' && item !== null) {
          html += `<div style="margin: 10px 0; padding: 10px; border-left: 3px solid #075b7d; background-color: #f9f9f9;">`;
          Object.keys(item).forEach(key => {
            if (item[key] !== null && item[key] !== undefined && item[key] !== '') {
              let value;
              if (Array.isArray(item[key])) {
                value = item[key].map(v => escapeHtml(String(v))).join(', ');
              } else if (typeof item[key] === 'boolean') {
                value = item[key] ? 'Yes' : 'No';
              } else {
                value = escapeHtml(String(item[key]));
              }
              html += `<p style="margin: 3px 0;"><strong>${escapeHtml(formatKeyName(key))}:</strong> ${value}</p>`;
            }
          });
          html += `</div>`;
        }
      });
      return html;
    };

    // Helper function to format nested objects (improved for Word)
    const formatObject = (obj, title, level = 0) => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return '';
      
      let html = '';
      if (title) {
        if (level === 0) {
          html = `<h3 style="margin-top: 20px; margin-bottom: 10px;">${escapeHtml(title)}</h3>`;
        } else {
          html = `<h4 style="margin-top: 15px; margin-bottom: 8px;">${escapeHtml(title)}</h4>`;
        }
      }
      
      const indent = level * 20;
      html += `<div style="margin-left: ${indent}px;">`;
      
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (value === null || value === undefined || value === '') return;
        
        if (Array.isArray(value)) {
          html += formatArray(value, formatKeyName(key));
        } else if (typeof value === 'object') {
          html += formatObject(value, formatKeyName(key), level + 1);
        } else {
          const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : escapeHtml(String(value));
          html += `<p style="margin: 5px 0;"><strong>${escapeHtml(formatKeyName(key))}:</strong> ${displayValue}</p>`;
        }
      });
      
      html += '</div>';
      return html;
    };

    // Format facility tasks specifically
    const formatFacilityTasks = (tasks) => {
      if (!tasks || typeof tasks !== 'object') return '';
      
      let html = '<h3 style="margin-top: 20px; margin-bottom: 10px;">Facility Tasks</h3>';
      
      Object.keys(tasks).forEach(taskCategory => {
        const categoryData = tasks[taskCategory];
        if (!categoryData || typeof categoryData !== 'object') return;
        
        html += `<div style="margin: 15px 0; padding: 15px; border: 1px solid #ddd; background-color: #fafafa;">`;
        html += `<h4 style="margin-top: 0; margin-bottom: 10px; color: #075b7d;">${escapeHtml(formatKeyName(taskCategory))}</h4>`;
        
        Object.keys(categoryData).forEach(taskKey => {
          const taskItem = categoryData[taskKey];
          if (!taskItem || typeof taskItem !== 'object') return;
          
          html += `<div style="margin: 10px 0; padding: 10px; border-left: 3px solid #075b7d;">`;
          Object.keys(taskItem).forEach(key => {
            if (taskItem[key] !== null && taskItem[key] !== undefined && taskItem[key] !== '') {
              let value;
              if (Array.isArray(taskItem[key])) {
                value = taskItem[key].map(v => escapeHtml(String(v))).join(', ');
              } else if (typeof taskItem[key] === 'boolean') {
                value = taskItem[key] ? 'Yes' : 'No';
              } else {
                value = escapeHtml(String(taskItem[key]));
              }
              html += `<p style="margin: 3px 0;"><strong>${escapeHtml(formatKeyName(key))}:</strong> ${value}</p>`;
            }
          });
          html += `</div>`;
        });
        
        html += `</div>`;
      });
      
      return html;
    };

    // Build the Word document HTML
    const htmlContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<meta name="ProgId" content="Word.Document">
<meta name="Generator" content="Microsoft Word">
<meta name="Originator" content="Microsoft Word">
<title>Survey Notes Report</title>
<!--[if gte mso 9]><xml>
 <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
 </w:WordDocument>
</xml><![endif]-->
<style>
body {
  font-family: "Calibri", "Arial", sans-serif;
  font-size: 11pt;
  line-height: 1.6;
  margin: 1in;
  color: #333333;
}
h1 {
  color: #075b7d;
  font-size: 24pt;
  margin-bottom: 12pt;
  margin-top: 0;
  border-bottom: 3pt solid #075b7d;
  padding-bottom: 6pt;
  page-break-after: avoid;
}
h2 {
  color: #075b7d;
  font-size: 18pt;
  margin-top: 24pt;
  margin-bottom: 12pt;
  border-bottom: 1.5pt solid #e0e0e0;
  padding-bottom: 4pt;
  page-break-after: avoid;
}
h3 {
  color: #064d63;
  font-size: 14pt;
  margin-top: 18pt;
  margin-bottom: 8pt;
  page-break-after: avoid;
}
h4 {
  color: #064d63;
  font-size: 12pt;
  margin-top: 12pt;
  margin-bottom: 6pt;
  page-break-after: avoid;
}
p {
  margin: 6pt 0;
  text-align: left;
}
strong {
  color: #075b7d;
  font-weight: bold;
}
.section {
  margin-bottom: 20pt;
  page-break-inside: avoid;
}
.footer {
  margin-top: 40pt;
  padding-top: 12pt;
  border-top: 1.5pt solid #e0e0e0;
  font-size: 9pt;
  color: #666666;
  text-align: center;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 12pt 0;
  page-break-inside: auto;
}
table th, table td {
  border: 1pt solid #cccccc;
  padding: 6pt;
  text-align: left;
  vertical-align: top;
}
table th {
  background-color: #075b7d;
  color: #ffffff;
  font-weight: bold;
}
table tr {
  page-break-inside: avoid;
}
table tr:nth-child(even) {
  background-color: #f9f9f9;
}
</style>
</head>
<body>
<h1>Survey Notes Report</h1>

${data.facilityEntrance ? `
<div class="section">
<h2>Facility Entrance</h2>
<p>${escapeHtml(data.facilityEntrance)}</p>
</div>
` : ''}

${data.kitchenQuickVisitNote || data.kitchenQuickVisitComment ? `
<div class="section">
<h2>Kitchen Quick Visit</h2>
${data.kitchenQuickVisitNote ? `<p><strong>Note:</strong> ${escapeHtml(data.kitchenQuickVisitNote)}</p>` : ''}
${data.kitchenQuickVisitComment ? `<p><strong>Comment:</strong> ${escapeHtml(data.kitchenQuickVisitComment)}</p>` : ''}
</div>
` : ''}

${data.facilityEnvironmentalTourNote || data.facilityEnvironmentalTourComment ? `
<div class="section">
<h2>Facility Environmental Tour</h2>
${data.facilityEnvironmentalTourNote ? `<p><strong>Note:</strong> ${escapeHtml(data.facilityEnvironmentalTourNote)}</p>` : ''}
${data.facilityEnvironmentalTourComment ? `<p><strong>Comment:</strong> ${escapeHtml(data.facilityEnvironmentalTourComment)}</p>` : ''}
</div>
` : ''}

${data.initialPoolProcess && Array.isArray(data.initialPoolProcess) && data.initialPoolProcess.length > 0 ? `
<div class="section">
<h2>Initial Pool Process</h2>
<p><strong>Total Residents:</strong> ${data.initialPoolProcess.length}</p>
<table>
<thead>
<tr>
<th>Name</th>
<th>Room</th>
<th>Admission Date</th>
<th>Status</th>
<th>Diagnosis</th>
<th>Selection Reason</th>
<th>Notes</th>
</tr>
</thead>
<tbody>
${data.initialPoolProcess.map(resident => `
<tr>
<td>${escapeHtml(resident.name || 'N/A')}</td>
<td>${escapeHtml(resident.room || 'N/A')}</td>
<td>${escapeHtml(resident.admissionDate || 'N/A')}</td>
<td>${escapeHtml(resident.status || 'N/A')}</td>
<td>${escapeHtml(resident.diagnosis || 'N/A')}</td>
<td>${escapeHtml(resident.selectionReason || 'N/A')}</td>
<td>${escapeHtml(resident.notes || 'N/A')}</td>
</tr>
`).join('')}
</tbody>
</table>
</div>
` : ''}

${data.facilityTasks ? `
<div class="section">
${formatFacilityTasks(data.facilityTasks)}
</div>
` : ''}

${data.facilityTasksTeamPayload && Array.isArray(data.facilityTasksTeamPayload) && data.facilityTasksTeamPayload.length > 0 ? `
<div class="section">
<h2>Team Member Tasks</h2>
${data.facilityTasksTeamPayload.map((member, index) => `
<div style="margin-bottom: 18pt; padding: 12pt; border: 1pt solid #cccccc; background-color: #fafafa;">
<h3>Team Member ${index + 1}: ${escapeHtml(member.teamMemberName || 'N/A')}</h3>
<p><strong>Email:</strong> ${escapeHtml(member.teamMemberEmail || 'N/A')}</p>
<p><strong>Status:</strong> ${escapeHtml(member.taskStatus || 'N/A')}</p>
${member.assignedTasks && Array.isArray(member.assignedTasks) ? `
<p><strong>Assigned Tasks:</strong> ${escapeHtml(member.assignedTasks.join(', '))}</p>
` : ''}
${member.workSummary ? `
<p><strong>Work Summary:</strong> ${member.workSummary.completedTasks || 0} of ${member.workSummary.totalAssigned || 0} tasks completed (${member.workSummary.completionPercentage || 0}%)</p>
` : ''}
${member.taskProbeResponses ? formatObject(member.taskProbeResponses, 'Task Probe Responses') : ''}
</div>
`).join('')}
</div>
` : ''}

${data.lifeSafetySurvey ? `
<div class="section">
<h2>Life Safety Survey</h2>
${formatObject(data.lifeSafetySurvey, 'Life Safety Survey Data')}
</div>
` : ''}

${data.investigationSurvey ? `
<div class="section">
<h2>Investigation Survey</h2>
${formatObject(data.investigationSurvey, 'Investigation Data')}
</div>
` : ''}

${data.finalSampleSurvey ? `
<div class="section">
<h2>Final Sample Survey</h2>
${formatObject(data.finalSampleSurvey, 'Final Sample Data')}
</div>
` : ''}

<div class="footer">
<p>Generated on ${new Date().toLocaleString()}</p>
<p>Survey Notes Report</p>
</div>
</body>
</html>`;
    
    return htmlContent;
  },

  // Download survey notes
  downloadSurveyNotes: async (surveyId) => {
    const url = `${baseUrl}surveybuilder/surveyNotes/${surveyId}`;
    
    // Add authorization header if token exists
    const token = localStorage.getItem('mocksurvey_token');
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response is JSON or a file
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        // Handle JSON response (notes data)
        const responseData = await response.json();
        
        // If the response contains a file URL, download that
        if (responseData?.data?.fileUrl || responseData?.data?.pdflink || responseData?.data?.wordlink || responseData?.fileUrl || responseData?.wordlink) {
          const fileUrl = responseData.data?.fileUrl || responseData.data?.pdflink || responseData.data?.wordlink || responseData.fileUrl || responseData.wordlink;
          const fileResponse = await fetch(fileUrl);
          if (!fileResponse.ok) {
            throw new Error(`Failed to download file from server`);
          }
          const blob = await fileResponse.blob();
          const contentType = fileResponse.headers.get('content-type');
          
          // Determine filename and extension based on content type or response data
          let filename = responseData.data?.name || responseData.name || `survey-notes-${surveyId}`;
          
          // Add appropriate extension if not present
          if (!filename.includes('.')) {
            if (contentType && (contentType.includes('wordprocessingml') || contentType.includes('msword'))) {
              filename = `${filename}.docx`;
            } else if (contentType && contentType.includes('pdf')) {
              filename = `${filename}.pdf`;
            } else {
              filename = `${filename}.docx`; // Default to .docx for Word documents
            }
          }
          
          // Create download link
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);
          
          return { success: true, filename, data: responseData };
        } else {
          // Convert JSON notes data to Word document format
          const htmlContent = surveyAPI.formatNotesAsWordDocument(responseData, surveyId);
          const blob = new Blob([htmlContent], { type: 'application/msword' });
          const filename = `survey-notes-${surveyId}-${new Date().toISOString().split('T')[0]}.doc`;
          
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);
          
          return { success: true, filename, data: responseData };
        }
      } else {
        // Handle direct file download (PDF, Word, etc.)
        const blob = await response.blob();
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `survey-notes-${surveyId}`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }
        
        // Add appropriate extension based on content type
        if (contentType && contentType.includes('pdf')) {
          filename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
        } else if (contentType && (contentType.includes('wordprocessingml') || contentType.includes('msword'))) {
          // Handle Word documents (.docx or .doc)
          filename = filename.endsWith('.docx') || filename.endsWith('.doc') 
            ? filename 
            : `${filename}.docx`;
        } else if (contentType && contentType.includes('text')) {
          filename = filename.endsWith('.txt') ? filename : `${filename}.txt`;
        }
        
        // Create download link
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        
        return { success: true, filename };
      }
    } catch (error) {
      throw new Error(`Failed to download survey notes: ${error.message}`);
    }
  },
};

// Utility function to set user session
export const setUserSession = (userData, token, refreshToken = null, rememberMe = false) => {
  localStorage.setItem('mocksurvey_user', JSON.stringify(userData));
  localStorage.setItem('mocksurvey_token', token);
  
  // Store refresh token if provided
  if (refreshToken) {
    localStorage.setItem('mocksurvey_refresh_token', refreshToken);
  }
  
  // Set session expiry (8 hours for regular, 14 days for remember me)
  const expiryHours = rememberMe ? 24 * 14 : 8;
  const expiryDate = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
  localStorage.setItem('mocksurvey_session_expiry', expiryDate.toISOString());
  
  if (rememberMe) {
    localStorage.setItem('mocksurvey_remember', 'true');
  }
};

// WebSocket Service using socket.io-client
class SurveySocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.surveyId = null;
    this.userId = null;
    this.isConnecting = false; // Track connection state to prevent race conditions
  }

  // Get Socket.IO URL from baseUrl
  getSocketUrl() {
    // Convert HTTP/HTTPS URL to Socket.IO URL
    // baseUrl format: https://apistaging.mocksurvey365.com/api/v1/
    const httpUrl = baseUrl.replace(/\/api\/v1\/?$/, ''); // Remove /api/v1/ from end
    return httpUrl;
  }

  // Get userId from localStorage
  getUserId() {
    const userStr = localStorage.getItem('mocksurvey_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user._id || user.id || null;
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  // Get surveyId from localStorage
  getSurveyId() {
    return localStorage.getItem('currentSurveyId');
  }

  // Connect to Socket.IO server
  connect(surveyId = null, userId = null) {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      return;
    }

    // Check if already connected with same surveyId and userId
    if (this.socket?.connected) {
      const currentSurveyId = surveyId || this.getSurveyId();
      const currentUserId = userId || this.getUserId();
      
      // If already connected with same IDs, don't reconnect
      if (this.surveyId === currentSurveyId && this.userId === currentUserId) {
      return;
      }
    }

    // Set connecting flag
    this.isConnecting = true;

    // If socket exists, clean it up properly
    if (this.socket) {
      // Remove all listeners before disconnecting to prevent errors
      this.socket.removeAllListeners();
      
      // Only disconnect if socket is not currently connecting
      if (this.socket.connected) {
        this.socket.disconnect();
      } else if (this.socket.disconnected) {
        // Already disconnected, just clean up
      } else {
        // Socket is in connecting state, wait a bit then disconnect
        setTimeout(() => {
          if (this.socket && !this.socket.connected) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
          }
        }, 100);
      }
      this.socket = null;
    }

    const socketUrl = this.getSocketUrl();
    const token = localStorage.getItem('mocksurvey_token');
    
    // Get surveyId and userId
    this.surveyId = surveyId || this.getSurveyId();
    this.userId = userId || this.getUserId();

    // Socket.IO connection options
    const options = {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      query: {
        surveyId: this.surveyId,
        userId: this.userId
      }
    };

    // Add auth token if available
    if (token) {
      options.auth = {
        token: token
      };
      options.query.token = token;
    }

    try {
      // Connect using socket.io-client
      this.socket = io(socketUrl, options);

      // Attach any pending listeners that were registered before socket was created
      if (this.listeners.size > 0) {
        this.listeners.forEach((callbacks, event) => {
          callbacks.forEach(callback => {
            this.socket.on(event, callback);
          });
        });
      }

      // Handle connection
      this.socket.on('connect', () => {
        // Reset connecting flag
        this.isConnecting = false;

        // Trigger connect event for listeners
        this.triggerListeners('connect', {
          surveyId: this.surveyId,
          userId: this.userId
        });

        // Emit join event with surveyId and userId
        this.socket.emit('join_view_survey_wizard', {
          surveyId: this.surveyId,
          userId: this.userId
        });

        // Emit join_invite_team_members event to join the room
        this.socket.emit('initial_pool_team_member', {
          surveyId: this.surveyId,
          userId: this.userId
        });
      });

      // Handle view_survey_wizard messages
      this.socket.on('view_survey_wizard', (messages) => {
        this.triggerListeners('view_survey_wizard', messages);
      });

      // Handle invite_team_members messages
      this.socket.on('invite_team_members', (message) => {
        this.triggerListeners('invite_team_members', message);
      });

      // Handle disconnection
      this.socket.on('disconnect', (reason) => {
        this.triggerListeners('disconnect', reason);
      });

      // Handle connection errors
      this.socket.on('connect_error', (error) => {
        // Reset connecting flag on error
        this.isConnecting = false;
        this.triggerListeners('error', error);
      });

      // Handle errors
      this.socket.on('error', (error) => {
        this.triggerListeners('error', error);
      });

    } catch (error) {
      // Reset connecting flag on error
      this.isConnecting = false;
      this.triggerListeners('error', error);
    }
  }

  // Emit event to server
  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  // Listen for events
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      // Store listener to attach when socket connects
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
  }

  // Remove event listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    } else {
      // Remove from stored listeners
      if (this.listeners.has(event)) {
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    }
  }

  // Trigger listeners for an event (for compatibility)
  triggerListeners(event, data) {
    // This is mainly for backward compatibility
    // Socket.io handles events directly
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          // Error in socket listener
        }
      });
    }
  }

  // Disconnect from server
  disconnect() {
    // Reset connecting flag
    this.isConnecting = false;
    
    if (this.socket) {
      // Remove all listeners first to prevent errors
      this.socket.removeAllListeners();
      // Only disconnect if not already disconnected
      if (!this.socket.disconnected) {
      this.socket.disconnect();
      }
      this.socket = null;
    }
    this.listeners.clear();
  }

  // Check if connected
  isConnected() {
    return this.socket?.connected || false;
  }

  // Get socket instance (for direct access if needed)
  getSocket() {
    return this.socket;
  }
}

// Create singleton instance
export const surveySocketService = new SurveySocketService();

export default {
  auth: authAPI,
  profile: profileAPI,
  user: userAPI,
  admin: adminAPI, 
  notification: notificationAPI,
  facility: facilityAPI,
  health: healthAPI,
  resource: resourceAPI,
  subscription: subscriptionAPI,
  resident: residentAPI,
  survey: surveyAPI,
  fTag: fTagAPI,
  healthAssistant: healthAssistantAPI,
  socket: surveySocketService,
  isAuthenticated,
  refreshAccessToken,
  logout,
  getCurrentUser,
  getRefreshToken,
  setUserSession,
};
