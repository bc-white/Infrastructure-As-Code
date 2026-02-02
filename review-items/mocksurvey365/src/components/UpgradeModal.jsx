import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useFeatureGate } from '../contexts/FeatureGateContext';
import { 
  Crown, 
  Zap, 
  Check, 
  X, 
  ArrowRight, 
  Star,
  FileText,
  Building2,
  Download,
  Sparkles,
  TrendingUp
} from 'lucide-react';

const UpgradeModal = ({ 
  isOpen, 
  onClose, 
  feature, 
  title, 
  message, 
  customContent = null 
}) => {
  const navigate = useNavigate();
  const { getUpgradeMessage, currentPlan, getRemainingUsage } = useFeatureGate();
  
  const upgradeInfo = getUpgradeMessage(feature);
  const displayTitle = title || upgradeInfo.title;
  const displayMessage = message || upgradeInfo.message;
  const remaining = getRemainingUsage();

  const handleUpgrade = (planId) => {
    onClose();
    navigate('/pricing', { state: { highlightPlan: planId } });
  };

  const handleViewPlans = () => {
    onClose();
    navigate('/pricing');
  };

  // Quick plan recommendations based on feature
  const getRecommendedPlans = () => {
    return [
      {
        id: 'monthly',
        name: 'Professional Monthly',
        price: 49,
        period: 'month',
        icon: FileText,
        badge: 'Most Popular',
        badgeColor: 'bg-green-100 text-green-800',
        features: [
          'Unlimited surveys',
          'PDF & Word exports',
          'AI deficiency suggestions',
          'Plan of Correction tools',
          'Email support'
        ],
        highlighted: upgradeInfo.suggestedPlan === 'monthly'
      },
      {
        id: 'annual',
        name: 'Professional Annual',
        price: 39,
        period: 'month',
        originalPrice: 49,
        icon: Star,
        badge: 'Best Value',
        badgeColor: 'bg-purple-100 text-purple-800',
        features: [
          'Everything in Monthly',
          'Save $120/year',
          'Advanced analytics',
          'Custom templates',
          'Priority support'
        ],
        highlighted: upgradeInfo.suggestedPlan === 'annual'
      },
      {
        id: 'consultant',
        name: 'Consultant License',
        price: 149,
        period: 'month',
        icon: Building2,
        badge: 'Advanced',
        badgeColor: 'bg-orange-100 text-orange-800',
        features: [
          'Multi-facility dashboard',
          'Cross-facility benchmarking',
          'White-label reports',
          'Team collaboration',
          'Phone support'
        ],
        highlighted: upgradeInfo.suggestedPlan === 'consultant'
      }
    ];
  };

  const recommendedPlans = getRecommendedPlans();

  const renderUsageLimits = () => {
    if (currentPlan === 'demo') {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-5 h-5 text-amber-600" />
            <h3 className="font-medium text-amber-900">Current Usage (Demo Plan)</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-amber-700">Surveys this month:</span>
              <span className="ml-2 font-semibold">{remaining.surveys === 'unlimited' ? '∞' : remaining.surveys} remaining</span>
            </div>
            <div>
              <span className="text-amber-700">Report exports:</span>
              <span className="ml-2 font-semibold text-red-600">Not available</span>
            </div>
          </div>
          <p className="text-xs text-amber-700 mt-2">
            Upgrade to unlock unlimited surveys and professional exports
          </p>
        </div>
      );
    }
    
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full">
              <Crown className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
            {displayTitle}
          </DialogTitle>
          
          <DialogDescription className="text-gray-600 text-lg max-w-2xl mx-auto">
            {customContent || displayMessage}
          </DialogDescription>
        </DialogHeader>

        {renderUsageLimits()}

        {/* Plan Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {recommendedPlans.map((plan) => {
            const IconComponent = plan.icon;
            const isHighlighted = plan.highlighted;

            return (
              <Card 
                key={plan.id}
                className={`relative transition-all duration-200 hover:shadow-lg ${
                  isHighlighted 
                    ? 'border-2 border-sky-500 shadow-lg transform scale-105' 
                    : 'border border-gray-200 hover:border-gray-300'
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-sky-600 text-white px-3 py-1">
                      Recommended
                    </Badge>
                  </div>
                )}

                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <div className="flex justify-center mb-3">
                      <div className={`p-2 rounded-lg ${
                        isHighlighted ? 'bg-sky-100' : 'bg-gray-100'
                      }`}>
                        <IconComponent className={`w-6 h-6 ${
                          isHighlighted ? 'text-sky-600' : 'text-gray-600'
                        }`} />
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-lg text-gray-900 mb-1">
                      {plan.name}
                    </h3>
                    
                    <Badge className={plan.badgeColor}>
                      {plan.badge}
                    </Badge>

                    <div className="mt-3">
                      <div className="flex items-baseline justify-center">
                        <span className="text-3xl font-bold text-gray-900">
                          ${plan.price}
                        </span>
                        <span className="text-gray-500 ml-1">/{plan.period}</span>
                      </div>
                      {plan.originalPrice && (
                        <p className="text-sm text-gray-500">
                          <span className="line-through">${plan.originalPrice}</span>
                          <span className="text-green-600 ml-2 font-medium">Save 20%</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Unlimited Surveys</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">PDF & Word Exports</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">AI Deficiency Suggestions</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">Complete Resource Library</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">No Watermarks</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    className={`w-full ${
                      isHighlighted
                        ? 'bg-sky-600 hover:bg-sky-700 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {isHighlighted ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Upgrade Now</span>
                      </div>
                    ) : (
                      'Select Plan'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            Feature Comparison
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-900">Feature</th>
                  <th className="text-center py-2 font-medium text-gray-600">Demo</th>
                  <th className="text-center py-2 font-medium text-gray-900">Professional</th>
                  <th className="text-center py-2 font-medium text-gray-900">Consultant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-2 text-gray-700">Survey Creation</td>
                  <td className="text-center py-2">2/month</td>
                  <td className="text-center py-2"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-2"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-700">Report Exports</td>
                  <td className="text-center py-2"><X className="w-4 h-4 text-red-500 mx-auto" /></td>
                  <td className="text-center py-2"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-2"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-700">AI Deficiency Suggestions</td>
                  <td className="text-center py-2"><X className="w-4 h-4 text-red-500 mx-auto" /></td>
                  <td className="text-center py-2"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-2"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-700">Multi-Facility Management</td>
                  <td className="text-center py-2"><X className="w-4 h-4 text-red-500 mx-auto" /></td>
                  <td className="text-center py-2"><X className="w-4 h-4 text-red-500 mx-auto" /></td>
                  <td className="text-center py-2"><Check className="w-4 h-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-700">Priority Support</td>
                  <td className="text-center py-2"><X className="w-4 h-4 text-red-500 mx-auto" /></td>
                  <td className="text-center py-2">Email</td>
                  <td className="text-center py-2">Phone + Email</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Success Stories */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Join 500+ Healthcare Professionals</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900 mb-1">92%</div>
              <div className="text-blue-700">Improved survey readiness</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900 mb-1">4.8/5</div>
              <div className="text-blue-700">Customer satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-900 mb-1">$50K+</div>
              <div className="text-blue-700">Average penalty savings</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
          <Button 
            onClick={handleViewPlans}
            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-medium h-12"
          >
            <div className="flex items-center justify-center space-x-2">
              <Crown className="w-5 h-5" />
              <span>View All Plans</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onClose}
            className="sm:w-32 h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Maybe Later
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="text-center pt-4 text-xs text-gray-500">
          <p>🔒 Secure payment by Stripe • 💯 30-day money-back guarantee • 🎯 Cancel anytime</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal; 