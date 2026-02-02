import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { mockSurveyService } from "../../services/mockSurveyService"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import SurveyMetadataForm from "../../components/Surveys/SurveyMetadataForm"
import SectionManager from "../../components/Surveys/SectionManager"
import QuestionImporter from "../../components/Surveys/QuestionImporter"
import PhaseNavigator from "../../components/Surveys/PhaseNavigator"
import SimpleSessionBuilder from "../../components/Surveys/SimpleSessionBuilder"
import SessionImportMethod, { IMPORT_METHODS } from "../../components/Surveys/SessionImportMethod"
import TeamMemberSetup from "../../components/Surveys/TeamMemberSetup"
import SessionAssignment from "../../components/Surveys/SessionAssignment"
import { DndContext } from "@dnd-kit/core"
import { ArrowLeft, ArrowRight, Check, LogOut, User, X, Save, Eye, Users } from "lucide-react"
import { useUser } from "../../context/UserContext"
import { mockAuthService } from "../../services/mockAuthService"
import { mockTeamMemberService } from "../../services/mockTeamMemberService"
import { validateState } from "../../utils/validators"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useConfirm } from "../../hooks/useConfirm"

export default function SurveyBuilderMultiStep() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user, logout, isLoading: authLoading } = useAuth()
  const { facility: userFacility } = useUser()
  const { confirm, ConfirmDialog } = useConfirm()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const [isNewSurvey, setIsNewSurvey] = useState(true)
  const [savedSurveyId, setSavedSurveyId] = useState(null)

  const [survey, setSurvey] = useState({
    title: "",
    description: "",
    type: "Standard",
    state: "",
    regulationReferences: [],
    phases: [], // New: phases instead of sections
    facilityId: null,
    documents: [],
    checklists: [],
    images: [],
    inviteTeamMembers: false,
    teamMemberAssignments: []
  })

  const [errors, setErrors] = useState({})
  const [selectedPhaseId, setSelectedPhaseId] = useState(null)
  const [selectedFacilityId, setSelectedFacilityId] = useState(null)
  const [facilities, setFacilities] = useState([])
  const [importMethod, setImportMethod] = useState(null) // Track selected import method for step 2
  const [bulkUploadData, setBulkUploadData] = useState(null) // Store bulk upload data
  const [linkedSystem, setLinkedSystem] = useState(null) // Track linked system (Epic, PointClickCare, etc.)

  // Load facilities
  useEffect(() => {
    const loadFacilities = () => {
      const allFacilities = mockAuthService.getAllFacilities()
      setFacilities(allFacilities)
    }
    loadFacilities()
  }, [])

  // Auto-select user's facility if available
  useEffect(() => {
    if (userFacility && !selectedFacilityId) {
      setSelectedFacilityId(userFacility.id)
      setSurvey(prev => ({ ...prev, facilityId: userFacility.id }))
    }
  }, [userFacility, selectedFacilityId])

  // Load survey if editing
  useEffect(() => {
    if (id) {
      loadSurvey(id)
    }
  }, [id])

  // Auto-select first phase when phases are loaded
  useEffect(() => {
    if (survey.phases && survey.phases.length > 0 && !selectedPhaseId) {
      setSelectedPhaseId(survey.phases[0].id)
    }
  }, [survey.phases, selectedPhaseId])

  const loadSurvey = async (surveyId) => {
    try {
      setIsLoading(true)
      const loadedSurvey = await mockSurveyService.getSurveyById(surveyId)
      if (loadedSurvey) {
        // Load team members from mock service
        try {
          const teamMembers = await mockTeamMemberService.getTeamMembersBySurvey(surveyId)
          loadedSurvey.teamMemberAssignments = teamMembers
        } catch (error) {
          console.error("Failed to load team members:", error)
          // Continue without team members if loading fails
        }
        
        setSurvey(loadedSurvey)
        setIsNewSurvey(false)
        setSavedSurveyId(surveyId)
      } else {
        setError("Survey not found")
      }
    } catch (error) {
      console.error("Failed to load survey:", error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMetadataChange = (updatedMetadata) => {
    setSurvey(prev => {
      const updated = { ...prev, ...updatedMetadata }
      
      // If inviteTeamMembers is toggled off, adjust current step if needed
      if (prev.inviteTeamMembers && !updated.inviteTeamMembers) {
        // If we're on step 2 (team setup) or step 5 (session assignment), go back
        if (currentStep === 2) {
          setCurrentStep(1)
        } else if (currentStep === 5) {
          setCurrentStep(4) // Go to review (which becomes step 4)
        }
      }
      
      return updated
    })
    setErrors({})
  }

  // Session management handlers (completely dynamic - no hardcoded content)
  const handleAddPhase = () => {
    const newPhase = {
      id: `session-${Date.now()}`,
      name: "New Session",
      description: "",
      order: (survey.phases?.length || 0) + 1,
      groups: [], // Groups within session
      documents: []
    }
    setSurvey(prev => ({
      ...prev,
      phases: [...(prev.phases || []), newPhase]
    }))
    setSelectedPhaseId(newPhase.id)
  }

  // Handle importing multiple sessions
  const handleImportSessions = (importedSessions) => {
    const updatedSessions = importedSessions.map((session, index) => ({
      ...session,
      id: session.id || `session-${Date.now()}-${index}`,
      order: session.order || (survey.phases?.length || 0) + index + 1,
      groups: session.groups || [],
      documents: session.documents || []
    }))
    
    setSurvey(prev => ({
      ...prev,
      phases: [...(prev.phases || []), ...updatedSessions]
    }))
    
    // Select the first imported session
    if (updatedSessions.length > 0) {
      setSelectedPhaseId(updatedSessions[0].id)
    }
  }

  const handlePhaseSelect = (phaseId) => {
    setSelectedPhaseId(phaseId)
  }

  const handlePhaseUpdate = (phaseId, updates) => {
    setSurvey(prev => ({
      ...prev,
      phases: prev.phases.map(p => 
        p.id === phaseId ? { ...p, ...updates } : p
      )
    }))
  }

  const handleDeletePhase = async (phaseId) => {
    const confirmed = await confirm("Are you sure you want to delete this session?", {
      title: "Delete Session",
      variant: "destructive",
      confirmText: "Delete"
    })
    if (confirmed) {
      setSurvey(prev => ({
        ...prev,
        phases: prev.phases.filter(p => p.id !== phaseId)
      }))
      if (selectedPhaseId === phaseId) {
        const remainingPhases = survey.phases.filter(p => p.id !== phaseId)
        setSelectedPhaseId(remainingPhases.length > 0 ? remainingPhases[0].id : null)
      }
    }
  }

      // Group management handlers
      const handleAddGroup = (sessionId, group) => {
        const session = survey.phases.find(p => p.id === sessionId)
        if (!session) return
        handlePhaseUpdate(sessionId, {
          groups: [...(session.groups || []), group]
        })
      }

      const handleUpdateGroup = (sessionId, groupId, updates) => {
        const session = survey.phases.find(p => p.id === sessionId)
        if (!session) return
        handlePhaseUpdate(sessionId, {
          groups: (session.groups || []).map(g =>
            g.id === groupId ? { ...g, ...updates } : g
          )
        })
      }

      const handleDeleteGroup = (sessionId, groupId) => {
        const session = survey.phases.find(p => p.id === sessionId)
        if (!session) return
        handlePhaseUpdate(sessionId, {
          groups: (session.groups || []).filter(g => g.id !== groupId)
        })
      }

      // Field management handlers (direct on sessions)
      const handleAddField = (sessionId, field, groupId = null) => {
        // Ensure field has description property
        const fieldWithDescription = {
          ...field,
          description: field.description || ""
        }
        const session = survey.phases.find(p => p.id === sessionId)
        if (!session) return

        if (groupId) {
          // Add field to specific group
          const updatedGroups = (session.groups || []).map(group => {
            if (group.id === groupId) {
              return {
                ...group,
                fields: [fieldWithDescription, ...(group.fields || [])]
              }
            }
            return group
          })
          handlePhaseUpdate(sessionId, { groups: updatedGroups })
        } else {
          // Add to ungrouped fields at the beginning
          const currentFields = session.fields || []
          handlePhaseUpdate(sessionId, {
            fields: [fieldWithDescription, ...currentFields]
          })
        }
      }

  const handleUpdateField = (sessionId, fieldId, updates) => {
    const session = survey.phases.find(p => p.id === sessionId)
    if (!session) return
    
    handlePhaseUpdate(sessionId, {
      fields: session.fields.map(f => 
        f.id === fieldId ? { ...f, ...updates } : f
      )
    })
  }

  const handleDeleteField = (sessionId, fieldId) => {
    const session = survey.phases.find(p => p.id === sessionId)
    if (!session) return
    
    handlePhaseUpdate(sessionId, {
      fields: session.fields.filter(f => f.id !== fieldId)
    })
  }

  const handleFieldsReorder = (sessionId, reorderedFields) => {
    handlePhaseUpdate(sessionId, { fields: reorderedFields })
  }


  const handleAddDocument = (phaseId, document) => {
    const phase = survey.phases.find(p => p.id === phaseId)
    if (!phase) return
    
    handlePhaseUpdate(phaseId, {
      documents: [...(phase.documents || []), document]
    })
  }

  const handleSectionsChange = (sections) => {
    setSurvey(prev => ({ ...prev, sections }))
    // Auto-select first section if none selected
    if (sections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(sections[0].id)
    }
  }

  const handleAddSection = () => {
    const newSection = {
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: "",
      description: "",
      order: (survey.sections?.length || 0) + 1,
      questions: []
    }
    const updatedSections = [...(survey.sections || []), newSection]
    handleSectionsChange(updatedSections)
    setSelectedSectionId(newSection.id)
  }

  const handleDeleteSection = (sectionId) => {
    if (survey.sections.length <= 1) {
      toast.error("At least one section is required")
      return
    }
    const updatedSections = survey.sections.filter(s => s.id !== sectionId)
    handleSectionsChange(updatedSections)
    // Select first section if deleted section was selected
    if (selectedSectionId === sectionId && updatedSections.length > 0) {
      setSelectedSectionId(updatedSections[0].id)
    }
  }

  const handleSectionSelect = (sectionId, questionId = null) => {
    setSelectedSectionId(sectionId)
    if (questionId) {
      setSelectedQuestionId(questionId)
    }
    setSelectedTab("sections") // Switch to sections tab
  }

  const handleFacilitySelect = (facilityId) => {
    setSelectedFacilityId(facilityId)
    setSurvey(prev => ({ ...prev, facilityId }))
  }

  const handleAddFacility = () => {
    // Navigate to facility creation or show modal
    toast.info("Facility creation will be implemented. For now, select from existing facilities.")
  }

  const handleTabSelect = (tabId) => {
    setSelectedTab(tabId)
  }

  const handleQuestionsImported = (questions) => {
    if (!survey.sections || survey.sections.length === 0) {
      toast.error("Please add at least one section first")
      return
    }

    // Assign questions to sections
    const updatedSections = [...survey.sections]
    
    questions.forEach((question, index) => {
      const targetSectionId = question.sectionId || updatedSections[0].id
      const sectionIndex = updatedSections.findIndex(s => s.id === targetSectionId)
      
      if (sectionIndex >= 0) {
        if (!updatedSections[sectionIndex].questions) {
          updatedSections[sectionIndex].questions = []
        }
        
        const existingQuestions = updatedSections[sectionIndex].questions.length
        const newQuestion = {
          ...question,
          id: question.id || `q-${Date.now()}-${index}`,
          sectionId: targetSectionId,
          order: existingQuestions + 1
        }
        
        updatedSections[sectionIndex].questions.push(newQuestion)
      }
    })

    setSurvey(prev => ({ ...prev, sections: updatedSections }))
  }

  const validateStep = (step) => {
    const newErrors = {}

    if (step === 1) {
      // Step 1: Survey Metadata
      if (!survey.title || survey.title.trim() === "") {
        newErrors.title = "Survey title is required"
      }
      if (!survey.type) {
        newErrors.type = "Survey type is required"
      }
      const stateError = validateState(survey.state)
      if (stateError) {
        newErrors.state = stateError
      }
    } else if (step === 2 && survey.inviteTeamMembers) {
      // Step 2: Team Member Setup (only if inviteTeamMembers is true)
      // No validation required - can skip if no team members
    } else if ((step === 2 && !survey.inviteTeamMembers) || (step === 3 && survey.inviteTeamMembers)) {
      // Session Import Method Selection
      if (!importMethod) {
        newErrors.importMethod = "Please select an import method"
      }
    } else if ((step === 3 && !survey.inviteTeamMembers) || (step === 4 && survey.inviteTeamMembers)) {
      // Survey Setup (Sessions/Groups/Fields)
      if (!survey.phases || survey.phases.length === 0) {
        newErrors.phases = "At least one session is required"
      }
      // Validate session names
      const emptyNames = survey.phases.some(p => !p.name || p.name.trim() === "")
      if (emptyNames) {
        newErrors.phases = "All sessions must have a name"
      }
    } else if ((step === 4 && !survey.inviteTeamMembers) || (step === 5 && survey.inviteTeamMembers)) {
      // Session Assignment (only if inviteTeamMembers is true)
      // No validation required - optional step
    } else if ((step === 4 && !survey.inviteTeamMembers) || (step === 6 && survey.inviteTeamMembers)) {
      // Review - validate everything
      if (!survey.title || survey.title.trim() === "") {
        newErrors.title = "Survey title is required"
      }
      if (!survey.state) {
        newErrors.state = "State is required"
      }
      if (!survey.phases || survey.phases.length === 0) {
        newErrors.phases = "At least one session is required"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle import method selection
  const handleImportMethodSelect = (method) => {
    setImportMethod(method)
    setErrors({})
  }

  // Handle bulk upload
  const handleBulkUpload = (data) => {
    setBulkUploadData(data)
    setError("")
    
    // Data already contains parsed sessions
    let sessions = []
    
    if (data.sessions && Array.isArray(data.sessions)) {
      sessions = data.sessions
    } else if (data.type === 'json' && data.data) {
      try {
        const parsed = JSON.parse(data.data)
        sessions = Array.isArray(parsed) ? parsed : (parsed.sessions || [])
      } catch (e) {
        setError("Invalid JSON format: " + e.message)
        return
      }
    } else {
      setError("No valid session data found")
      return
    }
    
    // Normalize sessions
    const normalizedSessions = sessions.map((s, idx) => ({
      id: s.id || `phase-${Date.now()}-${idx}`,
      name: s.name || s.title || `Session ${idx + 1}`,
      description: s.description || "",
      order: s.order || (survey.phases?.length || 0) + idx + 1,
      groups: s.groups || [],
      documents: s.documents || []
    }))
    
    if (normalizedSessions.length === 0) {
      setError("No sessions found in the uploaded data")
      return
    }
    
    // Add sessions to survey
    setSurvey(prev => ({
      ...prev,
      phases: [...(prev.phases || []), ...normalizedSessions]
    }))
    
    // Select the first imported session
    if (normalizedSessions.length > 0) {
      setSelectedPhaseId(normalizedSessions[0].id)
    }
    
    // Clear bulk upload data after successful import
    setBulkUploadData(null)
    
    // Show success message
    toast.success(`Successfully imported ${normalizedSessions.length} session(s)`)
  }

  // Handle system link
  const handleSystemLink = (systemType) => {
    setLinkedSystem(systemType)
    // Simulate system connection
    setTimeout(() => {
      const mockSessions = [
        { id: `phase-${Date.now()}-1`, name: `${systemType === 'epic' ? 'Epic' : systemType === 'pointclickcare' ? 'PointClickCare' : 'System'}: Resident Records`, description: "Import from system", order: 1, groups: [], documents: [] },
        { id: `phase-${Date.now()}-2`, name: `${systemType === 'epic' ? 'Epic' : systemType === 'pointclickcare' ? 'PointClickCare' : 'System'}: Care Plans`, description: "Import from system", order: 2, groups: [], documents: [] }
      ]
      
      setSurvey(prev => ({
        ...prev,
        phases: [...(prev.phases || []), ...mockSessions]
      }))
      
      if (mockSessions.length > 0) {
        setSelectedPhaseId(mockSessions[0].id)
      }
    }, 1000)
  }

  // Calculate total steps based on whether team members are invited
  const getTotalSteps = () => {
    let steps = 4 // Base steps: Metadata, Session Method, Setup, Review
    if (survey.inviteTeamMembers) {
      steps += 2 // Add team member setup and session assignment steps
    }
    return steps
  }

  // Get display step number (what user sees) - ensures it's always valid
  const getDisplayStep = () => {
    const maxSteps = getTotalSteps()
    // Ensure currentStep is never greater than maxSteps
    if (currentStep > maxSteps) {
      return maxSteps
    }
    return currentStep
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      const maxSteps = getTotalSteps()
      // Ensure we don't go beyond max steps
      const nextStep = Math.min(currentStep + 1, maxSteps)
      setCurrentStep(nextStep)
      setError("")
    }
  }

  // Ensure current step is valid when survey settings change
  useEffect(() => {
    const maxSteps = getTotalSteps()
    // If inviteTeamMembers is disabled and we're on team member steps, adjust
    if (!survey.inviteTeamMembers) {
      if (currentStep === 2) {
        // Team member setup step - go to step 1
        setCurrentStep(1)
        return
      } else if (currentStep === 5) {
        // Session assignment step - go to step 4 (review)
        setCurrentStep(4)
        return
      }
    }
    // Ensure we don't exceed max steps
    if (currentStep > maxSteps) {
      setCurrentStep(maxSteps)
    }
  }, [survey.inviteTeamMembers]) // Only depend on inviteTeamMembers, not currentStep

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setError("")
  }

  const handleSkip = () => {
    // Skip current step and move to next
    const maxSteps = getTotalSteps()
    if (currentStep < maxSteps) {
      setCurrentStep(prev => prev + 1)
      setError("")
    }
  }

  const handleTeamMemberAssignmentsChange = async (assignments) => {
    // Update survey state immediately
    setSurvey(prev => ({ ...prev, teamMemberAssignments: assignments }))
    
    // Auto-save to localStorage if survey ID exists
    if (savedSurveyId || survey.id) {
      try {
        const surveyId = savedSurveyId || survey.id
        const surveyData = {
          ...survey,
          teamMemberAssignments: assignments,
          facilityId: user?.facilityId || null,
          lastModifiedBy: user?.id || "unknown"
        }
        await mockSurveyService.updateSurvey(surveyId, surveyData)
      } catch (error) {
        console.error("Failed to auto-save team members:", error)
        // Don't show error to user, just log it
      }
    }
  }

  const handleSave = async () => {
    if (!validateStep(currentStep)) {
      return
    }

    try {
      setIsSubmitting(true)
      setError("")

      const surveyData = {
        ...survey,
        facilityId: user?.facilityId || null,
        createdBy: user?.id || "unknown",
        lastModifiedBy: user?.id || "unknown"
      }

      let savedSurvey
      if (isNewSurvey || !savedSurveyId) {
        savedSurvey = await mockSurveyService.createSurvey(surveyData)
        setSavedSurveyId(savedSurvey.id)
        setIsNewSurvey(false)
      } else {
        savedSurvey = await mockSurveyService.updateSurvey(savedSurveyId, surveyData)
      }

      setSurvey(savedSurvey)
      
      // Update URL if it's a new survey
      if (isNewSurvey && savedSurvey.id) {
        navigate(`/surveys/builder/${savedSurvey.id}`, { replace: true })
      }

      return true
    } catch (error) {
      console.error("Failed to save survey:", error)
      setError(error.message || "Failed to save survey. Please try again.")
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePublish = async () => {
    const saved = await handleSave()
    if (!saved) return

    try {
      setIsSubmitting(true)
      await mockSurveyService.publishSurvey(savedSurveyId)
      toast.success("Survey published successfully!")
      navigate("/surveys")
    } catch (error) {
      setError(error.message || "Failed to publish survey. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePreview = () => {
    if (!savedSurveyId && !survey.id) {
      toast.warning("Please save the survey before previewing")
      return
    }
    const surveyId = savedSurveyId || survey.id
    navigate(`/surveys/preview/${surveyId}`)
  }

  const handleCancel = async () => {
    const confirmed = await confirm("Are you sure you want to leave? Unsaved changes will be lost.", {
      title: "Leave Survey Builder",
      variant: "destructive",
      confirmText: "Leave"
    })
    if (confirmed) {
      navigate("/dashboard")
    }
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

  const renderTabContent = () => {
    // Content for steps 2, 3, 4 based on selected tab in left panel
    switch (selectedTab) {
      case "facility":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Facility Setup</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select or configure the facility for this survey
              </p>
            </div>
            {selectedFacilityId ? (
              <div className="p-6 border border-gray-200 rounded-lg">
                {(() => {
                  const facility = facilities.find(f => f.id === selectedFacilityId)
                  return facility ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Facility Name</p>
                        <p className="text-base font-semibold">{facility.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Address</p>
                        <p className="text-base">{facility.address}, {facility.city}, {facility.state} {facility.zipCode}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">License Number</p>
                        <p className="text-base">{facility.licenseNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Capacity</p>
                        <p className="text-base">{facility.capacity} residents</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No facility selected</p>
                  )
                })()}
              </div>
            ) : (
              <div className="p-6 border border-gray-200 rounded-lg text-center">
                <p className="text-muted-foreground mb-4">Select a facility from the left panel</p>
              </div>
            )}
          </div>
        )

      case "sections":
        // Show sections editor
        if (currentStep === 2) {
          const selectedSection = survey.sections?.find(s => s.id === selectedSectionId)
          if (selectedSection) {
            return (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="section-title">
                      Section Title <span className="text-destructive">*</span>
                    </Label>
                    <input
                      id="section-title"
                      type="text"
                      placeholder="e.g., Resident Care Services"
                      value={selectedSection.title || ""}
                      onChange={(e) => {
                        const updatedSections = survey.sections.map(s =>
                          s.id === selectedSectionId
                            ? { ...s, title: e.target.value }
                            : s
                        )
                        handleSectionsChange(updatedSections)
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="section-description">Description</Label>
                    <textarea
                      id="section-description"
                      rows={3}
                      placeholder="Enter section description..."
                      value={selectedSection.description || ""}
                      onChange={(e) => {
                        const updatedSections = survey.sections.map(s =>
                          s.id === selectedSectionId
                            ? { ...s, description: e.target.value }
                            : s
                        )
                        handleSectionsChange(updatedSections)
                      }}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Questions in this section: {selectedSection.questions?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            )
          } else {
            return (
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-2">Select a section from the left panel to edit</p>
                <p className="text-sm">Or add a new section using the + button</p>
              </div>
            )
          }
        }
        return renderStepContent()

      case "questions":
        // Show question importer
        return (
          <div className="space-y-6">
            <QuestionImporter
              sections={survey.sections || []}
              onQuestionsImported={handleQuestionsImported}
            />
            {errors.questions && (
              <p className="text-sm text-destructive">{errors.questions}</p>
            )}
            {survey.sections && survey.sections.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Current Questions by Section</h4>
                <div className="space-y-2">
                  {survey.sections.map((section, sIndex) => (
                    <div key={section.id || sIndex} className="text-sm">
                      <strong>{section.title || `Section ${sIndex + 1}`}:</strong>{" "}
                      {section.questions?.length || 0} question(s)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case "documents":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Documents</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload documents for surveyors to review (off-site preparation materials, reference documents, etc.)
              </p>
            </div>
            
            {/* Document Upload Area */}
            <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h4 className="font-semibold mb-2">Upload Documents</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Add documents that surveyors need to review before or during the survey
              </p>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.multiple = true
                  input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt'
                  input.onchange = (e) => {
                    const files = Array.from(e.target.files || [])
                    const newDocuments = files.map((file, index) => ({
                      id: `doc-${Date.now()}-${index}`,
                      name: file.name,
                      type: file.type,
                      size: file.size,
                      file: file
                    }))
                    setSurvey(prev => ({
                      ...prev,
                      documents: [...(prev.documents || []), ...newDocuments]
                    }))
                  }
                  input.click()
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
            </div>

            {/* Documents List */}
            {survey.documents && survey.documents.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Uploaded Documents</h4>
                <div className="space-y-2">
                  {survey.documents.map((doc, index) => (
                    <div key={doc.id || index} className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Folder className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.size ? `${(doc.size / 1024).toFixed(2)} KB` : "File"}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updatedDocs = survey.documents.filter((_, i) => i !== index)
                          setSurvey(prev => ({ ...prev, documents: updatedDocs }))
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case "checklists":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Checklists</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create checklists for surveyors to complete during the survey
              </p>
            </div>
            
            {/* Checklist Form */}
            <div className="p-6 border border-gray-200 rounded-lg space-y-4">
              <div className="space-y-2">
                <Label htmlFor="checklist-name">
                  Checklist Name <span className="text-destructive">*</span>
                </Label>
                <input
                  id="checklist-name"
                  type="text"
                  placeholder="e.g., Off-site Preparation Checklist"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      const newChecklist = {
                        id: `checklist-${Date.now()}`,
                        name: e.target.value.trim(),
                        items: [],
                        createdAt: new Date().toISOString()
                      }
                      setSurvey(prev => ({
                        ...prev,
                        checklists: [...(prev.checklists || []), newChecklist]
                      }))
                      e.target.value = ''
                    }
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Press Enter to add checklist, then click on it to add items
              </p>
            </div>

            {/* Checklists List */}
            {survey.checklists && survey.checklists.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Created Checklists</h4>
                <div className="space-y-2">
                  {survey.checklists.map((checklist, index) => (
                    <div key={checklist.id || index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-5 w-5 text-muted-foreground" />
                          <h5 className="font-medium">{checklist.name}</h5>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updatedChecklists = survey.checklists.filter((_, i) => i !== index)
                            setSurvey(prev => ({ ...prev, checklists: updatedChecklists }))
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="space-y-2 ml-7">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Add checklist item..."
                            className="flex-1 h-8 text-sm border border-gray-200 rounded px-2"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.target.value.trim()) {
                                const updatedChecklists = survey.checklists.map((c, i) => 
                                  i === index
                                    ? { ...c, items: [...(c.items || []), { id: Date.now(), text: e.target.value.trim(), checked: false }] }
                                    : c
                                )
                                setSurvey(prev => ({ ...prev, checklists: updatedChecklists }))
                                e.target.value = ''
                              }
                            }}
                          />
                        </div>
                        {checklist.items && checklist.items.length > 0 && (
                          <div className="space-y-1 mt-2">
                            {checklist.items.map((item, itemIndex) => (
                              <div key={item.id || itemIndex} className="flex items-center gap-2 text-sm">
                                <input type="checkbox" disabled className="h-4 w-4" />
                                <span>{item.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case "images":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Images</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload and manage images for this survey
              </p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">Image management coming soon...</p>
                <Button type="button" variant="outline" onClick={() => toast.info("Image upload will be implemented")}>
                  Upload Image
                </Button>
              </div>
            </div>
          </div>
        )

      default:
        return renderStepContent()
    }
  }

  const renderStepContent = () => {
    // Determine which step we're actually on
    let actualStep = currentStep
    if (survey.inviteTeamMembers) {
      // Steps: 1=Metadata, 2=Team Setup, 3=Session Method, 4=Survey Setup, 5=Session Assignment, 6=Review
      if (currentStep === 2) {
        // Team Member Setup
        return (
          <div className="space-y-6">
            <TeamMemberSetup
              teamMemberAssignments={survey.teamMemberAssignments || []}
              onChange={handleTeamMemberAssignmentsChange}
            />
          </div>
        )
      } else if (currentStep === 3) {
        actualStep = 2 // Session Method
      } else if (currentStep === 4) {
        actualStep = 3 // Survey Setup
      } else if (currentStep === 5) {
        // Session Assignment
        return (
          <div className="space-y-6">
            <SessionAssignment
              teamMemberAssignments={survey.teamMemberAssignments || []}
              sessions={survey.phases || []}
              onChange={handleTeamMemberAssignmentsChange}
            />
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        )
      } else if (currentStep === 6) {
        actualStep = 4 // Review
      }
    }

    switch (actualStep) {
      case 1:
        // Step 1: Survey Metadata
        return (
          <div className="space-y-6">
            <SurveyMetadataForm
              survey={survey}
              onChange={handleMetadataChange}
              errors={errors}
            />
            {errors.sections && (
              <p className="text-sm text-destructive">{errors.sections}</p>
            )}
          </div>
        )

      case 2:
        // Step 2: Session Import Method Selection
        return (
          <SessionImportMethod
            selectedMethod={importMethod}
            onMethodSelect={handleImportMethodSelect}
            onBulkUpload={handleBulkUpload}
            onSystemLink={handleSystemLink}
            jsonInput={bulkUploadData?.type === 'json' ? bulkUploadData.data : ""}
            onJsonInputChange={(value) => setBulkUploadData({ type: 'json', data: value })}
            fileInput={bulkUploadData instanceof File ? bulkUploadData : null}
            onFileInputChange={(file) => setBulkUploadData(file)}
          />
        )

      case 3:
        // Step 3: Build Survey - Show simple session builder
        const selectedPhase = survey.phases?.find(p => p.id === selectedPhaseId)
        return (
          <SimpleSessionBuilder
            session={selectedPhase}
            onSessionUpdate={(updates) => handlePhaseUpdate(selectedPhaseId, updates)}
            onAddField={(field, groupId) => handleAddField(selectedPhaseId, field, groupId)}
            onUpdateField={(fieldId, updates, groupId) => handleUpdateField(selectedPhaseId, fieldId, updates, groupId)}
            onDeleteField={(fieldId, groupId) => handleDeleteField(selectedPhaseId, fieldId, groupId)}
            onFieldsReorder={(reordered) => handleFieldsReorder(selectedPhaseId, reordered)}
            onAddGroup={(group) => handleAddGroup(selectedPhaseId, group)}
            onUpdateGroup={(groupId, updates) => handleUpdateGroup(selectedPhaseId, groupId, updates)}
            onDeleteGroup={(groupId) => handleDeleteGroup(selectedPhaseId, groupId)}
          />
        )

      case 4:
        // Step 4: Review & Publish
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
                Everything looks good. Review your survey before publishing.
              </p>
            </div>

            {/* Survey Summary */}
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-base mb-2">Survey Information</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Title:</strong> {survey.title || "Untitled Survey"}</p>
                  <p><strong>Type:</strong> {survey.type}</p>
                  <p><strong>State:</strong> {survey.state || "Not set"}</p>
                  <p><strong>Description:</strong> {survey.description || "No description"}</p>
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-base mb-2">Sessions & Groups</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {survey.phases?.length || 0} session(s)
                </p>
                <div className="space-y-2">
                  {survey.phases?.map((phase, index) => (
                    <div key={phase.id || index} className="text-sm">
                      <strong>{index + 1}.</strong> {phase.name || `Session ${index + 1}`}
                      <span className="text-muted-foreground ml-2">
                        ({phase.groups?.length || 0} groups)
                      </span>
                      {phase.groups && phase.groups.length > 0 && (
                        <ul className="list-disc list-inside ml-4 text-muted-foreground">
                          {phase.groups.map((group, gIndex) => (
                            <li key={group.id || gIndex}>
                              {group.name || `Group ${gIndex + 1}`} ({group.fields?.length || 0} fields)
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Members Section - Only show if team members were invited */}
              {survey.inviteTeamMembers && survey.teamMemberAssignments && survey.teamMemberAssignments.length > 0 && (
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-5 w-5 text-gray-600" />
                    <h4 className="font-semibold text-base">Team Members</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {survey.teamMemberAssignments.length} team member(s) assigned
                  </p>
                  <div className="space-y-4">
                    {survey.teamMemberAssignments.map((member) => {
                      const getInitials = (name) => {
                        if (!name) return "U"
                        const words = name.trim().split(" ")
                        if (words.length === 1) {
                          return words[0].charAt(0).toUpperCase()
                        }
                        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
                      }

                      // Get assigned sessions for this member
                      const assignedSessions = member.teamRole === "team_coordinator"
                        ? survey.phases || [] // Coordinators have access to all sessions
                        : (survey.phases || []).filter(phase => 
                            member.assignedSessions?.includes(phase.id)
                          )

                      return (
                        <div key={member.userId} className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm flex-shrink-0">
                              {getInitials(member.userName)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm">{member.userName}</p>
                                <Badge 
                                  variant={member.teamRole === "team_coordinator" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {member.teamRole === "team_coordinator" ? "Team Coordinator" : "Team Member"}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">{member.userEmail}</p>
                              
                              {/* Permissions for Team Members */}
                              {member.teamRole === "team_member" && member.memberPermissions && (
                                <div className="mb-2">
                                  <p className="text-xs text-muted-foreground">
                                    <strong>Permissions:</strong>{" "}
                                    {member.memberPermissions.canRead && "Read"}
                                    {member.memberPermissions.canWrite && ", Write"}
                                    {member.memberPermissions.canEdit && ", Edit"}
                                  </p>
                                </div>
                              )}

                              {/* Assigned Sessions */}
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-700 mb-1">
                                  {member.teamRole === "team_coordinator" 
                                    ? "Access: All Sessions" 
                                    : `Assigned Sessions (${assignedSessions.length}):`
                                  }
                                </p>
                                {assignedSessions.length > 0 ? (
                                  <ul className="list-disc list-inside ml-2 space-y-0.5">
                                    {assignedSessions.map((session, idx) => (
                                      <li key={session.id || idx} className="text-xs text-muted-foreground">
                                        {session.name || session.title || `Session ${session.order || idx + 1}`}
                                      </li>
                                    ))}
                                  </ul>
                                ) : member.teamRole === "team_member" ? (
                                  <p className="text-xs text-muted-foreground italic">
                                    No sessions assigned yet
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-base mb-2">Total Fields</h4>
                <p className="text-2xl font-bold">
                  {survey.phases?.reduce((total, phase) =>
                    total + (phase.groups?.reduce((groupTotal, group) => groupTotal + (group.fields?.length || 0), 0) || 0), 0) || 0}
                </p>
              </div>
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
    if (survey.inviteTeamMembers) {
      switch (currentStep) {
        case 1:
          return "Survey Information"
        case 2:
          return "Team Member Setup"
        case 3:
          return "Session Setup Method"
        case 4:
          if (selectedPhaseId && survey.phases && survey.phases.length > 0) {
            const selectedPhase = survey.phases.find(p => p.id === selectedPhaseId)
            return selectedPhase?.name || "Survey Setup"
          }
          return "Survey Setup"
        case 5:
          return "Assign Sessions"
        case 6:
          return "Review & Publish"
        default:
          return ""
      }
    } else {
    switch (currentStep) {
      case 1:
        return "Survey Information"
      case 2:
        return "Session Setup Method"
      case 3:
        if (selectedPhaseId && survey.phases && survey.phases.length > 0) {
          const selectedPhase = survey.phases.find(p => p.id === selectedPhaseId)
          return selectedPhase?.name || "Survey Setup"
        }
        return "Survey Setup"
      case 4:
        return "Review & Publish"
      default:
        return ""
      }
    }
  }

  const getStepDescription = () => {
    if (survey.inviteTeamMembers) {
      switch (currentStep) {
        case 1:
          return "Enter the basic information for your survey and select the state"
        case 2:
          return "Add team members and configure their permissions for this survey"
        case 3:
          return "Choose how you want to set up your survey sessions - manual setup, bulk upload, or link to an existing system"
        case 4:
          if (selectedPhaseId && survey.phases) {
            const selectedPhase = survey.phases.find(p => p.id === selectedPhaseId)
            return selectedPhase?.description || "Add content to this session using multiple import methods"
          }
          return "Select or add a session to start building"
        case 5:
          return "Assign sessions to team members. Select which sessions each member can access"
        case 6:
          return "Review your survey and publish when ready"
        default:
          return ""
      }
    } else {
    switch (currentStep) {
      case 1:
        return "Enter the basic information for your survey and select the state"
      case 2:
        return "Choose how you want to set up your survey sessions - manual setup, bulk upload, or link to an existing system"
      case 3:
        if (selectedPhaseId && survey.phases) {
          const selectedPhase = survey.phases.find(p => p.id === selectedPhaseId)
          return selectedPhase?.description || "Add content to this session using multiple import methods"
        }
        return "Select or add a session to start building"
      case 4:
        return "Review your survey and publish when ready"
      default:
        return ""
      }
    }
  }

  const isStepValid = () => {
    if (survey.inviteTeamMembers) {
    if (currentStep === 1) {
      return !!(survey.title && survey.type && survey.state)
    } else if (currentStep === 2) {
        return true // Team member setup is optional
    } else if (currentStep === 3) {
        return !!importMethod
      } else if (currentStep === 4) {
      return !!(survey.phases && survey.phases.length > 0 && 
                survey.phases.every(p => p.name && p.name.trim() !== ""))
      } else if (currentStep === 5) {
        return true // Session assignment is optional
      } else if (currentStep === 6) {
        return !!(survey.title && survey.state && 
                  survey.phases && survey.phases.length > 0)
      }
    } else {
      if (currentStep === 1) {
        return !!(survey.title && survey.type && survey.state)
      } else if (currentStep === 2) {
        return !!importMethod
    } else if (currentStep === 3) {
        return !!(survey.phases && survey.phases.length > 0 && 
                  survey.phases.every(p => p.name && p.name.trim() !== ""))
    } else if (currentStep === 4) {
      return !!(survey.title && survey.state && 
                survey.phases && survey.phases.length > 0)
      }
    }
    return false
  }

  if (authLoading || isLoading) {
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
          <header className="fixed top-0 left-0 right-0 w-full border-b border-gray-200 bg-white z-50">
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
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md border border-gray-200 z-20">
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

      {/* Main Content - Two Panel Layout */}
      <main className="flex min-h-[calc(100vh-4rem-6rem)] pb-32 pt-16">
          {/* Left Panel - Phase Navigation (only for Survey Setup step) - Fixed */}
          {((currentStep === 3 && !survey.inviteTeamMembers) || (currentStep === 4 && survey.inviteTeamMembers)) && (
          <DndContext>
            <aside className="fixed left-0 top-16 bottom-0 w-80 border-r border-gray-200 bg-white overflow-y-auto z-40">
              <PhaseNavigator
                phases={survey.phases || []}
                selectedPhaseId={selectedPhaseId}
                onPhaseSelect={handlePhaseSelect}
                onAddPhase={handleAddPhase}
                onDeletePhase={handleDeletePhase}
                onPhaseUpdate={handlePhaseUpdate}
              />
            </aside>
          </DndContext>
        )}

            {/* Right Panel - Builder Content */}
            <div className={cn(
              "flex-1 min-h-[calc(100vh-4rem-6rem)] overflow-y-auto bg-gray-50/30",
              (((currentStep === 3 && !survey.inviteTeamMembers) || (currentStep === 4 && survey.inviteTeamMembers)) && "ml-80")
            )}>
              <div className={cn(
                "p-8",
                (currentStep === 1 || currentStep === 2 || currentStep === 4) ? "max-w-3xl mx-auto" : "max-w-5xl mx-auto"
              )}>
            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <div>
                  <h2 className="text-2xl font-semibold">
                        <span className="text-muted-foreground font-semibold">
                          {Math.min(getDisplayStep(), getTotalSteps())} / {getTotalSteps()}
                        </span>{" "}
                    {getStepTitle()}
                  </h2>
                  <p className="text-muted-foreground mt-2">{getStepDescription()}</p>
                </div>
              </div>

              {/* Form Content */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (currentStep === getTotalSteps()) {
                    handlePublish()
                  } else {
                    handleNext()
                  }
                }}
                id="survey-builder-form"
              >
                {renderStepContent()}
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Bar */}
          <div className="pt-4 pb-3">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: getTotalSteps() }, (_, i) => i + 1).map((step) => (
                <div
                  key={step}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-700 ease-out ${
                    step <= currentStep ? "bg-primary" : "bg-gray-200"
                  }`}
                  style={{
                    transition:
                      "background-color 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: step <= currentStep ? "scaleY(1.1)" : "scaleY(1)",
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
                  {currentStep < getTotalSteps() && (
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

              {currentStep < getTotalSteps() && (
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSubmitting}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Draft
                </Button>
              )}

                  {currentStep === getTotalSteps() ? (
                <Button
                  type="submit"
                  form="survey-builder-form"
                  disabled={!isStepValid() || isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    "Publishing..."
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Publish Survey
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!isStepValid() || isSubmitting}
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
      <ConfirmDialog />
    </div>
  )
}

