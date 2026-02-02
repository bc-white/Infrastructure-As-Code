import { useState, useEffect } from "react"
import { useAuth } from "../../context/AuthContext"
import { mockAuthService } from "../../services/mockAuthService"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { User, Plus, X, Check, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function TeamMemberAssignment({ 
  survey, 
  onChange,
  sections = [] 
}) {
  const { user } = useAuth()
  const [teamMembers, setTeamMembers] = useState([])
  const [availableUsers, setAvailableUsers] = useState([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Load available team members from facility
  useEffect(() => {
    if (user?.facilityId) {
      loadTeamMembers()
    }
  }, [user?.facilityId])

  // Initialize team member assignments from survey
  useEffect(() => {
    if (survey?.teamMemberAssignments && survey.teamMemberAssignments.length > 0) {
      setTeamMembers(survey.teamMemberAssignments)
    }
  }, [survey?.id])

  const loadTeamMembers = async () => {
    try {
      setIsLoadingUsers(true)
      const facilityUsers = mockAuthService.getUsersByFacility(user.facilityId)
      // Remove password and filter out current user
      const users = facilityUsers
        .filter(u => u.id !== user.id)
        .map(({ password: _, ...user }) => user)
      setAvailableUsers(users)
    } catch (error) {
      console.error("Failed to load team members:", error)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleAddTeamMember = (userId) => {
    const userToAdd = availableUsers.find(u => u.id === userId)
    if (!userToAdd) return

    const role = mockAuthService.getRoleById(userToAdd.role)
    
    const newMember = {
      userId: userToAdd.id,
      userName: userToAdd.name,
      userEmail: userToAdd.email,
      userRole: userToAdd.role,
      userRoleName: role?.name || "No Role",
      rules: {
        canEdit: false,
        canView: true,
        canSubmit: false,
        canApprove: false
      },
      assignedSessions: [] // Array of section/session IDs
    }

    const updatedMembers = [...teamMembers, newMember]
    setTeamMembers(updatedMembers)
    updateSurveyAssignments(updatedMembers)
    setShowAddDialog(false)
  }

  const handleRemoveTeamMember = (userId) => {
    const updatedMembers = teamMembers.filter(m => m.userId !== userId)
    setTeamMembers(updatedMembers)
    updateSurveyAssignments(updatedMembers)
  }

  const handleUpdateRules = (userId, rules) => {
    const updatedMembers = teamMembers.map(member => 
      member.userId === userId 
        ? { ...member, rules }
        : member
    )
    setTeamMembers(updatedMembers)
    updateSurveyAssignments(updatedMembers)
  }

  const handleUpdateSessionAssignments = (userId, sessionIds) => {
    const updatedMembers = teamMembers.map(member => 
      member.userId === userId 
        ? { ...member, assignedSessions: sessionIds }
        : member
    )
    setTeamMembers(updatedMembers)
    updateSurveyAssignments(updatedMembers)
  }

  const updateSurveyAssignments = (members) => {
    onChange({ teamMemberAssignments: members })
  }

  const getInitials = (name) => {
    if (!name) return "U"
    const words = name.trim().split(" ")
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase()
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
  }

  const getAssignedSessionsCount = (member) => {
    return member.assignedSessions?.length || 0
  }

  const getAvailableUsersForAdd = () => {
    const assignedUserIds = teamMembers.map(m => m.userId)
    return availableUsers.filter(u => !assignedUserIds.includes(u.id))
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Add Team Members */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Step 1: Add Team Members</h3>
            <p className="text-sm text-muted-foreground">
              Add team members from your facility to participate in this survey
            </p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>
                  Select a team member from your facility to add to this survey
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {isLoadingUsers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading team members...</p>
                  </div>
                ) : getAvailableUsersForAdd().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No available team members to add</p>
                  </div>
                ) : (
                  getAvailableUsersForAdd().map((user) => {
                    const role = mockAuthService.getRoleById(user.role)
                    return (
                      <button
                        key={user.id}
                        onClick={() => handleAddTeamMember(user.id)}
                        className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                            {getInitials(user.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            {role && (
                              <Badge variant="secondary" className="mt-1">
                                {role.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {teamMembers.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-sm font-medium text-gray-900 mb-2">No team members added yet</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Click "Add Team Member" above to get started. You'll configure their permissions and assign sessions in the next steps.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Team Member
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {teamMembers.map((member) => (
              <div key={member.userId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                    {getInitials(member.userName)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{member.userName}</p>
                    <p className="text-xs text-muted-foreground">{member.userEmail}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveTeamMember(member.userId)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Configure Rules & Permissions */}
      {teamMembers.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Step 2: Configure Rules & Permissions</h3>
            <p className="text-sm text-muted-foreground">
              Set permissions for each team member. Configure what they can do in this survey.
            </p>
          </div>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <Card key={member.userId}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                      {getInitials(member.userName)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{member.userName}</CardTitle>
                      <CardDescription>{member.userEmail}</CardDescription>
                      <Badge variant="secondary" className="mt-1">
                        {member.userRoleName}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold">Permissions</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Configure what this team member can do in the survey
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={member.rules.canView}
                          onChange={(e) => handleUpdateRules(member.userId, {
                            ...member.rules,
                            canView: e.target.checked
                          })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">Can View</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={member.rules.canEdit}
                          onChange={(e) => handleUpdateRules(member.userId, {
                            ...member.rules,
                            canEdit: e.target.checked
                          })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">Can Edit</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={member.rules.canSubmit}
                          onChange={(e) => handleUpdateRules(member.userId, {
                            ...member.rules,
                            canSubmit: e.target.checked
                          })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">Can Submit</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={member.rules.canApprove}
                          onChange={(e) => handleUpdateRules(member.userId, {
                            ...member.rules,
                            canApprove: e.target.checked
                          })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">Can Approve</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Assign Sessions */}
      {teamMembers.length > 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Step 3: Assign Sessions</h3>
            <p className="text-sm text-muted-foreground">
              Assign specific sessions to team members. They will only have access to the sessions you assign.
            </p>
          </div>
          
          {sections.length === 0 ? (
            <Card className="border-2 border-dashed">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <p className="text-sm font-medium text-gray-900 mb-2">No sessions available yet</p>
                  <p className="text-xs text-muted-foreground">
                    Add sections to your survey first, then come back to assign them to team members.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <Card key={member.userId}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                        {getInitials(member.userName)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{member.userName}</CardTitle>
                        <CardDescription>Assign sessions for this team member</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-semibold">Assigned Sessions</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Select which sessions this team member can access
                        </p>
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-3">
                        {sections.map((section) => {
                          const isAssigned = member.assignedSessions?.includes(section.id)
                          return (
                            <label
                              key={section.id}
                              className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={isAssigned}
                                onChange={(e) => {
                                  const currentSessions = member.assignedSessions || []
                                  const newSessions = e.target.checked
                                    ? [...currentSessions, section.id]
                                    : currentSessions.filter(id => id !== section.id)
                                  handleUpdateSessionAssignments(member.userId, newSessions)
                                }}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm flex-1">
                                {section.title || `Section ${section.order}`}
                              </span>
                              {section.description && (
                                <span className="text-xs text-muted-foreground">
                                  {section.description}
                                </span>
                              )}
                            </label>
                          )
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getAssignedSessionsCount(member)} of {sections.length} sessions assigned
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

