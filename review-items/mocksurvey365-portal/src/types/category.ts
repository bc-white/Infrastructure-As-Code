// Category types for discount classification

export type CategoryType = 'food' | 'transportation' | 'entertainment' | 'health' | 'education' | 'shopping' | 'services';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  description: string;
  icon: string; // Icon name or path
  color: string; // Tailwind color class or hex
  isActive: boolean;
  discountCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryPreference {
  categoryId: string;
  userId: string;
  isPreferred: boolean;
  priority: number; // 1-10 for sorting
}
