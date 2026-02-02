import { useState } from "react";

/**
 * Custom hook to manage investigations state
 * Centralizes all state management for the Investigations component
 */
export const useInvestigationsState = (surveyData) => {
  // Local state for investigation management
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("byResident");
  const [selectedInvestigation, setSelectedInvestigation] = useState(null);
  const [showAddInvestigationModal, setShowAddInvestigationModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showCEPathwayModal, setShowCEPathwayModal] = useState(false);
  const [ceAccordionOpen, setCeAccordionOpen] = useState({});
  const [showMDSModal, setShowMDSModal] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [showDrawingTool, setShowDrawingTool] = useState(false);
  const [showWeightCalculator, setShowWeightCalculator] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [notesPanelPinned, setNotesPanelPinned] = useState(false);
  const [notesPanelSize, setNotesPanelSize] = useState("medium");
  const [lastAutoSave, setLastAutoSave] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [assignments, setAssignments] = useState({});
  const [selectedResidents, setSelectedResidents] = useState(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);

  // Team member completion and page status
  const [taskStatuses, setTaskStatuses] = useState({});
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isPageClosed, setIsPageClosed] = useState(false);
  const [teamMemberSubmissions, setTeamMemberSubmissions] = useState({});
  const [showTeamMemberModal, setShowTeamMemberModal] = useState(false);
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);
  const [isContinueClicked, setIsContinueClicked] = useState(false);

  // Surveyor data
  const [surveyors, setSurveyors] = useState([]);

  // Care areas for investigations
  const [careAreas, setCareAreas] = useState([]);

  // Critical Element Pathways
  const [criticalElementPathways, setCriticalElementPathways] = useState({});

  // Investigations, residents, notes, and attachments
  const [investigations, setInvestigations] = useState(
    surveyData?.investigationSurvey?.investigations || []
  );
  const [residents, setResidents] = useState(
    surveyData?.investigationSurvey?.residents || []
  );
  const [notes, setNotes] = useState(
    surveyData?.investigationSurvey?.investigationNotes || {}
  );
  const [attachments, setAttachments] = useState(
    surveyData?.investigationSurvey?.investigationAttachments || {}
  );

  // Phase 2 features state
  const [showScopeSeverityModal, setShowScopeSeverityModal] = useState(false);
  const [showDeficiencyModal, setShowDeficiencyModal] = useState(false);
  const [showProbeEditModal, setShowProbeEditModal] = useState(false);
  const [selectedScopeSeverity, setSelectedScopeSeverity] = useState(null);
  const [draftDeficiency, setDraftDeficiency] = useState(null);
  const [currentInvestigationId, setCurrentInvestigationId] = useState(null);
  const [selectedCEPathway, setSelectedCEPathway] = useState(null);
  const [pathwayAnswers, setPathwayAnswers] = useState({});
  const [editingProbe, setEditingProbe] = useState(null);
  const [probeEditData, setProbeEditData] = useState({
    outcome: "",
    evidence: "",
    notes: "",
    files: [],
  });
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Body map and weight calculator state
  const [bodyMapObservationsByResident, setBodyMapObservationsByResident] = useState(
    surveyData?.investigationSurvey?.bodyMapObservations || {}
  );
  const [weightCalculatorDataByResident, setWeightCalculatorDataByResident] = useState(
    surveyData?.investigationSurvey?.weightCalculatorData || {}
  );
  const [drawingToolState, setDrawingToolState] = useState({
    selectedColor: "#EF4444",
    drawingMode: "draw",
    observations: [],
  });

  // CE Pathway questions
  const [pathwayQuestionChecks, setPathwayQuestionChecks] = useState({});
  const [pathwayQuestionNotes, setPathwayQuestionNotes] = useState({});

  // API state
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [, setSocketMessages] = useState({
    teamMember: null,
    teamLead: null,
  });

  return {
    // Search and filters
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,

    // Modals
    selectedInvestigation,
    setSelectedInvestigation,
    showAddInvestigationModal,
    setShowAddInvestigationModal,
    showAssignmentModal,
    setShowAssignmentModal,
    showCEPathwayModal,
    setShowCEPathwayModal,
    ceAccordionOpen,
    setCeAccordionOpen,
    showMDSModal,
    setShowMDSModal,
    showComplianceModal,
    setShowComplianceModal,
    showDrawingTool,
    setShowDrawingTool,
    showWeightCalculator,
    setShowWeightCalculator,
    showNotesPanel,
    setShowNotesPanel,
    notesPanelPinned,
    setNotesPanelPinned,
    notesPanelSize,
    setNotesPanelSize,

    // Loading and auto-save
    lastAutoSave,
    setLastAutoSave,
    isLoading,
    setIsLoading,

    // Assignments
    assignments,
    setAssignments,
    selectedResidents,
    setSelectedResidents,
    isSelectAll,
    setIsSelectAll,

    // Team member state
    taskStatuses,
    setTaskStatuses,
    showCompletionModal,
    setShowCompletionModal,
    isPageClosed,
    setIsPageClosed,
    teamMemberSubmissions,
    setTeamMemberSubmissions,
    showTeamMemberModal,
    setShowTeamMemberModal,
    selectedTeamMember,
    setSelectedTeamMember,
    isContinueClicked,
    setIsContinueClicked,

    // Data
    surveyors,
    setSurveyors,
    careAreas,
    setCareAreas,
    criticalElementPathways,
    setCriticalElementPathways,

    // Core investigation data
    investigations,
    setInvestigations,
    residents,
    setResidents,
    notes,
    setNotes,
    attachments,
    setAttachments,

    // Phase 2 features
    showScopeSeverityModal,
    setShowScopeSeverityModal,
    showDeficiencyModal,
    setShowDeficiencyModal,
    showProbeEditModal,
    setShowProbeEditModal,
    selectedScopeSeverity,
    setSelectedScopeSeverity,
    draftDeficiency,
    setDraftDeficiency,
    currentInvestigationId,
    setCurrentInvestigationId,
    selectedCEPathway,
    setSelectedCEPathway,
    pathwayAnswers,
    setPathwayAnswers,
    editingProbe,
    setEditingProbe,
    probeEditData,
    setProbeEditData,
    uploadingFiles,
    setUploadingFiles,

    // Body map and weight calculator
    bodyMapObservationsByResident,
    setBodyMapObservationsByResident,
    weightCalculatorDataByResident,
    setWeightCalculatorDataByResident,
    drawingToolState,
    setDrawingToolState,

    // CE Pathway
    pathwayQuestionChecks,
    setPathwayQuestionChecks,
    pathwayQuestionNotes,
    setPathwayQuestionNotes,

    // API state
    apiLoading,
    setApiLoading,
    apiError,
    setApiError,
    setSocketMessages,
  };
};
