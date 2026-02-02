import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Crown, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  ArrowUpCircle,
  Settings
} from 'lucide-react';
import useSubscription from '../hooks/useSubscription';
import { formatPrice } from '../../util/plan.js';

const SubscriptionStatusWidget = ({ 
  variant = 'compact', // 'compact', 'detailed'
  showActions = true 
}) => {
  const navigate = useNavigate();
  const {
    subscription,
    currentPlan,
    isActive,
    isOnTrial,
    isPastDue,
    isCanceled,
    daysUntilExpiry,
    warnings
  } = useSubscription(); 

  const getStatusIcon = () => {
    if (isPastDue) return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    if (isOnTrial) return <Clock className="w-4 h-4 text-blue-500" />;
    if (isActive) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    return <AlertTriangle className="w-4 h-4 text-gray-500" />;
  };

  const getStatusBadge = () => {
    if (currentPlan.id === 'demo') {
      return <Badge variant="outline" className="text-xs">Demo</Badge>;
    }
    if (isPastDue) {
      return <Badge variant="destructive" className="text-xs">Past Due</Badge>;
    }
    if (isOnTrial) {
      return <Badge className="bg-blue-100 text-blue-800 text-xs">Trial</Badge>;
    }
    if (currentPlan.tier === 'consultant') {
      return <Badge className="bg-orange-100 text-orange-800 text-xs">Pro</Badge>;
    }
    if (currentPlan.tier === 'professional') {
      return <Badge className="bg-green-100 text-green-800 text-xs">Pro</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Free</Badge>;
  };

  const getPrimaryAction = () => {
    if (currentPlan.id === 'demo') {
      return (
        <Button size="sm" onClick={() => navigate('/pricing')}>
          <Crown className="w-3 h-3 mr-1" />
          Upgrade
        </Button>
      );
    }
    if (isPastDue) {
      return (
        <Button size="sm" variant="destructive" onClick={() => navigate('/profile')}>
          <AlertTriangle className="w-3 h-3 mr-1" />
          Fix Payment
        </Button>
      );
    }
    if (isOnTrial && daysUntilExpiry <= 3) {
      return (
        <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={() => navigate('/pricing')}>
          <ArrowUpCircle className="w-3 h-3 mr-1" />
          Upgrade Now
        </Button>
      );
    }
    return null;
  };

  if (variant === 'compact') {
    const primaryAction = getPrimaryAction();
    const hasUrgentWarning = warnings.some(w => w.severity === 'error' || daysUntilExpiry <= 3);

    return (
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 hidden sm:inline">
            {currentPlan.displayName}
          </span>
          {getStatusBadge()}
        </div>
        
        {hasUrgentWarning && primaryAction && (
          <div className="ml-2">
            {primaryAction}
          </div>
        )}
        
        {!hasUrgentWarning && showActions && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate('/profile')}
            className="ml-2"
          >
            <Settings className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  // Detailed variant
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h3 className="font-medium text-gray-900">{currentPlan.displayName}</h3>
          {getStatusBadge()}
        </div>
        {currentPlan.tier !== 'demo' && (
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">
              {formatPrice(subscription?.amount || currentPlan.price.monthly)}
            </p>
            <p className="text-xs text-gray-500">
              /{subscription?.billingCycle || 'month'}
            </p>
          </div>
        )}
      </div>

      {/* Warning messages */}
      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.slice(0, 2).map((warning, index) => (
            <p key={index} className={`text-xs ${
              warning.severity === 'error' ? 'text-red-600' : 'text-orange-600'
            }`}>
              {warning.message}
            </p>
          ))}
        </div>
      )}

      {/* Status info */}
      {subscription && daysUntilExpiry > 0 && (
        <p className="text-xs text-gray-600">
          {isOnTrial ? 'Trial ends' : isCanceled ? 'Subscription ends' : 'Renews'} in {daysUntilExpiry} days
        </p>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex items-start flex-col gap-2 pt-2 border-t border-gray-100">
          {getPrimaryAction()}
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/profile')}
            className="flex-1"
          >
            <Settings className="w-3 h-3 mr-1" />
            Manage
          </Button>
          
          {currentPlan.id === 'demo' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/pricing')}
              className="flex-1"
            >
              View Plans
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatusWidget; 