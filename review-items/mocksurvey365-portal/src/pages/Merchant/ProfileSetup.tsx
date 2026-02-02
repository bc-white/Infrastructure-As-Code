import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/FormSelect";
import { resolveToken } from "@/utils/resolveToken";
import { tokens } from "@/styles/theme";
import { getTheme } from "@/styles/getTheme";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const ProfileSetup = () => {
  const theme = getTheme();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Business Info & Contact
    businessName: "",
    businessType: "",
    businessRegistrationNumber: "",
    taxIdentificationNumber: "",
    businessDescription: "",
    industryCategory: "",
    yearsInOperation: 0,
    businessAddress: "",
    digitalAddress: "",
    country: "",
    businessPhoneNumber: "",
    businessEmail: "",
    website: "",
    
    // Step 2: Upload Verification Docs
    businessRegistrationCertificate: null as File | null,
    taxClearanceCertificate: null as File | null,
    ownerIdDocument: null as File | null,
    storefrontPhoto: null as File | null,
    
    // Step 3: Create Account Credentials
    enableTwoFactor: false,
    twoFactorPhone: "",
    
    // Step 4: Preferences & Review
    preferredNotificationChannel: "email",
    operatingHoursStart: "09:00",
    operatingHoursEnd: "17:00",
    settlementFrequency: "weekly",
    marketingConsent: false,
    termsAgreement: false,
    privacyPolicyConsent: false,
  });

  const businessTypes = [
    { value: "retail", label: "Retail" },
    { value: "restaurant", label: "Restaurant" },
    { value: "ecommerce", label: "E-commerce" },
    { value: "service", label: "Service Provider" },
    { value: "healthcare", label: "Healthcare" },
    { value: "education", label: "Education" },
    { value: "entertainment", label: "Entertainment" },
    { value: "other", label: "Other" },
  ];

  const industryCategories = [
    { value: "fashion", label: "Fashion & Apparel" },
    { value: "food", label: "Food & Beverage" },
    { value: "technology", label: "Technology" },
    { value: "beauty", label: "Beauty & Wellness" },
    { value: "automotive", label: "Automotive" },
    { value: "home", label: "Home & Garden" },
    { value: "sports", label: "Sports & Recreation" },
    { value: "travel", label: "Travel & Tourism" },
    { value: "finance", label: "Financial Services" },
    { value: "other", label: "Other" },
  ];

  const countries = [
    { value: "gh", label: "Ghana" },
    { value: "ng", label: "Nigeria" },
    { value: "ke", label: "Kenya" },
    { value: "za", label: "South Africa" },
    { value: "us", label: "United States" },
    { value: "uk", label: "United Kingdom" },
    { value: "other", label: "Other" },
  ];

  const validateStep1 = () => {
    return (
      formData.businessName &&
      formData.businessType &&
      formData.businessRegistrationNumber &&
      formData.taxIdentificationNumber &&
      formData.businessDescription &&
      formData.industryCategory
    );
  };

  const validateStep2 = () => {
    return (
      formData.businessAddress &&
      formData.country &&
      formData.businessPhoneNumber &&
      formData.businessEmail
    );
  };

  const validateStep3 = () => {
    return (
      formData.businessRegistrationCertificate &&
      formData.ownerIdDocument
    );
  };

  const validateStep4 = () => {
    return true; // 2FA is optional, so this step is always valid
  };

  const validateStep5 = () => {
    return (
      formData.preferredNotificationChannel &&
      formData.settlementFrequency &&
      formData.termsAgreement &&
      formData.privacyPolicyConsent
    );
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    } else if (currentStep === 3 && validateStep3()) {
      setCurrentStep(4);
    } else if (currentStep === 4 && validateStep4()) {
      setCurrentStep(5);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 4) {
      setCurrentStep(3);
    } else if (currentStep === 5) {
      setCurrentStep(4);
    }
  };

  const handleSubmit = () => {
    if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4() || !validateStep5()) {
      toast.error("Please fill in all required fields");
      return;
    }

    toast.success("Account Setup Completed Successfully", {
      description: "Your merchant account has been created and is being reviewed",
      duration: 3000,
    });
    
    // Navigate to dashboard
    navigate("/dashboard/merchant");
  };

  const handleCancel = () => {
    navigate("/dashboard/merchant");
  };

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{
        background: resolveToken(
          theme === "dark"
            ? tokens.Dark.Surface.Primary
            : tokens.Light.Surface.Primary
        ),
      }}
    >
      {/* Left Sidebar */}
      <div 
        className="hidden lg:block w-80 p-6 sticky top-0 h-screen overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${resolveToken(
            theme === "dark"
              ? tokens.Dark.Gradient["Gradient Grey 25"]
              : tokens.Light.Gradient["Gradient Grey 25"]
          )} 0%, ${resolveToken(
            theme === "dark"
              ? tokens.Dark.Gradient["Gradient White"]
              : tokens.Light.Gradient["Gradient White"]
          )} 100%)`,
          borderRadius: resolveToken(
            theme === "dark"
              ? tokens.Dark.Radius["Radius-lg"]
              : tokens.Light.Radius["Radius-lg"]
          ),
        }}
      >
        <div className="mb-8">
          <h2 
            className="text-[20px] font-semibold mb-2"
            style={{
              color: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Typography.Heading
                  : tokens.Light.Typography.Heading
              ), 
            }}
          >
            Merchant Account Setup
          </h2>
        </div>

        <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* Step 1 */}
          <div 
            className="flex items-start gap-3 cursor-pointer hover:opacity-80"
            onClick={() => setCurrentStep(1)}
          > 
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
              style={{
                background: currentStep === 1 ? resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button.Primary
                    : tokens.Light.Button.Primary
                ) : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Surface.Foreground
                    : tokens.Light.Surface.Foreground
                ),
                color: currentStep === 1 ? resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button["Primary Text"]
                    : tokens.Light.Button["Primary Text"]
                ) : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                ),
                borderColor: currentStep === 1 ? "transparent" : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Stroke["Stroke-02"]
                    : tokens.Light.Stroke["Stroke-02"]
                ),
                border: currentStep === 1 ? "none" : "1px solid",
              }}
            >
              1
            </div>
            <div>
              <h3 
                className="font-medium mb-1"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                Business Information
              </h3>
              <p 
                className="text-sm"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                }}
              >
                Basic business details and information.
              </p>
            </div>
          </div>

          {/* Step 2 - Contact Information */}
          <div 
            className={`flex items-start gap-3 ${
              !validateStep1()
                ? 'cursor-not-allowed opacity-50' 
                : 'cursor-pointer hover:opacity-80'
            }`}
            onClick={() => {
              if (validateStep1()) {
                setCurrentStep(2);
              }
            }}
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
              style={{
                background: currentStep === 2 ? resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button.Primary
                    : tokens.Light.Button.Primary
                ) : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Surface.Foreground
                    : tokens.Light.Surface.Foreground
                ),
                color: currentStep === 2 ? resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button["Primary Text"]
                    : tokens.Light.Button["Primary Text"]
                ) : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                ),
                borderColor: currentStep === 2 ? "transparent" : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Stroke["Stroke-02"]
                    : tokens.Light.Stroke["Stroke-02"]
                ),
                border: currentStep === 2 ? "none" : "1px solid",
              }}
            >
              2
            </div>
            <div>
              <h3 
                className="font-medium mb-1"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                Contact Information
              </h3>
              <p 
                className="text-sm"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                }}
              >
                {!validateStep1() 
                  ? "Complete Step 1 to continue" 
                  : "Business address and contact details."
                }
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div 
            className={`flex items-start gap-3 ${
              (!validateStep1() || !validateStep2())
                ? 'cursor-not-allowed opacity-50' 
                : 'cursor-pointer hover:opacity-80'
            }`}
            onClick={() => {
              if (validateStep1() && validateStep2()) {
                setCurrentStep(3);
              }
            }}
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
              style={{
                background: currentStep === 3 ? resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button.Primary
                    : tokens.Light.Button.Primary
                ) : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Surface.Foreground
                    : tokens.Light.Surface.Foreground
                ),
                color: currentStep === 3 ? resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button["Primary Text"]
                    : tokens.Light.Button["Primary Text"]
                ) : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                ),
                borderColor: currentStep === 3 ? "transparent" : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Stroke["Stroke-02"]
                    : tokens.Light.Stroke["Stroke-02"]
                ),
                border: currentStep === 3 ? "none" : "1px solid",
              }}
            >
              3
            </div>
            <div>
              <h3 
                className="font-medium mb-1"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                Upload Verification Docs
              </h3>
              <p 
                className="text-sm"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                }}
              >
                {(!validateStep1() || !validateStep2())
                  ? "Complete previous steps to continue" 
                  : "Upload required verification documents."
                }
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div 
            className={`flex items-start gap-3 ${
              (!validateStep1() || !validateStep2() || !validateStep3())
                ? 'cursor-not-allowed opacity-50' 
                : 'cursor-pointer hover:opacity-80'
            }`}
            onClick={() => {
              if (validateStep1() && validateStep2() && validateStep3()) {
                setCurrentStep(4);
              }
            }}
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
              style={{
                background: currentStep === 4 ? resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button.Primary
                    : tokens.Light.Button.Primary
                ) : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Surface.Foreground
                    : tokens.Light.Surface.Foreground
                ),
                color: currentStep === 4 ? resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button["Primary Text"]
                    : tokens.Light.Button["Primary Text"]
                ) : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                ),
                borderColor: currentStep === 4 ? "transparent" : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Stroke["Stroke-02"]
                    : tokens.Light.Stroke["Stroke-02"]
                ),
                border: currentStep === 4 ? "none" : "1px solid",
              }}
            >
              4
            </div>
            <div>
              <h3 
                className="font-medium mb-1"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                Security Preferences
              </h3>
              <p 
                className="text-sm"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                }}
              >
                {(!validateStep1() || !validateStep2() || !validateStep3())
                  ? "Complete previous steps to continue" 
                  : "Configure security settings and preferences."
                }
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div 
            className={`flex items-start gap-3 ${
              (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4())
                ? 'cursor-not-allowed opacity-50' 
                : 'cursor-pointer hover:opacity-80'
            }`}
            onClick={() => {
              if (validateStep1() && validateStep2() && validateStep3() && validateStep4()) {
                setCurrentStep(5);
              }
            }}
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
              style={{
                background: currentStep === 5 ? resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button.Primary
                    : tokens.Light.Button.Primary
                ) : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Surface.Foreground
                    : tokens.Light.Surface.Foreground
                ),
                color: currentStep === 5 ? resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button["Primary Text"]
                    : tokens.Light.Button["Primary Text"]
                ) : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                ),
                borderColor: currentStep === 5 ? "transparent" : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Stroke["Stroke-02"]
                    : tokens.Light.Stroke["Stroke-02"]
                ),
                border: currentStep === 5 ? "none" : "1px solid",
              }}
            >
              5
            </div>
            <div>
              <h3 
                className="font-medium mb-1"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                Preferences & Review
              </h3>
              <p 
                className="text-sm"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                }}
              >
                {(!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4())
                  ? "Complete previous steps to continue" 
                  : "Set preferences and review your information."
                }
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Step Indicator */}
      <div className="lg:hidden p-4 border-b" style={{
        background: resolveToken(
          theme === "dark"
            ? tokens.Dark.Surface.Secondary
            : tokens.Light.Surface.Secondary
        ),
        borderColor: resolveToken(
          theme === "dark"
            ? tokens.Dark.Stroke["Stroke-02"]
            : tokens.Light.Stroke["Stroke-02"]
        ),
      }}>
        <div className="flex items-center justify-between mb-4">
          <h2 
            className="text-[20px] font-semibold"
            style={{
              color: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Typography.Heading
                  : tokens.Light.Typography.Heading
              ),
            }}
          >
            Merchant Account Setup
          </h2> 
        </div>
        
        <div className="flex items-center gap-2"> 
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`flex-1 h-2 rounded-full ${
                step <= currentStep ? 'opacity-100' : 'opacity-30'
              }`}
              style={{
                background: step <= currentStep ? resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button.Primary
                    : tokens.Light.Button.Primary
                ) : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Surface.Foreground
                    : tokens.Light.Surface.Foreground
                ),
              }}
            />
          ))}
        </div>
        
        <div className="mt-3">
          <h3 
            className="font-medium text-sm"
            style={{
              color: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Typography.Heading
                  : tokens.Light.Typography.Heading
              ),
            }}
          >
            {currentStep === 1 && "Business Information"}
            {currentStep === 2 && "Contact Information"}
            {currentStep === 3 && "Upload Verification Docs"}
            {currentStep === 4 && "Security Preferences"}
            {currentStep === 5 && "Preferences & Review"}
          </h3>
          <p 
            className="text-xs mt-1"
            style={{
              color: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Typography.Subtext
                  : tokens.Light.Typography.Subtext
              ),
            }}
          >
            {currentStep === 1 && "Basic business details and information"}
            {currentStep === 2 && "Business address and contact details"}
            {currentStep === 3 && "Upload required verification documents"}
            {currentStep === 4 && "Configure security settings and preferences"}
            {currentStep === 5 && "Set preferences and review your information"}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <div className="lg:hidden">
            <h1
              className="text-xl font-semibold"
              style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Heading
                    : tokens.Light.Typography.Heading
                ),
              }}
            >
              Merchant Account Setup
            </h1>
          </div>
        </div>

        {/* Form */}
        <div
          className="rounded-2xl p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto border-none"
          style={{
            background: resolveToken(
              theme === "dark"
                ? tokens.Dark.Surface.Primary
                : tokens.Light.Surface.Primary
            ),
            borderRadius: resolveToken(
              theme === "dark"
                ? tokens.Dark.Radius["Radius-sm"]
                : tokens.Light.Radius["Radius-sm"]
            ),
          }}
        >
          {/* Step Content */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <div>
                <h2 
                  className="text-[32px] font-semibold mb-6"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}
                >
                  Business Information
                </h2>
                
                <div className="space-y-6">
                  {/* Business Details */}
                  <div className="space-y-4">
                    <h3 
                      className="text-lg font-medium"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    >
                      Business Details
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label 
                          className="text-sm font-medium mb-2 block"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          Business Name *
                        </label>
                        <Input
                          value={formData.businessName}
                          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                          placeholder="Enter business name"
                        />
                      </div>
                      <div>
                        <label 
                          className="text-sm font-medium mb-2 block"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          Business Type *
                        </label>
                        <FormSelect
                          required={false}
                          optional={false}
                          id="businessType"
                          name="businessType"
                          label=""
                          value={formData.businessType}
                          onChange={(value) => setFormData({ ...formData, businessType: value })}
                          placeholder="Select business type"
                          error=""
                          options={businessTypes}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label 
                          className="text-sm font-medium mb-2 block"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          Registration Number *
                        </label>
                        <Input
                          value={formData.businessRegistrationNumber}
                          onChange={(e) => setFormData({ ...formData, businessRegistrationNumber: e.target.value })}
                          placeholder="Enter registration number"
                        />
                      </div>
                      <div>
                        <label 
                          className="text-sm font-medium mb-2 block"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          Tax ID Number *
                        </label>
                        <Input
                          value={formData.taxIdentificationNumber}
                          onChange={(e) => setFormData({ ...formData, taxIdentificationNumber: e.target.value })}
                          placeholder="Enter TIN"
                        />
                      </div>
                    </div>

                    <div>
                      <label 
                        className="text-sm font-medium mb-2 block"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      >
                        Business Description *
                      </label>
                      <textarea
                        className="w-full p-3 border rounded-lg resize-none"
                        rows={4}
                        value={formData.businessDescription}
                        onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
                        placeholder="Describe what your business does"
                        style={{
                          background: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Surface.Foreground
                              : tokens.Light.Surface.Foreground
                          ),
                          borderColor: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Stroke["Stroke-02"]
                              : tokens.Light.Stroke["Stroke-02"]
                          ),
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label 
                          className="text-sm font-medium mb-2 block"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          Industry Category *
                        </label>
                        <FormSelect
                          required={false}
                          optional={false}
                          id="industryCategory"
                          name="industryCategory"
                          label=""
                          value={formData.industryCategory}
                          onChange={(value) => setFormData({ ...formData, industryCategory: value })}
                          placeholder="Select industry"
                          error=""
                          options={industryCategories}
                        />
                      </div>
                      <div>
                        <label 
                          className="text-sm font-medium mb-2 block"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                            ),
                          }}
                        >
                          Years in Operation
                        </label>
                        <Input
                          type="number"
                          value={formData.yearsInOperation}
                          onChange={(e) => setFormData({ ...formData, yearsInOperation: Number(e.target.value) })}
                          placeholder="Enter years"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8">
              <div>
                <h2 
                  className="text-[32px] font-semibold mb-6"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}
                >
                  Contact Information
                </h2>
                <p 
                  className="text-lg mb-8"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  Provide your business address and contact details.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label 
                    className="text-sm font-medium mb-2 block"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    Business Address *
                  </label>
                  <Input
                    value={formData.businessAddress}
                    onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                    placeholder="Enter full business address"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label 
                      className="text-sm font-medium mb-2 block"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    >
                      Digital Address
                    </label>
                    <Input
                      value={formData.digitalAddress}
                      onChange={(e) => setFormData({ ...formData, digitalAddress: e.target.value })}
                      placeholder="Enter GPS coordinates"
                    />
                  </div>
                  <div>
                    <label 
                      className="text-sm font-medium mb-2 block"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    >
                      Country *
                    </label>
                    <FormSelect
                      required={false}
                      optional={false}
                      id="country"
                      name="country"
                      label=""
                      value={formData.country}
                      onChange={(value) => setFormData({ ...formData, country: value })}
                      placeholder="Select country"
                      error=""
                      options={countries}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label 
                      className="text-sm font-medium mb-2 block"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    >
                      Business Phone *
                    </label>
                    <Input
                      value={formData.businessPhoneNumber}
                      onChange={(e) => setFormData({ ...formData, businessPhoneNumber: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label 
                      className="text-sm font-medium mb-2 block"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    >
                      Business Email *
                    </label>
                    <Input
                      type="email"
                      value={formData.businessEmail}
                      onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                      placeholder="Enter business email"
                    />
                  </div>
                </div>

                <div>
                  <label 
                    className="text-sm font-medium mb-2 block"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    Website
                  </label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="Enter website URL"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8">
              <div>
                <h2 
                  className="text-[32px] font-semibold mb-6"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}
                >
                  Upload Verification Documents
                </h2>
                <p 
                  className="text-lg mb-8"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  Upload the required verification documents for your business.
                </p>
              </div>

              <div className="space-y-6">
                {/* Business Registration Certificate */}
                <div>
                  <label 
                    className="text-sm font-medium mb-2 block"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    Business Registration Certificate *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="space-y-2">
                      <div className="text-gray-500">
                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-600">
                        <label
                              style={{
                               color: resolveToken(
                                 theme === "dark"
                                   ? tokens.Dark.Typography.Heading
                                   : tokens.Light.Typography.Heading
                               ),
                             }}
                          htmlFor="business-registration" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500"
                          >
                           <span>Upload business registration certificate</span>
                           <input 
                             id="business-registration" 
                             name="business-registration" 
                             type="file" 
                             className="sr-only" 
                             accept=".pdf,.jpg,.jpeg,.png"
                             onChange={(e) => {
                               const file = e.target.files?.[0] || null;
                               setFormData({ ...formData, businessRegistrationCertificate: file });
                             }}
                           />
                         </label>
                         <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
                    </div>
                  </div>
                  {formData.businessRegistrationCertificate && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
                        ✓ {formData.businessRegistrationCertificate.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Owner ID Document */}
                <div>
                  <label 
                    className="text-sm font-medium mb-2 block"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    Owner/Director ID Document *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="space-y-2">
                      <div className="text-gray-500">
                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-600">
                        <label
                              style={{
                                 color: resolveToken(
                                   theme === "dark"
                                     ? tokens.Dark.Typography.Heading
                                     : tokens.Light.Typography.Heading
                                 ),
                               }} 
                          htmlFor="owner-id" className="relative cursor-pointer rounded-md font-medium">
                           <span>Upload ID document (Passport, Driver's License, etc.)</span>
                           <input 
                             id="owner-id" 
                             name="owner-id" 
                             type="file" 
                             className="sr-only" 
                             accept=".pdf,.jpg,.jpeg,.png"
                             onChange={(e) => {
                               const file = e.target.files?.[0] || null;
                               setFormData({ ...formData, ownerIdDocument: file });
                             }}
                           />
                         </label>
                         <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
                    </div>
                  </div>
                  {formData.ownerIdDocument && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
                        ✓ {formData.ownerIdDocument.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Tax Clearance Certificate (Optional) */}
                <div>
                  <label 
                    className="text-sm font-medium mb-2 block"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    Tax Clearance Certificate (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="space-y-2">
                      <div className="text-gray-500">
                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-600">
                        <label 
                              style={{
                               color: resolveToken(
                                 theme === "dark"
                                   ? tokens.Dark.Typography.Heading
                                   : tokens.Light.Typography.Heading
                               ),
                             }}
                          htmlFor="tax-clearance" className="relative cursor-pointer rounded-md font-medium">
                           <span>Upload tax clearance certificate</span>
                           <input 
                             id="tax-clearance" 
                             name="tax-clearance" 
                             type="file" 
                             className="sr-only" 
                             accept=".pdf,.jpg,.jpeg,.png"
                             onChange={(e) => {
                               const file = e.target.files?.[0] || null;
                               setFormData({ ...formData, taxClearanceCertificate: file });
                             }}
                           />
                         </label>
                         <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
                    </div>
                  </div>
                  {formData.taxClearanceCertificate && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
                        ✓ {formData.taxClearanceCertificate.name}
                      </p>
                    </div>
                  )}
                </div>

                {/* Storefront Photo (Optional) */}
                <div>
                  <label 
                    className="text-sm font-medium mb-2 block"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    Storefront / Business Photo (Optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="space-y-2">
                      <div className="text-gray-500">
                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-600">
                        <label 
                              style={{
                               color: resolveToken(
                                 theme === "dark"
                                   ? tokens.Dark.Typography.Heading
                                   : tokens.Light.Typography.Heading
                               ),
                             }}
                          htmlFor="storefront-photo" className="relative cursor-pointer rounded-md font-medium">
                           <span>Upload storefront or business photo</span>
                           <input 
                             id="storefront-photo" 
                             name="storefront-photo" 
                             type="file" 
                             className="sr-only" 
                             accept=".jpg,.jpeg,.png"
                             onChange={(e) => {
                               const file = e.target.files?.[0] || null;
                               setFormData({ ...formData, storefrontPhoto: file });
                             }}
                           />
                         </label>
                         <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">JPG, PNG up to 10MB</p>
                    </div>
                  </div>
                  {formData.storefrontPhoto && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
                        ✓ {formData.storefrontPhoto.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-8">
              <div>
                <h2 
                  className="text-[32px] font-semibold mb-6"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}
                >
                  Security Preferences
                </h2>
                <p 
                  className="text-lg mb-8"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  Configure security settings and preferences for your merchant account.
                </p>
              </div>

              <div className="space-y-6">
                {/* Two-Factor Authentication */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 
                        className="text-lg font-medium"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      >
                        Two-Factor Authentication (2FA)
                      </h3>
                      <p 
                        className="text-sm"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Subtext
                              : tokens.Light.Typography.Subtext
                          ),
                        }}
                      >
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, enableTwoFactor: !formData.enableTwoFactor })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.enableTwoFactor ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.enableTwoFactor ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {formData.enableTwoFactor && (
                    <div>
                      <label 
                        className="text-sm font-medium mb-2 block"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      >
                        Phone Number for 2FA
                      </label>
                      <Input
                        type="tel"
                        value={formData.twoFactorPhone}
                        onChange={(e) => setFormData({ ...formData, twoFactorPhone: e.target.value })}
                        placeholder="Enter phone number for SMS verification"
                      />
                      <p 
                        className="text-xs mt-2"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Subtext
                              : tokens.Light.Typography.Subtext
                          ),
                        }}
                      >
                        We'll send verification codes to this number when you log in.
                      </p>
                    </div>
                  )}
                </div>

                {/* Security Tips */}
                <div 
                  className="p-4 rounded-lg"
                  style={{
                    background: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Surface.Secondary
                        : tokens.Light.Surface.Secondary
                    ),
                  }}
                >
                  <h4 
                    className="font-medium mb-2"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    Security Tips
                  </h4>
                  <ul 
                    className="text-sm space-y-1"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Subtext
                          : tokens.Light.Typography.Subtext
                      ),
                    }}
                  >
                    <li>• Use a unique password that you don't use elsewhere</li>
                    <li>• Include a mix of letters, numbers, and special characters</li>
                    <li>• Enable 2FA for enhanced security</li>
                    <li>• Keep your login credentials secure and don't share them</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-8">
              <div>
                <h2 
                  className="text-[32px] font-semibold mb-6"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}
                >
                  Preferences & Review
                </h2>
                <p 
                  className="text-lg mb-8"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  Set your operational preferences and review your information before submitting.
                </p>
              </div>

              <div className="space-y-6">
                {/* Operational Preferences */}
                <div className="space-y-4">
                  <h3 
                    className="text-lg font-medium"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    Operational Preferences
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label 
                        className="text-sm font-medium mb-2 block"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      >
                        Preferred Notification Channel *
                      </label>
                      <FormSelect
                        required={false}
                        optional={false}
                        id="notificationChannel"
                        name="notificationChannel"
                        label=""
                        value={formData.preferredNotificationChannel}
                        onChange={(value) => setFormData({ ...formData, preferredNotificationChannel: value })}
                        placeholder="Select notification channel"
                        error=""
                        options={[
                          { value: "email", label: "Email" },
                          { value: "sms", label: "SMS" },
                          { value: "both", label: "Both Email & SMS" },
                        ]}
                      />
                    </div>
                    <div>
                      <label 
                        className="text-sm font-medium mb-2 block"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      >
                        Settlement Frequency *
                      </label>
                      <FormSelect
                        required={false}
                        optional={false}
                        id="settlementFrequency"
                        name="settlementFrequency"
                        label=""
                        value={formData.settlementFrequency}
                        onChange={(value) => setFormData({ ...formData, settlementFrequency: value })}
                        placeholder="Select settlement frequency"
                        error=""
                        options={[
                          { value: "daily", label: "Daily" },
                          { value: "weekly", label: "Weekly" },
                          { value: "biweekly", label: "Bi-weekly" },
                          { value: "monthly", label: "Monthly" },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label 
                        className="text-sm font-medium mb-2 block"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      >
                        Operating Hours Start
                      </label>
                      <Input
                        type="time"
                        value={formData.operatingHoursStart}
                        onChange={(e) => setFormData({ ...formData, operatingHoursStart: e.target.value })}
                      />
                    </div>
                    <div>
                      <label 
                        className="text-sm font-medium mb-2 block"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      >
                        Operating Hours End
                      </label>
                      <Input
                        type="time"
                        value={formData.operatingHoursEnd}
                        onChange={(e) => setFormData({ ...formData, operatingHoursEnd: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Marketing Consent */}
                <div className="space-y-4">
                  <h3 
                    className="text-lg font-medium"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    Marketing Preferences
                  </h3>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="marketingConsent"
                      checked={formData.marketingConsent}
                      onChange={(e) => setFormData({ ...formData, marketingConsent: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label 
                      htmlFor="marketingConsent"
                      className="text-sm"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    >
                      I would like to receive promotional emails and updates about new features
                    </label>
                  </div>
                </div>

                {/* Declarations & Agreement */}
                <div className="space-y-4">
                  <h3 
                    className="text-lg font-medium"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      ),
                    }}
                  >
                    Declarations & Agreement
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="termsAgreement"
                        checked={formData.termsAgreement}
                        onChange={(e) => setFormData({ ...formData, termsAgreement: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                      />
                      <label 
                        htmlFor="termsAgreement"
                        className="text-sm"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      >
                        I agree to the Terms and Conditions *
                      </label>
                    </div>

                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="privacyPolicyConsent"
                        checked={formData.privacyPolicyConsent}
                        onChange={(e) => setFormData({ ...formData, privacyPolicyConsent: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                      />
                      <label 
                        htmlFor="privacyPolicyConsent"
                        className="text-sm"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      >
                        I consent to the Privacy Policy *
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-8 lg:mt-12 pt-6 lg:pt-8">
            <div className="flex gap-4 order-2 sm:order-1">
              {(currentStep === 2 || currentStep === 3 || currentStep === 4 || currentStep === 5) && (
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  className="flex-1 sm:flex-none px-6 py-2"
                  style={{
                    background: "transparent",
                    borderColor: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Stroke["Stroke-02"]
                        : tokens.Light.Stroke["Stroke-02"]
                    ),
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex gap-4 order-1 sm:order-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1 sm:flex-none px-6 py-2"
                style={{
                  background: "transparent",
                  borderColor: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Stroke["Stroke-02"]
                      : tokens.Light.Stroke["Stroke-02"]
                  ),
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                }}
              >
                Cancel
              </Button>
              
              {currentStep === 1 ? (
                <Button
                  onClick={handleNextStep}
                  disabled={!validateStep1()}
                  className="flex items-center gap-2 flex-1 sm:flex-none px-6 py-2"
                  style={{
                    background: validateStep1() ? resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button.Primary
                        : tokens.Light.Button.Primary
                    ) : resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Surface.Foreground
                        : tokens.Light.Surface.Foreground
                    ),
                    color: validateStep1() ? resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button["Primary Text"]
                        : tokens.Light.Button["Primary Text"]
                    ) : resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  Next
                </Button>
              ) : currentStep === 5 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!validateStep5()}
                  className="flex items-center gap-2 flex-1 sm:flex-none px-6 py-2"
                  style={{
                    background: validateStep5() ? resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button.Primary
                        : tokens.Light.Button.Primary
                    ) : resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Surface.Foreground
                        : tokens.Light.Surface.Foreground
                    ),
                    color: validateStep5() ? resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button["Primary Text"]
                        : tokens.Light.Button["Primary Text"]
                    ) : resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  Complete Setup
                </Button>
              ) : (
                <Button
                  onClick={handleNextStep}
                    disabled={
                      (currentStep === 2 && !validateStep2()) ||
                      (currentStep === 3 && !validateStep3()) ||
                      (currentStep === 4 && !validateStep4())
                    }
                  className="flex items-center gap-2 flex-1 sm:flex-none px-6 py-2"
                  style={{
                    background: (
                      (currentStep === 2 && validateStep2()) ||
                      (currentStep === 3 && validateStep3()) ||
                      (currentStep === 4 && validateStep4())
                    ) ? resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button.Primary
                        : tokens.Light.Button.Primary
                    ) : resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Surface.Foreground
                        : tokens.Light.Surface.Foreground
                    ),
                    color: (
                      (currentStep === 2 && validateStep2()) ||
                      (currentStep === 3 && validateStep3()) ||
                      (currentStep === 4 && validateStep4())
                    ) ? resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button["Primary Text"]
                        : tokens.Light.Button["Primary Text"]
                    ) : resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileSetup;
