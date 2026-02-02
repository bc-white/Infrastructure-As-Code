import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FileText } from "lucide-react"
import { toast } from "sonner"
import { US_STATES } from "../utils/constants"
import PDFViewer from "../components/PDFViewer"

export default function Resources() {
  const [searchTerm, setSearchTerm] = useState("")
  const [viewingPdf, setViewingPdf] = useState(null)
  const [resourceType, setResourceType] = useState("states") // "states" or "other"

  // Mock resources data organized by state
  const resourcesByState = {
    "Alabama": [
      { id: "al-1", title: "Alabama Public Health", url: "#", type: "Link" },
      { id: "al-2", title: "Alabama Small Business Development Center Network", url: "#", type: "Link" },
      { id: "al-3", title: "Alabama ALF Regulations Guide", url: "#", type: "PDF" }
    ],
    "Alaska": [
      { id: "ak-1", title: "Alaska Department of Health and Social Services", url: "#", type: "Link" },
      { id: "ak-2", title: "Alaska ALF Regulations", url: "#", type: "PDF" }
    ],
    "Arizona": [
      { id: "az-1", title: "Arizona Department of Health Services", url: "#", type: "Link" },
      { id: "az-2", title: "Arizona ALF Licensing Requirements", url: "#", type: "PDF" }
    ],
    "Arkansas": [
      { id: "ar-1", title: "Arkansas Department of Human Services", url: "#", type: "Link" },
      { id: "ar-2", title: "Arkansas ALF Regulations", url: "#", type: "PDF" }
    ],
    "California": [
      { id: "ca-1", title: "California RCFE Regulations Guide", url: "#", type: "PDF" },
      { id: "ca-2", title: "California Survey Preparation Checklist", url: "#", type: "DOCX" },
      { id: "ca-3", title: "California Department of Social Services", url: "#", type: "Link" }
    ],
    "Colorado": [
      { id: "co-1", title: "Colorado Department of Public Health and Environment", url: "#", type: "Link" },
      { id: "co-2", title: "Colorado ALF Regulations", url: "#", type: "PDF" }
    ],
    "Connecticut": [
      { id: "ct-1", title: "Connecticut Department of Public Health", url: "#", type: "Link" },
      { id: "ct-2", title: "Connecticut ALF Licensing Information", url: "#", type: "PDF" }
    ],
    "Delaware": [
      { id: "de-1", title: "Delaware Division of Long Term Care Residents Protection", url: "#", type: "Link" },
      { id: "de-2", title: "Delaware ALF Regulations", url: "#", type: "PDF" }
    ],
    "Florida": [
      { id: "fl-1", title: "Florida ALF Regulations Guide (FAC Chapter 58A-5)", url: "#", type: "PDF" },
      { id: "fl-2", title: "Florida Survey Preparation Checklist", url: "#", type: "DOCX" },
      { id: "fl-3", title: "Florida Care Plan Template", url: "#", type: "DOCX" },
      { id: "fl-4", title: "Florida Medication Administration Policy", url: "#", type: "PDF" },
      { id: "fl-5", title: "Florida Emergency Procedures Manual", url: "#", type: "PDF" },
      { id: "fl-6", title: "Florida Agency for Health Care Administration", url: "#", type: "Link" }
    ],
    "Georgia": [
      { id: "ga-1", title: "Georgia Department of Community Health", url: "#", type: "Link" },
      { id: "ga-2", title: "Georgia ALF Regulations", url: "#", type: "PDF" }
    ],
    "Hawaii": [
      { id: "hi-1", title: "Hawaii Department of Health", url: "#", type: "Link" },
      { id: "hi-2", title: "Hawaii ALF Licensing Requirements", url: "#", type: "PDF" }
    ],
    "Idaho": [
      { id: "id-1", title: "Idaho Department of Health and Welfare", url: "#", type: "Link" },
      { id: "id-2", title: "Idaho ALF Regulations", url: "#", type: "PDF" }
    ],
    "Illinois": [
      { id: "il-1", title: "Illinois Department of Public Health", url: "#", type: "Link" },
      { id: "il-2", title: "Illinois ALF Regulations", url: "#", type: "PDF" }
    ],
    "Indiana": [
      { id: "in-1", title: "Indiana State Department of Health", url: "#", type: "Link" },
      { id: "in-2", title: "Indiana ALF Licensing Information", url: "#", type: "PDF" }
    ],
    "Iowa": [
      { id: "ia-1", title: "Iowa Department of Public Health", url: "#", type: "Link" },
      { id: "ia-2", title: "Iowa ALF Regulations", url: "#", type: "PDF" }
    ],
    "Kansas": [
      { id: "ks-1", title: "Kansas Department of Health and Environment", url: "#", type: "Link" },
      { id: "ks-2", title: "Kansas ALF Regulations", url: "#", type: "PDF" }
    ],
    "Kentucky": [
      { id: "ky-1", title: "Kentucky Cabinet for Health and Family Services", url: "#", type: "Link" },
      { id: "ky-2", title: "Kentucky ALF Regulations", url: "#", type: "PDF" }
    ],
    "Louisiana": [
      { id: "la-1", title: "Louisiana Department of Health", url: "#", type: "Link" },
      { id: "la-2", title: "Louisiana ALF Licensing Information", url: "#", type: "PDF" }
    ],
    "Maine": [
      { id: "me-1", title: "Maine Department of Health and Human Services", url: "#", type: "Link" },
      { id: "me-2", title: "Maine ALF Regulations", url: "#", type: "PDF" }
    ],
    "Maryland": [
      { id: "md-1", title: "Maryland Department of Health", url: "#", type: "Link" },
      { id: "md-2", title: "Maryland ALF Regulations", url: "#", type: "PDF" }
    ],
    "Massachusetts": [
      { id: "ma-1", title: "Massachusetts Executive Office of Elder Affairs", url: "#", type: "Link" },
      { id: "ma-2", title: "Massachusetts ALF Regulations", url: "#", type: "PDF" }
    ],
    "Michigan": [
      { id: "mi-1", title: "Michigan Department of Licensing and Regulatory Affairs", url: "#", type: "Link" },
      { id: "mi-2", title: "Michigan ALF Regulations", url: "#", type: "PDF" }
    ],
    "Minnesota": [
      { id: "mn-1", title: "Minnesota Department of Health", url: "#", type: "Link" },
      { id: "mn-2", title: "Minnesota ALF Regulations", url: "#", type: "PDF" }
    ],
    "Mississippi": [
      { id: "ms-1", title: "Mississippi State Department of Health", url: "#", type: "Link" },
      { id: "ms-2", title: "Mississippi ALF Regulations", url: "#", type: "PDF" }
    ],
    "Missouri": [
      { id: "mo-1", title: "Missouri Department of Health and Senior Services", url: "#", type: "Link" },
      { id: "mo-2", title: "Missouri ALF Regulations", url: "#", type: "PDF" }
    ],
    "Montana": [
      { id: "mt-1", title: "Montana Department of Public Health and Human Services", url: "#", type: "Link" },
      { id: "mt-2", title: "Montana ALF Regulations", url: "#", type: "PDF" }
    ],
    "Nebraska": [
      { id: "ne-1", title: "Nebraska Department of Health and Human Services", url: "#", type: "Link" },
      { id: "ne-2", title: "Nebraska ALF Regulations", url: "#", type: "PDF" }
    ],
    "Nevada": [
      { id: "nv-1", title: "Nevada Division of Public and Behavioral Health", url: "#", type: "Link" },
      { id: "nv-2", title: "Nevada ALF Regulations", url: "#", type: "PDF" }
    ],
    "New Hampshire": [
      { id: "nh-1", title: "New Hampshire Department of Health and Human Services", url: "#", type: "Link" },
      { id: "nh-2", title: "New Hampshire ALF Regulations", url: "#", type: "PDF" }
    ],
    "New Jersey": [
      { id: "nj-1", title: "New Jersey Department of Health", url: "#", type: "Link" },
      { id: "nj-2", title: "New Jersey ALF Regulations", url: "#", type: "PDF" }
    ],
    "New Mexico": [
      { id: "nm-1", title: "New Mexico Department of Health", url: "#", type: "Link" },
      { id: "nm-2", title: "New Mexico ALF Regulations", url: "#", type: "PDF" }
    ],
    "New York": [
      { id: "ny-1", title: "New York ALF Regulations Guide", url: "#", type: "PDF" },
      { id: "ny-2", title: "New York State Department of Health", url: "#", type: "Link" }
    ],
    "North Carolina": [
      { id: "nc-1", title: "North Carolina Department of Health and Human Services", url: "#", type: "Link" },
      { id: "nc-2", title: "North Carolina ALF Regulations", url: "#", type: "PDF" }
    ],
    "North Dakota": [
      { id: "nd-1", title: "North Dakota Department of Health", url: "#", type: "Link" },
      { id: "nd-2", title: "North Dakota ALF Regulations", url: "#", type: "PDF" }
    ],
    "Ohio": [
      { id: "oh-1", title: "Ohio Department of Health", url: "#", type: "Link" },
      { id: "oh-2", title: "Ohio ALF Regulations", url: "#", type: "PDF" }
    ],
    "Oklahoma": [
      { id: "ok-1", title: "Oklahoma State Department of Health", url: "#", type: "Link" },
      { id: "ok-2", title: "Oklahoma ALF Regulations", url: "#", type: "PDF" }
    ],
    "Oregon": [
      { id: "or-1", title: "Oregon Department of Human Services", url: "#", type: "Link" },
      { id: "or-2", title: "Oregon ALF Regulations", url: "#", type: "PDF" }
    ],
    "Pennsylvania": [
      { id: "pa-1", title: "Pennsylvania Department of Human Services", url: "#", type: "Link" },
      { id: "pa-2", title: "Pennsylvania ALF Regulations", url: "#", type: "PDF" }
    ],
    "Rhode Island": [
      { id: "ri-1", title: "Rhode Island Department of Health", url: "#", type: "Link" },
      { id: "ri-2", title: "Rhode Island ALF Regulations", url: "#", type: "PDF" }
    ],
    "South Carolina": [
      { id: "sc-1", title: "South Carolina Department of Health and Environmental Control", url: "#", type: "Link" },
      { id: "sc-2", title: "South Carolina ALF Regulations", url: "#", type: "PDF" }
    ],
    "South Dakota": [
      { id: "sd-1", title: "South Dakota Department of Health", url: "#", type: "Link" },
      { id: "sd-2", title: "South Dakota ALF Regulations", url: "#", type: "PDF" }
    ],
    "Tennessee": [
      { id: "tn-1", title: "Tennessee Department of Health", url: "#", type: "Link" },
      { id: "tn-2", title: "Tennessee ALF Regulations", url: "#", type: "PDF" }
    ],
    "Texas": [
      { id: "tx-1", title: "Texas ALF Regulations Guide", url: "#", type: "PDF" },
      { id: "tx-2", title: "Texas Care Plan Template", url: "#", type: "DOCX" },
      { id: "tx-3", title: "Texas Health and Human Services", url: "#", type: "Link" }
    ],
    "Utah": [
      { id: "ut-1", title: "Utah Department of Health and Human Services", url: "#", type: "Link" },
      { id: "ut-2", title: "Utah ALF Regulations", url: "#", type: "PDF" }
    ],
    "Vermont": [
      { id: "vt-1", title: "Vermont Department of Disabilities, Aging, and Independent Living", url: "#", type: "Link" },
      { id: "vt-2", title: "Vermont ALF Regulations", url: "#", type: "PDF" }
    ],
    "Virginia": [
      { id: "va-1", title: "Virginia Department of Social Services", url: "#", type: "Link" },
      { id: "va-2", title: "Virginia ALF Regulations", url: "#", type: "PDF" }
    ],
    "Washington": [
      { id: "wa-1", title: "Washington State Department of Social and Health Services", url: "#", type: "Link" },
      { id: "wa-2", title: "Washington ALF Regulations", url: "#", type: "PDF" }
    ],
    "West Virginia": [
      { id: "wv-1", title: "West Virginia Department of Health and Human Resources", url: "#", type: "Link" },
      { id: "wv-2", title: "West Virginia ALF Regulations", url: "#", type: "PDF" }
    ],
    "Wisconsin": [
      { id: "wi-1", title: "Wisconsin Department of Health Services", url: "#", type: "Link" },
      { id: "wi-2", title: "Wisconsin ALF Regulations", url: "#", type: "PDF" }
    ],
    "Wyoming": [
      { id: "wy-1", title: "Wyoming Department of Health", url: "#", type: "Link" },
      { id: "wy-2", title: "Wyoming ALF Regulations", url: "#", type: "PDF" }
    ]
  }

  // Other/General resources (not state-specific)
  const otherResources = [
    { id: "other-1", title: "Assisted Living Best Practices Guide", category: "Best Practices", type: "PDF", url: "#" },
    { id: "other-2", title: "HIPAA Compliance Checklist", category: "Compliance", type: "PDF", url: "#" },
    { id: "other-3", title: "Resident Rights Handbook", category: "Resident Care", type: "PDF", url: "#" },
    { id: "other-4", title: "Medication Management Guidelines", category: "Medical", type: "PDF", url: "#" },
    { id: "other-5", title: "Emergency Preparedness Plan Template", category: "Safety", type: "DOCX", url: "#" },
    { id: "other-6", title: "Staff Training Resources", category: "Training", type: "Link", url: "#" },
    { id: "other-7", title: "Quality Assurance Standards", category: "Quality", type: "PDF", url: "#" },
    { id: "other-8", title: "Infection Control Protocols", category: "Safety", type: "PDF", url: "#" },
    { id: "other-9", title: "Nutrition and Dietary Guidelines", category: "Resident Care", type: "PDF", url: "#" },
    { id: "other-10", title: "Activities and Social Engagement Guide", category: "Resident Care", type: "PDF", url: "#" }
  ]

  const otherCategories = ["all", ...new Set(otherResources.map(r => r.category))]

  // Filter states and resources based on search
  const filteredStates = useMemo(() => {
    if (!searchTerm) return US_STATES

    const term = searchTerm.toLowerCase()
    return US_STATES.filter(state => {
      const stateMatch = state.toLowerCase().includes(term)
      const resources = resourcesByState[state] || []
      const resourceMatch = resources.some(resource => 
        resource.title.toLowerCase().includes(term)
      )
      return stateMatch || resourceMatch
    })
  }, [searchTerm])

  // Filter other resources
  const [selectedCategory, setSelectedCategory] = useState("all")
  const filteredOtherResources = useMemo(() => {
    let filtered = otherResources.filter(resource => {
      const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.category.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    return filtered
  }, [searchTerm, selectedCategory])

  // Generate PDF URL - in real app, this would come from your backend/storage
  const getResourceUrl = (resource) => {
    // For demo purposes, using a sample PDF URL
    // In production, this would be the actual file URL from your storage
    if (resource.type === "PDF") {
      // Using a sample PDF for demonstration
      // Replace with actual PDF URLs from your storage service
      return `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`
    } else if (resource.type === "DOCX") {
      // For DOCX files, you might want to convert to PDF or use a viewer
      // For now, we'll show a message
      toast.info("DOCX files will be available for download. PDF viewer coming soon for DOCX files.")
      return null
    } else if (resource.type === "Link") {
      return resource.url
    }
    return null
  }

  const handleResourceClick = (resource) => {
    if (resource.type === "Link") {
      // Open external links in new tab
      window.open(resource.url, "_blank", "noopener,noreferrer")
    } else if (resource.type === "PDF") {
      // Open PDF in viewer
      const pdfUrl = getResourceUrl(resource)
      if (pdfUrl) {
        setViewingPdf({
          url: pdfUrl,
          title: resource.title
        })
      } else {
        toast.error("PDF URL not available")
      }
    } else if (resource.type === "DOCX") {
      // For DOCX, show download option
      toast.info(`Downloading ${resource.title}`)
      // In real app, trigger download
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Resources</h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                {resourceType === "states" 
                  ? "State-specific resources for Assisted Living Facilities"
                  : "General resources for Assisted Living Facilities"}
              </p>
            </div>
            {/* Resource Type Toggle */}
            <div className="flex gap-2 bg-white rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => {
                  setResourceType("states")
                  setSearchTerm("")
                  setSelectedCategory("all")
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  resourceType === "states"
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                State Resources
              </button>
              <button
                onClick={() => {
                  setResourceType("other")
                  setSearchTerm("")
                  setSelectedCategory("all")
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  resourceType === "other"
                    ? "bg-primary text-primary-foreground"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Other Resources
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {resourceType === "other" ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 text-base bg-white border-gray-200 focus:border-primary"
                />
              </div>
              {/* Category Filter Buttons */}
              <div className="flex gap-2 flex-wrap sm:flex-nowrap sm:shrink-0">
                {otherCategories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={`text-sm whitespace-nowrap transition-all ${
                      selectedCategory === category 
                        ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                        : "bg-white hover:bg-gray-50 border-gray-200"
                    }`}
                  >
                    {category === "all" ? "All" : category}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by state or resource name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base bg-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {resourceType === "states" ? (
          /* States Grid - Responsive columns */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredStates.map((state) => {
              const resources = resourcesByState[state] || []
              const hasResources = resources.length > 0
              
              // If searching and no matches in this state, don't show it
              if (searchTerm && !hasResources) {
                const stateMatch = state.toLowerCase().includes(searchTerm.toLowerCase())
                if (!stateMatch) return null
              }

              return (
                <div key={state} className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                    {state}
                  </h3>
                  {hasResources ? (
                    <div className="space-y-2">
                      {resources
                        .filter(resource => {
                          if (!searchTerm) return true
                          return resource.title.toLowerCase().includes(searchTerm.toLowerCase())
                        })
                        .map((resource) => (
                          <div key={resource.id}>
                            <a
                              href={resource.url}
                              onClick={(e) => {
                                e.preventDefault()
                                handleResourceClick(resource)
                              }}
                              className="block text-blue-600 hover:text-blue-800 hover:underline text-sm leading-relaxed group"
                            >
                              <span className="flex items-start gap-2">
                                <span className="flex-1">{resource.title}</span>
                                {resource.type !== "Link" && (
                                  <span className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {resource.type === "PDF" && <FileText className="h-3.5 w-3.5 text-gray-400" />}
                                    {resource.type === "DOCX" && <FileText className="h-3.5 w-3.5 text-gray-400" />}
                                  </span>
                                )}
                              </span>
                            </a>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No resources available
                    </p>
                  )}
                </div>
              )
            })}
            {/* Empty State for States */}
            {filteredStates.length === 0 && (
              <div className="text-center py-12 col-span-full">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg">
                  No states or resources match your search
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSearchTerm("")}
                >
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Other Resources List - Grouped by Category */
          <div>
            {filteredOtherResources.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-lg">
                  No resources match your search
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedCategory("all")
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              (() => {
                // Group resources by category
                const groupedByCategory = filteredOtherResources.reduce((acc, resource) => {
                  if (!acc[resource.category]) {
                    acc[resource.category] = []
                  }
                  acc[resource.category].push(resource)
                  return acc
                }, {})

                // Sort categories alphabetically
                const sortedCategories = Object.keys(groupedByCategory).sort()

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {sortedCategories.map((category) => (
                      <div key={category} className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                          {category}
                        </h3>
                        <div className="space-y-2.5">
                          {groupedByCategory[category].map((resource) => (
                            <a
                              key={resource.id}
                              href={resource.url}
                              onClick={(e) => {
                                e.preventDefault()
                                handleResourceClick(resource)
                              }}
                              className="block text-blue-600 hover:text-blue-800 hover:underline text-sm leading-relaxed group transition-colors"
                            >
                              <span className="flex items-start gap-2">
                                <span className="flex-1">{resource.title}</span>
                                {resource.type !== "Link" && (
                                  <span className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                                    {resource.type === "PDF" && <FileText className="h-3.5 w-3.5 text-gray-400" />}
                                    {resource.type === "DOCX" && <FileText className="h-3.5 w-3.5 text-gray-400" />}
                                  </span>
                                )}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()
            )}
          </div>
        )}
      </div>

      {/* PDF Viewer Modal */}
      <PDFViewer
        isOpen={!!viewingPdf}
        onClose={() => setViewingPdf(null)}
        pdfUrl={viewingPdf?.url}
        title={viewingPdf?.title}
      />
    </div>
  )
}
