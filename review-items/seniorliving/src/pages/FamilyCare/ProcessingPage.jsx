import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Building2, Heart, Search, CheckCircle } from "lucide-react"

export default function ProcessingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const formData = location.state?.formData
  const [currentStep, setCurrentStep] = useState(0)

  const processingSteps = [
    { icon: CheckCircle, text: "Verifying your information", color: "text-green-500" },
    { icon: Heart, text: "Analyzing care needs", color: "text-pink-500" },
    { icon: Search, text: "Searching for facilities", color: "text-blue-500" },
    { icon: Building2, text: "Matching with best options", color: "text-primary" }
  ]

  useEffect(() => {
    // Progress through processing steps sequentially
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < processingSteps.length - 1) {
          return prev + 1
        }
        return prev
      })
    }, 1200)

    // Navigate to results after processing
    const processingTimeout = setTimeout(() => {
      navigate("/family-care/results", { state: { formData } })
    }, 6000) // 6 seconds total processing time

    return () => {
      clearInterval(stepInterval)
      clearTimeout(processingTimeout)
    }
  }, [navigate, formData, processingSteps.length])

  const CurrentIcon = processingSteps[currentStep]?.icon || CheckCircle

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Animated Logo/Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
            <div className="absolute inset-0 bg-primary/30 rounded-full animate-pulse"></div>
            <div className="relative bg-primary rounded-full p-8">
              <CurrentIcon className="h-16 w-16 text-white animate-bounce" />
            </div>
          </div>
        </div>

        {/* Main Message */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Finding the Perfect Match
          </h1>
          <p className="text-xl text-gray-600">
            We're connecting you with the best {formData?.careType === "healthcare" ? "healthcare providers" : "assisted living facilities"} in your area
          </p>
        </div>

        {/* Processing Steps */}
        <div className="space-y-4 pt-8">
          {processingSteps.map((step, index) => {
            const StepIcon = step.icon
            const isActive = index === currentStep
            const isCompleted = index < currentStep

            return (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-500 ${
                  isActive
                    ? "bg-primary/10 border-2 border-primary scale-105"
                    : isCompleted
                    ? "bg-green-50 border border-green-200"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <div className={`flex-shrink-0 ${isActive ? "animate-spin" : ""}`}>
                  <StepIcon
                    className={`h-6 w-6 ${
                      isCompleted
                        ? "text-green-500"
                        : isActive
                        ? step.color
                        : "text-gray-400"
                    }`}
                  />
                </div>
                <span
                  className={`text-lg font-medium ${
                    isCompleted
                      ? "text-green-700"
                      : isActive
                      ? "text-primary"
                      : "text-gray-500"
                  }`}
                >
                  {step.text}
                </span>
                {isCompleted && (
                  <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />
                )}
              </div>
            )
          })}
        </div>

        {/* Progress Bar */}
        <div className="pt-8">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${((currentStep + 1) / processingSteps.length) * 100}%`
              }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {Math.round(((currentStep + 1) / processingSteps.length) * 100)}% Complete
          </p>
        </div>
      </div>
    </div>
  )
}

