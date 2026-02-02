import { create } from 'zustand';

/**
 * Zustand store for Survey state
 * NOTE: LocalStorage persistence has been removed to avoid quota exceeded errors
 * All facility task data should be stored via the API, not locally
 */

const useSurveyStore = create(
  (set, get) => ({
    // State
    offlineData: null, // Latest offline submission data (in-memory only)
    offlineSubmissions: [], // Array of all offline submissions (in-memory only)
    surveyId: null,
    lastSavedAt: null,
    isOffline: false,

    // Actions
    /**
     * Set offline data for a survey submission
     * @param {Object} data - Offline submission data (socket message)
     */
    setOfflineData: (data) => {
      const submission = {
        ...data,
        id: data.syncQueueId || `offline_${data.surveyId}_${Date.now()}`,
        savedAt: new Date().toISOString(),
      };

      // Only keep last 5 submissions in memory to prevent memory bloat
      set((state) => ({
        offlineData: submission,
        offlineSubmissions: [...state.offlineSubmissions.slice(-4), submission],
        surveyId: data.surveyId,
        lastSavedAt: new Date().toISOString(),
        isOffline: true,
      }));
    },

    /**
     * Clear offline data after successful sync
     * @param {string} submissionId - ID of the submission that was synced
     */
    clearOfflineData: (submissionId = null) => {
      if (submissionId) {
        // Remove specific submission
        set((state) => ({
          offlineSubmissions: state.offlineSubmissions.filter(
            (sub) => sub.id !== submissionId
          ),
          offlineData:
            state.offlineData?.id === submissionId
              ? null
              : state.offlineData,
        }));
      } else {
        // Clear all offline data
        set({
          offlineData: null,
          offlineSubmissions: [],
          lastSavedAt: null,
          isOffline: false,
        });
      }
    },

    /**
     * Get offline submissions count
     */
    getOfflineCount: () => {
      return get().offlineSubmissions.length;
    },

    /**
     * Set online status
     * @param {boolean} isOnline - Online status
     */
    setIsOffline: (isOffline) => {
      set({ isOffline });
    },

    /**
     * Clear all data
     */
    clearAllData: () => {
      set({
        offlineData: null,
        offlineSubmissions: [],
        surveyId: null,
        lastSavedAt: null,
        isOffline: false,
      });
    },
  })
);

export default useSurveyStore;
