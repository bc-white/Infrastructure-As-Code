import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, X } from "lucide-react"
import { useConfirm } from "../../hooks/useConfirm"

// Extracted Field Editor Component for reuse
export default function FieldEditor({ field, index, onUpdateField, onDeleteField }) {
  const { confirm, ConfirmDialog } = useConfirm()
  
  return (
    <div className="p-4 rounded-lg bg-gray-50/50 transition-colors border border-gray-200">
      <div className="flex-1 space-y-3">
        {/* Field Label */}
        <div className="space-y-2">
          <Label htmlFor={`field-label-${field.id}`} className="text-sm font-semibold">
            Field Label <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`field-label-${field.id}`}
            value={field.label || ""}
            onChange={(e) => onUpdateField({ label: e.target.value })}
            placeholder="e.g., Resident Name, Compliance Check..."
            className="h-10 text-sm"
          />
        </div>

        {/* Field Type and Required */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor={`field-type-${field.id}`} className="text-xs font-semibold">
              Field Type
            </Label>
            <select
              id={`field-type-${field.id}`}
              value={field.type || "text"}
              onChange={(e) => {
                const newType = e.target.value
                const updates = { type: newType }
                if ((newType === "select" || newType === "multiselect") && !field.config?.options) {
                  updates.config = { ...field.config, options: [] }
                }
                onUpdateField(updates)
              }}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-medium"
            >
              <option value="text">Text Input</option>
              <option value="textarea">Textarea</option>
              <option value="checkbox">Checkbox</option>
              <option value="radio">Radio Button</option>
              <option value="date">Date Picker</option>
              <option value="file">File Upload</option>
              <option value="number">Number</option>
              <option value="select">Dropdown (Single Select)</option>
              <option value="multiselect">Multi-Select</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Required</Label>
            <div className="flex items-center h-10 gap-3 border border-input rounded-md px-3">
              <input
                type="checkbox"
                id={`required-${field.id}`}
                checked={field.required || false}
                onChange={(e) => onUpdateField({ required: e.target.checked })}
                className="h-4 w-4 cursor-pointer"
              />
              <Label htmlFor={`required-${field.id}`} className="text-xs font-medium cursor-pointer flex-1">
                Required
              </Label>
            </div>
          </div>
        </div>

        {/* Field Description */}
        <div className="space-y-2">
          <Label htmlFor={`field-description-${field.id}`} className="text-xs font-semibold">
            Description <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
          </Label>
          <Textarea
            id={`field-description-${field.id}`}
            value={field.description || ""}
            onChange={(e) => onUpdateField({ description: e.target.value })}
            placeholder="Help text for surveyors..."
            rows={2}
            className="text-xs"
          />
        </div>

        {/* Options for Dropdown/Multi-Select */}
        {(field.type === "select" || field.type === "multiselect") && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold">
              Options <span className="text-destructive">*</span>
            </Label>
            <div className="space-y-2">
              {(field.config?.options || []).map((option, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                  <Input
                    value={typeof option === 'string' ? option : (option.label || option.value || "")}
                    onChange={(e) => {
                      const options = [...(field.config?.options || [])]
                      options[optIndex] = {
                        ...(typeof options[optIndex] === 'object' ? options[optIndex] : {}),
                        label: e.target.value,
                        value: e.target.value.toLowerCase().replace(/\s+/g, '_')
                      }
                      onUpdateField({
                        config: { ...field.config, options }
                      })
                    }}
                    placeholder="Option label..."
                    className="flex-1 h-9 text-xs"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const options = [...(field.config?.options || [])]
                      options.splice(optIndex, 1)
                      onUpdateField({
                        config: { ...field.config, options }
                      })
                    }}
                    className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const options = [...(field.config?.options || [])]
                  options.push({ label: "", value: "" })
                  onUpdateField({
                    config: { ...field.config, options }
                  })
                }}
                className="w-full h-8 text-xs"
              >
                <Plus className="h-3 w-3 mr-2" />
                Add Option
              </Button>
            </div>
          </div>
        )}

        {/* Delete Button */}
        <div className="flex justify-end pt-2 border-t border-gray-200">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={async () => {
              const confirmed = await confirm("Delete this field?", {
                title: "Delete Field",
                variant: "destructive",
                confirmText: "Delete"
              })
              if (confirmed) {
                onDeleteField()
              }
            }}
            className="text-muted-foreground hover:text-destructive h-8 text-xs"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>
      <ConfirmDialog />
    </div>
  )
}

