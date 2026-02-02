import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, ChevronRight, Trash2, FileText, Folder } from "lucide-react"
import { cn } from "@/lib/utils"
import { useConfirm } from "../../hooks/useConfirm"
// Removed hardcoded phases - sessions are now completely dynamic

export default function PhaseNavigator({
  phases = [],
  selectedPhaseId,
  onPhaseSelect,
  onAddPhase,
  onDeletePhase,
  onPhaseUpdate
}) {
  const [expandedPhaseId, setExpandedPhaseId] = useState(selectedPhaseId)
  const { confirm, ConfirmDialog } = useConfirm()

  const handlePhaseClick = (phaseId) => {
    setExpandedPhaseId(phaseId === expandedPhaseId ? null : phaseId)
    onPhaseSelect(phaseId)
  }

  // Use only user-created phases (sessions)
  const allPhases = [...phases].sort((a, b) => (a.order || 0) - (b.order || 0))

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-gray-200 bg-gray-50/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-base">Survey Sessions</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddPhase}
            className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground transition-colors"
            title="Add new session"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground font-medium">
          {allPhases.length} session{allPhases.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Phases List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {allPhases.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm mb-2">No sessions yet</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddPhase}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Session
              </Button>
          </div>
        ) : (
          allPhases.map((phase, index) => {
            const isSelected = selectedPhaseId === phase.id
            const isExpanded = expandedPhaseId === phase.id
            // Count fields within groups
            const fieldsCount = phase.groups?.reduce((total, group) => total + (group.fields?.length || 0), 0) || 0
            const documentsCount = phase.documents?.length || 0

            return (
              <Card
                key={phase.id}
                className={cn(
                  "cursor-pointer transition-all hover:border-gray-300",
                  isSelected && "ring-2 ring-primary border-primary"
                )}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {/* Phase Header */}
                    <div
                      className="flex items-start gap-2"
                      onClick={() => handlePhaseClick(phase.id)}
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs mt-0.5">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {phase.name || `Session ${index + 1}`}
                          </h4>
                          {isSelected && (
                            <ChevronRight className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {phase.description || "No description"}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{fieldsCount} field{fieldsCount !== 1 ? 's' : ''}</span>
                          {documentsCount > 0 && <span>{documentsCount} doc{documentsCount !== 1 ? 's' : ''}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Phase Actions (when selected) */}
                    {isSelected && (
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={async (e) => {
                            e.stopPropagation()
                            const confirmed = await confirm("Are you sure you want to delete this session?", {
                              title: "Delete Session",
                              variant: "destructive",
                              confirmText: "Delete"
                            })
                            if (confirmed) {
                              onDeletePhase(phase.id)
                            }
                          }}
                          className="text-destructive hover:text-destructive h-7 text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
      <ConfirmDialog />
    </div>
  )
}

