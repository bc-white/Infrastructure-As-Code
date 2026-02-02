import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { 
  Clock, 
  Crown, 
  X, 
  ArrowRight, 
  CheckCircle,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice, getPlan } from '../../util/plan.js';

const TrialNotification = ({ 
  variant = 'banner', // 'banner', 'card', 'inline'
  showDismiss = true,
  className = ''
}) => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuth();
  
  // Get subscription data directly from user object
  const subscription = user?.subscription;
  const currentPlan = subscription?.planId ? getPlan(subscription.planId) : getPlan('demo');
  const isOnTrial = false; // No trial info in current data structure
  const daysUntilExpiry = 0; // No expiry info in current data structure
  const warnings = []; // No warnings in current data structure

  
  // Calculate urgency levels first (needed for useEffect)
  const isUrgent = false; // No urgency for demo users
  const isExpiringSoon = false; // No expiry for demo users
  
  // Show for demo users only (no trial users in current structure)
  const shouldShow = currentPlan.id === 'demo' && !dismissed;
  
  
  // Check if previously dismissed (but show again if more than 24 hours have passed)
  useEffect(() => {
    const stored = localStorage.getItem('trial_notification_dismissed');
    if (stored) {
      try {
        const dismissalData = JSON.parse(stored);
        const hoursSinceDismissal = (Date.now() - dismissalData.timestamp) / (1000 * 60 * 60);
        
        // Show again if more than 24 hours since dismissal
        if (hoursSinceDismissal >= 24) {
          setDismissed(false);
        }
      } catch (e) {
        // Invalid stored data, ignore
      }
    }
  }, []);
  
  if (!shouldShow || !user) {
    return null;
  }

  const handleUpgrade = () => {
    navigate('/pricing', {
      state: {
        highlightPlan: 'monthly',
        fromTrial: false
      }
    });
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Store dismissal in localStorage with expiry
    const dismissalData = {
      dismissed: true,
      timestamp: Date.now(),
      daysLeft: 0
    };
    localStorage.setItem('trial_notification_dismissed', JSON.stringify(dismissalData));
  };

  const getTrialIcon = () => {
    if (currentPlan.id === 'demo') return <Crown className="w-5 h-5 text-green-500" />;
    return <Zap className="w-5 h-5 text-blue-500" />;
  };

  const getTrialColor = () => {
    if (currentPlan.id === 'demo') return 'border-green-200 bg-green-50';
    return 'border-blue-200 bg-blue-50';
  };

  const getTrialTitle = () => {
    if (currentPlan.id === 'demo') {
      return 'You\'re using the free demo version';
    }
    return 'Upgrade to unlock premium features';
  };

  const getTrialMessage = () => {
    if (currentPlan.id === 'demo') {
      return 'Upgrade to unlock unlimited surveys, remove watermarks, and access all premium features.';
    }
    return 'Enjoying MockSurvey365? Upgrade anytime to unlock unlimited access and advanced features.';
  };

  if (variant === 'banner') {
    return (
      <div className={`relative ${getTrialColor()} border-l-4 ${
        currentPlan.id === 'demo' ? 'border-l-green-500' :
        isUrgent ? 'border-l-orange-500' : 'border-l-blue-500'
      } ${className}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 space-y-3 sm:space-y-0">
          <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
            {/* {getTrialIcon()} */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {getTrialTitle()}
              </p>
              <p className="text-xs md:text-sm text-gray-600 mt-1">
                {getTrialMessage()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={handleUpgrade}
              className={`flex-1 sm:flex-none ${
                currentPlan.id === 'demo' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
              } text-white text-xs md:text-sm`}
            >
              <span className="hidden sm:inline">Upgrade Now</span>
              <span className="sm:hidden">Upgrade</span>
              <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1" />
            </Button>
            
            {showDismiss && currentPlan.id === 'demo' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-gray-500 hover:text-gray-700 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={`${getTrialColor()} border ${className}`}>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start justify-between space-y-4 sm:space-y-0">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              {getTrialIcon()}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900">
                    {getTrialTitle()}
                  </h3>
                  <Badge variant="outline" className="text-xs w-fit">
                    {currentPlan.id === 'demo' ? 'Demo' : 'Upgrade'}
                  </Badge>
                </div>
                <p className="text-sm md:text-base text-gray-600 mb-4">
                  {getTrialMessage()}
                </p>
                
                {/* Trial benefits reminder */}
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-gray-700">What you'll keep with a paid plan:</p>
                  <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-xs md:text-sm">Unlimited surveys</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-xs md:text-sm">PDF & Word exports</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-xs md:text-sm">AI suggestions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-xs md:text-sm">No watermarks</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
                  <Button onClick={handleUpgrade} className="bg-blue-600 hover:bg-blue-700 text-white text-sm md:text-base">
                    <Crown className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Upgrade to Pro - {formatPrice(49)}/month</span>
                    <span className="sm:hidden">Upgrade to Pro</span>
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/pricing')} className="text-sm md:text-base">
                    View All Plans
                  </Button>
                </div>
              </div>
            </div>
            
            {showDismiss && currentPlan.id === 'demo' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-400 hover:text-gray-600 self-start sm:self-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Inline variant
  return (
    <Alert className={`${getTrialColor()} ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {getTrialIcon()}
          <AlertDescription className="flex-1 min-w-0">
            <span className="font-medium text-sm">{getTrialTitle()}</span>
            <span className="ml-2 text-xs md:text-sm">{getTrialMessage()}</span>
          </AlertDescription>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button size="sm" onClick={handleUpgrade} className="flex-1 sm:flex-none text-xs md:text-sm">
            <span className="hidden sm:inline">Upgrade</span>
            <span className="sm:hidden">Upgrade</span>
          </Button>
          {showDismiss && currentPlan.id === 'demo' && (
            <Button size="sm" variant="ghost" onClick={handleDismiss} className="flex-shrink-0">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};

export default TrialNotification; 