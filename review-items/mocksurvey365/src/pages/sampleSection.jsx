import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import api, { surveySocketService } from "../service/api";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
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
import useFinalSampleStore from "../stores/useFinalSampleStore";
import {
  isInvitedUser,
  getCurrentUser,
} from "../utils/investigations/investigationHelpers";

const SampleSection = () => {
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
  } = useFinalSampleStore();

  // Resident Assignment Modal state
  const [showReassignmentModal, setShowReassignmentModal] = useState(false);
  const [
    selectedResidentsForBulkAssignment,
    setSelectedResidentsForBulkAssignment,
  ] = useState(new Set());
  const [bulkAssignmentTeamMember, setBulkAssignmentTeamMember] = useState("");
  const [selectedResidentForDetails, setSelectedResidentForDetails] =
    useState(null);
  const [assignmentWarning, setAssignmentWarning] = useState(null);

  // Team members state
  const [teamMembers, setTeamMembers] = useState([]);

  // Survey data state (from view_survey_wizard)
  const [surveyData, setSurveyData] = useState(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPageClosed, setIsPageClosed] = useState(false);

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

  // Get all available residents from final sample
  const allAvailableResidents = finalSample
    .map((item) => item.resident)
    .filter((r) => r && r.id);

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

  // Filter residents based on user role
  // Team leads see all residents, team members see only assigned ones
  const getFilteredResidents = () => {
    // Team leads see all residents
    if (!isInvitedUser()) {
      return allAvailableResidents;
    }

    // Team members see only assigned residents
    const assignedResidentIds = getCurrentUserAssignedResidents();
    const userId = String(currentUser?._id || currentUser?.id);

    return allAvailableResidents.filter((resident) => {
      const residentId = String(resident.id);

      // Check if resident is assigned to current user via assignedTeamMemberId
      if (
        resident.assignedTeamMemberId &&
        String(resident.assignedTeamMemberId) === userId
      ) {
        return true;
      }

      // Check if resident ID is in assigned residents list
      return assignedResidentIds.includes(residentId);
    });
  };

  // Get filtered residents for display
  const filteredResidents = getFilteredResidents();

  // Sync resident assignedTeamMemberId when team members assignments change
  // This ensures residents have the correct assignedTeamMemberId for real-time updates
  useEffect(() => {
    if (teamMembers.length === 0 || allAvailableResidents.length === 0) {
      return;
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
        const newAssignedTeamMemberId = String(assignedMember.id);
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
      setFinalSampleData(surveyId, {
        finalSample: updatedFinalSample,
        summary: summary,
        closedRecords: closedRecords,
      });

    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamMembers, finalSample.length]);

  // Helper function to get assigned team member for a resident
  const getAssignedTeamMember = (resident) => {
    if (!resident || !teamMembers.length) return null;

    // Check if resident has assignedTeamMemberId
    if (resident.assignedTeamMemberId) {
      const member = teamMembers.find(
        (m) => String(m.id) === String(resident.assignedTeamMemberId)
      );
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

  // Get current survey ID from localStorage
  const currentSurveyId = localStorage.getItem("currentSurveyId");

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

  const fetchFinalSampleResidents = async () => {
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

    try {
      const response = await api.healthAssistant.getFinalSampleSelection(
        surveyId
      );

      if (response.success && response.data) {
        setFinalSampleData(surveyId, response.data);

        toast.success("Final sample loaded successfully", {
          description: `Loaded ${response.data.finalSample?.length || 0
            } residents`,
          duration: 3000,
        });
      } else {
        throw new Error(response.message || "Failed to load final sample");
      }
    } catch (error) {
      const errorMessage =
        error.message || "Please check your connection and try again.";
      setError(errorMessage);
      toast.error("Failed to load final sample residents", {
        description: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get current user ID for socket connection (already defined above, reuse)
  const socketDataTimeoutRef = useRef(null);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const surveyId = currentSurveyId || storeSurveyId;

    // Only connect if we have both surveyId and userId
    if (!surveyId || !currentUserId) {
      return;
    }

    // Connect if not already connected
    if (!surveySocketService.isConnected()) {
      surveySocketService.connect(surveyId, currentUserId);
    }

    // Define handlers first before setting up listeners
    const handleSocketConnect = () => {

      const socket = surveySocketService.getSocket();
      if (socket && socket.connected) {
        // Join view survey wizard room
        socket.emit("join_view_survey_wizard", {
          surveyId: surveyId,
          userId: currentUserId,
        });

        // Join invite team members room to receive assignment broadcasts
        // Message format: surveyId, name, email, role, assignedFacilityTasks, SignedInUserId, assignedResidents, teamMemberId
        const currentUser = getCurrentUser();
        if (currentUser) {
          // Find current user in team members (if available)
          const currentTeamMember = teamMembers.find(
            (member) =>
              String(member.id) === String(currentUserId) ||
              member.email === currentUser.email
          );

          // Emit join_invite_team_members to join the room for receiving broadcasts
          socket.emit("join_invite_team_members", {
            surveyId: surveyId,
            name: currentTeamMember?.name || currentUser.name || "",
            email: currentTeamMember?.email || currentUser.email || "",
            role: currentTeamMember?.role || "",
            assignedFacilityTasks: currentTeamMember?.assignedFacilityTasks || [],
            assignedResidents: currentTeamMember?.assignedResidents || [],
            teamMemberId: currentTeamMember?.id || currentUserId,
            SignedInUserId: currentUserId,
          });
        }
      }
    };

    // Listen for view_survey_wizard messages to update final sample data in real-time
    const handleViewSurveyWizard = (message) => {
      try {
        // Handle message - it can be an object or array
        let dataToProcess = message;

        // If message has data property, use that
        if (message?.data) {
          dataToProcess = message.data;
        }

        if (dataToProcess && dataToProcess._id) {
          const currentSurveyId = localStorage.getItem("currentSurveyId");

          // Only process if it's for current survey
          if (
            dataToProcess._id !== currentSurveyId &&
            dataToProcess.surveyId !== currentSurveyId
          ) {
            return;
          }

          // Update team members if they exist in the response
          if (
            dataToProcess.teamMembers &&
            Array.isArray(dataToProcess.teamMembers)
          ) {
            const formattedTeamMembers = dataToProcess.teamMembers.map(
              (member) => ({
                id: String(member.id || member._id),
                name: member.name || "",
                email: member.email || "",
                role: member.role || "",
                assignedFacilityTasks: member.assignedFacilityTasks || [],
                assignedResidents: member.assignedResidents || [],
                updatedAt: member.updatedAt || new Date().toISOString(),
              })
            );

            setTeamMembers(formattedTeamMembers);

          }

          // Store full survey data for use in handleSampleSelectionSubmit
          setSurveyData(dataToProcess);

          // Update finalSampleSurvey data if it exists in the response
          if (dataToProcess.finalSampleSurvey?.finalSample) {
            const finalSampleData = dataToProcess.finalSampleSurvey.finalSample;

            // Extract final sample array and summary from the data
            const residentDetails = finalSampleData.residentDetails || [];
            const finalSampleArray = residentDetails.map((resident) => ({
              resident: resident,
              reason: resident.selectionReason || "",
            }));

            // Update store with new data
            const updatedData = {
              finalSample: finalSampleArray,
              summary: finalSampleData.summary || null,
              closedRecords: finalSampleData.closedRecords || [],
            };

            setFinalSampleData(surveyId, updatedData);


          }

          // Update page closed status
          if (dataToProcess.finalSampleSurvey?.isPageClosed !== undefined) {
            setIsPageClosed(dataToProcess.finalSampleSurvey.isPageClosed);
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
      }
    };


    const handleInviteTeamMembers = (message) => {
      try {
        const currentSurveyId = localStorage.getItem("currentSurveyId");
        const freshUser = getCurrentUser();
        const freshUserId = freshUser
          ? String(freshUser._id || freshUser.id)
          : null;

        // Verify message is for current survey
        if (message?.surveyId !== currentSurveyId) {
          return;
        }

        // Handle direct socket message format with team member assignment data
        if (message?.teamMemberId && message?.assignedResidents !== undefined) {
          // Update team members state immediately
          setTeamMembers((currentTeamMembers) => {
            const memberExists = currentTeamMembers.some(
              (m) =>
                String(m.id) === String(message.teamMemberId) ||
                m.email === message.email
            );

            if (!memberExists && currentTeamMembers.length === 0) {
              // No members exist, create new array
              return [
                {
                  id: String(message.teamMemberId),
                  name: message.name || "",
                  email: message.email || "",
                  role: message.role || "",
                  assignedFacilityTasks: message.assignedFacilityTasks || [],
                  assignedResidents: message.assignedResidents || [],
                  updatedAt: new Date().toISOString(),
                },
              ];
            } else {
              // Update existing member or add new one
              let updatedTeamMembers = currentTeamMembers.map((member) => {
                if (
                  String(member.id) === String(message.teamMemberId) ||
                  member.email === message.email
                ) {
                  return {
                    ...member,
                    assignedResidents: message.assignedResidents || [],
                    assignedFacilityTasks:
                      message.assignedFacilityTasks ||
                      member.assignedFacilityTasks,
                    name: message.name || member.name,
                    email: message.email || member.email,
                    role: message.role || member.role,
                    updatedAt: new Date().toISOString(),
                  };
                }
                return member;
              });

              // If member doesn't exist, add them
              if (!memberExists) {
                updatedTeamMembers.push({
                  id: String(message.teamMemberId),
                  name: message.name || "",
                  email: message.email || "",
                  role: message.role || "",
                  assignedFacilityTasks: message.assignedFacilityTasks || [],
                  assignedResidents: message.assignedResidents || [],
                  updatedAt: new Date().toISOString(),
                });
              }

              return updatedTeamMembers;
            }
          });

          // Check if this update is for the current user (team member)
          const isForCurrentUser =
            freshUserId &&
            (String(message.teamMemberId) === freshUserId ||
              message.email === freshUser?.email);

          if (isForCurrentUser && isInvitedUser()) {
            // Update assigned residents for current user
          }


        }
      } catch (error) {
        // eslint-disable-next-line no-console
      }
    };


    surveySocketService.on("connect", handleSocketConnect);
    surveySocketService.on("view_survey_wizard", handleViewSurveyWizard);
    surveySocketService.on("invite_team_members", handleInviteTeamMembers);


    const setupDirectSocketListeners = () => {
      const socket = surveySocketService.getSocket();
      if (socket) {
        // Direct connect event listener
        socket.on("connect", () => {


          // Join view survey wizard room
          socket.emit("join_view_survey_wizard", {
            surveyId: surveyId,
            userId: currentUserId,
          });


          const currentUser = getCurrentUser();
          if (currentUser) {
            // Find current user in team members or use current user data
            const currentTeamMember = teamMembers.find(
              (member) =>
                String(member.id) === String(currentUserId) ||
                member.email === currentUser.email
            );

            socket.emit("join_invite_team_members", {
              surveyId: surveyId,
              name: currentTeamMember?.name || currentUser.name || "",
              email: currentTeamMember?.email || currentUser.email || "",
              role: currentTeamMember?.role || "",
              assignedFacilityTasks: currentTeamMember?.assignedFacilityTasks || [],
              assignedResidents: currentTeamMember?.assignedResidents || [],
              teamMemberId: currentTeamMember?.id || currentUserId,
              SignedInUserId: currentUserId,
            });
          }
        });

        // Direct view_survey_wizard event listener
        socket.on("view_survey_wizard", (message) => {
          handleViewSurveyWizard(message);
        });

        // Direct invite_team_members event listener
        // This broadcasts assigned residents to team members in real-time
        socket.on("invite_team_members", (message) => {
          handleInviteTeamMembers(message);
        });
      }
    };

    // Set up direct listeners if socket already exists
    setupDirectSocketListeners();

    // Also set up when socket connects (if not already connected)
    const handleDirectConnect = () => {
      setupDirectSocketListeners();
    };
    surveySocketService.on("connect", handleDirectConnect);

    // If already connected, handle immediately
    const existingSocket = surveySocketService.getSocket();
    if (existingSocket && existingSocket.connected) {
      handleSocketConnect();
    }

    // Cleanup function
    return () => {
      if (socketDataTimeoutRef.current) {
        clearTimeout(socketDataTimeoutRef.current);
        socketDataTimeoutRef.current = null;
      }

      // Remove service wrapper listeners
      surveySocketService.off("connect", handleSocketConnect);
      surveySocketService.off("view_survey_wizard", handleViewSurveyWizard);
      surveySocketService.off("invite_team_members", handleInviteTeamMembers);
    };
    // Empty dependency array - only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const handleSampleSelectionSubmit = async (isContinueClicked = false) => {
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

    // Validation - ensure we have a final sample
    // Check both surveyData and finalSample from store
    const hasFinalSample =
      (surveyData?.finalSampleSurvey?.finalSample?.residentIds?.length > 0) ||
      (surveyData?.finalSampleSurvey?.finalSample?.residentDetails?.length > 0) ||
      (finalSample.length > 0);

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
      // Prepare final sample data - merge surveyData with current state to include latest assignments
      let finalSampleData = surveyData?.finalSampleSurvey?.finalSample;

      // Always use current finalSample from store to ensure we have latest resident assignments
      if (finalSample.length > 0) {
        const residentIds = finalSample.map((item) => item.resident?.id).filter(Boolean);
        const residentDetails = finalSample.map((item) => ({
          ...item.resident,
          selectionReason: item.reason || item.resident?.selectionReason,
        }));

        // Merge with existing finalSampleData if available, otherwise create new
        finalSampleData = {
          ...finalSampleData,
          residentIds: residentIds,
          residentDetails: residentDetails,
          summary: summary || finalSampleData?.summary || {},
          closedRecords: closedRecords || finalSampleData?.closedRecords || [],
        };
      } else if (!finalSampleData) {
        // Fallback to surveyData if no finalSample in store
        finalSampleData = surveyData?.finalSampleSurvey?.finalSample;
      }

      // Prepare sample selection payload
      const sampleSelectionPayload = {
        currentStep: "sample-selection",
        stepData: {
          surveyId,
          // Final Sample Data (includes resident assignments)
          finalSample: finalSampleData,
          // Closed Records
          closedRecords: surveyData?.finalSampleSurvey?.closedRecords || closedRecords || [],
          // Census
          census: surveyData?.census || summary?.census || 0,
          userId: currentUserId || JSON.parse(localStorage.getItem("mocksurvey_user") || "{}")._id,
          // Documents processed
          documentsProcessed: {
            form802:
              surveyData?.finalSampleSurvey?.documentsToUpload?.form802
                ?.uploaded || false,
            form671:
              surveyData?.finalSampleSurvey?.documentsToUpload?.form671
                ?.uploaded || false,
            casperQmIqies:
              surveyData?.finalSampleSurvey?.documentsToUpload?.casperQmIqies
                ?.uploaded || false,
            residentQM:
              surveyData?.finalSampleSurvey?.documentsToUpload?.residentQM
                ?.uploaded || false,
          },
          // Pool completion status
          initialPoolComplete:
            surveyData?.finalSampleSurvey?.initialPoolComplete || false,

          // Page status for team lead control
          isPageClosed: isPageClosed,

          // Team member payload - preserve existing team member submissions
          // Team leads should NEVER modify teamMemberPayload, only preserve it
          teamMemberPayload:
            surveyData?.finalSampleSurvey?.teamMemberPayload || [],

          submittedAt: new Date().toISOString(),
        },
        completedAt: new Date().toISOString(),
      };

      // Submit the step data
      const response = await api.healthAssistant.saveFinalSampleSelection(
        sampleSelectionPayload
      );

      if (response.statusCode === 200 || response.success) {
        toast.dismiss();
        // Emitting join view survey wizard to trigger server to fetch fresh data and broadcast to all clients
        const socket = surveySocketService.getSocket();
        if (socket && socket.connected) {
          setTimeout(() => {
            if (socket && socket.connected) {
              socket.emit("join_view_survey_wizard", {
                surveyId: surveyId,
                userId: currentUserId,
              });
            }
          }, 500); // 500ms delay to prevent rapid successive calls
        }
        if (isContinueClicked) {
          toast.success(
            "Sample selection data saved successfully!",
            {
              position: "top-right",
              duration: 5000,
            }
          );
          // Note: Navigation would be handled by parent component if needed
          // setCurrentStep(6);
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
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Final Sample Residents
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage and review your final sample selection
              </p>
            </div>
            <div className="flex items-center gap-3">
              {finalSample.length > 0 && !isInvitedUser() && (
                <Button
                  onClick={() => setShowReassignmentModal(true)}
                  className="bg-[#065B7D] hover:bg-[#054d63] text-white"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Assign Residents
                </Button>
              )}
              {!isInvitedUser() && (
                <Button
                  onClick={fetchFinalSampleResidents}
                  disabled={isLoading}
                  className="bg-[#065B7D] hover:bg-[#054d63] text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Sample
                    </>
                  )}
                </Button>
              )}
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
          <div className="bg-gray-50 border-l-4 border-gray-400 rounded-lg p-5 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Error Loading Data
                </h3>
                <p className="text-sm text-gray-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        {(finalSample.length > 0 || summary) && !isLoading && (
          <div className="space-y-6">
            {/* Summary Stats - Compact */}
            {summary && Object.keys(summary).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 p-4">
                  <p className="text-xs text-gray-600 mb-1">
                    {isInvitedUser() ? "My Assigned Residents" : "Total Residents"}
                  </p>
                  <p className="text-xl font-semibold text-gray-900">
                    {isInvitedUser() ? filteredResidents.length : (summary.totalResidents || 0)}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 p-4">
                  <p className="text-xs text-gray-600 mb-1">Sample Size</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {isInvitedUser() ? filteredResidents.length : (summary.finalSampleSize || 0)}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 p-4">
                  <p className="text-xs text-gray-600 mb-1">Target</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {isInvitedUser() ? "N/A" : (summary.targetFinalSampleSize || "N/A")}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 p-4">
                  <p className="text-xs text-gray-600 mb-1">Census</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {summary.census || 0}
                  </p>
                </div>
              </div>
            )}

            {/* Critical Element Pathway Coverage */}
            {summary?.clinicalCategories && (
              <div className="p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">
                  Critical Element Pathway Coverage
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
                <h2 className="text-base font-semibold text-gray-900 mb-4">
                  {isInvitedUser() ? "My Assigned Residents" : "All Residents"}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredResidents.map((resident, index) => {
                    const patientNeeds = resident.patientNeeds || [];
                    const assignedTeamMember = getAssignedTeamMember(resident);

                    return (
                      <div
                        key={resident.id || index}
                        className="bg-white border border-gray-200 p-5 hover:bg-gray-50 transition-colors"
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
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-gray-100 text-gray-700 border-gray-200"
                                >
                                  +{patientNeeds.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                          <div className="mt-1">
                            {assignedTeamMember ? (
                              <>
                                <span className="text-xs text-gray-500">
                                  Assigned to:{" "}
                                </span>
                                <Badge className="text-xs bg-[#065B7D] text-white border-0">
                                  {assignedTeamMember.name}
                                </Badge>
                              </>
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

            {/* Empty State for Team Members with No Assigned Residents */}
            {isInvitedUser() &&
              filteredResidents.length === 0 &&
              finalSample.length > 0 && (
                <div className="bg-white border border-gray-200 p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                      No Assigned Residents
                    </h3>
                    <p className="text-sm text-gray-600">
                      You don't have any residents assigned to you yet. Please
                      contact your team lead for assignments.
                    </p>
                  </div>
                </div>
              )}

            {/* Empty State */}
            {finalSample.length === 0 && !isLoading && !summary && (
              <div className="bg-white border border-gray-200 p-12 text-center">
                <div className="max-w-md mx-auto">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    {isInvitedUser() ? "No Assigned Residents" : "No residents found"}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    {isInvitedUser()
                      ? "You don't have any residents assigned to you yet. Please contact your team lead for assignments."
                      : "Generate the final sample to view residents included in your survey."}
                  </p>
                  {!isInvitedUser() && (
                    <Button
                      onClick={fetchFinalSampleResidents}
                      className="bg-[#065B7D] hover:bg-[#054d63] text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Sample
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resident Reassignment Modal */}
      {showReassignmentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl">
            {/* Fixed Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Reassign Residents to Team Members
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {allAvailableResidents.length} residents •{" "}
                    {teamMembers.length} team members
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setShowReassignmentModal(false);
                    setSelectedResidentsForBulkAssignment(new Set());
                    setBulkAssignmentTeamMember("");
                    setSelectedResidentForDetails(null);
                    setAssignmentWarning(null);
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Two-Column Layout */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - Residents List */}
              <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
                <div className="p-4">
                  {/* Select All Checkbox */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          selectedResidentsForBulkAssignment.size ===
                          allAvailableResidents.length &&
                          allAvailableResidents.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedResidentsForBulkAssignment(
                              new Set(allAvailableResidents.map((r) => r.id))
                            );
                          } else {
                            setSelectedResidentsForBulkAssignment(new Set());
                          }
                        }}
                        className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-2 focus:ring-gray-900 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        Select all residents
                      </span>
                    </label>
                  </div>

                  {/* Residents List */}
                  <div className="space-y-1">
                    {allAvailableResidents.map((resident, residentIndex) => {
                      const isSelected = selectedResidentsForBulkAssignment.has(
                        resident.id
                      );
                      const isDetailsSelected =
                        selectedResidentForDetails?.id === resident.id;

                      // Check if resident is assigned to any team member
                      let assignedMember = null;
                      if (resident.assignedTeamMemberId) {
                        assignedMember = teamMembers.find(
                          (m) => m.id === resident.assignedTeamMemberId
                        );
                      } else {
                        // Check team members' assignedResidents lists
                        const backendTeamMember = teamMembers.find((tm) =>
                          tm.assignedResidents?.includes(String(resident.id))
                        );
                        if (backendTeamMember) {
                          assignedMember = backendTeamMember;
                        }
                      }

                      return (
                        <label
                          key={`assignment-resident-${resident.id}-${residentIndex}`}
                          className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${isDetailsSelected
                              ? "bg-gray-100 border border-gray-300"
                              : isSelected
                                ? "bg-gray-50"
                                : "hover:bg-gray-50"
                            }`}
                          onClick={() => {
                            setSelectedResidentForDetails(resident);
                            setAssignmentWarning(null);
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newSet = new Set(
                                selectedResidentsForBulkAssignment
                              );
                              if (e.target.checked) {
                                newSet.add(resident.id);
                              } else {
                                newSet.delete(resident.id);
                              }
                              setSelectedResidentsForBulkAssignment(newSet);
                            }}
                            className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-2 focus:ring-gray-900 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {resident.name}
                              </span>
                              {assignedMember && (
                                <Badge className="text-xs bg-[#065B7D] text-white border-0 px-1.5 py-0.5">
                                  {assignedMember.name}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              Room {resident.room}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Panel - Resident Details & Assignment */}
              <div className="w-1/2 overflow-y-auto bg-gray-50">
                <div className="p-6">
                  {selectedResidentForDetails ? (
                    <div className="space-y-6">
                      {/* Resident Details Header */}
                      <div>
                        <h4 className="text-base font-semibold text-gray-900 mb-1">
                          {selectedResidentForDetails.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Room {selectedResidentForDetails.room}
                        </p>
                      </div>

                      {/* Info Icon with Description */}
                      <div className="flex items-start space-x-2 text-sm text-gray-600">
                        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p>
                          Select a team member to assign this resident. The team
                          member will be able to view and work with this
                          resident's data.
                        </p>
                      </div>

                      {/* Warning Message Display */}
                      {assignmentWarning && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-amber-800">
                                {assignmentWarning}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Assignment Section */}
                      <div>
                        <Label className="text-sm font-medium text-gray-900 mb-2 block">
                          Assign to Team Member
                        </Label>
                        <Select
                          value={
                            selectedResidentForDetails.assignedTeamMemberId
                              ? selectedResidentForDetails.assignedTeamMemberId
                              : "unassigned"
                          }
                          onValueChange={(memberId) => {
                            const finalMemberId =
                              memberId === "unassigned" ? null : memberId;

                            // Check if resident is already assigned to this member
                            if (finalMemberId) {
                              const backendTeamMember = teamMembers.find(
                                (tm) => String(tm.id) === String(finalMemberId)
                              );

                              if (
                                backendTeamMember?.assignedResidents?.includes(
                                  String(selectedResidentForDetails.id)
                                )
                              ) {
                                const memberName =
                                  teamMembers.find(
                                    (m) => m.id === finalMemberId
                                  )?.name || "team member";
                                setAssignmentWarning(
                                  `"${selectedResidentForDetails.name}" is already assigned to "${memberName}". No changes were made.`
                                );
                                return;
                              } else {
                                setAssignmentWarning(null);
                              }
                            } else {
                              setAssignmentWarning(null);
                            }

                            // Update resident in finalSample
                            const updatedFinalSample = finalSample.map(
                              (item) => {
                                if (
                                  String(item.resident?.id) ===
                                  String(selectedResidentForDetails.id)
                                ) {
                                  return {
                                    ...item,
                                    resident: {
                                      ...item.resident,
                                      assignedTeamMemberId:
                                        finalMemberId || null,
                                    },
                                  };
                                }
                                return item;
                              }
                            );

                            // Update store
                            setFinalSampleData(
                              currentSurveyId || storeSurveyId,
                              {
                                finalSample: updatedFinalSample,
                                summary: summary,
                                closedRecords: closedRecords,
                              }
                            );

                            // Update team members
                            if (setTeamMembers && finalMemberId) {
                              const updatedTeamMembers = teamMembers.map(
                                (member) => {
                                  if (member.id === finalMemberId) {
                                    const currentAssigned =
                                      member.assignedResidents || [];
                                    if (
                                      !currentAssigned.includes(
                                        String(selectedResidentForDetails.id)
                                      )
                                    ) {
                                      return {
                                        ...member,
                                        assignedResidents: [
                                          ...currentAssigned,
                                          String(selectedResidentForDetails.id),
                                        ],
                                      };
                                    }
                                  }
                                  // Remove from previous member if reassigned
                                  const previousMemberId =
                                    selectedResidentForDetails.assignedTeamMemberId;
                                  if (
                                    previousMemberId &&
                                    member.id === previousMemberId &&
                                    member.id !== finalMemberId
                                  ) {
                                    return {
                                      ...member,
                                      assignedResidents: (
                                        member.assignedResidents || []
                                      ).filter(
                                        (id) =>
                                          String(id) !==
                                          String(selectedResidentForDetails.id)
                                      ),
                                    };
                                  }
                                  return member;
                                }
                              );
                              setTeamMembers(updatedTeamMembers);
                            }

                            // Update selected resident details
                            setSelectedResidentForDetails({
                              ...selectedResidentForDetails,
                              assignedTeamMemberId: finalMemberId || null,
                            });

                            const member = teamMembers.find(
                              (m) => m.id === finalMemberId
                            );
                            toast.success(
                              finalMemberId
                                ? `${selectedResidentForDetails.name
                                } assigned to ${member?.name || "team member"
                                }`
                                : `${selectedResidentForDetails.name} unassigned`
                            );
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="— Not Assigned —" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">
                              — Not Assigned —
                            </SelectItem>
                            {teamMembers.map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Resident Information */}
                      <div className="space-y-3 pt-4 border-t border-gray-200">
                        <div>
                          <span className="text-xs font-medium text-gray-500">
                            Admission Date:
                          </span>
                          <p className="text-sm text-gray-900 mt-0.5">
                            {selectedResidentForDetails.admissionDate || "N/A"}
                          </p>
                        </div>
                        {selectedResidentForDetails.patientNeeds &&
                          selectedResidentForDetails.patientNeeds.length >
                          0 && (
                            <div>
                              <span className="text-xs font-medium text-gray-500">
                                Patient Needs:
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedResidentForDetails.patientNeeds
                                  .slice(0, 3)
                                  .map((need, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="outline"
                                      className="text-xs bg-gray-100 text-gray-700 border-gray-200"
                                    >
                                      {need}
                                    </Badge>
                                  ))}
                                {selectedResidentForDetails.patientNeeds
                                  .length > 3 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-gray-100 text-gray-700 border-gray-200"
                                    >
                                      +
                                      {selectedResidentForDetails.patientNeeds
                                        .length - 3}{" "}
                                      more
                                    </Badge>
                                  )}
                              </div>
                            </div>
                          )}
                        <div>
                          <span className="text-xs font-medium text-gray-500">
                            Resident ID:
                          </span>
                          <p className="text-sm text-gray-900 mt-0.5">
                            {selectedResidentForDetails.id}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-center">
                      <div>
                        <Info className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">
                          Select a resident from the list to view details and
                          assign to a team member
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white">
              <div className="px-6 py-4 flex items-center justify-between">
                {/* Assignment Stats */}
                {(() => {
                  const allAssignedResidentIds = new Set();

                  teamMembers.forEach((tm) => {
                    (tm.assignedResidents || []).forEach((residentId) => {
                      allAssignedResidentIds.add(String(residentId));
                    });
                  });

                  allAvailableResidents.forEach((r) => {
                    if (r.assignedTeamMemberId) {
                      allAssignedResidentIds.add(String(r.id));
                    }
                  });

                  const assignedCount = allAvailableResidents.filter((r) =>
                    allAssignedResidentIds.has(String(r.id))
                  ).length;

                  const unassignedCount =
                    allAvailableResidents.length - assignedCount;

                  return (
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-gray-600">Assigned:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {assignedCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Unassigned:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {unassignedCount}
                        </span>
                      </div>
                      {selectedResidentsForBulkAssignment.size > 0 && (
                        <div>
                          <span className="text-gray-600">Selected:</span>
                          <span className="ml-2 font-semibold text-gray-900">
                            {selectedResidentsForBulkAssignment.size}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => {
                      setShowReassignmentModal(false);
                      setSelectedResidentsForBulkAssignment(new Set());
                      setBulkAssignmentTeamMember("");
                      setSelectedResidentForDetails(null);
                      setAssignmentWarning(null);
                    }}
                    variant="outline"
                    className="px-4"
                  >
                    Cancel
                  </Button>
                  {selectedResidentsForBulkAssignment.size > 0 && (
                    <div className="flex items-center gap-2">
                      <Select
                        value={bulkAssignmentTeamMember}
                        onValueChange={(value) => {
                          setBulkAssignmentTeamMember(value);
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select team member..." />
                        </SelectTrigger>
                        <SelectContent>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => {
                          if (!bulkAssignmentTeamMember) {
                            toast.error("Please select a team member");
                            return;
                          }

                          const updatedFinalSample = finalSample.map((item) => {
                            if (
                              selectedResidentsForBulkAssignment.has(
                                item.resident?.id
                              )
                            ) {
                              return {
                                ...item,
                                resident: {
                                  ...item.resident,
                                  assignedTeamMemberId:
                                    bulkAssignmentTeamMember,
                                },
                              };
                            }
                            return item;
                          });

                          setFinalSampleData(currentSurveyId || storeSurveyId, {
                            finalSample: updatedFinalSample,
                            summary: summary,
                            closedRecords: closedRecords,
                          });

                          // Update team members
                          const updatedTeamMembers = teamMembers.map(
                            (member) => {
                              if (member.id === bulkAssignmentTeamMember) {
                                const currentAssigned =
                                  member.assignedResidents || [];
                                const newResidentIds = Array.from(
                                  selectedResidentsForBulkAssignment
                                ).map((id) => String(id));
                                const allAssignedResidents = [
                                  ...new Set([
                                    ...currentAssigned,
                                    ...newResidentIds,
                                  ]),
                                ];
                                return {
                                  ...member,
                                  assignedResidents: allAssignedResidents,
                                };
                              }
                              return member;
                            }
                          );
                          setTeamMembers(updatedTeamMembers);

                          const member = teamMembers.find(
                            (m) => m.id === bulkAssignmentTeamMember
                          );
                          toast.success(
                            `Assigned ${selectedResidentsForBulkAssignment.size
                            } resident${selectedResidentsForBulkAssignment.size !== 1
                              ? "s"
                              : ""
                            } to ${member?.name || "team member"}`
                          );

                          setSelectedResidentsForBulkAssignment(new Set());
                          setBulkAssignmentTeamMember("");
                          if (selectedResidentForDetails) {
                            const updatedResident = updatedFinalSample.find(
                              (item) =>
                                item.resident?.id ===
                                selectedResidentForDetails.id
                            )?.resident;
                            if (updatedResident) {
                              setSelectedResidentForDetails(updatedResident);
                            }
                          }
                        }}
                        disabled={!bulkAssignmentTeamMember}
                        className="bg-[#065B7D] hover:bg-[#054d63] text-white px-4"
                      >
                        Assign Selected
                      </Button>
                    </div>
                  )}
                  <Button
                    onClick={async () => {
                      const loadingToast = toast.loading(
                        "Saving assignments...",
                        {
                          position: "top-right",
                        }
                      );

                      try {
                        const surveyId = currentSurveyId || storeSurveyId;

                        if (!surveyId) {
                          toast.dismiss(loadingToast);
                          toast.error(
                            "Survey ID not found. Please refresh and try again.",
                            { position: "top-right" }
                          );
                          return;
                        }

                        let socket = surveySocketService.getSocket();

                        if (!socket) {
                          surveySocketService.connect(surveyId, currentUserId);
                          await new Promise((resolve) =>
                            setTimeout(resolve, 1000)
                          );
                          socket = surveySocketService.getSocket();
                        }

                        if (!socket || !surveySocketService.isConnected()) {
                          toast.dismiss(loadingToast);
                          toast.error(
                            "Socket not connected. Please wait a moment and try again.",
                            { position: "top-right" }
                          );
                          return;
                        }

                        // Get updated team members with assigned residents
                        const updatedTeamMembersForSocket = teamMembers.map(
                          (member) => {
                            const assignedResidents = allAvailableResidents
                              .filter(
                                (r) =>
                                  r.assignedTeamMemberId === member.id ||
                                  member.assignedResidents?.includes(
                                    String(r.id)
                                  )
                              )
                              .map((r) => String(r.id));

                            return {
                              ...member,
                              assignedResidents: assignedResidents,
                            };
                          }
                        );

                        // Emit assignments through socket
                        const emitAssignments = () => {
                          const socketInstance =
                            surveySocketService.getSocket();

                          if (socketInstance && socketInstance.connected) {
                            let hasEmittedViewSurveyWizard = false;
                            const responseTimeout = 5000;
                            const minWaitTime = 500;
                            const startTime = Date.now();

                            const tempResponseHandler = (message) => {
                              const isSuccessfulResponse =
                                message?.status === true &&
                                message?.statusCode === 200 &&
                                (message?.data?.surveyId === surveyId ||
                                  message?.surveyId === surveyId);

                              const isAssignmentMessage =
                                message?.surveyId === surveyId &&
                                message?.teamMemberId;

                              if (isSuccessfulResponse || isAssignmentMessage) {
                                const elapsedTime = Date.now() - startTime;
                                if (
                                  !hasEmittedViewSurveyWizard &&
                                  elapsedTime >= minWaitTime
                                ) {
                                  hasEmittedViewSurveyWizard = true;

                                  socketInstance.emit(
                                    "join_view_survey_wizard",
                                    {
                                      surveyId: surveyId,
                                      userId: currentUserId,
                                    }
                                  );

                                  socketInstance.off(
                                    "invite_team_members",
                                    tempResponseHandler
                                  );
                                  if (timeoutId) clearTimeout(timeoutId);

                                  toast.dismiss(loadingToast);
                                  toast.success(
                                    "Resident assignments saved successfully!",
                                    {
                                      description: `Updated ${updatedTeamMembersForSocket.length
                                        } team member${updatedTeamMembersForSocket.length !== 1
                                          ? "s"
                                          : ""
                                        } with resident assignments`,
                                      position: "top-right",
                                      duration: 3000,
                                    }
                                  );

                                  setShowReassignmentModal(false);
                                  setSelectedResidentsForBulkAssignment(
                                    new Set()
                                  );
                                  setBulkAssignmentTeamMember("");
                                  setSelectedResidentForDetails(null);
                                  setAssignmentWarning(null);
                                }
                              }
                            };

                            socketInstance.on(
                              "invite_team_members",
                              tempResponseHandler
                            );

                            const timeoutId = setTimeout(() => {
                              if (!hasEmittedViewSurveyWizard) {
                                hasEmittedViewSurveyWizard = true;

                                socketInstance.emit("join_view_survey_wizard", {
                                  surveyId: surveyId,
                                  userId: currentUserId,
                                });

                                socketInstance.off(
                                  "invite_team_members",
                                  tempResponseHandler
                                );

                                toast.dismiss(loadingToast);
                                toast.success(
                                  "Resident assignments saved successfully!",
                                  {
                                    position: "top-right",
                                    duration: 3000,
                                  }
                                );

                                setShowReassignmentModal(false);
                                setSelectedResidentsForBulkAssignment(
                                  new Set()
                                );
                                setBulkAssignmentTeamMember("");
                                setSelectedResidentForDetails(null);
                                setAssignmentWarning(null);
                              }
                            }, responseTimeout);

                            // Emit assignments for each team member
                            updatedTeamMembersForSocket.forEach((member) => {
                              socketInstance.emit("join_invite_team_members", {
                                surveyId: surveyId,
                                name: member.name,
                                email: member.email,
                                role: member.role,
                                assignedFacilityTasks:
                                  member.assignedFacilityTasks || [],
                                assignedResidents:
                                  member.assignedResidents || [],
                                teamMemberId: member.id,
                                SignedInUserId: currentUserId,
                              });
                            });

                            return true;
                          }
                          return false;
                        };

                        if (socket && socket.connected) {
                          emitAssignments();
                        } else {
                          const onConnect = () => {
                            emitAssignments();
                            socket.off("connect", onConnect);
                          };
                          socket.on("connect", onConnect);
                          if (!socket.connecting && socket.disconnected) {
                            surveySocketService.connect(
                              surveyId,
                              currentUserId
                            );
                          }
                        }
                      } catch (error) {

                        toast.dismiss();
                        toast.error("Failed to save resident assignments", {
                          description: error.message || "Please try again",
                          position: "top-right",
                          duration: 5000,
                        });
                      }
                    }}
                    className="bg-[#065B7D] hover:bg-[#054d63] text-white px-6 font-medium"
                  >
                    Save Assignments
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      {!isInvitedUser() && (
        <div className="fixed bottom-6 right-6 z-40 flex gap-4">
          <Button
            onClick={() => {
              // Navigate back - would need navigation prop or router
              // For now, just show a message
              toast.info("Back navigation would be handled by parent component");
            }}
            className="h-12 px-8 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium rounded-full shadow-lg flex items-center gap-2 hover:shadow-xl transition-all"
            size="lg"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </Button>

          <div className="flex items-center space-x-3">
            <Button
              onClick={() => {
                handleSampleSelectionSubmit(true);
              }}
              disabled={isSubmitting || isPageClosed || isSurveyClosed}
              className="h-12 px-8 bg-[#065B7D] hover:bg-[#054d63] text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full shadow-lg flex items-center gap-2 hover:shadow-xl transition-all"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  Continue to Investigations
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>
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
            className="h-12 px-6 bg-[#065B7D] hover:bg-[#054d63] text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full shadow-lg flex items-center gap-2 hover:shadow-xl transition-all"
            size="lg"
            title="Save your progress without navigating away"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
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

      {/* Invited User Floating Buttons */}
      {isInvitedUser() && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-4">
          <div className="flex gap-4">
            <Button
              onClick={() => {
                toast.info("Back navigation would be handled by parent component");
              }}
              className="h-12 px-8 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium rounded-full shadow-lg flex items-center gap-2 hover:shadow-xl transition-all"
              size="lg"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </Button>
            <Button
              onClick={() => {
                toast.info("Next navigation would be handled by parent component");
              }}
              className="h-12 px-8 bg-[#065B7D] hover:bg-[#054d63] text-white font-medium rounded-full shadow-lg flex items-center gap-2 hover:shadow-xl transition-all"
              size="lg"
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SampleSection;
