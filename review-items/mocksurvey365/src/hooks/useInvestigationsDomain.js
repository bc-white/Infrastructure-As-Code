import { useState, useCallback } from 'react';

/**
 * Hook to manage the domain state of investigations.
 * Handles the initialization and basic CRUD operations for investigations, notes, and attachments.
 * Abstracts away the data structure differences (resident-centric vs flat list).
 */
export const useInvestigationsDomain = (surveyData) => {
  // Initialize investigations from surveyData (resident-centric structure)
  const [investigations, setInvestigations] = useState(() => {
    // Extract investigations from residents array
    const residents = surveyData?.investigationSurvey?.residents || [];
    const investigationsList = [];
    residents.forEach((resident) => {
      if (
        resident.investigations &&
        typeof resident.investigations === "object" &&
        !Array.isArray(resident.investigations)
      ) {
        // Single investigation object - convert to array for compatibility
        investigationsList.push(resident.investigations);
      } else if (Array.isArray(resident.investigations)) {
        // Array of investigations (legacy format)
        investigationsList.push(...resident.investigations);
      }
    });
    return investigationsList;
  });

  const [notes, setNotes] = useState(() => {
    // Extract notes from residents array
    const residents = surveyData?.investigationSurvey?.residents || [];
    const notesObj = {};
    residents.forEach((resident) => {
      if (resident.notes && Object.keys(resident.notes).length > 0) {
        notesObj[`resident_${resident.id}`] = resident.notes;
      }
    });
    return notesObj;
  });

  const [attachments, setAttachments] = useState(() => {
    // Extract attachments from residents array
    const residents = surveyData?.investigationSurvey?.residents || [];
    const attachmentsObj = {};
    residents.forEach((resident) => {
      if (
        resident.attachments &&
        Object.keys(resident.attachments).length > 0
      ) {
        attachmentsObj[`resident_${resident.id}`] = resident.attachments;
      }
    });
    return attachmentsObj;
  });

  // Helper to update a single investigation
  const updateInvestigation = useCallback((updatedInv) => {
    setInvestigations(prev => prev.map(inv => inv.id === updatedInv.id ? updatedInv : inv));
  }, []);

  // Helper to add an investigation
  const addInvestigation = useCallback((newInv) => {
    setInvestigations(prev => [...prev, newInv]);
  }, []);

  return {
    investigations,
    setInvestigations,
    notes,
    setNotes,
    attachments,
    setAttachments,
    updateInvestigation,
    addInvestigation
  };
};
