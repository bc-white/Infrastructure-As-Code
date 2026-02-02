import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store for persisting Citation Report data by surveyId
 * This ensures report data persists across page refreshes
 */
const useCitationReportStore = create(
  persist(
    (set, get) => ({
      // Store citation reports keyed by surveyId
      citationReports: {},

      /**
       * Get citation report data for a specific survey
       * @param {string} surveyId - The survey ID
       * @returns {Object|null} - The citation report data or null
       */
      getCitationReport: (surveyId) => {
        if (!surveyId) return null;
        return get().citationReports[surveyId] || null;
      },

      /**
       * Save citation report data for a specific survey
       * @param {string} surveyId - The survey ID
       * @param {Object} reportData - The citation report data
       */
      saveCitationReport: (surveyId, reportData) => {
        if (!surveyId) return;
        
        set((state) => ({
          citationReports: {
            ...state.citationReports,
            [surveyId]: {
              ...reportData,
              savedAt: new Date().toISOString(),
            },
          },
        }));
      },

      /**
       * Update specific fields of citation report data
       * @param {string} surveyId - The survey ID
       * @param {Object} updates - Partial updates to apply
       */
      updateCitationReport: (surveyId, updates) => {
        if (!surveyId) return;
        
        const currentData = get().citationReports[surveyId] || {};
        
        set((state) => ({
          citationReports: {
            ...state.citationReports,
            [surveyId]: {
              ...currentData,
              ...updates,
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      /**
       * Check if citation report exists for a survey
       * @param {string} surveyId - The survey ID
       * @returns {boolean}
       */
      hasCitationReport: (surveyId) => {
        if (!surveyId) return false;
        const report = get().citationReports[surveyId];
        return !!(report && report.citationReportPdfUrl);
      },

      /**
       * Clear citation report data for a specific survey
       * @param {string} surveyId - The survey ID
       */
      clearCitationReport: (surveyId) => {
        if (!surveyId) return;
        
        set((state) => {
          const { [surveyId]: removed, ...remaining } = state.citationReports;
          return { citationReports: remaining };
        });
      },

      /**
       * Clear all citation reports (use with caution)
       */
      clearAllReports: () => {
        set({ citationReports: {} });
      },

      /**
       * Cleanup old reports (older than specified days)
       * @param {number} daysOld - Number of days after which to remove
       */
      cleanupOldReports: (daysOld = 30) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        set((state) => {
          const cleanedReports = {};
          
          Object.entries(state.citationReports).forEach(([surveyId, data]) => {
            const savedAt = new Date(data.savedAt || data.completedAt);
            if (savedAt >= cutoffDate) {
              cleanedReports[surveyId] = data;
            }
          });
          
          return { citationReports: cleanedReports };
        });
      },
    }),
    {
      name: 'citation-report-storage', // localStorage key
      version: 1,
      partialize: (state) => ({ citationReports: state.citationReports }),
    }
  )
);

export default useCitationReportStore;
