
import { Input } from "@/components/ui/input";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { XCircleIcon } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";
import { tokens } from "@/styles/theme";
import { useContext } from "react";
import { ThemeContext } from "@/components/Heading";
import { Heading, resolveToken } from "@/components/Heading";
import { FormSelect } from "@/components/FormSelect";
import { OTPInput } from "input-otp";
import { useSignIn, useVerifyLoginOTP, useResendOTP } from "@/api/services/auth";
import { useAuthStore } from "@/store/auth";
import { useNavigate } from "react-router";
import MockSurvey365Logo from "@/assets/logo.png";
interface AuthFormProps {
  mode: "login" | "register";
  onSuccess: (data: {
    name?: string;
    email: string;
    password: string;
    userType?: string;
    userSubType?: string;
  }) => void;
  userType?: string;
}

export const AuthForm = ({ mode, onSuccess, userType }: AuthFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userSubType, setUserSubType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const id = useId();
  const [step, setStep] = useState<'email' | 'otp'>("email");
  const [otp, setOtp] = useState("");
  const requestOtp = useSignIn();
  const verifyOtp = useVerifyLoginOTP();
  const resendOtp = useResendOTP();
  const { login } = useAuthStore();
  const navigate = useNavigate();

  // User sub-type options for when userType is "user"
  const userSubTypeOptions = [
    { value: "university_student", label: "University Student" },
    { value: "wassce_graduate", label: "WASSCE Graduate" },
    { value: "national_service", label: "National Service Personnel" },
  ];

  const placeholder =
    mode === "login"
      ? "e.g. admin@mock-survey-365.com"
      : "e.g. user@mock-survey-365.com";
  const title =
    mode === "login" ? "Sign in to your account" : "Create an account";
  const buttonText = mode === "login" ? "Send OTP" : "Create Account";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Basic validation
    if ((mode === "register" && !name) || !email || (mode === "register" && !password)) {
      toast.error("Please fill in all fields", {
        position: "top-center",
        icon: <XCircleIcon className="w-4 h-4 text-red-500 mr-2" />,
      });
      return;
    }

    // Validate userSubType if userType is "user"
    if (mode === "register" && userType === "user" && !userSubType) {
      toast.error("Please select your user category", {
        position: "top-center",
        icon: <XCircleIcon className="w-4 h-4 text-red-500 mr-2" />,
      });
      return;
    }

    if (mode === "register" && name.length < 3) {
      toast.error("Name must be at least 3 characters", {
        position: "top-center",
        icon: <XCircleIcon className="w-4 h-4 text-red-500 mr-2" />,
      });
      return;
    }

    if (mode === "register" && password.length < 6) {
      toast.error("Password must be at least 6 characters", {
        position: "top-center",
        icon: <XCircleIcon className="w-4 h-4 text-red-500 mr-2" />,
      });
      return;
    }

    if (mode === "login") {
      requestOtp.mutate(email, {
        onSuccess: () => {
          toast.success("OTP sent to your email", { position: "top-center" });
          setStep("otp");
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.message || "Failed to send OTP";
          toast.error(errorMessage, { position: "top-center", icon: <XCircleIcon className="w-4 h-4 text-red-500 mr-2" /> });
        },
      });
      return;
    }

    onSuccess({ name, email, password, userType, userSubType });
  };

  const theme = useContext(ThemeContext);
  // Theme switch logic
  function handleThemeSwitch() {
    const newTheme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    window.location.reload();
  }
  const borderTokenRaw =
    theme === "dark"
      ? tokens.Dark.Stroke["Stroke-02"]
      : tokens.Light.Stroke["Stroke-02"];
  const borderToken = resolveToken(borderTokenRaw);
  console.log(borderToken, "resolved borderToken");

  return (
    <div className="w-full min-h-screen">
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
        {theme === "dark" ? (
          <Sun size={20} className="sm:w-6 sm:h-6" />
        ) : (
          <Moon size={20} className="sm:w-6 sm:h-6" />
        )}
      </button>
      <div className="flex flex-col xl:flex-row h-screen min-h-screen">
        <div className="w-full xl:w-[60%] relative flex-1 flex flex-col">
          <img
            src={ MockSurvey365Logo }
            alt="MockSurvey365 Logo"
            className="w-16 sm:w-20 xl:w-16 absolute top-4 sm:top-6 xl:top-8 left-4 sm:left-6 xl:left-8 z-10"
          />
          <div className="flex items-center justify-center h-full px-4 sm:px-6 xl:px-8 py-16 sm:py-20 xl:py-24">
            <form
              className="flex flex-col items-start w-full max-w-md sm:max-w-lg xl:max-w-[407px]"
              onSubmit={handleSubmit}
            >
              <Heading className="text-2xl sm:text-3xl xl:text-[32px] font-semibold mb-6 sm:mb-8">
                {step === 'email' ? title : 'Verify Email'}
              </Heading>

              {step === 'email' && mode === "register" && (
                <>
                  <div className="flex flex-col items-start gap-2 mb-3 sm:mb-4 w-full">
                    <Heading
                      title={`${id}-name`}
                      className="text-sm sm:text-[14px]"
                    >
                      Name
                    </Heading>

                    <Input
                      id={`${id}-name`}
                      className="w-full rounded-lg placeholder:text-[#9CA3AF] border-0 h-10 sm:h-11"
                      placeholder="e.g. Philip Jenkins"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={mode === "register"}
                    />
                  </div>

                  <div className="flex flex-col items-start gap-2 mb-3 sm:mb-4 w-full">
                    <Heading
                      title={`${id}-email`}
                      className="text-sm sm:text-[14px]"
                    >
                      Email
                    </Heading>

                    <Input
                      id={`${id}-email`}
                      className="w-full rounded-lg placeholder:text-[#9CA3AF] border-0 h-10 sm:h-11"
                      placeholder={placeholder}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {/* User Sub-Type Selection - Only show for register mode when userType is "user" */}
                  {mode === "register" && userType === "user" && (
                    <div className="flex flex-col items-start gap-2 mb-4 sm:mb-6 w-full">
                      <Heading
                        title={`${id}-userSubType`}
                        className="text-sm sm:text-[14px]"
                      >
                        User Category
                      </Heading>
                      <FormSelect
                        required={false}
                        optional={false}
                        id="userSubType"
                        name="userSubType"
                        label=""
                        value={userSubType}
                        onChange={(value) => setUserSubType(value)}
                        placeholder="Select your category"
                        error=""
                        options={userSubTypeOptions}
                        className="w-full"
                      />
                    </div>
                  )}

                  <div className="flex flex-col items-start gap-2 mb-4 sm:mb-6 w-full">
                    <Heading
                      title={`${id}-password`}
                      className="text-sm sm:text-[14px]"
                    >
                      Create password
                    </Heading>

                    <div className="relative w-full">
                      <Input
                        id={`${id}-password`}
                        className="w-full rounded-lg placeholder:text-[#9CA3AF] border-0 h-10 sm:h-11 pr-10"
                        placeholder="••••••••••"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {step === 'email' && mode === "login" && (
                <>
                  <div className="flex flex-col items-start gap-2 mb-3 sm:mb-4 w-full">
                    <Heading title={id} className="text-sm sm:text-[14px]">
                      Email
                    </Heading>

                    <Input
                      id={`${id}-email`}
                      className="w-full rounded-lg placeholder:text-[#9CA3AF] border-0 h-10 sm:h-11"
                      placeholder={placeholder}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {step === 'email' && (
              <Button
                variant="primary"
                disabled={
                  // Always need email
                  !email ||
                  // Registration requires name, password, and userSubType when userType is "user"
                  (mode === "register" && (
                    !name ||
                    !password ||
                    (userType === "user" && !userSubType)
                  ))
                }
                type="submit"
                className="w-full mb-4 sm:mb-6 h-10 sm:h-11"
              >
                {buttonText}
              </Button>)}

              {step === 'otp' && (
                <div className="w-full">
                  <span className="text-[16px] font-semibold mb-4 text-left block" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}>
                    A verification code has been sent to
                    <div className="flex items-center font-semibold text-[16px]" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>
                      {email}
                      <Button type="button" className="hover:underline underline" onClick={() => setStep('email')}>Change email</Button>
                    </div>
                  </span>
                  <OTPInput
                    id={id}
                    maxLength={4}
                    onChange={setOtp}
                    value={otp}
                    render={({ slots }) => (
                      <div className="flex gap-4 mb-6">
                        {slots.map((slot, idx) => (
                          <div key={idx} className={`flex items-center justify-center w-[58px] h-[58px] p-5 rounded-[10px] border bg-white-0 transition-all duration-200 ${slot.isActive || slot.char ? "border-blue-500 shadow-[0px_0px_0px_2px_var(--blue-50,_#BFC4F4),_0px_0px_0px_4px_var(--blue-25,_#F1F2FD)]" : ""}`}>
                            {slot.char}
                          </div>
                        ))}
                      </div>
                    )}
                    className="otp-input-custom"
                    style={{ 
                      background: resolveToken(theme === "dark" ? tokens.Dark.Surface.Foreground : tokens.Light.Surface.Foreground),
                      color: resolveToken(theme === "dark" ? tokens.Dark.Button['Primary Disabled Text'] : tokens.Light.Button['Primary Disabled Text']),
                    }}
                  />
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      disabled={otp.length !== 4 || verifyOtp.isPending}
                      onClick={() => {
                        verifyOtp.mutate(
                          { otp },
                          {
                            onSuccess: (data: any) => {
                              const resData = data?.data || {};
                              const user = resData?.data;
                              const accessToken = resData?.accessToken || resData?.data?.token;
                              const roleName = user?.roleId?.name?.toLowerCase?.();
                              if (roleName !== 'administrator' && roleName !== 'super admin' && roleName !== 'super_admin' && roleName !== 'super-admin') {
                                toast.error('Access denied. Admins only.', { position: 'top-center' });
                                localStorage.removeItem('token');
                                // ensure any existing auth state is cleared
                                try { useAuthStore.getState().logout(); } catch {}
                                setTimeout(() => {
                                  navigate('/')
                                }, 1000);
                                toast.error('Access denied. Admins only.', { position: 'top-center' });
                                return;
                              }
                              const transformedUser = {
                                id: user._id,
                                name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                                email: user.email,
                                role: roleName,
                              } as any;
                              login(transformedUser, accessToken || null);
                              if (accessToken) localStorage.setItem('token', accessToken);
                              toast.success('Login successful!', { position: 'top-center' });
                              navigate('/dashboard', { replace: true });
                            },
                            onError: (error: any) => {
                              const msg = error?.response?.data?.message || 'Invalid OTP';
                              toast.error(msg, { position: 'top-center' });
                            },
                          }
                        );
                      }}
                      className="px-4 py-2"
                    >
                      Verify
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={resendOtp.isPending}
                      onClick={() => resendOtp.mutate({ email })}
                      className="px-4 py-2"
                    >
                      Resend OTP
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Panel - Background Color (27.14%) */}
        <div
          className="hidden xl:block xl:w-[40%] h-full bg-[#FFF]"
          style={{
            background: `linear-gradient(180deg, ${resolveToken(
              theme === "dark"
                ? tokens.Dark.Gradient["Gradient White"]
                : tokens.Light.Gradient["Gradient White"]
            )} 68.7%, ${resolveToken(
              theme === "dark"
                ? tokens.Dark.Gradient["Gradient Grey 25"]
                : tokens.Light.Gradient["Gradient Grey 25"]
            )} 100%)`,
          }}
        >
         <img
            src={theme === "dark" ? "https://cdn.pixabay.com/photo/2018/09/04/10/06/man-3653346_1280.jpg" : "https://cdn.pixabay.com/photo/2018/09/04/10/06/man-3653346_1280.jpg"}
            alt="Omcura Logo"
            className="w-full h-full object-cover"
          />
        </div> 
      </div>
    </div>
  );
};
