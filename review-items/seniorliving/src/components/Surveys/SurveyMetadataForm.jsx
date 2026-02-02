import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Combobox } from "@/components/ui/combobox"
import { US_STATES } from "../../utils/constants"
import { mockSurveyService } from "../../services/mockSurveyService"

export default function SurveyMetadataForm({ survey, onChange, errors = {} }) {
  const defaultSurvey = {
    title: "",
    description: "",
    type: "Standard",
    state: "",
    regulationReferences: [],
    inviteTeamMembers: false
  }

  const [localSurvey, setLocalSurvey] = useState(survey || defaultSurvey)

  // Sync local state when survey prop changes (e.g., when loading existing survey)
  useEffect(() => {
    if (survey) {
      setLocalSurvey({
        title: survey.title || "",
        description: survey.description || "",
        type: survey.type || "Standard",
        state: survey.state || "",
        regulationReferences: survey.regulationReferences || [],
        inviteTeamMembers: survey.inviteTeamMembers || false
      })
    }
  }, [survey?.id, survey?.title, survey?.description, survey?.type, survey?.state, survey?.inviteTeamMembers])

  const surveyTypes = mockSurveyService.getSurveyTypes()

  const handleChange = (field, value) => {
    const updated = { ...localSurvey, [field]: value }
    setLocalSurvey(updated)
    onChange(updated)
  }

  return (
    <div className="space-y-6">
      {/* Survey Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Survey Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          type="text"
          placeholder="e.g., Standard Assisted Living Survey"
          value={localSurvey.title}
          onChange={(e) => handleChange("title", e.target.value)}
          className={errors.title ? "border-destructive" : ""}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title}</p>
        )}
      </div>

      {/* Survey Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          rows={3}
          placeholder="Enter a description for this survey..."
          value={localSurvey.description}
          onChange={(e) => handleChange("description", e.target.value)}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}
      </div>

      {/* Survey Type */}
      <div className="space-y-2">
        <Label htmlFor="type">
          Survey Type <span className="text-destructive">*</span>
        </Label>
        <Combobox
          options={surveyTypes}
          value={localSurvey.type}
          onChange={(value) => handleChange("type", value)}
          placeholder="Select survey type..."
          searchPlaceholder="Search survey types..."
          error={!!errors.type}
        />
        {errors.type && (
          <p className="text-sm text-destructive">{errors.type}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Standard, Complaint Investigation, Follow-up, Abbreviated, or Pre-licensing
        </p>
      </div>

      {/* State Selection */}
      <div className="space-y-2">
        <Label htmlFor="state">
          State <span className="text-destructive">*</span>
        </Label>
        <Combobox
          options={US_STATES}
          value={localSurvey.state}
          onChange={(value) => handleChange("state", value)}
          placeholder="Select a state..."
          searchPlaceholder="Search states..."
          error={!!errors.state}
        />
        {errors.state && (
          <p className="text-sm text-destructive">{errors.state}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Select the state this survey is designed for
        </p>
      </div>

      {/* Team Member Invitation Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="inviteTeamMembers">Invite Team Members</Label>
            <p className="text-xs text-muted-foreground">
              Allow team members to participate in this survey and assign them to specific sessions
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleChange("inviteTeamMembers", !localSurvey.inviteTeamMembers)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              localSurvey.inviteTeamMembers ? "bg-primary" : "bg-gray-200"
            }`}
            role="switch"
            aria-checked={localSurvey.inviteTeamMembers}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                localSurvey.inviteTeamMembers ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  )
}

