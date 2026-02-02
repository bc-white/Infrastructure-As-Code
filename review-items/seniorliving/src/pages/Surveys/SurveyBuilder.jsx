import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import { mockSurveyService } from "../../services/mockSurveyService"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import SurveyMetadataForm from "../../components/Surveys/SurveyMetadataForm"
import TeamMemberAssignment from "../../components/Surveys/TeamMemberAssignment"
import { ArrowLeft, Save, Eye, X } from "lucide-react"
import { validateState } from "../../utils/validators"
import { toast } from "sonner"
import { useConfirm } from "../../hooks/useConfirm"

export default function SurveyBuilder() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const { confirm, ConfirmDialog } = useConfirm()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [survey, setSurvey] = useState({
    title: "",
    description: "",
    type: "Standard",
    state: "",
    regulationReferences: [],
    sections: [],
    inviteTeamMembers: false,
    teamMemberAssignments: []
  })
  const [errors, setErrors] = useState({})
  const [isNewSurvey, setIsNewSurvey] = useState(true)

  useEffect(() => {
    if (id) {
      loadSurvey(id)
    }
  }, [id])

  const loadSurvey = async (surveyId) => {
    try {
      setIsLoading(true)
      const loadedSurvey = await mockSurveyService.getSurveyById(surveyId)
      if (loadedSurvey) {
        setSurvey(loadedSurvey)
        setIsNewSurvey(false)
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
    setSurvey(prev => ({ ...prev, ...updatedMetadata }))
    // Clear errors when user makes changes
    setErrors({})
  }

  const validateSurvey = () => {
    const newErrors = {}

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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateSurvey()) {
      return
    }

    try {
      setIsSaving(true)
      setError("")

      const surveyData = {
        ...survey,
        facilityId: user?.facilityId || null,
        createdBy: user?.id || "unknown",
        lastModifiedBy: user?.id || "unknown"
      }

      let savedSurvey
      if (isNewSurvey) {
        savedSurvey = await mockSurveyService.createSurvey(surveyData)
      } else {
        savedSurvey = await mockSurveyService.updateSurvey(id, surveyData)
      }

      // Update state with saved survey (to get the ID if it's new)
      setSurvey(savedSurvey)
      setIsNewSurvey(false)
      
      // Update URL if it's a new survey
      if (isNewSurvey && savedSurvey.id) {
        navigate(`/surveys/builder/${savedSurvey.id}`, { replace: true })
      }

      // Show success message
      toast.success("Survey saved successfully!")
    } catch (error) {
      console.error("Failed to save survey:", error)
      setError(error.message || "Failed to save survey. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = () => {
    if (!survey.id) {
      toast.warning("Please save the survey before previewing")
      return
    }
    navigate(`/surveys/preview/${survey.id}`)
  }

  const handleCancel = async () => {
    const confirmed = await confirm("Are you sure you want to leave? Unsaved changes will be lost.", {
      title: "Leave Survey Builder",
      variant: "destructive",
      confirmText: "Leave"
    })
    if (confirmed) {
      navigate("/surveys")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading survey...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/surveys")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isNewSurvey ? "Create New Survey" : "Edit Survey"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isNewSurvey 
                ? "Create a new regulatory survey template"
                : "Edit your survey template"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePreview} disabled={isNewSurvey}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Survey Metadata Form */}
      <Card>
        <CardHeader>
          <CardTitle>Survey Information</CardTitle>
          <CardDescription>
            Enter the basic information for your survey. Select the state this survey is designed for.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SurveyMetadataForm
            survey={survey}
            onChange={handleMetadataChange}
            errors={errors}
          />
        </CardContent>
      </Card>

      {/* Team Member Assignment Section */}
      {survey.inviteTeamMembers && (
        <Card>
          <CardHeader>
            <CardTitle>Team Member Assignments</CardTitle>
            <CardDescription>
              Assign team members to this survey, configure their permissions, and assign them to specific sessions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeamMemberAssignment
              survey={survey}
              onChange={handleMetadataChange}
              sections={survey.sections || []}
            />
          </CardContent>
        </Card>
      )}

      {/* Sections Section - Placeholder for now */}
      <Card>
        <CardHeader>
          <CardTitle>Sections</CardTitle>
          <CardDescription>
            Add sections and questions to your survey. This will be implemented in the next step.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Section management coming soon...</p>
            <p className="text-sm mt-2">
              After saving your survey, you'll be able to add sections and questions.
            </p>
          </div>
        </CardContent>
      </Card>
      <ConfirmDialog />
    </div>
  )
}

