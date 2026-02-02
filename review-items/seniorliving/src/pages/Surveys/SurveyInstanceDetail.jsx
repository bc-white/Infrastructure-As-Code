import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Printer } from "lucide-react"
import surveyData from "../../data/floridaSeniorLivingSurveyQuestionsNSteps.json"

export default function SurveyInstanceDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [instance, setInstance] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadInstance()
  }, [id])

  const loadInstance = () => {
    try {
      setIsLoading(true)
      const stored = localStorage.getItem("survey_instances")
      const instances = stored ? JSON.parse(stored) : []
      const found = instances.find(inst => inst.id === id)
      setInstance(found)
    } catch (error) {
      console.error("Failed to load survey instance:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getQuestionText = (questionId) => {
    // Search in core categories
    for (const category of surveyData.coreQuestionCategories) {
      const question = category.questions.find(q => q.questionId === questionId)
      if (question) return question.questionText
    }
    
    // Search in end-of-survey questions
    const endQuestion = surveyData.endOfSurveyQuestions.questions.find(q => q.questionId === questionId)
    if (endQuestion) return endQuestion.questionText
    
    return questionId
  }

  const formatAnswer = (questionId, answer) => {
    if (answer === null || answer === undefined || answer === "") {
      return "Not answered"
    }
    
    if (typeof answer === "boolean") {
      return answer ? "Yes" : "No"
    }
    
    if (Array.isArray(answer)) {
      return answer.join(", ")
    }
    
    return String(answer)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading completed survey...</p>
        </div>
      </div>
    )
  }

  if (!instance) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-lg mb-4">Completed survey not found</p>
          <Button onClick={() => navigate("/surveys/instances")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Completed Surveys
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/surveys/instances")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  Survey Details
                </h1>
                <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                  {instance.preSurveyData?.resident_name || "Unnamed Survey"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pre-Survey Information */}
        <div className="mb-8 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Pre-Survey Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(instance.preSurveyData || {}).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  {key.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}:
                </p>
                <p className="text-sm text-gray-900">
                  {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Survey Answers by Category */}
        <div className="space-y-8">
          {surveyData.coreQuestionCategories.map((category) => {
            const categoryAnswers = category.questions
              .map(q => ({
                question: q,
                answer: instance.answers[q.questionId]
              }))
              .filter(item => item.answer !== undefined && item.answer !== null && item.answer !== "")

            if (categoryAnswers.length === 0) return null

            return (
              <div key={category.categoryId} className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  {category.categoryName}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {category.description}
                </p>
                <div className="space-y-4">
                  {categoryAnswers.map(({ question, answer }) => (
                    <div key={question.questionId} className="space-y-2">
                      <p className="font-medium text-gray-900">
                        {question.questionText}
                      </p>
                      <p className="text-gray-700 pl-4">
                        {formatAnswer(question.questionId, answer)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* End-of-Survey Questions */}
        {surveyData.endOfSurveyQuestions.questions.some(q => 
          instance.answers[q.questionId] !== undefined && 
          instance.answers[q.questionId] !== null && 
          instance.answers[q.questionId] !== ""
        ) && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
              {surveyData.endOfSurveyQuestions.title}
            </h2>
            <div className="space-y-4">
              {surveyData.endOfSurveyQuestions.questions.map((question) => {
                const answer = instance.answers[question.questionId]
                if (answer === undefined || answer === null || answer === "") return null

                return (
                  <div key={question.questionId} className="space-y-2">
                    <p className="font-medium text-gray-900">
                      {question.questionText}
                    </p>
                    <p className="text-gray-700 pl-4">
                      {formatAnswer(question.questionId, answer)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">Completed At:</p>
              <p className="text-gray-900">{formatDate(instance.completedAt)}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Status:</p>
              <p className="text-gray-900 capitalize">{instance.status}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

