import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Zustand store for Plan of Correction data
 * Persists POC data keyed by surveyId to survive page reloads
 * Each survey has its own POC data stored separately
 */

const usePlanOfCorrectionStore = create(
  persist(
    (set, get) => ({
      // State - stores POC data for multiple surveys
      pocDataBySurvey: {}, // { [surveyId]: { editablePocData, pocGenerated, fileName, pdfUrl, generatedAt, apiMessage, apiSuccess } }

      // Actions

      /**
       * Get POC data for a specific survey
       * @param {string} surveyId - Survey ID
       * @returns {Object|null} - POC data for the survey or null
       */
      getPocData: (surveyId) => {
        if (!surveyId) return null;
        return get().pocDataBySurvey[String(surveyId)] || null;
      },

      /**
       * Set POC data for a specific survey
       * @param {string} surveyId - Survey ID
       * @param {Object} data - POC data to store
       */
      setPocData: (surveyId, data) => {
        if (!surveyId) {
          // console.warn('Cannot save POC data without surveyId');
          return;
        }

        set((state) => ({
          pocDataBySurvey: {
            ...state.pocDataBySurvey,
            [String(surveyId)]: {
              ...state.pocDataBySurvey[String(surveyId)],
              ...data,
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      /**
       * Update editable POC data for a specific survey
       * @param {string} surveyId - Survey ID
       * @param {Object} editablePocData - Editable POC data
       */
      updateEditablePocData: (surveyId, editablePocData) => {
        if (!surveyId) return;

        set((state) => ({
          pocDataBySurvey: {
            ...state.pocDataBySurvey,
            [String(surveyId)]: {
              ...state.pocDataBySurvey[String(surveyId)],
              editablePocData,
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      /**
       * Save complete POC generation result
       * @param {string} surveyId - Survey ID
       * @param {Object} params - Generation result parameters
       */
      savePocGenerationResult: (surveyId, {
        editablePocData,
        pocGenerated,
        fileName,
        pdfUrl,
        apiMessage,
        apiSuccess,
      }) => {
        if (!surveyId) {
          // console.warn('Cannot save POC generation result without surveyId');
          return;
        }

        set((state) => ({
          pocDataBySurvey: {
            ...state.pocDataBySurvey,
            [String(surveyId)]: {
              editablePocData,
              pocGenerated,
              fileName,
              pdfUrl,
              apiMessage,
              apiSuccess,
              generatedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      /**
       * Clear POC data for a specific survey
       * @param {string} surveyId - Survey ID
       */
      clearPocData: (surveyId) => {
        if (!surveyId) return;

        set((state) => {
          const newPocDataBySurvey = { ...state.pocDataBySurvey };
          delete newPocDataBySurvey[String(surveyId)];
          return { pocDataBySurvey: newPocDataBySurvey };
        });
      },

      /**
       * Clear all POC data (for all surveys)
       */
      clearAllPocData: () => {
        set({ pocDataBySurvey: {} });
      },

      /**
       * Check if POC data exists for a survey
       * @param {string} surveyId - Survey ID
       * @returns {boolean}
       */
      hasPocData: (surveyId) => {
        if (!surveyId) return false;
        const data = get().pocDataBySurvey[String(surveyId)];
        return !!(data && data.editablePocData);
      },

      /**
       * Get count of surveys with POC data
       * @returns {number}
       */
      getPocDataCount: () => {
        return Object.keys(get().pocDataBySurvey).length;
      },

      /**
       * Clean up old POC data (older than specified days)
       * @param {number} days - Number of days to keep data
       */
      cleanupOldData: (days = 30) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        set((state) => {
          const newPocDataBySurvey = {};
          Object.entries(state.pocDataBySurvey).forEach(([surveyId, data]) => {
            const updatedAt = new Date(data.updatedAt || data.generatedAt);
            if (updatedAt >= cutoffDate) {
              newPocDataBySurvey[surveyId] = data;
            }
          });
          return { pocDataBySurvey: newPocDataBySurvey };
        });
      },
    }),
    {
      name: 'plan-of-correction-storage', // localStorage key
      version: 1,
      partialize: (state) => ({
        pocDataBySurvey: state.pocDataBySurvey,
      }),
    }
  )
);

export default usePlanOfCorrectionStore;
