import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { Combobox } from "@/components/ui/combobox"
import { ArrowLeft, ArrowRight, Upload, X, FileText, Plus } from "lucide-react"
import { toast } from "sonner"
import { useConfirm } from "../../hooks/useConfirm"
import { US_STATES } from "../../utils/constants"

export default function FamilyCareFlow() {
  const navigate = useNavigate()
  const location = useLocation()
  const { confirm, ConfirmDialog } = useConfirm()
  const footerRef = useRef(null)
  const [bottomPadding, setBottomPadding] = useState(120)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  
  // Get the option from navigation state
  const careType = location.state?.option || "healthcare"
  
  const [formData, setFormData] = useState({
    // Step 1: Family Member Information
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    relationship: "",
    phoneNumber: "",
    email: "",
    
    // Step 2: Care Type Details
    careType: careType, // "healthcare" or "assisted-living"
    preferredLocation: "",
    urgency: "",
    specialNeeds: [], // Array of special needs
    currentMedications: [], // Array of medications
    specialNeedsDocuments: [], // Array of file objects
    medicationDocuments: [], // Array of file objects
    
    // Step 3: Contact Information
    yourName: "",
    yourEmail: "",
    yourPhone: "",
    yourRelationship: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    
    // Step 4: ID Documents
    idDocuments: [] // Array of file objects
  })

  const [errors, setErrors] = useState({})
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [dateOfBirth, setDateOfBirth] = useState(null) // Date object for DatePicker
  const [specialNeedsInput, setSpecialNeedsInput] = useState("")
  const [medicationInput, setMedicationInput] = useState("")

  const totalSteps = 4

  // Calculate bottom padding based on footer height
  useEffect(() => {
    const calculatePadding = () => {
      if (footerRef.current) {
        const footerHeight = footerRef.current.offsetHeight
        // Add 120px buffer to allow scrolling past the last item
        const calculatedPadding = footerHeight + 120
        setBottomPadding(calculatedPadding)
      }
    }

    // Calculate on mount and when window resizes
    calculatePadding()
    window.addEventListener('resize', calculatePadding)
    
    // Use a small delay to ensure footer is rendered
    const timeoutId = setTimeout(calculatePadding, 100)

    return () => {
      window.removeEventListener('resize', calculatePadding)
      clearTimeout(timeoutId)
    }
  }, [currentStep]) // Recalculate when step changes

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Family Member Information"
      case 2:
        return careType === "healthcare" 
          ? "Healthcare Provider Details" 
          : "Assisted Living Details"
      case 3:
        return "Your Contact Information"
      case 4:
        return "Identity Verification"
      default:
        return ""
    }
  }

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Tell us about the family member who needs care"
      case 2:
        return careType === "healthcare"
          ? "Help us connect them with the right healthcare providers"
          : "Help us find the best assisted living or long-term care facility"
      case 3:
        return "We need your contact information to proceed"
      case 4:
        return "Please upload identification documents for verification"
      default:
        return ""
    }
  }

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

  // Pure validation function (doesn't update state)
  const checkStepValid = (step) => {
    if (step === 1) {
      return !!(
        formData.firstName.trim() &&
        formData.lastName.trim() &&
        (dateOfBirth || formData.dateOfBirth) &&
        formData.relationship &&
        formData.phoneNumber.trim()
      )
    } else if (step === 2) {
      return !!(
        formData.preferredLocation.trim() &&
        formData.urgency
      )
    } else if (step === 3) {
      return !!(
        formData.yourName.trim() &&
        formData.yourEmail.trim() &&
        formData.yourPhone.trim() &&
        formData.yourRelationship &&
        formData.address.trim() &&
        formData.city.trim() &&
        formData.state &&
        formData.zipCode.trim()
      )
    } else if (step === 4) {
      return uploadedFiles.length > 0
    }
    return false
  }

  // Validation function that updates state (for showing errors)
  const validateStep = (step) => {
    const newErrors = {}
    
    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
      if (!dateOfBirth && !formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required"
      if (!formData.relationship) newErrors.relationship = "Relationship is required"
      if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required"
    } else if (step === 2) {
      if (!formData.preferredLocation.trim()) newErrors.preferredLocation = "Preferred location is required"
      if (!formData.urgency) newErrors.urgency = "Please select urgency level"
    } else if (step === 3) {
      if (!formData.yourName.trim()) newErrors.yourName = "Your name is required"
      if (!formData.yourEmail.trim()) newErrors.yourEmail = "Your email is required"
      if (!formData.yourPhone.trim()) newErrors.yourPhone = "Your phone number is required"
      if (!formData.yourRelationship) newErrors.yourRelationship = "Your relationship is required"
      if (!formData.address.trim()) newErrors.address = "Address is required"
      if (!formData.city.trim()) newErrors.city = "City is required"
      if (!formData.state) newErrors.state = "State is required"
      if (!formData.zipCode.trim()) newErrors.zipCode = "Zip code is required"
    } else if (step === 4) {
      if (uploadedFiles.length === 0) {
        newErrors.idDocuments = "At least one ID document is required"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
      setError("")
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError("")
  }

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }))
    
    setUploadedFiles(prev => [...prev, ...newFiles])
    setFormData(prev => ({
      ...prev,
      idDocuments: [...prev.idDocuments, ...newFiles]
    }))
    
    if (errors.idDocuments) {
      setErrors(prev => ({
        ...prev,
        idDocuments: null
      }))
    }
    
    toast.success(`${files.length} file(s) uploaded successfully`)
  }

  const handleRemoveFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
    setFormData(prev => ({
      ...prev,
      idDocuments: prev.idDocuments.filter(f => f.id !== fileId)
    }))
  }

  // Special Needs handlers
  const handleAddSpecialNeed = () => {
    if (specialNeedsInput.trim()) {
      setFormData(prev => ({
        ...prev,
        specialNeeds: [...prev.specialNeeds, specialNeedsInput.trim()]
      }))
      setSpecialNeedsInput("")
    }
  }

  const handleRemoveSpecialNeed = (index) => {
    setFormData(prev => ({
      ...prev,
      specialNeeds: prev.specialNeeds.filter((_, i) => i !== index)
    }))
  }

  const handleSpecialNeedsFileUpload = (e) => {
    const files = Array.from(e.target.files)
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }))
    
    setFormData(prev => ({
      ...prev,
      specialNeedsDocuments: [...prev.specialNeedsDocuments, ...newFiles]
    }))
    
    toast.success(`${files.length} file(s) uploaded successfully`)
  }

  const handleRemoveSpecialNeedsFile = (fileId) => {
    setFormData(prev => ({
      ...prev,
      specialNeedsDocuments: prev.specialNeedsDocuments.filter(f => f.id !== fileId)
    }))
  }

  // Medications handlers
  const handleAddMedication = () => {
    if (medicationInput.trim()) {
      setFormData(prev => ({
        ...prev,
        currentMedications: [...prev.currentMedications, medicationInput.trim()]
      }))
      setMedicationInput("")
    }
  }

  const handleRemoveMedication = (index) => {
    setFormData(prev => ({
      ...prev,
      currentMedications: prev.currentMedications.filter((_, i) => i !== index)
    }))
  }

  const handleMedicationFileUpload = (e) => {
    const files = Array.from(e.target.files)
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }))
    
    setFormData(prev => ({
      ...prev,
      medicationDocuments: [...prev.medicationDocuments, ...newFiles]
    }))
    
    toast.success(`${files.length} file(s) uploaded successfully`)
  }

  const handleRemoveMedicationFile = (fileId) => {
    setFormData(prev => ({
      ...prev,
      medicationDocuments: prev.medicationDocuments.filter(f => f.id !== fileId)
    }))
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    
    if (!validateStep(currentStep)) {
      return
    }

    setIsSubmitting(true)

    try {
      // Save to localStorage (similar to other mock services)
      const submissions = JSON.parse(localStorage.getItem("familyCareSubmissions") || "[]")
      const submissionData = {
        id: Date.now(),
        ...formData,
        dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : formData.dateOfBirth,
        submittedAt: new Date().toISOString()
      }
      submissions.push(submissionData)
      localStorage.setItem("familyCareSubmissions", JSON.stringify(submissions))
      
      // Navigate to processing page with form data
      navigate("/family-care/processing", { state: { formData: submissionData } })
    } catch (error) {
      setError(error.message || "An error occurred. Please try again.")
      toast.error(error.message || "An error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  const handleCancel = async () => {
    const confirmed = await confirm(
      "Are you sure you want to leave? All entered information will be lost.",
      { variant: "destructive" }
    )
    
    if (confirmed) {
      navigate("/")
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <DatePicker
                date={dateOfBirth}
                onSelect={(date) => {
                  setDateOfBirth(date)
                  if (date) {
                    // Convert Date to YYYY-MM-DD format for formData
                    const year = date.getFullYear()
                    const month = String(date.getMonth() + 1).padStart(2, '0')
                    const day = String(date.getDate()).padStart(2, '0')
                    setFormData(prev => ({
                      ...prev,
                      dateOfBirth: `${year}-${month}-${day}`
                    }))
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      dateOfBirth: ""
                    }))
                  }
                  // Clear error
                  if (errors.dateOfBirth) {
                    setErrors(prev => ({
                      ...prev,
                      dateOfBirth: null
                    }))
                  }
                }}
                placeholder="Select date of birth"
                error={errors.dateOfBirth}
              />
              {errors.dateOfBirth && (
                <p className="text-sm text-red-500">{errors.dateOfBirth}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship *</Label>
              <select
                id="relationship"
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${errors.relationship ? "border-red-500" : "border-gray-300"}`}
              >
                <option value="">Select relationship</option>
                <option value="parent">Parent</option>
                <option value="grandparent">Grandparent</option>
                <option value="spouse">Spouse</option>
                <option value="sibling">Sibling</option>
                <option value="other">Other</option>
              </select>
              {errors.relationship && (
                <p className="text-sm text-red-500">{errors.relationship}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                  className={errors.phoneNumber ? "border-red-500" : ""}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-red-500">{errors.phoneNumber}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4 w-full">
            <div className="space-y-2">
              <Label htmlFor="preferredLocation">Preferred Location *</Label>
              <Input
                id="preferredLocation"
                name="preferredLocation"
                value={formData.preferredLocation}
                onChange={handleChange}
                placeholder="City, State"
                className={errors.preferredLocation ? "border-red-500" : ""}
              />
              {errors.preferredLocation && (
                <p className="text-sm text-red-500">{errors.preferredLocation}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency Level *</Label>
              <select
                id="urgency"
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${errors.urgency ? "border-red-500" : "border-gray-300"}`}
              >
                <option value="">Select urgency</option>
                <option value="immediate">Immediate (within 1 week)</option>
                <option value="urgent">Urgent (within 1 month)</option>
                <option value="moderate">Moderate (within 3 months)</option>
                <option value="planning">Just planning ahead</option>
              </select>
              {errors.urgency && (
                <p className="text-sm text-red-500">{errors.urgency}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialNeeds">Special Needs or Requirements</Label>
              
              {/* Input field for adding new special needs */}
              <div className="flex gap-2">
                <Input
                  id="specialNeeds"
                  value={specialNeedsInput}
                  onChange={(e) => setSpecialNeedsInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddSpecialNeed()
                    }
                  }}
                  placeholder="Enter special need or requirement"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddSpecialNeed}
                  size="icon"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Display selected special needs */}
              {formData.specialNeeds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.specialNeeds.map((need, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                    >
                      <span>{need}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecialNeed(index)}
                        className="text-primary hover:text-primary/70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* File upload for special needs documents */}
              <div className="mt-3">
                <Label className="text-sm text-gray-600 mb-2 block">
                  Upload Documents (Optional)
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    id="special-needs-upload"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleSpecialNeedsFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="special-needs-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-6 w-6 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-600">
                      Click to upload documents
                    </p>
                  </label>
                </div>

                {/* Display uploaded files */}
                {formData.specialNeedsDocuments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {formData.specialNeedsDocuments.map((file) => (
                      <div key={file.id} className="p-2 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecialNeedsFile(file.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentMedications">Current Medications</Label>
              
              {/* Input field for adding new medications */}
              <div className="flex gap-2">
                <Input
                  id="currentMedications"
                  value={medicationInput}
                  onChange={(e) => setMedicationInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddMedication()
                    }
                  }}
                  placeholder="Enter medication name"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddMedication}
                  size="icon"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Display selected medications */}
              {formData.currentMedications.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.currentMedications.map((medication, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                    >
                      <span>{medication}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(index)}
                        className="text-primary hover:text-primary/70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* File upload for medication documents */}
              <div className="mt-3">
                <Label className="text-sm text-gray-600 mb-2 block">
                  Upload Medication Documents (Optional)
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    id="medication-upload"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleMedicationFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="medication-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-6 w-6 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-600">
                      Click to upload medication documents
                    </p>
                  </label>
                </div>

                {/* Display uploaded files */}
                {formData.medicationDocuments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {formData.medicationDocuments.map((file) => (
                      <div key={file.id} className="p-2 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicationFile(file.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yourName">Your Name *</Label>
                <Input
                  id="yourName"
                  name="yourName"
                  value={formData.yourName}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className={errors.yourName ? "border-red-500" : ""}
                />
                {errors.yourName && (
                  <p className="text-sm text-red-500">{errors.yourName}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="yourRelationship">Your Relationship *</Label>
                <select
                  id="yourRelationship"
                  name="yourRelationship"
                  value={formData.yourRelationship}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.yourRelationship ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="">Select relationship</option>
                  <option value="child">Child</option>
                  <option value="spouse">Spouse</option>
                  <option value="sibling">Sibling</option>
                  <option value="parent">Parent</option>
                  <option value="guardian">Guardian</option>
                  <option value="other">Other</option>
                </select>
                {errors.yourRelationship && (
                  <p className="text-sm text-red-500">{errors.yourRelationship}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="yourEmail">Your Email *</Label>
                <Input
                  id="yourEmail"
                  name="yourEmail"
                  type="email"
                  value={formData.yourEmail}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className={errors.yourEmail ? "border-red-500" : ""}
                />
                {errors.yourEmail && (
                  <p className="text-sm text-red-500">{errors.yourEmail}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="yourPhone">Your Phone Number *</Label>
                <Input
                  id="yourPhone"
                  name="yourPhone"
                  type="tel"
                  value={formData.yourPhone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                  className={errors.yourPhone ? "border-red-500" : ""}
                />
                {errors.yourPhone && (
                  <p className="text-sm text-red-500">{errors.yourPhone}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address"
                className={errors.address ? "border-red-500" : ""}
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  className={errors.city ? "border-red-500" : ""}
                />
                {errors.city && (
                  <p className="text-sm text-red-500">{errors.city}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Combobox
                  options={US_STATES}
                  value={formData.state}
                  onChange={(value) => {
                    setFormData(prev => ({
                      ...prev,
                      state: value
                    }))
                    if (errors.state) {
                      setErrors(prev => ({
                        ...prev,
                        state: null
                      }))
                    }
                  }}
                  placeholder="Select state"
                  searchPlaceholder="Search states..."
                  error={errors.state}
                />
                {errors.state && (
                  <p className="text-sm text-red-500">{errors.state}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code *</Label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="12345"
                  className={errors.zipCode ? "border-red-500" : ""}
                />
                {errors.zipCode && (
                  <p className="text-sm text-red-500">{errors.zipCode}</p>
                )}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Required Documents:</strong> Please upload at least one form of identification. 
                Accepted formats: Driver's License, Passport, State ID, or Birth Certificate.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Upload ID Documents *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, PNG, JPG up to 10MB
                  </p>
                </label>
              </div>
              {errors.idDocuments && (
                <p className="text-sm text-red-500">{errors.idDocuments}</p>
              )}
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Documents</Label>
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const isStepValid = () => {
    return checkStepValid(currentStep)
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <ConfirmDialog />
      
      {/* Header */}
      <header className="w-full border-b border-gray-200 bg-white flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">Mock Assisted Living</h1>
            </div>

            {/* Cancel Button */}
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main 
        className="flex-1 overflow-y-auto overflow-x-hidden min-h-0" 
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth'
        }}
      >
        <div className="flex justify-center pt-8 p-4 sm:p-6 lg:px-8" style={{ paddingBottom: `${bottomPadding}px` }}>
          <div className="w-full max-w-2xl">
            <div className="bg-white">
              <div className="space-y-6">
                {/* Form Content */}
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold">
                      <span className="text-muted-foreground font-semibold">
                        {currentStep} / {totalSteps}
                      </span>{" "}
                      {getStepTitle()}
                    </h2>
                    <p className="text-muted-foreground mt-2">{getStepDescription()}</p>
                  </div>
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                  <form 
                    onSubmit={currentStep === totalSteps ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} 
                    id="family-care-form"
                    className="w-full"
                  >
                    <div className="w-full pb-8">
                      {renderStepContent()}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Footer */}
      <footer ref={footerRef} className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Bar */}
          <div className="pt-4 pb-3">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((step) => (
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
              {currentStep === totalSteps ? (
                <Button 
                  type="submit" 
                  form="family-care-form"
                  disabled={!isStepValid() || isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  form="family-care-form"
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

