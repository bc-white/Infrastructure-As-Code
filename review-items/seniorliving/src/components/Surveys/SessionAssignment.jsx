import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { mockTeamMemberService } from "../../services/mockTeamMemberService"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

export default function SessionAssignment({ 
  teamMemberAssignments = [],
  sessions = [],
  onChange
}) {
  const { id: surveyId } = useParams()
  const [assignments, setAssignments] = useState(teamMemberAssignments || [])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (teamMemberAssignments && Array.isArray(teamMemberAssignments)) {
      setAssignments(teamMemberAssignments)
    } else {
      setAssignments([])
    }
  }, [teamMemberAssignments])

  const handleSessionToggle = async (userId, sessionId) => {
    const member = assignments.find(m => m.userId === userId)
    if (!member) {
      console.error("Member not found:", userId)
      return
    }

    if (!sessionId) {
      console.error("Session ID is missing")
      return
    }

    const currentSessions = member.assignedSessions || []
    const isAssigned = currentSessions.includes(sessionId)
    const newSessions = isAssigned
      ? currentSessions.filter(id => id !== sessionId)
      : [...currentSessions, sessionId]

    try {
      setIsLoading(true)
      // Update in mock service if survey ID exists
      if (surveyId) {
        try {
          await mockTeamMemberService.updateTeamMemberSessions(userId, newSessions)
        } catch (serviceError) {
          console.warn("Service update failed, continuing with local update:", serviceError)
          // Continue with local update even if service fails
        }
      }
      
      // Update local state immediately
      const updated = assignments.map(m => {
        if (m.userId === userId) {
          return { ...m, assignedSessions: newSessions }
        }
        return m
      })
      setAssignments(updated)
      onChange(updated)
    } catch (error) {
      console.error("Failed to update session assignment:", error)
      // Still update locally even if there's an error
      const updated = assignments.map(m => {
        if (m.userId === userId) {
          return { ...m, assignedSessions: newSessions }
        }
        return m
      })
      setAssignments(updated)
      onChange(updated)
    } finally {
      setIsLoading(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return "U"
    const words = name.trim().split(" ")
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase()
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
  }

  const getAssignedCount = (member) => {
    return member.assignedSessions?.length || 0
  }

  if (assignments.length === 0) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-base font-medium text-gray-900 mb-2">No team members to assign</p>
            <p className="text-sm text-muted-foreground">
              Go back to add team members first
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Filter out invalid sessions
  const validSessions = (sessions || []).filter(session => session && session.id)

  if (validSessions.length === 0) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-base font-medium text-gray-900 mb-2">No sessions available</p>
            <p className="text-sm text-muted-foreground">
              Add sessions to your survey first, then come back to assign them
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Assign Sessions to Team Members</h3>
        <p className="text-sm text-muted-foreground">
          Select which sessions each team member can access
        </p>
      </div>

      <div className="space-y-4">
        {assignments.map((member) => (
          <Card key={member.userId}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                  {getInitials(member.userName)}
                </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{member.userName}</CardTitle>
                    <CardDescription>{member.userEmail}</CardDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={member.teamRole === "team_coordinator" ? "default" : "secondary"}>
                        {member.teamRole === "team_coordinator" ? "Team Coordinator" : "Team Member"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {getAssignedCount(member)} of {validSessions.length} sessions assigned
                      </span>
                    </div>
                    {member.teamRole === "team_member" && member.memberPermissions && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          Permissions: 
                          {member.memberPermissions.canRead && " Read"}
                          {member.memberPermissions.canWrite && " Write"}
                          {member.memberPermissions.canEdit && " Edit"}
                        </span>
                      </div>
                    )}
                  </div>
              </div>
            </CardHeader>
            <CardContent>
              {member.teamRole === "team_coordinator" ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Team Coordinators</strong> have automatic access to all sessions. They can generate responses, reports, and manage everything.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-lg p-3">
                  {validSessions.map((session) => {
                    const isAssigned = member.assignedSessions?.includes(session.id)
                    return (
                      <label
                        key={session.id}
                        className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleSessionToggle(member.userId, session.id)
                          }}
                          disabled={isLoading}
                          className="rounded border-gray-300 h-4 w-4 disabled:opacity-50"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium">
                            {session.name || session.title || `Session ${session.order || 'Unknown'}`}
                          </span>
                          {session.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {session.description}
                            </p>
                          )}
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

