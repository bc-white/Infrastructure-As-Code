import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { mockTeamMemberService } from "../../services/mockTeamMemberService"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Users, Check } from "lucide-react"

export default function TeamMemberSetup({ 
  teamMemberAssignments = [],
  onChange
}) {
  const { id: surveyId } = useParams()
  const [teamMembers, setTeamMembers] = useState(teamMemberAssignments || [])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState(null) // Track which member is being edited
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    teamRole: "", // "team_coordinator" or "team_member"
    memberPermissions: {
      canRead: true,
      canWrite: false,
      canEdit: false
    }
  })
  const [formErrors, setFormErrors] = useState({})

  // Load team members from mock service when survey ID is available
  useEffect(() => {
    if (surveyId) {
      loadTeamMembers()
    } else {
      // If no survey ID, use the assignments from props
      setTeamMembers(teamMemberAssignments || [])
    }
  }, [surveyId])

  // Sync with parent when teamMemberAssignments change (but don't reload if we just updated)
  useEffect(() => {
    if (!surveyId && teamMemberAssignments) {
      // Only update if the assignments are different (to avoid overwriting local changes)
      const currentIds = teamMembers.map(m => m.userId).sort().join(',')
      const propIds = teamMemberAssignments.map(m => m.userId).sort().join(',')
      if (currentIds !== propIds) {
        setTeamMembers(teamMemberAssignments || [])
      }
    }
  }, [teamMemberAssignments])

  const loadTeamMembers = async () => {
    try {
      setIsLoading(true)
      const members = await mockTeamMemberService.getTeamMembersBySurvey(surveyId)
      setTeamMembers(members)
      // Also update parent
      onChange(members)
    } catch (error) {
      console.error("Failed to load team members:", error)
      // Fallback to props
      setTeamMembers(teamMemberAssignments || [])
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.fullName.trim()) {
      errors.fullName = "Full name is required"
    }
    if (!formData.email.trim()) {
      errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address"
    }
    if (!formData.teamRole) {
      errors.teamRole = "Please select team coordinator or team member"
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddTeamMember = async () => {
    if (!validateForm()) {
      return
    }
    
    try {
      setIsLoading(true)
      
      const memberData = {
        userName: formData.fullName.trim(),
        userEmail: formData.email.trim(),
        teamRole: formData.teamRole, // "team_coordinator" or "team_member"
        memberPermissions: formData.teamRole === "team_member" ? formData.memberPermissions : null, // Only for team members
        assignedSessions: editingMemberId 
          ? teamMembers.find(m => m.userId === editingMemberId)?.assignedSessions || []
          : [],
        surveyId: surveyId || null
      }

      if (editingMemberId) {
        // Update existing member
        const updatedMember = await mockTeamMemberService.updateTeamMember(editingMemberId, memberData)
        const updated = teamMembers.map(member => 
          member.userId === editingMemberId ? updatedMember : member
        )
        setTeamMembers(updated)
        onChange(updated)
        setEditingMemberId(null)
      } else {
        // Create new member
        const newMember = await mockTeamMemberService.createTeamMember(memberData)
        const updated = [...teamMembers, newMember]
        setTeamMembers(updated)
        onChange(updated)
      }
      
      // Reset form
      setFormData({
        fullName: "",
        email: "",
        teamRole: "",
        memberPermissions: {
          canRead: true,
          canWrite: false,
          canEdit: false
        }
      })
      setFormErrors({})
      setShowAddForm(false)
    } catch (error) {
      console.error("Failed to save team member:", error)
      setFormErrors({ email: error.message || "Failed to save team member" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditMember = (memberId) => {
    const member = teamMembers.find(m => m.userId === memberId)
    if (!member) return

    setFormData({
      fullName: member.userName,
      email: member.userEmail,
      teamRole: member.teamRole,
      memberPermissions: member.memberPermissions || {
        canRead: true,
        canWrite: false,
        canEdit: false
      }
    })
    setFormErrors({})
    setEditingMemberId(memberId)
    setShowAddForm(true)
  }

  const handleCancelEdit = () => {
    setFormData({
      fullName: "",
      email: "",
      teamRole: "",
      memberPermissions: {
        canRead: true,
        canWrite: false,
        canEdit: false
      }
    })
    setFormErrors({})
    setEditingMemberId(null)
    setShowAddForm(false)
  }

  const handleRemoveTeamMember = async (userId) => {
    try {
      setIsLoading(true)
      
      // Delete from mock service if survey ID exists
      if (surveyId) {
        await mockTeamMemberService.deleteTeamMember(userId)
      }
      
      // Update local state immediately
      const updated = teamMembers.filter(m => m.userId !== userId)
      setTeamMembers(updated)
      onChange(updated)
    } catch (error) {
      console.error("Failed to remove team member:", error)
      // Still update local state even if service call fails
      const updated = teamMembers.filter(m => m.userId !== userId)
      setTeamMembers(updated)
      onChange(updated)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateTeamRole = async (userId, teamRole) => {
    try {
      setIsLoading(true)
      
      // Update in mock service if survey ID exists
      if (surveyId) {
        await mockTeamMemberService.updateTeamMember(userId, {
          teamRole,
          memberPermissions: teamRole === "team_member" 
            ? (teamMembers.find(m => m.userId === userId)?.memberPermissions || { canRead: true, canWrite: false, canEdit: false })
            : null
        })
      }
      
      // Update local state immediately
      const updated = teamMembers.map(member => {
        if (member.userId === userId) {
          return {
            ...member,
            teamRole,
            memberPermissions: teamRole === "team_member" 
              ? (member.memberPermissions || { canRead: true, canWrite: false, canEdit: false })
              : null
          }
        }
        return member
      })
      setTeamMembers(updated)
      onChange(updated)
    } catch (error) {
      console.error("Failed to update team role:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateMemberPermissions = async (userId, permissions) => {
    try {
      setIsLoading(true)
      
      // Update in mock service if survey ID exists
      if (surveyId) {
        await mockTeamMemberService.updateTeamMember(userId, {
          memberPermissions: permissions
        })
      }
      
      // Update local state immediately
      const updated = teamMembers.map(member => 
        member.userId === userId ? { ...member, memberPermissions: permissions } : member
      )
      setTeamMembers(updated)
      onChange(updated)
    } catch (error) {
      console.error("Failed to update permissions:", error)
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

  const handleMemberPermissionChange = (permission, value) => {
    setFormData(prev => ({
      ...prev,
      memberPermissions: {
        ...prev.memberPermissions,
        [permission]: value
      }
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Add Team Members</h3>
          <p className="text-sm text-muted-foreground">
            Add team members and configure their permissions for this survey
          </p>
        </div>
        {teamMembers.length > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        )}
      </div>

      {teamMembers.length === 0 && !showAddForm ? (
        <Card className="border-2 border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-base font-medium text-gray-900 mb-2">No team members added</p>
              <p className="text-sm text-muted-foreground mb-6">
                Add team members to configure their permissions and assign them to sessions
              </p>
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Team Member
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : showAddForm ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingMemberId ? "Edit Team Member" : "Add Team Member"}</CardTitle>
            <CardDescription>
              {editingMemberId 
                ? "Update the team member's information and permissions"
                : "Enter the team member's information and configure their permissions"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, fullName: e.target.value }))
                    if (formErrors.fullName) {
                      setFormErrors(prev => ({ ...prev, fullName: "" }))
                    }
                  }}
                  className={formErrors.fullName ? "border-destructive" : ""}
                />
                {formErrors.fullName && (
                  <p className="text-sm text-destructive">{formErrors.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, email: e.target.value }))
                    if (formErrors.email) {
                      setFormErrors(prev => ({ ...prev, email: "" }))
                    }
                  }}
                  className={formErrors.email ? "border-destructive" : ""}
                />
                {formErrors.email && (
                  <p className="text-sm text-destructive">{formErrors.email}</p>
                )}
              </div>

              {/* Team Role */}
              <div className="space-y-2">
                <Label>
                  Team Role <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setFormData(prev => ({ ...prev, teamRole: "team_coordinator" }))
                      if (formErrors.teamRole) {
                        setFormErrors(prev => ({ ...prev, teamRole: "" }))
                      }
                    }}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      formData.teamRole === "team_coordinator"
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-medium text-sm mb-1">Team Coordinator</div>
                    <div className="text-xs text-muted-foreground">
                      Full control: generate responses, reports, manage everything
                    </div>
                    {formData.teamRole === "team_coordinator" && (
                      <Check className="h-4 w-4 text-primary mt-2" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setFormData(prev => ({ ...prev, teamRole: "team_member" }))
                      if (formErrors.teamRole) {
                        setFormErrors(prev => ({ ...prev, teamRole: "" }))
                      }
                    }}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      formData.teamRole === "team_member"
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-medium text-sm mb-1">Team Member</div>
                    <div className="text-xs text-muted-foreground">
                      Access only assigned sessions/pages
                    </div>
                    {formData.teamRole === "team_member" && (
                      <Check className="h-4 w-4 text-primary mt-2" />
                    )}
                  </button>
                </div>
                {formErrors.teamRole && (
                  <p className="text-sm text-destructive">{formErrors.teamRole}</p>
                )}
              </div>

              {/* Member Permissions (only shown for Team Member) */}
              {formData.teamRole === "team_member" && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Member Permissions</Label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer p-3 rounded border hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.memberPermissions.canRead}
                        onChange={(e) => {
                          const newValue = e.target.checked
                          handleMemberPermissionChange("canRead", newValue)
                          // If unchecking read, uncheck write and edit too
                          if (!newValue) {
                            setFormData(prev => ({
                              ...prev,
                              memberPermissions: {
                                canRead: false,
                                canWrite: false,
                                canEdit: false
                              }
                            }))
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <div>
                        <span className="text-sm font-medium">Read</span>
                        <p className="text-xs text-muted-foreground">View assigned sessions</p>
                      </div>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-3 rounded border hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.memberPermissions.canWrite}
                        onChange={(e) => {
                          const newValue = e.target.checked
                          handleMemberPermissionChange("canWrite", newValue)
                          // If checking write, also check read
                          if (newValue) {
                            setFormData(prev => ({
                              ...prev,
                              memberPermissions: {
                                ...prev.memberPermissions,
                                canRead: true,
                                canWrite: true
                              }
                            }))
                          }
                          // If unchecking write, uncheck edit too
                          if (!newValue) {
                            handleMemberPermissionChange("canEdit", false)
                          }
                        }}
                        disabled={!formData.memberPermissions.canRead}
                        className="rounded border-gray-300 disabled:opacity-50"
                      />
                      <div>
                        <span className="text-sm font-medium">Write</span>
                        <p className="text-xs text-muted-foreground">Submit responses</p>
                      </div>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-3 rounded border hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.memberPermissions.canEdit}
                        onChange={(e) => {
                          const newValue = e.target.checked
                          handleMemberPermissionChange("canEdit", newValue)
                          // If checking edit, also check read and write
                          if (newValue) {
                            setFormData(prev => ({
                              ...prev,
                              memberPermissions: {
                                canRead: true,
                                canWrite: true,
                                canEdit: true
                              }
                            }))
                          }
                        }}
                        disabled={!formData.memberPermissions.canWrite}
                        className="rounded border-gray-300 disabled:opacity-50"
                      />
                      <div>
                        <span className="text-sm font-medium">Edit</span>
                        <p className="text-xs text-muted-foreground">Modify submitted responses</p>
                      </div>
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Permissions are hierarchical: Read → Write → Edit
                  </p>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex items-center gap-3 pt-4">
                <Button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleAddTeamMember()
                  }}
                  disabled={isLoading}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {isLoading 
                    ? (editingMemberId ? "Updating..." : "Adding...") 
                    : (editingMemberId ? "Update Team Member" : "Add Team Member")
                  }
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleCancelEdit()
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {teamMembers.map((member) => (
            <Card key={member.userId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                      {getInitials(member.userName)}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{member.userName}</CardTitle>
                      <CardDescription>{member.userEmail}</CardDescription>
                      <Badge 
                        variant={member.teamRole === "team_coordinator" ? "default" : "secondary"} 
                        className="mt-1"
                      >
                        {member.teamRole === "team_coordinator" ? "Team Coordinator" : "Team Member"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleEditMember(member.userId)
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleRemoveTeamMember(member.userId)
                      }}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Team Role Selection */}
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Team Role</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleUpdateTeamRole(member.userId, "team_coordinator")
                        }}
                        className={`p-3 border-2 rounded-lg text-left transition-all ${
                          member.teamRole === "team_coordinator"
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="font-medium text-sm mb-1">Team Coordinator</div>
                        <div className="text-xs text-muted-foreground">
                          Full control, generate responses & reports
                        </div>
                        {member.teamRole === "team_coordinator" && (
                          <Check className="h-4 w-4 text-primary mt-2" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleUpdateTeamRole(member.userId, "team_member")
                        }}
                        className={`p-3 border-2 rounded-lg text-left transition-all ${
                          member.teamRole === "team_member"
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="font-medium text-sm mb-1">Team Member</div>
                        <div className="text-xs text-muted-foreground">
                          Access assigned sessions only
                        </div>
                        {member.teamRole === "team_member" && (
                          <Check className="h-4 w-4 text-primary mt-2" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Member Permissions (only for Team Members) */}
                  {member.teamRole === "team_member" && (
                    <div>
                      <Label className="text-sm font-semibold mb-3 block">Member Permissions</Label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2 cursor-pointer p-3 rounded border hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={member.memberPermissions?.canRead || false}
                            onChange={(e) => {
                              const newValue = e.target.checked
                              const updated = {
                                canRead: newValue,
                                canWrite: newValue ? (member.memberPermissions?.canWrite || false) : false,
                                canEdit: newValue ? (member.memberPermissions?.canEdit || false) : false
                              }
                              handleUpdateMemberPermissions(member.userId, updated)
                            }}
                            className="rounded border-gray-300"
                          />
                          <div>
                            <span className="text-sm font-medium">Read</span>
                            <p className="text-xs text-muted-foreground">View assigned sessions</p>
                          </div>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer p-3 rounded border hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={member.memberPermissions?.canWrite || false}
                            onChange={(e) => {
                              const newValue = e.target.checked
                              const updated = {
                                canRead: true,
                                canWrite: newValue,
                                canEdit: newValue ? (member.memberPermissions?.canEdit || false) : false
                              }
                              handleUpdateMemberPermissions(member.userId, updated)
                            }}
                            disabled={!member.memberPermissions?.canRead}
                            className="rounded border-gray-300 disabled:opacity-50"
                          />
                          <div>
                            <span className="text-sm font-medium">Write</span>
                            <p className="text-xs text-muted-foreground">Submit responses</p>
                          </div>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer p-3 rounded border hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={member.memberPermissions?.canEdit || false}
                            onChange={(e) => {
                              const newValue = e.target.checked
                              const updated = {
                                canRead: true,
                                canWrite: true,
                                canEdit: newValue
                              }
                              handleUpdateMemberPermissions(member.userId, updated)
                            }}
                            disabled={!member.memberPermissions?.canWrite}
                            className="rounded border-gray-300 disabled:opacity-50"
                          />
                          <div>
                            <span className="text-sm font-medium">Edit</span>
                            <p className="text-xs text-muted-foreground">Modify submitted responses</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

