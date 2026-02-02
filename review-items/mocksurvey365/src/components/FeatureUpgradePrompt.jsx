import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Crown, Lock, ArrowRight } from 'lucide-react';

const FeatureUpgradePrompt = ({ 
  feature, 
  message, 
  currentPlan = 'demo', 
  showUpgradeButton = true,
  className = '' 
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  return (
    <Card className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 ${className}`}>
      <CardHeader className="text-center pb-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="h-8 w-8 text-blue-600" />
        </div>
        <CardTitle className="text-xl text-gray-900">
          {feature} is Locked
        </CardTitle>
        <CardDescription className="text-gray-600">
          {message || `Upgrade your plan to access ${feature}`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="text-center space-y-4">
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Crown className="h-4 w-4 text-yellow-500" />
            <span>Current Plan: {currentPlan === 'demo' ? 'Free Demo' : currentPlan}</span>
          </div>
        </div>
        
        {showUpgradeButton && (
          <div className="space-y-3">
            <Button 
              onClick={handleUpgrade}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              View Available Plans
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-gray-500">
              Unlock all features with a premium subscription
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeatureUpgradePrompt; 