// Plan definitions and subscription management utilities
import baseUrl from '../baseUrl.js';

// Plan IDs
export const PLAN_IDS = {
  DEMO: 'demo',
  MONTHLY: 'monthly',
  ANNUAL: 'annual',
  CONSULTANT: 'consultant',
  PER_REPORT: 'per-report'
};

// Plan definitions with basic details only
export const PLANS = {
  [PLAN_IDS.DEMO]: {
    id: PLAN_IDS.DEMO,
    name: 'Free Demo',
    displayName: 'Free Demo',
    description: 'Try MockSurvey365 with limited access',
    price: {
      monthly: 0,
      annual: 0
    },
    billingCycle: null,
    trialDays: null,
    popular: false,
    tier: 'demo'
  },

  [PLAN_IDS.MONTHLY]: {
    id: PLAN_IDS.MONTHLY,
    name: 'Professional Monthly',
    displayName: 'Professional Monthly',
    description: 'Full access for individual users',
    price: {
      monthly: 49,
      annual: 39
    },
    billingCycle: 'monthly',
    trialDays: 14,
    popular: true,
    tier: 'professional'
  },

  [PLAN_IDS.ANNUAL]: {
    id: PLAN_IDS.ANNUAL,
    name: 'Professional Annual',
    displayName: 'Professional Annual',
    description: 'Best value for committed users',
    price: {
      monthly: 39,
      annual: 468 // 39 * 12 = 468 (save $120)
    },
    billingCycle: 'annual',
    trialDays: 14,
    popular: false,
    tier: 'professional',
    savings: {
      amount: 120,
      percentage: 20
    }
  },

  [PLAN_IDS.CONSULTANT]: {
    id: PLAN_IDS.CONSULTANT,
    name: 'Consultant License',
    displayName: 'Consultant License',
    description: 'Advanced tools for healthcare consultants',
    price: {
      monthly: 149,
      annual: 1428 // 119 * 12 = 1428 (save $360)
    },
    billingCycle: 'monthly',
    trialDays: null,
    popular: false,
    tier: 'consultant',
    requiresContact: true
  },

  [PLAN_IDS.PER_REPORT]: {
    id: PLAN_IDS.PER_REPORT,
    name: 'Pay Per Report',
    displayName: 'Pay Per Report',
    description: 'Perfect for occasional users',
    price: {
      monthly: 25,
      annual: 25,
      unit: 'per report'
    },
    billingCycle: null,
    trialDays: null,
    popular: false,
    tier: 'payg',
    payAsYouGo: true,
    oneTime: true
  }
};

// Subscription status enum
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  TRIAL: 'trial',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  INCOMPLETE: 'incomplete',
  INCOMPLETE_EXPIRED: 'incomplete_expired',
  UNPAID: 'unpaid'
};

// Helper Functions
export const getPlan = (planId) => {
  return PLANS[planId] || PLANS[PLAN_IDS.DEMO];
};

export const getUserPlan = (subscription) => {
  if (!subscription) return PLANS[PLAN_IDS.DEMO];
  
  // If subscription has a planId, use it
  if (subscription.planId && PLANS[subscription.planId]) {
    return PLANS[subscription.planId];
  }
  
  // Default to demo plan
  return PLANS[PLAN_IDS.DEMO];
};

export const getAllPlans = () => {
  return Object.values(PLANS);
};

export const getPublicPlans = () => {
  return Object.values(PLANS).filter(plan => !plan.requiresContact);
};

export const getPlanPrice = (planId, billingCycle = 'monthly') => {
  const plan = getPlan(planId);
  return plan.price[billingCycle] || plan.price.monthly;
};

export const calculateAnnualSavings = (planId) => {
  const plan = getPlan(planId);
  if (!plan.price.annual || !plan.price.monthly) return 0;
  
  const monthlyTotal = plan.price.monthly * 12;
  const annualPrice = plan.price.annual;
  return monthlyTotal - annualPrice;
};

export const canUpgradeTo = (currentPlanId, targetPlanId) => {
  const currentPlan = getPlan(currentPlanId);
  const targetPlan = getPlan(targetPlanId);
  
  const tierOrder = {
    demo: 0,
    payg: 1,
    professional: 2,
    consultant: 3
  };
  
  return tierOrder[targetPlan.tier] > tierOrder[currentPlan.tier];
};

export const canDowngradeTo = (currentPlanId, targetPlanId) => {
  const currentPlan = getPlan(currentPlanId);
  const targetPlan = getPlan(targetPlanId);
  
  const tierOrder = {
    demo: 0,
    payg: 1,
    professional: 2,
    consultant: 3
  };
  
  return tierOrder[targetPlan.tier] < tierOrder[currentPlan.tier];
};

export const getRecommendedPlan = (userRole, features = []) => {
  // Recommend based on user role
  if (userRole === 'consultant') {
    return PLAN_IDS.CONSULTANT;
  }
  
  return PLAN_IDS.MONTHLY;
};

export const isTrialEligible = (planId) => {
  const plan = getPlan(planId);
  return plan.trialDays > 0;
};

export const getTrialEndDate = (startDate, planId) => {
  const plan = getPlan(planId);
  if (!plan.trialDays) return null;
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.trialDays);
  return endDate;
};

export const isSubscriptionActive = (subscription) => {
  if (!subscription) return false;
  
  // Handle the new subscription structure from the API
  if (typeof subscription.status === 'boolean') {
    return subscription.status === true;
  }
  
  // Handle legacy subscription structure
  if (subscription.currentPeriodEnd) {
    const now = Date.now();
    const currentPeriodEnd = new Date(subscription.currentPeriodEnd).getTime();
    
    return (
      subscription.status === SUBSCRIPTION_STATUS.ACTIVE ||
      subscription.status === SUBSCRIPTION_STATUS.TRIAL
    ) && currentPeriodEnd > now;
  }
  
  return false;
};

export const getDaysUntilExpiry = (subscription) => {
  if (!subscription) return 0;
  
  const now = Date.now();
  const expiryDate = subscription.trialEnd || subscription.currentPeriodEnd;
  const diffTime = new Date(expiryDate).getTime() - now;
  
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Plan comparison utilities
export const comparePlans = (planId1, planId2, criteria = 'price') => {
  const plan1 = getPlan(planId1);
  const plan2 = getPlan(planId2);
  
  switch (criteria) {
    case 'price':
      return plan1.price.monthly - plan2.price.monthly;
    case 'tier':
      const tierOrder = { demo: 0, payg: 1, professional: 2, consultant: 3 };
      return tierOrder[plan1.tier] - tierOrder[plan2.tier];
    default:
      return 0;
  }
};

export const formatPrice = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0
  }).format(amount);
};

export const getPlanBadge = (planId) => {
  const plan = getPlan(planId);
  
  if (plan.popular) return { text: 'Most Popular', color: 'green' };
  if (plan.savings) return { text: 'Best Value', color: 'purple' };
  if (plan.tier === 'consultant') return { text: 'Advanced', color: 'orange' };
  if (plan.tier === 'demo') return { text: 'Free', color: 'blue' };
  
  return null;
};

// Subscription management API (mock for now)
export const subscriptionAPI = {
  async createSubscription(userId, planId, billingCycle, paymentMethodId) {
    // In production, this would call your backend API
    const response = await fetch(`${baseUrl}/api/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        userId,
        planId,
        billingCycle,
        paymentMethodId
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create subscription');
    }
    
    return response.json();
  },

  async updateSubscription(subscriptionId, updates) {
    const response = await fetch(`${baseUrl}/api/subscriptions/${subscriptionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update subscription');
    }
    
    return response.json();
  },

  async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
    const response = await fetch(`${baseUrl}/api/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ cancelAtPeriodEnd })
    });
    
    if (!response.ok) {
      throw new Error('Failed to cancel subscription');
    }
    
    return response.json();
  },

  async getSubscription(subscriptionId) {
    const response = await fetch(`${baseUrl}/api/subscriptions/${subscriptionId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get subscription');
    }
    
    return response.json();
  },

  async getInvoices(subscriptionId) {
    const response = await fetch(`${baseUrl}/api/subscriptions/${subscriptionId}/invoices`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get invoices');
    }
    
    return response.json();
  }
};

export default {
  PLAN_IDS,
  PLANS,
  SUBSCRIPTION_STATUS,
  getPlan,
  getAllPlans,
  getPublicPlans,
  getPlanPrice,
  calculateAnnualSavings,
  canUpgradeTo,
  canDowngradeTo,
  getRecommendedPlan,
  isTrialEligible,
  getTrialEndDate,
  isSubscriptionActive,
  getDaysUntilExpiry,
  comparePlans,
  formatPrice,
  getPlanBadge,
  subscriptionAPI
};
