import { useDraggable } from "@dnd-kit/core"
import { FORM_FIELD_TYPES } from "../../utils/surveyPhases"
import { cn } from "@/lib/utils"

export default function FormFieldPalette() {
  return (
    <div className="p-4 border-r border-gray-200 bg-gray-50 h-full overflow-y-auto">
      <h3 className="font-semibold text-sm mb-4">Form Fields</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Drag and drop fields to add them to your task
      </p>
      
      <div className="space-y-2">
        {FORM_FIELD_TYPES.map((fieldType) => (
          <DraggableField key={fieldType.id} fieldType={fieldType} />
        ))}
      </div>
    </div>
  )
}

function DraggableField({ fieldType }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `field-type-${fieldType.id}`,
    data: {
      type: "field-type",
      fieldType: fieldType
    }
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
        className={cn(
          "p-3 border border-gray-200 rounded-lg bg-white cursor-grab active:cursor-grabbing transition-all",
          isDragging && "opacity-50"
        )}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{fieldType.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{fieldType.name}</p>
          <p className="text-xs text-muted-foreground">{fieldType.description}</p>
        </div>
      </div>
    </div>
  )
}

