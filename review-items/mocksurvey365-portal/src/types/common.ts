// Common types used across the application

export type Status = 'active' | 'inactive' | 'expired' | 'pending';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface TimeRange {
  start: string; // ISO 8601 format
  end: string;   // ISO 8601 format
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  distance?: number; // in kilometers
  minDiscount?: number;
  maxDiscount?: number;
  latitude?: number;
  longitude?: number;
}
