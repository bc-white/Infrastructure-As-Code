import { useState, useEffect, useCallback } from "react";
import { useBeforeUnload } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { ChevronLeft, ArrowRight, X, ChevronDown } from "lucide-react";
import UnsavedChangesModal from "../../components/UnsavedChangesModal";
import FloatingHomeButton from "../../components/FloatingHomeButton";
import ConfirmOverrideModal from "../../components/modals/ConfirmOverrideModal";
import { useBrowserNavigationBlocker } from "../../hooks/useBrowserNavigationBlocker";
import useSurveyAccess from "../../hooks/useSurveyAccess";
import useResidentInvestigationStore from "../../stores/useResidentInvestigationStore";
import {
  healthAssistantAPI,
  surveySocketService,
  authAPI, 
  surveyAPI,
} from "../../service/api";
import surveyIndexedDB from "../../utils/surveyIndexedDB";
import { saveSurveyStepData } from "../../utils/surveyStorageIndexedDB";
import surveySyncService from "../../utils/surveySyncService";
import useSurveyStore from "../../stores/useSurveyStore";
import ProbeNotes from "../../components/investigations/ProbeNotes";
import CEPathwayAssessment from "../../components/investigations/CEPathwayAssessment";
import ProbeStatusSelector from "../../components/investigations/ProbeStatusSelector";
import ResidentInfoCard from "../../components/investigations/ResidentInfoCard";
import WeightCalculatorModal from "../../components/investigations/WeightCalculatorModal";
import WeightCalculatorSummary from "../../components/investigations/WeightCalculatorSummary";
import BodyMapModal from "../../components/investigations/BodyMapModal";
import BodyMapSummary from "../../components/investigations/BodyMapSummary";
import ResidentListItem from "../../components/investigations/ResidentListItem";
import FloatingSaveButton from "../../components/investigations/FloatingSaveButton";
import UnsavedChangesOptionsModal from "../../components/investigations/UnsavedChangesOptionsModal";
import { toast } from "sonner";
import {
  getCurrentUser,
} from "../../utils/investigations/investigationHelpers";

const ResidentInvestigation = ({ setCurrentStep, isInvitedUser: isInvitedUserProp = () => false }) => {
  // Survey ID state - also used by survey access hook
  const [surveyIdLocal, setSurveyIdLocal] = useState(
    localStorage.getItem("currentSurveyId")
  );
  
  // Use the survey access hook to determine user access type
  const { isInvitedUser: isInvitedUserFromHook, isLoading: isAccessLoading } = useSurveyAccess(surveyIdLocal);
  
  // Use hook-based isInvitedUser, fall back to prop if hook is still loading
  const isInvitedUser = isAccessLoading ? isInvitedUserProp : isInvitedUserFromHook;

  const {
    residents,
    selectedResident,
    CE_pathway_questions,
    isLoading,
    setResidents,
    setSelectedResident,
    setCE_pathway_questions,
    setIsLoading,
    setSurveyId,
    surveyId,
    clearStore,
    updateProbeStatus,
    updateCEPathwayAnswer,
    updateProbeNotes,
    updateWeightCalculatorData,
    updateBodyMapObservations,
    updateGeneralNotes,
  } = useResidentInvestigationStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isWeightCalculatorOpen, setIsWeightCalculatorOpen] = useState(false);
  const [isBodyMapOpen, setIsBodyMapOpen] = useState(false);
  const [weightCalculatorState, setWeightCalculatorState] = useState({
    previousWeight: "",
    currentWeight: "",
    previousDate: null,
    currentDate: null,
    weightChange: 0,
    weightChangePercent: 0,
    daysBetween: 0,
    monthlyProjection: 0,
  });
  const [drawingToolState, setDrawingToolState] = useState({
    selectedTool: "wound",
    selectedSize: 8,
    selectedColor: "#EF4444",
    currentObservation: {
      type: "",
      location: "",
      description: "",
      severity: "",
      x: 0,
      y: 0,
      size: 8,
      color: "#EF4444",
    },
    observations: [],
  });
  const [joinTeamLeadLoading, setJoinTeamLeadLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [roleIdToName, setRoleIdToName] = useState({});
  // SERVER FIRST: These states are kept for component compatibility but no longer used for merging
  // Server data is the single source of truth (like SampleSelection and InitialPoolProcess)
  const [unsavedChanges, setUnsavedChanges] = useState({});
  const [isLoadingFromSocket, setIsLoadingFromSocket] = useState(false);
  const [isResidentListDrawerOpen, setIsResidentListDrawerOpen] = useState(false); // Mobile resident list drawer
  const [unsavedChangesModalOpen, setUnsavedChangesModalOpen] = useState(false);
  const [pendingUnsavedChangesCount, setPendingUnsavedChangesCount] = useState(0);
  const [isSyncingData, setIsSyncingData] = useState(false); // Sync button loading state
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false); // Navigation blocking modal
  const [pendingNavigation, setPendingNavigation] = useState(null); // Pending navigation action
  
  // State for override confirmation modal (when user has already generated investigations)
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [isCheckingGeneration, setIsCheckingGeneration] = useState(false);

  // Check if we're in development mode
  // Vite uses import.meta.env.DEV for development mode detection
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

  // Check if there are any unsaved changes
  const hasUnsavedChangesFlag = Object.keys(unsavedChanges).length > 0;

  // Browser refresh/close warning
  useBeforeUnload(
    useCallback(
      (e) => {
        if (hasUnsavedChangesFlag) {
          e.preventDefault();
        }
      },
      [hasUnsavedChangesFlag]
    )
  );

  // Browser back button interception
  useBrowserNavigationBlocker({
    isBlocked: hasUnsavedChangesFlag,
    onBlock: () => {
      setShowUnsavedChangesModal(true);
      setPendingNavigation(() => () => window.history.back());
    },
  });

  // Logging utility for debugging data flow
  const logDataFlow = (event, data) => {
    if (isDevelopment) {
      // eslint-disable-next-line no-console
    }
  };

  // SERVER FIRST: Removed mergeNotes, mergeCEPathwayAnswers, mergeResidentsData functions
  // Server data is the single source of truth - no local merging needed

  const currentSurveyId = surveyIdLocal || localStorage.getItem("currentSurveyId");

  const indexedDBData = null;
  const isIndexedDBLoading = false;
  const indexedDBError = null;

  // Debug: Log liveQuery state changes (only in development)
  useEffect(() => {
    if (isDevelopment) {
      logDataFlow('LiveQuery State', {
        hasData: !!indexedDBData,
        isLoading: isIndexedDBLoading,
        hasError: !!indexedDBError,
        surveyId: currentSurveyId,
        residentCount: indexedDBData?.residents?.length || 0,
      });
    }
  }, [indexedDBData, isIndexedDBLoading, indexedDBError, currentSurveyId, isDevelopment]);


  // SERVER-FIRST: No local merge logic - API data is the single source of truth

  // Check if data exists in store on mount and validate survey ID match
  useEffect(() => {
    const currentSurveyId = localStorage.getItem("currentSurveyId");
    const storeSurveyId = surveyId; // Get surveyId from store

    // CRITICAL: Check if survey ID has changed or doesn't match
    // If currentSurveyId exists and is different from store's surveyId, clear old data
    // Also clear if we have residents but no surveyId in store (orphaned data)
    const hasSurveyIdMismatch =
      currentSurveyId &&
      (storeSurveyId !== currentSurveyId || (residents.length > 0 && !storeSurveyId));

    if (hasSurveyIdMismatch) {
      clearStore();
      // Set the new survey ID in store
      setSurveyId(currentSurveyId);
      setIsLoadingFromSocket(true); // Need to fetch new data
      return;
    }

    // If we have a matching survey ID and residents, use them
    if (currentSurveyId && storeSurveyId === currentSurveyId && residents.length > 0) {
      setIsLoadingFromSocket(false); // Data exists, no need to show loading
    } else if (currentSurveyId && !storeSurveyId) {
      // Current survey ID exists but store doesn't have it - set it
      setSurveyId(currentSurveyId);
      setIsLoadingFromSocket(true); // Need to fetch data
    } else {
      setIsLoadingFromSocket(true); // Show loading while waiting for socket data
    }
  }, [surveyId, residents.length, clearStore, setSurveyId]);

  // Fetch roles to create ID to name mapping
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await authAPI.getRoles();
        if (response && response.statusCode === 200 && response.data) {
          const idToName = {};
          response.data.forEach((role) => {
            idToName[role._id] = role.name;
          });
          setRoleIdToName(idToName);

        }
      } catch (error) {

        // Silently fail - don't disrupt user experience
      }
    };

    fetchRoles();
  }, []);

  // Fetch team members from API
  useEffect(() => {
    const fetchTeamMembers = async () => {
      const surveyId = surveyIdLocal || localStorage.getItem("currentSurveyId");
      if (!surveyId) return;
      
      try {
        const response = await surveyAPI.viewTeamMembersInSurvey(surveyId);
        if (response && (response.success || response.status === true || response.statusCode === 200)) {
          const apiTeamMembers = response.data || [];
          
          // Get current residents to derive assignedResidents
          const currentResidents = useResidentInvestigationStore.getState().residents;
          
          // Map the API response to ensure consistent structure
          const mappedTeamMembers = apiTeamMembers.map((member) => {
            const memberId = member.teamMemberUserId || member._id || member.id;
            
            // Derive assignedResidents from current residents data
            const assignedResidentIds = currentResidents
              .filter(r => {
                const residentTeamMemberId = r.assignedTeamMemberId || r.teamMemberUserId;
                if (!residentTeamMemberId) return false;
                const normalizedResidentTmId = typeof residentTeamMemberId === 'object' 
                  ? (residentTeamMemberId._id || residentTeamMemberId.id) 
                  : residentTeamMemberId;
                return String(normalizedResidentTmId) === String(memberId);
              })
              .map(r => String(r.id || r.generatedId));
            
            return {
              id: String(member._id || member.id),
              _id: member._id || member.id,
              name: member.name || member.firstName || "Unknown",
              firstName: member.name || member.firstName || "",
              lastName: member.lastName || "",
              email: member.email || "",
              phone: member.phone || "",
              role: member.role || "",
              specialization: member.specialization || "",
              teamCoordinator: member.teamCoordinator || false,
              invited: member.invited || false,
              surveyId: member.surveyId || "",
              // Use the proper teamMemberUserId from API (this is the UUID)
              teamMemberUserId: memberId,
              assignedFacilityTasks: member.assignedFacilityTasks || [],
              // Use derived assignedResidents or fall back to API response
              assignedResidents: assignedResidentIds.length > 0 ? assignedResidentIds : (member.assignedResidents || []),
            };
          });
          
          setTeamMembers(mappedTeamMembers);
        }
      } catch (error) {
        // Silently fail - team members will be loaded from investigations response if available
      }
    };

    fetchTeamMembers();
  }, [surveyIdLocal]);

  // Helper to process investigation data (shared between API and Socket)
  const processInvestigationData = async (data) => {
    // Update team members if they exist in the response
    if (data?.teamMembers && Array.isArray(data.teamMembers)) {
      const formattedTeamMembers = data.teamMembers.map((member) => ({
        id: String(member.id || member._id),
        name: member.name || "",
        email: member.email || "",
        role: member.role || "",
        assignedFacilityTasks: member.assignedFacilityTasks || [],
        assignedResidents: member.assignedResidents || [],
        updatedAt: member.updatedAt || new Date().toISOString(),
      }));
      setTeamMembers(formattedTeamMembers);
    }

    // SERVER-FIRST: Update store with residents data from server response
    if (data?.investigationSurvey?.residents !== undefined) {
      const serverResidents = data.investigationSurvey.residents || [];

      // Stop loading indicator since we received a response (even if empty)
      setIsLoadingFromSocket(false);

      // Update surveyId in store to match current survey
      const currentSurveyId = surveyId || localStorage.getItem("currentSurveyId");
      if (currentSurveyId) {
        setSurveyId(currentSurveyId);
      }

      // SERVER-FIRST: Use server data directly - no local merge
      setResidents(serverResidents);

      logDataFlow("Server Data Received", {
        surveyId: currentSurveyId,
        residentCount: serverResidents.length,
      });

      // If there's a selected resident, update it with server data
      const currentSelectedResident =
        useResidentInvestigationStore.getState().selectedResident;
      if (currentSelectedResident) {
        const updatedSelectedResident = serverResidents.find(
          (r) => r.id === currentSelectedResident.id
        );
        if (updatedSelectedResident) {
          setSelectedResident(updatedSelectedResident);
        }
      }
    }
  };

  // Fetch saved investigations from API
  const fetchSavedInvestigations = async (isBackgroundSync = false) => {
    const surveyId = surveyIdLocal || localStorage.getItem("currentSurveyId");
    if (!surveyId) return;

    try {
      if (!isBackgroundSync) setIsLoadingFromSocket(true);
      // Use getSavedInvestigations as requested (viewInvestigations endpoint)
      const response = await healthAssistantAPI.getSavedInvestigations(surveyId);

      if (response.success && response.data) {
        let processedData = response.data;

        // Handle investigate array from viewInvestigations endpoint
        if (response.data.investigate && Array.isArray(response.data.investigate)) {
          const mappedResidents = response.data.investigate.map(resident => ({
            ...resident,
            id: resident.generatedId || resident._id || resident.id,
            investigations: Array.isArray(resident.investigations)
              ? resident.investigations.map(inv => ({
                ...inv,
                surveyorStatus: inv.surveyorStatus, // Explicitly map surveyorStatus
                cePathwayAnswers: inv.cePathwayAnswers || {},
                overallNotes: inv.overallNotes || ""
              }))
              : [],
            notes: resident.notes || [],
            attachments: resident.attachments || []
          }));

          processedData = {
            investigationSurvey: {
              residents: mappedResidents
            }
          };
        }
        // If the response has residents at the root level, wrap it for processInvestigationData
        else if (response.data.residents && !response.data.investigationSurvey) {
          processedData = {
            ...response.data,
            investigationSurvey: {
              residents: response.data.residents
            }
          };
        }
        // Handle array response format (fallback)
        else if (Array.isArray(response.data)) {
          const mappedResidents = response.data.map(resident => ({
            ...resident,
            id: resident.generatedId || resident._id || resident.id, // Map generatedId back to id
            // Ensure investigations array exists
            investigations: Array.isArray(resident.investigations)
              ? resident.investigations.map(inv => ({
                ...inv,
                surveyorStatus: inv.surveyorStatus, // Explicitly map surveyorStatus
                cePathwayAnswers: inv.cePathwayAnswers || {},
                overallNotes: inv.overallNotes || ""
              }))
              : [],
            // Ensure other fields are preserved
            notes: resident.notes || [],
            attachments: resident.attachments || []
          }));

          processedData = {
            investigationSurvey: {
              residents: mappedResidents
            }
          };
        }

        await processInvestigationData(processedData);
      }
    } catch (error) {
      // console.error("Failed to fetch saved investigations:", error);
      // Don't show error toast to avoid spamming user if they are offline or API fails
    } finally {
      if (!isBackgroundSync) setIsLoadingFromSocket(false);
    }
  };

  // Initial data fetch (polling removed)
  useEffect(() => {
    // Initial fetch only
    fetchSavedInvestigations();
  }, []); // Empty dependency array - only run once on mount

  // Load weight calculator data when resident is selected
  useEffect(() => {
    if (selectedResident?.weightCalculatorData) {
      setWeightCalculatorState(selectedResident.weightCalculatorData);
    } else {
      // Reset to default state
      setWeightCalculatorState({
        previousWeight: "",
        currentWeight: "",
        previousDate: null,
        currentDate: null,
        weightChange: 0,
        weightChangePercent: 0,
        daysBetween: 0,
        monthlyProjection: 0,
      });
    }
  }, [selectedResident?.id]);

  // Load body map observations when resident is selected
  useEffect(() => {
    if (selectedResident?.bodyMapObservations) {
      setDrawingToolState((prev) => ({
        ...prev,
        observations: selectedResident.bodyMapObservations,
      }));
    } else {
      setDrawingToolState((prev) => ({
        ...prev,
        observations: [],
      }));
    }
  }, [selectedResident?.id]);

  // Body Map Handlers
  const handleBodyMapClick = (x, y, location) => {
    setDrawingToolState((prev) => ({
      ...prev,
      currentObservation: {
        ...prev.currentObservation,
        location: location,
        x: x,
        y: y,
        size: prev.selectedSize,
        color: prev.selectedColor,
      },
    }));
  };

  const handleAddObservation = () => {
    const newObservation = {
      id: Date.now(),
      ...drawingToolState.currentObservation,
      timestamp: new Date().toISOString(),
    };

    const updatedObservations = [
      ...drawingToolState.observations,
      newObservation,
    ];

    setDrawingToolState((prev) => ({
      ...prev,
      observations: updatedObservations,
      currentObservation: {
        type: "",
        location: "",
        description: "",
        severity: "",
        x: 0,
        y: 0,
        size: 8,
        color: "#EF4444",
      },
    }));

    // Save to store
    handleBodyMapUpdate(updatedObservations);
    toast.success("Observation added successfully");
  };

  const handleRemoveObservation = (observationId) => {
    const updatedObservations = drawingToolState.observations.filter(
      (obs) => obs.id !== observationId
    );
    setDrawingToolState((prev) => ({
      ...prev,
      observations: updatedObservations,
    }));
    handleBodyMapUpdate(updatedObservations);
    toast.success("Observation removed");
  };

  const handleObservationClick = (observation) => {
    setDrawingToolState((prev) => ({
      ...prev,
      currentObservation: {
        ...observation,
      },
    }));
  };

  const handleClearCanvas = () => {
    setDrawingToolState((prev) => ({
      ...prev,
      observations: [],
      currentObservation: {
        type: "",
        location: "",
        description: "",
        severity: "",
        x: 0,
        y: 0,
        size: 8,
        color: "#EF4444",
      },
    }));
    handleBodyMapUpdate([]);
    toast.success("Canvas cleared");
  };

  // Check if user has already generated investigations before proceeding
  const handleGenerateResidentsClick = async () => {
    if (!surveyIdLocal) {
      toast.error("Survey ID not found. Please refresh and try again.");
      return;
    }

    setIsCheckingGeneration(true);
    try {
      const response = await surveyAPI.surveyCheck(surveyIdLocal);
      
      if (response.status && response.statusCode === 200 && response.data) {
        const { investigation } = response.data;
        
        if (investigation) {
          // User has already generated investigations - show confirmation modal
          setShowOverrideModal(true);
        } else {
          // No existing investigations - proceed directly
          await fetchResidents();
        }
      } else {
        // If check fails, proceed anyway (fail-safe)
        await fetchResidents();
      }
    } catch (error) {
      // If API fails, proceed with generation (fail-safe)
     
      await fetchResidents();
    } finally {
      setIsCheckingGeneration(false);
    }
  };

  // Handle confirmation to override existing data
  const handleConfirmOverride = async () => {
    setShowOverrideModal(false);
    await fetchResidents();
  };

  // fetch residents from api (actual generation)
  const fetchResidents = async () => {
    try {
      setIsLoading(true);
      setSurveyId(surveyIdLocal);

      // Use getFinalSampleInvestigation for generating residents
      const response = await healthAssistantAPI.getFinalSampleInvestigation(surveyIdLocal);

      if (response.success && response.data) {
        let processedData = response.data;

        // Handle investigate array from viewInvestigations endpoint
        if (response.data.investigate && Array.isArray(response.data.investigate)) {
          const mappedResidents = response.data.investigate.map(resident => ({
            ...resident,
            id: resident.generatedId || resident._id || resident.id,
            investigations: Array.isArray(resident.investigations)
              ? resident.investigations.map(inv => ({
                ...inv,
                surveyorStatus: inv.surveyorStatus, // Explicitly map surveyorStatus
                cePathwayAnswers: inv.cePathwayAnswers || {},
                overallNotes: inv.overallNotes || ""
              }))
              : [],
            notes: resident.notes || [],
            attachments: resident.attachments || []
          }));

          processedData = {
            investigationSurvey: {
              residents: mappedResidents
            }
          };
        }
        // If the response has residents at the root level, wrap it for processInvestigationData
        else if (response.data.residents && !response.data.investigationSurvey) {
          processedData = {
            ...response.data,
            investigationSurvey: {
              residents: response.data.residents
            }
          };
        }
        // Handle array response format (fallback)
        else if (Array.isArray(response.data)) {
          const mappedResidents = response.data.map(resident => ({
            ...resident,
            id: resident.generatedId || resident._id || resident.id,
            investigations: Array.isArray(resident.investigations)
              ? resident.investigations.map(inv => ({
                ...inv,
                surveyorStatus: inv.surveyorStatus, // Explicitly map surveyorStatus
                cePathwayAnswers: inv.cePathwayAnswers || {},
                overallNotes: inv.overallNotes || ""
              }))
              : [],
            notes: resident.notes || [],
            attachments: resident.attachments || []
          }));

          processedData = {
            investigationSurvey: {
              residents: mappedResidents
            }
          };
        }

        await processInvestigationData(processedData);

        // Auto-save the generated residents to persist them
        // Need to wait for store to update, then save
        setTimeout(async () => {
          try {
            const generatedResidents = processedData?.investigationSurvey?.residents || [];
            if (generatedResidents.length > 0) {
              // Prepare minimal save payload
              const savePayload = {
                surveyId: surveyIdLocal,
                status: "investigations",
                residents: generatedResidents.map(resident => ({
                  generatedId: resident.id || resident.generatedId,
                  name: resident.name,
                  room: resident.room || "",
                  admissionDate: resident.admissionDate || "",
                  isNewAdmission: resident.isNewAdmission || false,
                  included: resident.included !== undefined ? resident.included : true,
                  risks: resident.risks || [],
                  surveyId: surveyIdLocal,
                  teamMemberUserId: resident.teamMemberUserId 
                    ? (typeof resident.teamMemberUserId === 'object' 
                        ? resident.teamMemberUserId._id 
                        : resident.teamMemberUserId)
                    : null,
                  investigations: resident.investigations || [],
                  bodyMapObservations: resident.bodyMapObservations || [],
                  weightCalculatorData: resident.weightCalculatorData || null,
                  generalSurveyorNotes: resident.generalSurveyorNotes || "",
                }))
              };

              // Use saveInvestigationResidents for team leads (this is the generate action)
              const saveResponse = await healthAssistantAPI.saveInvestigationResidents(savePayload);
              if (saveResponse.success || saveResponse.statusCode === 200) {
                toast.success("Residents generated and saved successfully", {
                  description: `Generated and saved ${generatedResidents.length} residents for investigation.`,
                  duration: 3000,
                });
              } else {
                toast.success("Residents generated successfully", {
                  description: `Generated ${generatedResidents.length} residents for investigation.`,
                  duration: 3000,
                });
                toast.warning("Could not auto-save. Please save manually.", {
                  duration: 4000,
                });
              }
            }
          } catch (saveError) {
            // Still show success for generation even if save fails
            toast.success("Residents generated successfully", {
              duration: 3000,
            });
            toast.warning("Could not auto-save the residents. Please save manually.", {
              duration: 4000,
            });
          }
        }, 100);
      }
    } catch (error) {
      // console.error("Failed to fetch residents:", error);
      toast.error("Failed to generate residents. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const prepareInvestigationPayload = () => {
    const surveyId = surveyIdLocal || localStorage.getItem("currentSurveyId");

    if (!surveyId) {
      throw new Error("Survey ID is required to save investigation data");
    }

    // Get current user info
    const currentUser = getCurrentUser();
    const isInvited = isInvitedUser();
    const currentUserId = currentUser?._id;

    // Helper function to check if resident is assigned to current user
    const isResidentAssignedToMe = (resident) => {
      if (!currentUserId) return false;
      // Check if teamMemberUserId is a populated object
      if (resident.teamMemberUserId && typeof resident.teamMemberUserId === 'object') {
        return String(resident.teamMemberUserId._id) === String(currentUserId);
      }
      // Check if teamMemberUserId is just an ID string
      if (resident.teamMemberUserId && typeof resident.teamMemberUserId === 'string') {
        return String(resident.teamMemberUserId) === String(currentUserId);
      }
      // Fallback: check assignedTeamMemberId
      if (resident.assignedTeamMemberId) {
        return String(resident.assignedTeamMemberId) === String(currentUserId);
      }
      return false;
    };

    // CRITICAL FIX: Only include residents that:
    // 1. Team member is assigned to, OR
    // 2. Team lead has modified (has unsaved changes), OR
    // 3. Team lead (always include all for team lead)
    const residentsToInclude = isInvited
      ? residents.filter((resident) =>
        isResidentAssignedToMe(resident) &&
        (unsavedChanges[resident.id] || Object.keys(unsavedChanges).length === 0)
      )
      : residents; // Team lead sends all residents

    // Build residents payload with only relevant residents
    const residentsPayload = residentsToInclude.map((resident) => {
      // Check if this resident has unsaved changes
      const hasUnsavedChanges = unsavedChanges[resident.id];

      // Only include investigation data if:
      // - Team member is assigned to this resident, OR
      // - Has unsaved changes, OR
      // - Is team lead
      const shouldIncludeInvestigationData =
        !isInvited ||
        isResidentAssignedToMe(resident) ||
        hasUnsavedChanges;

      // Transform probes to include all updated data (user's answers, status, notes)
      const transformedProbes = shouldIncludeInvestigationData && resident.investigations
        ? resident.investigations.map((probe) => {
          // Build probe object matching expected payload structure
          const probeObj = {
            title: probe.title,
            description: probe.description,
            status: probe.status || "Not Started",
            required: probe.required !== undefined ? probe.required : true,
            relatedType: probe.relatedType,
            ftag: probe.ftag,
            pathwayName: probe.pathwayName,
            // Use CE_pathway_questions directly as it now contains the answers
            CE_pathway_questions:
              probe.CE_pathway_questions || probe.cePathwayQuestions || {},
            // Include user-updated data
            surveyorStatus: probe.surveyorStatus || null,
            overallNotes: probe.overallNotes || "",
          };

          // Remove undefined values and null surveyorStatus
          Object.keys(probeObj).forEach((key) => {
            if (probeObj[key] === undefined) {
              delete probeObj[key];
            }
          });

          // Remove surveyorStatus if null
          if (probeObj.surveyorStatus === null) {
            delete probeObj.surveyorStatus;
          }

          return probeObj;
        })
        : []; // Empty array if not assigned or no changes

      // Preserve existing teamMemberUserId - extract the _id if it's a populated object
      const existingTeamMemberUserId = resident.teamMemberUserId
        ? (typeof resident.teamMemberUserId === 'object'
          ? resident.teamMemberUserId._id
          : resident.teamMemberUserId)
        : null;

      return {
        generatedId: resident.id,
        name: resident.name,
        room: resident.room || "",
        admissionDate: resident.admissionDate || "",
        isNewAdmission: resident.isNewAdmission || false,
        included: resident.included !== undefined ? resident.included : true,
        risks: resident.risks || [],
        surveyId: surveyId,
        // Team member saves their own ID, team lead preserves existing assignment
        teamMemberUserId: isInvited ? (currentUser?._id || null) : existingTeamMemberUserId,

        investigations: transformedProbes,
        // Only include resident-specific data if assigned or has changes
        bodyMapObservations: shouldIncludeInvestigationData
          ? (resident.bodyMapObservations || [])
          : [],
        weightCalculatorData: shouldIncludeInvestigationData
          ? resident.weightCalculatorData || null
          : null,
        generalSurveyorNotes: shouldIncludeInvestigationData
          ? (resident.generalSurveyorNotes || "")
          : "",
      };
    });

    // Get assigned resident IDs for metadata (computed from residentsToInclude for team members)
    const assignedResidentIds = isInvited
      ? residentsToInclude.map(r => String(r.id))
      : [];

    // Prepare final payload matching JSON structure
    const finalPayload = {
      submittedAt: new Date().toISOString(),
      isPageClosed: false,
      surveyId: surveyId,
      currentStep: "investigations",
      residents: residentsPayload,
      // Add metadata about who is saving
      savedBy: {
        userId: currentUser?._id || null,
        isTeamLead: !isInvited,
        assignedResidents: assignedResidentIds,
      },
    };

    // Log the payload preparation
    logDataFlow('Preparing Payload', {
      surveyId,
      residentCount: residentsPayload.length,
      assignedResidents: assignedResidentIds,
      hasUnsavedChanges: Object.keys(unsavedChanges).length > 0,
      isTeamLead: !isInvited,
    });

    return finalPayload;
  };

  /**
   * Save investigation data to API
   */
  const saveInvestigation = async () => {
    try {
      if (residents.length === 0) {
        toast.error("No residents data to save");
        return;
      }

      // Validate that notes are provided for all "Not Met" probes
      const missingNotesProbes = [];
      residents.forEach((resident) => {
        resident.investigations?.forEach((probe, probeIndex) => {
          if (probe.surveyorStatus === "Not Met" && (!probe.overallNotes || probe.overallNotes.trim() === "")) {
            missingNotesProbes.push({
              residentName: resident.name,
              probeTitle: probe.title,
            });
          }
        });
      });

      if (missingNotesProbes.length > 0) {
        const firstMissing = missingNotesProbes[0];
        toast.error("Additional notes are required for 'Not Met' probes", {
          description: `Please add notes for "${firstMissing.probeTitle}" (${firstMissing.residentName})${missingNotesProbes.length > 1 ? ` and ${missingNotesProbes.length - 1} other(s)` : ""}`,
          duration: 5000,
        });
        return;
      }

      const surveyId = surveyIdLocal || localStorage.getItem("currentSurveyId");
      if (!surveyId) {
        toast.error(
          "Survey ID is required. Please ensure you have an active survey."
        );
        return;
      }

      //   setIsLoading(true);

      // Prepare the payload - this matches the structure in letsRefactor.json
      const payload = prepareInvestigationPayload();

      // Log the save operation
      logDataFlow('Saving Investigation', {
        surveyId: payload.surveyId,
        residentCount: payload.residents.length,
        savedBy: payload.savedBy,
      });

      // Get current user ID for socket operations
      const currentUser = getCurrentUser();
      const currentUserId = currentUser?._id || null;

      if (!currentUserId) {
        throw new Error(
          "User ID is required. Please ensure you are logged in."
        );
      }

      // Set loading state and show loading toast
      setJoinTeamLeadLoading(true);
      toast.loading("Saving investigation data...", {
        id: "saving-investigation",
      });

      // Check if user is team lead (not invited)
      const isInvited = isInvitedUser();



      // Prepare payload based on user role
      let apiPayload;
      if (!isInvited) {
        // Team Lead Payload
        apiPayload = {
          surveyId: payload.surveyId,
          status: "investigations",
          residents: payload.residents
        };
      } else {
        // Team Member Payload
        apiPayload = {
          surveyId: payload.surveyId,
          residents: payload.residents
        };
      }

      // 1. Save to IndexedDB first (Offline-First)
      try {
        await saveSurveyStepData(payload.surveyId, 6, {
          residents: payload.residents,
          lastUpdated: new Date().toISOString()
        });
       
      } catch (dbError) {
        ///console.warn("Failed to save to IndexedDB:", dbError);
        // Continue to API attempt even if DB save fails
      }

      // 2. Check online status
      if (!navigator.onLine) {
        // Offline: Queue for sync
        await surveyIndexedDB.addToSyncQueue(
          payload.surveyId,
          `investigation_submission_${Date.now()}`,
          apiPayload,
          'api_investigation_submission'
        );

        setJoinTeamLeadLoading(false);
        toast.dismiss("saving-investigation");
        toast.success("Saved offline. Will sync when online.");

        // Clear unsaved changes
        setUnsavedChanges({});
        return;
      }

      // 3. Online: Try API
      try {
        let response;
        if (!isInvited) {
          response = await healthAssistantAPI.saveInvestigationResidents(apiPayload);
        } else {
          response = await healthAssistantAPI.saveInvestigationTeamMember(apiPayload);
        }

    

        if (response.success) {
          // Clear loading state and show success toast
          setJoinTeamLeadLoading(false);
          toast.dismiss("saving-investigation");
          toast.success("Investigation data saved successfully");

          // Clear unsaved changes flags since we successfully saved to DB
          setUnsavedChanges({});

          // Refresh data (SSOT)
          fetchSavedInvestigations();
        } else {
          // Show server error message to user
        
          setJoinTeamLeadLoading(false);
          toast.dismiss("saving-investigation");
          toast.error(response.message || "Failed to save investigation data");
          return; // Don't queue for offline sync if it's an authorization error
        }
      } catch (apiError) {
        

        // Extract error message from API response - check multiple possible locations
        const errorMessage = apiError?.response?.data?.message ||
          apiError?.data?.message ||
          apiError?.message ||
          "Failed to save investigation data";

        // Check if it's an authorization/validation error (4xx status codes)
        // These should NOT be queued for offline sync as they will fail again
        const statusCode = apiError?.response?.status ||
          apiError?.response?.data?.statusCode ||
          apiError?.status ||
          apiError?.statusCode;

        // Check for client errors by:
        // 1. HTTP status code 4xx
        // 2. Response explicitly says status: false
        // 3. Error message contains authorization/validation keywords (from thrown errors)
        const authorizationKeywords = [
          'not authorized',
          'unauthorized',
          'forbidden',
          'permission denied',
          'access denied',
          'only the survey creator',
          'team coordinator',
          'validation failed',
          'invalid',
          'not allowed'
        ];

        const messageContainsAuthError = authorizationKeywords.some(keyword =>
          errorMessage.toLowerCase().includes(keyword.toLowerCase())
        );

        const isClientError = (statusCode && statusCode >= 400 && statusCode < 500) ||
          apiError?.response?.data?.status === false ||
          apiError?.data?.status === false ||
          messageContainsAuthError;

        if (isClientError) {
          // Show the server error message to the user
          // Clean up the error message if it has a prefix like "Failed to save investigation residents: "
          const cleanedMessage = errorMessage.replace(/^Failed to save.*?:\s*/i, '');
          setJoinTeamLeadLoading(false);
          toast.dismiss("saving-investigation");
          toast.error(cleanedMessage || "Failed to save investigation data");
          return; // Don't queue for sync - it will fail again with same error
        }

        // Server error (5xx) or network error - Queue for sync
        await surveyIndexedDB.addToSyncQueue(
          payload.surveyId,
          `investigation_submission_${Date.now()}`,
          apiPayload,
          'api_investigation_submission'
        );

        setJoinTeamLeadLoading(false);
        toast.dismiss("saving-investigation");
        toast.success("Saved offline (API failed). Will sync when online.");

        // Trigger background sync
        surveySyncService.syncUnsyncedData();

        // Clear unsaved changes
        setUnsavedChanges({});
      }
    } catch (error) {

      setJoinTeamLeadLoading(false);
      toast.dismiss("saving-investigation");
      toast.error(error.message || "Failed to save investigation data");
      setIsLoading(false);
    }
  };

  // Helper function to mark a resident/probe as having unsaved changes
  const markAsUnsaved = (residentId, probeIndex = null) => {
    setUnsavedChanges((prev) => {
      const updated = { ...prev };
      if (!updated[residentId]) {
        updated[residentId] = {};
      }
      if (probeIndex !== null) {
        updated[residentId][probeIndex] = true;
      } else {
        // Mark entire resident as having unsaved changes
        updated[residentId] = { all: true };
      }
      return updated;
    });
  };

  // Helper function to clear unsaved changes for a resident (after successful save)
  const clearUnsavedChanges = (residentId) => {
    setUnsavedChanges((prev) => {
      const updated = { ...prev };
      delete updated[residentId];
      return updated;
    });
  };

  // Wrapper functions that track unsaved changes
  const handleProbeStatusChange = (probeIndex, status) => {
    if (selectedResident) {
      markAsUnsaved(selectedResident.id, probeIndex);
      updateProbeStatus(probeIndex, status);
    }
  };

  const handleCEPathwayAnswerUpdate = (
    probeIndex,
    category,
    questionIndex,
    isChecked,
    notes = null
  ) => {
    if (selectedResident) {
      markAsUnsaved(selectedResident.id, probeIndex);

      // Update local state directly since we are moving away from separate answers store
      const updatedResidents = residents.map(r => {
        if (r.id === selectedResident.id) {
          const updatedInvestigations = [...(r.investigations || [])];
          if (updatedInvestigations[probeIndex]) {
            const probe = { ...updatedInvestigations[probeIndex] };
            // Handle both naming conventions
            const questions = { ...(probe.CE_pathway_questions || probe.cePathwayQuestions || {}) };

            if (questions[category] && questions[category][questionIndex]) {
              const updatedQuestions = [...questions[category]];
              updatedQuestions[questionIndex] = {
                ...updatedQuestions[questionIndex],
                checked: isChecked,
                notes: notes !== null ? notes : (updatedQuestions[questionIndex].notes || "")
              };
              questions[category] = updatedQuestions;
              probe.CE_pathway_questions = questions;
              // Ensure we don't duplicate keys
              if (probe.cePathwayQuestions) delete probe.cePathwayQuestions;

              updatedInvestigations[probeIndex] = probe;
            }
            return { ...r, investigations: updatedInvestigations };
          }
        }
        return r;
      });

      setResidents(updatedResidents);

      // Update selected resident reference
      const updatedSelected = updatedResidents.find(r => r.id === selectedResident.id);
      if (updatedSelected) {
        setSelectedResident(updatedSelected);
      }
    }
  };

  const handleProbeNotesChange = (probeIndex, notes) => {
    if (selectedResident) {
      markAsUnsaved(selectedResident.id, probeIndex);
      updateProbeNotes(probeIndex, notes);
    }
  };

  const handleWeightCalculatorUpdate = (weightData) => {
    if (selectedResident) {
      markAsUnsaved(selectedResident.id);
      updateWeightCalculatorData(weightData);
    }
  };

  const handleBodyMapUpdate = (observations) => {
    if (selectedResident) {
      markAsUnsaved(selectedResident.id);
      updateBodyMapObservations(observations);
    }
  };

  const handleGeneralNotesChange = (notes) => {
    if (selectedResident) {
      markAsUnsaved(selectedResident.id);
      updateGeneralNotes(notes);
    }
  };

  // Handler for "Keep my changes" option in unsaved changes modal
  const handleKeepUnsavedChanges = () => {
    toast.success("Your changes have been preserved", { duration: 2000 });
  };

  // Handler for "Fetch server data" option - fetches fresh data from server
  const handleFetchServerData = async () => {
    try {
      // Fetch fresh data from server
      await fetchSavedInvestigations(false);

      toast.success("Fresh data loaded from server", { duration: 2000 });
    } catch (error) {
      toast.error("Failed to fetch server data. Please try again.");
    }
  };

  // Helper function to get role name from ID
  const getRoleName = (roleId) => {
    if (!roleId) return null;
    return roleIdToName[roleId] || roleId; // Return ID if name not found
  };

  // Helper function to get assigned team member for a resident
  const getAssignedTeamMember = (resident) => {
    if (!resident) return null;

    // First check if teamMemberUserId is a populated object (from API response)
    // This contains the full team member data: { _id, firstName, lastName, email, ... }
    if (resident.teamMemberUserId && typeof resident.teamMemberUserId === 'object') {
      const tm = resident.teamMemberUserId;
      const fullName = `${tm.firstName || ''} ${tm.lastName || ''}`.trim();
      return {
        id: tm._id || tm.id,
        name: fullName || tm.email || 'Team Member',
        email: tm.email,
        firstName: tm.firstName,
        lastName: tm.lastName,
        roleName: tm.roleName || getRoleName(tm.role),
      };
    }

    // If teamMemberUserId is just an ID string, look it up in teamMembers
    // The teamMemberUserId on residents matches the teamMemberUserId on team members (user's _id)
    if (resident.teamMemberUserId && typeof resident.teamMemberUserId === 'string' && teamMembers.length) {
      const member = teamMembers.find(
        (m) => String(m.teamMemberUserId) === String(resident.teamMemberUserId) ||
               String(m.id) === String(resident.teamMemberUserId) || 
               String(m._id) === String(resident.teamMemberUserId)
      );
      if (member) {
        return {
          ...member,
          name: member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email,
          roleName: getRoleName(member.role),
        };
      }
    }

    // Fallback: Check if resident has assignedTeamMemberId
    if (resident.assignedTeamMemberId && teamMembers.length) {
      const member = teamMembers.find(
        (m) => String(m.teamMemberUserId) === String(resident.assignedTeamMemberId) ||
               String(m.id) === String(resident.assignedTeamMemberId)
      );
      if (member) {
        return {
          ...member,
          name: member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email,
          roleName: getRoleName(member.role),
        };
      }
    }

    // Check if resident is in any team member's assignedResidents list
    if (teamMembers.length) {
      const assignedMember = teamMembers.find((member) =>
        member.assignedResidents?.some(
          (residentId) => String(residentId) === String(resident.id)
        )
      );

      if (assignedMember) {
        return {
          ...assignedMember,
          name: assignedMember.name || `${assignedMember.firstName || ''} ${assignedMember.lastName || ''}`.trim() || assignedMember.email,
          roleName: getRoleName(assignedMember.role),
        };
      }
    }

    return null;
  };

  // Filter residents based on user type (team members only see assigned residents)
  const getFilteredResidents = () => {
    // CRITICAL: Validate survey ID before using residents
    // If survey ID doesn't match, don't use old residents from different survey
    const currentSurveyId = localStorage.getItem("currentSurveyId");
    const storeSurveyId = surveyId; // From store

    if (currentSurveyId && storeSurveyId !== currentSurveyId) {
      // Don't use residents from a different survey
      return [];
    }

    // If we have residents but no surveyId in store, they might be orphaned
    if (residents.length > 0 && !storeSurveyId && currentSurveyId) {
      return [];
    }

    const isInvited = isInvitedUser();

    if (!isInvited) {
      // Team lead sees all residents
      return residents;
    }

    // Team members only see their assigned residents
    // Get current user ID to match against resident's teamMemberUserId
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?._id;

    if (!currentUserId) {
      return [];
    }

    // Filter residents where teamMemberUserId matches current user
    const filtered = residents.filter((resident) => {
      // Check if teamMemberUserId is a populated object (from API response)
      if (resident.teamMemberUserId && typeof resident.teamMemberUserId === 'object') {
        return String(resident.teamMemberUserId._id) === String(currentUserId);
      }
      // Check if teamMemberUserId is just an ID string
      if (resident.teamMemberUserId && typeof resident.teamMemberUserId === 'string') {
        return String(resident.teamMemberUserId) === String(currentUserId);
      }
      // Fallback: check assignedTeamMemberId
      if (resident.assignedTeamMemberId) {
        return String(resident.assignedTeamMemberId) === String(currentUserId);
      }
      return false;
    });

    return filtered;
  };

  const filteredResidents = getFilteredResidents();

  const handleResidentClick = (resident) => {

    setSelectedResident(resident);
    // Extract CE_pathway_questions from the resident's investigations/probes
    if (resident.investigations && resident.investigations.length > 0) {
      const questions = resident.investigations
        .map((probe) => probe.CE_pathway_questions)
        .filter(Boolean);
      setCE_pathway_questions(questions);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Action Button */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="mb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Investigations</h1>

          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-5xl">
            In this step, you'll complete resident and care area investigations
            using the Critical Element Pathways. Start by identifying the
            concern, select the correct pathway, and follow the steps to gather
            information through observation, interviews, and record review.
            Cross-check your findings and document them in the pathway, linking
            results to regulatory requirements
          </p>
        </div>
        <div className="flex items-center gap-3 mt-6 mb-6">
          {/* Sync button for fetching saved investigation data */}
          <button
              onClick={async () => {
                setIsSyncingData(true);
                await fetchSavedInvestigations(false);
                setIsSyncingData(false);
              }}
              disabled={isSyncingData || isLoading}
              className="px-3 py-1.5 text-xs sm:text-sm bg-sky-800 text-white rounded-md font-medium hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
            >
              {isSyncingData && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSyncingData ? 'Syncing...' : 'Sync Investigation Data'}
            </button>
          {/* Show "Get Residents" button always for team leads (for fetching fresh data) */}
          {!isInvitedUser() && (
            <button
              onClick={handleGenerateResidentsClick}
              disabled={isLoading || isCheckingGeneration}
              className="px-3 py-1.5 text-xs sm:text-sm border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isCheckingGeneration ? "Checking..." : isLoading ? "Generating..." : "Get Residents"}
            </button>
          )}
        </div>
      </div>



      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-120px)]">
        {/* Mobile: Resident List Toggle Button - Always show on mobile */}
        <button
          onClick={() => setIsResidentListDrawerOpen(true)}
          className="lg:hidden w-full bg-white hover:bg-gray-50 border-b border-gray-200 p-3 flex items-center justify-between text-sm font-medium text-gray-700 transition-colors"
        >
          <span>{selectedResident?.name || "Select Resident"}</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {/* Mobile: Resident List Drawer */}
        {isResidentListDrawerOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
              onClick={() => setIsResidentListDrawerOpen(false)}
            />
            <div className="lg:hidden fixed left-0 top-0 h-full w-full max-w-xs bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
                <h3 className="text-lg font-semibold text-gray-900">
                  Select Resident
                </h3>
                <button
                  onClick={() => setIsResidentListDrawerOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-4">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    Residents
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    {filteredResidents.length} resident
                    {filteredResidents.length !== 1 ? "s" : ""} found
                  </p>

                  {/* Search Input - Hide if invited user has only one resident */}
                  {!(isInvitedUser() && filteredResidents.length === 1) && (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search residents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isLoading || isLoadingFromSocket ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <svg
                        className="animate-spin h-5 w-5 text-gray-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>
                        {isLoadingFromSocket
                          ? "Loading data from server..."
                          : "Loading residents..."}
                      </span>
                    </div>
                    {isLoadingFromSocket && (
                      <p className="text-xs text-gray-400 mt-2">
                        Connecting to server and fetching saved data...
                      </p>
                    )}
                  </div>
                ) : filteredResidents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-gray-400 mb-2">
                      {isInvitedUser()
                        ? "No assigned residents found"
                        : "No residents found"}
                    </div>
                    <p className="text-sm text-gray-500">
                      {isInvitedUser()
                        ? "You don't have any residents assigned to you yet"
                        : 'Click "Get Resident" to load data'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredResidents
                      .filter((resident) => {
                        if (!searchQuery.trim()) return true;
                        const query = searchQuery.toLowerCase();
                        const nameMatch = resident.name
                          ?.toLowerCase()
                          .includes(query);
                        const needsMatch = resident.patientNeeds?.some((need) =>
                          need.toLowerCase().includes(query)
                        );
                        const diagnosisMatch = resident.diagnosis
                          ?.toLowerCase()
                          .includes(query);
                        return nameMatch || needsMatch || diagnosisMatch;
                      }) 
                      .map((resident) => (
                        <ResidentListItem
                          key={resident.id}
                          resident={resident}
                          isSelected={selectedResident?.id === resident.id}
                          onClick={() => {
                            handleResidentClick(resident);
                            setIsResidentListDrawerOpen(false);
                          }}
                          assignedTeamMember={getAssignedTeamMember(resident)}
                        />
                      ))}
                    {filteredResidents.filter((resident) => {
                      if (!searchQuery.trim()) return false;
                      const query = searchQuery.toLowerCase();
                      const nameMatch = resident.name
                        ?.toLowerCase()
                        .includes(query);
                      const needsMatch = resident.patientNeeds?.some((need) =>
                        need.toLowerCase().includes(query)
                      );
                      const diagnosisMatch = resident.diagnosis
                        ?.toLowerCase()
                        .includes(query);
                      return nameMatch || needsMatch || diagnosisMatch;
                    }).length === 0 &&
                      searchQuery && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          No residents found matching "{searchQuery}"
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Left Panel - Residents List (Hidden on mobile, shown on desktop) */}
        <div className="hidden lg:block w-full lg:w-[30%] bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Residents
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {filteredResidents.length} resident
                {filteredResidents.length !== 1 ? "s" : ""} found
              </p>

              {/* Search Input - Hide if invited user has only one resident */}
              {!(isInvitedUser() && filteredResidents.length === 1) && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search residents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>

            {isLoading || isLoadingFromSocket ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <svg
                    className="animate-spin h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>
                    {isLoadingFromSocket
                      ? "Loading data from server..."
                      : "Loading residents..."}
                  </span>
                </div>
                {isLoadingFromSocket && (
                  <p className="text-xs text-gray-400 mt-2">
                    Connecting to server and fetching saved data...
                  </p>
                )}
              </div>
            ) : filteredResidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-gray-400 mb-2">
                  {isInvitedUser()
                    ? "No assigned residents found"
                    : "No residents found"}
                </div>
                <p className="text-sm text-gray-500">
                  {isInvitedUser()
                    ? "You don't have any residents assigned to you yet"
                    : 'Click "Get Resident" to load data'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredResidents
                  .filter((resident) => {
                    if (!searchQuery.trim()) return true;
                    const query = searchQuery.toLowerCase();
                    const nameMatch = resident.name
                      ?.toLowerCase()
                      .includes(query);
                    const needsMatch = resident.patientNeeds?.some((need) =>
                      need.toLowerCase().includes(query)
                    );
                    const diagnosisMatch = resident.diagnosis
                      ?.toLowerCase()
                      .includes(query);
                    return nameMatch || needsMatch || diagnosisMatch;
                  })
                  .map((resident) => (
                    <ResidentListItem
                      key={resident.id}
                      resident={resident}
                      isSelected={selectedResident?.id === resident.id}
                      onClick={() => handleResidentClick(resident)}
                      assignedTeamMember={getAssignedTeamMember(resident)}
                    />
                  ))}
                {filteredResidents.filter((resident) => {
                  if (!searchQuery.trim()) return false;
                  const query = searchQuery.toLowerCase();
                  const nameMatch = resident.name
                    ?.toLowerCase()
                    .includes(query);
                  const needsMatch = resident.patientNeeds?.some((need) =>
                    need.toLowerCase().includes(query)
                  );
                  const diagnosisMatch = resident.diagnosis
                    ?.toLowerCase()
                    .includes(query);
                  return nameMatch || needsMatch || diagnosisMatch;
                }).length === 0 &&
                  searchQuery && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No residents found matching "{searchQuery}"
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Investigation Details */}
        <div className="w-full lg:w-[70%] bg-gray-50 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {selectedResident ? (
              <div>
                <div className="mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                        INVESTIGATION DETAILS
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                        {selectedResident.name}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Review investigation information and pathway questions
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                      <button
                        onClick={() => {
                          if (!selectedResident) {
                            toast.error("Please select a resident first");
                            return;
                          }
                          setIsWeightCalculatorOpen(true);
                        }}
                        className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Weight Calculator
                      </button>
                      <button
                        onClick={() => setIsBodyMapOpen(true)}
                        className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Body Map
                      </button>
                    </div>
                  </div>
                </div>

                {/* Resident Information & Investigation Status Card */}
                <ResidentInfoCard
                  resident={selectedResident}
                  assignedTeamMember={getAssignedTeamMember(selectedResident)}
                />

                {/* Weight Calculator Summary */}
                <WeightCalculatorSummary
                  weightData={selectedResident.weightCalculatorData}
                  onEdit={() => setIsWeightCalculatorOpen(true)}
                />

                {/* Body Map Summary */}
                <BodyMapSummary
                  observations={selectedResident.bodyMapObservations || []}
                  onEdit={() => setIsBodyMapOpen(true)}
                />

                {/* Investigations/Probes List */}
                {selectedResident.investigations?.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                      Investigations
                    </h3>
                    <div className="space-y-3">
                      {selectedResident.investigations.map((probe, idx) => (
                        <div
                          key={idx}
                          className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="mb-2">
                            <h4 className="text-sm sm:text-base font-medium text-gray-900">
                              {probe.title}
                            </h4>
                          </div>
                          {probe.description && (
                            <p className="text-xs sm:text-sm text-gray-600 mb-2">
                              {probe.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500 mb-3">
                            {probe.ftag && (
                              <>
                                <span>F-Tag: {probe.ftag}</span>
                                <span className="hidden sm:inline">•</span>
                              </>
                            )}
                            <span>{probe.pathwayName}</span>
                          </div>

                          {/* Critical Element Pathway Assessment */}
                          <CEPathwayAssessment
                            probe={probe}
                            probeIndex={idx}
                            onAnswerUpdate={handleCEPathwayAnswerUpdate}
                          />

                          {/* Surveyor Status Selection */}
                          <ProbeStatusSelector
                            status={probe.surveyorStatus}
                            onStatusChange={(status) =>
                              handleProbeStatusChange(idx, status)
                            }
                          />

                          {/* Overall Probe Notes */}
                          <div className="mt-4 pt-4 border-t border-gray-300">
                            <ProbeNotes
                              notes={probe.overallNotes || ""}
                              onNotesChange={(notes) =>
                                handleProbeNotesChange(idx, notes)
                              }
                              placeholder="Add overall notes for this probe (observations, findings, concerns, etc.)..."
                              label="Additional Notes"
                              rows={4}
                              required={probe.surveyorStatus === "Not Met"}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* General Surveyor Notes */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 mt-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                    General Surveyor Notes
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mb-4">
                    Document overall observations, impressions, and notes about this resident that apply across all investigations.
                  </p>
                  <ProbeNotes
                    notes={selectedResident.generalSurveyorNotes || ""}
                    onNotesChange={handleGeneralNotesChange}
                    placeholder="Add general notes about this resident (overall observations, impressions, cross-investigation findings, etc.)..."
                    label=""
                    rows={5}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-gray-400 mb-2">No resident selected</div>
                <p className="text-sm text-gray-500">
                  Select a resident from the list to view investigation details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weight Calculator Modal */}
      <WeightCalculatorModal
        isOpen={isWeightCalculatorOpen}
        onClose={() => {
          // Save data before closing
          if (
            weightCalculatorState.currentWeight ||
            weightCalculatorState.previousWeight
          ) {
            handleWeightCalculatorUpdate(weightCalculatorState);
          }
          setIsWeightCalculatorOpen(false);
        }}
        selectedResident={selectedResident}
        currentInvestigationId={
          selectedResident?.investigationMetadata?.id ||
          selectedResident?.id ||
          "resident-investigation"
        }
        investigations={[]}
        weightCalculatorState={weightCalculatorState}
        setWeightCalculatorState={(newState) => {
          setWeightCalculatorState(newState);
          // Auto-save to store when data is complete
          if (
            newState.currentWeight &&
            newState.previousWeight &&
            newState.currentDate &&
            newState.previousDate
          ) {
            handleWeightCalculatorUpdate(newState);
          }
        }}
        onInsertToNotes={(weightData) => {
          // Save weight data to store
          handleWeightCalculatorUpdate(weightCalculatorState);
          toast.success("Weight data saved successfully");
          setIsWeightCalculatorOpen(false);
        }}
      />

      {/* Body Map Modal */}
      <BodyMapModal
        isOpen={isBodyMapOpen}
        onClose={() => {
          // Save observations before closing
          handleBodyMapUpdate(drawingToolState.observations);
          setIsBodyMapOpen(false);
        }}
        selectedResident={selectedResident}
        currentInvestigationId={null}
        investigations={[]}
        drawingToolState={drawingToolState}
        setDrawingToolState={(newState) => {
          setDrawingToolState(newState);
          // Auto-save observations when they change
          if (newState.observations) {
            handleBodyMapUpdate(newState.observations);
          }
        }}
        handleClearCanvas={handleClearCanvas}
        handleBodyMapClick={handleBodyMapClick}
        handleAddObservation={handleAddObservation}
        handleRemoveObservation={handleRemoveObservation}
        handleObservationClick={handleObservationClick}
      />

      {/* Floating Save Button */}
      <FloatingSaveButton
        onSave={saveInvestigation}
        isSaving={joinTeamLeadLoading}
        disabled={isLoading}
        label="Save Progress"
        savingLabel="Saving..."
      />

      {/* Navigation Buttons */}
      {isInvitedUser() ? (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-40 flex gap-2 sm:gap-4">
          <Button
            onClick={() => {
              if (hasUnsavedChangesFlag) {
                setShowUnsavedChangesModal(true);
                setPendingNavigation(() => () => setCurrentStep(5));
              } else {
                setCurrentStep(5);
              }
            }}
            className="flex-1 sm:flex-none h-11 sm:h-12 px-4 sm:px-8 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-sm sm:text-base font-medium rounded-full shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all"
            size="lg"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <Button
            onClick={() => {
              saveInvestigation();
              setCurrentStep(7);
            }}
            className="flex-1 sm:flex-none h-11 sm:h-12 px-4 sm:px-8 bg-[#075b7d] hover:bg-[#075b7d] text-white text-sm sm:text-base font-medium rounded-full shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all"
            size="lg"
          >
            <span className="hidden sm:inline">Next</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      ) : (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-40 flex gap-2 sm:gap-4">
          <Button
            onClick={() => {
              if (hasUnsavedChangesFlag) {
                setShowUnsavedChangesModal(true);
                setPendingNavigation(() => () => setCurrentStep(5));
              } else {
                setCurrentStep(5);
              }
            }}
            className="flex-1 sm:flex-none h-11 sm:h-12 px-4 sm:px-8 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-sm sm:text-base font-medium rounded-full shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all"
            size="lg"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Back</span>
          </Button>

          <Button
            onClick={() => {
              saveInvestigation();
              setCurrentStep(7);
            }}
            disabled={isLoading || joinTeamLeadLoading}
            className="flex-1 sm:flex-none h-11 sm:h-12 px-4 sm:px-8 bg-[#075b7d] hover:bg-[#075b7d] text-white text-sm sm:text-base font-medium disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all"
            size="lg"
          >
            {joinTeamLeadLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="hidden sm:inline">Submitting...</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Continue to Facility Tasks</span>
                <span className="sm:hidden">Continue</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Unsaved Changes Navigation Modal */}
      <UnsavedChangesModal
        open={showUnsavedChangesModal}
        onOpenChange={setShowUnsavedChangesModal}
        onCancel={() => {
          setShowUnsavedChangesModal(false);
          setPendingNavigation(null);
        }}
        onConfirm={async () => {
          await saveInvestigation();
          setShowUnsavedChangesModal(false);
          if (pendingNavigation) {
            pendingNavigation();
            setPendingNavigation(null);
          }
        }}
      />

      {/* Unsaved Changes Options Modal */}
      <UnsavedChangesOptionsModal
        open={unsavedChangesModalOpen}
        onOpenChange={setUnsavedChangesModalOpen}
        onKeepChanges={handleKeepUnsavedChanges}
        onFetchServerData={handleFetchServerData}
        changesCount={pendingUnsavedChangesCount}
      />

      {/* Override Confirmation Modal - shown when user has already generated investigations */}
      <ConfirmOverrideModal
        isOpen={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        onConfirm={handleConfirmOverride}
        title="Override Existing Investigations?"
        message="You have already generated investigation data for this survey. Proceeding will override your current investigations and any saved progress will be lost."
        confirmText="Override & Generate"
        cancelText="Cancel"
        isLoading={isLoading}
        variant="warning"
      />

      {/* Floating Home Button */}
      <FloatingHomeButton
        hasUnsavedChanges={Object.keys(unsavedChanges).length > 0}
        onSave={saveInvestigation}
        onClearUnsavedChanges={() => setUnsavedChanges({})}
      />
    </div>
  );
};

export default ResidentInvestigation;
