import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle forgot password logic
    console.log("Sending reset link to:", email)
    setIsSubmitted(true)
  }

  const handleResend = () => {
    console.log("Resending reset link to:", email)
    setIsSubmitted(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Forgot Password Form */}
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
              <CardTitle className="text-3xl font-semibold">
                {isSubmitted ? "Check Your Email" : "Forgot Password"}
              </CardTitle>
              <CardDescription>
                {isSubmitted
                  ? `We've sent a password reset link to ${email || "your email"}. Please check your inbox.`
                  : "Enter your email address and we'll send you a link to reset your password."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Send Reset Link
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      If an account exists with this email, you'll receive a password reset link shortly.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResend}
                      className="w-full"
                    >
                      Resend Link
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => navigate("/")}
                      className="w-full"
                    >
                      Back to Sign In
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Panel - Light Gray Background */}
      <div className="hidden lg:flex lg:flex-1 bg-gray-100 items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-4xl font-semibold text-gray-800">
            Reset Your Password
          </h2>
          <p className="text-lg text-gray-600">
            Don't worry, we'll help you get back into your account in no time.
          </p>
        </div>
      </div>
    </div>
  )
}

