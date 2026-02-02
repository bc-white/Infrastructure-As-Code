import apiClient from "../client";

// Helper function to get the auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper function to create headers with auth token
const createAuthHeaders = () => {
  const token = getAuthToken();
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
};

export interface CriticalElement {
  id: string;
  name: string;
  type?: string;
  pdflink: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiPagination {
  total: number;
  totalPages: number;
  limit: number;
  currentPage: number;
}

export interface FileUploadResponse {
  url: string;
  key: string;
  success: boolean;
}

export interface CriticalElementFilters {
  name?: string; // Changed from search to name to be more specific
  type?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Fetch all critical elements with optional filters
 */
export const getAllCriticalElements = async (filters?: CriticalElementFilters): Promise<CriticalElement[]> => {
  // Build query parameters
  const params: Record<string, string> = {};
  
  if (filters) {
    if (filters.name) params.name = filters.name;
    if (filters.type && filters.type !== 'all') params.type = filters.type;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
  }
  
  const response = await apiClient.get('/config/criticalElements', {
    ...createAuthHeaders(),
    params
  });
  
  // API response: { status: true, data: { criticalelements: [...], pagination: {...} } }
  const raw = response.data;
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data?.criticalelements)
      ? raw.data.criticalelements
      : [];
  
  return list.map((item: any) => ({
    id: item._id || item.id || '',
    name: item.name || '',
    type: item.type || '',
    pdflink: item.pdflink || '',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
};

/**
 * Fetch all critical elements with pagination
 */
export const getAllCriticalElementsPaginated = async (
  page: number,
  limit: number,
  filters?: CriticalElementFilters
): Promise<{ items: CriticalElement[]; pagination: ApiPagination }> => {
  const params: Record<string, string | number> = { page, limit };
  if (filters) {
    if (filters.name) params.name = filters.name;
    if (filters.type && filters.type !== 'all') params.type = filters.type;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
  }
  
  const response = await apiClient.get('/config/criticalElements', {
    ...createAuthHeaders(),
    params,
  });
  
  // API response: { status: true, data: { criticalelements: [...], pagination: {...} } }
  const raw = response.data;
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data?.criticalelements)
      ? raw.data.criticalelements
      : [];
  
  const items: CriticalElement[] = list.map((item: any) => ({
    id: item._id || item.id || '',
    name: item.name || '',
    type: item.type || '',
    pdflink: item.pdflink || '',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
  
  const pagination: ApiPagination = raw?.data?.pagination || {
    total: items.length,
    totalPages: 1,
    limit,
    currentPage: page,
  };
  
  return { items, pagination };
};

/**
 * Get a specific critical element by ID
 */
export const getCriticalElement = async (id: string): Promise<CriticalElement> => {
  const response = await apiClient.get(`/config/viewCriticalElement/${id}`, createAuthHeaders());
  return response.data;
};

/**
 * Add a new critical element
 */
export const addCriticalElement = async (element: Omit<CriticalElement, 'id'>): Promise<CriticalElement> => {
  const response = await apiClient.post('/config/addCriticalElement', element, createAuthHeaders());
  // API response: { status: true, data: { _id, name, type, pdflink, ... } }
  const raw = response.data;
  const elementData = raw?.data || raw;
  
  return {
    id: elementData._id || elementData.id || '',
    name: elementData.name || '',
    type: elementData.type || '',
    pdflink: elementData.pdflink || '',
    createdAt: elementData.createdAt,
    updatedAt: elementData.updatedAt,
  };
};

/**
 * Update a critical element
 */
export const updateCriticalElement = async (element: CriticalElement): Promise<CriticalElement> => {
  const response = await apiClient.put('/config/updateCriticalElement', element, createAuthHeaders());
  // API response: { status: true, data: { _id, name, type, pdflink, ... } }
  const raw = response.data;
  const elementData = raw?.data || raw;
  
  return {
    id: elementData._id || elementData.id || element.id || '',
    name: elementData.name || element.name || '',
    type: elementData.type || element.type || '',
    pdflink: elementData.pdflink || element.pdflink || '',
    createdAt: elementData.createdAt || element.createdAt,
    updatedAt: elementData.updatedAt || element.updatedAt,
  };
};

/**
 * Delete a critical element
 * @param id - The ID of the critical element to delete
 * @throws Error if deletion fails
 */
export const deleteCriticalElement = async (id: string): Promise<void> => {
  const response = await apiClient.delete(`/config/deleteCriticalElement/${id}`, createAuthHeaders());
  
  // API may return { status: true, message: "..." } or just status 200
  if (response.data?.status === false) {
    throw new Error(response.data.message || "Failed to delete critical element");
  }
};

/**
 * Upload a file
 */
export const uploadFile = async (file: File): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Get auth token
  const token = getAuthToken();
  
  const response = await apiClient.post('/user/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'Authorization': token ? `Bearer ${token}` : '',
    },
  });
  
  // API response structure: { status: true, data: "url_string" }
  const raw = response.data;
  const url = typeof raw === 'string' ? raw : raw?.data || raw?.url || '';
  
  return {
    url,
    key: url.split('/').pop() || '',
    success: raw?.status === true || !!url,
  };
};
