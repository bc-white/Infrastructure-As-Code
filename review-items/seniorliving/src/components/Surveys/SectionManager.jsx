import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react"

export default function SectionManager({ sections = [], onChange }) {
  const [localSections, setLocalSections] = useState(sections || [])
  const initializedRef = useRef(false)

  // Sync local state when sections prop changes
  useEffect(() => {
    if (sections && sections.length > 0) {
      setLocalSections(sections)
      initializedRef.current = true
    } else if (!initializedRef.current && (!sections || sections.length === 0)) {
      // Initialize with one section if empty (only once)
      const newSection = {
        id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: "",
        description: "",
        order: 1,
        questions: []
      }
      setLocalSections([newSection])
      onChange([newSection])
      initializedRef.current = true
    }
  }, [sections])

  const handleAddSection = () => {
    const newSection = {
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: "",
      description: "",
      order: localSections.length + 1,
      questions: []
    }
    const updated = [...localSections, newSection]
    setLocalSections(updated)
    onChange(updated)
  }

  const handleRemoveSection = (index) => {
    if (localSections.length > 1) {
      const updated = localSections.filter((_, i) => i !== index)
      // Reorder sections
      const reordered = updated.map((section, i) => ({
        ...section,
        order: i + 1
      }))
      setLocalSections(reordered)
      onChange(reordered)
    }
  }

  const handleSectionChange = (index, field, value) => {
    const updated = [...localSections]
    updated[index] = {
      ...updated[index],
      [field]: value
    }
    setLocalSections(updated)
    onChange(updated)
  }

  const handleMoveUp = (index) => {
    if (index === 0) return
    const updated = [...localSections]
    const temp = updated[index]
    updated[index] = updated[index - 1]
    updated[index - 1] = temp
    // Update order
    updated.forEach((section, i) => {
      section.order = i + 1
    })
    setLocalSections(updated)
    onChange(updated)
  }

  const handleMoveDown = (index) => {
    if (index === localSections.length - 1) return
    const updated = [...localSections]
    const temp = updated[index]
    updated[index] = updated[index + 1]
    updated[index + 1] = temp
    // Update order
    updated.forEach((section, i) => {
      section.order = i + 1
    })
    setLocalSections(updated)
    onChange(updated)
  }

  // Don't auto-initialize here - let useEffect handle it to avoid infinite loops

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Sections</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddSection}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Section
        </Button>
      </div>

      <div className="space-y-3">
        {localSections.map((section, index) => (
          <Card key={section.id || index} className="relative">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                {/* Drag Handle / Reorder Buttons */}
                <div className="flex flex-col gap-1 pt-8">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === localSections.length - 1}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                {/* Section Number */}
                <div className="flex-shrink-0 pt-8">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                </div>

                {/* Section Form */}
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`section-title-${index}`}>
                      Section Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`section-title-${index}`}
                      type="text"
                      placeholder="e.g., Resident Care Services"
                      value={section.title}
                      onChange={(e) => handleSectionChange(index, "title", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`section-description-${index}`}>Description</Label>
                    <textarea
                      id={`section-description-${index}`}
                      rows={2}
                      placeholder="Enter section description..."
                      value={section.description || ""}
                      onChange={(e) => handleSectionChange(index, "description", e.target.value)}
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Questions in this section: {section.questions?.length || 0}
                  </div>
                </div>

                {/* Remove Button */}
                {localSections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSection(index)}
                    className="p-2 hover:bg-red-50 rounded text-red-600 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

