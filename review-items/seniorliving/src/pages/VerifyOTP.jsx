import { useState, useRef, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function VerifyOTP() {
  const navigate = useNavigate()
  const location = useLocation()
  const { email, type } = location.state || { email: "", type: "login" }
  const { verifyOTP, sendOTP, user, isAuthenticated } = useAuth()
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const inputRefs = useRef([])
  const [error, setError] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate("/")
    }
  }, [email, navigate])

  // Redirect if already authenticated and onboarding completed
  useEffect(() => {
    if (isAuthenticated && user?.onboardingCompleted) {
      navigate("/dashboard")
    }
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Only take the last character
    setOtp(newOtp)
    setError("") // Clear error when user types

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, 6)
    if (/^\d+$/.test(pastedData)) {
      const newOtp = [...otp]
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedData[i] || ""
      }
      setOtp(newOtp)
      // Focus the next empty input or the last one
      const nextIndex = Math.min(pastedData.length, 5)
      inputRefs.current[nextIndex]?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otpCode = otp.join("")
    
    if (otpCode.length !== 6) {
      setError("Please enter a complete 6-digit code")
      return
    }

    setIsVerifying(true)
    setError("")

    try {
      const result = await verifyOTP(email, otpCode)
      
      if (result.success) {
        // Check if onboarding is completed
        if (result.onboardingCompleted) {
          // Redirect to dashboard
          navigate("/dashboard")
        } else {
          // Redirect to onboarding
        navigate("/onboarding")
        }
      } else {
        setError(result.error || "Invalid OTP code. Please try again.")
      }
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      setError("Email not found. Please go back and try again.")
      return
    }

    setIsResending(true)
    setError("")

    try {
      const result = await sendOTP(email)
      
      if (result.success) {
        // Clear OTP inputs
    setOtp(["", "", "", "", "", ""])
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
        }
        // Show success message (could be a toast in the future)
        setError("") // Clear any existing errors
      } else {
        setError(result.error || "Failed to resend OTP. Please try again.")
      }
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - OTP Verification Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-none">
            <CardHeader className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="mb-2 -ml-2 w-fit"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <CardTitle className="text-3xl font-semibold">Verify Your Email</CardTitle>
              <CardDescription>
                We've sent a 6-digit code to <strong>{email || "your email"}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label>Enter verification code</Label>
                  <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-12 text-center text-lg font-semibold"
                        disabled={isVerifying}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    For testing, you can also use: <strong>123456</strong>
                  </p>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={otp.join("").length !== 6 || isVerifying}
                >
                  {isVerifying ? "Verifying..." : "Verify Email"}
                </Button>
              </form>
              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Didn't receive the code? </span>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-primary font-medium hover:underline disabled:opacity-50"
                >
                  {isResending ? "Sending..." : "Resend code"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Panel - Light Gray Background */}
      <div className="hidden lg:flex lg:flex-1 bg-gray-100 items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-4xl font-semibold text-gray-800">
            MockSurvey365 Senior Living Email Verification
          </h2>
          <p className="text-lg text-gray-600">
            Please check your email and enter the verification code to complete your {type === "login" ? "sign in" : "sign up"}
          </p>
        </div>
      </div>
    </div>
  )
}

