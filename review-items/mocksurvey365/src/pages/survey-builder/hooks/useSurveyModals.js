import { useState, useCallback } from "react";

/**
 * Custom hook for managing modal visibility state
 * Centralizes modal state management
 */
export const useSurveyModals = () => {
  const [modals, setModals] = useState({
    showESendModal: false,
    showPrintModal: false,
    showNewSurveyConfirm: false,
    showAddFindingModal: false,
    showGenerateFormsModal: false,
    showAddResidentModal: false,
    showUploadResidentModal: false,
    showAddResidentNameModal: false,
    showTeamModal: false,
    showRemoveConfirmModal: false,
    showOfflineGuideModal: false,
    showResourceLauncherModal: false,
    showArbitrationModal: false,
    showObservationModal: false,
    showInterviewModal: false,
    showRecordReviewModal: false,
    showClosedRecordsModal: false,
    showInvestigationModal: false,
    showComplaintModal: false,
    showFTagModal: false,
    showBodyMapModal: false,
    showAttachmentsModal: false,
    showProcedureGuideModal: false,
    showAppendixQModal: false,
    showPsychosocialGuideModal: false,
    showTagReviewToolModal: false,
    showExtendedSurveyListModal: false,
    showSupportModal: false,
    showScreenshotGuideModal: false,
  });

  // Open a specific modal
  const openModal = useCallback((modalName) => {
    setModals((prev) => ({
      ...prev,
      [modalName]: true,
    }));
  }, []);

  // Close a specific modal
  const closeModal = useCallback((modalName) => {
    setModals((prev) => ({
      ...prev,
      [modalName]: false,
    }));
  }, []);

  // Toggle a modal
  const toggleModal = useCallback((modalName) => {
    setModals((prev) => ({
      ...prev,
      [modalName]: !prev[modalName],
    }));
  }, []);

  // Close all modals
  const closeAllModals = useCallback(() => {
    setModals((prev) => {
      const closed = {};
      Object.keys(prev).forEach((key) => {
        closed[key] = false;
      });
      return closed;
    });
  }, []);

  return {
    modals,
    openModal,
    closeModal,
    toggleModal,
    closeAllModals,
  };
};

