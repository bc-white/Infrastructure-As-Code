// Route constants for the Yayy platform

// Public routes
export const PUBLIC_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
} as const;

// User routes
export const USER_ROUTES = {
  DASHBOARD: '/user/dashboard',
  DISCOVER: '/user/discover',
  SEARCH: '/user/search',
  DISCOUNT_DETAIL: (id: string) => `/user/discount/${id}`,
  DISCOUNT_DETAIL_PATTERN: '/user/discount/:id',
  CARD: '/user/card',
  POINTS: '/user/points',
  REWARDS: '/user/rewards',
  PROFILE: '/user/profile',
  SETTINGS: '/user/settings',
  HISTORY: '/user/history',
  SAVED: '/user/saved',
} as const;

// Merchant routes (for later phases)
export const MERCHANT_ROUTES = {
  DASHBOARD: '/merchant/dashboard',
  DISCOUNTS: '/merchant/discounts',
  CREATE_DISCOUNT: '/merchant/discounts/create',
  EDIT_DISCOUNT: (id: string) => `/merchant/discounts/${id}/edit`,
  ANALYTICS: '/merchant/analytics',
  PROFILE: '/merchant/profile',
  SETTINGS: '/merchant/settings',
} as const;

// Admin routes (for later phases)
export const ADMIN_ROUTES = {
  DASHBOARD: '/admin/dashboard',
  USERS: '/admin/users',
  MERCHANTS: '/admin/merchants',
  DISCOUNTS: '/admin/discounts',
  ANALYTICS: '/admin/analytics',
  SETTINGS: '/admin/settings',
} as const;

// Helper function to check if route is public
export const isPublicRoute = (path: string): boolean => {
  return Object.values(PUBLIC_ROUTES).includes(path as any);
};

// Helper function to check if route is user route
export const isUserRoute = (path: string): boolean => {
  return path.startsWith('/user');
};

// Helper function to check if route is merchant route
export const isMerchantRoute = (path: string): boolean => {
  return path.startsWith('/merchant');
};

// Helper function to check if route is admin route
export const isAdminRoute = (path: string): boolean => {
  return path.startsWith('/admin');
};
