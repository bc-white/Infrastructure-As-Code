import React, { useEffect, useState, useRef, useCallback } from "react";
import { useBeforeUnload } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Building,
  Calendar,
  CheckSquare,
  FileText,
  X,
  Plus,
  Users,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../service/api";
import surveyIndexedDB from "../../utils/surveyIndexedDB";
import surveySyncService from "../../utils/surveySyncService";
import useSurveyStore from "../../stores/useSurveyStore";
import UnsavedChangesModal from "../../components/UnsavedChangesModal";
import FloatingHomeButton from "../../components/FloatingHomeButton";
import { useBrowserNavigationBlocker } from "../../hooks/useBrowserNavigationBlocker";
import useSurveyAccess from "../../hooks/useSurveyAccess";

const TeamMeetings = ({
  sectionData,
  surveyData,
  setCurrentStep,
  canContinueFromStep,
  handleSurveyDataChange,
  teamMembers: initialTeamMembers,
  fFlags,
  isInvitedUser: isInvitedUserProp = () => false,
}) => {
  // Get current survey ID for access check
  const currentSurveyId = surveyData?.surveyId || surveyData?.id || surveyData?._id || localStorage.getItem("currentSurveyId");
  
  // Use the survey access hook to determine user access type
  const { isInvitedUser: isInvitedUserFromHook, isLoading: isAccessLoading } = useSurveyAccess(currentSurveyId);
  
  // Use hook-based isInvitedUser, fall back to prop if hook is still loading
  const isInvitedUser = isAccessLoading ? isInvitedUserProp : isInvitedUserFromHook;

  const [facilityName, setFacilityName] = useState(surveyData?.facilityName || "");
  const [isLoadingFacility, setIsLoadingFacility] = useState(false);
  // Local state for team members fetched from API
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers || []);
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFindings, setIsLoadingFindings] = useState(false);
  const [isSyncingData, setIsSyncingData] = useState(false);

  // State for team member assigned residents (fetched from API)
  const [teamMemberResidents, setTeamMemberResidents] = useState({});
  const [isLoadingResidents, setIsLoadingResidents] = useState(false);

  // State for assigned facility tasks (fetched from API)
  const [assignedFacilityTasks, setAssignedFacilityTasks] = useState([]);
  const [isLoadingMandatoryTasks, setIsLoadingMandatoryTasks] = useState(false);

  // Local buffer state
  const [unsavedChanges, setUnsavedChanges] = useState(new Set());
  const unsavedChangesRef = useRef(new Set());
  const surveyDataRef = useRef(surveyData);
  const handleSurveyDataChangeRef = useRef(handleSurveyDataChange);

  // Sync unsavedChangesRef with state
  useEffect(() => {
    unsavedChangesRef.current = unsavedChanges;
  }, [unsavedChanges]);

  // Update refs when props change
  useEffect(() => {
    surveyDataRef.current = surveyData;
  }, [surveyData]);

  useEffect(() => {
    handleSurveyDataChangeRef.current = handleSurveyDataChange;
  }, [handleSurveyDataChange]);

  // State for navigation blocking modal
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Check if there are unsaved changes
  const hasUnsavedChanges = unsavedChanges.size > 0;

  // Browser refresh/close warning
  useBeforeUnload(
    useCallback(
      (e) => {
        if (hasUnsavedChanges) {
          e.preventDefault();
        }
      },
      [hasUnsavedChanges]
    )
  );

  // Browser back button interception
  useBrowserNavigationBlocker({
    isBlocked: hasUnsavedChanges,
    onBlock: () => {
      setShowUnsavedChangesModal(true);
      setPendingNavigation(() => () => window.history.back());
    },
  });

  // Wrapper for data changes to track unsaved changes
  const handleLocalDataChange = (field, value) => {
    setUnsavedChanges(prev => {
      const newSet = new Set(prev);
      newSet.add(field);
      return newSet;
    });
    handleSurveyDataChange(field, value);
  };



  // Check if survey is closed
  const isSurveyClosed = surveyData?.surveyClosed ||
    surveyData?.surveyCompleted || false;


  // Fetch team members from API (viewTeamMembersInSurvey)
  useEffect(() => {
    const fetchTeamMembersFromAPI = async () => {
      const surveyId = surveyData?.surveyId || surveyData?.id || surveyData?._id || localStorage.getItem("currentSurveyId");
      if (!surveyId) return;
      
      setIsLoadingTeamMembers(true);
      try {
        const response = await api.survey.viewTeamMembersInSurvey(surveyId);
        if (response && (response.success || response.status === true || response.statusCode === 200)) {
          const apiTeamMembers = response.data || [];
          
          // Map the API response to ensure consistent structure
          const mappedTeamMembers = apiTeamMembers.map((member) => {
            const memberId = member.teamMemberUserId || member._id || member.id;
            
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
              assignedResidents: member.assignedResidents || [],
              updatedAt: member.updatedAt || new Date().toISOString(),
            };
          });
          
          setTeamMembers(mappedTeamMembers);
        }
      } catch (error) {
        // Silently fail - fall back to surveyData.teamMembers or initialTeamMembers
      } finally {
        setIsLoadingTeamMembers(false);
      }
    };

    fetchTeamMembersFromAPI();
  }, [surveyData?.surveyId, surveyData?.id, surveyData?._id]);

  // Fallback: Load team members from surveyData if API fetch didn't populate
  useEffect(() => {
    // Only use surveyData as fallback if we don't have team members from API
    if (teamMembers.length === 0 && surveyData.teamMembers && surveyData.teamMembers.length > 0) {
      const mappedTeamMembers = surveyData.teamMembers.map((member) => ({
        id: String(member._id),
        name: member.name || "Unknown",
        email: member.email,
        role: member.role || "",
        teamMemberUserId: member.teamMemberUserId,
        assignedFacilityTasks: member.assignedFacilityTasks || [],
        assignedResidents: member.assignedResidents || [],
        updatedAt: member.updatedAt || new Date().toISOString(),
      }));
      setTeamMembers(mappedTeamMembers);
    }
  }, [surveyData.teamMembers, teamMembers.length]);

  // Update team members when initialTeamMembers prop changes (fallback)
  useEffect(() => {
    if (
      initialTeamMembers &&
      initialTeamMembers.length > 0 &&
      teamMembers.length === 0
    ) {
      setTeamMembers(initialTeamMembers);
    }
  }, [initialTeamMembers, teamMembers.length]);

  // Fetch assigned residents for each team member from API
  // Using a ref to store surveyId to avoid re-fetching on every surveyData change
  const surveyIdRef = useRef(null);

  useEffect(() => {
    const currentSurveyId = surveyData?.surveyId || surveyData?.id || surveyData?._id || localStorage.getItem("currentSurveyId");

    // Only update ref if surveyId actually changed
    if (currentSurveyId && currentSurveyId !== surveyIdRef.current) {
      surveyIdRef.current = currentSurveyId;
    }
  }, [surveyData?.surveyId, surveyData?.id, surveyData?._id]);

  useEffect(() => {
    const fetchTeamMemberResidents = async () => {
      if (!teamMembers || teamMembers.length === 0) return;

      const surveyId = surveyIdRef.current || surveyData?.surveyId || surveyData?.id || surveyData?._id || localStorage.getItem("currentSurveyId");
      if (!surveyId) return;

      setIsLoadingResidents(true);
      const residentsMap = {};

      try {
        // Fetch residents for each team member in parallel
        const fetchPromises = teamMembers.map(async (member) => {
          const teamMemberUserId = member.teamMemberUserId;
          if (!teamMemberUserId) return { memberId: member.id, count: 0 };

          try {
            const response = await api.survey.getTeamMemberResidents(surveyId, teamMemberUserId);
            if (response && (response.statusCode === 200 || response.success)) {
              // API returns count directly in data field (e.g., data: 5)
              const count = typeof response.data === 'number' ? response.data : 0;
              return { memberId: member.id, count };
            }
            return { memberId: member.id, count: 0 };
          } catch (error) {
            
            return { memberId: member.id, count: 0 };
          }
        });

        const results = await Promise.all(fetchPromises);

        // Build the residentsMap from results (now storing count instead of array)
        results.forEach(({ memberId, count }) => {
          residentsMap[memberId] = count;
        });

        setTeamMemberResidents(residentsMap);
      } catch (error) {
        // console.error("Error fetching team member residents:", error);
      } finally {
        setIsLoadingResidents(false);
      }
    };

    fetchTeamMemberResidents();
  }, [teamMembers]); // Only re-fetch when teamMembers changes, not surveyData

  // Fetch assigned facility tasks from API (viewSurveyFirstPage)
  useEffect(() => {
    const fetchAssignedFacilityTasks = async () => {
      const surveyId = surveyData?.surveyId || surveyData?.id || surveyData?._id || localStorage.getItem("currentSurveyId");
      if (!surveyId) return;

      setIsLoadingMandatoryTasks(true);
      try {
        const response = await api.survey.getSurveyFirstPage(surveyId);
        if (response && (response.success || response.status === true || response.statusCode === 200)) {
          const data = response.data || {};
          // Store assigned facility tasks from the API response (this is an array)
          if (data.assignedFacility && Array.isArray(data.assignedFacility)) {
            setAssignedFacilityTasks(data.assignedFacility);
          }
        }
      } catch (error) {
        // Silently fail - fall back to surveyData.mandatoryTasks
        // console.error("Error fetching assigned facility tasks:", error);
      } finally {
        setIsLoadingMandatoryTasks(false);
      }
    };

    fetchAssignedFacilityTasks();
  }, [surveyData?.surveyId, surveyData?.id, surveyData?._id]);

  // Fetch team meeting data
  const fetchTeamMeetingData = async (showToast = false) => {
    const surveyId =
      surveyData.surveyId ||
      surveyData.id ||
      surveyData._id ||
      localStorage.getItem("currentSurveyId");

    if (!surveyId) {
      if (showToast) {
        toast.error("Survey ID not found", {
          description: "Please refresh and try again",
          position: "top-right",
        });
      }
      return;
    }

    try {
      const response = await api.survey.viewTeamMeeting(surveyId);
      if (
        response &&
        (response.statusCode === 200 || response.success) &&
        response.data
      ) {
        const teamMeetingData = response.data.teammeeting?.[0];

        if (teamMeetingData) {
          // Convert teamDeterminations array to object
          const teamDeterminationsObj = {};
          if (Array.isArray(teamMeetingData.teamDeterminations)) {
            teamMeetingData.teamDeterminations.forEach((det) => {
              if (det.investigationId) {
                teamDeterminationsObj[det.investigationId] = {
                  decision: det.decision,
                  rationale: det.rationale,
                  severity: det.severity,
                  scope: det.scope,
                  isSingularEvent: det.isSingularEvent,
                  ijStartDate: det.ijStartDate,
                  ijEndDate: det.ijEndDate,
                  date: det.date,
                };
              }
            });
          }

          const processedData = {
            ...teamMeetingData,
            teamDeterminations: teamDeterminationsObj,
          };

          // Update surveyData with the fetched team meeting data
          handleSurveyDataChange("finalTeamMeeting", processedData);
        }

        // If the response contains teamMembers (in surveyData or root), update them as well
        // Based on response structure, check if they exist in surveyData
        if (response.data.surveyData?.teamMembers) {
          handleSurveyDataChange(
            "teamMembers",
            response.data.surveyData.teamMembers
          );
        }

        if (showToast) {
          toast.success("Team meeting data synced successfully", {
            position: "top-right",
            duration: 3000,
          });
        }
      } else if (showToast) {
        toast.info("No team meeting data found", {
          position: "top-right",
          duration: 3000,
        });
      }
    } catch (error) {

      if (showToast) {
        toast.error("Failed to sync team meeting data", {
          description: error.message || "Please try again",
          position: "top-right",
        });
      }
    }
  };

  useEffect(() => {
    fetchTeamMeetingData();
  }, []);


  // Auto-populate daily meeting agenda
  const getDailyMeetingAgenda = () => {
    // Check for existing agenda data in finalTeamMeeting first, then dailyMeetingAgenda
    const existingAgenda =
      surveyData.finalTeamMeeting?.dailyMeetingAgenda ||
      surveyData.dailyMeetingAgenda;

    // If we have a generated agenda or are editing, return the current agenda
    if (existingAgenda?.isGenerated || existingAgenda?.isEditing) {
      return existingAgenda;
    }

    // Otherwise, return a default structure
    return {
      facilityName: facilityName || "Facility Name",
      meetingDate: new Date().toLocaleDateString(),
      standardItems: [
        "Review Survey Progress",
        "Discuss Investigation Findings",
        "Review Resident Observations",
        "Discuss Staff Interactions",
        "Review Documentation Status",
        "Discuss Compliance Concerns",
        "Review Team Coordination",
        "Plan Next Day Priorities",
      ],
      standardSubItems: {
        0: [
          "Review completed investigations",
          "Discuss ongoing investigation status",
          "Review findings and evidence collected",
        ],
        1: [
          "Review investigation outcomes",
          "Discuss citation decisions",
          "Review supporting documentation",
        ],
        2: [
          "Review resident interviews",
          "Discuss resident observations",
          "Review resident complaints or concerns",
        ],
        3: [
          "Review staff interview outcomes",
          "Discuss staff performance observations",
          "Review staff training and competency",
        ],
        4: [
          "Review documentation completeness",
          "Discuss missing or incomplete records",
          "Review documentation accuracy",
        ],
        5: [
          "Review regulatory compliance issues",
          "Discuss potential citations",
          "Review facility response to concerns",
        ],
        6: [
          "Review team member workload",
          "Discuss assignment distribution",
          "Review communication protocols",
        ],
        7: [
          "Plan priorities",
          "Assign new investigations",
          "Review schedule and timeline",
        ],
      },
      customItems: existingAgenda?.customItems || [],
      isGenerated: false,
      isEditing: false,
    };
  };

  // Handle generating daily meeting agenda or saving changes
  const handleGenerateDailyMeetingAgenda = () => {
    const currentAgenda = getDailyMeetingAgenda();

    if (currentAgenda.isEditing) {
      // Save changes and return to generated view
      const updatedAgenda = {
        ...currentAgenda,
        isGenerated: true,
        isEditing: false,
        // Preserve edited standard items if they exist, otherwise use defaults
        standardItems: currentAgenda.standardItems || [
          "Review Survey Progress",
          "Discuss Investigation Findings",
          "Review Resident Observations",
          "Discuss Staff Interactions",
          "Review Documentation Status",
          "Discuss Compliance Concerns",
          "Review Team Coordination",
          "Plan Next Day Priorities",
        ],
        // Preserve sub-menu items
        standardSubItems: currentAgenda.standardSubItems || {},
        // Preserve custom items
        customItems: currentAgenda.customItems || [],
      };
      // Save to finalTeamMeeting if it exists, otherwise to dailyMeetingAgenda
      if (surveyData.finalTeamMeeting) {
        handleLocalDataChange("finalTeamMeeting", {
          ...surveyData.finalTeamMeeting,
          dailyMeetingAgenda: updatedAgenda,
        });
      } else {
        handleLocalDataChange("dailyMeetingAgenda", updatedAgenda);
      }
    } else {
      // Generate new agenda with contextual items
      const contextualItems = [];

      // Add contextual items based on survey data
      if (surveyData.openConcerns?.length > 0) {
        contextualItems.push("Open concerns from previous meetings");
      }

      if (
        surveyData.finalTeamMeeting?.investigations ||
        surveyData.investigations?.some((inv) => inv.ijStatus === "active")
      ) {
        contextualItems.push("Immediate Jeopardy/Harm investigations");
      }

      if (
        surveyData.citations?.some(
          (cit) => cit.severity === "Pattern" || cit.severity === "Widespread"
        )
      ) {
        contextualItems.push("Pattern/Widespread issues identified");
      }

      // Items from multiple surveyors
      const surveyorItems = {};
      surveyData.finalTeamMeeting?.investigations ||
        surveyData.investigations?.forEach((inv) => {
          if (inv.surveyorId) {
            surveyorItems[inv.surveyorId] =
              (surveyorItems[inv.surveyorId] || 0) + 1;
          }
        });
      if (
        Object.values(surveyorItems).filter((count) => count >= 2).length > 0
      ) {
        contextualItems.push("Items identified by multiple surveyors");
      }

      const newAgenda = {
        facilityName: facilityName || "Facility Name",
        meetingDate: new Date().toLocaleDateString(),
        standardItems: [
          "Review Survey Progress",
          "Discuss Investigation Findings",
          "Review Resident Observations",
          "Discuss Staff Interactions",
          "Review Documentation Status",
          "Discuss Compliance Concerns",
          "Review Team Coordination",
          "Plan Next Day Priorities",
        ],
        standardSubItems: {
          0: [
            "Review completed investigations",
            "Discuss ongoing investigation status",
            "Review findings and evidence collected",
          ],
          1: [
            "Review investigation outcomes",
            "Discuss citation decisions",
            "Review supporting documentation",
          ],
          2: [
            "Review resident interviews",
            "Discuss resident observations",
            "Review resident complaints or concerns",
          ],
          3: [
            "Review staff interview outcomes",
            "Discuss staff performance observations",
            "Review staff training and competency",
          ],
          4: [
            "Review documentation completeness",
            "Discuss missing or incomplete records",
            "Review documentation accuracy",
          ],
          5: [
            "Review regulatory compliance issues",
            "Discuss potential citations",
            "Review facility response to concerns",
          ],
          6: [
            "Review team member workload",
            "Discuss assignment distribution",
            "Review communication protocols",
          ],
          7: [
            "Plan tomorrow's priorities",
            "Assign new investigations",
            "Review schedule and timeline",
          ],
        },
        customItems: [...(currentAgenda.customItems || []), ...contextualItems],
        isGenerated: true,
        isEditing: false,
      };

      // Save to finalTeamMeeting if it exists, otherwise to dailyMeetingAgenda
      if (surveyData.finalTeamMeeting) {
        handleLocalDataChange("finalTeamMeeting", {
          ...surveyData.finalTeamMeeting,
          dailyMeetingAgenda: newAgenda,
        });
      } else {
        handleLocalDataChange("dailyMeetingAgenda", newAgenda);
      }
      toast.success("Daily meeting agenda generated successfully!");
    }
  };

  const handleEthicsComplianceChange = (hasConcerns) => {
    // Save to finalTeamMeeting if it exists, otherwise to root level
    if (surveyData.finalTeamMeeting) {
      handleLocalDataChange("finalTeamMeeting", {
        ...surveyData.finalTeamMeeting,
        ethicsComplianceConcerns: hasConcerns,
      });
    } else {
      handleLocalDataChange("ethicsComplianceConcerns", hasConcerns);
    }
  };

  const handleTeamDetermination = (
    itemId,
    decision,
    rationale,
    severity,
    scope,
    isSingularEvent,
    ijStartDate,
    ijEndDate
  ) => {
    // Get existing team determinations from finalTeamMeeting or root level
    const existingTeamDeterminations =
      surveyData.finalTeamMeeting?.teamDeterminations ||
      surveyData.teamDeterminations ||
      {};

    const updatedTeamDeterminations = {
      ...existingTeamDeterminations,
      [itemId]: {
        decision,
        rationale,
        severity,
        scope,
        isSingularEvent,
        ijStartDate,
        ijEndDate,
        date: new Date().toISOString(),
      },
    };

    // Save to finalTeamMeeting if it exists, otherwise to root level
    if (surveyData.finalTeamMeeting) {
      handleLocalDataChange("finalTeamMeeting", {
        ...surveyData.finalTeamMeeting,
        teamDeterminations: updatedTeamDeterminations,
      });
    } else {
      handleLocalDataChange("teamDeterminations", updatedTeamDeterminations);
    }
  };

  const hasSeverity2Plus = surveyData.citations?.some(
    (cit) =>
      cit.severity === "Immediate Jeopardy" ||
      (cit.severity === "Widespread" && cit.scope === "2")
  );



  // Handle final team meeting submission
  const handleFinalTeamMeetingSubmit = async (isContinueClicked = false) => {
    setIsLoading(true);
    const isTeamMember = isInvitedUser();
    const loadingToast = toast.loading(
      isTeamMember ? "Saving team member meeting..." : "Submitting final team meeting...",
      { position: "top-right" }
    );

    try {
      // Try to get survey ID from various possible locations
      const surveyId =
        surveyData.surveyId ||
        surveyData.id ||
        surveyData._id ||
        localStorage.getItem("currentSurveyId");

      if (!surveyId) {
        toast.dismiss(loadingToast);
        toast.error("Survey ID not found. Please refresh and try again.", {
          position: "top-right",
        });
        setIsLoading(false);
        return;
      }

      // Prepare the payload based on user type
      let payload;

      if (isTeamMember) {
        // Team member payload - simplified structure for invited users
        payload = {
          surveyId: surveyId,
          teamDeterminations: Object.entries(
            surveyData.finalTeamMeeting?.teamDeterminations ||
            surveyData.teamDeterminations ||
            {}
          ).map(([id, determination]) => ({
            id: id,
            decision: determination.decision || "",
            rationale: determination.rationale || "",
            severity: determination.severity || "",
            scope: determination.scope || "",
            isSingularEvent: determination.isSingularEvent || false,
            ijStartDate: determination.ijStartDate || "",
            ijEndDate: determination.ijEndDate || "",
            date: determination.date || new Date().toISOString(),
          })),
          investigations: (
            surveyData.finalTeamMeeting?.investigations ||
            surveyData.investigations ||
            []
          ).map(inv => ({
            id: inv.id || inv._id,
            type: inv.type || "surveyFinding",
            fTag: inv.fTag || "",
            title: inv.title || "",
            description: inv.description || "",
            status: inv.status || "active",
            date: inv.date || new Date().toISOString(),
            priority: inv.priority || "medium",
            source: inv.source || "manual",
          })),
        };
      } else {
        // Full payload for survey owner/coordinator
        payload = {
          surveyId: surveyId,
          dailyMeetingAgenda:
            surveyData.finalTeamMeeting?.dailyMeetingAgenda ||
            surveyData.dailyMeetingAgenda || {
              facilityName: facilityName || "",
              meetingDate: new Date().toLocaleDateString(),
              standardItems: [],
              standardSubItems: {},
              customItems: [],
              isGenerated: false,
              isEditing: false,
            },
          ethicsComplianceConcerns:
            surveyData.finalTeamMeeting?.ethicsComplianceConcerns ||
            surveyData.ethicsComplianceConcerns || false,
          teamDeterminations: Object.entries(
            surveyData.finalTeamMeeting?.teamDeterminations ||
            surveyData.teamDeterminations ||
            {}
          ).map(([id, determination]) => ({
            investigationId: id,
            ...determination,
          })),
          openingStatements:
            surveyData.finalTeamMeeting?.openingStatements ||
            surveyData.openingStatements || {},
          investigations:
            surveyData.finalTeamMeeting?.investigations ||
            surveyData.investigations ||
            [],
          dailyMeetings:
            surveyData.finalTeamMeeting?.dailyMeetings ||
            surveyData.dailyMeetings || [],
          status: "team-meetings"
        };
      }

      // Check if online before making API call
      if (!navigator.onLine) {
        // Save offline and inform user
        const saveOfflineData = async (payload) => {
          try {
            const offlineData = {
              ...payload,
              submittedAt: new Date().toISOString(),
              apiEndpoint: isTeamMember ? "submitTeamMemberMeeting" : "submitTeamMeeting", // Store which API to call
              apiMethod: "survey", // Store API method/namespace
            };

            // Step 1: Save to IndexedDB sync queue (permanent storage)
            let syncQueueId = null;
            if (payload.surveyId || surveyId) {
              const stepId = "team-meetings";
              const syncItem = await surveyIndexedDB.addToSyncQueue(
                payload.surveyId || surveyId,
                stepId,
                offlineData,
                "api_team_meetings" // type for API-based team meetings
              );
              syncQueueId = syncItem.id;
            }

            // Step 2: Update Zustand store (UI state) with sync queue ID
            useSurveyStore.getState().setOfflineData({
              ...offlineData,
              syncQueueId, // Store the sync queue ID for proper cleanup
            });

            // Step 3: If online, trigger sync attempt
            if (navigator.onLine) {
              // The sync service will automatically sync when online
              // But we can trigger an immediate sync attempt
              surveySyncService.syncUnsyncedData(payload.surveyId || surveyId).catch(
                (error) => {
                  // Sync failed, but data is saved offline - this is expected if still offline

                }
              );
            }
          } catch (error) {

            // Still try to save to Zustand even if IndexedDB fails
            useSurveyStore.getState().setOfflineData({
              ...payload,
              submittedAt: new Date().toISOString(),
            });
          }
        };

        await saveOfflineData(payload);
        setUnsavedChanges(new Set()); // Clear unsaved changes
        toast.dismiss(loadingToast);
        toast.success("Internet connectivity issues detected. Data saved offline and will sync when connection is restored.", {
          position: "top-right",
          duration: 5000,
        });
        setIsLoading(false);
        return; // Exit early - data is saved offline
      }

      // Submit the step data (only if online)
      // Use different endpoint based on user type
      const response = isTeamMember
        ? await api.survey.submitTeamMemberMeeting(payload)
        : await api.survey.submitTeamMeeting(payload);

      if (
        response &&
        (response.statusCode === 200 || response.statusCode === 201)
      ) {
        setUnsavedChanges(new Set()); // Clear unsaved changes
        toast.dismiss(loadingToast);

        if (isContinueClicked) {
          toast.success("Final team meeting submitted successfully! Moving to next step...", {
            position: "top-right",
            duration: 5000,
          });
          // Update survey data with response if available
          if (response.data) {
            if (response.data.finalTeamMeeting) {
              handleSurveyDataChange(
                "finalTeamMeeting",
                response.data.finalTeamMeeting
              );
            }
            if (response.data.status) {
              handleSurveyDataChange("status", response.data.status);
            }
          }
          // Move to next step (Mock Citations)
          setCurrentStep(9);
        } else {
          toast.success("Progress saved successfully!", {
            position: "top-right",
            duration: 3000,
          });
        }
      } else {
        throw new Error(response?.message || "Submission failed");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to submit final team meeting", {
        position: "top-right",
        description: error.message || "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-2">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
            {sectionData[7].title}
          </h2>

        </div>
        <p className="text-gray-500 text-xs sm:text-sm leading-tight max-w-5xl">
          {sectionData[7].description}
        </p>
        <div className="flex items-center gap-2 self-start sm:self-auto mt-3">
          {isSurveyClosed && (
            <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300">
              <Lock className="w-3 h-3 mr-1" />
              Survey Closed
            </Badge>
          )}
          <button
            onClick={async () => {
              setIsSyncingData(true);
              await fetchTeamMeetingData(false);
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
            {isSyncingData ? 'Syncing...' : 'Sync Team Meeting Data'}
          </button>
        </div>
      </div>

      {/* Auto-Rule Banner */}
      {hasSeverity2Plus && (
        <div className="mb-4 sm:mb-6 bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-4">
          <div className="flex items-center">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                Auto-Rule: Facility Not Certified
              </h3>
              <p className="text-sm sm:text-base text-gray-700">
                Any tag at severity ≥2 → facility not certified
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Daily Meeting Screen */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 mb-6 sm:mb-8">
        {/* Auto-Populated Agenda */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
            <h4 className="text-sm sm:text-base font-semibold text-gray-900">
              Meeting Agenda Based on Completed Outstanding Tasks
            </h4>
          </div>

          <div className="space-y-4">
            {!(
              surveyData.finalTeamMeeting?.dailyMeetingAgenda ||
              surveyData.dailyMeetingAgenda
            )?.isGenerated ||
              (
                surveyData.finalTeamMeeting?.dailyMeetingAgenda ||
                surveyData.dailyMeetingAgenda
              )?.isEditing ? (
              <>
                <p className="text-sm text-gray-600">
                  {(
                    surveyData.finalTeamMeeting?.dailyMeetingAgenda ||
                    surveyData.dailyMeetingAgenda
                  )?.isEditing
                    ? "Edit your daily meeting agenda. Make changes below and click 'Save Changes' to update."
                    : "Create a comprehensive daily team meeting agenda based on current survey progress and findings."}
                </p>

                {/* Facility Information */}
                <div className="p-3 sm:p-4 bg-gray-10 border border-gray-200 rounded-lg">
                  <h5 className="text-sm sm:text-base font-medium text-gray-900 mb-3">
                    Meeting Information
                  </h5>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <Building className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                        <span className="text-xs font-medium text-gray-700">
                          Facility Name:
                        </span>
                        <span className="sm:ml-2 text-xs sm:text-sm text-gray-900 font-medium">
                          {facilityName || "No facility selected"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <Calendar className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0">
                        <span className="text-xs font-medium text-gray-700">
                          Meeting Date:
                        </span>
                        <span className="sm:ml-2 text-xs sm:text-sm text-gray-900">
                          {new Date().toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Standard Agenda Items Preview */}
                <div className="p-3 sm:p-4 bg-gray-10 border border-gray-200 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <h5 className="text-sm sm:text-base font-medium text-gray-900">
                        {surveyData.dailyMeetingAgenda?.isEditing
                          ? "Edit Meeting Topics"
                          : "Meeting Topics (will be included):"}
                      </h5>
                      {surveyData.dailyMeetingAgenda?.isEditing && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-blue-100 text-blue-800 border-blue-200"
                        >
                          Edit Mode
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Show editable interface when in edit mode */}
                  {(
                    surveyData.finalTeamMeeting?.dailyMeetingAgenda ||
                    surveyData.dailyMeetingAgenda
                  )?.isEditing ? (
                    <div className="mt-4 space-y-3">
                      <div className="text-sm text-gray-700 mb-3">
                        <p>
                          Edit the daily meeting topics and their discussion
                          points below. Make changes and click 'Save Changes' to
                          update.
                        </p>
                      </div>
                      <div className="space-y-3">
                        {(
                          (
                            surveyData.finalTeamMeeting?.dailyMeetingAgenda ||
                            surveyData.dailyMeetingAgenda
                          )?.standardItems || [
                            "Review Survey Progress",
                            "Discuss Investigation Findings",
                            "Review Resident Observations",
                            "Discuss Staff Interactions",
                            "Review Documentation Status",
                            "Discuss Compliance Concerns",
                            "Review Team Coordination",
                            "Plan Next Day Priorities",
                          ]
                        ).map((item, index) => (
                          <div
                            key={index}
                            className="p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="text-sm sm:text-base font-medium text-gray-900 mb-3">
                              {index + 1}.{" "}
                              {surveyData.dailyMeetingAgenda?.standardItems?.[
                                index
                              ] || item}
                            </div>

                            {/* Main Item Title */}
                            <div className="mb-3">
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Meeting Topic:
                              </label>
                              <textarea
                                value={
                                  (
                                    surveyData.finalTeamMeeting
                                      ?.dailyMeetingAgenda ||
                                    surveyData.dailyMeetingAgenda
                                  )?.standardItems?.[index] || item
                                }
                                onChange={(e) => {
                                  const currentAgenda =
                                    surveyData.finalTeamMeeting
                                      ?.dailyMeetingAgenda ||
                                    surveyData.dailyMeetingAgenda;
                                  const currentStandardItems =
                                    currentAgenda?.standardItems || [
                                      "Review Survey Progress",
                                      "Discuss Investigation Findings",
                                      "Review Resident Observations",
                                      "Discuss Staff Interactions",
                                      "Review Documentation Status",
                                      "Discuss Compliance Concerns",
                                      "Review Team Coordination",
                                      "Plan Next Day Priorities",
                                    ];
                                  const updatedStandardItems = [
                                    ...currentStandardItems,
                                  ];
                                  updatedStandardItems[index] = e.target.value;

                                  const updatedAgenda = {
                                    ...currentAgenda,
                                    standardItems: updatedStandardItems,
                                  };

                                  // Save to finalTeamMeeting if it exists, otherwise to dailyMeetingAgenda
                                  if (surveyData.finalTeamMeeting) {
                                    handleLocalDataChange("finalTeamMeeting", {
                                      ...surveyData.finalTeamMeeting,
                                      dailyMeetingAgenda: updatedAgenda,
                                    });
                                  } else {
                                    handleLocalDataChange(
                                      "dailyMeetingAgenda",
                                      updatedAgenda
                                    );
                                  }
                                }}
                                placeholder={item}
                                rows={2}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none transition-colors"
                              />
                            </div>

                            {/* Sub-menu Items */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Discussion Points:
                              </label>
                              <div className="space-y-2">
                                {(() => {
                                  // Get default sub-items based on index
                                  const getDefaultSubItems = (idx) => {
                                    const defaults = {
                                      0: [
                                        "Review completed investigations",
                                        "Discuss ongoing investigation status",
                                        "Review findings and evidence collected",
                                      ],
                                      1: [
                                        "Review investigation outcomes",
                                        "Discuss citation decisions",
                                        "Review supporting documentation",
                                      ],
                                      2: [
                                        "Review resident interviews",
                                        "Discuss resident observations",
                                        "Review resident complaints or concerns",
                                      ],
                                      3: [
                                        "Review staff interview outcomes",
                                        "Discuss staff performance observations",
                                        "Review staff training and competency",
                                      ],
                                      4: [
                                        "Review documentation completeness",
                                        "Discuss missing or incomplete records",
                                        "Review documentation accuracy",
                                      ],
                                      5: [
                                        "Review regulatory compliance issues",
                                        "Discuss potential citations",
                                        "Review facility response to concerns",
                                      ],
                                      6: [
                                        "Review team member workload",
                                        "Discuss assignment distribution",
                                        "Review communication protocols",
                                      ],
                                      7: [
                                        "Plan tomorrow's priorities",
                                        "Assign new investigations",
                                        "Review schedule and timeline",
                                      ],
                                    };
                                    return defaults[idx] || [];
                                  };

                                  // Get current sub-items or use defaults
                                  const currentAgenda =
                                    surveyData.finalTeamMeeting
                                      ?.dailyMeetingAgenda ||
                                    surveyData.dailyMeetingAgenda;
                                  const currentSubItems =
                                    currentAgenda?.standardSubItems || {};
                                  const currentItemSubItems =
                                    currentSubItems[index] ||
                                    getDefaultSubItems(index);

                                  return currentItemSubItems.map(
                                    (subItem, subIndex) => (
                                      <div
                                        key={subIndex}
                                        className="flex items-center space-x-2"
                                      >
                                        <span className="text-xs text-gray-500 w-4">
                                          •
                                        </span>
                                        <textarea
                                          value={subItem}
                                          onChange={(e) => {
                                            const updatedSubItems = [
                                              ...currentItemSubItems,
                                            ];
                                            updatedSubItems[subIndex] =
                                              e.target.value;

                                            const updatedAgenda = {
                                              ...currentAgenda,
                                              standardSubItems: {
                                                ...currentSubItems,
                                                [index]: updatedSubItems,
                                              },
                                            };

                                            // Save to finalTeamMeeting if it exists, otherwise to dailyMeetingAgenda
                                            if (surveyData.finalTeamMeeting) {
                                              handleLocalDataChange(
                                                "finalTeamMeeting",
                                                {
                                                  ...surveyData.finalTeamMeeting,
                                                  dailyMeetingAgenda:
                                                    updatedAgenda,
                                                }
                                              );
                                            } else {
                                              handleLocalDataChange(
                                                "dailyMeetingAgenda",
                                                updatedAgenda
                                              );
                                            }
                                          }}
                                          placeholder="Enter discussion point"
                                          rows={1}
                                          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 resize-none transition-colors"
                                        />
                                        <Button
                                          onClick={() => {
                                            const updatedSubItems =
                                              currentItemSubItems.filter(
                                                (_, i) => i !== subIndex
                                              );

                                            const updatedAgenda = {
                                              ...currentAgenda,
                                              standardSubItems: {
                                                ...currentSubItems,
                                                [index]: updatedSubItems,
                                              },
                                            };

                                            // Save to finalTeamMeeting if it exists, otherwise to dailyMeetingAgenda
                                            if (surveyData.finalTeamMeeting) {
                                              handleLocalDataChange(
                                                "finalTeamMeeting",
                                                {
                                                  ...surveyData.finalTeamMeeting,
                                                  dailyMeetingAgenda:
                                                    updatedAgenda,
                                                }
                                              );
                                            } else {
                                              handleLocalDataChange(
                                                "dailyMeetingAgenda",
                                                updatedAgenda
                                              );
                                            }
                                          }}
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    )
                                  );
                                })()}
                              </div>

                              {/* Add New Sub-menu Item Button */}
                              <div className="mt-3">
                                <Button
                                  onClick={() => {
                                    const getDefaultSubItems = (idx) => {
                                      const defaults = {
                                        0: [
                                          "Review completed investigations",
                                          "Discuss ongoing investigation status",
                                          "Review findings and evidence collected",
                                        ],
                                        1: [
                                          "Review investigation outcomes",
                                          "Discuss citation decisions",
                                          "Review supporting documentation",
                                        ],
                                        2: [
                                          "Review resident interviews",
                                          "Discuss resident observations",
                                          "Review resident complaints or concerns",
                                        ],
                                        3: [
                                          "Review staff interview outcomes",
                                          "Discuss staff performance observations",
                                          "Review staff training and competency",
                                        ],
                                        4: [
                                          "Review documentation completeness",
                                          "Discuss missing or incomplete records",
                                          "Review documentation accuracy",
                                        ],
                                        5: [
                                          "Review regulatory compliance issues",
                                          "Discuss potential citations",
                                          "Review facility response to concerns",
                                        ],
                                        6: [
                                          "Review team member workload",
                                          "Discuss assignment distribution",
                                          "Review communication protocols",
                                        ],
                                        7: [
                                          "Plan tomorrow's priorities",
                                          "Assign new investigations",
                                          "Review schedule and timeline",
                                        ],
                                      };
                                      return defaults[idx] || [];
                                    };

                                    const currentAgenda =
                                      surveyData.finalTeamMeeting
                                        ?.dailyMeetingAgenda ||
                                      surveyData.dailyMeetingAgenda;
                                    const currentSubItems =
                                      currentAgenda?.standardSubItems || {};
                                    const currentItemSubItems =
                                      currentSubItems[index] ||
                                      getDefaultSubItems(index);
                                    const newSubItem = "New discussion point";
                                    const updatedSubItems = [
                                      ...currentItemSubItems,
                                      newSubItem,
                                    ];

                                    const updatedAgenda = {
                                      ...currentAgenda,
                                      standardSubItems: {
                                        ...currentSubItems,
                                        [index]: updatedSubItems,
                                      },
                                    };

                                    // Save to finalTeamMeeting if it exists, otherwise to dailyMeetingAgenda
                                    if (surveyData.finalTeamMeeting) {
                                      handleLocalDataChange(
                                        "finalTeamMeeting",
                                        {
                                          ...surveyData.finalTeamMeeting,
                                          dailyMeetingAgenda: updatedAgenda,
                                        }
                                      );
                                    } else {
                                      handleLocalDataChange(
                                        "dailyMeetingAgenda",
                                        updatedAgenda
                                      );
                                    }
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-2 text-xs text-gray-600 border-gray-300 hover:bg-gray-50"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Discussion Point
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Custom Items - Editable in Edit Mode */}
                      {(
                        surveyData.finalTeamMeeting?.dailyMeetingAgenda ||
                        surveyData.dailyMeetingAgenda
                      )?.customItems &&
                        (
                          surveyData.finalTeamMeeting?.dailyMeetingAgenda ||
                          surveyData.dailyMeetingAgenda
                        ).customItems.length > 0 && (
                          <div className="mt-6 pt-4 border-t border-gray-200">
                            <h6 className="font-medium text-gray-800 mb-3">
                              Additional Meeting Topics:
                            </h6>
                            <div className="space-y-3">
                              {(
                                surveyData.finalTeamMeeting
                                  ?.dailyMeetingAgenda ||
                                surveyData.dailyMeetingAgenda
                              ).customItems.map((item, index) => (
                                <div
                                  key={index}
                                  className="p-3 bg-gray-50 rounded-lg"
                                >
                                  <div className="font-medium text-gray-900 mb-2">
                                    {index + 9}. Additional Topic: {item}
                                  </div>
                                  <textarea
                                    value={item}
                                    onChange={(e) => {
                                      const currentAgenda =
                                        surveyData.finalTeamMeeting
                                          ?.dailyMeetingAgenda ||
                                        surveyData.dailyMeetingAgenda;
                                      const currentCustomItems = [
                                        ...currentAgenda.customItems,
                                      ];
                                      currentCustomItems[index] =
                                        e.target.value;

                                      const updatedAgenda = {
                                        ...currentAgenda,
                                        customItems: currentCustomItems,
                                      };

                                      // Save to finalTeamMeeting if it exists, otherwise to dailyMeetingAgenda
                                      if (surveyData.finalTeamMeeting) {
                                        handleLocalDataChange(
                                          "finalTeamMeeting",
                                          {
                                            ...surveyData.finalTeamMeeting,
                                            dailyMeetingAgenda: updatedAgenda,
                                          }
                                        );
                                      } else {
                                        handleLocalDataChange(
                                          "dailyMeetingAgenda",
                                          updatedAgenda
                                        );
                                      }
                                    }}
                                    placeholder="Enter additional meeting topic"
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none transition-colors"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-gray-700">
                      <p>
                        8 daily meeting topics will be automatically included in
                        your meeting agenda.
                      </p>
                      <p className="text-xs mt-1">
                        Click "Generate Mock Meeting Agenda" to create your
                        daily meeting agenda.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2">
                  {(
                    surveyData.finalTeamMeeting?.dailyMeetingAgenda ||
                    surveyData.dailyMeetingAgenda
                  )?.isEditing && (
                      <Button
                        onClick={() => {
                          // Cancel editing and return to generated view
                          const currentAgenda =
                            surveyData.finalTeamMeeting?.dailyMeetingAgenda ||
                            surveyData.dailyMeetingAgenda;
                          const updatedAgenda = {
                            ...currentAgenda,
                            isGenerated: true,
                            isEditing: false,
                          };

                          // Save to finalTeamMeeting if it exists, otherwise to dailyMeetingAgenda
                          if (surveyData.finalTeamMeeting) {
                            handleLocalDataChange("finalTeamMeeting", {
                              ...surveyData.finalTeamMeeting,
                              dailyMeetingAgenda: updatedAgenda,
                            });
                          } else {
                            handleLocalDataChange(
                              "dailyMeetingAgenda",
                              updatedAgenda
                            );
                          }
                        }}
                        variant="outline"
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm"
                      >
                        Cancel
                      </Button>
                    )}

                  <Button
                    onClick={handleGenerateDailyMeetingAgenda}
                    disabled={!facilityName || isInvitedUser() || isSurveyClosed}
                    variant="outline"
                    className="w-full sm:w-auto hover:bg-gray-50 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                  >
                    {(
                      surveyData.finalTeamMeeting?.dailyMeetingAgenda ||
                      surveyData.dailyMeetingAgenda
                    )?.isEditing
                      ? "Save Changes"
                      : "Generate "}
                  </Button>
                </div>

                {!facilityName && (
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Please select a facility in Survey Setup to generate a daily
                    meeting agenda
                  </p>
                )}
              </>
            ) : (
              <>
                {/* Generated Agenda Display */}
                <div id="printable-daily-agenda" className="space-y-4">
                  {/* Header Information */}
                  <div className="text-left p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-2">
                      Team Meeting -{" "}
                      {surveyData.finalTeamMeeting?.dailyMeetingAgenda
                        ?.facilityName ||
                        surveyData.dailyMeetingAgenda?.facilityName ||
                        facilityName ||
                        "Facility"}
                    </h5>
                    <p className="text-sm text-gray-700 mb-2">
                      Meeting Date:{" "}
                      {surveyData.finalTeamMeeting?.dailyMeetingAgenda
                        ?.meetingDate ||
                        surveyData.dailyMeetingAgenda?.meetingDate ||
                        new Date().toLocaleDateString()}
                    </p>
                  </div>

                  {/* Standard Agenda Items with Bullet Points */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900">
                      Meeting Topics:
                    </h5>
                    <div className="space-y-3">
                      {(
                        surveyData.finalTeamMeeting?.dailyMeetingAgenda
                          ?.standardItems ||
                        surveyData.dailyMeetingAgenda?.standardItems || [
                          "Review Survey Progress",
                          "Discuss Investigation Findings",
                          "Review Resident Observations",
                          "Discuss Staff Interactions",
                          "Review Documentation Status",
                          "Discuss Compliance Concerns",
                          "Review Team Coordination",
                          "Plan Priorities",
                        ]
                      ).map((item, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium text-gray-900 mb-2">
                            {index + 1}. {item}
                          </div>
                          <ul className="ml-4 space-y-1 text-sm text-gray-700">
                            {(
                              surveyData.finalTeamMeeting?.dailyMeetingAgenda
                                ?.standardSubItems?.[index] ||
                              surveyData.dailyMeetingAgenda?.standardSubItems?.[
                              index
                              ] || [
                                "Review completed investigations",
                                "Discuss ongoing investigation status",
                                "Review findings and evidence collected",
                              ]
                            ).map((subItem, subIndex) => (
                              <li key={subIndex}>• {subItem}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Agenda Items */}
                  {surveyData.dailyMeetingAgenda?.customItems &&
                    surveyData.dailyMeetingAgenda.customItems.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-gray-900">
                          Additional Meeting Topics:
                        </h5>
                        <div className="space-y-2">
                          {surveyData.dailyMeetingAgenda.customItems.map(
                            (item, index) => (
                              <div
                                key={index}
                                className="p-3 bg-gray-50 rounded-lg border-l-4 border-gray-300"
                              >
                                <div className="font-medium text-gray-900">
                                  {index + 9}. Additional Topic: {item}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Action Buttons */}
                  <div className=" pt-4">
                    <div className="flex flex-wrap gap-2 ">
                      <Button
                        onClick={() => {
                          // Switch to edit mode while preserving all agenda data
                          const currentAgenda =
                            surveyData.finalTeamMeeting?.dailyMeetingAgenda ||
                            surveyData.dailyMeetingAgenda;
                          const updatedAgenda = {
                            ...currentAgenda,
                            isGenerated: false,
                            isEditing: true,
                          };

                          // Save to finalTeamMeeting if it exists, otherwise to dailyMeetingAgenda
                          if (surveyData.finalTeamMeeting) {
                            handleLocalDataChange("finalTeamMeeting", {
                              ...surveyData.finalTeamMeeting,
                              dailyMeetingAgenda: updatedAgenda,
                            });
                          } else {
                            handleLocalDataChange(
                              "dailyMeetingAgenda",
                              updatedAgenda
                            );
                          }
                        }}
                        disabled={isInvitedUser() || isSurveyClosed}
                        variant="outline"
                        className="px-6 py-2"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Edit Meeting Agenda
                      </Button>

                      <Button
                        onClick={() => {
                          toast.error(
                            "Are you sure you want to delete this agenda?",
                            {
                              description: "This action cannot be undone.",
                              action: {
                                label: "Delete",
                                onClick: () => {
                                  // Reset agenda data
                                  const resetAgenda = {
                                    facilityName:
                                      facilityName || "Facility Name",
                                    meetingDate:
                                      new Date().toLocaleDateString(),
                                    customItems: [],
                                    isGenerated: false,
                                    isEditing: false,
                                    standardItems: undefined,
                                    standardSubItems: undefined,
                                  };

                                  // Save to finalTeamMeeting if it exists, otherwise to dailyMeetingAgenda
                                  if (surveyData.finalTeamMeeting) {
                                    handleLocalDataChange("finalTeamMeeting", {
                                      ...surveyData.finalTeamMeeting,
                                      dailyMeetingAgenda: resetAgenda,
                                    });
                                  } else {
                                    handleLocalDataChange(
                                      "dailyMeetingAgenda",
                                      resetAgenda
                                    );
                                  }

                                  handleLocalDataChange(
                                    "newDailyAgendaItem",
                                    ""
                                  );
                                  toast.success(
                                    "Daily team meeting agenda deleted successfully"
                                  );
                                },
                              },
                              cancel: {
                                label: "Cancel",
                                onClick: () => {
                                  // User cancelled deletion
                                },
                              },
                              duration: 10000, // 10 seconds to give user time to decide
                            }
                          );
                        }}
                        disabled={isInvitedUser() || isSurveyClosed}
                        variant="outline"
                        className="px-6 py-2 text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Delete Meeting Agenda
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Ethics/Compliance Prompt */}
        <div className="mb-6">
          <h4 className="text-base font-semibold text-gray-900 mb-3">
            Ethics/Compliance Concerns
          </h4>
          <div className="bg-gray-10 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-800 mb-3">
              Are there any unethical, criminal, civil, or administrative
              concerns identified?
            </p>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="ethicsCompliance"
                  value="yes"
                  checked={
                    !!(
                      surveyData.finalTeamMeeting?.ethicsComplianceConcerns ??
                      surveyData.ethicsComplianceConcerns ??
                      false
                    )
                  }
                  disabled={isInvitedUser() || isSurveyClosed}
                  onChange={() => handleEthicsComplianceChange(true)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-800">Yes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="ethicsCompliance"
                  value="no"
                  checked={
                    !(
                      surveyData.finalTeamMeeting?.ethicsComplianceConcerns ??
                      surveyData.ethicsComplianceConcerns ??
                      false
                    )
                  }
                  disabled={isInvitedUser() || isSurveyClosed}
                  onChange={() => handleEthicsComplianceChange(false)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-800">No</span>
              </label>
            </div>
            {(surveyData.finalTeamMeeting?.ethicsComplianceConcerns ??
              surveyData.ethicsComplianceConcerns ??
              false) && (
                <div className="mt-3 p-3 bg-gray-100 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-800 font-medium">
                    Notify Facility Leadership for additional investigation
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Readiness Checks */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Readiness Checks
          </h3>
        </div>

        {/* Overall Team Readiness Summary */}
        <div className="mb-6 p-3 sm:p-4 bg-gray-10 border border-gray-200 rounded-lg">
          {isLoadingTeamMembers ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
              <span className="text-xs sm:text-sm text-gray-600">
                Loading team data...
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {teamMembers.length}
                </div>
                <div className="text-sm text-gray-600">Team Members</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {(
                    surveyData.finalTeamMeeting?.investigations ||
                    surveyData.investigations
                  )?.filter((inv) => inv.title && inv.title.trim() !== "")
                    .length || 0}
                </div>
                <div className="text-sm text-gray-600">Valid Findings</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {(
                    surveyData.finalTeamMeeting?.investigations ||
                    surveyData.investigations
                  )?.filter(
                    (inv) =>
                      inv.title &&
                      inv.title.trim() !== "" &&
                      inv.status === "completed"
                  ).length || 0}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {(
                    surveyData.finalTeamMeeting?.investigations ||
                    surveyData.investigations
                  )?.filter(
                    (inv) =>
                      inv.title &&
                      inv.title.trim() !== "" &&
                      inv.status !== "completed"
                  ).length || 0}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          )}
        </div>

        {/* Per-Surveyor Investigations */}
        <div className="mb-6">
          <h4 className="text-base font-semibold text-gray-900 mb-3">
            Team Member Assignments
          </h4>

          {isLoadingTeamMembers ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                <span className="text-sm text-gray-600">
                  Loading team members...
                </span>
              </div>
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No team members found for this survey</p>
              <p className="text-sm mt-1">
                Please add team members in the Survey Setup page
              </p>
            </div>
          ) : ( 
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMembers.map((member, index) => {
                // Find the corresponding member in surveyData to get teamMemberUserId
                const surveyMember = surveyData.teamMembers?.find(
                  (m) => String(m._id) === String(member.id)
                );
                // Use member.teamMemberUserId if available (from API), otherwise from surveyData
                const teamMemberUserId = member.teamMemberUserId || surveyMember?.teamMemberUserId;

                // 1. Get assigned residents count from API data (API returns count directly)
                const assignedResidentsCount = typeof teamMemberResidents[member.id] === 'number'
                  ? teamMemberResidents[member.id]
                  : 0;

                // 2. Find assigned mandatory tasks count - use API data (assignedFacility array) first, fallback to surveyData
                let assignedTasksCount = 0;
                
                if (assignedFacilityTasks.length > 0) {
                  // Use API data (assignedFacility is an array)
                  assignedTasksCount = assignedFacilityTasks.filter((task) => {
                    // Match by teamMemberUserId (UUID)
                    if (
                      teamMemberUserId &&
                      task.teamMemberUserId &&
                      String(task.teamMemberUserId) === String(teamMemberUserId)
                    ) {
                      return true;
                    }
                    // Match by teamMemberId._id (MongoDB ObjectId)
                    if (
                      task.teamMemberId?._id &&
                      String(task.teamMemberId._id) === String(member.id)
                    ) {
                      return true;
                    }
                    // Match by teamMemberId directly (string)
                    if (
                      task.teamMemberId &&
                      typeof task.teamMemberId === 'string' &&
                      String(task.teamMemberId) === String(member.id)
                    ) {
                      return true;
                    }
                    return false;
                  }).length;
                } else {
                  // Fallback to surveyData.mandatoryTasks (object format)
                  assignedTasksCount = Object.values(surveyData.mandatoryTasks || {}).filter((task) => {
                    // Match by teamMemberUserId (UUID)
                    if (
                      teamMemberUserId &&
                      task.teamMemberUserId &&
                      String(task.teamMemberUserId) === String(teamMemberUserId)
                    ) {
                      return true;
                    }
                    // Match by teamMemberId._id (MongoDB ObjectId)
                    if (
                      task.teamMemberId?._id &&
                      String(task.teamMemberId._id) === String(member.id)
                    ) {
                      return true;
                    }
                    // Match by teamMemberId directly (string)
                    if (
                      task.teamMemberId &&
                      typeof task.teamMemberId === 'string' &&
                      String(task.teamMemberId) === String(member.id)
                    ) {
                      return true;
                    }
                    return false;
                  }).length;
                }

                // 3. Find investigations count
                const investigationsCount = (
                  surveyData.finalTeamMeeting?.investigations ||
                  surveyData.investigations ||
                  []
                ).filter((inv) => {
                  const matchesSurveyorId =
                    inv.surveyorId === member.id ||
                    String(inv.surveyorId) === String(member.id);
                  const matchesAssignedTo =
                    inv.assignedTo === member.id ||
                    String(inv.assignedTo) === String(member.id);
                  const matchesAssignedToId =
                    inv.assignedToId === member.id ||
                    String(inv.assignedToId) === String(member.id);

                  return (
                    matchesSurveyorId ||
                    matchesAssignedTo ||
                    matchesAssignedToId
                  );
                }).length;

                const totalItems =
                  assignedResidentsCount +
                  assignedTasksCount +
                  investigationsCount;

                return (
                  <div
                    key={`${member.id}-${index}`}
                    className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#075b7d]/10 flex items-center justify-center text-[#075b7d] font-semibold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {member.name}
                          </div>

                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <span className="text-gray-600">
                          Assigned Residents
                        </span>
                        <span className="font-semibold text-gray-900">
                          {isLoadingResidents ? (
                            <span className="inline-flex items-center">
                              <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </span>
                          ) : (
                            assignedResidentsCount
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <span className="text-gray-600">Mandatory Tasks</span>
                        <span className="font-semibold text-gray-900">
                          {isLoadingMandatoryTasks ? (
                            <span className="inline-flex items-center">
                              <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </span>
                          ) : (
                            assignedTasksCount
                          )}
                        </span>
                      </div>

                    </div>

                    {totalItems === 0 && (
                      <div className="mt-3 text-center text-xs text-gray-400 italic">
                        No active assignments
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Evidence Requirements & Decision Templates */}
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="text-base font-semibold text-gray-900 mb-3">
            Evidence Requirements & Decision Templates
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-gray-800 mb-2">
                Required Evidence for Citations:
              </h5>
              <ul className="space-y-1 text-gray-700">
                <li>• Resident interviews/observations</li>
                <li>• Staff interviews</li>
                <li>• Medical record documentation</li>
                <li>• Policy/procedure review</li>
                <li>• Direct observation of practices</li>
                <li>• Incident reports/quality data</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-800 mb-2">
                Common Citation Scenarios:
              </h5>
              <div className="space-y-2">
                <div className="p-2 bg-gray-50 rounded border border-gray-200">
                  <span className="font-medium text-gray-800">
                    Medication Errors:
                  </span>
                  <p className="text-xs text-gray-700">
                    Severity 2-3, Scope P/W if multiple residents
                  </p>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-200">
                  <span className="font-medium text-gray-800">
                    Fall Prevention:
                  </span>
                  <p className="text-xs text-gray-700">
                    Severity 2-4, Scope P/W if systematic failure
                  </p>
                </div>
                <div className="p-2 bg-gray-50 rounded border border-gray-200">
                  <span className="font-medium text-gray-800">
                    Pressure Ulcers:
                  </span>
                  <p className="text-xs text-gray-700">
                    Severity 2-3, Scope I/P based on assessment
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Determination Board */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Team Determination Board
        </h3>

        {/* Citation Decision Guidance */}
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="text-base font-semibold text-gray-900 mb-3">
            Citation Decision Guidance
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-gray-800 mb-2">When to CITE:</h5>
              <ul className="space-y-1 text-gray-700">
                <li>• Resident harm or potential for harm</li>
                <li>• Regulatory non-compliance</li>
                <li>• Pattern of deficient practices</li>
                <li>• Widespread issues affecting multiple residents</li>
                <li>• Failure to meet minimum standards</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-800 mb-2">
                When NOT to Cite:
              </h5>
              <ul className="space-y-1 text-gray-700">
                <li>• Isolated incidents with no pattern</li>
                <li>• Minor documentation issues</li>
                <li>• Issues already corrected</li>
                <li>• Insufficient evidence</li>
                <li>• Administrative preferences only</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 p-3 bg-gray-10 border border-gray-200 rounded">
            <p className="text-xs text-gray-700">
              <strong>Key Principle:</strong> Citations should be based on
              evidence of deficient practices that affect resident care, not on
              administrative preferences or minor issues.
            </p>
          </div>
        </div>

        {/* Severity & Scope Guide */}
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="text-base font-semibold text-gray-900 mb-3">
            Severity & Scope Decision Matrix
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-gray-800 mb-2">
                Severity Levels:
              </h5>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-gray-100 text-gray-800 rounded-full text-xs font-bold flex items-center justify-center">
                    4
                  </span>
                  <span className="text-gray-700">
                    Immediate Jeopardy - Resident safety at risk
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-gray-100 text-gray-800 rounded-full text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <span className="text-gray-700">
                    Serious - Actual harm or high potential for harm
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-gray-100 text-gray-800 rounded-full text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <span className="text-gray-700">
                    Moderate - Minimal harm or moderate potential
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-gray-100 text-gray-800 rounded-full text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <span className="text-gray-700">
                    Minimal - No actual harm, low potential
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-medium text-gray-800 mb-2">Scope Levels:</h5>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-gray-100 text-gray-800 rounded-full text-xs font-bold flex items-center justify-center">
                    I
                  </span>
                  <span className="text-gray-700">
                    Isolated - Single resident/incident
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-gray-100 text-gray-800 rounded-full text-xs font-bold flex items-center justify-center">
                    P
                  </span>
                  <span className="text-gray-700">
                    Pattern - Multiple residents, same issue
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-gray-100 text-gray-800 rounded-full text-xs font-bold flex items-center justify-center">
                    W
                  </span>
                  <span className="text-gray-700">
                    Widespread - Facility-wide issue
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary of Determinations */}
        <div className="mb-6 p-4 bg-gray-10 border border-gray-200 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {(
                  surveyData.finalTeamMeeting?.investigations ||
                  surveyData.investigations
                )?.filter((inv) => inv.title && inv.title.trim() !== "")
                  .length || 0}
              </div>
              <div className="text-sm text-gray-600">Valid Findings</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-700">
                {(
                  surveyData.finalTeamMeeting?.investigations ||
                  surveyData.investigations
                )?.filter(
                  (inv) =>
                    inv.title &&
                    inv.title.trim() !== "" &&
                    !(surveyData.finalTeamMeeting?.teamDeterminations ||
                      surveyData.teamDeterminations)?.[inv.id]?.decision
                ).length || 0}
              </div>
              <div className="text-sm text-gray-600">Pending Decisions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-700">
                {(
                  surveyData.finalTeamMeeting?.investigations ||
                  surveyData.investigations
                )?.filter(
                  (inv) =>
                    inv.title &&
                    inv.title.trim() !== "" &&
                    (surveyData.finalTeamMeeting?.teamDeterminations ||
                      surveyData.teamDeterminations)?.[inv.id]?.decision ===
                    "cite"
                ).length || 0}
              </div>
              <div className="text-sm text-gray-600">Decision: Cite</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-700">
                {(
                  surveyData.finalTeamMeeting?.investigations ||
                  surveyData.investigations
                )?.filter(
                  (inv) =>
                    inv.title &&
                    inv.title.trim() !== "" &&
                    (surveyData.finalTeamMeeting?.teamDeterminations ||
                      surveyData.teamDeterminations)?.[inv.id]?.decision ===
                    "dontCite"
                ).length || 0}
              </div>
              <div className="text-sm text-gray-600">Decision: Don't Cite</div>
            </div>
          </div>
        </div>

        {/* All Findings Summary */}
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-semibold text-gray-900">
                All Findings Summary
              </h4>
              <span className="text-sm text-gray-600">
                {(
                  surveyData.finalTeamMeeting?.investigations ||
                  surveyData.investigations
                )?.filter((inv) => inv.title && inv.title.trim() !== "")
                  .length || 0}{" "}
                Valid Findings
              </span>
            </div>
            <Button
              onClick={() => {
                // Show the add finding form
                handleLocalDataChange("showAddFindingForm", true);
              }}
              disabled={isSurveyClosed}
              className="bg-[#075b7d] hover:bg-[#064d63] text-white px-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Finding
            </Button>
          </div>

          {/* Add Finding Form - Shows when button is clicked */}
          {surveyData.showAddFindingForm && (
            <div className="mb-6 p-4 bg-[#075b7d]/5 border border-[#075b7d]/20 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-semibold text-gray-900">
                  Add New Survey Finding
                </h5>
                <button
                  onClick={() => {
                    handleLocalDataChange("showAddFindingForm", false);
                    handleLocalDataChange("newFinding", {
                      fTag: "",
                      title: "",
                      description: "",
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    F-Tag Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., F686, F812, F880"
                    value={surveyData.newFinding?.fTag || ""}
                    onChange={(e) =>
                      handleLocalDataChange("newFinding", {
                        ...surveyData.newFinding,
                        fTag: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#075b7d]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Finding Title *
                  </label>
                  <input
                    type="text"
                    placeholder="Brief description of the finding"
                    value={surveyData.newFinding?.title || ""}
                    onChange={(e) =>
                      handleLocalDataChange("newFinding", {
                        ...surveyData.newFinding,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#075b7d]"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Finding Description *
                </label>
                <textarea
                  placeholder="Describe the deficient practice or issue identified during the survey..."
                  value={surveyData.newFinding?.description || ""}
                  onChange={(e) =>
                    handleLocalDataChange("newFinding", {
                      ...surveyData.newFinding,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#075b7d]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => {
                    handleLocalDataChange("showAddFindingForm", false);
                    handleLocalDataChange("newFinding", {
                      fTag: "",
                      title: "",
                      description: "",
                    });
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (
                      surveyData.newFinding?.fTag &&
                      surveyData.newFinding?.title &&
                      surveyData.newFinding?.description
                    ) {
                      // Create new investigation from finding
                      const newInvestigation = {
                        id: Date.now(),
                        type: "surveyFinding",
                        fTag: surveyData.newFinding.fTag,
                        title: surveyData.newFinding.title,
                        description: surveyData.newFinding.description,
                        status: "active",
                        date: new Date().toISOString(),
                        priority: "medium",
                        source: "manual",
                      };

                      const updatedInvestigations = [
                        ...(surveyData.finalTeamMeeting?.investigations ||
                          surveyData.investigations ||
                          []),
                        newInvestigation,
                      ];
                      // Save to finalTeamMeeting if it exists, otherwise to root level
                      if (surveyData.finalTeamMeeting) {
                        handleLocalDataChange("finalTeamMeeting", {
                          ...surveyData.finalTeamMeeting,
                          investigations: updatedInvestigations,
                        });
                      } else {
                        handleLocalDataChange(
                          "investigations",
                          updatedInvestigations
                        );
                      }

                      // Clear the form and hide it
                      handleLocalDataChange("newFinding", {
                        fTag: "",
                        title: "",
                        description: "",
                      });
                      handleLocalDataChange("showAddFindingForm", false);

                      toast.success("New survey finding added successfully!", {
                        description: `${newInvestigation.fTag} - ${newInvestigation.title} has been added.`,
                        position: "top-right",
                      });
                    } else {
                      toast.error("Please fill in all required fields", {
                        description:
                          "F-Tag, title, and description are required.",
                        position: "top-right",
                      });
                    }
                  }}
                  className="bg-[#075b7d] hover:bg-[#064d63]"
                >
                  Add Finding
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-800">
                {(
                  surveyData.finalTeamMeeting?.investigations ||
                  surveyData.investigations
                )?.filter(
                  (inv) =>
                    inv.title &&
                    (surveyData.finalTeamMeeting?.teamDeterminations ||
                      surveyData.teamDeterminations)?.[inv.id]?.decision ===
                    "cite"
                ).length || 0}
              </div>
              <div className="text-xs text-gray-600">Decision: Cite</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-800">
                {(
                  surveyData.finalTeamMeeting?.investigations ||
                  surveyData.investigations
                )?.filter(
                  (inv) =>
                    inv.title &&
                    (surveyData.finalTeamMeeting?.teamDeterminations ||
                      surveyData.teamDeterminations)?.[inv.id]?.decision ===
                    "dontCite"
                ).length || 0}
              </div>
              <div className="text-xs text-gray-600">Decision: Don't Cite</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-800">
                {(
                  surveyData.finalTeamMeeting?.investigations ||
                  surveyData.investigations
                )?.filter(
                  (inv) =>
                    inv.title &&
                    !(surveyData.finalTeamMeeting?.teamDeterminations ||
                      surveyData.teamDeterminations)?.[inv.id]?.decision
                ).length || 0}
              </div>
              <div className="text-xs text-gray-600">Pending Review</div>
            </div>
          </div>

          {/* Quick Decision Helper */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-gray-10 rounded border border-gray-200">
              <h5 className="font-medium text-gray-800 mb-2">
                High Priority (Cite):
              </h5>
              <ul className="space-y-1 text-gray-700 text-xs">
                <li>• Resident harm/injury</li>
                <li>• Medication errors</li>
                <li>• Fall-related injuries</li>
                <li>• Pressure ulcers</li>
                <li>• Infection control failures</li>
              </ul>
            </div>
            <div className="p-3 bg-gray-10 rounded border border-gray-200">
              <h5 className="font-medium text-gray-800 mb-2">
                Medium Priority (Evaluate):
              </h5>
              <ul className="space-y-1 text-gray-700 text-xs">
                <li>• Documentation gaps</li>
                <li>• Policy violations</li>
                <li>• Staff training issues</li>
                <li>• Environmental concerns</li>
                <li>• Care plan issues</li>
              </ul>
            </div>
            <div className="p-3 bg-gray-10 rounded border border-gray-200">
              <h5 className="font-medium text-gray-800 mb-2">
                Low Priority (Don't Cite):
              </h5>
              <ul className="space-y-1 text-gray-700 text-xs">
                <li>• Minor housekeeping</li>
                <li>• Administrative preferences</li>
                <li>• Isolated incidents</li>
                <li>• Already corrected</li>
                <li>• Insufficient evidence</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Show F895 Compliance & Ethics Investigation if it exists */}
        {(() => {
          // Check if ethics compliance concerns are true and show notification
          if (
            surveyData.finalTeamMeeting?.ethicsComplianceConcerns ||
            surveyData.ethicsComplianceConcerns
          ) {
            return (
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div>
                      <h4 className="font-medium text-gray-800">
                        Notify Facility Leadership for additional investigation
                      </h4>
                      <p className="text-sm text-gray-700">
                        Auto-initiated due to identified ethics/compliance
                        concerns
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Status: Ethics/Compliance concerns identified
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Filter Options - Hidden from client view */}
        <div className="mb-4 flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {(() => {
              const validInvestigations =
                (
                  surveyData.finalTeamMeeting?.investigations ||
                  surveyData.investigations
                )?.filter((inv) => inv.title && inv.title.trim() !== "") || [];
              return `${validInvestigations.length} finding${validInvestigations.length !== 1 ? "s" : ""
                } ready for review`;
            })()}
          </span>
        </div>

        <div className="space-y-4">
          {(() => {
            let filteredInvestigations =
              surveyData.finalTeamMeeting?.investigations ||
              surveyData.investigations ||
              [];

            // Filter out investigations without titles - surveyors won't know what to cite
            filteredInvestigations = filteredInvestigations.filter(
              (inv) => inv.title && inv.title.trim() !== ""
            );

            if (filteredInvestigations.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-base">No findings to review</p>
                  <p className="text-sm mt-2">
                    Click "Add Finding" above to add a survey finding
                  </p>
                </div>
              );
            }

            return filteredInvestigations.map((investigation) => (
              <div
                key={investigation.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {investigation.fTag && (
                      <Badge
                        variant="outline"
                        className="text-sm font-mono bg-blue-50 text-blue-800 border-blue-300"
                      >
                        {investigation.fTag}
                      </Badge>
                    )}
                    <h4 className="font-medium text-gray-900">
                      {investigation.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${!(surveyData.finalTeamMeeting?.teamDeterminations ||
                        surveyData.teamDeterminations)?.[investigation.id]
                        ?.decision
                        ? "bg-gray-100 text-gray-800 border border-gray-200"
                        : (surveyData.finalTeamMeeting?.teamDeterminations ||
                          surveyData.teamDeterminations)?.[investigation.id]
                          ?.decision === "cite"
                          ? "bg-gray-100 text-gray-800 border border-gray-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                        }`}
                    >
                      {!(surveyData.finalTeamMeeting?.teamDeterminations ||
                        surveyData.teamDeterminations)?.[investigation.id]
                        ?.decision
                        ? "Undeclared Item"
                        : (surveyData.finalTeamMeeting?.teamDeterminations ||
                          surveyData.teamDeterminations)?.[investigation.id]
                          ?.decision === "cite"
                          ? "Decision: Cite"
                          : "Decision: Don't Cite"}
                    </span>
                    {(surveyData.finalTeamMeeting?.teamDeterminations ||
                      surveyData.teamDeterminations)?.[investigation.id]
                      ?.decision && (
                        <button
                          onClick={() => {
                            // Clear the decision to allow editing
                            const updatedTeamDeterminations = {
                              ...(surveyData.finalTeamMeeting
                                ?.teamDeterminations ||
                                surveyData.teamDeterminations),
                              [investigation.id]: {
                                ...(surveyData.finalTeamMeeting
                                  ?.teamDeterminations ||
                                  surveyData.teamDeterminations[
                                  investigation.id
                                  ]),
                                decision: null,
                              },
                            };
                            // Save to finalTeamMeeting if it exists, otherwise to root level
                            if (surveyData.finalTeamMeeting) {
                              handleLocalDataChange("finalTeamMeeting", {
                                ...surveyData.finalTeamMeeting,
                                teamDeterminations: updatedTeamDeterminations,
                              });
                            } else {
                              handleLocalDataChange(
                                "teamDeterminations",
                                updatedTeamDeterminations
                              );
                            }
                          }}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 border border-gray-200"
                        >
                          Edit
                        </button>
                      )}
                  </div>
                </div>

                {/* Show reason/issue for the investigation */}
                {investigation.reason && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="text-sm font-medium text-blue-700 mb-2">
                      Investigation Issue:
                    </h5>
                    <p className="text-sm text-blue-900">
                      {investigation.reason}
                    </p>
                  </div>
                )}

                {/* Show description for manual findings */}
                {investigation.description && (
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      Finding Description:
                    </h5>
                    <p className="text-sm text-gray-600">
                      {investigation.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Decision */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Decision
                    </label>
                    <div className="flex gap-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`decision-${investigation.id}`}
                          value="cite"
                          checked={
                            (surveyData.finalTeamMeeting?.teamDeterminations ||
                              surveyData.teamDeterminations)?.[investigation.id]
                              ?.decision === "cite"
                          }
                          onChange={() =>
                            handleTeamDetermination(
                              investigation.id,
                              "cite",
                              (surveyData.finalTeamMeeting
                                ?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[
                                investigation.id
                              ]?.rationale || "",
                              (surveyData.finalTeamMeeting
                                ?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[
                                investigation.id
                              ]?.severity || "",
                              (surveyData.finalTeamMeeting
                                ?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[
                                investigation.id
                              ]?.scope || "",
                              (surveyData.finalTeamMeeting
                                ?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[
                                investigation.id
                              ]?.isSingularEvent || false,
                              (surveyData.finalTeamMeeting
                                ?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[
                                investigation.id
                              ]?.ijStartDate || "",
                              (surveyData.finalTeamMeeting
                                ?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[
                                investigation.id
                              ]?.ijEndDate || ""
                            )
                          }
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Cite</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`decision-${investigation.id}`}
                          value="dontCite"
                          checked={
                            (surveyData.finalTeamMeeting?.teamDeterminations ||
                              surveyData.teamDeterminations)?.[investigation.id]
                              ?.decision === "dontCite"
                          }
                          onChange={() =>
                            handleTeamDetermination(
                              investigation.id,
                              "dontCite",
                              (surveyData.finalTeamMeeting
                                ?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[
                                investigation.id
                              ]?.rationale || "",
                              (surveyData.finalTeamMeeting
                                ?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[
                                investigation.id
                              ]?.scope || "",
                              (surveyData.finalTeamMeeting
                                ?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[
                                investigation.id
                              ]?.severity || "",
                              (surveyData.finalTeamMeeting
                                ?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[
                                investigation.id
                              ]?.isSingularEvent || false,
                              (surveyData.finalTeamMeeting
                                ?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[
                                investigation.id
                              ]?.ijStartDate || "",
                              (surveyData.finalTeamMeeting
                                ?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[
                                investigation.id
                              ]?.ijEndDate || ""
                            )
                          }
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">
                          Don't Cite
                        </span>
                      </label>
                    </div>

                    {/* Decision Guidance */}
                    <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                      <p className="text-gray-600">
                        <strong>Cite if:</strong> Evidence shows deficient
                        practice affecting resident care
                      </p>
                      <p className="text-gray-600">
                        <strong>Don't Cite if:</strong> Issue is minor,
                        isolated, or insufficient evidence
                      </p>
                    </div>
                  </div>

                  {/* Rationale */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rationale
                    </label>
                    <textarea
                      value={
                        (surveyData.finalTeamMeeting?.teamDeterminations ||
                          surveyData.teamDeterminations)?.[investigation.id]
                          ?.rationale || ""
                      }
                      onChange={(e) =>
                        handleTeamDetermination(
                          investigation.id,
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.decision || "",
                          e.target.value,
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.severity || "",
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.scope || "",
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.isSingularEvent || false,
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.ijStartDate || "",
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.ijEndDate || ""
                        )
                      }
                      placeholder="Provide rationale for decision..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#075b7d]"
                    />
                  </div>
                </div>

                {/* Severity/Scope Grid Picker */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Severity
                    </label>
                    <select
                      value={
                        (surveyData.finalTeamMeeting?.teamDeterminations ||
                          surveyData.teamDeterminations)?.[investigation.id]
                          ?.severity || ""
                      }
                      onChange={(e) =>
                        handleTeamDetermination(
                          investigation.id,
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.decision || "",
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.rationale || "",
                          e.target.value,
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.scope || "",
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.isSingularEvent || false,
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.ijStartDate || "",
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.ijEndDate || ""
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#075b7d]"
                    >
                      <option value="">Select Severity</option>
                      <option value="1">1 - Minimal</option>
                      <option value="2">2 - Moderate</option>
                      <option value="3">3 - Serious</option>
                      <option value="4">4 - Immediate Jeopardy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scope
                    </label>
                    <select
                      value={
                        (surveyData.finalTeamMeeting?.teamDeterminations ||
                          surveyData.teamDeterminations)?.[investigation.id]
                          ?.scope || ""
                      }
                      onChange={(e) =>
                        handleTeamDetermination(
                          investigation.id,
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.decision || "",
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.rationale || "",
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.severity || "",
                          e.target.value,
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.isSingularEvent || false,
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.ijStartDate || "",
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.ijEndDate || ""
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#075b7d]"
                    >
                      <option value="">Select Scope</option>
                      <option value="I">I - Isolated</option>
                      <option value="P">P - Pattern</option>
                      <option value="W">W - Widespread</option>
                    </select>
                  </div>
                </div>

                {/* Singular Event Flag for G/J */}
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={
                        (surveyData.finalTeamMeeting?.teamDeterminations ||
                          surveyData.teamDeterminations)?.[investigation.id]
                          ?.isSingularEvent || false
                      }
                      onChange={(e) =>
                        handleTeamDetermination(
                          investigation.id,
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.decision || "",
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.rationale || "",
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.severity || "",
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.scope || "",
                          e.target.checked,
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.ijStartDate || "",
                          (surveyData.finalTeamMeeting?.teamDeterminations ||
                            surveyData.teamDeterminations)?.[investigation.id]
                            ?.ijEndDate || ""
                        )
                      }
                      className="mr-2"
                    />
                  </label>
                </div>

                {/* IJ Start/End Date Capture */}
                {(surveyData.finalTeamMeeting?.teamDeterminations ||
                  surveyData.teamDeterminations)?.[investigation.id]
                  ?.severity === "4" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          IJ Start Date
                        </label>
                        <input
                          type="datetime-local"
                          value={
                            (surveyData.finalTeamMeeting?.teamDeterminations ||
                              surveyData.teamDeterminations)?.[investigation.id]
                              ?.ijStartDate || ""
                          }
                          onChange={(e) =>
                            handleTeamDetermination(
                              investigation.id,
                              (surveyData.finalTeamMeeting?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[investigation.id]
                                ?.decision || "",
                              (surveyData.finalTeamMeeting?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[investigation.id]
                                ?.rationale || "",
                              (surveyData.finalTeamMeeting?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[investigation.id]
                                ?.severity || "",
                              (surveyData.finalTeamMeeting?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[investigation.id]
                                ?.scope || "",
                              (surveyData.finalTeamMeeting?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[investigation.id]
                                ?.isSingularEvent || false,
                              e.target.value,
                              (surveyData.finalTeamMeeting?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[investigation.id]
                                ?.ijEndDate || ""
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#075b7d]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          IJ End Date
                        </label>
                        <input
                          type="datetime-local"
                          value={
                            (surveyData.finalTeamMeeting?.teamDeterminations ||
                              surveyData.teamDeterminations)?.[investigation.id]
                              ?.ijEndDate || ""
                          }
                          onChange={(e) =>
                            handleTeamDetermination(
                              investigation.id,
                              (surveyData.finalTeamMeeting?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[investigation.id]
                                ?.decision || "",
                              (surveyData.finalTeamMeeting?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[investigation.id]
                                ?.rationale || "",
                              (surveyData.finalTeamMeeting?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[investigation.id]
                                ?.severity || "",
                              (surveyData.finalTeamMeeting?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[investigation.id]
                                ?.scope || "",
                              (surveyData.finalTeamMeeting?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[investigation.id]
                                ?.isSingularEvent || false,
                              (surveyData.finalTeamMeeting?.teamDeterminations ||
                                surveyData.teamDeterminations)?.[investigation.id]
                                ?.ijStartDate || "",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#075b7d]"
                        />
                      </div>
                    </div>
                  )}
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Citation Strategy Summary */}
      <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
        <h4 className="text-sm font-medium text-gray-800 mb-3">
          Citation Strategy Summary
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800">
              {(
                surveyData.finalTeamMeeting?.investigations ||
                surveyData.investigations
              )?.filter(
                (inv) =>
                  inv.title &&
                  inv.title.trim() !== "" &&
                  (surveyData.finalTeamMeeting?.teamDeterminations ||
                    surveyData.teamDeterminations)?.[inv.id]?.decision ===
                  "cite"
              ).length || 0}
            </div>
            <div className="text-xs text-gray-600">Citations Issued</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800">
              {(
                surveyData.finalTeamMeeting?.investigations ||
                surveyData.investigations
              )?.filter(
                (inv) =>
                  inv.title &&
                  inv.title.trim() !== "" &&
                  (surveyData.finalTeamMeeting?.teamDeterminations ||
                    surveyData.teamDeterminations)?.[inv.id]?.decision ===
                  "dontCite"
              ).length || 0}
            </div>
            <div className="text-xs text-gray-600">Not Cited</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800">
              {(
                surveyData.finalTeamMeeting?.investigations ||
                surveyData.investigations
              )?.filter(
                (inv) =>
                  inv.title &&
                  inv.title.trim() !== "" &&
                  (surveyData.finalTeamMeeting?.teamDeterminations ||
                    surveyData.teamDeterminations)?.[inv.id]?.severity === "4"
              ).length || 0}
            </div>
            <div className="text-xs text-gray-600">Immediate Jeopardy</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-800">
              {(
                surveyData.finalTeamMeeting?.investigations ||
                surveyData.investigations
              )?.filter(
                (inv) =>
                  inv.title &&
                  inv.title.trim() !== "" &&
                  (surveyData.finalTeamMeeting?.teamDeterminations ||
                    surveyData.teamDeterminations)?.[inv.id]?.scope === "W"
              ).length || 0}
            </div>
            <div className="text-xs text-gray-600">Widespread Issues</div>
          </div>
        </div>

        {/* Citation Strategy Notes */}
        <div className="mt-3 p-3 bg-gray-10 border border-gray-200 rounded">
          <p className="text-xs text-gray-700">
            <strong>Strategy:</strong> Focus citations on issues that
            demonstrate deficient practices affecting resident care. Use
            severity and scope to reflect the actual impact on residents and the
            facility's ability to provide quality care.
          </p>
        </div>
      </div>



      {/* Floating Save Button */}
      <div className="fixed bottom-[100px]  right-6 z-40 flex flex-col items-end gap-2">
        <Button
          onClick={() => handleFinalTeamMeetingSubmit()}
          disabled={isLoading || isSurveyClosed}
          className="h-11 sm:h-12 px-4 sm:px-6 bg-[#075b7d] hover:bg-[#075b7d] text-white text-sm sm:text-base font-medium disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full shadow-lg flex items-center gap-2 hover:shadow-xl transition-all"
          size="lg"
          title="Save your progress without navigating away"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span className="hidden sm:inline">Saving...</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:hidden" />
              <span className="hidden sm:inline">Save Progress</span>
              <span className="sm:hidden">Save</span>
            </>
          )}
        </Button>
      </div>

      {/* Navigation Buttons */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-40 flex gap-2 sm:gap-4">
        <Button
          onClick={() => {
            if (hasUnsavedChanges) {
              setShowUnsavedChangesModal(true);
              setPendingNavigation(() => () => setCurrentStep(7));
            } else {
              setCurrentStep(7);
            }
          }}
          className="flex-1 sm:flex-none h-11 sm:h-12 px-4 sm:px-8 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-sm sm:text-base font-medium rounded-full shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all"
          size="lg"
        > 
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        {isInvitedUser() ? (
          <Button
            onClick={() => handleFinalTeamMeetingSubmit(true)}
            disabled={isLoading || isSurveyClosed}
            className="flex-1 sm:flex-none h-11 sm:h-12 px-4 sm:px-8 bg-[#075b7d] hover:bg-[#075b7d] text-white text-sm sm:text-base font-medium disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all"
            size="lg"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        ) : (
          <Button
            onClick={() => handleFinalTeamMeetingSubmit(true)}
            disabled={isLoading || isSurveyClosed}
            className="flex-1 sm:flex-none h-11 sm:h-12 px-4 sm:px-8 bg-[#075b7d] hover:bg-[#075b7d] text-white text-sm sm:text-base font-medium disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all"
            size="lg"
          >
            <span className="hidden sm:inline">Submit & Continue to Mock Citations</span>
            <span className="sm:hidden">Continue</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        )}
      </div>

      {/* Loading Modal for Findings */}
      {isLoadingFindings && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="relative">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-gray-200 border-t-[#075b7d] rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-[#075b7d] animate-pulse" />
                  </div>
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Loading Survey Findings
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                Retrieving findings and probes from the survey...
              </p>
              <div className="flex items-center justify-center space-x-1">
                <div
                  className="w-2 h-2 bg-[#075b7d] rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-[#075b7d] rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-[#075b7d] rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        open={showUnsavedChangesModal}
        onOpenChange={setShowUnsavedChangesModal}
        onCancel={() => {
          setShowUnsavedChangesModal(false);
          setPendingNavigation(null);
        }}
        onConfirm={async () => {
          await handleFinalTeamMeetingSubmit(false);
          setShowUnsavedChangesModal(false);
          if (pendingNavigation) {
            pendingNavigation();
            setPendingNavigation(null);
          }
        }}
      />

      {/* Floating Home Button */}
      <FloatingHomeButton
        hasUnsavedChanges={unsavedChanges.size > 0}
        onSave={() => handleFinalTeamMeetingSubmit(false)}
        onClearUnsavedChanges={() => setUnsavedChanges(new Set())}
      />
    </div>
  );
};

export default TeamMeetings;
