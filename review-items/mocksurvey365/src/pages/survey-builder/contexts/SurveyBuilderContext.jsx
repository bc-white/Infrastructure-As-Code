import React, { createContext, useContext, useReducer } from "react";

/**
 * Survey Builder Context
 * Provides shared state for survey builder components
 * Reduces prop drilling and centralizes state management
 */

const SurveyBuilderContext = createContext();

// Action types
const ACTIONS = {
  SET_CURRENT_STEP: "SET_CURRENT_STEP",
  SET_SURVEY_DATA: "SET_SURVEY_DATA",
  UPDATE_SURVEY_DATA: "UPDATE_SURVEY_DATA",
  SET_MODAL_VISIBILITY: "SET_MODAL_VISIBILITY",
  RESET: "RESET",
};

// Initial state
const initialState = {
  currentStep: 1,
  surveyData: null,
  modals: {
    showESendModal: false,
    showPrintModal: false,
    showNewSurveyConfirm: false,
    showAddFindingModal: false,
    showGenerateFormsModal: false,
    showAddResidentModal: false,
    showUploadResidentModal: false,
    showTeamModal: false,
    showInvestigationModal: false,
    showComplaintModal: false,
    showFTagModal: false,
    showBodyMapModal: false,
    showAttachmentsModal: false,
    showClosedRecordsModal: false,
    // Add other modals as needed
  },
};

// Reducer
const surveyBuilderReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_CURRENT_STEP:
      return { ...state, currentStep: action.payload };

    case ACTIONS.SET_SURVEY_DATA:
      return { ...state, surveyData: action.payload };

    case ACTIONS.UPDATE_SURVEY_DATA:
      return {
        ...state,
        surveyData: {
          ...state.surveyData,
          ...action.payload,
        },
      };

    case ACTIONS.SET_MODAL_VISIBILITY:
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload.modal]: action.payload.isOpen,
        },
      };

    case ACTIONS.RESET:
      return initialState;

    default:
      return state;
  }
};

// Provider component
export const SurveyBuilderProvider = ({ children, initialData = {} }) => {
  const [state, dispatch] = useReducer(surveyBuilderReducer, {
    ...initialState,
    ...initialData,
  });

  // Action creators
  const actions = {
    setCurrentStep: (step) =>
      dispatch({ type: ACTIONS.SET_CURRENT_STEP, payload: step }),

    setSurveyData: (data) =>
      dispatch({ type: ACTIONS.SET_SURVEY_DATA, payload: data }),

    updateSurveyData: (field, value) =>
      dispatch({
        type: ACTIONS.UPDATE_SURVEY_DATA,
        payload: { [field]: value },
      }),

    openModal: (modalName) =>
      dispatch({
        type: ACTIONS.SET_MODAL_VISIBILITY,
        payload: { modal: modalName, isOpen: true },
      }),

    closeModal: (modalName) =>
      dispatch({
        type: ACTIONS.SET_MODAL_VISIBILITY,
        payload: { modal: modalName, isOpen: false },
      }),

    reset: () => dispatch({ type: ACTIONS.RESET }),
  };

  const value = {
    ...state,
    ...actions,
  };

  return (
    <SurveyBuilderContext.Provider value={value}>
      {children}
    </SurveyBuilderContext.Provider>
  );
};

// Custom hook to use the context
export const useSurveyBuilder = () => {
  const context = useContext(SurveyBuilderContext);
  if (!context) {
    throw new Error(
      "useSurveyBuilder must be used within a SurveyBuilderProvider"
    );
  }
  return context;
};

export default SurveyBuilderContext;

