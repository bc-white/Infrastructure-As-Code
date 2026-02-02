import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useBeforeUnload } from "react-router-dom";
import { toast } from "sonner";
import api, { healthAssistantAPI } from "../../service/api";
import surveyIndexedDB from "../../utils/surveyIndexedDB";
import surveySyncService from "../../utils/surveySyncService";
import useSurveyStore from "../../stores/useSurveyStore";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Loader2,
  AlertCircle,
  Plus,
  Users,
  X,
  Info,
  AlertTriangle,
  ChevronLeft,
  ArrowRight,
  FileText,
} from "lucide-react";
import useFinalSampleStore from "../../stores/useFinalSampleStore";
import {

  getCurrentUser,
} from "../../utils/investigations/investigationHelpers";
import { getTeamMemberById } from "../../lib/utils";
import { useBrowserNavigationBlocker } from "../../hooks/useBrowserNavigationBlocker";
import useSurveyAccess from "../../hooks/useSurveyAccess";
import UnsavedChangesModal from "../../components/UnsavedChangesModal";
import FloatingHomeButton from "../../components/FloatingHomeButton";
import UnassignResidentModal from "../../components/modals/UnassignResidentModal";
import ResidentAssignmentModal from "../../components/modals/ResidentAssignmentModal";
import ConfirmOverrideModal from "../../components/modals/ConfirmOverrideModal";

const SampleSelection = ({ setCurrentStep, isInvitedUser: isInvitedUserProp = () => false }) => {
  // Get current survey ID
  const currentSurveyId = localStorage.getItem("currentSurveyId");
  
  // Use the survey access hook to determine user access type
  const { isInvitedUser: isInvitedUserFromHook, isLoading: isAccessLoading } = useSurveyAccess(currentSurveyId);
  
  // Use hook-based isInvitedUser, fall back to prop if hook is still loading
  const isInvitedUser = isAccessLoading ? isInvitedUserProp : isInvitedUserFromHook;

  // Store state and actions
  const {
    finalSample,
    summary,
    closedRecords,
    isLoading,
    error,
    surveyId: storeSurveyId,
    setIsLoading,
    setError,
    setFinalSampleData,
    validateSurveyId,
    clearData, // Add clearData action for server-first approach
  } = useFinalSampleStore();

  // Navigation blocking state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const hasUnsavedChangesRef = useRef(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [isSyncingData, setIsSyncingData] = useState(false); // Sync button loading state

  // Sync hasUnsavedChangesRef with state
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Ref to track if currently fetching to prevent duplicate requests
  const isFetchingRef = useRef(false);

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

  // Resident Assignment Modal state
  const [showReassignmentModal, setShowReassignmentModal] = useState(false);

  // Team members state
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(false);

  // Survey data state (from view_survey_wizard)
  const [surveyData, setSurveyData] = useState(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPageClosed, setIsPageClosed] = useState(false);

  // State for unassign confirmation modal
  const [showUnassignConfirmation, setShowUnassignConfirmation] = useState(false);
  const [residentToUnassign, setResidentToUnassign] = useState(null);

  // State for override confirmation modal (when user has already generated final sample)
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [isCheckingGeneration, setIsCheckingGeneration] = useState(false);

  // Handler to initiate unassign process
  // If alreadyUnassigned is true, the modal already performed the API call
  const handleUnassignResident = (resident, alreadyUnassigned = false) => {
    if (alreadyUnassigned) {
      // Modal already unassigned - just refresh parent data
      fetchFinalSampleResidents(true);
      fetchTeamMembers(true);
      return;
    }
    // Show confirmation modal for unassign from main page (not modal)
    setResidentToUnassign(resident);
    setShowUnassignConfirmation(true);
  };

  // Handle bulk assignment from ResidentAssignmentModal
  const handleBulkAssignment = async (selectedResidentIds, teamMemberId) => {
    if (!teamMemberId || !selectedResidentIds?.length) return;

    const selectedResidentsSet = new Set(selectedResidentIds);
    const loadingToast = toast.loading("Verifying bulk assignment availability...");
    const conflicts = [];
    const selectedResidentsList = allAvailableResidents.filter(r => selectedResidentsSet.has(r.id));

    try {
      // Check all selected residents
      await Promise.all(selectedResidentsList.map(async (resident) => {
        try {
          const payload = {
            surveyId: currentSurveyId || storeSurveyId,
            generatedId: resident.generatedId || resident.id
          };
          const response = await api.survey.checkResidentAssignment(payload);

          if (response && response.data && response.data.isAssigned) {
            const residentData = response.data.resident;
            if (residentData && residentData.teamMemberUserId) {
              const assignedMember = residentData.teamMemberUserId;
              // If assigned to someone else
              if (assignedMember._id && String(assignedMember._id) !== String(teamMemberId)) {
                const memberName = assignedMember.firstName || assignedMember.name || "another team member";
                conflicts.push(`${resident.name} (assigned to ${memberName})`);
              }
            }
          }
        } catch (err) {
          // Log individual resident check errors but continue
        }
      }));

      if (conflicts.length > 0) {
        toast.dismiss(loadingToast);
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
        return;
      }

      // SERVER-FIRST: Build payload with updated assignments and save to API
      const updatedFinalSample = (finalSample || []).map((item) => {
        if (selectedResidentsSet.has(item.resident.id)) {
          return {
            ...item,
            resident: {
              ...item.resident,
              assignedTeamMemberId: teamMemberId,
            },
          };
        }
        return item;
      });

      // Store the count before clearing selection
      const assignedCount = selectedResidentIds.length;

      // Dismiss loading toast - will show result after API call
      toast.dismiss(loadingToast);

      // Save to API - pass updatedFinalSample directly
      const savingToast = toast.loading("Saving assignments to server...");
      try {
        await handleSampleSelectionSubmit(false, updatedFinalSample);
        toast.dismiss(savingToast);
        toast.success(`Assigned ${assignedCount} residents successfully`);

        // SERVER-FIRST: Fetch fresh data from server after assignment
        await fetchFinalSampleResidents(true);
        await fetchTeamMembers(true);
      } catch (saveError) {
        toast.dismiss(savingToast);
        const errorMessage = saveError?.response?.data?.message ||
          saveError?.data?.message ||
          saveError?.message ||
          "Failed to save assignments to server.";
        toast.error(errorMessage);
      }

    } catch (error) {
      toast.dismiss(loadingToast);
      // Extract error message from API response
      const errorMessage = error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        "An error occurred while verifying assignments.";
      toast.error(errorMessage);
    }
  };

  // Confirm unassign resident
  const confirmUnassignResident = async () => {
    if (!residentToUnassign) return;

    const surveyId = currentSurveyId || storeSurveyId;
    if (!surveyId) {
      toast.error("Survey ID not found");
      return;
    }

    const loadingToast = toast.loading("Unassigning resident...");

    try {
      // Call the API to unassign the resident
      const payload = {
        surveyId: surveyId,
        generatedId: residentToUnassign.generatedId || residentToUnassign._id || residentToUnassign.id,
      };

      const response = await api.survey.removeTeamMemberInitialPool(payload);

      if (response.statusCode === 200 || response.success) {
        toast.dismiss(loadingToast);
        toast.success(`${residentToUnassign.name} has been unassigned successfully`);

        // SERVER-FIRST: Fetch fresh data from server after unassign
        await fetchFinalSampleResidents(true);
        await fetchTeamMembers(true);
      } else {
        throw new Error(response.message || "Failed to unassign resident");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.message || "Failed to unassign resident. Please try again.");
    } finally {
      setShowUnassignConfirmation(false);
      setResidentToUnassign(null);
    }
  };

  // Check if survey is closed
  const isSurveyClosed =
    surveyData?.surveyClosed ||
    surveyData?.surveyClosureSurvey?.surveyClosed ||
    surveyData?.surveyClosureSurvey?.surveyCompleted ||
    surveyData?.surveyCompleted ||
    false;

  // Get current user info
  const currentUser = getCurrentUser();
  const currentUserId = currentUser
    ? String(currentUser._id || currentUser.id)
    : null;
  const currentUserEmail = currentUser?.email;

  // Get all available residents directly from the store's finalSample (API data only)
  const allAvailableResidents = useMemo(() => {
    return (finalSample || [])
      .map((item) => item.resident)
      .filter((r) => r && r.id);
  }, [finalSample]);

  // Ref to track allAvailableResidents for use in effects without causing re-runs
  const allAvailableResidentsRef = useRef(allAvailableResidents);
  useEffect(() => {
    allAvailableResidentsRef.current = allAvailableResidents;
  }, [allAvailableResidents]);

  // Fetch team members from API - extracted as callable function for refetching
  const fetchTeamMembers = useCallback(async (silent = false) => {
    const surveyId = localStorage.getItem("currentSurveyId") || storeSurveyId;
    if (!surveyId) return;
    
    if (!silent) {
      setIsLoadingTeamMembers(true);
    }
    try {
      const response = await api.survey.viewTeamMembersInSurvey(surveyId);
      if (response && (response.success || response.status === true || response.statusCode === 200)) {
        const apiTeamMembers = response.data || [];
        
        // Map the API response to ensure consistent structure
        const mappedTeamMembers = apiTeamMembers.map((member) => {
          const memberId = member.teamMemberUserId || member._id || member.id;
          
          // API returns assignedResidents as array of objects: [{residentId, generatedId, name, room, assignedAt}]
          // Extract generatedId from each object for consistent ID usage
          const apiAssignedResidents = member.assignedResidents || [];
          const assignedResidentIds = apiAssignedResidents.map(item => {
            if (typeof item === 'object' && item !== null) {
              return String(item.generatedId || item.residentId || item._id || item.id);
            }
            return String(item);
          });
          
          return {
            id: member._id || member.id,
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
            // Use API assignedResidents directly (extracted IDs)
            assignedResidents: assignedResidentIds,
          };
        });
        setTeamMembers(mappedTeamMembers);
      }
    } catch (error) {
      // console.error("Error fetching team members:", error);
    } finally {
      if (!silent) {
        setIsLoadingTeamMembers(false);
      }
    }
  }, [storeSurveyId, setTeamMembers]);

  // Fetch team members on mount
  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  // Helper function to get current user's assigned residents
  const getCurrentUserAssignedResidents = () => {
    if (!currentUser || !isInvitedUser()) return [];

    const userId = String(currentUser._id || currentUser.id);
    const userEmail = currentUser.email;

    // Find current user in team members
    const teamMember = teamMembers.find(
      (member) =>
        (userId && String(member.id) === userId) ||
        (userEmail && member.email === userEmail)
    );

    if (teamMember && teamMember.assignedResidents) {
      return teamMember.assignedResidents.map((id) => String(id));
    }

    // Fallback: Check residents with assignedTeamMemberId matching current user
    const assignedById = allAvailableResidents
      .filter(
        (resident) =>
          resident.assignedTeamMemberId &&
          String(resident.assignedTeamMemberId) === userId
      )
      .map((resident) => String(resident.id));

    return assignedById;
  };

  // Filter residents based on user role using useMemo for reactivity
  // Team leads see all residents, team members see only assigned ones
  // Uses resident.assignedTeamMemberId directly from polled data for real-time updates
  const filteredResidents = useMemo(() => {
    // Team leads see all residents
    if (!isInvitedUser()) {
      return allAvailableResidents;
    }

    // Team members see only assigned residents
    const userId = String(currentUser?._id || currentUser?.id);
    const userEmail = currentUser?.email;

    return allAvailableResidents.filter((resident) => {
      // PRIMARY: Check if resident is assigned to current user via assignedTeamMemberId
      // This field is updated directly from server polling, ensuring real-time reactivity
      if (resident.assignedTeamMemberId) {
        return String(resident.assignedTeamMemberId) === userId;
      }

      // FALLBACK: Check team members' assignedResidents lists
      const teamMember = teamMembers.find(
        (member) =>
          (userId && String(member.id) === userId) ||
          (userEmail && member.email === userEmail)
      );

      if (teamMember?.assignedResidents) {
        return teamMember.assignedResidents.some(
          (residentId) => String(residentId) === String(resident.id)
        );
      }

      return false;
    });
  }, [allAvailableResidents, teamMembers, isInvitedUser, currentUser]);

  // Ref to track if we've already populated team members from residents
  const hasPopulatedTeamMembersRef = useRef(false);

  // Sync resident assignedTeamMemberId when team members assignments change
  // This ensures residents have the correct assignedTeamMemberId for real-time updates
  useEffect(() => {
    if (teamMembers.length === 0 || allAvailableResidents.length === 0) {
      return;
    }

    // Check if team members have assignment data (to avoid clearing assignments when loading from sources without assignment data)
    const hasTeamMemberAssignments = teamMembers.some(m => m.assignedResidents && m.assignedResidents.length > 0);
    const hasResidentAssignments = finalSample.some(item => item.resident?.assignedTeamMemberId);

    // If team members have no assignments but residents do, we likely loaded team members from a source
    // that doesn't include assignments (like getSurveyFirstPage). In this case, populate team members from residents.
    // Use ref to prevent infinite loop - only do this once
    if (!hasTeamMemberAssignments && hasResidentAssignments && !hasPopulatedTeamMembersRef.current) {
      hasPopulatedTeamMembersRef.current = true;
      const populatedTeamMembers = teamMembers.map((member) => {
        const memberId = String(member.id);
        const assignedResidentIds = finalSample
          .filter(
            (item) => String(item.resident?.assignedTeamMemberId) === memberId
          )
          .map((item) => String(item.resident.id));

        return {
          ...member,
          assignedResidents: assignedResidentIds,
        };
      });

      setTeamMembers(populatedTeamMembers);
      return;
    }

    // Reset the ref when team members have assignments (so it can repopulate if needed later)
    if (hasTeamMemberAssignments) {
      hasPopulatedTeamMembersRef.current = false;
    }

    // Update residents' assignedTeamMemberId based on team members' assignedResidents
    const updatedFinalSample = finalSample.map((item) => {
      const resident = item.resident;
      if (!resident || !resident.id) return item;

      // Find which team member has this resident assigned
      const assignedMember = teamMembers.find((member) =>
        member.assignedResidents?.some(
          (residentId) => String(residentId) === String(resident.id)
        )
      );

      // Only update if assignment changed
      if (assignedMember) {
        // Use teamMemberUserId - this is what the backend expects
        const newAssignedTeamMemberId = String(assignedMember.teamMemberUserId);
        if (String(resident.assignedTeamMemberId) !== newAssignedTeamMemberId) {
          return {
            ...item,
            resident: {
              ...resident,
              assignedTeamMemberId: newAssignedTeamMemberId,
            },
          };
        }
      } else if (resident.assignedTeamMemberId) {
        // Resident was unassigned - clear the assignment
        return {
          ...item,
          resident: {
            ...resident,
            assignedTeamMemberId: null,
          },
        };
      }

      return item;
    });

    // Check if any changes were made
    const hasChanges = updatedFinalSample.some((item, index) => {
      const originalResident = finalSample[index]?.resident;
      const updatedResident = item.resident;
      return (
        String(originalResident?.assignedTeamMemberId || "") !==
        String(updatedResident?.assignedTeamMemberId || "")
      );
    });

    // Only update if there are changes to avoid unnecessary re-renders
    if (hasChanges) {
      const surveyId = currentSurveyId || storeSurveyId;
      // Update store (single source of truth - API data only)
      setFinalSampleData(surveyId, {
        finalSample: updatedFinalSample,
        summary: summary,
        closedRecords: closedRecords,
      });

    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamMembers, finalSample.length]);

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
      // Check if any resident in finalSample has this assignedTeamMemberId
      const resident = allAvailableResidents.find(
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

  // Helper function to get assigned team member for a resident
  const getAssignedTeamMember = (resident) => {
    if (!resident || !teamMembers.length) return null;

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
      };
    }

    // If teamMemberUserId is just an ID string, look it up in teamMembers
    // The teamMemberUserId on residents matches the teamMemberUserId on team members (user's _id)
    if (resident.teamMemberUserId && typeof resident.teamMemberUserId === 'string') {
      const member = getTeamMemberById(teamMembers, resident.teamMemberUserId);
      if (member) {
        return member;
      }
    }

    // Check if resident has assignedTeamMemberId
    if (resident.assignedTeamMemberId) {
      const member = getTeamMemberById(teamMembers, resident.assignedTeamMemberId);
      if (member) {
        return member;
      }
    }

    // Check if resident is in any team member's assignedResidents list
    const assignedMember = teamMembers.find((member) =>
      member.assignedResidents?.some(
        (residentId) => String(residentId) === String(resident.id)
      )
    );

    return assignedMember || null;
  };

  // Validate survey ID on mount and when it changes
  useEffect(() => {
    if (currentSurveyId) {
      validateSurveyId(currentSurveyId);
    }
  }, [currentSurveyId, validateSurveyId]);

  // Helper function to convert API clinical category keys to readable display names
  const formatClinicalCategoryName = (key) => {
    // Convert camelCase to Title Case with spaces
    const formatted = key
      .replace(/([A-Z])/g, " $1") // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim();

    // Handle special cases for better readability
    const specialCases = {
      "Pressure Injuries Wounds": "Pressure Injuries & Wounds",
      "Falls With Injury": "Falls with Injury",
      "Psychotropic Medications": "Psychotropic Medications",
      "Behavioral Symptoms": "Behavioral Symptoms",
      "Weight Loss": "Weight Loss",
      "Catheter Use": "Catheter Use",
      "Physical Restraints": "Physical Restraints",
      "Antipsychotic Medications": "Antipsychotic Medications",
    };

    return specialCases[formatted] || formatted;
  };

  // Check if user has already generated final sample before proceeding
  const handleGenerateSampleClick = async () => {
    const surveyId = currentSurveyId || storeSurveyId;
    
    if (!surveyId) {
      toast.error("Survey ID not found", {
        description: "Please select a survey first.",
        duration: 5000,
      });
      return;
    }

    setIsCheckingGeneration(true);
    try {
      const response = await api.survey.surveyCheck(surveyId);
      
      if (response.status && response.statusCode === 200 && response.data) {
        const { finalSample } = response.data;
        
        if (finalSample) {
          // User has already generated final sample - show confirmation modal
          setShowOverrideModal(true);
        } else {
          // No existing final sample - proceed directly
          await generateFinalSample();
        }
      } else {
        // If check fails, proceed anyway (fail-safe)
        await generateFinalSample();
      }
    } catch (error) {
      // If API fails, proceed with generation (fail-safe)
      
      await generateFinalSample();
    } finally {
      setIsCheckingGeneration(false);
    }
  };

  // Handle confirmation to override existing data
  const handleConfirmOverride = async () => {
    setShowOverrideModal(false);
    await generateFinalSample();
  };

  // Generate final sample using the generateFinalSample API endpoint
  // SERVER-FIRST: Server response completely replaces local data
  const generateFinalSample = async () => {
    const surveyId = currentSurveyId || storeSurveyId;

    if (!surveyId) {
      toast.error("Survey ID not found", {
        description: "Please select a survey first.",
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // SERVER-FIRST: Clear store data before fetching to ensure no stale data
    setHasUnsavedChanges(false);
    clearData(); // Clear Zustand store to ensure no stale data persists

    try {
      const response = await healthAssistantAPI.getFinalSampleSelection(surveyId);

      if ((response.success || response.statusCode === 200) && response.data) {
        // Process the generated sample data
        const data = response.data;

        // Extract residents and risk summary from the response
        const rawResidents = data.finalSample || [];
        const riskSummary = data.riskSummary || [];

        // Transform residents to match expected format
        const formattedFinalSample = rawResidents.map((resident) => {
          let assignedTeamMemberId = null;
          if (resident.teamMemberUserId) {
            if (typeof resident.teamMemberUserId === 'object') {
              assignedTeamMemberId = resident.teamMemberUserId._id || resident.teamMemberUserId.id;
            } else {
              assignedTeamMemberId = resident.teamMemberUserId;
            }
          } else if (resident.assignedTeamMemberId) {
            assignedTeamMemberId = resident.assignedTeamMemberId;
          }

          return {
            resident: {
              ...resident,
              id: resident._id,
              generatedId: resident.generatedId,
              selectionReason: resident.notes || "",
              patientNeeds: Array.isArray(resident.risks)
                ? resident.risks.map((r) => r.name)
                : [],
              assignedTeamMemberId: assignedTeamMemberId,
            },
            reason: resident.notes || "",
          };
        });

        // Transform risk summary to clinical categories
        const clinicalCategories = riskSummary.reduce((acc, item) => {
          if (item.riskName && item.residentCount !== undefined) {
            acc[item.riskName] = item.residentCount;
          }
          return acc;
        }, {});

        const totalResidents = rawResidents.length;
        const finalSampleSize = rawResidents.filter((r) => r.included).length;

        const formattedData = {
          finalSample: formattedFinalSample,
          summary: {
            totalResidents,
            finalSampleSize,
            clinicalCategories,
          },
          closedRecords: [],
        };

        // SERVER-FIRST: Update store only (single source of truth)
        setFinalSampleData(surveyId, formattedData);

        // Data came from server, so no unsaved changes
        setHasUnsavedChanges(false);

        // Auto-save the generated sample to persist it
        try {
          await handleSampleSelectionSubmit(false, formattedData.finalSample);
          toast.success("Sample generated and saved successfully", {
            description: `Generated and saved ${rawResidents.length} residents for the final sample.`,
            duration: 3000,
          });
        } catch (saveError) {
          // Still show success for generation even if save fails
          toast.success("Sample generated successfully", {
            description: `Generated ${rawResidents.length} residents for the final sample.`,
            duration: 3000,
          });
          toast.warning("Could not auto-save the sample. Please save manually.", {
            duration: 4000,
          });
        }
      } else {
        const errorMessage = response.message || "Failed to generate final sample";
        setError(errorMessage);
        toast.error("Generation failed", {
          description: errorMessage,
          duration: 5000,
        });
      } 
    } catch (error) {
      // console.error("Error generating final sample:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to generate final sample";
      setError(errorMessage);
      toast.error("Error generating sample", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFinalSampleResidents = async (isBackgroundSync = false) => {
    const surveyId = currentSurveyId || storeSurveyId;

    if (!surveyId) {
      if (!isBackgroundSync) {
        toast.error("Survey ID not found", {
          description: "Please select a survey first.",
          duration: 5000,
        });
      }
      return;
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return;
    }
    isFetchingRef.current = true;

    // Only show loading for initial fetch, not background sync
    if (!isBackgroundSync) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const response = await api.survey.getFinalSample(
        surveyId
      );

      if (response.statusCode === 200 && response.data) {
        const responseData = response.data;
        let formattedData = {};

        // Determine structure type
        let rawResidents = [];
        let riskSummary = [];
        let surveyInfo = {};

        if (Array.isArray(responseData.finalSampleData)) {
          // Structure from user's JSON
          rawResidents = responseData.finalSampleData;
          riskSummary = Array.isArray(responseData.riskResidentCount) ? responseData.riskResidentCount : [];
          surveyInfo = responseData.surveyData || {};
        } else if (Array.isArray(responseData.finalSample)) {
          // Alternative structure
          rawResidents = responseData.finalSample;
          riskSummary = Array.isArray(responseData.riskSummary) ? responseData.riskSummary : [];
          surveyInfo = responseData;
        }

        if (rawResidents.length > 0 || Array.isArray(responseData.finalSampleData) || Array.isArray(responseData.finalSample)) {
          // Transform residents
          const formattedFinalSample = rawResidents.map((resident) => {
            let assignedTeamMemberId = null;
            if (resident.teamMemberUserId) {
              if (typeof resident.teamMemberUserId === 'object') {
                assignedTeamMemberId = resident.teamMemberUserId._id || resident.teamMemberUserId.id;
              } else {
                assignedTeamMemberId = resident.teamMemberUserId;
              }
            } else if (resident.assignedTeamMemberId) {
              assignedTeamMemberId = resident.assignedTeamMemberId;
            }

            return {
              resident: {
                ...resident,
                id: resident._id,
                selectionReason: resident.notes || "",
                patientNeeds: Array.isArray(resident.risks)
                  ? resident.risks.map((r) => r.name)
                  : [],
                assignedTeamMemberId: assignedTeamMemberId,
              },
              reason: resident.notes || "",
            };
          });

          // Transform risk summary
          const clinicalCategories = riskSummary.reduce((acc, item) => {
            if (item.riskName && item.residentCount !== undefined) {
              acc[item.riskName] = item.residentCount;
            }
            return acc;
          }, {});

          const totalResidents = rawResidents.length;
          const finalSampleSize = rawResidents.filter((r) => r.included).length;

          // Extract census and target
          const census = parseInt(surveyInfo.census || responseData.census || 0, 10);

          let targetFinalSampleSize = 0;
          if (surveyInfo.finalSample && !isNaN(parseInt(surveyInfo.finalSample, 10))) {
            targetFinalSampleSize = parseInt(surveyInfo.finalSample, 10);
          } else if (surveyInfo.targetFinalSampleSize) {
            targetFinalSampleSize = parseInt(surveyInfo.targetFinalSampleSize, 10);
          } else if (responseData.targetFinalSampleSize) {
            targetFinalSampleSize = parseInt(responseData.targetFinalSampleSize, 10);
          } else if (responseData.targetSample) {
            targetFinalSampleSize = parseInt(responseData.targetSample, 10);
          }

          formattedData = {
            finalSample: formattedFinalSample,
            summary: {
              totalResidents,
              finalSampleSize,
              targetFinalSampleSize,
              census,
              clinicalCategories,
            },
            closedRecords: responseData.closedRecords || [],
          };
        } else {
          formattedData = responseData;
        }

        // Fallback: If census or target is missing, try to fetch from survey details
        if ((!formattedData.summary?.census || !formattedData.summary?.targetFinalSampleSize) && surveyId) {
          try {
            const surveyResponse = await api.survey.getSurveyFirstPage(surveyId);
            if (surveyResponse?.data) {
              if (!formattedData.summary) formattedData.summary = {};
              if (!formattedData.summary.census) formattedData.summary.census = surveyResponse.data.census || 0;
              if (!formattedData.summary.targetFinalSampleSize) formattedData.summary.targetFinalSampleSize = surveyResponse.data.targetSample || 0;
            }
          } catch (err) {
            // Ignore errors here, as this is just a fallback
          }
        }

        // SERVER-FIRST: Always use server data directly (no merging with local data)
        // Update team members' assignedResidents based on server residents
        if (teamMembers.length > 0) {
          const serverFinalSample = formattedData.finalSample || [];
          const updatedTeamMembers = teamMembers.map(member => {
            const memberId = member.teamMemberUserId || member.id || member._id;
            // Find all residents assigned to this team member
            const assignedResidentIds = serverFinalSample
              .filter(item => {
                const residentTeamMemberId = item.resident?.assignedTeamMemberId || item.resident?.teamMemberUserId;
                if (!residentTeamMemberId) return false;
                const normalizedResidentTmId = typeof residentTeamMemberId === 'object' 
                  ? (residentTeamMemberId._id || residentTeamMemberId.id) 
                  : residentTeamMemberId;
                return String(normalizedResidentTmId) === String(memberId);
              })
              .map(item => String(item.resident?.id || item.resident?.generatedId));
            
            return {
              ...member,
              assignedResidents: assignedResidentIds
            };
          });
          setTeamMembers(updatedTeamMembers);
        }

        // Update store with server data
        setFinalSampleData(surveyId, formattedData);

        // Show success toast
        if (isBackgroundSync) {
          toast.success("Sample data synced", {
            description: `Synced ${formattedData.finalSample?.length || 0} residents`,
            duration: 2000,
          });
        } else {
          toast.success("Final sample loaded successfully", {
            description: `Loaded ${formattedData.finalSample?.length || 0} residents`,
            duration: 3000,
          });
        }
      }
    } catch (error) {
      if (!isBackgroundSync) {
        const errorMessage =
          error.message || "Please check your connection and try again.";
        setError(errorMessage);
        toast.error("Failed to load final sample residents", {
          description: errorMessage,
          duration: 5000,
        });
      }
    } finally {
      isFetchingRef.current = false;
      if (!isBackgroundSync) {
        setIsLoading(false);
      }
    }
  };

  // Fetch initial data on mount
  useEffect(() => {
    const initData = async () => {
      const surveyId = currentSurveyId || storeSurveyId;
      if (!surveyId) return;

      // Team members are now fetched via the dedicated viewTeamMembersInSurvey API
      // in the useEffect above, so we only need to fetch final sample here

      // Always fetch fresh final sample to ensure assignments are up to date
      fetchFinalSampleResidents();
    };

    initData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSurveyId, storeSurveyId]);

  // handleSampleSelectionSubmit now accepts an optional finalSampleOverride parameter
  // This allows passing updated data directly without waiting for store to update
  const handleSampleSelectionSubmit = async (isContinueClicked = false, finalSampleOverride = null) => {
    const surveyId =
      surveyData?.surveyId ||
      surveyData?.id ||
      surveyData?._id ||
      currentSurveyId ||
      storeSurveyId ||
      localStorage.getItem("currentSurveyId");

    if (!surveyId) {
      toast.error("Survey ID not found. Please refresh and try again.", {
        position: "top-right",
      });
      return;
    }

    // Use override if provided, otherwise use store's finalSample
    const sampleToSubmit = finalSampleOverride || finalSample;

    // Validation - ensure we have a final sample
    const hasFinalSample = sampleToSubmit.length > 0;

    if (!hasFinalSample) {
      if (isContinueClicked) {
        toast.warning(
          "Please finalize the resident sample before proceeding.",
          {
            position: "top-right",
          }
        );
      }
      return;
    }

    setIsSubmitting(true);
    isContinueClicked &&
      toast.loading("Saving sample selection data...", {
        position: "top-right",
      });

    try {
      // Prepare residents array matching the required payload structure
      
      const residents = sampleToSubmit.map((item) => {
        const resident = item.resident;

        // Reconstruct risks if needed (ensure it's an array of objects)
        let risks = resident.risks;
        if (!risks && resident.patientNeeds) {
          risks = resident.patientNeeds.map(name => ({ name }));
        }

        // Get teamMemberUserId - ensure we have a valid value
        const teamMemberUserId = resident.assignedTeamMemberId || resident.teamMemberUserId || null;

        return {
          ...resident,
          // Ensure generatedId is present
          generatedId: resident.generatedId || resident._id || resident.id,
          // Map assignedTeamMemberId to teamMemberUserId for API
          teamMemberUserId: teamMemberUserId,
          // Ensure risks is in correct format
          risks: risks || [],
          // Ensure included is true
          included: true,
          // Add notes/reason
          notes: item.reason || resident.notes || "",
          // Ensure surveyId is present
          surveyId: surveyId,
        };
      });

      // Debug: Log residents with assignments to verify teamMemberUserId is set
      const assignedResidents = residents.filter(r => r.teamMemberUserId);
      if (assignedResidents.length > 0) {
       // console.log("Residents with team member assignments:", assignedResidents);
      }

      // Prepare riskSummary array
      const riskSummary = summary?.clinicalCategories
        ? Object.entries(summary.clinicalCategories).map(([riskName, residentCount]) => ({
          riskName,
          residentCount
        }))
        : [];

      // Prepare sample selection payload
      const sampleSelectionPayload = {
        surveyId,
        status: "sample-selection",
        residents,
        riskSummary
      };

      // Check if online before making API call
      if (!navigator.onLine) {
        // Save offline and inform user
        const saveOfflineData = async (payload) => {
          try {
            const offlineData = {
              ...payload,
              submittedAt: new Date().toISOString(),
              apiEndpoint: "saveFinalSampleSelection", // Store which API to call
            };

            // Step 1: Save to IndexedDB sync queue (permanent storage)
            let syncQueueId = null;
            if (payload.surveyId) {
              const stepId = payload.currentStep || "sample-selection";
              const syncItem = await surveyIndexedDB.addToSyncQueue(
                payload.surveyId,
                stepId,
                offlineData,
                "api_final_sample_selection" // type for API-based final sample selection
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
              surveySyncService.syncUnsyncedData(payload.surveyId).catch(
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

        await saveOfflineData(sampleSelectionPayload);
        setHasUnsavedChanges(false);
        toast.dismiss();
        toast.success("Internet connectivity issues detected. Data saved offline and will sync when connection is restored.", {
          position: "top-right",
          duration: 5000,
        });
        setIsSubmitting(false);
        return; // Exit early - data is saved offline
      }

      // Submit the step data (only if online)
      const response = await api.healthAssistant.saveFinalSampleSelection(
        sampleSelectionPayload
      );

      if (response.statusCode === 200 || response.success) {
        setHasUnsavedChanges(false);
        toast.dismiss();

        if (isContinueClicked) {
          toast.success(
            "Sample selection data saved successfully!",
            {
              position: "top-right",
              duration: 5000,
            }
          );
          // Note: Navigation would be handled by parent component if needed
          setCurrentStep(6);
        } else {
          toast.success("Progress saved successfully!", {
            position: "top-right",
            duration: 3000,
          });
        }
      } else {
        throw new Error(
          response.message || "Failed to save sample selection data"
        );
      }
    } catch (error) {
      toast.dismiss();
      toast.error(
        error.message ||
        "Failed to save sample selection data. Please try again.",
        { position: "top-right", duration: 5000 }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Header Section */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                Final Sample Residents
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Manage and review your final sample selection
              </p>
            </div> 
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
               {!isInvitedUser() && (
                <Button
                  onClick={handleGenerateSampleClick}
                  disabled={isLoading || isCheckingGeneration}
                  className="flex-1 sm:flex-none bg-[#065B7D] hover:bg-[#054d63] text-white text-sm"
                > 
                  {isCheckingGeneration ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Checking...</span>
                      <span className="sm:hidden">Checking</span>
                    </>
                  ) : isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Generating...</span>
                      <span className="sm:hidden">Generating</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Generate Sample</span>
                      <span className="sm:hidden">Generate</span>
                    </>
                  )}
                </Button>
              )}
              {/* Sync button for fetching saved sample selection data */}
            
             
              {!isInvitedUser() && (
                <Button
                  onClick={() => setShowReassignmentModal(true)}
                  className="flex-1 sm:flex-none bg-[#065B7D] hover:bg-[#054d63] text-white text-sm"
                  disabled={finalSample.length === 0}
                >
                  <Users className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Assign Residents</span>
                  <span className="sm:hidden">Assign</span>
                </Button>
              )}
                <Button
                onClick={async () => {
                  setIsSyncingData(true);
                  await fetchFinalSampleResidents(false);
                  setIsSyncingData(false);
                }}
                disabled={isSyncingData || isLoading}
                className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm bg-sky-800 text-white rounded-md font-medium hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {isSyncingData && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSyncingData ? 'Syncing...' : 'Sync Sample Data'}
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-600 mx-auto mb-4" />
              <p className="text-base font-medium text-gray-900">
                Loading Final Sample Residents...
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Please wait while we fetch the data
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-gray-50 border-l-4 border-gray-400 rounded-lg p-4 sm:p-5 mb-4 sm:mb-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">
                  Error Loading Data
                </h3>
                <p className="text-xs sm:text-sm text-gray-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        {(finalSample.length > 0 || summary) && !isLoading && (
          <div className="space-y-4 sm:space-y-6">
            {/* Summary Stats - Compact */}
            {summary && Object.keys(summary).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white border border-gray-200 p-3 sm:p-4">
                  <p className="text-xs text-gray-600 mb-1">
                    {isInvitedUser() ? "My Assigned Residents" : "Total Residents"}
                  </p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900">
                    {isInvitedUser() ? filteredResidents.length : (summary.totalResidents || 0)}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 p-3 sm:p-4">
                  <p className="text-xs text-gray-600 mb-1">Sample Size</p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900">
                    {isInvitedUser() ? filteredResidents.length : (summary.finalSampleSize || 0)}
                  </p>
                </div>

                <div className="bg-white border border-gray-200 p-3 sm:p-4">
                  <p className="text-xs text-gray-600 mb-1">Census</p>
                  <p className="text-lg sm:text-xl font-semibold text-gray-900">
                    {summary.census || 0}
                  </p>
                </div>
              </div>
            )}

            {/* Critical Element Pathway Coverage */}
            {summary?.clinicalCategories && Object.keys(summary.clinicalCategories).length > 0 && (
              <div className="p-4 sm:p-6">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">
                  Critical Element Pathway Coverage
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
                  {Object.entries(summary.clinicalCategories).map(
                    ([key, count]) => {
                      const displayName = formatClinicalCategoryName(key);
                      const hasResidents = count > 0;

                      return (
                        <div key={key} className="p-3">
                          <div className="mb-1">
                            <span
                              className={`text-sm font-semibold ${hasResidents ? "text-red-600" : "text-gray-900"
                                }`}
                            >
                              {displayName}
                            </span>
                          </div>
                          <div
                            className={`text-xs ${hasResidents ? "text-red-600" : "text-gray-600"
                              }`}
                          >
                            {count} resident{count !== 1 ? "s" : ""} flagged
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* Final Sample Residents Grid */}
            {filteredResidents.length > 0 && (
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">
                  {isInvitedUser() ? "My Assigned Residents" : "All Residents"}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {filteredResidents.map((resident, index) => {
                    const patientNeeds = resident.patientNeeds || [];
                    const assignedTeamMember = getAssignedTeamMember(resident);

                    return (
                      <div
                        key={resident.id || index}
                        className="bg-white border border-gray-200 p-4 sm:p-5 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex flex-col">
                          <div className="text-base font-semibold text-blue-600 mb-1">
                            {resident.name || "Unknown Resident"}
                          </div>
                          {resident.room && (
                            <div className="text-xs text-gray-600 mb-1">
                              Room {resident.room}
                            </div>
                          )}
                          {resident.admissionDate && (
                            <div className="text-xs text-gray-500 mb-2">
                              {resident.admissionDate}
                            </div>
                          )}
                          {patientNeeds.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 mb-2">
                              {patientNeeds.slice(0, 3).map((need, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs bg-gray-100 text-gray-700 border-gray-200"
                                >
                                  {need}
                                </Badge>
                              ))}
                              {patientNeeds.length > 3 && (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-gray-100 text-gray-700 border-gray-200 cursor-pointer hover:bg-gray-200"
                                    >
                                      +{patientNeeds.length - 3} more
                                    </Badge>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto max-w-xs p-3">
                                    <div className="text-xs">
                                      <p className="font-medium text-gray-900 mb-2">Additional Risk Areas:</p>
                                      <ul className="list-disc pl-3 space-y-1 text-gray-700">
                                        {patientNeeds.slice(3).map((need, idx) => (
                                          <li key={idx}>{need}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                          )}
                          <div className="mt-1">
                            {assignedTeamMember ? (
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-xs text-gray-500">
                                    Assigned to:{" "}
                                  </span>
                                  <Badge className="text-xs bg-[#065B7D] text-white border-0">
                                    {assignedTeamMember.name}
                                  </Badge>
                                </div>
                                {!isInvitedUser() && !isSurveyClosed && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-100 ml-2 bg-red-50 cursor-pointer"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleUnassignResident(resident);
                                    }}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            ) : (
                              !isInvitedUser() && (
                                <span className="text-xs text-gray-400 italic">
                                  Not assigned
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {
              filteredResidents.length === 0 && (
                <div className="bg-white p-6 sm:p-12 text-center">
                  Kindly generate the final sample to view residents included in your survey.
                </div>
              )
            }

            {/* Empty State for Team Members with No Assigned Residents */}
            {isInvitedUser() &&
              filteredResidents.length === 0 &&
              finalSample.length > 0 && (
                <div className="bg-white border border-gray-200 p-6 sm:p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                      No Assigned Residents
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      You don't have any residents assigned to you yet. Please
                      contact your team lead for assignments.
                    </p>
                  </div>
                </div>
              )}

            {/* Empty State */}
            {finalSample.length === 0 && !isLoading && !summary && (
              <div className="bg-white border border-gray-200 p-6 sm:p-12 text-center">
                <div className="max-w-md mx-auto">
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                    {isInvitedUser() ? "No Assigned Residents" : "No residents found"}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
                    {isInvitedUser()
                      ? "You don't have any residents assigned to you yet. Please contact your team lead for assignments."
                      : "Generate the final sample to view residents included in your survey."}
                  </p>
                  {!isInvitedUser() && (
                    <Button
                      onClick={handleGenerateSampleClick}
                      disabled={isCheckingGeneration}
                      className="w-full sm:w-auto bg-[#065B7D] hover:bg-[#054d63] text-white text-sm"
                    >
                      {isCheckingGeneration ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      {isCheckingGeneration ? "Checking..." : "Generate Sample"}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resident Reassignment Modal */}
      <ResidentAssignmentModal
        isOpen={showReassignmentModal}
        onClose={() => setShowReassignmentModal(false)}
        residents={allAvailableResidents}
        allResidents={allAvailableResidents}
        teamMembers={teamMembers}
        localTeamMembers={teamMembers}
        onBulkAssignment={handleBulkAssignment}
        onUnassignResident={handleUnassignResident}
        isDisabled={isInvitedUser() || isSurveyClosed}
        title="Assign Residents to Team Members"
        surveyId={currentSurveyId || storeSurveyId}
      />

      {/* Confirm Override Modal */}
      <ConfirmOverrideModal
        isOpen={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        onConfirm={handleConfirmOverride}
        title="Final Sample Already Generated"
        message="You have already generated a final sample for this survey. Generating again will override your current data including any assignments. Are you sure you want to proceed?"
        confirmText="Yes, Generate Again"
        isLoading={isLoading}
        variant="warning"
      />

      {/* Navigation Buttons */}

      {!isInvitedUser() && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-40 flex gap-2 sm:gap-4">
          <Button
            onClick={() => {
              if (hasUnsavedChanges) {
                setShowExitWarning(true);
              } else {
                setCurrentStep(4);
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
              handleSampleSelectionSubmit(true);
            }}
            disabled={isSubmitting || isPageClosed || isSurveyClosed}
            className="flex-1 sm:flex-none h-11 sm:h-12 px-4 sm:px-8 bg-[#065B7D] hover:bg-[#054d63] text-white text-sm sm:text-base font-medium disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Saving...</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Continue to Investigations</span>
                <span className="sm:hidden">Continue</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Floating Save Button */}
      {!isInvitedUser() && (
        <div className="fixed bottom-[100px]  right-6 z-40 flex flex-col items-end gap-2">
          <Button
            onClick={() => {
              handleSampleSelectionSubmit(false);
            }}
            disabled={isSubmitting || isPageClosed}
            className="h-11 sm:h-12 px-4 sm:px-6 bg-[#065B7D] hover:bg-[#054d63] text-white text-sm sm:text-base font-medium disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full shadow-lg flex items-center gap-2 hover:shadow-xl transition-all"
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
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:hidden" />
                <span className="hidden sm:inline">Save Progress</span>
                <span className="sm:hidden">Save</span>
              </>
            )}
          </Button>
         
        </div>
      )}

      {/* Invited User Floating Buttons */}
      {isInvitedUser() && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-40 flex flex-col items-end gap-2 sm:gap-4">
          <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
            <Button
              onClick={() => {
                setCurrentStep(4);
              }}
              className="flex-1 sm:flex-none h-11 sm:h-12 px-4 sm:px-8 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-sm sm:text-base font-medium rounded-full shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all"
              size="lg"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <Button
              onClick={() => {
                setCurrentStep(6);
              }}
              className="flex-1 sm:flex-none h-11 sm:h-12 px-4 sm:px-8 bg-[#065B7D] hover:bg-[#054d63] text-white text-sm sm:text-base font-medium rounded-full shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all"
              size="lg"
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
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

      {/* Unsaved Changes Warning Modal */}
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
          await handleSampleSelectionSubmit(false);
          setShowExitWarning(false);
          if (pendingNavigation?.type === 'browser') {
            // We are already at the "previous" state due to popstate
            // Go back one more to actually leave
            window.history.back();
          } else {
            setCurrentStep(4);
          }
          setPendingNavigation(null);
        }}
      />

      {/* Floating Home Button */}
      <FloatingHomeButton
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={() => handleSampleSelectionSubmit(false)}
        onClearUnsavedChanges={() => setHasUnsavedChanges(false)}
      />
    </div>
  );
};

export default SampleSelection;
