import { AuthForm } from "@/components/AuthForm";
import { AnimatePresence, motion } from "motion/react";
import useLoginStore from "@/store/track-login";
import { toast } from "sonner";
import { XCircleIcon } from "lucide-react";
import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router";
import { tokens } from "@/styles/theme";
import { ThemeContext } from "@/components/Heading";
import { resolveToken } from "@/utils/resolveToken";
import { Sun, Moon } from "lucide-react";

export const Register = () => {
  const { currentStep, setCurrentStep, setMode } = useLoginStore();
  const navigate = useNavigate();
  const theme = useContext(ThemeContext);
  
  // User type selection state
  const [userType, setUserType] = useState<string>("");

  // User type options
  const userTypeOptions = [
    {
      value: "merchant",
      label: "Merchant",
      description: "Business owners and service providers",
      icon: "🏪"
    },
    {
      value: "user",
      label: "User",
      description: "University students, WASSCE graduates, and National Service personnel",
      icon: "👤"
    }
  ];

  // Theme switch logic
  function handleThemeSwitch() {
    const newTheme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    window.location.reload();
  }

  // Token resolution
  const borderTokenRaw = theme === "dark"
    ? tokens.Dark.Stroke["Stroke-02"]
    : tokens.Light.Stroke["Stroke-02"];
  const borderToken = resolveToken(borderTokenRaw);
  const radiusTokenRaw = theme === "dark"
    ? tokens.Dark.Radius["Radius-md"]
    : tokens.Light.Radius["Radius-md"];
  const radiusToken = resolveToken(radiusTokenRaw);
  useEffect(() => {
    console.log("useEffect triggered, currentStep:", currentStep);
    // Only set mode to 'register' if not already
    if (useLoginStore.getState().mode !== "register") {
      setMode("register");
    }
    // Ensure we start with userType step
    if (currentStep !== "userType" && currentStep !== "email") {
      setCurrentStep("userType");
    }
  }, [setMode, setCurrentStep, currentStep]);


  const handleAuthSuccess = ({ name, email, password, userType: formUserType, userSubType }: { name?: string; email: string; password: string; userType?: string; userSubType?: string }) => {
    // For UI demo purposes, just show success message and navigate
    console.log("Registration data:", { name, email, password, userType: formUserType || userType, userSubType });
    
    toast.success("Registration form submitted successfully!", {
      position: "top-center",
    });
    
    // Navigate to dashboard after a short delay
    setTimeout(() => {
      navigate("/");
    }, 2000);
  };


  const handleUserTypeSelection = () => {
    console.log(userType, "userType");
    console.log("Current step before:", currentStep);
    if (!userType) {
      toast.error("Please select a user type", {
        position: "top-center",
        icon: <XCircleIcon className="w-4 h-4 text-red-500 mr-2" />,
      });
      return;
    }
    console.log("Setting step to email");
    setCurrentStep("email");
    console.log("Current step after:", useLoginStore.getState().currentStep);
  };

  return (
    <div className="font-brico w-full min-h-screen">
      {/* Theme Toggle Button */}
      <button
        type="button"
        className="absolute top-4 sm:top-6 xl:top-8 right-4 sm:right-6 xl:right-8 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full border-2 z-20 shadow-lg cursor-pointer"
        style={{
          background: resolveToken(
            theme === "dark"
              ? tokens.Light.Surface.Primary
              : tokens.Dark.Surface.Primary
          ),
          color: resolveToken(
            theme === "dark"
              ? tokens.Light.Typography.Heading
              : tokens.Dark.Typography.Heading
          ),
          borderColor: resolveToken(
            theme === "dark"
              ? tokens.Light.Stroke["Stroke-02"]
              : tokens.Dark.Stroke["Stroke-02"]
          ),
          boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
        }}
        onClick={handleThemeSwitch}
      >
        {theme === "dark" ? <Sun size={20} className="sm:w-6 sm:h-6" /> : <Moon size={20} className="sm:w-6 sm:h-6" />}
      </button>

      <AnimatePresence mode="wait">
        {currentStep === "userType" && ( 
          <motion.div
            key="userType"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col xl:flex-row h-screen min-h-screen"
          >
            <div className="w-full xl:w-[60%] relative flex-1 flex flex-col">
              <img
                src={theme === "dark" ? "https://veritypc.com/wp-content/uploads/2015/01/logo_placeholder.png" : "https://veritypc.com/wp-content/uploads/2015/01/logo_placeholder.png"}
                alt="Omcura Logo"
                className="w-32 sm:w-36 xl:w-[154px] absolute top-4 sm:top-6 xl:top-8 left-4 sm:left-6 xl:left-8 z-10"
              />
              <div className="flex items-center justify-center h-full px-4 sm:px-6 xl:px-8 py-16 sm:py-20 xl:py-24">
                <div className="flex flex-col items-start w-full max-w-md sm:max-w-lg xl:max-w-[407px]">
                  <h1 
                    className="text-2xl sm:text-3xl xl:text-[32px] font-semibold mb-6 sm:mb-8"
                    style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}
                  >
                    Choose Your Account Type
                  </h1>
                  
                  <p 
                    className="text-sm sm:text-base mb-8"
                    style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}
                  >
                    Select the type of account that best describes you:
                  </p>

                  <div className="flex flex-col gap-4 mb-8 w-full">
                    {userTypeOptions.map((option) => {
                      const selected = userType === option.value;
                      return (
                        <div
                          key={option.value}
                          onClick={() => setUserType(option.value)}
                          className="flex gap-4 rounded-2xl border px-6 py-5 cursor-pointer transition-all duration-200 border-0 w-full"
                          style={{
                            borderColor: selected 
                              ? resolveToken(theme === "dark" ? tokens.Dark.Spot["Spot-500-Blue"] : tokens.Light.Spot["Spot-500-Blue"]) 
                              : borderToken,
                            background: selected 
                              ? `linear-gradient(180deg, ${resolveToken(theme === "dark" ? tokens.Dark.Gradient["Gradient Grey 25"] : tokens.Light.Gradient["Gradient Grey 25"])} 0%, ${resolveToken(theme === "dark" ? tokens.Dark.Gradient["Gradient White"] : tokens.Light.Gradient["Gradient White"])} 100%)`
                              : `linear-gradient(180deg, ${resolveToken(theme === "dark" ? tokens.Dark.Gradient["Gradient Grey 25"] : tokens.Light.Gradient["Gradient Grey 25"])} 0%, ${resolveToken(theme === "dark" ? tokens.Dark.Gradient["Gradient White"] : tokens.Light.Gradient["Gradient White"])} 100%)`,
                            borderRadius: radiusToken,
                            boxShadow: selected ? `0 0 0 1px ${resolveToken(theme === "dark" ? tokens.Dark.Spot["Spot-500-Blue"] : tokens.Light.Spot["Spot-500-Blue"])}` : '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                          onMouseEnter={(e) => {
                            if (!selected) {
                              e.currentTarget.style.borderColor = resolveToken(theme === "dark" ? tokens.Dark.Spot["Spot-500-Blue"] : tokens.Light.Spot["Spot-500-Blue"]);
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!selected) {
                              e.currentTarget.style.borderColor = borderToken;
                            }
                          }}
                        >
                          <div className="text-3xl">{option.icon}</div>
                          <div className="flex-1">
                            <div 
                              className="font-semibold text-lg mb-1"
                              style={{ 
                                color: selected 
                                  ? resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading)
                                  : resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext)
                              }}
                            >
                              {option.label}
                            </div>
                            <div 
                              className="text-sm"
                              style={{ 
                                color: selected 
                                  ? resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading)
                                  : resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext)
                              }}
                            >
                              {option.description}
                            </div>
                          </div>
                          <div 
                            className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                            style={{
                              borderColor: selected 
                                ? resolveToken(theme === "dark" ? tokens.Dark.Button.Primary : tokens.Light.Button.Primary)
                                : borderToken
                            }}
                          >
                            {selected && (
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ 
                                  background: resolveToken(theme === "dark" ? tokens.Dark.Button.Primary : tokens.Light.Button.Primary)
                                }}
                              ></div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={handleUserTypeSelection}
                    disabled={!userType}
                    className="w-full h-10 sm:h-11 font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-60"
                    style={{
                      background: resolveToken(theme === "dark" ? tokens.Dark.Button.Primary : tokens.Light.Button.Primary),
                      color: resolveToken(theme === "dark" ? tokens.Dark.Button["Primary Text"] : tokens.Light.Button["Primary Text"]),
                      borderRadius: radiusToken
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.background = resolveToken(theme === "dark" ? tokens.Dark.Button["Primary Hover"] : tokens.Light.Button["Primary Hover"]);
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.background = resolveToken(theme === "dark" ? tokens.Dark.Button.Primary : tokens.Light.Button.Primary);
                      }
                    }}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel - Background Color (27.14%) */}
            <div 
              className="hidden xl:block xl:w-[40%] h-full bg-[#FFF]"
              style={{
                background: `linear-gradient(180deg, ${resolveToken(theme === 'dark' ? tokens.Dark.Gradient['Gradient White'] : tokens.Light.Gradient['Gradient White'])} 68.7%, ${resolveToken(theme === 'dark' ? tokens.Dark.Gradient['Gradient Grey 25'] : tokens.Light.Gradient['Gradient Grey 25'])} 100%)`
              }}
            >
            </div>
          </motion.div>
        )}

        {currentStep === "email" && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}>
            <AuthForm 
              mode="register" 
              onSuccess={handleAuthSuccess}
              userType={userType}
            />
           
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default Register;
