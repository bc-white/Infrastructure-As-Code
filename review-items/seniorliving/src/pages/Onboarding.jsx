import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { mockAuthService } from "../services/mockAuthService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { ArrowLeft, ArrowRight, Check, LogOut, User, Pencil, ChevronRight, X } from "lucide-react"
import { US_STATES } from "../utils/constants"
import {
  validateFacilityName,
  validateFacilityAddress,
  validateFacilityCity,
  validateFacilityZipCode,
  validateFacilityLicenseNumber,
  validateFacilityCapacity,
  validateRole,
  validateState
} from "../utils/validators"

export default function Onboarding() {
  const navigate = useNavigate()
  const { user, completeOnboarding, logout, isLoading: authLoading } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [roles, setRoles] = useState([])
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null) // 'free' or 'paid'
  const [showSubscriptionPage, setShowSubscriptionPage] = useState(false)

  // Load roles on mount
  useEffect(() => {
    const rolesData = mockAuthService.getRoles()
    setRoles(rolesData)
  }, [])

  // Redirect if user is not authenticated
  useEffect(() => {
    if (authLoading) return // Wait for auth to finish loading
    
    if (!user) {
      navigate("/")
      return
    }
    
    // Redirect if already completed onboarding
    if (user.onboardingCompleted) {
      navigate("/dashboard")
    }
  }, [user, authLoading]) // Remove navigate from dependencies - it's stable

  const [formData, setFormData] = useState({
    // Step 1: Facility Information
    facilityName: "",
    facilityAddress: "",
    facilityCity: "",
    facilityZipCode: "",
    facilityPhone: "",
    facilityLicenseNumber: "",
    facilityCapacity: "",
    facilityState: "",
    
    // Step 3: Role Selection
    role: "",
    
    // Step 5: Plan Selection
    plan: "", // 'free' or 'paid'
  })

  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
  }

  const validateStep = (step) => {
    const newErrors = {}
    
    if (step === 1) {
      // Step 1: Basic Facility Information
      const nameError = validateFacilityName(formData.facilityName)
      const licenseError = validateFacilityLicenseNumber(formData.facilityLicenseNumber)
      const capacityError = validateFacilityCapacity(formData.facilityCapacity)

      if (nameError) newErrors.facilityName = nameError
      if (licenseError) newErrors.facilityLicenseNumber = licenseError
      if (capacityError) newErrors.facilityCapacity = capacityError
    } else if (step === 2) {
      // Step 2: Facility Location
      const addressError = validateFacilityAddress(formData.facilityAddress)
      const cityError = validateFacilityCity(formData.facilityCity)
      const zipError = validateFacilityZipCode(formData.facilityZipCode)
      const stateError = validateState(formData.facilityState)

      if (addressError) newErrors.facilityAddress = addressError
      if (cityError) newErrors.facilityCity = cityError
      if (zipError) newErrors.facilityZipCode = zipError
      if (stateError) newErrors.facilityState = stateError
    } else if (step === 3) {
      // Step 3: Role Selection
      const roleError = validateRole(formData.role)
      if (roleError) newErrors.role = roleError
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5))
      setError("")
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError("")
  }

  const handleSkip = () => {
    // Skip current step and move to next
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1)
      setError("")
    } else if (currentStep === 5) {
      // Skip plan selection and complete onboarding
      handleSubmit(new Event('submit'))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!validateStep(currentStep)) {
      return
    }

    setIsSubmitting(true)

    try {
      const onboardingData = {
        facilityName: formData.facilityName.trim(),
        facilityAddress: formData.facilityAddress.trim(),
        facilityCity: formData.facilityCity.trim(),
        facilityZipCode: formData.facilityZipCode.trim(),
        facilityPhone: formData.facilityPhone.trim(),
        facilityLicenseNumber: formData.facilityLicenseNumber.trim(),
        facilityCapacity: parseInt(formData.facilityCapacity, 10),
        facilityState: formData.facilityState,
        role: formData.role
      }

      const result = await completeOnboarding(onboardingData)

      if (result.success) {
        // Show plan selection modal instead of redirecting
        setShowPlanModal(true)
      } else {
        setError(result.error || "Failed to complete onboarding. Please try again.")
      }
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        // Step 1: Basic Facility Information
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="facilityName">Facility Name *</Label>
              <Input
                id="facilityName"
                name="facilityName"
                type="text"
                placeholder="Sunset Assisted Living"
                value={formData.facilityName}
                onChange={handleChange}
                required
                className={errors.facilityName ? "border-red-500" : ""}
              />
              {errors.facilityName && (
                <p className="text-sm text-red-500">{errors.facilityName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="facilityLicenseNumber">Facility License Number *</Label>
              <Input
                id="facilityLicenseNumber"
                name="facilityLicenseNumber"
                type="text"
                placeholder="ALF123456"
                value={formData.facilityLicenseNumber}
                onChange={handleChange}
                required
                className={errors.facilityLicenseNumber ? "border-red-500" : ""}
              />
              {errors.facilityLicenseNumber && (
                <p className="text-sm text-red-500">{errors.facilityLicenseNumber}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Florida license number for Assisted Living Facility
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="facilityCapacity">Facility Capacity *</Label>
              <Input
                id="facilityCapacity"
                name="facilityCapacity"
                type="number"
                placeholder="50"
                min="1"
                max="10000"
                value={formData.facilityCapacity}
                onChange={handleChange}
                required
                className={errors.facilityCapacity ? "border-red-500" : ""}
              />
              {errors.facilityCapacity && (
                <p className="text-sm text-red-500">{errors.facilityCapacity}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Maximum number of residents
              </p>
            </div>
          </div>
        )
      
      case 2:
        // Step 2: Facility Location
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="facilityAddress">Facility Address *</Label>
              <Input
                id="facilityAddress"
                name="facilityAddress"
                type="text"
                placeholder="123 Main Street"
                value={formData.facilityAddress}
                onChange={handleChange}
                required
                className={errors.facilityAddress ? "border-red-500" : ""}
              />
              {errors.facilityAddress && (
                <p className="text-sm text-red-500">{errors.facilityAddress}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facilityCity">City *</Label>
                <Input
                  id="facilityCity"
                  name="facilityCity"
                  type="text"
                  placeholder="Miami"
                  value={formData.facilityCity}
                  onChange={handleChange}
                  required
                  className={errors.facilityCity ? "border-red-500" : ""}
                />
                {errors.facilityCity && (
                  <p className="text-sm text-red-500">{errors.facilityCity}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="facilityZipCode">Zip Code *</Label>
                <Input
                  id="facilityZipCode"
                  name="facilityZipCode"
                  type="text"
                  placeholder="33101"
                  value={formData.facilityZipCode}
                  onChange={handleChange}
                  required
                  className={errors.facilityZipCode ? "border-red-500" : ""}
                />
                {errors.facilityZipCode && (
                  <p className="text-sm text-red-500">{errors.facilityZipCode}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="facilityPhone">Facility Phone Number</Label>
              <Input
                id="facilityPhone"
                name="facilityPhone"
                type="tel"
                placeholder="(305) 555-1234"
                value={formData.facilityPhone}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facilityState">State *</Label>
              <Combobox
                options={US_STATES}
                value={formData.facilityState}
                onChange={(selectedState) => {
                  setFormData(prev => ({ ...prev, facilityState: selectedState }))
                  if (errors.facilityState) {
                    setErrors(prev => ({ ...prev, facilityState: null }))
                  }
                }}
                placeholder="Select a state"
                searchPlaceholder="Search states..."
                error={!!errors.facilityState}
              />
              {errors.facilityState && (
                <p className="text-sm text-red-500">{errors.facilityState}</p>
              )}
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Select your role. This will determine your permissions and access within the system.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {roles.map((roleOption) => (
                <button
                  key={roleOption.id}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, role: roleOption.id }))
                    if (errors.role) {
                      setErrors(prev => ({ ...prev, role: null }))
                    }
                  }}
                  className={`relative px-3 py-2.5 border rounded-full text-center transition-all hover:border-primary/50 ${
                    formData.role === roleOption.id
                      ? "border-transparent bg-sky-100"
                      : "border-gray-200 hover:border-gray-300"
                  } ${errors.role ? "border-red-500" : ""}`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={`font-medium text-xs ${
                      formData.role === roleOption.id ? "text-sky-700" : ""
                    }`}>
                      {getRoleShortName(roleOption.name)}
                    </span>
                    {formData.role === roleOption.id && (
                      <Check className="h-3 w-3 text-sky-700 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            {errors.role && (
              <p className="text-sm text-red-500 mt-2">{errors.role}</p>
            )}
          </div>
        )

      case 4:
        // Step 4: Review & Complete
        const selectedRole = roles.find(r => r.id === formData.role)
        return (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Everything looks good. You'll be redirected to your dashboard after completing setup.
              </p>
            </div>

            {/* Review Sections */}
            <div className="space-y-3">
              {/* Facility Information */}
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base mb-1">Facility Information</h4>
                  <p className="text-sm text-gray-500">
                    {formData.facilityName}, License: {formData.facilityLicenseNumber}, Capacity: {formData.facilityCapacity} residents
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </button>

              {/* Location */}
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base mb-1">Location</h4>
                  <p className="text-sm text-gray-500">
                    {formData.facilityAddress}, {formData.facilityCity}, {formData.facilityState} {formData.facilityZipCode}
                    {formData.facilityPhone && ` • ${formData.facilityPhone}`}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </button>

              {/* Role */}
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base mb-1">Your Role</h4>
                  <p className="text-sm text-gray-500">
                    {selectedRole?.name || formData.role}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        )

      case 5:
        // Step 5: Plan Selection
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Free Plan */}
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, plan: 'free' }))
                  setSelectedPlan('free')
                }}
                className={`p-6 border-2 rounded-lg hover:border-primary transition-all text-left ${
                  formData.plan === 'free'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">Free Plan</h3>
                  {formData.plan === 'free' && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Basic features for getting started
                </p>
                <div className="text-3xl font-bold">$0</div>
                <p className="text-xs text-muted-foreground mt-1">Forever free</p>
              </button>

              {/* Paid Plan */}
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, plan: 'paid' }))
                  setSelectedPlan('paid')
                }}
                className={`p-6 border-2 rounded-lg hover:border-primary transition-all text-left ${
                  formData.plan === 'paid'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">Paid Plan</h3>
                  {formData.plan === 'paid' && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Full access to all features and support
                </p>
                <div className="text-3xl font-bold text-primary">$12</div>
                <p className="text-xs text-muted-foreground mt-1">Monthly / per Editor</p>
              </button>
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        )
      
      default:
        return null
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Basic Facility Information"
      case 2:
        return "Facility Location"
      case 3:
        return "Select Your Role"
      case 4:
        return "Review & Complete"
      case 5:
        return "Choose Your Plan"
      default:
        return ""
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Enter your facility's basic information"
      case 2:
        return "Enter your facility's location details"
      case 3:
        return "Choose the role that best matches your responsibilities"
      case 4:
        return "Review your information before completing setup"
      case 5:
        return "Select a plan to get started with your facility management"
      default:
        return ""
    }
  }

  const isStepValid = () => {
    // Check validation without setting errors (for UI purposes)
    if (currentStep === 1) {
      // Step 1: Basic Facility Information
      return !!(formData.facilityName && 
                formData.facilityLicenseNumber && 
                formData.facilityCapacity)
    } else if (currentStep === 2) {
      // Step 2: Facility Location
      return !!(formData.facilityAddress && 
                formData.facilityCity && 
                formData.facilityZipCode &&
                formData.facilityState)
    } else if (currentStep === 3) {
      // Step 3: Role Selection
      return !!formData.role
    } else if (currentStep === 4) {
      // Step 4: Review - all fields should be valid
      return !!(formData.facilityName && 
                formData.facilityAddress && 
                formData.facilityCity && 
                formData.facilityZipCode && 
                formData.facilityState &&
                formData.facilityLicenseNumber && 
                formData.facilityCapacity &&
                formData.role)
    }
    return false
  }

  const handleLogout = async () => {
    await logout()
    navigate("/")
  }

  const getInitials = (name) => {
    if (!name) return "U"
    const words = name.trim().split(" ")
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase()
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
  }

  const getRoleShortName = (roleName) => {
    const shortNames = {
      "System Administrator": "System Admin",
      "Facility Administrator": "Facility Admin",
      "Survey Administrator": "Survey Admin",
      "Director of Health Services / DON": "DON",
      "Compliance Officer": "Compliance",
      "Survey Coordinator": "Coordinator",
      "Clinical Staff": "Clinical",
      "Viewer": "Viewer"
    }
    return shortNames[roleName] || roleName
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="w-full border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">Mock Assisted Living</h1>
            </div>

            {/* Avatar with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  {user?.name ? getInitials(user.name) : <User className="h-5 w-5" />}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.name || user?.email}
                </span>
              </button>

              {/* Dropdown Menu */}
              {showAvatarMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowAvatarMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Centered */}
      <main className="flex items-center justify-center min-h-[calc(100vh-4rem-6rem)] pb-28 p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl">
          <div className="bg-white">
            <div className="space-y-6">
              {/* Form Content */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold">
                    <span className="text-muted-foreground font-semibold">
                      {currentStep} / 4
                    </span>{" "}
                    {getStepTitle()}
                  </h2>
                  <p className="text-muted-foreground mt-2">{getStepDescription()}</p>
                </div>
                <form onSubmit={currentStep === 4 || currentStep === 5 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} id="onboarding-form">
                  {renderStepContent()}
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Bar */}
          <div className="pt-4 pb-3">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-700 ease-out ${
                    step <= currentStep
                      ? "bg-primary shadow-sm"
                      : "bg-gray-200"
                  }`}
                  style={{
                    transition: 'background-color 0.7s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: step <= currentStep ? 'scaleY(1.1)' : 'scaleY(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between h-16 pb-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
              className="flex items-center gap-2"
                  >
              <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>

            <div className="flex items-center gap-3">
              {currentStep < 5 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Skip this step
                </Button>
              )}
              
                  {currentStep === 4 ? (
                <Button 
                  type="submit" 
                  form="onboarding-form"
                  disabled={!isStepValid() || isSubmitting}
                  className="flex items-center gap-2"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : currentStep === 5 ? (
                <Button 
                  type="submit" 
                  form="onboarding-form"
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? "Completing..." : formData.plan === 'paid' ? "Continue to Subscription" : "Complete Setup"}
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  form="onboarding-form"
                  disabled={!isStepValid()}
                  className="flex items-center gap-2"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </footer>


      {/* Subscription Page (when paid is selected) */}
      {showSubscriptionPage && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold">Mock Assisted Living</h1>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSubscriptionPage(false)
                  navigate("/dashboard")
                }}
              >
                Back to Workspace
              </Button>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Panel - Choose a Plan */}
              <div>
                <h2 className="text-2xl font-semibold mb-2">Choose a Plan</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Select a plan that works best for your facility
                </p>

                {/* Payment Frequency */}
                <div className="flex gap-4 mb-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="frequency"
                      value="yearly"
                      className="text-primary"
                    />
                    <span className="text-sm">Pay yearly</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Save 16%
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="frequency"
                      value="monthly"
                      defaultChecked
                      className="text-primary"
                    />
                    <span className="text-sm">Pay monthly</span>
                  </label>
                </div>

                {/* Plan Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {/* Standard Plan */}
                  <button className="relative p-4 border-2 border-primary rounded-lg bg-primary/5 hover:bg-primary/10 transition-all">
                    <div className="absolute top-2 left-2 w-2 h-2 bg-primary rounded-full" />
                    <div className="mt-4">
                      <h3 className="font-semibold text-sm mb-2">STANDARD</h3>
                      <div className="text-3xl font-bold mb-1">$12</div>
                      <p className="text-xs text-muted-foreground">Monthly / per Editor</p>
                    </div>
                  </button>

                  {/* Business Plan */}
                  <button className="relative p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-all">
                    <div className="absolute top-2 left-2 w-2 h-2 bg-gray-300 rounded-full" />
                    <div className="mt-4">
                      <h3 className="font-semibold text-sm mb-2">BUSINESS</h3>
                      <div className="text-3xl font-bold mb-1">$22</div>
                      <p className="text-xs text-muted-foreground">Monthly / per Editor</p>
                      <p className="text-xs text-muted-foreground mt-1">Available on yearly billing only.</p>
                    </div>
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-muted-foreground">
                  <p>
                    Need flexibility with payment methods or terms, security and legal reviews — or need help with anything else?{" "}
                    <a href="#" className="text-primary underline">Contact us</a>.
                  </p>
                </div>
              </div>

              {/* Right Panel - Add Editors & Bill Summary */}
              <div className="space-y-6">
                {/* Add Editors */}
                <div>
                  <h3 className="font-semibold mb-2">Add Editors</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Bring more Editors into the Workspace
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-10 h-10"
                    >
                      -
                    </Button>
                    <span className="text-lg font-medium w-8 text-center">1</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-10 h-10"
                    >
                      +
                    </Button>
                  </div>
                </div>

                {/* Bill Summary */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold mb-2">Bill Summary</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    What you would be charged after your trial ends
                  </p>

                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Discount code"
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm">
                      Apply
                    </Button>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>1 Editor</span>
                      <span>$12.00</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold">
                      <span>Total per Month</span>
                      <span>$12.00</span>
        </div>
      </div>

                  <p className="text-xs text-muted-foreground mb-4">
                    Due on {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, then every month.
                  </p>

                  <Button className="w-full">
                    Continue to Billing Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
