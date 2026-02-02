import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Search, FileText, Download, Plus } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

export default function Reports() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState("all")
  const [activeTab, setActiveTab] = useState("normal")

  // Mock POC Reports data
  const pocReports = [
    {
      id: "poc-1",
      name: "POC Status Report - Q1 2024",
      description: "Comprehensive status report of all Plans of Correction for Q1 2024",
      itemCount: 12,
      tags: ["POC", "Status", "Q1 2024"],
      category: "POC Reports",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
      status: "Completed"
    },
    {
      id: "poc-2",
      name: "POC Compliance Summary",
      description: "Summary of POC compliance across all facilities",
      itemCount: 8,
      tags: ["POC", "Compliance", "Summary"],
      category: "POC Reports",
      createdAt: "2024-01-14T14:30:00Z",
      updatedAt: "2024-01-14T14:30:00Z",
      status: "Completed"
    },
    {
      id: "poc-3",
      name: "POC Timeline Report",
      description: "Timeline analysis of POC submissions and completions",
      itemCount: 15,
      tags: ["POC", "Timeline", "Analysis"],
      category: "POC Reports",
      createdAt: "2024-01-13T09:15:00Z",
      updatedAt: "2024-01-13T09:15:00Z",
      status: "In Progress"
    }
  ]

  // Mock Normal Reports data
  const normalReports = [
    {
      id: "report-1",
      name: "Compliance Summary Report",
      description: "Monthly compliance summary for all facilities",
      itemCount: 25,
      tags: ["Compliance", "Monthly", "Summary"],
      category: "Compliance Reports",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
      status: "Completed"
    },
    {
      id: "report-2",
      name: "Deficiency Analysis Report",
      description: "Analysis of all deficiencies by severity and scope",
      itemCount: 18,
      tags: ["Deficiency", "Analysis", "Severity"],
      category: "Deficiency Reports",
      createdAt: "2024-01-14T14:30:00Z",
      updatedAt: "2024-01-14T14:30:00Z",
      status: "Completed"
    },
    {
      id: "report-3",
      name: "Survey Completion Report",
      description: "Summary of all completed surveys",
      itemCount: 32,
      tags: ["Survey", "Completion", "Summary"],
      category: "Survey Reports",
      createdAt: "2024-01-13T09:15:00Z",
      updatedAt: "2024-01-13T09:15:00Z",
      status: "Completed"
    },
    {
      id: "report-4",
      name: "Facility Performance Report",
      description: "Performance metrics across all facilities",
      itemCount: 20,
      tags: ["Performance", "Metrics", "Facilities"],
      category: "Performance Reports",
      createdAt: "2024-01-12T16:45:00Z",
      updatedAt: "2024-01-12T16:45:00Z",
      status: "Completed"
    },
    {
      id: "report-5",
      name: "Staff Compliance Report",
      description: "Staff training and compliance tracking",
      itemCount: 14,
      tags: ["Staff", "Training", "Compliance"],
      category: "Staff Reports",
      createdAt: "2024-01-11T11:20:00Z",
      updatedAt: "2024-01-11T11:20:00Z",
      status: "Completed"
    }
  ]

  // Mock Notes data
  const notes = [
    {
      id: "note-1",
      name: "Survey Notes - January 2024",
      description: "Detailed notes from January survey activities",
      itemCount: 45,
      tags: ["Survey", "January", "Notes"],
      category: "Survey Notes",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z"
    },
    {
      id: "note-2",
      name: "Compliance Meeting Notes",
      description: "Notes from weekly compliance meetings",
      itemCount: 28,
      tags: ["Compliance", "Meetings", "Notes"],
      category: "Meeting Notes",
      createdAt: "2024-01-14T14:30:00Z",
      updatedAt: "2024-01-14T14:30:00Z"
    },
    {
      id: "note-3",
      name: "Deficiency Resolution Notes",
      description: "Notes on deficiency resolution processes",
      itemCount: 22,
      tags: ["Deficiency", "Resolution", "Notes"],
      category: "Deficiency Notes",
      createdAt: "2024-01-13T09:15:00Z",
      updatedAt: "2024-01-13T09:15:00Z"
    },
    {
      id: "note-4",
      name: "Training Session Notes",
      description: "Notes from staff training sessions",
      itemCount: 35,
      tags: ["Training", "Staff", "Notes"],
      category: "Training Notes",
      createdAt: "2024-01-12T16:45:00Z",
      updatedAt: "2024-01-12T16:45:00Z"
    }
  ]

  // Get current data based on active tab
  const currentData = useMemo(() => {
    switch (activeTab) {
      case "poc":
        return pocReports
      case "normal":
        return normalReports
      case "notes":
        return notes
      default:
        return normalReports
    }
  }, [activeTab])

  // Get all unique tags from current data
  const allTags = useMemo(() => {
    const tagsSet = new Set()
    currentData.forEach(item => {
      item.tags?.forEach(tag => tagsSet.add(tag))
    })
    return ["all", ...Array.from(tagsSet).sort()]
  }, [currentData])

  const handleCreate = () => {
    toast.info("Create report functionality will be implemented")
  }

  const handleDownload = (item) => {
    // Create a mock PDF download
    const fileName = `${item.name.replace(/\s+/g, '_')}.pdf`
    
    // Create a blob URL for the PDF (mock)
    const blob = new Blob(['PDF content would go here'], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    
    // Create a temporary link and trigger download
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast.success(`Downloading ${item.name}...`)
  }

  // Filter data based on search and selected tag
  const filteredData = useMemo(() => {
    let items = currentData

    // Filter by tag
    if (selectedTag !== "all") {
      items = items.filter(item => 
        item.tags?.includes(selectedTag) || item.category === selectedTag
      )
    }

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      items = items.filter(item =>
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.tags?.some(tag => tag.toLowerCase().includes(term))
      )
    }

    return items
  }, [currentData, searchTerm, selectedTag])

  // Group filtered data by tag for display
  const displayGroups = useMemo(() => {
    if (selectedTag !== "all") {
      // If a specific tag is selected, show items under that tag
      return { [selectedTag]: filteredData }
    }

    // Otherwise, group by all tags
    const grouped = {}
    filteredData.forEach(item => {
      item.tags?.forEach(tag => {
        if (!grouped[tag]) {
          grouped[tag] = []
        }
        if (!grouped[tag].find(i => i.id === item.id)) {
          grouped[tag].push(item)
        }
      })
    })
    return grouped
  }, [filteredData, selectedTag])

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      return format(date, "MMM dd, yyyy")
    } catch {
      return dateString
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Reports</h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                View, filter and manage your reports and notes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent border-b border-gray-200 rounded-none h-auto p-0">
              <TabsTrigger 
                value="normal" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                Normal Reports
              </TabsTrigger>
              <TabsTrigger 
                value="poc" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                POC Reports
              </TabsTrigger>
              <TabsTrigger 
                value="notes" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                Notes
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={`Search ${activeTab === "poc" ? "POC reports" : activeTab === "notes" ? "notes" : "reports"}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 text-base bg-white border-gray-200 focus:border-primary w-full"
              />
            </div>
            {/* Tag Filter Buttons */}
            <div className="flex gap-2 flex-wrap overflow-x-auto pb-1 -mx-1 px-1">
              {allTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(tag)}
                  className={`text-xs sm:text-sm whitespace-nowrap transition-all shrink-0 ${
                    selectedTag === tag 
                      ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                      : "bg-white hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  {tag === "all" ? "All" : tag}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="normal" className="mt-0">
            {Object.keys(displayGroups).length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg mb-4">
                  {searchTerm || selectedTag !== "all"
                    ? "No reports match your search or selected tag"
                    : "No reports yet. Generate your first report to get started."}
                </p>
                {!searchTerm && selectedTag === "all" && (
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                )}
                {(searchTerm || selectedTag !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedTag("all")
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {Object.entries(displayGroups).map(([tag, tagItems]) => (
                  <div key={tag} className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      {tag}
                    </h3>
                    <div className="space-y-2">
                      {tagItems.map((item) => (
                        <div key={item.id}>
                          <button
                            onClick={() => handleDownload(item)}
                            className="block text-left text-blue-600 hover:text-blue-800 hover:underline text-sm leading-relaxed w-full"
                          >
                            {item.name}
                          </button>
                          <div className="mt-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-muted-foreground">
                                {item.itemCount} items
                              </div>
                              {item.status && (
                                <Badge variant="outline" className="text-xs">
                                  {item.status}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Updated {formatDate(item.updatedAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="poc" className="mt-0">
            {Object.keys(displayGroups).length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg mb-4">
                  {searchTerm || selectedTag !== "all"
                    ? "No POC reports match your search or selected tag"
                    : "No POC reports yet. Generate your first POC report to get started."}
                </p>
                {!searchTerm && selectedTag === "all" && (
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate POC Report
                  </Button>
                )}
                {(searchTerm || selectedTag !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedTag("all")
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {Object.entries(displayGroups).map(([tag, tagItems]) => (
                  <div key={tag} className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      {tag}
                    </h3>
                    <div className="space-y-2">
                      {tagItems.map((item) => (
                        <div key={item.id}>
                          <button
                            onClick={() => handleDownload(item)}
                            className="block text-left text-blue-600 hover:text-blue-800 hover:underline text-sm leading-relaxed w-full"
                          >
                            {item.name}
                          </button>
                          <div className="mt-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-muted-foreground">
                                {item.itemCount} items
                              </div>
                              {item.status && (
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    item.status === "Completed" 
                                      ? "bg-green-50 text-green-700 border-green-200" 
                                      : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  }`}
                                >
                                  {item.status}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Updated {formatDate(item.updatedAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notes" className="mt-0">
            {Object.keys(displayGroups).length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg mb-4">
                  {searchTerm || selectedTag !== "all"
                    ? "No notes match your search or selected tag"
                    : "No notes yet. Create your first note to get started."}
                </p>
                {!searchTerm && selectedTag === "all" && (
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Note
                  </Button>
                )}
                {(searchTerm || selectedTag !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("")
                      setSelectedTag("all")
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {Object.entries(displayGroups).map(([tag, tagItems]) => (
                  <div key={tag} className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                      {tag}
                    </h3>
                    <div className="space-y-2">
                      {tagItems.map((item) => (
                        <div key={item.id}>
                          <button
                            onClick={() => handleDownload(item)}
                            className="block text-left text-blue-600 hover:text-blue-800 hover:underline text-sm leading-relaxed w-full"
                          >
                            {item.name}
                          </button>
                          <div className="mt-1 space-y-1">
                            <div className="text-xs text-muted-foreground">
                              {item.itemCount} items
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Updated {formatDate(item.updatedAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
