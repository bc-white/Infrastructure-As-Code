import React, { useState, useEffect, useRef, useCallback } from "react";
import { useBeforeUnload } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";

import { ChevronLeft, ChevronRight, Loader2, FileText, Lock, CheckCircle2, ChevronDown, ChevronUp, X, ChevronRight as ChevronRightIcon } from "lucide-react";
import { toast } from "sonner";
import api from "../../service/api";
import surveyIndexedDB from "../../utils/surveyIndexedDB";
import surveySyncService from "../../utils/surveySyncService";
import { saveSurveyStepData } from "../../utils/surveyStorageIndexedDB";
import { transformMandatoryTasks } from "../../utils/facilityTaskHelpers";
import FacilityTaskProbeList from "../../components/FacilityTaskProbeList";
import UnsavedChangesOptionsModal from "../../components/investigations/UnsavedChangesOptionsModal";
import UnsavedChangesModal from "../../components/UnsavedChangesModal";
import FloatingHomeButton from "../../components/FloatingHomeButton";
import { useBrowserNavigationBlocker } from "../../hooks/useBrowserNavigationBlocker";
import useSurveyAccess from "../../hooks/useSurveyAccess";

const FacilityTasks = ({
  sectionData,
  surveyData,
  setCurrentStep,
  handleSurveyDataChange,
  selectedTask,
  setSelectedTask,
  isInvitedUser: isInvitedUserProp = () => false,
}) => { 
  // Get current survey ID for access check
  const currentSurveyId = surveyData?.surveyId || surveyData?.id || surveyData?._id || localStorage.getItem("currentSurveyId");
  
  // Use the survey access hook to determine user access type
  const { isInvitedUser: isInvitedUserFromHook, isLoading: isAccessLoading } = useSurveyAccess(currentSurveyId);
  
  // Use hook-based isInvitedUser, fall back to prop if hook is still loading
  const isInvitedUser = isAccessLoading ? isInvitedUserProp : isInvitedUserFromHook;

  // Get current user to check if they're an invited user
  const [currentUser, setCurrentUser] = useState(() => {
    const userStr = localStorage.getItem("mocksurvey_user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        return null;
      }
    } 
    return null;
  });
  const [isPageClosed, setIsPageClosed] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [localSurveyData, setLocalSurveyData] = useState(surveyData); 
  const [mandatoryTasksFromAPI, setMandatoryTasksFromAPI] = useState({});
  const [loadingMandatoryTasks, setLoadingMandatoryTasks] = useState(true);
  const [isContinueClicked, setIsContinueClicked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastSubmissionTimestampRef = useRef(null);
  const [isSubmittingRef] = useState({ current: false }); // Fix: isSubmittingRef was defined as useRef but used as state in some places, standardizing
  const [facilityTaskIds, setFacilityTaskIds] = useState({}); // Store facilityTaskId for updates
  const [facilityTasksFromAPI, setFacilityTasksFromAPI] = useState([]); // Store raw facility tasks array from API
  const [teamMemberAssignedTaskIds, setTeamMemberAssignedTaskIds] = useState([]); // Store assigned task IDs from API for team members
  const [teamMemberAssignedTasks, setTeamMemberAssignedTasks] = useState({}); // Store transformed task definitions from assignedFacility for team members
  const [taskToTeamMemberMap, setTaskToTeamMemberMap] = useState({}); // Map taskKey -> teamMemberUserId for team lead saves

  // Local state for team members fetched from API
  const [localTeamMembers, setLocalTeamMembers] = useState([]);

  // Track unsaved changes: { taskKey: { probeKey: true } }
  const [unsavedChanges, setUnsavedChanges] = useState({});
  const unsavedChangesRef = useRef({});
  
  // State for unsaved changes modal
  const [unsavedChangesModalOpen, setUnsavedChangesModalOpen] = useState(false);
  const [pendingUnsavedChangesCount, setPendingUnsavedChangesCount] = useState(0);
  const [isSyncingData, setIsSyncingData] = useState(false); // Sync button loading state

  // Navigation blocking state
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Check if there are unsaved changes
  const hasUnsavedChanges = Object.keys(unsavedChanges).length > 0;
  const hasUnsavedChangesRef = useRef(false);

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

  // Sync ref with state
  useEffect(() => {
    unsavedChangesRef.current = unsavedChanges;
  }, [unsavedChanges]);

  // Sync hasUnsavedChangesRef with state
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Fetch team members from API
  useEffect(() => {
    const fetchTeamMembers = async () => {
      const surveyId = surveyData?.surveyId || surveyData?.id || surveyData?._id || localStorage.getItem("currentSurveyId");
      if (!surveyId) return;
      
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
            };
          });
          
          setLocalTeamMembers(mappedTeamMembers);
        }
      } catch (error) {
        // Silently fail - team members will fall back to surveyData.teamMembers
      }
    };

    fetchTeamMembers();
  }, [surveyData?.surveyId, surveyData?.id, surveyData?._id]);

  // Helper function to mark a task/probe as having unsaved changes
  const markAsUnsaved = (taskKey, subKey = null) => {
    setUnsavedChanges((prev) => {
      const updated = { ...prev };
      if (!updated[taskKey]) {
        updated[taskKey] = {};
      }
      if (subKey !== null) {
        updated[taskKey][subKey] = true;
      } else {
        // Mark entire task as having unsaved changes
        updated[taskKey] = { all: true };
      }
      return updated;
    });
  };

  // Helper function to clear unsaved changes for a task (after successful save)
  const clearUnsavedChanges = (taskKey) => {
    setUnsavedChanges((prev) => {
      const updated = { ...prev };
      if (taskKey === 'all') {
        // Also clear dirty notes tracking
        dirtyProbeNotesRef.current = {};
        dirtyObservationNotesRef.current = {};
        return {};
      }
      // Clear dirty notes for this task
      Object.keys(dirtyProbeNotesRef.current).forEach((key) => {
        if (key.startsWith(`${taskKey}_`)) {
          delete dirtyProbeNotesRef.current[key];
        }
      });
      Object.keys(dirtyObservationNotesRef.current).forEach((key) => {
        if (key.startsWith(`${taskKey}_`)) {
          delete dirtyObservationNotesRef.current[key];
        }
      });
      delete updated[taskKey];
      return updated;
    });
  };

  // Helper function to merge server facility tasks data with local data
  // SERVER-FIRST APPROACH: Server is always the source of truth
  // Local changes are only preserved as a temporary buffer for actively edited (dirty) fields
  const mergeFacilityTasksData = (serverData, localData, unsavedChangesMap) => {
    // If no server data, use local data (edge case: offline mode)
    if (!serverData || Object.keys(serverData).length === 0) {
     
      return localData || {};
    }

    // If no local data or no unsaved changes, use server data directly
    if (!localData || Object.keys(unsavedChangesMap).length === 0) {
     
      return serverData;
    }

  
    
    // SERVER-FIRST: Start with server data as the base
    const merged = { ...serverData };

    // Merge task-specific data, preserving only dirty local changes
    const mergeTaskData = (serverTasks, localTasks, dataType) => {
      if (!serverTasks && !localTasks) return {};
      if (!localTasks) return serverTasks || {};
      if (!serverTasks) return {};

      const mergedTasks = { ...serverTasks };

      // Only preserve local data for tasks that have unsaved changes
      Object.keys(unsavedChangesMap).forEach((taskKey) => {
        const taskChanges = unsavedChangesMap[taskKey];
        if (taskChanges && localTasks[taskKey]) {
          // Merge this task's data
          if (dataType === 'taskProbeResponses') {
            // For probe responses, merge at the probe level
            mergedTasks[taskKey] = { ...(serverTasks[taskKey] || {}) };
            Object.keys(taskChanges).forEach((probeKey) => {
              if (localTasks[taskKey]?.[probeKey]) {
                // Preserve local probe data for dirty probes
                mergedTasks[taskKey][probeKey] = {
                  ...(serverTasks[taskKey]?.[probeKey] || {}),
                  ...localTasks[taskKey][probeKey],
                };
              }
            });
            // If "all" is marked, preserve all local data for this task
            if (taskChanges.all) {
              mergedTasks[taskKey] = {
                ...(serverTasks[taskKey] || {}),
                ...localTasks[taskKey],
              };
            }
          } else {
            // For other data types (checks, notes, etc.), preserve if task is dirty
            if (taskChanges.all || Object.keys(taskChanges).length > 0) {
              mergedTasks[taskKey] = {
                ...(serverTasks[taskKey] || {}),
                ...(localTasks[taskKey] || {}),
              };
            }
          }
        }
      });

      return mergedTasks;
    };

    // Merge each data type
    merged.taskProbeResponses = mergeTaskData(
      serverData.taskProbeResponses,
      localData.taskProbeResponses,
      'taskProbeResponses'
    );
    merged.taskObservationChecks = mergeTaskData(
      serverData.taskObservationChecks,
      localData.taskObservationChecks,
      'taskObservationChecks'
    );
    merged.taskObservationNotes = mergeTaskData(
      serverData.taskObservationNotes,
      localData.taskObservationNotes,
      'taskObservationNotes'
    );
    merged.vaccinationSamples = mergeTaskData(
      serverData.vaccinationSamples,
      localData.vaccinationSamples,
      'vaccinationSamples'
    );
    merged.medErrors = mergeTaskData(
      serverData.medErrors,
      localData.medErrors,
      'medErrors'
    );
    merged.medOpportunities = mergeTaskData(
      serverData.medOpportunities,
      localData.medOpportunities,
      'medOpportunities'
    );

    return merged;
  };

  // Handler for "Keep my changes" option in unsaved changes modal
  const handleKeepUnsavedChanges = () => {
    toast.success("Your changes have been preserved", { duration: 2000 });
  };

  // Handler for "Fetch server data" option - discards local changes and fetches fresh data
  const handleFetchServerData = async () => {
    try {
      // Clear all unsaved changes
      setUnsavedChanges({});
      unsavedChangesRef.current = {};
      
      // Fetch fresh data from server (pass true to indicate forced refresh)
      await fetchFacilityTasksData(false, true);
      
      toast.success("Fresh data loaded from server", { duration: 2000 });
    } catch (error) {
     
      toast.error("Failed to fetch server data. Please try again.");
    }
  };

  // Keep track of latest surveyData to avoid stale closures
  const surveyDataRef = useRef(surveyData);
  useEffect(() => {
    surveyDataRef.current = surveyData;
  }, [surveyData]);

  // Keep track of handleSurveyDataChange to avoid dependency cycles
  const handleSurveyDataChangeRef = useRef(handleSurveyDataChange);
  useEffect(() => {
    handleSurveyDataChangeRef.current = handleSurveyDataChange;
  }, [handleSurveyDataChange]);

  // Check if survey is closed
  const isSurveyClosed = surveyData?.surveyClosed || 
                         surveyData?.surveyClosureSurvey?.surveyClosed || 
                         surveyData?.surveyClosureSurvey?.surveyCompleted ||
                         surveyData?.surveyCompleted || surveyData?.facilityTasks?.isPageClosed || false;

  // Transform API response to match expected structure

  // Fetch mandatory tasks from API
  useEffect(() => {
    const fetchMandatoryTasks = async () => {
      try {
        setLoadingMandatoryTasks(true);
        const response = await api.resource.getAllMandatoryTasks();


     
        
        if (response.status && response.data?.mt) {
          const transformed = {};
          response.data.mt.forEach((task) => {
            // Use _id as key instead of generating a slug from title
            const key = task._id;

            const probeList = {};
            const observationsList = {};

            task.categories?.forEach((category) => {
              const categoryKey = (category.name || "")
                .toLowerCase()
                .replace(/\s+/g, "")
                .replace(/[^a-z0-9]/g, "")
                .substring(0, 20);

              const questions = [];
              category.questions?.forEach((question) => {
                questions.push({
                  probe: question.text || question.question,
                  fTag:
                    question.f_tag ||
                    question.tag ||
                    category.ftags?.[0] ||
                    category.f_tags?.[0] ||
                    "",
                  citeOnYes: false,
                });
              });

              const observations = [];
              category.observations?.forEach((observation) => {
                observations.push({
                  observation: observation,
                  fTag: category.ftags?.[0] || category.f_tags?.[0] || "",
                });
              });

              if (questions.length > 0) {
                probeList[categoryKey] = {
                  name: category.name,
                  items: questions,
                };
              }

              if (observations.length > 0) {
                observationsList[categoryKey] = {
                  name: category.name,
                  items: observations,
                };
              }
            });

            const keyCheckpoints = task.categories?.map((cat) => cat.name) || [];

            transformed[key] = {
              name: (task.title || "").replace(/\s*\([^)]+\)/g, "").trim(),
              description: task.desc || task.source_citation || "",
              keyCheckpoints,
              isMandatory: true,
              showPathwayProbes: true,
              probeList,
              observationsList,
              source_citation: task.source_citation,
              version_date: task.version_date,
              _id: task._id,
            };
          });
          setMandatoryTasksFromAPI(transformed);
        } else {
          toast.error('Failed to load mandatory tasks');
        }
      } catch (error) {
        toast.error('Error loading mandatory tasks');
      } finally {
        setLoadingMandatoryTasks(false);
      }
    };

    fetchMandatoryTasks();
  }, []);

  // Sync local state with prop changes
  useEffect(() => {
    if (surveyData !== localSurveyData) {
      setLocalSurveyData(surveyData);
      setDataVersion((prev) => prev + 1);
    }
  }, [surveyData, localSurveyData]);

  // Force re-render on any surveyData change
  useEffect(() => {
    setDataVersion((prev) => prev + 1);
  }, [surveyData]);

  // Initialize local notes from surveyData only when task actually changes
  useEffect(() => {
    if (selectedTask && visibleTasks[selectedTask] && selectedTask !== lastSelectedTaskRef.current) {
      const taskKey = selectedTask;
      lastSelectedTaskRef.current = taskKey;
      
      // Initialize probe notes
      const taskProbeResponses =
        surveyData?.facilityTasks?.taskProbeResponses?.[taskKey] ||
        surveyData?.taskProbeResponses?.[taskKey] ||
        {};
      
      const newProbeNotes = {};
      Object.keys(taskProbeResponses).forEach((probeKey) => {
        const fullKey = `${taskKey}_${probeKey}`;
        newProbeNotes[fullKey] = taskProbeResponses[probeKey]?.note || "";
      });
      
      // Initialize observation notes
      const taskObservationNotes =
        surveyData?.facilityTasks?.taskObservationNotes?.[taskKey] ||
        surveyData?.taskObservationNotes?.[taskKey] ||
        {};
      
      const newObservationNotes = {};
      Object.keys(taskObservationNotes).forEach((categoryKey) => {
        const fullKey = `${taskKey}_${categoryKey}`;
        newObservationNotes[fullKey] = taskObservationNotes[categoryKey] || "";
      });
      
      // Clear old task's notes and set new task's notes
      setLocalProbeNotes(prev => {
        // Remove all notes not for current task
        const filtered = Object.keys(prev)
          .filter(key => key.startsWith(`${taskKey}_`))
          .reduce((obj, key) => {
            obj[key] = prev[key];
            return obj;
          }, {});
        return { ...filtered, ...newProbeNotes };
      });
      
      setLocalObservationNotes(prev => {
        // Remove all notes not for current task
        const filtered = Object.keys(prev)
          .filter(key => key.startsWith(`${taskKey}_`))
          .reduce((obj, key) => {
            obj[key] = prev[key];
            return obj;
          }, {});
        return { ...filtered, ...newObservationNotes };
      });
    } 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTask]); // Only run when selectedTask changes

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(probeNotesDebounceRef.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
      Object.values(observationNotesDebounceRef.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  // Transform server data from array format to object format for component compatibility
  useEffect(() => {
    // Check if data is in new array format (from server)
    const facilityTasksArray = surveyData?.facilityTasks?.facilityTasks;
    
    if (facilityTasksArray && Array.isArray(facilityTasksArray) && facilityTasksArray.length > 0) {
      // Check if we already have transformed data (object format)
      // This prevents infinite loops and unnecessary transformations
      const hasTransformedData = 
        surveyData?.facilityTasks?.taskObservationChecks &&
        Object.keys(surveyData.facilityTasks.taskObservationChecks).length > 0;
      
      // Only transform if we don't already have the object format
      if (!hasTransformedData) {
        // Transform array format to object format
        const taskObservationChecks = {};
        const taskObservationNotes = {};
        const taskProbeResponses = {};
        const vaccinationSamples = {};
        const medErrors = {};
        const medOpportunities = {};

        facilityTasksArray.forEach((taskData) => {
          const taskKey = taskData.task;
          if (taskKey) {
            taskObservationChecks[taskKey] = taskData.taskObservationChecks || {};
            taskObservationNotes[taskKey] = taskData.taskObservationNotes || {};
            taskProbeResponses[taskKey] = taskData.taskProbeResponses || {};
            vaccinationSamples[taskKey] = taskData.vaccinationSamples || {};
            medErrors[taskKey] = taskData.medErrors || {};
            medOpportunities[taskKey] = taskData.medOpportunities || {};
          }
        });

        // Update survey data with transformed format
        handleSurveyDataChange("facilityTasks", {
          ...surveyData?.facilityTasks,
          taskObservationChecks,
          taskObservationNotes,
          taskProbeResponses,
          vaccinationSamples,
          medErrors,
          medOpportunities,
          isPageClosed: surveyData?.facilityTasks?.isPageClosed || false,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyData?.facilityTasks?.facilityTasks]);

  // Add useEffect to sync with surveyData changes
  useEffect(() => {
    const pageClosedValue = surveyData?.facilityTasks?.isPageClosed || surveyData?.isPageClosed;
    if (pageClosedValue !== undefined) {
      setIsPageClosed(pageClosedValue);
    }
  }, [surveyData?.facilityTasks?.isPageClosed, surveyData?.isPageClosed]);

  // Fetch facility tasks data from API
  const fetchFacilityTasksData = useCallback(async (isBackgroundSync = false, forceRefresh = false) => {
    const surveyId =
      surveyData?.surveyId ||
      surveyData?.id ||
      surveyData?._id ||
      localStorage.getItem("currentSurveyId");

    // Wait for mandatory tasks to be loaded before fetching facility tasks
    // This ensures proper key mapping when parsing the response
    if (!surveyId || !mandatoryTasksFromAPI || Object.keys(mandatoryTasksFromAPI).length === 0) {
      return;
    }

    // Get current unsaved changes state
    const currentUnsavedChanges = forceRefresh ? {} : unsavedChangesRef.current;

    try {
      
      // Determine which API to call based on user type
      // Use isInvitedUser() prop for consistency with rest of component
      const isInvited = isInvitedUser();
      let response;
      let answeredTasksResponse = null;
      
   
      
      if (isInvited) {
        // TEAM MEMBER FLOW:
        // 1. First call viewTeamMemberMandatoryFaciltyTask to get ASSIGNED tasks (task definitions)
        // 2. Then call viewFacilityMandatoryTask to get ANSWERED tasks (saved responses)
        
        // Step 1: Get assigned tasks
        response = await api.resource.viewTeamMemberMandatoryFaciltyTask(surveyId);
       
        
        // Step 2: Get answered tasks (this endpoint is role-aware and returns answered tasks for the current user)
        try {
          answeredTasksResponse = await api.resource.viewFacilityMandatoryTask(surveyId);
          
        } catch (answeredError) {
          // Log but don't fail the entire fetch - team member may not have any answered tasks yet
        }
      } else {
        response = await api.resource.viewFacilityMandatoryTask(surveyId);
      }
      
     
      
      // Check for success using either 'success' or 'status' property
      // Some endpoints return { success: true, ... } while others return { status: true, ... }
      if ((response.success || response.status) && response.data) {
        // Determine the structure of the response data
        let facilityTasksArray = null;
        let facilityTasksData = null;
        
        // TEAM MEMBER RESPONSE: Handle assignedFacility structure
        // Team members get their assigned tasks with task definitions, not saved responses
        if (response.data.accessType === 'TEAM_MEMBER' && response.data.assignedFacility && Array.isArray(response.data.assignedFacility)) {
         
          
          const assignedFacilityData = response.data.assignedFacility;
          
          // GET ANSWERED TASKS FROM viewFacilityMandatoryTask (separate API call)
          // The answeredTasksResponse contains the saved/answered facility tasks
          if (answeredTasksResponse && (answeredTasksResponse.success || answeredTasksResponse.status) && answeredTasksResponse.data) {
           
            
            // Check the structure of answered tasks response
            if (answeredTasksResponse.data.facilityTask && Array.isArray(answeredTasksResponse.data.facilityTask)) {
              facilityTasksArray = answeredTasksResponse.data.facilityTask;
              facilityTasksData = answeredTasksResponse.data;
            
            } else if (answeredTasksResponse.data.facilityTasks && Array.isArray(answeredTasksResponse.data.facilityTasks)) {
              facilityTasksArray = answeredTasksResponse.data.facilityTasks;
              facilityTasksData = answeredTasksResponse.data;
              
            } else if (Array.isArray(answeredTasksResponse.data)) {
              facilityTasksArray = answeredTasksResponse.data;
              facilityTasksData = { facilityTasks: answeredTasksResponse.data };
          
            } else {
              // No saved responses yet
           
              facilityTasksArray = [];
              facilityTasksData = response.data;
            }
          } else {
            // No answered tasks response - team member hasn't submitted anything yet
           
            facilityTasksArray = [];
            facilityTasksData = response.data;
          }
          
          // Update surveyData with assigned tasks info if needed
          // This helps with task visibility filtering
          if (assignedFacilityData.length > 0) {
            // Extract unique mandatorytaskIds for this team member
            const assignedTaskIds = assignedFacilityData.map(item => {
              const taskId = typeof item.mandatorytaskId === 'object' 
                ? item.mandatorytaskId._id 
                : item.mandatorytaskId;
              return taskId;
            }).filter(Boolean);
            
           
            
            // Store the assigned task IDs in state for filtering in getAssignedTasks()
            setTeamMemberAssignedTaskIds(assignedTaskIds);
            
            // Transform assignedFacility into task definitions format (same as mandatoryTasksFromAPI)
            // This allows team members to see their assigned tasks directly without matching against mandatoryTasksFromAPI
            const transformedTasks = {};
            assignedFacilityData.forEach((assignment) => {
              const task = typeof assignment.mandatorytaskId === 'object' 
                ? assignment.mandatorytaskId 
                : null;
              
              if (!task || !task._id) return;
              
              const key = task._id;
              
              // Skip if already processed (handles duplicate assignments)
              if (transformedTasks[key]) return;
              
              const probeList = {};
              const observationsList = {};

              task.categories?.forEach((category) => {
                const categoryKey = (category.name || "")
                  .toLowerCase()
                  .replace(/\s+/g, "")
                  .replace(/[^a-z0-9]/g, "")
                  .substring(0, 20);

                const questions = [];
                category.questions?.forEach((question) => {
                  questions.push({
                    probe: question.text || question.question,
                    fTag:
                      question.f_tag ||
                      question.tag ||
                      category.ftags?.[0] ||
                      category.f_tags?.[0] ||
                      "",
                    citeOnYes: false,
                  });
                });

                const observations = [];
                category.observations?.forEach((observation) => {
                  observations.push({
                    observation: observation,
                    fTag: category.ftags?.[0] || category.f_tags?.[0] || "",
                  });
                });

                if (questions.length > 0) {
                  probeList[categoryKey] = {
                    name: category.name,
                    items: questions,
                  };
                }

                if (observations.length > 0) {
                  observationsList[categoryKey] = {
                    name: category.name,
                    items: observations,
                  };
                }
              });

              const keyCheckpoints = task.categories?.map((cat) => cat.name) || [];

              transformedTasks[key] = {
                name: (task.title || "").replace(/\s*\([^)]+\)/g, "").trim(),
                description: task.desc || task.source_citation || "",
                keyCheckpoints,
                isMandatory: true,
                showPathwayProbes: true,
                probeList,
                observationsList,
                source_citation: task.source_citation,
                version_date: task.version_date,
                _id: task._id,
              };
            });
            
           
            setTeamMemberAssignedTasks(transformedTasks);
          }
        }
        // TEAM LEAD RESPONSE: Check various possible structures
        else if (response.data.facilityTasks?.facilityTasks && Array.isArray(response.data.facilityTasks.facilityTasks)) {
          facilityTasksArray = response.data.facilityTasks.facilityTasks;
          facilityTasksData = response.data.facilityTasks;
        } else if (response.data.facilityTasks && Array.isArray(response.data.facilityTasks)) {
          facilityTasksArray = response.data.facilityTasks;
        } else if (response.data.facilityTask && Array.isArray(response.data.facilityTask)) {
          // Handle API response with "facilityTask" (singular) field
          facilityTasksArray = response.data.facilityTask;
          facilityTasksData = response.data;
        } else if (Array.isArray(response.data)) {
          facilityTasksArray = response.data;
        }

        // Process facility tasks if we have any (either saved responses or empty for new assignments)
        if (facilityTasksArray !== null) {
          // SERVER-FIRST: Server data is the source of truth
         
          
          // Store the raw API data for direct access by child components
          setFacilityTasksFromAPI(facilityTasksArray);
          
          const currentSurveyData = surveyDataRef.current;
          
          const currentTaskObservationChecks = 
            currentSurveyData?.facilityTasks?.taskObservationChecks || 
            currentSurveyData?.taskObservationChecks || 
            {};
          const currentTaskObservationNotes = 
            currentSurveyData?.facilityTasks?.taskObservationNotes || 
            currentSurveyData?.taskObservationNotes || 
            {};
          const currentTaskProbeResponses = 
            currentSurveyData?.facilityTasks?.taskProbeResponses || 
            currentSurveyData?.taskProbeResponses || 
            {};
          const currentVaccinationSamples = 
            currentSurveyData?.facilityTasks?.vaccinationSamples || 
            currentSurveyData?.vaccinationSamples || 
            {};
          const currentMedErrors = 
            currentSurveyData?.facilityTasks?.medErrors || 
            currentSurveyData?.medErrors || 
            {};
          const currentMedOpportunities = 
            currentSurveyData?.facilityTasks?.medOpportunities || 
            currentSurveyData?.medOpportunities || 
            {};
          
          const currentTaskTimes = currentSurveyData?.facilityTasks?.taskTimes || {};
          const currentTaskObservations = currentSurveyData?.facilityTasks?.taskObservations || {};
          const currentFacilityTasksCompleted = currentSurveyData?.facilityTasks?.facilityTasksCompleted || {};
          
          // SERVER-FIRST APPROACH: Start with empty objects for server data
          // Server data is the source of truth - local data is only used for dirty (unsaved) fields
          const taskObservationChecks = {};
          const taskObservationNotes = {};
          const taskProbeResponses = {};
          const vaccinationSamples = {};
          const medErrors = {};
          const medOpportunities = {};
          const facilityTasksCompleted = {};
          
          // Store facilityTaskIds for updates and create a mapping from _id to probe data
          const newFacilityTaskIds = {};
          // Map from facilityTask._id to probe data for direct lookup
          const facilityTaskDataById = {};
          // Map taskKey -> teamMemberUserId for team lead saves
          const newTaskToTeamMemberMap = {};

          // Check if the array contains the new flat structure (with 'probe' field)
          const isNewStructure = facilityTasksArray.some(item => item.probe && item.mandatorytaskId);

          if (isNewStructure) {
            // Parse new flat structure - each item represents a single probe with its responses
            // Use _id as the single source of truth for matching
            facilityTasksArray.forEach((item) => {
              // Handle both populated object and ID string for mandatorytaskId
              const taskKey = typeof item.mandatorytaskId === 'object' && item.mandatorytaskId !== null
                ? item.mandatorytaskId._id
                : item.mandatorytaskId;

              const probeText = item.probe;
              const facilityTaskId = item._id; // Use _id as primary identifier
              
              if (taskKey && facilityTaskId) {
                // Store the complete facility task data by its _id for direct access
                facilityTaskDataById[facilityTaskId] = {
                  ...item,
                  taskKey,
                };
                
                // Extract teamMemberUserId for this task (used by team leads when saving)
                // teamMemberUserId can be an object with _id or a string
                if (item.teamMemberUserId && !newTaskToTeamMemberMap[taskKey]) {
                  const teamMemberUserId = typeof item.teamMemberUserId === 'object'
                    ? item.teamMemberUserId._id
                    : item.teamMemberUserId;
                  if (teamMemberUserId) {
                    newTaskToTeamMemberMap[taskKey] = teamMemberUserId;
                    
                  }
                }
                
                // Map probe response
                if (probeText) {
                  if (!taskProbeResponses[taskKey]) taskProbeResponses[taskKey] = {};
                  
                  // Determine the correct status value
                  // The API may return task-level status ("Not Started", "In Progress", "Completed")
                  // but we need probe response status ("Yes", "No", "NA", "Other")
                  const taskLevelStatuses = ['Not Started', 'In Progress', 'Completed', 'not started', 'in progress', 'completed'];
                  const validProbeResponses = ['Yes', 'No', 'yes', 'no'];
                  
                  let probeStatus = '';
                  if (item.status && validProbeResponses.includes(item.status)) {
                    probeStatus = item.status;
                  } else if (item.answer && validProbeResponses.includes(item.answer)) {
                    probeStatus = item.answer;
                  } else if (item.response && validProbeResponses.includes(item.response)) {
                    probeStatus = item.response;
                  }
                  
                  // Build the probe response data object with _id as primary reference
                  const probeResponseData = {
                    _id: facilityTaskId, // Store the facility task _id for updates
                    status: probeStatus,
                    probe: probeText,
                    note: item.note || '',
                    compliant: item.compliant !== undefined ? item.compliant : null,
                    citation: item.citation || '',
                    explanation: item.explanation || '',
                    fTag: item.fTag || item.originalFTag || '',
                    citationNote: item.citationNote || '',
                    aiAnalyzed: item.aiAnalyzed || false,
                    timestamp: item.timestamp || new Date().toISOString(),
                    originalFTag: item.originalFTag || item.fTag || '',
                    taskStatus: taskLevelStatuses.includes(item.status) ? item.status : undefined,
                  };
                  
                  // Store by _id as primary key (single source of truth)
                  // LOCAL BUFFER STRATEGY: Check if dirty before overwriting
                  const isDirtyId = unsavedChangesRef.current[taskKey]?.[facilityTaskId];
                  if (!isDirtyId) {
                    taskProbeResponses[taskKey][facilityTaskId] = probeResponseData;
                  }
                  
                  // Also store by probe text for UI lookup (the UI iterates by probe text)
                  // LOCAL BUFFER STRATEGY: Check if dirty before overwriting
                  const isDirtyText = unsavedChangesRef.current[taskKey]?.[probeText];
                  if (!isDirtyText) {
                    taskProbeResponses[taskKey][probeText] = probeResponseData;
                  }
                  
                  // Find and store the UI probeKey mapping for compatibility
                  const taskDef = mandatoryTasksFromAPI[taskKey];
                  if (taskDef && taskDef.probeList) {
                    const normalizedProbeText = (probeText || '').trim().toLowerCase();
                    Object.entries(taskDef.probeList).forEach(([catKey, catData]) => {
                      const items = Array.isArray(catData) ? catData : (catData?.items || []);
                      let idx = items.findIndex(p => p.probe === probeText);
                      if (idx === -1) {
                        idx = items.findIndex(p => (p.probe || '').trim().toLowerCase() === normalizedProbeText);
                      }
                      if (idx !== -1) {
                        const probeKey = `${catKey}_${idx}`;
                        // Store by UI key for component lookup
                        // LOCAL BUFFER STRATEGY: Check if dirty before overwriting
                        const isDirtyKey = unsavedChangesRef.current[taskKey]?.[probeKey];
                        if (!isDirtyKey) {
                          taskProbeResponses[taskKey][probeKey] = probeResponseData;
                        }
                        // Map UI key to _id
                        newFacilityTaskIds[`${taskKey}_${probeKey}`] = facilityTaskId;
                      }
                    });
                  }
                  
                  // Store facilityTaskId mapping by probe text as well
                  newFacilityTaskIds[`${taskKey}_${probeText}`] = facilityTaskId;
                }

                // Map observations from the item using _id-based matching
                if (item.observation && Array.isArray(item.observation)) {
                  if (!taskObservationChecks[taskKey]) taskObservationChecks[taskKey] = {};
                  if (!taskObservationNotes[taskKey]) taskObservationNotes[taskKey] = {};
                  
                  const taskDef = mandatoryTasksFromAPI[taskKey];
                  
                  // Store observations by their index in the API response (stable identifier)
                  item.observation.forEach((obs, obsIdx) => {
                    // Create a unique key combining facilityTask _id and observation index
                    const obsIdKey = `${facilityTaskId}_obs_${obsIdx}`;
                    
                    // Store by the unique ID-based key
                    // LOCAL BUFFER STRATEGY: Check if dirty before overwriting
                    const isDirtyObsId = unsavedChangesRef.current[taskKey]?.[obsIdKey];
                    if (!isDirtyObsId) {
                      taskObservationChecks[taskKey][obsIdKey] = obs.checked || false;
                    }
                    
                    // Try to find matching category for UI display
                    let foundCatKey = null;
                    let foundObsKey = null;
                    
                    if (taskDef && taskDef.observationsList) {
                      const normalizedObsQuestion = (obs.question || '').trim().toLowerCase();
                      const normalizedObsTitle = (obs.title || '').trim().toLowerCase();
                      
                      for (const [catKey, catVal] of Object.entries(taskDef.observationsList)) {
                        const catNameMatch = catVal.name === obs.title || 
                          (catVal.name || '').trim().toLowerCase() === normalizedObsTitle;
                        
                        if (catNameMatch) {
                          foundCatKey = catKey;
                          let obsIndex = catVal.items?.findIndex(o => o.observation === obs.question);
                          if (obsIndex === -1) {
                            obsIndex = catVal.items?.findIndex(o => 
                              (o.observation || '').trim().toLowerCase() === normalizedObsQuestion
                            );
                          }
                          if (obsIndex !== -1) {
                            foundObsKey = `${catKey}_obs_${obsIndex}`;
                          }
                          break;
                        }
                      }
                      
                      // Fallback: try to find by question text in any category
                      if (!foundObsKey) {
                        for (const [catKey, catVal] of Object.entries(taskDef.observationsList)) {
                          const obsIndex = catVal.items?.findIndex(o => 
                            o.observation === obs.question || 
                            (o.observation || '').trim().toLowerCase() === normalizedObsQuestion
                          );
                          if (obsIndex !== -1) {
                            foundCatKey = catKey;
                            foundObsKey = `${catKey}_obs_${obsIndex}`;
                            break;
                          }
                        }
                      }
                    }
                    
                    // Store by UI key if found, for component compatibility
                    if (foundObsKey) {
                      // LOCAL BUFFER STRATEGY: Check if dirty before overwriting
                      const isDirtyObsKey = unsavedChangesRef.current[taskKey]?.[foundObsKey];
                      if (!isDirtyObsKey) {
                        taskObservationChecks[taskKey][foundObsKey] = obs.checked || false;
                      }
                    }
                    
                    // Store observation notes by category
                    if (obs.notes && foundCatKey) {
                      // LOCAL BUFFER STRATEGY: Check if dirty before overwriting
                      const isDirtyNote = unsavedChangesRef.current[taskKey]?.[foundCatKey];
                      if (!isDirtyNote) {
                        taskObservationNotes[taskKey][foundCatKey] = obs.notes;
                      }
                    } else if (obs.notes) {
                      // Fallback: store by observation title (category name)
                      const catKeyFallback = (obs.title || 'obs').toLowerCase().replace(/\s+/g, '');
                      // LOCAL BUFFER STRATEGY: Check if dirty before overwriting
                      const isDirtyNoteFallback = unsavedChangesRef.current[taskKey]?.[catKeyFallback];
                      if (!isDirtyNoteFallback) {
                        taskObservationNotes[taskKey][catKeyFallback] = obs.notes;
                      }
                    }
                  });
                }
              }
            });
            
            setFacilityTaskIds(prev => ({ ...prev, ...newFacilityTaskIds }));
            
            // Store the task-to-teamMember mapping for team lead saves
            if (Object.keys(newTaskToTeamMemberMap).length > 0) {
              // Merge with existing mapping
            }

          } else {
            // Legacy structure parsing
            facilityTasksArray.forEach((taskData) => {
              const taskKey = taskData.task;
              if (taskKey) {
                taskObservationChecks[taskKey] = {
                  ...(currentTaskObservationChecks[taskKey] || {}),
                  ...(taskData.taskObservationChecks || {}),
                };
                taskObservationNotes[taskKey] = {
                  ...(currentTaskObservationNotes[taskKey] || {}),
                  ...(taskData.taskObservationNotes || {}),
                };
                taskProbeResponses[taskKey] = {
                  ...(currentTaskProbeResponses[taskKey] || {}),
                  ...(taskData.taskProbeResponses || {}),
                };
                
                if (taskData.isCompleted !== undefined) {
                  facilityTasksCompleted[taskKey] = taskData.isCompleted;
                }
                
                vaccinationSamples[taskKey] = taskData.vaccinationSamples || currentVaccinationSamples[taskKey] || {};
                medErrors[taskKey] = taskData.medErrors || currentMedErrors[taskKey] || {};
                medOpportunities[taskKey] = taskData.medOpportunities || currentMedOpportunities[taskKey] || {};
              }
            });
          }

          // Auto-complete tasks logic
          if (mandatoryTasksFromAPI && Object.keys(mandatoryTasksFromAPI).length > 0) {
            const allTasks = { ...mandatoryTasksFromAPI };
            Object.keys(allTasks).forEach((taskKey) => {
              const task = allTasks[taskKey];
              const hasObservationChecks = task?.observationsList && 
                Object.keys(task.observationsList).length > 0;
              
              if (!hasObservationChecks) {
                facilityTasksCompleted[taskKey] = true;
              }
            });
          }

          const pageClosedValue = facilityTasksData?.isPageClosed || 
                                  response.data.isPageClosed || 
                                  false;

          // Build server data object
          const serverFacilityTasks = {
            ...(facilityTasksData || response.data || {}),
            taskObservationChecks,
            taskObservationNotes,
            taskProbeResponses,
            vaccinationSamples,
            medErrors,
            medOpportunities,
            taskTimes: { ...((facilityTasksData || response.data || {})?.taskTimes || {}) },
            taskObservations: { ...((facilityTasksData || response.data || {})?.taskObservations || {}) },
            facilityTasksCompleted: facilityTasksCompleted,
            isPageClosed: pageClosedValue,
          };

          // SERVER-FIRST APPROACH:
          // If no unsaved changes, use server data directly (don't merge with stale IndexedDB data)
          // Only merge if there are actively edited (dirty) fields that need to be preserved
          let finalFacilityTasks;
          
          if (Object.keys(currentUnsavedChanges).length === 0) {
            // No unsaved changes - use server data directly
            
            finalFacilityTasks = serverFacilityTasks;
          } else {
            // Has unsaved changes - merge server with local, preserving dirty fields
            
            // Get current local data (from IndexedDB via surveyData)
            const localFacilityTasks = {
              taskObservationChecks: currentTaskObservationChecks,
              taskObservationNotes: currentTaskObservationNotes,
              taskProbeResponses: currentTaskProbeResponses,
              vaccinationSamples: currentVaccinationSamples,
              medErrors: currentMedErrors,
              medOpportunities: currentMedOpportunities,
              taskTimes: currentTaskTimes,
              taskObservations: currentTaskObservations,
              facilityTasksCompleted: currentFacilityTasksCompleted,
            };

            finalFacilityTasks = mergeFacilityTasksData(
              serverFacilityTasks,
              localFacilityTasks,
              currentUnsavedChanges
            );
            
            // Add back taskTimes and taskObservations (merged to preserve local during active editing)
            finalFacilityTasks.taskTimes = {
              ...(serverFacilityTasks.taskTimes || {}),
              ...currentTaskTimes,
            };
            finalFacilityTasks.taskObservations = {
              ...(serverFacilityTasks.taskObservations || {}),
              ...currentTaskObservations,
            };
          }
          
          handleSurveyDataChangeRef.current("facilityTasks", finalFacilityTasks);
          setDataVersion((prev) => prev + 1);
          
          if (pageClosedValue !== undefined) {
            setIsPageClosed(pageClosedValue);
          }

          // Show unsaved changes modal if there are unsaved changes during background sync
          if (isBackgroundSync && Object.keys(currentUnsavedChanges).length > 0) {
            setPendingUnsavedChangesCount(Object.keys(currentUnsavedChanges).length);
            setUnsavedChangesModalOpen(true);
          }
        } else if (response.data.facilityTasks && typeof response.data.facilityTasks === 'object') {
           // Handle object format
           handleSurveyDataChangeRef.current("facilityTasks", response.data.facilityTasks);
           setDataVersion((prev) => prev + 1);
           if (response.data.facilityTasks.isPageClosed !== undefined) {
             setIsPageClosed(response.data.facilityTasks.isPageClosed);
           }
        }
      }
    } catch (error) {
      // console.error("Failed to fetch facility tasks:", error);
    }
  }, [surveyData?.surveyId, surveyData?.id, surveyData?._id, mandatoryTasksFromAPI, currentUser]);

  // Initial fetch - only run once when mandatory tasks are loaded
  useEffect(() => {
    if (Object.keys(mandatoryTasksFromAPI).length > 0) {
      fetchFacilityTasksData();
    }
  }, [fetchFacilityTasksData, mandatoryTasksFromAPI]);

  // Watch for specific data changes that should trigger updates
  useEffect(() => {
    // Force a re-render when this data changes
    setDataVersion((prev) => prev + 1);
  }, [
    surveyData?.facilityTasks?.facilityTasksCompleted,
    surveyData?.facilityTasksCompleted,
    surveyData?.facilityTasks?.taskProbeResponses,
    surveyData?.taskProbeResponses,
    surveyData?.facilityTasks?.vaccinationSamples,
    surveyData?.vaccinationSamples,
    surveyData?.facilityTasks?.medErrors,
    surveyData?.medErrors,
    surveyData?.facilityTasks?.teamMemberPayload,
    surveyData?.teamMemberPayload,
    surveyData?.facilityTasks?.isPageClosed,
    surveyData?.isPageClosed,
  ]);

  // Helper function to determine if user is an invited user
  // Uses the isInvitedUser prop passed from SurveyBuilder for consistency
  const checkIfInvitedUser = () => {
    return isInvitedUser();
  };

  // Get assigned tasks for the current invited user
  const getAssignedTasks = () => {
    const isUserInvited = isInvitedUser();
  
    
    // Use the isInvitedUser prop for consistency with other components
    if (!isUserInvited || !currentUser) {
      
      return null; // Return null to show all tasks for survey owners (team leads)
    }

   

    // PRIMARY SOURCE: Use teamMemberAssignedTaskIds from API (assignedFacility response)
    // This is the most authoritative source as it comes directly from the team member's API response
    if (teamMemberAssignedTaskIds && teamMemberAssignedTaskIds.length > 0) {
     
      return teamMemberAssignedTaskIds;
    }

    // FALLBACK: Get current user's ID and check other sources
    const currentUserId = currentUser._id || currentUser.id;
    
    if (!currentUserId) {
      
      return []; // Return empty array if no user ID
    }

    // Get team members from API (localTeamMembers) or fall back to surveyData
    const teamMembersList = localTeamMembers.length > 0 ? localTeamMembers : (surveyData?.teamMembers || []);
    
    // Find the current user's team member record to get their teamMember._id
    const currentTeamMember = teamMembersList.find(
      (member) =>
        String(member.teamMemberUserId) === String(currentUserId) ||
        String(member._id) === String(currentUserId) ||
        member.email === currentUser.email
    );
    
    // Get both the user ID and the teamMember document ID for matching
    const currentTeamMemberId = currentTeamMember?._id;
    const currentTeamMemberUserId = currentTeamMember?.teamMemberUserId || currentUserId;


    // Get mandatory tasks from surveyData
    const mandatoryTasksAssignments = surveyData?.mandatoryTasks || {};

    
    // Find tasks assigned to the current user by checking teamMemberUserId
    const assignedTaskKeys = [];
    
    Object.entries(mandatoryTasksAssignments).forEach(([taskKey, taskAssignment]) => {
      if (taskAssignment && taskAssignment.assigned) {
        // Check if teamMemberUserId matches current user's ID
        const assignedUserId = taskAssignment.teamMemberUserId;
        
        // Also check if teamMemberId object has teamMemberUserId or _id
        const teamMemberObjUserId = taskAssignment.teamMemberId?.teamMemberUserId;
        const teamMemberObjId = taskAssignment.teamMemberId?._id;
        
        // Also check the "primary" field which might contain teamMember._id
        const primaryAssignee = taskAssignment.primary;
        
        // Match against current user's ID OR their teamMember document ID
        const isAssignedToUser = 
          String(assignedUserId) === String(currentTeamMemberUserId) ||
          String(assignedUserId) === String(currentUserId) ||
          String(teamMemberObjUserId) === String(currentTeamMemberUserId) ||
          String(teamMemberObjUserId) === String(currentUserId) ||
          String(teamMemberObjId) === String(currentTeamMemberId) ||
          String(primaryAssignee) === String(currentTeamMemberId);
        
      
        
        if (isAssignedToUser) {
          // The taskKey here is the mandatorytaskId (e.g., "690545b25238fe80365b8726")
          assignedTaskKeys.push(taskKey);
        }
      }
    });


    // Fallback: Also check the old method (team member's assignedFacilityTasks array)
    if (assignedTaskKeys.length === 0 && currentTeamMember?.assignedFacilityTasks) {
      return currentTeamMember.assignedFacilityTasks;
    }

    return assignedTaskKeys;
  };

  // State for intelligent analysis integration
  const [isLoadingFTag, setIsLoadingFTag] = useState(false);
  const [loadingProbeKey, setLoadingProbeKey] = useState(null);
  const [isChecklistDrawerOpen, setIsChecklistDrawerOpen] = useState(false);
  const [isTaskListDrawerOpen, setIsTaskListDrawerOpen] = useState(false); // Mobile task list drawer
  const [openResponseDropdowns, setOpenResponseDropdowns] = useState({});
  const [localProbeNotes, setLocalProbeNotes] = useState({});
  const [localObservationNotes, setLocalObservationNotes] = useState({});
  const probeNotesDebounceRef = useRef({});
  const observationNotesDebounceRef = useRef({});
  const dirtyProbeNotesRef = useRef({}); // Track which probe notes have unsaved local edits
  const dirtyObservationNotesRef = useRef({}); // Track which observation notes have unsaved local edits
  const lastSelectedTaskRef = useRef(null);
  const focusedTextareaRef = useRef(null);

  // Handle probe response with intelligent analysis integration
  const handleProbeResponse = async (
    taskKey,
    category,
    index,
    question,
    answer,
    probeItem
  ) => {
    const probeKey = `${category}_${index}`;
    setIsLoadingFTag(true);
    setLoadingProbeKey(probeKey);

    // Show thinking indicator
    const thinkingToast = toast.loading("Analyzing probe response...", {
      position: "top-right",
      duration: Infinity,
    });

    // Optimistically update the UI first
    const currentResponses =
      surveyData?.facilityTasks?.taskProbeResponses ||
      surveyData?.taskProbeResponses ||
      {};
    const currentTaskResponses = currentResponses[taskKey] || {};
    
    // Create optimistic update
    const optimisticResponses = {
      ...currentTaskResponses,
      [probeKey]: {
        ...currentTaskResponses[probeKey],
        status: answer,
        probe: question,
        timestamp: new Date().toISOString(),
        // Keep existing analysis data until new data arrives
      },
    };

    // Mark as unsaved
    markAsUnsaved(taskKey, probeKey);

    const optimisticTaskResponses = {
      ...currentResponses,
      [taskKey]: optimisticResponses,
    };

    // Update state immediately
    if (!checkIfInvitedUser()) {
      const updatedFacilityTasks = {
        ...surveyData?.facilityTasks,
        taskProbeResponses: optimisticTaskResponses,
      };
      handleSurveyDataChange("facilityTasks", updatedFacilityTasks);
    } else {
      const updatedFacilityTasks = {
        ...surveyData?.facilityTasks,
        taskProbeResponses: optimisticTaskResponses,
      };
      handleSurveyDataChange("facilityTasks", updatedFacilityTasks);
    }

    try {
      // Call the F-Tag API to get citation information

      const fTagResponse = await api.healthAssistant.getFTagInfo(
        question,
        answer
      );

      // Dismiss thinking toast
      toast.dismiss(thinkingToast);

      if ((fTagResponse.success || fTagResponse.status) && fTagResponse.data) {
        const { ftag, citation, compliant, explanation } = fTagResponse.data;

        // Determine if citation is required based on probe item settings and response
        const shouldCite =
          (probeItem.citeOnYes && answer === "Yes") ||
          (!probeItem.citeOnYes && answer === "No");
        const finalFTag = shouldCite ? ftag || probeItem.fTag : null;

        // Update the probe response with API data
        const currentResponses =
          surveyData?.facilityTasks?.taskProbeResponses ||
          surveyData?.taskProbeResponses ||
          {};
        const currentTaskResponses = currentResponses[taskKey] || {};
        const updatedResponses = {
          ...currentTaskResponses,
          [probeKey]: {
            ...currentTaskResponses[probeKey], // Preserve existing fields like 'note'
            status: answer,
            probe: question,
            fTag: finalFTag,
            citation: citation || "",
            compliant: compliant,
            explanation: explanation || "",
            citationNote:
              shouldCite && finalFTag
                ? `${question} - ${finalFTag} citation required`
                : "",
            timestamp: new Date().toISOString(),
            aiAnalyzed: true,
            originalFTag: probeItem.fTag,
          },
        };

        const updatedTaskResponses = {
          ...currentResponses,
          [taskKey]: updatedResponses,
        };

        // For team leads, also update team member payloads
        if (!checkIfInvitedUser()) {
          // Update the nested structure properly
          const updatedFacilityTasks = {
            ...surveyData?.facilityTasks,
            taskProbeResponses: updatedTaskResponses,
          };
          handleSurveyDataChange("facilityTasks", updatedFacilityTasks);

          // Update team member payloads for assigned tasks
          const existingTeamMemberPayload =
            surveyData?.facilityTasks?.teamMemberPayload ||
            surveyData?.teamMemberPayload ||
            [];

          const updatedTeamMemberPayload = existingTeamMemberPayload.map(
            (submission) => {
              if (
                submission.assignedTasks &&
                submission.assignedTasks.includes(taskKey)
              ) {
                return {
                  ...submission,
                  taskProbeResponses: {
                    ...submission.taskProbeResponses,
                    [taskKey]: updatedResponses,
                  },
                  lastUpdatedBy: currentUser._id,
                  lastUpdatedAt: new Date().toISOString(),
                };
              }
              return submission;
            }
          );

          // Update team member payload in the nested structure
          const updatedFacilityTasksWithPayload = {
            ...updatedFacilityTasks,
            teamMemberPayload: updatedTeamMemberPayload,
          };
          handleSurveyDataChange(
            "facilityTasks",
            updatedFacilityTasksWithPayload
          );
        } else {
          // For invited users, just update their own data
          const updatedFacilityTasks = {
            ...surveyData?.facilityTasks,
            taskProbeResponses: updatedTaskResponses,
          };
          handleSurveyDataChange("facilityTasks", updatedFacilityTasks);
        }

        // Show success message with insights
        if (explanation) {
          toast.success("Probe analyzed successfully", {
            position: "top-right",
            description:
              explanation.length > 100
                ? explanation.substring(0, 100) + "..."
                : explanation,
          });
        }
      } else {
        // Fallback to original logic if API fails
        handleProbeResponseFallback(
          taskKey,
          category,
          index,
          question,
          answer,
          probeItem
        );
        toast.warning("Using standard F-Tag mapping", {
          position: "top-right",
          description:
            "Advanced analysis unavailable, using predefined mapping",
        });
      }
    } catch (error) {
      // Dismiss thinking toast
      toast.dismiss(thinkingToast);

      // Fallback to original logic
      handleProbeResponseFallback(
        taskKey,
        category,
        index,
        question,
        answer,
        probeItem
      );

      toast.error("Analysis failed, using standard mapping", {
        position: "top-right",
        description:
          error.message || "Please check your connection and try again",
      });
    } finally {
      setIsLoadingFTag(false);
      setLoadingProbeKey(null);
    }
  };

  // Fallback function for when API fails
  const handleProbeResponseFallback = (
    taskKey,
    category,
    index,
    question,
    answer,
    probeItem
  ) => {
    const probeKey = `${category}_${index}`;
    const shouldCite =
      (probeItem.citeOnYes && answer === "Yes") ||
      (!probeItem.citeOnYes && answer === "No");
    const finalFTag = shouldCite ? probeItem.fTag : null;

    const currentResponses =
      surveyData?.facilityTasks?.taskProbeResponses ||
      surveyData?.taskProbeResponses ||
      {};
    const currentTaskResponses = currentResponses[taskKey] || {};
    const updatedResponses = {
      ...currentTaskResponses,
      [probeKey]: {
        ...currentTaskResponses[probeKey], // Preserve existing fields like 'note'
        status: answer,
        probe: question,
        fTag: finalFTag,
        citation: "",
        compliant: null,
        explanation: "",
        citationNote:
          shouldCite && finalFTag
            ? `${question} - ${finalFTag} citation required`
            : "",
        timestamp: new Date().toISOString(),
        aiAnalyzed: false,
        originalFTag: probeItem.fTag,
      },
    };

    const updatedTaskResponses = {
      ...currentResponses,
      [taskKey]: updatedResponses,
    };

    // For team leads, also update team member payloads
    if (!checkIfInvitedUser()) {
      // Update the nested structure properly
      const updatedFacilityTasks = {
        ...surveyData?.facilityTasks,
        taskProbeResponses: updatedTaskResponses,
      };
      handleSurveyDataChange("facilityTasks", updatedFacilityTasks);

      // Update team member payloads for assigned tasks
      const existingTeamMemberPayload =
        surveyData?.facilityTasks?.teamMemberPayload ||
        surveyData?.teamMemberPayload ||
        [];

      const updatedTeamMemberPayload = existingTeamMemberPayload.map(
        (submission) => {
          if (
            submission.assignedTasks &&
            submission.assignedTasks.includes(taskKey)
          ) {
            return {
              ...submission,
              taskProbeResponses: {
                ...submission.taskProbeResponses,
                [taskKey]: updatedResponses,
              },
              lastUpdatedBy: currentUser._id,
              lastUpdatedAt: new Date().toISOString(),
            };
          }
          return submission;
        }
      );

      // Update team member payload in the nested structure
      const updatedFacilityTasksWithPayload = {
        ...updatedFacilityTasks,
        teamMemberPayload: updatedTeamMemberPayload,
      };
      handleSurveyDataChange("facilityTasks", updatedFacilityTasksWithPayload);
    } else {
      // For invited users, just update their own data
      const updatedFacilityTasks = {
        ...surveyData?.facilityTasks,
        taskProbeResponses: updatedTaskResponses,
      };
      handleSurveyDataChange("facilityTasks", updatedFacilityTasks);
    }
  };

  // Handler for probe question notes (with debouncing)
  const handleProbeNoteChange = (taskKey, categoryKey, index, note) => {
    const probeKey = `${categoryKey}_${index}`;
    const fullKey = `${taskKey}_${probeKey}`;
    
    // Mark this key as dirty (locally edited) so we use local state instead of server data
    dirtyProbeNotesRef.current[fullKey] = true;
    
    // Update local state immediately for responsive UI (using functional update to avoid stale closures)
    setLocalProbeNotes(prev => {
      const updated = { ...prev, [fullKey]: note };
      return updated;
    });
    
    // Clear existing debounce timer
    if (probeNotesDebounceRef.current[fullKey]) {
      clearTimeout(probeNotesDebounceRef.current[fullKey]);
    }
    
    // Set new debounce timer - use the latest note value from a ref
    const noteRef = { current: note };
    probeNotesDebounceRef.current[fullKey] = setTimeout(() => {
      handleProbeNote(taskKey, categoryKey, index, noteRef.current);
      delete probeNotesDebounceRef.current[fullKey];
    }, 500); // 500ms delay
  };

  // Handler for probe question notes (actual save)
  const handleProbeNote = (taskKey, categoryKey, index, note) => {
    const probeKey = `${categoryKey}_${index}`;
    
    // Mark as unsaved
    markAsUnsaved(taskKey, probeKey);

    const currentResponses =
      surveyData?.facilityTasks?.taskProbeResponses ||
      surveyData?.taskProbeResponses ||
      {};
    const currentTaskResponses = currentResponses[taskKey] || {};
    const currentProbeResponse = currentTaskResponses[probeKey] || {};
    
    const updatedProbeResponse = {
      ...currentProbeResponse,
      note: note,
    };
    
    const updatedTaskResponses = {
      ...currentTaskResponses,
      [probeKey]: updatedProbeResponse,
    };

    const updatedResponses = {
      ...currentResponses,
      [taskKey]: updatedTaskResponses,
    };

    // For team leads, also update team member payloads
    if (!checkIfInvitedUser()) {
      // Update the nested structure properly
      const updatedFacilityTasks = {
        ...surveyData?.facilityTasks,
        taskProbeResponses: updatedResponses,
      };
      handleSurveyDataChange("facilityTasks", updatedFacilityTasks);

      // Update team member payloads for assigned tasks
      const existingTeamMemberPayload =
        surveyData?.facilityTasks?.teamMemberPayload ||
        surveyData?.teamMemberPayload ||
        [];

      const updatedTeamMemberPayload = existingTeamMemberPayload.map(
        (submission) => {
          if (
            submission.assignedTasks &&
            submission.assignedTasks.includes(taskKey)
          ) {
            return {
              ...submission,
              taskProbeResponses: {
                ...submission.taskProbeResponses,
                [taskKey]: updatedTaskResponses,
              },
              lastUpdatedBy: currentUser._id,
              lastUpdatedAt: new Date().toISOString(),
            };
          }
          return submission;
        }
      );

      // Update team member payload in the nested structure
      const updatedFacilityTasksWithPayload = {
        ...updatedFacilityTasks,
        teamMemberPayload: updatedTeamMemberPayload,
      };
      handleSurveyDataChange(
        "facilityTasks",
        updatedFacilityTasksWithPayload
      );
    } else {
      // For invited users, just update their own data
      const updatedFacilityTasks = {
        ...surveyData?.facilityTasks,
        taskProbeResponses: updatedResponses,
      };
      handleSurveyDataChange("facilityTasks", updatedFacilityTasks);
    }
  };

  // Use API mandatory tasks if available, otherwise fallback to hardcoded
  // Use only API data - no hardcoded fallback
  const mandatoryTasks = mandatoryTasksFromAPI;
  
  // Triggered tasks - should come from API (empty for now until API is available)
  const triggeredTasks = {};
  const allTasks = { ...mandatoryTasks, ...triggeredTasks };

  // Filter tasks based on user type
  const getVisibleTasks = () => {
    const isUserInvited = isInvitedUser();

 

    // If not an invited user (survey owner/team lead), show all tasks
    if (!isUserInvited) {
      
      return allTasks;
    }

    // FOR TEAM MEMBERS: Use teamMemberAssignedTasks directly
    // This is built from the assignedFacility API response and contains the full task definitions
    if (Object.keys(teamMemberAssignedTasks).length > 0) {
      return teamMemberAssignedTasks;
    }

    // FALLBACK: If teamMemberAssignedTasks is not populated yet, try filtering allTasks
    const assignedTasks = getAssignedTasks();
    
    // If empty array (invited user with no assignments), show no tasks
    if (!assignedTasks || assignedTasks.length === 0) {
      return {};
    }

    // Filter to only show assigned tasks for invited users
    const filteredTasks = {};
    assignedTasks.forEach((taskKey) => {
      if (allTasks[taskKey]) {
        filteredTasks[taskKey] = allTasks[taskKey];
      }
    });

    return filteredTasks;
  };

  const visibleTasks = getVisibleTasks();
  
  // Helper function to check if a task has any saved progress from API data
  const getTaskProgress = (taskKey) => {
    const task = visibleTasks[taskKey];
    if (!task) return { hasProgress: false, answeredProbes: 0, totalProbes: 0, isFullyAnswered: false };

    // 1. Calculate total probes
    const totalProbes = task.probeList 
      ? Object.values(task.probeList).reduce((acc, category) => {
          const probes = Array.isArray(category) ? category : (category?.items || []);
          return acc + probes.length;
        }, 0)
      : 0;

    // 2. Count answered probes (checking both local state and API data)
    let answeredProbesCount = 0;
    
    // Get local responses
    const localResponses = 
      surveyData?.facilityTasks?.taskProbeResponses?.[taskKey] || 
      surveyData?.taskProbeResponses?.[taskKey] || 
      {};

    // Iterate through all probes to check status
    if (task.probeList) {
      Object.entries(task.probeList).forEach(([categoryKey, categoryData]) => {
        const probes = Array.isArray(categoryData) ? categoryData : (categoryData?.items || []);
        
        probes.forEach((probeItem, index) => {
          const probeKey = `${categoryKey}_${index}`;
          
          // Check local state first
          const localResponse = localResponses[probeKey];
          if (localResponse && localResponse.status && localResponse.status !== "") {
            answeredProbesCount++;
            return;
          }
          
          // Fallback to API data
          const apiTask = facilityTasksFromAPI.find(t => {
            const tKey = typeof t.mandatorytaskId === 'object' ? t.mandatorytaskId?._id : t.mandatorytaskId;
            // Match by task key and probe text
            // Normalize text for comparison
            const normalizeText = (text) => (text ? text.toLowerCase().replace(/\s+/g, ' ').trim() : '');
            return String(tKey) === String(taskKey) && normalizeText(t.probe) === normalizeText(probeItem.probe);
          });
          
          if (apiTask && apiTask.status && apiTask.status !== "" && apiTask.status !== "Not Started") {
            answeredProbesCount++;
          }
        });
      });
    }

    // Look up saved tasks from API data by mandatorytaskId for other checks
    const savedTasksForKey = facilityTasksFromAPI.filter(task => {
      const taskMandatoryId = typeof task.mandatorytaskId === 'object' 
        ? task.mandatorytaskId?._id 
        : task.mandatorytaskId;
      return String(taskMandatoryId) === String(taskKey);
    });
    
    // Check for any checked observations from API data
    const hasCheckedObservations = savedTasksForKey.some(
      (task) => task.observation && Array.isArray(task.observation) && 
        task.observation.some(obs => obs.checked === true)
    );
    
    // Check for any notes
    const hasProbeNotes = savedTasksForKey.some(
      (task) => task.note && task.note.trim() !== ''
    );
    
    const hasAnyProgress = answeredProbesCount > 0 || hasCheckedObservations || hasProbeNotes;
    const isFullyAnswered = totalProbes > 0 && answeredProbesCount === totalProbes;
    
    return {
      hasProgress: hasAnyProgress,
      answeredProbes: answeredProbesCount,
      totalProbes,
      hasCheckedObservations,
      isFullyAnswered
    };
  };
  
  // Set first task as active if no task is selected or current selectedTask doesn't exist in visibleTasks
  // IMPORTANT: This hook must come BEFORE any conditional returns to follow Rules of Hooks
  useEffect(() => {
    const taskKeys = Object.keys(visibleTasks);
    if (taskKeys.length > 0) {
      // If no task is selected OR the selected task doesn't exist in visible tasks, set the first one
      if (!selectedTask || !visibleTasks[selectedTask]) {
        const firstTaskKey = taskKeys[0];
        setSelectedTask(firstTaskKey);
      }
    }
  }, [visibleTasks, selectedTask, setSelectedTask]);

  // Auto-mark tasks as completed if they don't have observation checks to populate
  useEffect(() => {
    if (!visibleTasks || Object.keys(visibleTasks).length === 0 || !mandatoryTasksFromAPI || Object.keys(mandatoryTasksFromAPI).length === 0) return;
    
    const currentCompleted = 
      surveyData?.facilityTasks?.facilityTasksCompleted ||
      surveyData?.facilityTasksCompleted ||
      {};
    
    const allTasks = { ...mandatoryTasksFromAPI };
    const tasksToComplete = {};
    let hasChanges = false;
    
    Object.keys(allTasks).forEach((taskKey) => {
      const task = allTasks[taskKey];
      const isAlreadyCompleted = currentCompleted[taskKey] || false;
      
      // Check if task has observation checks (observationsList)
      const hasObservationChecks = task?.observationsList && 
        Object.keys(task.observationsList).length > 0;
      
      // If task doesn't have observation checks and isn't already completed, mark it as completed
      if (!hasObservationChecks && !isAlreadyCompleted) {
        tasksToComplete[taskKey] = true;
        hasChanges = true;
      }
    });
    
    // Update tasks if there are changes
    if (hasChanges) {
      const updatedTasks = {
        ...currentCompleted,
        ...tasksToComplete,
      };
      
      const updatedFacilityTasks = {
        ...surveyData?.facilityTasks,
        facilityTasksCompleted: updatedTasks,
      };
      handleSurveyDataChange("facilityTasks", updatedFacilityTasks);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mandatoryTasksFromAPI, surveyData?.facilityTasks?.facilityTasksCompleted, surveyData?.facilityTasksCompleted]);

  // Show loading state while fetching mandatory tasks (only on initial load)
  // This must come AFTER all hooks to follow Rules of Hooks
  if (loadingMandatoryTasks && Object.keys(mandatoryTasksFromAPI).length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading mandatory tasks...</p>
        </div>
      </div>
    );
  }
  
  const completedCount = Object.values(
    surveyData?.facilityTasks?.facilityTasksCompleted ||
      surveyData?.facilityTasksCompleted ||
      {}
  ).filter(Boolean).length;
  const totalTasks = Object.keys(visibleTasks).length;

  const handleTaskComplete = (taskKey, completed) => {
    const updatedTasks = {
      ...(surveyData?.facilityTasks?.facilityTasksCompleted ||
        surveyData?.facilityTasksCompleted ||
        {}),
      [taskKey]: completed,
    };

    // For team leads, also update the team member payload if they're updating a specific team member's task
    if (!checkIfInvitedUser()) {
      // Team leads can update the main facility tasks completion status
      // Update the nested structure properly
      const updatedFacilityTasks = {
        ...surveyData?.facilityTasks,
        facilityTasksCompleted: updatedTasks,
      };
      handleSurveyDataChange("facilityTasks", updatedFacilityTasks);

      // Also update any team member payloads that might have this task
      const existingTeamMemberPayload =
        surveyData?.facilityTasks?.teamMemberPayload ||
        surveyData?.teamMemberPayload ||
        [];

      const updatedTeamMemberPayload = existingTeamMemberPayload.map(
        (submission) => {
          if (
            submission.assignedTasks &&
            submission.assignedTasks.includes(taskKey)
          ) {
            return {
              ...submission,
              taskTimes: {
                ...submission.taskTimes,
                [taskKey]: submission.taskTimes?.[taskKey] || 0,
              },
              taskStatus: completed ? "completed" : "in_progress",
              lastUpdatedBy: currentUser._id,
              lastUpdatedAt: new Date().toISOString(),
            };
          }
          return submission;
        }
      );

      // Update team member payload in the nested structure
      const updatedFacilityTasksWithPayload = {
        ...updatedFacilityTasks,
        teamMemberPayload: updatedTeamMemberPayload,
      };
      handleSurveyDataChange("facilityTasks", updatedFacilityTasksWithPayload);
    } else {
      // For invited users, just update their own data
      const updatedFacilityTasks = {
        ...surveyData?.facilityTasks,
        facilityTasksCompleted: updatedTasks,
      };
      handleSurveyDataChange("facilityTasks", updatedFacilityTasks);
    }
  };

  // Function for team leads to update team member data
  const handleTeamMemberDataUpdate = (teamMemberId, field, value) => {
    if (checkIfInvitedUser()) {
      // Invited users can only update their own data
      return;
    }

    // Team leads can update any team member's data
    const existingTeamMemberPayload =
      surveyData?.facilityTasks?.teamMemberPayload ||
      surveyData?.teamMemberPayload ||
      [];

    const updatedTeamMemberPayload = existingTeamMemberPayload.map(
      (submission) => {
        if (submission.teamMemberId === teamMemberId) {
          return {
            ...submission,
            [field]: value,
            lastUpdatedBy: currentUser._id,
            lastUpdatedAt: new Date().toISOString(),
          };
        }
        return submission;
      }
    );

    handleSurveyDataChange("teamMemberPayload", updatedTeamMemberPayload);
  };

  const handleVaccinationSampleAdd = (taskKey, residentId, reason, type) => {
    const currentSamples =
      surveyData?.facilityTasks?.vaccinationSamples?.[taskKey] ||
      surveyData?.vaccinationSamples?.[taskKey] ||
      [];
    const updatedSamples = [
      ...currentSamples,
      { residentId, reason, type, date: new Date().toISOString() },
    ];
    const updatedVaccinationSamples = {
      ...(surveyData?.facilityTasks?.vaccinationSamples ||
        surveyData?.vaccinationSamples ||
        {}),
      [taskKey]: updatedSamples,
    };
    handleSurveyDataChange("vaccinationSamples", updatedVaccinationSamples);
  };

  const handleVaccinationSampleRemove = (taskKey, sampleIndex) => {
    const currentSamples =
      surveyData?.facilityTasks?.vaccinationSamples?.[taskKey] ||
      surveyData?.vaccinationSamples?.[taskKey] ||
      [];
    const updatedSamples = currentSamples.filter(
      (_, index) => index !== sampleIndex
    );
    const updatedVaccinationSamples = {
      ...(surveyData?.facilityTasks?.vaccinationSamples ||
        surveyData?.vaccinationSamples ||
        {}),
      [taskKey]: updatedSamples,
    };
    handleSurveyDataChange("vaccinationSamples", updatedVaccinationSamples);
  };

  const handleMedErrorAdd = (taskKey, errorData) => {
    const currentErrors =
      surveyData?.facilityTasks?.medErrors?.[taskKey] ||
      surveyData?.medErrors?.[taskKey] ||
      [];
    const updatedErrors = [
      ...currentErrors,
      { ...errorData, date: new Date().toISOString() },
    ];
    const updatedMedErrors = {
      ...(surveyData?.facilityTasks?.medErrors || surveyData?.medErrors || {}),
      [taskKey]: updatedErrors,
    };
    handleSurveyDataChange("medErrors", updatedMedErrors);
  };

  const getErrorRate = (taskKey) => {
    const errors =
      surveyData?.facilityTasks?.medErrors?.[taskKey] ||
      surveyData?.medErrors?.[taskKey] ||
      [];
    const opportunities =
      surveyData?.facilityTasks?.medOpportunities?.[taskKey] ||
      surveyData?.medOpportunities?.[taskKey] ||
      0;
    return opportunities > 0 ? (errors.length / opportunities) * 100 : 0;
  };

  const getTotalErrorRate = () => {
    const allErrors = Object.values(
      surveyData?.facilityTasks?.medErrors || surveyData?.medErrors || {}
    ).flat().length;
    const allOpportunities = Object.values(
      surveyData?.facilityTasks?.medOpportunities ||
        surveyData?.medOpportunities ||
        {}
    ).reduce((sum, count) => sum + count, 0);
    return allOpportunities > 0 ? (allErrors / allOpportunities) * 100 : 0;
  };



  
 
  // Handle facility tasks submission
  const handleFacilityTasksSubmit = async (isContinueClicked = false) => {
    // Prevent concurrent submissions (race condition protection)
    if (isSubmittingRef.current ) {
      toast.warning("Please wait for the current submission to complete", {
        position: "top-right",
        duration: 2000,
      });
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    
    try {
      // Try to get survey ID from various possible locations
      const surveyId =
        surveyData.surveyId ||
        surveyData.id ||
        surveyData._id ||
        localStorage.getItem("currentSurveyId");

      if (!surveyId) {
        toast.error("Survey ID not found. Please refresh and try again.", {
          position: "top-right",
        });
        setIsSubmitting(false);
        return;
      }

      // Get all task keys - use all tasks (mandatory + triggered) for the payload
      // This ensures we save data for all tasks, not just visible ones
      const mandatoryTasks = mandatoryTasksFromAPI;
      const triggeredTasks = {}; // Should come from API when available
      const allTasksForPayload = { ...mandatoryTasks, ...triggeredTasks };
      const taskKeys = Object.keys(allTasksForPayload);
      
      // Get data from surveyData
      const taskObservationChecks =
        surveyData?.facilityTasks?.taskObservationChecks ||
        surveyData?.taskObservationChecks ||
        {};
      const taskObservationNotes =
        surveyData?.facilityTasks?.taskObservationNotes ||
        surveyData?.taskObservationNotes ||
        {};
      const taskProbeResponses =
        surveyData?.facilityTasks?.taskProbeResponses ||
        surveyData?.taskProbeResponses ||
        {};
      const vaccinationSamples =
        surveyData?.facilityTasks?.vaccinationSamples ||
        surveyData?.vaccinationSamples ||
        {};
      const medErrors =
        surveyData?.facilityTasks?.medErrors || surveyData?.medErrors || {};
      const medOpportunities =
        surveyData?.facilityTasks?.medOpportunities ||
        surveyData?.medOpportunities ||
        {};
      const facilityTasksCompleted =
        surveyData?.facilityTasks?.facilityTasksCompleted ||
        surveyData?.facilityTasksCompleted ||
        {};

      // Auto-mark tasks as completed if they don't have observation checks to populate
      const allTasks = { ...mandatoryTasks, ...triggeredTasks };
      const autoCompletedTasks = { ...facilityTasksCompleted };
      let hasAutoCompletedChanges = false;
      
      taskKeys.forEach((taskKey) => {
        const task = allTasks[taskKey];
        const isAlreadyCompleted = autoCompletedTasks[taskKey] || false;
        
        // Check if task has observation checks (observationsList)
        const hasObservationChecks = task?.observationsList && 
          Object.keys(task.observationsList).length > 0;
        
        // If task doesn't have observation checks and isn't already completed, mark it as completed
        if (!hasObservationChecks && !isAlreadyCompleted) {
          autoCompletedTasks[taskKey] = true;
          hasAutoCompletedChanges = true;
        }
      });
      
      // Update surveyData if we auto-completed any tasks
      if (hasAutoCompletedChanges) {
        const updatedFacilityTasks = {
          ...surveyData?.facilityTasks,
          facilityTasksCompleted: autoCompletedTasks,
        };
        handleSurveyDataChange("facilityTasks", updatedFacilityTasks);
      }

      // Use the updated completion status (either from auto-completion or existing)
      const finalCompletedStatus = hasAutoCompletedChanges ? autoCompletedTasks : facilityTasksCompleted;

      // Get current user ID for team member payload
      const currentUserId = currentUser?._id || 
        JSON.parse(localStorage.getItem("mocksurvey_user") || "{}")?._id;

      // Get mandatory tasks assignments to find assigned team members
      const mandatoryTasksAssignments = surveyData?.mandatoryTasks || {};
      
      // Helper function to get assigned team member for a task
      // Check multiple sources: 1) API data mapping, 2) surveyData assignments
      const getAssignedTeamMemberForTask = (taskKey) => {
        // PRIMARY: Check the taskToTeamMemberMap built from API response (most reliable)
        if (taskToTeamMemberMap[taskKey]) {
          return taskToTeamMemberMap[taskKey];
        }
        
        // FALLBACK: Check surveyData.mandatoryTasks assignments
        const taskAssignment = mandatoryTasksAssignments[taskKey];
        if (taskAssignment && taskAssignment.assigned) {
          // Return the teamMemberUserId if the task is assigned
          const teamMemberUserId = taskAssignment.teamMemberUserId || 
                 taskAssignment.teamMemberId?.teamMemberUserId || 
                 taskAssignment.teamMemberId?._id ||
                 null;
          if (teamMemberUserId) {
            //additional check
          }
          return teamMemberUserId;
        }
        return null;
      };

      // Build facilityTasks array - one object per probe per task
      const facilityTasksArray = [];
      
      taskKeys.forEach((taskKey) => {
        const task = allTasksForPayload[taskKey];
        if (!task) return;

        // Get observations for this task
        const observations = [];
        if (task.observationsList) {
          Object.entries(task.observationsList).forEach(([catKey, category]) => {
            if (category.items) {
              category.items.forEach((item, index) => {
                const obsKey = `${catKey}_obs_${index}`;
                const isChecked = taskObservationChecks[taskKey]?.[obsKey] || false;
                const notes = taskObservationNotes[taskKey]?.[catKey] || "";
                
                observations.push({
                  title: category.name,
                  question: item.observation,
                  ftag: item.fTag,
                  checked: isChecked,
                  notes: notes
                });
              });
            }
          });
        }

        // Get probes for this task - Iterate correctly to get probeKey
        let hasProbes = false;
        if (task.probeList) {
          Object.entries(task.probeList).forEach(([categoryKey, categoryData]) => {
             const items = Array.isArray(categoryData) ? categoryData : (categoryData?.items || []);
             
             items.forEach((probeItem, index) => {
                hasProbes = true;
                const probeKey = `${categoryKey}_${index}`;
                const probeText = probeItem.probe;
                
                // Lookup using probeKey (Primary) or probeText (Fallback for legacy data)
                const response = taskProbeResponses[taskKey]?.[probeKey] || 
                                 taskProbeResponses[taskKey]?.[probeText] || 
                                 {};
                                 
                // Use facilityTaskIds mapping (probeKey or probeText), or fallback to _id stored in response
                // The response._id is set when parsing server data and contains the facilityTask document _id
                const facilityTaskIdByProbeKey = facilityTaskIds[`${taskKey}_${probeKey}`];
                const facilityTaskIdByProbeText = facilityTaskIds[`${taskKey}_${probeText}`];
                const facilityTaskIdFromResponse = response._id;
                
                const facilityTaskId = facilityTaskIdByProbeKey || facilityTaskIdByProbeText || facilityTaskIdFromResponse;
                
                

                const entry = {
                  mandatorytaskId: task._id,
                  mandatorytaskTitle: task.name,
                  mandatorytaskDescription: task.description,
                  probe: probeText,
                  status: response.status || "Not Started",
                  fTag: response.fTag || probeItem.fTag, // Use response fTag if available (AI), else default
                  citation: response.citation || "", 
                  compliant: response.compliant, // Can be null, true, false
                  explanation: response.explanation || "",
                  citationNote: response.citationNote || "",
                  timestamp: response.timestamp || new Date().toISOString(),
                  aiAnalyzed: response.aiAnalyzed || false,
                  originalFTag: probeItem.fTag,
                  note: response.note || "",
                  surveyId: surveyId,
                  // Team member: use their own ID
                  // Team lead: use the assigned team member's ID (so they can see the data)
                  teamMemberUserId: checkIfInvitedUser() 
                    ? currentUserId 
                    : getAssignedTeamMemberForTask(taskKey),
                  observation: observations // Include all observations for this task
                };

                // Include facilityTaskId for updates (only passed when updating existing records)
                if (facilityTaskId) {
                  entry.facilityTaskId = facilityTaskId;
                }

                facilityTasksArray.push(entry);
             });
          });
        }

        // Fallback for tasks without probes (e.g. only observations)
        if (!hasProbes && observations.length > 0) {
             const entry = {
              mandatorytaskId: task._id,
              mandatorytaskTitle: task.name,
              mandatorytaskDescription: task.description,
              probe: "Observation Only", // Placeholder
              status: "Not Started",
              fTag: "",
              compliant: true,
              timestamp: new Date().toISOString(),
              surveyId: surveyId,
              // Team member: use their own ID
              // Team lead: use the assigned team member's ID (so they can see the data)
              teamMemberUserId: checkIfInvitedUser() 
                ? currentUserId 
                : getAssignedTeamMemberForTask(taskKey),
              observation: observations
            };
             // Check if we have an ID for this placeholder
             const facilityTaskId = facilityTaskIds[`${taskKey}_Observation Only`];
             if (facilityTaskId) {
               entry.facilityTaskId = facilityTaskId;
             }
             facilityTasksArray.push(entry);
        }
      });

      
      const submissionTimestamp = new Date().toISOString();
      lastSubmissionTimestampRef.current = submissionTimestamp;
      
      // Build payload - team members don't need the status field
      const isTeamMember = checkIfInvitedUser();
      const payload = isTeamMember 
        ? {
            surveyId: surveyId,
            facilityTasks: facilityTasksArray
          }
        : {
            surveyId: surveyId,
            status: "facility-tasks",
            facilityTasks: facilityTasksArray
          };

      
      // Log team member assignments for debugging
      if (!isTeamMember) {
        const taskAssignments = facilityTasksArray.map(ft => ({
          taskId: ft.mandatorytaskId,
          probe: ft.probe?.substring(0, 30) + '...',
          teamMemberUserId: ft.teamMemberUserId
        }));
        
      }

      // Save local state to IndexedDB first (ensure data persistence)
      await saveSurveyStepData(surveyId, 7, surveyData);

      // Use API to save facility tasks
      try {
        const isOnline = navigator.onLine;
        let response = null;
        let apiError = null;

        if (isOnline) { 
          try {
            // Use the appropriate endpoint based on user type
            if (isTeamMember) {
              
              response = await api.resource.saveTeamMemberMandatoryTask(payload);
            } else {
             
              response = await api.resource.saveMandatoryAndUpdate(payload);
            }
            
          } catch (err) {
           
            apiError = err;
          }
        }
        
        // Check for success - API may return { success: true } or just { data: ..., message: "..." }
        // A successful response will have data or a success message containing "Successfully"
        const isSuccess = response && (response.success || 
                          response.data || 
                          (response.message && response.message.toLowerCase().includes('success')));
        
        if (isSuccess) {
          // Clear unsaved changes after successful save
          clearUnsavedChanges('all');

          // Update facilityTaskIds with returned IDs so subsequent saves are treated as updates
          if (response.data) {
            let returnedTasks = [];
            
            // Handle various possible response structures
            if (response.data.facilityTasks?.facilityTasks && Array.isArray(response.data.facilityTasks.facilityTasks)) {
                returnedTasks = response.data.facilityTasks.facilityTasks;
            } else if (response.data.facilityTasks && Array.isArray(response.data.facilityTasks)) {
                returnedTasks = response.data.facilityTasks;
            } else if (response.data.facilityTask && Array.isArray(response.data.facilityTask)) {
                // Handle API response with "facilityTask" (singular) field
                returnedTasks = response.data.facilityTask;
            } else if (Array.isArray(response.data)) {
                returnedTasks = response.data;
            }

            if (returnedTasks.length > 0) {
               // Update the raw API data store for child components
               setFacilityTasksFromAPI(returnedTasks);
               
               const newIds = {};
               const newTeamMemberMap = {};
               
               returnedTasks.forEach(item => {
                 // Check for mandatorytaskId to ensure it's a valid task entry
                 // Support both _id and facilityTaskId as the identifier
                 const taskId = item._id || item.facilityTaskId;
                 
                 if (item.mandatorytaskId && item.probe && taskId) {
                    // Handle both populated object and ID string
                    const taskKey = typeof item.mandatorytaskId === 'object' && item.mandatorytaskId !== null
                      ? item.mandatorytaskId._id
                      : item.mandatorytaskId;
                    
                    const probeText = item.probe;
                    
                    // Store by probe text which is one of the lookup keys used during submission
                    newIds[`${taskKey}_${probeText}`] = taskId;
                    
                    // Extract teamMemberUserId from response
                    if (item.teamMemberUserId && !newTeamMemberMap[taskKey]) {
                      const teamMemberUserId = typeof item.teamMemberUserId === 'object'
                        ? item.teamMemberUserId._id
                        : item.teamMemberUserId;
                      if (teamMemberUserId) {
                        newTeamMemberMap[taskKey] = teamMemberUserId;
                      }
                    }
                    
                    // Also find and store by probeKey (categoryKey_index) for consistent lookups
                    const taskDef = mandatoryTasksFromAPI[taskKey];
                    if (taskDef && taskDef.probeList) {
                      const normalizedProbeText = (probeText || '').trim().toLowerCase();
                      Object.entries(taskDef.probeList).forEach(([catKey, catData]) => {
                        const items = Array.isArray(catData) ? catData : (catData?.items || []);
                        let idx = items.findIndex(p => p.probe === probeText);
                        if (idx === -1) {
                          idx = items.findIndex(p => (p.probe || '').trim().toLowerCase() === normalizedProbeText);
                        }
                        if (idx !== -1) {
                          const probeKey = `${catKey}_${idx}`;
                          newIds[`${taskKey}_${probeKey}`] = taskId;
                        }
                      });
                    }
                 }
               });
               
              
               
               if (Object.keys(newIds).length > 0) {
                 setFacilityTaskIds(prev => ({ ...prev, ...newIds }));
               }
               
               // Update taskToTeamMemberMap with any new mappings from response
               if (Object.keys(newTeamMemberMap).length > 0) {
                
                 setTaskToTeamMemberMap(prev => ({ ...prev, ...newTeamMemberMap }));
               }
            }
          }

          toast.success("Facility tasks saved successfully!");
          
          // Navigate to next step if continue was clicked
          if (isContinueClicked) {
            setTimeout(() => {
              setCurrentStep(8); // Navigate to Team Meetings (next step)
              setIsContinueClicked(false);
            }, 500);
          }
        } else {
          // API returned an error response or we're offline
          
          // Check if we're online and got an error response from the server
          if (isOnline && response && (response.status === false || response.success === false)) {
            // Server returned an error - show the server's error message
            const serverErrorMessage = response.message || "An error occurred while saving facility tasks.";
            toast.error(serverErrorMessage, {
              position: "top-right",
              duration: 5000,
            });
            // Don't queue for offline sync - this is a server validation error
            return;
          }
          
          // Check if there was an API error with a message
          if (isOnline && apiError) {
            // Check if the error has a response with a message
            const errorMessage = apiError.response?.data?.message || 
                                 apiError.message || 
                                 "An error occurred while saving facility tasks.";
            toast.error(errorMessage, {
              position: "top-right",
              duration: 5000,
            });
            // Don't queue for offline sync - this is a server error
            return;
          }
          
          // Offline - Queue for sync
          const apiMethod = 'resource';
          const apiEndpoint = checkIfInvitedUser() ? 'saveTeamMemberMandatoryTask' : 'saveMandatoryAndUpdate';
           
          const syncData = {
             ...payload,
             apiMethod,
             apiEndpoint,
             submittedAt: new Date().toISOString()
          };
           
          await surveyIndexedDB.addToSyncQueue(surveyId, `facility_tasks_${Date.now()}`, syncData, 'api_facility_tasks');
           
          // Trigger sync service (will run when online)
          surveySyncService.syncOfflineData();
           
          toast.success("Facility tasks saved offline. Will sync when online.");
           
          // Clear unsaved changes
          clearUnsavedChanges('all');
           
          // Navigate to next step if continue was clicked
          if (isContinueClicked) {
             setTimeout(() => {
               setCurrentStep(8); // Navigate to Team Meetings (next step)
               setIsContinueClicked(false);
             }, 500);
          }
        }
      } catch (error) {
        // Check if we're online - if so, show the actual error
        if (navigator.onLine) {
          const errorMessage = error.response?.data?.message || 
                               error.message || 
                               "An error occurred while saving facility tasks.";
          toast.error(errorMessage, {
            position: "top-right",
            duration: 5000,
          });
        } else {
          // Offline - show generic network error
          toast.error("Failed to save facility tasks. Please check your internet connection and try again.", {
            position: "top-right",
            duration: 5000,
          });
        }
      }
    } catch (error) {
      // Stop loading on error
      toast.dismiss();
      const errorMessage = error.response?.data?.message || 
                           error.message || 
                           "Failed to submit facility tasks.";
      toast.error(errorMessage, {
        duration: 5000,
        position: "top-right",
      });
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };
 

  const renderVaccinationSamples = (taskKey) => {
    if (taskKey !== "infectionControl") return null;

    const samples =
      surveyData?.facilityTasks?.vaccinationSamples?.[taskKey] ||
      surveyData?.vaccinationSamples?.[taskKey] ||
      [];
    const sampleCounts = visibleTasks[taskKey]?.sampleRequirements;

    return (
      <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-4">
        <h5 className="text-sm font-semibold text-gray-900 mb-3">
          Vaccination Samples
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-700">
              {samples.filter((s) => s.type === "staff").length}/
              {sampleCounts.staff}
            </div>
            <div className="text-xs text-gray-600">Staff</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-700">
              {samples.filter((s) => s.type === "tbp").length}/
              {sampleCounts.tbpResidents}
            </div>
            <div className="text-xs text-gray-600">TBP Residents</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-700">
              {samples.filter((s) => s.type === "vaccine").length}/
              {sampleCounts.vaccines}
            </div>
            <div className="text-xs text-gray-600">Vaccines</div>
          </div>
        </div>

        <div className="space-y-2">
          {samples.map((sample, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white rounded-lg p-2 gap-2"
            >
              <span className="text-xs sm:text-sm text-gray-800 break-words">
                Resident {sample.residentId} - {sample.reason}
              </span>
              <button
                onClick={() => handleVaccinationSampleRemove(taskKey, index)}
                className="text-gray-500 hover:text-gray-700 text-xs sm:text-sm self-start sm:self-auto"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-col sm:flex-row flex-wrap gap-2">
          <input
            type="text"
            placeholder="Resident ID"
            className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            id={`resident-${taskKey}`}
            disabled={isPageClosed || isSurveyClosed}
          />
          <input
            type="text"
            placeholder="Reason"
            className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            id={`reason-${taskKey}`}
            disabled={isPageClosed || isSurveyClosed}
          />
          <select
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm"
            id={`type-${taskKey}`}
            disabled={isPageClosed || isSurveyClosed}
          >
            <option value="staff">Staff</option>
            <option value="tbp">TBP Resident</option>
            <option value="vaccine">Vaccine</option>
          </select>
          <button
            onClick={() => {
              const residentId = document.getElementById(
                `resident-${taskKey}`
              ).value;
              const reason = document.getElementById(`reason-${taskKey}`).value;
              const type = document.getElementById(`type-${taskKey}`).value;
              if (residentId && reason) {
                handleVaccinationSampleAdd(taskKey, residentId, reason, type);
                document.getElementById(`resident-${taskKey}`).value = "";
                document.getElementById(`reason-${taskKey}`).value = "";
              }
            }}
            disabled={isPageClosed || isSurveyClosed}
            className="w-full sm:w-auto px-4 py-2 bg-[#075b7d] text-white rounded-lg text-sm hover:bg-[#075b7d]"
          >
            Add
          </button>
        </div>
      </div>
    );
  };

  const renderMedErrorTracking = (taskKey) => {
    if (taskKey !== "medAdmin") return null;

    const errors =
      surveyData?.facilityTasks?.medErrors?.[taskKey] ||
      surveyData?.medErrors?.[taskKey] ||
      [];
    const opportunities =
      surveyData?.facilityTasks?.medOpportunities?.[taskKey] ||
      surveyData?.medOpportunities?.[taskKey] ||
      0;
    const errorRate = getErrorRate(taskKey);
    const totalErrorRate = getTotalErrorRate();

    return (
      <div className="bg-gray-50 rounded-xl p-3 sm:p-4 mb-4">
        <h5 className="text-sm font-semibold text-gray-900 mb-3">
          Medication Error Tracking
        </h5>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-700">
              {opportunities}
            </div>
            <div className="text-xs text-gray-600">Opportunities</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-700">
              {errors.length}
            </div>
            <div className="text-xs text-gray-600">Errors</div>
          </div>
        </div>

        <div className="mb-3">
          <label className="text-sm text-gray-800 mr-2">
            Mark as Completed:
          </label>
          <input
            type="number"
            min="0"
            value={opportunities}
            onChange={(e) => {
              const updatedOpportunities = {
                ...(surveyData?.facilityTasks?.medOpportunities ||
                  surveyData?.medOpportunities ||
                  {}),
                [taskKey]: parseInt(e.target.value) || 0,
              };
              handleSurveyDataChange("medOpportunities", updatedOpportunities);
            }}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>

        <div className="text-sm text-gray-800 mb-3">
          <strong>Error Rate:</strong> {errorRate.toFixed(1)}%
          {totalErrorRate >= 5 && (
            <div className="mt-1 text-gray-600 font-semibold">
              ⚠️ Total Error Rate: {totalErrorRate.toFixed(1)}% (≥5% threshold
              exceeded)
            </div>
          )}
        </div>

        <div className="space-y-2">
          {errors.map((error, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-2 text-sm text-gray-800"
            >
              {error.description} - {new Date(error.date).toLocaleDateString()}
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Error description"
            className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            id={`error-${taskKey}`}
            disabled={isPageClosed || isSurveyClosed}
          />
          <button
            onClick={() => {
              const description = document.getElementById(
                `error-${taskKey}`
              ).value;
              if (description) {
                handleMedErrorAdd(taskKey, { description });
                document.getElementById(`error-${taskKey}`).value = "";
              }
            }}
            disabled={isPageClosed || isSurveyClosed}
            className="w-full sm:w-auto px-4 py-2 bg-[#075b7d] text-white rounded-lg text-sm hover:bg-[#075b7d]"
          >
            Add Error
          </button>
        </div>
      </div>
    );
  };

  const renderSpecialNotes = (taskKey) => {
    const task = visibleTasks[taskKey];
    if (!task || !task.specialNote) return null;

    return (
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <h5 className="text-sm font-semibold text-gray-900 mb-2">
          Special Note
        </h5>
        <p className="text-sm text-gray-800">
          {task.specialNote}
        </p>
      </div>
    );
  };

  // Handler for observation checkboxes
  const handleObservationCheck = (taskKey, category, index, checked) => {
    const observationKey = `${category}_obs_${index}`;
    
    // Mark as unsaved
    markAsUnsaved(taskKey, observationKey);

    const currentObservations =
      surveyData?.facilityTasks?.taskObservationChecks ||
      surveyData?.taskObservationChecks ||
      {};
    const currentTaskObservations = currentObservations[taskKey] || {};
    
    const updatedObservations = {
      ...currentTaskObservations,
      [observationKey]: checked,
    };

    const updatedTaskObservations = {
      ...currentObservations,
      [taskKey]: updatedObservations,
    };

    // For team leads, also update team member payloads
    if (!checkIfInvitedUser()) {
      // Update the nested structure properly
      const updatedFacilityTasks = {
        ...surveyData?.facilityTasks,
        taskObservationChecks: updatedTaskObservations,
      };
      handleSurveyDataChange("facilityTasks", updatedFacilityTasks);

      // Update team member payloads for assigned tasks
      const existingTeamMemberPayload =
        surveyData?.facilityTasks?.teamMemberPayload ||
        surveyData?.teamMemberPayload ||
        [];

      const updatedTeamMemberPayload = existingTeamMemberPayload.map(
        (submission) => {
          if (
            submission.assignedTasks &&
            submission.assignedTasks.includes(taskKey)
          ) {
            return {
              ...submission,
              taskObservationChecks: {
                ...submission.taskObservationChecks,
                [taskKey]: updatedObservations,
              },
              lastUpdatedBy: currentUser._id,
              lastUpdatedAt: new Date().toISOString(),
            };
          }
          return submission;
        }
      );

      // Update team member payload in the nested structure
      const updatedFacilityTasksWithPayload = {
        ...updatedFacilityTasks,
        teamMemberPayload: updatedTeamMemberPayload,
      };
      handleSurveyDataChange(
        "facilityTasks",
        updatedFacilityTasksWithPayload
      );
    } else {
      // For invited users, just update their own data
      const updatedFacilityTasks = {
        ...surveyData?.facilityTasks,
        taskObservationChecks: updatedTaskObservations,
      };
      handleSurveyDataChange("facilityTasks", updatedFacilityTasks);
    }
  };

  // Handler for observation section notes (with debouncing)
  const handleObservationNoteChange = (taskKey, categoryKey, note) => {
    const fullKey = `${taskKey}_${categoryKey}`;
    
    // Mark this key as dirty (locally edited) so we use local state instead of server data
    dirtyObservationNotesRef.current[fullKey] = true;
    
    // Update local state immediately for responsive UI
    setLocalObservationNotes(prev => ({
      ...prev,
      [fullKey]: note,
    }));
    
    // Clear existing debounce timer
    if (observationNotesDebounceRef.current[fullKey]) {
      clearTimeout(observationNotesDebounceRef.current[fullKey]);
    }
    
    // Set new debounce timer
    observationNotesDebounceRef.current[fullKey] = setTimeout(() => {
      handleObservationNote(taskKey, categoryKey, note);
      delete observationNotesDebounceRef.current[fullKey];
    }, 500); // 500ms delay
  };

  // Handler for observation section notes (actual save)
  const handleObservationNote = (taskKey, categoryKey, note) => {
    // Mark as unsaved
    markAsUnsaved(taskKey, categoryKey);

    const currentNotes =
      surveyData?.facilityTasks?.taskObservationNotes ||
      surveyData?.taskObservationNotes ||
      {};
    const currentTaskNotes = currentNotes[taskKey] || {};
    
    const updatedTaskNotes = {
      ...currentTaskNotes,
      [categoryKey]: note,
    };

    const updatedNotes = {
      ...currentNotes,
      [taskKey]: updatedTaskNotes,
    };

    // For team leads, also update team member payloads
    if (!checkIfInvitedUser()) {
      // Update the nested structure properly
      const updatedFacilityTasks = {
        ...surveyData?.facilityTasks,
        taskObservationNotes: updatedNotes,
      };
      handleSurveyDataChange("facilityTasks", updatedFacilityTasks);

      // Update team member payloads for assigned tasks
      const existingTeamMemberPayload =
        surveyData?.facilityTasks?.teamMemberPayload ||
        surveyData?.teamMemberPayload ||
        [];

      const updatedTeamMemberPayload = existingTeamMemberPayload.map(
        (submission) => {
          if (
            submission.assignedTasks &&
            submission.assignedTasks.includes(taskKey)
          ) {
            return {
              ...submission,
              taskObservationNotes: {
                ...submission.taskObservationNotes,
                [taskKey]: updatedTaskNotes,
              },
              lastUpdatedBy: currentUser._id,
              lastUpdatedAt: new Date().toISOString(),
            };
          }
          return submission;
        }
      );

      // Update team member payload in the nested structure
      const updatedFacilityTasksWithPayload = {
        ...updatedFacilityTasks,
        teamMemberPayload: updatedTeamMemberPayload,
      };
      handleSurveyDataChange(
        "facilityTasks",
        updatedFacilityTasksWithPayload
      );
    } else {
      // For invited users, just update their own data
      const updatedFacilityTasks = {
        ...surveyData?.facilityTasks,
        taskObservationNotes: updatedNotes,
      };
      handleSurveyDataChange("facilityTasks", updatedFacilityTasks);
    }
  };

  // Render observations as checkboxes
  const renderObservationsList = (taskKey) => {
    const task = visibleTasks[taskKey];
    if (!task || !task.observationsList) return null;

    const observationChecks =
      surveyData?.facilityTasks?.taskObservationChecks?.[taskKey] ||
      surveyData?.taskObservationChecks?.[taskKey] ||
      {};

    const observationNotes =
      surveyData?.facilityTasks?.taskObservationNotes?.[taskKey] ||
      surveyData?.taskObservationNotes?.[taskKey] ||
      {};

    return (
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <h5 className="text-sm font-semibold text-gray-900 mb-3">
          Observations
        </h5>

        <div className="space-y-4">
          {Object.entries(task.observationsList).map(([categoryKey, categoryData]) => {
            // Handle both new structure (object with name/items) and old structure (array)
            const categoryName = categoryData?.name || categoryKey;
            const observations = Array.isArray(categoryData)
              ? categoryData
              : (categoryData?.items || []);
            
            const sectionNote = observationNotes[categoryKey] || "";
            
            return (
            <div
              key={categoryKey}
              className="border border-gray-200 rounded-lg p-3 bg-white"
            >
              <h6 className="font-medium text-gray-900 mb-2">
                {categoryName}
              </h6>
              <div className="space-y-2 mb-3">
                {observations.map((item, index) => {
                  const observationKey = `${categoryKey}_obs_${index}`;
                  const isChecked = observationChecks[observationKey] || false;
                  
                  return (
                    <div key={index} className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          handleObservationCheck(taskKey, categoryKey, index, e.target.checked)
                        }
                        disabled={isPageClosed || isSurveyClosed}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-[#075b7d] focus:ring-offset-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <label className="text-xs text-gray-700 flex-1 cursor-pointer">
                        {item.observation}
                      </label>
                      {item.fTag && (
                        <Badge
                          variant="outline"
                          className="text-xs border-gray-300 text-gray-700"
                        >
                          {item.fTag}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Note field for this section */}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                  Notes for {categoryName}
                </label>
                <textarea
                  key={`obs-note-${taskKey}-${categoryKey}`}
                  value={
                    // For dirty keys (locally edited), use local state
                    // For non-dirty keys, use server data (sectionNote) to enable real-time sync
                    dirtyObservationNotesRef.current[`${taskKey}_${categoryKey}`]
                      ? (localObservationNotes[`${taskKey}_${categoryKey}`] ?? "")
                      : (sectionNote ?? "")
                  }
                  onChange={(e) => handleObservationNoteChange(taskKey, categoryKey, e.target.value)}
                  disabled={isPageClosed || isSurveyClosed}
                  placeholder="Add notes for this section..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
            );
          })}
        </div>
      </div>
    );
  };



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
              {sectionData[6].title}
            </h2>
            {isPageClosed && (
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className="text-red-600 border-green-600"
                >
                  Page Closed by Team Lead
                </Badge>
              </div>
            )}
          </div>
         
        </div>
        <p className="text-gray-500 text-sm leading-tight max-w-5xl">
          {sectionData[6].description}
        </p>
          <button
              onClick={async () => {
                setIsSyncingData(true);
                await fetchFacilityTasksData(false);
                setIsSyncingData(false);
              }}
              disabled={isSyncingData || loadingMandatoryTasks}
              className="px-3 py-1.5 text-xs sm:text-sm bg-sky-800 text-white rounded-md font-medium hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 mt-6"
            >
              {isSyncingData && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSyncingData ? 'Syncing...' : 'Sync Facility Tasks'}
            </button>
      </div>

      {/* Info banner for invited users */}
      {checkIfInvitedUser() && totalTasks > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                Viewing Your Assigned Tasks
              </h3>
              <div className="mt-1 text-xs sm:text-sm text-blue-700">
                You are viewing only the {totalTasks} facility task
                {totalTasks !== 1 ? "s" : ""} assigned to you by your team
                coordinator.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No tasks message for invited users with no assignments */}
      {checkIfInvitedUser() && totalTasks === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 text-center">
          <p className="text-sm sm:text-base text-gray-700">
            You have not been assigned any facility tasks yet. Please contact
            your team coordinator.
          </p>
        </div>
      )}

      {/* 2-Panel Layout: Task List (Left - Fixed) and Content (Right - Scrollable) */}
      {totalTasks > 0 && (
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 mb-8 h-auto lg:h-[calc(100vh-250px)]">
          {/* Mobile: Task List Toggle Button */}
          <button
            onClick={() => setIsTaskListDrawerOpen(true)}
            className="lg:hidden w-full bg-gray-100 hover:bg-gray-200 rounded-lg p-3 flex items-center justify-between text-sm font-medium text-gray-700 transition-colors"
          >
            <span>Select Task</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Mobile: Task List Drawer */}
          {isTaskListDrawerOpen && (
            <>
              <div
                className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
                onClick={() => setIsTaskListDrawerOpen(false)}
              />
              <div className="lg:hidden fixed left-0 top-0 h-full w-full max-w-xs bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Select Task
                  </h3>
                  <button
                    onClick={() => setIsTaskListDrawerOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="space-y-0.5">
                    {Object.entries(visibleTasks).map(([key, task]) => {
                      const isCompleted = 
                        surveyData?.facilityTasks?.facilityTasksCompleted?.[key] ||
                        surveyData?.facilityTasksCompleted?.[key] ||
                        false;
                      const isActive = selectedTask === key;
                      const progress = getTaskProgress(key);
                      const isFullyAnswered = progress.isFullyAnswered;
                      const hasProgress = !isCompleted && progress.hasProgress;
                      
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setSelectedTask(key);
                            setIsTaskListDrawerOpen(false);
                          }}
                          className={`
                            w-full text-left px-3 py-2.5 rounded text-sm
                            transition-all cursor-pointer
                            flex items-center gap-2
                            ${
                              isActive
                                ? "bg-gray-100 text-gray-900 font-medium"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            }
                          `}
                        >
                          {isCompleted || isFullyAnswered ? (
                            <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${isCompleted ? "text-green-500" : "text-green-500"}`} />
                          ) : hasProgress ? (
                            <div className="w-3.5 h-3.5 flex-shrink-0 rounded-full border-2 border-[#075b7d] border-t-transparent animate-none" 
                                 style={{ borderTopColor: '#075b7d', opacity: 0.6 }} />
                          ) : (
                            <div className="w-3.5 h-3.5 flex-shrink-0 rounded-full border-2 border-gray-300" />
                          )}
                          <span className="truncate flex-1">{task.name}</span>
                          {hasProgress && !isCompleted && !isFullyAnswered && progress.answeredProbes > 0 && (
                            <span className="text-xs text-[#075b7d] font-medium">
                              {progress.answeredProbes}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Left Panel - Task List (Fixed, Sticky) - Hidden on mobile, shown on desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-gray-100 rounded-lg p-4 h-full overflow-y-auto sticky top-0">
              <div className="space-y-0.5">
                {Object.entries(visibleTasks).map(([key, task]) => {
                  const isCompleted = 
                    surveyData?.facilityTasks?.facilityTasksCompleted?.[key] ||
                    surveyData?.facilityTasksCompleted?.[key] ||
                    false;
                  const isActive = selectedTask === key;
                  const progress = getTaskProgress(key);
                  const isFullyAnswered = progress.isFullyAnswered;
                  const hasProgress = !isCompleted && progress.hasProgress;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedTask(key)}
                      className={`
                        w-full text-left px-3 py-2.5 rounded text-sm
                        transition-all cursor-pointer
                        flex items-center gap-2
                        ${
                          isActive
                            ? "bg-white text-gray-900 font-medium"
                            : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                        }
                      `}
                    >
                      {isCompleted || isFullyAnswered ? (
                        <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 ${isCompleted ? "text-green-500" : "text-green-500"}`} />
                      ) : hasProgress ? (
                        <div className="w-3.5 h-3.5 flex-shrink-0 rounded-full border-2 border-[#075b7d]" 
                             style={{ background: 'rgba(7, 91, 125, 0.15)' }} />
                      ) : (
                        <div className="w-3.5 h-3.5 flex-shrink-0 rounded-full border-2 border-gray-300" />
                      )}
                      <span className="truncate flex-1">{task.name}</span>
                      {hasProgress && !isCompleted && !isFullyAnswered && progress.answeredProbes > 0 && (
                        <span className="text-xs text-[#075b7d] font-medium">
                          {progress.answeredProbes}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Panel - Probe Questions (Scrollable) */}
          <div className="flex-1 overflow-y-auto lg:pr-2">
            {selectedTask && visibleTasks[selectedTask] && (() => {
              const task = visibleTasks[selectedTask];
              const key = selectedTask;
              
              return (
                <div className="space-y-6 pb-6">
                  {/* Task Header with View Checklist Button */}
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                        <h3 className="text-base sm:text-lg font-medium text-gray-900">
                          {task.name}
                        </h3>
                        {task.isMandatory === true && (
                          <span className="text-xs text-gray-500 font-normal">
                            Mandatory
                          </span>
                        )}
                        {task.isTriggered === true && (
                          <span className="text-xs text-gray-500 font-normal">
                            Triggered
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-500">{task.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setIsChecklistDrawerOpen(true)}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 flex-shrink-0 px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Checklist
                    </button>
                  </div>

                  {/* Probe Questions */}
                  <FacilityTaskProbeList
                    taskKey={key}
                    task={task}
                    surveyData={surveyData}
                    facilityTasksData={facilityTasksFromAPI}
                    isLoadingFTag={isLoadingFTag}
                    loadingProbeKey={loadingProbeKey}
                    openResponseDropdowns={openResponseDropdowns}
                    setOpenResponseDropdowns={setOpenResponseDropdowns}
                    handleProbeResponse={handleProbeResponse}
                    handleSurveyDataChange={handleSurveyDataChange}
                    isPageClosed={isPageClosed}
                    isSurveyClosed={isSurveyClosed}
                    localProbeNotes={localProbeNotes}
                    handleProbeNoteChange={handleProbeNoteChange}
                    dirtyProbeNotesRef={dirtyProbeNotesRef}
                    checkIfInvitedUser={checkIfInvitedUser}
                    currentUser={currentUser}
                  />

                  {/* Additional Sections */}
                  <div className="space-y-4">
                    {renderSpecialNotes(key)}
                   
                    {renderVaccinationSamples(key)}
                    {renderMedErrorTracking(key)}
                  </div>

                 
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Checklist Drawer */}
      {isChecklistDrawerOpen && selectedTask && visibleTasks[selectedTask] && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setIsChecklistDrawerOpen(false)}
          />
          
          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-gray-900">
                Observations Checklist
              </h3>
              <button
                onClick={() => setIsChecklistDrawerOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              {renderObservationsList(selectedTask)}
            </div>
          </div>
        </>
      )}

      {/* Floating Save Button */}
      <div className="fixed bottom-[100px]  right-6 z-40 flex flex-col items-end gap-2">
       
        <Button
          onClick={() => {
            handleFacilityTasksSubmit(false);
            setIsContinueClicked(false);
          }}
          disabled={isSubmitting || isSurveyClosed}
          className="h-11 sm:h-12 px-4 sm:px-6 bg-[#075b7d] hover:bg-[#075b7d] text-white text-sm sm:text-base font-medium disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full shadow-lg flex items-center gap-2 hover:shadow-xl transition-all"
          size="lg"
          title="Save your progress without navigating away"
        >
          {isSubmitting  ? (
            <>
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
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
      {isInvitedUser() ? (
        <div className="fixed bottom-6 right-6 z-40 flex gap-4">
          <Button
            onClick={() => {
              if (hasUnsavedChanges) {
                setPendingNavigation({ type: 'step', target: 6 });
                setShowExitWarning(true);
              } else {
                setCurrentStep(6);
              }
            }}
            className="h-12 px-8 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium rounded-full shadow-lg flex items-center gap-2 hover:shadow-xl transition-all"
            size="lg"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </Button>
          <Button
            onClick={() => {
              handleFacilityTasksSubmit(true);
              setIsContinueClicked(true);
            }} 
            disabled={isSubmitting || isSurveyClosed}
            className="h-12 px-8 bg-[#075b7d] hover:bg-[#075b7d] text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full shadow-lg flex items-center gap-2 hover:shadow-xl transition-all"
            size="lg"
          >
            {isSubmitting  ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-40 flex gap-2 sm:gap-4">
          <Button
            onClick={() => {
              if (hasUnsavedChanges) {
                setPendingNavigation({ type: 'step', target: 6 });
                setShowExitWarning(true);
              } else {
                setCurrentStep(6);
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
              handleFacilityTasksSubmit(true);
              setIsContinueClicked(true);
            }}
            disabled={isSubmitting || isSurveyClosed}
            className="flex-1 sm:flex-none h-11 sm:h-12 px-4 sm:px-8 bg-[#075b7d] hover:bg-[#075b7d] text-white text-sm sm:text-base font-medium disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span className="hidden sm:inline">Submitting...</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Submit & Continue to Team Meetings</span>
                <span className="sm:hidden">Continue</span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Unsaved Changes Options Modal */}
      <UnsavedChangesOptionsModal
        open={unsavedChangesModalOpen}
        onOpenChange={setUnsavedChangesModalOpen}
        onKeepChanges={handleKeepUnsavedChanges}
        onFetchServerData={handleFetchServerData}
        changesCount={pendingUnsavedChangesCount}
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
          // Save changes before navigating
          await handleFacilityTasksSubmit(false);
          setShowExitWarning(false);
          if (pendingNavigation?.type === 'browser') {
            window.history.back();
          } else if (pendingNavigation?.type === 'step') {
            setCurrentStep(pendingNavigation.target);
          }
          setPendingNavigation(null);
        }}
      />

      {/* Floating Home Button */}
      <FloatingHomeButton
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={() => handleFacilityTasksSubmit(false)}
        onClearUnsavedChanges={() => setUnsavedChanges({})}
      />
    </div>
  );
};

export default FacilityTasks;
