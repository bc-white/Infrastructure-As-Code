import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { ArrowLeft, ArrowRight, CheckCircle2, Info, Globe, FileText, Menu, X } from "lucide-react"
import { toast } from "sonner"
import surveyData from "../../data/floridaSeniorLivingSurveyQuestionsNSteps.json"
import { Combobox } from "@/components/ui/combobox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function TakeSurvey() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [currentStep, setCurrentStep] = useState(0)
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [preSurveyData, setPreSurveyData] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedWorkflowStep, setSelectedWorkflowStep] = useState(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)

  // US States list for Assisted Living, Memory Care, and Senior Living regulations
  const usStates = [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "District of Columbia",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
  ]

  // Facility types for Senior Living
  const facilityTypes = [
    "Assisted Living",
    "Memory Care",
    "Independent Living",
    "Skilled Nursing Facility",
    "Continuing Care Retirement Community",
    "Residential Care Facility",
    "Adult Family Home",
    "Group Home",
    "Other"
  ]

  const currentCategory = surveyData.coreQuestionCategories[currentCategoryIndex]
  const totalCategories = surveyData.coreQuestionCategories.length

  // Calculate progress based on categories
  const getAnsweredQuestionsCount = (category) => {
    if (!category) return 0
    return category.questions.filter(q => {
      if (q.conditional) {
        const { dependsOn, showIf } = q.conditional
        if (answers[dependsOn] !== showIf) return false
      }
      return answers[q.questionId] !== undefined && answers[q.questionId] !== null && answers[q.questionId] !== ""
    }).length
  }

  const getTotalVisibleQuestions = (category) => {
    if (!category) return 0
    return category.questions.filter(q => {
      if (q.conditional) {
        const { dependsOn, showIf } = q.conditional
        return answers[dependsOn] === showIf
      }
      return true
    }).length
  }

  const progress = currentStep === 0 
    ? 0 
    : currentStep === 1
    ? ((currentCategoryIndex + 1) / totalCategories) * 100
    : 100

  // Handle pre-survey step completion
  const handlePreSurveyComplete = (data) => {
    setPreSurveyData(data)
    setCurrentStep(1)
  }

  // Handle answer change
  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  // Check if current question should be shown (conditional logic)
  const shouldShowQuestion = (question) => {
    if (!question.conditional) return true
    
    const { dependsOn, showIf } = question.conditional
    const dependentAnswer = answers[dependsOn]
    
    if (question.type === "yesno") {
      return dependentAnswer === showIf
    }
    
    return true
  }

  // Handle next category
  const handleNext = () => {
    if (currentStep === 1) {
      // Move to next category or to Identify Risks
      if (currentCategoryIndex < totalCategories - 1) {
        setCurrentCategoryIndex(currentCategoryIndex + 1)
      } else {
        // All categories completed, move to Identify Risks
        setCurrentStep(3)
        setSelectedWorkflowStep(3)
      }
    }
  }

  // Handle previous category
  const handlePrevious = () => {
    if (currentStep === 2) {
      // Go back from end-of-survey to generate summary
      setCurrentStep(4)
      setSelectedWorkflowStep(4)
    } else if (currentStep === 4) {
      // Go back from generate summary to identify risks
      setCurrentStep(3)
      setSelectedWorkflowStep(3)
    } else if (currentStep === 3) {
      // Go back from identify risks to questions
      setCurrentStep(1)
      setSelectedWorkflowStep(2)
      if (currentCategoryIndex > 0) {
        setCurrentCategoryIndex(currentCategoryIndex - 1)
      }
    } else if (currentStep === 1) {
      // Go back from questions
      if (currentCategoryIndex > 0) {
        setCurrentCategoryIndex(currentCategoryIndex - 1)
      } else {
        // Go back to pre-survey
        setCurrentStep(0)
        setSelectedWorkflowStep(1)
      }
    }
  }

  // Handle end-of-survey questions
  const handleEndOfSurveyChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  // Submit survey
  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Validate end-of-survey required questions
      const requiredEndQuestions = surveyData.endOfSurveyQuestions.questions.filter(q => q.required)
      for (const question of requiredEndQuestions) {
        if (!answers[question.questionId]) {
          toast.error(`Please answer: ${question.questionText}`)
          setIsSubmitting(false)
          return
        }
      }

      // Save survey instance
      const surveyInstance = {
        id: `instance_${Date.now()}`,
        surveyId: id || "senior-living-survey",
        state: preSurveyData.state,
        facilityType: preSurveyData.facility_type,
        preSurveyData,
        answers,
        completedAt: new Date().toISOString(),
        status: "completed"
      }

      // Save to localStorage (in real app, this would be an API call)
      const instances = JSON.parse(localStorage.getItem("survey_instances") || "[]")
      instances.push(surveyInstance)
      localStorage.setItem("survey_instances", JSON.stringify(instances))

      toast.success("Survey submitted successfully!")
      navigate("/surveys/instances")
    } catch (error) {
      console.error("Failed to submit survey:", error)
      toast.error("Failed to submit survey. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render question input based on type
  const renderQuestionInput = (question) => {
    const value = answers[question.questionId] || ""

    switch (question.type) {
      case "text":
        return (
          <Input
            value={value}
            onChange={(e) => handleAnswerChange(question.questionId, e.target.value)}
            placeholder="Enter your answer"
            className="mt-2"
          />
        )

      case "textarea":
        return (
          <Textarea
            value={value}
            onChange={(e) => handleAnswerChange(question.questionId, e.target.value)}
            placeholder="Enter your answer"
            className="mt-2 min-h-[100px]"
          />
        )

      case "yesno":
        return (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2">
            <Button
              type="button"
              variant={value === "yes" ? "default" : "outline"}
              onClick={() => handleAnswerChange(question.questionId, "yes")}
              className="flex-1 sm:flex-initial"
            >
              Yes
            </Button>
            <Button
              type="button"
              variant={value === "no" ? "default" : "outline"}
              onClick={() => handleAnswerChange(question.questionId, "no")}
              className="flex-1 sm:flex-initial"
            >
              No
            </Button>
          </div>
        )

      case "select":
        return (
          <Select
            value={value || ""}
            onValueChange={(val) => handleAnswerChange(question.questionId, val)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options.map((option, idx) => (
                <SelectItem key={idx} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "date":
        // Convert YYYY-MM-DD string to Date object or null
        const dateValue = value ? new Date(value + 'T00:00:00') : null
        return (
          <DatePicker
            date={dateValue}
            onSelect={(selectedDate) => {
              // Convert Date object to YYYY-MM-DD string
              if (selectedDate) {
                const year = selectedDate.getFullYear()
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
                const day = String(selectedDate.getDate()).padStart(2, '0')
                handleAnswerChange(question.questionId, `${year}-${month}-${day}`)
              } else {
                handleAnswerChange(question.questionId, "")
              }
            }}
            placeholder="Pick a date"
            className="mt-2"
          />
        )

      case "rating":
        return (
          <div className="flex flex-wrap gap-2 mt-2">
            {question.options.map((option, idx) => (
              <Button
                key={idx}
                type="button"
                variant={value === option ? "default" : "outline"}
                onClick={() => handleAnswerChange(question.questionId, option)}
                className="flex-1 min-w-[80px] sm:flex-initial"
              >
                {option}
              </Button>
            ))}
          </div>
        )

      case "scale":
        return (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{question.min}</span>
              <span className="text-lg font-semibold">{value || question.min}</span>
              <span className="text-sm text-muted-foreground">{question.max}</span>
            </div>
            <input
              type="range"
              min={question.min}
              max={question.max}
              value={value || question.min}
              onChange={(e) => handleAnswerChange(question.questionId, parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        )

      case "checkbox":
        return (
          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              id={question.questionId}
              checked={value === true}
              onCheckedChange={(checked) => handleAnswerChange(question.questionId, checked)}
            />
            <Label htmlFor={question.questionId} className="cursor-pointer">
              {question.label}
            </Label>
          </div>
        )

      default:
        return null
    }
  }

  // Determine current workflow step
  const getCurrentWorkflowStep = () => {
    // Use selectedWorkflowStep if explicitly set, otherwise determine from currentStep
    if (selectedWorkflowStep !== null) return selectedWorkflowStep
    if (currentStep === 0) return 1 // Start Survey
    if (currentStep === 1) return 2 // Conduct Assessment
    if (currentStep === 3) return 3 // Identify Risks
    if (currentStep === 4) return 4 // Generate Summary
    if (currentStep === 2) return 5 // Submit & Notify
    return 1
  }

  const currentWorkflowStep = getCurrentWorkflowStep()

  // Handle workflow step navigation
  const handleWorkflowStepClick = (stepNumber) => {
    // Allow free navigation to any step without validation
    setSelectedWorkflowStep(stepNumber)
    switch (stepNumber) {
      case 1:
        setCurrentStep(0) // Pre-survey
        break
      case 2:
        setCurrentStep(1) // Questions
        break
      case 3:
        setCurrentStep(3) // Identify Risks
        break
      case 4:
        setCurrentStep(4) // Generate Summary
        break
      case 5:
        setCurrentStep(2) // End-of-survey
        break
      default:
        break
    }
  }

  // Render workflow steps in left panel
  const renderWorkflowSteps = (onStepClick) => {
    return (
      <div className="space-y-4 sm:space-y-6">
        {surveyData.workflowSteps.steps.map((step) => {
          const isActive = step.stepNumber === currentWorkflowStep
          const isCompleted = step.stepNumber < currentWorkflowStep
          
          return (
            <div 
              key={step.stepNumber}
              className="flex items-start gap-3 sm:gap-4 cursor-pointer"
              onClick={() => {
                handleWorkflowStepClick(step.stepNumber)
                if (onStepClick) onStepClick()
              }}
            >
              <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm border-2 transition-colors ${
                isActive
                  ? "bg-white text-primary border-primary"
                  : isCompleted
                  ? "bg-white text-green-600 border-green-600"
                  : "bg-transparent text-white/60 border-white/30"
              }`}>
                {isCompleted ? "✓" : step.stepNumber}
              </div>
              <div className="flex-1 text-left min-w-0">
                <h3 className={`text-sm sm:text-base font-medium break-words ${
                  isActive ? "text-white" : isCompleted ? "text-white/90" : "text-white/60"
                }`}>
                  {step.stepName}
                </h3>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Render pre-survey steps
  if (currentStep === 0) {
    return (
      <div className="h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
        {/* Left Section - Workflow Steps (Dark Blue) - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:flex w-80 bg-primary flex-col h-full overflow-hidden">
          <div className="p-6 lg:p-8 flex-shrink-0">
            <h1 className="text-base lg:text-lg font-bold text-white mb-2">mockSurvey 365 Senior Living</h1>
            <p className="text-white/80 text-xs">Survey Management Platform</p>
          </div>
          <div className="px-6 lg:px-8 flex-1 overflow-y-auto scrollbar-hide">
            {renderWorkflowSteps()}
          </div>
          <div className="p-6 lg:p-8 flex-shrink-0">
            <div className="text-white/60 text-xs">
              <p>mockSurvey 365 Senior Living</p>
              <p className="text-white/40 text-[10px] mt-1">Survey Platform</p>
            </div>
          </div>
        </div>

        {/* Right Section - Pre-Survey Form */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
          {/* Top Bar */}
          <div className="bg-white border-b px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate("/surveys")} className="lg:hidden">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/surveys")} className="hidden lg:flex">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              {/* Mobile Menu Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowMobileMenu(true)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
              <div className="mb-4 sm:mb-6">
                <Badge variant="secondary" className="mb-2 sm:mb-3 text-xs">PRE-SURVEY</Badge>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {surveyData.preSurveySteps.title}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Please make sure this information is accurate. We'll use these details for the survey assessment.
                </p>
              </div>

              {/* Information Box */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 sm:gap-3">
                <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-blue-900">
                    All information provided will be used to personalize your survey experience and ensure accurate assessment results.
                  </p>
                </div>
              </div>

              {/* State and Facility Type Selection - First Step */}
              <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  1. State & Facility Information
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  Select the state where the facility is located and the facility type. This ensures the survey follows the appropriate state regulations for Assisted Living, Memory Care, and Senior Living settings.
                </p>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="state">
                      State <span className="text-destructive ml-1">*</span>
                    </Label>
                    <div className="mt-1">
                      <Combobox
                        options={usStates}
                        value={preSurveyData.state || ""}
                        onChange={(val) => setPreSurveyData(prev => ({
                          ...prev,
                          state: val
                        }))}
                        placeholder="Select a state"
                        searchPlaceholder="Search states..."
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="facility_type">
                      Facility Type <span className="text-destructive ml-1">*</span>
                    </Label>
                    <Select
                      value={preSurveyData.facility_type || ""}
                      onValueChange={(val) => setPreSurveyData(prev => ({
                        ...prev,
                        facility_type: val
                      }))}
                      required={true}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select facility type" />
                      </SelectTrigger>
                      <SelectContent>
                        {facilityTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {surveyData.preSurveySteps.steps.map((step, stepIdx) => (
                <div key={stepIdx} className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">
                    {step.stepNumber + 1}. {step.title}
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    {step.fields.map((field) => (
                      <div key={field.id}>
                        <Label htmlFor={field.id}>
                          {field.label}
                          {field.required && <span className="text-destructive ml-1">*</span>}
                        </Label>
                        {field.type === "text" && (
                          <Input
                            id={field.id}
                            value={preSurveyData[field.id] || ""}
                            onChange={(e) => setPreSurveyData(prev => ({
                              ...prev,
                              [field.id]: e.target.value
                            }))}
                            className="mt-1"
                            required={field.required}
                          />
                        )} 
                        {field.type === "date" && (
                          <DatePicker
                            date={preSurveyData[field.id] ? new Date(preSurveyData[field.id] + 'T00:00:00') : null}
                            onSelect={(selectedDate) => {
                              if (selectedDate) {
                                const year = selectedDate.getFullYear()
                                const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
                                const day = String(selectedDate.getDate()).padStart(2, '0')
                                setPreSurveyData(prev => ({
                                  ...prev,
                                  [field.id]: `${year}-${month}-${day}`
                                }))
                              } else {
                                setPreSurveyData(prev => ({
                                  ...prev,
                                  [field.id]: ""
                                }))
                              }
                            }}
                            placeholder="Pick a date"
                            className="mt-1"
                          />
                        )}
                        {field.type === "select" && (
                          <Select
                            value={preSurveyData[field.id] || ""}
                            onValueChange={(val) => setPreSurveyData(prev => ({
                              ...prev,
                              [field.id]: val
                            }))}
                            required={field.required}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options.map((option, idx) => (
                                <SelectItem key={idx} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      {field.type === "checkbox" && (
                        <div className="flex items-center space-x-2 mt-2">
                          <Checkbox
                            id={field.id}
                            checked={preSurveyData[field.id] || false}
                            onCheckedChange={(checked) => setPreSurveyData(prev => ({
                              ...prev,
                              [field.id]: checked
                            }))}
                          />
                          <Label htmlFor={field.id} className="cursor-pointer">
                            {field.label}
                          </Label>
                        </div>
                      )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Fixed Bottom Navigation */}
          <div className="bg-white border-t mt-auto">
            <div className="max-w-2xl mx-auto p-4 sm:p-6 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate("/surveys")}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePreSurveyComplete}
                disabled={!preSurveyData.state || !preSurveyData.facility_type}
                className="w-full sm:w-auto"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dialog */}
        <Dialog open={showMobileMenu} onOpenChange={setShowMobileMenu}>
          <DialogContent className="sm:max-w-md bg-primary text-white border-primary">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center justify-between">
                <span>Survey Steps</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileMenu(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {renderWorkflowSteps(() => setShowMobileMenu(false))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Render Identify Risks step
  if (currentStep === 3) {
    // Analyze answers to identify risks
    const identifiedRisks = []
    const riskIndicators = surveyData.riskIndicators || {}

    // Check for fall risk
    const fallRiskAnswers = Object.entries(answers).filter(([key, value]) => 
      key.toLowerCase().includes('fall') || 
      key.toLowerCase().includes('mobility') ||
      (typeof value === 'string' && value.toLowerCase().includes('fall'))
    )
    if (fallRiskAnswers.length > 0) {
      identifiedRisks.push({
        type: 'Fall Risk',
        indicators: riskIndicators.fallRisk?.triggers || [],
        answers: fallRiskAnswers
      })
    }

    // Check for other risks based on answers
    const riskChecks = [
      { key: 'skin', name: 'Skin Breakdown Risk', data: riskIndicators.skinBreakdownRisk },
      { key: 'medication', name: 'Medication Issues', data: riskIndicators.medicationIssues },
      { key: 'mood', name: 'Emotional Distress', data: riskIndicators.emotionalDistress },
      { key: 'hydration', name: 'Hydration Risk', data: riskIndicators.hydrationRisk }
    ]

    riskChecks.forEach(({ key, name, data }) => {
      const matchingAnswers = Object.entries(answers).filter(([ansKey, value]) =>
        ansKey.toLowerCase().includes(key) ||
        (typeof value === 'string' && value.toLowerCase().includes(key))
      )
      if (matchingAnswers.length > 0) {
        identifiedRisks.push({
          type: name,
          indicators: data?.triggers || [],
          answers: matchingAnswers
        })
      }
    })

    return (
      <div className="h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
        {/* Left Section - Workflow Steps (Dark Blue) - Hidden on mobile */}
        <div className="hidden lg:flex w-80 bg-primary flex-col h-full overflow-hidden">
          <div className="p-6 lg:p-8 flex-shrink-0">
            <h1 className="text-base lg:text-lg font-bold text-white mb-2">mockSurvey 365 Senior Living</h1>
            <p className="text-white/80 text-xs">Survey Management Platform</p>
          </div>
          <div className="px-6 lg:px-8 flex-1 overflow-y-auto scrollbar-hide">
            {renderWorkflowSteps()}
          </div>
          <div className="p-6 lg:p-8 flex-shrink-0">
            <div className="text-white/60 text-xs">
              <p>mockSurvey 365 Senior Living</p>
              <p className="text-white/40 text-[10px] mt-1">Survey Platform</p>
            </div>
          </div>
        </div>

        {/* Right Section - Identify Risks */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
          <div className="bg-white border-b px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handlePrevious} className="lg:hidden">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handlePrevious} className="hidden lg:flex">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowMobileMenu(true)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
              <div className="mb-4 sm:mb-6">
                <Badge variant="secondary" className="mb-2 sm:mb-3 text-xs">STEP 3</Badge>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Identify Risks</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Review identified risks based on survey responses.
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {identifiedRisks.length > 0 ? (
                  identifiedRisks.map((risk, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">{risk.type}</h3>
                      <div className="space-y-2">
                        <p className="text-xs sm:text-sm font-medium text-gray-700">Potential Indicators:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-600">
                          {risk.indicators.map((indicator, i) => (
                            <li key={i}>{indicator}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 text-center">
                    <p className="text-sm sm:text-base text-gray-600">No specific risks identified at this time.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border-t mt-auto">
            <div className="max-w-2xl mx-auto p-4 sm:p-6 flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button 
                onClick={() => {
                  setCurrentStep(4)
                  setSelectedWorkflowStep(4)
                }}
                className="w-full sm:w-auto"
              >
                Next: Generate Summary
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dialog */}
        <Dialog open={showMobileMenu} onOpenChange={setShowMobileMenu}>
          <DialogContent className="sm:max-w-md bg-primary text-white border-primary">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center justify-between">
                <span>Survey Steps</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileMenu(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {renderWorkflowSteps(() => setShowMobileMenu(false))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Render Generate Summary step
  if (currentStep === 4) {
    // Generate summary from all answers
    const totalQuestions = surveyData.coreQuestionCategories.reduce((acc, cat) => 
      acc + (cat.questions?.length || 0), 0
    )
    const answeredQuestions = Object.keys(answers).length
    const completionPercentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0

    return (
      <div className="h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
        {/* Left Section - Workflow Steps (Dark Blue) - Hidden on mobile */}
        <div className="hidden lg:flex w-80 bg-primary flex flex-col h-full overflow-hidden">
          <div className="p-6 lg:p-8 flex-shrink-0">
            <h1 className="text-base lg:text-lg font-bold text-white mb-2">mockSurvey 365 Senior Living</h1>
            <p className="text-white/80 text-xs">Survey Management Platform</p>
          </div>
          <div className="px-6 lg:px-8 flex-1 overflow-y-auto scrollbar-hide">
            {renderWorkflowSteps()}
          </div>
          <div className="p-6 lg:p-8 flex-shrink-0">
            <div className="text-white/60 text-xs">
              <p>mockSurvey 365 Senior Living</p>
              <p className="text-white/40 text-[10px] mt-1">Survey Platform</p>
            </div>
          </div>
        </div>

        {/* Right Section - Generate Summary */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
          <div className="bg-white border-b px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handlePrevious} className="lg:hidden">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handlePrevious} className="hidden lg:flex">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowMobileMenu(true)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
              <div className="mb-4 sm:mb-6">
                <Badge variant="secondary" className="mb-2 sm:mb-3 text-xs">STEP 4</Badge>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Generate Summary</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Review a summary of the survey findings and completion status.
                </p>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Survey Overview</h3>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Total Questions</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalQuestions}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Answered</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{answeredQuestions}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">Completion</p>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all" 
                          style={{ width: `${completionPercentage}%` }}
                        />
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 mt-2">{completionPercentage}% Complete</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">State & Facility Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">State</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900">{preSurveyData.state || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">Facility Type</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900">{preSurveyData.facility_type || "Not specified"}</p>
                    </div>
                  </div>
                  {preSurveyData.state && (
                    <p className="text-xs text-muted-foreground mt-3">
                      This survey follows {preSurveyData.state} state regulations for {preSurveyData.facility_type || "Senior Living"} facilities.
                    </p>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Key Findings</h3>
                  <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                    <p>Survey responses have been recorded and analyzed.</p>
                    <p>All categories have been assessed based on available responses.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border-t mt-auto">
            <div className="max-w-2xl mx-auto p-4 sm:p-6 flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button 
                onClick={() => {
                  setCurrentStep(2)
                  setSelectedWorkflowStep(5)
                }}
                className="w-full sm:w-auto"
              >
                Next: Submit & Notify
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dialog */}
        <Dialog open={showMobileMenu} onOpenChange={setShowMobileMenu}>
          <DialogContent className="sm:max-w-md bg-primary text-white border-primary">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center justify-between">
                <span>Survey Steps</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileMenu(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {renderWorkflowSteps(() => setShowMobileMenu(false))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Render end-of-survey questions
  if (currentStep === 2) {
    return (
      <div className="h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
        {/* Left Section - Workflow Steps (Dark Blue) - Hidden on mobile */}
        <div className="hidden lg:flex w-80 bg-primary flex flex-col h-full overflow-hidden">
          <div className="p-6 lg:p-8 flex-shrink-0">
            <h1 className="text-base lg:text-lg font-bold text-white mb-2">mockSurvey 365 Senior Living</h1>
            <p className="text-white/80 text-xs">Survey Management Platform</p>
          </div>
          <div className="px-6 lg:px-8 flex-1 overflow-y-auto scrollbar-hide">
            {renderWorkflowSteps()}
          </div>
          <div className="p-6 lg:p-8 flex-shrink-0">
            <div className="text-white/60 text-xs">
              <p>mockSurvey 365 Senior Living</p>
              <p className="text-white/40 text-[10px] mt-1">Survey Platform</p>
            </div>
          </div>
        </div>

        {/* Right Section - End-of-Survey Questions */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
          {/* Top Bar */}
          <div className="bg-white border-b px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handlePrevious} className="lg:hidden">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handlePrevious} className="hidden lg:flex">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowMobileMenu(true)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
              <div className="mb-4 sm:mb-6">
                <Badge variant="secondary" className="mb-2 sm:mb-3 text-xs">COMPLETION</Badge>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {surveyData.endOfSurveyQuestions.title}
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Please complete these final questions before submitting the survey.
                </p>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {surveyData.endOfSurveyQuestions.questions.map((question) => {
                  if (question.conditional) {
                    const { dependsOn, showIf } = question.conditional
                    if (answers[dependsOn] !== showIf) {
                      return null
                    }
                  }

                  return (
                    <div key={question.questionId}>
                      <Label>
                        {question.questionText}
                        {question.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {question.type === "textarea" && (
                        <Textarea
                          value={answers[question.questionId] || ""}
                          onChange={(e) => handleEndOfSurveyChange(question.questionId, e.target.value)}
                          className="mt-2 min-h-[100px]"
                          required={question.required}
                        />
                      )}
                      {question.type === "yesno" && (
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2">
                          <Button
                            type="button"
                            variant={answers[question.questionId] === "yes" ? "default" : "outline"}
                            onClick={() => handleEndOfSurveyChange(question.questionId, "yes")}
                            className="flex-1 sm:flex-initial"
                          >
                            Yes
                          </Button>
                          <Button
                            type="button"
                            variant={answers[question.questionId] === "no" ? "default" : "outline"}
                            onClick={() => handleEndOfSurveyChange(question.questionId, "no")}
                            className="flex-1 sm:flex-initial"
                          >
                            No
                          </Button>
                        </div>
                      )}
                      {question.type === "select" && (
                        <Select
                          value={answers[question.questionId] || ""}
                          onValueChange={(val) => handleEndOfSurveyChange(question.questionId, val)}
                          required={question.required}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            {question.options.map((option, idx) => (
                              <SelectItem key={idx} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {question.type === "date" && (
                        <DatePicker
                          date={answers[question.questionId] ? new Date(answers[question.questionId] + 'T00:00:00') : null}
                          onSelect={(selectedDate) => {
                            if (selectedDate) {
                              const year = selectedDate.getFullYear()
                              const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
                              const day = String(selectedDate.getDate()).padStart(2, '0')
                              handleEndOfSurveyChange(question.questionId, `${year}-${month}-${day}`)
                            } else {
                              handleEndOfSurveyChange(question.questionId, "")
                            }
                          }}
                          placeholder="Pick a date"
                          className="mt-2"
                        />
                      )}
                      {question.type === "signature" && (
                        <div className="mt-2 space-y-3">
                          <Input
                            value={typeof answers[question.questionId] === 'object' && answers[question.questionId] !== null
                              ? answers[question.questionId].name || ""
                              : answers[question.questionId] || ""}
                            onChange={(e) => {
                              const currentValue = answers[question.questionId]
                              const signatureData = {
                                name: e.target.value,
                                timestamp: (typeof currentValue === 'object' && currentValue !== null && currentValue.timestamp)
                                  ? currentValue.timestamp
                                  : null
                              }
                              handleEndOfSurveyChange(question.questionId, signatureData)
                            }}
                            placeholder="Enter staff name"
                            className="w-full"
                            required={question.required}
                          />
                          {typeof answers[question.questionId] === 'object' && 
                           answers[question.questionId] !== null && 
                           answers[question.questionId].timestamp && (
                            <div className="text-sm text-muted-foreground">
                              <p>Timestamp: {new Date(answers[question.questionId].timestamp).toLocaleString()}</p>
                            </div>
                          )}
                          {(!answers[question.questionId] || 
                            typeof answers[question.questionId] !== 'object' || 
                            !answers[question.questionId].timestamp) && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                const currentValue = answers[question.questionId]
                                const name = (typeof currentValue === 'object' && currentValue !== null && currentValue.name)
                                  ? currentValue.name
                                  : (typeof currentValue === 'string' ? currentValue : "")
                                const signatureData = {
                                  name: name,
                                  timestamp: new Date().toISOString()
                                }
                                handleEndOfSurveyChange(question.questionId, signatureData)
                              }}
                              className="w-full"
                              disabled={!answers[question.questionId] || 
                                (typeof answers[question.questionId] === 'string' && !answers[question.questionId].trim()) ||
                                (typeof answers[question.questionId] === 'object' && !answers[question.questionId].name?.trim())}
                            >
                              Sign & Add Timestamp
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* Fixed Bottom Navigation */}
          <div className="bg-white border-t mt-auto">
            <div className="max-w-2xl mx-auto p-4 sm:p-6 flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? "Submitting..." : "Submit Survey"}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dialog */}
        <Dialog open={showMobileMenu} onOpenChange={setShowMobileMenu}>
          <DialogContent className="sm:max-w-md bg-primary text-white border-primary">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center justify-between">
                <span>Survey Steps</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileMenu(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {renderWorkflowSteps(() => setShowMobileMenu(false))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Render main survey questions
  return (
    <div className="h-screen bg-white flex flex-col lg:flex-row overflow-hidden">
      {/* Left Section - Workflow Steps (Dark Blue) - Hidden on mobile */}
      <div className="hidden lg:flex w-80 bg-primary flex flex-col h-full overflow-hidden">
        <div className="p-6 lg:p-8 flex-shrink-0">
          <h1 className="text-base lg:text-lg font-bold text-white mb-2">mockSurvey 365 Senior Living</h1>
          <p className="text-white/80 text-xs sm:text-sm">Survey Management Platform</p>
        </div>
        <div className="px-6 lg:px-8 flex-1 overflow-y-auto scrollbar-hide">
          {renderWorkflowSteps()}
        </div>
        <div className="p-6 lg:p-8 flex-shrink-0">
          <div className="text-white/60 text-xs">
            <p>mockSurvey 365 Senior Living</p>
            <p className="text-white/40 text-[10px] mt-1">Survey Platform</p>
          </div>
        </div>
      </div>

      {/* Right Section - Questions */}
      <div className="flex-1 flex h-full overflow-hidden bg-gray-50">
        {/* Questions Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="bg-white border-b px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handlePrevious} 
                disabled={currentCategoryIndex === 0 && currentStep === 1}
                className="lg:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handlePrevious} 
                disabled={currentCategoryIndex === 0 && currentStep === 1}
                className="hidden lg:flex"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowMobileMenu(true)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowCategoryMenu(true)}
                className="lg:hidden ml-auto"
              >
                <FileText className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide p-4 sm:p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
              {/* Category Header */}
              {currentCategory && (
                <div className="mb-6 sm:mb-8">
                  <Badge variant="secondary" className="mb-2 sm:mb-3 text-xs">CATEGORY {currentCategoryIndex + 1}</Badge>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    {currentCategory.categoryName}
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                    {currentCategory.description}
                  </p>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    <p>
                      {getAnsweredQuestionsCount(currentCategory)} of {getTotalVisibleQuestions(currentCategory)} questions answered
                    </p>
                  </div>
                </div>
              )}

            {/* All Questions in Current Category */}
            {currentCategory && (
              <div className="space-y-6 sm:space-y-8">
                {currentCategory.questions.map((question) => {
                  if (!shouldShowQuestion(question)) return null

                  return (
                    <div key={question.questionId} className="space-y-2 sm:space-y-3">
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                          {question.questionText}
                          {question.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </h3>
                        {renderQuestionInput(question)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            </div>
          </div>
          
          {/* Fixed Bottom Navigation */}
          <div className="bg-white border-t mt-auto">
            <div className="max-w-2xl mx-auto p-4 sm:p-6 flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentCategoryIndex === 0 && currentStep === 1}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{currentCategoryIndex === 0 ? "Back to Pre-Survey" : "Previous Category"}</span>
                <span className="sm:hidden">Previous</span>
              </Button>
              <Button 
                onClick={handleNext}
                className="w-full sm:w-auto"
              >
                <span className="hidden sm:inline">{currentCategoryIndex === totalCategories - 1 ? "Review & Submit" : "Next Category"}</span>
                <span className="sm:hidden">{currentCategoryIndex === totalCategories - 1 ? "Review" : "Next"}</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Category Navigation - Right Sidebar - Hidden on mobile */}
        <div className="hidden lg:flex w-72 border-l bg-gray-50 flex flex-col h-full overflow-hidden">
          <div className="p-4 lg:p-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-4 sm:mb-6">Categories</h3>
              <div className="space-y-3 sm:space-y-4">
                {surveyData.coreQuestionCategories.map((category, idx) => {
                  const isActive = idx === currentCategoryIndex
                  const answeredCount = getAnsweredQuestionsCount(category)
                  const totalCount = getTotalVisibleQuestions(category)
                  const isComplete = totalCount > 0 && answeredCount === totalCount
                  
                  return (
                    <div
                      key={category.categoryId}
                      onClick={() => setCurrentCategoryIndex(idx)}
                      className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg cursor-pointer transition-colors ${
                        isActive ? "bg-gray-100" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm ${
                        isComplete
                          ? "bg-green-600 text-white"
                          : isActive
                          ? "bg-white border-2 border-gray-900 text-gray-900"
                          : "bg-gray-200 text-gray-600"
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-2 mb-1">
                          <span className={`text-xs sm:text-sm font-medium ${
                            isActive ? "text-gray-900" : "text-gray-700"
                          }`}>
                            {category.categoryId}. {category.categoryName}
                          </span>
                          {isComplete && (
                            <Badge variant="outline" className="h-3 px-1 sm:h-4 sm:px-1.5 text-[9px] sm:text-[10px] font-medium text-green-700 border-green-300 bg-green-50">
                              DONE
                            </Badge>
                          )}
                        </div>
                        {isActive && (
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                            {answeredCount} of {totalCount} answered
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dialog */}
      <Dialog open={showMobileMenu} onOpenChange={setShowMobileMenu}>
        <DialogContent className="sm:max-w-md bg-primary text-white border-primary">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center justify-between">
              <span>Survey Steps</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileMenu(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {renderWorkflowSteps(() => setShowMobileMenu(false))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Category Menu Dialog */}
      <Dialog open={showCategoryMenu} onOpenChange={setShowCategoryMenu}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Categories</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCategoryMenu(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              {surveyData.coreQuestionCategories.map((category, idx) => {
                const isActive = idx === currentCategoryIndex
                const answeredCount = getAnsweredQuestionsCount(category)
                const totalCount = getTotalVisibleQuestions(category)
                const isComplete = totalCount > 0 && answeredCount === totalCount
                
                return (
                  <div
                    key={category.categoryId}
                    onClick={() => {
                      setCurrentCategoryIndex(idx)
                      setShowCategoryMenu(false)
                    }}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      isActive ? "bg-gray-100" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                      isComplete
                        ? "bg-green-600 text-white"
                        : isActive
                        ? "bg-white border-2 border-gray-900 text-gray-900"
                        : "bg-gray-200 text-gray-600"
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-medium ${
                          isActive ? "text-gray-900" : "text-gray-700"
                        }`}>
                          {category.categoryId}. {category.categoryName}
                        </span>
                        {isComplete && (
                          <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-medium text-green-700 border-green-300 bg-green-50">
                            COMPLETED
                          </Badge>
                        )}
                      </div>
                      {isActive && (
                        <p className="text-xs text-gray-500 mt-1">
                          {answeredCount} of {totalCount} answered
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

