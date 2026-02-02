import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSelect } from "@/components/FormSelect";
import { resolveToken } from "@/utils/resolveToken";
import { tokens } from "@/styles/theme";
import { getTheme } from "@/styles/getTheme";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/api/client";

interface NewUserForm {
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  phoneNumber: string;
  agreementConfirmation: boolean;
  roleId: string;
}

const AddNewUser = () => {
  const theme = getTheme();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<NewUserForm>({
    firstName: "",
    lastName: "",
    email: "",
    organization: "",
    phoneNumber: "",
    agreementConfirmation: false,
    roleId: "",
  });

  const [availableRoles, setAvailableRoles] = useState<{ value: string; label: string }[]>([]);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  

  const validateStep1 = () => {
    return (
      formData.firstName &&
      formData.lastName &&
      formData.email &&
      formData.organization &&
      formData.phoneNumber &&
      formData.agreementConfirmation
    );
  };

  const validateStep2 = () => {
    return formData.roleId;
  };

  

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      organization: formData.organization,
      phoneNumber: formData.phoneNumber,
      agreementConfirmation: formData.agreementConfirmation,
      src: "web",
      roleId: formData.roleId,
    };

    try {
      setLoadingSubmit(true);
      await apiClient.post("/user/signup", payload);
      toast.success("User signup successful", {
        description: "The new user has been registered",
        duration: 3000,
      });
      navigate("/dashboard/account-management");
    } catch (error: any) {
      const message = error?.response?.data?.message || "Signup failed";
      toast.error(message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const handleCancel = () => {
    navigate("/dashboard/account-management");
  };

  

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await apiClient.get("/admin/roles");
        const apiRoles = (res.data?.data || []).map((r: any) => ({ value: r._id, label: r.name }));
        setAvailableRoles(apiRoles);
      } catch (_) {}
    };
    loadRoles();
  }, []);

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
            Add New User
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
                Basic Information
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
                Personal and contact information.
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
                Role Assignment
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
                  : "Select user role and permissions."
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
                Permissions
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
                  : "Set specific permissions for the user."
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
            Add New User
          </h2> 
        </div>
        
        <div className="flex items-center gap-2"> 
          {[1, 2].map((step) => (
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
            {currentStep === 2 && "Role Assignment"}
            
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
            {currentStep === 1 && "Name and email address"}
            {currentStep === 2 && "Select user role and permissions"}
            
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
              Add New User
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
                  Basic Information
                </h2>
                
                <div className="space-y-6">
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
                        First Name *
                      </label>
                      <Input
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="Enter first name"
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
                        Last Name *
                      </label>
                      <Input
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Enter last name"
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
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
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
                      Organization *
                    </label>
                    <Input
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="Enter organization"
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
                      Phone Number *
                    </label>
                    <Input
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="+1234567890 or 1234567890"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="agreement"
                      checked={formData.agreementConfirmation}
                      onChange={(e) => setFormData({ ...formData, agreementConfirmation: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <label htmlFor="agreement" className="text-sm"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Subtext
                            : tokens.Light.Typography.Subtext
                        ),
                      }}
                    >
                      I agree to the Terms and Privacy Policy
                    </label>
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
                  Role Assignment
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
                      User Role *
                    </label>
                    <FormSelect
                      required={false}
                      optional={false}
                      id="role"
                      name="role"
                      label=""
                      value={formData.roleId}
                      onChange={(value) => setFormData({ ...formData, roleId: value })}
                      placeholder="Select role"
                      error=""
                      options={availableRoles}
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
                      Choose the appropriate role for this user. Each role has different access levels.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mt-8 lg:mt-12 pt-6 lg:pt-8">
            <div className="flex gap-4 order-2 sm:order-1">
              {(currentStep === 2 || currentStep === 3) && (
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
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!validateStep2() || loadingSubmit}
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
                  {loadingSubmit ? "Submitting..." : "Add User"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddNewUser;
