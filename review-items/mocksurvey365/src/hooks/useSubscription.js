import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getPlan, 
  getUserPlan,
  isSubscriptionActive, 
  getDaysUntilExpiry, 
  SUBSCRIPTION_STATUS,
  subscriptionAPI,
  canUpgradeTo,
  canDowngradeTo
} from '../../util/plan.js';

export const useSubscription = () => { 
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  
  const subscription = user?.subscription;
  
  // Handle API subscription structure - add planId if missing
  const enhancedSubscription = subscription ? {
    ...subscription,
    // If no planId, default to 'demo'
    planId: subscription.planId || 'demo'
  } : null;


  
  const currentPlan = getUserPlan(enhancedSubscription);


  
  // Subscription status helpers
  const isActive = isSubscriptionActive(enhancedSubscription);
  const daysUntilExpiry = getDaysUntilExpiry(enhancedSubscription);
  const isOnTrial = enhancedSubscription?.status === SUBSCRIPTION_STATUS.TRIAL;
  const isPastDue = enhancedSubscription?.status === SUBSCRIPTION_STATUS.PAST_DUE;
  const isCanceled = enhancedSubscription?.status === SUBSCRIPTION_STATUS.CANCELED;

  // Plan comparison helpers
  const canUpgrade = useCallback((targetPlanId) => {
    return canUpgradeTo(currentPlan.id, targetPlanId);
  }, [currentPlan.id]);

  const canDowngrade = useCallback((targetPlanId) => {
    return canDowngradeTo(currentPlan.id, targetPlanId);
  }, [currentPlan.id]);

  // Subscription actions
  const upgradeSubscription = useCallback(async (newPlanId, billingCycle = 'monthly') => {
    if (!subscription?.subscriptionId) {
      throw new Error('No active subscription found');
    }

    setLoading(true);
    setError(null);

    try {
      const updatedSubscription = await subscriptionAPI.updateSubscription(
        subscription.subscriptionId,
        {
          planId: newPlanId,
          billingCycle
        }
      );

      // Update user data
      const updatedUser = {
        ...user,
        subscription: {
          ...subscription,
          planId: newPlanId,
          billingCycle,
          ...updatedSubscription
        }
      };

      updateUser(updatedUser);
      return updatedSubscription;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [subscription, user, updateUser]);

  const cancelSubscription = useCallback(async (cancelAtPeriodEnd = true) => {
    if (!subscription?.subscriptionId) {
      throw new Error('No active subscription found');
    }

    setLoading(true);
    setError(null);

    try {
      const result = await subscriptionAPI.cancelSubscription(
        subscription.subscriptionId,
        cancelAtPeriodEnd
      );

      // Update user data
      const updatedUser = {
        ...user,
        subscription: {
          ...subscription,
          status: cancelAtPeriodEnd ? SUBSCRIPTION_STATUS.CANCELED : SUBSCRIPTION_STATUS.ACTIVE,
          cancelAtPeriodEnd,
          canceledAt: new Date().toISOString()
        }
      };

      updateUser(updatedUser);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [subscription, user, updateUser]);

  const reactivateSubscription = useCallback(async () => {
    if (!subscription?.subscriptionId) {
      throw new Error('No subscription found');
    }

    setLoading(true);
    setError(null);

    try {
      const updatedSubscription = await subscriptionAPI.updateSubscription(
        subscription.subscriptionId,
        {
          status: SUBSCRIPTION_STATUS.ACTIVE,
          cancelAtPeriodEnd: false
        }
      );

      // Update user data
      const updatedUser = {
        ...user,
        subscription: {
          ...subscription,
          status: SUBSCRIPTION_STATUS.ACTIVE,
          cancelAtPeriodEnd: false,
          canceledAt: null,
          ...updatedSubscription
        }
      };

      updateUser(updatedUser);
      return updatedSubscription;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [subscription, user, updateUser]);

  const refreshSubscription = useCallback(async () => {
    if (!subscription?.subscriptionId) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedSubscription = await subscriptionAPI.getSubscription(
        subscription.subscriptionId
      );

      // Update user data
      const updatedUser = {
        ...user,
        subscription: {
          ...subscription,
          ...updatedSubscription
        }
      };

      updateUser(updatedUser);
      return updatedSubscription;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [subscription, user, updateUser]);

  // Auto-refresh subscription data periodically
  useEffect(() => {
    if (!subscription?.subscriptionId) return;

    const interval = setInterval(() => {
      refreshSubscription();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [refreshSubscription, subscription?.subscriptionId]);

  // Warning notifications
  const getWarnings = useCallback(() => {
    const warnings = [];

    if (isOnTrial && daysUntilExpiry <= 3) {
      warnings.push({
        type: 'trial-ending',
        message: `Your trial ends in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`,
        severity: 'warning'
      });
    }

    if (isPastDue) {
      warnings.push({
        type: 'payment-failed',
        message: 'Your payment failed. Please update your payment method.',
        severity: 'error'
      });
    }

    if (isCanceled && daysUntilExpiry <= 7) {
      warnings.push({
        type: 'subscription-ending',
        message: `Your subscription ends in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`,
        severity: 'warning'
      });
    }

    return warnings;
  }, [isOnTrial, isPastDue, isCanceled, daysUntilExpiry]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Subscription data
    subscription: enhancedSubscription,
    currentPlan,
    
    // Status flags
    isActive,
    isOnTrial,
    isPastDue,
    isCanceled,
    daysUntilExpiry,
    
    // Plan comparison
    canUpgrade,
    canDowngrade,
    
    // Actions
    upgradeSubscription,
    cancelSubscription,
    reactivateSubscription,
    refreshSubscription,
    
    // UI state
    loading,
    error,
    clearError,
    warnings: getWarnings(),
    
    // Basic subscription status
    isSubscribed: enhancedSubscription?.status === true,
    isDemoUser: enhancedSubscription?.status === false || !enhancedSubscription?.status
  };
};

export default useSubscription; 