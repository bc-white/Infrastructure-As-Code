import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store for persisting Education & Training Presentations data by surveyId
 * This ensures presentation data persists across page refreshes
 */
const useEducationPresentationStore = create(
  persist(
    (set, get) => ({
      // Store education presentations keyed by surveyId
      educationPresentations: {},

      /**
       * Get education presentations for a specific survey
       * @param {string} surveyId - The survey ID
       * @returns {Object|null} - The education presentations data or null
       */
      getEducationPresentations: (surveyId) => {
        if (!surveyId) return null;
        return get().educationPresentations[surveyId] || null;
      },

      /**
       * Save all education presentations for a specific survey
       * @param {string} surveyId - The survey ID
       * @param {Object} educationData - The education presentations data
       */
      saveEducationPresentations: (surveyId, educationData) => {
        if (!surveyId) return;
        
        set((state) => ({
          educationPresentations: {
            ...state.educationPresentations,
            [surveyId]: {
              ...educationData,
              savedAt: new Date().toISOString(),
            },
          },
        }));
      },

      /**
       * Save a specific presentation type for a survey
       * @param {string} surveyId - The survey ID
       * @param {string} presentationType - 'staffTraining' | 'leadershipBriefing' | 'customPresentation'
       * @param {Object} presentationData - The presentation data
       */
      savePresentation: (surveyId, presentationType, presentationData) => {
        if (!surveyId || !presentationType) return;
        
        const currentData = get().educationPresentations[surveyId] || {};
        
        set((state) => ({
          educationPresentations: {
            ...state.educationPresentations,
            [surveyId]: {
              ...currentData,
              [presentationType]: {
                ...presentationData,
                savedAt: new Date().toISOString(),
              },
            },
          },
        }));
      },

      /**
       * Get a specific presentation for a survey
       * @param {string} surveyId - The survey ID
       * @param {string} presentationType - 'staffTraining' | 'leadershipBriefing' | 'customPresentation'
       * @returns {Object|null}
       */
      getPresentation: (surveyId, presentationType) => {
        if (!surveyId || !presentationType) return null;
        const surveyData = get().educationPresentations[surveyId];
        return surveyData?.[presentationType] || null;
      },

      /**
       * Check if a presentation exists for a survey
       * @param {string} surveyId - The survey ID
       * @param {string} presentationType - 'staffTraining' | 'leadershipBriefing' | 'customPresentation'
       * @returns {boolean}
       */
      hasPresentation: (surveyId, presentationType) => {
        if (!surveyId || !presentationType) return false;
        const presentation = get().educationPresentations[surveyId]?.[presentationType];
        return !!(presentation && presentation.generationId);
      },

      /**
       * Clear all education presentations for a specific survey
       * @param {string} surveyId - The survey ID
       */
      clearEducationPresentations: (surveyId) => {
        if (!surveyId) return;
        
        set((state) => {
          const { [surveyId]: removed, ...remaining } = state.educationPresentations;
          return { educationPresentations: remaining };
        });
      },

      /**
       * Clear a specific presentation for a survey
       * @param {string} surveyId - The survey ID
       * @param {string} presentationType - 'staffTraining' | 'leadershipBriefing' | 'customPresentation'
       */
      clearPresentation: (surveyId, presentationType) => {
        if (!surveyId || !presentationType) return;
        
        const currentData = get().educationPresentations[surveyId];
        if (!currentData) return;
        
        const { [presentationType]: removed, ...remaining } = currentData;
        
        set((state) => ({
          educationPresentations: {
            ...state.educationPresentations,
            [surveyId]: remaining,
          },
        }));
      },

      /**
       * Cleanup old presentations (older than specified days)
       * @param {number} daysOld - Number of days after which to remove
       */
      cleanupOldPresentations: (daysOld = 30) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        set((state) => {
          const cleanedPresentations = {};
          
          Object.entries(state.educationPresentations).forEach(([surveyId, data]) => {
            const savedAt = new Date(data.savedAt);
            if (savedAt >= cutoffDate) {
              cleanedPresentations[surveyId] = data;
            }
          });
          
          return { educationPresentations: cleanedPresentations };
        });
      },
    }),
    {
      name: 'education-presentation-storage', // localStorage key
      version: 1,
      partialize: (state) => ({ educationPresentations: state.educationPresentations }),
    }
  )
);

export default useEducationPresentationStore;
