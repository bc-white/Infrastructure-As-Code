import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { ArrowLeft, ArrowRight, Save, Building2, Search, FileText, Plus, Edit, Users, User, LogOut, Trash2, Check, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { US_STATES } from "../../utils/constants"

export default function AddFacility() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState("selection") // selection, manual, link-search, success
  const [selectedOption, setSelectedOption] = useState(null) // "add-manual", "add-link"
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedFacility, setSelectedFacility] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentManualStep, setCurrentManualStep] = useState(1)
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  
  // Form data for manual entry
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

  // Mock search results
  const [searchResults] = useState([
    {
      id: "search-1",
      name: "Sunset Assisted Living",
      address: "123 Main Street",
      city: "Miami",
      state: "Florida",
      zipCode: "33101",
      licenseNumber: "ALF123456",
      phone: "(305) 555-1234",
      capacity: 50
    },
    {
      id: "search-2",
      name: "Oceanview Senior Care",
      address: "456 Beach Boulevard",
      city: "Tampa",
      state: "Florida",
      zipCode: "33601",
      licenseNumber: "ALF789012",
      phone: "(813) 555-5678",
      capacity: 75
    },
    {
      id: "search-3",
      name: "Palm Grove Assisted Living",
      address: "789 Palm Avenue",
      city: "Orlando",
      state: "Florida",
      zipCode: "32801",
      licenseNumber: "ALF345678",
      phone: "(407) 555-9012",
      capacity: 60
    }
  ])

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleOptionSelect = (option) => {
    setSelectedOption(option)
    if (option === "add-manual") {
      setStep("manual")
      setCurrentManualStep(1)
    } else if (option === "add-link") {
      setStep("link-search")
    }
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
      setStep("selection")
      setSelectedOption(null)
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

  const handleRemoveAdministrator = (id) => {
    if (formData.administrators.length === 1) {
      toast.error("At least one administrator is required")
      return
    }
    setFormData(prev => ({
      ...prev,
      administrators: prev.administrators.filter(admin => admin.id !== id)
    }))
  }

  const handleAdministratorChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      administrators: prev.administrators.map(admin =>
        admin.id === id ? { ...admin, [field]: value } : admin
      )
    }))
  }

  const handleLinkFacility = (facility) => {
    setSelectedFacility(facility)
    // Pre-fill form data with linked facility information
    setFormData(prev => ({
      ...prev,
      name: facility.name || "",
      address: facility.address || "",
      city: facility.city || "",
      state: facility.state || "Florida",
      phone: facility.phone || "",
      licenseNumber: facility.licenseNumber || "",
      licensedCapacity: facility.capacity?.toString() || ""
    }))
    // Move to manual entry flow starting from step 1
    setStep("manual")
    setCurrentManualStep(1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (selectedOption === "add-manual") {
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
    } else if (selectedOption === "add-link") {
      // For linked facilities, we still need to complete the form
      const validAdministrators = formData.administrators.filter(
        admin => admin.name && (admin.phone || admin.email)
      )
      if (!formData.name || !formData.facilityType || !formData.address || !formData.city || 
          !formData.state || !formData.phone || !formData.licenseNumber || !formData.licensedCapacity ||
          validAdministrators.length === 0) {
        toast.error("Please fill in all required fields")
        return
      }
    }

    setIsSubmitting(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      // Show success screen instead of navigating immediately
      setShowSuccess(true)
      setStep("success")
    } catch (error) {
      console.error("Failed to add facility:", error)
      toast.error("Failed to add facility")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredResults = searchResults.filter(facility =>
    facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    facility.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    facility.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        return "Enter the basic details for the new facility"
      case 2:
        return "Enter the location details for the facility"
      case 3:
        return "Enter the essential license details"
      case 4:
        return "Enter the administrator or director contact information"
      case 5:
        return "Select the services provided by this facility"
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

  // Single Selection Screen
  if (step === "selection") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4">
              Welcome! How can we help you today
            </h1>
            <p className="text-base text-gray-600">
              We're here to help you manage your facilities with ease. Choose an option below to get started.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Add Facility - Manual */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                selectedOption === "add-manual" 
                  ? "border-primary bg-primary/5" 
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleOptionSelect("add-manual")}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Add Facility Manually</CardTitle>
                  <CardDescription className="text-sm">
                    Add an existing facility manually
                  </CardDescription>
                </div>
              </CardContent>
            </Card>

            {/* Add Facility - Link */}
            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                selectedOption === "add-link" 
                  ? "border-primary bg-primary/5" 
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleOptionSelect("add-link")}
            >
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <Search className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Add Facility by Link</CardTitle>
                  <CardDescription className="text-sm">
                    Search and link a facility from database
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Manual Entry Flow - Onboarding Style
  if (step === "manual") {
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
                onClick={() => navigate("/facilities")}
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
                  {isSubmitting ? "Adding..." : (
                    <>
                      <Save className="h-4 w-4" />
                      Add Facility
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

  // Link Facility - Search
  if (step === "link-search") {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-gray-50 border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setStep("selection")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Search Facility</h1>
                <p className="text-muted-foreground mt-1">
                  Search for an existing facility to link
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by facility name, city, or license number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </div>

          {filteredResults.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground text-lg">
                    {searchTerm 
                      ? "No facilities match your search"
                      : "Start typing to search for facilities"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((facility) => (
                <Card 
                  key={facility.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleLinkFacility(facility)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {facility.name}
                        </h3>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>{facility.address}</p>
                          <p>{facility.city}, {facility.state} {facility.zipCode}</p>
                          <p>License: {facility.licenseNumber}</p>
                          {facility.phone && <p>Phone: {facility.phone}</p>}
                          {facility.capacity && <p>Capacity: {facility.capacity} residents</p>}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleLinkFacility(facility)
                        }}
                      >
                        Link
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Success Screen
  if (step === "success") {
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
        <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-2xl">
            <div className="bg-white">
              <div className="space-y-6">
                {/* Success Banner */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">
                      Facility Added Successfully!
                    </h2>
                    <p className="text-sm text-gray-700">
                      Your facility has been added to your account. You can now manage it from the facilities page.
                    </p>
                  </div>
                </div>

                {/* Action Options */}
                <div className="space-y-3">
                  {/* Go to Facilities */}
                  <button
                    type="button"
                    onClick={() => navigate("/facilities")}
                    className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base mb-1">Go to Facilities</h4>
                      <p className="text-sm text-gray-500">
                        View and manage all your facilities
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </button>

                  {/* Add Another Facility */}
                  <button
                    type="button"
                    onClick={() => {
                      // Reset form and go back to selection
                      setFormData({
                        name: "",
                        facilityType: "",
                        address: "",
                        city: "",
                        state: "Florida",
                        phone: "",
                        licenseNumber: "",
                        licensedCapacity: "",
                        administrators: [
                          {
                            id: Date.now(),
                            name: "",
                            phone: "",
                            email: ""
                          }
                        ],
                        services: {
                          assistedLiving: false,
                          memoryCare: false,
                          medicationManagement: false,
                          adlSupport: false
                        }
                      })
                      setCurrentManualStep(1)
                      setSelectedOption(null)
                      setSelectedFacility(null)
                      setStep("selection")
                      setShowSuccess(false)
                    }}
                    className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Plus className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-base mb-1">Add Another Facility</h4>
                      <p className="text-sm text-gray-500">
                        Add more facilities to your account
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return null
}
