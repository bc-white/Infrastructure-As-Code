import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff } from "lucide-react"
import { validateEmail, validatePassword, validateConfirmPassword, validateName } from "../utils/validators"

// Images for right panel carousel
const authImages = [
  "https://images.pexels.com/photos/8949908/pexels-photo-8949908.jpeg",
  "https://images.pexels.com/photos/3768114/pexels-photo-3768114.jpeg",
  "https://images.pexels.com/photos/6787970/pexels-photo-6787970.jpeg",
  "https://images.pexels.com/photos/8317678/pexels-photo-8317678.jpeg"
]

export default function Auth() {
  const navigate = useNavigate()
  const { login, signup, sendOTP, isAuthenticated, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState("login")
  
  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/dashboard")
    }
  }, [isAuthenticated, isLoading, navigate])
  
  // Image carousel rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeKey(prev => prev + 1)
      setTimeout(() => {
        setCurrentImageIndex(prev => (prev + 1) % authImages.length)
      }, 1000) // Half of fade duration
    }, 8000) // Change image every 8 seconds (slow animation)
    
    return () => clearInterval(interval)
  }, [])
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  
  // Signup state
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [signupError, setSignupError] = useState("")
  const [signupErrors, setSignupErrors] = useState({})
  const [isSignupLoading, setIsSignupLoading] = useState(false)
  
  // Image carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [fadeKey, setFadeKey] = useState(0)

  const handleSignupChange = (e) => {
    const { name, value } = e.target
    setSignupData({
      ...signupData,
      [name]: value,
    })
    // Clear error for this field
    if (signupErrors[name]) {
      setSignupErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
    setSignupError("")
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoginError("")
    
    // Validate
    const emailError = validateEmail(loginEmail)
    const passwordError = validatePassword(loginPassword)
    
    if (emailError || passwordError) {
      setLoginError(emailError || passwordError || "Please fill in all required fields")
      return
    }

    if (!acceptTerms) {
      setLoginError("Please accept the Terms and Conditions and Privacy Policy to continue.")
      return
    }

    setIsLoginLoading(true)

    try {
      const result = await login(loginEmail, loginPassword)
      
      if (result.success) {
        // Send OTP
        await sendOTP(loginEmail)
    // Navigate to OTP verification
    navigate("/verify-otp", { state: { email: loginEmail, type: "login" } })
      } else {
        setLoginError(result.error || "Login failed. Please try again.")
      }
    } catch (error) {
      setLoginError(error.message || "An error occurred. Please try again.")
    } finally {
      setIsLoginLoading(false)
    }
  }

  const handleSignupSubmit = async (e) => {
    e.preventDefault()
    setSignupError("")
    
    // Validate all fields
    const nameError = validateName(signupData.name)
    const emailError = validateEmail(signupData.email)
    const passwordError = validatePassword(signupData.password)
    const confirmPasswordError = validateConfirmPassword(signupData.password, signupData.confirmPassword)
    
    const newErrors = {}
    if (nameError) newErrors.name = nameError
    if (emailError) newErrors.email = emailError
    if (passwordError) newErrors.password = passwordError
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError
    
    setSignupErrors(newErrors)
    
    if (Object.keys(newErrors).length > 0) {
      return
    }
    
    if (!acceptTerms) {
      setSignupError("Please accept the Terms and Conditions and Privacy Policy to continue.")
      return
    }

    setIsSignupLoading(true)

    try {
      const result = await signup(signupData.email, signupData.password, signupData.name)
      
      if (result.success) {
        // Send OTP
        await sendOTP(signupData.email)
    // Navigate to OTP verification
    navigate("/verify-otp", { state: { email: signupData.email, type: "signup" } })
      } else {
        setSignupError(result.error || "Signup failed. Please try again.")
      }
    } catch (error) {
      setSignupError(error.message || "An error occurred. Please try again.")
    } finally {
      setIsSignupLoading(false)
    }
  }

  const handleGoogleAuth = () => {
    // Handle Google authentication
    console.log("Google authentication")
  }

  const handleFacebookAuth = () => {
    // Handle Facebook authentication
    console.log("Facebook authentication")
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Authentication Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-semibold">
                {activeTab === "login" ? "Welcome Back" : "Create Account"}
              </CardTitle>
              <CardDescription>
                {activeTab === "login"
                  ? "Sign in to your assisted living account"
                  : "Sign up to get started with assisted living management"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login" className="space-y-4">
                  {loginError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{loginError}</p>
                    </div>
                  )}
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="name@example.com"
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value)
                          setLoginError("")
                        }}
                        required
                        disabled={isLoginLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <button
                          type="button"
                          onClick={() => navigate("/forgot-password")}
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={loginPassword}
                          onChange={(e) => {
                            setLoginPassword(e.target.value)
                            setLoginError("")
                          }}
                          required
                          className="pr-10"
                          disabled={isLoginLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showLoginPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="login-terms"
                        checked={acceptTerms}
                        onChange={(e) => {
                          setAcceptTerms(e.target.checked)
                          setLoginError("")
                        }}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        disabled={isLoginLoading}
                      />
                      <label htmlFor="login-terms" className="text-sm text-gray-600 leading-relaxed">
                        I agree to the{" "}
                        <a href="/terms" target="_blank" className="text-primary hover:underline font-medium">
                          Terms and Conditions
                        </a>{" "}
                        and{" "}
                        <a href="/privacy" target="_blank" className="text-primary hover:underline font-medium">
                          Privacy Policy
                        </a>
                      </label>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoginLoading || !acceptTerms}>
                      {isLoginLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoogleAuth}
                      className="w-full"
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleFacebookAuth}
                      className="w-full"
                    >
                      <svg className="mr-2 h-4 w-4" fill="#1877F2" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Facebook
                    </Button>
                  </div>
                </TabsContent>

                {/* Signup Tab */}
                <TabsContent value="signup" className="space-y-4">
                  {signupError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{signupError}</p>
                    </div>
                  )}
                  <form onSubmit={handleSignupSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        value={signupData.name}
                        onChange={handleSignupChange}
                        required
                        disabled={isSignupLoading}
                        className={signupErrors.name ? "border-red-500" : ""}
                      />
                      {signupErrors.name && (
                        <p className="text-sm text-red-500">{signupErrors.name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="name@example.com"
                        value={signupData.email}
                        onChange={handleSignupChange}
                        required
                        disabled={isSignupLoading}
                        className={signupErrors.email ? "border-red-500" : ""}
                      />
                      {signupErrors.email && (
                        <p className="text-sm text-red-500">{signupErrors.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          name="password"
                          type={showSignupPassword ? "text" : "password"}
                          placeholder="Create a password (min 6 characters)"
                          value={signupData.password}
                          onChange={handleSignupChange}
                          required
                          className={`pr-10 ${signupErrors.password ? "border-red-500" : ""}`}
                          disabled={isSignupLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showSignupPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {signupErrors.password && (
                        <p className="text-sm text-red-500">{signupErrors.password}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-confirm-password"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={signupData.confirmPassword}
                          onChange={handleSignupChange}
                          required
                          className={`pr-10 ${signupErrors.confirmPassword ? "border-red-500" : ""}`}
                          disabled={isSignupLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {signupErrors.confirmPassword && (
                        <p className="text-sm text-red-500">{signupErrors.confirmPassword}</p>
                      )}
                    </div>
                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="signup-terms"
                        checked={acceptTerms}
                        onChange={(e) => {
                          setAcceptTerms(e.target.checked)
                          setSignupError("")
                        }}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        disabled={isSignupLoading}
                      />
                      <label htmlFor="signup-terms" className="text-sm text-gray-600 leading-relaxed">
                        I agree to the{" "}
                        <a href="/terms" target="_blank" className="text-primary hover:underline font-medium">
                          Terms and Conditions
                        </a>{" "}
                        and{" "}
                        <a href="/privacy" target="_blank" className="text-primary hover:underline font-medium">
                          Privacy Policy
                        </a>
                      </label>
                    </div>
                    <Button type="submit" className="w-full" disabled={isSignupLoading || !acceptTerms}>
                      {isSignupLoading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoogleAuth}
                      className="w-full"
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleFacebookAuth}
                      className="w-full"
                    >
                      <svg className="mr-2 h-4 w-4" fill="#1877F2" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Facebook
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Panel - Animated Images */}
      <div className="hidden lg:flex lg:flex-1 bg-gray-100 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            key={fadeKey}
            src={authImages[currentImageIndex]}
            alt="Assisted Living"
            className="w-full h-full object-cover animate-fadeIn"
            style={{
              animation: "fadeIn 2s ease-in-out"
            }}
          />
        </div>
      </div>
    </div>
  )
}

