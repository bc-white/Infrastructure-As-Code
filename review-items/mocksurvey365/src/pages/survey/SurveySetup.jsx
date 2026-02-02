import { useState, useEffect, useRef, useCallback } from "react";
import { useBeforeUnload } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { DatePicker } from "../../components/ui/date-picker";
import api from "../../service/api";
import surveyIndexedDB from "../../utils/surveyIndexedDB";
import surveySyncService from "../../utils/surveySyncService";
import useSurveyStore from "../../stores/useSurveyStore";
import { toast } from "sonner";
import { generateTaskKey } from "../../utils/facilityTaskHelpers";
import UnsavedChangesModal from "../../components/UnsavedChangesModal";
import FloatingHomeButton from "../../components/FloatingHomeButton";
import { useBrowserNavigationBlocker } from "../../hooks/useBrowserNavigationBlocker";
import useSurveyAccess from "../../hooks/useSurveyAccess";
import TeamMemberModal, { RemoveTeamMemberModal } from "../../components/modals/TeamMemberModal";

import {
  Plus,
  Trash2,
  Download,
  Users,
  FileText,
  Shield,
  Building,
  Phone,
  Mail,
  Printer,
  Star, 
  CheckSquare,
  Search,
  AlertTriangle,
  X,
  Pencil,
  ArrowRight,
} from "lucide-react";

// Helper function to get role name from ID
// This will be passed as a prop from the parent component
const getRoleName = (roleId, roleIdToName = {}) => {
  return roleIdToName[roleId] || "Unknown Role";
};

// Helper function to calculate Initial Pool based on census
const getInitialPool = (census) => {
  if (census >= 1 && census <= 8) return "All residents";
  if (census >= 9 && census <= 15) return "All residents";
  if (census >= 16 && census <= 48) return "16";
  if (census >= 49 && census <= 69) return "24";
  if (census >= 70 && census <= 95) return "24";
  if (census >= 96 && census <= 143) return "32";
  if (census >= 144 && census <= 148) return "32";
  if (census >= 149 && census <= 174) return "33-34";
  if (census >= 175) return "40";
  return "Unknown";
};

// Helper function to calculate Final Sample based on census
const getFinalSample = (census) => {
  if (census >= 1 && census <= 8) return "All residents";
  if (census >= 9 && census <= 15) return "8";
  if (census >= 16 && census <= 48) return "12";
  if (census >= 49 && census <= 69) return "13-17";
  if (census >= 70 && census <= 95) return "18-19";
  if (census >= 96 && census <= 143) return "20-28";
  if (census >= 144 && census <= 148) return "29";
  if (census >= 149 && census <= 174) return "30-34";
  if (census >= 175) return "35";
  return "Unknown";
};

const SurveySetup = ({
  sectionData,
  teamMembers,
  handleSurveyDataChange,
  surveyData,
  setCurrentStep,
  canContinueFromStep,
  exportTeamMembers,
  handleSetTeamCoordinator,
  handleRemoveTeamMember,
  handleEditTeamMember,
  handlePrintResource,
  handleDownloadResource,
  filteredTeamMembers,
  teamMemberSearch,
  setTeamMemberSearch,
  teamMemberFilter,
  setTeamMemberFilter,
  handleRequestRequirement,
  handleMarkReceived,
  handleMarkNotReceived,
  roleIdToName = {}, // Add role mapping prop
  isInvitedUser: isInvitedUserProp = () => false, // Add isInvitedUser prop with default
  // Team member modal props
  showTeamModal = false,
  setShowTeamModal = () => {},
  newTeamMember = {},
  handleTeamMemberInputChange = () => {},
  editingMemberId = null,
  availableRoles = [],
  roleMapping = {},
  facilityTaskOptions = [],
  loadingFacilityTaskOptions = false, 
  handleAddTeamMember = () => {},
  resetTeamMemberForm = () => {},
  // Remove member modal props
  showRemoveConfirmModal = false,
  memberToRemove = null,
  cancelRemoveTeamMember = () => {},
  confirmRemoveTeamMember = () => {},
}) => {
  // Get current survey ID for access check
  const currentSurveyId = surveyData?.surveyId || surveyData?.id || surveyData?._id || localStorage.getItem("currentSurveyId");
  
  // Use the survey access hook to determine user access type
  const { isInvitedUser: isInvitedUserFromHook, isLoading: isAccessLoading } = useSurveyAccess(currentSurveyId);
  
  // Use hook-based isInvitedUser, fall back to prop if hook is still loading
  const isInvitedUser = isAccessLoading ? isInvitedUserProp : isInvitedUserFromHook;

  // Navigation blocking state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const hasUnsavedChangesRef = useRef(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);


  // Sync hasUnsavedChangesRef with state
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Helper function to get role name from ID using roleIdToName prop
  const getRoleNameLocal = (roleId) => {
    return roleIdToName[roleId] || "Unknown Role";
  };

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

  // Check if survey is closed
  const isSurveyClosed = surveyData.surveyClosureSurvey?.surveyClosed || 
                         surveyData.surveyClosureSurvey?.surveyCompleted ||
                         surveyData.surveyCompleted || false;

                 

  // Ensure surveyCreationDate is initialized
  useEffect(() => {
    if (!surveyData.surveyCreationDate) {
      handleSurveyDataChange(
        "surveyCreationDate",
        new Date().toISOString().split("T")[0]
      );
    }
  }, [surveyData.surveyCreationDate]);

  // Fetch survey data from API if surveyId exists
  useEffect(() => {
    const fetchSurveyData = async () => {
      const surveyId = localStorage.getItem("currentSurveyId");
      if (surveyId) {
        try {
          const response = await api.survey.getSurveyFirstPage(surveyId);
          if (response && (response.statusCode === 200 || response.statusCode === 201) && response.data) {
            // Destructure based on the new response structure
            const { surveyData: backendSurveyData, teamMembers, preSurveyRequirement, assignedFacility } = response.data;
            
            // Update survey data fields from backendSurveyData
            if (backendSurveyData) {
                handleSurveyDataChange("surveyCreationDate", backendSurveyData.surveyCreationDate ? backendSurveyData.surveyCreationDate.split('T')[0] : "");
                handleSurveyDataChange("surveyCategory", backendSurveyData.surveyCategory || "");
                handleSurveyDataChange("census", backendSurveyData.census || "");
                handleSurveyDataChange("initialPool", backendSurveyData.initialPool || "");
                handleSurveyDataChange("finalSample", backendSurveyData.finalSample || "");
                
                // Handle facility details
                if (backendSurveyData.facilityId && typeof backendSurveyData.facilityId === 'object') {
                    const facility = backendSurveyData.facilityId;
                    handleSurveyDataChange("facilityId", facility._id); // Store ID
                    handleSurveyDataChange("facilityName", facility.name || "");
                    handleSurveyDataChange("ccn", facility.providerNumber || "");
                    
                    if (facility.address) {
                        handleSurveyDataChange("address", facility.address.street || "");
                        handleSurveyDataChange("city", facility.address.city || "");
                        handleSurveyDataChange("state", facility.address.state || "");
                        handleSurveyDataChange("zipCode", facility.address.zipCode || "");
                    }
                } else if (backendSurveyData.facilityId) {
                     handleSurveyDataChange("facilityId", backendSurveyData.facilityId);
                }
            }
            
      

            // Handle team members and assigned tasks
            if (teamMembers && Array.isArray(teamMembers)) {
              // Create a map of tasks by team member ID
              // We need to support matching by both teamMemberId._id and teamMemberUserId
              const tasksByMember = {};
              
              // First, build a lookup map from teamMemberUserId -> teamMember._id
              const userIdToMemberId = {};
              teamMembers.forEach(member => {
                if (member.teamMemberUserId) {
                  userIdToMemberId[member.teamMemberUserId] = member._id;
                }
              });
              
              if (assignedFacility && Array.isArray(assignedFacility)) {
                  assignedFacility.forEach(assignment => {
                      // assignment.teamMemberId can be object, ID, or null
                      // If null, try to use teamMemberUserId to find the team member
                      let memberId = null;
                      
                      if (assignment.teamMemberId && typeof assignment.teamMemberId === 'object') {
                        memberId = assignment.teamMemberId._id;
                      } else if (assignment.teamMemberId) {
                        memberId = assignment.teamMemberId;
                      } else if (assignment.teamMemberUserId) {
                        // Try to match teamMemberUserId to a team member's teamMemberUserId
                        memberId = userIdToMemberId[assignment.teamMemberUserId];
                      }
                      
                      if (memberId) {
                          if (!tasksByMember[memberId]) {
                              tasksByMember[memberId] = [];
                          }
                          // The task details are in assignment.mandatorytaskId
                          if (assignment.mandatorytaskId) {
                              const taskId = typeof assignment.mandatorytaskId === 'object' 
                                  ? assignment.mandatorytaskId._id 
                                  : assignment.mandatorytaskId;
                              
                              // Check for duplicates before adding
                              const alreadyExists = tasksByMember[memberId].some(t => {
                                  const existingId = typeof t === 'object' ? t._id : t;
                                  return existingId === taskId;
                              });
                              
                              if (!alreadyExists) {
                                  // Preserve the assignment ID (assignedFacilityId)
                                  const taskWithAssignmentId = {
                                      ...assignment.mandatorytaskId,
                                      assignedFacilityId: assignment._id
                                  };
                                  tasksByMember[memberId].push(taskWithAssignmentId);
                              }
                          }
                      }
                  });
              }

              const mappedTeamMembers = teamMembers.map(member => ({
                ...member,
                id: member._id, // Use _id as frontend id
                teamMemberId: member._id, // Keep track of backend ID
                assignedFacilityTasks: tasksByMember[member._id] || []
              }));
              handleSurveyDataChange("teamMembers", mappedTeamMembers);

              // Set team coordinator
              const coordinator = mappedTeamMembers.find(m => m.teamCoordinator);
              if (coordinator) {
                handleSurveyDataChange("teamCoordinator", coordinator.email);
                localStorage.setItem("currentSurveyTeamCoordinator", coordinator.email);
              }
            }
          }
        } catch (error) {
          toast.error("Failed to load survey data", {
            description: "Could not retrieve existing survey information.",
            duration: 4000,
          });
        } finally {
          setIsLoadingData(false);
        }
      }
    };

    fetchSurveyData();
  }, []);

  // Fetch facility details if facilityId exists but facilityName is missing
  useEffect(() => {
    const fetchFacilityDetails = async () => {
      if (surveyData.facilityId && !surveyData.facilityName) {
        try {
          const response = await api.facility.getFacility(
            surveyData.facilityId
          );

          if (response && response.status && response.data) {
            const facility = response.data;

            // Populate facility details
            handleSurveyDataChange("facilityName", facility.name);
            handleSurveyDataChange("ccn", facility.providerNumber || "");

            // Handle address - could be string or object
            if (typeof facility.address === "object") {
              handleSurveyDataChange("address", facility.address.street || "");
              handleSurveyDataChange(
                "city",
                facility.address.city || facility.city || ""
              );
              handleSurveyDataChange(
                "state",
                facility.address.state || facility.state || ""
              );
              handleSurveyDataChange(
                "zipCode",
                facility.address.zipCode || facility.zipCode || ""
              );
            } else {
              handleSurveyDataChange("address", facility.address || "");
            }

            // Handle contact information
            if (facility.contact && Array.isArray(facility.contact)) {
              const primaryContact = facility.contact[0];
              if (primaryContact) {
                handleSurveyDataChange("phone", primaryContact.phone || "");
                handleSurveyDataChange("email", primaryContact.email || "");
              }
            }
          }
        } catch (error) {
          // Error fetching facility details
        }
      }
    };

    fetchFacilityDetails();
  }, [surveyData.facilityId, surveyData.facilityName]);

  // Mandatory tasks fetching re-enabled
  useEffect(() => {
    const fetchMandatoryTasks = async () => {
      try {
        setLoadingFacilityTasks(true);
        const response = await api.resource.getAllMandatoryTasks();

        if (response?.status && response.data?.mt) {
          const tasks = response.data.mt.map((task) => ({
            _id: task._id,
            key: generateTaskKey(task.title || task._id || ""), // Keep key for display purposes
            name:
              ((task.title || "").replace(/\s*\([^)]+\)/g, "").trim() ||
                task.title ||
                "Untitled Task"),
          }));
          setAvailableTasks(tasks);
        } else {
          setAvailableTasks([]);
          toast.error("Failed to load facility tasks", {
            position: "top-right",
          });
        }
      } catch (error) {
        setAvailableTasks([]);
        toast.error("Failed to load facility tasks", {
          description: error.message || "Please try again.",
          position: "top-right",
        });
      } finally {
        setLoadingFacilityTasks(false);
      }
    };

    fetchMandatoryTasks();
  }, []);

  const [showTaskAssignmentModal, setShowTaskAssignmentModal] = useState(false);
  const [selectedMemberForTasks, setSelectedMemberForTasks] = useState(null);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [loadingFacilityTasks, setLoadingFacilityTasks] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(() => !!localStorage.getItem("currentSurveyId"));

  // Facility search states
  const [facilityName, setFacilityName] = useState("");
  const [facilities, setFacilities] = useState([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [showFacilityDropdown, setShowFacilityDropdown] = useState(false);
  const [searchType, setSearchType] = useState("name");
  const [selectedState, setSelectedState] = useState("");
  const [surveyCategories, setSurveyCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const facilityDropdownRef = useRef(null);

  // API call states 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email request states
  const [updatingRequirements, setUpdatingRequirements] = useState(new Set());
  const [showSuccessMessage, setShowSuccessMessage] = useState(null);

  // Debounce functionality
  const debounceTimeoutRef = useRef(null);

  // Fetch survey categories from API
  useEffect(() => {
    const fetchSurveyCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await api.survey.getSurveyCategories();

        if (response && response.status && response.data) {
          setSurveyCategories(response.data);
        }
      } catch (error) {
        toast.error("Failed to load survey categories", {
          position: "top-right",
        });
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchSurveyCategories();
  }, []);





  // Debounced search function
  const debouncedSearchFacilities = useCallback(
    (searchTerm) => {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout
      debounceTimeoutRef.current = setTimeout(async () => {
        if (searchTerm.length < 2) {
          setFacilities([]);
          return;
        }

        setIsLoadingFacilities(true);
        try {
          const filters = {
            name: searchType === "name" ? searchTerm : "",
            state: selectedState || "",
            city: searchType === "city" ? searchTerm : "",
          };

          const response = await api.facility.searchFacilities(
            searchTerm,
            filters
          );

          if (response && response.status && response.data) {
            setFacilities(response.data);
          } else {
            setFacilities([]);
          }
        } catch (error) {
          setFacilities([]);
          toast.error("Failed to search facilities", { position: "top-right" });
        } finally {
          setIsLoadingFacilities(false);
        }
      }, 300); // 300ms debounce delay
    },
    [searchType, selectedState]
  );

  // Facility search and selection functions
  const searchFacilities = async (searchTerm) => {
    debouncedSearchFacilities(searchTerm);
  };

  const selectFacility = (facility) => {
    handleSurveyDataChange("facilityName", facility.name);
    handleSurveyDataChange("ccn", facility.providerNumber || "");
    handleSurveyDataChange("facilityId", facility._id || facility.id);

    // Handle address - could be string or object
    if (typeof facility.address === "object") {
      handleSurveyDataChange("address", facility.address.street || "");
      handleSurveyDataChange(
        "city",
        facility.address.city || facility.city || ""
      );
      handleSurveyDataChange(
        "state",
        facility.address.state || facility.state || ""
      );
      handleSurveyDataChange(
        "zipCode",
        facility.address.zipCode || facility.zipCode || ""
      );
    } else {
      handleSurveyDataChange("address", facility.address || "");
      handleSurveyDataChange("city", facility.city || "");
      handleSurveyDataChange("state", facility.state || "");
      handleSurveyDataChange("zipCode", facility.zipCode || "");
    }

    // Handle contact information from array structure
    const contactInfo =
      Array.isArray(facility.contact) && facility.contact.length > 0
        ? facility.contact[0]
        : null;

    handleSurveyDataChange("phone", contactInfo?.phone || facility.phone || "");
    handleSurveyDataChange("email", contactInfo?.email || facility.email || "");

    setFacilityName(facility.name);
    setShowFacilityDropdown(false);
    setFacilities([]);

    // Show success toast
    toast.success("Facility Selected", {
      description: `${facility.name} (CCN: ${
        facility.providerNumber || "N/A"
      }) has been selected`,
      duration: 3000,
    });
  };

  // Get all available states for filtering
  const getAllStates = () => {
    const states = [
      "AL",
      "AK",
      "AZ",
      "AR",
      "CA",
      "CO",
      "CT",
      "DE",
      "FL",
      "GA",
      "HI",
      "ID",
      "IL",
      "IN",
      "IA",
      "KS",
      "KY",
      "LA",
      "ME",
      "MD",
      "MA",
      "MI",
      "MN",
      "MS",
      "MO",
      "MT",
      "NE",
      "NV",
      "NH",
      "NJ",
      "NM",
      "NY",
      "NC",
      "ND",
      "OH",
      "OK",
      "OR",
      "PA",
      "RI",
      "SC",
      "SD",
      "TN",
      "TX",
      "UT",
      "VT",
      "VA",
      "WA",
      "WV",
      "WI",
      "WY",
    ];
    return states;
  };

  // Browse all facilities without search term
  const browseAllFacilities = async () => {
    setIsLoadingFacilities(true);
    try {
      const filters = {
        state: selectedState || "",
      };

      const response = await api.facility.getAllFacilities(filters);

      if (response && response.status && response.data) {
        setFacilities(response.data.facilities || []);
        setShowFacilityDropdown(true);
      } else {
        setFacilities([]);
      }
    } catch (error) {
      setFacilities([]);
      toast.error("Failed to load facilities", { position: "top-right" });
    } finally {
      setIsLoadingFacilities(false);
    }
  };

  // Enhanced handleSurveyDataChange (kept for consistency)
  const handleSurveyDataChangeWithClearError = (field, value) => {
    setHasUnsavedChanges(true);
    handleSurveyDataChange(field, value);
  };

  // Enhanced exportTeamMembers with toast
  const handleExportTeamMembers = () => {
    try {
      exportTeamMembers();
      toast.success("Team Members Exported", {
        description: "Team member list has been exported successfully",
        duration: 3000,
      });
    } catch (error) {
      toast.error("Export Failed", {
        description: "Failed to export team members. Please try again.",
        duration: 4000,
      });
    }
  };

  // Helper function to find team coordinator member by email or ID
  const findTeamCoordinatorMember = () => {
    if (!surveyData.teamCoordinator) return null;
    
    // First try to find by email (new format)
    let member = teamMembers.find((m) => m.email === surveyData.teamCoordinator);
    
    // If not found, try by ID (backward compatibility)
    if (!member) {
      member = teamMembers.find((m) => m.id === surveyData.teamCoordinator);
    }
    
    return member;
  };

  // Enhanced handleSetTeamCoordinator with toast
  const handleSetTeamCoordinatorWithToast = async (memberId) => {
    try {
      // Check if the member being set already has the "Team Coordinator" role
      const member = teamMembers.find((m) => m.id === memberId);
      if (member && getRoleName(member.role, roleIdToName) === "Team Coordinator") {
        toast.error("Already Team Coordinator", {
          description: `${member.name} already has the Team Coordinator role.`,
          duration: 4000,
        });
        return;
      }

      // Update local state first
      handleSetTeamCoordinator(memberId);
      
      // If survey exists, trigger update immediately
      if (localStorage.getItem("currentSurveyId")) {
        // Pass the new TC identifier explicitly to avoid state update race condition
        const newTCIdentifier = member.email || memberId;
        await handleUpdateSurvey(false, newTCIdentifier);
      } else {
        // If new survey, just show toast (will be saved on create)
        toast.success("Team Coordinator Set", {
          description: `${member?.name || "Team member"} has been set as the Team Coordinator`,
          duration: 3000,
        });
      }
    } catch (error) {
      toast.error("Failed to Set Coordinator", {
        description:
          "There was an error setting the team coordinator. Please try again.",
        duration: 4000,
      });
    }
  };

  // Enhanced handleRemoveTeamMember with toast
  const handleRemoveTeamMemberWithToast = (memberId) => {
    try {
      handleRemoveTeamMember(memberId);
    } catch (error) {
      toast.error("Failed to Remove Member", {
        description:
          "There was an error removing the team member. Please try again.",
        duration: 4000,
      });
    }
  };

  // Task assignment functions
  const handleOpenTaskAssignment = (member) => {
    setSelectedMemberForTasks(member);
    setShowTaskAssignmentModal(true);
  };

  const getTaskDisplayName = (taskId) => {
    // Try to find by _id first (for new data), then fall back to key (for legacy data)
    const task = availableTasks.find((task) => task._id === taskId || task.key === taskId);
    return task ? task.name : taskId;
  };

  const handleTaskAssignmentChange = (taskId, isAssigned) => {
    if (!selectedMemberForTasks) return;

    if (!availableTasks.some((task) => task._id === taskId)) {
      toast.error("Selected task is no longer available", {
        duration: 3000,
        position: "top-right",
      });
      return;
    }

    // Check if task is already assigned to another member (only when assigning, not removing)
    if (isAssigned) {
      const taskAlreadyAssigned = teamMembers.some(
        (member) =>
          member.id !== selectedMemberForTasks.id &&
          member.assignedFacilityTasks &&
          member.assignedFacilityTasks.some(t => (typeof t === 'object' ? t._id : t) === taskId)
      );

      if (taskAlreadyAssigned) {
        const taskName =
          availableTasks.find((task) => task._id === taskId)?.name || taskId;
        toast.error(`${taskName} is already assigned to another team member`, {
          duration: 3000,
          position: "top-right",
        });
        return;
      }
    }

    // Get the current tasks from the selected member
    const currentTasks = selectedMemberForTasks.assignedFacilityTasks || [];
    
    // Check if task already exists before adding (prevent duplicates)
    const taskAlreadyAssigned = currentTasks.some(t => (typeof t === 'object' ? t._id : t) === taskId);
    
    const updatedTasks = isAssigned
      ? (taskAlreadyAssigned ? currentTasks : [...currentTasks, taskId]) // Only add if not already present
      : currentTasks.filter((task) => (typeof task === 'object' ? task._id : task) !== taskId);

    // Update the team members in survey data
    const updatedTeamMembers = teamMembers.map((member) => {
      if (member.id === selectedMemberForTasks.id) {
        return {
          ...member,
          assignedFacilityTasks: updatedTasks,
        };
      }
      return member;
    });

    handleSurveyDataChange("teamMembers", updatedTeamMembers);

    // Update local state with the correct tasks immediately
    setSelectedMemberForTasks({
      ...selectedMemberForTasks,
      assignedFacilityTasks: updatedTasks,
    });

    // Show feedback toast
      const taskName = getTaskDisplayName(taskId);
    toast.success(
      isAssigned
        ? `${taskName} assigned to ${selectedMemberForTasks.name}`
        : `${taskName} removed from ${selectedMemberForTasks.name}`,
      {
        duration: 2000,
        position: "top-right",
      }
    );
  };

  const handleCloseTaskAssignment = () => {
    setShowTaskAssignmentModal(false);
    setSelectedMemberForTasks(null);
  };

  const handleSelectAllTasks = () => {
    if (!selectedMemberForTasks) return;

    if (loadingFacilityTasks || availableTasks.length === 0) {
      toast.warning("Mandatory tasks are still loading", {
        duration: 3000,
        position: "top-right",
      });
      return;
    }

    // Get tasks that are not already assigned to other members
    const availableTaskIds = availableTasks
      .filter((task) => {
        return !teamMembers.some(
          (member) =>
            member.id !== selectedMemberForTasks.id &&
            member.assignedFacilityTasks &&
            member.assignedFacilityTasks.some(t => (typeof t === 'object' ? t._id : t) === task._id)
        );
      })
      .map((task) => task._id);

    if (availableTaskIds.length === 0) {
      toast.warning("All tasks are already assigned to other team members", {
        duration: 3000,
        position: "top-right",
      });
      return;
    }

    const updatedTeamMembers = teamMembers.map((member) => {
      if (member.id === selectedMemberForTasks.id) {
        return {
          ...member,
          assignedFacilityTasks: availableTaskIds,
        };
      }
      return member;
    });

    handleSurveyDataChange("teamMembers", updatedTeamMembers);
    setSelectedMemberForTasks({
      ...selectedMemberForTasks,
      assignedFacilityTasks: availableTaskIds,
    });

    toast.success(
      `${availableTaskIds.length} available tasks assigned to ${selectedMemberForTasks.name}`,
      {
        duration: 2000,
        position: "top-right",
      }
    );
  };

  const handleClearAllTasks = () => {
    if (!selectedMemberForTasks) return;

    const updatedTeamMembers = teamMembers.map((member) => {
      if (member.id === selectedMemberForTasks.id) {
        return {
          ...member,
          assignedFacilityTasks: [],
        };
      }
      return member;
    });

    handleSurveyDataChange("teamMembers", updatedTeamMembers);
    setSelectedMemberForTasks({
      ...selectedMemberForTasks,
      assignedFacilityTasks: [],
    });

    toast.success(`All tasks removed from ${selectedMemberForTasks.name}`, {
      duration: 2000,
      position: "top-right",
    });
  };

  const formatTaskName = (taskOrId) => {
    if (typeof taskOrId === 'object' && taskOrId !== null) {
        return taskOrId.title || taskOrId.name || "Untitled Task";
    }
    return getTaskDisplayName(taskOrId);
  };

  // Handle resource download
  const handleResourceDownload = async (resourceId, resourceName) => {
    try {
      // Show loading toast
      const loadingToast = toast.loading("Downloading Resource", {
        description: `Preparing ${resourceName} for download...`,
        duration: 0, // Keep loading until dismissed
      });

      // Call API to download resource
      await api.resource.viewResource(resourceId);

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("Download Complete", {
        description: `${resourceName} has been downloaded successfully`,
        duration: 3000,
      });
    } catch (error) {
      // Show error toast
      toast.error("Download Failed", {
        description:
          error.message ||
          `Failed to download ${resourceName}. Please try again.`,
        duration: 5000,
        action: {
          label: "Retry",
          onClick: () => handleResourceDownload(resourceId, resourceName),
        },
      });
    }
  };

  // Handle clicks outside the facility dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        facilityDropdownRef.current &&
        !facilityDropdownRef.current.contains(event.target)
      ) {
        setShowFacilityDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Validate survey data before submission
  const validateSurveyData = () => {
    const errors = [];

    if (!surveyData.surveyCreationDate) {
      errors.push("Survey creation date is required");
    }

    if (!surveyData.surveyCategory) {
      errors.push("Survey category is required");
    }

    if (!surveyData.census || surveyData.census === "") {
      errors.push("Census is required");
    }

    if (!surveyData.facilityName) {
      errors.push("Facility name is required");
    }

    if (!surveyData.facilityId) {
      errors.push("Facility selection is required");
    }

  

    if (teamMembers.length === 0) {
      errors.push("At least one team member is required");
    }


    return errors;
  };

  // Handle survey submission and API call
  const handleSurveySubmit = async (isContinueClicked = true) => {
    // Validate data first
    const validationErrors = validateSurveyData();
    if (validationErrors.length > 0) {
      toast.error("Validation Failed", {
        description: validationErrors.join(", "),
        duration: 5000,
      });
      return false;
    }

    setIsSubmitting(true);

    // Show loading toast
    const loadingToast = isContinueClicked 
      ? toast.loading("Creating survey...", {
          description: "Please wait while we save your survey data",
          position: "top-right",
        })
      : toast.loading("Saving survey...", {
          description: "Please wait while we save your survey data",
          position: "top-right",
        });

    try {
      // Find team coordinator email from team members
      // Check by email first (new format), then by ID (backward compatibility)
      let teamCoordinatorMember = teamMembers.find(
        (member) => member.email === surveyData.teamCoordinator
      );
      if (!teamCoordinatorMember) {
        teamCoordinatorMember = teamMembers.find(
          (member) => member.id === surveyData.teamCoordinator
        );
      }
      const teamCoordinatorEmail = teamCoordinatorMember
        ? teamCoordinatorMember.email
        : "";

      // Calculate Initial Pool and Final Sample based on census
      const initialPool = getInitialPool(surveyData.census);
      const finalSample = getFinalSample(surveyData.census);

      // Prepare team members with teamCoordinator flag
      const formattedTeamMembers = teamMembers.map(member => {
        // Remove fields not needed by the API
        const { id, _id, assignedResidents, updatedAt, createdAt, ...memberWithoutExtraFields } = member;
        return {
          ...memberWithoutExtraFields,
          invited: true,
          teamCoordinator: member.email === surveyData.teamCoordinator || member.id === surveyData.teamCoordinator,
          assignedFacilityTasks: (member.assignedFacilityTasks || []).map(taskId => {
            const id = typeof taskId === 'object' ? (taskId._id || taskId.id) : taskId;
            return { mandatorytaskId: id };
          })
        };
      });

 

      // Prepare survey data payload
      const surveyPayload = {
        surveyCreationDate: surveyData.surveyCreationDate,
        surveyCategory: surveyData.surveyCategory,
        census: surveyData.census,
        initialPool: initialPool,
        finalSample: finalSample,
        facilityId: surveyData.facilityId,
        teamMembers: formattedTeamMembers, // Includes assignedFacilityTasks for each member 
        status: "setup",
      };

      // Check if online before making API call
      if (!navigator.onLine) {
        // Save offline and inform user
        const saveOfflineData = async (payload) => {
          try {
            const offlineData = {
              ...payload,
              submittedAt: new Date().toISOString(),
              apiEndpoint: "addSurveyWizard", // Store which API to call
              apiMethod: "survey", // Store API method/namespace
            };

            // Step 1: Save to IndexedDB sync queue (permanent storage)
            // For survey creation, we don't have a surveyId yet, so we'll use a temporary identifier
            let syncQueueId = null;
            const tempSurveyId = `temp_${Date.now()}`; // Temporary ID for survey creation
            const stepId = "survey-setup";
            const syncItem = await surveyIndexedDB.addToSyncQueue(
              tempSurveyId,
              stepId,
              offlineData,
              "api_survey_setup" // type for API-based survey setup
            );
            syncQueueId = syncItem.id;

            // Step 2: Update Zustand store (UI state) with sync queue ID
            useSurveyStore.getState().setOfflineData({
              ...offlineData,
              syncQueueId, // Store the sync queue ID for proper cleanup
            });

            // Step 3: If online, trigger sync attempt
            if (navigator.onLine) {
              // The sync service will automatically sync when online
              // But we can trigger an immediate sync attempt
              surveySyncService.syncUnsyncedData().catch(
                (error) => {
                  // Sync failed, but data is saved offline - this is expected if still offline
                  // console.log("Sync attempt failed, data saved offline:", error);
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

        await saveOfflineData(surveyPayload);
        toast.dismiss(loadingToast);
        toast.success("Internet connectivity issues detected. Data saved offline and will sync when connection is restored.", {
          position: "top-right",
          duration: 5000,
        });
        setIsSubmitting(false);
        return true; // Exit early - data is saved offline (but successfully)
      }

      // Make API call to create survey using the new endpoint (only if online)
      const response = await api.survey.addSurveyWizard(surveyPayload);

      if (response.statusCode === 200 || response.statusCode === 201) {
        // Store survey ID for future use
        const surveyId = response.data?._id || response.data?.id || response.id;
        if (surveyId) {
          setHasUnsavedChanges(false);
          localStorage.setItem("currentSurveyId", surveyId);
          
          // Store team coordinator email in localStorage for immediate access
          if (teamCoordinatorEmail) {
            localStorage.setItem("currentSurveyTeamCoordinator", teamCoordinatorEmail);
          }
        }

        // Dismiss loading toast
        toast.dismiss(loadingToast, { position: "top-right" });

        if (isContinueClicked) {
          // Handle navigation based on survey type
          if (surveyData.surveyCategory === "Life Safety Survey") {
            // Show success toast for Life Safety Survey
            toast.success("Survey Created Successfully!", {
              description: "Redirecting to Life Safety Survey page...",
              duration: 3000,
            });

            // Store facility data in localStorage for the Life Safety Survey
            const facilityData = {
              facilityName: surveyData.facilityName || "",
              ccn: surveyData.ccn || "",
              address: surveyData.address || "",
              city: surveyData.city || "",
              state: surveyData.state || "",
              zipCode: surveyData.zipCode || "",
              phone: surveyData.phone || "",
              email: surveyData.email || "",
              surveyCreationDate: surveyData.surveyCreationDate || "",
              surveyCategory: surveyData.surveyCategory,
              surveyId: surveyId,
            };

            localStorage.setItem(
              "lifeSafetySurveyFacilityData",
              JSON.stringify(facilityData)
            );

            // Navigate to Life Safety Survey page
            setTimeout(() => {
              window.location.href = "/life-safety-survey";
            }, 1500);
          } else if (surveyData.surveyCategory === "Risk Based Survey") { 
            // Show success toast for Facility Initiated Survey
            toast.success("Survey Created Successfully!", {
              description: "Redirecting to Risk Based Survey page...",
              duration: 3000,
            });

            // Store facility data in localStorage for the Risk Based Survey
            const facilityData = {
              facilityName: surveyData.facilityName || "",
              ccn: surveyData.ccn || "",
              address: surveyData.address || "",
              city: surveyData.city || "",
              state: surveyData.state || "",
              zipCode: surveyData.zipCode || "",
              phone: surveyData.phone || "",
              email: surveyData.email || "",
              surveyCreationDate: surveyData.surveyCreationDate || "",
              surveyCategory: surveyData.surveyCategory,
              surveyId: surveyId,
            };

            localStorage.setItem(
              "facilityInitiatedSurveyFacilityData",
              JSON.stringify(facilityData)
            );

            // Navigate to Facility Initiated Survey page
            setTimeout(() => {
              window.location.href = "/risk-based-survey";
            }, 1500);
          } else {
            // Show success toast for other survey types
            toast.success("Survey Created Successfully!", {
              description: "Proceeding to next step...",
              duration: 3000,
              position: "top-right",
            });

            // Continue to next step for other survey types
            setTimeout(() => {
              setCurrentStep(2);
            }, 1500);
          }
        } else {
          // Just save without navigating
          toast.success("Progress saved successfully!", { position: "top-right", duration: 3000 });
        }
        return true; // Success
      } else {
        throw new Error(response.message || "Failed to create survey");
      }
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast, { position: "top-right" });

      // Show error toast
      toast.error("Failed to Create Survey", {
        description:
          error.message || "An unexpected error occurred. Please try again.",
        duration: 5000,
        action: {
          label: "Retry",
          onClick: () => handleSurveySubmit(),
        },
        position: "top-right",
      });
      return false; // Failure
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSurvey = async (isContinueClicked = true, overrideTeamCoordinator = null) => {
    const validationErrors = validateSurveyData();
    if (validationErrors.length > 0) {
      toast.error("Validation Failed", {
        description: validationErrors.join(", "),
        duration: 5000,
      });
      return false;
    }

    setIsSubmitting(true);

    // Determine the effective Team Coordinator identifier (handle race condition with state updates)
    const effectiveTC = overrideTeamCoordinator !== null ? overrideTeamCoordinator : surveyData.teamCoordinator;

    // Show loading toast
    const loadingToast = isContinueClicked
      ? toast.loading("Updating survey...", {
          description: "Please wait while we save your survey data",
          position: "top-right",
        })
      : toast.loading("Saving survey...", {
          description: "Please wait while we save your survey data",
          position: "top-right",
        });

    try {
      // Find team coordinator email from team members
      // Check by email first (new format), then by ID (backward compatibility)
      let teamCoordinatorMember = teamMembers.find(
        (member) => member.email === effectiveTC
      );
      if (!teamCoordinatorMember) {
        teamCoordinatorMember = teamMembers.find(
          (member) => member.id === effectiveTC
        );
      }
      const teamCoordinatorEmail = teamCoordinatorMember
        ? teamCoordinatorMember.email
        : "";

      // Calculate Initial Pool and Final Sample based on census
      const initialPool = getInitialPool(surveyData.census);
      const finalSample = getFinalSample(surveyData.census);

      // Prepare team members with teamCoordinator flag
      const formattedTeamMembers = teamMembers.map(member => {
        // Exclude fields not needed by the API
        const { id, _id, teamMemberUserId, assignedResidents, updatedAt, createdAt, ...memberRest } = member;
        
        const memberPayload = {
          ...memberRest,
          invited: true,
          teamCoordinator: member.email === effectiveTC || member.id === effectiveTC,
          assignedFacilityTasks: (member.assignedFacilityTasks || []).map(task => {
            if (typeof task === 'object') {
                const payload = { mandatorytaskId: task._id || task.id };
                if (task.assignedFacilityId) {
                    payload.assignedFacilityId = task.assignedFacilityId;
                }
                return payload;
            } else {
                return { mandatorytaskId: task };
            }
          })
        };

        // Add teamMemberId if it is a valid MongoDB ID (24 hex chars)
        // Use existing teamMemberId if present, otherwise check id or _id
        if (!memberPayload.teamMemberId) {
            if (id && /^[0-9a-fA-F]{24}$/.test(id)) {
                memberPayload.teamMemberId = id;
            } else if (_id && /^[0-9a-fA-F]{24}$/.test(_id)) {
                memberPayload.teamMemberId = _id;
            }
        }

        return memberPayload;
      });


      // Prepare survey data payload
      const surveyPayload = {
        surveyId: localStorage.getItem("currentSurveyId"),
        surveyCreationDate: surveyData.surveyCreationDate,
        surveyCategory: surveyData.surveyCategory,
        census: surveyData.census,
        initialPool: initialPool,
        finalSample: finalSample,
        facilityId: surveyData.facilityId,
        teamMembers: formattedTeamMembers, // Includes assignedFacilityTasks for each member
      
        status: "setup",
      };

      // Make API call to create survey using the new endpoint
      const response = await api.survey.updateSurveyWizard(surveyPayload);

      if (response.statusCode === 200 || response.statusCode === 201) {
        setHasUnsavedChanges(false);
        // Store survey ID for future use
        const surveyId = response.data?._id || response.data?.id || response.id;
          if (surveyId) {
          localStorage.setItem("currentSurveyId", surveyId);
          
          // Store team coordinator email in localStorage for immediate access
          if (teamCoordinatorEmail) {
            localStorage.setItem("currentSurveyTeamCoordinator", teamCoordinatorEmail);
          }
        }

        // Dismiss loading toast
        toast.dismiss(loadingToast, { position: "top-right" });

        if (isContinueClicked) {
          // Handle navigation based on survey type
          if (surveyData.surveyCategory === "Life Safety Survey") {
            // Show success toast for Life Safety Survey
            toast.success("Survey Updated Successfully!", {
              description: "Redirecting to Life Safety Survey page...",
              duration: 3000,
            });

            // Store facility data in localStorage for the Life Safety Survey
            const facilityData = {
              facilityName: surveyData.facilityName || "",
              ccn: surveyData.ccn || "",
              address: surveyData.address || "",
              city: surveyData.city || "",
              state: surveyData.state || "",
              zipCode: surveyData.zipCode || "",
              phone: surveyData.phone || "",
              email: surveyData.email || "",
              surveyCreationDate: surveyData.surveyCreationDate || "",
              surveyCategory: surveyData.surveyCategory,
              surveyId: surveyId,
            };

            localStorage.setItem(
              "lifeSafetySurveyFacilityData",
              JSON.stringify(facilityData)
            );

            // Navigate to Life Safety Survey page
            setTimeout(() => {
              window.location.href = "/life-safety-survey";
            }, 1500);
          } else if (surveyData.surveyCategory === "Risk Based Survey") {
            // Show success toast for Facility Initiated Survey
            toast.success("Survey Updated Successfully!", {
              description: "Redirecting to Risk Based Survey page...", 
              duration: 3000,
            });

            // Store facility data in localStorage for the Facility Initiated Survey
            const facilityData = {
              facilityName: surveyData.facilityName || "",
              ccn: surveyData.ccn || "",
              address: surveyData.address || "",
              city: surveyData.city || "",
              state: surveyData.state || "",
              zipCode: surveyData.zipCode || "",
              phone: surveyData.phone || "",
              email: surveyData.email || "",
              surveyCreationDate: surveyData.surveyCreationDate || "",
              surveyCategory: surveyData.surveyCategory,
              surveyId: surveyId,
            };

            localStorage.setItem(
              "facilityInitiatedSurveyFacilityData",
              JSON.stringify(facilityData)
            );

            // Navigate to Facility Initiated Survey page
            setTimeout(() => {
              window.location.href = "/risk-based-survey";  
            }, 1500);
          } else {
            // Show success toast for other survey types
            toast.success("Survey Updated Successfully!", {
              description: "Proceeding to next step...",
              duration: 3000,
              position: "top-right",
            });

            // Continue to next step for other survey types
            setTimeout(() => {
              setCurrentStep(2);
            }, 1500);
          }
        } else {
          // Just save without navigating
          toast.success("Progress saved successfully!", { position: "top-right", duration: 3000 });
        }
        return true; // Success
      } else {
        throw new Error(response.message || "Failed to update survey");
      }
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast, { position: "top-right" });

      // Show error toast
      toast.error("Failed to Update Survey", {
        description:
          error.message || "An unexpected error occurred. Please try again.",
        duration: 5000,
        action: {
          label: "Retry",
          onClick: () => handleSurveySubmit(),
        },
        position: "top-right",
      });
      return false; // Failure
    } finally {
      setIsSubmitting(false);
    }
  }

  const executeNext = () => {
    if (surveyData.surveyCategory === "Life Safety Survey") {
      const facilityData = {
        facilityName: surveyData.facilityName || "",
        ccn: surveyData.ccn || "",
        address: surveyData.address || "",
        city: surveyData.city || "",
        state: surveyData.state || "",
        zipCode: surveyData.zipCode || "",
        phone: surveyData.phone || "",
        email: surveyData.email || "",
        surveyCreationDate: surveyData.surveyCreationDate || "",
        surveyCategory: surveyData.surveyCategory,
        surveyId: localStorage.getItem("currentSurveyId"),
      };
      localStorage.setItem(
        "lifeSafetySurveyFacilityData",
        JSON.stringify(facilityData)
      );
      window.location.href = "/life-safety-survey";
    } else if (surveyData.surveyCategory === "Risk Based Survey") {
      const facilityData = {
        facilityName: surveyData.facilityName || "",
        ccn: surveyData.ccn || "",
        address: surveyData.address || "",
        city: surveyData.city || "",
        state: surveyData.state || "",
        zipCode: surveyData.zipCode || "",
        phone: surveyData.phone || "",
        email: surveyData.email || "",
        surveyCreationDate: surveyData.surveyCreationDate || "",
        surveyCategory: surveyData.surveyCategory,
        surveyId: localStorage.getItem("currentSurveyId"),
      };
      localStorage.setItem(
        "facilityInitiatedSurveyFacilityData",
        JSON.stringify(facilityData)
      );
      window.location.href = "/risk-based-survey";
    } else {
      setCurrentStep(2);
    }
  };

  const handleNext = () => {
    if (hasUnsavedChanges) {
      setPendingNavigation({ type: 'callback', callback: executeNext });
      setShowExitWarning(true);
    } else {
      executeNext();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 sm:pb-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
            {sectionData[0].title}
          </h2>
          {isSurveyClosed && (
            <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300 flex-shrink-0">
              Survey Closed
            </Badge>
          )}
        </div>
        <p className="text-gray-500 text-xs sm:text-sm leading-tight">
          {sectionData[0].description}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Left Column - Survey Setup */}
        <div className="space-y-4 sm:space-y-6">
          {/* Survey Creation */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#075b7d] flex-shrink-0" />
              Survey Setup
            </h3>

            <div className="space-y-4">
              <div>
                <Label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">
                  Survey Creation Date
                </Label>
                <DatePicker
                  disabled={isInvitedUser() || isSurveyClosed}
                  date={(() => {
                    // If no date is set, default to today
                    const dateValue =
                      surveyData.surveyCreationDate ||
                      new Date().toISOString().split("T")[0];

                    if (dateValue && dateValue !== "") {
                      let date;

                      // Handle different date formats
                      if (dateValue.includes("T")) {
                        // It's already an ISO string, use it directly
                        date = new Date(dateValue);
                      } else {
                        // It's a date string (YYYY-MM-DD), add time component
                        date = new Date(dateValue + "T00:00:00");
                      }

                      return isNaN(date.getTime()) ? undefined : date;
                    }
                    return undefined;
                  })()}
                  onSelect={(date) =>
                    handleSurveyDataChangeWithClearError(
                      "surveyCreationDate",
                      date ? date.toISOString().split("T")[0] : null
                    )
                  }
                  placeholder="Select survey creation date"
                  className="w-full"
                />
              </div>

              <div>
                <Label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">
                  Survey Category
                </Label>
                <select
                  value={surveyData.surveyCategory || ""}
                  onChange={(e) =>
                    handleSurveyDataChangeWithClearError(
                      "surveyCategory",
                      e.target.value
                    )
                  }
                  className="w-full h-10 text-xs sm:text-sm rounded-lg border border-gray-300 bg-white px-3 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d]"
                  disabled={loadingCategories || isInvitedUser() || isSurveyClosed}
                > 
                  <option value="">
                    {loadingCategories
                      ? "Loading categories..."
                      : "Select survey category"}
                  </option>
                  {surveyCategories.map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">
                  Census <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  disabled={isInvitedUser() || isSurveyClosed}
                  value={surveyData.census || ""}
                  onChange={(e) =>
                    handleSurveyDataChangeWithClearError(
                      "census",
                      parseInt(e.target.value) || ""
                    )
                  }
                  placeholder="Enter facility census"
                  className="w-full h-10 text-xs sm:text-sm rounded-lg border border-gray-300 bg-white px-3 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d]"
                />
                <p className="text-xs text-gray-500 mt-1 break-words">
                  Enter the current number of residents at the facility
                </p>

                {/* Census Calculation Display */}
                {surveyData.census && surveyData.census > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-xs sm:text-sm font-semibold text-blue-900 mb-2">
                      Sampling Requirements
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-medium text-blue-800">
                          Initial Pool:
                        </span>
                        <span className="ml-1 text-blue-700">
                          {getInitialPool(surveyData.census)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">
                          Final Sample:
                        </span>
                        <span className="ml-1 text-blue-700">
                          {getFinalSample(surveyData.census)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      Based on census of {surveyData.census} residents
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Facility Information */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <Building className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#075b7d] flex-shrink-0" />
              Facility Information
            </h3>

            <div className="space-y-4">
              {/* Facility Search and Selection */}
              <div className="relative" ref={facilityDropdownRef}>
                <Label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">
                  Search and Select Facility
                </Label>

                {/* Search Options */}
                <div className="mb-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="search-name"
                        name="searchType"
                        value="name"
                        checked={searchType === "name"}
                        onChange={(e) => setSearchType(e.target.value)}
                        disabled={isInvitedUser() || isSurveyClosed}
                        className="w-4 h-4 text-[#075b7d] border-gray-300 focus:ring-[#075b7d] flex-shrink-0"
                      />
                      <label
                        htmlFor="search-name"
                        className="text-xs sm:text-sm text-gray-700"
                      >
                        Name
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="search-state"
                        name="searchType"
                        value="state"
                        checked={searchType === "state"}
                        onChange={(e) => setSearchType(e.target.value)}
                        disabled={isInvitedUser() || isSurveyClosed}
                        className="w-4 h-4 text-[#075b7d] border-gray-300 focus:ring-[#075b7d] flex-shrink-0"
                      />
                      <label
                        htmlFor="search-state"
                        className="text-xs sm:text-sm text-gray-700"
                      >
                        State
                      </label>
                    </div>
                  </div>

                  {/* State Filter */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-2">
                    <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                      Filter by State:
                    </span>
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      disabled={isInvitedUser() || isSurveyClosed}
                      className="h-8 px-2 text-xs sm:text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] flex-1 sm:flex-none"
                    >
                      <option value="">All States</option>
                      {getAllStates().map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    <Button
                      onClick={browseAllFacilities}
                      disabled={isInvitedUser() || isSurveyClosed}
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs w-full sm:w-auto"
                    >
                      Browse All
                    </Button>
                  </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Input
                    value={facilityName}
                    onChange={(e) => {
                      setFacilityName(e.target.value);
                      if (e.target.value.length >= 2) {
                        searchFacilities(e.target.value);
                        setShowFacilityDropdown(true);
                      } else {
                        setShowFacilityDropdown(false);
                        setFacilities([]);
                      }
                    }}
                    onFocus={() => {
                      if (facilityName.length >= 2) {
                        setShowFacilityDropdown(true);
                      }
                    }}
                    disabled={isInvitedUser() || isSurveyClosed}
                    placeholder={
                      searchType === "name"
                        ? "Search by facility name..."
                        : searchType === "ccn"
                        ? "Search by CCN number..."
                        : "Search by state abbreviation..."
                    }
                    className="h-10 text-xs sm:text-sm rounded-lg pr-10 cursor-pointer"
                  />
                  {isLoadingFacilities && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#075b7d]"></div>
                    </div>
                  )} 
                  {!isLoadingFacilities && facilityName && (
                    <button
                      onClick={() => {
                        setFacilityName("");
                        setFacilities([]);
                        setShowFacilityDropdown(false);
                        // Clear facility data
                        handleSurveyDataChange("facilityName", "");
                        handleSurveyDataChange("facilityId", "");
                        handleSurveyDataChange("ccn", "");
                        handleSurveyDataChange("address", "");
                        handleSurveyDataChange("state", "");
                        handleSurveyDataChange("zipCode", "");
                        handleSurveyDataChange("phone", "");
                        handleSurveyDataChange("email", "");
                      }}
                      disabled={isSurveyClosed}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ${
                        isSurveyClosed ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Facility Dropdown */}
                {showFacilityDropdown && facilities.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600">
                      {facilities.length} facility
                      {facilities.length !== 1 ? "ies" : ""} found
                    </div>
                    {facilities.map((facility) => (
                      <div
                        key={facility._id || facility.id}
                        onClick={() => selectFacility(facility)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="text-sm sm:text-base font-medium text-gray-900 break-words">
                          {facility.name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 break-words">
                          CCN: {facility.providerNumber || "N/A"} •{" "}
                          {facility.address?.city || facility.city || "N/A"},{" "}
                          {facility.address?.state || facility.state || "N/A"}
                        </div>
                        <div className="text-xs text-gray-500 break-words">
                          {typeof facility.address === "object"
                            ? `${facility.address.street || ""}, ${
                                facility.address.city || ""
                              }, ${facility.address.state || ""} ${
                                facility.address.zipCode || ""
                              }`
                            : facility.address}
                          , {facility.zipCode}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 break-words">
                          📞{" "}
                          {Array.isArray(facility.contact) &&
                          facility.contact.length > 0
                            ? facility.contact[0]?.phone || "N/A"
                            : facility.phone || "N/A"}{" "}
                          • ✉️{" "}
                          {Array.isArray(facility.contact) &&
                          facility.contact.length > 0
                            ? facility.contact[0]?.email || "N/A"
                            : facility.email || "N/A"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No Results Message */}
                {showFacilityDropdown &&
                  facilityName.length >= 2 &&
                  facilities.length === 0 &&
                  !isLoadingFacilities && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                      <div className="text-sm text-gray-500 text-center">
                        No facilities found. Try a different search term.
                      </div>
                    </div>
                  )}
              </div>

              {/* Selected Facility Display */}
              {surveyData.facilityName && (
                <div className="p-3 sm:p-4 border border-[#075b7d]/20 rounded-lg">
                  <h4 className="text-xs sm:text-sm font-semibold text-[#075b7d] mb-2 sm:mb-3">
                    Selected Facility
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">Name:</span>
                      <span className="ml-2 text-gray-900 break-words">
                        {surveyData.facilityName}
                      </span>
                    </div>

                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">CCN:</span>
                      <span className="ml-2 text-gray-900 break-words">
                        {surveyData.ccn}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">Phone:</span>
                      <span className="ml-2 text-gray-900 break-words">
                        {surveyData.phone}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">Email:</span>
                      <span className="ml-2 text-gray-900 break-words">
                        {surveyData.email}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">
                        Address:
                      </span>
                      <span className="ml-2 text-gray-900 break-words">
                        {surveyData.address}, {surveyData.city},{" "}
                        {surveyData.state} {surveyData.zipCode}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
           {/* Mock Survey Resources */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              Mock Survey Resources
            </h3>

            <div className="grid grid-cols-1 gap-2 sm:gap-3">
              <button
                onClick={() =>
                  handleResourceDownload(
                    "68d45d716cfe20de0a4a2445",
                    "Facility Entrance Conference Worksheet"
                  )
                }
                className="w-full inline-flex items-center justify-start h-10 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="break-words">Download Facility Entrance Conference Worksheet</span>
              </button>
              <button
                onClick={() =>
                  handleResourceDownload(
                    "68d461796cfe20de0a4a249c",
                    "CMS-672 Resident Census Form"
                  )
                }
                className="w-full inline-flex items-center justify-start h-10 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="break-words">Download CMS-671 Resident Census Form</span>
              </button>
              <button
                onClick={() =>
                  handleResourceDownload(
                    "68d462756cfe20de0a4a24bb",
                    "CMS-802 Roster/Sample Matrix Form"
                  )
                }
                className="w-full inline-flex items-center justify-start h-10 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="break-words">Download CMS-802 Roster/Sample Matrix Form</span>
              </button>
              <button
                onClick={() =>
                  handleResourceDownload(
                    "68d4686399860dc0a48a564c",
                    "Team Assignment Worksheet"
                  )
                }
                className="w-full inline-flex items-center justify-start h-10 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="break-words">Download Team Assignment Worksheet</span>
              </button>
              <button
                onClick={() =>
                  handleResourceDownload(
                    "68d464546cfe20de0a4a24f9",
                    "State Operations Manual-Appendix PP"
                  )
                }
                className="w-full inline-flex items-center justify-start h-10 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="break-words">Download State Operations Manual-Appendix PP</span>
              </button>
              <a
                href="/resource-center"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-start h-10 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="break-words">Long Term Care Regulations-State by State</span>
              </a>
              <button
                onClick={() =>
                  handleResourceDownload(
                    "68d463b66cfe20de0a4a24da",
                    "Critical Elements Pathways-PDFs"
                  )
                }
                className="w-full inline-flex items-center justify-start h-10 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="break-words">Download Critical Elements Pathways-PDFs</span>
              </button>

              {/* External CMS and Regulatory Links */}
              <div className="pt-3 mt-3 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  External CMS & Regulatory Resources
                </p>
              </div>

              <a
                href="https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-G/part-483"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-start h-10 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-2" />
                Code of Federal Regulations
              </a>

              <a
                href="https://www.medicare.gov/care-compare/?providerType=NursingHome"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-start h-10 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-2" />
                Nursing Home Compare Page
              </a>

              <a
                href="https://www.cms.gov/medicare/health-safety-standards/certification-compliance/nursing-homes"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-start h-10 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-2" />
                Nursing Home Certification and Compliance
              </a>

              <a
                href="https://www.cms.gov/medicare/health-safety-standards/certification-compliance/life-safety-code-health-care-facilities-code-requirements"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-start h-10 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-2" />
                Life Safety Codes
              </a>

              <a
                href="https://www.cms.gov/medicare/health-safety-standards/certification-compliance"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-start h-10 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-2" />
                Quality and Oversight Enforcement
              </a>

              <a
                href="https://www.cms.gov/medicare/health-safety-standards/quality-safety-oversight-general-information/policy-memos/policy-memos-states-regions"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-start h-10 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-2" />
                CMS Memos and Policy Changes
              </a>

              <a
                href="https://qcor.cms.gov/main.jsp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-start h-10 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-2" />
                QCOR
              </a>
            </div>
          </div>
        
        </div>

        {/* Right Column - Team Management & Tasks */}
        <div className="space-y-4 sm:space-y-6">
          {/* Team Management */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#075b7d] flex-shrink-0" />
              Team Management
            </h3>

            <div className="space-y-4">
              {/* Available Mandatory Tasks Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="w-4 h-4 text-[#075b7d] flex-shrink-0" />
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-900">
                      Available Mandatory Tasks
                    </h4>
                  </div>
                  <Badge variant="outline" className="text-xs bg-white flex-shrink-0">
                    {loadingFacilityTasks
                      ? "Loading..."
                      : `${availableTasks.filter(
                          (task) =>
                            !teamMembers.some(
                              (member) =>
                                member.assignedFacilityTasks &&
                                member.assignedFacilityTasks.some(t => (typeof t === 'object' ? t._id : t) === task._id)
                            )
                        ).length} of ${availableTasks.length} available`}
                  </Badge> 
                </div>
                <div className="space-y-2">
                  {loadingFacilityTasks ? (
                    <p className="text-xs text-gray-600">Loading tasks...</p>
                  ) : availableTasks.length === 0 ? (
                    <p className="text-xs text-gray-600">
                      No mandatory tasks available to assign.
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {availableTasks.map((task) => {
                          const isAssigned = teamMembers.some(
                            (member) =>
                              member.assignedFacilityTasks &&
                              member.assignedFacilityTasks.some(t => (typeof t === 'object' ? t._id : t) === task._id)
                          );
                          const assignedToMember = teamMembers.find(
                            (member) =>
                              member.assignedFacilityTasks &&
                              member.assignedFacilityTasks.some(t => (typeof t === 'object' ? t._id : t) === task._id)
                          );

                          return (
                            <Badge
                              key={task._id}
                              variant={isAssigned ? "secondary" : "default"}
                              className={`text-xs ${
                                isAssigned
                                  ? "bg-green-100 text-green-800 border-green-300"
                                  : "bg-[#075b7d]/10 text-[#075b7d] border-[#075b7d]/20"
                              }`}
                              title={
                                isAssigned && assignedToMember
                                  ? `Assigned to ${assignedToMember.name}`
                                  : "Available to assign"
                              }
                            >
                              {task.name}
                              {isAssigned && assignedToMember && (
                                <span className="ml-1 text-[10px] opacity-75">
                                  ({assignedToMember.name})
                                </span>
                              )}
                            </Badge>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Tasks shown in blue are available to assign. Tasks shown in
                        green are already assigned to team members.
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm text-gray-600">Team Members</span>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {teamMembers.length} member
                    {teamMembers.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  {!isInvitedUser() && (
                    <Button
                      onClick={() => setShowTeamModal(true)}
                      size="sm"
                      className="h-8 px-3 text-xs w-full sm:w-auto"
                      variant="outline"
                      disabled={isSurveyClosed}
                    >
                      <Plus className="w-3 h-3 mr-1 flex-shrink-0" />
                      Add Member
                    </Button>
                  )}
                </div>
              </div>

              {/* Search and Filter */}
              {teamMembers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-2">
                    <div className="flex-1 relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        value={teamMemberSearch}
                        onChange={(e) => setTeamMemberSearch(e.target.value)}
                        disabled={isInvitedUser() || isSurveyClosed}
                        placeholder="Search team members..."
                        className="pl-10 h-8 text-xs sm:text-sm"
                      />
                    </div>
                    <select
                      value={teamMemberFilter}
                      onChange={(e) => setTeamMemberFilter(e.target.value)}
                      disabled={isInvitedUser() || isSurveyClosed}
                      className="h-8 px-2 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] w-full sm:w-auto"
                    >
                      <option value="all">All Members</option>
                      <option value="tc">Team Coordinator</option>
                      <option value="surveyors">Surveyors</option>
                      <option value="specialists">Specialists</option>
                    </select>
                  </div>
                </div>
              )}

              {filteredTeamMembers.length > 0 ? (
                <div className="space-y-3">
                  {filteredTeamMembers.map((member, index) => (
                    <div
                      key={member.id || member._id || index}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-xs sm:text-sm font-semibold text-gray-900 break-words">
                              {member.name}
                            </span>
                            {(member.email === surveyData.teamCoordinator || member.id === surveyData.teamCoordinator) ? (
                              <Badge
                                variant="default"
                                className="bg-[#075b7d]/10 text-[#075b7d] text-xs font-medium flex-shrink-0"
                              >
                                Team Coordinator
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs flex-shrink-0">
                                {getRoleName(member.role, roleIdToName)}
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-1 text-xs text-gray-600">
                            {member.email && (
                              <div className="flex items-center space-x-1">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                <span className="break-words">{member.email}</span>
                              </div>
                            )}
                            {member.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="w-3 h-3 flex-shrink-0" />
                                <span className="break-words">{member.phone}</span>
                              </div>
                            )}
                            {member.specialization && (
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 flex-shrink-0" />
                                <span className="break-words">{member.specialization}</span>
                              </div>
                            )}
                            {member.assignedFacilityTasks &&
                              member.assignedFacilityTasks.length > 0 && (
                                <div className="mt-2">
                                  <div className="flex items-center space-x-1 mb-2">
                                    <CheckSquare className="w-3 h-3 text-[#075b7d]" />
                                    <span className="font-medium text-[#075b7d]">
                                      {member.assignedFacilityTasks.length}{" "}
                                      facility task
                                      {member.assignedFacilityTasks.length !== 1
                                        ? "s"
                                        : ""}
                                    </span>
                                    {!isInvitedUser() && (
                                      <Button
                                        onClick={() =>
                                          handleOpenTaskAssignment(member)
                                        }
                                        size="sm"
                                        variant="outline"
                                        className="h-5 px-2 text-xs ml-2"
                                        disabled={isSurveyClosed}
                                      >
                                        Manage
                                      </Button>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {member.assignedFacilityTasks.map(
                                      (task, idx) => {
                                        const taskId = typeof task === 'object' ? (task._id || idx) : (task || idx);
                                        return (
                                          <Badge
                                            key={taskId}
                                            variant="outline"
                                            className="text-xs bg-[#075b7d]/5 text-[#075b7d] border-[#075b7d]/20"
                                          >
                                            {formatTaskName(task)}
                                          </Badge>
                                        );
                                      }
                                    )}
                                  </div>
                                </div>
                              )}
                            {(!member.assignedFacilityTasks ||
                              member.assignedFacilityTasks.length === 0) && (
                              <div className="flex items-center space-x-1 mt-2">
                                <CheckSquare className="w-3 h-3 text-gray-400" />
                                <span className="text-gray-500 text-xs">
                                  No tasks assigned
                                </span>
                                {!isInvitedUser() && (
                                  <Button
                                    onClick={() =>
                                      handleOpenTaskAssignment(member)
                                    }
                                    size="sm"
                                    variant="outline"
                                    className="h-5 px-2 text-xs ml-2"
                                    disabled={isSurveyClosed}
                                  >
                                    Assign Tasks
                                  </Button>
                                )}
                              </div>
                            )}
                            {member.assignedResidents &&
                              member.assignedResidents.length > 0 && (
                                <div className="flex items-center space-x-1 mt-2">
                                  <Users className="w-3 h-3 text-green-600" />
                                  <span className="font-medium text-green-600">
                                    {member.assignedResidents.length} resident
                                    {member.assignedResidents.length !== 1
                                      ? "s"
                                      : ""}
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 sm:ml-4 flex-shrink-0">
                          {!isInvitedUser() && (
                            <Button
                              onClick={() => handleEditTeamMember(member.id)}
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              title="Edit team member"
                              disabled={isSurveyClosed}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                          )}
                          {member.email !== surveyData.teamCoordinator &&
                            member.id !== surveyData.teamCoordinator &&
                            getRoleName(member.role, roleIdToName) !== "Team Coordinator" &&
                            !isInvitedUser() && (
                              <Button
                                onClick={() =>
                                  handleSetTeamCoordinatorWithToast(member.id)
                                }
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                disabled={isSurveyClosed}
                              >
                                <span className="hidden sm:inline">{surveyData.teamCoordinator ? "Change TC" : "Set TC"}</span>
                                <span className="sm:hidden">{surveyData.teamCoordinator ? "Change" : "Set"}</span>
                              </Button>
                            )}
                          {!isInvitedUser() && (
                            <Button
                              onClick={() =>
                                handleRemoveTeamMemberWithToast(member.id || member._id)
                              }
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                              disabled={isSurveyClosed}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No team members added yet
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No team members match your search criteria
                </div>
              )}

              {/* Team Composition Summary */}
              {teamMembers.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-800">
                      Team Composition
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      Surveyors:{" "}
                      {
                        teamMembers.filter(
                          (m) =>
                            getRoleName(m.role, roleIdToName) === "Surveyor"
                        ).length
                      }
                    </div>
                    <div>
                      Specialists:{" "}
                      {
                        teamMembers.filter(
                          (m) =>
                            getRoleName(m.role, roleIdToName) !== "Surveyor" &&
                            getRoleName(m.role, roleIdToName) !==
                              "Team Coordinator"
                        ).length
                      }
                    </div>
                    <div>
                      Team Coordinator:{" "}
                      {surveyData.teamCoordinator ? "Assigned" : "Not Assigned"}
                    </div>
                    <div>Total: {teamMembers.length}</div>
                  </div>

                  {/* Team Coordinator Display */}
                  <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                    {surveyData.teamCoordinator && (
                      <div className="flex items-center space-x-2">
                        <Shield className="w-3 h-3 text-[#075b7d]" />
                        <span className="text-xs font-medium text-[#075b7d]">
                          TC:
                        </span>
                        <span className="text-xs text-[#075b7d]">
                          {findTeamCoordinatorMember()?.name || "Unknown"}
                        </span>
                      </div>
                    )}
                    {surveyData.teamCoordinator ? (
                      <div className="flex items-start space-x-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-green-900">
                            Team Coordinator Assigned
                          </p>
                          <p className="text-xs text-green-800 mt-1">
                            You can now continue with the survey process.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start space-x-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-amber-900">
                            Team Coordinator Required
                          </p>
                          <p className="text-xs text-amber-800 mt-1">
                            You must assign a Team Coordinator before continuing
                            with the survey process.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

         
        </div>
      </div>

      {isInvitedUser() ? (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-40">
          <Button
            onClick={handleNext}
            className="w-full sm:w-auto h-11 sm:h-12 px-3 sm:px-8 bg-[#075b7d] hover:bg-[#075b7d] text-white text-sm sm:text-base font-medium rounded-full shadow-lg flex items-center justify-center gap-1 sm:gap-2 hover:shadow-xl transition-all"
            size="lg"
          >
            <span className="hidden sm:inline">Next</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          </Button>
        </div>
      ) : (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-40">
          <Button
            onClick={
               // if there is surveyId use update endpoint else use create endpoint
               localStorage.getItem("currentSurveyId") 
                 ? () => handleUpdateSurvey(true) 
                 : () => handleSurveySubmit(true)
            }
            disabled={isSubmitting || isSurveyClosed}
            className="w-full sm:w-auto h-11 sm:h-12 px-3 sm:px-8 bg-[#075b7d] hover:bg-[#075b7d] text-white text-sm sm:text-base font-medium disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full shadow-lg flex items-center justify-center gap-1 sm:gap-2 hover:shadow-xl transition-all"
            size="lg"
          >  
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 flex-shrink-0"></div>
                <span className="hidden sm:inline">Creating Survey...</span>
                <span className="sm:hidden">Creating...</span>
              </div>
            ) : surveyData.surveyCategory === "Life Safety Survey" ? (
              <>
                <span className="hidden sm:inline">Create Survey & Continue to Life Safety</span>
                <span className="sm:hidden">Continue</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              </>
            ) : surveyData.surveyCategory === "Risk Based Survey" ? (
              <>
                <span className="hidden sm:inline">Create Survey & Continue to Risk Based Survey</span>
                <span className="sm:hidden">Continue</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Create Survey & Continue to Offsite Preparation</span>
                <span className="sm:hidden">Continue</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
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
              localStorage.getItem("currentSurveyId") 
                ? handleUpdateSurvey(false) 
                : handleSurveySubmit(false);
            }}
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
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:hidden" />
                <span className="hidden sm:inline">Save Progress</span>
                <span className="sm:hidden">Save</span>
              </>
            )}
          </Button>
         
        </div>
      )}

      {/* Task Assignment Modal */}
      {showTaskAssignmentModal && selectedMemberForTasks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl max-w-md w-full max-h-[calc(100vh-2rem)] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                Assign Tasks to {selectedMemberForTasks.name}
              </h3>
              <Button
                onClick={handleCloseTaskAssignment}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <p className="text-xs sm:text-sm text-gray-600 break-words">
                  Select which facility tasks this team member will be
                  responsible for:
                </p>
                <div className="flex space-x-2 flex-shrink-0">
                  <Button
                    onClick={handleSelectAllTasks}
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    onClick={handleClearAllTasks}
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Task Availability Summary */}
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-xs text-blue-800">
                  <strong>Task Availability:</strong>{" "}
                  {
                    availableTasks.filter(
                      (task) =>
                        !teamMembers.some(
                          (member) =>
                            member.id !== selectedMemberForTasks.id &&
                            member.assignedFacilityTasks &&
                            member.assignedFacilityTasks.some(t => (typeof t === 'object' ? t._id : t) === task._id)
                        )
                    ).length
                  }{" "}
                  of {availableTasks.length} tasks available
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableTasks.map((task) => {
                  const isAssigned = (
                    selectedMemberForTasks.assignedFacilityTasks || []
                  ).some(t => (typeof t === 'object' ? t._id : t) === task._id);
                  const isAssignedToOther = teamMembers.some(
                    (member) =>
                      member.id !== selectedMemberForTasks.id &&
                      member.assignedFacilityTasks &&
                      member.assignedFacilityTasks.some(t => (typeof t === 'object' ? t._id : t) === task._id)
                  );
                  const assignedToMember = teamMembers.find(
                    (member) =>
                      member.id !== selectedMemberForTasks.id &&
                      member.assignedFacilityTasks &&
                      member.assignedFacilityTasks.some(t => (typeof t === 'object' ? t._id : t) === task._id)
                  );

                  return (
                    <label
                      key={task._id}
                      className={`flex items-center space-x-2 p-2 rounded ${
                        isAssignedToOther
                          ? "bg-gray-100 cursor-not-allowed opacity-60"
                          : "cursor-pointer hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        disabled={isAssignedToOther}
                        onChange={(e) =>
                          handleTaskAssignmentChange(task._id, e.target.checked)
                        }
                        className="w-4 h-4 text-[#075b7d] border-gray-300 rounded focus:ring-[#075b7d] disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <span
                          className={`text-sm ${
                            isAssignedToOther
                              ? "text-gray-500"
                              : "text-gray-700"
                          }`}
                        > 
                          {task.name}
                        </span>
                        {isAssignedToOther && assignedToMember && (
                          <div className="text-xs text-gray-500 mt-1">
                            Already assigned to {assignedToMember.name}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Task Assignment Summary */}
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckSquare className="w-4 h-4 text-[#075b7d]" />
                  <span className="text-sm font-medium text-gray-800">
                    Assigned Tasks (
                    {selectedMemberForTasks.assignedFacilityTasks?.length || 0})
                  </span>
                </div>
                {selectedMemberForTasks.assignedFacilityTasks &&
                selectedMemberForTasks.assignedFacilityTasks.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedMemberForTasks.assignedFacilityTasks.map(
                      (task, idx) => {
                        const taskId = typeof task === 'object' ? (task._id || idx) : (task || idx);
                        return (
                          <Badge
                            key={taskId}
                            variant="outline"
                            className="text-xs bg-[#075b7d]/5 text-[#075b7d] border-[#075b7d]/20"
                          >
                            {formatTaskName(task)}
                          </Badge>
                        );
                      }
                    )} 
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No tasks assigned</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                onClick={handleCloseTaskAssignment}
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  if (localStorage.getItem("currentSurveyId")) {
                    handleUpdateSurvey(false);
                  } else {
                    handleSurveySubmit(false);
                  }
                  handleCloseTaskAssignment();
                }}
                size="sm"
                className="h-8 px-3 text-xs bg-[#075b7d] hover:bg-[#075b7d] text-white"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLoadingData && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] backdrop-blur-sm">
          <div className="absolute inset-0 bg-black/20" />
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center z-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#075b7d] mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900">Loading Survey Data</h3>
            <p className="text-sm text-gray-500 mt-2">Please wait while we fetch the data...</p>
          </div>
        </div>
      )}
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
        onConfirm={() => {
          setHasUnsavedChanges(false);
          setShowExitWarning(false);
          if (pendingNavigation?.type === 'browser') {
            // We are already at the "previous" state due to popstate
            // Go back one more to actually leave
            window.history.back();
          } else if (pendingNavigation?.type === 'callback') {
            pendingNavigation.callback();
          }
          setPendingNavigation(null);
        }}
      />

      {/* Team Member Modal */}
      <TeamMemberModal
        isOpen={showTeamModal}
        onClose={resetTeamMemberForm}
        memberData={newTeamMember}
        onMemberDataChange={handleTeamMemberInputChange}
        editingMemberId={editingMemberId}
        availableRoles={availableRoles}
        roleMapping={roleMapping}
        getRoleName={getRoleNameLocal}
        facilityTasks={facilityTaskOptions}
        loadingTasks={loadingFacilityTaskOptions}
        teamMembers={teamMembers}
        surveyData={surveyData}
        onSubmit={handleAddTeamMember}
      />

      {/* Remove Team Member Confirmation Modal */}
      <RemoveTeamMemberModal
        isOpen={showRemoveConfirmModal}
        onClose={cancelRemoveTeamMember}
        member={memberToRemove}
        isTeamCoordinator={memberToRemove?.id === surveyData.teamCoordinator}
        getRoleName={getRoleNameLocal}
        onConfirm={confirmRemoveTeamMember}
      />

      {/* Floating Home Button */}
      <FloatingHomeButton
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={() => {
          const surveyId = localStorage.getItem("currentSurveyId");
          return surveyId ? handleUpdateSurvey(false) : handleSurveySubmit(false);
        }}
        onClearUnsavedChanges={() => setHasUnsavedChanges(false)}
      />
    </div>
  );
};
export default SurveySetup;
