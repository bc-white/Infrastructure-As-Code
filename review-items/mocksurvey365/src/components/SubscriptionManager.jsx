import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  CreditCard, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Download,
  Settings,
  RefreshCw,
  XCircle,
  Clock,
  Crown
} from 'lucide-react';
import useSubscription from '../hooks/useSubscription';
import { 
  getPlan, 
  getAllPlans, 
  formatPrice, 
  SUBSCRIPTION_STATUS,
  getDaysUntilExpiry
} from '../../util/plan.js';

const SubscriptionManager = () => {
  const navigate = useNavigate();
  const {
    subscription,
    currentPlan,
    isActive,
    isOnTrial,
    isPastDue,
    isCanceled,
    daysUntilExpiry,
    canUpgrade,
    canDowngrade,
    upgradeSubscription,
    cancelSubscription,
    reactivateSubscription,
    refreshSubscription,
    loading,
    error,
    clearError,
    warnings
  } = useSubscription();

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  const getStatusIcon = (status) => {
    switch (status) {
      case SUBSCRIPTION_STATUS.ACTIVE:
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case SUBSCRIPTION_STATUS.TRIAL:
        return <Clock className="w-5 h-5 text-blue-500" />;
      case SUBSCRIPTION_STATUS.PAST_DUE:
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case SUBSCRIPTION_STATUS.CANCELED:
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case SUBSCRIPTION_STATUS.ACTIVE:
        return 'Active';
      case SUBSCRIPTION_STATUS.TRIAL:
        return 'Trial';
      case SUBSCRIPTION_STATUS.PAST_DUE:
        return 'Past Due';
      case SUBSCRIPTION_STATUS.CANCELED:
        return 'Canceled';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case SUBSCRIPTION_STATUS.ACTIVE:
        return 'bg-green-100 text-green-800';
      case SUBSCRIPTION_STATUS.TRIAL:
        return 'bg-blue-100 text-blue-800';
      case SUBSCRIPTION_STATUS.PAST_DUE:
        return 'bg-orange-100 text-orange-800';
      case SUBSCRIPTION_STATUS.CANCELED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUpgrade = (targetPlanId) => {
    navigate('/pricing', { 
      state: { 
        highlightPlan: targetPlanId,
        isUpgrade: true 
      } 
    });
  };

  const handleCancel = async () => {
    try {
      setActionLoading('cancel');
      await cancelSubscription(true); // Cancel at period end
      setShowCancelConfirm(false);
    } catch (err) {
     // 
    } finally {
      setActionLoading('');
    }
  };

  const handleReactivate = async () => {
    try {
      setActionLoading('reactivate');
      await reactivateSubscription();
    } catch (err) {
      //console.error('Reactivation failed:', err); 
    } finally {
      setActionLoading('');
    }
  };

  const handleRefresh = async () => {
    try {
      setActionLoading('refresh');
      await refreshSubscription();
    } catch (err) {
      //console.error('Refresh failed:', err);
    } finally {
      setActionLoading('');
    }
  };

  const getUpgradeOptions = () => {
    return getAllPlans().filter(plan => 
      canUpgrade(plan.id) && !plan.requiresContact
    );
  };

  const getDowngradeOptions = () => {
    return getAllPlans().filter(plan => 
      canDowngrade(plan.id)
    );
  };

  const formatNextBilling = () => {
    if (!subscription?.currentPeriodEnd) return 'Unknown';
    
    const date = new Date(subscription.currentPeriodEnd);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Warnings/Alerts */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          {warnings.map((warning, index) => (
            <Alert 
              key={index}
              variant={warning.severity === 'error' ? 'destructive' : 'default'}
              className={warning.severity === 'warning' ? 'border-orange-200 bg-orange-50' : ''}
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{warning.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="link"
              size="sm"
              onClick={clearError}
              className="ml-2 p-0 h-auto text-red-600 hover:text-red-700"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {currentPlan.tier === 'consultant' && <Crown className="w-5 h-5 text-orange-500" />}
                {currentPlan.displayName}
              </CardTitle>
              <CardDescription>{currentPlan.description}</CardDescription>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon(subscription?.status)}
                <Badge className={getStatusColor(subscription?.status)}>
                  {getStatusText(subscription?.status)}
                </Badge>
              </div>
              {subscription && (
                <p className="text-sm text-gray-600">
                  {isOnTrial ? 'Trial ends' : 'Renews'} in {daysUntilExpiry} days
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Pricing Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Current Price</p>
              <p className="text-2xl font-bold text-gray-900">
                {currentPlan.price.monthly === 0 
                  ? 'Free' 
                  : formatPrice(subscription?.amount || currentPlan.price.monthly)
                }
              </p>
              <p className="text-sm text-gray-500">
                {currentPlan.billingCycle ? `per ${currentPlan.billingCycle}` : ''}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700">Next Billing</p>
              <p className="text-lg font-semibold text-gray-900">{formatNextBilling()}</p>
              <p className="text-sm text-gray-500">
                {subscription?.billingCycle === 'annual' ? 'Annual billing' : 'Monthly billing'}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700">Status</p>
              <p className="text-lg font-semibold text-gray-900">
                {isActive ? 'Active' : 'Inactive'}
              </p>
              <p className="text-sm text-gray-500">
                {isCanceled ? 'Cancels at period end' : 'Auto-renewing'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {/* Upgrade Button */}
            {getUpgradeOptions().length > 0 && (
              <Button
                onClick={() => navigate('/pricing')}
                className="flex items-center gap-2"
                variant="default"
              >
                <ArrowUpCircle className="w-4 h-4" />
                Upgrade Plan
              </Button>
            )}

            {/* Manage Billing */}
            <Button
              onClick={() => navigate('/profile')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Manage Billing
            </Button>

            {/* Cancel/Reactivate */}
            {subscription && subscription.planId !== 'demo' && (
              <>
                {isCanceled ? (
                  <Button
                    onClick={handleReactivate}
                    disabled={actionLoading === 'reactivate'}
                    variant="outline"
                    className="flex items-center gap-2 text-green-600 border-green-300 hover:bg-green-50"
                  >
                    {actionLoading === 'reactivate' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Reactivate
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowCancelConfirm(true)}
                    variant="outline"
                    className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel Subscription
                  </Button>
                )}
              </>
            )}

            {/* Refresh */}
            <Button
              onClick={handleRefresh}
              disabled={actionLoading === 'refresh'}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${actionLoading === 'refresh' ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plan Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
          <CardDescription>Your current plan limits and usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">∞</p>
              <p className="text-sm text-gray-600">Surveys per month</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">∞</p>
              <p className="text-sm text-gray-600">Exports per month</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">∞</p>
              <p className="text-sm text-gray-600">Max facilities</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
            <p className="text-xs text-blue-600 font-medium mb-2">Note:</p>
            <p className="text-xs text-blue-600">
              All features are available to all users. The backend will handle any data restrictions based on your subscription plan.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Available Upgrades */}
      {getUpgradeOptions().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Upgrades</CardTitle>
            <CardDescription>Upgrade to access more features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getUpgradeOptions().map(plan => (
                <div key={plan.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{plan.displayName}</h4>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {formatPrice(plan.price.monthly)}/month
                    </p>
                    <Button
                      onClick={() => handleUpgrade(plan.id)}
                      size="sm"
                      className="mt-2"
                    >
                      Upgrade
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Cancel Subscription</CardTitle>
              <CardDescription>
                Are you sure you want to cancel your subscription?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  Your subscription will remain active until {formatNextBilling()}, 
                  then you'll be moved to the demo plan.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleCancel}
                  disabled={actionLoading === 'cancel'}
                  variant="destructive"
                  className="flex-1"
                >
                  {actionLoading === 'cancel' ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Cancel Subscription
                </Button>
                <Button
                  onClick={() => setShowCancelConfirm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Keep Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager; 