import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/FormSelect";
import { DatePicker } from "@/components/ui/date-picker";
import { resolveToken } from "@/utils/resolveToken";
import { tokens } from "@/styles/theme";
import { getTheme } from "@/styles/getTheme";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Discount {
  id: string;
  title: string;
  description: string;
  category: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  validityStart: string;
  validityEnd: string;
  termsAndConditions: string;
  isActive: boolean;
  status: "active" | "expired" | "upcoming" | "inactive";
  createdAt: string;
  redemptions: number;
  maxRedemptions?: number;
}

const AddEditDiscount = () => {
  const theme = getTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    categories: [] as string[],
    visibility: "public" as "public" | "private" | "unlisted",
    targetAudience: [] as string[],
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: 0,
    discountCode: "",
    validityStart: undefined as Date | undefined,
    validityEnd: undefined as Date | undefined,
    termsAndConditions: "",
    maxRedemptions: 0,
    images: [] as string[],
  });

  const [customCategory, setCustomCategory] = useState("");
  const [availableCategories, setAvailableCategories] = useState([
    "Food & Dining",
    "Retail & Shopping", 
    "Services",
    "Entertainment",
    "Healthcare",
    "Education",
  ]);

  const discountTypes = [
    { value: "percentage", label: "Percentage (%)" },
    { value: "fixed", label: "Fixed Amount" },
  ];

  const visibilityOptions = [
    { value: "public", label: "Public" },
    { value: "private", label: "Private" },
    { value: "unlisted", label: "Unlisted" },
  ];

  const targetAudienceOptions = [
    { value: "university_students", label: "University Students" },
    { value: "wassce_graduates", label: "WASSCE Graduates" },
    { value: "national_service", label: "National Service Personnel" },
  ];

  // Mock data for editing (in real app, this would come from API)
  const mockDiscount: Discount = {
    id: "1",
    title: "Student Lunch Special",
    description: "20% off on all lunch items for students",
    category: "food",
    discountType: "percentage",
    discountValue: 20,
    validityStart: "2024-01-01",
    validityEnd: "2024-12-31",
    termsAndConditions: "Valid only for university students with valid ID",
    isActive: true,
    status: "active",
    createdAt: "2024-01-01",
    redemptions: 247,
    maxRedemptions: 1000,
  };

  useEffect(() => {
    if (isEdit && id) {
      // In real app, fetch discount by ID from API
      setFormData({
        title: mockDiscount.title,
        description: mockDiscount.description,
        location: "Downtown Location",
        categories: [mockDiscount.category],
        visibility: "public",
        targetAudience: ["university_students"],
        discountType: mockDiscount.discountType,
        discountValue: mockDiscount.discountValue,
        discountCode: "STUDENT20",
        validityStart: new Date(mockDiscount.validityStart),
        validityEnd: new Date(mockDiscount.validityEnd),
        termsAndConditions: mockDiscount.termsAndConditions,
        maxRedemptions: mockDiscount.maxRedemptions || 0,
        images: [],
      });
    }
  }, [isEdit, id]);

  const validateStep1 = () => {
    return formData.title && formData.description;
  };

  const validateStep2 = () => {
    return formData.categories.length > 0;
  };

  const validateStep3 = () => {
    return formData.discountValue > 0 && formData.validityStart && formData.validityEnd;
  };

  const validateStep4 = () => {
    return true; // Images are optional
  };

  const validateStep5 = () => {
    return true; // Terms & Conditions are optional
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

    if (isEdit) {
      toast.success("Discount Updated Successfully", {
        description: "Your discount has been updated and is now live",
        duration: 3000,
      });
    } else {
      toast.success("Discount Added Successfully", {
        description: "Your new discount is now live and available to customers",
        duration: 3000,
      });
    }
    
    // Navigate back to discount management
    navigate("/dashboard/merchant/discount");
  };

  const handleCancel = () => {
    navigate("/dashboard/merchant/discount");
  };

  const addCustomCategory = () => {
    if (customCategory.trim() && !availableCategories.includes(customCategory.trim())) {
      setAvailableCategories([...availableCategories, customCategory.trim()]);
      setFormData({ ...formData, categories: [...formData.categories, customCategory.trim()] });
      setCustomCategory("");
    }
  };

  const toggleCategory = (category: string) => {
    const updatedCategories = formData.categories.includes(category)
      ? formData.categories.filter(c => c !== category)
      : [...formData.categories, category];
    setFormData({ ...formData, categories: updatedCategories });
  };

  const removeCategory = (category: string) => {
    setFormData({ ...formData, categories: formData.categories.filter(c => c !== category) });
  };

  const toggleTargetAudience = (audience: string) => {
    const updatedAudience = formData.targetAudience.includes(audience)
      ? formData.targetAudience.filter(a => a !== audience)
      : [...formData.targetAudience, audience];
    setFormData({ ...formData, targetAudience: updatedAudience });
  };

  const removeTargetAudience = (audience: string) => {
    setFormData({ ...formData, targetAudience: formData.targetAudience.filter(a => a !== audience) });
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
        className="hidden lg:block w-80 p-6"
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
            Discount Setup
          </h2>
         
        </div>

        <div className="space-y-6">
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
                Basic Details
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
                Title and description.
              </p>
            </div>
          </div>

          <div 
            className={`flex items-start gap-3 ${
              currentStep === 1 && !validateStep1() 
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
                Categories
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
                {currentStep === 1 && !validateStep1() 
                  ? "Complete Step 1 to continue" 
                  : "Select discount categories."
                }
              </p>
            </div>
          </div>

          <div 
            className={`flex items-start gap-3 ${
              (currentStep === 1 && !validateStep1()) || (currentStep === 2 && !validateStep2())
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
                Discount
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
                {(currentStep === 1 && !validateStep1()) || (currentStep === 2 && !validateStep2())
                  ? "Complete previous steps to continue" 
                  : "Discount value, validity, and terms."
                }
              </p>
            </div>
          </div>


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
                Images
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
                  : "Upload images to showcase your discount."
                }
              </p>
            </div> 
          </div>

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
                Terms & Conditions
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
                  : "Add terms and conditions for your discount."
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
            Discount Setup
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
            {currentStep === 1 && "Basic Information"}
            {currentStep === 2 && "Categories"}
            {currentStep === 3 && "Discount"}
            {currentStep === 4 && "Images"}
            {currentStep === 5 && "Terms & Conditions"}
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
            {currentStep === 1 && "Title and description"}
            {currentStep === 2 && "Select discount categories"}
            {currentStep === 3 && "Discount value, validity, and terms"}
            {currentStep === 4 && "Upload images to showcase your discount"}
            {currentStep === 5 && "Add terms and conditions"}
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
              {isEdit ? "Edit Discount" : "Add New Discount"}
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
                  Basic Details
                </h2>
                
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
                Title *
              </label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter discount title"
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
                Description *
              </label>
                    <textarea
                      className="w-full p-3 border rounded-lg resize-none"
                      rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter discount description"
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
                      Location
                    </label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Enter location (e.g., Downtown Store, Online)"
                      
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
                      Target Audience
                    </label>
                    
                    {/* Selected Target Audience */}
                    {formData.targetAudience.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {formData.targetAudience.map((audience) => {
                          const audienceLabel = targetAudienceOptions.find(opt => opt.value === audience)?.label || audience;
                          return (
                            <span
                              key={audience}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                              style={{
                                background: resolveToken(
                                  theme === "dark"
                                    ? tokens.Dark.Button.Primary
                                    : tokens.Light.Button.Primary
                                ),
                                color: resolveToken(
                                  theme === "dark"
                                    ? tokens.Dark.Button["Primary Text"]
                                    : tokens.Light.Button["Primary Text"]
                                ),
                              }}
                            >
                              {audienceLabel}
                              <button
                                type="button"
                                onClick={() => removeTargetAudience(audience)}
                                className="ml-1 hover:opacity-70"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Available Target Audience Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {targetAudienceOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleTargetAudience(option.value)}
                          className={`p-3 text-sm rounded-lg border text-left transition-colors ${
                            formData.targetAudience.includes(option.value) ? 'opacity-50' : ''
                          }`}
                          style={{
                            background: formData.targetAudience.includes(option.value) 
                              ? resolveToken(
                                  theme === "dark"
                                    ? tokens.Dark.Surface.Foreground
                                    : tokens.Light.Surface.Foreground
                                )
                              : resolveToken(
                                  theme === "dark"
                                    ? tokens.Dark.Surface.Secondary
                                    : tokens.Light.Surface.Secondary
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
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    
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
                      Select who can see and redeem this discount. Leave empty to make it available to everyone.
                    </p>
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
                  Categories
                </h2>
                
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
                      Categories *
              </label>
                    
                    {/* Selected Categories */}
                    {formData.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {formData.categories.map((category) => (
                          <span
                            key={category}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                            style={{
                              background: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Button.Primary
                                  : tokens.Light.Button.Primary
                              ),
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Button["Primary Text"]
                                  : tokens.Light.Button["Primary Text"]
                              ),
                            }}
                          >
                            {category}
                            <button
                              type="button"
                              onClick={() => removeCategory(category)}
                              className="ml-1 hover:opacity-70"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Available Categories */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {availableCategories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className={`p-2 text-sm rounded-lg border text-left transition-colors ${
                            formData.categories.includes(category) ? 'opacity-50' : ''
                          }`}
                          style={{
                            background: formData.categories.includes(category) 
                              ? resolveToken(
                                  theme === "dark"
                                    ? tokens.Dark.Surface.Foreground
                                    : tokens.Light.Surface.Foreground
                                )
                              : resolveToken(
                                  theme === "dark"
                                    ? tokens.Dark.Surface.Secondary
                                    : tokens.Light.Surface.Secondary
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
                        >
                          {category}
                        </button>
                      ))}
                    </div>

                    {/* Add Custom Category */}
                    <div className="flex gap-2">
                      <Input
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Add custom category"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={addCustomCategory}
                        disabled={!customCategory.trim()}
                        className="px-4"
                        style={{
                          background: customCategory.trim() ? resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Button.Primary
                              : tokens.Light.Button.Primary
                          ) : resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Surface.Foreground
                              : tokens.Light.Surface.Foreground
                          ),
                          color: customCategory.trim() ? resolveToken(
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
                        Add
                      </Button>
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
                      Visibility
              </label>
              <FormSelect
                      required={false}
                optional={false}
                      id="visibility"
                      name="visibility"
                label=""
                      value={formData.visibility}
                      onChange={(value) => setFormData({ ...formData, visibility: value as "public" | "private" | "unlisted" })}
                      placeholder="Select visibility"
                error=""
                      options={visibilityOptions}
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
                      Public: Visible to everyone | Private: Only you can see | Unlisted: Only accessible via direct link
                    </p>
            </div>
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
                  Discount
                </h2>
                
                <div className="space-y-6">
                  {/* Discount Information Section */}
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
                      Discount Information
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
                  Discount Type
                </label>
                <FormSelect
                          required={false}
                  optional={false}
                  id="discountType"
                  name="discountType"
                  label=""
                  value={formData.discountType}
                  onChange={(value) => setFormData({ ...formData, discountType: value as "percentage" | "fixed" })}
                  placeholder="Select type"
                  error=""
                  options={discountTypes}
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
                          Discount Value *
                </label>
                <Input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                  placeholder="Enter value"
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
                Discount Code (Optional)
              </label>
              <Input
                value={formData.discountCode}
                onChange={(e) => setFormData({ ...formData, discountCode: e.target.value })}
                placeholder="Enter discount code (e.g., SAVE20, STUDENT10)"
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
                Customers will need to enter this code to redeem the discount.
              </p>
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
                Max Redemptions (Optional)
              </label>
              <Input
                type="number"
                value={formData.maxRedemptions}
                onChange={(e) => setFormData({ ...formData, maxRedemptions: Number(e.target.value) })}
                placeholder="Enter maximum number of redemptions"
              />
                    </div>
            </div>

                  {/* Validity Period Section */}
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
                      Validity Period
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
                          Valid From *
                </label>
                        <DatePicker
                          date={formData.validityStart}
                          onDateChange={(date) => setFormData({ ...formData, validityStart: date })}
                          placeholder="Select start date"
                          yearRange={{ from: new Date().getFullYear(), to: new Date().getFullYear() + 10 }}
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
                          Valid Until *
                </label>
                        <DatePicker
                          date={formData.validityEnd}
                          onDateChange={(date) => setFormData({ ...formData, validityEnd: date })}
                          placeholder="Select end date"
                          yearRange={{ from: new Date().getFullYear(), to: new Date().getFullYear() + 10 }}
                        />
                      </div>
                    </div>
                  </div>
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
                  Images
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
                  Upload images to showcase your discount offering.
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
                    Upload Images
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="space-y-2">
                      <div className="text-gray-500">
                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                          <span>Upload images</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                    </div>
                  </div>
                  {formData.images.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Uploaded Images:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative">
                            <img 
                              src={image} 
                              alt={`Upload ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newImages = formData.images.filter((_, i) => i !== index);
                                setFormData({ ...formData, images: newImages });
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                Terms & Conditions
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
                  Add any specific terms, restrictions, or conditions that apply to this discount.
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
                    Terms & Conditions (Optional)
              </label>
              <textarea
                className="w-full p-3 border rounded-lg resize-none"
                    rows={6}
                value={formData.termsAndConditions}
                onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                    placeholder="Enter terms and conditions for your discount"
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
                    Add any specific terms, restrictions, or conditions that apply to this discount.
                  </p>
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
              ) : currentStep === 2 ? (
                <Button
                  onClick={handleNextStep}
                  disabled={!validateStep2()}
                  className="flex items-center gap-2 flex-1 sm:flex-none px-6 py-2"
                  style={{
                    background: validateStep2() ? resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button.Primary
                        : tokens.Light.Button.Primary
                    ) : resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Surface.Foreground
                        : tokens.Light.Surface.Foreground
                    ),
                    color: validateStep2() ? resolveToken(
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
              ) : currentStep === 3 ? (
                <Button
                  onClick={handleNextStep}
                  disabled={!validateStep3()}
                  className="flex items-center gap-2 flex-1 sm:flex-none px-6 py-2"
                  style={{
                    background: validateStep3() ? resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button.Primary
                        : tokens.Light.Button.Primary
                    ) : resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Surface.Foreground
                        : tokens.Light.Surface.Foreground
                    ),
                    color: validateStep3() ? resolveToken(
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
              ) : currentStep === 4 ? (
                <Button
                  onClick={handleNextStep}
                  disabled={!validateStep4()}
                  className="flex items-center gap-2 flex-1 sm:flex-none px-6 py-2"
                  style={{
                    background: validateStep4() ? resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button.Primary
                        : tokens.Light.Button.Primary
                    ) : resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Surface.Foreground
                        : tokens.Light.Surface.Foreground
                ),
                color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  Next
                </Button>
              ) : (
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
                
              {isEdit ? "Update Discount" : "Add Discount"}
            </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddEditDiscount;