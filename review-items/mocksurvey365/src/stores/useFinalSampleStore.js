import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Zustand store for Final Sample Selection data
 * Persists final sample residents, summary, and closed records
 * This store ensures data persists across page refreshes and syncs with API updates
 * Automatically clears data if survey ID doesn't match
 */

const useFinalSampleStore = create(
  persist(
    (set, get) => ({
      // State
      surveyId: null,
      finalSample: [], // Array of { resident: {...}, reason: "..." }
      summary: null, // Summary statistics object
      closedRecords: [], // Array of closed record objects
      isLoading: false,
      error: null,
      fetchedAt: null,
      lastUpdatedAt: null,

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


        get().clearAllData();
        set({ surveyId: String(newSurveyId) });
        return false;
      },

      /**
       * Set complete final sample data
       * Validates survey ID before saving
       * @param {string} surveyId - Survey ID
       * @param {Object} data - Complete final sample data object with finalSample, summary, closedRecords
       */
      setFinalSampleData: (surveyId, data) => {
        // Validate survey ID first
        const isValid = get().validateSurveyId(surveyId);

        if (!isValid) {
          // Survey ID mismatch - data cleared, do not set new data
        }

        const finalSampleData = {
          finalSample: data?.finalSample || [],
          summary: data?.summary || null,
          closedRecords: data?.closedRecords || [],
          fetchedAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
          error: null,
        };

        set(finalSampleData);
      },

      /**
       * Set loading state
       * @param {boolean} isLoading - Loading state
       */
      setIsLoading: (isLoading) => {
        set({ isLoading });
      },

      /**
       * Set error state
       * @param {Error|null|string} error - Error object, error message, or null
       */
      setError: (error) => {
        set({ 
          error: error ? (error.message || error || 'An error occurred') : null 
        });
      },

      /**
       * Update a specific resident in the final sample
       * @param {string} residentId - ID of the resident to update
       * @param {Object} updates - Updates to apply to the resident
       */
      updateResident: (residentId, updates) => {
        const state = get();
        const updatedFinalSample = state.finalSample.map((item) => {
          const resident = item.resident || {};
          if (
            String(resident.id) === String(residentId) ||
            String(resident._id) === String(residentId)
          ) {
            return {
              ...item,
              resident: {
                ...resident,
                ...updates,
              },
            };
          }
          return item;
        });

        set({
          finalSample: updatedFinalSample,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      /**
       * Remove a resident from the final sample
       * @param {string} residentId - ID of the resident to remove
       */
      removeResident: (residentId) => {
        const state = get();
        const updatedFinalSample = state.finalSample.filter((item) => {
          const resident = item.resident || {};
          return (
            String(resident.id) !== String(residentId) &&
            String(resident._id) !== String(residentId)
          );
        });

        set({
          finalSample: updatedFinalSample,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      /**
       * Add a resident to the final sample
       * @param {Object} residentData - Resident data object with resident and reason
       */
      addResident: (residentData) => {
        const state = get();
        const newItem = {
          resident: residentData.resident || {},
          reason: residentData.reason || '',
        };

        // Check if resident already exists
        const existingIndex = state.finalSample.findIndex((item) => {
          const resident = item.resident || {};
          return (
            String(resident.id) === String(newItem.resident.id) ||
            String(resident._id) === String(newItem.resident.id)
          );
        });

        if (existingIndex >= 0) {
          // Update existing resident
          const updatedFinalSample = [...state.finalSample];
          updatedFinalSample[existingIndex] = newItem;
          set({
            finalSample: updatedFinalSample,
            lastUpdatedAt: new Date().toISOString(),
          });
        } else {
          // Add new resident
          set({
            finalSample: [...state.finalSample, newItem],
            lastUpdatedAt: new Date().toISOString(),
          });
        }
      },

      /**
       * Update summary data
       * @param {Object} summaryData - Summary statistics object
       */
      updateSummary: (summaryData) => {
        set({
          summary: summaryData,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      /**
       * Set closed records
       * @param {Array} closedRecords - Array of closed record objects
       */
      setClosedRecords: (closedRecords) => {
        set({
          closedRecords: closedRecords || [],
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      /**
       * Add a closed record
       * @param {Object} closedRecord - Closed record object
       */
      addClosedRecord: (closedRecord) => {
        const state = get();
        set({
          closedRecords: [...state.closedRecords, closedRecord],
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      /**
       * Remove a closed record
       * @param {string} recordId - ID of the closed record to remove
       */
      removeClosedRecord: (recordId) => {
        const state = get();
        const updatedClosedRecords = state.closedRecords.filter(
          (record) =>
            String(record.id) !== String(recordId) &&
            String(record._id) !== String(recordId)
        );

        set({
          closedRecords: updatedClosedRecords,
          lastUpdatedAt: new Date().toISOString(),
        });
      },

      /**
       * Get resident by ID from final sample
       * @param {string} residentId - ID of the resident
       * @returns {Object|null} - Resident object with reason or null
       */
      getResidentById: (residentId) => {
        const state = get();
        const item = state.finalSample.find((item) => {
          const resident = item.resident || {};
          return (
            String(resident.id) === String(residentId) ||
            String(resident._id) === String(residentId)
          );
        });

        return item || null;
      },

      /**
       * Get all resident IDs from final sample
       * @returns {Array} - Array of resident IDs
       */
      getResidentIds: () => {
        const state = get();
        return state.finalSample.map((item) => {
          const resident = item.resident || {};
          return resident.id || resident._id;
        }).filter(Boolean);
      },

      /**
       * Check if a resident is in the final sample
       * @param {string} residentId - ID of the resident to check
       * @returns {boolean} - True if resident is in final sample
       */
      isResidentInFinalSample: (residentId) => {
        const state = get();
        return state.finalSample.some((item) => {
          const resident = item.resident || {};
          return (
            String(resident.id) === String(residentId) ||
            String(resident._id) === String(residentId)
          );
        });
      },

      /**
       * Clear all data from the store (preserves loading state)
       */
      clearAllData: () => {
        const currentIsLoading = get().isLoading;
        set({
          finalSample: [],
          summary: null,
          closedRecords: [],
          isLoading: currentIsLoading, // Preserve loading state
          error: null,
          fetchedAt: null,
          lastUpdatedAt: null,
        });
     
      },

      /**
       * Clear data but keep survey ID and loading state (useful for re-fetching)
       */
      clearData: () => {
        const currentIsLoading = get().isLoading;
        set({
          finalSample: [],
          summary: null,
          closedRecords: [],
          isLoading: currentIsLoading, // Preserve loading state
          error: null,
          fetchedAt: null,
          lastUpdatedAt: null,
        });
      },
    }),
    {
      name: 'final-sample-storage', // unique name for localStorage
    }
  )
);

export default useFinalSampleStore;

// Export getState for direct access to store state (useful for avoiding stale closures)
export const getFinalSampleStoreState = () => useFinalSampleStore.getState();

