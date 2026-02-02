import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { ArrowLeft, ArrowRight, Save, Building2, Users, User, LogOut, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import { US_STATES } from "../../utils/constants"
import { mockAuthService } from "../../services/mockAuthService"

export default function EditFacility() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentManualStep, setCurrentManualStep] = useState(1)
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  
  // Form data matching AddFacility structure
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: "",
    facilityType: "", // "Assisted Living" | "Memory Care" | "Both"
    
    // Step 2: Location
    address: "",
    city: "",
    state: "Florida",
    phone: "",
    
    // Step 3: License Info
    licenseNumber: "",
    licensedCapacity: "",
    
    // Step 4: Administrator Contact (multiple)
    administrators: [
      {
        id: Date.now(),
        name: "",
        phone: "",
        email: ""
      }
    ],
    
    // Step 5: Services
    services: {
      assistedLiving: false,
      memoryCare: false,
      medicationManagement: false,
      adlSupport: false
    }
  })

  useEffect(() => {
    loadFacility()
  }, [id])

  const loadFacility = () => {
    try {
      const allFacilities = mockAuthService.getAllFacilities()
      const facility = allFacilities.find(f => f.id === id)
      
      if (facility) {
        // Map facility data to form structure
        setFormData({
          name: facility.name || "",
          facilityType: facility.facilityType || "", // Assuming this exists, otherwise default
          address: facility.address || "",
          city: facility.city || "",
          state: facility.state || "Florida",
          phone: facility.phone || "",
          licenseNumber: facility.licenseNumber || "",
          licensedCapacity: facility.capacity?.toString() || "",
          administrators: facility.administrators && facility.administrators.length > 0
            ? facility.administrators.map((admin, index) => ({
                id: admin.id || Date.now() + index,
                name: admin.name || "",
                phone: admin.phone || "",
                email: admin.email || ""
              }))
            : [
                {
                  id: Date.now(),
                  name: "",
                  phone: "",
                  email: ""
                }
              ],
          services: facility.services || {
            assistedLiving: false,
            memoryCare: false,
            medicationManagement: false,
            adlSupport: false
          }
        })
      } else {
        toast.error("Facility not found")
        navigate("/facilities")
      }
    } catch (error) {
      console.error("Failed to load facility:", error)
      toast.error("Failed to load facility")
      navigate("/facilities")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleManualNext = () => {
    // Validate based on current step
    if (currentManualStep === 1) {
      if (!formData.name || !formData.facilityType) {
        toast.error("Please fill in all required fields")
        return
      }
      setCurrentManualStep(2)
    } else if (currentManualStep === 2) {
      if (!formData.address || !formData.city || !formData.state || !formData.phone) {
        toast.error("Please fill in all required fields")
        return
      }
      setCurrentManualStep(3)
    } else if (currentManualStep === 3) {
      if (!formData.licenseNumber || !formData.licensedCapacity) {
        toast.error("Please fill in all required fields")
        return
      }
      setCurrentManualStep(4)
    } else if (currentManualStep === 4) {
      // Validate at least one administrator with name and at least one contact method
      const validAdministrators = formData.administrators.filter(
        admin => admin.name && (admin.phone || admin.email)
      )
      if (validAdministrators.length === 0) {
        toast.error("Please add at least one administrator with name and contact information")
        return
      }
      setCurrentManualStep(5)
    }
  }

  const handleManualBack = () => {
    if (currentManualStep > 1) {
      setCurrentManualStep(prev => prev - 1)
    } else {
      navigate(`/facilities/${id}`)
    }
  }

  const handleServiceToggle = (service) => {
    setFormData(prev => ({
      ...prev,
      services: {
        ...prev.services,
        [service]: !prev.services[service]
      }
    }))
  }

  const handleAddAdministrator = () => {
    setFormData(prev => ({
      ...prev,
      administrators: [
        ...prev.administrators,
        {
          id: Date.now(),
          name: "",
          phone: "",
          email: ""
        }
      ]
    }))
  }

  const handleRemoveAdministrator = (adminId) => {
    if (formData.administrators.length === 1) {
      toast.error("At least one administrator is required")
      return
    }
    setFormData(prev => ({
      ...prev,
      administrators: prev.administrators.filter(admin => admin.id !== adminId)
    }))
  }

  const handleAdministratorChange = (adminId, field, value) => {
    setFormData(prev => ({
      ...prev,
      administrators: prev.administrators.map(admin =>
        admin.id === adminId ? { ...admin, [field]: value } : admin
      )
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Final validation
    const validAdministrators = formData.administrators.filter(
      admin => admin.name && (admin.phone || admin.email)
    )
    if (!formData.name || !formData.facilityType || !formData.address || !formData.city || 
        !formData.state || !formData.phone || !formData.licenseNumber || !formData.licensedCapacity ||
        validAdministrators.length === 0) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    
    try {
      // In a real app, this would call an API to update the facility
      await new Promise(resolve => setTimeout(resolve, 500))
      toast.success("Facility updated successfully")
      navigate(`/facilities/${id}`)
    } catch (error) {
      console.error("Failed to update facility:", error)
      toast.error("Failed to update facility")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return "U"
    const words = name.trim().split(" ")
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase()
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
  }

  const getStepTitle = () => {
    switch (currentManualStep) {
      case 1:
        return "Basic Info"
      case 2:
        return "Location"
      case 3:
        return "License Info (Essential Only)"
      case 4:
        return "Administrator Contact"
      case 5:
        return "Services Provided"
      default:
        return ""
    }
  }

  const getStepDescription = () => {
    switch (currentManualStep) {
      case 1:
        return "Update the basic details for the facility"
      case 2:
        return "Update the location details for the facility"
      case 3:
        return "Update the essential license details"
      case 4:
        return "Update the administrator or director contact information"
      case 5:
        return "Update the services provided by this facility"
      default:
        return ""
    }
  }

  const isStepValid = () => {
    if (currentManualStep === 1) {
      return !!(formData.name && formData.facilityType)
    } else if (currentManualStep === 2) {
      return !!(formData.address && formData.city && formData.state && formData.phone)
    } else if (currentManualStep === 3) {
      return !!(formData.licenseNumber && formData.licensedCapacity)
    } else if (currentManualStep === 4) {
      const validAdministrators = formData.administrators.filter(
        admin => admin.name && (admin.phone || admin.email)
      )
      return validAdministrators.length > 0
    }
    return true // Step 5 (services) doesn't require validation
  }

  const renderManualStepContent = () => {
    switch (currentManualStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Facility Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Sunset Assisted Living"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="facilityType">Facility Type (Assisted Living / Memory Care / Both) *</Label>
              <select
                id="facilityType"
                value={formData.facilityType}
                onChange={(e) => handleChange("facilityType", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">Select facility type</option>
                <option value="Assisted Living">Assisted Living</option>
                <option value="Memory Care">Memory Care</option>
                <option value="Both">Both</option>
              </select>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                placeholder="e.g., 123 Main Street"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City & State *</Label>
                <Input
                  id="city"
                  placeholder="e.g., Miami"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Combobox
                  options={US_STATES}
                  value={formData.state}
                  onChange={(selectedState) => handleChange("state", selectedState)}
                  placeholder="Select a state"
                  searchPlaceholder="Search states..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="e.g., (305) 555-1234"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                required
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number *</Label>
              <Input
                id="licenseNumber"
                placeholder="e.g., ALF123456"
                value={formData.licenseNumber}
                onChange={(e) => handleChange("licenseNumber", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="licensedCapacity">Licensed Capacity (How many residents allowed) *</Label>
              <Input
                id="licensedCapacity"
                type="number"
                placeholder="e.g., 50"
                value={formData.licensedCapacity}
                onChange={(e) => handleChange("licensedCapacity", e.target.value)}
                min="1"
                required
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            {formData.administrators.map((admin, index) => (
              <Card key={admin.id} className="relative">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold">
                        Administrator {index + 1}
                      </Label>
                      {formData.administrators.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAdministrator(admin.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`admin-name-${admin.id}`}>
                        Administrator/Director Name *
                      </Label>
                      <Input
                        id={`admin-name-${admin.id}`}
                        placeholder="e.g., John Smith"
                        value={admin.name}
                        onChange={(e) => handleAdministratorChange(admin.id, "name", e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`admin-phone-${admin.id}`}>
                        Administrator Phone
                      </Label>
                      <Input
                        id={`admin-phone-${admin.id}`}
                        placeholder="e.g., (305) 555-1234"
                        value={admin.phone}
                        onChange={(e) => handleAdministratorChange(admin.id, "phone", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`admin-email-${admin.id}`}>
                        Administrator Email
                      </Label>
                      <Input
                        id={`admin-email-${admin.id}`}
                        type="email"
                        placeholder="e.g., admin@facility.com"
                        value={admin.email}
                        onChange={(e) => handleAdministratorChange(admin.id, "email", e.target.value)}
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      * Name is required. At least one contact method (phone or email) is required.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={handleAddAdministrator}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Administrator
            </Button>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="assistedLiving"
                  checked={formData.services.assistedLiving}
                  onChange={() => handleServiceToggle("assistedLiving")}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="assistedLiving" className="text-sm font-normal cursor-pointer">
                  Assisted Living
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="memoryCare"
                  checked={formData.services.memoryCare}
                  onChange={() => handleServiceToggle("memoryCare")}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="memoryCare" className="text-sm font-normal cursor-pointer">
                  Memory Care
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="medicationManagement"
                  checked={formData.services.medicationManagement}
                  onChange={() => handleServiceToggle("medicationManagement")}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="medicationManagement" className="text-sm font-normal cursor-pointer">
                  Medication Management
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="adlSupport"
                  checked={formData.services.adlSupport}
                  onChange={() => handleServiceToggle("adlSupport")}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="adlSupport" className="text-sm font-normal cursor-pointer">
                  ADL Support
                </Label>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading facility...</p>
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
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-primary">Mock Assisted Living</h1>
            </div>

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

              {showAvatarMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowAvatarMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                    <div className="py-1">
                      <button
                        onClick={() => navigate("/dashboard")}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Back to Dashboard
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
              <div>
                <h2 className="text-2xl font-semibold">
                  <span className="text-muted-foreground font-semibold">
                    {currentManualStep} / 5
                  </span>{" "}
                  {getStepTitle()}
                </h2>
                <p className="text-muted-foreground mt-2">{getStepDescription()}</p>
              </div>
              <form 
                onSubmit={currentManualStep === 5 ? handleSubmit : (e) => { e.preventDefault(); handleManualNext(); }} 
                id="facility-form"
              >
                {renderManualStepContent()}
              </form>
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
              {[1, 2, 3, 4, 5].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-700 ease-out ${
                    stepNum <= currentManualStep
                      ? "bg-primary shadow-sm"
                      : "bg-gray-200"
                  }`}
                  style={{
                    transition: 'background-color 0.7s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: stepNum <= currentManualStep ? 'scaleY(1.1)' : 'scaleY(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between h-16 pb-4">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/facilities/${id}`)}
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleManualBack}
                disabled={isSubmitting || currentManualStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {currentManualStep === 5 ? (
                <Button 
                  type="submit" 
                  form="facility-form"
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? "Saving..." : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  form="facility-form"
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
    </div>
  )
}
