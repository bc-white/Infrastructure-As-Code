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

export interface Question {
  id?: string;
  number?: number;
  text?: string;
  question?: string; // Legacy field for backward compatibility
  f_tag?: string;
  tag?: string; // Legacy field - maps to f_tag
  not_applicable_allowed?: boolean;
}

export interface Category {
  name: string;
  ftags?: string[];
  f_tags?: string[];
  questions: Question[];
  observations?: string[];
}

export interface MandatoryTask {
  id: string;
  title: string;
  version_date?: string;
  source_citation?: string;
  description?: string;
  tag?: string;
  categories?: Category[];
  questions?: Question[]; // Legacy field - flat list
  facilityTask?: string;
  desc?: string; // Legacy field for description
  createdAt?: string;
  updatedAt?: string;
}

export interface MandatoryTaskPayload {
  title: string;
  version_date?: string;
  source_citation?: string;
  desc?: string; // Legacy field for description
  categories?: Category[];
  questions?: Question[]; // Legacy field - flat list
}

// Array payload type for create/update
export type MandatoryTaskPayloadArray = MandatoryTaskPayload[];

// Get all mandatory tasks
export const getAllMandatoryTasks = async (): Promise<MandatoryTask[]> => {
  const response = await apiClient.get('/config/allMandatoryTask', createAuthHeaders());
  
  // API response: { status: true, statusCode: 200, message: "...", data: { mt: [...], pagination: {...} } }
  const raw = response.data;
  // Extract mt array from data.mt, fallback to data if mt doesn't exist
  const tasksArray = raw?.data?.mt || raw?.data || raw || [];

  return (Array.isArray(tasksArray) ? tasksArray : []).map((task: any) => ({
    id: task._id || task.id || '',
    title: task.title || '',
    version_date: task.version_date,
    source_citation: task.source_citation,
    description: task.description || task.desc || '',
    tag: task.tag || '',
    facilityTask: task.facilityTask || task.desc || task.description || '',
    desc: task.desc || task.description || '',
    categories: task.categories ? task.categories.map((cat: any) => ({
      name: cat.name || '',
      ftags: cat.ftags || cat.f_tags || [],
      f_tags: cat.f_tags || cat.ftags || [],
      questions: (cat.questions || []).map((q: any) => ({
        id: q._id || q.id || '',
        number: q.number,
        text: q.text || q.question || '',
        question: q.question || q.text || '', // Legacy
        f_tag: q.f_tag || q.tag || '',
        tag: q.tag || q.f_tag || '', // Legacy
        not_applicable_allowed: q.not_applicable_allowed,
      })),
      observations: cat.observations || [],
    })) : undefined,
    questions: task.questions ? task.questions.map((q: any) => ({
      id: q._id || q.id || '',
      number: q.number,
      text: q.text || q.question || '',
      question: q.question || q.text || '', // Legacy
      f_tag: q.f_tag || q.tag || '',
      tag: q.tag || q.f_tag || '', // Legacy
    })) : [],
    createdAt: task.createdAt || '',
    updatedAt: task.updatedAt || '',
  }));
};

// Get mandatory task by ID
export const getMandatoryTaskById = async (id: string): Promise<MandatoryTask | null> => {
  const response = await apiClient.get(`/config/viewMandatoryTask/${id}`, createAuthHeaders());
  
  // API response: { status: true, statusCode: 200, message: "...", data: {...} }
  const raw = response.data;
  const data = raw?.data || raw;

  if (!data) {
    return null;
  }

  return {
    id: data._id || data.id || '',
    title: data.title || '',
    version_date: data.version_date,
    source_citation: data.source_citation,
    description: data.description || data.desc || '',
    tag: data.tag || '',
    facilityTask: data.facilityTask || data.desc || data.description || '',
    desc: data.desc || data.description || '',
    categories: data.categories ? data.categories.map((cat: any) => ({
      name: cat.name || '',
      ftags: cat.ftags || cat.f_tags || [],
      f_tags: cat.f_tags || cat.ftags || [],
      questions: (cat.questions || []).map((q: any) => ({
        id: q._id || q.id || '',
        number: q.number,
        text: q.text || q.question || '',
        question: q.question || q.text || '', // Legacy
        f_tag: q.f_tag || q.tag || '',
        tag: q.tag || q.f_tag || '', // Legacy
        not_applicable_allowed: q.not_applicable_allowed,
      })),
      observations: cat.observations || [],
    })) : undefined,
    questions: data.questions ? data.questions.map((q: any) => ({
      id: q._id || q.id || '',
      number: q.number,
      text: q.text || q.question || '',
      question: q.question || q.text || '', // Legacy
      f_tag: q.f_tag || q.tag || '',
      tag: q.tag || q.f_tag || '', // Legacy
    })) : [],
    createdAt: data.createdAt || '',
    updatedAt: data.updatedAt || '',
  };
};

// Create mandatory task
export const createMandatoryTask = async (payload: MandatoryTaskPayload): Promise<MandatoryTask> => {
  console.log('Creating mandatory task with payload:', JSON.stringify(payload, null, 2));
  
  // API expects payload in format: { tags: [...] }
  const apiPayload = payload;
  const response = await apiClient.post('/config/addMandatoryTask', apiPayload, createAuthHeaders());
  
  // API response: { status: true, statusCode: 200, message: "...", data: [...] }
  const raw = response.data;
  const data = raw?.data || raw;
  
  // Handle array response - extract first item
  const taskData = Array.isArray(data) ? data[0] : (Array.isArray(data?.tags) ? data.tags[0] : data);

  return {
    id: taskData._id || taskData.id || '',
    title: taskData.title || '',
    version_date: taskData.version_date,
    source_citation: taskData.source_citation,
    description: taskData.description || taskData.desc || '',
    tag: taskData.tag || '',
    facilityTask: taskData.facilityTask || taskData.desc || taskData.description || '',
    desc: taskData.desc || taskData.description || '',
    categories: taskData.categories ? taskData.categories.map((cat: any) => ({
      name: cat.name || '',
      ftags: cat.ftags || cat.f_tags || [],
      f_tags: cat.f_tags || cat.ftags || [],
      questions: (cat.questions || []).map((q: any) => ({
        id: q._id || q.id || '',
        number: q.number,
        text: q.text || q.question || '',
        question: q.question || q.text || '', // Legacy
        f_tag: q.f_tag || q.tag || '',
        tag: q.tag || q.f_tag || '', // Legacy
        not_applicable_allowed: q.not_applicable_allowed,
      })),
      observations: cat.observations || [],
    })) : undefined,
    questions: taskData.questions ? taskData.questions.map((q: any) => ({
      id: q._id || q.id || '',
      number: q.number,
      text: q.text || q.question || '',
      question: q.question || q.text || '', // Legacy
      f_tag: q.f_tag || q.tag || '',
      tag: q.tag || q.f_tag || '', // Legacy
    })) : [],
    createdAt: taskData.createdAt || '',
    updatedAt: taskData.updatedAt || '',
  };
};

// Update mandatory task
export const updateMandatoryTask = async (id: string, payload: MandatoryTaskPayload): Promise<MandatoryTask> => {
  console.log(`Updating mandatory task ${id} with payload:`, JSON.stringify(payload, null, 2));
  
  // API expects payload in format: { tags: [...] }
  const apiPayload = { tags: [payload] };
  const response = await apiClient.put(`/config/updateMandatoryTask/${id}`, apiPayload, createAuthHeaders());
  
  // API response: { status: true, statusCode: 200, message: "...", data: [...] }
  const raw = response.data;
  const data = raw?.data || raw;
  
  // Handle array response - extract first item
  const taskData = Array.isArray(data) ? data[0] : (Array.isArray(data?.tags) ? data.tags[0] : data);

  return {
    id: taskData._id || taskData.id || '',
    title: taskData.title || '',
    version_date: taskData.version_date,
    source_citation: taskData.source_citation,
    description: taskData.description || taskData.desc || '',
    tag: taskData.tag || '',
    facilityTask: taskData.facilityTask || taskData.desc || taskData.description || '',
    desc: taskData.desc || taskData.description || '',
    categories: taskData.categories ? taskData.categories.map((cat: any) => ({
      name: cat.name || '',
      ftags: cat.ftags || cat.f_tags || [],
      f_tags: cat.f_tags || cat.ftags || [],
      questions: (cat.questions || []).map((q: any) => ({
        id: q._id || q.id || '',
        number: q.number,
        text: q.text || q.question || '',
        question: q.question || q.text || '', // Legacy
        f_tag: q.f_tag || q.tag || '',
        tag: q.tag || q.f_tag || '', // Legacy
        not_applicable_allowed: q.not_applicable_allowed,
      })),
      observations: cat.observations || [],
    })) : undefined,
    questions: taskData.questions ? taskData.questions.map((q: any) => ({
      id: q._id || q.id || '',
      number: q.number,
      text: q.text || q.question || '',
      question: q.question || q.text || '', // Legacy
      f_tag: q.f_tag || q.tag || '',
      tag: q.tag || q.f_tag || '', // Legacy
    })) : [],
    createdAt: taskData.createdAt || '',
    updatedAt: taskData.updatedAt || '',
  };
};

// Delete mandatory task
export const deleteMandatoryTask = async (id: string): Promise<void> => {
  console.log(`Deleting mandatory task ${id}`);
  const response = await apiClient.delete(`/config/deleteMandatoryTask/${id}`, createAuthHeaders());
  
  // Check if deletion was successful
  const raw = response.data;
  if (raw?.status === false || (raw?.statusCode && raw.statusCode >= 400)) {
    throw new Error(raw?.message || 'Failed to delete mandatory task');
  }
};
