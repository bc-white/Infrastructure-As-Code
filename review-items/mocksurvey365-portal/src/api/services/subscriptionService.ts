import apiClient from "../client";

// Auth headers helper
const createAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export interface SubscriptionPoint { point: string }

export interface Subscription {
  id: string;
  plan: string;
  pricingModel: string;
  yearlyPrice?: number;
  usageLimit?: string;
  additionalSurvey?: string;
  included?: SubscriptionPoint[];
  restrictions?: SubscriptionPoint[];
  status?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionUpsert {
  id?: string;
  plan: string;
  pricingModel: string;
  yearlyPrice?: number;
  usageLimit?: string;
  additionalSurvey?: string;
  included?: SubscriptionPoint[];
  restrictions?: SubscriptionPoint[];
}

export const addSubscription = async (payload: SubscriptionUpsert): Promise<Subscription> => {
  const { data } = await apiClient.post("/subscription/addSubscription", payload, createAuthHeaders());
  return data;
};

export const updateSubscription = async (payload: SubscriptionUpsert & { id: string }): Promise<Subscription> => {
  const { data } = await apiClient.put("/subscription/updateSubscription", payload, createAuthHeaders());
  return data;
};

export const getAllSubscriptions = async (): Promise<Subscription[]> => {
  const { data } = await apiClient.get("/subscription/allSubscription", createAuthHeaders());
  // API returns {status, statusCode, message, data: [...]} sometimes; normalize
  return Array.isArray(data) ? data : (data?.data ?? []);
};

export const getSubscriptionById = async (id: string): Promise<Subscription> => {
  const { data } = await apiClient.get(`/subscription/viewSubscription/${id}`, createAuthHeaders());
  return data?.data ?? data;
};
