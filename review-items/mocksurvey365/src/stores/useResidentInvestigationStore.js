import { create } from 'zustand';
// import { persist } from 'zustand/middleware';

/**
 * Zustand store for Resident Investigation data
 * Persists residents information fetched from the API
 * This store ensures data persists across page refreshes
 */

const useResidentInvestigationStore = create(
  // persist(
    (set, get) => ({
      // State
      residents: [],
      selectedResident: null,
      CE_pathway_questions: [],
      isLoading: false,
      error: null,
      surveyId: null,

      // Actions
      /**
       * Set the residents array
       * @param {Array} residents - Array of resident investigation data
       */
      setResidents: (residents) => {
        set({ residents });
      },

      /**
       * Set the selected resident
       * @param {Object} resident - Selected resident object
       */
      setSelectedResident: (resident) => {
        set({ selectedResident: resident });
      },

      /**
       * Set CE pathway questions
       * @param {Array} questions - Array of CE pathway questions
       */
      setCE_pathway_questions: (questions) => {
        set({ CE_pathway_questions: questions });
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
       * @param {Error|null} error - Error object or null
       */
      setError: (error) => {
        set({ error });
      },

      /**
       * Set survey ID
       * @param {string} surveyId - Survey ID
       */
      setSurveyId: (surveyId) => {
        set({ surveyId });
      },

      /**
       * Update probe status for selected resident
       * @param {string} probeIndex - Index of the probe in investigations array
       * @param {string} status - Status value: "Met", "Not Met", or "N/A"
       */
      updateProbeStatus: (probeIndex, status) => {
        const state = get();
        if (!state.selectedResident) return;

        const updatedInvestigations = [...state.selectedResident.investigations];
        updatedInvestigations[probeIndex] = {
          ...updatedInvestigations[probeIndex],
          surveyorStatus: status,
        };

        const updatedResident = {
          ...state.selectedResident,
          investigations: updatedInvestigations,
        };

        // Update selected resident
        set({ selectedResident: updatedResident });

        // Update in residents array
        const updatedResidents = state.residents.map((resident) =>
          resident.id === updatedResident.id ? updatedResident : resident
        );
        set({ residents: updatedResidents });
      },

      /**
       * Update CE pathway question answer (checkbox and notes)
       * @param {number} probeIndex - Index of the probe
       * @param {string} category - Category name of the question
       * @param {number} questionIndex - Index of the question within the category
       * @param {boolean} isChecked - Whether the question is checked
       * @param {string} notes - Notes for the question
       */
      updateCEPathwayAnswer: (probeIndex, category, questionIndex, isChecked, notes = null) => {
        const state = get();
        if (!state.selectedResident) return;

        const updatedInvestigations = [...state.selectedResident.investigations];
        const probe = updatedInvestigations[probeIndex];
        
        // Initialize CE pathway answers if it doesn't exist
        if (!probe.cePathwayAnswers) {
          probe.cePathwayAnswers = {};
        }
        if (!probe.cePathwayAnswers[category]) {
          probe.cePathwayAnswers[category] = {};
        }

        const questionKey = `${category}_${questionIndex}`;
        
        // Update or create answer object
        probe.cePathwayAnswers[category][questionKey] = {
          checked: isChecked,
          notes: notes !== null ? notes : (probe.cePathwayAnswers[category][questionKey]?.notes || ""),
        };

        updatedInvestigations[probeIndex] = { ...probe };

        const updatedResident = {
          ...state.selectedResident,
          investigations: updatedInvestigations,
        };

        // Update selected resident
        set({ selectedResident: updatedResident });

        // Update in residents array
        const updatedResidents = state.residents.map((resident) =>
          resident.id === updatedResident.id ? updatedResident : resident
        );
        set({ residents: updatedResidents });
      },

      /**
       * Update overall notes for a specific probe
       * @param {number} probeIndex - Index of the probe in investigations array
       * @param {string} notes - Notes text to save
       */
      updateProbeNotes: (probeIndex, notes) => {
        const state = get();
        if (!state.selectedResident) return;

        const updatedInvestigations = [...state.selectedResident.investigations];
        updatedInvestigations[probeIndex] = {
          ...updatedInvestigations[probeIndex],
          overallNotes: notes,
        };

        const updatedResident = {
          ...state.selectedResident,
          investigations: updatedInvestigations,
        };

        // Update selected resident
        set({ selectedResident: updatedResident });

        // Update in residents array
        const updatedResidents = state.residents.map((resident) =>
          resident.id === updatedResident.id ? updatedResident : resident
        );
        set({ residents: updatedResidents });
      },

      /**
       * Update weight calculator data for selected resident
       * @param {Object} weightData - Weight calculator data object
       */
      updateWeightCalculatorData: (weightData) => {
        const state = get();
        if (!state.selectedResident) return;

        const updatedResident = {
          ...state.selectedResident,
          weightCalculatorData: weightData,
        };

        // Update selected resident
        set({ selectedResident: updatedResident });

        // Update in residents array
        const updatedResidents = state.residents.map((resident) =>
          resident.id === updatedResident.id ? updatedResident : resident
        );
        set({ residents: updatedResidents });
      },

      /**
       * Update body map observations for selected resident
       * @param {Array} observations - Array of body map observations
       */
      updateBodyMapObservations: (observations) => {
        const state = get();
        if (!state.selectedResident) return;

        const updatedResident = {
          ...state.selectedResident,
          bodyMapObservations: observations,
        };

        // Update selected resident
        set({ selectedResident: updatedResident });

        // Update in residents array
        const updatedResidents = state.residents.map((resident) =>
          resident.id === updatedResident.id ? updatedResident : resident
        );
        set({ residents: updatedResidents });
      },

      /**
       * Update general surveyor notes for selected resident
       * @param {string} notes - General surveyor notes text
       */
      updateGeneralNotes: (notes) => {
        const state = get();
        if (!state.selectedResident) return;

        const updatedResident = {
          ...state.selectedResident,
          generalSurveyorNotes: notes,
        };

        // Update selected resident
        set({ selectedResident: updatedResident });

        // Update in residents array
        const updatedResidents = state.residents.map((resident) =>
          resident.id === updatedResident.id ? updatedResident : resident
        );
        set({ residents: updatedResidents });
      },

      /**
       * Clear all data from the store
       */
      clearStore: () => {
        set({
          residents: [],
          selectedResident: null,
          CE_pathway_questions: [],
          isLoading: false,
          error: null,
          surveyId: null,
        });
      },
    })
    /*,
    {
      name: 'resident-investigation-storage', // unique name for localStorage
    }
  )*/
);

export default useResidentInvestigationStore;
