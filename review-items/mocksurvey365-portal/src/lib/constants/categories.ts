import type { Category, CategoryType } from '@/types/category';

// Category definitions for the Yayy platform
export const CATEGORIES: Record<CategoryType, Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'discountCount'>> = {
  food: {
    name: 'Food & Dining',
    type: 'food',
    description: 'Restaurants, cafes, fast food, and food delivery',
    icon: 'utensils',
    color: 'bg-orange-500',
    isActive: true,
  },
  transportation: {
    name: 'Transportation',
    type: 'transportation',
    description: 'Ride-hailing, public transport, and vehicle services',
    icon: 'car',
    color: 'bg-blue-500',
    isActive: true,
  },
  entertainment: {
    name: 'Entertainment',
    type: 'entertainment',
    description: 'Movies, concerts, events, and recreational activities',
    icon: 'film',
    color: 'bg-purple-500',
    isActive: true,
  },
  health: {
    name: 'Health & Wellness',
    type: 'health',
    description: 'Pharmacies, fitness, gyms, and healthcare services',
    icon: 'heart',
    color: 'bg-red-500',
    isActive: true,
  },
  education: {
    name: 'Education',
    type: 'education',
    description: 'Books, courses, tutoring, and learning materials',
    icon: 'book',
    color: 'bg-green-500',
    isActive: true,
  },
  shopping: {
    name: 'Shopping',
    type: 'shopping',
    description: 'Retail stores, fashion, electronics, and online shopping',
    icon: 'shopping-bag',
    color: 'bg-pink-500',
    isActive: true,
  },
  services: {
    name: 'Services',
    type: 'services',
    description: 'Salon, laundry, repairs, and professional services',
    icon: 'briefcase',
    color: 'bg-cyan-500',
    isActive: true,
  },
};

// Array of all categories for easier iteration
export const CATEGORY_LIST: CategoryType[] = [
  'food',
  'transportation',
  'entertainment',
  'health',
  'education',
  'shopping',
  'services',
];

// Helper function to get category display name
export const getCategoryName = (type: CategoryType): string => {
  return CATEGORIES[type]?.name || type;
};

// Helper function to get category color
export const getCategoryColor = (type: CategoryType): string => {
  return CATEGORIES[type]?.color || 'bg-gray-500';
};

// Helper function to get category icon
export const getCategoryIcon = (type: CategoryType): string => {
  return CATEGORIES[type]?.icon || 'tag';
};
