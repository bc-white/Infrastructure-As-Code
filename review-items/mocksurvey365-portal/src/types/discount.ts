import type { CategoryType } from './category';
import type { Location, Status, TimeRange } from './common';

// Discount types
export type DiscountType = 'percentage' | 'fixed' | 'bogo' | 'freebie';

export interface Discount {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;

  // Discount details
  type: DiscountType;
  value: number; // Percentage (e.g., 20 for 20%) or fixed amount
  originalPrice?: number;
  discountedPrice?: number;

  // Merchant information
  merchantId: string;
  merchantName: string;
  merchantLogo?: string;
  merchantLocation?: Location;
  contact?: string;
  // Categorization
  category: CategoryType;
  tags: string[];

  // Validity
  status: Status;
  startDate: string; // ISO 8601
  endDate: string;   // ISO 8601
  validityDays?: string[]; // ['monday', 'tuesday', etc.]
  validityHours?: TimeRange;

  // Usage details
  termsAndConditions: string[];
  redemptionLimit?: number; // Max redemptions per user
  totalRedemptions?: number;
  maxRedemptions?: number; // Total available

  // Points
  pointsRequired?: number; // If redeemable with points
  pointsEarned?: number;   // Points user earns on redemption

  // Media
  images: string[]; // Array of image URLs
  image?: string; // Deprecated: Use images[0] for backward compatibility

  // Engagement metrics
  views?: number;
  redemptions?: number;
  likes?: number;
  isFeatured?: boolean;
  isPopular?: boolean;

  // Distance (computed on frontend)
  distance?: number; // In kilometers from user

  createdAt: string;
  updatedAt: string;
}

export interface DiscountRedemption {
  id: string;
  discountId: string;
  userId: string;
  merchantId: string;
  redeemedAt: string;
  qrCode?: string;
  verificationCode: string;
  status: 'pending' | 'completed' | 'expired' | 'cancelled';
  pointsEarned?: number;
}

export interface UserDiscount {
  userId: string;
  discountId: string;
  isSaved: boolean;
  isRedeemed: boolean;
  viewedAt?: string;
  savedAt?: string;
  redeemedAt?: string;
}
