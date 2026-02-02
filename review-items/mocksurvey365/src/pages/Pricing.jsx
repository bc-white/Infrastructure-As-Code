import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionAPI } from '../service/api';
import { Menu, X as CloseIcon } from 'lucide-react';
import { 
  getPublicPlans, 
  getPlanPrice, 
  getPlanBadge, 
  formatPrice,
  calculateAnnualSavings
} from '../../util/plan.js';
import { 
  Check, 
  X, 
  Zap, 
  Building2, 
  Users, 
  Crown,
  ArrowRight,
  Star,
  Shield,
  TrendingUp,
  FileText,
  Download,
  Bot,
  BarChart3
} from 'lucide-react';

const Pricing = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  // Only annual billing is supported
  const [apiPlans, setApiPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTestimonialsClick = (e) => {
    e.preventDefault();
    // Navigate to home page first, then scroll to testimonials
    navigate('/');
    setTimeout(() => {
      const testimonialsSection = document.getElementById('testimonials');
      if (testimonialsSection) {
        testimonialsSection.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  // Get plans from utility (fallback)
  const fallbackPlans = getPublicPlans();

  // Fetch subscription plans from API
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        const response = await subscriptionAPI.getAllSubscriptions();
        if (response.status) {
          setApiPlans(response.data);
        } else {
          setError('Failed to fetch subscription plans');
        }
      } catch (err) {
  
        setError('Failed to load subscription plans');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  // Use API plans if available, otherwise fallback to utility plans
  const plans = apiPlans.length > 0 ? apiPlans : fallbackPlans;

  // Icon mapping for plans
  const planIcons = {
    demo: Zap,
    monthly: FileText,
    annual: Star,
    consultant: Building2,
    'per-report': Download,
    'Nursing Home / Facility Subscription': Building2,
    'Consultant / Business Subscription': Users,
    'Enterprise / Multi-Consultant Firm Plan': Crown
  };

  // Feature display mapping
  const getFeatureDisplay = (plan) => {
    // If it's an API plan, use the included features from the API
    if (plan.included && Array.isArray(plan.included)) {
      const features = plan.included.map(item => ({
        name: item.point,
        included: true
      }));
      
      // Add restrictions as non-included features
      if (plan.restrictions && Array.isArray(plan.restrictions)) {
        plan.restrictions.forEach(item => {
          features.push({
            name: item.point,
            included: false,
            restriction: true
          });
        });
      }
      
      return features;
    }
    
    // Fallback to hardcoded features for utility plans
    const featureMap = {};
    return featureMap[plan._id] || [];
  };

  const handlePlanSelect = (plan) => {
   
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (plan._id === 'demo') {
      return; // Already on demo
    }

    if (plan._id === 'consultant') {
      // Redirect to contact sales
      window.location.href = 'mailto:sales@mocksurvey365.com?subject=Consultant License Inquiry';
      return;
    }

    if (plan.pricingModel === 'Pay-per-use. $199 per plan of correction submission.') {
      navigate(`/checkout/${plan._id}`, { 
        state: { 
          planId: plan._id, 
          planName: plan.plan,
          price: plan.yearlyPrice,
          type: 'one-time'
        } 
      });
      return;
    }

    // Handle "Contact us" plans (including plans without yearlyPrice)
    if (plan.pricingModel === 'Contact us' || plan.pricingModel === 'Custom – Contact Us' || plan.yearlyPrice === undefined) {
      // Redirect to contact sales for Enterprise plans
      window.location.href = 'mailto:sales@mocksurvey365.com?subject=Enterprise Plan Inquiry';
      return;
    }

    // For API subscription plans, use yearly price only
    let selectedPrice;
    if (plan.yearlyPrice !== undefined) {
      selectedPrice = plan.yearlyPrice;
    } else {
      selectedPrice = getPlanPrice(plan._id, 'annual');
    }

    // For subscription plans, go to checkout
    navigate(`/checkout/${plan._id}`, { 
      state: { 
        planId: plan._id, 
        planName: plan.plan || plan.name,
        price: selectedPrice,
        billingCycle: 'annual',
        trialDays: plan.trialDays,
        // Pass API plan data if available
        ...(plan.monthlyPrice !== undefined && {
          monthlyPrice: plan.monthlyPrice,
          yearlyPrice: plan.yearlyPrice,
          pricingModel: plan.pricingModel,
          included: plan.included,
          restrictions: plan.restrictions
        })
      } 
    });
  };

  const getCurrentUserPlan = () => {
    if (!user) return 'demo';
    return user.subscription?.planId || 'demo';
  };

  const formatPlanPrice = (plan) => {
    // Handle "Contact us" plans (including plans without yearlyPrice)
    if (plan.pricingModel === 'Contact us' || plan.pricingModel === 'Custom – Contact Us' || plan.yearlyPrice === undefined) {
      return '';
    }
    
    // Handle API plans - use yearly price only
    if (plan.yearlyPrice !== undefined) {
      if (plan.yearlyPrice === 0) return 'Free';
      return formatPrice(plan.yearlyPrice);
    }
    
    // Handle utility plans - use annual pricing
    const price = getPlanPrice(plan._id, 'annual');
    if (plan.payAsYouGo) {
      return formatPrice(price);
    }
    if (price === 0) {
      return 'Free';
    }
    return formatPrice(price);
  };

  const getPriceSubtext = (plan) => {
    // Handle API plans
    if (plan.pricingModel) {
      if (plan.pricingModel === 'Contact us' || plan.pricingModel === 'Custom – Contact Us' || plan.yearlyPrice === undefined) {
        return 'Contact for pricing';
      }
      if (plan.pricingModel === 'Pay-per-use. $199 per plan of correction submission.') {
        return 'per submission';
      }
      return 'per year';
    }
    
    // Handle utility plans
    if (plan.payAsYouGo) {
      return plan.price.unit;
    }
    if (plan.price.monthly === 0) {
      return 'Forever';
    }
    return 'per year';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Modern Navigation Bar */}
      <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-lg rounded-[40px]">
        <div className="px-6 py-3">
          <div className="flex justify-between items-center h-12">
            {/* Logo */}
            <div className="flex-shrink-0">
              <img 
                src="/logo.png" 
                alt="MockSurvey365 Logo" 
                className="w-8 h-8 object-contain"
              />
            </div>
            
            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-1 mx-8">
              <a 
                href="/" 
                className="relative px-4 py-2 text-sm font-medium text-gray-700 hover:text-sky-800 transition-all duration-200 rounded-lg hover:bg-sky-50 group"
              >
                Home
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-sky-800 scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
              </a>
              <a 
                href="/pricing" 
                className="relative px-4 py-2 text-sm font-medium text-sky-800 transition-all duration-200 rounded-lg bg-sky-50 group"
              >
                Pricing
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-sky-800 scale-x-100 transition-transform duration-200"></span>
              </a>
              <a 
                href="#testimonials" 
                onClick={handleTestimonialsClick}
                className="relative px-4 py-2 text-sm font-medium text-gray-700 hover:text-sky-800 transition-all duration-200 rounded-lg hover:bg-sky-50 group"
              >
                Testimonials
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-sky-800 scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
              </a>
            </div>
            
            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center space-x-3">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/login')}
                className="text-gray-700 hover:text-sky-800 hover:bg-sky-50/50 px-4 py-2 transition-all duration-200"
              >
                Login
              </Button>
              <Button 
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-sky-800 to-sky-700 hover:from-sky-700 hover:to-sky-600 text-white px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 rounded-full"
              >
                Get Started
              </Button>
            </div>
            
            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/login')}
                className="text-gray-700 hover:text-sky-800 hover:bg-sky-50/50 px-3 py-2"
              >
                Login
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-700 hover:text-sky-800 hover:bg-sky-50/50 rounded-lg"
              >
                {isMobileMenuOpen ? <CloseIcon size={20} /> : <Menu size={20} />}
              </Button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-xl rounded-b-[40px]">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <a 
                  href="/" 
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-sky-800 hover:bg-sky-50/50 rounded-lg transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </a>
                <a 
                  href="/pricing" 
                  className="block px-3 py-2 text-base font-medium text-sky-800 bg-sky-50/50 rounded-lg transition-colors duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </a>
                <a 
                  href="#testimonials" 
                  onClick={(e) => {
                    handleTestimonialsClick(e);
                    setIsMobileMenuOpen(false);
                  }}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-sky-800 hover:bg-sky-50/50 rounded-lg transition-colors duration-200"
                >
                  Testimonials
                </a>
                <div className="pt-2">
                  <Button 
                    onClick={() => navigate('/register')}
                    className="w-full bg-gradient-to-r from-sky-800 to-sky-700 hover:from-sky-700 hover:to-sky-600 text-white shadow-lg rounded-full"
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 mt-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Plans and Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Choose the perfect plan for your facility or consulting business. All plans are billed annually.
          </p>
        </div>


        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">Loading subscription plans...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-gray-600">Using fallback plans</p>
          </div>
        )}

                {/* Pricing Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => {
              const planKey = plan.plan || plan._id || plan.name;
              const isCurrentPlan = getCurrentUserPlan() === planKey;
              const isPopular = index === 1; // Make middle card popular
              const isEnterprise = plan.pricingModel === 'Contact us' || plan.pricingModel === 'Custom – Contact Us' || plan.yearlyPrice === undefined;
              const features = getFeatureDisplay(plan);

            return (
              <div 
                key={plan._id || plan._id} 
                className={`relative rounded-2xl p-8 transition-all duration-200 flex flex-col h-full ${
                  isEnterprise 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-white border border-gray-200'
                } ${isPopular ? 'ring-2 ring-orange-500 ring-offset-2' : ''}`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                      <span className="mr-1">🔥</span>
                      Popular
                    </div>
                  </div>
                )}

                {/* Plan Title */}
                <div className="text-center mb-8">
                  <h3 className={`text-2xl font-bold mb-2 ${
                    isEnterprise ? 'text-white' : 'text-gray-900'
                  }`}>
                    {plan.plan || plan.name}
                  </h3>
                  
                  {/* Pricing */}
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center">
                      <span className={`text-4xl font-bold ${
                        isEnterprise ? 'text-white' : 'text-gray-900'
                      }`}>
                        {formatPlanPrice(plan)}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${
                      isEnterprise ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {getPriceSubtext(plan)}
                    </p>
                  </div>

                  {/* Description */}
                 
                </div>

                {/* Features */}
                <div className="space-y-4 mb-6 flex-grow">
                  {/* Included features from API (full list) */}
                  {Array.isArray(plan.included) && plan.included.length > 0 && (
                    <div className="space-y-3">
                      {plan.included.map((item, idx) => (
                        <div key={`inc-${plan._id}-${idx}`} className="flex items-start space-x-3">
                          <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                            isEnterprise ? 'text-white' : 'text-gray-400'
                          }`} />
                          <span className={`text-sm ${
                            isEnterprise ? 'text-white' : 'text-gray-700'
                          }`}>
                            {item.point}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Restrictions as non-included items */}
                  {Array.isArray(plan.restrictions) && plan.restrictions.length > 0 && (
                    <div className="mt-4">
                     
                      <div className="space-y-2">
                        {plan.restrictions.map((item, idx) => (
                          <div key={`res-${plan._id}-${idx}`} className="flex items-start space-x-3">
                            <X className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                              isEnterprise ? 'text-gray-300' : 'text-gray-300'
                            }`} />
                            <span className={`text-sm ${
                              isEnterprise ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              {item.point}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Usage limits and additional survey notes */}
                  {(plan.usageLimit || plan.additionalSurvey) && (
                    <div className="mt-4 p-3">
                      {plan.usageLimit && (
                        <p className={`text-sm ${isEnterprise ? 'text-gray-200' : 'text-gray-700'}`}>
                          {/* <span className="font-medium">Usage limit:</span> */}
                          {plan.usageLimit}
                        </p>
                      )}
                      {plan.additionalSurvey && (
                        <p className={`text-sm mt-1 ${isEnterprise ? 'text-gray-200' : 'text-gray-700'}`}>
                          {/* <span className="font-medium">Additional survey:</span>  */}
                          {plan.additionalSurvey}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => handlePlanSelect(plan)}
                  disabled={isCurrentPlan}
                  className={`w-full py-3 font-medium rounded-lg transition-all mt-auto ${
                    isCurrentPlan
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : isEnterprise
                        ? 'bg-white text-gray-900 hover:bg-gray-100'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isCurrentPlan ? (
                    'Current Plan'
                  ) : (
                    <span>
                      {plan.pricingModel === 'Contact us' ? 'Get started with Enterprise' : 
                       plan.pricingModel === 'Pay-per-use. $199 per plan of correction submission.' ? 'Buy Plan of Correction' :
                       plan.requiresContact ? 'Contact Sales' : 
                       plan.payAsYouGo ? 'Buy Single Report' :
                       plan.trialDays ? 'Get started for free' : 'Get started with Pro'}
                    </span>
                  )}
                </Button>
              </div>
            );
          })}
          </div>
        )}

       
        
      </div>
    </div>
  );
};

export default Pricing; 