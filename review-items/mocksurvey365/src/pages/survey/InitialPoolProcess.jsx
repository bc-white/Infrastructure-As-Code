import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { healthAssistantAPI } from "../../service/api";
import api from "../../service/api";
import surveyIndexedDB from "../../utils/surveyIndexedDB";
import { getTeamMemberById } from "../../lib/utils";
import { saveSurveyStepData } from "../../utils/surveyStorageIndexedDB";
import surveySyncService from "../../utils/surveySyncService";
import useSurveyStore from "../../stores/useSurveyStore";
import FloatingHomeButton from "../../components/FloatingHomeButton";

import {
  Settings,
  Info,
  Upload,
  Plus,
  Clock,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  Download,
  X,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  Lock,
  ArrowRight,
} from "lucide-react";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useBeforeUnload } from "react-router-dom";
import ScheduleInterviewModal from "../../components/modals/ScheduleInterviewModal";
import AddObservationModal from "../../components/modals/AddObservationModal";
import UnassignResidentModal from "../../components/modals/UnassignResidentModal";
import ResidentAssignmentModal from "../../components/modals/ResidentAssignmentModal";
import UnsavedChangesModal from "../../components/UnsavedChangesModal";
import UnsavedChangesOptionsModal from "../../components/investigations/UnsavedChangesOptionsModal";
import ConfirmOverrideModal from "../../components/modals/ConfirmOverrideModal";
import { useBrowserNavigationBlocker } from "../../hooks/useBrowserNavigationBlocker";
import useSurveyAccess from "../../hooks/useSurveyAccess";

const InitialPoolProcess = ({
  sectionData,
  surveyData,
  setCurrentStep,
  canContinueFromStep,
  handleSurveyDataChange,
  receiveServerData = null, // Function to receive server updates (respects dirty state)
  pendingRemoteUpdate = false, // Flag indicating if remote update is pending
  isDirty = false, // Flag indicating if form has unsaved changes
  acceptRemoteUpdate = null, // Function to accept pending remote update
  discardRemoteUpdate = null, // Function to discard pending remote update
  markAsSaved = null, // Function to mark form as saved and clear localStorage
  hasJustAcceptedUpdate = null, // Function to check if we just accepted an update
  setShowAddResidentModal,
  setShowUploadResidentModal,
  downloadSampleCSV,
  setSelectedResident: setSelectedResidentProp,
  setShowObservationModal: setShowObservationModalProp,
  setShowInterviewModal: setShowInterviewModalProp,
  setShowRecordReviewModal,
  teamMembers = [], // Add team members prop with default value
  setTeamMembers, // Add setter for team members
  isInvitedUser: isInvitedUserProp = () => false, // Add isInvitedUser prop with default
}) => {
  // Get survey ID from localStorage
  const currentSurveyId = localStorage.getItem("currentSurveyId");
  
  // Use the survey access hook to determine user access type
  const { isInvitedUser: isInvitedUserFromHook, isLoading: isAccessLoading } = useSurveyAccess(currentSurveyId);
  
  // Use hook-based isInvitedUser, fall back to prop if hook is still loading
  const isInvitedUser = isAccessLoading ? isInvitedUserProp : isInvitedUserFromHook;

  // Navigation blocking state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const hasUnsavedChangesRef = useRef(false);

  // Sync hasUnsavedChangesRef with state
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // SERVER FIRST: These states are kept for component compatibility but no longer used for merging
  // Server data is the single source of truth (like SampleSelection)
  const [unsavedChanges, setUnsavedChanges] = useState({}); // Kept for component props compatibility
  const [unsavedChangesModalOpen, setUnsavedChangesModalOpen] = useState(false); // Kept for modal
  const [pendingUnsavedChangesCount, setPendingUnsavedChangesCount] = useState(0); // Kept for modal

  // No-op handlers - kept for component compatibility
  const handleKeepUnsavedChanges = () => {
    setUnsavedChangesModalOpen(false);
  };

  const handleFetchServerData = async () => {
    setUnsavedChangesModalOpen(false);
    await fetchSavedInitialPool(false);
  };

  const [showExitWarning, setShowExitWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Warn on browser refresh/close
  useBeforeUnload(
    useCallback(
      (e) => {
        if (hasUnsavedChanges) {
          e.preventDefault();
          e.returnValue = "";
        }
      },
      [hasUnsavedChanges]
    )
  );

  // Warn on browser back button
  const { restoreBlocker } = useBrowserNavigationBlocker(hasUnsavedChanges, () => {
    setPendingNavigation({ type: 'browser' });
    setShowExitWarning(true);
  });

  // Get current user from localStorage (component level)
  const getCurrentUser = () => {
    const userStr = localStorage.getItem("mocksurvey_user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        return null;
      }
    }
    return null;
  };

  const currentUser = getCurrentUser();
  const currentUserId = currentUser?._id || currentUser?.id || null;

  // State for fetched initial pool data
  const [fetchedInitialPoolData, setFetchedInitialPoolData] = useState(null);
  const [isLoadingInitialPool, setIsLoadingInitialPool] = useState(false);

  // Local state for team members fetched from API
  const [localTeamMembers, setLocalTeamMembers] = useState([]);
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(false);

  // Fetch team members from API - extracted as callable function
  const fetchTeamMembers = async (isBackgroundRefresh = false) => {
    if (!currentSurveyId) return;
    
    if (!isBackgroundRefresh) {
      setIsLoadingTeamMembers(true);
    }
    try {
      const response = await api.survey.viewTeamMembersInSurvey(currentSurveyId);
      if (response && (response.success || response.status === true || response.statusCode === 200)) {
        const apiTeamMembers = response.data || [];
        
        // Map the API response - assignedResidents now comes from API as array of objects
        const mappedTeamMembers = apiTeamMembers.map((member) => {
          const memberId = member.teamMemberUserId;
          
          // Extract resident IDs from assignedResidents (API returns array of objects)
          const assignedResidentIds = (member.assignedResidents || []).map(ar => {
            if (typeof ar === 'object' && ar !== null) {
              return String(ar.residentId || ar.generatedId || ar.id);
            }
            return String(ar);
          });
          
          return {
            id: member.teamMemberId || member._id || member.id,
            _id: member.teamMemberId || member._id || member.id,
            name: member.firstName || member.name || "Unknown",
            firstName: member.firstName || member.name || "",
            lastName: member.lastName || "",
            email: member.email || "",
            phone: member.phone || "",
            role: member.role || "",
            specialization: member.specialization || "",
            teamCoordinator: member.teamCoordinator || false,
            invited: member.invited || false,
            surveyId: member.surveyId || "",
            // Use the proper teamMemberUserId from API
            teamMemberUserId: memberId,
            assignedFacilityTasks: member.assignedFacilityTasks || [],
            // Use assignedResidents from API (normalized to string IDs)
            assignedResidents: assignedResidentIds,
            // Also keep the raw assignedResidents for richer data
            assignedResidentsData: member.assignedResidents || [],
          };
        });
        setLocalTeamMembers(mappedTeamMembers);
        
        // Also update parent if setter is available
        if (setTeamMembers) {
          setTeamMembers(mappedTeamMembers);
        }
      }
    } catch (error) {
    // Silent fail for background refresh
    } finally {
      if (!isBackgroundRefresh) {
        setIsLoadingTeamMembers(false);
      }
    }
  };

  // Initial fetch of team members
  useEffect(() => {
    fetchTeamMembers();
  }, [currentSurveyId]);

  // Use only team members from API - no fallback to prop
  const effectiveTeamMembers = localTeamMembers;

  // REMOVED: localResidents state - now using surveyData?.initialPoolProcess?.residents directly
  // Server data is the single source of truth (like SampleSelection)

  // Refs to track latest state for polling
  const surveyDataRef = useRef(surveyData);
  const isFetchingRef = useRef(false);
  
  // State for fetch button loading indicator (separate from full-screen loading modal)
  const [isFetchingButton, setIsFetchingButton] = useState(false);

  useEffect(() => {
    surveyDataRef.current = surveyData;
  }, [surveyData]);

  // Fetch saved initial pool data from API - SERVER FIRST approach
  const fetchSavedInitialPool = async (isBackgroundSync = false) => {
    if (!currentSurveyId) return;
    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      if (!isBackgroundSync) {
        setIsLoadingInitialPool(true);
      } else {
        setIsFetchingButton(true);
      }

      const response = await api.survey.getInitialPool(currentSurveyId);

      if (response && (response.success || response.status === true || response.statusCode === 200)) {


        // console.log("Fetched Initial Pool Data:", response.data);

        setFetchedInitialPoolData(response.data);

        if (response.data && Array.isArray(response.data.initialpoolData)) {
          // Map server residents
          const serverResidents = response.data.initialpoolData.map(r => {
            let assignedTeamMemberId = null;
            if (r.teamMemberUserId) {
              if (typeof r.teamMemberUserId === 'object') {
                assignedTeamMemberId = r.teamMemberUserId._id || r.teamMemberUserId.id;
              } else {
                assignedTeamMemberId = r.teamMemberUserId;
              }
            } else if (r.assignedTeamMemberId) {
              assignedTeamMemberId = r.assignedTeamMemberId;
            }

            return {
              ...r,
              // Preserve the original generatedId for API calls
              generatedId: r.generatedId || r.id,
              // Use id for UI purposes (fallback to generatedId if id is missing)
              id: r.id || r.generatedId || `res_${Math.random().toString(36).substr(2, 9)}`,
              assignedTeamMemberId: assignedTeamMemberId,
              // Ensure arrays exist
              residentInterviews: r.residentInterviews || [],
              observations: r.observations || [],
              observationChecklistResponses: r.observationChecklistResponses || {},
            };
          });

          // SERVER FIRST: Use server data directly without merging
          const currentSurveyData = surveyDataRef.current;

          // Construct updated data - server is single source of truth
          const initialPoolProcessData = {
            ...(currentSurveyData?.initialPoolProcess || {}),
            residents: serverResidents,
          };

          // Check for updated team members in response to ensure assignments are synced
          const updatedTeamMembers = response.data.surveyData?.teamMembers;

          // Update state
          if (receiveServerData) {
            const updatedSurveyData = {
              ...currentSurveyData,
              initialPoolProcess: initialPoolProcessData
            };

            if (updatedTeamMembers) {
              updatedSurveyData.teamMembers = updatedTeamMembers;
            }

            receiveServerData(updatedSurveyData);
          } else if (handleSurveyDataChange) {
            handleSurveyDataChange("initialPoolProcess", initialPoolProcessData);

            if (updatedTeamMembers) {
              handleSurveyDataChange("teamMembers", updatedTeamMembers);
            }
          }

          // IMPORTANT: Update localTeamMembers with assignedResidents derived from residents
          // This ensures the team member data includes assignment info from the server response
          if (localTeamMembers.length > 0) {
            const updatedLocalTeamMembers = localTeamMembers.map(member => {
              const memberId = member.teamMemberUserId || member.id || member._id;
              // Find all residents assigned to this team member
              const assignedResidentIds = serverResidents
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
                ...member,
                assignedResidents: assignedResidentIds
              };
            });
            setLocalTeamMembers(updatedLocalTeamMembers);
          }

          // Force re-render of residents list by updating a local state trigger
          // This ensures the filtered list updates immediately when new assignments come in
          setLastSave(Date.now());
        }
      }
    } catch (error) {
      // Silent fail for background sync
    } finally {
      isFetchingRef.current = false;
      if (!isBackgroundSync) setIsLoadingInitialPool(false);
      if (isBackgroundSync) setIsFetchingButton(false);
    }
  };

  // Initial data fetch (polling removed)
  useEffect(() => {
    if (!currentSurveyId) return;

    // Initial fetch only - no polling
    fetchSavedInitialPool();
  }, [currentSurveyId]); // Re-run if survey ID changes

  // State for update confirmation toast
  const [localPendingUpdate, setLocalPendingUpdate] = useState(false);
  // Ref to track if we've shown a toast for the current pending update
  const updateToastShownRef = useRef(false);
  // Ref to store the current toast ID so we can dismiss it if a new broadcast comes in
  const currentUpdateToastIdRef = useRef(null);

  // Ref to track if user is actively editing a resident (for socket handlers - closures need refs)
  const isEditingRef = useRef(false);
  // Map to track which residents are currently being edited
  const editingResidentsRef = useRef(new Set());
  // Ref to track if user is making a local edit (prevents overwrites during edits)
  const isMakingLocalEditRef = useRef(false);

  // Use refs to track previous values and prevent unnecessary updates
  const previousInterviewsRef = useRef(surveyData?.residentInterviews);
  const isProcessingRef = useRef(false);
  const justSubmittedRef = useRef(false); // Track if user just submitted to prevent status revert

  // Debug: Check if interviews are being cleared and fix if needed
  useEffect(() => {
    // Prevent concurrent updates
    if (isProcessingRef.current) {
      return;
    }

    // Check if interviews were unexpectedly cleared (this shouldn't happen)
    const currentInterviews = surveyData?.residentInterviews || [];
    const previousInterviews = previousInterviewsRef.current || [];

    // Skip if nothing changed
    if (
      JSON.stringify(currentInterviews) === JSON.stringify(previousInterviews)
    ) {
      return;
    }

    // Update ref before processing
    previousInterviewsRef.current = currentInterviews;
    isProcessingRef.current = true;

    // Use setTimeout to ensure this runs after render completes
    const timeoutId = setTimeout(() => {
      try {
        // Check if interviews were unexpectedly cleared (this shouldn't happen)
        if (currentInterviews.length === 0) {
          // Try to restore from nested location if available
          const nestedInterviews =
            surveyData?.initialPoolProcess?.residentInterviews || [];
          if (nestedInterviews.length > 0) {
            handleSurveyDataChange("residentInterviews", nestedInterviews);
            previousInterviewsRef.current = nestedInterviews;
          }
        }

        // Check for suspicious interview replacement (only 1 interview when we expect more)
        const currentCount = currentInterviews.length;
        const nestedCount =
          surveyData?.initialPoolProcess?.residentInterviews?.length || 0;

        if (currentCount === 1 && nestedCount > 1) {
          // Merge interviews from both locations to prevent data loss
          const nestedInterviews =
            surveyData?.initialPoolProcess?.residentInterviews || [];

          // Create a map to avoid duplicates
          const interviewMap = new Map();

          // Add current interviews
          currentInterviews.forEach((interview) => {
            if (interview.residentId) {
              interviewMap.set(interview.residentId, interview);
            }
          });

          // Add nested interviews (they take priority if there's a conflict)
          nestedInterviews.forEach((interview) => {
            if (interview.residentId) {
              interviewMap.set(interview.residentId, interview);
            }
          });

          const mergedInterviews = Array.from(interviewMap.values());

          if (mergedInterviews.length > currentCount) {
            handleSurveyDataChange("residentInterviews", mergedInterviews);
            previousInterviewsRef.current = mergedInterviews;
          }
        }
      } finally {
        isProcessingRef.current = false;
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      isProcessingRef.current = false;
    }; 
  }, [
    surveyData?.residentInterviews,
    surveyData?.initialPoolProcess?.residentInterviews,
    handleSurveyDataChange,
  ]);
  // State for generate process
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("");
  const [selectedResident, setSelectedResidentLocal] = useState(null);
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [fetchingDataLoading, setFetchingDataLoading] = useState(false);
  
  // State for override confirmation modal
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [isCheckingGeneration, setIsCheckingGeneration] = useState(false);

  const setSelectedResident = (resident) => {
    setSelectedResidentLocal(resident);
    if (setSelectedResidentProp) {
      setSelectedResidentProp(resident);
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Task status management
  const [taskStatuses, setTaskStatuses] = useState({});
  const [isPageClosed, setIsPageClosed] = useState(false);
  const [isContinueClicked, setIsContinueClicked] = useState(false);

  // Manual save state for team members (Save Draft button)
  const [lastSave, setLastSave] = useState(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Resident Assignment state
  const [showResidentAssignmentModal, setShowResidentAssignmentModal] =
    useState(false);
  const [showWorkReviewModal, setShowWorkReviewModal] = useState(false);
  const [selectedTeamMemberForReview, setSelectedTeamMemberForReview] =
    useState(null);
  const [observationChecklistResponses, setObservationChecklistResponses] =
    useState({});

  // State for unassign confirmation modal
  const [showUnassignConfirmation, setShowUnassignConfirmation] = useState(false);
  const [residentToUnassign, setResidentToUnassign] = useState(null);

  // Handler to initiate unassign process
  // If alreadyUnassigned is true, the modal already performed the API call
  const handleUnassignResident = (resident, alreadyUnassigned = false) => {
    if (alreadyUnassigned) {
      // Modal already unassigned - just refresh parent data
      fetchTeamMembers(true);
      return;
    }
    // Show confirmation modal for unassign from main page (not modal)
    setResidentToUnassign(resident);
    setShowUnassignConfirmation(true);
  };

  const confirmUnassignResident = async () => {
    if (!residentToUnassign) return;
    const resident = residentToUnassign;

    try {
      const payload = {
        surveyId: currentSurveyId,
        generatedId: resident.generatedId || resident.id,
      };

      const response = await api.survey.removeTeamMemberInitialPool(payload);

      if (
        response &&
        (response.success ||
          response.status === true ||
          response.statusCode === 200)
      ) {
        toast.success("Team member unassigned successfully");

        // Update local state - remove assignedTeamMemberId from the resident
        const updatedResidents = (
          surveyData?.initialPoolProcess?.residents || []
        ).map((r) => {
          if (r.id === resident.id) {
            return { ...r, assignedTeamMemberId: null, teamMemberUserId: null };
          }
          return r;
        });

        // Also update surveyData if needed
        if (handleSurveyDataChange) {
          handleSurveyDataChange("initialPoolProcess", {
            ...(surveyData?.initialPoolProcess || {}),
            residents: updatedResidents,
          });
        }

        // Refetch team members to get updated assignedResidents from API
        await fetchTeamMembers(true);
        
        // Fetch fresh data from server after successful unassignment
        await fetchSavedInitialPool(true); // Background sync to refresh data
      } else {
        const errorMessage = response?.message || "Failed to unassign team member";
        toast.error(errorMessage);
      }
    } catch (error) {
      // Extract error message from API response
      const errorMessage = error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        "An error occurred while unassigning the team member";
      toast.error(errorMessage);
    } finally {
      setShowUnassignConfirmation(false);
      setResidentToUnassign(null);
    }
  };

  const formatObservationChecklistResponsesForSubmission = (
    responses,
    allowedResidentIds = null
  ) => {
    if (!responses || typeof responses !== "object") return [];

    const allowedSet = allowedResidentIds
      ? new Set(
        (Array.isArray(allowedResidentIds)
          ? allowedResidentIds
          : [allowedResidentIds]
        ).map((id) => String(id))
      )
      : null;

    return Object.entries(responses)
      .filter(([residentId]) =>
        allowedSet ? allowedSet.has(String(residentId)) : true
      )
      .map(([residentId, residentResponses]) => ({
        residentId: String(residentId),
        responses:
          residentResponses && typeof residentResponses === "object"
            ? residentResponses
            : {},
      }));
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Ref to track if IDs have been auto-assigned
  const idsAssignedRef = useRef(false);

  // Helper function to get current user's assigned residents
  const getCurrentUserAssignedResidents = () => {
    if (!isInvitedUser()) return [];

    // Get current user from localStorage - use mocksurvey_user key
    const currentUser = JSON.parse(
      localStorage.getItem("mocksurvey_user") || "{}"
    );

    if (!currentUser._id) {
      return [];
    }

    // SINGLE SOURCE OF TRUTH: Use localTeamMembers from API only

    // Check localTeamMembers (from API with proper UUIDs)
    let teamMember = null;

    if (localTeamMembers.length > 0) {
      teamMember = localTeamMembers.find(
        (member) =>
          member.id === currentUser._id ||
          member.email === currentUser.email ||
          String(member.id) === String(currentUser._id)
      );
    }
    // Note: We do NOT check initialPoolProcess.teamMembers to maintain single source of truth

    if (teamMember && teamMember.assignedResidents) {
      // Normalize IDs to strings for consistency
      const normalizedAssignedResidents = (teamMember.assignedResidents || []).map((id) => String(id));

      // Sync localStorage with fresh data from backend
      if (
        JSON.stringify(normalizedAssignedResidents.sort()) !==
        JSON.stringify((currentUser.assignedResidents || []).map((id) => String(id)).sort())
      ) {
        const updatedUser = {
          ...currentUser,
          assignedResidents: normalizedAssignedResidents,
        };
        localStorage.setItem("mocksurvey_user", JSON.stringify(updatedUser));
      }
      return normalizedAssignedResidents;
    }

    // PRIORITY 4: Fall back to localStorage (for backward compatibility)
    // For invited users, use their own assignedResidents directly
    // since the team member ID in survey data might not match the user's _id
    // Normalize IDs to strings for consistency
    const assignedResidents = (currentUser.assignedResidents || []).map((id) => String(id));

    return assignedResidents;
  };

  // Helper function to remove duplicate resident assignments across team members
  // Ensures each resident is only assigned to ONE team member
  const removeDuplicateResidentAssignments = (members) => {
    if (!members || members.length === 0) return members;

    // Track which residents are assigned to which members
    const residentToMemberMap = new Map();

    // First pass: find all residents and their assigned members
    members.forEach((member) => {
      (member.assignedResidents || []).forEach((residentId) => {
        const residentIdStr = String(residentId);
        if (!residentToMemberMap.has(residentIdStr)) {
          residentToMemberMap.set(residentIdStr, []);
        }
        residentToMemberMap.get(residentIdStr).push(member.id);
      });
    });

    // Find residents that are assigned to multiple members
    const duplicateResidents = Array.from(residentToMemberMap.entries()).filter(
      ([, memberIds]) => memberIds.length > 1
    );

    // If no duplicates, return as is
    if (duplicateResidents.length === 0) {
      return members;
    }

    // Second pass: for each resident with duplicates, determine which member should keep it
    const residentsToRemove = new Map(); // Map<memberId, Set<residentIds>>

    duplicateResidents.forEach(([residentId, memberIds]) => {
      // Check if any resident in allResidents has this assignedTeamMemberId
      const resident = allResidents.find(
        (r) => String(r.id) === residentId
      );

      let memberToKeep = null;

      // If resident has assignedTeamMemberId, keep it only in that member
      if (resident?.assignedTeamMemberId) {
        memberToKeep = memberIds.find(
          (mid) => String(mid) === String(resident.assignedTeamMemberId)
        );
      }

      // If no assignedTeamMemberId or not found, keep in first member (arbitrary but consistent)
      if (!memberToKeep) {
        memberToKeep = memberIds[0];
      }

      // Mark all other members to remove this resident
      memberIds.forEach((memberId) => {
        if (String(memberId) !== String(memberToKeep)) {
          if (!residentsToRemove.has(memberId)) {
            residentsToRemove.set(memberId, new Set());
          }
          residentsToRemove.get(memberId).add(residentId);
        }
      });
    });

    // Third pass: remove duplicates from team members
    return members.map((member) => {
      const residentsToRemoveFromThisMember = residentsToRemove.get(member.id);
      if (residentsToRemoveFromThisMember && residentsToRemoveFromThisMember.size > 0) {
        return {
          ...member,
          assignedResidents: (member.assignedResidents || []).filter(
            (residentId) => !residentsToRemoveFromThisMember.has(String(residentId))
          ),
        };
      }
      return member;
    });
  };

  // Helper function to get task status for a team member
  const getTaskStatus = (teamMemberId) => {
    const currentUser = JSON.parse(
      localStorage.getItem("mocksurvey_user") || "{}"
    );

    // For invited users, check their own status
    if (isInvitedUser() && currentUser._id === teamMemberId) {
      return taskStatuses[currentUser._id] || "in_progress";
    }

    // For team leads, check the team member's status
    return taskStatuses[teamMemberId] || "in_progress";
  };

  // Helper function to close/reopen the page for team leads
  const togglePageStatus = async () => {
    const surveyId = localStorage.getItem("currentSurveyId");

    if (!surveyId) {
      toast.error("Survey ID not found. Please refresh and try again.", {
        position: "top-right",
      });
      return;
    }

    try {
      const newStatus = !isPageClosed;

      // Update local state immediately
      setIsPageClosed(newStatus);

      // Update survey data
      handleSurveyDataChange("initialPoolProcess", {
        ...surveyData.initialPoolProcess,
        isPageClosed: newStatus,
        pageStatusUpdatedAt: new Date().toISOString(),
        pageStatusUpdatedBy: JSON.parse(
          localStorage.getItem("mocksurvey_user") || "{}"
        )._id,
      });

      // Show success message
      toast.success(
        newStatus
          ? "Page closed successfully. Team members can no longer make edits."
          : "Page reopened successfully. Team members can now make edits again.",
        { position: "top-right" }
      );
    } catch (error) {
      // Revert local state on error
      setIsPageClosed(!isPageClosed);

      toast.error(`Failed to update page status: ${error.message}`, {
        position: "top-right",
      });
    }
  };

  // Helper function to update task status
  const updateTaskStatus = async (teamMemberId, status, notes = "") => {
    const currentUser = JSON.parse(
      localStorage.getItem("mocksurvey_user") || "{}"
    );
    const isCurrentUser = isInvitedUser() && currentUser._id === teamMemberId;

    // Update local state immediately for UI responsiveness
    setTaskStatuses((prev) => ({
      ...prev,
      [teamMemberId]: status,
    }));

    // Update survey data to persist the status locally
    const updatedTaskStatuses = {
      ...taskStatuses,
      [teamMemberId]: status,
    };

    handleSurveyDataChange("initialPoolProcess", {
      ...surveyData.initialPoolProcess,
      taskStatuses: updatedTaskStatuses,
    });



    toast.success(`Task status updated to ${getStatusDisplayText(status)}`, {
      position: "top-right",
    });
  };

  // Helper function to get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "in_progress":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "done":
        return "bg-gray-200 text-gray-800 border-gray-300";
      case "pending_review":
        return "bg-gray-300 text-gray-800 border-gray-400";
      case "approved":
        return "bg-gray-800 text-white border-gray-800";
      case "rejected":
        return "bg-gray-100 text-gray-600 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Helper function to get status display text
  const getStatusDisplayText = (status) => {
    switch (status) {
      case "in_progress":
        return isPageClosed ? "Closed" : "In Progress";
      case "done":
        return "Done";
      case "pending_review":
        return "Pending Review";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      default:
        return "Unknown";
    }
  };

  // Pagination calculations
  // SERVER FIRST: Use only surveyData?.initialPoolProcess?.residents (API data)
  // No local state buffering - server is single source of truth
  const allResidents = surveyData?.initialPoolProcess?.residents || [];


  // Check if survey is closed
  const isSurveyClosed =
    surveyData?.surveyClosed ||
    surveyData?.surveyClosureSurvey?.surveyClosed ||
    surveyData?.surveyClosureSurvey?.surveyCompleted ||
    surveyData?.surveyCompleted ||
    false;

  // Filter residents for invited users
  // Use useMemo to ensure it updates when surveyData.teamMembers or teamMembers prop changes
  const residents = useMemo(() => {
    if (!isInvitedUser()) {
      return allResidents;
    }

    const assignedResidents = getCurrentUserAssignedResidents();

    // Debug: Log assigned residents and available residents
    if (assignedResidents.length > 0) {
      // Find assigned residents that don't exist in the pool
      const missingResidents = assignedResidents.filter(
        (assignedId) =>
          !allResidents.some((resident) => resident.id === assignedId)
      );

      if (missingResidents.length > 0) {
        // Missing residents warning - silently handled
      }
    }

    // Filter residents by assigned IDs
    // Only show residents that exist in the pool AND are assigned to the user
    // IMPORTANT: Normalize IDs to strings for comparison since assignedResidents stores strings
    const assignedResidentIdsSet = new Set(
      assignedResidents.map((id) => String(id))
    );

    // Get current user ID to check direct assignment on resident object
    const currentUser = JSON.parse(localStorage.getItem("mocksurvey_user") || "{}");
    const currentUserId = currentUser._id || currentUser.id;

    const filteredResidents = allResidents.filter((resident) => {
      // 1. Determine if we have direct assignment info on the resident (Source of Truth from Resident Pool)
      // This data comes from the polling/fetch and is fresher than the teamMembers list
      let hasDirectAssignmentInfo = false;
      let isDirectlyAssigned = false;

      if (currentUserId) {
        // Check normalized field (assignedTeamMemberId is always present in mapped residents, even if null)
        if (resident.assignedTeamMemberId !== undefined) {
          hasDirectAssignmentInfo = true;
          if (resident.assignedTeamMemberId && String(resident.assignedTeamMemberId) === String(currentUserId)) {
            isDirectlyAssigned = true;
          }
        }

        // Check raw object field (as seen in API response)
        // If we haven't found info yet, or if we want to double check
        if (!hasDirectAssignmentInfo && resident.teamMemberUserId !== undefined) {
          hasDirectAssignmentInfo = true;
          if (resident.teamMemberUserId) {
            const tmId = typeof resident.teamMemberUserId === 'object'
              ? (resident.teamMemberUserId._id || resident.teamMemberUserId.id)
              : resident.teamMemberUserId;

            if (tmId && String(tmId) === String(currentUserId)) {
              isDirectlyAssigned = true;
            }
          }
        }
      }

      // 2. Check stale assignment list (from teamMembers prop)
      // This is a fallback for legacy data or when resident object is incomplete
      const isInAssignedList = assignedResidentIdsSet.has(String(resident.id));

      // DECISION:
      // If we have fresh direct info from the resident object, TRUST IT.
      // This handles the "Unassign" case: hasDirectAssignmentInfo=true, isDirectlyAssigned=false -> Returns false (Hidden)
      // This handles the "Assign" case: hasDirectAssignmentInfo=true, isDirectlyAssigned=true -> Returns true (Shown)
      if (hasDirectAssignmentInfo) {
        // Debug log for unassignment issues
        if (!isDirectlyAssigned && isInAssignedList) {
          // console.log(`Resident ${resident.id} hidden by direct info (unassigned) but present in stale assigned list.`);
        }
        return isDirectlyAssigned;
      }

      // Fallback to legacy check
      return isInAssignedList;
    });

    // If there's a mismatch (assigned count > filtered count), silently handle
    if (assignedResidents.length > filteredResidents.length) {
      const missingCount = assignedResidents.length - filteredResidents.length;
      // Missing residents handled silently
    }

    return filteredResidents;
  }, [allResidents, localTeamMembers, isInvitedUser, lastSave]);

  const totalPages = Math.ceil(residents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResidents = residents.slice(startIndex, endIndex);

  // Reset to page 1 when residents change
  useEffect(() => {
    setCurrentPage(1);
  }, [residents.length]);

  useEffect(() => {
    const storedResponses =
      surveyData?.initialPoolProcess?.observationChecklistResponses;

    // Create a map of question titles AND tags to IDs for API mapping
    const questionIdentifierToIdMap = {};
    observationChecklist.forEach(item => {
      questionIdentifierToIdMap[item.title] = item.id;
      questionIdentifierToIdMap[item.tag] = item.id; // Add tag mapping
    });

    // Also extract observation checklist responses from residents array (resident-centric structure)
    const residentsChecklistResponses = {};
    (surveyData?.initialPoolProcess?.residents || []).forEach((resident) => {
      // 1. Check for API observations (array of answered questions)
      if (Array.isArray(resident.observations)) {
        const apiResponses = {};
        resident.observations.forEach(obs => {
          // The API returns objects with { question: "...", answer: "...", title: "..." }
          // We try to match by tag (API title field) or question text

          // Try matching by tag (API title field)
          let checklistId = questionIdentifierToIdMap[obs.title];

          // If not found, try matching by question text
          if (!checklistId) {
            checklistId = questionIdentifierToIdMap[obs.question];
          }

          if (checklistId && obs.answer) {
            apiResponses[checklistId] = obs.answer.toLowerCase();
          }
        });

        if (Object.keys(apiResponses).length > 0) {
          residentsChecklistResponses[String(resident.id)] = apiResponses;
        }
      }

      // 2. Check for Local/Legacy responses (overrides API)
      if (resident.observationChecklistResponses &&
        typeof resident.observationChecklistResponses === "object" &&
        Object.keys(resident.observationChecklistResponses).length > 0) {

        // Merge with existing API responses if any
        residentsChecklistResponses[String(resident.id)] = {
          ...(residentsChecklistResponses[String(resident.id)] || {}),
          ...resident.observationChecklistResponses
        };
      }
    });

    let mergedResponses = {};

    // First, get responses from flat structure
    if (Array.isArray(storedResponses)) {
      const objectifiedResponses = storedResponses.reduce((acc, item) => {
        if (item?.residentId) {
          const residentKey = String(item.residentId);
          acc[residentKey] =
            (item.responses && typeof item.responses === "object"
              ? item.responses
              : {}) || {};
        }
        return acc;
      }, {});
      mergedResponses = objectifiedResponses;
    } else if (storedResponses && typeof storedResponses === "object") {
      const normalizedResponses = Object.entries(storedResponses).reduce(
        (acc, [residentId, responseValue]) => {
          acc[String(residentId)] =
            responseValue && typeof responseValue === "object"
              ? responseValue
              : {};
          return acc;
        },
        {}
      );
      mergedResponses = normalizedResponses;
    }

    // Merge with residents array responses (residents array takes priority as it's more up-to-date)
    const finalResponses = {
      ...mergedResponses,
      ...residentsChecklistResponses, // Residents array responses override flat structure
    };

    setObservationChecklistResponses(finalResponses);
  }, [
    surveyData?.initialPoolProcess?.observationChecklistResponses,
    surveyData?.initialPoolProcess?.residents, // Also watch residents array
  ]);

  // Initialize task statuses from surveyData if available
  useEffect(() => {
    if (surveyData?.initialPoolProcess?.taskStatuses) {
      // Ensure we only store string values for task statuses
      const stringStatuses = {};
      Object.keys(surveyData.initialPoolProcess.taskStatuses).forEach((key) => {
        const value = surveyData.initialPoolProcess.taskStatuses[key];
        if (typeof value === "object" && value !== null) {
          // If it's an object, extract the status property
          stringStatuses[key] = value.status || "in_progress";
        } else {
          stringStatuses[key] = value;
        }
      });

      // Prevent reverting "pending_review" to "in_progress" for current user if they just submitted
      // This handles the race condition where server data might be stale immediately after submission
      const currentUser = JSON.parse(
        localStorage.getItem("mocksurvey_user") || "{}"
      );
      if (
        justSubmittedRef.current &&
        currentUser._id &&
        stringStatuses[currentUser._id] === "in_progress"
      ) {
        stringStatuses[currentUser._id] = "pending_review";
      }

      setTaskStatuses(stringStatuses);
    }
  }, [surveyData?.initialPoolProcess?.taskStatuses]);

  // Initialize page status from survey data
  useEffect(() => {
    // Initialize page status from survey data
    if (surveyData?.initialPoolProcess?.isPageClosed !== undefined) {
      setIsPageClosed(surveyData.initialPoolProcess.isPageClosed);
    }
  }, [surveyData?.initialPoolProcess?.isPageClosed]);


  // Sync localStorage with fresh team member data for invited users
  useEffect(() => {
    if (!isInvitedUser()) return;

    const currentUser = JSON.parse(
      localStorage.getItem("mocksurvey_user") || "{}"
    );

    if (!currentUser._id) return;

    // Find the current user in multiple data sources (priority order)
    let teamMember = null;

    // SINGLE SOURCE OF TRUTH: Use effectiveTeamMembers (from API with proper UUIDs)
    // PRIORITY 1: Check effectiveTeamMembers (from API or prop fallback)
    if (effectiveTeamMembers.length > 0) {
      teamMember = effectiveTeamMembers.find(
        (member) =>
          member.id === currentUser._id ||
          member.email === currentUser.email ||
          String(member.id) === String(currentUser._id)
      );
    }
    // Note: We do NOT check initialPoolProcess.teamMembers to maintain single source of truth

    // If found and has assignedResidents, sync localStorage
    if (teamMember && teamMember.assignedResidents) {
      const currentAssignedResidents = currentUser.assignedResidents || [];
      const freshAssignedResidents = teamMember.assignedResidents || [];

      // Only update if they're different (avoid unnecessary updates)
      if (
        JSON.stringify(currentAssignedResidents.sort()) !==
        JSON.stringify(freshAssignedResidents.sort())
      ) {
        const updatedUser = {
          ...currentUser,
          assignedResidents: freshAssignedResidents,
        };
        localStorage.setItem("mocksurvey_user", JSON.stringify(updatedUser));
      }
    }
  }, [localTeamMembers, isInvitedUser]); // Sync when localTeamMembers changes - from API

  // WebSocket connection removed as per request

  // Show toast notification with Accept/Reject buttons when updates are pending
  useEffect(() => {
    const hasPendingUpdate = pendingRemoteUpdate || localPendingUpdate;

    if (hasPendingUpdate) {
      // CRITICAL: Only show toast if we don't already have one showing
      // This prevents dismissing and re-showing the same toast unnecessarily
      // The toast will stay visible until user clicks Accept or Reject
      if (!currentUpdateToastIdRef.current) {
        // Mark that we've shown the toast
        updateToastShownRef.current = true;

        // Show toast with Accept/Reject buttons in top right corner
        // This toast stays visible until user clicks Accept or Reject
        // duration: Infinity ensures it never auto-dismisses
        const updateToastId = toast.warning("⚠️ Updates available from server", {
          description:
            "New changes have been received. Would you like to accept them?",
          duration: Infinity, // CRITICAL: Keep toast visible until user acts - never auto-dismiss
          position: "top-right", // Position in top right corner
          action: {
            label: "Accept",
            onClick: () => {
              // Dismiss the update toast
              toast.dismiss(updateToastId);
              // Clear the toast ID ref
              currentUpdateToastIdRef.current = null;
              // Defer heavy operations to prevent UI freeze
              requestAnimationFrame(() => {
                // Clear local pending update flag
                if (localPendingUpdate) {
                  setLocalPendingUpdate(false);
                }

                // CRITICAL: Clear all editing flags BEFORE accepting updates
                // This ensures fresh start after accepting updates
                editingResidentsRef.current.clear();
                isEditingRef.current = false;
                isMakingLocalEditRef.current = false;

                // CRITICAL: Accept the remote update - this updates surveyData and clears pendingRemoteUpdate
                // Note: We dismiss the toast BEFORE accepting, so it won't disappear unexpectedly
                if (acceptRemoteUpdate) {
                  acceptRemoteUpdate();
                }

                // CRITICAL: Mark form as saved to clear dirty state
                if (markAsSaved) {
                  markAsSaved();
                }

                // Reset toast shown flag (toast already dismissed above)
                updateToastShownRef.current = false;

                // CRITICAL: Force immediate state sync after accepting
                setTimeout(() => {
                  // Re-join to trigger broadcast removed as per request
                }, 300);

              });
            },
          },
          cancel: {
            label: "Reject",
            onClick: () => {
              // Dismiss the update toast
              toast.dismiss(updateToastId);
              // Clear the toast ID ref
              currentUpdateToastIdRef.current = null;

              // Discard both local and remote pending updates
              if (localPendingUpdate) {
                setLocalPendingUpdate(false);
              }
              if (discardRemoteUpdate) {
                discardRemoteUpdate();
              }

              // Reset toast shown flag
              updateToastShownRef.current = false;

              // Don't show additional toast - only show the update toast
            },
          },
        });

        // Store the toast ID so we can dismiss it if a new broadcast comes in
        currentUpdateToastIdRef.current = updateToastId;
      }
    }
    // CRITICAL: Don't dismiss toast when hasPendingUpdate becomes false
    // The toast should only be dismissed when user clicks Accept or Reject
    // The toast has duration: Infinity, so it will stay visible until user acts
  }, [
    pendingRemoteUpdate,
    localPendingUpdate,
    // Don't include function dependencies - they might change and cause unnecessary re-runs
    // The toast should persist until user explicitly clicks Accept or Reject
  ]);

  // Automatically assign IDs and ensure all residents have proper areas
  useEffect(() => {
    if (
      !surveyData?.initialPoolProcess?.residents ||
      surveyData?.initialPoolProcess?.residents.length === 0
    )
      return;
    if (idsAssignedRef.current) return; // Skip if already assigned

    // Check if any residents are missing IDs or areas
    const residentsNeedingIds =
      surveyData?.initialPoolProcess?.residents.filter((r) => !r.id);
    const residentsNeedingAreas =
      surveyData?.initialPoolProcess?.residents.filter(
        (r) =>
          !r.interviewAreas ||
          r.interviewAreas.length === 0 ||
          !r.reviewAreas ||
          r.reviewAreas.length === 0
      );

    if (residentsNeedingIds.length > 0 || residentsNeedingAreas.length > 0) {
      // Default areas
      const defaultInterviewAreas = [
        "Resident Rights",
        "Resident Satisfaction",
        "Quality of Life",
      ];
      const defaultReviewAreas = [
        "Records Review",
        "Staff Interviews",
        "Family Interviews",
      ];

      // Ensure areas for all residents (use backend-provided IDs, don't generate)
      const updatedResidents = surveyData?.initialPoolProcess?.residents.map(
        (resident, index) => {
          let needsUpdate = false;
          const updates = { ...resident };

          // IMPORTANT: Use backend-provided IDs (e.g., "extracted_1764204544732_1764204544736")
          // Do NOT generate IDs on frontend - this causes mismatches when pool is regenerated
          // If resident has no ID, it should come from the backend API
          // Only log a warning if ID is missing (don't generate)
          if (!resident.id) {
            // ID missing - handled silently
            // Don't generate ID - let backend handle it
          }

          // Assign interview areas if missing
          if (
            !resident.interviewAreas ||
            resident.interviewAreas.length === 0
          ) {
            updates.interviewAreas = defaultInterviewAreas;
            needsUpdate = true;
          }

          // Assign review areas if missing
          if (!resident.reviewAreas || resident.reviewAreas.length === 0) {
            updates.reviewAreas = defaultReviewAreas;
            needsUpdate = true;
          }

          // Set canBeInterviewed if undefined
          if (resident.canBeInterviewed === undefined) {
            updates.canBeInterviewed = true;
            needsUpdate = true;
          }

          return needsUpdate ? updates : resident;
        }
      );

      // Mark that fixes have been applied
      idsAssignedRef.current = true;

      // Update surveyData with fixed residents
      handleSurveyDataChange("initialPoolProcess", {
        ...surveyData.initialPoolProcess,
        residents: updatedResidents,
      });

      const messages = [];
      if (residentsNeedingIds.length > 0)
        messages.push(`${residentsNeedingIds.length} IDs`);
      if (residentsNeedingAreas.length > 0)
        messages.push(`${residentsNeedingAreas.length} area assignments`);

      toast.success(`Auto-assigned: ${messages.join(", ")}`, {
        position: "top-right",
        duration: 3000,
      });
    } else if (surveyData?.initialPoolProcess?.residents.length > 0) {
      // All residents have proper data
      idsAssignedRef.current = true;
    }
  }, [surveyData?.initialPoolProcess?.residents]);

  // Check if user has already generated initial pool before proceeding
  const handleGenerateClick = async () => {
    if (!currentSurveyId) {
      setGenerationStatus("Error: No survey ID found");
      return;
    }

    setIsCheckingGeneration(true);
    try {
      const checkResponse = await api.survey.surveyCheck(currentSurveyId);
      if (checkResponse.status && checkResponse.statusCode === 200 && checkResponse.data?.initialPool) {
        // Initial pool already exists, show confirmation modal
        setShowOverrideModal(true);
      } else {
        // No existing data, proceed directly
        handleGenerateResidentSample();
      }
    } catch (error) {
     
      // On error, proceed with generation anyway
      handleGenerateResidentSample();
    } finally {
      setIsCheckingGeneration(false);
    }
  };

  // Handle confirmation to override existing data
  const handleConfirmOverride = () => {
    setShowOverrideModal(false);
    handleGenerateResidentSample();
  };

  // Function to generate resident sample by calling the health assistant API
  const handleGenerateResidentSample = async () => {
    if (!currentSurveyId) {
      setGenerationStatus("Error: No survey ID found");
      return;
    }

    setIsGenerating(true);
    setGenerationStatus("Generating resident sample...");

    try {
      const response = await healthAssistantAPI.getResidents(currentSurveyId);

      // Check if response is successful AND data is an array (not an error object)
      const isSuccess = response.success || response.status === true || response.statusCode === 200;
      const hasValidData = isSuccess && Array.isArray(response.data);
      
      // Handle nested error response (when outer status is 200 but data contains error)
      if (isSuccess && response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        // Check if data is an error object
        if (response.data.success === false || response.data.statusCode >= 400) {
          throw new Error(response.data.message || "Failed to generate resident sample");
        }
      }

      if (hasValidData) {
        // Map the API response to the expected format - use API data directly
        const mappedResidents = response.data.map((resident, index) => {
          // Format admission date to USA format (MM/DD/YYYY)
          let formattedAdmissionDate = "";
          if (resident.admissionDate) {
            try {
              const dateStr = resident.admissionDate;

              // Check if date is in DD/MM/YYYY format (European)
              if (dateStr.includes("/")) {
                const parts = dateStr.split("/");
                if (parts.length === 3) {
                  const day = parseInt(parts[0], 10);
                  const month = parseInt(parts[1], 10);
                  const year = parseInt(parts[2], 10);

                  // If day > 12, it's definitely DD/MM/YYYY format
                  if (day > 12) {
                    // Convert to MM/DD/YYYY
                    formattedAdmissionDate = `${month
                      .toString()
                      .padStart(2, "0")}/${day
                        .toString()
                        .padStart(2, "0")}/${year}`;
                  } else {
                    // Ambiguous case - assume DD/MM/YYYY if coming from API
                    formattedAdmissionDate = `${month
                      .toString()
                      .padStart(2, "0")}/${day
                        .toString()
                        .padStart(2, "0")}/${year}`;
                  }
                } else {
                  formattedAdmissionDate = dateStr;
                }
              } else {
                // Try parsing as ISO or other format
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                  formattedAdmissionDate = date.toLocaleDateString("en-US");
                } else {
                  formattedAdmissionDate = dateStr;
                }
              }
            } catch (error) {
              formattedAdmissionDate = resident.admissionDate;
            }
          }

          // Map risks array directly
          const risks = Array.isArray(resident.risks) ? resident.risks : [];

          return {
            // Core identification - use backend-provided ID
            // Backend IDs are stable (e.g., "generatedId")
            // Don't generate IDs on frontend to avoid mismatches
            id: resident.generatedId || resident.id, // Use generatedId from API
            name: resident.name,
            room: resident.room || "",
            admissionDate: formattedAdmissionDate,

            // Status and classification (from API)
            status: resident.status || (resident.isNewAdmission ? "New Admission" : ""),
            isNewAdmission: resident.isNewAdmission,

            // Risks and selection (from API)
            risks: risks,
            selectionReason: resident.selectionReason || "",
            diagnosis: risks.map(r => r.name).join(", ") || "",

            // Special types derived from API data
            specialTypes: determineSpecialTypes({
              ...resident,
              risks: risks,
              status: resident.status || (resident.isNewAdmission ? "New Admission" : "")
            }),

            // Flags and indicators (from API with smart defaults)
            included:
              resident.included !== undefined ? resident.included : true,
            fiFlagged:
              resident.fiFlagged ||
              resident.selectionReason?.includes("4+ checks") ||
              false,
            ijHarm: resident.ijHarm || false,

            // Interview capability (determined from API status and needs)
            canBeInterviewed:
              resident.canBeInterviewed !== undefined
                ? resident.canBeInterviewed
                : !resident.status?.includes("Non-Interviewable") &&
                !resident.status?.includes("Hospice") &&
                risks.length > 0,

            // Interview and review areas (from API or smart defaults based on status)
            interviewAreas:
              resident.interviewAreas ||
              (resident.canBeInterviewed ||
                (!resident.status?.includes("Non-Interviewable") &&
                  !resident.status?.includes("Hospice"))
                ? [
                  "Resident Rights",
                  "Resident Satisfaction",
                  "Quality of Life",
                ]
                : []),

            reviewAreas: resident.reviewAreas || [
              "Records Review",
              "Staff Interviews",
              "Family Interviews",
            ],

            // Additional fields from API if present
            notes: resident.notes || "",
            pressureUlcers: resident.pressureUlcers,
            qualityMeasureCount: resident.qualityMeasureCount
          };
        });

        // Reset the IDs assigned flag so auto-assignment can run for new residents
        idsAssignedRef.current = false;

        setHasUnsavedChanges(true);

        handleSurveyDataChange("initialPoolProcess", {
          ...surveyData.initialPoolProcess,
          residents: mappedResidents,
        });
        setGenerationStatus(
          `Generated ${mappedResidents.length} residents successfully!`
        );

        // Auto-save the generated residents to persist them
        try {
          await handleInitialPoolProcessSubmit(false, mappedResidents);
          toast.success(
            `${mappedResidents.length} residents generated and saved successfully!`
          );
        } catch (saveError) {
          // Still show success for generation even if save fails
          toast.success(
            `${mappedResidents.length} residents generated successfully!`
          );
          toast.warning("Could not auto-save the residents. Please save manually.", {
            duration: 4000,
          });
        }
      } else {
        throw new Error(
          response.message || "Failed to generate resident sample"
        );
      }
    } catch (error) {
      setGenerationStatus("Error generating resident sample: " + error.message);
      toast.error("Failed to generate resident sample: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to determine special types based on resident data
  // Returns actual patient needs from API plus status badges - no hardcoded derived labels
  const determineSpecialTypes = (resident) => {
    const types = [];

    // Add status as a special type if present
    if (resident.status && resident.status.trim() !== "") {
      types.push(resident.status);
    }

    // Add all risks from API directly - no transformation
    const risks = resident.risks || [];
    types.push(...risks.map(r => r.name));

    return types;
  };

  const observationChecklist = [
    {
      id: "respect_privacy",
      title:
        "Staff treat residents with respect and maintain privacy during care",
      description:
        "(knock before entering, close doors/curtains, appropriate communication)",
      tag: "F550 - Resident Rights / Dignity and Respect",
    },
    {
      id: "preferred_names",
      title:
        "Residents are addressed by preferred names and not rushed during interactions",
      description: '(avoid "sweetie," "honey," etc.)',
      tag: "F553 - Right to Participate in Care / Dignity",
    },
    {
      id: "safe_positioning",
      title:
        "Residents are safely positioned in bed or wheelchair and free from unnecessary restraints",
      description:
        "(proper posture, devices in good condition, heels offloaded)",
      tag: "F684 - Quality of Care",
    },
    {
      id: "safe_transfers",
      title:
        "Staff assist residents with ambulation or transfers safely using gait belts or lifts",
      description: "(no dragging, rushing, or unsafe maneuvering)",
      tag: "F689 - Accidents and Supervision",
    },
    {
      id: "pressure_injury_prevention",
      title: "Pressure injury prevention practices are evident",
      description:
        "(turning/repositioning, heel protection, clean and dry linens)",
      tag: "F686 - Treatment and Prevention of Pressure Injuries",
    },
    {
      id: "hand_hygiene",
      title:
        "Hand hygiene and infection control practices are consistently observed during care",
      description:
        "(before/after resident contact, gloves changed appropriately)",
      tag: "F880 - Infection Prevention and Control",
    },
    {
      id: "hydration_support",
      title:
        "Residents have fluids within reach and are encouraged or assisted to drink",
      description: "(observe for dry lips, confusion, or signs of dehydration)",
      tag: "F692 - Nutrition and Hydration",
    },
    {
      id: "pain_response",
      title:
        "Residents exhibit comfort; staff respond promptly to pain or distress",
      description: "(observe body language, facial expressions, restlessness)",
      tag: "F697 - Pain Management",
    },
    {
      id: "engagement",
      title:
        "Residents are engaged, awake, and appropriately involved in activities or conversation",
      description: "(not left idle or isolated for prolonged periods)",
      tag: "F679 - Activities / Quality of Life",
    },
    {
      id: "supportive_approach",
      title:
        "Residents appear calm, not fearful or agitated, and staff use supportive approaches",
      description: "(no yelling, ignoring, or rough handling)",
      tag: "F600 - Free from Abuse and Neglect",
    },
  ];

  const interviewSections = [
    {
      title: "Resident Rights (F550-F559)",
      area: "Resident Rights",
      questions: [
        { id: "rights_respected", text: "Do you feel your rights as a resident are respected here?" },
        { id: "daily_choices", text: "Are you able to make choices about your daily activities?" },
        { id: "staff_respect", text: "Do staff members treat you with dignity and respect?" },
        { id: "care_decisions", text: "Are you able to participate in decisions about your care?" },
      ]
    },
    {
      title: "Resident Satisfaction",
      area: "Resident Satisfaction",
      questions: [
        { id: "care_satisfaction", text: "Are you satisfied with the care you receive here?" },
        { id: "recommend_facility", text: "Would you recommend this facility to others?" },
        { id: "safe_secure", text: "Do you feel safe and secure living here?" },
        { id: "needs_met", text: "Are your needs being met by the staff?" },
      ]
    },
    {
      title: "Quality of Life (F552-F555)",
      area: "Quality of Life",
      questions: [
        { id: "maintain_dignity", text: "Do you feel you can maintain your dignity here?" },
        { id: "daily_routine_choices", text: "Are you able to make choices about your daily routine?" },
        { id: "privacy_respected", text: "Do you feel your privacy is respected?" },
        { id: "needs_accommodated", text: "Are your individual needs and preferences accommodated?" },
      ]
    }
  ];

  // Helper function to extract team member ID
  // API always returns teamMemberUserId as a string
  const extractTeamMemberUserId = (value) => {
    return value || null;
  };

  // Handle bulk assignment of residents to a team member
  // Now accepts selectedResidentIds and teamMemberId as parameters (from ResidentAssignmentModal)
  const handleBulkAssignment = async (selectedResidentIds, teamMemberId) => {
    if (!teamMemberId || !selectedResidentIds?.length) return;

    const selectedResidentsSet = new Set(selectedResidentIds);
    const loadingToast = toast.loading("Verifying bulk assignment availability...");
    const selectedResidentsList = allResidents.filter(r => selectedResidentsSet.has(r.id));

    try {
      // Check for conflicts with already-assigned residents
      const conflicts = await checkAssignmentConflicts(selectedResidentsList, teamMemberId);

      if (conflicts.length > 0) {
        toast.dismiss(loadingToast);
        showConflictError(conflicts);
        return;
      }

      // SERVER-FIRST: Build updated residents payload for API submission
      const updatedResidentsWithAssignment = allResidents.map((r) =>
        selectedResidentsSet.has(r.id)
          ? { ...r, assignedTeamMemberId: teamMemberId, teamMemberUserId: teamMemberId }
          : r
      );

      toast.dismiss(loadingToast);

      // Store count before clearing
      const assignedCount = selectedResidentIds.length;

      // Save to API and fetch fresh data - no local state manipulation
      await saveAssignmentsToServer(assignedCount, updatedResidentsWithAssignment);

    } catch (error) {
      toast.dismiss(loadingToast);
      const errorMessage = error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        "An error occurred while verifying assignments.";
      toast.error(errorMessage);
    }
  };

  // Check for assignment conflicts with server
  const checkAssignmentConflicts = async (residentsList, targetTeamMemberId) => {
    const conflicts = [];
    const surveyId = localStorage.getItem("currentSurveyId");

    await Promise.all(residentsList.map(async (resident) => {
      try {
        const response = await api.survey.checkResidentAssignment({
          surveyId,
          generatedId: resident.generatedId || resident.id
        });

        if (response?.data?.isAssigned) {
          const assignedMember = response.data.resident?.teamMemberUserId;
          if (assignedMember?._id && String(assignedMember._id) !== String(targetTeamMemberId)) {
            const memberName = assignedMember.firstName || assignedMember.name || "another team member";
            conflicts.push(`${resident.name} (assigned to ${memberName})`);
          }
        }
      } catch (err) {
        // Continue checking other residents
      }
    }));

    return conflicts;
  };

  // Show conflict error toast
  const showConflictError = (conflicts) => {
    toast.error(
      <div>
        <p className="font-semibold">Cannot proceed. The following residents are already assigned:</p>
        <ul className="list-disc pl-4 mt-1 text-xs">
          {conflicts.slice(0, 5).map((c, i) => <li key={i}>{c}</li>)}
          {conflicts.length > 5 && <li>...and {conflicts.length - 5} others</li>}
        </ul>
        <p className="mt-1">Please unselect them first.</p>
      </div>,
      { duration: 5000 }
    );
  };

  // Save assignments to server
  const saveAssignmentsToServer = async (assignedCount, updatedResidents = null) => {
    const savingToast = toast.loading("Saving assignments to server...");
    try {
      await handleInitialPoolProcessSubmit(false, updatedResidents);
      toast.dismiss(savingToast);
      toast.success(`Assigned ${assignedCount} residents successfully`);
      
      // Refetch team members to get updated assignedResidents from API
      await fetchTeamMembers(true);
      
      // Fetch fresh data from server after successful assignment
      await fetchSavedInitialPool(true); // Background sync to refresh data
    } catch (saveError) {
      toast.dismiss(savingToast);
      const errorMessage = saveError?.response?.data?.message ||
        saveError?.data?.message ||
        saveError?.message ||
        "Failed to save assignments to server.";
      toast.error(errorMessage);
    }
  };

  const updateResidentNestedData = (residentsArray, residentId, updateFn) => {
    return residentsArray.map((resident) => {
      if (String(resident.id) === String(residentId)) {
        return updateFn(resident);
      }
      return resident;
    });
  };

  // Helper function to build resident-centric payload
  // Returns array of ALL residents with nested interviews, observations, and checklistResponses
  const buildResidentsPayload = (
    allResidentsList,
    interviews,
    observations,
    checklistResponses,
    assignedResidentIds,
    isTeamMember = false
  ) => {
    return allResidentsList.map((resident) => {
      const residentId = resident.id;

      // For team members: only include nested data for assigned residents
      // For team leads: include all nested data
      // IMPORTANT: Use string comparison for ID check to handle number/string mismatches
      const isAssigned = !isTeamMember || assignedResidentIds.some(id => String(id) === String(residentId));

      // Filter interviews for this resident
      const residentInterviews = isAssigned
        ? interviews.filter((interview) => String(interview.residentId) === String(residentId))
        : [];

      // Filter observations for this resident
      const residentObservations = isAssigned
        ? observations.filter((obs) => String(obs.residentId) === String(residentId))
        : [];

      // Get checklist responses for this resident
      let residentChecklistResponses = {};
      if (isAssigned && checklistResponses) {
        if (Array.isArray(checklistResponses)) {
          // Array format: [{ residentId, responses: {...} }]
          const found = checklistResponses.find(
            (item) => String(item.residentId) === String(residentId)
          );
          if (found && found.responses) {
            residentChecklistResponses = found.responses;
          }
        } else if (typeof checklistResponses === "object") {
          // Object format: { [residentId]: { ... } }
          residentChecklistResponses = checklistResponses[residentId] || checklistResponses[String(residentId)] || {};
        }
      }

      // Return resident with nested data
      return {
        ...resident,
        residentInterviews,
        observations: residentObservations,
        observationChecklistResponses: residentChecklistResponses,
      };
    });
  };

  const handleTeamMemberWorkSubmit = async (
    isContinueClicked = false,
    isDraft = true,
    isManualSave = false
  ) => {
    try {

      const surveyId = localStorage.getItem("currentSurveyId");
      const currentUser = JSON.parse(
        localStorage.getItem("mocksurvey_user") || "{}"
      );

      if (!surveyId) {
        toast.error("Survey ID not found. Please start from the beginning.", {
          position: "top-right",
        });
        return;
      }

      // Check if page is closed for team members
      if (isPageClosed) {
        toast.error(
          "This page has been closed by your team lead. You cannot submit changes.",
          {
            position: "top-right",
          }
        );
        return;
      }
      // Don't show loading toast for auto-saves (drafts)
      if (!isDraft) {
        setIsSubmitting(true);
        isContinueClicked &&
          toast.loading("Saving your work...", {
            position: "top-right",
          });
      } else {
        setIsAutoSaving(true);
      }

      // STEP 1: For drafts, skip fetching fresh data to preserve newly added interviews
      // Fresh data might not have the newly added interview yet, causing it to be lost
      let freshSurveyData = null;
      // Socket data fetching removed as per request


      const assignedResidentIds = getCurrentUserAssignedResidents();

      // Use CURRENT surveyData (which has deletions applied) instead of freshSurveyData
      // freshSurveyData might be stale and include deleted items
      // Extract existing interviews from residents array (new resident-centric structure)
      const existingTeamMemberInterviews = [];

      // Extract interviews from residents array for assigned residents
      (surveyData?.initialPoolProcess?.residents || []).forEach((resident) => {
        if (assignedResidentIds.includes(resident.id) && resident.residentInterviews) {
          existingTeamMemberInterviews.push(...resident.residentInterviews);
        }
      });


      const mainSurveyInterviewsFromLocal =
        surveyData?.initialPoolProcess?.residentInterviews || [];
      const mainSurveyInterviewsFromRoot = surveyData?.residentInterviews || [];
      const mainSurveyInterviewsFromFresh =
        freshSurveyData?.initialPoolProcess?.residentInterviews || [];

      const allMainInterviews = [
        ...mainSurveyInterviewsFromLocal, // LOCAL FIRST - includes newly added interviews
        ...mainSurveyInterviewsFromRoot, // Root level interviews
        ...mainSurveyInterviewsFromFresh, // Fresh server data (may not have new interviews yet)
      ];

      // Filter interviews by assigned residents - use string comparison to handle type mismatches
      const mainSurveyInterviews = allMainInterviews.filter((interview) => {
        if (!interview.residentId) return false;

        const interviewResidentId = String(interview.residentId);
        const isAssigned = assignedResidentIds.some(
          (assignedId) => String(assignedId) === interviewResidentId
        );

        return isAssigned;
      });

      // Collect interview responses from radio buttons (DOM scraping fallback)
      const collectedResponses = collectInterviewResponses();

      // Combine all interviews - prioritize NEW interviews from current session, then existing ones
      // This ensures newly added interviews are preserved and deleted ones are excluded
      const allTeamMemberInterviews = [
        ...mainSurveyInterviews, // Add current session interviews FIRST (includes deletions)
        ...existingTeamMemberInterviews, // Then add existing (from current payload, already filtered)
      ];

      // Remove duplicates - prioritize mainSurveyInterviews (current session) over existing
      // This ensures if an interview was deleted, it stays deleted
      const interviewMap = new Map();

      // First, add all current session interviews (these take priority, includes deletions)
      mainSurveyInterviews.forEach((interview) => {
        const key =
          interview.id ||
          `${interview.residentId}_${interview.type}_${interview.timestamp || ""
          }`;

        // Merge with collected responses if available
        if (interview.residentId && collectedResponses[interview.residentId]) {
          interview.responses = {
            ...(interview.responses || {}),
            ...collectedResponses[interview.residentId]
          };
        }

        interviewMap.set(key, interview);
      });

      // Then, only add existing interviews that aren't already in the map
      // This prevents deleted interviews from being re-added
      existingTeamMemberInterviews.forEach((interview) => {
        const key =
          interview.id ||
          `${interview.residentId}_${interview.type}_${interview.timestamp || ""
          }`;
        if (!interviewMap.has(key)) {
          // Merge with collected responses if available
          if (interview.residentId && collectedResponses[interview.residentId]) {
            interview.responses = {
              ...(interview.responses || {}),
              ...collectedResponses[interview.residentId]
            };
          }
          interviewMap.set(key, interview);
        }
      });

      // Also check if we have collected responses for residents that don't have an interview object yet
      Object.entries(collectedResponses).forEach(([residentId, responses]) => {
        // Check if we already have an interview for this resident
        const hasInterview = Array.from(interviewMap.values()).some(i => String(i.residentId) === String(residentId));

        if (!hasInterview) {
          const resident = allResidents.find(r => String(r.id) === String(residentId));
          if (resident) {
            // Create a new interview object
            const newInterview = {
              residentId: residentId,
              residentName: resident.name,
              responses: responses,
              interviewDate: new Date().toISOString(),
              areas: resident.interviewAreas || [],
              type: "",
              email: "",
              notes: "",
              id: `interview_${Date.now()}_${residentId}`,
              status: "",
              timestamp: "",
              date: "",
            };

            const key = `${residentId}__${newInterview.timestamp}`;
            interviewMap.set(key, newInterview);
          }
        }
      });

      const teamMemberInterviews = Array.from(interviewMap.values());


      // Use teamMemberInterviews directly - do not filter by assignedResidentIds
      // This ensures interviews are saved even if assignment data is slightly out of sync
      const filteredTeamMemberInterviews = teamMemberInterviews;

      const mainSurveyObservations = (
        surveyData?.initialPoolProcess?.observations || []
      ).filter((obs) => {
        if (!obs.residentId) return false;
        return assignedResidentIds.some(
          (assignedId) => String(assignedId) === String(obs.residentId)
        );
      });

      const teamMemberObservations = mainSurveyObservations;

      // Get team member's assigned residents
      const teamMemberResidents = allResidents.filter(
        (r) =>
          assignedResidentIds.includes(r.id) ||
          r.assignedTeamMemberId === currentUser._id
      );


      const componentStateResponses = observationChecklistResponses || {};

      // Also check flat structure from surveyData
      const surveyDataResponses = surveyData.initialPoolProcess?.observationChecklistResponses || {};

      // Extract from residents array (resident-centric structure) - might have server data
      const residentsArrayChecklistResponses = {};
      (allResidents || surveyData?.initialPoolProcess?.residents || []).forEach((resident) => {
        if (resident && resident.id && resident.observationChecklistResponses) {
          const residentId = String(resident.id);
          residentsArrayChecklistResponses[residentId] = resident.observationChecklistResponses;
        }
      });

      // Merge all sources: component state takes highest precedence (user's latest changes)
      // Then residents array, then surveyData flat structure
      const mergedResponses = {};

      // First, add all from surveyData
      Object.keys(surveyDataResponses).forEach((residentId) => {
        mergedResponses[residentId] = surveyDataResponses[residentId];
      });

      // Then, override with residents array data
      Object.keys(residentsArrayChecklistResponses).forEach((residentId) => {
        mergedResponses[residentId] = {
          ...mergedResponses[residentId],
          ...residentsArrayChecklistResponses[residentId],
        };
      });

      // Finally, override with component state (user's latest changes take precedence)
      Object.keys(componentStateResponses).forEach((residentId) => {
        mergedResponses[residentId] = {
          ...mergedResponses[residentId],
          ...componentStateResponses[residentId],
        };
      });



      // Use mergedResponses directly - do not filter by existence of manual observations
      // This ensures checklist responses are saved even if no manual notes are added
      const filteredChecklistResponses = mergedResponses;

      const formattedObservationChecklistResponses =
        formatObservationChecklistResponsesForSubmission(
          filteredChecklistResponses,
          null // Do not filter by assignedResidentIds
        );

      // Find the team member's internal ID from the teamMembers array
      // Use localTeamMembers (from API) as the source of truth for team member data
      const teamMember = localTeamMembers.find(
        (member) =>
          member.email === currentUser.email ||
          member.userId === currentUser._id ||
          member.id === currentUser._id
      );

      // Determine task status: "pending_review" for final submission, keep current status for drafts
      const finalTaskStatus = isDraft
        ? taskStatuses[currentUser._id] || "in_progress"
        : "pending_review"; // Final submission sets status to "pending_review" (waiting for team lead approval)

      // Define the ID to be used for this submission to ensure consistency
      const submissionTeamMemberId = teamMember?.id || currentUser._id;

      // Build resident-centric payload: ALL residents with nested data
      // Team members send ALL residents, but only include nested data for assigned ones
      const residentsPayload = buildResidentsPayload(
        allResidents, // ALL residents from surveyData
        filteredTeamMemberInterviews,
        teamMemberObservations,
        formattedObservationChecklistResponses,
        [], // assignedResidentIds ignored when isTeamMember is false
        false // Treat as team lead to bypass internal filtering
      );

      // Map to API payload structure
      const interviewQuestionsMap = {
        "rights_respected": {
          title: "Resident Rights (F550-F559)",
          question: "Do you feel your rights as a resident are respected here?"
        },
        "daily_choices": {
          title: "Resident Rights (F550-F559)",
          question: "Are you able to make choices about your daily activities?"
        },
        "staff_respect": {
          title: "Resident Rights (F550-F559)",
          question: "Do staff members treat you with dignity and respect?"
        },
        "care_decisions": {
          title: "Resident Rights (F550-F559)",
          question: "Are you able to participate in decisions about your care?"
        },
        "care_satisfaction": {
          title: "Resident Satisfaction:",
          question: "Are you satisfied with the care you receive here?"
        },
        "recommend_facility": {
          title: "Resident Satisfaction:",
          question: "Would you recommend this facility to others?"
        },
        "safe_secure": {
          title: "Resident Satisfaction:",
          question: "Do you feel safe and secure living here?"
        },
        "needs_met": {
          title: "Resident Satisfaction:",
          question: "Are your needs being met by the staff?"
        },
        "maintain_dignity": {
          title: "Quality of Life (F552-F555)",
          question: "Do you feel you can maintain your dignity here?"
        },
        "daily_routine_choices": {
          title: "Quality of Life (F552-F555)",
          question: "Are you able to make choices about your daily routine?"
        },
        "privacy_respected": {
          title: "Quality of Life (F552-F555)",
          question: "Do you feel your privacy is respected?"
        },
        "needs_accommodated": {
          title: "Quality of Life (F552-F555)",
          question: "Are your individual needs and preferences accommodated?"
        }
      };

      const apiResidents = residentsPayload.map(r => {
        // Map interviews
        const interviews = [];
        // Check residentInterviews (which contains responses object)
        if (r.residentInterviews && r.residentInterviews.length > 0) {
          r.residentInterviews.forEach(interview => {
            if (interview.responses) {
              Object.entries(interview.responses).forEach(([key, value]) => {
                const questionInfo = interviewQuestionsMap[key];
                if (questionInfo) {
                  interviews.push({
                    title: questionInfo.title,
                    question: questionInfo.question,
                    answer: value ? (value.charAt(0).toUpperCase() + value.slice(1)) : ""
                  });
                }
              });
            }
          });
        }

        // Map observations
        const observations = [];
        // Check for observationChecklistResponses (nested object)
        if (r.observationChecklistResponses) {
          Object.entries(r.observationChecklistResponses).forEach(([itemId, value]) => {
            const item = observationChecklist.find(i => i.id === itemId);
            if (item) {
              observations.push({
                title: item.tag,
                question: `${item.title} ${item.description}`,
                answer: value ? (value.charAt(0).toUpperCase() + value.slice(1)) : ""
              });
            }
          });
        }
        // Also check for existing observations array (if any)
        if (r.observations && Array.isArray(r.observations)) {
          r.observations.forEach(obs => {
            // Avoid duplicates if already added from checklist responses
            const isDuplicate = observations.some(o => o.title === obs.title && o.question === obs.question);
            if (!isDuplicate) {
              observations.push({
                title: obs.title || "",
                question: obs.question || "",
                answer: obs.answer || ""
              });
            }
          });
        }

        return {
          generatedId: r.generatedId || r.id,
          name: r.name,
          room: r.room,
          admissionDate: r.admissionDate,
          isNewAdmission: r.isNewAdmission,
          pressureUlcers: r.pressureUlcers || null,
          risks: r.risks || [],
          qualityMeasureCount: r.qualityMeasureCount || 0,
          ...(() => {
            const teamMemberId = extractTeamMemberUserId(r.teamMemberUserId) || extractTeamMemberUserId(r.assignedTeamMemberId);
            return teamMemberId ? { teamMemberUserId: teamMemberId } : {};
          })(),
          included: r.included !== undefined ? r.included : true,
          scheduleInterviewType: r.scheduleInterviewType || "",
          scheduleInterviewEmail: r.scheduleInterviewEmail || "",
          scheduleInterviewDateTime: r.scheduleInterviewDateTime || "",
          scheduleInterviewNotes: r.scheduleInterviewNotes || "",
          interviews: interviews,
          scheduleObservationArea: r.scheduleObservationArea || "",
          scheduleObservationDescription: r.scheduleObservationDescription || "",
          scheduleObservationDateTime: r.scheduleObservationDateTime || "",
          observations: observations,
          notes: r.notes || ""
        };
      });

      const apiPayload = {
        surveyId: surveyId,
        residents: apiResidents
      };

      // Call API 
      let response;
      try {
        response = await api.survey.submitInitialPoolTeamMember(apiPayload);
      } catch (error) {

        // Fallback to offline save if API fails
        if (saveOfflineData) {
          await saveOfflineData(apiPayload);
          toast.success("Saved offline. Will sync when online.", { position: "top-right" });
          if (!isDraft) setIsSubmitting(false);
          else setIsAutoSaving(false);
          return;
        }
        throw error;
      }

      // Handle response
      const isSuccess = response && (response.statusCode === 200 || response.success || response.status === true);

      if (isSuccess) {
        toast.dismiss();

        // Extract residents array from response (new resident-centric structure)
        // Response may have: actualResponse.data.residents or actualResponse.data.updatedPayload.residents
        const responseResidents =
          response?.data?.residents ||
          response?.data?.updatedPayload?.residents ||
          response?.data?.updatedData?.initialPoolProcess?.residents ||
          residentsPayload; // Fallback to what we sent

        // Extract nested data from residents array
        const submittedInterviews = [];
        const submittedObservations = [];
        const submittedChecklistResponsesObj = {};

        // Ensure responseResidents is an array before iterating
        const safeResponseResidents = Array.isArray(responseResidents) ? responseResidents : [];
        
        safeResponseResidents.forEach((resident) => {
          // Extract interviews
          if (resident.residentInterviews && Array.isArray(resident.residentInterviews)) {
            submittedInterviews.push(...resident.residentInterviews);
          }

          // Extract observations
          if (resident.observations && Array.isArray(resident.observations)) {
            submittedObservations.push(...resident.observations);
          }

          // Extract checklist responses
          if (resident.observationChecklistResponses &&
            typeof resident.observationChecklistResponses === "object" &&
            Object.keys(resident.observationChecklistResponses).length > 0) {
            submittedChecklistResponsesObj[String(resident.id)] = resident.observationChecklistResponses;
          }
        });

        // IMPORTANT: Don't clear residentInterviews when saving drafts
        // Preserve ALL existing interviews in surveyData so new ones aren't lost
        const currentInterviews = [
          ...(surveyData?.initialPoolProcess?.residentInterviews || []),
          ...(surveyData?.residentInterviews || []),
        ];

        // Merge all interviews - prioritize current local, then submitted
        const allInterviewsToPreserve = [
          ...currentInterviews,
          ...submittedInterviews,
        ];

        // Remove duplicates from current interviews (keep first occurrence)
        // Ensure allInterviewsToPreserve is an array before filtering
        const uniqueCurrentInterviews = Array.isArray(allInterviewsToPreserve) 
          ? allInterviewsToPreserve.filter(
              (interview, index, self) =>
                Array.isArray(self) && index ===
                self.findIndex((i) => {
                  // Match by ID if both have IDs
                  if (i.id && interview.id) {
                    return i.id === interview.id;
                  }
                  // Match by residentId + type + timestamp if no ID
                  return (
                    i.residentId === interview.residentId &&
                    i.type === interview.type &&
                    (!i.timestamp ||
                      !interview.timestamp ||
                      i.timestamp === interview.timestamp)
                  );
                })
            )
          : [];

        // IMPORTANT: Preserve observations when saving drafts
        const currentObservations = [
          ...(surveyData?.initialPoolProcess?.observations || []),
        ];

        // Merge all observations - prioritize current local, then submitted
        const allObservationsToPreserve = [
          ...currentObservations,
          ...submittedObservations,
        ];

        // Remove duplicates from observations (keep first occurrence)
        // Ensure allObservationsToPreserve is an array before filtering
        const uniqueCurrentObservations = Array.isArray(allObservationsToPreserve)
          ? allObservationsToPreserve.filter(
              (observation, index, self) =>
                Array.isArray(self) && index ===
                self.findIndex((obs) => {
                  // Match by ID if both have IDs
                  if (obs.id && observation.id) {
                    return obs.id === observation.id;
                  }
                  // Match by residentId + timestamp if no ID
                  return (
                    obs.residentId === observation.residentId &&
                    (!obs.timestamp ||
                      !observation.timestamp ||
                      obs.timestamp === observation.timestamp)
                  );
                })
            )
          : [];

        // IMPORTANT: Preserve observation checklist responses when saving drafts
        // Merge local responses with submitted responses (prioritize local for unsaved changes)
        const currentChecklistResponses = observationChecklistResponses || {};

        // Merge: prioritize local (unsaved changes), then submitted (saved data)
        const mergedChecklistResponses = {
          ...submittedChecklistResponsesObj, // Start with submitted (saved data)
          ...currentChecklistResponses, // Override with local (unsaved changes take priority)
        };

        // Update residents array with merged nested data
        // Merge response residents with existing residents by ID
        const existingResidents = surveyData?.initialPoolProcess?.residents || [];
        const residentsMap = new Map();

        // Start with existing residents
        existingResidents.forEach((resident) => {
          residentsMap.set(String(resident.id), { ...resident });
        });

        // Merge response residents (update nested data)
        responseResidents.forEach((resident) => {
          const existingResident = residentsMap.get(String(resident.id));
          if (existingResident) {
            // Merge nested data from response
            residentsMap.set(String(resident.id), {
              ...existingResident,
              residentInterviews: resident.residentInterviews || [],
              observations: resident.observations || [],
              observationChecklistResponses: resident.observationChecklistResponses || {},
            });
          } else {
            // New resident from response
            residentsMap.set(String(resident.id), {
              ...resident,
              residentInterviews: resident.residentInterviews || [],
              observations: resident.observations || [],
              observationChecklistResponses: resident.observationChecklistResponses || {},
            });
          }
        });

        const updatedResidents = Array.from(residentsMap.values());

        // CRITICAL: Don't use handleSurveyDataChange here as it marks form as dirty
        // Instead, update surveyData directly via receiveServerData to avoid dirty state

        // Prepare updated task statuses for optimistic update
        const updatedTaskStatuses = {
          ...(surveyData?.initialPoolProcess?.taskStatuses || {}),
        };
        if (!isDraft) {
          updatedTaskStatuses[currentUser._id] = "pending_review";
        }

        const updatedSurveyData = {
          ...surveyData,
          initialPoolProcess: {
            ...surveyData.initialPoolProcess,
            // Update residents array with merged nested data
            residents: updatedResidents,
            // Preserve ALL residentInterviews - don't clear them (for backward compatibility)
            residentInterviews: uniqueCurrentInterviews,
            // Preserve ALL observations - don't clear them (for backward compatibility)
            observations: uniqueCurrentObservations,
            // Preserve observation checklist responses - don't clear them (for backward compatibility)
            observationChecklistResponses: mergedChecklistResponses,
            // Optimistically update task statuses
            taskStatuses: updatedTaskStatuses,
          },
          residentInterviews: uniqueCurrentInterviews,
        };

        // Use receiveServerData to update without marking as dirty
        if (receiveServerData) {
          receiveServerData(updatedSurveyData);
        } else if (handleSurveyDataChange) {
          // Fallback if receiveServerData is not available
          handleSurveyDataChange(
            "initialPoolProcess",
            updatedSurveyData.initialPoolProcess
          );
          handleSurveyDataChange(
            "residentInterviews",
            updatedSurveyData.residentInterviews
          );
        }

        // Update task status locally if this is a final submission
        if (!isDraft) {
          setTaskStatuses((prev) => ({
            ...prev,
            [currentUser._id]: "pending_review",
          }));

          // Set flag to prevent reverting status from stale server data
          justSubmittedRef.current = true;
          setTimeout(() => {
            justSubmittedRef.current = false;
          }, 10000); // 10 seconds grace period

          toast.success(
            isContinueClicked
              ? "Work submitted for review!"
              : "Submitted for review successfully!",
            {
              position: "top-right",
              duration: 3000,
            }
          );
        } else {
          // Update last save time for drafts (manual saves only)
          setLastSave(new Date());

          // Show message to team member that draft is saved (only for manual saves)
          if (isManualSave) {
            toast.success("Draft saved successfully!", {
              position: "top-right",
              duration: 4000,
              description:
                "Your work is saved as a draft. Team leads will not review it until you submit for review.",
            });
          }
        }

        // Clear localStorage after successful save/submit since data is now in backend
        // This prevents stale dirty state from persisting after save
        if (markAsSaved) {
          markAsSaved();
        }

        setHasUnsavedChanges(false);

        // Clear local buffer dirty flags (Local Buffer Strategy)
        setUnsavedChanges({});
        // Fetch fresh data to sync with server
        fetchSavedInitialPool();

        // CRITICAL: Clear editing flags after successful save/submit
        // User's work is now saved, so it's safe to receive updates
        editingResidentsRef.current.clear();
        isEditingRef.current = false;
        isMakingLocalEditRef.current = false;

        // Emit join_view_survey_wizard removed as per request


        if (!isDraft) {
          setIsSubmitting(false);
        } else {
          setIsAutoSaving(false);
        }
      } else {
        // Handle error response
        const errorMessage =
          response?.message ||
          "Failed to submit work. Please try again.";
        toast.error(errorMessage, {
          position: "top-right",
        });

        if (!isDraft) {
          setIsSubmitting(false);
        } else {
          setIsAutoSaving(false);
        }
      }
    } catch (error) {
      // Extract error message from API response
      const errorMessage = error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        "An error occurred while submitting. Please try again.";
      toast.error(errorMessage, {
        position: "top-right",
      });
      if (!isDraft) {
        setIsSubmitting(false);
      } else {
        setIsAutoSaving(false);
      }
    }
  };

  // Function to submit initial pool process step (for team leads)
  const handleInitialPoolProcessSubmit = async (isContinueClicked = false, residentsOverride = null) => {
    const surveyId = localStorage.getItem("currentSurveyId");

    if (!surveyId) {
      toast.error("Survey ID not found. Please start from the beginning.", {
        position: "top-right",
      });
      return;
    }

    // Route team members to separate submission function
    if (isInvitedUser()) {
      return handleTeamMemberWorkSubmit(isContinueClicked, !isContinueClicked);
    }

    // Use residentsOverride if provided (from bulk assignment), otherwise use state
    const residentsSource = residentsOverride || surveyData?.initialPoolProcess?.residents;

    // Basic validation - ensure we have residents in the pool
    const hasResidents = residentsSource && residentsSource.length > 0;
    const includedResidents = residentsSource?.filter((r) => r.included) || [];

    if (!hasResidents) {
      isContinueClicked &&
        toast.warning(
          "Please generate or add residents to the pool before proceeding.",
          { position: "top-right" }
        );
      return;
    }

    if (includedResidents.length === 0) {
      isContinueClicked &&
        toast.warning(
          "Please include at least one resident in the survey pool before proceeding.",
          { position: "top-right" }
        );
      return;
    }

    setIsSubmitting(true);
    isContinueClicked &&
      toast.loading("Saving initial pool process data...", {
        position: "top-right",
      });

    try {
      // Clean up observations to match validation schema
      const cleanedObservations = (
        surveyData?.initialPoolProcess?.observations || []
      ).map((obs) => {
        let dateTime = new Date().toISOString();
        if (obs.dateTime || obs.timestamp) {
          try {
            const parsedDate = new Date(obs.dateTime || obs.timestamp);
            if (!isNaN(parsedDate.getTime())) {
              dateTime = parsedDate.toISOString();
            }
          } catch (error) { }
        }

        return {
          residentId: obs.residentId,
          observationType: obs.observationType || "general",
          notes: obs.notes || obs.description || "",
          dateTime: dateTime,
          location: obs.location || "",
          description: obs.description || "",
          residentName: obs.residentName || "",
          id: obs.id || "",
          timestamp: obs.timestamp || "",
          createdAt: obs.createdAt || "",
        };
      });

      // Collect interview responses from radio buttons
      const collectedResponses = collectInterviewResponses();

      // Clean up resident interviews to match validation schema and merge with collected responses
      const interviewMap = new Map();

      const flatInterviews =
        surveyData?.residentInterviews ||
        surveyData?.initialPoolProcess?.residentInterviews ||
        [];

      const nestedInterviews = [];
      (residentsSource || []).forEach((resident) => {
        if (resident.residentInterviews && Array.isArray(resident.residentInterviews)) {
          nestedInterviews.push(...resident.residentInterviews);
        }
      });

      const allInterviews = [...flatInterviews, ...nestedInterviews];

      allInterviews.forEach((interview, index) => {
        let interviewDate = new Date().toISOString();
        if (interview.interviewDate || interview.date) {
          try {
            const parsedDate = new Date(
              interview.interviewDate || interview.date
            );
            if (!isNaN(parsedDate.getTime())) {
              interviewDate = parsedDate.toISOString();
            }
          } catch (error) { }
        }

        const residentId = interview.residentId;
        if (residentId) {
          const mergedResponses = {
            ...(interview.responses || {}),
            ...(collectedResponses[residentId] || {}),
          };

          const processedInterview = {
            residentId: residentId,
            residentName: interview.residentName,
            responses: mergedResponses,
            interviewDate: interviewDate,
            areas: interview.areas || [],
            type: interview.type || "",
            email: interview.email || "",
            notes: interview.notes || "",
            id: interview.id || `interview_${Date.now()}_${index}`,
            status: interview.status || "",
            timestamp: interview.timestamp || "",
            date: interview.date || "",
          };

          interviewMap.set(residentId, processedInterview);
        }
      });

      Object.entries(collectedResponses).forEach(([residentId, responses]) => {
        if (!interviewMap.has(residentId)) {
          const resident = residentsSource?.find(
            (r) => r.id === residentId
          );
          if (resident) {
            interviewMap.set(residentId, {
              residentId: residentId,
              residentName: resident.name,
              responses: responses,
              interviewDate: new Date().toISOString(),
              areas: resident.interviewAreas || [],
              type: "",
              email: "",
              notes: "",
              id: "",
              status: "",
              timestamp: "",
              date: "",
            });
          }
        }
      });

      const cleanedInterviews = Array.from(interviewMap.values());

      // Prepare residents with required id field
      // Use residentsSource which may be from override or state
      const cleanedResidents = (
        residentsSource || []
      ).map((resident, index) => {
        const residentId = resident.id;
        return {
          id: residentId,
          name: resident.name,
          room: resident.room || "",
          admissionDate: resident.admissionDate || "",
          status: resident.status || "",
          risks: resident.risks || (resident.patientNeeds || []).map(name => ({ name })),
          selectionReason: resident.selectionReason || "",
          included: resident.included !== undefined ? resident.included : true,
          diagnosis: resident.diagnosis || "",
          specialTypes: resident.specialTypes || [],
          isNewAdmission: resident.isNewAdmission || false,
          fiFlagged: resident.fiFlagged || false,
          ijHarm: resident.ijHarm || false,
          canBeInterviewed:
            resident.canBeInterviewed !== undefined
              ? resident.canBeInterviewed
              : true,
          interviewAreas: resident.interviewAreas || [],
          reviewAreas: resident.reviewAreas || [],
          notes: resident.notes || "",
          surveyorNotes: resident.surveyorNotes || "",
          assignedTeamMemberId: extractTeamMemberUserId(resident.assignedTeamMemberId) || extractTeamMemberUserId(resident.teamMemberUserId) || null,
          teamMemberUserId: extractTeamMemberUserId(resident.teamMemberUserId) || extractTeamMemberUserId(resident.assignedTeamMemberId) || null,
          scheduleInterviewType: resident.scheduleInterviewType || "",
          scheduleInterviewEmail: resident.scheduleInterviewEmail || "",
          scheduleInterviewDateTime: resident.scheduleInterviewDateTime || "",
          scheduleInterviewNotes: resident.scheduleInterviewNotes || "",
          scheduleObservationArea: resident.scheduleObservationArea || "",
          scheduleObservationDescription: resident.scheduleObservationDescription || "",
          scheduleObservationDateTime: resident.scheduleObservationDateTime || "",
        };
      });

      // Build resident-centric payload
      const allInterviewsForPayload = cleanedInterviews;
      const allObservationsForPayload = cleanedObservations;
      const allChecklistResponsesForPayload = (() => {
        const componentStateResponses = observationChecklistResponses || {};
        const surveyDataResponses = surveyData.initialPoolProcess?.observationChecklistResponses || {};
        const residentsArrayResponses = {};
        (cleanedResidents || surveyData?.initialPoolProcess?.residents || []).forEach((resident) => {
          if (resident && resident.id && resident.observationChecklistResponses) {
            const residentId = String(resident.id);
            residentsArrayResponses[residentId] = resident.observationChecklistResponses;
          }
        });

        const mergedResponses = {};
        Object.keys(surveyDataResponses).forEach((residentId) => {
          mergedResponses[residentId] = surveyDataResponses[residentId];
        });
        Object.keys(residentsArrayResponses).forEach((residentId) => {
          mergedResponses[residentId] = {
            ...mergedResponses[residentId],
            ...residentsArrayResponses[residentId],
          };
        });
        Object.keys(componentStateResponses).forEach((residentId) => {
          mergedResponses[residentId] = {
            ...mergedResponses[residentId],
            ...componentStateResponses[residentId],
          };
        });

        return formatObservationChecklistResponsesForSubmission(mergedResponses);
      })();

      const residentsPayloadForTeamLead = buildResidentsPayload(
        cleanedResidents,
        allInterviewsForPayload,
        allObservationsForPayload,
        allChecklistResponsesForPayload,
        [],
        false
      );

      // Map to API payload structure
      const interviewQuestionsMap = {
        "rights_respected": {
          title: "Resident Rights (F550-F559)",
          question: "Do you feel your rights as a resident are respected here?"
        },
        "daily_choices": {
          title: "Resident Rights (F550-F559)",
          question: "Are you able to make choices about your daily activities?"
        },
        "staff_respect": {
          title: "Resident Rights (F550-F559)",
          question: "Do staff members treat you with dignity and respect?"
        },
        "care_decisions": {
          title: "Resident Rights (F550-F559)",
          question: "Are you able to participate in decisions about your care?"
        },
        "care_satisfaction": {
          title: "Resident Satisfaction:",
          question: "Are you satisfied with the care you receive here?"
        },
        "recommend_facility": {
          title: "Resident Satisfaction:",
          question: "Would you recommend this facility to others?"
        },
        "safe_secure": {
          title: "Resident Satisfaction:",
          question: "Do you feel safe and secure living here?"
        },
        "needs_met": {
          title: "Resident Satisfaction:",
          question: "Are your needs being met by the staff?"
        },
        "maintain_dignity": {
          title: "Quality of Life (F552-F555)",
          question: "Do you feel you can maintain your dignity here?"
        },
        "daily_routine_choices": {
          title: "Quality of Life (F552-F555)",
          question: "Are you able to make choices about your daily routine?"
        },
        "privacy_respected": {
          title: "Quality of Life (F552-F555)",
          question: "Do you feel your privacy is respected?"
        },
        "needs_accommodated": {
          title: "Quality of Life (F552-F555)",
          question: "Are your individual needs and preferences accommodated?"
        }
      };

      const apiResidents = residentsPayloadForTeamLead.map(r => {
        // Map interviews
        const interviews = [];
        // Check residentInterviews (which contains responses object)
        if (r.residentInterviews && r.residentInterviews.length > 0) {
          r.residentInterviews.forEach(interview => {
            if (interview.responses) {
              Object.entries(interview.responses).forEach(([key, value]) => {
                const questionInfo = interviewQuestionsMap[key];
                if (questionInfo) {
                  interviews.push({
                    title: questionInfo.title,
                    question: questionInfo.question,
                    answer: value ? (value.charAt(0).toUpperCase() + value.slice(1)) : ""
                  });
                }
              });
            }
          });
        }

        // Map observations
        const observations = [];
        if (r.observationChecklistResponses) {
          Object.entries(r.observationChecklistResponses).forEach(([itemId, value]) => {
            const item = observationChecklist.find(i => i.id === itemId);
            if (item) {
              observations.push({
                title: item.tag,
                question: `${item.title} ${item.description}`,
                answer: value ? (value.charAt(0).toUpperCase() + value.slice(1)) : ""
              });
            }
          });
        }

        return {
          generatedId: r.generatedId || r.id,
          name: r.name,
          room: r.room,
          admissionDate: r.admissionDate,
          isNewAdmission: r.isNewAdmission,
          pressureUlcers: r.pressureUlcers || null,
          risks: r.risks || [],
          qualityMeasureCount: r.qualityMeasureCount || 0,
          ...(() => {
            const teamMemberId = extractTeamMemberUserId(r.teamMemberUserId) || extractTeamMemberUserId(r.assignedTeamMemberId);
            return teamMemberId ? { teamMemberUserId: teamMemberId } : {};
          })(),
          included: r.included !== undefined ? r.included : true,
          scheduleInterviewType: r.scheduleInterviewType || "",
          scheduleInterviewEmail: r.scheduleInterviewEmail || "",
          scheduleInterviewDateTime: r.scheduleInterviewDateTime || "",
          scheduleInterviewNotes: r.scheduleInterviewNotes || "",
          interviews: interviews,
          scheduleObservationArea: r.scheduleObservationArea || "",
          scheduleObservationDescription: r.scheduleObservationDescription || "",
          scheduleObservationDateTime: r.scheduleObservationDateTime || "",
          observations: observations,
          notes: r.notes || ""
        };
      });

      const payload = {
        surveyId: surveyId,
        status: "initial-pool-process",
        residents: apiResidents
      };

      // 1. Save to IndexedDB first (Offline-First)
      try {
        await saveSurveyStepData(surveyId, 4, {
          residents: apiResidents,
          lastUpdated: new Date().toISOString()
        });

      } catch (dbError) {

        // Continue to API attempt even if DB save fails
      }

      // 2. Check online status
      if (!navigator.onLine) {
        // Offline: Queue for sync
        await surveyIndexedDB.addToSyncQueue(
          surveyId,
          `initial_pool_submission_${Date.now()}`,
          payload,
          'api_initial_pool_submission'
        );

        toast.dismiss();
        toast.success("Saved offline. Will sync when online.", {
          position: "top-right",
          duration: 5000,
        });

        setHasUnsavedChanges(false);
        setIsSubmitting(false);

        // Clear local buffer dirty flags
        setUnsavedChanges({});
        editingResidentsRef.current.clear();
        isEditingRef.current = false;
        isMakingLocalEditRef.current = false;
        return;
      }

      // Call API
      const response = await api.survey.submitInitialPool(payload);

      if (response.success || response.status === true || response.statusCode === 200) {
        toast.dismiss();

        // Update local state if needed
        if (response.data) {
          // Handle response data if necessary
        }

        if (isContinueClicked) {
          toast.success("Initial pool process data saved successfully!", {
            position: "top-right",
          });
          setHasUnsavedChanges(false);
          setCurrentStep(5);
          setIsContinueClicked(false);
        } else {
          toast.success("Progress saved successfully!", {
            position: "top-right",
            duration: 3000,
          });
          setHasUnsavedChanges(false);
        }

        // Clear local buffer dirty flags (Local Buffer Strategy)
        setUnsavedChanges({});
        // Fetch fresh data to sync with server
        fetchSavedInitialPool();

        setIsSubmitting(false);
        editingResidentsRef.current.clear();
        isEditingRef.current = false;
        isMakingLocalEditRef.current = false;
      } else {
        throw new Error(response.message || "Failed to save initial pool process data");
      }

    } catch (error) {


      // Handle offline scenario (API failure)
      if (!navigator.onLine || error.message.includes("Network error") || error.message.includes("Failed to fetch")) {
        // Construct offline payload (same as API payload)
        const offlinePayload = {
          surveyId: surveyId,
          status: "initial-pool-process",
          residents: residentsPayloadForTeamLead // Save full resident data for offline sync to work properly with UI
        };

        // Queue for sync
        await surveyIndexedDB.addToSyncQueue(
          surveyId,
          `initial_pool_submission_${Date.now()}`,
          offlinePayload,
          'api_initial_pool_submission'
        );

        toast.dismiss();
        toast.success("Internet connectivity issues detected. Data saved offline and will sync when connection is restored.", {
          position: "top-right",
          duration: 5000,
        });

        setHasUnsavedChanges(false);
        setIsSubmitting(false);

        // Trigger background sync
        surveySyncService.syncUnsyncedData();

        // Clear local buffer dirty flags
        setUnsavedChanges({});
        editingResidentsRef.current.clear();
        isEditingRef.current = false;
        isMakingLocalEditRef.current = false;
        return;
      }

      toast.dismiss();
      // Extract error message from API response
      const errorMessage = error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        "Failed to save initial pool process data. Please try again.";
      toast.error(errorMessage, { position: "top-right" });
      setIsSubmitting(false);
    }
  };

  const saveOfflineData = async (socketMessage) => {
    try {
      const offlineData = {
        ...socketMessage,
        submittedAt: new Date().toISOString(),
      };

      // Step 1: Save to IndexedDB sync queue (permanent storage)
      let syncQueueId = null;
      if (socketMessage.surveyId) {
        const stepId = socketMessage.currentStep || "initial-pool-process";
        const syncItem = await surveyIndexedDB.addToSyncQueue(
          socketMessage.surveyId,
          stepId,
          offlineData,
          "initial_pool_submission" // type for initial pool submissions
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
        surveySyncService.syncUnsyncedData(socketMessage.surveyId).catch(
          (error) => {
            // Sync failed, but data is saved offline - this is expected if still offline
            // console.log("Sync attempt failed, data saved offline:", error);
          }
        );
      }
    } catch (error) {

      // Still try to save to Zustand even if IndexedDB fails
      useSurveyStore.getState().setOfflineData({
        ...socketMessage,
        submittedAt: new Date().toISOString(),
      });
    }
  };

  // Function to get existing interview responses for a resident
  const getExistingResponses = (residentId) => {
    // Ensure residentInterviews is always an array - check both locations
    const currentInterviews =
      surveyData?.residentInterviews ||
      surveyData?.initialPoolProcess?.residentInterviews ||
      [];

    // Get resident info for matching
    const resident = surveyData.initialPoolProcess?.residents?.find(
      (r) => r.id === residentId
    );

    // Helper function to match interviews
    const matchesInterview = (interview) => {
      const idMatch = interview.residentId === residentId;
      const nameMatch =
        interview.residentName &&
        resident?.name &&
        interview.residentName.toLowerCase().trim() ===
        resident.name.toLowerCase().trim();
      return idMatch || nameMatch;
    };

    // Extract interviews from residents array (new resident-centric structure)
    const teamMemberInterviews = [];
    const currentUser = JSON.parse(
      localStorage.getItem("mocksurvey_user") || "{}"
    );
    const assignedResidentIds = getCurrentUserAssignedResidents();

    // Extract interviews from residents array
    (surveyData?.initialPoolProcess?.residents || []).forEach((resident) => {
      // Include all interviews found in the residents array
      // Do not filter by assignedResidentIds to ensure we find the interview if it exists
      if (
        resident.residentInterviews &&
        Array.isArray(resident.residentInterviews)
      ) {
        teamMemberInterviews.push(...resident.residentInterviews);
      }
    });

    // Combine all interviews from all sources
    // Prioritize team member interviews (more recent) over main interviews
    const allInterviews = [...teamMemberInterviews, ...currentInterviews];

    // Find matching interview - prioritize team member interviews (first in array)
    const interview = allInterviews.find(matchesInterview);

    // Start with existing responses from internal structure
    let responses = { ...(interview?.responses || {}) };

    // Merge with responses from API structure (resident.interviews)
    // This handles the case where data comes from the server in the flattened format
    if (resident && resident.interviews && Array.isArray(resident.interviews) && resident.interviews.length > 0) {
      resident.interviews.forEach(apiInterview => {
        // Find the question ID for this text
        for (const section of interviewSections) {
          const question = section.questions.find(q => q.text === apiInterview.question);
          if (question) {
            const id = question.id;
            // Only overwrite if not already present (local changes take precedence)
            if (!responses[id] && apiInterview.answer) {
              responses[id] = apiInterview.answer.toLowerCase();
            }
            break;
          }
        }
      });
    }

    return responses;
  };

  // Function to check if a resident has a scheduled interview (with type)
  const hasInterview = (residentId) => {
    // Ensure residentInterviews is always an array - check both locations
    const currentInterviews =
      surveyData?.residentInterviews ||
      surveyData?.initialPoolProcess?.residentInterviews ||
      [];

    // Extract interviews from residents array (new resident-centric structure)
    const teamMemberInterviews = [];
    const assignedResidentIds = getCurrentUserAssignedResidents();
    const currentUser = JSON.parse(
      localStorage.getItem("mocksurvey_user") || "{}"
    );

    // Extract interviews from residents array
    (surveyData?.initialPoolProcess?.residents || []).forEach((resident) => {
      // Include all interviews found in the residents array
      // Do not filter by assignedResidentIds to ensure we find the interview if it exists
      if (
        resident.residentInterviews &&
        Array.isArray(resident.residentInterviews)
      ) {
        teamMemberInterviews.push(...resident.residentInterviews);
      }
    });

    // Extract interviews from teamMemberPayload (for team members' unsaved interviews)
    const teamMemberPayloadInterviews = [];
    if (isInvitedUser()) {
      const teamMemberPayload = surveyData?.initialPoolProcess?.teamMemberPayload || [];
      const currentUserSubmission = teamMemberPayload.find(
        submission =>
          submission.teamMemberId === currentUser._id ||
          submission.teamMemberId?.toString() === currentUser._id?.toString() ||
          submission.teamMemberEmail === currentUser.email
      );
      if (currentUserSubmission && currentUserSubmission.residentInterviews) {
        teamMemberPayloadInterviews.push(...currentUserSubmission.residentInterviews);
      }
    } else {
      // For team leads, show all team member interviews from payload
      const teamMemberPayload = surveyData?.initialPoolProcess?.teamMemberPayload || [];
      teamMemberPayload.forEach((submission) => {
        if (submission.residentInterviews && Array.isArray(submission.residentInterviews)) {
          teamMemberPayloadInterviews.push(...submission.residentInterviews);
        }
      });
    }

    // Combine all interviews from all sources
    const allInterviews = [...currentInterviews, ...teamMemberInterviews, ...teamMemberPayloadInterviews];

    // Get the resident name for name-based matching
    const resident = surveyData.initialPoolProcess?.residents?.find(
      (r) => r.id === residentId
    );

    // Check if resident has scheduleInterviewType directly (from API)
    if (resident?.scheduleInterviewType) {
      return true;
    }

    const hasInterview = allInterviews.some((interview) => {
      // Primary match: by residentId
      const idMatch = interview.residentId === residentId && !!interview.type;

      // Fallback match: by resident name (case-insensitive)
      const nameMatch =
        interview.residentName &&
        resident?.name &&
        interview.residentName.toLowerCase().trim() ===
        resident.name.toLowerCase().trim() &&
        !!interview.type;

      const matches = idMatch || nameMatch;

      return matches;
    });

    return hasInterview;
  };

  // Function to check if a resident has interview responses (for radio button population)
  const hasInterviewResponses = (residentId) => {
    // Ensure residentInterviews is always an array - check both locations
    const currentInterviews =
      surveyData?.residentInterviews ||
      surveyData?.initialPoolProcess?.residentInterviews ||
      [];

    // Extract interviews from residents array (new resident-centric structure)
    const teamMemberInterviews = [];
    const assignedResidentIds = getCurrentUserAssignedResidents();

    // Extract interviews from residents array
    (surveyData?.initialPoolProcess?.residents || []).forEach((resident) => {
      // Include all interviews found in the residents array
      // Do not filter by assignedResidentIds to ensure we find the interview if it exists
      if (
        resident.residentInterviews &&
        Array.isArray(resident.residentInterviews)
      ) {
        teamMemberInterviews.push(...resident.residentInterviews);
      }
    });

    // Combine all interviews from both sources
    const allInterviews = [...currentInterviews, ...teamMemberInterviews];

    // Get the resident name for name-based matching
    const resident = surveyData.initialPoolProcess?.residents?.find(
      (r) => r.id === residentId
    );

    // Check API structure first
    if (resident && resident.interviews && Array.isArray(resident.interviews) && resident.interviews.length > 0) {
      return true;
    }

    const hasResponses = allInterviews.some((interview) => {
      // Primary match: by residentId
      const idMatch = interview.residentId === residentId;

      // Fallback match: by resident name (case-insensitive)
      const nameMatch =
        interview.residentName &&
        resident?.name &&
        interview.residentName.toLowerCase().trim() ===
        resident.name.toLowerCase().trim();

      const matches = idMatch || nameMatch;

      // Consider responses to exist if there are actual responses
      const hasResponses =
        matches &&
        interview.responses &&
        Object.keys(interview.responses).length > 0;

      return hasResponses;
    });

    return hasResponses;
  };

  // Function to handle radio button changes
  const handleRadioChange = (residentId, questionKey, value) => {
    setHasUnsavedChanges(true);

    // Mark resident as dirty in Local Buffer
    if (residentId) {
      setUnsavedChanges(prev => ({
        ...prev,
        [String(residentId)]: true
      }));
    }

    // CRITICAL: Mark that user is editing this resident
    // This protects unfinished changes from being overridden by server data
    if (residentId) {
      editingResidentsRef.current.add(String(residentId));
      isEditingRef.current = true;
      isMakingLocalEditRef.current = true;
    }

    // Ensure residentInterviews is always an array - check both locations
    const currentInterviews =
      surveyData?.residentInterviews ||
      surveyData?.initialPoolProcess?.residentInterviews ||
      [];

    // Find interview in residents array (resident-centric structure)
    const currentResidents = surveyData?.initialPoolProcess?.residents || [];
    const resident = currentResidents.find((r) => String(r.id) === String(residentId));

    if (!resident) {
      return; // Resident not found
    }

    // Helper function to match interviews
    const matchesInterview = (interview) => {
      const idMatch = interview.residentId === residentId;
      const nameMatch =
        interview.residentName &&
        resident?.name &&
        interview.residentName.toLowerCase().trim() ===
        resident.name.toLowerCase().trim();
      return idMatch || nameMatch;
    };

    // Get existing responses for this resident to preserve them
    const existingResponses = getExistingResponses(residentId);

    // Find the interview in the resident's nested residentInterviews array
    const residentInterview = (resident.residentInterviews || []).find(matchesInterview);
    const mainInterview = currentInterviews.find(matchesInterview);

    // Update interview in residents array (resident-centric structure)
    // Works for both team members and team leads
    const updatedResidents = updateResidentNestedData(
      currentResidents,
      residentId,
      (resident) => {
        let updatedInterviews = (resident.residentInterviews || []).map((interview) => {
          if (matchesInterview(interview)) {
            return {
              ...interview,
              responses: {
                ...(interview.responses || {}),
                [questionKey]: value,
              },
            };
          }
          return interview;
        });

        // If interview doesn't exist in resident's array but exists in main, add it
        if (!residentInterview && mainInterview) {
          updatedInterviews.push({
            ...mainInterview,
            responses: {
              ...(mainInterview.responses || {}),
              [questionKey]: value,
            },
          });
        }

        // If interview doesn't exist at all, create a new one with the response
        // This handles the case where team members answer questions for interviews that were just added
        if (!residentInterview && !mainInterview) {
          updatedInterviews.push({
            residentId: residentId,
            residentName: resident.name,
            responses: {
              [questionKey]: value,
            },
            type: "", // Will be set when interview is properly scheduled
            timestamp: new Date().toISOString(),
          });
        }

        return {
          ...resident,
          residentInterviews: updatedInterviews,
        };
      }
    );

    // Also update flat arrays for backward compatibility
    const updatedMainInterviews = currentInterviews.map((interview) => {
      if (matchesInterview(interview)) {
        return {
          ...interview,
          responses: {
            ...(interview.responses || {}),
            [questionKey]: value,
          },
        };
      }
      return interview;
    });

    // Update survey data with residents array (single source of truth)
    handleSurveyDataChange("initialPoolProcess", {
      ...surveyData.initialPoolProcess,
      residents: updatedResidents,
      // Keep flat arrays for backward compatibility
      residentInterviews: updatedMainInterviews,
    });
    handleSurveyDataChange("residentInterviews", updatedMainInterviews);

    // Clear isMakingLocalEditRef after edit is applied
    setTimeout(() => {
      isMakingLocalEditRef.current = false;
    }, 100);
  };

  // Function to collect interview responses from radio buttons
  const handleObservationChecklistChange = (residentId, itemId, value) => {
    if (!residentId || !itemId) return;

    setHasUnsavedChanges(true);

    // Mark resident as dirty in Local Buffer
    setUnsavedChanges(prev => ({
      ...prev,
      [String(residentId)]: true
    }));

    // CRITICAL: Mark that user is editing this resident
    editingResidentsRef.current.add(String(residentId));
    isEditingRef.current = true;
    isMakingLocalEditRef.current = true;

    setHasUnsavedChanges(true);

    // CRITICAL: Mark that user is editing this resident
    // This protects unfinished changes from being overridden by server data
    if (residentId) {
      editingResidentsRef.current.add(String(residentId));
      isEditingRef.current = true;
      isMakingLocalEditRef.current = true;
    }

    const normalizedResidentId = String(residentId);
    const normalizedItemId = String(itemId);

    setObservationChecklistResponses((prev) => {
      const updatedResidentResponses = {
        ...(prev[normalizedResidentId] || {}),
        [normalizedItemId]: value,
      };

      const updatedResponses = {
        ...prev,
        [normalizedResidentId]: updatedResidentResponses,
      };

      // Don't call handleSurveyDataChange here - it will be synced via useEffect
      return updatedResponses;
    });
  };

  // Sync observationChecklistResponses to parent component
  // Use ref to track previous value and prevent unnecessary updates
  const previousObservationResponsesRef = useRef(observationChecklistResponses);
  const isSyncingObservationRef = useRef(false);

  useEffect(() => {
    // Prevent concurrent updates
    if (isSyncingObservationRef.current) {
      return;
    }

    // Skip if nothing changed
    const currentStr = JSON.stringify(observationChecklistResponses);
    const previousStr = JSON.stringify(previousObservationResponsesRef.current);
    if (currentStr === previousStr) {
      return;
    }

    // Update ref before processing
    previousObservationResponsesRef.current = observationChecklistResponses;
    isSyncingObservationRef.current = true;

    // Use setTimeout to ensure this runs after render completes
    const timeoutId = setTimeout(() => {
      try {
        // Update residents array with observation checklist responses
        const currentResidents = surveyData?.initialPoolProcess?.residents || [];
        const updatedResidents = currentResidents.map((resident) => {
          const residentId = String(resident.id);
          const residentResponses = observationChecklistResponses[residentId] || {};

          // Only update if there are responses for this resident
          if (Object.keys(residentResponses).length > 0 || observationChecklistResponses[residentId] !== undefined) {
            return {
              ...resident,
              observationChecklistResponses: residentResponses,
            };
          }
          return resident;
        });

        const updatedInitialPoolProcess = {
          ...(surveyData?.initialPoolProcess || {}),
          observationChecklistResponses: observationChecklistResponses,
          residents: updatedResidents, // Also update residents array
        };
        handleSurveyDataChange("initialPoolProcess", updatedInitialPoolProcess);
      } finally {
        isSyncingObservationRef.current = false;
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      isSyncingObservationRef.current = false;
    };
  }, [
    observationChecklistResponses,
    surveyData?.initialPoolProcess,
    handleSurveyDataChange,
  ]);

  const removeObservationById = (observationId) => {
    if (!observationId) return;

    const currentObservations =
      surveyData?.initialPoolProcess?.observations || [];
    const currentResidents = surveyData?.initialPoolProcess?.residents || [];
    const teamMemberPayload =
      surveyData?.initialPoolProcess?.teamMemberPayload || [];

    // Find the observation being deleted to get its residentId
    // Check all sources to ensure we find it
    let observationToDelete = currentObservations.find(
      (o) => o.id === observationId
    );
    let source = "main";

    if (!observationToDelete) {
      // Check residents
      for (const r of currentResidents) {
        if (r.observations) {
          const found = r.observations.find((o) => o.id === observationId);
          if (found) {
            observationToDelete = found;
            source = "resident";
            break;
          }
        }
      }
    }

    if (!observationToDelete) {
      // Check teamMemberPayload
      for (const submission of teamMemberPayload) {
        if (submission.observations) {
          const found = submission.observations.find(
            (o) => o.id === observationId
          );
          if (found) {
            observationToDelete = found;
            source = "teamMemberPayload";
            break;
          }
        }
      }
    }

    const deletedResidentId = observationToDelete?.residentId
      ? String(observationToDelete.residentId)
      : null;

    // CRITICAL: Mark that user is editing this resident
    // This protects unfinished changes from being overridden by server data
    if (deletedResidentId) {
      setUnsavedChanges(prev => ({
        ...prev,
        [deletedResidentId]: true
      }));
      editingResidentsRef.current.add(deletedResidentId);
      isEditingRef.current = true;
      isMakingLocalEditRef.current = true;
    }

    const updatedObservations = currentObservations.filter(
      (o) => o.id !== observationId
    );

    // Update residents array (resident-centric structure)
    const currentChecklistResponses =
      surveyData?.initialPoolProcess?.observationChecklistResponses || {};
    let updatedChecklistResponses = { ...currentChecklistResponses };

    const updatedResidents = updateResidentNestedData(
      currentResidents,
      deletedResidentId,
      (resident) => {
        const updatedResidentObservations = (resident.observations || []).filter(
          (o) => o.id !== observationId
        );

        // If resident has no observations left, remove their checklist responses
        let updatedResidentChecklist =
          resident.observationChecklistResponses || {};
        if (updatedResidentObservations.length === 0) {
          updatedResidentChecklist = {};
          if (deletedResidentId) {
            delete updatedChecklistResponses[deletedResidentId];
          }
        }

        return {
          ...resident,
          observations: updatedResidentObservations,
          observationChecklistResponses: updatedResidentChecklist,
        };
      }
    );

    // Update teamMemberPayload if needed
    let updatedTeamMemberPayload = teamMemberPayload;
    if (source === "teamMemberPayload") {
      updatedTeamMemberPayload = teamMemberPayload.map((submission) => {
        if (
          submission.observations &&
          submission.observations.some((o) => o.id === observationId)
        ) {
          return {
            ...submission,
            observations: submission.observations.filter(
              (o) => o.id !== observationId
            ),
          };
        }
        return submission;
      });
    }

    const updatedInitialPoolProcess = {
      ...(surveyData?.initialPoolProcess || {}),
      residents: updatedResidents,
      observations: updatedObservations,
      observationChecklistResponses: updatedChecklistResponses,
      teamMemberPayload: updatedTeamMemberPayload,
    };

    // Update state - this marks form as dirty and saves to localStorage
    handleSurveyDataChange("initialPoolProcess", updatedInitialPoolProcess);
    handleSurveyDataChange("observations", updatedObservations);

    // Also update local state to keep it in sync
    setObservationChecklistResponses(updatedChecklistResponses);

    // Clear isMakingLocalEditRef after edit is applied
    setTimeout(() => {
      isMakingLocalEditRef.current = false;
    }, 100);
  };

  const removeInterviewById = (interviewId) => {
    if (!interviewId) return;

    const currentInterviews =
      surveyData?.initialPoolProcess?.residentInterviews || [];
    const currentTopLevelInterviews = surveyData?.residentInterviews || [];
    const currentResidents = surveyData?.initialPoolProcess?.residents || [];
    const teamMemberPayload =
      surveyData?.initialPoolProcess?.teamMemberPayload || [];

    // Find the interview being deleted to get its residentId
    // Check all sources to ensure we find it
    let interviewToDelete =
      currentInterviews.find((i) => i.id === interviewId) ||
      currentTopLevelInterviews.find((i) => i.id === interviewId);
    let source = "main";

    if (!interviewToDelete) {
      // Check residents
      for (const r of currentResidents) {
        if (r.residentInterviews) {
          const found = r.residentInterviews.find((i) => i.id === interviewId);
          if (found) {
            interviewToDelete = found;
            source = "resident";
            break;
          }
        }
      }
    }

    if (!interviewToDelete) {
      // Check teamMemberPayload
      for (const submission of teamMemberPayload) {
        if (submission.residentInterviews) {
          const found = submission.residentInterviews.find(
            (i) => i.id === interviewId
          );
          if (found) {
            interviewToDelete = found;
            source = "teamMemberPayload";
            break;
          }
        }
      }
    }

    const deletedResidentId = interviewToDelete?.residentId
      ? String(interviewToDelete.residentId)
      : null;

    // CRITICAL: Mark that user is editing this resident
    // This protects unfinished changes from being overridden by server data
    if (deletedResidentId) {
      setUnsavedChanges(prev => ({
        ...prev,
        [deletedResidentId]: true
      }));
      editingResidentsRef.current.add(deletedResidentId);
      isEditingRef.current = true;
      isMakingLocalEditRef.current = true;
    }

    const updatedInterviews = currentInterviews.filter(
      (i) => i.id !== interviewId
    );
    const updatedTopLevelInterviews = currentTopLevelInterviews.filter(
      (i) => i.id !== interviewId
    );

    // Update residents array (resident-centric structure)
    const updatedResidents = updateResidentNestedData(
      currentResidents,
      deletedResidentId,
      (resident) => ({
        ...resident,
        residentInterviews: (resident.residentInterviews || []).filter(
          (i) => i.id !== interviewId
        ),
      })
    );

    // Update teamMemberPayload if needed
    let updatedTeamMemberPayload = teamMemberPayload;
    if (source === "teamMemberPayload") {
      updatedTeamMemberPayload = teamMemberPayload.map((submission) => {
        if (
          submission.residentInterviews &&
          submission.residentInterviews.some((i) => i.id === interviewId)
        ) {
          return {
            ...submission,
            residentInterviews: submission.residentInterviews.filter(
              (i) => i.id !== interviewId
            ),
          };
        }
        return submission;
      });
    }

    // Check if the resident still has any interviews after deletion
    if (deletedResidentId) {
      const residentStillHasInterviews = updatedInterviews.some(
        (interview) => String(interview.residentId) === deletedResidentId
      );

      if (!residentStillHasInterviews) {
        // Interviews removed for resident
      }
    }

    const updatedInitialPoolProcess = {
      ...(surveyData?.initialPoolProcess || {}),
      residents: updatedResidents,
      residentInterviews: updatedInterviews,
      teamMemberPayload: updatedTeamMemberPayload,
    };

    // Update state - this marks form as dirty and saves to localStorage
    handleSurveyDataChange("initialPoolProcess", updatedInitialPoolProcess);
    handleSurveyDataChange("residentInterviews", updatedTopLevelInterviews);
  };

  const collectInterviewResponses = () => {
    const responses = {};

    // Get all radio buttons with resident-specific names
    const radioButtons = document.querySelectorAll(
      'input[type="radio"]:checked'
    );

    // Get all known question IDs
    const knownQuestionIds = [];
    interviewSections.forEach(section => {
      section.questions.forEach(q => {
        knownQuestionIds.push(q.id);
      });
    });

    radioButtons.forEach((radio) => {
      const name = radio.name;
      const value = radio.value;

      // Try to match against known question IDs
      // Name format: `${question.id}_${resident.id}`
      const matchedQuestionId = knownQuestionIds.find(qId => name.startsWith(qId + '_'));

      if (matchedQuestionId) {
        const residentId = name.substring(matchedQuestionId.length + 1);

        if (residentId) {
          if (!responses[residentId]) {
            responses[residentId] = {};
          }
          responses[residentId][matchedQuestionId] = value;
        }
      } else {
        // Fallback to regex for legacy or unknown formats
        const residentIdMatch = name.match(/_([^_]+_[^_]+_[^_]+)$/);
        if (residentIdMatch) {
          const residentId = residentIdMatch[1];
          const questionKey = name
            .replace(`_${residentId}`, "")
            .replace("modal_", "");

          if (!responses[residentId]) {
            responses[residentId] = {};
          }

          responses[residentId][questionKey] = value;
        }
      }
    });

    return responses;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 sm:pb-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              {sectionData[3].title}
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm leading-tight">
              {sectionData[3].description}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end mt-4"></div>
        {isSurveyClosed && (
          <Badge
            variant="secondary"
            className="bg-red-100 text-red-800 border-red-300 mt-4"
          >
            <Lock className="w-3 h-3 mr-1" />
            Survey Closed
          </Badge>
        )}
      </div>

      {/* fetch initial pool visible to invited user only */}

      <div className="flex items-center justify-start">
           <Button 
             className="mb-4 bg-sky-800 text-white rounded-lg hover:bg-sky-700 cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4" 
             onClick={() => fetchSavedInitialPool(false)}
             disabled={isFetchingButton}
           >
            {isFetchingButton && (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isFetchingButton ? 'Syncing...' : 'Sync Resident Data'}
          </Button>
          </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Left Column - Pool Strategy & Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pool Strategy Setting */}
          {!isInvitedUser() && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                Pool Selection
              </h3>

              <div className="space-y-4">
                {/* Auto-Generation Info */}
                <div className="p-3 sm:p-4 bg-gray-10 border border-gray-200 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                    <div className="flex items-center space-x-2">
                      <Info className="w-4 h-4 text-gray-600" />
                      <span className="text-xs sm:text-sm font-medium text-gray-800">
                        Pool Selection Process
                      </span>
                    </div>
                    <Button
                      onClick={handleGenerateClick}
                      disabled={
                        isGenerating ||
                        isCheckingGeneration ||
                        isLoading ||
                        !currentSurveyId ||
                        isSurveyClosed
                      }
                      className="w-full sm:w-auto h-8 px-4 text-xs bg-[#075b7d] hover:bg-[#075b7d] text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                      title={
                        !currentSurveyId
                          ? "Survey ID required to generate sample"
                          : ""
                      }
                    >
                      {isCheckingGeneration ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                          Checking...
                        </>
                      ) : isGenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                          Generating...
                        </>
                      ) : isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                          Loading...
                        </>
                      ) : (
                        <>Generate</>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-700 mb-2">
                    Click "Generate" to create resident sample for your survey:
                  </p>

                  {/* Generation Status Display */}
                  {generationStatus && (
                    <div
                      className={`mt-3 p-2 rounded border text-xs ${generationStatus.includes("Error")
                        ? "bg-red-100 border-red-300 text-red-800"
                        : generationStatus.includes("successfully")
                          ? "bg-green-100 border-green-300 text-green-800"
                          : "bg-gray-100 border-gray-300 text-gray-800"
                        }`}
                    >
                      {generationStatus}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-4">                
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="poolStrategy"
                      value="briefScreen"
                      checked={surveyData.poolStrategy === "briefScreen"}
                      onChange={(e) => {
                        setHasUnsavedChanges(true);
                        handleSurveyDataChange("poolStrategy", e.target.value);
                      }}
                      disabled={isInvitedUser() || isSurveyClosed}
                      className="w-4 h-4 text-[#075b7d] border-gray-300 focus:ring-[#075b7d] mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-gray-900">
                      Resident Selection Guide
                    </span>
                  </label>
                </div>

                {surveyData.poolStrategy === "briefScreen" && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-800">
                        Resident Selection Guide
                      </span>
                    </div>

                    <div className="mt-2 text-xs text-gray-600">
                      <strong>Guidelines:</strong> Census 1-30: all residents
                      may be included. Census 31-70: about 20-25 residents
                      sampled. Census 71-100: about 30-35 residents sampled.
                      Census 101-200: about 35-40 residents sampled. Census
                      201-300: about 40-45 residents sampled. Census 301+: about
                      55-65 residents sampled.
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resident Interviews & Observations */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#075b7d]" />
                Resident Interviews & Observations
              </h3>
              {!isInvitedUser() && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-2">

                  <Button
                    onClick={() => setShowAddResidentModal(true)}
                    disabled={isSurveyClosed}
                    className="w-full sm:w-auto h-9 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Resident
                  </Button>
                </div>
              )}
            </div>

            {/* Resident Sample Status */}
            {!isInvitedUser() && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-10 border border-gray-200 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-gray-600" />
                    <span className="text-xs sm:text-sm font-medium text-gray-800">
                      Resident Sample
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-2">
                    <Badge
                      variant="outline"
                      className="text-xs border-gray-300 text-gray-700"
                    >
                      {isLoading
                        ? "Loading..."
                        : `${residents.length} residents loaded`}
                    </Badge>
                    {!isInvitedUser() && (
                      <Button
                        onClick={handleGenerateClick}
                        disabled={
                          isGenerating ||
                          isCheckingGeneration ||
                          isLoading ||
                          !currentSurveyId ||
                          isSurveyClosed
                        }
                        size="sm"
                        className="h-7 px-3 text-xs bg-[#075b7d] hover:bg-[#075b7d] text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                        title={
                          !currentSurveyId
                            ? "Survey ID required to generate sample"
                            : ""
                        }
                      >
                        {isCheckingGeneration ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                            Checking...
                          </>
                        ) : isGenerating ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Upload className="w-3 h-3 mr-1" />
                            Generate
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-700 mb-2">
                  Click Generate to create resident sample for your survey
                </p>
              </div>
            )}

            <div className="space-y-6">
              {/* Check if loading */}
              {isLoading ? (
                <div className="p-4 bg-gray-10 border border-gray-200 rounded-lg text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500">Loading residents...</p>
                  </div>
                </div>
              ) : residents.length === 0 ? (
                <div className="p-4 bg-gray-10 border border-gray-200 rounded-lg text-center">
                  <p className="text-gray-500 mb-3">
                    {isInvitedUser()
                      ? "No residents assigned to you yet."
                      : "No residents added to the pool yet."}
                  </p>
                  {!isInvitedUser() && !isSurveyClosed && (
                    <div className="flex items-center justify-center space-x-2">
                      <Button
                        onClick={() => setShowAddResidentModal(true)}
                        size="sm"
                        className="h-8 px-3 text-xs bg-[#075b7d] hover:bg-[#075b7d] text-white"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Resident
                      </Button>
                      <Button
                        onClick={() => setShowUploadResidentModal(true)}
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs border-[#075b7d] text-[#075b7d] hover:bg-[#075b7d]/10"
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Upload CSV
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Resident-specific Interviews & Observations */}
                  {residents.map((resident, residentIndex) => {

                    const hasPendingReview = (() => {
                      if (isInvitedUser()) return false; // Only show to team leads

                      // Check if resident has interviews or observations and if assigned team member has pending review status
                      const assignedTeamMemberId = resident.assignedTeamMemberId;
                      if (!assignedTeamMemberId) return false;

                      // Check task status from taskStatuses object
                      const taskStatus = surveyData?.initialPoolProcess?.taskStatuses?.[assignedTeamMemberId] ||
                        taskStatuses[assignedTeamMemberId];
                      const normalizedTaskStatus =
                        typeof taskStatus === "object"
                          ? taskStatus?.status || taskStatus
                          : taskStatus;
                      const isPendingReview =
                        normalizedTaskStatus === "pending_review" ||
                        normalizedTaskStatus === "done";

                      if (!isPendingReview) return false;

                      // Check if this resident has interviews or observations
                      const hasResidentInterviews = (resident.residentInterviews || []).length > 0 || !!resident.scheduleInterviewType;
                      const hasResidentObservations = (resident.observations || []).length > 0 || !!resident.scheduleObservationArea;

                      // Check for checklist responses
                      const residentChecklistResponses = resident.observationChecklistResponses || {};
                      const hasChecklistResponses = Object.keys(residentChecklistResponses).length > 0;

                      return hasResidentInterviews || hasResidentObservations || hasChecklistResponses;
                    })();

                    return (
                      <div
                        key={`resident-${resident.id}-${residentIndex}`}
                        className={`p-4 bg-gray-10 border rounded-lg ${hasPendingReview
                          ? "border-amber-300 bg-amber-50/20"
                          : "border-gray-200"
                          }`}
                      >
                        <div className="mb-4">
                          {/* Resident Name and ID */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900 text-base sm:text-lg break-words">
                                  {resident.name}
                                </h4>
                                {resident.isNewAdmission && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-blue-100 text-blue-800 border-blue-200 text-xs"
                                  >
                                    New Admission
                                  </Badge>
                                )}
                                {hasPendingReview && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-amber-300 text-amber-700 bg-amber-50 font-medium flex-shrink-0"
                                  >
                                    Submit by {resident.submissionDeadline}
                                  </Badge>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-500 mb-2">
                                <span className="flex items-center gap-1">
                                  <span className="font-medium text-gray-700">Room:</span> {resident.room || "N/A"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="font-medium text-gray-700">Admitted:</span> {resident.admissionDate || "N/A"}
                                </span>
                                {resident.assignedTeamMemberId && (
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium text-gray-700">Assigned:</span>
                                    <span className="text-[#075b7d] font-medium">
                                      {(() => {
                                        const member = effectiveTeamMembers.find(
                                          (m) =>
                                            String(
                                              (m.teamMemberUserId &&
                                                typeof m.teamMemberUserId === "object"
                                                ? m.teamMemberUserId._id ||
                                                m.teamMemberUserId.id
                                                : m.teamMemberUserId) ||
                                              m.id ||
                                              m._id
                                            ) === String(resident.assignedTeamMemberId)
                                        );
                                        return member
                                          ? member.firstName || member.name || "Unknown"
                                          : "Unknown";
                                      })()}
                                    </span>
                                  </span>
                                )}
                              </div>

                              {resident.risks && resident.risks.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-gray-700 mb-1">Risks:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {resident.risks.map((risk, idx) => (
                                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                        {risk.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-2 flex-shrink-0">
                              {!hasInterview(resident.id) && (
                                <Button
                                  onClick={() => {
                                    // CRITICAL: Mark that user is now editing this resident
                                    // This protects unfinished changes from being overridden by server data
                                    if (resident.id) {
                                      editingResidentsRef.current.add(resident.id);
                                      isEditingRef.current = true;
                                    }
                                    setSelectedResidentLocal(resident);
                                    // Also set the selectedResident in the parent component to ensure residentId is set
                                    if (setSelectedResident) {
                                      setSelectedResident(resident);
                                    }
                                    setShowInterviewModal(true);
                                  }}
                                  size="sm"
                                  disabled={
                                    (isInvitedUser() && isPageClosed) ||
                                    isSurveyClosed ||
                                    (isInvitedUser() &&
                                      (() => {
                                        const currentUser = JSON.parse(
                                          localStorage.getItem("mocksurvey_user") || "{}"
                                        );
                                        const taskStatus = surveyData?.initialPoolProcess?.taskStatuses?.[currentUser._id] ||
                                          taskStatuses[currentUser._id];
                                        return taskStatus === "approved";
                                      })())
                                  }
                                  className={`w-full sm:w-auto h-8 px-3 text-xs ${isInvitedUser() && isPageClosed
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-[#075b7d] hover:bg-[#075b7d] text-white"
                                    }`}
                                  title={
                                    isInvitedUser() && isPageClosed
                                      ? "Page is closed. Cannot add interviews."
                                      : ""
                                  }
                                >
                                  Add Interview
                                </Button>
                              )}
                              <Button
                                onClick={() => {
                                  // CRITICAL: Mark that user is now editing this resident
                                  // This protects unfinished changes from being overridden by server data
                                  if (resident.id) {
                                    editingResidentsRef.current.add(resident.id);
                                    isEditingRef.current = true;
                                  }
                                  setSelectedResidentLocal(resident);
                                  // Also set the selectedResident in the parent component to ensure residentId is set
                                  if (setSelectedResident) {
                                    setSelectedResident(resident);
                                  }
                                  setShowObservationModal(true);
                                }}
                                size="sm"
                                variant="outline"
                                disabled={
                                  (isInvitedUser() && isPageClosed) ||
                                  isSurveyClosed ||
                                  (isInvitedUser() &&
                                    (() => {
                                      const currentUser = JSON.parse(
                                        localStorage.getItem("mocksurvey_user") || "{}"
                                      );
                                      const taskStatus = surveyData?.initialPoolProcess?.taskStatuses?.[currentUser._id] ||
                                        taskStatuses[currentUser._id];
                                      return taskStatus === "approved";
                                    })())
                                }
                                className={`w-full sm:w-auto h-8 px-3 text-xs ${isInvitedUser() && isPageClosed
                                  ? "border-gray-300 text-gray-500 cursor-not-allowed bg-gray-100"
                                  : "border-[#075b7d] text-[#075b7d] hover:bg-[#075b7d]/10"
                                  }`}
                                title={
                                  isInvitedUser() && isPageClosed
                                    ? "Page is closed. Cannot add observations."
                                    : ""
                                }
                              >
                                Add Observation
                              </Button>
                            </div>
                          </div>

                          {/* Include in Pool Checkbox */}
                          <div className="flex items-center">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={resident.included || false}
                                onChange={(e) => {
                                  // Mark as having unsaved changes to protect from server overwrites
                                  setHasUnsavedChanges(true);
                                  setUnsavedChanges(prev => ({
                                    ...prev,
                                    [String(resident.id)]: true
                                  }));

                                  const updatedResidents =
                                    surveyData.initialPoolProcess?.residents?.map(
                                      (r) =>
                                        r.id === resident.id
                                          ? { ...r, included: e.target.checked }
                                          : r
                                    );
                                  handleSurveyDataChange("initialPoolProcess", {
                                    ...surveyData.initialPoolProcess,
                                    residents: updatedResidents,
                                  });
                                }}
                                disabled={
                                  (isInvitedUser() && isPageClosed) ||
                                  isSurveyClosed
                                }
                                className={`w-4 h-4 border-gray-300 rounded focus:ring-[#075b7d] ${isInvitedUser() && isPageClosed
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-[#075b7d]"
                                  }`}
                                title={
                                  isInvitedUser() && isPageClosed
                                    ? "Page is closed. Cannot modify pool inclusion."
                                    : ""
                                }
                              />
                              <span className="ml-2 text-sm font-medium text-gray-700">
                                Include in Pool
                              </span>
                            </label>
                          </div>
                        </div>

                        {resident.isNewAdmission && (
                          <Badge
                            variant="default"
                            className="text-xs bg-green-100 text-green-800 mb-3 border-green-200"
                          >
                            New Admission
                          </Badge>
                        )}



                        {hasInterview(resident.id) ||
                          hasInterviewResponses(resident.id) ? (
                          <div className="mb-3">
                            <h6 className="text-xs font-medium text-gray-700 mb-1">
                              Interview Areas:
                            </h6>
                            <div className="flex flex-wrap gap-1">
                              {resident.interviewAreas &&
                                resident.interviewAreas.map((area, index) => (
                                  <Badge
                                    key={`interview-area-${resident.id}-${area}-${index}`}
                                    variant="outline"
                                    className="text-xs border-gray-200 text-gray-700"
                                  >
                                    {area}
                                  </Badge>
                                ))}
                            </div>

                            {/* Quick Interview Questions Preview */}
                            <div className="mt-2">
                              <details
                                className={`group ${(isInvitedUser() && isPageClosed) ||
                                  isSurveyClosed
                                  ? "pointer-events-none"
                                  : ""
                                  }`}
                              >
                                <summary
                                  className={`text-xs font-medium underline ${(isInvitedUser() && isPageClosed) ||
                                    isSurveyClosed
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-gray-600 hover:text-gray-800 cursor-pointer"
                                    }`}
                                >
                                  View Interview Questions
                                </summary>
                                <div className="mt-2 space-y-2">
                                  {/* Show all questions by default if interviewAreas is empty or undefined */}
                                  {interviewSections.map((section) => (
                                    (!resident.interviewAreas ||
                                      resident.interviewAreas.length === 0 ||
                                      resident.interviewAreas.includes(section.area)) && (
                                      <div key={section.area} className="bg-gray-10 border border-gray-200 rounded p-2">
                                        <h6 className="text-xs font-semibold text-gray-800 block mb-1">
                                          {section.title}:
                                        </h6>
                                        <div className="space-y-2">
                                          {section.questions.map((question) => (
                                            <div key={question.id} className="flex items-center justify-between">
                                              <span className="text-xs text-gray-700">
                                                {question.text}
                                              </span>
                                              <div className="flex items-center space-x-2">
                                                <label className="flex items-center text-xs">
                                                  <input
                                                    type="radio"
                                                    name={`${question.id}_${resident.id}`}
                                                    value="yes"
                                                    checked={
                                                      getExistingResponses(resident.id)[question.id] === "yes"
                                                    }
                                                    onChange={(e) =>
                                                      handleRadioChange(
                                                        resident.id,
                                                        question.id,
                                                        e.target.value
                                                      )
                                                    }
                                                    disabled={
                                                      (isInvitedUser() && isPageClosed) ||
                                                      isSurveyClosed
                                                    }
                                                    className="w-3 h-3 text-[#075b7d] border-gray-300 focus:ring-[#075b7d] disabled:opacity-50 disabled:cursor-not-allowed"
                                                  />
                                                  <span className="ml-1">Yes</span>
                                                </label>
                                                <label className="flex items-center text-xs">
                                                  <input
                                                    type="radio"
                                                    name={`${question.id}_${resident.id}`}
                                                    value="no"
                                                    checked={
                                                      getExistingResponses(resident.id)[question.id] === "no"
                                                    }
                                                    onChange={(e) =>
                                                      handleRadioChange(
                                                        resident.id,
                                                        question.id,
                                                        e.target.value
                                                      )
                                                    }
                                                    disabled={
                                                      (isInvitedUser() && isPageClosed) ||
                                                      isSurveyClosed
                                                    }
                                                    className="w-3 h-3 text-[#075b7d] border-gray-300 focus:ring-[#075b7d] disabled:opacity-50 disabled:cursor-not-allowed"
                                                  />
                                                  <span className="ml-1">No</span>
                                                </label>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )
                                  ))}
                                </div>
                              </details>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-3">
                            <h6 className="text-xs font-medium text-gray-700 mb-1">
                              Review Areas:
                            </h6>
                            <div className="flex flex-wrap gap-1">
                              {resident.reviewAreas &&
                                resident.reviewAreas.map((area, index) => (
                                  <Badge
                                    key={`review-area-${resident.id}-${area}-${index}`}
                                    variant="outline"
                                    className="text-xs border-orange-200 text-orange-700"
                                  >
                                    {area}
                                  </Badge>
                                ))}
                            </div>

                            {/* Review Process Information */}
                            <div className="mt-2">
                              <details className="group">
                                <summary className="text-xs text-orange-600 hover:text-orange-800 cursor-pointer font-medium">
                                  View Review Process
                                </summary>
                                <div className="mt-2 bg-orange-10 border border-orange-200 rounded p-2">
                                  <h6 className="text-xs font-semibold text-orange-800 block mb-1">
                                    Alternative Assessment Methods:
                                  </h6>
                                  <ul className="text-xs text-orange-700 space-y-1 list-disc list-inside">
                                    <li>
                                      Records Review: Care plans, assessments,
                                      incident reports
                                    </li>
                                    <li>
                                      Staff Interviews: Direct care staff,
                                      medical professionals
                                    </li>
                                    <li>
                                      Family Interviews: Satisfaction, concerns,
                                      communication
                                    </li>
                                    <li>
                                      Observations: Staff interactions, care
                                      delivery
                                    </li>
                                  </ul>
                                </div>
                              </details>
                            </div>
                          </div>
                        )}

                        {/* Interviews for this resident */}
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Interviews
                          </h5>
                          {resident.scheduleInterviewType ? (
                            <div className="space-y-2">
                              <div className="p-2 bg-white rounded border border-blue-200 bg-blue-50/30">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center space-x-2">
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${resident.scheduleInterviewType === "RI"
                                        ? "border-blue-200 text-blue-700"
                                        : resident.scheduleInterviewType === "RRI"
                                          ? "border-purple-200 text-purple-700"
                                          : "border-gray-200 text-gray-700"
                                        }`}
                                    >
                                      {resident.scheduleInterviewType}
                                    </Badge>
                                    {resident.scheduleInterviewDateTime && (
                                      <span className="text-xs text-gray-600">
                                        {new Date(resident.scheduleInterviewDateTime).toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {resident.scheduleInterviewNotes && (
                                  <p className="text-xs text-gray-700 mt-1">
                                    {resident.scheduleInterviewNotes}
                                  </p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 italic">
                              No interviews scheduled yet
                            </p>
                          )}
                        </div>                        {/* Observations for this resident */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Observations
                          </h5>
                          {(() => {
                            // Get observations from multiple sources:
                            // 1. Main observations array (current session)
                            // 2. Team member payload observations (from API/saved data)
                            const mainObservations =
                              surveyData?.initialPoolProcess?.observations ||
                              [];

                            // Extract observations from residents array (resident-centric structure)
                            const residentsObservations = [];
                            (surveyData?.initialPoolProcess?.residents || []).forEach((resident) => {
                              if (resident.observations && Array.isArray(resident.observations)) {
                                residentsObservations.push(...resident.observations);
                              }
                            });

                            // Extract observations from teamMemberPayload
                            const teamMemberPayloadObservations = [];
                            const teamMemberPayload = surveyData?.initialPoolProcess?.teamMemberPayload || [];
                            teamMemberPayload.forEach((submission) => {
                              if (submission.observations && Array.isArray(submission.observations)) {
                                teamMemberPayloadObservations.push(...submission.observations);
                              }
                            });

                            // Combine all observations sources
                            const allObservations = [
                              ...mainObservations,
                              ...residentsObservations,
                              ...teamMemberPayloadObservations,
                            ];

                            // Filter observations for this resident
                            // Use deduplication by ID to prevent any duplicates
                            const observationMap = new Map();
                            allObservations.forEach((obs) => {
                              const key =
                                obs.id ||
                                `${obs.residentId}_${obs.timestamp || obs.createdAt || ""
                                }`;
                              // Only add if not already in map (prevents duplicates)
                              // Deduplicate observations
                              if (!observationMap.has(key)) {
                                observationMap.set(key, obs);
                              }
                            });

                            const deduplicatedObservations = Array.from(
                              observationMap.values()
                            );

                            const residentObservations =
                              deduplicatedObservations.filter((obs) => {
                                // Primary match: by residentId
                                const idMatch =
                                  String(obs.residentId) ===
                                  String(resident.id);

                                // Fallback match: by resident name (case-insensitive)
                                const nameMatch =
                                  obs.residentName &&
                                  resident.name &&
                                  obs.residentName.toLowerCase().trim() ===
                                  resident.name.toLowerCase().trim();

                                const matches = idMatch || nameMatch;

                                return matches;
                              });

                            const hasResidentObservations =
                              residentObservations.length > 0 || !!resident.scheduleObservationArea;

                            const residentChecklistResponses =
                              observationChecklistResponses?.[
                              String(resident.id)
                              ] || {};
                            const hasChecklistResponses =
                              Object.keys(residentChecklistResponses).length > 0;

                            return (
                              <>
                                {(hasResidentObservations ||
                                  hasChecklistResponses) && (
                                    <div className="mb-2">
                                      <details
                                        className={`group ${(isInvitedUser() && isPageClosed) ||
                                          isSurveyClosed
                                          ? "pointer-events-none"
                                          : ""
                                          }`}
                                      >
                                        <summary
                                          className={`text-xs font-medium underline ${(isInvitedUser() && isPageClosed) ||
                                            isSurveyClosed
                                            ? "text-gray-400 cursor-not-allowed"
                                            : "text-gray-600 hover:text-gray-800 cursor-pointer"
                                            }`}
                                        >
                                          View Observation Checklist
                                        </summary>
                                        <div className="mt-2 space-y-2">
                                          {observationChecklist.map((item) => {
                                            const residentResponses =
                                              observationChecklistResponses?.[
                                              String(resident.id || resident.generatedId)
                                              ] || {};
                                            const responseValue =
                                              residentResponses[item.id] || "";
                                            const radioName = `observation_${resident.id}_${item.id}`;

                                            return (
                                              <div
                                                key={`observation-checklist-${resident.id}-${item.id}`}
                                                className="bg-gray-10 border border-gray-200 rounded p-2"
                                              >
                                                <span className="text-[11px] font-semibold text-gray-800 block">
                                                  {item.tag}
                                                </span>
                                                <p className="text-xs text-gray-700 mt-1">
                                                  {item.title}
                                                </p>
                                                <p className="text-[11px] text-gray-600">
                                                  {item.description}
                                                </p>
                                                <div className="mt-2 flex items-center gap-4 text-xs">
                                                  <label className="flex items-center">
                                                    <input
                                                      type="radio"
                                                      name={radioName}
                                                      value="yes"
                                                      checked={
                                                        responseValue === "yes"
                                                      }
                                                      onChange={(e) =>
                                                        handleObservationChecklistChange(
                                                          resident.id || resident.generatedId,
                                                          item.id,
                                                          e.target.value
                                                        )
                                                      }
                                                      disabled={
                                                        (isInvitedUser() &&
                                                          isPageClosed) ||
                                                        isSurveyClosed
                                                      }
                                                      className="w-3 h-3 text-[#075b7d] border-gray-300 focus:ring-[#075b7d] disabled:opacity-50 disabled:cursor-not-allowed"
                                                    />
                                                    <span className="ml-1">
                                                      Yes
                                                    </span>
                                                  </label>
                                                  <label className="flex items-center">
                                                    <input
                                                      type="radio"
                                                      name={radioName}
                                                      value="no"
                                                      checked={
                                                        responseValue === "no"
                                                      }
                                                      onChange={(e) =>
                                                        handleObservationChecklistChange(
                                                          resident.id,
                                                          item.id,
                                                          e.target.value
                                                        )
                                                      }
                                                      disabled={
                                                        (isInvitedUser() &&
                                                          isPageClosed) ||
                                                        isSurveyClosed
                                                      }
                                                      className="w-3 h-3 text-[#075b7d] border-gray-300 focus:ring-[#075b7d] disabled:opacity-50 disabled:cursor-not-allowed"
                                                    />
                                                    <span className="ml-1">
                                                      No
                                                    </span>
                                                  </label>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </details>
                                    </div>
                                  )}
                                {hasResidentObservations ? (
                                  <div className="space-y-2">
                                    {resident.scheduleObservationArea ? (
                                      <div className="p-2 bg-white rounded border border-purple-200 bg-purple-50/30">
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center space-x-2">
                                            <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">
                                              {resident.scheduleObservationArea}
                                            </Badge>
                                            {resident.scheduleObservationDateTime && (
                                              <span className="text-xs text-gray-600">
                                                {new Date(resident.scheduleObservationDateTime).toLocaleString()}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        {resident.scheduleObservationDescription && (
                                          <p className="text-xs text-gray-700 mt-1">
                                            {resident.scheduleObservationDescription}
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      residentObservations.map((obs, index) => {
                                        // Draft status removed - use task status instead
                                        const isFromDraft = false;

                                        // Check if this observation is awaiting team lead review
                                        const isAwaitingReview = (() => {
                                          if (isInvitedUser()) return false; // Only show to team leads

                                          const resident = surveyData?.initialPoolProcess?.residents?.find(
                                            (r) => String(r.id) === String(obs.residentId)
                                          );
                                          if (!resident) return false;

                                          const assignedTeamMemberId = resident.assignedTeamMemberId;
                                          if (!assignedTeamMemberId) return false;

                                          // Check task status from taskStatuses object
                                          const taskStatus = surveyData?.initialPoolProcess?.taskStatuses?.[assignedTeamMemberId] ||
                                            taskStatuses[assignedTeamMemberId];
                                          const normalizedTaskStatus =
                                            typeof taskStatus === "object"
                                              ? taskStatus?.status || taskStatus
                                              : taskStatus;
                                          const isPendingReview =
                                            normalizedTaskStatus === "pending_review" ||
                                            normalizedTaskStatus === "done";

                                          return isPendingReview;
                                        })();

                                        return (
                                          <div
                                            key={`observation-${resident.id}-${obs.id || obs.residentId || "no-id"
                                              }-${index}`}
                                            className={`p-2 bg-white rounded border ${isFromDraft
                                              ? "border-amber-200 bg-amber-50/30"
                                              : isAwaitingReview
                                                ? "border-amber-300 bg-amber-50/40"
                                                : "border-gray-200"
                                              }`}
                                          >
                                            <div className="flex items-center justify-between mb-1">
                                              <div className="flex items-center space-x-2">
                                                {obs.location && (
                                                  <span className="text-xs font-medium text-gray-700">
                                                    {obs.location}
                                                  </span>
                                                )}
                                                {isFromDraft && (
                                                  <Badge
                                                    variant="outline"
                                                    className="text-xs border-amber-200 text-amber-700 bg-amber-50"
                                                  >
                                                    Draft
                                                  </Badge>
                                                )}
                                                {isAwaitingReview && (
                                                  <Badge
                                                    variant="outline"
                                                    className="text-xs border-amber-300 text-amber-700 bg-amber-50 font-medium"
                                                  >
                                                    Awaiting Review
                                                  </Badge>
                                                )}
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                {obs.timestamp && (
                                                  <span className="text-xs text-gray-500">
                                                    {obs.timestamp}
                                                  </span>
                                                )}
                                                <Button
                                                  onClick={() => {
                                                    toast.error(
                                                      `Remove Observation`,
                                                      {
                                                        description: `Are you sure you want to remove this observation for ${obs.residentName ||
                                                          "this resident"
                                                          }?`,
                                                        action: {
                                                          label: "Remove",
                                                          onClick: () => {
                                                            try {
                                                              removeObservationById(
                                                                obs.id
                                                              );
                                                              toast.success(
                                                                "Observation removed successfully"
                                                              );
                                                            } catch (error) {
                                                              toast.error(
                                                                "Error removing observation"
                                                              );
                                                            }
                                                          },
                                                        },
                                                        cancel: {
                                                          label: "Cancel",
                                                          onClick: () => { },
                                                        },
                                                      }
                                                    );
                                                  }}
                                                  size="sm"
                                                  variant="ghost"
                                                  disabled={
                                                    (isInvitedUser() &&
                                                      isPageClosed) ||
                                                    isSurveyClosed
                                                  }
                                                  className={`h-5 w-5 p-0 ${isInvitedUser() &&
                                                    isPageClosed
                                                    ? "text-gray-400 cursor-not-allowed"
                                                    : "text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    }`}
                                                  title={
                                                    isInvitedUser() &&
                                                      isPageClosed
                                                      ? "Page is closed. Cannot delete observations."
                                                      : "Remove observation"
                                                  }
                                                >
                                                  <Trash2 className="w-3 h-3" />
                                                </Button>
                                              </div>
                                            </div>
                                            <p className="text-xs text-gray-700">
                                              {obs.description}
                                            </p>
                                          </div>
                                        );
                                      }))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500 italic">
                                    No observations recorded yet
                                  </p>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        {/* Resident Notes Section */}
                        <div className="mb-4 mt-4 relative">
                          <h6 className="text-xs font-medium text-gray-700 mb-2">
                            Notes
                          </h6>
                          <textarea
                            placeholder={`Add notes for ${resident.name}...`}
                            value={resident.notes || ""}
                            onChange={(e) => {
                              // Mark as having unsaved changes to protect from server overwrites
                              setHasUnsavedChanges(true);
                              setUnsavedChanges(prev => ({
                                ...prev,
                                [String(resident.id)]: true
                              }));

                              const updatedResidents =
                                surveyData.initialPoolProcess?.residents?.map(
                                  (r) =>
                                    r.id === resident.id
                                      ? { ...r, notes: e.target.value }
                                      : r
                                );
                              handleSurveyDataChange("initialPoolProcess", {
                                ...surveyData.initialPoolProcess,
                                residents: updatedResidents,
                              });
                            }}
                            disabled={
                              (isInvitedUser() && isPageClosed) ||
                              isSurveyClosed
                            }
                            rows={3}
                            className="w-full px-3 py-2 pr-3 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* Assigned Team Member Section */}
                        <div className="mb-4 mt-4 pt-4 border-t border-gray-200">
                          <h6 className="text-xs font-medium text-gray-700 mb-2">
                            Assigned Team Member
                          </h6>
                          <div className="flex items-center space-x-2">
                            {(() => {
                              // IMPORTANT: Check allResidents (not filtered residents) to get correct assignment
                              // This ensures we show the actual assignment even if resident is filtered for invited users
                              const residentInAll = allResidents.find(
                                (r) => r.id === resident.id
                              );
                              const assignedTeamMemberId =
                                residentInAll?.assignedTeamMemberId ||
                                resident.assignedTeamMemberId;

                              // Also check if resident is assigned via effectiveTeamMembers.assignedResidents
                              // This handles cases where assignment exists in effectiveTeamMembers but not in resident.assignedTeamMemberId
                              if (!assignedTeamMemberId) {
                                const assignedMember = effectiveTeamMembers.find(
                                  (member) => {
                                    const memberAssignedResidents =
                                      member.assignedResidents || [];
                                    return memberAssignedResidents.includes(
                                      String(resident.id)
                                    );
                                  }
                                );

                                if (assignedMember) {
                                  return (
                                    <Badge className="text-xs bg-[#075b7d] text-white border-0">
                                      {assignedMember.firstName || assignedMember.name}
                                    </Badge>
                                  );
                                }
                              }

                              return assignedTeamMemberId ? (
                                <div className="flex items-center gap-2">
                                  <Badge className="text-xs bg-[#075b7d] text-white border-0">
                                    {(() => {
                                      const member = effectiveTeamMembers.find(
                                        (m) =>
                                          String(m.id) ===
                                          String(assignedTeamMemberId) ||
                                          String(m.teamMemberUserId) ===
                                          String(assignedTeamMemberId) ||
                                          (m.teamMemberUserId &&
                                            typeof m.teamMemberUserId ===
                                            "object" &&
                                            String(m.teamMemberUserId._id) ===
                                            String(assignedTeamMemberId))
                                      );
                                      return (
                                        member?.firstName ||
                                        member?.name ||
                                        "Unknown Member"
                                      );
                                    })()}
                                  </Badge>
                                  {!isInvitedUser() && !isSurveyClosed && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={() =>
                                        handleUnassignResident(resident)
                                      }
                                      title="Unassign team member"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500 italic">
                                  Not assigned
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Resident Details & Actions */}
        <div className="space-y-6">
          {/* Pool Summary */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              Pool Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Residents:</span>
                <span className="font-medium">{allResidents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Included in Pool:</span>
                <span className="font-medium text-green-600">
                  {allResidents.filter((r) => r.included).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Interviewable:</span>
                <span className="font-medium text-blue-600">
                  {allResidents.filter((r) => r.canBeInterviewed).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  Non-Interviewable:
                </span>
                <span className="font-medium text-orange-600">
                  {allResidents.filter((r) => !r.canBeInterviewed).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">New Admissions:</span>
                <span className="font-medium">
                  {allResidents.filter((r) => r.isNewAdmission).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  {isInvitedUser()
                    ? "Your Assigned Residents:"
                    : "Assigned Residents:"}
                </span>
                <span className="font-medium text-[#075b7d]">
                  {isInvitedUser()
                    ? residents.length
                    : (() => {
                      // IMPORTANT: Use localTeamMembers (from API) as single source of truth for assignments
                      // Get all assigned resident IDs from all team members
                      const allAssignedResidentIds = new Set();

                      // Collect all assigned resident IDs from API data
                      localTeamMembers.forEach((tm) => {
                        (tm.assignedResidents || []).forEach((residentId) => {
                          allAssignedResidentIds.add(String(residentId));
                        });
                      });

                      // Also check allResidents for assignedTeamMemberId (UI state)
                      allResidents.forEach((r) => {
                        if (r.assignedTeamMemberId) {
                          allAssignedResidentIds.add(String(r.id));
                        }
                      });

                      // Count how many assigned residents exist in the pool
                      return allResidents.filter((r) =>
                        allAssignedResidentIds.has(String(r.id))
                      ).length;
                    })()}
                </span>
              </div>
            </div>

            {/* Assignment Management Button */}
            {effectiveTeamMembers.length > 0 &&
              residents.length > 0 &&
              !isInvitedUser() && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => setShowResidentAssignmentModal(true)}
                    disabled={isSurveyClosed}
                    className="w-full bg-[#075b7d] hover:bg-[#064d63] text-white font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Manage Resident Assignments
                  </Button>
                </div>
              )}
          </div>



          {/* CMS-802 Definitions */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              Reference Guide
            </h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">View CMS-802 Definitions</p>
              <a
                href="https://mocksurvey.s3.amazonaws.com/uploads/cms-802_definitions_1760461367182.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 underline"
              >
                CMS-802 Definitions
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      {!isInvitedUser() && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-40 flex gap-2 sm:gap-4">
          <Button
            onClick={() => {
              if (hasUnsavedChanges) {
                setPendingNavigation({ type: 'step', target: 3 });
                setShowExitWarning(true);
              } else {
                setCurrentStep(3);
              }
            }}
            className="flex-1 sm:flex-none min-w-0 h-11 sm:h-12 px-3 sm:px-8 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-sm sm:text-base font-medium rounded-full shadow-lg flex items-center justify-center gap-1 sm:gap-2 hover:shadow-xl transition-all"
            size="lg"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span className="hidden sm:inline">Back</span>
          </Button>

          <Button
            onClick={() => {
              handleInitialPoolProcessSubmit(true);
              setIsContinueClicked(true);
            }}
            disabled={
              isSubmitting ||
              (isInvitedUser() && isPageClosed) ||
              isSurveyClosed ||
              (() => {
                const currentUser = JSON.parse(
                  localStorage.getItem("mocksurvey_user") || "{}"
                );
                const taskStatus = surveyData?.initialPoolProcess?.taskStatuses?.[currentUser._id] ||
                  taskStatuses[currentUser._id];
                return taskStatus === "approved";
              })()
            }
            className="flex-1 sm:flex-none min-w-0 h-11 sm:h-12 px-3 sm:px-8 bg-[#075b7d] hover:bg-[#075b7d] text-white text-sm sm:text-base font-medium disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full shadow-lg flex items-center justify-center gap-1 sm:gap-2 hover:shadow-xl transition-all"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0"></div>
                <span className="hidden sm:inline">Saving...</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Continue to Sample Selection</span>
                <span className="sm:hidden">Continue</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Floating Action Buttons - Context-aware for team members */}
      {isInvitedUser() ? (
        // Team Member View - Show Submit for Review, Back and Next
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-40 flex flex-col items-end gap-2 sm:gap-4">
          {/* Submit for Review Button (Primary Action) */}
          {(() => {
            return (
              <>
                <Button
                  onClick={async () => {
                    // Submit for review (final submission, not draft)
                    await handleTeamMemberWorkSubmit(false, false);
                  }}
                  disabled={
                    isSubmitting ||
                    isPageClosed ||
                    isSurveyClosed
                  }
                  className={`h-12 px-6 font-semibold rounded-full shadow-lg flex items-center gap-2 hover:shadow-xl transition-all bg-[#064d63] hover:bg-[#064d63] text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                    }`}
                  size="lg"
                  title={
                    "Submit your work for team lead review"
                  }
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      <span className="hidden sm:inline">Save Work & Submit for Review</span>
                    </>
                  )}
                </Button>

              </>
            );
          })()}

          {/* Navigation Buttons */}
          <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
            <Button
              onClick={() => {
                if (hasUnsavedChanges) {
                  setPendingNavigation({ type: 'step', target: 3 });
                  setShowExitWarning(true);
                } else {
                  setCurrentStep(3);
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
                if (hasUnsavedChanges) {
                  setPendingNavigation({ type: 'step', target: 5 });
                  setShowExitWarning(true);
                } else {
                  setCurrentStep(5);
                }
              }}
              className="flex-1 sm:flex-none h-11 sm:h-12 px-4 sm:px-8 bg-[#075b7d] hover:bg-[#075b7d] text-white text-sm sm:text-base font-medium rounded-full shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all"
              size="lg"
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>
      ) : (
        // Team Lead View - Show Save Progress button
        <div className="fixed bottom-[100px]  right-6 z-40 flex flex-col items-end gap-2">
          <Button
            onClick={() => handleInitialPoolProcessSubmit(false)}
            disabled={isSubmitting || isSurveyClosed}
            className="h-11 sm:h-12 px-4 sm:px-6 bg-[#075b7d] hover:bg-[#075b7d] text-white text-sm sm:text-base font-medium disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full shadow-lg flex items-center gap-2 hover:shadow-xl transition-all"
            size="lg"
            title="Save your progress without navigating away"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span className="hidden sm:inline">Saving...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 hidden md:inline" />
                <span className="hidden sm:inline">Save Progress</span>
                <span className="sm:hidden">Save</span>
              </>
            )}
          </Button>
         
        </div>
      )}

      {/* Resident Assignment Modal */}
      <ResidentAssignmentModal
        isOpen={showResidentAssignmentModal}
        onClose={() => setShowResidentAssignmentModal(false)}
        residents={residents}
        allResidents={allResidents}
        teamMembers={effectiveTeamMembers}
        localTeamMembers={localTeamMembers}
        onBulkAssignment={handleBulkAssignment}
        onUnassignResident={handleUnassignResident}
        isDisabled={isInvitedUser() || isSurveyClosed}
        title="Assign Residents to Team Members"
        surveyId={currentSurveyId}
      />

      {/* Confirm Override Modal */}
      <ConfirmOverrideModal
        isOpen={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        onConfirm={handleConfirmOverride}
        title="Initial Pool Already Generated"
        message="You have already generated an initial pool for this survey. Generating again will override your current residents and any assignments. Are you sure you want to proceed?"
        confirmText="Yes, Generate Again"
        isLoading={isGenerating}
        variant="warning"
      />

      {/* Completion Modal */}

      {/* Work Review Modal */}
      {showWorkReviewModal && selectedTeamMemberForReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)] max-h-[calc(100vh-1rem)] sm:max-h-[90vh] flex flex-col shadow-2xl">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white rounded-t-2xl">
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <h3 className="text-base sm:text-xl font-semibold text-gray-900">
                    {selectedTeamMemberForReview.submission?.isDraft !== false
                      ? "Draft Work Review"
                      : "Submitted Work Review"}
                  </h3>
                  {selectedTeamMemberForReview.submission?.isDraft !== false ? (
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                      Draft - Work in Progress
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                      Final Submission
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                  {selectedTeamMemberForReview.member.name} -{" "}
                  {selectedTeamMemberForReview.member.email}
                </p>
                {selectedTeamMemberForReview.submission?.isDraft !== false && (
                  <p className="text-xs text-amber-700 mt-1 italic">
                    This is a draft submission. The team member is still working
                    on this task.
                  </p>
                )}
              </div>
              <Button
                onClick={() => {
                  setShowWorkReviewModal(false);
                  setSelectedTeamMemberForReview(null);
                }}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                {/* Summary Statistics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedTeamMemberForReview.submission.residents
                        ?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">
                      Residents Worked On
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedTeamMemberForReview.submission.residentInterviews
                        ?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">
                      Interviews Completed
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedTeamMemberForReview.submission.observations
                        ?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">
                      Observations Made
                    </div>
                  </div>
                </div>

                {/* Submission Details */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Submission Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Last Saved:</span>
                      <span className="ml-2 font-medium">
                        {selectedTeamMemberForReview.submission.submittedAt
                          ? new Date(
                            selectedTeamMemberForReview.submission.submittedAt
                          ).toLocaleDateString()
                          : "Not saved"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-2 font-medium">
                        {(() => {
                          const isDraft =
                            selectedTeamMemberForReview.submission.isDraft !==
                            false;
                          const taskStatus =
                            selectedTeamMemberForReview.submission.taskStatus;
                          if (isDraft) {
                            return "Draft (In Progress)";
                          }
                          if (
                            typeof taskStatus === "object" &&
                            taskStatus !== null
                          ) {
                            return taskStatus.status || "Unknown";
                          }
                          return taskStatus || "Unknown";
                        })()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Submission Type:</span>
                      <span className="ml-2 font-medium">
                        {selectedTeamMemberForReview.submission.isDraft !==
                          false
                          ? "Draft (Auto-saved)"
                          : "Final (Submitted for Review)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interview Details */}
                {selectedTeamMemberForReview.submission?.residentInterviews &&
                  selectedTeamMemberForReview.submission?.residentInterviews
                    .length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Interview Details
                      </h4>
                      <div className="space-y-3">
                        {selectedTeamMemberForReview.submission.residentInterviews.map(
                          (interview, index) => (
                            <div
                              key={`review-interview-${interview.id || interview.residentId || "no-id"
                                }-${index}`}
                              className="bg-gray-50 p-3 rounded border border-gray-200"
                            >
                              <div className="font-medium text-gray-900 mb-2">
                                {interview.residentName}
                              </div>
                              <div className="text-sm text-gray-600 mb-2">
                                Type: {interview.type} | Date: {interview.date}
                              </div>
                              <div className="text-sm text-gray-600 mb-2">
                                Areas: {interview.areas?.join(", ") || "N/A"}
                              </div>
                              {interview.responses &&
                                Object.keys(interview.responses).length > 0 && (
                                  <div className="mt-2">
                                    <div className="font-medium text-gray-700 text-sm mb-1">
                                      Responses:
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      {Object.entries(interview.responses).map(
                                        ([key, value], responseIndex) => (
                                          <div
                                            key={`response-${interview.id ||
                                              interview.residentId ||
                                              index
                                              }-${key}-${responseIndex}`}
                                            className="text-sm"
                                          >
                                            <span className="text-gray-500">
                                              {key.replace(/_/g, " ")}:
                                            </span>
                                            <span
                                              className={`ml-1 font-medium ${value === "yes"
                                                ? "text-green-600"
                                                : "text-red-600"
                                                }`}
                                            >
                                              {value}
                                            </span>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">

              {/* Reset Action for Rejected Tasks */}
              {!isInvitedUser() &&
                selectedTeamMemberForReview?.submission?.taskStatus ===
                "rejected" && (
                  <div className="flex space-x-2">
                    <Button
                      onClick={async () => {
                        await updateTaskStatus(
                          selectedTeamMemberForReview.member.id,
                          "in_progress"
                        );
                        setShowWorkReviewModal(false);
                        setSelectedTeamMemberForReview(null);
                      }}
                      disabled={isSurveyClosed}
                      variant="outline"
                      className="px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reset to In Progress
                    </Button>
                  </div>
                )}

              {/* Close Button */}
              <Button
                onClick={() => {
                  setShowWorkReviewModal(false);
                  setSelectedTeamMemberForReview(null);
                }}
                variant="outline"
                className="px-6"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modal for Initial Pool Data */}
      {isLoadingInitialPool && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl border border-gray-200">
            <div className="flex flex-col items-center">
              {/* Animated loader */}
              <div className="relative mb-6">
                <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-[#075b7d] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Loading Initial Pool Data
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 text-center mb-4">
                Please wait while we fetch the initial pool data...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modal - Cannot be closed until generation is complete */}
      {isGenerating && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl border border-gray-200">
            <div className="flex flex-col items-center">
              {/* Animated loader */}
              <div className="relative mb-6">
                <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-[#075b7d] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Generating Initial Pool
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 text-center mb-4">
                Please wait while we generate the initial pool for your
                survey...
              </p>

              {/* Progress indicator */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#075b7d] h-full rounded-full animate-pulse"
                  style={{ width: "70%" }}
                ></div>
              </div>

              {/* Additional info */}
              <p className="text-xs text-gray-500 mt-4 text-center">
                This may take a few moments. Do not close or refresh the page.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Unassign Confirmation Modal */}
      <UnassignResidentModal
        isOpen={showUnassignConfirmation}
        onClose={() => {
          setShowUnassignConfirmation(false);
          setResidentToUnassign(null);
        }}
        onConfirm={confirmUnassignResident}
        resident={residentToUnassign}
      />

      {/* Modals */}
      <ScheduleInterviewModal
        isOpen={showInterviewModal}
        onClose={() => setShowInterviewModal(false)}
        selectedResident={selectedResident}
        setSelectedResident={setSelectedResident}
        surveyData={surveyData}
        handleSurveyDataChange={(key, value) => {
          setHasUnsavedChanges(true);
          handleSurveyDataChange(key, value);
        }}
        setHasUnsavedChanges={setHasUnsavedChanges}
        setUnsavedChanges={setUnsavedChanges}
      />

      <AddObservationModal
        isOpen={showObservationModal}
        onClose={() => setShowObservationModal(false)}
        selectedResident={selectedResident}
        setSelectedResident={setSelectedResident}
        surveyData={surveyData}
        handleSurveyDataChange={(key, value) => {
          setHasUnsavedChanges(true);
          handleSurveyDataChange(key, value);
        }}
        setHasUnsavedChanges={setHasUnsavedChanges}
        setUnsavedChanges={setUnsavedChanges}
      />

      <UnsavedChangesModal
        open={showExitWarning}
        onOpenChange={setShowExitWarning}
        onCancel={() => {
          setShowExitWarning(false);
          if (pendingNavigation?.type === 'browser') {
            restoreBlocker();
          }
          setPendingNavigation(null);
        }}
        onConfirm={async () => {
          // Save changes before navigating
          await handleInitialPoolProcessSubmit(false);
          setHasUnsavedChanges(false);
          setShowExitWarning(false);
          if (pendingNavigation?.type === 'browser') {
            window.history.back();
          } else if (pendingNavigation?.type === 'step') {
            setCurrentStep(pendingNavigation.target);
          }
          setPendingNavigation(null);
        }}
      />

      {/* Unsaved Changes Options Modal - shown when server data arrives with local changes */}
      <UnsavedChangesOptionsModal
        open={unsavedChangesModalOpen}
        onOpenChange={setUnsavedChangesModalOpen}
        onKeepChanges={handleKeepUnsavedChanges}
        onFetchServerData={handleFetchServerData}
        changesCount={pendingUnsavedChangesCount}
      />

      {/* Floating Home Button */}
      <FloatingHomeButton
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={() => handleInitialPoolProcessSubmit(false)}
        onClearUnsavedChanges={() => setUnsavedChanges({})}
      />
    </div>
  );
};

export default InitialPoolProcess;
