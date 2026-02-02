import { useState, useEffect, useRef } from "react"
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, GripVertical, FileText, X, FolderPlus, ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useConfirm } from "../../hooks/useConfirm"
import FormBuilder from "./FormBuilder"
import ContentImporter from "./ContentImporter"
import QuestionImporter from "./QuestionImporter"
import FieldEditor from "./FieldEditor"
import { arrayMove } from "@dnd-kit/sortable"

export default function SimpleSessionBuilder({
  session,
  onSessionUpdate,
  onAddField,
  onUpdateField,
  onDeleteField,
  onFieldsReorder,
  onAddDocument, // Placeholder for document upload
  onQuestionsImported, // New: handle imported questions for this session
  onAddGroup, // Add new group
  onUpdateGroup, // Update group
  onDeleteGroup // Delete group
}) {
  const [activeId, setActiveId] = useState(null)
  const fieldsRef = useRef(null)
  const prevFieldsCount = useRef(session?.fields?.length || 0)
  const [expandedGroups, setExpandedGroups] = useState({}) // Track which groups are expanded
  const { confirm, ConfirmDialog } = useConfirm()
  
  // Initialize sensors at the top level - before any conditional returns
  const sensors = useSensors(
    useSensor(PointerSensor)
  )

  // Auto-scroll to top when new field is added
  useEffect(() => {
    const currentFieldsCount = session?.fields?.length || 0
    if (currentFieldsCount > prevFieldsCount.current && fieldsRef.current) {
      // New field was added, scroll to top smoothly
      setTimeout(() => {
        fieldsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    }
    prevFieldsCount.current = currentFieldsCount
  }, [session?.fields?.length])

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const fields = session.fields || []
    const oldIndex = fields.findIndex(f => f.id === active.id)
    const newIndex = fields.findIndex(f => f.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(fields, oldIndex, newIndex)
      onFieldsReorder(reordered)
    }
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  if (!session) {
    return (
      <div className="text-center py-16">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <FileText className="h-10 w-10 text-muted-foreground/60" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No session selected</h3>
          <p className="text-muted-foreground mb-4">
            Select a session from the left panel to start building
          </p>
          <p className="text-sm text-muted-foreground/80">
            Or click the + button to create a new session
          </p>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      sensors={sensors}
    >
      <div className="space-y-6">
        {/* Session Header */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session-name" className="text-base font-semibold">
              Session Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="session-name"
              value={session.name || ""}
              onChange={(e) => onSessionUpdate({ name: e.target.value })}
              placeholder="e.g., Document Review, Resident Interviews, etc."
              className="h-12 text-base font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-description" className="text-base font-semibold">
              Description <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="session-description"
              value={session.description || ""}
              onChange={(e) => onSessionUpdate({ description: e.target.value })}
              placeholder="Describe what this session involves..."
              rows={3}
              className="text-sm"
            />
          </div>
        </div>

        {/* Groups Management - Display at Top */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-base font-semibold text-foreground">Content Groups</Label>
            {onAddGroup && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const newGroup = {
                    id: `group-${Date.now()}`,
                    name: "New Group",
                    description: "",
                    fields: []
                  }
                  onAddGroup(newGroup)
                }}
                className="flex items-center gap-2"
              >
                <FolderPlus className="h-4 w-4" />
                Add Group
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            All fields must belong to a group. Create groups and add fields to organize your survey content.
          </p>

          {/* Display Groups */}
          {session.groups && session.groups.length > 0 && (
            <div className="space-y-3">
              {session.groups.map((group) => {
                const isExpanded = expandedGroups[group.id] !== false // Default to expanded
                const groupFieldsCount = group.fields?.length || 0
                return (
                  <div key={group.id} className="bg-white p-4 rounded-lg border border-gray-200">
                    {/* Group Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedGroups(prev => ({
                            ...prev,
                            [group.id]: !isExpanded
                          }))
                        }}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <Input
                        value={group.name || "New Group"}
                        onChange={(e) => onUpdateGroup && onUpdateGroup(group.id, { name: e.target.value })}
                        placeholder="Group name..."
                        className="flex-1 h-9 font-semibold"
                      />
                      <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded text-xs">
                        <span className="font-medium">{groupFieldsCount}</span>
                        <span className="text-muted-foreground">
                          {groupFieldsCount === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      {onDeleteGroup && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const confirmed = await confirm(`Delete "${group.name}" and all its items?`, {
                              title: "Delete Group",
                              variant: "destructive",
                              confirmText: "Delete"
                            })
                            if (confirmed) {
                              onDeleteGroup(group.id)
                            }
                          }}
                          className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Group Description */}
                    <div className="mb-3 ml-7">
                      <Textarea
                        value={group.description || ""}
                        onChange={(e) => onUpdateGroup && onUpdateGroup(group.id, { description: e.target.value })}
                        placeholder="Group description (optional)..."
                        rows={2}
                        className="text-sm"
                      />
                    </div>

                    {/* Group Fields */}
                    {isExpanded && (
                      <div className="ml-7 space-y-3 mt-4">
                        {groupFieldsCount === 0 ? (
                          <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed border-gray-200 rounded-lg">
                            <p className="mb-2">No items in this group yet</p>
                            <p className="text-xs">Add fields to this group using the tools below</p>
                          </div>
                        ) : (
                          group.fields.map((field, index) => {
                            // Use the existing field editor structure
                            return (
                              <FieldEditor
                                key={field.id}
                                field={field}
                                index={index}
                                onUpdateField={(updates) => onUpdateField && onUpdateField(field.id, updates, group.id)}
                                onDeleteField={() => onDeleteField && onDeleteField(field.id, group.id)}
                              />
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

          {/* Empty State - Show when no groups */}
          {(!session.groups || session.groups.length === 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                    <span className="text-white text-sm">!</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-yellow-900 mb-1">Create a group first</h4>
                  <p className="text-sm text-yellow-800 mb-3">
                    All fields must belong to a group. Please create at least one group above before adding fields.
                  </p>
                  {onAddGroup && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newGroup = {
                          id: `group-${Date.now()}`,
                          name: "New Group",
                          description: "",
                          fields: []
                        }
                        onAddGroup(newGroup)
                      }}
                      className="flex items-center gap-2"
                    >
                      <FolderPlus className="h-4 w-4" />
                      Create First Group
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

        {/* Add Content Section - At Bottom for Easy Access */}
        <div className="space-y-6 mt-8">
          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-muted-foreground font-medium">
                Add More Content
              </span>
            </div>
          </div>

          {/* Content Importer - Fields */}
          <div className="bg-white p-6 rounded-lg">
            <ContentImporter
              onContentImported={(fields, groupId) => {
                if (!groupId) {
                  toast.error("Please select a group to add fields to. All fields must belong to a group.")
                  return
                }
                // Add fields in reverse order so they appear at top in correct order
                const reversedFields = [...fields].reverse()
                reversedFields.forEach(field => onAddField(field, groupId))
              }}
              currentFields={session.fields || []}
              groups={session.groups || []}
              selectedGroupId={session.groups && session.groups.length > 0 ? session.groups[0].id : null}
              onGroupSelect={(groupId) => {
                // Optional: track selected group
              }}
            />
          </div>

          {/* Question Importer - Import Questions for this Session */}
          <div className="bg-white p-6 rounded-lg">
            <QuestionImporter
              sections={session ? [{
                id: session.id,
                title: session.name,
                questions: session.questions || []
              }] : []}
              onQuestionsImported={(questions) => {
                if (!session.groups || session.groups.length === 0) {
                  toast.error("Please create at least one group before importing questions. All fields must belong to a group.")
                  return
                }
                
                // Convert questions to fields for this session
                const fields = questions.map(q => ({
                  id: q.id || `field-${Date.now()}-${Math.random()}`,
                  type: q.type || "text",
                  label: q.text || q.label || "Question",
                  description: q.helpText || "",
                  required: q.required !== undefined ? q.required : false,
                  config: {
                    options: q.options || []
                  }
                }))

                // Prompt user to select a group
                const groupNames = session.groups.map(g => g.name || "Unnamed Group")
                const selectedGroupName = prompt(
                  `Which group should these ${fields.length} question(s) be added to?\n\nGroups: ${groupNames.join(", ")}\n\nEnter group name or number (1-${session.groups.length}):`,
                  session.groups[0]?.name || ""
                )
                
                if (!selectedGroupName) {
                  return // User cancelled
                }

                // Find the selected group
                let selectedGroup = session.groups.find(g => 
                  g.name.toLowerCase() === selectedGroupName.toLowerCase()
                )
                
                // If not found by name, try by index
                if (!selectedGroup) {
                  const index = parseInt(selectedGroupName) - 1
                  if (index >= 0 && index < session.groups.length) {
                    selectedGroup = session.groups[index]
                  }
                }

                if (!selectedGroup) {
                  toast.error("Group not found. Please try again.")
                  return
                }

                // Add fields to the selected group
                const reversedFields = [...fields].reverse()
                reversedFields.forEach(field => onAddField(field, selectedGroup.id))
                
                // Also call the questions imported handler if provided
                if (onQuestionsImported) {
                  onQuestionsImported(questions)
                }
              }}
            />
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="p-4 border border-gray-200 rounded-lg bg-white opacity-90">
            <p className="text-sm">Moving field...</p>
          </div>
        ) : null}
      </DragOverlay>
      <ConfirmDialog />
    </DndContext>
  )
}

