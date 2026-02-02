import { useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { FORM_FIELD_TYPES } from "../../utils/surveyPhases"

export default function FormBuilder({ fields = [], onFieldsChange }) {
  const [activeId, setActiveId] = useState(null)
  const [draggedFieldType, setDraggedFieldType] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event) => {
    const { active } = event
    setActiveId(active.id)
    
    // Check if dragging from palette
    if (active.data.current?.type === "field-type") {
      setDraggedFieldType(active.data.current.fieldType)
    }
  }

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      setDraggedFieldType(null)
      return
    }

    // If dragging from palette, add new field
    if (active.data.current?.type === "field-type") {
      const fieldType = active.data.current.fieldType
      const newField = {
        id: `field-${Date.now()}`,
        type: fieldType.id,
        label: fieldType.name,
        config: { ...fieldType.defaultConfig },
        order: fields.length
      }
      onFieldsChange([...fields, newField])
    } 
    // If reordering existing fields
    else if (active.id !== over.id) {
      const oldIndex = fields.findIndex(f => f.id === active.id)
      const newIndex = fields.findIndex(f => f.id === over.id)
      onFieldsChange(arrayMove(fields, oldIndex, newIndex))
    }

    setActiveId(null)
    setDraggedFieldType(null)
  }

  const handleDragCancel = () => {
    setActiveId(null)
    setDraggedFieldType(null)
  }

  const handleFieldChange = (fieldId, updates) => {
    onFieldsChange(
      fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    )
  }

  const handleFieldDelete = (fieldId) => {
    onFieldsChange(fields.filter(f => f.id !== fieldId))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Task Fields</Label>
          <p className="text-xs text-muted-foreground">
            {fields.length} field{fields.length !== 1 ? 's' : ''}
          </p>
        </div>

        {fields.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-2">
              No fields added yet
            </p>
            <p className="text-xs text-muted-foreground">
              Drag fields from the palette or add manually
            </p>
          </div>
        ) : (
          <SortableContext
            items={fields.map(f => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {fields.map((field) => (
                <SortableField
                  key={field.id}
                  field={field}
                  onFieldChange={handleFieldChange}
                  onFieldDelete={handleFieldDelete}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>

      <DragOverlay>
        {draggedFieldType ? (
          <div className="p-3 border border-gray-200 rounded-lg bg-white">
            <div className="flex items-center gap-2">
              <span className="text-lg">{draggedFieldType.icon}</span>
              <p className="font-medium text-sm">{draggedFieldType.name}</p>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function SortableField({ field, onFieldChange, onFieldDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const fieldType = FORM_FIELD_TYPES.find(ft => ft.id === field.type)

  return (
    <div
      ref={setNodeRef}
      style={style}
        className={cn(
          "p-4 border border-gray-200 rounded-lg bg-white",
          isDragging && "opacity-50"
        )}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Field Content */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{fieldType?.icon || "📝"}</span>
            <Input
              value={field.label || ""}
              onChange={(e) => onFieldChange(field.id, { label: e.target.value })}
              placeholder="Field label..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onFieldDelete(field.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Field Type Display */}
          <div className="text-xs text-muted-foreground">
            Type: {fieldType?.name || field.type}
          </div>

          {/* Field-specific configuration */}
          {field.type === "checkbox" && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={field.config?.checked || false}
                onChange={(e) =>
                  onFieldChange(field.id, {
                    config: { ...field.config, checked: e.target.checked }
                  })
                }
                disabled
                className="h-4 w-4"
              />
              <Label className="text-sm">{field.config?.label || "Yes"}</Label>
            </div>
          )}

          {field.type === "radio" && field.config?.options && (
            <div className="space-y-2">
              {field.config.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`radio-${field.id}`}
                    disabled
                    className="h-4 w-4"
                  />
                  <Label className="text-sm">{option.label}</Label>
                </div>
              ))}
            </div>
          )}

          {/* Required toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`required-${field.id}`}
              checked={field.config?.required || false}
              onChange={(e) =>
                onFieldChange(field.id, {
                  config: { ...field.config, required: e.target.checked }
                })
              }
              className="h-4 w-4"
            />
            <Label htmlFor={`required-${field.id}`} className="text-sm">
              Required
            </Label>
          </div>
        </div>
      </div>
    </div>
  )
}

