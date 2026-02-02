import { useState, useEffect, useRef } from "react";
import useResidentInvestigationStore from "../stores/useResidentInvestigationStore";
import { healthAssistantAPI, surveySocketService, authAPI } from "../service/api";
import ProbeNotes from "../components/investigations/ProbeNotes";
import CEPathwayAssessment from "../components/investigations/CEPathwayAssessment";
import ProbeStatusSelector from "../components/investigations/ProbeStatusSelector";
import ResidentInfoCard from "../components/investigations/ResidentInfoCard";
import WeightCalculatorModal from "../components/investigations/WeightCalculatorModal";
import WeightCalculatorSummary from "../components/investigations/WeightCalculatorSummary";
import BodyMapModal from "../components/investigations/BodyMapModal";
import BodyMapSummary from "../components/investigations/BodyMapSummary";
import ResidentListItem from "../components/investigations/ResidentListItem";
import { toast } from "sonner";
import { getCurrentUser, isInvitedUser, getCurrentUserAssignedResidents } from "../utils/investigations/investigationHelpers";

const ResidentInvestigation = () => {
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
  } = useResidentInvestigationStore();

  const [surveyIdLocal, setSurveyIdLocal] = useState(
    localStorage.getItem("currentSurveyId")
  );
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
  // Track unsaved changes: { residentId: { probeIndex: true } }
  const [unsavedChanges, setUnsavedChanges] = useState({});
  const [isLoadingFromSocket, setIsLoadingFromSocket] = useState(false);
  
  // Ref to track unsaved changes inside callbacks/effects
  const unsavedChangesRef = useRef({});
  
  // Sync ref with state
  useEffect(() => {
    unsavedChangesRef.current = unsavedChanges;
  }, [unsavedChanges]);

  // Check if data exists in store on mount (Zustand persist automatically restores from localStorage)
  useEffect(() => {
    const currentSurveyId = localStorage.getItem("currentSurveyId");

    // Check if we have a survey ID mismatch
    if (surveyId && currentSurveyId && surveyId !== currentSurveyId) {
     
      clearStore();
      setIsLoadingFromSocket(true); // Assume we need to fetch new data
      return;
    }

    if (residents.length > 0) {
     
      setIsLoadingFromSocket(false); // Data exists, no need to show loading
    } else {
     
      setIsLoadingFromSocket(true); // Show loading while waiting for socket data
    }
  }, []);

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

  // Fetch survey data and team members on mount
  useEffect(() => {
    const fetchSurveyAndTeamMembers = async () => {
      const surveyId = surveyIdLocal || localStorage.getItem("currentSurveyId");
      if (!surveyId) {
       
        return;
      }

      try {
       
        const response = await healthAssistantAPI.getSurveyWizard(surveyId);

        if (response && response?.statusCode === 200 && response?.data) {
          const surveyData = response.data;

          // Extract team members from root level (single source of truth)
          if (surveyData.teamMembers && Array.isArray(surveyData.teamMembers)) {
            const formattedTeamMembers = surveyData.teamMembers.map((member) => ({
              id: String(member.id || member._id),
              name: member.name || "",
              email: member.email || "",
              role: member.role || "",
              assignedFacilityTasks: member.assignedFacilityTasks || [],
              assignedResidents: member.assignedResidents || [],
              updatedAt: member.updatedAt || new Date().toISOString(),
            }));

            setTeamMembers(formattedTeamMembers);
          
          } else {
           
            setTeamMembers([]);
          }
        }
      } catch (error) {
       
        // Silently fail - don't disrupt user experience
      }
    };

    fetchSurveyAndTeamMembers();
  }, [surveyIdLocal]);

  // Connect socket on component mount - keep it always open
  // Only run once on mount, not when surveyIdLocal changes
  useEffect(() => {
    const surveyId = surveyIdLocal || localStorage.getItem("currentSurveyId");
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?._id || null;

    // Only connect if we have both surveyId and userId
    if (!surveyId || !currentUserId) {
      return;
    }

    // Check if socket is already connected with same IDs
    const existingSocket = surveySocketService.getSocket();
    const isAlreadyConnected = existingSocket && existingSocket.connected;
    
    // Only connect if not already connected
    // The connect() method will check internally and won't reconnect if already connected with same IDs
    if (!isAlreadyConnected) {
      surveySocketService.connect(surveyId, currentUserId);
    }

    // Set up listeners - use the socket service's event system to avoid duplicates
    const handleConnect = () => {
      const socket = surveySocketService.getSocket();
      if (socket && socket.connected) {
        

        const isInvited = isInvitedUser();
        const currentResidents =
          useResidentInvestigationStore.getState().residents;
        const hasResidents = currentResidents.length > 0;
        
        // If no residents in store, automatically request data from server via socket
        if (!hasResidents) {
         
          setIsLoadingFromSocket(true); // Show loading indicator
          // Request data from server - this will populate via view_survey_wizard response
          socket.emit("join_view_survey_wizard", {
            surveyId: surveyId,
            userId: currentUserId,
          });
          
          // Set timeout to stop loading if no response after 10 seconds
          setTimeout(() => {
            const currentResidents = useResidentInvestigationStore.getState().residents;
            if (currentResidents.length === 0) {
            
              setIsLoadingFromSocket(false);
            }
          }, 10000);
        }
        
        // For invited users: Don't emit with empty residents - wait for server data first
        // For team lead: Emit current residents data (if we have any)
        // Only emit join_team_lead_investigation if we have residents OR if we're the team lead (team lead can initialize)
        if (hasResidents || !isInvited) {
          const joinTeamLeadPayload = {
            residents: hasResidents ? currentResidents.map((r) => ({
              id: r.id,
              name: r.name,
              specialTypes: r.specialTypes || [],
              diagnosis: r.diagnosis || "",
              selectionReason: r.selectionReason || "",
              investigationStatus: r.investigationStatus || "Pending",
              investigations: r.investigations || null,
              bodyMapObservations: r.bodyMapObservations || [],
              weightCalculatorData: r.weightCalculatorData || null,
              notes: r.notes || {},
              attachments: r.attachments || {},
            })) : [],
            surveyId: surveyId,
            submittedAt: new Date().toISOString(),
            isPageClosed: false,
            currentStep: "investigations",
          };
        
          socket.emit("join_team_lead_investigation", joinTeamLeadPayload);
        } else {
          // Invited user with no residents - already requested data above via join_view_survey_wizard
         
        }
        // Note: join_view_survey_wizard will also be emitted after receiving team_lead_investigation response
      }
    };

    // Handle team_lead_investigation broadcast response
    const handleTeamLeadInvestigation = (message) => {
    
      
      // After receiving team_lead_investigation response, emit join_view_survey_wizard
      // This ensures we get the latest data from server
      const socket = surveySocketService.getSocket();
      if (socket && socket.connected) {
        // Always emit join_view_survey_wizard to get the latest data
        // This ensures real-time updates for all team members
        socket.emit("join_view_survey_wizard", {
          surveyId: surveyId,
          userId: currentUserId,
        });
       
      }
    };

    // Helper function to merge server data with local data intelligently
  const mergeResidentsData = (serverResidents, localResidents, unsavedChangesMap) => {
    // If server sends empty array and we have local residents, preserve local data
    // This prevents clearing data when invited user connects with empty state
    if (!serverResidents || serverResidents.length === 0) {
      if (localResidents && localResidents.length > 0) {
      
        return localResidents;
      }
      return [];
    }
    
    return serverResidents.map((serverResident) => {
      const localResident = localResidents.find((r) => r.id === serverResident.id);
      
      // If no local resident exists, use server data
      if (!localResident) {
        return serverResident;
      }
      
      // Check if this resident has unsaved changes
      const residentUnsavedChanges = unsavedChangesMap[serverResident.id];
      
      // If resident has unsaved changes, preserve local changes and merge server updates
      if (residentUnsavedChanges) {
        // Merge: Keep local unsaved changes, but update from server for unchanged probes
        const mergedInvestigations = serverResident.investigations?.map((serverProbe, probeIndex) => {
          const localProbe = localResident.investigations?.[probeIndex];
          
          // If this specific probe has unsaved changes, keep local version
          if (localProbe && residentUnsavedChanges[probeIndex]) {
            return localProbe;
          }
          
          // Otherwise, use server version (it was updated by another team member)
          return serverProbe;
        }) || serverResident.investigations;
        
        // Merge other fields: use server for metadata, but preserve local unsaved data
        // If entire resident is marked as unsaved (has 'all' flag), preserve all local data
        if (residentUnsavedChanges.all) {
          return {
            ...serverResident,
            ...localResident, // Preserve all local data
            investigations: mergedInvestigations, // But still merge investigations intelligently
          };
        }
        
        return {
          ...serverResident,
          investigations: mergedInvestigations,
          // Preserve local weight calculator and body map if they exist and are unsaved
          weightCalculatorData: localResident.weightCalculatorData || serverResident.weightCalculatorData,
          bodyMapObservations: localResident.bodyMapObservations || serverResident.bodyMapObservations,
        };
      }
      
      // No unsaved changes - safe to use server data completely
      return serverResident;
    });
  };

    // Handle view_survey_wizard messages
    const handleViewSurveyWizard = (message) => {
   
      
      // Update team members if they exist in the response
      if (message?.data?.teamMembers && Array.isArray(message.data.teamMembers)) {
        const formattedTeamMembers = message.data.teamMembers.map((member) => ({
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
      
      // Update store with residents data from server response (with conflict prevention)
      if (message?.data?.investigationSurvey?.residents !== undefined) {
        const serverResidents = message.data.investigationSurvey.residents || [];
        const currentResidents = useResidentInvestigationStore.getState().residents;
        
    
        
        // Stop loading indicator since we received a response (even if empty)
        setIsLoadingFromSocket(false);
        
        // Safety check: Don't clear existing residents if server sends empty array and we have local data
        // This prevents invited users from clearing team lead's data
        if (serverResidents.length === 0 && currentResidents.length > 0) {
     
          // Don't update - keep existing residents
          return;
        }
        
        // If server sends empty and we have no local data, that's fine - just stop loading
        if (serverResidents.length === 0 && currentResidents.length === 0) {
        
          return;
        }

        // Use ref for current unsaved changes to avoid closure staleness
        const currentUnsavedChanges = unsavedChangesRef.current;
        
        // Reconcile unsaved changes: Remove entries where server data matches local data
        let newUnsavedChanges = { ...currentUnsavedChanges };
        let changesMade = false;

        Object.keys(newUnsavedChanges).forEach(residentId => {
            const residentChanges = newUnsavedChanges[residentId];
            if (!residentChanges) return;
            
            // Skip if 'all' flag is set (entire resident unsaved)
            if (residentChanges.all) return;

            const serverResident = serverResidents.find(r => r.id === residentId);
            const localResident = currentResidents.find(r => r.id === residentId);

            if (!serverResident || !localResident) return;

            const newResidentChanges = { ...residentChanges };
            let residentModified = false;

            Object.keys(residentChanges).forEach(probeIndexStr => {
                const probeIndex = parseInt(probeIndexStr);
                const localProbe = localResident.investigations?.[probeIndex];
                const serverProbe = serverResident.investigations?.[probeIndex];

                if (localProbe && serverProbe) {
                    // Check if critical fields match
                    const isSynced = 
                        localProbe.status === serverProbe.status &&
                        localProbe.surveyorStatus === serverProbe.surveyorStatus &&
                        localProbe.overallNotes === serverProbe.overallNotes &&
                        JSON.stringify(localProbe.cePathwayAnswers || {}) === JSON.stringify(serverProbe.cePathwayAnswers || {});

                    if (isSynced) {
                        delete newResidentChanges[probeIndexStr];
                        residentModified = true;
                    }
                }
            });

            if (residentModified) {
                if (Object.keys(newResidentChanges).length === 0) {
                    delete newUnsavedChanges[residentId];
                } else {
                    newUnsavedChanges[residentId] = newResidentChanges;
                }
                changesMade = true;
            }
        });

        if (changesMade) {
          // Update unsaved changes state if any changes were made
        }
        
        // Merge server data with local data, preserving unsaved changes
        // Use the updated unsaved changes map (if changed) or the current one
        const mergedResidents = mergeResidentsData(
          serverResidents,
          currentResidents,
          changesMade ? newUnsavedChanges : currentUnsavedChanges
        );
        
        // Update residents in store with merged data
        setResidents(mergedResidents);
        
        // If there's a selected resident, update it with merged data
        const currentSelectedResident = useResidentInvestigationStore.getState().selectedResident;
        if (currentSelectedResident) {
          const updatedSelectedResident = mergedResidents.find(
            (r) => r.id === currentSelectedResident.id
          );
          if (updatedSelectedResident) {
            setSelectedResident(updatedSelectedResident);
           
          }
        }
        
        // Show notification if there were unsaved changes that were preserved
        const finalUnsavedChanges = changesMade ? newUnsavedChanges : currentUnsavedChanges;
        const hasPreservedChanges = Object.keys(finalUnsavedChanges).length > 0;
        if (hasPreservedChanges) {
         // Notify user that some of their unsaved changes were preserved
        }
      }
    };    // If already connected, emit join events immediately
    if (isAlreadyConnected && existingSocket) {
      handleConnect();
    }

    // Set up listeners using surveySocketService to avoid duplicates
    surveySocketService.on("connect", handleConnect);
    surveySocketService.on("team_lead_investigation", handleTeamLeadInvestigation);
    surveySocketService.on("view_survey_wizard", handleViewSurveyWizard);

    // Cleanup listeners on unmount
    return () => {
      surveySocketService.off("connect", handleConnect);
      surveySocketService.off("team_lead_investigation", handleTeamLeadInvestigation);
      surveySocketService.off("view_survey_wizard", handleViewSurveyWizard);
    };
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

  // fetch residents from api
  const fetchResidents = async () => {
    try {
     
      setIsLoading(true);
      setIsLoadingFromSocket(false); // Stop socket loading since user is manually fetching
      setSurveyId(surveyIdLocal);
      const response = await healthAssistantAPI.getFinalSampleInvestigation(
        surveyIdLocal
      );
      if (response.statusCode === 200) {
      

        // transform the data to the format of the residents array
        const transformedResidents = response.data.map((item) => {
          // Transform probes to include CE_pathway_questions
          const transformedProbes = (item.investigation.probes || []).map(
            (probe) => ({
              ...probe,
              CE_pathway_questions: probe.CE_pathway_questions || {},
            })
          );

          return {
            id: item.resident.id,
            name: item.resident.name,
            specialTypes: item.resident.patientNeeds || [],
            patientNeeds: item.resident.patientNeeds || [],
            diagnosis: item.resident.diagnosis,
            selectionReason: item.resident.selectionReason,
            investigationStatus: item.investigation.status,
            investigations: transformedProbes,
            // Store original investigation metadata for payload reconstruction
            investigationMetadata: {
              id: item.investigation.id,
              residentId: item.resident.id,
              residentName: item.resident.name,
              residentDiagnosis: item.resident.diagnosis,
              residentSpecialTypes: item.resident.patientNeeds || [],
              careArea: item.investigation.careArea,
              fTag: item.investigation.fTag,
              title: item.investigation.title,
              reason: item.investigation.reason,
              category: item.investigation.category,
              priority: item.investigation.priority,
              assignedSurveyor: item.investigation.assignedSurveyor,
              assignedSurveyorName: item.investigation.assignedSurveyorName,
              createdAt: item.investigation.createdAt,
              createdBy: item.investigation.createdBy,
              createdById: item.investigation.createdById,
              startedAt: item.investigation.startedAt,
              startedBy: item.investigation.startedBy,
              startedById: item.investigation.startedById,
              completedAt: item.investigation.completedAt,
              completedBy: item.investigation.completedBy,
              completedById: item.investigation.completedById,
              observations: item.investigation.observations || [],
              interviews: item.investigation.interviews || [],
              recordReview: item.investigation.recordReview || [],
              severity: item.investigation.severity,
              notes: item.investigation.notes || "",
              attachments: item.investigation.attachments || [],
              evidence: item.investigation.evidence || [],
              aiGenerated: item.investigation.aiGenerated,
              source: item.investigation.source,
              completedProbes: item.investigation.completedProbes || [],
              cePathwayQuestions: item.investigation.cePathwayQuestions || {},
              cePathwayAssessment: item.investigation.cePathwayAssessment,
              scopeSeverityRationale: item.investigation.scopeSeverityRationale,
              deficiencyDraft: item.investigation.deficiencyDraft,
              pathwayAssessment: item.investigation.pathwayAssessment,
              reopenedAt: item.investigation.reopenedAt,
              reopenedBy: item.investigation.reopenedBy,
              reopenedById: item.investigation.reopenedById,
            },
            investigationCategory: item.investigation.category,
            investigationPriority: item.investigation.priority,
            investigationEvidence: item.investigation.evidence || [],
            assignedSurveyor: item.investigation.assignedSurveyor,
            bodyMapObservations: item.resident.bodyMapObservations || [],
            weightCalculatorData: item.resident.weightCalculatorData || null,
            notes: typeof item.resident.notes === 'object' && !Array.isArray(item.resident.notes)
              ? item.resident.notes
              : {},
            attachments: typeof item.resident.attachments === 'object' && !Array.isArray(item.resident.attachments)
              ? item.resident.attachments
              : {},
          };
        });

        // Save to store - data will persist across page refreshes
        setResidents(transformedResidents);
      }
    } catch (error) {
     // Handle error
    } finally {
      setIsLoading(false);
    }
  };


  const prepareInvestigationPayload = () => {
    const surveyId = surveyIdLocal || localStorage.getItem("currentSurveyId");

    if (!surveyId) {
      throw new Error("Survey ID is required to save investigation data");
    }

    // IMPORTANT: Use ALL residents (not filteredResidents) to preserve other team members' work
    // Team members send all residents but only update their assigned ones on the server
    // This ensures data integrity and prevents overwriting other team members' changes
    // Build residents payload with all investigation data
    const residentsPayload = residents.map((resident) => {
      // Transform probes to include all updated data (user's answers, status, notes)
      const transformedProbes = (resident.investigations || []).map((probe) => {
        // Build probe object matching expected payload structure
        const probeObj = {
          title: probe.title,
          description: probe.description,
          status: probe.status || "Not Started",
          required: probe.required !== undefined ? probe.required : true,
          relatedType: probe.relatedType,
          ftag: probe.ftag,
          pathwayName: probe.pathwayName,
          // Use CE_pathway_questions (with underscore) to match expected payload structure
          CE_pathway_questions: probe.CE_pathway_questions || probe.cePathwayQuestions || {},
          // Include user-updated data
          surveyorStatus: probe.surveyorStatus || null,
          cePathwayAnswers: probe.cePathwayAnswers || {},
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
        
        // Remove overallNotes if empty
        if (!probeObj.overallNotes) {
          delete probeObj.overallNotes;
        }
        
        // Remove cePathwayAnswers if empty
        if (!probeObj.cePathwayAnswers || Object.keys(probeObj.cePathwayAnswers).length === 0) {
          delete probeObj.cePathwayAnswers;
        }
        
        return probeObj;
      });

      return {
        id: resident.id,
        name: resident.name,
        specialTypes: resident.specialTypes || [],
        diagnosis: resident.diagnosis || "",
        selectionReason: resident.selectionReason || "",
        investigationStatus: resident.investigationStatus || "Pending",
        investigations: transformedProbes,
        bodyMapObservations: resident.bodyMapObservations || [],
        weightCalculatorData: resident.weightCalculatorData || null,
        // Ensure notes and attachments are arrays
        notes: Array.isArray(resident.notes) ? resident.notes : [],
        attachments: Array.isArray(resident.attachments) ? resident.attachments : [],
      };
    });



    // Prepare final payload matching JSON structure
    const finalPayload = {
      submittedAt: new Date().toISOString(),
      isPageClosed: false,
      surveyId: surveyId,
      currentStep: "investigations",
      residents: residentsPayload,
    };

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

      const surveyId = surveyIdLocal || localStorage.getItem("currentSurveyId");
      if (!surveyId) {
        toast.error("Survey ID is required. Please ensure you have an active survey.");
        return;
      }

    //   setIsLoading(true);

      // Prepare the payload - this matches the structure in letsRefactor.json
      const payload = prepareInvestigationPayload();
      
    

      // Get current user ID for socket operations
      const currentUser = getCurrentUser();
      const currentUserId = currentUser?._id || null;
      
      if (!currentUserId) {
        throw new Error("User ID is required. Please ensure you are logged in.");
      }

      // Verify socket is connected (should already be connected from useEffect)
      const socketCheck = surveySocketService.getSocket();
      if (!socketCheck || !socketCheck.connected) {
        // If not connected, try to connect (fallback)
        surveySocketService.connect(surveyId, currentUserId);
        
        // Wait a moment for connection
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        // Check again
        const socketAfterConnect = surveySocketService.getSocket();
        if (!socketAfterConnect || !socketAfterConnect.connected) {
          throw new Error("Socket not connected. Please wait a moment and try again.");
        }
      }

      // Set loading state and show loading toast
      setJoinTeamLeadLoading(true);
      toast.loading("Saving investigation data...", { id: "saving-investigation" });

      // Emit investigation data via socket
      // Note: emit() doesn't return a value, but we've already verified 
      surveySocketService.emit("join_team_lead_investigation", payload); 

      // Set up listener for team_lead_investigation response
      let responseReceived = false;
      let timeoutId = null;

      const handleTeamLeadResponse = (message) => {
        if (responseReceived) return; // Prevent duplicate handling
        responseReceived = true;

        // Clear timeout since we received the response
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        // Remove this one-time listener
        surveySocketService.off("team_lead_investigation", handleTeamLeadResponse);

     

        // Emit join_view_survey_wizard after receiving the response
        // Add a small delay to ensure DB consistency (prevent reading stale data)
        setTimeout(() => {
          surveySocketService.emit("join_view_survey_wizard", {
            surveyId: surveyId,
            userId: currentUserId,
          });
        }, 1000);

        // Clear loading state and show success toast only after receiving response
        setJoinTeamLeadLoading(false);
        toast.dismiss("saving-investigation");
        toast.success("Investigation data saved successfully");
      };

      // Set up one-time listener for team_lead_investigation response
      const socketInstance = surveySocketService.getSocket();
      if (socketInstance) {
        socketInstance.once("team_lead_investigation", handleTeamLeadResponse);
      } else {
        // Fallback: use on() and manually remove after first call
        surveySocketService.on("team_lead_investigation", handleTeamLeadResponse);
      }

      // Timeout fallback in case response doesn't come (after 5 seconds)
      timeoutId = setTimeout(() => {
        if (responseReceived) return; // Response already received, don't proceed
        responseReceived = true;
        timeoutId = null;

        // Remove listener if still active
        surveySocketService.off("team_lead_investigation", handleTeamLeadResponse);

        // Still emit join_view_survey_wizard even if no response
        surveySocketService.emit("join_view_survey_wizard", {
          surveyId: surveyId,
          userId: currentUserId,
        });

        // Clear loading state and show success (timeout fallback)
        setJoinTeamLeadLoading(false);
        toast.dismiss("saving-investigation");
        toast.success("Investigation data saved successfully");
       
      }, 5000);

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

  const handleCEPathwayAnswerUpdate = (probeIndex, category, questionIndex, isChecked, notes = null) => {
    if (selectedResident) {
      markAsUnsaved(selectedResident.id, probeIndex);
      updateCEPathwayAnswer(probeIndex, category, questionIndex, isChecked, notes);
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

  // Helper function to get role name from ID
  const getRoleName = (roleId) => {
    if (!roleId) return null;
    return roleIdToName[roleId] || roleId; // Return ID if name not found
  };

  // Helper function to get assigned team member for a resident
  const getAssignedTeamMember = (resident) => {
    if (!resident || !teamMembers.length) return null;

    // Check if resident has assignedTeamMemberId
    if (resident.assignedTeamMemberId) {
      const member = teamMembers.find(
        (m) => String(m.id) === String(resident.assignedTeamMemberId)
      );
      if (member) {
        return {
          ...member,
          roleName: getRoleName(member.role),
        };
      }
    }

    // Check if resident is in any team member's assignedResidents list
    const assignedMember = teamMembers.find((member) =>
      member.assignedResidents?.some(
        (residentId) => String(residentId) === String(resident.id)
      )
    );

    if (assignedMember) {
      return {
        ...assignedMember,
        roleName: getRoleName(assignedMember.role),
      };
    }

    return null;
  };

  // Filter residents based on user type (team members only see assigned residents)
  const getFilteredResidents = () => {
    const isInvited = isInvitedUser();
    
    if (!isInvited) {
      // Team lead sees all residents
      return residents;
    }
    
    // Team members only see their assigned residents
    const assignedResidentIds = getCurrentUserAssignedResidents();
 
    
    // Convert all IDs to strings for reliable comparison
    const assignedIdsAsStrings = assignedResidentIds.map(id => String(id));
    
    const filtered = residents.filter((resident) => {
      const residentIdAsString = String(resident.id);
      const isAssigned = assignedIdsAsStrings.includes(residentIdAsString);
      if (!isAssigned) {
        // console log excluded residents for debugging
      } else {
        // console log included residents for debugging
      }
      return isAssigned;
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
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
    <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Resident Investigations
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and review resident investigation data
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Show "Get Residents" button always for team leads (for fetching fresh data) */}
            {!isInvitedUser() && (
              <button
                onClick={fetchResidents}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? "Loading..." : "Get Residents"}
              </button>
            )}
            <button
              onClick={saveInvestigation}
              disabled={isLoading || joinTeamLeadLoading || filteredResidents.length === 0}
              className="px-3 py-1.5 text-sm bg-sky-900 text-white rounded-md font-medium hover:bg-sky-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
            >
              {joinTeamLeadLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                "Save Investigation"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Panel - Residents List */}
        <div className="w-[30%] bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Residents
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {filteredResidents.length} resident{filteredResidents.length !== 1 ? "s" : ""}{" "}
                found
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
                  <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{isLoadingFromSocket ? "Loading data from server..." : "Loading residents..."}</span>
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
        <div className="w-[70%] bg-gray-50 overflow-y-auto">
          <div className="p-8">
            {selectedResident ? (
              <div>
                <div className="mb-6">
                  <div className="flex items-center justify-between">
         <div>
                      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                        INVESTIGATION DETAILS
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedResident.name}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Review investigation information and pathway questions
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (!selectedResident) {
                            toast.error("Please select a resident first");
                            return;
                          }
                          setIsWeightCalculatorOpen(true);
                        }}
                        className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Weight Calculator
                      </button>
                      <button
                        onClick={() => setIsBodyMapOpen(true)}
                        className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
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
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Required Probes
                    </h3>
                    <div className="space-y-3">
                      {selectedResident.investigations.map((probe, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="mb-2">
                            <h4 className="font-medium text-gray-900">
                              {probe.title}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {probe.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                            <span>F-Tag: {probe.ftag}</span>
                            <span>•</span>
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
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
    </div>
  );
};

export default ResidentInvestigation;
