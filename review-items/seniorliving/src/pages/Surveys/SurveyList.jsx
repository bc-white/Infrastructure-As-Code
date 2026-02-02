import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { mockSurveyService } from "../../services/mockSurveyService"
import { Plus, Search, Edit, Copy, Archive, Trash2, Eye, MoreVertical, FileText, List, MapPin } from "lucide-react"
import { toast } from "sonner"
import { useConfirm } from "../../hooks/useConfirm"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function SurveyList() {
  const navigate = useNavigate()
  const { confirm, ConfirmDialog } = useConfirm()
  const [surveys, setSurveys] = useState([])
  const [filteredSurveys, setFilteredSurveys] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [stateFilter, setStateFilter] = useState("all")

  useEffect(() => {
    loadSurveys()
  }, [])

  useEffect(() => {
    filterSurveys()
  }, [surveys, searchTerm, statusFilter, stateFilter])

  const loadSurveys = async () => {
    try {
      setIsLoading(true)
      const allSurveys = await mockSurveyService.getAllSurveys()
      setSurveys(allSurveys)
    } catch (error) {
      console.error("Failed to load surveys:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterSurveys = () => {
    let filtered = [...surveys]

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        survey =>
          survey.title.toLowerCase().includes(term) ||
          survey.description.toLowerCase().includes(term) ||
          survey.type.toLowerCase().includes(term) ||
          survey.state.toLowerCase().includes(term)
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(survey => survey.status === statusFilter)
    }

    // Filter by state
    if (stateFilter !== "all") {
      filtered = filtered.filter(survey => survey.state === stateFilter)
    }

    setFilteredSurveys(filtered)
  }

  // Get unique states from surveys
  const getAvailableStates = () => {
    const states = [...new Set(surveys.map(survey => survey.state).filter(Boolean))]
    return states.sort()
  }

  // Group filtered surveys by state
  const groupSurveysByState = () => {
    const grouped = {}
    filteredSurveys.forEach(survey => {
      const state = survey.state || "Unknown"
      if (!grouped[state]) {
        grouped[state] = []
      }
      grouped[state].push(survey)
    })
    
    // Sort states alphabetically
    const sortedStates = Object.keys(grouped).sort()
    const result = {}
    sortedStates.forEach(state => {
      result[state] = grouped[state]
    })
    return result
  }

  const handleCreateNew = () => {
    navigate("/surveys/builder")
  }

  const handleEdit = (surveyId) => {
    navigate(`/surveys/builder/${surveyId}`)
  }

  const handleDuplicate = async (surveyId) => {
    try {
      await mockSurveyService.duplicateSurvey(surveyId)
      loadSurveys()
    } catch (error) {
      console.error("Failed to duplicate survey:", error)
      toast.error(error.message)
    }
  }

  const handleArchive = async (surveyId) => {
    const confirmed = await confirm("Are you sure you want to archive this survey?", {
      title: "Archive Survey",
      variant: "default",
      confirmText: "Archive"
    })
    if (!confirmed) return

    try {
      await mockSurveyService.archiveSurvey(surveyId)
      loadSurveys()
      toast.success("Survey archived successfully")
    } catch (error) {
      console.error("Failed to archive survey:", error)
      toast.error(error.message)
    }
  }

  const handleDelete = async (surveyId) => {
    const confirmed = await confirm("Are you sure you want to delete this survey? This action cannot be undone.", {
      title: "Delete Survey",
      variant: "destructive",
      confirmText: "Delete"
    })
    if (!confirmed) return

    try {
      await mockSurveyService.deleteSurvey(surveyId)
      loadSurveys()
      toast.success("Survey deleted successfully")
    } catch (error) {
      console.error("Failed to delete survey:", error)
      toast.error(error.message)
    }
  }

  const handlePreview = (surveyId) => {
    navigate(`/surveys/preview/${surveyId}`)
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "Published":
        return "default"
      case "Draft":
        return "secondary"
      case "Archived":
        return "outline"
      default:
        return "secondary"
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading surveys...</p>
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
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Surveys</h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                Create and manage regulatory survey templates
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/surveys/take")} className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Take Survey
              </Button>
              <Button variant="outline" onClick={() => navigate("/surveys/instances")} className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Completed Surveys
              </Button>
              <Button onClick={handleCreateNew} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Survey Builder
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search surveys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 text-base bg-white border-gray-200 focus:border-primary"
                />
              </div>
              {/* State Filter */}
              <div className="w-full sm:w-48">
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="h-11 bg-white border-gray-200 focus:border-primary">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {getAvailableStates().map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Status Filter Buttons */}
            <div className="flex gap-2 flex-wrap sm:flex-nowrap sm:shrink-0">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className={`text-sm whitespace-nowrap transition-all ${
                  statusFilter === "all" 
                    ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                    : "bg-white hover:bg-gray-50 border-gray-200"
                }`}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "Draft" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("Draft")}
                className={`text-sm whitespace-nowrap transition-all ${
                  statusFilter === "Draft" 
                    ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                    : "bg-white hover:bg-gray-50 border-gray-200"
                }`}
              >
                Draft
              </Button>
              <Button
                variant={statusFilter === "Published" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("Published")}
                className={`text-sm whitespace-nowrap transition-all ${
                  statusFilter === "Published" 
                    ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                    : "bg-white hover:bg-gray-50 border-gray-200"
                }`}
              >
                Published
              </Button>
              <Button
                variant={statusFilter === "Archived" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("Archived")}
                className={`text-sm whitespace-nowrap transition-all ${
                  statusFilter === "Archived" 
                    ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                    : "bg-white hover:bg-gray-50 border-gray-200"
                }`}
              >
                Archived
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredSurveys.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg mb-4">
              {searchTerm || statusFilter !== "all" || stateFilter !== "all"
                ? "No surveys match your filters"
                : "No surveys yet. Create your first survey to get started."}
            </p>
            {!searchTerm && statusFilter === "all" && stateFilter === "all" && (
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Survey Builder
              </Button>
            )}
            {(searchTerm || statusFilter !== "all" || stateFilter !== "all") && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setStateFilter("all")
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          (() => {
            const surveysByState = groupSurveysByState()
            const states = Object.keys(surveysByState)

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {states.map((state) => {
                  const stateSurveys = surveysByState[state]
                  
                  return (
                    <div key={state} className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {state}
                      </h3>
                      {stateSurveys.length > 0 ? (
                        <div className="space-y-3">
                          {stateSurveys.map((survey) => (
                            <div key={survey.id} className="space-y-2.5 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                              <div className="space-y-2">
                                <h4 className="text-base font-semibold text-gray-900">
                                  <a
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      handleEdit(survey.id)
                                    }}
                                    className="text-blue-600 hover:text-blue-800 hover:underline block leading-relaxed"
                                  >
                                    {survey.title}
                                  </a>
                                </h4>
                                
                                {survey.description && survey.description !== survey.title && (
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {survey.description}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge variant={getStatusBadgeVariant(survey.status)} className="text-xs">
                                  {survey.status}
                                </Badge>
                              </div>
                              
                              <div className="space-y-1.5 text-sm text-muted-foreground">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">Type:</span>
                                  <span>{survey.type}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">Sections:</span>
                                  <span>{survey.sections?.length || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">Last Modified:</span>
                                  <span>{formatDate(survey.updatedAt)}</span>
                                </div>
                              </div>
                              
                              <div className="pt-1">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="text-xs text-muted-foreground hover:text-gray-900 h-7"
                                    >
                                      <MoreVertical className="h-3.5 w-3.5 mr-1" />
                                      Actions
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEdit(survey.id)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handlePreview(survey.id)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Preview
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDuplicate(survey.id)}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Duplicate
                                    </DropdownMenuItem>
                                    {survey.status !== "Archived" && (
                                      <DropdownMenuItem onClick={() => handleArchive(survey.id)}>
                                        <Archive className="h-4 w-4 mr-2" />
                                        Archive
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() => handleDelete(survey.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          No surveys available
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })()
        )}
      </div>
      <ConfirmDialog />
    </div>
  )
}

