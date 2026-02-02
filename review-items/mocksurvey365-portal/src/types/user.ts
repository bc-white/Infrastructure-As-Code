import type { CategoryType } from './category';
import type { Location } from './common';

// User types for the Yayy platform
export type UserType = 'student' | 'wassce_graduate' | 'national_service';
export type CardStatus = 'active' | 'inactive' | 'pending' | 'expired';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phoneNumber?: string;

  // User classification
  userType: UserType;
  schoolName?: string;
  studentId?: string;
  graduationYear?: number;
  serviceOrganization?: string;

  // Profile
  avatar?: string;
  dateOfBirth?: string;
  location?: Location;

  // Yayy Card
  cardNumber?: string;
  cardStatus: CardStatus;
  cardIssuedAt?: string;
  cardExpiresAt?: string;
  hasPhysicalCard: boolean;

  // Points & Engagement
  totalPoints: number;
  availablePoints: number;
  redeemedPoints: number;
  lifetimePoints: number;

  // Preferences
  preferredCategories: CategoryType[];
  notificationsEnabled: boolean;
  locationSharingEnabled: boolean;

  // Referrals
  referralCode: string;
  referredBy?: string;
  totalReferrals: number;

  // Account status
  isVerified: boolean;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface UserProfile extends Omit<User, 'password'> {
  // Extended profile information
  totalDiscountsRedeemed: number;
  totalSavings: number;
  favoriteCategories: CategoryType[];
  recentActivity: UserActivity[];
}

export interface UserActivity {
  id: string;
  userId: string;
  type: 'redemption' | 'points_earned' | 'points_redeemed' | 'profile_update' | 'referral';
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface UserPreferences {
  userId: string;
  categories: CategoryType[];
  theme: 'light' | 'dark' | 'system';
  maxDistance: number; // in kilometers
  priceRange?: {
    min: number;
    max: number;
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    newDiscounts: boolean;
    expiringDiscounts: boolean;
    pointsUpdate: boolean;
  };
  security?: {
    twoFactorEnabled?: boolean;
    rememberMe?: boolean;
  };
}

export interface UserStats {
  totalPoints: number;
  availablePoints: number;
  totalRedemptions: number;
  totalSavings: number;
  memberSince: string;
  currentStreak: number; // Days of consecutive activity
  favoriteCategory: CategoryType;
  topMerchants: {
    merchantId: string;
    merchantName: string;
    redemptionCount: number;
  }[];
}
