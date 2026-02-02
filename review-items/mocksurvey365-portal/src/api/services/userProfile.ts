import apiClient from '../client';

// Helper function to create auth headers
const createAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
};

export interface Profile {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
  organization: string;
  phoneNumber: string;
}

export interface ProfileUpdatePayload {
  firstName: string;
  lastName: string;
  organization: string;
  phoneNumber: string;
}

// Get current user profile
export const getProfile = async (): Promise<Profile> => {
  const response = await apiClient.get('/admin/me', createAuthHeaders());
  
  // API response: { status: true, data: { firstName, lastName, email, organization, phoneNumber, ... } }
  const raw = response.data;
  const profileData = raw?.data || raw;
  
  return {
    id: profileData._id || profileData.id || '',
    firstName: profileData.firstName || '',
    lastName: profileData.lastName || '',
    email: profileData.email || '',
    organization: profileData.organization || '',
    phoneNumber: profileData.phoneNumber || '',
  };
};

// Update user profile
export const updateProfile = async (data: ProfileUpdatePayload): Promise<Profile> => {
  const response = await apiClient.put('/user/updateProfile', data, createAuthHeaders());
  
  // API response: { status: true, data: { firstName, lastName, organization, phoneNumber, ... } }
  const raw = response.data;
  const profileData = raw?.data || raw;
  
  return {
    id: profileData._id || profileData.id || '',
    firstName: profileData.firstName || '',
    lastName: profileData.lastName || '',
    email: profileData.email || '',
    organization: profileData.organization || '',
    phoneNumber: profileData.phoneNumber || '',
  };
};
