import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { mockAuthService } from "../services/mockAuthService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, Check, LogOut, User, Minus, Plus, X } from "lucide-react"
import { useConfirm } from "../hooks/useConfirm"

export default function InviteUsers() {
  const navigate = useNavigate()
  const { user, logout, isLoading: authLoading } = useAuth()
  const { confirm, ConfirmDialog } = useConfirm()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [roles, setRoles] = useState([])
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const [emails, setEmails] = useState([{ email: "", name: "", role: "" }])

  // Load roles on mount
  useEffect(() => {
    const rolesData = mockAuthService.getRoles()
    setRoles(rolesData)
  }, [])

  const handleAddUser = () => {
    setEmails([...emails, { email: "", name: "", role: "" }])
  }

  const handleEmailChange = (index, field, value) => {
    const newEmails = [...emails]
    newEmails[index][field] = value
    setEmails(newEmails)
    // Clear error for this field
    if (error) {
      setError("")
    }
  }

  const handleRemoveUser = (index) => {
    if (emails.length > 1) {
      const newEmails = emails.filter((_, i) => i !== index)
      setEmails(newEmails)
    }
  }

  const validateStep = (step) => {
    if (step === 1) {
      // Validate all emails and names are filled
      const allValid = emails.every(item => 
        item.email.trim() !== "" && 
        item.name.trim() !== "" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email.trim())
      )
      if (!allValid) {
        setError("Please fill in all email addresses and names with valid emails")
        return false
      }
      setError("")
      return true
    } else if (step === 2) {
      // Validate all roles are selected
      const validEmails = emails.filter(item => item.email.trim() !== "" && item.name.trim() !== "")
      const allRolesSelected = validEmails.every(item => item.role !== "")
      if (!allRolesSelected) {
        setError("Please select a role for each user")
        return false
      }
      setError("")
      return true
    } else if (step === 3) {
      // Step 3: Review - validate that all users have email, name, and role
      const validEmails = emails.filter(item => 
        item.email.trim() !== "" && 
        item.name.trim() !== "" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email.trim())
      )
      if (validEmails.length === 0) {
        setError("Please add at least one user with valid information")
        return false
      }
      const allRolesSelected = validEmails.every(item => item.role !== "")
      if (!allRolesSelected) {
        setError("Please select a role for each user")
        return false
      }
      setError("")
      return true
    }
    return false
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
      setError("")
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError("")
  }

  const handleSkip = () => {
    // Skip inviting and go to dashboard
    navigate("/dashboard")
  }

  const handleCancel = async () => {
    const confirmed = await confirm("Are you sure you want to leave? Any unsaved changes will be lost.", {
      title: "Leave Invite Users",
      variant: "destructive",
      confirmText: "Leave"
    })
    if (confirmed) {
      navigate("/dashboard")
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
      // TODO: Call API to send invitations with roles
      console.log("Inviting users with roles:", emails)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Navigate to success step instead of dashboard
      setCurrentStep(4)
      setError("")
    } catch (err) {
      setError(err.message || "Failed to send invitations. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInviteAnother = () => {
    // Reset the form and go back to step 1
    setEmails([{ email: "", name: "", role: "" }])
    setCurrentStep(1)
    setError("")
  }

  const handleGoToHome = () => {
    navigate("/dashboard")
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        // Step 1: User Information
        return (
          <div className="space-y-4">
          <div className="space-y-6">
            {/* Counter for number of users */}
            <div className="space-y-4">
              <Label className="text-lg font-medium text-gray-900">
                How many people are you inviting?
              </Label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (emails.length > 1) {
                      const newEmails = emails.slice(0, -1)
                      setEmails(newEmails)
                    }
                  }}
                  disabled={emails.length <= 1 || isSubmitting}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                    emails.length <= 1
                      ? "border-gray-200 text-gray-300 cursor-not-allowed"
                      : "border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900"
                  }`}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-xl font-semibold text-gray-900 w-12 text-center">
                  {emails.length}
                </span>
                <button
                  type="button"
                  onClick={handleAddUser}
                  disabled={isSubmitting}
                  className="w-10 h-10 rounded-full border-2 border-gray-900 text-gray-900 hover:bg-gray-50 flex items-center justify-center transition-all"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

              {/* User Input Fields */}
              <div className="space-y-6">
                {emails.map((item, index) => (
                  <div key={index} className="space-y-4">
                    <div>
                      <Label className="text-lg font-medium text-gray-900">
                        Person {index + 1}
                      </Label>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`name-${index}`}>Full Name *</Label>
                        <Input
                          id={`name-${index}`}
                          type="text"
                          placeholder="John Doe"
                          value={item.name}
                          onChange={(e) => handleEmailChange(index, "name", e.target.value)}
                          required
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`email-${index}`}>Email Address *</Label>
                        <Input
                          id={`email-${index}`}
                          type="email"
                          placeholder="john.doe@example.com"
                          value={item.email}
                          onChange={(e) => handleEmailChange(index, "email", e.target.value)}
                          required
                          className="h-12"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        )

      case 2:
        // Step 2: Role Selection
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Select a role for each user. This will determine their permissions and access within the system.
            </p>
            <div className="space-y-6">
              {emails.map((item, index) => (
                <div key={index} className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {item.name || `Person ${index + 1}`}
                    </h3>
                    <p className="text-sm text-gray-500">{item.email}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {roles.map((roleOption) => (
                      <button
                        key={roleOption.id}
                        type="button"
                        onClick={() => handleEmailChange(index, "role", roleOption.id)}
                        className={`relative px-3 py-2.5 border rounded-full text-center transition-all hover:border-primary/50 ${
                          item.role === roleOption.id
                            ? "border-transparent bg-sky-100"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`font-medium text-xs ${
                            item.role === roleOption.id ? "text-sky-700" : ""
                          }`}>
                            {getRoleShortName(roleOption.name)}
                          </span>
                          {item.role === roleOption.id && (
                            <Check className="h-3 w-3 text-sky-700 flex-shrink-0" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mt-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        )

      case 3:
        // Step 3: Review Invited Users
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Review all the people you're inviting. You can go back to make changes if needed.
              </p>
            </div>

            {/* Invited Users List */}
            <div className="space-y-4">
              {emails.filter(e => e.name.trim() !== "" && e.email.trim() !== "").length === 0 ? (
                <div className="text-center py-8 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-400">
                    No users added yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {emails
                    .filter(e => e.name.trim() !== "" && e.email.trim() !== "")
                    .map((item, index) => {
                      const selectedRole = roles.find(r => r.id === item.role)
                      return (
                        <div
                          key={index}
                          className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm flex-shrink-0">
                                {item.name ? getInitials(item.name) : index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-gray-900">
                                    {item.name || `Person ${index + 1}`}
                                  </h4>
                                  {selectedRole && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
                                      {getRoleShortName(selectedRole.name)}
                                    </span>
                                  )}
                                  {!selectedRole && (
                                    <span className="text-xs text-amber-600">
                                      Role not selected
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">
                                  {item.email}
                                </p>
                              </div>
                            </div>
                            {selectedRole && (
                              <div className="flex-shrink-0">
                                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                  <Check className="h-4 w-4 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        )

      case 4:
        // Step 4: Success
        return (
          <div className="space-y-8">
            {/* Success Banner */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Everything looks good. Your invitations have been sent successfully.
              </p>
            </div>

            {/* Invited Users Summary */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Invited Users
              </h4>
              <div className="space-y-3">
                {emails
                  .filter(e => e.name.trim() !== "" && e.email.trim() !== "")
                  .map((item, index) => {
                    const selectedRole = roles.find(r => r.id === item.role)
                    return (
                      <div
                        key={index}
                        className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                            {item.name ? getInitials(item.name) : index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900">
                                {item.name || `Person ${index + 1}`}
                              </h4>
                              {selectedRole && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
                                  {getRoleShortName(selectedRole.name)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {item.email}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <Check className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleInviteAnother}
                className="flex-1 h-12 text-base"
              >
                Invite Another User
              </Button>
              <Button
                type="button"
                onClick={handleGoToHome}
                className="flex-1 h-12 text-base bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Go to Home
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "User Information"
      case 2:
        return "Select Roles"
      case 3:
        return "Review & Complete"
      case 4:
        return "Success"
      default:
        return ""
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Add the people you'd like to invite to this workspace"
      case 2:
        return "Choose the role that best matches each person's responsibilities"
      case 3:
        return "Review all invited users before sending invitations"
      case 4:
        return "Your invitations have been sent successfully"
      default:
        return ""
    }
  }

  const isStepValid = () => {
    // Check validation without setting errors (for UI purposes)
    if (currentStep === 1) {
      return emails.every(item => 
        item.email.trim() !== "" && 
        item.name.trim() !== "" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email.trim())
      )
    } else if (currentStep === 2) {
      const validEmails = emails.filter(item => item.email.trim() !== "" && item.name.trim() !== "")
      return validEmails.length > 0 && validEmails.every(item => item.role !== "")
    } else if (currentStep === 3) {
      // Step 3: Review - validate that all users have email, name, and role
      const validEmails = emails.filter(item => 
        item.email.trim() !== "" && 
        item.name.trim() !== "" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email.trim())
      )
      if (validEmails.length === 0) return false
      return validEmails.every(item => item.role !== "")
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
    switch (roleName) {
      case "System Administrator": return "System Admin"
      case "Facility Administrator": return "Facility Admin"
      case "Survey Administrator": return "Survey Admin"
      case "Director of Health Services / DON": return "DON"
      case "Compliance Officer": return "Compliance"
      case "Survey Coordinator": return "Coordinator"
      case "Clinical Staff": return "Clinical"
      case "Viewer": return "Viewer"
      default: return roleName
    }
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
      {/* Header - Fixed */}
      <header className="fixed top-0 left-0 right-0 w-full border-b border-gray-200 bg-white z-20">
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
      <main className="flex items-center justify-center min-h-[calc(100vh-4rem-6rem)] pb-28 p-4 sm:p-6 lg:p-8 mt-16">
        <div className="w-full max-w-2xl">
          <div className="bg-white">
            <div className="space-y-6">
              {/* Form Content */}
              <div className="space-y-6">
                {currentStep < 4 && (
                  <div>
                    <h2 className="text-2xl font-semibold">
                      <span className="text-muted-foreground font-semibold">
                        {currentStep} / 3
                      </span>{" "}
                      {getStepTitle()}
                    </h2>
                    <p className="text-muted-foreground mt-2">{getStepDescription()}</p>
                  </div>
                )}
                {currentStep === 4 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-2">
                      {getStepTitle()}
                    </h2>
                    <p className="text-muted-foreground">{getStepDescription()}</p>
                  </div>
                )}
                <form onSubmit={currentStep === 3 ? handleSubmit : currentStep === 4 ? (e) => { e.preventDefault(); } : (e) => { e.preventDefault(); handleNext(); }} id="invite-form">
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
          {/* Progress Bar - Hidden on Step 4 */}
          {currentStep < 4 && (
            <div className="pt-4 pb-3">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((step) => (
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
          )}

          {/* Action Buttons */}
          {currentStep < 4 && (
            <div className="flex items-center justify-between h-16 pb-4">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
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
              </div>

              <div className="flex items-center gap-3">
                {currentStep < 3 && (
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
                
                {currentStep === 3 ? (
                  <Button 
                    type="submit" 
                    form="invite-form"
                    disabled={!isStepValid() || isSubmitting}
                    className="flex items-center gap-2"
                  >
                    {isSubmitting ? "Sending..." : "Invite"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="submit" 
                    form="invite-form"
                    disabled={!isStepValid()}
                    className="flex items-center gap-2"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </footer>
      <ConfirmDialog />
    </div>
  )
}
