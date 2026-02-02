import React, { useId, useState } from "react";
import { useContext } from "react";
import { Heading } from "@/components/Heading";
import { resolveToken } from "@/utils/resolveToken";
import { Sun, Moon } from "lucide-react";
import { tokens } from "@/styles/theme";
import { ThemeContext } from "@/components/Heading";
import MockSurvey365Logo from "@/assets/logo.png";
import { OTPInput } from "input-otp";

import { Button } from "@/components/ui/button";
import { useVerifyLoginOTP, useVerifySignUpOTP, useResendOTP } from "@/api/services/auth";
import { toast } from "sonner";
import { XCircleIcon, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/store/auth";

interface OTPFormProps {
  mode: "login" | "register";
  email: string;
  name?: string;
  onSuccess: () => void;
  onResend?: () => void;
}

export const OTPForm = ({ 
  mode, 
  email, 
  onResend 
}: OTPFormProps) => {
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [progressCount, setProgressCount] = useState(0);
  const id = useId();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const theme = useContext(ThemeContext);
  function handleThemeSwitch() {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    window.location.reload();
  }


  
  const verifyLoginOTPMutation = useVerifyLoginOTP();
  const verifySignUpOTPMutation = useVerifySignUpOTP();
  const resendOTPMutation = useResendOTP();
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setLoading(true);
    setProgressCount(0);
    e.preventDefault();
    
    // Simulate progress count with slower increments
    const progressInterval = setInterval(() => {
      setProgressCount(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 5; // Reduced from 10 to 5 for slower progress
      });
    }, 200); // Increased from 100ms to 200ms for slower updates
    
    const verifyOTP = mode === "login" ? verifyLoginOTPMutation : verifySignUpOTPMutation;
    
    verifyOTP.mutate(
      { email, otp },
      {
        onSuccess: (data) => {
          setLoading(false);
          setProgressCount(100);
          
          // Log out the user after successful OTP verification
          logout();
          
          // Clear any stored auth data
          localStorage.removeItem('token');
          localStorage.removeItem('auth');
          
          // Show success message with user data
          const userData = data?.data || {};

          console.log(userData?.data,"userData");
          
          toast.success(`OTP verified successfully for ${userData?.data?.user.name} (${userData.data?.user.email}). Please sign in to continue.`, {
            position: "top-right",
            duration: 5000,
          });
          
          // Navigate to login page
          navigate('/login');
        },
        onError: () => {
          setLoading(false);
          setProgressCount(0);
          toast.error("Invalid OTP", {
            position: "top-right",
            icon: <XCircleIcon className="w-4 h-4 text-red-500 mr-2" />,
          });
        },
      }
    );
  };

  const handleResendOTP = () => {
    setResendLoading(true);
    resendOTPMutation.mutate(
      { email },
      {
        onSuccess: () => {
          setResendLoading(false);
          localStorage.removeItem("otp_resend");
          toast.success("OTP resent successfully", {
            position: "top-center",
          });
          onResend?.();
        },
        onError: () => {
          setResendLoading(false);
          toast.error("Failed to resend OTP", {
            position: "top-center",
            icon: <XCircleIcon className="w-4 h-4 text-red-500 mr-2" />,
          });
        },
      }
    );
  };



  return (
    <div className="w-full">
      <button
        type="button"
        className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-full border-2 z-20 shadow-lg cursor-pointer"
        style={{
          background: resolveToken(theme === 'dark' ? tokens.Light.Surface.Primary : tokens.Dark.Surface.Primary),
          color: resolveToken(theme === 'dark' ? tokens.Light.Typography.Heading : tokens.Dark.Typography.Heading),
          borderColor: resolveToken(theme === 'dark' ? tokens.Light.Stroke['Stroke-02'] : tokens.Dark.Stroke['Stroke-02']),
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)'
        }}
        onClick={handleThemeSwitch}
      >
        {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
      </button>
      <div className="flex h-screen">
        <div className="w-full md:w-[60%] relative">
          <img src={MockSurvey365Logo} alt="MockSurvey365 Logo" className="w-16 sm:w-20 xl:w-16 absolute top-4 sm:top-6 xl:top-8 left-4 sm:left-6 xl:left-8" />
          <div className="flex items-center justify-center h-full">
            <form
              className="flex flex-col items-start w-[462px] max-w-full px-8"
              onSubmit={handleSubmit}
              style={{ background: resolveToken(theme === 'dark' ? tokens.Dark.Surface.Primary : tokens.Light.Surface.Primary), borderRadius: resolveToken(theme === 'dark' ? tokens.Dark.Radius['Radius-md'] : tokens.Light.Radius['Radius-md']) }}>
              <Heading
                className="text-[32px] font-semibold mb-4"
              >
                Verify Email
              </Heading>
              <span
                className="text-[16px] font-semibold mb-8 text-left"
                style={{ color: resolveToken(theme === 'dark' ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}
              >
                A verification code has been sent to

                <div className="flex items-center font-semibold text-[16px]" style={{ color: resolveToken(theme === 'dark' ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}> 
                   {email}.
                <Button
                  type="button"
                  className="hover:underline underline"
                  onClick={() => navigate('/register')}
                  
                >
                  Change email
                </Button>
                </div>
              </span>
              {localStorage.getItem("otp_resend") && (
                <span className="text-xs font-medium mb-4" style={{ color: resolveToken(theme === 'dark' ? tokens.Dark.Typography.Body : tokens.Light.Typography.Body) }}>
                  NB: Click on "Resend Code" to get OTP
                </span>
              )}
              <OTPInput
                id={id}
                maxLength={4}
                onChange={setOtp}
                value={otp}
                render={({ slots }) => (
                  <div className="flex gap-4 mb-6">
                    {slots.map((slot, idx) => (
                      <Slot key={idx} {...slot} />
                    ))}
                  </div>
                )}
                className="otp-input-custom"
                style={{ 
                  background: resolveToken(theme === 'dark' ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground),
                  color: resolveToken(theme === 'dark' ? tokens.Dark.Button['Primary Disabled Text'] : tokens.Light.Button['Primary Disabled Text']),
                  
                }}
              />
              {/* Progress Count Display */}
              {loading && (
                <div className="w-full rounded-full h-2.5 mb-4" style={{ background: resolveToken(theme === 'dark' ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground) }}>
                  <div 
                    className="h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progressCount}%`, background: resolveToken(theme === 'dark' ? tokens.Dark.Button.Primary : tokens.Light.Button.Primary) }}
                  ></div>
                </div>
              )}
              {loading && (
                <div className="text-sm mb-4" style={{ color: resolveToken(theme === 'dark' ? tokens.Dark.Typography.Body : tokens.Light.Typography.Body) }}>
                  Verifying OTP... {progressCount}%
                </div>
              )}
              <div className="flex flex-col gap-4 w-full">
                <Button
                  type="submit"
                  disabled={otp.length !== 4 || loading}
                  className={`w-full text-base font-semibold h-11 flex items-center justify-center rounded-lg border-0 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  style={{
                    background: resolveToken(theme === 'dark' ? tokens.Dark.Button.Primary : tokens.Light.Button.Primary),
                    color: resolveToken(theme === 'dark' ? tokens.Dark.Button['Primary Text'] : tokens.Light.Button['Primary Text']),
                    borderRadius: resolveToken(theme === 'dark' ? tokens.Dark.Radius['Radius-md'] : tokens.Light.Radius['Radius-md'])
                  }}
                >
                  {loading ? 'Loading...' : 'Submit'}
                </Button>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendLoading}
                  className="flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  style={{ color: resolveToken(theme === 'dark' ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}
                >
                  <RefreshCw size={16} className={resendLoading ? "animate-spin" : ""} />
                  Resend Code
                </button>
              </div>
            </form>
          </div>
        </div>
        {/* Right Panel - Background Color (27.14%) */}
        <div 
          className="hidden md:block md:w-[40%] h-full bg-[#FFF]"
          style={{
            background: `linear-gradient(180deg, ${resolveToken(theme === 'dark' ? tokens.Dark.Gradient['Gradient White'] : tokens.Light.Gradient['Gradient White'])} 68.7%, ${resolveToken(theme === 'dark' ? tokens.Dark.Gradient['Gradient Grey 25'] : tokens.Light.Gradient['Gradient Grey 25'])} 100%)`
          }}
        >
        </div>
      </div>
    </div>
  );
};

const Slot = ({
  isActive,
  char,
  theme = useContext(ThemeContext)
}: {
  isActive: boolean;
  char: string | null;
  theme?: string;
}) => {
  const isFilled = Boolean(char);

  return (
    <div
     style={{
        color: resolveToken(theme === 'dark' ? tokens.Dark.Button['Primary Disabled Text'] : tokens.Light.Button['Primary Disabled Text']),
     }}
      className={`flex items-center justify-center w-[58px] h-[58px] p-5 rounded-[10px] border bg-white-0 transition-all duration-200
          ${
            isActive || isFilled
              ? "border-blue-500 shadow-[0px_0px_0px_2px_var(--blue-50,_#BFC4F4),_0px_0px_0px_4px_var(--blue-25,_#F1F2FD)]"
              : ""
          }`}>
      {char}
    </div>
  );
};
