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

export interface Resource {
  id: string;
  name: string;
  type: string;
  pdflink: string;
  date: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LongTermRegulation {
  id: string;
  name: string;
  state: string;
  pdflink: string;
  date: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FileUploadResponse {
  url: string;
  key: string;
  success: boolean;
}

export interface ResourceFilters {
  name?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export interface ApiPagination {
  total: number;
  totalPages: number;
  limit: number;
  currentPage: number;
}

/**
 * Fetch all resources with optional filters
 */
export const getAllResources = async (filters?: ResourceFilters): Promise<Resource[]> => {
  // Build query parameters
  const params: Record<string, string> = {};
  
  if (filters) {
    if (filters.name) params.name = filters.name;
    if (filters.type && filters.type !== 'all') params.type = filters.type;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
  }
  
  const response = await apiClient.get('/config/allResources', {
    ...createAuthHeaders(),
    params
  });
  // Expected API shape:
  // {
  //   status: true,
  //   data: { resources: [ { _id, name, type, pdflink, date, description } ], pagination: {...} }
  // }
  const raw = response.data;
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data?.resources)
      ? raw.data.resources
      : [];

  return list.map((r: any) => ({
    id: r._id ?? r.id ?? r.guid ?? '',
    name: r.name ?? '',
    type: r.type ?? '',
    pdflink: r.pdflink ?? r.pdf ?? '',
    date: r.date ?? '',
    description: r.description ?? '',
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  })) as Resource[];
};

export const getAllResourcesPaginated = async (
  page: number,
  limit: number,
  filters?: ResourceFilters
): Promise<{ items: Resource[]; pagination: ApiPagination }> => {
  const params: Record<string, string | number> = { page, limit };
  if (filters) {
    if (filters.name) params.name = filters.name;
    if (filters.type && filters.type !== 'all') params.type = filters.type;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
  }

  const response = await apiClient.get('/config/allResources', {
    ...createAuthHeaders(),
    params,
  });

  const raw = response.data;
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data?.resources)
      ? raw.data.resources
      : [];
  const items: Resource[] = list.map((r: any) => ({
    id: r._id ?? r.id ?? r.guid ?? '',
    name: r.name ?? '',
    type: r.type ?? '',
    pdflink: r.pdflink ?? r.pdf ?? '',
    date: r.date ?? '',
    description: r.description ?? '',
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
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
 * Add a new resource
 */
export const addResource = async (resource: Omit<Resource, 'id'>): Promise<Resource> => {
  const response = await apiClient.post('/config/addResources', resource, createAuthHeaders());
  // API response: { status: true, data: { _id, name, type, ... } }
  const raw = response.data;
  const resourceData = raw?.data || raw;
  
  return {
    id: resourceData._id || resourceData.id || '',
    name: resourceData.name || '',
    type: resourceData.type || '',
    pdflink: resourceData.pdflink || '',
    date: resourceData.date || '',
    description: resourceData.description || '',
    createdAt: resourceData.createdAt,
    updatedAt: resourceData.updatedAt,
  };
};

/**
 * Delete a resource
 * @param id - The ID of the resource to delete
 * @throws Error if deletion fails
 */
export const deleteResource = async (id: string): Promise<void> => {
  const response = await apiClient.delete(`/config/deleteResources/${id}`, createAuthHeaders());
  
  // API may return { status: true, message: "..." } or just status 200
  if (response.data?.status === false) {
    throw new Error(response.data.message || "Failed to delete resource");
  }
};

/**
 * Update a resource
 */
export const updateResource = async (id: string, resource: Partial<Resource>): Promise<Resource> => {
  const response = await apiClient.put(`/config/updateResource/${id}`, resource, createAuthHeaders());
  return response.data;
};

export interface RegulationFilters {
  name?: string;
  state?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Fetch all long term regulations with optional filters
 */
export const getAllLongTermRegulations = async (filters?: RegulationFilters): Promise<LongTermRegulation[]> => {
  // Build query parameters
  const params: Record<string, string> = {};
  
  if (filters) {
    if (filters.name) params.name = filters.name;
    if (filters.state) params.state = filters.state;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
  }
  
  const response = await apiClient.get('/config/allLongTermRegulations', {
    ...createAuthHeaders(),
    params
  });
  // Expected API shape:
  // {
  //   status: true,
  //   data: { longTermRegulations: [ { _id, name, state, pdflink, date, description } ], pagination: {...} }
  // }
  const raw = response.data;
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data?.longTermRegulations)
      ? raw.data.longTermRegulations
      : [];

  return list.map((r: any) => ({
    id: r._id ?? r.id ?? r.guid ?? '',
    name: r.name ?? '',
    state: r.state ?? '',
    pdflink: r.pdflink ?? r.pdf ?? '',
    date: r.date ?? '',
    description: r.description ?? '',
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  })) as LongTermRegulation[];
};

export const getAllLongTermRegulationsPaginated = async (
  page: number,
  limit: number,
  filters?: RegulationFilters
): Promise<{ items: LongTermRegulation[]; pagination: ApiPagination }> => {
  const params: Record<string, string | number> = { page, limit };
  if (filters) {
    if (filters.name) params.name = filters.name;
    if (filters.state) params.state = filters.state;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
  }

  const response = await apiClient.get('/config/allLongTermRegulations', {
    ...createAuthHeaders(),
    params,
  });

  const raw = response.data;
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data?.longTermRegulations)
      ? raw.data.longTermRegulations
      : [];
  const items: LongTermRegulation[] = list.map((r: any) => ({
    id: r._id ?? r.id ?? r.guid ?? '',
    name: r.name ?? '',
    state: r.state ?? '',
    pdflink: r.pdflink ?? r.pdf ?? '',
    date: r.date ?? '',
    description: r.description ?? '',
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
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
 * Add a new long term regulation
 */
export const addLongTermRegulation = async (regulation: Omit<LongTermRegulation, 'id'>): Promise<LongTermRegulation> => {
  const response = await apiClient.post('/config/addLongTermRegulations', regulation, createAuthHeaders());
  // API response: { status: true, data: { _id, name, state, ... } }
  const raw = response.data;
  const regulationData = raw?.data || raw;
  
  return {
    id: regulationData._id || regulationData.id || '',
    name: regulationData.name || '',
    state: regulationData.state || '',
    pdflink: regulationData.pdflink || '',
    date: regulationData.date || '',
    description: regulationData.description || '',
    createdAt: regulationData.createdAt,
    updatedAt: regulationData.updatedAt,
  };
};

/**
 * Delete a long term regulation
 * @param id - The ID of the regulation to delete
 * @throws Error if deletion fails
 */
export const deleteLongTermRegulation = async (id: string): Promise<void> => {
  const response = await apiClient.delete(`/config/deleteLongTermRegulations/${id}`, createAuthHeaders());
  
  // API may return { status: true, message: "..." } or just status 200
  if (response.data?.status === false) {
    throw new Error(response.data.message || "Failed to delete long term regulation");
  }
};

/**
 * Update a long term regulation
 */
export const updateLongTermRegulation = async (id: string, regulation: Partial<LongTermRegulation>): Promise<LongTermRegulation> => {
  const response = await apiClient.put(`/config/updateLongTermRegulation/${id}`, regulation, createAuthHeaders());
  return response.data;
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
