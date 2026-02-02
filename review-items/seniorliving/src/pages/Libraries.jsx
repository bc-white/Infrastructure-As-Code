import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, BookOpen, Plus } from "lucide-react"
import { toast } from "sonner"

export default function Libraries() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState("all")

  // Mock libraries data with tags
  const libraries = [
    {
      id: "library-1",
      name: "Survey Templates Library",
      description: "Collection of pre-built survey templates for various regulatory requirements",
      itemCount: 15,
      tags: ["Surveys", "Templates", "Regulations"],
      category: "Surveys",
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z"
    },
    {
      id: "library-2",
      name: "Policy Templates",
      description: "Standard policy templates for facility operations",
      itemCount: 28,
      tags: ["Policies", "Templates", "Operations"],
      category: "Policies",
      createdAt: "2024-01-14T14:30:00Z",
      updatedAt: "2024-01-14T14:30:00Z"
    },
    {
      id: "library-3",
      name: "Care Plan Library",
      description: "Reusable care plan templates and examples",
      itemCount: 42,
      tags: ["Care Plans", "Templates", "Resident Care"],
      category: "Care Plans",
      createdAt: "2024-01-13T09:15:00Z",
      updatedAt: "2024-01-13T09:15:00Z"
    },
    {
      id: "library-4",
      name: "Training Materials",
      description: "Training resources and educational materials for staff",
      itemCount: 35,
      tags: ["Training", "Education", "Staff"],
      category: "Training",
      createdAt: "2024-01-12T16:45:00Z",
      updatedAt: "2024-01-12T16:45:00Z"
    },
    {
      id: "library-5",
      name: "Compliance Checklists",
      description: "Comprehensive checklists for regulatory compliance",
      itemCount: 22,
      tags: ["Compliance", "Checklists", "Regulations"],
      category: "Compliance",
      createdAt: "2024-01-11T11:20:00Z",
      updatedAt: "2024-01-11T11:20:00Z"
    },
    {
      id: "library-6",
      name: "Emergency Procedures",
      description: "Emergency response procedures and protocols",
      itemCount: 18,
      tags: ["Safety", "Emergency", "Procedures"],
      category: "Safety",
      createdAt: "2024-01-10T09:00:00Z",
      updatedAt: "2024-01-10T09:00:00Z"
    },
    {
      id: "library-7",
      name: "Medication Management",
      description: "Templates and guides for medication administration",
      itemCount: 31,
      tags: ["Medical", "Medication", "Templates"],
      category: "Medical",
      createdAt: "2024-01-09T14:15:00Z",
      updatedAt: "2024-01-09T14:15:00Z"
    },
    {
      id: "library-8",
      name: "Quality Assurance Forms",
      description: "Forms and templates for quality assurance processes",
      itemCount: 27,
      tags: ["Quality", "Forms", "Assurance"],
      category: "Quality",
      createdAt: "2024-01-08T10:30:00Z",
      updatedAt: "2024-01-08T10:30:00Z"
    }
  ]

  // Get all unique tags from libraries
  const allTags = useMemo(() => {
    const tagsSet = new Set()
    libraries.forEach(library => {
      library.tags?.forEach(tag => tagsSet.add(tag))
    })
    return ["all", ...Array.from(tagsSet).sort()]
  }, [])

  const handleCreate = () => {
    toast.info("Create library functionality will be implemented")
  }

  const handleViewDetail = (libraryId) => {
    navigate(`/libraries/${libraryId}`)
  }

  // Filter libraries based on search and selected tag
  const filteredLibraries = useMemo(() => {
    let libs = libraries

    // Filter by tag
    if (selectedTag !== "all") {
      libs = libs.filter(library => 
        library.tags?.includes(selectedTag) || library.category === selectedTag
      )
    }

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      libs = libs.filter(library =>
        library.name.toLowerCase().includes(term) ||
        library.description.toLowerCase().includes(term) ||
        library.category.toLowerCase().includes(term) ||
        library.tags?.some(tag => tag.toLowerCase().includes(term))
      )
    }

    return libs
  }, [searchTerm, selectedTag])

  // Group filtered libraries by tag for display
  const displayGroups = useMemo(() => {
    if (selectedTag !== "all") {
      // If a specific tag is selected, show libraries under that tag
      return { [selectedTag]: filteredLibraries }
    }

    // Otherwise, group by all tags
    const grouped = {}
    filteredLibraries.forEach(library => {
      library.tags?.forEach(tag => {
        if (!grouped[tag]) {
          grouped[tag] = []
        }
        if (!grouped[tag].find(l => l.id === library.id)) {
          grouped[tag].push(library)
        }
      })
    })
    return grouped
  }, [filteredLibraries, selectedTag])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Libraries</h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                Manage your content libraries and templates
              </p>
            </div>
           
          </div>
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
                placeholder="Search libraries..."
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
        {Object.keys(displayGroups).length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg mb-4">
              {searchTerm || selectedTag !== "all"
                ? "No libraries match your search or selected tag"
                : "No libraries yet. Create your first library to get started."}
            </p>
            {!searchTerm && selectedTag === "all" && (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Library 
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
            {Object.entries(displayGroups).map(([tag, tagLibraries]) => (
              <div key={tag} className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  {tag}
                </h3>
                <div className="space-y-2">
                  {tagLibraries.map((library) => (
                    <div key={library.id}>
                      <a
                        href={`/libraries/${library.id}`}
                        onClick={(e) => {
                          e.preventDefault()
                          handleViewDetail(library.id)
                        }}
                        className="block text-blue-600 hover:text-blue-800 hover:underline text-sm leading-relaxed"
                      >
                        {library.name}
                      </a>
                      <div className="mt-1 space-y-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleViewDetail(library.id)
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                        >
                          View Detail
                        </button>
                        <div className="text-xs text-muted-foreground">
                          {library.itemCount} items
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
