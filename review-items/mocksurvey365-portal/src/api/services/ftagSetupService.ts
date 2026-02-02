import apiClient from "../client";

// Helper function to get the auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper function to create auth headers
const createAuthHeaders = () => {
  const token = getAuthToken();
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
};

export interface FtagSetup {
  id: string;
  ftag: string;
  category: string;
  definitions: string;
  rev_and_date: string;
  description: string;
  intent: string;
  guidance: string;
  procedure: string;
  createdAt?: string;
}

export interface FtagSetupFilters {
  ftag?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

// Create a new FTAG setup
export const addFtagSetup = async (ftagSetup: Omit<FtagSetup, "id" | "createdAt">): Promise<FtagSetup> => {
  // API expects payload format: { "tags": [...] }
  const payload = {
    tags: [ftagSetup]
  };
  
  const response = await apiClient.post("/config/addFtagSetup", payload, createAuthHeaders());
  
  // API response: { status: true, data: { tags: [{ _id, ftag, ... }] } }
  const raw = response.data;
  const tagsArray = raw?.data?.tags || raw?.tags || [];
  const createdTag = tagsArray[0] || raw?.data || raw;
  
  // Transform API data to match our interface
  return {
    id: createdTag._id || createdTag.id || '',
    ftag: createdTag.ftag || '',
    category: createdTag.category || '',
    definitions: createdTag.definitions || '',
    rev_and_date: createdTag.rev_and_date || '',
    description: createdTag.description || '',
    intent: createdTag.intent || '',
    guidance: createdTag.guidance || '',
    procedure: createdTag.procedure || '',
    createdAt: createdTag.createdAt || createdTag.created_at || '',
  };
};

// Get all FTAG setups with optional filters
export const getAllFtagSetups = async (filters?: FtagSetupFilters): Promise<FtagSetup[]> => {
  const params: Record<string, string> = {};
  if (filters) {
    if (filters.ftag) params.ftag = filters.ftag;
    if (filters.category) params.category = filters.category;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
  }
  const response = await apiClient.get("/config/allFtagSetup", {
    ...createAuthHeaders(),
    params
  });
  
  // API response structure: { status: true, data: { ftags: [...], pagination: {...} } }
  const raw = response.data;
  const ftagsList = Array.isArray(raw?.data?.ftags)
    ? raw.data.ftags
    : Array.isArray(raw?.ftags)
    ? raw.ftags
    : Array.isArray(raw)
    ? raw
    : [];
  
  // Transform API data to match our interface
  return ftagsList.map((item: any) => ({
    id: item._id || item.id || '',
    ftag: item.ftag || '',
    category: item.category || '',
    definitions: item.definitions || '',
    rev_and_date: item.rev_and_date || '',
    description: item.description || '',
    intent: item.intent || '',
    guidance: item.guidance || '',
    procedure: item.procedure || '',
    createdAt: item.createdAt || item.created_at || '',
  }));
};

// Get a specific FTAG setup by ID
export const getFtagSetupById = async (id: string): Promise<FtagSetup> => {
  const response = await apiClient.get(`/config/viewFtagSetup/${id}`, createAuthHeaders());
  
  // API response: { status: true, statusCode: 200, message: "...", data: { _id, ftag, ... } }
  const raw = response.data;
  const ftagData = raw?.data || raw;
  
  // Transform API data to match our interface
  return {
    id: ftagData._id || ftagData.id || '',
    ftag: ftagData.ftag || '',
    category: ftagData.category || '',
    definitions: ftagData.definitions || '',
    rev_and_date: ftagData.rev_and_date || '',
    description: ftagData.description || '',
    intent: ftagData.intent || '',
    guidance: ftagData.guidance || '',
    procedure: ftagData.procedure || '',
    createdAt: ftagData.createdAt || ftagData.created_at || '',
  };
};

// Update an existing FTAG setup
export const updateFtagSetup = async (ftagSetup: FtagSetup): Promise<FtagSetup> => {
  const response = await apiClient.put("/config/updateFtagSetup", ftagSetup, createAuthHeaders());
  return response.data;
};

// Delete a FTAG setup
/**
 * Delete a FTAG setup
 * @param id - The ID of the FTAG setup to delete
 * @throws Error if deletion fails
 */
export const deleteFtagSetup = async (id: string): Promise<void> => {
  const response = await apiClient.delete(`/config/deleteFtagSetup/${id}`, createAuthHeaders());
  
  // API may return { status: true, message: "..." } or just status 200
  if (response.data?.status === false) {
    throw new Error(response.data.message || "Failed to delete FTAG setup");
  }
};

// Upload a file (can be used for any file uploads related to FTAG setups)
export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  
  // Get auth token
  const token = getAuthToken();
  
  const response = await apiClient.post("/user/upload", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': token ? `Bearer ${token}` : '',
    },
  });
  
  // API response structure: { status: true, data: "url_string" }
  const raw = response.data;
  const url = typeof raw === 'string' ? raw : raw?.data || raw?.url || '';
  
  return url;
};
