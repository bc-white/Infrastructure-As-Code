import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Building2, FileText, CheckSquare, Image as ImageIcon, Folder, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const NAVIGATION_ITEMS = [
  { id: "facility", label: "Facility Setup", icon: Building2 },
  { id: "documents", label: "Documents", icon: Folder },
  { id: "checklists", label: "Checklists", icon: CheckSquare },
  { id: "sections", label: "Sections", icon: FileText },
  { id: "questions", label: "Questions", icon: FileText },
  { id: "images", label: "Images", icon: ImageIcon },
]

export default function BuilderNavigator({
  selectedTab,
  onTabSelect,
  sections = [],
  onAddSection,
  onSectionSelect,
  currentSectionId,
  onDeleteSection,
  facilities = [],
  selectedFacilityId,
  onFacilitySelect,
  onAddFacility,
  documents = [],
  checklists = [],
  images = []
}) {
  const handleTabClick = (tabId) => {
    onTabSelect(tabId)
  }

  const renderTabContent = () => {
    switch (selectedTab) {
      case "facility":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">Facilities</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddFacility}
                className="h-7 w-7 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {facilities.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-xs mb-2">No facilities</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onAddFacility}
                  className="text-xs"
                >
                  Add Facility
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {facilities.map((facility, index) => (
                  <Card
                    key={facility.id || index}
                    className={cn(
                      "cursor-pointer transition-all hover:bg-gray-50",
                      selectedFacilityId === facility.id && "ring-2 ring-primary bg-primary/5"
                    )}
                    onClick={() => onFacilitySelect(facility.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm truncate">
                            {facility.name || `Facility ${index + 1}`}
                          </h5>
                          <p className="text-xs text-muted-foreground truncate">
                            {facility.city}, {facility.state}
                          </p>
                        </div>
                        {selectedFacilityId === facility.id && (
                          <ChevronRight className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )

      case "sections":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">Sections</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddSection}
                className="h-7 w-7 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {sections.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-xs mb-2">No sections yet</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onAddSection}
                  className="text-xs"
                >
                  Add Section
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {sections.map((section, index) => (
                  <Card
                    key={section.id || index}
                    className={cn(
                      "cursor-pointer transition-all hover:bg-gray-50",
                      currentSectionId === section.id && "ring-2 ring-primary bg-primary/5"
                    )}
                    onClick={() => onSectionSelect(section.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs mt-0.5">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm truncate mb-1">
                            {section.title || `Section ${index + 1}`}
                          </h5>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                            {section.description || "No description"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {section.questions?.length || 0} question{section.questions?.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        {currentSectionId === section.id && (
                          <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )

      case "documents":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">Documents</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                    onClick={() => {
                  onTabSelect("documents")
                }}
                className="h-7 w-7 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Documents for surveyors to review (off-site preparation)
            </p>
            {documents.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-xs mb-2">No documents</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {/* Handle add document */}}
                  className="text-xs"
                >
                  Upload Document
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc, index) => (
                  <Card 
                    key={doc.id || index} 
                    className="cursor-pointer transition-all hover:bg-gray-50"
                    onClick={() => {/* Handle document selection */}}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm truncate">{doc.name || `Document ${index + 1}`}</h5>
                          <p className="text-xs text-muted-foreground">{doc.type || "File"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )

      case "checklists":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">Checklists</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onTabSelect("checklists")}
                className="h-7 w-7 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Checklists for surveyors to complete
            </p>
            {checklists.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-xs mb-2">No checklists</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {/* Handle add checklist */}}
                  className="text-xs"
                >
                  Add Checklist
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {checklists.map((checklist, index) => (
                  <Card 
                    key={checklist.id || index} 
                    className="cursor-pointer transition-all hover:bg-gray-50"
                    onClick={() => {/* Handle checklist selection */}}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm truncate">{checklist.name || `Checklist ${index + 1}`}</h5>
                          <p className="text-xs text-muted-foreground">{checklist.items?.length || 0} items</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )

      case "images":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">Images</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {/* Handle add image */}}
                className="h-7 w-7 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {images.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-xs mb-2">No images</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {/* Handle add image */}}
                  className="text-xs"
                >
                  Upload Image
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {images.map((image, index) => (
                  <Card key={image.id || index} className="cursor-pointer transition-all hover:bg-gray-50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm truncate">{image.name || `Image ${index + 1}`}</h5>
                          <p className="text-xs text-muted-foreground">{image.size || "File"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-sm mb-3">Survey Setup</h3>
        
        {/* Navigation Tabs */}
        <div className="space-y-1">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = selectedTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderTabContent()}
      </div>
    </div>
  )
}

