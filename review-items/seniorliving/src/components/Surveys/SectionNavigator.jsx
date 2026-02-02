import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, ChevronRight, GripVertical, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function SectionNavigator({ 
  sections = [], 
  currentSectionId,
  onSectionSelect,
  onAddSection,
  onDeleteSection,
  onReorderSection
}) {
  const [expandedSectionId, setExpandedSectionId] = useState(currentSectionId || null)

  const handleSectionClick = (sectionId) => {
    setExpandedSectionId(sectionId === expandedSectionId ? null : sectionId)
    onSectionSelect(sectionId)
  }

  const handleQuestionClick = (sectionId, questionId) => {
    // Handle question selection if needed
    onSectionSelect(sectionId, questionId)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Sections</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddSection}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {sections.length} section(s)
        </p>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {sections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm mb-2">No sections yet</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddSection}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </div>
        ) : (
          sections.map((section, index) => {
            const isSelected = currentSectionId === section.id
            const isExpanded = expandedSectionId === section.id
            const questionsCount = section.questions?.length || 0

            return (
              <Card
                key={section.id || index}
                className={cn(
                  "cursor-pointer transition-all",
                  isSelected && "ring-2 ring-primary"
                )}
                onClick={() => handleSectionClick(section.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    {/* Section Number */}
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs mt-0.5">
                      {index + 1}
                    </div>

                    {/* Section Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {section.title || `Section ${index + 1}`}
                        </h4>
                        {isSelected && (
                          <ChevronRight className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {section.description || "No description"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {questionsCount} question{questionsCount !== 1 ? 's' : ''}
                        </span>
                        {isSelected && sections.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteSection(section.id)
                            }}
                            className="p-1 hover:bg-red-50 rounded text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      {/* Questions List (if expanded) */}
                      {isExpanded && questionsCount > 0 && (
                        <div className="mt-3 space-y-1 border-t border-gray-100 pt-2">
                          {section.questions.map((question, qIndex) => (
                            <button
                              key={question.id || qIndex}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleQuestionClick(section.id, question.id)
                              }}
                              className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-gray-50 flex items-center gap-2"
                            >
                              <span className="text-muted-foreground">{qIndex + 1}.</span>
                              <span className="truncate flex-1">
                                {question.text || "Untitled Question"}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

