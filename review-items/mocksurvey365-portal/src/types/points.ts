// Points and rewards types for the Yayy platform

export type PointsTransactionType = 'earned' | 'redeemed';

export type PointsSource =
  | 'purchase'
  | 'referral'
  | 'daily_login'
  | 'profile_completion'
  | 'sharing'
  | 'redemption'
  | 'streak_bonus'
  | 'welcome_bonus';

export type PointsFilter = 'all' | 'earned' | 'redeemed';

export type TierType = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface PointsTransaction {
  id: string;
  userId: string;
  type: PointsTransactionType;
  amount: number; // positive for earned, negative for redeemed
  source: PointsSource;
  description: string;
  merchantName?: string;
  merchantLogo?: string;
  discountId?: string;
  referralUserId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface PointsSummary {
  totalEarned: number;
  totalRedeemed: number;
  availablePoints: number;
  currentTier: TierType;
  currentTierPoints: number; // points threshold for current tier
  nextTierPoints: number; // points threshold for next tier
  lifetimePoints: number; // total accumulated (never decreases)
  currentStreak: number; // days
  nextStreakMilestone: number; // e.g., 14 days
  streakMilestoneReward: number; // e.g., 50 pts
}

export interface TierInfo {
  tier: TierType;
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  gradient: string;
  icon: string;
  benefits: string[];
}

export interface StreakMilestone {
  days: number;
  reward: number;
}

// Tier configuration
export const TIER_CONFIG: Record<TierType, TierInfo> = {
  bronze: {
    tier: 'bronze',
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 999,
    color: '#CD7F32',
    gradient: 'from-orange-600 to-amber-700',
    icon: '🥉',
    benefits: ['Access to basic discounts', 'Earn points on purchases']
  },
  silver: {
    tier: 'silver',
    name: 'Silver',
    minPoints: 1000,
    maxPoints: 4999,
    color: '#C0C0C0',
    gradient: 'from-gray-400 to-gray-500',
    icon: '🥈',
    benefits: ['5% bonus points', 'Early access to new deals', 'Priority support']
  },
  gold: {
    tier: 'gold',
    name: 'Gold',
    minPoints: 5000,
    maxPoints: 9999,
    color: '#FFD700',
    gradient: 'from-yellow-400 to-yellow-600',
    icon: '🥇',
    benefits: ['10% bonus points', 'Exclusive VIP discounts', 'Birthday rewards']
  },
  platinum: {
    tier: 'platinum',
    name: 'Platinum',
    minPoints: 10000,
    maxPoints: Infinity,
    color: '#E5E4E2',
    gradient: 'from-purple-500 to-blue-500',
    icon: '💎',
    benefits: ['15% bonus points', 'Premium partner access', 'Personal account manager']
  }
};

// Streak milestones configuration
export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, reward: 10 },
  { days: 7, reward: 25 },
  { days: 14, reward: 50 },
  { days: 30, reward: 100 },
  { days: 60, reward: 250 },
  { days: 90, reward: 500 }
];

// Helper function to get tier from lifetime points
export const getTierFromPoints = (lifetimePoints: number): TierType => {
  if (lifetimePoints >= 10000) return 'platinum';
  if (lifetimePoints >= 5000) return 'gold';
  if (lifetimePoints >= 1000) return 'silver';
  return 'bronze';
};

// Helper function to get next tier threshold
export const getNextTierThreshold = (currentTier: TierType): number => {
  const tiers: TierType[] = ['bronze', 'silver', 'gold', 'platinum'];
  const currentIndex = tiers.indexOf(currentTier);
  if (currentIndex === tiers.length - 1) return Infinity; // Already at max tier
  const nextTier = tiers[currentIndex + 1];
  return TIER_CONFIG[nextTier].minPoints;
};

// Helper function to get next streak milestone
export const getNextStreakMilestone = (currentStreak: number): StreakMilestone | null => {
  for (const milestone of STREAK_MILESTONES) {
    if (currentStreak < milestone.days) {
      return milestone;
    }
  }
  return null; // Already passed all milestones
};

// Helper function to get transaction icon based on source
export const getTransactionIcon = (source: PointsSource): string => {
  const iconMap: Record<PointsSource, string> = {
    daily_login: '✅',
    purchase: '🛍️',
    referral: '👥',
    redemption: '🎁',
    profile_completion: '✏️',
    sharing: '📤',
    streak_bonus: '🔥',
    welcome_bonus: '🎉'
  };
  return iconMap[source] || '⭐';
};

// Helper function to get transaction color based on type
export const getTransactionColor = (type: PointsTransactionType): string => {
  return type === 'earned' ? 'text-green-600' : 'text-purple-600';
};

// Helper function to get transaction background color
export const getTransactionBgColor = (type: PointsTransactionType): string => {
  return type === 'earned' ? 'bg-green-50' : 'bg-purple-50';
};
