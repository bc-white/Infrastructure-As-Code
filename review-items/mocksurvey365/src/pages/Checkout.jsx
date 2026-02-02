import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";

import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
import { useAuth } from "../contexts/AuthContext";
import {
  getPlan,
  formatPrice,
  SUBSCRIPTION_STATUS,
  PLAN_IDS,
} from "../../util/plan.js";
import { subscriptionAPI as apiSubscriptionAPI } from "../service/api.js";
import {
  CheckCircle,
  AlertCircle,
  Check,
} from "lucide-react";



const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { planId } = useParams();

  const [planData, setPlanData] = useState(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [planError, setPlanError] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');



  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState("payment"); // 'payment', 'processing', 'success'
  const [paymentResult, setPaymentResult] = useState(null);

  const [paypalError, setPaypalError] = useState("");
  const [applePayError, setApplePayError] = useState("");
  const [isApplePayAvailable, setIsApplePayAvailable] = useState(false);

  // Fetch plan data by ID
  useEffect(() => {
    const fetchPlanData = async () => {
      try {
        setIsLoadingPlan(true);
        setPlanError(null);

        // First try to get plan from URL params
        if (planId) {
          // Get plan from local plan definitions first
          const plan = getPlan(planId);
          if (plan && plan.id !== PLAN_IDS.DEMO) {
            // Transform plan data to match expected format
            const transformedPlan = {
              planId: plan.id,
              planName: plan.displayName || plan.name,
              price: plan.price.monthly || plan.price.annual || 0,
              billingCycle: plan.billingCycle || 'monthly',
              trialDays: plan.trialDays || null,
              type: plan.oneTime ? 'one-time' : 'subscription',
              description: plan.description,
              tier: plan.tier,
              popular: plan.popular || false
            };
            setPlanData(transformedPlan);
            setIsLoadingPlan(false);
            return;
          }

          // If not found locally, try to fetch from API
          try {
            const apiResponse = await apiSubscriptionAPI.getSubscriptionById(planId);
            // Handle the nested data structure from the API response
            const apiPlan = apiResponse?.data || apiResponse;
            
            if (apiPlan && apiPlan._id) {
              // Determine billing cycle based on pricing model
              const isYearly = apiPlan.pricingModel?.toLowerCase().includes('year') || 
                              apiPlan.pricingModel?.toLowerCase().includes('annual');
              const isMonthly = apiPlan.pricingModel?.toLowerCase().includes('month');
              
              // Handle "Contact us" plans
              if (apiPlan.pricingModel === 'Contact us') {
                // Redirect to contact sales for Enterprise plans
                window.location.href = 'mailto:sales@mocksurvey365.com?subject=Enterprise Plan Inquiry';
                return;
              }

              // Select appropriate price based on billing cycle
              const selectedPrice = isYearly ? apiPlan.yearlyPrice : 
                                  isMonthly ? apiPlan.monthlyPrice : 
                                  apiPlan.yearlyPrice || apiPlan.monthlyPrice || 0;
              
              // Transform API plan data to match expected format
              const transformedPlan = {
                planId: apiPlan._id,
                planName: apiPlan.plan || 'Subscription Plan',
                price: selectedPrice,
                billingCycle: isYearly ? 'annual' : isMonthly ? 'monthly' : 'annual',
                trialDays: null, // Not in API response
                type: 'subscription',
                description: apiPlan.pricingModel || '',
                tier: 'professional',
                popular: false,
                // Additional fields from API response
                included: apiPlan.included || [],
                restrictions: apiPlan.restrictions || [],
                usageLimit: apiPlan.usageLimit || '',
                additionalSurvey: apiPlan.additionalSurvey || '',
                yearlyPrice: apiPlan.yearlyPrice,
                monthlyPrice: apiPlan.monthlyPrice,
                pricingModel: apiPlan.pricingModel,
                status: apiPlan.status
              };
              setPlanData(transformedPlan);
              setIsLoadingPlan(false);
              return;
            }
          } catch (apiError) {
           
            // Continue to fallback options
          }
        }

        // Fallback to location state (for backward compatibility)
        if (location.state) {
          const stateData = location.state;
          // Set billing cycle from state if available
          if (stateData.billingCycle) {
            setBillingCycle(stateData.billingCycle);
          }
          
          // Update price based on billing cycle if API plan data is available
          if (stateData.monthlyPrice !== undefined && stateData.yearlyPrice !== undefined) {
            const selectedPrice = stateData.billingCycle === 'annual' ? stateData.yearlyPrice : stateData.monthlyPrice;
            setPlanData({
              ...stateData,
              price: selectedPrice
            });
          } else {
            setPlanData(stateData);
          }
          setIsLoadingPlan(false);
          return;
        }

        // If no plan found, redirect to pricing
        setPlanError('Plan not found');
        navigate("/pricing");
      } catch (error) {
     
        setPlanError('Failed to load plan details');
        navigate("/pricing");
      } finally {
        setIsLoadingPlan(false);
      }
    };

    fetchPlanData();
  }, [planId, location.state, navigate]);

  // Check Apple Pay availability
  useEffect(() => {
    const checkApplePayAvailability = () => {
      if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
        setIsApplePayAvailable(true);
      } else {
        setIsApplePayAvailable(false);
      }
    };

    checkApplePayAvailability();
  }, []);

  // Show loading state while fetching plan
  if (isLoadingPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Plan Details
          </h2>
          <p className="text-gray-500 text-sm">Please wait a moment...</p>
        </div>
      </div>
    );
  }

  // Show error state if plan loading failed
  if (planError || !planData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Plan Not Found
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            {planError || 'The requested plan could not be found.'}
          </p>
          <Button
            onClick={() => navigate("/pricing")}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            Back to Pricing
          </Button>
        </div>
      </div>
    );
  }





  const handleBillingCycleChange = (newCycle) => {
    setBillingCycle(newCycle);
    
    // Update plan data with new price if API plan data is available
    if (planData && planData.monthlyPrice !== undefined && planData.yearlyPrice !== undefined) {
      const newPrice = newCycle === 'annual' ? planData.yearlyPrice : planData.monthlyPrice;
      setPlanData(prev => ({
        ...prev,
        price: newPrice,
        billingCycle: newCycle
      }));
    }
  };

  // PayPal handlers
  const createPayPalOrder = (data, actions) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            value: planData.price.toString(),
            currency_code: "USD",
          },
          description: `${planData.planName} - ${planData.type === "one-time" ? "One-time payment" : `Billed ${billingCycle}`}`,
        },
      ],
      application_context: {
        brand_name: "MockSurvey365",
        landing_page: "BILLING",
        user_action: "PAY_NOW",
      },
    });
  };

  const onPayPalApprove = async (data, actions) => {
    try {
      setIsProcessing(true);
      setCurrentStep("processing");
      setError("");
      setPaypalError("");

      const details = await actions.order.capture();


      
      // Log PayPal success response data for endpoint creation
      const paypalSuccessResponse = {
        event: "paypal_payment_success",
        timestamp: new Date().toISOString(),
        user: {
          id: user?.id,
          email: user?.email,
          firstName: user?.firstName,
          lastName: user?.lastName
        },
        plan: {
          planId: planData.planId,
          planName: planData.planName,
          price: planData.price,
          billingCycle: planData.billingCycle,
          type: planData.type,
          trialDays: planData.trialDays
        },
        paypal: {
          orderId: data.orderID,
          payerId: data.payerID,
          paymentId: details.id,
          status: details.status,
          amount: details.purchase_units?.[0]?.payments?.captures?.[0]?.amount,
          payer: details.payer,
          createTime: details.create_time,
          updateTime: details.update_time,
          links: details.links
        },
        payment: {
          amount: planData.price,
          currency: "USD",
          description: `${planData.planName} - ${planData.type === "one-time" ? "One-time payment" : `Billed ${planData.billingCycle}`}`
        }
      };

  
      
      // Handle successful payment
      let result;
      if (planData.type === "one-time") {
        result = {
          id: details.id,
          status: "succeeded",
          amount: planData.price,
        };
        setPaymentResult({
          type: "one-time",
          amount: planData.price,
          planName: planData.planName,
          paymentId: details.id,
        });
      } else {
        result = {
          id: details.id,
          status: "active",
          current_period_end: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        };
        setPaymentResult({
          type: "subscription",
          planName: planData.planName,
          subscriptionId: details.id,
          billingCycle: planData.billingCycle,
          amount: planData.price,
          trialDays: planData.trialDays,
        });
      }

      // Update user subscription
      const plan = getPlan(planData.planId);
      const now = Date.now();

      const updatedUser = {
        ...user,
        subscription: {
          planId: planData.planId,
          planName: planData.planName,
          status: planData.trialDays
            ? SUBSCRIPTION_STATUS.TRIAL
            : SUBSCRIPTION_STATUS.ACTIVE,
          billingCycle: planData.billingCycle,
          amount: planData.price,
          subscriptionId: result.id,
          currentPeriodEnd:
            result.current_period_end || now + 30 * 24 * 60 * 60 * 1000,
          trialEnd: planData.trialDays
            ? now + planData.trialDays * 24 * 60 * 60 * 1000
            : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      updateUser(updatedUser);
      setCurrentStep("success");
    } catch (err) {
    
      
      // Log PayPal error response data for endpoint creation
      const paypalErrorResponse = {
        event: "paypal_payment_error",
        timestamp: new Date().toISOString(),
        user: {
          id: user?.id,
          email: user?.email,
          firstName: user?.firstName,
          lastName: user?.lastName
        },
        plan: {
          planId: planData.planId,
          planName: planData.planName,
          price: planData.price,
          billingCycle: planData.billingCycle,
          type: planData.type
        },
        error: {
          message: err.message,
          code: err.code || "PAYMENT_FAILED",
          details: err.details || null,
          stack: err.stack
        }
      };


      
      setPaypalError(err.message || "Payment failed. Please try again.");
      setCurrentStep("payment");
    } finally {
      setIsProcessing(false);
    }
  };

  const onPayPalError = (err) => {
 
    
    // Log PayPal error response data for endpoint creation
    const paypalErrorResponse = {
      event: "paypal_payment_error",
      timestamp: new Date().toISOString(),
      user: {
        id: user?.id,
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName
      },
      plan: {
        planId: planData?.planId,
        planName: planData?.planName,
        price: planData?.price,
        billingCycle: planData?.billingCycle,
        type: planData?.type
      },
      error: {
        message: err.message || "PayPal payment failed",
        code: err.code || "PAYPAL_ERROR",
        details: err.details || null,
        type: "paypal_sdk_error"
      }
    };

 
    setPaypalError("PayPal payment failed. Please try again or use a different payment method.");
  };

  const onPayPalCancel = (data) => {

    
    // Log PayPal cancellation response data for endpoint creation
    const paypalCancelResponse = {
      event: "paypal_payment_cancelled",
      timestamp: new Date().toISOString(),
      user: {
        id: user?.id,
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName
      },
      plan: {
        planId: planData?.planId,
        planName: planData?.planName,
        price: planData?.price,
        billingCycle: planData?.billingCycle,
        type: planData?.type
      },
      cancellation: {
        reason: "user_cancelled",
        data: data,
        timestamp: new Date().toISOString()
      }
    };

    
    setPaypalError("Payment was cancelled. You can try again or use a different payment method.");
  };

  // Apple Pay handlers
  const handleApplePay = async () => {
    try {
      setApplePayError("");
      setIsProcessing(true);
      setCurrentStep("processing");

      // Create Apple Pay payment request
      const paymentRequest = {
        countryCode: 'US',
        currencyCode: 'USD',
        supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
        merchantCapabilities: ['supports3DS'],
        total: {
          label: planData.planName,
          amount: planData.price.toString(),
        },
        lineItems: [
          {
            label: planData.planName,
            amount: planData.price.toString(),
          }
        ],
        merchantIdentifier: 'merchant.com.mocksurvey365', // You'll need to replace this with your actual merchant ID
      };

      const session = new ApplePaySession(3, paymentRequest);

      // Handle payment authorization
      session.onvalidatemerchant = async (event) => {
        try {
          // In a real implementation, you would validate the merchant with your backend
          // For now, we'll simulate a successful validation
          const validationURL = event.validationURL;
      
          
          // Simulate merchant validation (replace with actual backend call)
          const merchantSession = {
            epochTimestamp: Date.now(),
            expiresAt: Date.now() + 300000, // 5 minutes
            merchantSessionIdentifier: 'merchant_session_' + Math.random().toString(36).substr(2, 9),
            nonce: Math.random().toString(36).substr(2, 9),
            merchantIdentifier: 'merchant.com.mocksurvey365',
            domainName: window.location.hostname,
            displayName: 'MockSurvey365',
            signature: 'mock_signature_' + Math.random().toString(36).substr(2, 9)
          };

          session.completeMerchantValidation(merchantSession);
        } catch (error) {
       
          session.abort();
          setApplePayError('Payment validation failed. Please try again.');
          setIsProcessing(false);
          setCurrentStep("payment");
        }
      };

      // Handle payment authorization
      session.onpaymentauthorized = async (event) => {
        try {
          const { payment } = event;
          
      
          
          // Simulate payment processing delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Simulate successful payment
          const paymentResult = {
            id: 'apple_pay_' + Math.random().toString(36).substr(2, 9),
            status: 'success',
            amount: planData.price,
          };

          // Update user subscription (same logic as PayPal)
          const plan = getPlan(planData.planId);
          const now = Date.now();

          const updatedUser = {
            ...user,
            subscription: {
              planId: planData.planId,
              planName: planData.planName,
              status: planData.trialDays
                ? SUBSCRIPTION_STATUS.TRIAL
                : SUBSCRIPTION_STATUS.ACTIVE,
              billingCycle: planData.billingCycle,
              amount: planData.price,
              subscriptionId: paymentResult.id,
              currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
              trialEnd: planData.trialDays
                ? now + planData.trialDays * 24 * 60 * 60 * 1000
                : null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          };

          updateUser(updatedUser);

          setPaymentResult({
            type: planData.type === "one-time" ? "one-time" : "subscription",
            planName: planData.planName,
            paymentId: paymentResult.id,
            amount: planData.price,
            billingCycle: planData.billingCycle,
            trialDays: planData.trialDays,
          });

          session.completePayment(ApplePaySession.STATUS_SUCCESS);
          
          // Log Apple Pay success response data for endpoint creation
          const applePaySuccessResponse = {
            event: "apple_pay_payment_success",
            timestamp: new Date().toISOString(),
            user: {
              id: user?.id,
              email: user?.email,
              firstName: user?.firstName,
              lastName: user?.lastName
            },
            plan: {
              planId: planData.planId,
              planName: planData.planName,
              price: planData.price,
              billingCycle: planData.billingCycle,
              type: planData.type,
              trialDays: planData.trialDays
            },
            applePay: {
              paymentId: paymentResult.id,
              status: paymentResult.status,
              amount: paymentResult.amount,
              payment: payment
            },
            payment: {
              amount: planData.price,
              currency: "USD",
              description: `${planData.planName} - ${planData.type === "one-time" ? "One-time payment" : `Billed ${planData.billingCycle}`}`
            }
          };

        
          setCurrentStep("success");
        } catch (error) {
         
          
          // Log Apple Pay error response data for endpoint creation
          const applePayErrorResponse = {
            event: "apple_pay_payment_error",
            timestamp: new Date().toISOString(),
            user: {
              id: user?.id,
              email: user?.email,
              firstName: user?.firstName,
              lastName: user?.lastName
            },
            plan: {
              planId: planData.planId,
              planName: planData.planName,
              price: planData.price,
              billingCycle: planData.billingCycle,
              type: planData.type
            },
            error: {
              message: error.message,
              code: error.code || "APPLE_PAY_FAILED",
              details: error.details || null,
              stack: error.stack
            }
          };

        
          
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          setApplePayError('Payment failed. Please try again.');
          setIsProcessing(false);
          setCurrentStep("payment");
        }
      };

      // Handle session cancellation
      session.oncancel = () => {
     
        
        // Log Apple Pay cancellation response data for endpoint creation
        const applePayCancelResponse = {
          event: "apple_pay_payment_cancelled",
          timestamp: new Date().toISOString(),
          user: {
            id: user?.id,
            email: user?.email,
            firstName: user?.firstName,
            lastName: user?.lastName
          },
          plan: {
            planId: planData?.planId,
            planName: planData?.planName,
            price: planData?.price,
            billingCycle: planData?.billingCycle,
            type: planData?.type
          },
          cancellation: {
            reason: "user_cancelled",
            timestamp: new Date().toISOString()
          }
        };

     
        
        setApplePayError('Payment was cancelled.');
        setIsProcessing(false);
        setCurrentStep("payment");
      };

      // Start the Apple Pay session
      session.begin();

    } catch (error) {
    
      
      // Log Apple Pay initialization error response data for endpoint creation
      const applePayInitErrorResponse = {
        event: "apple_pay_initialization_error",
        timestamp: new Date().toISOString(),
        user: {
          id: user?.id,
          email: user?.email,
          firstName: user?.firstName,
          lastName: user?.lastName
        },
        plan: {
          planId: planData?.planId,
          planName: planData?.planName,
          price: planData?.price,
          billingCycle: planData?.billingCycle,
          type: planData?.type
        },
        error: {
          message: error.message,
          code: error.code || "APPLE_PAY_INIT_FAILED",
          details: error.details || null,
          stack: error.stack,
          type: "initialization_error"
        }
      };

  
      
      setApplePayError('Apple Pay is not available or failed to initialize.');
      setIsProcessing(false);
      setCurrentStep("payment");
    }
  };



  const renderPaymentForm = () => (
    <div className="bg-white ">
      {/* Header */}
      <div className="px-8 py-6">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink to="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink to="/pricing">Pricing</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Checkout</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

       
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* Left: Plan Selection */}
        <div className="lg:col-span-2 p-8">
          <div className="space-y-6">
            {/* Plan Selection Header */}
            <div>
              {/* <h2 className="text-sm text-gray-500 mb-1">
                Register For MockSurvey365
              </h2> */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {planData.planName} {planData.pricingModel === 'Contact us' ? '' : `For ${formatPrice(planData.price)}`}
              </h1>
              {planData.description && (
                <p className="text-gray-600">
                  {planData.description}
                </p>
              )}
            </div>

            {/* Billing Cycle Toggle - Only show if plan has both monthly and yearly prices and is not "Contact us" */}
            {planData.monthlyPrice !== undefined && planData.yearlyPrice !== undefined && 
             planData.pricingModel !== 'Contact us' && (
              <div className="flex justify-center mb-6">
                <div className="bg-gray-100 rounded-lg p-1">
                  <div className="flex">
                    <button
                      onClick={() => handleBillingCycleChange('monthly')}
                      className={`px-6 py-2 rounded-md font-medium text-sm transition-all cursor-pointer ${
                        billingCycle === 'monthly'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => handleBillingCycleChange('annual')}
                      className={`px-6 py-2 rounded-md font-medium text-sm transition-all cursor-pointer relative ${
                        billingCycle === 'annual'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Annual
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Save {Math.round((1 - planData.yearlyPrice / (planData.monthlyPrice * 12)) * 100)}%
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Plan Card */}
            <div className="border border-gray-200 rounded-xl p-6 bg-white">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-5 w-5 rounded-full bg-gray-900 flex items-center justify-center mr-3">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {planData.planName}
                    </h3>
                   
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {planData.pricingModel === 'Contact us' ? 'Contact us' : formatPrice(planData.price)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {planData.pricingModel === 'Contact us' ? 'Contact for pricing' :
                     planData.type === "one-time"
                      ? "One-time payment"
                      : `Billed ${planData.billingCycle}`}
                  </div>
                </div>
              </div>

              {/* Plan Description - Only show if included features exist */}
              {planData.included && planData.included.length > 0 && (
                <div className="space-y-2 text-sm text-gray-700">
                  {planData.included.map((item, index) => (
                    <p key={index} className="flex items-start">
                      <Check className="h-4 w-4 text-gray-900 mr-2 mt-0.5 flex-shrink-0" />
                      {item.point}
                    </p>
                  ))}
                </div>
              )}

              {/* Restrictions */}
              {planData.restrictions && planData.restrictions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Important Notes:</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    {planData.restrictions.map((restriction, index) => (
                      <p key={index} className="flex items-start">
                        <AlertCircle className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                        {restriction.point}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {(planData.usageLimit || planData.additionalSurvey) && (
                <div className="mt-4">
                  {planData.usageLimit && (
                    <p className="text-sm text-gray-700">
                      {/* <span className="font-medium">Usage limit:</span>  */}
                      {planData.usageLimit}
                    </p>
                  )}
                  {planData.additionalSurvey && (
                    <p className="text-sm text-gray-700 mt-1">
                      {/* <span className="font-medium">Additional survey:</span>  */}
                      {planData.additionalSurvey}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Payment Form */}
        <div className="lg:col-span-1 bg-gray-50 p-8">
          <div className="space-y-6">
            {/* PayPal Payment */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Pay with PayPal
              </h3>
              
              {paypalError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{paypalError}</AlertDescription>
                </Alert>
              )}

              <div className="paypal-buttons-container">
                <PayPalButtons
                  createOrder={createPayPalOrder}
                  onApprove={onPayPalApprove}
                  onError={onPayPalError}
                  onCancel={onPayPalCancel}
                  style={{
                    layout: "vertical",
                    color: "blue",
                    shape: "rect",
                    label: "paypal",
                    height: 45,
                  }}
                  disabled={isProcessing}
                />
                </div>
            </div>

            <div className="text-center text-sm text-gray-500">or</div>

                        {/* Alternative Payment Methods */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Alternative Payment
              </h3>

              {applePayError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{applePayError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                {/* Apple Pay Button */}
                {isApplePayAvailable && (
                  <Button
                    onClick={handleApplePay}
                    disabled={isProcessing}
                    className="w-full h-12 bg-black text-white hover:bg-gray-800 font-medium"
                  >
                    <div className="flex items-center justify-center space-x-3">
                      <svg
                        className="w-5 h-5 flex-shrink-0"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                      <span>Pay with Apple Pay</span>
                      </div>
                  </Button>
                )}

                {/* Contact Sales Button */}
                <Button
                  variant="outline"
                  onClick={() => window.location.href = 'mailto:sales@mocksurvey365.com?subject=Alternative Payment Method Request'}
                  className="w-full"
                >
                  Contact Sales for Other Payment Methods
                </Button>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Order summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">
                          {planData.planName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {planData.pricingModel === 'Contact us' ? 'Contact for pricing' :
                           planData.pricingModel || 
                           (planData.type === "one-time"
                            ? "One-time payment"
                            : `Billed ${billingCycle}`)}
                        </div>
                      </div>
                      <div className="font-medium text-gray-900">
                        {planData.pricingModel === 'Contact us' ? 'Contact us' : formatPrice(planData.price)}
                      </div>
                    </div>

                    {planData.trialDays && (
                      <div className="flex justify-between items-center">
                        <div className="text-gray-600">Discount (-50%)</div>
                        <div className="text-gray-600">
                          -{formatPrice(planData.price)}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between items-center">
                        <div className="font-semibold text-gray-900">
                          Total due
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                          {planData.pricingModel === 'Contact us' ? 'Contact us' :
                           planData.trialDays
                            ? formatPrice(0)
                            : formatPrice(planData.price)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center py-16">
      <div className="flex justify-center mb-6">
        <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Processing Payment
      </h2>
      <p className="text-gray-500 text-sm">Please wait a moment...</p>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-16">
      <div className="flex justify-center mb-6">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-7 h-7 text-gray-900" />
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-gray-900 mb-3">
        Payment Successful!
      </h2>

      <p className="text-gray-500 mb-8 text-sm leading-relaxed">
        {paymentResult?.type === "subscription"
          ? `Welcome to ${paymentResult.planName}!`
          : `You now have access to generate professional reports.`}
      </p>

      {paymentResult?.trialDays && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md mb-8">
          <p className="text-sm text-gray-800 font-medium">
            Your {paymentResult.trialDays}-day free trial has started!
          </p>
        </div>
      )}

      <div className="space-y-3">
        <Button
          onClick={() => navigate("/dashboard")}
          className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium transform hover:-translate-y-0.5 transition-all duration-300"
        >
          Go to Dashboard
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate("/mocksurvey365")}
          className="w-full h-12 text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300 font-medium transition-all duration-200"
        >
          Create Your First Survey
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === "payment" && renderPaymentForm()}
        {currentStep === "processing" && renderProcessing()}
        {currentStep === "success" && renderSuccess()}
      </div>
    </div>
  );
};

export default Checkout;
