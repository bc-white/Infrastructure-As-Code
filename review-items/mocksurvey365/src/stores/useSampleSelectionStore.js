import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Zustand store for Sample Selection data
 * Persists team members and resident assignments
 * This store ensures data persists across page refreshes and syncs with socket updates
 */

const useSampleSelectionStore = create(
  persist(
    (set, get) => ({
      // State
      teamMembers: [],
      residentDetails: [],
      surveyId: null,

      // Actions
      /**
       * Set the team members array
       * @param {Array} teamMembers - Array of team member objects
       */
      setTeamMembers: (teamMembers) => {
        set({ teamMembers });
      },

      /**
       * Update a specific team member
       * @param {string} teamMemberId - ID of the team member to update
       * @param {Object} updates - Updates to apply to the team member
       */
      updateTeamMember: (teamMemberId, updates) => {
        const state = get();
        const updatedTeamMembers = state.teamMembers.map((member) => {
          if (
            String(member.id) === String(teamMemberId) ||
            String(member._id) === String(teamMemberId) ||
            member.email === updates.email
          ) {
            return {
              ...member,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
          }
          return member;
        });

        // If member doesn't exist, add them
        const memberExists = updatedTeamMembers.some(
          (m) =>
            String(m.id) === String(teamMemberId) ||
            String(m._id) === String(teamMemberId) ||
            m.email === updates.email
        );

        if (!memberExists) {
          updatedTeamMembers.push({
            id: teamMemberId,
            name: updates.name || "",
            email: updates.email || "",
            role: updates.role || "",
            assignedFacilityTasks: updates.assignedFacilityTasks || [],
            assignedResidents: updates.assignedResidents || [],
            updatedAt: new Date().toISOString(),
          });
        }

        set({ teamMembers: updatedTeamMembers });
      },

      /**
       * Set resident details
       * @param {Array} residentDetails - Array of resident detail objects
       */
      setResidentDetails: (residentDetails) => {
        set({ residentDetails });
      },

      /**
       * Set survey ID
       * @param {string} surveyId - Survey ID
       */
      setSurveyId: (surveyId) => {
        set({ surveyId });
      },

      /**
       * Get assigned residents for current user
       * @param {string} userId - Current user ID
       * @param {string} userEmail - Current user email
       * @returns {Array} Array of assigned resident IDs
       */
      getCurrentUserAssignedResidents: (userId, userEmail) => {
        const state = get();
        if (!userId && !userEmail) {
          return [];
        }

        const teamMember = state.teamMembers.find(
          (member) =>
            (userId && (String(member.id) === String(userId) || String(member._id) === String(userId))) ||
            (userEmail && member.email === userEmail)
        );

        return teamMember?.assignedResidents || [];
      },

      /**
       * Clear all data from the store
       */
      clearStore: () => {
        set({
          teamMembers: [],
          residentDetails: [],
          surveyId: null,
        });
      },
    }),
    {
      name: 'sample-selection-storage', // unique name for localStorage
    }
  )
);

export default useSampleSelectionStore;

// Export getState for direct access to store state (useful for avoiding stale closures)
export const getSampleSelectionStoreState = () => useSampleSelectionStore.getState();

