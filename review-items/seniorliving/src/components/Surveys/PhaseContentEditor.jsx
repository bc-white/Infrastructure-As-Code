import { useState } from "react"
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor } from "@dnd-kit/core"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Plus, Folder, FileText, Trash2 } from "lucide-react"
import FormFieldPalette from "./FormFieldPalette"
import FormBuilder from "./FormBuilder"

export default function PhaseContentEditor({
  phase,
  onPhaseUpdate,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddDocument
}) {
  const [activeTab, setActiveTab] = useState("tasks")
  const [selectedTaskId, setSelectedTaskId] = useState(null)

  if (!phase) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="mb-2">Select a session from the left panel</p>
        <p className="text-sm">Or add a new session using the + button</p>
      </div>
    )
  }

  const selectedTask = phase.tasks?.find(t => t.id === selectedTaskId)

  const handlePhaseFieldChange = (field, value) => {
    onPhaseUpdate(phase.id, { [field]: value })
  }

  const handleAddTask = () => {
    const newTask = {
      id: `task-${Date.now()}`,
      title: "New Task",
      description: "",
      fields: [],
      required: false,
      order: (phase.tasks?.length || 0) + 1
    }
    onAddTask(phase.id, newTask)
    setSelectedTaskId(newTask.id)
  }

  const handleTaskFieldsChange = (taskId, fields) => {
    onUpdateTask(phase.id, taskId, { fields })
  }

  return (
    <div className="space-y-6">
      {/* Phase Header */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phase-name">
            Session Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phase-name"
            value={phase.name || ""}
            onChange={(e) => handlePhaseFieldChange("name", e.target.value)}
            placeholder="e.g., Document Review, Resident Interviews, etc."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phase-description">Description</Label>
          <Textarea
            id="phase-description"
            value={phase.description || ""}
            onChange={(e) => handlePhaseFieldChange("description", e.target.value)}
            placeholder="Describe what this session involves..."
            rows={3}
          />
        </div>
      </div>

      {/* Tabs for Tasks, Documents, etc. */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks">
            <FileText className="h-4 w-4 mr-2" />
            Tasks ({phase.tasks?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="documents">
            <Folder className="h-4 w-4 mr-2" />
            Documents ({phase.documents?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Tasks</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddTask}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>

          {!phase.tasks || phase.tasks.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">
                No tasks added yet
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTask}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Task
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* Tasks List */}
              <div className="space-y-2">
                {phase.tasks.map((task, index) => (
                  <div
                    key={task.id}
                    className={cn(
                      "p-3 border rounded-lg cursor-pointer transition-all",
                      selectedTaskId === task.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {index + 1}. {task.title || "Untitled Task"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {task.fields?.length || 0} field{task.fields?.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteTask(phase.id, task.id)
                          if (selectedTaskId === task.id) {
                            setSelectedTaskId(null)
                          }
                        }}
                        className="text-destructive hover:text-destructive h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Task Editor */}
              <div className="space-y-4">
                {selectedTask ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="task-title">
                        Task Title <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="task-title"
                        value={selectedTask.title || ""}
                        onChange={(e) =>
                          onUpdateTask(phase.id, selectedTask.id, {
                            title: e.target.value
                          })
                        }
                        placeholder="e.g., Review previous survey report"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="task-description">Description</Label>
                      <Textarea
                        id="task-description"
                        value={selectedTask.description || ""}
                        onChange={(e) =>
                          onUpdateTask(phase.id, selectedTask.id, {
                            description: e.target.value
                          })
                        }
                        placeholder="Describe what this task involves..."
                        rows={2}
                      />
                    </div>

                    {/* Form Builder */}
                    <div className="border-t pt-4">
                      <FormBuilder
                        fields={selectedTask.fields || []}
                        onFieldsChange={(fields) =>
                          handleTaskFieldsChange(selectedTask.id, fields)
                        }
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Select a task to edit</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Documents</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.multiple = true
                input.onchange = (e) => {
                  const files = Array.from(e.target.files || [])
                  files.forEach(file => {
                    onAddDocument(phase.id, {
                      id: `doc-${Date.now()}-${Math.random()}`,
                      name: file.name,
                      type: file.type,
                      size: file.size,
                      file: file
                    })
                  })
                }
                input.click()
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Documents
            </Button>
          </div>

          {!phase.documents || phase.documents.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                No documents uploaded
              </p>
              <p className="text-xs text-muted-foreground">
                Upload documents that surveyors need to review for this phase
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {phase.documents.map((doc, index) => (
                <div
                  key={doc.id || index}
                  className="p-3 border border-gray-200 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Folder className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.size ? `${(doc.size / 1024).toFixed(2)} KB` : "File"}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const updatedDocs = phase.documents.filter((_, i) => i !== index)
                      onPhaseUpdate(phase.id, { documents: updatedDocs })
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

