import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Zustand store for Risk-Based Survey Team Collaboration
 * Persists survey data, residents, clinical areas, and team member information
 * Automatically clears data if survey ID doesn't match
 * This ensures data integrity across page refreshes and team member sessions
 */

const useRiskBasedSurveyStore = create(
  persist(
    (set, get) => ({
      // State
      surveyId: null,
      surveyMode: null, // 'residentBased' or 'nonResidentBased'
      surveyData: null, // Clinical areas data
      residents: [], // Array of resident objects
      teamMembers: [], // Array of team member objects
      teamCoordinator: null,
      isTeamCoordinator: false,
      assignedAreas: [], // Areas assigned to current user
      annualEducation: null,
      closureData: null,
      fetchedAt: null,
      lastUpdatedBy: null,
      lastUpdatedAt: null,
      error: null,

      // Actions

      /**
       * Initialize or validate survey ID
       * Clears all data if survey ID doesn't match
       * @param {string} newSurveyId - Survey ID to validate
       * @returns {boolean} - True if survey ID is valid/set, false if cleared
       */
      validateSurveyId: (newSurveyId) => {
        const state = get();
        const storedSurveyId = state.surveyId;

      

        // If no stored survey ID, set the new one
        if (!storedSurveyId) {
          set({ surveyId: String(newSurveyId) });
        
          return true;
        }

        // If survey IDs match, continue
        if (String(storedSurveyId) === String(newSurveyId)) {
         
          return true;
        }

        // If survey IDs don't match, clear everything
     
        get().clearAllData();
        set({ surveyId: String(newSurveyId) });
        return false;
      },

      /**
       * Set complete survey data
       * Validates survey ID before saving
       * @param {string} surveyId - Survey ID
       * @param {Object} data - Complete survey data object
       */
      setSurveyData: (surveyId, data) => {
        // Validate survey ID first
        const isValid = get().validateSurveyId(surveyId);

        if (!isValid) {
         // console.warn('🔷 Survey ID mismatch in setSurveyData - data not saved'); --- IGNORE ---
        }

        set({
          surveyData: data,
          lastUpdatedAt: new Date().toISOString(),
          error: null,
        });

        
      },

      /**
       * Set survey mode
       * @param {string} mode - 'residentBased' or 'nonResidentBased'
       */
      setSurveyMode: (mode) => {
        set({ surveyMode: mode });
      },

      /**
       * Set residents array
       * @param {Array} residents - Array of resident objects
       */
      setResidents: (residents) => {
        set({
          residents: residents || [],
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      /**
       * Add a single resident
       * @param {Object} resident - Resident object
       */
      addResident: (resident) => {
        const state = get();
        set({
          residents: [...state.residents, resident],
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      /**
       * Update a single resident
       * @param {string} residentId - Resident ID
       * @param {Object} updatedData - Updated resident data
       */
      updateResident: (residentId, updatedData) => {
        const state = get();
        set({
          residents: state.residents.map((r) =>
            r.id === residentId ? { ...r, ...updatedData } : r
          ),
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      /**
       * Remove a resident
       * @param {string} residentId - Resident ID to remove
       */
      removeResident: (residentId) => {
        const state = get();
        set({
          residents: state.residents.filter((r) => r.id !== residentId),
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      /**
       * Set team members
       * @param {Array} members - Array of team member objects
       */
      setTeamMembers: (members) => {
        set({
          teamMembers: members || [],
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      /**
       * Set team coordinator
       * @param {Object} coordinator - Team coordinator object
       */
      setTeamCoordinator: (coordinator) => {
        set({ teamCoordinator: coordinator });
      },

      /**
       * Set whether current user is team coordinator
       * @param {boolean} isCoordinator
       */
      setIsTeamCoordinator: (isCoordinator) => {
        set({ isTeamCoordinator: isCoordinator });
      },

      /**
       * Set assigned areas for current user
       * @param {Array} areas - Array of assigned area IDs
       */
      setAssignedAreas: (areas) => {
        set({ assignedAreas: areas || [] });
      },

      /**
       * Set annual education data
       * @param {Object} data - Annual education object
       */
      setAnnualEducation: (data) => {
        set({
          annualEducation: data,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      /**
       * Set closure data
       * @param {Object} data - Closure data object
       */
      setClosureData: (data) => {
        set({
          closureData: data,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      /**
       * Update a specific clinical area's data
       * @param {string} areaId - Clinical area ID
       * @param {Object} areaData - Clinical area data
       */
      updateClinicalArea: (areaId, areaData) => {
        const state = get();
        set({
          surveyData: {
            ...state.surveyData,
            [areaId]: areaData,
          },
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      /**
       * Set who last updated the data
       * @param {string} userId - User ID who made the update
       */
      setLastUpdatedBy: (userId) => {
        set({
          lastUpdatedBy: userId,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      /**
       * Get survey data for current survey
       * Returns null if survey ID doesn't match
       * @param {string} surveyId - Survey ID to validate
       * @returns {Object|null}
       */
      getSurveyData: (surveyId) => {
        const state = get();

        // Validate survey ID
        if (String(state.surveyId) !== String(surveyId)) {
         
          return null;
        }

        return state.surveyData;
      },

      /**
       * Check if data exists for survey
       * @param {string} surveyId - Survey ID to check
       * @returns {boolean}
       */
      hasDataForSurvey: (surveyId) => {
        const state = get();
        const surveyIdMatch = String(state.surveyId) === String(surveyId);
        const hasData = !!state.surveyData || state.residents.length > 0;


        return surveyIdMatch && hasData;
      },

      /**
       * Get metadata about stored data
       * @returns {Object}
       */
      getMetadata: () => {
        const state = get();
        return {
          surveyId: state.surveyId,
          surveyMode: state.surveyMode,
          hasData: !!state.surveyData,
          residentsCount: state.residents.length,
          teamMembersCount: state.teamMembers.length,
          isTeamCoordinator: state.isTeamCoordinator,
          assignedAreasCount: state.assignedAreas.length,
          lastUpdatedBy: state.lastUpdatedBy,
          lastUpdatedAt: state.lastUpdatedAt,
          fetchedAt: state.fetchedAt,
        };
      },

      /**
       * Set error state
       * @param {string|null} error
       */
      setError: (error) => {
        set({ error });
      },

      /**
       * Clear all data
       */
      clearAllData: () => {
        set({
          surveyId: null,
          surveyMode: null,
          surveyData: null,
          residents: [],
          teamMembers: [],
          teamCoordinator: null,
          isTeamCoordinator: false,
          assignedAreas: [],
          annualEducation: null,
          closureData: null,
          fetchedAt: null,
          lastUpdatedBy: null,
          lastUpdatedAt: null,
          error: null,
        });
       
      },

      /**
       * Clear data for specific survey
       * @param {string} surveyId
       */
      clearDataForSurvey: (surveyId) => {
        const state = get();
        if (String(state.surveyId) === String(surveyId)) {
          get().clearAllData();
          
        }
      },
    }),
    {
      name: 'risk-based-survey-store', // localStorage key
      // Only persist necessary data, not error states
      partialize: (state) => ({
        surveyId: state.surveyId,
        surveyMode: state.surveyMode,
        surveyData: state.surveyData,
        residents: state.residents,
        teamMembers: state.teamMembers,
        teamCoordinator: state.teamCoordinator,
        isTeamCoordinator: state.isTeamCoordinator,
        assignedAreas: state.assignedAreas,
        annualEducation: state.annualEducation,
        closureData: state.closureData,
        fetchedAt: state.fetchedAt,
        lastUpdatedBy: state.lastUpdatedBy,
        lastUpdatedAt: state.lastUpdatedAt,
      }),
    }
  )
);

export default useRiskBasedSurveyStore;
