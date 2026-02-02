import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { resourceAPI } from "../service/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { DatePicker } from "../components/ui/date-picker";
import { DataTable } from "../components/data-table";
import TeamMemberModal, { RemoveTeamMemberModal } from "../components/modals/TeamMemberModal";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../components/ui/command";
import {
  ChevronLeft,
  Plus,
  Edit,
  Trash2,
  X,
  Upload,
  Download,
  Link,
  Users,
  FileText,
  CheckCircle,
  CheckSquare,
  Search,
  Menu,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import api from "../service/api";
import {
  getSurveyData,
  setSurveyData as saveSurveyData,
  clearSurveyStorage,
  clearOldSurveyData,
  getSurveyStepData,
  saveSurveyStepData,
  getSurveyMetadata,
  saveSurveyMetadata,
  getStorageStats,
  getSyncStatus,
  forceSyncSurvey,
} from "../utils/surveyStorageIndexedDB";

//pages
import SurveySetup from "./survey/SurveySetup";
import OffsitePreparation from "./survey/OffsitePreparation";
import FacilityEntrance from "./survey/FacilityEntrance";
import InitialPoolProcess from "./survey/InitialPoolProcess";
import SampleSelection from "./survey/SampleSelection";
import Investigations from "./survey/Investigations";
import FacilityTasks from "./survey/FacilityTasks";
import TeamMeetings from "./survey/TeamMeetings";
import Citation from "./survey/Citation";
import ExitConference from "./survey/ExitConference";
import ResourcesHelp from "./survey/ResourcesHelp";
import PostSurveyActivities from "./survey/Post-SurveyActivities";
import SurveyClosure from "./survey/SurveyClosure";
import { generateTaskKey } from "../utils/facilityTaskHelpers";

const SurveyBuilder = () => {
  const navigate = useNavigate();

  // Current user (fetched from backend: admin/me)
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch current user from API instead of localStorage
  useEffect(() => {
    let isMounted = true;
    const fetchCurrentUser = async () => {
      try {
        const response = await api.profile.getProfile();
        // Response normalization: prefer response.data; fallback to response.user or response
        const userData = response?.data || response?.user || response;
        if (isMounted && userData && typeof userData === "object") {
          setCurrentUser(userData);
          // Keep localStorage in sync for services relying on it (e.g., sockets)
          try {
            localStorage.setItem("mocksurvey_user", JSON.stringify(userData));
          } catch (_) {
            // Silently ignore storage errors
          }
        }
      } catch (error) {
        // If token expired, attempt refresh once, then retry
        try {
          const refreshed = await api.refreshAccessToken();
          if (refreshed) {
            const retry = await api.profile.getProfile();
            const retryUser = retry?.data || retry?.user || retry;
            if (isMounted && retryUser && typeof retryUser === "object") {
              setCurrentUser(retryUser);
              try {
                localStorage.setItem("mocksurvey_user", JSON.stringify(retryUser));
              } catch (_) { }
            }
          }
        } catch (_) {
          // Final fallback: leave currentUser as null
        }
      }
    };
    fetchCurrentUser();
    return () => {
      isMounted = false;
    };
  }, []);


  const [teamCoordinatorEmail, setTeamCoordinatorEmail] = useState("");

  // Initialize current step - new surveys start at step 1 (pre-survey)
  const [currentStep, setCurrentStep] = useState(() => {
    // All users, including invited users, can start at step 1
    return 1;
  });

  // Loading state for survey data
  const [isLoadingSurvey, setIsLoadingSurvey] = useState(false);

  // IndexedDB state management
  const [storageStats, setStorageStats] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [isIndexedDBReady, setIsIndexedDBReady] = useState(false);

  const [showAddFindingModal, setShowAddFindingModal] = useState(false);
  const [showGenerateFormsModal, setShowGenerateFormsModal] = useState(false);
  const [selectedForms, setSelectedForms] = useState([]);
  const [showAddResidentModal, setShowAddResidentModal] = useState(false);
  const [
    showAddExitConferenceResidentModal,
    setShowAddExitConferenceResidentModal,
  ] = useState(false);
  const [newResidentName, setNewResidentName] = useState("");
  const [residentSearchQuery, setResidentSearchQuery] = useState("");
  const [showUploadResidentModal, setShowUploadResidentModal] = useState(false);
  const [showOthersInput, setShowOthersInput] = useState(false);
  const [newResident, setNewResident] = useState({
    name: "",
    room: "",
    admissionDate: null,
    diagnosis: "",
    specialTypes: [],
    specialTypesOthers: [],
    canBeInterviewed: true,
    interviewAreas: [], // TODO: Fetch from API
    reviewAreas: [],
    notes: "",
  });
  const [currentInvestigation, setCurrentInvestigation] = useState({
    residentId: "",
    area: "",
    observations: "",
    findings: "",
    severity: "",
    followUpRequired: false,
    fFlag: "",
    criticalElements: [],
  });
  const [showAddInvestigationModal, setShowAddInvestigationModal] =
    useState(false);
  const [selectedViewBy, setSelectedViewBy] = useState("By Resident");
  const [selectedCareArea, setSelectedCareArea] = useState("Nursing Care");
  const [selectedTask, setSelectedTask] = useState("dining");
  const [taskObservations, setTaskObservations] = useState({});
  const [taskTimes, setTaskTimes] = useState({});
  const [facilityTaskOptions, setFacilityTaskOptions] = useState([]);
  const [loadingFacilityTaskOptions, setLoadingFacilityTaskOptions] =
    useState(false);

  // Fetch facility tasks
  useEffect(() => {
    const fetchFacilityTasks = async () => {
      try {
        setLoadingFacilityTaskOptions(true);
        const response = await api.resource.getAllMandatoryTasks();
        if (response?.status && response.data?.mt) {
          const tasks = response.data.mt.map((task) => ({
            _id: task._id,
            name: ((task.title || "").replace(/\s*\([^)]+\)/g, "").trim() || task.title || "Untitled Task"),
            title: task.title // Keep original title just in case
          }));
          setFacilityTaskOptions(tasks);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
      } finally {
        setLoadingFacilityTaskOptions(false);
      }
    };

    fetchFacilityTasks();
  }, []);

  // New state variables for enhanced Step 4
  const [selectedResident, setSelectedResident] = useState(null);
  const [showObservationModal, setShowObservationModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [showRecordReviewModal, setShowRecordReviewModal] = useState(false);
  const [showClosedRecordsModal, setShowClosedRecordsModal] = useState(false);
  const [showCitationsModal, setShowCitationsModal] = useState(false);
  const [showMobileSteps, setShowMobileSteps] = useState(false);
  const [showStepsSidebar, setShowStepsSidebar] = useState(true);
  const [showInvestigationModal, setShowInvestigationModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showFTagModal, setShowFTagModal] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [editingFTagId, setEditingFTagId] = useState(null);
  const [showBodyMapModal, setShowBodyMapModal] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [complaintFilter, setComplaintFilter] = useState("all");
  const [ftagForm, setFtagForm] = useState({
    fTag: "",
    careArea: "",
    description: "",
    severity: "",
    evidence: "",
  });

  // Additional investigation state
  const [bodyMapData, setBodyMapData] = useState({
    wounds: [],
    notes: "",
    imageData: null,
  });

  const [attachments, setAttachments] = useState([]);
  const [cePathwayData, setCePathwayData] = useState({
    pathwayUrl: "",
    probes: [],
    notes: "",
  });
  const [closedRecordForm, setClosedRecordForm] = useState({
    residentName: "",
    recordType: "",
    date: "",
    reason: "",
    notes: "",
  });

  // Investigation state
  const [investigationForm, setInvestigationForm] = useState({
    title: "",
    careArea: "",
    description: "",
    priority: "medium",
    assignedTo: "",
  });

  // Reset investigation form when modal opens
  const resetInvestigationForm = () => {
    setInvestigationForm({
      title: "",
      careArea: "",
      description: "",
      priority: "medium",
      assignedTo: "",
    });
  };



  const [complaintForm, setComplaintForm] = useState({
    description: "",
    category: "",
    severity: "low",
    linkedInvestigation: "",
    investigationSearch: "",
  });

  const [weightCalculator, setWeightCalculator] = useState({
    weight: "",
    unit: "lbs",
    notes: "",
  });

  const [ijForm, setIjForm] = useState({
    status: "none",
    details: "",
    supervisorNotified: false,
    notificationDate: null,
  });

  // Auto-stamp entrance date/time when Step 3 is opened
  React.useEffect(() => {
    if (currentStep === 3 && !surveyData.entranceDate) {
      handleStep3Open();
    }
  }, [currentStep]);

  // Reset closed record form when modal is opened
  React.useEffect(() => {
    if (showClosedRecordsModal) {
      resetClosedRecordForm();
    }
  }, [showClosedRecordsModal]);

  // Reset investigation form when modal is opened
  React.useEffect(() => {
    if (showInvestigationModal) {
      resetInvestigationForm();
    }
  }, [showInvestigationModal]);

  // Section data for 13-step process
  const sectionData = [
    {
      id: 1,
      title: "MockSurvey 365 Setup Page",
      description:
        "This is the first step in creating your survey. Here, you'll set up the basic details, assign team members, and organize any mandatory tasks. You'll also have access to Mock Survey 365 Resources, a collection of downloadable resources and documentation designed to support you throughout the survey process. Once completed, you'll be ready to move on to the next steps in building your survey.",
    },
    // ... rest of section data
    {
      id: 2,
      title: "Offsite Preparation",
      description:
        "In this step, you'll confirm that you've gathered the key items needed before starting the mock survey, such as reports, policies, and assessments. Completing the checklist ensures you're fully prepared. If you're working in an area with limited internet access, you can also enable Offline Mode to keep the process running smoothly.",
    },
    {
      id: 3,
      title: "Facility Entrance",
      description:
        "In this step, you'll begin on-site activities by conducting the entrance conference and completing initial assessments. You'll also request and track required documents, upload key files to guide resident selection, and add residents of your choosing. While waiting for requested items, you can start the kitchen and general environment tour to keep the process moving forward.",
    },
    {
      id: 4,
      title: "Initial Pool Selection",
      description:
        'The initial pool selection is autogenerated for you. If needed, you can add additional residents by selecting the "Add Resident" button or upload a CSV file and click "Regenerate" to update the pool. You can also add specific residents you\'d like to observe or interview. To streamline your work, the Quick Actions menu is available, allowing you to add observations, schedule interviews, or complete record reviews directly from this step.',
    },
    {
      id: 5,
      title: "Final Sample Selection",
      description:
        "In this step, you'll finalize your survey sample. Be sure to validate each form by clicking the Process Sample button. The facility sample must also be added at this stage to generate the final sample. Once finalized, the program will automatically assign investigation areas, ensuring balanced coverage across all required areas.",
    },
    {
      id: 6,
      title: "Investigations",
      description:
        "In this step, you'll complete resident and care area investigations using the Critical Element Pathways. Start by identifying the concern, select the correct pathway, and follow the steps to gather information through observation, interviews, and record review. Cross-check your findings and document them in the pathway, linking results to regulatory requirements.",
    },
    {
      id: 7,
      title: "Mandatory Facility Tasks",
      description:
        "In this step, you'll complete all mandatory and triggered facility tasks, including Dining, Infection Control, Kitchen, Medication Administration, Medication Storage/Labeling, Resident Council, and Sufficient & Competent Nurse Staffing. Each task must be marked complete before moving forward. Key checkpoints are provided for each task to guide your review (e.g., meal preparation, staff assistance, food quality, resident satisfaction, dietary accommodations, and severity-level selections). Use the Observations & Notes section to document findings, issues, and any compliance concerns.",
    },
    {
      id: 8,
      title: "Final Team Meeting",
      description:
        "In this step, you'll conduct the team meeting at the conclusion of the survey and prior to the exit. Use the Team Determination Board to review and support citations. Add any new citations if identified and decide as a team what to cite or not cite.",
    },
    {
      id: 9,
      title: "Final Citations Report",
      description:
        "In this step, the system automatically combines all investigations, record review details, and approved citations to generate the mock survey citation report. This report must be completed before continuing to the Exit Conference page.",
    },
    {
      id: 10,
      title: "Exit Conference",
      description:
        "In this step, you'll conduct the exit conference and present your findings to facility leadership. A virtual option is available for leaders unable to attend in person. Talking points are auto-generated and can be revised as needed. Citations can be sent directly to the administrator via email, and the facility sample list can be downloaded for reference. This step officially closes the survey process.",
    },
    {
      id: 11,
      title: "Plan of Correction",
      description:
        "In this step, you'll upload the final mock survey report so the system can generate the Plan of Correction. You can also upload your actual CMS-2567 from a state survey to create a Plan of Correction, ensuring consistency across both mock and real surveys. Export and print options are available. Complete case closure activities to ensure all post-survey documentation is finalized.",
    },
    {
      id: 12,
      title: "Survey Completion and Closure",
      description:
        "Congratulations — you've reached the final step! In this step, you'll finalize your survey by confirming all tasks are complete. Enter any final notes, review the survey summary, and close the survey. Once closure is confirmed, you'll return to the dashboard where you can access reports, documentation, and resources as needed.",
    },
    {
      id: 13,
      title: "Resources & Help",
      description:
        "In this step, you'll have access to reference guides, including procedures, psychosocial outcome severity, extended survey lists, Appendix Q, and F-Tag review tools. Technical support is available 24/7, with options for error reporting, screenshot guidance, and direct contact with MockSurvey 365 support. Quick actions such as e-send configuration and print preview are also provided.",
    },
  ];

  // Default survey data function
  const getDefaultSurveyData = () => ({
    surveyCreationDate: new Date().toISOString().split("T")[0],
    teamMembers: [],
    preSurveyRequirements: {},
    mandatoryTasks: {},
  });


  // Initialize surveyData from IndexedDB or default values (survey-specific)
  const [surveyData, setSurveyData] = useState(() => {
    // Start with default data, will be loaded from IndexedDB in useEffect
    return getDefaultSurveyData();
  });

  const [finalSampleResidents, setFinalSampleResidents] = useState([]);

  // Fetch final sample residents when the modal opens
  useEffect(() => {
    const fetchFinalSample = async () => {
      if (showAddExitConferenceResidentModal && surveyData?._id) {
        try {
          const response = await api.survey.getFinalSample(surveyData._id);
          if (response?.data?.finalSampleData) {
            setFinalSampleResidents(response.data.finalSampleData);
          }
        } catch (error) {
          /// console.error("Error fetching final sample:", error);
        }
      }
    };

    fetchFinalSample();
  }, [showAddExitConferenceResidentModal, surveyData?._id]);

  // Fetch initial survey data from API if not in IndexedDB
  useEffect(() => {
    const fetchInitialData = async () => {
      const currentSurveyId = localStorage.getItem("currentSurveyId");
      if (currentSurveyId && !isIndexedDBReady) {
        try {
          setIsLoadingSurvey(true);
          const response = await api.survey.getSurveyFirstPage(currentSurveyId);
          if (response && response.data && response.data.surveyData) {
            const apiData = response.data.surveyData;

            // Merge API data with default structure to ensure all fields exist
            setSurveyData(prev => ({
              ...prev,
              ...apiData,
              // Ensure critical fields are preserved/mapped correctly
              surveyCreationDate: apiData.surveyCreationDate || prev.surveyCreationDate,
              facilityId: apiData.facilityId || prev.facilityId,
              teamMembers: response.data.teamMembers || prev.teamMembers,
              preSurveyRequirements: response.data.preSurveyRequirement ?
                response.data.preSurveyRequirement.reduce((acc, req) => ({ ...acc, [req.type]: req }), {}) :
                prev.preSurveyRequirements,
              mandatoryTasks: response.data.assignedFacility ?
                response.data.assignedFacility
                  .filter(task => task.mandatorytaskId && task.mandatorytaskId._id)
                  .reduce((acc, task) => ({
                    ...acc,
                    [task.mandatorytaskId._id]: {
                      ...task,
                      assigned: true,
                      primary: task.teamMemberId?._id
                    }
                  }), {}) :
                prev.mandatoryTasks
            }));

            // Also update team members state
            if (response.data.teamMembers) {
              setTeamMembers(response.data.teamMembers);
            }
          }
        } catch (error) {
          // eslint-disable-next-line no-console
        } finally {
          setIsLoadingSurvey(false);
        }
      }
    };

    fetchInitialData();
  }, []);


  const isInvitedUserValue = useMemo(() => {
    if (!currentUser) return false;

    const currentSurveyId = localStorage.getItem("currentSurveyId");
    if (!currentSurveyId) {
      return false;
    }



    // Check if user is the creator - Creator is NOT an invited user (has full access)
    if (surveyData?.createdBy) {
      // Handle case where createdBy is populated object
      if (typeof surveyData.createdBy === 'object') {
        const creatorEmail = surveyData.createdBy.email?.toLowerCase()?.trim();
        const userEmail = currentUser.email?.toLowerCase()?.trim();


        if (creatorEmail && userEmail && creatorEmail === userEmail) {
          return false;
        }

        if (surveyData.createdBy._id && currentUser._id && surveyData.createdBy._id === currentUser._id) {
          return false;
        }
      }
      // Handle case where createdBy is just an ID string
      else if (typeof surveyData.createdBy === 'string') {
        if (currentUser._id && surveyData.createdBy === currentUser._id) {
          return false;
        }
      }
    }

    if (surveyData?.teamMembers && Array.isArray(surveyData.teamMembers) && surveyData.teamMembers.length > 0) {
      const userEmail = currentUser.email?.toLowerCase()?.trim();
      const member = surveyData.teamMembers.find(m => m.email?.toLowerCase()?.trim() === userEmail);

      if (member) {
        return !member.teamCoordinator;
      }
    }

    const coordinatorEmail = teamCoordinatorEmail ||
      surveyData?.teamCoordinator;

    // If there's no team coordinator set, default to false (not invited)
    if (!coordinatorEmail) return false;

    // Check if current user's email matches the team coordinator email
    const userEmail = currentUser.email?.toLowerCase()?.trim();
    const coordinatorEmailLower = coordinatorEmail?.toLowerCase()?.trim();

    // If emails match, user is the team coordinator (NOT invited)
    if (userEmail && coordinatorEmailLower && userEmail === coordinatorEmailLower) {
      return false;
    }

    // If emails don't match, user is invited (not the team coordinator)
    return true;
  }, [currentUser, teamCoordinatorEmail, surveyData?.teamCoordinator, surveyData?.teamMembers]);



  // Helper function to determine if user is an invited user
  // Returns the memoized value - updates reactively without page reload
  const isInvitedUser = () => isInvitedUserValue;



  const [findings, setFindings] = useState([]);

  // Initialize team members from IndexedDB (survey-specific)
  const [teamMembers, setTeamMembers] = useState([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showOfflineGuide, setShowOfflineGuide] = useState(false);
  const [showResourceLauncher, setShowResourceLauncher] = useState(false);
  const [selectedResourceCategory, setSelectedResourceCategory] =
    useState(null);
  const [showNewSurveyConfirm, setShowNewSurveyConfirm] = useState(false);

  // Handle resource launcher with category
  const handleShowResourceLauncher = (show, category = null) => {
    setShowResourceLauncher(show);
    setSelectedResourceCategory(category);
  };

  // Throttle flag to prevent rapid saves (using ref to avoid re-renders)
  const lastSaveAttemptRef = useRef(Date.now());
  const storageDisabledRef = useRef(false);

  // Track if there are unsaved changes (used internally for auto-save timing)
  const lastSaveSuccessRef = useRef(Date.now());
  const lastDataModificationRef = useRef(0);
  const hasInitializedRef = useRef(false); // Track if initial load is complete

  // Initialize IndexedDB and load survey data
  useEffect(() => {
    const initializeIndexedDB = async () => {
      try {
        const currentSurveyId = localStorage.getItem("currentSurveyId");
        if (currentSurveyId) {
          // Load survey metadata
          const metadata = await getSurveyMetadata(currentSurveyId);
          if (metadata) {
            // Update team members from metadata
            if (metadata.teamMembers) {
              setTeamMembers(metadata.teamMembers);
            }
            // Update current step from metadata only if it exists
            // For invited users, always start at step 1 regardless of saved step
            if (metadata.currentStep && !isInvitedUser()) {
              setCurrentStep(metadata.currentStep);
            } else {
              // Invited users always start at step 1
              setCurrentStep(1);
            }
          }

          // Load current step data
          // For invited users, always load step 1 data regardless of saved step
          const stepToLoad = isInvitedUser() ? 1 : currentStep;
          const stepData = await getSurveyStepData(
            currentSurveyId,
            stepToLoad
          );
          if (stepData) {
            setSurveyData(stepData);
          }
        } else {
          // No current survey ID - ensure we start at step 1 for new surveys
          setCurrentStep(1);
          setSurveyData(getDefaultSurveyData());
        }

        // Update storage stats
        const stats = await getStorageStats();
        setStorageStats(stats);

        // Update sync status
        const syncStatus = await getSyncStatus();
        setSyncStatus(syncStatus);

        setIsIndexedDBReady(true);

        // Mark initialization as complete after a delay
        // This ensures initial data load doesn't count as "unsaved changes"
        setTimeout(() => {
          hasInitializedRef.current = true;
          // Reset timestamps so any future changes are properly tracked
          lastSaveSuccessRef.current = Date.now();
          lastDataModificationRef.current = 0;
        }, 2000);
      } catch (error) {

        setIsIndexedDBReady(true); // Still allow app to function

        // Still mark as initialized even on error
        setTimeout(() => {
          hasInitializedRef.current = true;
        }, 2000);
      }
    };

    initializeIndexedDB();
  }, []);

  // Persist survey data to IndexedDB when it changes (per-step persistence)
  useEffect(() => {
    if (!isIndexedDBReady) return;

    // Mark that data was modified
    lastDataModificationRef.current = Date.now();

    // Throttle saves - max once per second
    const now = Date.now();
    if (now - lastSaveAttemptRef.current < 1000) {
      return;
    }
    lastSaveAttemptRef.current = now;

    const saveStepData = async () => {
      try {
        const currentSurveyId = localStorage.getItem("currentSurveyId");
        if (!currentSurveyId) return;

        // Save current step data to IndexedDB
        const success = await saveSurveyStepData(
          currentSurveyId,
          currentStep,
          surveyData
        );

        if (success) {
          // Mark successful save
          lastSaveSuccessRef.current = Date.now();

          // Update storage stats
          const stats = await getStorageStats();
          setStorageStats(stats);
        } else {

        }
      } catch (error) {

      }
    };

    saveStepData();
  }, [surveyData, currentStep, isIndexedDBReady]);

  // Persist current step to IndexedDB when it changes
  useEffect(() => {
    if (!isIndexedDBReady) return;

    const saveCurrentStep = async () => {
      try {
        const currentSurveyId = localStorage.getItem("currentSurveyId");
        if (!currentSurveyId) return;

        // Save current step to metadata
        const metadata = (await getSurveyMetadata(currentSurveyId)) || {};
        metadata.currentStep = currentStep;
        await saveSurveyMetadata(currentSurveyId, metadata);


      } catch (error) {

      }
    };

    saveCurrentStep();

    // Scroll to top smoothly when step changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep, isIndexedDBReady]);

  // Persist team members to IndexedDB when they change
  useEffect(() => {
    if (!isIndexedDBReady) return;

    const saveTeamMembers = async () => {
      try {
        const currentSurveyId = localStorage.getItem("currentSurveyId");
        if (!currentSurveyId) return;

        // Save team members to metadata
        const metadata = (await getSurveyMetadata(currentSurveyId)) || {};
        metadata.teamMembers = teamMembers;
        await saveSurveyMetadata(currentSurveyId, metadata);

      } catch (error) {

      }
    };

    saveTeamMembers();
  }, [teamMembers, isIndexedDBReady]);

  // Fetch F-Flags on component mount
  useEffect(() => {
    fetchFFlags();
    // IndexedDB handles cleanup automatically, no need for clearOldSurveyData
  }, []);


  // Clear saved data when survey is completed or user explicitly resets
  const clearSavedProgress = async () => {
    try {
      const currentSurveyId = localStorage.getItem("currentSurveyId");
      if (currentSurveyId) {
        await clearSurveyStorage(currentSurveyId);

      }
    } catch (error) {

    }
  };

  // Utility to check localStorage usage (silent monitoring)
  const checkStorageUsage = () => {
    try {
      let totalSize = 0;
      const storageItems = [];

      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          const itemSize = new Blob([localStorage.getItem(key)]).size;
          totalSize += itemSize;
          storageItems.push({ key, size: itemSize });
        }
      }

      const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

      // Only log if usage is concerning
      if (parseFloat(totalSizeMB) > 4) {


        // Log largest items for debugging
        storageItems.sort((a, b) => b.size - a.size);
        storageItems.slice(0, 3).forEach((item) => {
          if (item.size > 1024 * 100) {
            // Only log items > 100KB
          }
        });
      }

      return { totalSizeMB: parseFloat(totalSizeMB), items: storageItems };
    } catch (error) {
      // Silent error handling
      return { totalSizeMB: 0, items: [] };
    }
  };

  // Auto-cleanup monitoring on mount (silent)
  useEffect(() => {
    try {
      // Check storage usage silently
      checkStorageUsage();
    } catch (error) {
      // Silent handling - no user impact
    }
  }, []); // Run once on mount

  // Global error handler for unhandled errors
  useEffect(() => {
    const handleUnhandledError = (event) => {

      // Prevent default error handling that might break the page
      event.preventDefault();
    };

    const handleUnhandledRejection = (event) => {

      // Prevent default rejection handling that might break the page
      event.preventDefault();
    };

    window.addEventListener("error", handleUnhandledError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleUnhandledError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
    };
  }, []);

  // Start a new survey (clears all progress)
  const startNewSurvey = () => {
    setShowNewSurveyConfirm(true);
  };

  const confirmStartNewSurvey = async () => {
    await clearSavedProgress();
    // IndexedDB handles cleanup automatically, no need for clearOldSurveyData
    setCurrentStep(1);
    setTeamMembers([]);
    // Reset surveyData to defaults
    setSurveyData(getDefaultSurveyData());
    setShowNewSurveyConfirm(false);
    toast.success("New survey started successfully!");
  };
  const [showArbitrationModal, setShowArbitrationModal] = useState(false);
  const [showTagReviewModal, setShowTagReviewModal] = useState(false);
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [editingMemberId, setEditingMemberId] = useState(null); // Track which member is being edited
  const [newTeamMember, setNewTeamMember] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    specialization: "",
    assignedFacilityTasks: [], // Array of task keys assigned to this member
  });
  const [teamMemberSearch, setTeamMemberSearch] = useState("");
  const [teamMemberFilter, setTeamMemberFilter] = useState("all");

  const [currentFinding, setCurrentFinding] = useState({
    fFlag: "",
    severity: "",
    observations: "",
    deficiency: "",
  });

  // F-Flags will be fetched from API
  const [fFlags, setFFlags] = useState([]);

  // Severity levels - these are standard business logic values
  const severityLevels = ["Low", "Medium", "High", "Critical"];

  // Fetch F-Flags from API
  const fetchFFlags = async () => {
    try {
      // TODO: Implement API endpoint for F-Flags
      // const response = await resourceAPI.getFFlags();
      // setFFlags(response.data || []);

      // For now, set empty array until API is implemented
      setFFlags([]);
    } catch (error) {

      setFFlags([]);
    }
  };

  const handleSurveyDataChange = (field, value) => {
    try {
      setSurveyData((prev) => {
        // Defensive check - ensure prev is an object
        if (!prev || typeof prev !== "object") {
          return {
            [field]: value,
            surveyCreationDate: new Date().toISOString().split("T")[0],
            facilityName: "",
          };
        }
        return {
          ...prev,
          [field]: value,
        };
      });

      // Also update teamMembers state when teamMembers field is changed
      if (field === "teamMembers" && Array.isArray(value)) {
        setTeamMembers(value);
      }
    } catch (error) {
      // Silent - don't break the app
    }
  };

  const handleFindingInputChange = (field, value) => {
    setCurrentFinding((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Role management state
  const [availableRoles, setAvailableRoles] = useState([]);
  const [roleMapping, setRoleMapping] = useState({});
  const [roleIdToName, setRoleIdToName] = useState({});

  // Special types from API
  const [specialTypesList, setSpecialTypesList] = useState([]);
  const [loadingSpecialTypes, setLoadingSpecialTypes] = useState(false);

  // Fetch special types from API
  useEffect(() => {
    const fetchSpecialTypes = async () => {
      try {
        setLoadingSpecialTypes(true);
        const response = await api.survey.getSpecialTypes();
        if (response && response.status && response.data) {
          // Handle array of objects with 'name' property or simple strings
          const types = response.data.map(item => 
            typeof item === 'string' ? item : item.name || item.label || item
          );
          setSpecialTypesList(types);
        }
      } catch (error) {
       
        // Fallback to default types if API fails
        setSpecialTypesList([
          "Dementia",
          "Behavioral",
          "Wound Care",
          "IV Therapy",
          "Oxygen",
          "Dialysis",
          "Advanced Dementia",
          "Severe Disability",
          "Under 55",
        ]);
      } finally {
        setLoadingSpecialTypes(false);
      }
    };
    fetchSpecialTypes();
  }, []);

  // Fetch roles from API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.auth.getRoles();
        if (response && response.statusCode === 200 && response.data) {
          setAvailableRoles(response.data);

          // Create dynamic role mappings
          const nameToId = {};
          const idToName = {};

          response.data.forEach((role) => {
            nameToId[role.name] = role._id;
            idToName[role._id] = role.name;
          });

          setRoleMapping(nameToId);
          setRoleIdToName(idToName);
        }
      } catch (error) {
        // Fallback to default roles if API fails
        const fallbackRoles = [
          { _id: "689634cedb9e2674c11bab2f", name: "Consultant" },
          { _id: "689635c4db9e2674c11bab30", name: "Clinical Team Member" },
          { _id: "68963666db9e2674c11bab31", name: "Administrator" },
        ];
        setAvailableRoles(fallbackRoles);

        const nameToId = {};
        const idToName = {};
        fallbackRoles.forEach((role) => {
          nameToId[role.name] = role._id;
          idToName[role._id] = role.name;
        });
        setRoleMapping(nameToId);
        setRoleIdToName(idToName);
      }
    };

    fetchRoles();
  }, []);

  // Helper function to get role name from ID
  const getRoleName = (roleId) => {
    return roleIdToName[roleId] || "Unknown Role";
  };

  // Team management functions
  const handleAddTeamMember = () => {
    if (newTeamMember.name && newTeamMember.role) {
      // Check for duplicate names (skip if editing the same member)
      const existingMember = teamMembers.find(
        (m) => m.name.toLowerCase() === newTeamMember.name.toLowerCase() && m.id !== editingMemberId
      );
      if (existingMember) {
        toast.error(
          "A team member with this name already exists. Please use a different name or add a middle initial."
        );
        return;
      }

      // Validate team composition
      const currentSurveyors = teamMembers.filter(
        (m) => m.role === "Surveyor"
      ).length;
      const currentTC = teamMembers.filter(
        (m) => m.id === surveyData.teamCoordinator
      ).length;

      // Check if trying to add another TC when one already exists
      // Check by role name (newTeamMember.role is the role name string)
      if (newTeamMember.role === "Team Coordinator") {
        // Check if a TC is already assigned via surveyData.teamCoordinator
        if (surveyData.teamCoordinator) {
          const existingTC = teamMembers.find((m) => m.id === surveyData.teamCoordinator);
          toast.error(
            "Team Coordinator Already Assigned",
            {
              description: existingTC
                ? `A Team Coordinator is already assigned: ${existingTC.name}. Only one Team Coordinator is allowed per survey.`
                : "A Team Coordinator is already assigned. Only one Team Coordinator is allowed per survey.",
              duration: 4000,
            }
          );
          return;
        }

        // Check if any existing team member already has the "Team Coordinator" role
        const existingTCByRole = teamMembers.find(
          (m) => getRoleName(m.role) === "Team Coordinator"
        );

        if (existingTCByRole) {
          toast.error(
            "Team Coordinator Role Already Exists",
            {
              description: `${existingTCByRole.name} already has the Team Coordinator role. Only one Team Coordinator is allowed per survey.`,
              duration: 4000,
            }
          );
          return;
        }
      }

      // Check minimum surveyor requirement
      if (newTeamMember.role === "Surveyor" && currentSurveyors >= 10) {
        toast.warning(
          "Maximum of 10 surveyors allowed per team. Consider adding specialists instead."
        );
      }

      try {
        // Get the role ID for the selected role name
        const roleId = roleMapping[newTeamMember.role];
        if (!roleId) {
          toast.error("Invalid role selected. Please try again.");
          return;
        }

        // Check if we're editing an existing member
        if (editingMemberId) {
          // Update existing member
          const updatedTeamMembers = teamMembers.map((member) => {
            if (member.id === editingMemberId) {
              // Preserve assignedFacilityId for existing tasks
              const originalTasks = member.assignedFacilityTasks || [];
              const preservedTasks = (newTeamMember.assignedFacilityTasks || []).map(newTaskId => {
                // newTaskId is likely a string ID
                // Find if this task existed in originalTasks
                const originalTask = originalTasks.find(t =>
                  (typeof t === 'object' ? (t._id || t.id) : t) === newTaskId
                );

                if (originalTask && typeof originalTask === 'object' && originalTask.assignedFacilityId) {
                  return {
                    _id: newTaskId,
                    assignedFacilityId: originalTask.assignedFacilityId,
                    name: originalTask.name,
                    title: originalTask.title
                  };
                }
                return newTaskId; // Just the ID for new tasks
              });

              return {
                ...member,
                name: newTeamMember.name,
                role: roleId, // Store role ID
                email: newTeamMember.email,
                phone: newTeamMember.phone,
                specialization: newTeamMember.specialization,
                assignedFacilityTasks: preservedTasks,
                updatedAt: new Date().toISOString(),
              };
            }
            return member;
          });
          setTeamMembers(updatedTeamMembers);

          // Toast removed as per requirement: feedback should come from API response on save
        } else {
          // Create new member
          const member = {
            id: String(Date.now()), // Ensure ID is a string
            name: newTeamMember.name,
            role: roleId, // Store role ID
            email: newTeamMember.email,
            phone: newTeamMember.phone,
            specialization: newTeamMember.specialization,
            assignedFacilityTasks: newTeamMember.assignedFacilityTasks || [],
            assignedResidents: [],
            updatedAt: new Date().toISOString(),
          };

          const updatedTeamMembers = [...teamMembers, member];
          setTeamMembers(updatedTeamMembers);

          // Auto-assign first team member as TC if none is set
          if (!surveyData.teamCoordinator && updatedTeamMembers.length === 1) {
            const tcEmail = member.email || member.id;
            setSurveyData((prev) => ({
              ...prev,
              teamCoordinator: tcEmail,
            }));

            // Update state immediately for reactive updates
            if (member.email) {
              setTeamCoordinatorEmail(member.email);
            }

            // Toast removed as per requirement
          } else {
            // Toast removed as per requirement
          }
        }

        // Reset form
        setNewTeamMember({
          name: "",
          role: "",
          email: "",
          phone: "",
          specialization: "",
          assignedFacilityTasks: [],
        });

        // Clear editing mode
        setEditingMemberId(null);

        // Close modal
        setShowTeamModal(false);
      } catch (error) {
        toast.error("Failed to Add Team Member", {
          description:
            error.message ||
            "There was an error adding the team member. Please try again.",
          duration: 4000,
        });
      }
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const handleRemoveTeamMember = (memberId) => {
    // Find the member to remove
    const member = teamMembers.find((m) => (m.id === memberId) || (m._id === memberId));
    if (!member) return;

    // Check if trying to remove the team coordinator
    if (memberId === surveyData.teamCoordinator || member.id === surveyData.teamCoordinator || member._id === surveyData.teamCoordinator) {
      // If this is the only team member, allow removal
      if (teamMembers.length === 1) {
        setMemberToRemove(member);
        setShowRemoveConfirmModal(true);
        return;
      }

      // If there are other members, show a different message
      toast.error(
        "Cannot remove the Team Coordinator. Please assign a new Team Coordinator first, or remove other members first."
      );
      return;
    }

    // For non-TC members, proceed with normal removal
    setMemberToRemove(member);
    setShowRemoveConfirmModal(true);
  };

  const confirmRemoveTeamMember = async () => {
    if (memberToRemove) {
      const wasTeamCoordinator =
        memberToRemove.id === surveyData.teamCoordinator || memberToRemove._id === surveyData.teamCoordinator;

      // API Call to remove member from backend if survey exists
      const surveyId = localStorage.getItem("currentSurveyId");
      const memberIdToCheck = memberToRemove._id || memberToRemove.id;
      const isValidId = /^[0-9a-fA-F]{24}$/.test(memberIdToCheck);

      if (surveyId && isValidId) {
        try {
          const response = await api.survey.removeTeamMemberFromSurvey({
            teamMemberUserId: memberToRemove.teamMemberUserId,
            surveyId: surveyId
          });

          if (response && response.status) {
            toast.success(response.message);
          } else {
            toast.error(response?.message || "Failed to remove team member.");
            setShowRemoveConfirmModal(false);
            setMemberToRemove(null);
            return;
          }
        } catch (error) {

          toast.error(error.message || "Failed to connect to server.");
          setShowRemoveConfirmModal(false);
          setMemberToRemove(null);
          return;
        }
      }

      // Remove the member from the team locally
      const updatedTeamMembers = teamMembers.filter(
        (m) => m.id !== memberToRemove.id && m._id !== memberToRemove._id
      );
      setTeamMembers(updatedTeamMembers);

      // If we removed the Team Coordinator, handle TC reassignment
      if (wasTeamCoordinator) {
        if (updatedTeamMembers.length === 0) {
          // No members left, clear the TC
          setSurveyData((prev) => ({
            ...prev,
            teamCoordinator: null,
          }));

          if (!surveyId || !isValidId) {
            toast.success("Team member removed successfully!", {
              description: `${memberToRemove.name} has been removed from the team. No team coordinator assigned.`,
              duration: 4000,
            });
          }
        } else {
          // Auto-assign the first remaining member as the new TC
          const newTC = updatedTeamMembers[0];
          const newTCEmail = newTC.email || newTC.id || newTC._id;
          setSurveyData((prev) => ({
            ...prev,
            teamCoordinator: newTCEmail,
          }));

          // Update state immediately for reactive updates
          if (newTC.email) {
            setTeamCoordinatorEmail(newTC.email);
          }

          if (!surveyId || !isValidId) {
            toast.success("Team member removed successfully!", {
              description: `${memberToRemove.name} has been removed. ${newTC.name} is now the Team Coordinator.`,
              duration: 4000,
            });
          } else {
            toast.info(`${newTC.name} is now the Team Coordinator.`);
          }
        }
      } else {
        // Regular member removal
        if (!surveyId || !isValidId) {
          toast.success("Team member removed successfully!", {
            description: `${memberToRemove.name} has been removed from the team`,
            duration: 3000,
          });
        }
      }
    }
    setShowRemoveConfirmModal(false);
    setMemberToRemove(null);
  };

  const cancelRemoveTeamMember = () => {
    setShowRemoveConfirmModal(false);
    setMemberToRemove(null);
  };

  const handleSetTeamCoordinator = (memberId) => {
    // Get the member being assigned as TC
    const member = teamMembers.find((m) => m.id === memberId);

    if (member) {
      // Update both surveyData and teamCoordinatorEmail state for immediate reactivity
      setSurveyData((prev) => ({
        ...prev,
        teamCoordinator: member.email || memberId, // Store email for consistency
      }));

      // Update state immediately (triggers re-render without page reload)
      if (member.email) {
        setTeamCoordinatorEmail(member.email);
      }

      toast.success(
        `${member.name} assigned as Team Coordinator successfully!`
      );
    }
  };

  const handleTeamMemberInputChange = (field, value) => {
    setNewTeamMember((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle editing a team member
  const handleEditTeamMember = (memberId) => {
    const member = teamMembers.find((m) => m.id === memberId);
    if (!member) return;

    // Get role name from role ID
    const roleName = getRoleName(member.role);

    // Load member data into form
    setNewTeamMember({
      name: member.name || "",
      role: roleName || "",
      email: member.email || "",
      phone: member.phone || "",
      specialization: member.specialization || "",
      // Ensure we only store IDs for assigned tasks
      assignedFacilityTasks: (member.assignedFacilityTasks || []).map(task =>
        (typeof task === 'object' && task !== null) ? (task._id || task.id) : task
      ),
    });

    // Set editing mode
    setEditingMemberId(memberId);
    setShowTeamModal(true);
  };

  const resetTeamMemberForm = () => {
    setNewTeamMember({
      name: "",
      role: "",
      email: "",
      phone: "",
      specialization: "",
      assignedFacilityTasks: [],
    });
    setEditingMemberId(null); // Clear editing mode
    setShowTeamModal(false);
  };

  // Filter and search team members
  const filteredTeamMembers = teamMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(teamMemberSearch.toLowerCase()) ||
      getRoleName(member.role)
        .toLowerCase()
        .includes(teamMemberSearch.toLowerCase()) ||
      (member.specialization &&
        member.specialization
          .toLowerCase()
          .includes(teamMemberSearch.toLowerCase()));

    const matchesFilter =
      teamMemberFilter === "all" ||
      (teamMemberFilter === "tc" && member.id === surveyData.teamCoordinator) ||
      (teamMemberFilter === "surveyors" &&
        getRoleName(member.role) === "Surveyor") ||
      (teamMemberFilter === "specialists" &&
        getRoleName(member.role) !== "Surveyor" &&
        getRoleName(member.role) !== "Team Coordinator");

    return matchesSearch && matchesFilter;
  });

  // Export team member data
  const exportTeamMembers = () => {
    const csvContent = [
      ["Name", "Role", "Email", "Team Coordinator", "Updated Date"],
      ...teamMembers.map((member) => [
        member.name,
        getRoleName(member.role),
        member.email || "",
        member.id === surveyData.teamCoordinator ? "Yes" : "No",
        new Date(member.updatedAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `team-members-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Team member data exported successfully!");
  };

  // Mandatory task assignment functions
  const handleTaskAssignment = (taskKey, surveyorId, isPrimary = false) => {
    setSurveyData((prev) => ({
      ...prev,
      mandatoryTasks: {
        ...prev.mandatoryTasks,
        [taskKey]: {
          ...prev.mandatoryTasks[taskKey],
          assigned: true,
          primary: isPrimary
            ? surveyorId
            : prev.mandatoryTasks[taskKey].primary,
          surveyors: isPrimary
            ? [surveyorId]
            : [
              ...prev.mandatoryTasks[taskKey].surveyors.filter(
                (id) => id !== surveyorId
              ),
              surveyorId,
            ],
        },
      },
    }));
  };

  // Offline mode functions
  const handleOfflineToggle = () => {
    setSurveyData((prev) => ({
      ...prev,
      offlineMode: !prev.offlineMode,
      offlineStatus: !prev.offlineMode ? "In Progress" : "Not Started",
    }));
  };

  const handleOfflineStatusUpdate = (status) => {
    setSurveyData((prev) => ({
      ...prev,
      offlineStatus: status,
    }));
  };

  // Preparation task functions
  const handlePreparationTaskComplete = (taskKey) => {
    setSurveyData((prev) => ({
      ...prev,
      preparationTasks: {
        ...prev.preparationTasks,
        [taskKey]: {
          completed: true,
          timestamp: new Date().toISOString(),
        },
      },
    }));
  };

  // Auto-stamp entrance date/time when Step 3 is opened
  const handleStep3Open = () => {
    if (!surveyData.entranceDate) {
      const now = new Date();
      handleSurveyDataChange("entranceDate", now.toISOString().split("T")[0]);
      handleSurveyDataChange("entranceTime", now.toTimeString().split(" ")[0]);
    }
  };

  // Add resident to arbitration task
  const handleAddArbitrationResident = (resident) => {
    if (surveyData.bindingArbitration.residents.length < 3) {
      const updatedResidents = [
        ...surveyData.bindingArbitration.residents,
        resident,
      ];
      handleSurveyDataChange("bindingArbitration", {
        ...surveyData.bindingArbitration,
        residents: updatedResidents,
      });
      toast.success("Resident added to arbitration task");
    } else {
      toast.error("Maximum 3 residents allowed for arbitration task");
    }
  };

  // Resource launcher functions
  const handlePrintResource = (resourceType) => {
    // Implementation for printing resources
    toast.success(`${resourceType} printed successfully`);
  };

  const handleDownloadResource = (resourceType) => {
    // Implementation for downloading resources
    toast.success(`${resourceType} resources center`);
    window.open("/resource-center", "_blank");
  };

  // Pre-survey requirements handlers
  const handleRequestRequirement = (requirementId, timestamp) => {
    setSurveyData((prev) => ({
      ...prev,
      preSurveyRequirements: {
        ...prev.preSurveyRequirements,
        [requirementId]: {
          ...prev.preSurveyRequirements?.[requirementId],
          requested: true,
          requestTimestamp: timestamp,
        },
      },
    }));
  };

  const handleMarkReceived = (requirementId, timestamp) => {
    setSurveyData((prev) => ({
      ...prev,
      preSurveyRequirements: {
        ...prev.preSurveyRequirements,
        [requirementId]: {
          ...prev.preSurveyRequirements?.[requirementId],
          received: timestamp ? true : false,
          receivedTimestamp: timestamp,
        },
      },
    }));
  };

  // Arbitration resident management
  const [arbitrationResident, setArbitrationResident] = useState({
    name: "",
    type: "signed", // signed, resolved
    room: "",
    notes: "",
  });

  const handleAddArbitrationResidentSubmit = () => {
    if (arbitrationResident.name && arbitrationResident.type) {
      const resident = {
        id: Date.now(),
        ...arbitrationResident,
        addedAt: new Date().toISOString(),
      };

      handleAddArbitrationResident(resident);

      // Reset form
      setArbitrationResident({
        name: "",
        type: "signed",
        room: "",
        notes: "",
      });

      // Close modal
      setShowArbitrationModal(false);
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const resetClosedRecordForm = () => {
    setClosedRecordForm({
      residentName: "",
      recordType: "",
      date: "",
      reason: "",
      notes: "",
    });
  };

  const handleFormChange = (field, value) => {
    setClosedRecordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    if (
      !closedRecordForm.residentName ||
      !closedRecordForm.recordType ||
      !closedRecordForm.date
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newRecord = {
      id: Date.now(),
      ...closedRecordForm,
      status: "Not Started",
      assignedSurveyor: "Current User",
      createdAt: new Date().toISOString(),
      ceResponses: {},
    };

    const updatedClosedRecords = [
      ...(surveyData.closedRecords || []),
      newRecord,
    ];
    handleSurveyDataChange("closedRecords", updatedClosedRecords);

    resetClosedRecordForm();
    setShowClosedRecordsModal(false);

    toast.success("Closed record added successfully");
  };

  const handleCancel = () => {
    resetClosedRecordForm();
    setShowClosedRecordsModal(false);
  };

  const handleRemoveClosedRecord = (recordId) => {
    const updatedClosedRecords = (surveyData.closedRecords || []).filter(
      (record) => record.id !== recordId
    );
    handleSurveyDataChange("closedRecords", updatedClosedRecords);
    toast.success("Closed record removed successfully");
  };

  const canContinueFromStep = (step) => {
    try {
      // Defensive check - ensure surveyData exists
      if (!surveyData || typeof surveyData !== "object") {
        return false;
      }

      // Invited users can access all steps
      if (isInvitedUser()) {
        return true;
      }

      switch (step) {
        case 1:
          return Boolean(
            (surveyData.facilityName || surveyData.facilityId) &&
            surveyData.teamCoordinator &&
            teamMembers?.length > 0

            // surveyData.surveyCategory === 'Life Safety Survey'
            // ? surveyData.facilityName 
            // : surveyData.teamCoordinator &&
            // teamMembers?.length > 0
          );
        case 2:
          // Handle both old structure (preparationTasks) and new structure (offsitePreparation)
          if (surveyData.offsitePreparation?.offsiteChecklist) {
            return (
              surveyData.offsitePreparation.offsiteChecklist.filter(
                (task) => task?.completed
              ).length >= 2
            );
          }
          if (
            surveyData.preparationTasks &&
            typeof surveyData.preparationTasks === "object"
          ) {
            return (
              Object.values(surveyData.preparationTasks).filter(
                (task) => task?.completed
              ).length >= 2
            );
          }
          return false;
        case 3:
          // Handle both old structure and new structure (facilityEntrance)
          if (surveyData.facilityEntrance) {
            return Boolean(
              surveyData.facilityEntrance.entranceTime &&
              surveyData.facilityEntrance.entranceNotes
            );
          }
          return Boolean(surveyData.entranceDate && surveyData.entranceNotes);
        case 4:
          // Handle both old structure and new structure (facilityEntrance.residents)
          if (surveyData.facilityEntrance?.residents) {
            return surveyData.facilityEntrance.residents.length > 0;
          }
          return surveyData.residents?.length > 0;
        case 5:
          return Boolean(
            surveyData.initialPoolComplete && surveyData.census > 0
          );
        case 6:
          return surveyData.investigations?.length > 0;
        case 7:
          // TODO: Replace with API call to get mandatory tasks
          // For now, check if any facility tasks are completed
          const facilityTasks = surveyData.facilityTasksCompleted || {};
          const mandatoryCompleted = Object.keys(facilityTasks).length > 0;
          return mandatoryCompleted;
        case 8:
          // Check if Team Meetings step is complete
          // Daily meetings are optional - allow proceeding even without them

          // If there are investigations, at least some should have team determinations
          if (
            surveyData.investigations &&
            surveyData.investigations.length > 0
          ) {
            const determinationsCount = Object.keys(
              surveyData.teamDeterminations || {}
            ).length;
            // Allow proceeding if at least 50% of investigations have determinations
            if (
              determinationsCount <
              Math.ceil(surveyData.investigations.length * 0.5)
            ) {
              return false;
            }
          }

          // If there are citations, at least some should have opening statements
          if (surveyData.citations && surveyData.citations.length > 0) {
            const statementsCount = Object.keys(
              surveyData.openingStatements || {}
            ).length;
            // Allow proceeding if at least 50% of citations have statements
            if (
              statementsCount < Math.ceil(surveyData.citations.length * 0.5)
            ) {
              return false;
            }
          }

          return true;
        case 9:
          // Check if Citation Report step is complete
          return Boolean(
            surveyData.citationReportSurvey?.citationReportGenerated ||
            surveyData.citationReportPdfUrl
          );
        case 10:
          // Check if Exit Conference step is complete
          // Must have at least one required attendee and an outcome selected
          const hasRequiredAttendee =
            surveyData.exitConference?.attendees?.administrator ||
            surveyData.exitConference?.attendees?.medicalDirector;
          const hasOutcome =
            surveyData.exitConference?.outcomes?.selectedOutcome;
          return hasRequiredAttendee && hasOutcome;
        case 11:
          // Post-Survey Activities - allow completion if case closure activities are done
          return surveyData.caseClosureActivities === true;
        case 12:
          // Resources & Help step - always allow to continue
          return true;
        case 13:
          // Survey Closure - allow completion if survey is ready to close
          return Boolean(surveyData.surveyClosed);
        default:
          return true;
      }
    } catch (error) {
      // Default to allowing continuation to prevent blocking user
      return true;
    }
  };

  const handleAddFinding = () => {
    if (
      currentFinding.fFlag &&
      currentFinding.severity &&
      currentFinding.deficiency
    ) {
      const newCitation = {
        id: Date.now(),
        ...currentFinding,
      };
      const updatedCitations = [...(surveyData.citations || []), newCitation];
      handleSurveyDataChange("citations", updatedCitations);

      setCurrentFinding({
        fFlag: "",
        severity: "",
        observations: "",
        deficiency: "",
      });
    }
  };

  const handleFormSelection = (formId) => {
    setSelectedForms((prev) =>
      prev.includes(formId)
        ? prev.filter((id) => id !== formId)
        : [...prev, formId]
    );
  };

  const handleGenerateForms = () => {
    if (selectedForms.length > 0) {
      // Handle form generation logic here
      setShowGenerateFormsModal(false);
      setSelectedForms([]);
    }
  };

  const handleAddResident = () => {
    if (newResident.name && newResident.room && newResident.admissionDate) {
      // Auto-detect if this is a new admission (within last 30 days)
      const admissionDate = new Date(newResident.admissionDate);
      const isNewAdmission =
        new Date() - admissionDate <= 30 * 24 * 60 * 60 * 1000;

      // Merge specialTypes: exclude "Others" and include specialTypesOthers values
      const finalSpecialTypes = [
        ...newResident.specialTypes.filter((type) => type !== "Others"),
        ...(newResident.specialTypesOthers || []),
      ];

      // Destructure to remove specialTypesOthers from the resident object
      const { specialTypesOthers, ...residentData } = newResident;

      const resident = {
        id: Date.now(),
        ...residentData,
        specialTypes: finalSpecialTypes,
        admissionDate: newResident.admissionDate.toLocaleDateString("en-GB"), // Format as DD/MM/YYYY
        included: true,
        isNewAdmission: isNewAdmission,
        fiFlagged: false,
        ijHarm: false,
        surveyorNotes: "",
        canBeInterviewed:
          newResident.canBeInterviewed !== undefined
            ? newResident.canBeInterviewed
            : true,
        interviewAreas: newResident.interviewAreas || [
          "Resident Rights",
          "Resident Satisfaction",
          "Quality of Life",
        ],
        reviewAreas: newResident.reviewAreas || [],
        notes: newResident.notes || "",
      };
      const updatedResidents = [...(surveyData.residents || []), resident];
      handleSurveyDataChange("residents", updatedResidents);

      // Show success message
      if (isNewAdmission) {
        toast.success(
          "Resident added successfully! Auto-flagged as New Admission.",
          {
            description: "You can now select this resident for the survey.",
            duration: 5000,
            position: "top-right",
          }
        );
      } else {
        toast.success("Resident added successfully to the pool!", {
          description: "You can now select this resident for the survey.",
          duration: 5000,
          position: "top-right",
        });
      }

      // Reset form
      setNewResident({
        name: "",
        room: "",
        admissionDate: null,
        diagnosis: "",
        specialTypes: [],
        specialTypesOthers: [],
        canBeInterviewed: true,
        interviewAreas: [], // TODO: Fetch from API
        reviewAreas: [],
        notes: "",
      });
      setShowOthersInput(false);
      setShowAddResidentModal(false);
    }
  };

  const handleUploadResidents = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // Parse CSV or Excel file
          const content = e.target.result;
          // For now, we'll handle CSV format
          const lines = content.split("\n");
          const headers = lines[0].split(",").map((h) => h.trim());

          const uploadedResidents = lines
            .slice(1)
            .filter((line) => line.trim())
            .map((line, index) => {
              const values = line.split(",").map((v) => v.trim());
              // Parse and format the date from CSV
              let formattedDate = values[2] || "";
              if (values[2]) {
                try {
                  const date = new Date(values[2]);
                  if (!isNaN(date.getTime())) {
                    formattedDate = date.toLocaleDateString("en-GB"); // Format as DD/MM/YYYY
                  }
                } catch (error) {
                  // Invalid date format in CSV
                }
              }

              // Auto-detect if this is a new admission (within last 30 days)
              const admissionDate = new Date(values[2]);
              const isNewAdmission =
                !isNaN(admissionDate.getTime()) &&
                new Date() - admissionDate <= 30 * 24 * 60 * 60 * 1000;

              // Determine if resident is interviewable based on special types
              const specialTypes = values[4]
                ? values[4].split(";").map((t) => t.trim())
                : [];

              // TODO: Replace with API call to determine interviewability based on special types
              const isNonInterviewable = false; // Placeholder - will be determined by API

              return {
                id: Date.now() + index,
                name: values[0] || "",
                room: values[1] || "",
                admissionDate: formattedDate,
                diagnosis: values[3] || "",
                specialTypes: specialTypes,
                included: true,
                isNewAdmission: isNewAdmission,
                fiFlagged: false,
                ijHarm: false,
                surveyorNotes: "",
                canBeInterviewed: !isNonInterviewable,
                interviewAreas: !isNonInterviewable
                  ? [
                    "Resident Rights",
                    "Resident Satisfaction",
                    "Quality of Life",
                  ]
                  : [],
                reviewAreas: isNonInterviewable
                  ? ["Records Review", "Staff Interviews", "Family Interviews"]
                  : [],
                notes: "",
              };
            });

          const updatedResidents = [
            ...surveyData.residents,
            ...uploadedResidents,
          ];
          handleSurveyDataChange("residents", updatedResidents);

          // Show success message
          toast.success(
            `Successfully uploaded ${uploadedResidents.length} residents to the pool!`,
            {
              description: "You can now select these residents for the survey.",
              duration: 5000,
              position: "top-right",
            }
          );
          setShowUploadResidentModal(false);
        } catch (error) {
          toast.error(
            "Error parsing file. Please ensure it's in the correct format.",
            {
              description: "Please try again with a valid CSV file.",
              duration: 5000,
              position: "top-right",
            }
          );
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSpecialTypeToggle = (type) => {
    // Handle "Others" separately - don't add to specialTypes, just toggle input visibility
    if (type === "Others") {
      const wasShowing = showOthersInput;
      setShowOthersInput(!wasShowing);
      // Clear specialTypesOthers when hiding the input
      if (wasShowing) {
        setNewResident((prev) => ({
          ...prev,
          specialTypesOthers: [],
        }));
      }
      return;
    }

    setNewResident((prev) => ({
      ...prev,
      specialTypes: prev.specialTypes.includes(type)
        ? prev.specialTypes.filter((t) => t !== type)
        : [...prev.specialTypes, type],
    }));
  };

  const handleCriticalElementToggle = (element) => {
    setCurrentInvestigation((prev) => ({
      ...prev,
      criticalElements: prev.criticalElements.includes(element)
        ? prev.criticalElements.filter((e) => e !== element)
        : [...prev.criticalElements, element],
    }));
  };

  const downloadSampleCSV = () => {
    // TODO: Replace with API call to get sample CSV template
    const headers = [
      "Name",
      "Room",
      "Admission Date",
      "Diagnosis",
      "Special Types",
    ];
    const csvContent = headers.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "sample_residents.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      toast.success("Sample CSV file downloaded successfully!", {
        description:
          "You can now use this file to upload residents for the survey.",
        duration: 5000,
        position: "top-right",
      });
    }
  };

  const handleAddInvestigation = () => {
    if (currentInvestigation.observations) {
      const newInvestigation = {
        id: Date.now(),
        ...currentInvestigation,
        area: selectedCareArea, // Use the selected care area
        timestamp: new Date().toLocaleString(),
      };
      const updatedInvestigations = [
        ...surveyData.investigations,
        newInvestigation,
      ];
      handleSurveyDataChange("investigations", updatedInvestigations);

      // Clear the form
      setCurrentInvestigation({
        residentId: "",
        area: "",
        observations: "",
        findings: "",
        severity: "",
        followUpRequired: false,
        fFlag: "",
        criticalElements: [],
      });
    }
  };

  const handleDeleteInvestigation = (investigationId) => {
    const updatedInvestigations = surveyData.investigations.filter(
      (inv) => inv.id !== investigationId
    );
    handleSurveyDataChange("investigations", updatedInvestigations);

    // If deleted investigation was current, clear it
    if (
      surveyData.currentInvestigation &&
      surveyData.currentInvestigation.id === investigationId
    ) {
      handleSurveyDataChange("currentInvestigation", null);
    }

    toast.success("Investigation deleted successfully");
  };

  // New investigation management functions
  const handleCreateInvestigation = () => {
    if (investigationForm.title && investigationForm.careArea) {
      const newInvestigation = {
        id: Date.now(),
        ...investigationForm,
        status: "active",
        createdAt: new Date().toISOString(),
        completed: false,
        criticalElements: [],
        observations: "",
        fFlag: "",
        severity: "",
        complaints: [],
        probesAdded: [],
        lastUpdated: new Date().toISOString(),
        createdBy: surveyData.teamCoordinator || "Current User",
        careAreaDisplay: investigationForm.careArea
          .replace(/([A-Z])/g, " $1")
          .trim(),
        priorityLevel: investigationForm.priority,
        assignedToName: (() => {
          if (surveyData.teamMembers && investigationForm.assignedTo) {
            const member = surveyData.teamMembers.find(
              (m) => m.id === investigationForm.assignedTo
            );
            return member ? member.name : investigationForm.assignedTo;
          }
          return investigationForm.assignedTo || "Unassigned";
        })(),
        assignedToRole: (() => {
          if (surveyData.teamMembers && investigationForm.assignedTo) {
            const member = surveyData.teamMembers.find(
              (m) => m.id === investigationForm.assignedTo
            );
            return member ? getRoleName(member.role) : "";
          }
          return "";
        })(),
        investigationNotes: "",
        complianceDecisions: [],
        attachments: [],
        pathwayUsage: [],
      };

      // Add to investigations array
      const updatedInvestigations = [
        ...(surveyData.investigations || []),
        newInvestigation,
      ];
      handleSurveyDataChange("investigations", updatedInvestigations);

      // Set as current investigation if none exists
      if (!surveyData.currentInvestigation) {
        handleSurveyDataChange("currentInvestigation", newInvestigation);
      }

      // Update investigation notes if care area exists
      if (investigationForm.careArea && surveyData.investigationNotes) {
        const currentNotes =
          surveyData.investigationNotes[investigationForm.careArea] || "";
        if (
          !currentNotes.includes(`Investigation: ${investigationForm.title}`)
        ) {
          const investigationNote = `\n\n--- INVESTIGATION CREATED ---\nTitle: ${investigationForm.title
            }\nCare Area: ${investigationForm.careArea}\nPriority: ${investigationForm.priority
            }\nAssigned To: ${newInvestigation.assignedToName
            }\nCreated: ${new Date().toLocaleString()}\n--- END INVESTIGATION ---\n`;

          handleSurveyDataChange("investigationNotes", {
            ...surveyData.investigationNotes,
            [investigationForm.careArea]: currentNotes + investigationNote,
          });
        }
      }

      // Reset form
      setInvestigationForm({
        title: "",
        careArea: "",
        description: "",
        priority: "medium",
        assignedTo: "",
      });

      // Close modal
      setShowInvestigationModal(false);

      toast.success(
        `Investigation "${investigationForm.title}" created successfully for ${investigationForm.careArea}`
      );
    } else {
      toast.error(
        "Please fill in all required fields (Title and Care Area are required)"
      );
    }
  };

  const handleAddComplaint = () => {
    if (complaintForm.description && complaintForm.category) {
      const newComplaint = {
        id: Date.now(),
        ...complaintForm,
        status: "open",
        createdAt: new Date().toISOString(),
        linkedInvestigation: complaintForm.linkedInvestigation || null,
      };

      // Add to surveyData complaints
      const updatedComplaints = [
        ...(surveyData.complaints || []),
        newComplaint,
      ];
      handleSurveyDataChange("complaints", updatedComplaints);

      // If linked to investigation, update the investigation
      if (complaintForm.linkedInvestigation) {
        const updatedInvestigations = surveyData.investigations.map((inv) =>
          inv.id === complaintForm.linkedInvestigation
            ? {
              ...inv,
              complaints: [...(inv.complaints || []), newComplaint.id],
            }
            : inv
        );
        handleSurveyDataChange("investigations", updatedInvestigations);
      }

      // Reset form
      setComplaintForm({
        description: "",
        category: "",
        severity: "low",
        linkedInvestigation: "",
        investigationSearch: "",
      });

      toast.success("Complaint added successfully");
    } else {
      toast.error("Please fill in all required fields");
    }
  };

  const handleWeightCalculator = () => {
    if (weightCalculator.weight) {
      const weightNote = `Weight: ${weightCalculator.weight} ${weightCalculator.unit} - ${weightCalculator.notes}`;

      // Insert into current investigation notes if available
      if (selectedCareArea && surveyData.investigationNotes) {
        const currentNotes =
          surveyData.investigationNotes[selectedCareArea] || "";
        const updatedNotes =
          currentNotes + (currentNotes ? "\n\n" : "") + weightNote;

        handleSurveyDataChange("investigationNotes", {
          ...surveyData.investigationNotes,
          [selectedCareArea]: updatedNotes,
        });
      }

      // Save weight for future reference
      const savedWeight = {
        id: Date.now(),
        ...weightCalculator,
        timestamp: new Date().toISOString(),
      };

      const updatedWeights = [...(surveyData.savedWeights || []), savedWeight];
      handleSurveyDataChange("savedWeights", updatedWeights);

      // Reset form
      setWeightCalculator({
        weight: "",
        unit: "lbs",
        notes: "",
      });

      toast.success("Weight saved and inserted into notes");
    } else {
      toast.error("Please enter a weight value");
    }
  };

  const handleIJStatusChange = (status, details = "") => {
    setIjForm((prev) => ({
      ...prev,
      status,
      details,
      notificationDate:
        status === "confirmed" ? new Date().toISOString() : null,
    }));

    // Update current investigation IJ status
    if (surveyData.currentInvestigation) {
      const updatedInvestigation = {
        ...surveyData.currentInvestigation,
        ijStatus: status,
        ijDetails: details,
        supervisorNotified: status === "confirmed",
        notificationDate:
          status === "confirmed" ? new Date().toISOString() : null,
      };
      handleSurveyDataChange("currentInvestigation", updatedInvestigation);
    }

    // If IJ confirmed, trigger supervisor notification
    if (status === "confirmed") {
      // In a real app, this would send an email/notification
      toast.error(
        "IMMEDIATE JEOPARDY CONFIRMED - Supervisor notification sent!"
      );

      // Update surveyData IJ status
      handleSurveyDataChange("ijStatus", "confirmed");
      handleSurveyDataChange("ijDetails", details);
      handleSurveyDataChange("ijNotificationDate", new Date().toISOString());
    }
  };

  const handleComplianceDecision = (ceId, decision, severity = null) => {
    const updatedCE = {
      id: ceId,
      decision,
      severity,
      completed: true,
      completedAt: new Date().toISOString(),
      completedBy: surveyData.teamCoordinator || "Current User",
    };

    // Update critical elements in current investigation
    if (surveyData.currentInvestigation) {
      const updatedCEs = surveyData.currentInvestigation.criticalElements.map(
        (ce) => (ce.id === ceId ? updatedCE : ce)
      );

      const updatedInvestigation = {
        ...surveyData.currentInvestigation,
        criticalElements: updatedCEs,
      };
      handleSurveyDataChange("currentInvestigation", updatedInvestigation);

      // Check if all CEs are completed
      const allCompleted = updatedCEs.every((ce) => ce.completed);
      if (allCompleted) {
        toast.success("All Critical Elements completed!");
      }
    }

    toast.success(`Compliance decision saved: ${decision}`);
  };

  // Body Map Tool functions
  const handleBodyMapWoundAdd = (woundData) => {
    const newWound = {
      id: Date.now(),
      ...woundData,
      timestamp: new Date().toISOString(),
    };
    setBodyMapData((prev) => ({
      ...prev,
      wounds: [...prev.wounds, newWound],
    }));
    toast.success("Wound added to body map");
  };

  const handleBodyMapWoundRemove = (woundId) => {
    setBodyMapData((prev) => ({
      ...prev,
      wounds: prev.wounds.filter((w) => w.id !== woundId),
    }));
    toast.success("Wound removed from body map");
  };

  // Attachment functions
  const handleAttachmentUpload = (file) => {
    const newAttachment = {
      id: Date.now(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      file: file,
    };
    setAttachments((prev) => [...prev, newAttachment]);
    toast.success(`File "${file.name}" uploaded successfully`);
  };

  const handleAttachmentRemove = (attachmentId) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    toast.success("Attachment removed");
  };

  // CE Pathway functions
  const handleCePathwayView = (pathwayUrl) => {
    setCePathwayData((prev) => ({ ...prev, pathwayUrl }));

    // Simulate PDF opening with pathway selection
    const pathwayOptions = {
      dining: "Dining Services CE Pathway",
      infectionControl: "Infection Control CE Pathway",
      kitchen: "Kitchen Services CE Pathway",
      medAdmin: "Medication Administration CE Pathway",
      medStorage: "Medication Storage CE Pathway",
      residentCouncil: "Resident Council CE Pathway",
      nurseStaffing: "Nurse Staffing CE Pathway",
      qapi: "QAPI/QAA CE Pathway",
    };

    const selectedPathway =
      pathwayOptions[selectedCareArea] || "General CE Pathway";

    // In a real app, this would open a PDF viewer or download the pathway
    toast.success(`Opening ${selectedPathway} PDF...`);

    // Store the pathway data for reference
    const pathwayData = {
      title: selectedPathway,
      url: pathwayUrl,
      openedAt: new Date().toISOString(),
      careArea: selectedCareArea,
    };

    // Add to pathway history
    setCePathwayData((prev) => ({
      ...prev,
      pathwayUrl,
      currentPathway: pathwayData,
      lastViewed: new Date().toISOString(),
      pathwayHistory: [
        ...(prev.pathwayHistory || []),
        {
          ...pathwayData,
          viewedAt: new Date().toISOString(),
          sessionId: Date.now(),
        },
      ].slice(-10), // Keep last 10 pathways
    }));

    // Track pathway usage in survey data
    const pathwayUsage = {
      careArea: selectedCareArea,
      pathway: selectedPathway,
      openedAt: new Date().toISOString(),
      user: surveyData.teamCoordinator || "Current User",
    };

    handleSurveyDataChange("pathwayUsage", [
      ...(surveyData.pathwayUsage || []),
      pathwayUsage,
    ]);
  };

  const handleProbesCopy = (probes) => {
    setCePathwayData((prev) => ({ ...prev, probes }));

    // Copy probes to current investigation notes with enhanced formatting
    if (selectedCareArea) {
      const timestamp = new Date().toLocaleString();
      const probeText = probes.map((p) => `  • ${p}`).join("\n");
      const headerText = `\n\n--- CE Pathway Probes (${timestamp}) ---\n`;
      const formattedProbes = headerText + probeText + "\n--- End Probes ---\n";

      // Get current notes for the selected care area
      const currentNotes =
        surveyData.investigationNotes?.[selectedCareArea] || "";
      const updatedNotes = currentNotes + formattedProbes;

      // Update investigation notes
      handleSurveyDataChange("investigationNotes", {
        ...surveyData.investigationNotes,
        [selectedCareArea]: updatedNotes,
      });

      // Also add to current investigation if available
      if (surveyData.currentInvestigation) {
        const updatedInvestigation = {
          ...surveyData.currentInvestigation,
          lastUpdated: new Date().toISOString(),
          probesAdded: [
            ...(surveyData.currentInvestigation.probesAdded || []),
            {
              careArea: selectedCareArea,
              probes: probes,
              addedAt: new Date().toISOString(),
              source: "CE Pathway",
            },
          ],
        };
        handleSurveyDataChange("currentInvestigation", updatedInvestigation);
      }

      toast.success(
        `${probes.length} probes copied to ${selectedCareArea} investigation notes`
      );
    } else {
      toast.error("Please select a care area first");
    }
  };

  // Care area matching helper function
  const normalizeCareArea = (careArea) => {
    if (!careArea) return "";
    return careArea
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/([A-Z])/g, "$1");
  };

  const isCareAreaMatch = (investigationCareArea, selectedCareArea) => {
    if (!investigationCareArea || !selectedCareArea) return false;

    const inv = normalizeCareArea(investigationCareArea);
    const sel = normalizeCareArea(selectedCareArea);

    return (
      inv === sel ||
      investigationCareArea.toLowerCase() === selectedCareArea.toLowerCase() ||
      investigationCareArea
        .toLowerCase()
        .replace(/([A-Z])/g, " $1")
        .trim()
        .toLowerCase() === selectedCareArea.toLowerCase()
    );
  };

  // Enhanced probe management functions
  const handleCopySingleProbe = (probe, index) => {
    const timestamp = new Date().toLocaleString();
    const probeText = `\n\n--- SINGLE PROBE (${selectedCareArea}) ---\nAdded: ${timestamp}\nProbe ${index + 1
      }: ${probe}\n--- END PROBE ---\n`;

    if (selectedCareArea && surveyData.investigationNotes) {
      const currentNotes =
        surveyData.investigationNotes[selectedCareArea] || "";
      const updatedNotes = currentNotes + probeText;

      handleSurveyDataChange("investigationNotes", {
        ...surveyData.investigationNotes,
        [selectedCareArea]: updatedNotes,
      });
    }

    toast.success(`Copied probe ${index + 1} to notes`);
  };

  const handleCopyAllProbes = () => {
    if (cePathwayData.probes && cePathwayData.probes.length > 0) {
      handleProbesCopy(cePathwayData.probes);
    } else {
      toast.error("No probes available to copy");
    }
  };

  const handleCopySelectedProbes = () => {
    // This would open a probe selection modal in a real implementation
    toast.info("Probe selection modal would open here");
  };

  const handleAddProbesToInvestigation = () => {
    if (cePathwayData.probes && cePathwayData.probes.length > 0) {
      handleProbesCopy(cePathwayData.probes);
      toast.success("Probes added to investigation notes");
    } else {
      toast.error("No probes available");
    }
  };

  const handleCreateProbeChecklist = () => {
    if (cePathwayData.probes && cePathwayData.probes.length > 0) {
      // Create a checklist format
      const timestamp = new Date().toLocaleString();
      const checklist = `\n\n--- PROBE CHECKLIST (${selectedCareArea}) ---\nCreated: ${timestamp}\n\n${cePathwayData.probes
        .map((probe, index) => `□ ${probe}`)
        .join("\n")}\n\n--- END CHECKLIST ---\n`;

      if (selectedCareArea && surveyData.investigationNotes) {
        const currentNotes =
          surveyData.investigationNotes[selectedCareArea] || "";
        const updatedNotes = currentNotes + checklist;

        handleSurveyDataChange("investigationNotes", {
          ...surveyData.investigationNotes,
          [selectedCareArea]: updatedNotes,
        });
      }

      toast.success("Probe checklist created and added to notes");
    } else {
      toast.error("No probes available for checklist");
    }
  };

  const handleCopyProbesToNotes = () => {
    // Get care area specific probes
    const careAreaProbes = {
      dining: [
        "Observe meal service delivery timing",
        "Check food temperature and presentation",
        "Assess resident positioning during meals",
        "Monitor staff assistance techniques",
        "Verify dietary restrictions compliance",
        "Document meal completion and intake",
      ],
      infectionControl: [
        "Review hand hygiene practices",
        "Check personal protective equipment use",
        "Assess isolation procedures",
        "Monitor cleaning and disinfection",
        "Verify staff infection control training",
        "Document infection surveillance data",
      ],
      kitchen: [
        "Inspect food preparation areas",
        "Check food storage temperatures",
        "Assess kitchen sanitation practices",
        "Monitor food safety procedures",
        "Verify staff food handling training",
        "Document food safety compliance",
      ],
      medAdmin: [
        "Observe medication administration process",
        "Check medication storage and security",
        "Assess medication error prevention",
        "Monitor staff medication training",
        "Verify medication reconciliation",
        "Document medication administration",
      ],
      medStorage: [
        "Inspect medication storage areas",
        "Check temperature monitoring systems",
        "Assess medication security measures",
        "Monitor expiration date management",
        "Verify controlled substance procedures",
        "Document storage compliance",
      ],
      residentCouncil: [
        "Review council meeting minutes",
        "Check resident participation levels",
        "Assess issue resolution process",
        "Monitor staff responsiveness",
        "Verify resident rights protection",
        "Document council activities",
      ],
      nurseStaffing: [
        "Review staffing schedules and ratios",
        "Check nurse competency assessments",
        "Assess care continuity measures",
        "Monitor staff training records",
        "Verify emergency response procedures",
        "Document staffing adequacy",
      ],
      qapi: [
        "Review quality improvement plans",
        "Check data collection systems",
        "Assess performance monitoring",
        "Monitor corrective action implementation",
        "Verify staff QAPI training",
        "Document quality metrics",
      ],
    };

    const probes = careAreaProbes[selectedCareArea] || [
      "Assess resident's ability to perform ADLs",
      "Review care plan implementation",
      "Observe staff assistance techniques",
      "Check for proper equipment use",
      "Document resident preferences",
    ];

    handleProbesCopy(probes);
  };

  // FTag creation function
  const handleFTagCreate = () => {
    if (
      ftagForm.fTag &&
      ftagForm.careArea &&
      ftagForm.description &&
      ftagForm.severity
    ) {
      const newFTag = {
        id: editingFTagId || Date.now(),
        ...ftagForm,
        createdAt: editingFTagId
          ? surveyData.fTags.find((f) => f.id === editingFTagId)?.createdAt
          : new Date().toISOString(),
        status: "active",
        createdBy: surveyData.teamCoordinator || "Current User",
        careAreaDisplay: ftagForm.careArea.replace(/([A-Z])/g, " $1").trim(),
        severityDisplay:
          ftagForm.severity === "4"
            ? "Level 4 - Immediate Jeopardy"
            : ftagForm.severity === "3"
              ? "Level 3 - Serious"
              : ftagForm.severity === "2"
                ? "Level 2 - Moderate"
                : "Level 1 - Minimal",
        fTagNumber: ftagForm.fTag.split(" ")[0], // Extract F550, F551, etc.
        fTagTitle: ftagForm.fTag.split(" - ")[1] || ftagForm.fTag, // Extract title part
        lastUpdated: new Date().toISOString(),
        citations: [],
        complianceHistory: [],
      };

      // Add to current investigation if available
      if (surveyData.currentInvestigation) {
        const updatedInvestigation = {
          ...surveyData.currentInvestigation,
          fTags: [...(surveyData.currentInvestigation.fTags || []), newFTag],
          lastUpdated: new Date().toISOString(),
        };
        handleSurveyDataChange("currentInvestigation", updatedInvestigation);
      }

      // Add to main F-Tags list for tracking
      let updatedFTags;
      if (editingFTagId) {
        // Update existing F-Tag
        updatedFTags = surveyData.fTags.map((f) =>
          f.id === editingFTagId ? newFTag : f
        );
        toast.success(
          `F-Tag ${ftagForm.fTag} citation updated successfully for ${ftagForm.careArea}`
        );
      } else {
        // Create new F-Tag
        updatedFTags = [...(surveyData.fTags || []), newFTag];
        toast.success(
          `F-Tag ${ftagForm.fTag} citation created successfully for ${ftagForm.careArea}`
        );
      }
      handleSurveyDataChange("fTags", updatedFTags);

      // Update investigation notes if care area exists
      if (ftagForm.careArea && surveyData.investigationNotes) {
        const currentNotes =
          surveyData.investigationNotes[ftagForm.careArea] || "";
        const fTagNote = `\n\n--- F-TAG CITATION CREATED ---\nF-Tag: ${ftagForm.fTag
          }\nCare Area: ${ftagForm.careArea}\nSeverity: ${ftagForm.severityDisplay
          }\nDescription: ${ftagForm.description}\nEvidence: ${ftagForm.evidence || "Not provided"
          }\nCreated: ${new Date().toLocaleString()}\n--- END F-TAG ---\n`;

        handleSurveyDataChange("investigationNotes", {
          ...surveyData.investigationNotes,
          [ftagForm.careArea]: currentNotes + fTagNote,
        });
      }

      // Reset form and editing state
      setFtagForm({
        fTag: "",
        careArea: "",
        description: "",
        severity: "",
        evidence: "",
      });
      setEditingFTagId(null);

      setShowFTagModal(false);
    } else {
      toast.error(
        "Please fill in all required fields (F-Tag, Care Area, Description, and Severity are required)"
      );
    }
  };

  const generateDeficiency = () => {
    const templates = [
      "The facility failed to ensure that residents were free from abuse, neglect and exploitation as evidenced by...",
      "Based on observation and record review, the facility did not implement adequate measures to...",
      "The facility's policies and procedures were insufficient to prevent...",
    ];

    const randomTemplate =
      templates[Math.floor(Math.random() * templates.length)];
    const generatedText = `${randomTemplate} ${currentFinding.observations}`;

    handleFindingInputChange("deficiency", generatedText);
  };

  const handleObservationChange = (taskKey, observation) => {
    setTaskObservations((prev) => ({
      ...prev,
      [taskKey]: observation,
    }));
  };

  const handleTimeChange = (taskKey, minutes) => {
    setTaskTimes((prev) => ({
      ...prev,
      [taskKey]: parseInt(minutes) || 0,
    }));
  };

  const getTotalTime = () => {
    if (!taskTimes || typeof taskTimes !== "object") {
      return 0;
    }
    return Object.values(taskTimes).reduce(
      (total, time) => total + (time || 0),
      0
    );
  };

  // E-Send Configuration Modal
  const renderESendModal = () => {
    if (!surveyData.showESendModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Configure E-Send
            </h3>
            <button
              onClick={() => handleSurveyDataChange("showESendModal", false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
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
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="recipient@facility.com"
                value={surveyData.eSendConfig?.recipientEmail || ""}
                onChange={(e) => {
                  const currentConfig = surveyData.eSendConfig || {};
                  handleSurveyDataChange("eSendConfig", {
                    ...currentConfig,
                    recipientEmail: e.target.value,
                  });
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Line
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Survey Report - [Facility Name]"
                value={surveyData.eSendConfig?.subjectLine || ""}
                onChange={(e) => {
                  const currentConfig = surveyData.eSendConfig || {};
                  handleSurveyDataChange("eSendConfig", {
                    ...currentConfig,
                    subjectLine: e.target.value,
                  });
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Please find attached the survey report..."
                value={surveyData.eSendConfig?.message || ""}
                onChange={(e) => {
                  const currentConfig = surveyData.eSendConfig || {};
                  handleSurveyDataChange("eSendConfig", {
                    ...currentConfig,
                    message: e.target.value,
                  });
                }}
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="tracking"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={surveyData.eSendConfig?.enableTracking || false}
                onChange={(e) => {
                  const currentConfig = surveyData.eSendConfig || {};
                  handleSurveyDataChange("eSendConfig", {
                    ...currentConfig,
                    enableTracking: e.target.checked,
                  });
                }}
              />
              <label htmlFor="tracking" className="text-sm text-gray-700">
                Enable delivery tracking
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => handleSurveyDataChange("showESendModal", false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (surveyData.eSendConfig?.recipientEmail) {
                  handleSurveyDataChange("showESendModal", false);
                  toast.success("E-send configuration saved!", {
                    position: "top-right",
                    autoClose: 3000,
                  });
                } else {
                  toast.error("Please enter a recipient email", {
                    position: "top-right",
                    autoClose: 3000,
                  });
                }
              }}
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Print Preview Modal
  const renderPrintModal = () => {
    if (!surveyData.showPrintModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Print Preview
            </h3>
            <button
              onClick={() => handleSurveyDataChange("showPrintModal", false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
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
          </div>

          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paper Size
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={surveyData.printConfig?.paperSize || "letter"}
                  onChange={(e) => {
                    const currentConfig = surveyData.printConfig || {};
                    handleSurveyDataChange("printConfig", {
                      ...currentConfig,
                      paperSize: e.target.value,
                    });
                  }}
                >
                  <option value="letter">Letter (8.5" x 11")</option>
                  <option value="legal">Legal (8.5" x 14")</option>
                  <option value="a4">A4 (210mm x 297mm)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orientation
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={surveyData.printConfig?.orientation || "portrait"}
                  onChange={(e) => {
                    const currentConfig = surveyData.printConfig || {};
                    handleSurveyDataChange("printConfig", {
                      ...currentConfig,
                      orientation: e.target.value,
                    });
                  }}
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="headers"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={surveyData.printConfig?.includeHeaders || false}
                onChange={(e) => {
                  const currentConfig = surveyData.printConfig || {};
                  handleSurveyDataChange("printConfig", {
                    ...currentConfig,
                    includeHeaders: e.target.checked,
                  });
                }}
              />
              <label htmlFor="headers" className="text-sm text-gray-700">
                Include headers and footers
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="pageNumbers"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={surveyData.printConfig?.includePageNumbers || false}
                onChange={(e) => {
                  const currentConfig = surveyData.printConfig || {};
                  handleSurveyDataChange("printConfig", {
                    ...currentConfig,
                    includePageNumbers: e.target.checked,
                  });
                }}
              />
              <label htmlFor="headers" className="text-sm text-gray-700">
                Include page numbers
              </label>
            </div>
          </div>

          {/* Print Preview Content */}
          <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
            <div className="text-center mb-4">
              <h4 className="text-xl font-bold text-gray-900">
                Survey Report Preview
              </h4>
              <p className="text-gray-600">
                This is how your report will appear when printed
              </p>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-white p-4 rounded border">
                <h5 className="font-semibold text-gray-900 mb-2">
                  Facility Information
                </h5>
                <p className="text-gray-700">
                  Facility: {surveyData.facilityName || "Sample Facility"}
                </p>
                <p className="text-gray-700">
                  Survey Type: {surveyData.surveyType || "Standard Survey"}
                </p>
                <p className="text-gray-700">
                  Team Coordinator: {surveyData.teamCoordinator || "John Doe"}
                </p>
              </div>

              <div className="bg-white p-4 rounded border">
                <h5 className="font-semibold text-gray-900 mb-2">Summary</h5>
                <p className="text-gray-700">
                  Investigations: {surveyData.investigations?.length || 0}
                </p>
                <p className="text-gray-700">
                  Citations: {surveyData.citations?.length || 0}
                </p>
                <p className="text-gray-700">
                  Tasks Completed:{" "}
                  {
                    Object.values(surveyData.facilityTasksCompleted || {})
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => handleSurveyDataChange("showPrintModal", false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                // Simulate print functionality
                window.print();
                toast.success("Print dialog opened!", {
                  position: "top-right",
                  autoClose: 2000,
                });
              }}
            >
              Print Report
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Procedure Guide Modal
  const renderProcedureGuideModal = () => {
    if (!surveyData.showProcedureGuide) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Procedure Guide
            </h3>
            <button
              onClick={() =>
                handleSurveyDataChange("showProcedureGuide", false)
              }
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
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
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                Survey Procedures Overview
              </h4>
              <p className="text-blue-800 text-sm">
                Comprehensive guide to conducting surveys in accordance with CMS
                regulations and best practices.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2">
                  1. Pre-Survey Preparation
                </h5>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Review facility history and previous citations</li>
                  <li>Prepare survey team assignments</li>
                  <li>Gather necessary documentation and forms</li>
                  <li>Schedule entrance conference with facility</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2">
                  2. Survey Execution
                </h5>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Conduct entrance conference</li>
                  <li>Perform resident sampling and investigations</li>
                  <li>Complete facility task observations</li>
                  <li>Document findings and evidence</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2">
                  3. Plan of Correction
                </h5>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Generate Plan of Correction</li>
                  <li>Submit Plan of Correction to facility</li>
                  <li>Review Plan of Correction with facility</li>
                  <li>Archive survey documentation</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={() =>
                handleSurveyDataChange("showProcedureGuide", false)
              }
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Appendix Q (IJ) Modal
  const renderAppendixQModal = () => {
    if (!surveyData.showAppendixQ) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Appendix Q - Immediate Jeopardy (IJ)
            </h3>
            <button
              onClick={() => handleSurveyDataChange("showAppendixQ", false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
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
          </div>

          <div className="space-y-6">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-900 mb-2">
                ⚠️ Immediate Jeopardy Definition
              </h4>
              <p className="text-red-800 text-sm">
                A situation in which the provider's noncompliance with one or
                more requirements of participation has caused, or is likely to
                cause, serious injury, harm, impairment, or death to a resident.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2">
                  IJ Assessment Criteria
                </h5>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>
                    <strong>Severity:</strong> The deficiency has caused or is
                    likely to cause serious injury, harm, impairment, or death
                  </li>
                  <li>
                    <strong>Immediacy:</strong> The situation requires immediate
                    action to prevent serious outcomes
                  </li>
                  <li>
                    <strong>Scope:</strong> The deficiency affects one or more
                    residents
                  </li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2">
                  Required Actions
                </h5>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Immediate notification to facility administration</li>
                  <li>Documentation of specific IJ findings</li>
                  <li>Immediate corrective action plan</li>
                  <li>Follow-up verification of corrections</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={() => handleSurveyDataChange("showAppendixQ", false)}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Psychosocial Outcome Severity Guide Modal
  const renderPsychosocialGuideModal = () => {
    if (!surveyData.showPsychosocialGuide) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Psychosocial Outcome Severity Guide
            </h3>
            <button
              onClick={() =>
                handleSurveyDataChange("showPsychosocialGuide", false)
              }
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
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
          </div>

          <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2">
                Psychosocial Outcome Assessment
              </h4>
              <p className="text-purple-800 text-sm">
                Guidelines for assessing the severity of psychosocial outcomes
                in long-term care facilities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2 text-center">
                  Level 1
                </h5>
                <p className="text-xs text-gray-600 text-center mb-2">
                  No Harm
                </p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Minor psychosocial issues</li>
                  <li>No impact on well-being</li>
                  <li>Routine monitoring</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2 text-center">
                  Level 2
                </h5>
                <p className="text-xs text-gray-600 text-center mb-2">
                  Minimal Harm
                </p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Moderate psychosocial impact</li>
                  <li>Some effect on quality of life</li>
                  <li>Intervention recommended</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2 text-center">
                  Level 3
                </h5>
                <p className="text-xs text-gray-600 text-center mb-2">
                  Actual Harm
                </p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Significant psychosocial harm</li>
                  <li>Major impact on well-being</li>
                  <li>Immediate intervention required</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={() =>
                handleSurveyDataChange("showPsychosocialGuide", false)
              }
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Tag Review Tool Modal
  const renderTagReviewToolModal = () => {
    if (!surveyData.showTagReviewTool) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              F-Tag Review Tool
            </h3>
            <button
              onClick={() => handleSurveyDataChange("showTagReviewTool", false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
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
          </div>

          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">
                F-Tag Validation Tool
              </h4>
              <p className="text-green-800 text-sm">
                Review and validate F-Tag citations for accuracy, completeness,
                and regulatory compliance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2">
                  Validation Checklist
                </h5>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>F-Tag number accuracy</li>
                  <li>Regulatory citation completeness</li>
                  <li>Evidence documentation</li>
                  <li>Severity level justification</li>
                  <li>Corrective action requirements</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2">
                  Common Issues
                </h5>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Missing evidence documentation</li>
                  <li>Incorrect severity levels</li>
                  <li>Incomplete regulatory citations</li>
                  <li>Missing resident identifiers</li>
                  <li>Inadequate corrective actions</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={() => handleSurveyDataChange("showTagReviewTool", false)}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Extended Survey List Modal
  const renderExtendedSurveyListModal = () => {
    if (!surveyData.showExtendedSurveyList) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Extended Survey List
            </h3>
            <button
              onClick={() =>
                handleSurveyDataChange("showExtendedSurveyList", false)
              }
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
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
          </div>

          <div className="space-y-6">
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <h4 className="font-semibold text-indigo-900 mb-2">
                Survey Types & Requirements
              </h4>
              <p className="text-indigo-800 text-sm">
                Comprehensive list of survey types, their requirements, and
                specific protocols.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2">
                  Standard Surveys
                </h5>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Health Inspection Surveys</li>
                  <li>Life Safety Code Surveys</li>
                  <li>Emergency Preparedness Surveys</li>
                  <li>Abuse Prevention Surveys</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2">
                  Specialized Surveys
                </h5>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Focused Infection Control</li>
                  <li>Medication Error Investigations</li>
                  <li>Quality Assurance Surveys</li>
                  <li>Complaint Investigations</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={() =>
                handleSurveyDataChange("showExtendedSurveyList", false)
              }
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Support Modal
  const renderSupportModal = () => {
    if (!surveyData.showSupportModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              MockSurvey 365 Technical Support
            </h3>
            <button
              onClick={() => handleSurveyDataChange("showSupportModal", false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
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
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">
                24/7 Technical Support
              </h4>
              <p className="text-blue-800 text-sm">
                Our support team is available around the clock to assist you
                with any technical issues or questions.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2">
                  Contact Information
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-24">
                      Phone:
                    </span>
                    <span className="text-gray-600">1-800-MOCK-365</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-24">
                      Email:
                    </span>
                    <span className="text-gray-600">
                      staff@theinspac.com
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-700 w-24">
                      Live Chat:
                    </span>
                    <span className="text-gray-600">
                      Available on dashboard
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2">
                  Support Hours
                </h5>
                <div className="text-sm text-gray-700">
                  <p>
                    <strong>Monday - Friday:</strong> 6:00 AM - 10:00 PM EST
                  </p>
                  <p>
                    <strong>Saturday - Sunday:</strong> 8:00 AM - 8:00 PM EST
                  </p>
                  <p>
                    <strong>Emergency Support:</strong> 24/7 for critical issues
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={() => handleSurveyDataChange("showSupportModal", false)}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Screenshot Guide Modal
  const renderScreenshotGuideModal = () => {
    if (!surveyData.showScreenshotGuide) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Screenshot & Error Reporting Guide
            </h3>
            <button
              onClick={() =>
                handleSurveyDataChange("showScreenshotGuide", false)
              }
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
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
          </div>

          <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">
                📸 How to Capture Screenshots
              </h4>
              <p className="text-green-800 text-sm">
                Follow these steps to capture and attach screenshots for
                technical support tickets.
              </p>
            </div>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2">
                  Windows Instructions
                </h5>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Full Screen:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      PrtScn
                    </kbd>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Active Window:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Alt + PrtScn
                    </kbd>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Snipping Tool:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Windows + Shift + S
                    </kbd>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2">
                  Mac Instructions
                </h5>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Full Screen:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Cmd + Shift + 3
                    </kbd>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Selected Area:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Cmd + Shift + 4
                    </kbd>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Active Window:</span>
                    <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">
                      Cmd + Shift + 4, then Space
                    </kbd>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-semibold text-gray-900 mb-2">
                  Attaching to Support Ticket
                </h5>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Capture the screenshot using the methods above</li>
                  <li>Save the image file (PNG or JPG recommended)</li>
                  <li>
                    Copy the error code using the "Copy Error Code" button
                  </li>
                  <li>
                    Contact support with the error code and attach the
                    screenshot
                  </li>
                  <li>
                    Include a description of what you were doing when the error
                    occurred
                  </li>
                </ol>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={() =>
                handleSurveyDataChange("showScreenshotGuide", false)
              }
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderAddFindingModal = () => {
    if (!showAddFindingModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[16px] md:text-[18px] font-semibold text-gray-900">
                Add Finding
              </h3>
              <button
                onClick={() => setShowAddFindingModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-8">
              <div>
                <Label
                  htmlFor="chooseFlags"
                  className="text-base font-semibold text-gray-900 mb-3 block"
                >
                  Choose F-Flags
                </Label>
                <select
                  id="chooseFlags"
                  value={currentFinding.fFlag}
                  onChange={(e) =>
                    handleFindingInputChange("fFlag", e.target.value)
                  }
                  className="w-full h-12 px-4 text-base border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors"
                >
                  <option value="">Choose F-Flags</option>
                  {fFlags.map((flag) => (
                    <option key={flag} value={flag}>
                      {flag}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label
                  htmlFor="severity"
                  className="text-base font-semibold text-gray-900 mb-3 block"
                >
                  Severity
                </Label>
                <select
                  id="severity"
                  value={currentFinding.severity}
                  onChange={(e) =>
                    handleFindingInputChange("severity", e.target.value)
                  }
                  className="w-full h-12 px-4 text-base border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors"
                >
                  <option value="">Select Severity</option>
                  {severityLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label
                  htmlFor="observations"
                  className="text-base font-semibold text-gray-900 mb-3 block"
                >
                  Input Observations
                </Label>
                <div className="relative">
                  <textarea
                    id="observations"
                    value={currentFinding.observations}
                    onChange={(e) =>
                      handleFindingInputChange("observations", e.target.value)
                    }
                    placeholder="Input your observations..."
                    rows={4}
                    maxLength={200}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none transition-colors"
                  />
                  <div className="absolute bottom-3 right-3 text-sm text-gray-400 font-medium">
                    {currentFinding.observations.length}/200
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label
                    htmlFor="deficiency"
                    className="text-base font-semibold text-gray-900"
                  >
                    Deficiency Drafting
                  </Label>
                  <Button
                    type="button"
                    onClick={generateDeficiency}
                    className="h-9 px-4 bg-transparent hover:bg-[#075b7d]/10 border border-[#075b7d] text-[#075b7d] text-sm font-medium rounded-[10px] transition-colors cursor-pointer"
                  >
                    Auto Generate
                  </Button>
                </div>
                <div className="relative">
                  <textarea
                    id="deficiency"
                    value={currentFinding.deficiency}
                    onChange={(e) =>
                      handleFindingInputChange("deficiency", e.target.value)
                    }
                    placeholder="Enter deficiency drafting"
                    rows={4}
                    maxLength={200}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none transition-colors"
                  />
                  <div className="absolute bottom-3 right-3 text-sm text-gray-400 font-medium">
                    {currentFinding.deficiency.length}/200
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-10 pt-6 border-t border-gray-200">
              <Button
                onClick={() => setShowAddFindingModal(false)}
                variant="outline"
                className="h-12 px-8 text-gray-600 border-gray-300 hover:bg-gray-50 rounded-[10px] font-medium cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddFinding}
                disabled={
                  !currentFinding.fFlag ||
                  !currentFinding.severity ||
                  !currentFinding.deficiency
                }
                className="h-12 px-8 bg-[#075b7d] hover:bg-[#075b7d] text-white font-medium rounded-[10px] disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGenerateFormsModal = () => {
    if (!showGenerateFormsModal) return null;

    const formTypes = [
      {
        id: "entrance-conference",
        name: "Entrance Conference Form",
        description: "Initial meeting documentation",
      },
      {
        id: "facility-overview",
        name: "Facility Overview Form",
        description: "Basic facility information and layout",
      },
      {
        id: "staff-interview",
        name: "Staff Interview Forms",
        description: "Templates for interviewing facility staff",
      },
      {
        id: "resident-interview",
        name: "Resident Interview Forms",
        description: "Templates for resident interviews",
      },
      {
        id: "observation-checklist",
        name: "Observation Checklist",
        description: "Structured observation forms",
      },
      {
        id: "documentation-review",
        name: "Documentation Review Form",
        description: "Record review templates",
      },
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Generate Entrance Forms
                </h3>
                <p className="text-gray-500 mt-1">
                  Select the forms you need for the survey entrance conference
                </p>
              </div>
              <button
                onClick={() => setShowGenerateFormsModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <h4 className="text-lg font-medium text-gray-900">
                Available Forms
              </h4>

              <div className="space-y-1">
                {formTypes.map((form, index) => (
                  <label
                    key={form.id}
                    className="flex items-start p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedForms.includes(form.id)}
                      onChange={() => handleFormSelection(form.id)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-1 mr-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900">
                          {form.name}
                        </h5>
                        <span className="text-xs text-gray-400 font-mono">
                          #{String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {form.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {selectedForms.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {selectedForms.length} form
                        {selectedForms.length > 1 ? "s" : ""} selected
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Forms will be generated as PDF documents ready for
                        printing
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Format: PDF</p>
                      <p className="text-xs text-gray-400">Ready for print</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 mt-10 pt-6 border-t border-gray-200">
              <Button
                onClick={() => setShowGenerateFormsModal(false)}
                variant="outline"
                className="h-12 px-8 text-gray-600 border-gray-300 hover:bg-gray-50 rounded-[10px] font-medium cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateForms}
                disabled={selectedForms.length === 0}
                className="h-12 px-8 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-[10px] disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
              >
                Generate{" "}
                {selectedForms.length > 0
                  ? `${selectedForms.length} Form${selectedForms.length > 1 ? "s" : ""
                  }`
                  : "Forms"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAddResidentModal = () => {
    if (!showAddResidentModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Add New Resident
              </h3>
              <button
                onClick={() => setShowAddResidentModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="residentName"
                  className="text-sm font-medium text-gray-700"
                >
                  Resident Name *
                </Label>
                <Input
                  id="residentName"
                  value={newResident.name}
                  onChange={(e) =>
                    setNewResident((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter resident name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label
                  htmlFor="residentRoom"
                  className="text-sm font-medium text-gray-700"
                >
                  Room Number *
                </Label>
                <Input
                  id="residentRoom"
                  value={newResident.room}
                  onChange={(e) =>
                    setNewResident((prev) => ({
                      ...prev,
                      room: e.target.value,
                    }))
                  }
                  placeholder="Enter room number"
                  className="mt-1"
                />
              </div>

              <div>
                <Label
                  htmlFor="admissionDate"
                  className="text-sm font-medium text-gray-700"
                >
                  Admission Date *
                </Label>
                <div className="mt-1">
                  <DatePicker
                    date={newResident.admissionDate}
                    onSelect={(date) =>
                      setNewResident((prev) => ({
                        ...prev,
                        admissionDate: date,
                      }))
                    }
                    placeholder="Select admission date"
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor="diagnosis"
                  className="text-sm font-medium text-gray-700"
                >
                  Diagnosis
                </Label>
                <Input
                  id="diagnosis"
                  value={newResident.diagnosis}
                  onChange={(e) =>
                    setNewResident((prev) => ({
                      ...prev,
                      diagnosis: e.target.value,
                    }))
                  }
                  placeholder="Enter diagnosis"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Interview Status
                </Label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="interviewStatus"
                      value="interviewable"
                      checked={newResident.canBeInterviewed === true}
                      onChange={() =>
                        setNewResident((prev) => ({
                          ...prev,
                          canBeInterviewed: true,
                          specialTypes: prev.specialTypes.filter(
                            (t) => !t.includes("Non-Interviewable")
                          ),
                          interviewAreas: [], // TODO: Fetch from API
                          reviewAreas: [],
                        }))
                      }
                      className="w-4 h-4 text-[#075b7d] border-gray-300 focus:ring-[#075b7d]"
                    />
                    <span className="text-sm text-gray-700">Interviewable</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="interviewStatus"
                      value="nonInterviewable"
                      checked={newResident.canBeInterviewed === false}
                      onChange={() =>
                        setNewResident((prev) => ({
                          ...prev,
                          canBeInterviewed: false,
                          specialTypes: prev.specialTypes.filter(
                            (t) => !t.includes("Interviewable")
                          ),
                          interviewAreas: [],
                          reviewAreas: [], // TODO: Fetch from API
                        }))
                      }
                      className="w-4 h-4 text-[#075b7d] border-gray-300 focus:ring-[#075b7d]"
                    />
                    <span className="text-sm text-gray-700">
                      Non-Interviewable
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Special Types
                </Label>
                {loadingSpecialTypes ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-[#075b7d] rounded-full animate-spin"></div>
                    <span className="ml-2 text-sm text-gray-500">Loading special types...</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Selected types badges */}
                    {newResident.specialTypes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {newResident.specialTypes.map((type) => (
                          <Badge
                            key={type}
                            variant="secondary"
                            className="text-xs bg-[#075b7d]/10 text-[#075b7d] border-[#075b7d]/20 flex items-center gap-1 px-2 py-1"
                          >
                            {type}
                            <button
                              type="button"
                              onClick={() => handleSpecialTypeToggle(type)}
                              className="hover:bg-[#075b7d]/20 rounded-full p-0.5 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    {/* Searchable multi-select combobox */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between h-10 font-normal text-sm"
                        >
                          <span className="text-gray-500">
                            {newResident.specialTypes.length > 0
                              ? `${newResident.specialTypes.length} type(s) selected`
                              : "Search and select special types..."}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search special types..." />
                          <CommandList>
                            <CommandEmpty>No special type found.</CommandEmpty>
                            <CommandGroup>
                              {specialTypesList.map((type) => (
                                <CommandItem
                                  key={type}
                                  value={type}
                                  onSelect={() => handleSpecialTypeToggle(type)}
                                  className="cursor-pointer"
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      type === "Others"
                                        ? showOthersInput
                                          ? "opacity-100 text-[#075b7d]"
                                          : "opacity-0"
                                        : newResident.specialTypes.includes(type)
                                        ? "opacity-100 text-[#075b7d]"
                                        : "opacity-0"
                                    }`}
                                  />
                                  {type}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
                {showOthersInput && (
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600 block mt-4">
                      Other Special Types:
                    </Label>
                    {/* Display existing tags */}
                    {Array.isArray(newResident.specialTypesOthers) &&
                      newResident.specialTypesOthers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {newResident.specialTypesOthers.map((item, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1 px-2 py-1"
                            >
                              {item}
                              <button
                                type="button"
                                onClick={() => {
                                  setNewResident((prev) => ({
                                    ...prev,
                                    specialTypesOthers:
                                      prev.specialTypesOthers.filter(
                                        (_, i) => i !== index
                                      ),
                                  }));
                                }}
                                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    {/* Input for adding new tags */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        onChange={(e) => {
                          const value = e.target.value;
                          // Auto-split on comma
                          if (value.includes(",")) {
                            const newItems = value
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean);
                            if (newItems.length > 0) {
                              setNewResident((prev) => ({
                                ...prev,
                                specialTypesOthers: [
                                  ...(prev.specialTypesOthers || []),
                                  ...newItems,
                                ],
                              }));
                              e.target.value = "";
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.target.value.trim()) {
                            e.preventDefault();
                            const trimmedValue = e.target.value.trim();
                            if (trimmedValue) {
                              setNewResident((prev) => ({
                                ...prev,
                                specialTypesOthers: [
                                  ...(prev.specialTypesOthers || []),
                                  trimmedValue,
                                ],
                              }));
                              e.target.value = "";
                            }
                          }
                        }}
                        placeholder="Type and press Enter or use comma to separate"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Notes
                </Label>
                <textarea
                  value={newResident.notes}
                  onChange={(e) =>
                    setNewResident((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Add any additional notes about this resident..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <Button
                onClick={() => setShowAddResidentModal(false)}
                variant="outline"
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddResident}
                disabled={
                  !newResident.name ||
                  !newResident.room ||
                  !newResident.admissionDate
                }
                className="px-6 bg-[#075b7d] hover:bg-[#075b7d]"
              >
                Add Resident
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUploadResidentModal = () => {
    if (!showUploadResidentModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Upload Residents CSV
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Bulk import residents from a CSV file
                </p>
              </div>
              <button
                onClick={() => setShowUploadResidentModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  CSV Format Requirements:
                </h4>
                <div className="space-y-2">
                  <p className="text-xs text-blue-700">
                    <strong>Column order:</strong> Name, Room, Admission Date,
                    Diagnosis, Special Types
                  </p>
                  <p className="text-xs text-blue-700">
                    <strong>Date format:</strong> YYYY-MM-DD (e.g., 2024-01-15)
                  </p>
                  <p className="text-xs text-blue-700">
                    <strong>Special Types:</strong> Use semicolons (;) to
                    separate multiple types. Include "Interviewable" or
                    "Non-Interviewable" + specific conditions
                  </p>
                  <p className="text-xs text-blue-700">
                    <strong>Examples:</strong> "Interviewable" or
                    "Non-Interviewable;Advanced Dementia"
                  </p>
                  <p className="text-xs text-blue-700">
                    <strong>Example:</strong> John
                    Doe,101A,2024-01-15,Dementia;Behavioral
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <Button
                    onClick={downloadSampleCSV}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download Sample CSV
                  </Button>
                </div>
              </div>

              <div>
                <Label
                  htmlFor="csvFile"
                  className="text-sm font-medium text-gray-700"
                >
                  Select CSV File
                </Label>
                <div className="mt-1">
                  <input
                    type="file"
                    id="csvFile"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleUploadResidents(file);
                      }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#075b7d]/10 file:text-[#075b7d] hover:file:bg-[#075b7d]/20"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Supported format: CSV files only. Maximum file size: 5MB
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
              <Button
                onClick={() => setShowUploadResidentModal(false)}
                variant="outline"
                className="px-6"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add Resident Name Modal for Exit Conference
  const renderAddResidentNameModal = () => {
    if (!showAddExitConferenceResidentModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Add Resident to Exit Conference
              </h3>
              <button
                onClick={() => {
                  setShowAddExitConferenceResidentModal(false);
                  setResidentSearchQuery("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Resident Count Information */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Available:</strong>{" "}
                  {(() => {
                    const existingResidents = finalSampleResidents || [];
                    const currentExitConferenceResidents =
                      surveyData.exitConference?.attendees?.residents || [];
                    const availableResidents = existingResidents.filter(
                      (resident) =>
                        !currentExitConferenceResidents.some(
                          (ecResident) => ecResident.name === resident.name
                        )
                    );
                    return availableResidents.length;
                  })()}{" "}
                  residents | <strong>Already Added:</strong>{" "}
                  {
                    (surveyData.exitConference?.attendees?.residents || [])
                      .length
                  }
                  /2
                </p>
              </div>

              <div>
                <Label
                  htmlFor="residentSelect"
                  className="text-sm font-medium text-gray-700"
                >
                  Select Resident *
                </Label>
                {(() => {
                  // Get existing residents that are not already added to the exit conference
                  const existingResidents = finalSampleResidents || [];
                  const currentExitConferenceResidents =
                    surveyData.exitConference?.attendees?.residents || [];
                  const availableResidents = existingResidents.filter(
                    (resident) =>
                      !currentExitConferenceResidents.some(
                        (ecResident) => ecResident.name === resident.name
                      )
                  );

                  // Filter residents based on search query
                  const filteredResidents = !residentSearchQuery.trim()
                    ? availableResidents
                    : availableResidents.filter((resident) => {
                      const query = residentSearchQuery.toLowerCase();
                      return (
                        resident.name.toLowerCase().includes(query) ||
                        (resident.room &&
                          resident.room.toString().toLowerCase().includes(query))
                      );
                    });

                  return availableResidents.length > 0 ? (
                    <div className="mt-1">
                      <Select
                        value={newResidentName}
                        onValueChange={(value) => {
                          setNewResidentName(value);
                          setResidentSearchQuery("");
                        }}
                      >
                        <SelectTrigger
                          id="residentSelect"
                          className="w-full focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d]"
                        >
                          <SelectValue placeholder="Choose a resident..." />
                        </SelectTrigger>
                        <SelectContent>
                          <div className="sticky top-0 bg-white border-b p-2 z-10">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="text"
                                placeholder="Search residents..."
                                value={residentSearchQuery}
                                onChange={(e) => {
                                  setResidentSearchQuery(e.target.value);
                                  e.stopPropagation();
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  e.stopPropagation();
                                  if (e.key === "Escape") {
                                    setResidentSearchQuery("");
                                  }
                                }}
                                className="w-full pl-9 pr-3 py-2 text-sm"
                              />
                            </div>
                          </div>
                          <div className="max-h-[300px] overflow-y-auto">
                            {filteredResidents.length > 0 ? (
                              filteredResidents.map((resident) => (
                                <SelectItem key={resident.id} value={resident.name}>
                                  {resident.name}{" "}
                                  {resident.room ? `(Room ${resident.room})` : ""}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-6 text-center text-sm text-gray-500">
                                No residents found
                              </div>
                            )}
                          </div>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-600">
                        All residents are already added to the Exit Conference.
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <Button
                onClick={() => {
                  setShowAddExitConferenceResidentModal(false);
                  setResidentSearchQuery("");
                }}
                variant="outline"
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (newResidentName && newResidentName.trim()) {
                    const currentResidents =
                      surveyData.exitConference?.attendees?.residents || [];
                    const updatedResidents = [
                      ...currentResidents,
                      { name: newResidentName.trim() },
                    ];
                    handleSurveyDataChange("exitConference", {
                      ...surveyData.exitConference,
                      attendees: {
                        ...surveyData.exitConference?.attendees,
                        residents: updatedResidents,
                      },
                    });
                    setNewResidentName("");
                    setResidentSearchQuery("");
                    setShowAddExitConferenceResidentModal(false);
                  }
                }}
                disabled={
                  !newResidentName ||
                  !newResidentName.trim() ||
                  (() => {
                    const existingResidents = finalSampleResidents || [];
                    const currentExitConferenceResidents =
                      surveyData.exitConference?.attendees?.residents || [];
                    const availableResidents = existingResidents.filter(
                      (resident) =>
                        !currentExitConferenceResidents.some(
                          (ecResident) => ecResident.name === resident.name
                        )
                    );
                    return availableResidents.length === 0;
                  })()
                }
                className="px-6 bg-[#075b7d] hover:bg-[#075b7d]"
              >
                {(() => {
                  const existingResidents = finalSampleResidents || [];
                  const currentExitConferenceResidents =
                    surveyData.exitConference?.attendees?.residents || [];
                  const availableResidents = existingResidents.filter(
                    (resident) =>
                      !currentExitConferenceResidents.some(
                        (ecResident) => ecResident.name === resident.name
                      )
                  );
                  return availableResidents.length === 0
                    ? "No Residents Available"
                    : "Add Resident";
                })()}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Team Management Modal - Using reusable component
  const renderTeamModal = () => {
    return (
      <TeamMemberModal
        isOpen={showTeamModal}
        onClose={resetTeamMemberForm}
        memberData={newTeamMember}
        onMemberDataChange={handleTeamMemberInputChange}
        editingMemberId={editingMemberId}
        availableRoles={availableRoles}
        roleMapping={roleMapping}
        getRoleName={getRoleName}
        facilityTasks={facilityTaskOptions}
        loadingTasks={loadingFacilityTaskOptions}
        teamMembers={teamMembers}
        surveyData={surveyData}
        onSubmit={handleAddTeamMember}
      />
    );
  };

  // Remove Team Member Confirmation Modal - Using reusable component
  const renderRemoveConfirmModal = () => {
    return (
      <RemoveTeamMemberModal
        isOpen={showRemoveConfirmModal}
        onClose={cancelRemoveTeamMember}
        member={memberToRemove}
        isTeamCoordinator={memberToRemove?.id === surveyData.teamCoordinator}
        getRoleName={getRoleName}
        onConfirm={confirmRemoveTeamMember}
      />
    );
  };

  // Offline Guide Modal
  const renderOfflineGuideModal = () => {
    if (!showOfflineGuide) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Offline User Guide
            </h3>
            <Button
              onClick={() => setShowOfflineGuide(false)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="prose prose-sm max-w-none">
            <h4 className="text-md font-semibold mb-3">
              How to Use Offline Mode
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Enable offline mode before leaving the office</li>
              <li>Download all necessary documents and forms</li>
              <li>Sync data when returning to online mode</li>
              <li>Ensure all changes are properly uploaded</li>
            </ol>

            <h4 className="text-md font-semibold mb-3 mt-6">
              Offline Features
            </h4>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
              <li>View and edit survey data</li>
              <li>Add observations and findings</li>
              <li>Complete facility tasks</li>
              <li>Document resident interviews</li>
            </ul>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={() => setShowOfflineGuide(false)} className="px-4">
              Got it
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Resource Launcher Modal
  const renderResourceLauncherModal = () => {
    if (!showResourceLauncher) return null;

    // Define resources for each category
    const getResourcesForCategory = (category) => {
      switch (category) {
        case "CMS Resources":
          return [
            {
              title: "CMS-672 Resident Census Form",
              action: () =>
                handleDownloadResource(
                  "CMS-672 Resident Census and Conditions of Residents Form"
                ),
              icon: Download,
            },
            {
              title: "CMS-802 Roster/Sample Matrix Form",
              action: () =>
                handleDownloadResource("CMS-802 Roster/Sample Matrix Form"),
              icon: Download,
            },
            {
              title: "State Operations Manual-Appendix PP",
              action: () =>
                handleDownloadResource("State Operations Manual-Appendix PP"),
              icon: Download,
            },
            {
              title: "Long Term Care Regulations-State by State",
              action: () => window.open("#", "_blank"),
              icon: Download,
              isExternal: true,
            },
          ];
        case "Survey Tools":
          return [
            {
              title: "Facility Entrance Conference Worksheet",
              action: () =>
                handleDownloadResource(
                  "Facility Entrance Conference Worksheet"
                ),
              icon: Download,
            },
            {
              title: "Team Assignment Worksheet",
              action: () => handleDownloadResource("Team Assignment Worksheet"),
              icon: Download,
            },
            {
              title: "Critical Elements Pathways-PDFs",
              action: () =>
                handleDownloadResource("Critical Elements Pathways-PDFs"),
              icon: Download,
            },
          ];
        case "Team Resources":
          return [
            {
              title: "Surveyor Contact Sheet",
              action: () => handleDownloadResource("Surveyor Contact Sheet"),
              icon: Download,
            },
            {
              title: "Team Assignment Worksheet",
              action: () => handleDownloadResource("Team Assignment Worksheet"),
              icon: Download,
            },
            {
              title: "Facility Matrix",
              action: () => handleDownloadResource("Facility Matrix"),
              icon: Download,
            },
          ];
        case "Checklists":
          return [
            {
              title: "Pre-Survey Checklist",
              action: () => handleDownloadResource("Pre-Survey Checklist"),
              icon: Download,
            },
            {
              title: "Entrance Conference Checklist",
              action: () =>
                handleDownloadResource("Entrance Conference Checklist"),
              icon: Download,
            },
            {
              title: "Exit Conference Checklist",
              action: () => handleDownloadResource("Exit Conference Checklist"),
              icon: Download,
            },
            {
              title: "Documentation Checklist",
              action: () => handleDownloadResource("Documentation Checklist"),
              icon: Download,
            },
          ];
        default:
          return [
            {
              title: "Facility Entrance Conference Worksheet",
              action: () =>
                handleDownloadResource(
                  "Facility Entrance Conference Worksheet"
                ),
              icon: Download,
            },
            {
              title: "CMS-672 Resident Census Form",
              action: () =>
                handleDownloadResource(
                  "CMS-672 Resident Census and Conditions of Residents Form"
                ),
              icon: Download,
            },
            {
              title: "CMS-802 Roster/Sample Matrix Form",
              action: () =>
                handleDownloadResource("CMS-802 Roster/Sample Matrix Form"),
              icon: Download,
            },
          ];
      }
    };

    const resources = getResourcesForCategory(selectedResourceCategory);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedResourceCategory || "Resource Launcher"}
            </h3>
            <Button
              onClick={() => handleShowResourceLauncher(false)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {resources.map((resource, index) => (
              <Button
                key={index}
                onClick={resource.action}
                variant="outline"
                className="w-full justify-start h-12"
              >
                <resource.icon className="w-5 h-5 mr-3" />
                {resource.title}
              </Button>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={() => handleShowResourceLauncher(false)}
              variant="outline"
              className="px-4"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Arbitration Modal for adding residents
  const renderArbitrationModal = () => {
    if (!showArbitrationModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Add Arbitration Resident
            </h3>
            <Button
              onClick={() => setShowArbitrationModal(false)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Resident Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={arbitrationResident.name}
                onChange={(e) =>
                  setArbitrationResident((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Enter resident name"
                className="h-10 text-sm rounded-lg"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Type <span className="text-red-500">*</span>
              </Label>
              <select
                value={arbitrationResident.type}
                onChange={(e) =>
                  setArbitrationResident((prev) => ({
                    ...prev,
                    type: e.target.value,
                  }))
                }
                className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d]"
              >
                <option value="signed">Signed Agreement</option>
                <option value="resolved">Resolved Dispute</option>
              </select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Room
              </Label>
              <Input
                value={arbitrationResident.room}
                onChange={(e) =>
                  setArbitrationResident((prev) => ({
                    ...prev,
                    room: e.target.value,
                  }))
                }
                placeholder="Enter room number"
                className="h-10 text-sm rounded-lg"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Notes
              </Label>
              <textarea
                value={arbitrationResident.notes}
                onChange={(e) =>
                  setArbitrationResident((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Add any additional notes..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              onClick={() => setShowArbitrationModal(false)}
              variant="outline"
              className="px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddArbitrationResidentSubmit}
              disabled={!arbitrationResident.name || !arbitrationResident.type}
              className="px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Add Resident
            </Button>
          </div>
        </div>
      </div>
    );
  };





  // Closed Records Modal for Step 5
  const renderInvestigationModal = () => {
    if (!showInvestigationModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Create New Investigation
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInvestigationModal(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label
                htmlFor="investigationTitle"
                className="text-sm font-medium text-gray-700"
              >
                Investigation Title *
              </Label>
              <Input
                id="investigationTitle"
                value={investigationForm.title}
                onChange={(e) =>
                  setInvestigationForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="Enter investigation title"
                className="mt-1"
              />
            </div>

            <div>
              <Label
                htmlFor="careArea"
                className="text-sm font-medium text-gray-700"
              >
                Care Area *
              </Label>
              <select
                id="careArea"
                value={investigationForm.careArea}
                onChange={(e) =>
                  setInvestigationForm((prev) => ({
                    ...prev,
                    careArea: e.target.value,
                  }))
                }
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d]"
              >
                <option value="">Select care area</option>
                <option value="dining">Dining</option>
                <option value="infectionControl">Infection Control</option>
                <option value="kitchen">Kitchen</option>
                <option value="medAdmin">Medication Administration</option>
                <option value="medStorage">Medication Storage</option>
                <option value="residentCouncil">Resident Council</option>
                <option value="nurseStaffing">Nurse Staffing</option>
                <option value="qapi">QAPI/QAA</option>
              </select>
            </div>

            <div>
              <Label
                htmlFor="description"
                className="text-sm font-medium text-gray-700"
              >
                Description
              </Label>
              <textarea
                id="description"
                value={investigationForm.description}
                onChange={(e) =>
                  setInvestigationForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe the investigation focus"
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="priority"
                  className="text-sm font-medium text-gray-700"
                >
                  Priority
                </Label>
                <select
                  id="priority"
                  value={investigationForm.priority}
                  onChange={(e) =>
                    setInvestigationForm((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <Label
                  htmlFor="assignedTo"
                  className="text-sm font-medium text-gray-700"
                >
                  Assigned To
                </Label>
                <select
                  id="assignedTo"
                  value={investigationForm.assignedTo}
                  onChange={(e) =>
                    setInvestigationForm((prev) => ({
                      ...prev,
                      assignedTo: e.target.value,
                    }))
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-[#075b7d] focus:border-[#075b7d]"
                >
                  <option value="">Select team member</option>
                  {surveyData.teamMembers &&
                    surveyData.teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({getRoleName(member.role)})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Investigation Preview */}
            {investigationForm.title && investigationForm.careArea && (
              <div className="mt-4 p-4 bg-[#075b7d]/10 rounded-lg border border-[#075b7d]/20">
                <h5 className="text-sm font-medium text-[#075b7d] mb-2">
                  Investigation Preview:
                </h5>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {investigationForm.careArea}
                    </Badge>
                    <Badge
                      variant={
                        investigationForm.priority === "critical"
                          ? "destructive"
                          : investigationForm.priority === "high"
                            ? "default"
                            : investigationForm.priority === "medium"
                              ? "secondary"
                              : "outline"
                      }
                      className="text-xs"
                    >
                      {investigationForm.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#075b7d] font-medium">
                    {investigationForm.title}
                  </p>
                  {investigationForm.description && (
                    <p className="text-sm text-[#075b7d]">
                      {investigationForm.description}
                    </p>
                  )}
                  {investigationForm.assignedTo && (
                    <p className="text-xs text-[#075b7d]">
                      📋 Assigned to:{" "}
                      {(() => {
                        if (surveyData.teamMembers) {
                          const member = surveyData.teamMembers.find(
                            (m) => m.id === investigationForm.assignedTo
                          );
                          return member
                            ? `${member.name} (${getRoleName(member.role)})`
                            : investigationForm.assignedTo;
                        }
                        return investigationForm.assignedTo;
                      })()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowInvestigationModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateInvestigation}
              disabled={!investigationForm.title || !investigationForm.careArea}
              className="bg-[#075b7d] hover:bg-[#075b7d] disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Create Investigation
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderComplaintModal = () => {
    if (!showComplaintModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Add Complaint
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComplaintModal(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label
                htmlFor="complaintDescription"
                className="text-sm font-medium text-gray-700"
              >
                Complaint Description *
              </Label>
              <textarea
                id="complaintDescription"
                value={complaintForm.description}
                onChange={(e) =>
                  setComplaintForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe the complaint in detail"
                rows={4}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="complaintCategory"
                  className="text-sm font-medium text-gray-700"
                >
                  Category *
                </Label>
                <select
                  id="complaintCategory"
                  value={complaintForm.category}
                  onChange={(e) =>
                    setComplaintForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d]"
                >
                  <option value="">Select category</option>
                  <option value="qualityOfCare">Quality of Care</option>
                  <option value="staffing">Staffing</option>
                  <option value="environment">Environment</option>
                  <option value="medication">Medication</option>
                  <option value="dining">Dining</option>
                  <option value="infectionControl">Infection Control</option>
                  <option value="residentRights">Resident Rights</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <Label
                  htmlFor="complaintSeverity"
                  className="text-sm font-medium text-gray-700"
                >
                  Severity
                </Label>
                <select
                  id="complaintSeverity"
                  value={complaintForm.severity}
                  onChange={(e) =>
                    setComplaintForm((prev) => ({
                      ...prev,
                      severity: e.target.value,
                    }))
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <Label
                htmlFor="linkedInvestigation"
                className="text-sm font-medium text-gray-700"
              >
                Link to Investigation (Optional)
              </Label>
              <div className="mt-1 space-y-2">
                {/* Investigation Selection Dropdown */}
                <div className="relative">
                  <select
                    id="linkedInvestigation"
                    value={complaintForm.linkedInvestigation}
                    onChange={(e) =>
                      setComplaintForm((prev) => ({
                        ...prev,
                        linkedInvestigation: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d]"
                  >
                    <option value="">
                      Select from existing investigations
                    </option>
                    {surveyData.investigations &&
                      surveyData.investigations
                        .filter(
                          (inv) =>
                            !complaintForm.investigationSearch ||
                            inv.title
                              .toLowerCase()
                              .includes(
                                complaintForm.investigationSearch.toLowerCase()
                              ) ||
                            inv.careArea
                              .toLowerCase()
                              .includes(
                                complaintForm.investigationSearch.toLowerCase()
                              )
                        )
                        .map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.title} - {inv.careArea}
                          </option>
                        ))}
                  </select>

                  {/* Search Filter */}
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Investigation Search Input */}
                <Input
                  type="text"
                  placeholder="Search investigations by title or care area..."
                  value={complaintForm.investigationSearch || ""}
                  onChange={(e) =>
                    setComplaintForm((prev) => ({
                      ...prev,
                      investigationSearch: e.target.value,
                    }))
                  }
                  className="w-full"
                />

                {/* Or Type Manually */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">OR</span>
                  </div>
                  <Input
                    type="text"
                    value={complaintForm.linkedInvestigation}
                    onChange={(e) =>
                      setComplaintForm((prev) => ({
                        ...prev,
                        linkedInvestigation: e.target.value,
                      }))
                    }
                    placeholder="Type investigation ID, title, or description"
                    className="pl-12"
                  />
                </div>

                {/* Current Investigation Quick Link */}
                {surveyData.currentInvestigation && (
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      onClick={() =>
                        setComplaintForm((prev) => ({
                          ...prev,
                          linkedInvestigation:
                            surveyData.currentInvestigation.id,
                        }))
                      }
                      variant="outline"
                      size="sm"
                      className="text-xs border-[#075b7d] text-[#075b7d] hover:bg-[#075b7d]/10"
                    >
                      <Link className="w-3 h-3 mr-1" />
                      Link to Current Investigation
                    </Button>
                    <span className="text-xs text-gray-500">
                      {surveyData.currentInvestigation.title}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Complaint Preview */}
          {complaintForm.description && complaintForm.category && (
            <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h5 className="text-sm font-medium text-amber-800 mb-2">
                Complaint Preview:
              </h5>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {complaintForm.category}
                  </Badge>
                  <Badge
                    variant={
                      complaintForm.severity === "critical"
                        ? "destructive"
                        : complaintForm.severity === "high"
                          ? "default"
                          : complaintForm.severity === "medium"
                            ? "secondary"
                            : "outline"
                    }
                    className="text-xs"
                  >
                    {complaintForm.severity}
                  </Badge>
                </div>
                <p className="text-sm text-amber-700">
                  {complaintForm.description}
                </p>
                {complaintForm.linkedInvestigation && (
                  <div className="mt-2 p-2 bg-[#075b7d]/10 rounded border border-[#075b7d]/20">
                    <p className="text-xs text-[#075b7d] font-medium mb-1">
                      🔗 Will be linked to investigation:
                    </p>
                    <p className="text-xs text-[#075b7d]">
                      {(() => {
                        if (surveyData.investigations) {
                          const investigation = surveyData.investigations.find(
                            (inv) =>
                              inv.id === complaintForm.linkedInvestigation
                          );
                          if (investigation) {
                            return `${investigation.title} - ${investigation.careArea}`;
                          }
                        }
                        return complaintForm.linkedInvestigation;
                      })()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowComplaintModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddComplaint}
              disabled={!complaintForm.description || !complaintForm.category}
              className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Add Complaint
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderFTagModal = () => {
    if (!showFTagModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {editingFTagId ? "Edit F-Tag Citation" : "FTag Direct Cite"}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFTagModal(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label
                htmlFor="ftag"
                className="text-sm font-medium text-gray-700"
              >
                F-Tag *
              </Label>
              <select
                id="ftag"
                value={ftagForm.fTag}
                onChange={(e) =>
                  setFtagForm((prev) => ({ ...prev, fTag: e.target.value }))
                }
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d]"
              >
                <option value="">Select F-Tag</option>
                <option value="F550">F550 - Resident Rights</option>
                <option value="F551">F551 - Notice of Rights</option>
                <option value="F552">F552 - Exercise of Rights</option>
                <option value="F553">
                  F553 - Protection of Resident Funds
                </option>
                <option value="F554">F554 - Free Choice</option>
                <option value="F555">F555 - Privacy and Confidentiality</option>
                <option value="F556">F556 - Accommodation of Needs</option>
                <option value="F557">F557 - Grievances</option>
                <option value="F558">
                  F558 - Examination of Survey Results
                </option>
                <option value="F559">F559 - Work</option>
                <option value="F560">F560 - Personal Property</option>
                <option value="F561">F561 - Married Couples</option>
                <option value="F562">
                  F562 - Self-Administration of Drugs
                </option>
                <option value="F563">F563 - Advance Directives</option>
                <option value="F564">F564 - Organ and Tissue Donation</option>
                <option value="F565">F565 - Representative</option>
                <option value="F566">F566 - Required Notifications</option>
                <option value="F567">F567 - Financial Statement</option>
                <option value="F568">F568 - Admission Policy</option>
                <option value="F569">F569 - Admission Orders</option>
                <option value="F570">F570 - Physician Supervision</option>
                <option value="F571">F571 - Physician Orders</option>
                <option value="F572">F572 - Physician Services</option>
                <option value="F573">F573 - Physician Delegation</option>
                <option value="F574">F574 - Physician Visit Frequency</option>
                <option value="F575">F575 - Physician On-Call</option>
                <option value="F576">F576 - Physician Availability</option>
                <option value="F577">F577 - Physician Notification</option>
                <option value="F578">F578 - Physician Orders</option>
                <option value="F579">F579 - Physician Orders</option>
                <option value="F580">F580 - Physician Orders</option>
                <option value="F581">F581 - Physician Orders</option>
                <option value="F582">F582 - Physician Orders</option>
                <option value="F583">F583 - Physician Orders</option>
                <option value="F584">F584 - Physician Orders</option>
                <option value="F585">F585 - Physician Orders</option>
                <option value="F586">F586 - Physician Orders</option>
                <option value="F587">F587 - Physician Orders</option>
                <option value="F588">F588 - Physician Orders</option>
                <option value="F589">F589 - Physician Orders</option>
                <option value="F590">F590 - Physician Orders</option>
                <option value="F591">F591 - Physician Orders</option>
                <option value="F592">F592 - Physician Orders</option>
                <option value="F593">F593 - Physician Orders</option>
                <option value="F594">F594 - Physician Orders</option>
                <option value="F595">F595 - Physician Orders</option>
                <option value="F596">F596 - Physician Orders</option>
                <option value="F597">F597 - Physician Orders</option>
                <option value="F598">F598 - Physician Orders</option>
                <option value="F599">F599 - Physician Orders</option>
                <option value="F600">F600 - Physician Orders</option>
                <option value="F601">F601 - Physician Orders</option>
                <option value="F602">F602 - Physician Orders</option>
                <option value="F603">F603 - Physician Orders</option>
                <option value="F604">F604 - Physician Orders</option>
                <option value="F605">F605 - Physician Orders</option>
                <option value="F606">F606 - Physician Orders</option>
                <option value="F607">F607 - Physician Orders</option>
                <option value="F608">F608 - Physician Orders</option>
                <option value="F609">F609 - Physician Orders</option>
                <option value="F610">F610 - Physician Orders</option>
                <option value="F611">F611 - Physician Orders</option>
                <option value="F612">F612 - Physician Orders</option>
                <option value="F613">F613 - Physician Orders</option>
                <option value="F614">F614 - Physician Orders</option>
                <option value="F615">F615 - Physician Orders</option>
                <option value="F616">F616 - Physician Orders</option>
                <option value="F617">F617 - Physician Orders</option>
                <option value="F618">F618 - Physician Orders</option>
                <option value="F619">F619 - Physician Orders</option>
                <option value="F620">F620 - Physician Orders</option>
                <option value="F621">F621 - Physician Orders</option>
                <option value="F622">F622 - Physician Orders</option>
                <option value="F623">F623 - Physician Orders</option>
                <option value="F624">F624 - Physician Orders</option>
                <option value="F625">F625 - Physician Orders</option>
                <option value="F626">F626 - Physician Orders</option>
                <option value="F627">F627 - Physician Orders</option>
                <option value="F628">F628 - Physician Orders</option>
                <option value="F629">F629 - Physician Orders</option>
                <option value="F630">F630 - Physician Orders</option>
                <option value="F631">F631 - Physician Orders</option>
                <option value="F632">F632 - Physician Orders</option>
                <option value="F633">F633 - Physician Orders</option>
                <option value="F634">F634 - Physician Orders</option>
                <option value="F635">F635 - Physician Orders</option>
                <option value="F636">F636 - Physician Orders</option>
                <option value="F637">F637 - Physician Orders</option>
                <option value="F638">F638 - Physician Orders</option>
                <option value="F639">F639 - Physician Orders</option>
                <option value="F640">F640 - Physician Orders</option>
                <option value="F641">F641 - Physician Orders</option>
                <option value="F642">F642 - Physician Orders</option>
                <option value="F643">F643 - Physician Orders</option>
                <option value="F644">F644 - Physician Orders</option>
                <option value="F645">F645 - Physician Orders</option>
                <option value="F646">F646 - Physician Orders</option>
                <option value="F647">F647 - Physician Orders</option>
                <option value="F648">F648 - Physician Orders</option>
                <option value="F649">F649 - Physician Orders</option>
                <option value="F650">F650 - Physician Orders</option>
                <option value="F651">F651 - Physician Orders</option>
                <option value="F652">F652 - Physician Orders</option>
                <option value="F653">F653 - Physician Orders</option>
                <option value="F654">F654 - Physician Orders</option>
                <option value="F655">F655 - Physician Orders</option>
                <option value="F656">F656 - Physician Orders</option>
                <option value="F657">F657 - Physician Orders</option>
                <option value="F658">F658 - Physician Orders</option>
                <option value="F659">F659 - Physician Orders</option>
                <option value="F660">F660 - Physician Orders</option>
                <option value="F661">F661 - Physician Orders</option>
                <option value="F662">F662 - Physician Orders</option>
                <option value="F663">F663 - Physician Orders</option>
                <option value="F664">F664 - Physician Orders</option>
                <option value="F665">F665 - Physician Orders</option>
                <option value="F666">F666 - Physician Orders</option>
                <option value="F667">F667 - Physician Orders</option>
                <option value="F668">F668 - Physician Orders</option>
                <option value="F669">F669 - Physician Orders</option>
                <option value="F670">F670 - Physician Orders</option>
                <option value="F671">F671 - Physician Orders</option>
                <option value="F672">F672 - Physician Orders</option>
                <option value="F673">F673 - Physician Orders</option>
                <option value="F674">F674 - Physician Orders</option>
                <option value="F675">F675 - Physician Orders</option>
                <option value="F676">F676 - Physician Orders</option>
                <option value="F677">F677 - Physician Orders</option>
                <option value="F678">F678 - Physician Orders</option>
                <option value="F679">F679 - Physician Orders</option>
                <option value="F680">F680 - Physician Orders</option>
                <option value="F681">F681 - Physician Orders</option>
                <option value="F682">F682 - Physician Orders</option>
                <option value="F683">F683 - Physician Orders</option>
                <option value="F684">F684 - Physician Orders</option>
                <option value="F685">F685 - Physician Orders</option>
                <option value="F686">F686 - Physician Orders</option>
                <option value="F687">F687 - Physician Orders</option>
                <option value="F688">F688 - Physician Orders</option>
                <option value="F689">F689 - Physician Orders</option>
                <option value="F690">F690 - Physician Orders</option>
                <option value="F691">F691 - Physician Orders</option>
                <option value="F692">F692 - Physician Orders</option>
                <option value="F693">F693 - Physician Orders</option>
                <option value="F694">F694 - Physician Orders</option>
                <option value="F695">F695 - Physician Orders</option>
                <option value="F696">F696 - Physician Orders</option>
                <option value="F697">F697 - Physician Orders</option>
                <option value="F698">F698 - Physician Orders</option>
                <option value="F699">F699 - Physician Orders</option>
                <option value="F700">F700 - Physician Orders</option>
                <option value="F701">F701 - Physician Orders</option>
                <option value="F702">F702 - Physician Orders</option>
                <option value="F703">F703 - Physician Orders</option>
                <option value="F704">F704 - Physician Orders</option>
                <option value="F705">F705 - Physician Orders</option>
                <option value="F706">F706 - Physician Orders</option>
                <option value="F707">F707 - Physician Orders</option>
                <option value="F708">F708 - Physician Orders</option>
                <option value="F709">F709 - Physician Orders</option>
                <option value="F710">F710 - Physician Orders</option>
                <option value="F711">F711 - Physician Orders</option>
                <option value="F712">F712 - Physician Orders</option>
                <option value="F713">F713 - Physician Orders</option>
                <option value="F714">F714 - Physician Orders</option>
                <option value="F715">F715 - Physician Orders</option>
                <option value="F716">F716 - Physician Orders</option>
                <option value="F717">F717 - Physician Orders</option>
                <option value="F718">F718 - Physician Orders</option>
                <option value="F719">F719 - Physician Orders</option>
                <option value="F720">F720 - Physician Orders</option>
                <option value="F721">F721 - Physician Orders</option>
                <option value="F722">F722 - Physician Orders</option>
                <option value="F723">F723 - Physician Orders</option>
                <option value="F724">F724 - Physician Orders</option>
                <option value="F725">F725 - Physician Orders</option>
                <option value="F726">F726 - Physician Orders</option>
                <option value="F727">F727 - Physician Orders</option>
                <option value="F728">F728 - Physician Orders</option>
                <option value="F729">F729 - Physician Orders</option>
                <option value="F730">F730 - Physician Orders</option>
                <option value="F731">F731 - Physician Orders</option>
                <option value="F732">F732 - Physician Orders</option>
                <option value="F733">F733 - Physician Orders</option>
                <option value="F734">F734 - Physician Orders</option>
                <option value="F735">F735 - Physician Orders</option>
                <option value="F736">F736 - Physician Orders</option>
                <option value="F737">F737 - Physician Orders</option>
                <option value="F738">F738 - Physician Orders</option>
                <option value="F739">F739 - Physician Orders</option>
                <option value="F740">F740 - Physician Orders</option>
                <option value="F741">F741 - Physician Orders</option>
                <option value="F742">F742 - Physician Orders</option>
                <option value="F743">F743 - Physician Orders</option>
                <option value="F744">F744 - Physician Orders</option>
                <option value="F745">F745 - Physician Orders</option>
                <option value="F746">F746 - Physician Orders</option>
                <option value="F747">F747 - Physician Orders</option>
                <option value="F748">F748 - Physician Orders</option>
                <option value="F749">F749 - Physician Orders</option>
                <option value="F750">F750 - Physician Orders</option>
                <option value="F751">F751 - Physician Orders</option>
                <option value="F752">F752 - Physician Orders</option>
                <option value="F753">F753 - Physician Orders</option>
                <option value="F754">F754 - Physician Orders</option>
                <option value="F755">F755 - Physician Orders</option>
                <option value="F756">F756 - Physician Orders</option>
                <option value="F757">F757 - Physician Orders</option>
                <option value="F758">F758 - Physician Orders</option>
                <option value="F759">F759 - Physician Orders</option>
                <option value="F760">F760 - Physician Orders</option>
                <option value="F761">F761 - Physician Orders</option>
                <option value="F762">F762 - Physician Orders</option>
                <option value="F763">F763 - Physician Orders</option>
                <option value="F764">F764 - Physician Orders</option>
                <option value="F765">F765 - Physician Orders</option>
                <option value="F766">F766 - Physician Orders</option>
                <option value="F767">F767 - Physician Orders</option>
                <option value="F768">F768 - Physician Orders</option>
                <option value="F769">F769 - Physician Orders</option>
                <option value="F770">F770 - Physician Orders</option>
                <option value="F771">F771 - Physician Orders</option>
                <option value="F772">F772 - Physician Orders</option>
                <option value="F773">F773 - Physician Orders</option>
                <option value="F774">F774 - Physician Orders</option>
                <option value="F775">F775 - Physician Orders</option>
                <option value="F776">F776 - Physician Orders</option>
                <option value="F777">F777 - Physician Orders</option>
                <option value="F778">F778 - Physician Orders</option>
                <option value="F779">F779 - Physician Orders</option>
                <option value="F780">F780 - Physician Orders</option>
                <option value="F781">F781 - Physician Orders</option>
                <option value="F782">F782 - Physician Orders</option>
                <option value="F783">F783 - Physician Orders</option>
                <option value="F784">F784 - Physician Orders</option>
                <option value="F785">F785 - Physician Orders</option>
                <option value="F786">F786 - Physician Orders</option>
                <option value="F787">F787 - Physician Orders</option>
                <option value="F788">F788 - Physician Orders</option>
                <option value="F789">F789 - Physician Orders</option>
                <option value="F790">F790 - Physician Orders</option>
                <option value="F791">F791 - Physician Orders</option>
                <option value="F792">F792 - Physician Orders</option>
                <option value="F793">F793 - Physician Orders</option>
                <option value="F794">F794 - Physician Orders</option>
                <option value="F795">F795 - Physician Orders</option>
                <option value="F796">F796 - Physician Orders</option>
                <option value="F797">F797 - Physician Orders</option>
                <option value="F798">F798 - Physician Orders</option>
                <option value="F799">F799 - Physician Orders</option>
                <option value="F800">F800 - Physician Orders</option>
                <option value="F801">F801 - Physician Orders</option>
                <option value="F802">F802 - Physician Orders</option>
                <option value="F803">F803 - Physician Orders</option>
                <option value="F804">F804 - Physician Orders</option>
                <option value="F805">F805 - Physician Orders</option>
                <option value="F806">F806 - Physician Orders</option>
                <option value="F807">F807 - Physician Orders</option>
                <option value="F808">F808 - Physician Orders</option>
                <option value="F809">F809 - Physician Orders</option>
                <option value="F810">F810 - Physician Orders</option>
                <option value="F811">F811 - Physician Orders</option>
                <option value="F812">F812 - Physician Orders</option>
                <option value="F813">F813 - Physician Orders</option>
                <option value="F814">F814 - Physician Orders</option>
                <option value="F815">F815 - Physician Orders</option>
                <option value="F816">F816 - Physician Orders</option>
                <option value="F817">F817 - Physician Orders</option>
                <option value="F818">F818 - Physician Orders</option>
                <option value="F819">F819 - Physician Orders</option>
                <option value="F820">F820 - Physician Orders</option>
                <option value="F821">F821 - Physician Orders</option>
                <option value="F822">F822 - Physician Orders</option>
                <option value="F823">F823 - Physician Orders</option>
                <option value="F824">F824 - Physician Orders</option>
                <option value="F825">F825 - Physician Orders</option>
                <option value="F826">F826 - Physician Orders</option>
                <option value="F827">F827 - Physician Orders</option>
                <option value="F828">F828 - Physician Orders</option>
                <option value="F829">F829 - Physician Orders</option>
                <option value="F830">F830 - Physician Orders</option>
                <option value="F831">F831 - Physician Orders</option>
                <option value="F832">F832 - Physician Orders</option>
                <option value="F833">F833 - Physician Orders</option>
                <option value="F834">F834 - Physician Orders</option>
                <option value="F835">F835 - Physician Orders</option>
                <option value="F836">F836 - Physician Orders</option>
                <option value="F837">F837 - Physician Orders</option>
                <option value="F838">F838 - Physician Orders</option>
                <option value="F839">F839 - Physician Orders</option>
                <option value="F840">F840 - Physician Orders</option>
                <option value="F841">F841 - Physician Orders</option>
                <option value="F842">F842 - Physician Orders</option>
                <option value="F843">F843 - Physician Orders</option>
                <option value="F844">F844 - Physician Orders</option>
                <option value="F845">F845 - Physician Orders</option>
                <option value="F846">F846 - Physician Orders</option>
                <option value="F847">F847 - Physician Orders</option>
                <option value="F848">F848 - Physician Orders</option>
                <option value="F849">F849 - Physician Orders</option>
                <option value="F850">F850 - Physician Orders</option>
                <option value="F851">F851 - Physician Orders</option>
                <option value="F852">F852 - Physician Orders</option>
                <option value="F853">F853 - Physician Orders</option>
                <option value="F854">F854 - Physician Orders</option>
                <option value="F855">F855 - Physician Orders</option>
                <option value="F856">F856 - Physician Orders</option>
                <option value="F857">F857 - Physician Orders</option>
                <option value="F858">F858 - Physician Orders</option>
                <option value="F859">F859 - Physician Orders</option>
                <option value="F860">F860 - Physician Orders</option>
                <option value="F861">F861 - Physician Orders</option>
                <option value="F862">F862 - Physician Orders</option>
                <option value="F863">F863 - Physician Orders</option>
                <option value="F864">F864 - Physician Orders</option>
                <option value="F865">F865 - Physician Orders</option>
                <option value="F866">F866 - Physician Orders</option>
                <option value="F867">F867 - Physician Orders</option>
                <option value="F868">F868 - Physician Orders</option>
                <option value="F869">F869 - Physician Orders</option>
                <option value="F870">F870 - Physician Orders</option>
                <option value="F871">F871 - Physician Orders</option>
                <option value="F872">F872 - Physician Orders</option>
                <option value="F873">F873 - Physician Orders</option>
                <option value="F874">F874 - Physician Orders</option>
                <option value="F875">F875 - Physician Orders</option>
                <option value="F876">F876 - Physician Orders</option>
                <option value="F877">F877 - Physician Orders</option>
                <option value="F878">F878 - Physician Orders</option>
                <option value="F879">F879 - Physician Orders</option>
                <option value="F880">F880 - Physician Orders</option>
                <option value="F881">F881 - Physician Orders</option>
                <option value="F882">F882 - Physician Orders</option>
                <option value="F883">F883 - Physician Orders</option>
                <option value="F884">F884 - Physician Orders</option>
                <option value="F885">F885 - Physician Orders</option>
                <option value="F886">F886 - Physician Orders</option>
                <option value="F887">F887 - Physician Orders</option>
                <option value="F888">F888 - Physician Orders</option>
                <option value="F889">F889 - Physician Orders</option>
                <option value="F890">F890 - Physician Orders</option>
                <option value="F891">F891 - Physician Orders</option>
                <option value="F892">F892 - Physician Orders</option>
                <option value="F893">F893 - Physician Orders</option>
                <option value="F894">F894 - Physician Orders</option>
                <option value="F895">F895 - Physician Orders</option>
                <option value="F896">F896 - Physician Orders</option>
                <option value="F897">F897 - Physician Orders</option>
                <option value="F898">F898 - Physician Orders</option>
                <option value="F899">F899 - Physician Orders</option>
                <option value="F900">F900 - Physician Orders</option>
                <option value="F901">F901 - Physician Orders</option>
                <option value="F902">F902 - Physician Orders</option>
                <option value="F903">F903 - Physician Orders</option>
                <option value="F904">F904 - Physician Orders</option>
                <option value="F905">F905 - Physician Orders</option>
                <option value="F906">F906 - Physician Orders</option>
                <option value="F907">F907 - Physician Orders</option>
                <option value="F908">F908 - Physician Orders</option>
                <option value="F909">F909 - Physician Orders</option>
                <option value="F910">F910 - Physician Orders</option>
                <option value="F911">F911 - Physician Orders</option>
                <option value="F912">F912 - Physician Orders</option>
                <option value="F913">F913 - Physician Orders</option>
                <option value="F914">F914 - Physician Orders</option>
                <option value="F915">F915 - Physician Orders</option>
                <option value="F916">F916 - Physician Orders</option>
                <option value="F917">F917 - Physician Orders</option>
                <option value="F918">F918 - Physician Orders</option>
                <option value="F919">F919 - Physician Orders</option>
                <option value="F920">F920 - Physician Orders</option>
                <option value="F921">F921 - Physician Orders</option>
                <option value="F922">F922 - Physician Orders</option>
                <option value="F923">F923 - Physician Orders</option>
                <option value="F924">F924 - Physician Orders</option>
                <option value="F925">F925 - Physician Orders</option>
                <option value="F926">F926 - Physician Orders</option>
                <option value="F927">F927 - Physician Orders</option>
                <option value="F928">F928 - Physician Orders</option>
                <option value="F929">F929 - Physician Orders</option>
                <option value="F930">F930 - Physician Orders</option>
                <option value="F931">F931 - Physician Orders</option>
                <option value="F932">F932 - Physician Orders</option>
                <option value="F933">F933 - Physician Orders</option>
                <option value="F934">F934 - Physician Orders</option>
                <option value="F935">F935 - Physician Orders</option>
                <option value="F936">F936 - Physician Orders</option>
                <option value="F937">F937 - Physician Orders</option>
                <option value="F938">F938 - Physician Orders</option>
                <option value="F939">F939 - Physician Orders</option>
                <option value="F940">F940 - Physician Orders</option>
                <option value="F941">F941 - Physician Orders</option>
                <option value="F942">F942 - Physician Orders</option>
                <option value="F943">F943 - Physician Orders</option>
                <option value="F944">F944 - Physician Orders</option>
                <option value="F945">F945 - Physician Orders</option>
                <option value="F946">F946 - Physician Orders</option>
                <option value="F947">F947 - Physician Orders</option>
                <option value="F948">F948 - Physician Orders</option>
                <option value="F949">F949 - Physician Orders</option>
                <option value="F950">F950 - Physician Orders</option>
                <option value="F951">F951 - Physician Orders</option>
                <option value="F952">F952 - Physician Orders</option>
                <option value="F953">F953 - Physician Orders</option>
                <option value="F954">F954 - Physician Orders</option>
                <option value="F955">F955 - Physician Orders</option>
                <option value="F956">F956 - Physician Orders</option>
                <option value="F957">F957 - Physician Orders</option>
                <option value="F958">F958 - Physician Orders</option>
                <option value="F959">F959 - Physician Orders</option>
                <option value="F960">F960 - Physician Orders</option>
                <option value="F961">F961 - Physician Orders</option>
                <option value="F962">F962 - Physician Orders</option>
                <option value="F963">F963 - Physician Orders</option>
                <option value="F964">F964 - Physician Orders</option>
                <option value="F965">F965 - Physician Orders</option>
                <option value="F966">F966 - Physician Orders</option>
                <option value="F967">F967 - Physician Orders</option>
                <option value="F968">F968 - Physician Orders</option>
                <option value="F969">F969 - Physician Orders</option>
                <option value="F970">F970 - Physician Orders</option>
                <option value="F971">F971 - Physician Orders</option>
                <option value="F972">F972 - Physician Orders</option>
                <option value="F973">F973 - Physician Orders</option>
                <option value="F974">F974 - Physician Orders</option>
                <option value="F975">F975 - Physician Orders</option>
                <option value="F976">F976 - Physician Orders</option>
                <option value="F977">F977 - Physician Orders</option>
                <option value="F978">F978 - Physician Orders</option>
                <option value="F979">F979 - Physician Orders</option>
                <option value="F980">F980 - Physician Orders</option>
                <option value="F981">F981 - Physician Orders</option>
                <option value="F982">F982 - Physician Orders</option>
                <option value="F983">F983 - Physician Orders</option>
                <option value="F984">F984 - Physician Orders</option>
                <option value="F985">F985 - Physician Orders</option>
                <option value="F986">F986 - Physician Orders</option>
                <option value="F987">F987 - Physician Orders</option>
                <option value="F988">F988 - Physician Orders</option>
                <option value="F989">F989 - Physician Orders</option>
                <option value="F990">F990 - Physician Orders</option>
                <option value="F991">F991 - Physician Orders</option>
                <option value="F992">F992 - Physician Orders</option>
                <option value="F993">F993 - Physician Orders</option>
                <option value="F994">F994 - Physician Orders</option>
                <option value="F995">F995 - Physician Orders</option>
                <option value="F996">F996 - Physician Orders</option>
                <option value="F997">F997 - Physician Orders</option>
                <option value="F998">F998 - Physician Orders</option>
                <option value="F999">F999 - Physician Orders</option>
                <option value="F1000">F1000 - Physician Orders</option>
              </select>
            </div>

            <div>
              <Label
                htmlFor="careArea"
                className="text-sm font-medium text-gray-700"
              >
                Care Area
              </Label>
              <select
                id="careArea"
                value={ftagForm.careArea}
                onChange={(e) =>
                  setFtagForm((prev) => ({ ...prev, careArea: e.target.value }))
                }
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d]"
              >
                <option value="">Select care area</option>
                <option value="dining">Dining</option>
                <option value="infectionControl">Infection Control</option>
                <option value="kitchen">Kitchen</option>
                <option value="medAdmin">Medication Administration</option>
                <option value="medStorage">Medication Storage</option>
                <option value="residentCouncil">Resident Council</option>
                <option value="nurseStaffing">Nurse Staffing</option>
                <option value="qapi">QAPI/QAA</option>
              </select>
            </div>

            <div>
              <Label
                htmlFor="ftagDescription"
                className="text-sm font-medium text-gray-700"
              >
                Description
              </Label>
              <textarea
                id="ftagDescription"
                value={ftagForm.description}
                onChange={(e) =>
                  setFtagForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe the deficiency"
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="severity"
                  className="text-sm font-medium text-gray-700"
                >
                  Severity
                </Label>
                <select
                  id="severity"
                  value={ftagForm.severity}
                  onChange={(e) =>
                    setFtagForm((prev) => ({
                      ...prev,
                      severity: e.target.value,
                    }))
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d]"
                >
                  <option value="">Select severity</option>
                  <option value="1">Level 1 - Minimal</option>
                  <option value="2">Level 2 - Moderate</option>
                  <option value="3">Level 3 - Serious</option>
                  <option value="4">Level 4 - Immediate Jeopardy</option>
                </select>
              </div>

              <div>
                <Label
                  htmlFor="evidence"
                  className="text-sm font-medium text-gray-700"
                >
                  Evidence
                </Label>
                <textarea
                  id="evidence"
                  value={ftagForm.evidence}
                  onChange={(e) =>
                    setFtagForm((prev) => ({
                      ...prev,
                      evidence: e.target.value,
                    }))
                  }
                  placeholder="Document evidence"
                  rows={2}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowFTagModal(false);
                setEditingFTagId(null);
                setFtagForm({
                  fTag: "",
                  careArea: "",
                  description: "",
                  severity: "",
                  evidence: "",
                });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFTagCreate}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {editingFTagId ? "Update F-Tag" : "Create F-Tag"}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderBodyMapModal = () => {
    if (!showBodyMapModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Body Map Drawing Tool
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBodyMapModal(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Body Map Canvas */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Body Map</h4>
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-2">👤</div>
                  <p className="text-sm text-gray-500">
                    Click to add wound markers
                  </p>
                  <p className="text-xs text-gray-400">
                    (Interactive body map would be here)
                  </p>
                </div>
              </div>
            </div>

            {/* Wound Management */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Add New Wound
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Location
                    </Label>
                    <Input
                      placeholder="e.g., Left hip, Right heel"
                      className="mt-1"
                      onChange={(e) =>
                        setBodyMapData((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Type
                    </Label>
                    <select
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d]"
                      onChange={(e) =>
                        setBodyMapData((prev) => ({
                          ...prev,
                          woundType: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select wound type</option>
                      <option value="pressureUlcer">Pressure Ulcer</option>
                      <option value="surgicalWound">Surgical Wound</option>
                      <option value="diabeticUlcer">Diabetic Ulcer</option>
                      <option value="traumaWound">Trauma Wound</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Stage/Severity
                    </Label>
                    <select
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d]"
                      onChange={(e) =>
                        setBodyMapData((prev) => ({
                          ...prev,
                          stage: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select stage</option>
                      <option value="stage1">Stage 1</option>
                      <option value="stage2">Stage 2</option>
                      <option value="stage3">Stage 3</option>
                      <option value="stage4">Stage 4</option>
                      <option value="unstageable">Unstageable</option>
                      <option value="deepTissue">Deep Tissue Injury</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Notes
                    </Label>
                    <textarea
                      placeholder="Additional wound details..."
                      rows={3}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none"
                      onChange={(e) =>
                        setBodyMapData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (bodyMapData.location && bodyMapData.woundType) {
                        handleBodyMapWoundAdd(bodyMapData);
                        setBodyMapData((prev) => ({
                          ...prev,
                          location: "",
                          woundType: "",
                          stage: "",
                          notes: "",
                        }));
                      } else {
                        toast.error("Please fill in location and wound type");
                      }
                    }}
                    className="w-full bg-[#075b7d] hover:bg-[#075b7d]"
                  >
                    Add Wound to Map
                  </Button>
                </div>
              </div>

              {/* Wound List */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Current Wounds
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {bodyMapData.wounds.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">
                      No wounds added yet
                    </p>
                  ) : (
                    bodyMapData.wounds.map((wound) => (
                      <div
                        key={wound.id}
                        className="bg-gray-50 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {wound.location}
                          </p>
                          <p className="text-xs text-gray-600">
                            {wound.woundType} - {wound.stage}
                          </p>
                          {wound.notes && (
                            <p className="text-xs text-gray-500 mt-1">
                              {wound.notes}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => handleBodyMapWoundRemove(wound.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAttachmentsModal = () => {
    if (!showAttachmentsModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              File Attachments
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAttachmentsModal(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop files here, or
              </p>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  Array.from(e.target.files).forEach((file) =>
                    handleAttachmentUpload(file)
                  );
                }}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" className="cursor-pointer">
                  Choose Files
                </Button>
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Supports: PDF, DOC, XLS, JPG, PNG (Max 10MB each)
              </p>
            </div>

            {/* Current Attachments */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                Current Attachments
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {attachments.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    No files attached yet
                  </p>
                ) : (
                  attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="bg-gray-50 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {attachment.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(attachment.size / 1024 / 1024).toFixed(2)} MB •{" "}
                            {attachment.type}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAttachmentRemove(attachment.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderClosedRecordsModal = () => {
    if (!showClosedRecordsModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Closed Records Management
            </h3>
            <Button
              onClick={() => setShowClosedRecordsModal(false)}
              variant="outline"
              size="sm"
              className="h-6 w-6 p-0"
            >
              ✕
            </Button>
          </div>

          {/* Closed Records Content */}
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-800 mb-3">
                <strong>Note:</strong> Closed records are residents who are no
                longer active (discharged, hospitalized, or deceased).
              </p>
            </div>

            {/* Add Closed Record Form */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Add New Closed Record
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Resident Name *
                  </Label>
                  <Input
                    placeholder="Enter resident name"
                    value={closedRecordForm.residentName}
                    onChange={(e) =>
                      handleFormChange("residentName", e.target.value)
                    }
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Record Type *
                  </Label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    value={closedRecordForm.recordType}
                    onChange={(e) =>
                      handleFormChange("recordType", e.target.value)
                    }
                  >
                    <option value="">Select Record Type</option>
                    <option value="Hospitalization">Hospitalization</option>
                    <option value="Discharge">Discharge</option>
                    <option value="Death">Death</option>
                  </select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Date *
                  </Label>
                  <Input
                    type="date"
                    value={closedRecordForm.date}
                    onChange={(e) => handleFormChange("date", e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Reason
                  </Label>
                  <Input
                    placeholder="e.g., Acute care, End of life, Family request"
                    value={closedRecordForm.reason}
                    onChange={(e) => handleFormChange("reason", e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="mt-4">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Notes
                </Label>
                <textarea
                  placeholder="Additional notes about the closed record..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none"
                  value={closedRecordForm.notes}
                  onChange={(e) => handleFormChange("notes", e.target.value)}
                />
              </div>

              <div className="flex space-x-3 mt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !closedRecordForm.residentName ||
                    !closedRecordForm.recordType ||
                    !closedRecordForm.date
                  }
                  className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300"
                >
                  Add Closed Record
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>

            {/* Closed Records List */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Existing Closed Records
              </h4>
              {surveyData.closedRecords &&
                surveyData.closedRecords.length > 0 ? (
                <div className="space-y-3">
                  {surveyData.closedRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {record.residentName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {record.recordType} • {record.date} •{" "}
                          {record.reason || "No reason specified"}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRemoveClosedRecord(record.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No closed records added yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // New Survey Confirmation Modal
  const renderNewSurveyConfirmModal = () => {
    if (!showNewSurveyConfirm) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Start New Survey?
            </h3>
            <button
              onClick={() => setShowNewSurveyConfirm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-gray-900 font-medium">
                  Warning: This will clear all progress
                </p>
                <p className="text-sm text-gray-600">
                  Starting a new survey will permanently delete your current
                  progress, including all entered data, team members, and
                  completed steps.
                </p>
              </div>
            </div>

            {currentStep > 1 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Current progress:</strong> Step {currentStep} of{" "}
                  {sectionData.length}(
                  {Math.round(
                    ((currentStep - 1) / (sectionData.length - 1)) * 100
                  )}
                  % complete)
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowNewSurveyConfirm(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmStartNewSurvey}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Start New Survey
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-cyan-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text">
                <h1 className="text-xl font-semibold text-white">
                  {isInvitedUser() ? "MockSurvey 365" : "MockSurvey 365"}
                </h1>
                {isInvitedUser() && (
                  <span className="text-xs text-white mt-0.5">
                    Team Member View
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <img src="logo.png" alt="logo" className="w-14 h-14" />
            </div>
          </div>
        </div>
      </header>

      {/* Floating Steps Sidebar - Hidden for now */}
      {false && showStepsSidebar && (
        <div className="hidden lg:block fixed left-6 top-28 z-40 w-72 bg-white border border-gray-200  max-h-[calc(100vh-20rem)] overflow-hidden rounded-lg">
          {/* Header */}
          <div className="px-6 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                Survey Steps
              </h2>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900 leading-none">
                    {currentStep}
                  </div>
                  <div className="text-xs text-gray-500 leading-none">
                    of {sectionData.length}
                  </div>
                </div>
                <button
                  onClick={() => setShowStepsSidebar(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  title="Close sidebar"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="px-6 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span className="font-medium">
                {(() => {
                  // Adjust progress calculation for invited users (who skip step 1)
                  const startStep = isInvitedUser() ? 2 : 1;
                  const totalSteps = sectionData.length;
                  const adjustedProgress =
                    ((currentStep - startStep) / (totalSteps - startStep)) *
                    100;
                  return Math.round(Math.max(0, adjustedProgress));
                })()}
                %
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="bg-gray-900 h-1.5 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(() => {
                    const startStep = isInvitedUser() ? 2 : 1;
                    const totalSteps = sectionData.length;
                    const adjustedProgress =
                      ((currentStep - startStep) / (totalSteps - startStep)) *
                      100;
                    return Math.max(0, adjustedProgress);
                  })()}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Steps */}
          <div className="overflow-y-auto max-h-[calc(100vh-28rem)]">
            <div className="px-2 py-2">
              {sectionData
                .filter((step) => {
                  // Invited users can now see all steps
                  if (isInvitedUser()) {
                    return true;
                  }

                  // Life Safety Survey only shows step 1 (Survey Setup)
                  if (surveyData?.surveyCategory === "Life Safety Survey") {
                    return step.id === 1;
                  }

                  // Survey owners see all steps
                  return true;
                })
                .map((step, index) => {
                  try {
                    const isCurrentStep = currentStep === step.id;
                    const isCompleted = canContinueFromStep(step.id);

                    return (
                      <div
                        key={step.id}
                        className={`group relative px-3 py-2 mb-1 rounded-lg transition-all duration-200 cursor-pointer ${isCurrentStep
                          ? "bg-[#ffb81f] text-[#5b5b5b]"
                          : isCompleted
                            ? "bg-gray-50 hover:bg-gray-100"
                            : "bg-white hover:bg-gray-50 border border-gray-200"
                          }`}
                        onClick={() => setCurrentStep(step.id)}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Step Number */}
                          <div className="flex-shrink-0 mt-0.5">
                            {isCompleted ? (
                              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-2.5 h-2.5 text-white" />
                              </div>
                            ) : (
                              <div
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-medium ${isCurrentStep
                                  ? "bg-white text-gray-900"
                                  : "bg-gray-200 text-gray-600"
                                  }`}
                              >
                                {step.id}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium leading-tight ${isCurrentStep
                                ? "text-[#5b5b5b]"
                                : isCompleted
                                  ? "text-gray-900"
                                  : "text-gray-900"
                                }`}
                            >
                              {step.title}
                            </p>
                            {/* <p className={`text-xs leading-tight mt-0.5 ${
                            isCurrentStep
                              ? 'text-[#5b5b5b]'
                              : isCompleted
                            ? 'text-gray-600'
                            : 'text-gray-500'
                          }`}>
                          {step.description}
                        </p> */}
                          </div>
                        </div>

                        {/* Current Step Badge */}
                        {isCurrentStep && (
                          <div className="absolute top-2 right-2">
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    );
                  } catch (error) {
                    // Return null to skip this step if there's an error
                    return null;
                  }
                })}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Steps Toggle Button */}
      {!showStepsSidebar && (
        <div className="hidden lg:block fixed left-6 top-32 z-50">
          <button
            onClick={() => setShowStepsSidebar(true)}
            className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            title="Open steps sidebar"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      )}
      {/* Floating Navigation Button */}
      <div className="fixed left-4 top-20 sm:left-6 sm:bottom-6 sm:top-auto z-50">
        <Popover open={isNavOpen} onOpenChange={setIsNavOpen}>
          <PopoverTrigger asChild>
            {
              localStorage.getItem("currentSurveyId") && (
                <Button
                  className="bg-[#ffb81f] hover:bg-[#ffb81f]/90 text-[#5b5b5b] shadow-lg rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0"
                  size="sm"
                  title={isNavOpen ? "Close navigation menu" : "Survey navigation menu"}
                >
                  {isNavOpen ? (
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </Button>
              )
            }
          </PopoverTrigger>
          <PopoverContent className="w-80 max-w-[calc(100vw-3rem)] p-0" align="start" side="right" sideOffset={10}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Survey Steps
                </h3>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900 leading-none">
                    {currentStep}
                  </div>
                  <div className="text-xs text-gray-500 leading-none">
                    of {sectionData.length}
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span className="font-medium">
                    {(() => {
                      const startStep = isInvitedUser() ? 2 : 1;
                      const totalSteps = sectionData.length;
                      const adjustedProgress =
                        ((currentStep - startStep) / (totalSteps - startStep)) *
                        100;
                      return Math.round(Math.max(0, adjustedProgress));
                    })()}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-[#075b7d] h-1.5 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${(() => {
                        const startStep = isInvitedUser() ? 2 : 1;
                        const totalSteps = sectionData.length;
                        const adjustedProgress =
                          ((currentStep - startStep) / (totalSteps - startStep)) *
                          100;
                        return Math.max(0, adjustedProgress);
                      })()}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Navigation Notice */}
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <div className="text-xs text-yellow-800">
                    <strong>Navigation Only:</strong> This is for navigation only. Use the save button on each page to save your work and progress.
                  </div>
                </div>
              </div>

              {/* Steps List */}
              <div className="max-h-60 overflow-y-auto">
                <div className="space-y-1">
                  {sectionData
                    .filter((step) => {
                      if (isInvitedUser()) {
                        return true;
                      }
                      if (surveyData?.surveyCategory === "Life Safety Survey") {
                        return step.id === 1;
                      }
                      return true;
                    })
                    .map((step, index) => {
                      try {
                        const isCurrentStep = currentStep === step.id;
                        const isCompleted = canContinueFromStep(step.id);

                        return (
                          <div
                            key={step.id}
                            className={`group relative px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer ${isCurrentStep
                              ? "bg-[#ffb81f] text-[#5b5b5b]"
                              : isCompleted
                                ? "bg-gray-50 hover:bg-gray-100"
                                : "bg-white hover:bg-gray-50 border border-gray-200"
                              }`}
                            onClick={() => setCurrentStep(step.id)}
                          >
                            <div className="flex items-start space-x-3">
                              {/* Step Number */}
                              <div className="flex-shrink-0 mt-0.5">
                                {isCompleted ? (
                                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-2.5 h-2.5 text-white" />
                                  </div>
                                ) : (
                                  <div
                                    className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-medium ${isCurrentStep
                                      ? "bg-[#5b5b5b] text-white"
                                      : "bg-gray-300 text-gray-600"
                                      }`}
                                  >
                                    {step.id}
                                  </div>
                                )}
                              </div>

                              {/* Step Content */}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {step.title}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                  {step.description}
                                </div>
                              </div>

                              {/* Current Step Indicator */}
                              {isCurrentStep && (
                                <div className="flex-shrink-0">
                                  <div className="w-2 h-2 bg-[#5b5b5b] rounded-full"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      } catch (error) {
                        return null;
                      }
                    })}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile Steps Panel - Hidden for now */}
      {false && showMobileSteps && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileSteps(false)}
          ></div>
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Survey Steps
              </h2>
              <button
                onClick={() => setShowMobileSteps(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Progress */}
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span className="font-medium">
                  {(() => {
                    // Adjust progress calculation for invited users (who skip step 1)
                    const startStep = isInvitedUser() ? 2 : 1;
                    const totalSteps = sectionData.length;
                    const adjustedProgress =
                      ((currentStep - startStep) / (totalSteps - startStep)) *
                      100;
                    return Math.round(Math.max(0, adjustedProgress));
                  })()}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-gray-900 h-1.5 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${(() => {
                      const startStep = isInvitedUser() ? 2 : 1;
                      const totalSteps = sectionData.length;
                      const adjustedProgress =
                        ((currentStep - startStep) / (totalSteps - startStep)) *
                        100;
                      return Math.max(0, adjustedProgress);
                    })()}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Steps */}
            <div className="overflow-y-auto max-h-[calc(100vh-12rem)]">
              <div className="px-2 py-2">
                {sectionData
                  .filter((step) => {
                    // Invited users only see steps 5, 6, and 7
                    if (isInvitedUser()) {
                      return [5, 6, 7].includes(step.id);
                    }
                    // Survey owners see all steps
                    return true;
                  })
                  .map((step, index) => {
                    try {
                      const isCurrentStep = currentStep === step.id;
                      const isCompleted = canContinueFromStep(step.id);

                      return (
                        <div
                          key={step.id}
                          className={`group relative px-3 py-3 mb-1 rounded-lg transition-all duration-200 cursor-pointer ${isCurrentStep
                            ? "bg-[#ffb81f] text-[#5b5b5b]"
                            : isCompleted
                              ? "bg-gray-50 hover:bg-gray-100"
                              : "bg-white hover:bg-gray-50 border border-gray-200"
                            }`}
                          onClick={() => {
                            setCurrentStep(step.id);
                            setShowMobileSteps(false);
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            {/* Step Number */}
                            <div className="flex-shrink-0 mt-0.5">
                              {isCompleted ? (
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 text-white" />
                                </div>
                              ) : (
                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${isCurrentStep
                                    ? "bg-white text-gray-900"
                                    : "bg-gray-200 text-gray-600"
                                    }`}
                                >
                                  {step.id}
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium leading-tight ${isCurrentStep
                                  ? "text-[#5b5b5b]"
                                  : isCompleted
                                    ? "text-gray-700"
                                    : "text-gray-900"
                                  }`}
                              >
                                {step.title}
                              </p>
                              <p
                                className={`text-xs leading-tight mt-1 ${isCurrentStep
                                  ? "text-[#5b5b5b]"
                                  : isCompleted
                                    ? "text-gray-600"
                                    : "text-gray-500"
                                  }`}
                              >
                                {step.description}
                              </p>
                            </div>
                          </div>

                          {/* Current Step Badge */}
                          {isCurrentStep && (
                            <div className="absolute top-2 right-2">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      );
                    } catch (error) {
                      // Return null to skip this step if there's an error
                      return null;
                    }
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className={` mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-all duration-300 ${showStepsSidebar ? "lg:ml-0" : "lg:ml-0"
          }`}
      >
        {/* Loading State */}
        {isLoadingSurvey && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-[#075b7d] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading survey data...</p>
            </div>
          </div>
        )}

        {/* Step 1: Survey Setup - Now available to all users including invited users */}
        {!isLoadingSurvey && currentStep === 1 && (
          <SurveySetup
            sectionData={sectionData}
            teamMembers={teamMembers}
            handleSurveyDataChange={handleSurveyDataChange}
            surveyData={surveyData}
            setCurrentStep={setCurrentStep}
            canContinueFromStep={canContinueFromStep}
            exportTeamMembers={exportTeamMembers}
            handleSetTeamCoordinator={handleSetTeamCoordinator}
            handleRemoveTeamMember={handleRemoveTeamMember}
            handleEditTeamMember={handleEditTeamMember}
            handlePrintResource={handlePrintResource}
            handleDownloadResource={handleDownloadResource}
            filteredTeamMembers={filteredTeamMembers}
            teamMemberSearch={teamMemberSearch}
            setTeamMemberSearch={setTeamMemberSearch}
            teamMemberFilter={teamMemberFilter}
            setTeamMemberFilter={setTeamMemberFilter}
            handleRequestRequirement={handleRequestRequirement}
            handleMarkReceived={handleMarkReceived}
            roleIdToName={roleIdToName}
            isInvitedUser={isInvitedUser}
            // Team member modal props
            showTeamModal={showTeamModal}
            setShowTeamModal={setShowTeamModal}
            newTeamMember={newTeamMember}
            handleTeamMemberInputChange={handleTeamMemberInputChange}
            editingMemberId={editingMemberId}
            availableRoles={availableRoles}
            roleMapping={roleMapping}
            facilityTaskOptions={facilityTaskOptions}
            loadingFacilityTaskOptions={loadingFacilityTaskOptions}
            handleAddTeamMember={handleAddTeamMember}
            resetTeamMemberForm={resetTeamMemberForm}
            // Remove member modal props
            showRemoveConfirmModal={showRemoveConfirmModal}
            memberToRemove={memberToRemove}
            cancelRemoveTeamMember={cancelRemoveTeamMember}
            confirmRemoveTeamMember={confirmRemoveTeamMember}
          />
        )}
        {!isLoadingSurvey && currentStep === 2 && (
          <OffsitePreparation
            sectionData={sectionData}
            surveyData={surveyData}
            setCurrentStep={setCurrentStep}
            canContinueFromStep={canContinueFromStep}
            handlePreparationTaskComplete={handlePreparationTaskComplete}
            handleOfflineToggle={handleOfflineToggle}
            handleOfflineStatusUpdate={handleOfflineStatusUpdate}
            setShowOfflineGuide={setShowOfflineGuide}
            setShowResourceLauncher={handleShowResourceLauncher}
            handleTaskAssignment={handleTaskAssignment}
            setShowTeamModal={setShowTeamModal}
            isInvitedUser={isInvitedUser}
            handleRequestRequirement={handleRequestRequirement}
            handleMarkReceived={handleMarkReceived}
          />
        )}
        {!isLoadingSurvey && currentStep === 3 && (
          <FacilityEntrance
            sectionData={sectionData}
            surveyData={surveyData}
            setCurrentStep={setCurrentStep}
            canContinueFromStep={canContinueFromStep}
            handleSurveyDataChange={handleSurveyDataChange}
            setShowClosedRecordsModal={setShowClosedRecordsModal}
            setShowAddResidentModal={setShowAddResidentModal}
            setShowUploadResidentModal={setShowUploadResidentModal}
            setShowObservationModal={setShowObservationModal}
            setShowInterviewModal={setShowInterviewModal}
            setShowRecordReviewModal={setShowRecordReviewModal}
            downloadSampleCSV={downloadSampleCSV}
            setSelectedResident={setSelectedResident}
            isInvitedUser={isInvitedUser}
          />
        )}
        {!isLoadingSurvey && currentStep === 4 && (
          <InitialPoolProcess
            sectionData={sectionData}
            surveyData={surveyData}
            setCurrentStep={setCurrentStep}
            canContinueFromStep={canContinueFromStep}
            handleSurveyDataChange={handleSurveyDataChange}
            setShowAddResidentModal={setShowAddResidentModal}
            setShowUploadResidentModal={setShowUploadResidentModal}
            setShowObservationModal={setShowObservationModal}
            setShowInterviewModal={setShowInterviewModal}
            setShowRecordReviewModal={setShowRecordReviewModal}
            downloadSampleCSV={downloadSampleCSV}
            setSelectedResident={setSelectedResident}
            teamMembers={teamMembers}
            setTeamMembers={setTeamMembers}
            isInvitedUser={isInvitedUser}
          />
        )}
        {!isLoadingSurvey && currentStep === 5 && (
          <SampleSelection
            setCurrentStep={setCurrentStep}
            isInvitedUser={isInvitedUser}
          />
        )}
        {!isLoadingSurvey && currentStep === 6 && (
          <Investigations
            setCurrentStep={setCurrentStep}
            isInvitedUser={isInvitedUser}
          />
        )}
        {!isLoadingSurvey && currentStep === 7 && (
          <FacilityTasks
            sectionData={sectionData}
            surveyData={surveyData}
            setCurrentStep={setCurrentStep}
            canContinueFromStep={canContinueFromStep}
            handleSurveyDataChange={handleSurveyDataChange}
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
            taskTimes={taskTimes}
            handleTimeChange={handleTimeChange}
            getTotalTime={getTotalTime}
            taskObservations={taskObservations}
            handleObservationChange={handleObservationChange}
            teamMembers={teamMembers}
            isInvitedUser={isInvitedUser}
          />
        )}
        {!isLoadingSurvey && currentStep === 8 && (
          <TeamMeetings
            sectionData={sectionData}
            surveyData={surveyData}
            setCurrentStep={setCurrentStep}
            canContinueFromStep={canContinueFromStep}
            handleSurveyDataChange={handleSurveyDataChange}
            teamMembers={teamMembers}
            fFlags={fFlags}
            isInvitedUser={isInvitedUser}
          />
        )}
        {!isLoadingSurvey && currentStep === 9 && (
          <Citation
            sectionData={sectionData}
            surveyData={surveyData}
            handleSurveyDataChange={handleSurveyDataChange}
            setCurrentStep={setCurrentStep}
            canContinueFromStep={canContinueFromStep}
            isInvitedUser={isInvitedUser}
          />
        )}
        {!isLoadingSurvey && currentStep === 10 && (
          <ExitConference
            sectionData={sectionData}
            surveyData={surveyData}
            setCurrentStep={setCurrentStep}
            canContinueFromStep={canContinueFromStep}
            handleSurveyDataChange={handleSurveyDataChange}
            setShowAddExitConferenceResidentModal={
              setShowAddExitConferenceResidentModal
            }
            isInvitedUser={isInvitedUser}
          />
        )}
        {!isLoadingSurvey && currentStep === 11 && (
          <PostSurveyActivities
            sectionData={sectionData}
            surveyData={surveyData}
            setCurrentStep={setCurrentStep}
            canContinueFromStep={canContinueFromStep}
            handleSurveyDataChange={handleSurveyDataChange}
            isInvitedUser={isInvitedUser}
          />
        )}
        {!isLoadingSurvey && currentStep === 12 && (
          <SurveyClosure
            sectionData={sectionData}
            surveyData={surveyData}
            setCurrentStep={setCurrentStep}
            canContinueFromStep={canContinueFromStep}
            handleSurveyDataChange={handleSurveyDataChange}
            isInvitedUser={isInvitedUser}
          />
        )}
        {!isLoadingSurvey && currentStep === 13 && (
          <ResourcesHelp
            sectionData={sectionData}
            surveyData={surveyData}
            setCurrentStep={setCurrentStep}
            canContinueFromStep={canContinueFromStep}
            handleSurveyDataChange={handleSurveyDataChange}
            isInvitedUser={isInvitedUser}
          />
        )}
      </div>

      {/* Add Finding Modal */}
      {renderAddFindingModal()}
      {renderGenerateFormsModal()}
      {renderAddResidentModal()}
      {renderUploadResidentModal()}
      {renderAddResidentNameModal()}

      {/* Team Modals - Only render in SurveyBuilder when not on step 1 (SurveySetup handles its own modals) */}
      {currentStep !== 1 && renderTeamModal()}
      {currentStep !== 1 && renderRemoveConfirmModal()}
      {renderOfflineGuideModal()}
      {renderResourceLauncherModal()}
      {renderArbitrationModal()}

      {renderClosedRecordsModal()}
      {renderInvestigationModal()}
      {renderComplaintModal()}
      {renderFTagModal()}
      {renderBodyMapModal()}
      {renderAttachmentsModal()}

      {/* E-Send and Print Modals */}
      {renderESendModal()}
      {renderPrintModal()}

      {/* Resources and Help Modals */}
      {renderProcedureGuideModal()}
      {renderAppendixQModal()}
      {renderPsychosocialGuideModal()}
      {renderTagReviewToolModal()}
      {renderExtendedSurveyListModal()}
      {renderSupportModal()}
      {renderScreenshotGuideModal()}
      {renderClosedRecordsModal()}
      {renderNewSurveyConfirmModal()}
    </div>
  );
};

export default SurveyBuilder;
