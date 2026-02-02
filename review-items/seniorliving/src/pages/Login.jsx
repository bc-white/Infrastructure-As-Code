import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Images for right panel carousel
const authImages = [
  "https://images.pexels.com/photos/8172765/pexels-photo-8172765.jpeg",
  "https://images.pexels.com/photos/3768114/pexels-photo-3768114.jpeg",
  "https://images.pexels.com/photos/6787970/pexels-photo-6787970.jpeg",
  "https://images.pexels.com/photos/8317678/pexels-photo-8317678.jpeg"
]

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  
  // Image carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [fadeKey, setFadeKey] = useState(0)
  
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

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!acceptTerms) {
      toast.error("Please accept the Terms and Conditions and Privacy Policy to continue.")
      return
    }
    
    // Handle login logic here
    console.log("Login:", { email, password })
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Authentication Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-none">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-semibold">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your MockSurvey365 Senior Living account
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      to="#"
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="login-terms"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
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
                <Button type="submit" className="w-full" disabled={!acceptTerms}>
                  Sign In
                </Button>
              </form>
              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">
                  Don't have an account?{" "}
                </span>
                <Link
                  to="/signup"
                  className="text-primary font-medium hover:underline"
                >
                  Sign up
                </Link>
              </div>
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
            alt="MockSurvey365 Senior Living"
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

