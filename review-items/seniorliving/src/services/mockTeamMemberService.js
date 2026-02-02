// Mock Team Member Service
// Simulates backend API calls using localStorage
// TODO: Replace with real API service when backend is ready

// Storage keys
const STORAGE_KEYS = {
  TEAM_MEMBERS: 'mock_team_members'
}

// Simulate API delay
const delay = (ms = 300) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Get team members from localStorage
const getTeamMembers = () => {
  const membersJson = localStorage.getItem(STORAGE_KEYS.TEAM_MEMBERS)
  return membersJson ? JSON.parse(membersJson) : []
}

// Save team members to localStorage
const saveTeamMembers = (members) => {
  localStorage.setItem(STORAGE_KEYS.TEAM_MEMBERS, JSON.stringify(members))
}

// Generate unique ID
const generateId = (prefix = 'team-member') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Initialize on module load
const initializeMockData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.TEAM_MEMBERS)) {
    // Initialize with empty array
    localStorage.setItem(STORAGE_KEYS.TEAM_MEMBERS, JSON.stringify([]))
  }
}

initializeMockData()

// Export service functions
export const mockTeamMemberService = {
  // Get all team members
  getAllTeamMembers: async () => {
    await delay(200)
    return getTeamMembers()
  },

  // Get team member by ID
  getTeamMemberById: async (id) => {
    await delay(200)
    const members = getTeamMembers()
    return members.find(m => m.userId === id) || null
  },

  // Get team members by survey ID
  getTeamMembersBySurvey: async (surveyId) => {
    await delay(200)
    const members = getTeamMembers()
    return members.filter(m => m.surveyId === surveyId)
  },

  // Create new team member
  createTeamMember: async (teamMemberData) => {
    await delay(300)
    
    const members = getTeamMembers()
    
    // Check if member with same email already exists for this survey (excluding the member being edited)
    if (teamMemberData.surveyId) {
      const existing = members.find(
        m => m.userEmail === teamMemberData.userEmail && 
             m.surveyId === teamMemberData.surveyId &&
             m.userId !== teamMemberData.userId // Exclude self if editing
      )
      if (existing) {
        throw new Error('Team member with this email already exists for this survey')
      }
    }

    const newMember = {
      userId: teamMemberData.userId || generateId(),
      userName: teamMemberData.userName,
      userEmail: teamMemberData.userEmail,
      teamRole: teamMemberData.teamRole,
      memberPermissions: teamMemberData.memberPermissions || null,
      assignedSessions: teamMemberData.assignedSessions || [],
      surveyId: teamMemberData.surveyId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    members.push(newMember)
    saveTeamMembers(members)

    return newMember
  },

  // Update team member
  updateTeamMember: async (userId, updates) => {
    await delay(300)
    
    const members = getTeamMembers()
    const memberIndex = members.findIndex(m => m.userId === userId)

    if (memberIndex === -1) {
      throw new Error('Team member not found')
    }

    const currentMember = members[memberIndex]
    
    // Check if email is being changed and if it conflicts with another member
    if (updates.userEmail && updates.userEmail !== currentMember.userEmail) {
      const existing = members.find(
        m => m.userEmail === updates.userEmail && 
             m.surveyId === currentMember.surveyId &&
             m.userId !== userId // Exclude self
      )
      if (existing) {
        throw new Error('Team member with this email already exists for this survey')
      }
    }

    const updatedMember = {
      ...currentMember,
      ...updates,
      userId, // Preserve ID
      updatedAt: new Date().toISOString()
    }

    members[memberIndex] = updatedMember
    saveTeamMembers(members)

    return updatedMember
  },

  // Delete team member
  deleteTeamMember: async (userId) => {
    await delay(300)
    
    const members = getTeamMembers()
    const memberIndex = members.findIndex(m => m.userId === userId)

    if (memberIndex === -1) {
      throw new Error('Team member not found')
    }

    members.splice(memberIndex, 1)
    saveTeamMembers(members)

    return { success: true }
  },

  // Bulk create team members (for survey assignment)
  bulkCreateTeamMembers: async (teamMembers, surveyId) => {
    await delay(400)
    
    const members = getTeamMembers()
    const newMembers = teamMembers.map(memberData => ({
      userId: memberData.userId || generateId(),
      userName: memberData.userName,
      userEmail: memberData.userEmail,
      teamRole: memberData.teamRole,
      memberPermissions: memberData.memberPermissions || null,
      assignedSessions: memberData.assignedSessions || [],
      surveyId: surveyId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))

    members.push(...newMembers)
    saveTeamMembers(members)

    return newMembers
  },

  // Update team member sessions
  updateTeamMemberSessions: async (userId, sessionIds) => {
    await delay(300)
    
    const members = getTeamMembers()
    const memberIndex = members.findIndex(m => m.userId === userId)

    if (memberIndex === -1) {
      throw new Error('Team member not found')
    }

    members[memberIndex] = {
      ...members[memberIndex],
      assignedSessions: sessionIds,
      updatedAt: new Date().toISOString()
    }

    saveTeamMembers(members)

    return members[memberIndex]
  }
}

export default mockTeamMemberService

