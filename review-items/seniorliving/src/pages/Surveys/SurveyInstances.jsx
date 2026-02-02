import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Eye } from "lucide-react"
import { formatDateTime } from "../../utils/formatters"

export default function SurveyInstances() {
  const navigate = useNavigate()
  const [instances, setInstances] = useState([])
  const [filteredInstances, setFilteredInstances] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadInstances()
  }, [])

  useEffect(() => {
    filterInstances()
  }, [instances, searchTerm])

  const loadInstances = () => {
    try {
      setIsLoading(true)
      const stored = localStorage.getItem("survey_instances")
      const allInstances = stored ? JSON.parse(stored) : []
      setInstances(allInstances)
    } catch (error) {
      console.error("Failed to load survey instances:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterInstances = () => {
    let filtered = [...instances]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(instance => {
        const residentName = instance.preSurveyData?.resident_name || ""
        const surveyType = instance.preSurveyData?.survey_type || ""
        return (
          residentName.toLowerCase().includes(term) ||
          surveyType.toLowerCase().includes(term) ||
          instance.surveyId.toLowerCase().includes(term)
        )
      })
    }

    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    setFilteredInstances(filtered)
  }

  const handleViewInstance = (instanceId) => {
    navigate(`/surveys/instances/${instanceId}`)
  }

  const handleStartNewSurvey = () => {
    navigate("/surveys/take")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading completed surveys...</p>
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
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Completed Surveys</h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                View and manage your completed survey assessments
              </p>
            </div>
            <Button onClick={handleStartNewSurvey} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Start New Survey
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by resident name, survey type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 text-base bg-white border-gray-200 focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredInstances.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg mb-4">
              {searchTerm
                ? "No completed surveys match your search"
                : "No completed surveys yet. Start your first survey to get started."}
            </p>
            {!searchTerm && (
              <Button onClick={handleStartNewSurvey}>
                <Plus className="h-4 w-4 mr-2" />
                Start New Survey
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredInstances.map((instance) => (
              <div key={instance.id} className="space-y-3 border-b border-gray-200 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handleViewInstance(instance.id)
                    }}
                    className="text-blue-600 hover:text-blue-800 hover:underline block leading-relaxed"
                  >
                    {instance.preSurveyData?.resident_name || "Unnamed Survey"}
                  </a>
                </h3>

                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Survey Type:</span>
                    <span>{instance.preSurveyData?.survey_type || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Room:</span>
                    <span>{instance.preSurveyData?.room_number || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Assessor:</span>
                    <span>{instance.preSurveyData?.assessor_name || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Completed:</span>
                    <span>{formatDateTime(instance.completedAt)}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewInstance(instance.id)}
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

