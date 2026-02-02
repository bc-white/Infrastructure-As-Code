import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Checkbox } from "../../components/ui/checkbox";
import { 
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "../../components/ui/command";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import api from "../../service/api";
import surveyIndexedDB from "../../utils/surveyIndexedDB";
import surveySyncService from "../../utils/surveySyncService";
import useSurveyStore from "../../stores/useSurveyStore";
import { toast } from "sonner";
import questionsData from "../../data/clinicalAreasQuestions.json";
import {
  Plus, 
  Trash2,
  Building,
  Users,
  FileText,
  Search,
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
} from "lucide-react";

const RiskBasedProcessStepUp = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2; // Reduced from 4 to hide Team Members and Assign Clinical Areas steps

  // Step 1: Facility Selection
  const [facilityMode, setFacilityMode] = useState("search"); // "search" or "browse"
  const [facilitySearch, setFacilitySearch] = useState("");
  const [facilities, setFacilities] = useState([]);
  const [browseFacilities, setBrowseFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [isLoadingBrowse, setIsLoadingBrowse] = useState(false);
  const [showFacilityDropdown, setShowFacilityDropdown] = useState(false);
  const [recentFacilities, setRecentFacilities] = useState([]);
  const [browsePage, setBrowsePage] = useState(1);
  const [browseTotalPages, setBrowseTotalPages] = useState(1);
  const facilityDropdownRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Load recent facilities from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentFacilities");
    if (stored) {
      try {
        setRecentFacilities(JSON.parse(stored));
      } catch (error) {
       // console.error("Failed to load recent facilities:", error); 
      }
    }
  }, []);

  // Step 2: Team Members
  const [teamMembers, setTeamMembers] = useState([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    role: "",
  });
  const [roles, setRoles] = useState([]);

  // Step 3: Question Assignment
  const [selectedMemberForAssignment, setSelectedMemberForAssignment] =
    useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignments, setAssignments] = useState({}); // { memberId: [areaIds] }
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 4: Survey Mode Selection
  const [selectedSurveyMode, setSelectedSurveyMode] = useState("nonResidentBased"); // "residentBased" or "nonResidentBased" - Default to Facility-Based

  // Loading existing setup
  const [isLoadingSetup, setIsLoadingSetup] = useState(false);
  const [existingSurveyId, setExistingSurveyId] = useState(null);

  // Exit confirmation modal
  const [showExitModal, setShowExitModal] = useState(false);

  // Get clinical areas from questions data (includes Annual Education)
  const clinicalAreas = questionsData.clinicalAreas || [];

  // Fetch roles on component mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.auth.getRoles();
        if (response && response.data) {
          setRoles(response.data);
        }
      } catch (error) {
       // console.error("Failed to fetch roles:", error); 
      }
    };
    fetchRoles();
  }, []);

  // Load existing setup if surveyId is provided
  useEffect(() => {
    const loadExistingSetup = async () => {
      // Get surveyId from URL params or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const surveyIdFromUrl = urlParams.get('surveyId');
      const surveyIdFromStorage = localStorage.getItem('riskBasedProcessSurveyId') || localStorage.getItem('currentSurveyId');
      const surveyId = surveyIdFromUrl || surveyIdFromStorage;

      if (!surveyId) {
        return; // No survey ID, so this is a new setup
      }

      setIsLoadingSetup(true);
      setExistingSurveyId(surveyId);

      try {
        const response = await api.survey.getRiskBasedSetup(surveyId);
        
        if (response && (response.statusCode === 200 || response.status === 200)) {
          const setupData = response.data || response;
          
          // Populate facility
          if (setupData.facilityId || setupData.riskBasedProcessSetup?.facility) {
            const facility = setupData.riskBasedProcessSetup?.facility || setupData.facilityInfo;
            if (facility) {
              setSelectedFacility(facility);
              setFacilitySearch(facility.name || facility.facilityName || "");
            }
          }

          // Populate team members
          if (setupData.teamMembers && Array.isArray(setupData.teamMembers)) {
            const members = setupData.teamMembers.map(member => ({
              id: member.id || String(Date.now() + Math.random()),
              name: member.name || "",
              email: member.email || "",
              role: member.role || "",
              assignedAreas: member.assignedAreas || [],
            }));
            setTeamMembers(members);
          }

          // Populate assignments
          if (setupData.assignments || setupData.riskBasedProcessSetup?.assignments) {
            const assignmentsMap = {};
            if (setupData.riskBasedProcessSetup?.assignments) {
              Object.assign(assignmentsMap, setupData.riskBasedProcessSetup.assignments);
            } else if (setupData.assignments) {
              Object.assign(assignmentsMap, setupData.assignments);
            }
            setAssignments(assignmentsMap);
          }

          // Populate survey mode
          if (setupData.surveyMode) {
            setSelectedSurveyMode(setupData.surveyMode);
          }

          toast.success("Setup data loaded successfully", {
            position: "top-right",
          });
        }
      } catch (error) {
        
        toast.error("Failed to load existing setup", {
          description: error.message || "Please try again",
          position: "top-right",
        });
      } finally {
        setIsLoadingSetup(false);
      }
    };

    loadExistingSetup();
  }, []);

  // Debounced facility search
  const debouncedSearchFacilities = useCallback((searchTerm) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      if (searchTerm.length < 2) {
        setFacilities([]);
        return;
      }

      setIsLoadingFacilities(true);
      try {
        const response = await api.facility.searchFacilities(searchTerm, {});

        // Handle the correct API response structure: response.data.facilities
        if (response && response.status && response.data) {
          const facilitiesList =
            response.data.facilities || response.data || [];
          setFacilities(facilitiesList);
        } else {
          setFacilities([]);
        }
      } catch (error) {
        setFacilities([]);
        toast.error("Failed to search facilities", { position: "top-right" });
      } finally {
        setIsLoadingFacilities(false);
      }
    }, 300);
  }, []);

  // Fetch all facilities for browsing
  const fetchAllFacilities = useCallback(async (page = 1) => {
    setIsLoadingBrowse(true);
    try {
      const response = await api.facility.getAllFacilities({
        page: page,
        limit: 20, // Show 20 per page
      });

      if (response && response.status && response.data) {
        const facilitiesList = response.data.facilities || [];
        const pagination = response.data.pagination || {};

        if (page === 1) {
          setBrowseFacilities(facilitiesList);
        } else {
          setBrowseFacilities((prev) => [...prev, ...facilitiesList]);
        }

        setBrowseTotalPages(pagination.totalPages || 1);
        setBrowsePage(page);
      }
    } catch (error) {
      toast.error("Failed to fetch facilities", { position: "top-right" });
    } finally {
      setIsLoadingBrowse(false);
    }
  }, []);

  // Load facilities when switching to browse mode
  useEffect(() => {
    if (facilityMode === "browse" && browseFacilities.length === 0) {
      fetchAllFacilities(1);
    }
  }, [facilityMode, fetchAllFacilities]);

  // Handle facility search
  const handleFacilitySearch = (value) => {
    setFacilitySearch(value);
    if (value.length >= 2) {
      debouncedSearchFacilities(value);
      setShowFacilityDropdown(true);
    } else {
      setShowFacilityDropdown(false);
      setFacilities([]);
    }
  };

  // Handle facility selection
  const handleSelectFacility = (facility) => {
    setSelectedFacility(facility);
    setFacilitySearch(facility.name || "");
    setShowFacilityDropdown(false);
    setFacilities([]);

    // Save to recent facilities
    const updatedRecent = [
      facility,
      ...recentFacilities.filter(
        (f) => f._id !== facility._id && f.id !== facility._id
      ),
    ].slice(0, 5); // Keep only last 5
    setRecentFacilities(updatedRecent);
    localStorage.setItem("recentFacilities", JSON.stringify(updatedRecent));

    toast.success("Facility selected", {
      description: `${facility.name} (CCN: ${
        facility.providerNumber || "N/A"
      })`,
      position: "top-right",
    });
  };

  // Handle add team member
  const handleAddTeamMember = () => {
    if (!newMember.name || !newMember.email) {
      toast.error("Please fill in all required fields", {
        position: "top-right",
      });
      return;
    }

    const member = {
      id: String(Date.now()),
      name: newMember.name,
      email: newMember.email,
      role: newMember.role,
      assignedAreas: assignments[String(Date.now())] || [],
    };

    setTeamMembers([...teamMembers, member]);
    setNewMember({ name: "", email: "", role: "" });
    setShowAddMemberModal(false);
    toast.success("Team member added successfully", { position: "top-right" });
  };

  // Handle remove team member
  const handleRemoveTeamMember = (memberId) => {
    setTeamMembers(teamMembers.filter((m) => m.id !== memberId));
    const newAssignments = { ...assignments };
    delete newAssignments[memberId];
    setAssignments(newAssignments);
    toast.success("Team member removed", { position: "top-right" });
  };

  // Handle question assignment
  const handleToggleAssignment = (memberId, areaId) => {
    const currentAssignments = assignments[memberId] || [];
    const isAssigned = currentAssignments.includes(areaId);

    if (isAssigned) {
      setAssignments({
        ...assignments,
        [memberId]: currentAssignments.filter((id) => id !== areaId),
      });
    } else {
      // Check if area is already assigned to another member
      const assignedToOther = Object.keys(assignments).some(
        (id) => id !== memberId && assignments[id]?.includes(areaId)
      );

      if (assignedToOther) {
        toast.error("This area is already assigned to another team member", {
          position: "top-right",
        });
        return;
      }

      setAssignments({
        ...assignments,
        [memberId]: [...currentAssignments, areaId],
      });
    }
  };

  // Handle assign all to member
  const handleAssignAll = (memberId) => {
    const allAreaIds = clinicalAreas.map((area) => area.id);
    setAssignments({
      ...assignments,
      [memberId]: allAreaIds,
    });
    toast.success("All areas assigned", { position: "top-right" });
  };

  // Handle clear all assignments for member
  const handleClearAll = (memberId) => {
    setAssignments({
      ...assignments,
      [memberId]: [],
    });
    toast.success("All assignments cleared", { position: "top-right" });
  };

  // Get assigned areas count for a member
  const getAssignedCount = (memberId) => {
    return assignments[memberId]?.length || 0;
  };

  // Check if step can proceed
  const canProceedToNextStep = () => {
    if (currentStep === 1) {
      return selectedFacility !== null;
    }
    if (currentStep === 2) {
      return selectedSurveyMode !== null;
    }
    return false;
  };

  // Handle next step
  const handleNext = () => {
    if (canProceedToNextStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    } else {
      toast.error("Please complete the current step before proceeding", {
        position: "top-right",
      });
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle final submission
  const handleSubmit = async () => {
    if (!selectedFacility) {
      toast.error("Please select a facility", { position: "top-right" });
      return;
    }

    if (!selectedSurveyMode) {
      toast.error("Please select a survey mode", { position: "top-right" });
      return;
    }

    // Team members and assignments are optional - no validation needed

    setIsSubmitting(true);
    const loadingToast = toast.loading("Saving Risk Based Process setup...", {
      description: "Please wait while we save your data",
      position: "top-right",
    });

    try {
      // Prepare facility information
      const facilityInfo = {
        facilityName:
          selectedFacility.name || selectedFacility.Provider_Name || "",
        ccn:
          selectedFacility.providerNumber ||
          selectedFacility.CMS_Certification_Number_CCN ||
          "",
        address:
          selectedFacility.address?.street ||
          selectedFacility.Provider_Address ||
          "",
        city:
          selectedFacility.address?.city || selectedFacility.City_Town || "",
        state: selectedFacility.address?.state || selectedFacility.State || "",
        zipCode:
          selectedFacility.address?.zipCode || selectedFacility.ZIP_Code || "",
        phone:
          selectedFacility.contact?.[0]?.phone ||
          selectedFacility.Telephone_Number ||
          "",
        email: selectedFacility.contact?.[0]?.email || "",
      };

      // Prepare team members with assigned areas
      const teamMembersPayload = teamMembers.map((member) => {
        const assignedAreaIds = assignments[member.id] || [];
        // Map area IDs to area objects with details
        const assignedAreas = assignedAreaIds
          .map((areaId) => {
            const area = clinicalAreas.find((a) => a.id === areaId);
            return area
              ? {
                  id: area.id,
                  title: area.title,
                  regulatoryBasis: area.regulatoryBasis || [],
                }
              : null;
          })
          .filter(Boolean);

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          assignedAreas: assignedAreas,
          assignedAreaIds: assignedAreaIds, // Keep IDs for reference
        };
      });

      // Get current user to set as coordinator (the person creating the survey)
      const currentUser = JSON.parse(localStorage.getItem("mocksurvey_user") || "{}");
      const currentUserEmail = currentUser?.email || "";
      
      // Always use the signed-in user as team coordinator - this field is required
      if (!currentUserEmail) {
        toast.error("Unable to identify user", {
          description: "Please sign in again to continue",
          position: "top-right",
        });
        setIsSubmitting(false);
        return;
      }
      
      const coordinatorEmail = currentUserEmail;

      // Prepare payload for API
      const payload = {
        surveyCreationDate: new Date().toISOString(),
        surveyCategory: "Risk Based Survey",
        facilityId: selectedFacility._id || selectedFacility.id,
        facilityInfo: facilityInfo,
        teamMembers: teamMembersPayload,
        teamCoordinator: coordinatorEmail, // Always the signed-in user's email (required field)
        assignments: assignments, // Keep the mapping for reference
        surveyMode: selectedSurveyMode, // Survey mode at top level
        status: "setup",
        riskBasedProcessSetup: {
          facility: selectedFacility,
          teamMembers: teamMembersPayload,
          assignments: assignments,
          clinicalAreas: clinicalAreas.map((area) => ({
            id: area.id,
            title: area.title,
            regulatoryBasis: area.regulatoryBasis || [],
          })),
        },
      };

      // Check if online before making API call
      if (!navigator.onLine) {
        // Save offline and inform user
        const saveOfflineData = async (payload, isUpdate, surveyId) => {
          try {
            const offlineData = {
              ...payload,
              submittedAt: new Date().toISOString(),
              apiEndpoint: isUpdate ? "updateRiskBasedSetup" : "addRiskBasedSetup", // Store which API to call
              apiMethod: "survey", // Store API method/namespace
              existingSurveyId: surveyId || null, // Store existing survey ID if updating
            };

            // Step 1: Save to IndexedDB sync queue (permanent storage)
            // For risk-based setup creation, we don't have a surveyId yet, so we'll use a temporary identifier
            let syncQueueId = null;
            const tempSurveyId = surveyId || `temp_risk_based_${Date.now()}`; // Temporary ID for risk-based setup creation
            const stepId = "risk-based-setup";
            const syncItem = await surveyIndexedDB.addToSyncQueue(
              tempSurveyId,
              stepId,
              offlineData,
              "api_risk_based_setup" // type for API-based risk based setup
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

        await saveOfflineData(payload, !!existingSurveyId, existingSurveyId);
        toast.dismiss(loadingToast);
        toast.success("Internet connectivity issues detected. Data saved offline and will sync when connection is restored.", {
          position: "top-right",
          duration: 5000,
        });
        setIsSubmitting(false);
        return; // Exit early - data is saved offline
      }

      // Make API call to create or update risk-based process setup (only if online)
      let response;
      if (existingSurveyId) {
        // Update existing setup
        response = await api.survey.updateRiskBasedSetup(existingSurveyId, payload);
      } else {
        // Create new setup
        response = await api.survey.addRiskBasedSetup(payload);
      }

      if (response.statusCode === 200 || response.statusCode === 201) {
        toast.dismiss(loadingToast);

        // Store survey ID if returned (or use existing one if updating)
        const surveyId =
          response.data?.surveyId || 
          response.data?._id || 
          response.data?.id || 
          existingSurveyId;
        if (surveyId) {
          localStorage.setItem("currentSurveyId", surveyId);
          localStorage.setItem("riskBasedProcessSurveyId", surveyId);
          setExistingSurveyId(surveyId); // Update state for future updates
        }

        // Store setup data in localStorage for reference
        localStorage.setItem(
          "riskBasedProcessSetup",
          JSON.stringify({
            facility: selectedFacility,
            teamMembers: teamMembersPayload,
            assignments: assignments,
            surveyMode: selectedSurveyMode,
            surveyId: surveyId,
          })
        );

        // Invite team members if any were added
        if (surveyId && teamMembers.length > 0) {
          let invitedCount = 0;
          let failedInvites = 0;

          for (const member of teamMembers) {
            try {
              const assignedAreaIds = assignments[member.id] || [];

              await api.survey.inviteTeamMembers({
                name: member.name,
                email: member.email,
                role: member.role,
                surveyId: surveyId,
                assignedFacilityTasks: assignedAreaIds,
              });

              invitedCount++;
            } catch (inviteError) {
             
              failedInvites++;
            }
          }

          // Show invitation results
          if (invitedCount > 0) {
            toast.success(`${invitedCount} team member${invitedCount > 1 ? 's' : ''} invited successfully!`, {
              position: "top-right",
            });
          }
          if (failedInvites > 0) {
            toast.warning(`${failedInvites} invitation${failedInvites > 1 ? 's' : ''} failed to send`, {
              description: "Team members were added but invitation emails may not have been sent.",
              position: "top-right",
            });
          }
        }

        toast.success("Risk Based Process setup completed!", {
          description: "Your setup has been saved successfully. Redirecting...",
          position: "top-right",
          duration: 3000,
        });

        // Navigate to the risk-based survey page after a short delay
        setTimeout(() => {
          if (surveyId) {
            window.location.href = `/risk-based-survey?surveyId=${surveyId}`;
          } else {
            window.location.href = "/risk-based-survey";
          }
        }, 1500);
      } else {
        throw new Error(response.message || "Failed to save setup");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to save setup", {
        description:
          error.message || "An error occurred while saving. Please try again.",
        position: "top-right",
        duration: 5000,
      });
    
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close dropdown when clicking outside
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

  // Show loading state while fetching existing setup
  if (isLoadingSetup) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#075b7d] mx-auto mb-4" />
          <p className="text-gray-600">Loading setup data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        
        <div className="relative mb-8">
        
          <div className="text-left">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExitModal(true)}
            className="text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-100 mb-4"
          >
           
            Exit Risk Based 
          </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Risk Based Process Review
            </h1>
            <p className="text-gray-600">
              We just need some basic info to get your process review setup.
              You'll be able to edit this later.
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
          <div className="flex gap-2">
            {[...Array(totalSteps)].map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index + 1 <= currentStep ? "bg-[#075b7d]" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="bg-white p-6 sm:p-8">
          {/* Step 1: Facility Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Select Facility
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Search and select the facility for this risk-based process
                  review.
                </p>
              </div>

              <div className="relative" ref={facilityDropdownRef}>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-sm font-medium text-gray-700">
                    Select Facility
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={
                        facilityMode === "search" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        setFacilityMode("search");
                        setShowFacilityDropdown(false);
                      }}
                      className={
                        facilityMode === "search"
                          ? "bg-[#075b7d] hover:bg-[#075b7d]/90"
                          : ""
                      }
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                    <Button
                      type="button"
                      variant={
                        facilityMode === "browse" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => {
                        setFacilityMode("browse");
                        setShowFacilityDropdown(false);
                        if (browseFacilities.length === 0) {
                          fetchAllFacilities(1);
                        }
                      }}
                      className={
                        facilityMode === "browse"
                          ? "bg-[#075b7d] hover:bg-[#075b7d]/90"
                          : ""
                      }
                    >
                      <Building className="h-4 w-4 mr-2" />
                      Browse
                    </Button>
                  </div>
                </div>

                {/* Search Mode */}
                {facilityMode === "search" && (
                  <div className="relative">
                    <Input
                      value={facilitySearch}
                      onChange={(e) => handleFacilitySearch(e.target.value)}
                      onFocus={() => {
                        if (
                          facilitySearch.length >= 2 ||
                          recentFacilities.length > 0
                        ) {
                          setShowFacilityDropdown(true);
                        }
                      }}
                      placeholder="Search by facility name, CCN, or location..."
                      className="h-12 pr-10"
                    />
                    {isLoadingFacilities && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-5 w-5 animate-spin text-[#075b7d]" />
                      </div>
                    )}
                    {!isLoadingFacilities && (
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    )}
                  </div>
                )}

                {/* Browse Mode */}
                {facilityMode === "browse" && (
                  <div className="border border-gray-200 rounded-lg max-h-96 overflow-auto">
                    {isLoadingBrowse && browseFacilities.length === 0 ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-[#075b7d]" />
                      </div>
                    ) : (
                      <>
                        <div className="divide-y divide-gray-200">
                          {browseFacilities.map((facility) => {
                            const facilityId = facility._id || facility.id;
                            const isSelected =
                              selectedFacility &&
                              (selectedFacility._id === facilityId ||
                                selectedFacility.id === facilityId);

                            return (
                              <div
                                key={facilityId}
                                onClick={() => handleSelectFacility(facility)}
                                className={`p-4 cursor-pointer transition-colors ${
                                  isSelected
                                    ? "bg-[#075b7d]/5 border-l-4 border-[#075b7d]"
                                    : "hover:bg-gray-50"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <Building className="h-5 w-5 text-[#075b7d] mt-0.5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-gray-900">
                                        {facility.name ||
                                          facility.Provider_Name}
                                      </p>
                                      {isSelected && (
                                        <div className="flex-shrink-0 ml-2">
                                          <div className="h-5 w-5 rounded-full bg-[#075b7d] flex items-center justify-center">
                                            <Check className="h-3 w-3 text-white" />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <div className="mt-1 space-y-0.5">
                                      {facility.providerNumber && (
                                        <p className="text-xs text-gray-600">
                                          CCN: {facility.providerNumber}
                                        </p>
                                      )}
                                      {(facility.address ||
                                        facility.City_Town) && (
                                        <p className="text-xs text-gray-500">
                                          {facility.address?.street ||
                                            facility.Provider_Address}
                                          {(facility.address?.city ||
                                            facility.City_Town) &&
                                            `, ${
                                              facility.address?.city ||
                                              facility.City_Town
                                            }`}
                                          {(facility.address?.state ||
                                            facility.State) &&
                                            `, ${
                                              facility.address?.state ||
                                              facility.State
                                            }`}
                                          {facility.address?.zipCode &&
                                            ` ${facility.address.zipCode}`}
                                        </p>
                                      )}
                                      {facility.contact?.[0]?.phone && (
                                        <p className="text-xs text-gray-500">
                                          📞 {facility.contact[0].phone}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {browsePage < browseTotalPages && (
                          <div className="p-4 border-t border-gray-200">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={() => fetchAllFacilities(browsePage + 1)}
                              disabled={isLoadingBrowse}
                            >
                              {isLoadingBrowse ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                <>
                                  Load More ({browsePage} of {browseTotalPages})
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                        {browseFacilities.length > 0 && (
                          <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
                            <p className="text-xs text-gray-600">
                              Showing {browseFacilities.length} facilities
                              {browseTotalPages > 1 &&
                                ` (Page ${browsePage} of ${browseTotalPages})`}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Facility Dropdown - Only for Search Mode */}
                {facilityMode === "search" &&
                  showFacilityDropdown &&
                  (facilities.length > 0 || recentFacilities.length > 0) && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-auto">
                      <Command>
                        <CommandList>
                          {/* Recent Facilities Section */}
                          {recentFacilities.length > 0 &&
                            facilities.length === 0 &&
                            facilitySearch.length < 2 && (
                              <CommandGroup>
                                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                                  Recent Facilities
                                </div>
                                {recentFacilities.map((facility) => {
                                  const facilityId =
                                    facility._id || facility.id;
                                  const isSelected =
                                    selectedFacility &&
                                    (selectedFacility._id === facilityId ||
                                      selectedFacility.id === facilityId);

                                  return (
                                    <CommandItem
                                      key={facilityId}
                                      onSelect={() =>
                                        handleSelectFacility(facility)
                                      }
                                      className={`cursor-pointer ${
                                        isSelected ? "bg-[#075b7d]/5" : ""
                                      }`}
                                    >
                                      <div className="flex items-start gap-3 p-3 hover:bg-gray-50">
                                        <Building className="h-5 w-5 text-[#075b7d] mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-gray-900">
                                              {facility.name ||
                                                facility.Provider_Name}
                                            </p>
                                            <div className="flex items-center gap-2">
                                              {isSelected && (
                                                <div className="h-5 w-5 rounded-full bg-[#075b7d] flex items-center justify-center">
                                                  <Check className="h-3 w-3 text-white" />
                                                </div>
                                              )}
                                              <Badge
                                                variant="outline"
                                                className="text-xs"
                                              >
                                                Recent
                                              </Badge>
                                            </div>
                                          </div>
                                          <div className="mt-1 space-y-0.5">
                                            {facility.providerNumber && (
                                              <p className="text-xs text-gray-600">
                                                CCN: {facility.providerNumber}
                                              </p>
                                            )}
                                            {(facility.address ||
                                              facility.City_Town) && (
                                              <p className="text-xs text-gray-500">
                                                {facility.address?.city ||
                                                  facility.City_Town}
                                                {(facility.address?.state ||
                                                  facility.State) &&
                                                  `, ${
                                                    facility.address?.state ||
                                                    facility.State
                                                  }`}
                                                {facility.address?.zipCode &&
                                                  ` ${facility.address.zipCode}`}
                                              </p>
                                            )}
                                            {facility.contact?.[0]?.phone && (
                                              <p className="text-xs text-gray-500">
                                                📞 {facility.contact[0].phone}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            )}

                          {/* Search Results Section */}
                          {facilities.length > 0 && (
                            <CommandGroup>
                              {recentFacilities.length > 0 &&
                                facilitySearch.length >= 2 && (
                                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                                    Search Results ({facilities.length})
                                  </div>
                                )}
                              <CommandEmpty>
                                No facilities found. Try a different search
                                term.
                              </CommandEmpty>
                              {facilities.map((facility) => {
                                const facilityId = facility._id || facility.id;
                                const isSelected =
                                  selectedFacility &&
                                  (selectedFacility._id === facilityId ||
                                    selectedFacility.id === facilityId);

                                return (
                                  <CommandItem
                                    key={facilityId}
                                    onSelect={() =>
                                      handleSelectFacility(facility)
                                    }
                                    className={`cursor-pointer ${
                                      isSelected ? "bg-[#075b7d]/5" : ""
                                    }`}
                                  >
                                    <div className="flex items-start gap-3 p-3 hover:bg-gray-50">
                                      <Building className="h-5 w-5 text-[#075b7d] mt-0.5 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                          <p className="text-sm font-medium text-gray-900">
                                            {facility.name ||
                                              facility.Provider_Name}
                                          </p>
                                          {isSelected && (
                                            <div className="h-5 w-5 rounded-full bg-[#075b7d] flex items-center justify-center flex-shrink-0 ml-2">
                                              <Check className="h-3 w-3 text-white" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="mt-1 space-y-0.5">
                                          {facility.providerNumber && (
                                            <p className="text-xs text-gray-600">
                                              CCN: {facility.providerNumber}
                                            </p>
                                          )}
                                          {(facility.address ||
                                            facility.City_Town) && (
                                            <p className="text-xs text-gray-500">
                                              {facility.address?.street ||
                                                facility.Provider_Address}
                                              {(facility.address?.city ||
                                                facility.City_Town) &&
                                                `, ${
                                                  facility.address?.city ||
                                                  facility.City_Town
                                                }`}
                                              {(facility.address?.state ||
                                                facility.State) &&
                                                `, ${
                                                  facility.address?.state ||
                                                  facility.State
                                                }`}
                                              {facility.address?.zipCode &&
                                                ` ${facility.address.zipCode}`}
                                            </p>
                                          )}
                                          {facility.contact?.[0]?.phone && (
                                            <p className="text-xs text-gray-500">
                                              📞 {facility.contact[0].phone}
                                            </p>
                                          )}
                                          {facility.Overall_Rating && (
                                            <div className="flex items-center gap-2 mt-1">
                                              <Badge
                                                variant="outline"
                                                className="text-xs"
                                              >
                                                ⭐ {facility.Overall_Rating}/5
                                                Rating
                                              </Badge>
                                              {facility.Number_of_Certified_Beds && (
                                                <Badge
                                                  variant="outline"
                                                  className="text-xs"
                                                >
                                                  🛏️{" "}
                                                  {
                                                    facility.Number_of_Certified_Beds
                                                  }{" "}
                                                  Beds
                                                </Badge>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Step 2: Survey Mode Selection (previously Step 4) */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Select Survey Mode
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Choose how you want to conduct this risk-based process review.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Facility-Based Option */}
                <Card
                  className={`p-6 cursor-pointer transition-all border-2 ${
                    selectedSurveyMode === "nonResidentBased"
                      ? "border-[#075b7d] bg-[#075b7d]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedSurveyMode("nonResidentBased")}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedSurveyMode === "nonResidentBased"
                          ? "border-[#075b7d] bg-[#075b7d]"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedSurveyMode === "nonResidentBased" && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Building className="h-5 w-5 text-[#075b7d]" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Facility-Based
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Answer questions at the facility level. All answers apply
                        to the entire facility, not individual residents.
                      </p>
                      <ul className="text-xs text-gray-500 space-y-1">
                        <li>• System-wide review</li>
                        <li>• Facility-level observations</li>
                        <li>• Overall facility assessment</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>

              {selectedSurveyMode && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Selected:</strong> Facility-Based Mode
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    You will answer questions based on facility-wide observations and systems.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceedToNextStep() || isSubmitting}
              className="bg-[#075b7d] hover:bg-[#075b7d]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : currentStep === totalSteps ? (
                "Complete Setup"
              ) : (
                <>
                  Next Step
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Add Team Member Modal */}
      <Dialog open={showAddMemberModal} onOpenChange={setShowAddMemberModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="member-name">Full Name *</Label>
              <Input
                id="member-name"
                value={newMember.name}
                onChange={(e) =>
                  setNewMember({ ...newMember, name: e.target.value })
                }
                placeholder="Enter full name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="member-email">Email *</Label>
              <Input
                id="member-email"
                type="email"
                value={newMember.email}
                onChange={(e) =>
                  setNewMember({ ...newMember, email: e.target.value })
                }
                placeholder="Enter email address"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="member-role">Role</Label>
              <Select
                value={newMember.role}
                onValueChange={(value) =>
                  setNewMember({ ...newMember, role: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role._id} value={role._id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddMemberModal(false);
                setNewMember({ name: "", email: "", role: "" });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTeamMember}
              className="bg-[#075b7d] hover:bg-[#075b7d]/90"
            >
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Modal */}
      <Dialog open={showAssignmentModal} onOpenChange={setShowAssignmentModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Assign Clinical Areas to {selectedMemberForAssignment?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Select clinical areas to assign. Each area can only be assigned
                to one team member.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleAssignAll(selectedMemberForAssignment?.id)
                  }
                >
                  Assign All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleClearAll(selectedMemberForAssignment?.id)
                  }
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {clinicalAreas.map((area) => {
                const memberId = selectedMemberForAssignment?.id;
                const isAssigned = assignments[memberId]?.includes(area.id);
                const assignedToOther = Object.keys(assignments).some(
                  (id) => id !== memberId && assignments[id]?.includes(area.id)
                );

                return (
                  <div
                    key={area.id}
                    className={`flex items-start gap-3 p-3 border rounded-lg ${
                      isAssigned
                        ? "bg-[#075b7d]/5 border-[#075b7d]"
                        : assignedToOther
                        ? "bg-gray-50 border-gray-200 opacity-60"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <Checkbox
                      checked={isAssigned}
                      onCheckedChange={() =>
                        handleToggleAssignment(memberId, area.id)
                      }
                      disabled={assignedToOther}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">
                          {area.title}
                        </p>
                        {assignedToOther && (
                          <Badge variant="outline" className="text-xs">
                            Assigned
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {area.surveyFocusItems.length} focus items
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowAssignmentModal(false)}
              className="bg-[#075b7d] hover:bg-[#075b7d]/90"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exit Confirmation Modal */}
      <Dialog open={showExitModal} onOpenChange={setShowExitModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Exit Risk-based Process?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to exit? Any unsaved progress will be lost.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExitModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                window.location.href = "/risk-based-list";
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Exit Without Saving
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RiskBasedProcessStepUp;
