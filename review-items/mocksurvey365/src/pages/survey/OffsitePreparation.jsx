import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { cn } from "../../lib/utils";
import { useState, useEffect, useCallback, useRef } from "react";
import FloatingHomeButton from "../../components/FloatingHomeButton";
import { useBeforeUnload } from "react-router-dom";
import api from "../../service/api";
import surveyIndexedDB from "../../utils/surveyIndexedDB";
import surveySyncService from "../../utils/surveySyncService";
import useSurveyStore from "../../stores/useSurveyStore";
import { toast } from "sonner";
import UnsavedChangesModal from "../../components/UnsavedChangesModal";
import { useBrowserNavigationBlocker } from "../../hooks/useBrowserNavigationBlocker";
import useSurveyAccess from "../../hooks/useSurveyAccess";

import {
    CheckSquare,
    Clock,
    Shield,
    FileText,
    Eye,
    Download,
    ChevronLeft,
    Lock,
    ArrowRight,
    Mail,
    Check,
    ChevronsUpDown,
    X
  } from "lucide-react"; 


// Helper function to normalize checklist item (handle both enhanced and raw structures)
const normalizeChecklistItem = (item) => {
    if (!item) {
        return { completed: false, notCompleted: false, timestamp: null, notCompletedTimestamp: null, files: [], otherItem: "", notes: "" };
    }
    // If timestamp exists, user has checked something
    // completed: true means "Received" was checked
    // completed: false with timestamp means "Not Received" was checked
    // No timestamp means nothing was checked yet
    const hasTimestamp = item.timestamp != null && item.timestamp !== "";
    const isCompleted = hasTimestamp && item.completed === true; // "Received" checked
    const isNotCompleted = hasTimestamp && item.completed === false; // "Not Received" checked
    
    return {
        completed: isCompleted,
        notCompleted: isNotCompleted,
        timestamp: item.timestamp || null,
        notCompletedTimestamp: item.notCompletedTimestamp || null,
        files: item.files || [],
        otherItem: item.otherItem || "",
        notes: item.notes || "",
        _id: item._id,
        offsiteChecklistId: item.offsiteChecklistId || item._id
    };
};

const OffsitePreparation = ({
    sectionData,
    surveyData,
    setCurrentStep,
    canContinueFromStep,
    handlePreparationTaskComplete,
    handleOfflineToggle,
    handleOfflineStatusUpdate,
    setShowOfflineGuide,
    setShowResourceLauncher,
    isInvitedUser: isInvitedUserProp = () => false,
    handleTaskAssignment,
    setShowTeamModal,
    handleDownloadResource,
    handleRequestRequirement,
    handleMarkReceived,
    handleMarkNotReceived,
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
    const isSurveyClosed =
        surveyData?.surveyClosed ||
        surveyData?.surveyClosureSurvey?.surveyClosed ||
        surveyData?.surveyClosureSurvey?.surveyCompleted ||
        surveyData?.surveyCompleted ||
        false;

    // API call states
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Email Request State
    const [showEmailModal, setShowEmailModal] = useState(false);
    const defaultEmailSubject = "Offsite Preparation Checklist - Document Request";
    const defaultEmailMessage = "Dear Team,\n\nPlease provide the following documents for the offsite preparation review. Your prompt attention to this matter is appreciated.\n\nThank you.";
    
    const [emailForm, setEmailForm] = useState({ 
        recipient: "", 
        subject: defaultEmailSubject, 
        message: defaultEmailMessage 
    });
    const [selectedRequirements, setSelectedRequirements] = useState([]);
    const [openCombobox, setOpenCombobox] = useState(false);

    const requirementsListItems = [
        { id: "ehr_access", label: "Access to Electronic Health Records" },
        { id: "cms_2567", label: "Copy of CMS-2567" },
        { id: "self_reports", label: "Facility Self-Reports (last 6 months)" }, 
        { id: "casper_report", label: "CASPER Report" },
        { id: "quality_measures", label: "Quality Measures" },
        { id: "risk_indicators", label: "Emergency Preparedness Plan" },
        { id: "specialist_focus", label: "Specialist Focus" },
        { id: "facility_assessment", label: "Facility assessment" },
        { id: "staffing_reports", label: "Staffing (PBJ) reports" },
        { id: "abuse_policy", label: "Policy for Abuse and Neglect" },
        { id: "qapi_plan", label: "QAPI plan & recent minutes" } ,
        {id: "671_forms", label: "671 Forms" }
    ];

    const handleSendEmail = async () => {
        if (!emailForm.recipient || !emailForm.subject || !emailForm.message) {
             toast.error("Missing Information", {
                description: "Please fill in all required fields (recipient, subject, and message)",
                position: "top-right",
            });
            return;
        }

        const loadingToast = toast.loading("Sending email request...", { position: 'top-right'});

        try {
             // Construct HTML message for better styling
             let finalMessage = (emailForm.message || "").replace(/\n/g, '<br>');
             
             // Only append documents if there are selected requirements
             if (selectedRequirements && selectedRequirements.length > 0) {
                 const itemsList = selectedRequirements
                    .map(id => {
                        const item = requirementsListItems.find(r => r.id === id);
                        // Use span for text color to ensure visibility in all email clients
                        return item ? `<li style="margin-bottom: 5px;"><span style="color: #075b7d; font-family: Arial, sans-serif; font-size: 14px;">${item.label}</span></li>` : null;
                    })
                    .filter(Boolean) // Remove any nulls if item not found
                    .join('');
                 
                 if (itemsList) {
                    // Add styled section for requested documents
                    finalMessage += `
                        <br><br>
                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-top: 16px;">
                            <h3 style="color: #075b7d; font-size: 16px; font-weight: bold; margin-top: 0; margin-bottom: 12px; font-family: Arial, sans-serif;">Requested Documents:</h3>
                            <ul style="padding-left: 20px; margin: 0; list-style-type: disc;">
                                ${itemsList}
                            </ul>
                        </div>
                    `;
                 }
             }

            const response = await api.survey.requestEmail({
                to: emailForm.recipient,
                subject: emailForm.subject,
                message: finalMessage,
            });

            if (response.statusCode === 200 || response.statusCode === 201) {
                 // Mark selected as requested
                 if (handleRequestRequirement) {
                     selectedRequirements.forEach(id => {
                         handleRequestRequirement(id, new Date().toISOString());
                     });
                 }

                toast.dismiss(loadingToast);
                toast.success("Email Sent Successfully!", {
                    description: `Request sent to ${emailForm.recipient}`,
                    position: "top-right",
                });
                setShowEmailModal(false);
                setEmailForm({ recipient: "", subject: defaultEmailSubject, message: defaultEmailMessage });
                setSelectedRequirements([]);
            } else {
                throw new Error(response.message || "Failed to send email request");
            }
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error("Failed to send email", { description: error.message, position: 'top-right' });
        }
    };
    
    // State to track which resource category was selected
    const [selectedResourceCategory, setSelectedResourceCategory] = useState(null);
    
    // Handle resource category selection with toast notification
    const handleResourceCategoryClick = (category) => {
        setSelectedResourceCategory(category);
        toast.info(`Opening ${category} resources...`, { position: 'top-right'});
        // Pass the selected category to parent component for modal display
        if (setShowResourceLauncher) {
            setShowResourceLauncher(true, category);
        }
    };
    

    
    // Local state for managing checkboxes and file uploads
    const [offsiteChecklist, setOffsiteChecklist] = useState(() => {
        const defaultItem = { completed: false, notCompleted: false, timestamp: null, notCompletedTimestamp: null, files: [], otherItem: "", notes: "" };
        return Array.from({ length: 7 }, () => defaultItem);
    });

    const [preSurveyRequirements, setPreSurveyRequirements] = useState({});
    const [isLoadingData, setIsLoadingData] = useState(true);

    useEffect(() => {
        const fetchOffsiteData = async () => {
            const surveyId = localStorage.getItem('currentSurveyId');
            if (!surveyId) return;

            try {
                setIsLoadingData(true);
                const response = await api.survey.getOffsitePreSurvey(surveyId);
                
                const data = response.data || response; 

                if (data) {
                    // Update Checklist
                    // Handle both casing variations from API (offsiteCheckList vs offsiteChecklist)
                    const fetchedChecklist = data.offsiteCheckList || data.offsiteChecklist || [];
                    const defaultItem = { completed: false, notCompleted: false, timestamp: null, notCompletedTimestamp: null, files: [], otherItem: "", notes: "" };
                    
                    const normalizedChecklist = Array.from({ length: 7 }, (_, index) => {
                        // Find all items with this taskIndex
                        const matchingItems = fetchedChecklist.filter(item => item.taskIndex === index);
                        // Prioritize items that have completed=true or have a timestamp
                        const existingItem = matchingItems.find(item => item.completed === true || item.timestamp) || matchingItems[0];
                        return existingItem ? normalizeChecklistItem(existingItem) : defaultItem;
                    });
                    setOffsiteChecklist(normalizedChecklist);

                    // Update Requirements
                    // Handle both casing variations from API (preSurveyRequirement vs preSurveyRequirements)
                    const fetchedRequirements = data.preSurveyRequirement || data.preSurveyRequirements || [];
                    const reqMap = {};
                    if (Array.isArray(fetchedRequirements)) {
                        fetchedRequirements.forEach(req => {
                            if (req.type) {
                                reqMap[req.type] = req;
                            }
                        });
                    } else if (typeof fetchedRequirements === 'object') {
                         Object.assign(reqMap, fetchedRequirements);
                    }
                    setPreSurveyRequirements(reqMap);
                }
            } catch (error) {
               // Handle fetch error (optional toast can be added)
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchOffsiteData();
    }, []);





    // Calculate completion progress based on preSurveyRequirements
    const requirementsList = [
        "ehr_access", "cms_2567", "671_forms", "self_reports", "casper_report", 
        "quality_measures", "risk_indicators", "specialist_focus"
    ];
    
    const completedTasks = requirementsList.filter(reqId => 
        preSurveyRequirements?.[reqId]?.received || offsiteChecklist.find((item, index) => index < 4 && item.completed)
    ).length;
    
    const totalTasks = requirementsList.length;
    const progressPercentage = Math.round((completedTasks / totalTasks) * 100);

    // Handle offsite preparation submission with API
    const handleOffsiteSubmit = async (isContinueClicked = true) => {
        const surveyId = localStorage.getItem('currentSurveyId');
        
    
        
        if (!surveyId) {
            toast.error("Survey ID not found. Please start from the beginning.", {
               position: 'top-right'
            });
            setIsSubmitting(false);
            return;
        }

        // Validate that at least some tasks are completed
        if (completedTasks === 0) {
            toast.warning("Please complete at least one preparation task before proceeding.", {
               position: 'top-right'
            });
            setIsSubmitting(false);
            return;
        }

        setIsSubmitting(true);
        isContinueClicked && toast.loading("Saving offsite preparation data...", {
          position: 'top-right'
        });

        try {
            // Define task names array for checklist items (7 items matching API)
            const taskNames = [
                "Access to Electronic Health Records",
                "CASPER & QM reports (last 6 months)",
                "Facility assessment",
                "Staffing (PBJ) reports",
                "Policy for Abuse and Neglect",
                "QAPI plan & recent minutes",
                "Other"
            ];

            // Prepare preSurveyRequirements array for API
            const preSurveyRequirementsArray = requirementsList.map(reqId => {
                const req = preSurveyRequirements?.[reqId] || {};
                return {
                    preSurveyRequirementId: req.preSurveyRequirementId || req._id,
                    type: reqId,
                    requested: req.requested || false,
                    received: req.received || false,
                    notReceived: req.notReceived || false,
                    requestTimestamp: req.requestTimestamp || null,
                    receivedTimestamp: req.receivedTimestamp || null,
                    notReceivedTimestamp: req.notReceivedTimestamp || null,
                    notes: req.notes || ""
                };
            });

            // Prepare offsiteChecklist array matching API structure
            const offsiteChecklistArray = offsiteChecklist.map((item, index) => {
                // completed is true only if user checked "Received" (not "Not Received")
                const isCompleted = item?.completed || false;
                
                const baseItem = {
                    offsiteChecklistId: item?.offsiteChecklistId || item?._id,
                    taskName: taskNames[index],
                    taskIndex: index,
                    completed: isCompleted,
                    timestamp: item?.timestamp || null, // Timestamp is set for both Received and Not Received
                    description: index === 6 ? (item?.otherItem || "") : taskNames[index],
                    notes: item?.notes || ""
                };

                // Only include files and otherItem for the "Other" item (index 6)
                if (index === 6) {
                    baseItem.files = item?.files || [];
                    baseItem.otherItem = item?.otherItem || "";
                }

                return baseItem;
            });

            // Prepare the offsite preparation payload with separate arrays
            const offsitePayload = {
                surveyId,
                status: 'offsite-preparation',
                preSurveyRequirements: preSurveyRequirementsArray,
                offsiteChecklist: offsiteChecklistArray
            };

            // Check if online before making API call
            if (!navigator.onLine) {
                // Save offline and inform user
                const saveOfflineData = async (payload) => {
                    try {
                        const offlineData = {
                            ...payload,
                            submittedAt: new Date().toISOString(),
                            apiEndpoint: "submitOffsitePreSurvey", // Store which API to call
                            apiMethod: "survey", // Store API method/namespace
                        };

                        // Step 1: Save to IndexedDB sync queue (permanent storage)
                        let syncQueueId = null;
                        if (surveyId) {
                            const stepId = "offsite-preparation";
                            const syncItem = await surveyIndexedDB.addToSyncQueue(
                                surveyId,
                                stepId,
                                offlineData,
                                "api_offsite_preparation" // type for API-based offsite preparation
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
                            surveySyncService.syncUnsyncedData(surveyId).catch(
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

                await saveOfflineData(offsitePayload);
                toast.dismiss();
                toast.success("Internet connectivity issues detected. Data saved offline and will sync when connection is restored.", {
                    position: "top-right",
                    duration: 5000,
                });
                setIsSubmitting(false);
                return; // Exit early - data is saved offline
            }

            // Submit the step data (only if online)
            const response = await api.survey.submitOffsitePreSurvey(offsitePayload);

            if (response) {
                setHasUnsavedChanges(false);
                if (isContinueClicked) {
                    toast.dismiss();
                    toast.success(`Offsite preparation saved successfully! Moving to next step...`, { position: 'top-right', duration: 5000});
                    // Move to next step
                    setCurrentStep(3);
                } else {
                    toast.success("Progress saved successfully!", { position: 'top-right', duration: 3000 });
                }
            }

        } catch (error) {
            toast.dismiss();
            toast.error(error.message || "Failed to save offsite preparation. Please try again.", { position: 'top-right'});
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleNext = () => {
        if (hasUnsavedChanges) {
            setPendingNavigation({ type: 'step', target: 3 });
            setShowExitWarning(true);
        } else {
            setCurrentStep(3);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 sm:pb-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                {sectionData[1].title}
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm leading-tight">{sectionData[1].description}</p>
            </div>
           
          </div>
          {isSurveyClosed && (
              <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300 mt-4">
                <Lock className="w-3 h-3 mr-1" />
                Survey Closed
              </Badge>
            )}
        </div>
  
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
            <CheckSquare className="w-5 h-5 text-[#075b7d] mr-2" />
            Offsite Preparation Tasks
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-6">
            Complete the following requirements and checklist items before the survey begins.
          </p>

            <div className="flex items-center justify-start mb-3">
                 <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-xs gap-2"
                    onClick={() => setShowEmailModal(true)}
                    disabled={isInvitedUser() || isSurveyClosed}
                  >
                    <Mail className="w-3 h-3" />
                    Email Request for Documents
                  </Button>
              </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Pre-Survey Requirements Column */}
            <div>
            
              <div className="space-y-4">
                {[
                  { id: "ehr_access", label: "Access to Electronic Health Records" },
                  { id: "cms_2567", label: "Copy of CMS-2567" },
                  { id: "671_forms", label: "671 Forms" },
                  { id: "self_reports", label: "Facility Self-Reports (last 6 months)" },
                  { id: "casper_report", label: "CASPER Report" },
                  { id: "quality_measures", label: "Quality Measures" },
                  { id: "risk_indicators", label: "Emergency Preparedness Plan" },
                  { id: "specialist_focus", label: "Specialist Focus" }
                ].map((req) => {
                  const requirement = preSurveyRequirements?.[req.id] || {};
                  const isReceived = requirement.received;
                  const isNotReceived = requirement.notReceived;

                  return (
                    <div
                      key={req.id}
                      className="p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{req.label}</span>
                        </div>
                        
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id={`received-${req.id}`}
                                    checked={isReceived || false}
                                    onChange={() => {
                                        setHasUnsavedChanges(true);
                                        const timestamp = new Date().toISOString();
                                        const newValue = !isReceived;
                                        
                                        setPreSurveyRequirements(prev => ({
                                            ...prev,
                                            [req.id]: {
                                                ...(prev[req.id] || {}),
                                                received: newValue,
                                                notReceived: newValue ? false : (prev[req.id]?.notReceived || false),
                                                receivedTimestamp: newValue ? timestamp : null,
                                                notReceivedTimestamp: newValue ? null : (prev[req.id]?.notReceivedTimestamp || null)
                                            }
                                        }));

                                        if (newValue && handleMarkReceived) {
                                            handleMarkReceived(req.id, timestamp);
                                        }
                                    }}
                                    disabled={isInvitedUser() || isSurveyClosed}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                                />
                                <label htmlFor={`received-${req.id}`} className="text-xs sm:text-sm text-gray-700 cursor-pointer">Received</label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id={`not-received-${req.id}`}
                                    checked={isNotReceived || false}
                                    onChange={() => {
                                        setHasUnsavedChanges(true);
                                        const timestamp = new Date().toISOString();
                                        const newValue = !isNotReceived;

                                        setPreSurveyRequirements(prev => ({
                                            ...prev,
                                            [req.id]: {
                                                ...(prev[req.id] || {}),
                                                notReceived: newValue,
                                                received: newValue ? false : (prev[req.id]?.received || false),
                                                receivedTimestamp: newValue ? null : (prev[req.id]?.receivedTimestamp || null),
                                                notReceivedTimestamp: newValue ? timestamp : null
                                            }
                                        }));

                                        if (newValue && handleMarkNotReceived) {
                                            handleMarkNotReceived(req.id, timestamp);
                                        }
                                    }}
                                    disabled={isInvitedUser() || isSurveyClosed}
                                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                                />
                                <label htmlFor={`not-received-${req.id}`} className={`text-xs sm:text-sm cursor-pointer ${isNotReceived ? 'text-red-600 font-medium' : 'text-gray-700'}`}>Not Received</label>
                            </div>
                        </div>
                      </div>
                      
                      {/* Notes input for Pre-Survey Requirements */}
                      <div className="mt-3">
                        <input
                          type="text"
                          placeholder="Add notes..."
                          value={requirement.notes || ""}
                          onChange={(e) => {
                            setHasUnsavedChanges(true);
                            setPreSurveyRequirements(prev => ({
                              ...prev,
                              [req.id]: {
                                ...(prev[req.id] || {}),
                                notes: e.target.value
                              }
                            }));
                          }}
                          className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isInvitedUser() || isSurveyClosed}
                        />
                      </div>
                      
                      {(requirement.requestTimestamp || requirement.receivedTimestamp || requirement.notReceivedTimestamp) && (
                        <div className="mt-2 text-xs text-gray-500 flex flex-col gap-1">
                          {requirement.requestTimestamp && (
                            <span>Requested: {new Date(requirement.requestTimestamp).toLocaleString()}</span>
                          )}
                          {requirement.receivedTimestamp && (
                            <span className="text-green-600">Received: {new Date(requirement.receivedTimestamp).toLocaleString()}</span>
                          )}
                          {requirement.notReceivedTimestamp && (
                            <span className="text-red-600">Not Received: {new Date(requirement.notReceivedTimestamp).toLocaleString()}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Offsite Preparation Checklist Column */}
            <div>
             
              <div className="space-y-4">
                {[
                  "Facility assessment",
                  "Staffing (PBJ) reports",
                  "Policy for Abuse and Neglect",
                  "QAPI plan & recent minutes"
                ].map((task, index) => {
                  const checklistItem = offsiteChecklist[index] || {};
                  const isCompleted = checklistItem.completed;
                  const isNotCompleted = checklistItem.notCompleted;
                  
                  return (
                  <div
                    key={index}
                    className="p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{task}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`received-${index}`}
                            checked={isCompleted || false}
                            onChange={() => {
                              setHasUnsavedChanges(true);
                              const timestamp = new Date().toISOString();
                              const newValue = !isCompleted;
                              const newChecklist = [...offsiteChecklist];
                              if (!newChecklist[index]) {
                                newChecklist[index] = { completed: false, notCompleted: false, timestamp: null, files: [], otherItem: "", notes: "" };
                              }
                              newChecklist[index] = {
                                ...newChecklist[index],
                                completed: newValue,
                                notCompleted: newValue ? false : newChecklist[index].notCompleted,
                                timestamp: newValue ? timestamp : null,
                                notCompletedTimestamp: newValue ? null : newChecklist[index].notCompletedTimestamp
                              };
                              setOffsiteChecklist(newChecklist);
                              
                              if (newValue) {
                                toast.success(`✓ ${task} marked as received`, { position: 'top-right' });
                              }
                              
                              if (handlePreparationTaskComplete) {
                                handlePreparationTaskComplete(`offsite_${index}`, newChecklist[index]);
                              }
                            }}
                            disabled={isInvitedUser() || isSurveyClosed}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                          />
                          <label htmlFor={`received-${index}`} className={`text-xs sm:text-sm cursor-pointer ${isCompleted ? 'text-green-600 font-medium' : 'text-gray-700'}`}>Received</label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`not-received-checklist-${index}`}
                            checked={isNotCompleted || false}
                            onChange={() => {
                              setHasUnsavedChanges(true);
                              const timestamp = new Date().toISOString();
                              const newValue = !isNotCompleted;
                              const newChecklist = [...offsiteChecklist];
                              if (!newChecklist[index]) {
                                newChecklist[index] = { completed: false, notCompleted: false, timestamp: null, files: [], otherItem: "", notes: "" };
                              }
                              newChecklist[index] = {
                                ...newChecklist[index],
                                notCompleted: newValue,
                                completed: newValue ? false : newChecklist[index].completed,
                                timestamp: newValue ? timestamp : null, // Pass timestamp when checking "Not Received"
                                notCompletedTimestamp: newValue ? timestamp : null
                              };
                              setOffsiteChecklist(newChecklist);
                              
                              if (newValue) {
                                toast.info(`${task} marked as not received`, { position: 'top-right' });
                              }
                            }}
                            disabled={isInvitedUser() || isSurveyClosed}
                            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                          />
                          <label htmlFor={`not-received-checklist-${index}`} className={`text-xs sm:text-sm cursor-pointer ${isNotCompleted ? 'text-red-600 font-medium' : 'text-gray-700'}`}>Not Received</label>
                        </div>
                      </div>
                    </div>
                    
                    {/* Notes input for Checklist item */}
                    <div className="mt-3">
                      <input
                        type="text"
                        placeholder="Add notes..."
                        value={checklistItem.notes || ""}
                        onChange={(e) => {
                          setHasUnsavedChanges(true);
                          const newChecklist = [...offsiteChecklist];
                          if (!newChecklist[index]) {
                            newChecklist[index] = { completed: false, notCompleted: false, timestamp: null, files: [], otherItem: "", notes: "" };
                          }
                          newChecklist[index] = {
                            ...newChecklist[index],
                            notes: e.target.value
                          };
                          setOffsiteChecklist(newChecklist);
                        }}
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isInvitedUser() || isSurveyClosed}
                      />
                    </div>
                    
                    {checklistItem.timestamp && (
                      <div className="mt-2 text-xs flex flex-col gap-1">
                        {isCompleted ? (
                          <span className="text-green-600">Received: {new Date(checklistItem.timestamp).toLocaleString()}</span>
                        ) : isNotCompleted ? (
                          <span className="text-red-600">Not Received: {new Date(checklistItem.timestamp).toLocaleString()}</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                  );
                })}
                
                {/* Other item with ability to type */}
                {(() => {
                  const otherItem = offsiteChecklist[4] || {};
                  const isCompleted = otherItem.completed;
                  const isNotCompleted = otherItem.notCompleted;
                  
                  return (
                <div className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">Other</span>
                      </div>
                      
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="received-other"
                            checked={isCompleted || false}
                            onChange={() => {
                              setHasUnsavedChanges(true);
                              const timestamp = new Date().toISOString();
                              const newValue = !isCompleted;
                              const newChecklist = [...offsiteChecklist];
                              if (!newChecklist[4]) {
                                newChecklist[4] = { completed: false, notCompleted: false, timestamp: null, files: [], otherItem: "", notes: "" };
                              }
                              newChecklist[4] = {
                                ...newChecklist[4],
                                completed: newValue,
                                notCompleted: newValue ? false : newChecklist[4].notCompleted,
                                timestamp: newValue ? timestamp : null,
                                notCompletedTimestamp: newValue ? null : newChecklist[4].notCompletedTimestamp
                              };
                              setOffsiteChecklist(newChecklist);
                              
                              if (newValue) {
                                toast.success(`✓ Other item marked as received`, { position: 'top-right' });
                              }
                              
                              if (handlePreparationTaskComplete) {
                                handlePreparationTaskComplete(`offsite_4`, newChecklist[4]);
                              }
                            }}
                            disabled={isInvitedUser() || isSurveyClosed}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                          />
                          <label htmlFor="received-other" className={`text-xs sm:text-sm cursor-pointer ${isCompleted ? 'text-green-600 font-medium' : 'text-gray-700'}`}>Received</label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="not-received-other"
                            checked={isNotCompleted || false}
                            onChange={() => {
                              setHasUnsavedChanges(true);
                              const timestamp = new Date().toISOString();
                              const newValue = !isNotCompleted;
                              const newChecklist = [...offsiteChecklist];
                              if (!newChecklist[4]) {
                                newChecklist[4] = { completed: false, notCompleted: false, timestamp: null, files: [], otherItem: "", notes: "" };
                              }
                              newChecklist[4] = {
                                ...newChecklist[4],
                                notCompleted: newValue,
                                completed: newValue ? false : newChecklist[4].completed,
                                timestamp: newValue ? timestamp : null, // Pass timestamp when checking "Not Received"
                                notCompletedTimestamp: newValue ? timestamp : null
                              };
                              setOffsiteChecklist(newChecklist);
                              
                              if (newValue) {
                                toast.info(`Other item marked as not received`, { position: 'top-right' });
                              }
                            }}
                            disabled={isInvitedUser() || isSurveyClosed}
                            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
                          />
                          <label htmlFor="not-received-other" className={`text-xs sm:text-sm cursor-pointer ${isNotCompleted ? 'text-red-600 font-medium' : 'text-gray-700'}`}>Not Received</label>
                        </div>
                      </div>
                    </div>
                    
                  <input
                    type="text"
                    placeholder="Specify other item to review..."
                    value={otherItem.otherItem || ""}
                    onChange={(e) => {
                      setHasUnsavedChanges(true);
                      const newChecklist = [...offsiteChecklist];
                      if (!newChecklist[4]) {
                        newChecklist[4] = { completed: false, notCompleted: false, timestamp: null, files: [], otherItem: "", notes: "" };
                      }
                      newChecklist[4] = {
                        ...newChecklist[4],
                        otherItem: e.target.value
                      };
                      setOffsiteChecklist(newChecklist);
                    }}
                    className="w-full mt-3 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isInvitedUser() || isSurveyClosed}
                  />
                  
                  {/* Notes input for Other item */}
                  <input
                    type="text"
                    placeholder="Add notes..."
                    value={otherItem.notes || ""}
                    onChange={(e) => {
                      setHasUnsavedChanges(true);
                      const newChecklist = [...offsiteChecklist];
                      if (!newChecklist[4]) {
                        newChecklist[4] = { completed: false, notCompleted: false, timestamp: null, files: [], otherItem: "", notes: "" };
                      }
                      newChecklist[4] = {
                        ...newChecklist[4],
                        notes: e.target.value
                      };
                      setOffsiteChecklist(newChecklist);
                    }}
                    className="w-full mt-2 px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isInvitedUser() || isSurveyClosed}
                  />
                  
                  {otherItem.timestamp && (
                    <div className="mt-2 text-xs flex flex-col gap-1">
                      {isCompleted ? (
                        <span className="text-green-600">Received: {new Date(otherItem.timestamp).toLocaleString()}</span>
                      ) : isNotCompleted ? (
                        <span className="text-red-600">Not Received: {new Date(otherItem.timestamp).toLocaleString()}</span>
                      ) : null}
                    </div>
                  )}
                  </div>
                  );
                })()}
              </div>
              
            </div>
          </div>
        </div>
  
        {isInvitedUser() ? (
          <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-40 flex gap-2 sm:gap-4">
             <Button
               onClick={() => {
                 if (hasUnsavedChanges) {
                   setPendingNavigation({ type: 'step', target: 1 });
                   setShowExitWarning(true);
                 } else {
                   setCurrentStep(1);
                 }
               }}
               className="flex-1 sm:flex-none min-w-0 h-11 sm:h-12 px-3 sm:px-8 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-sm sm:text-base font-medium rounded-full shadow-lg flex items-center justify-center gap-1 sm:gap-2 hover:shadow-xl transition-all"
               size="lg"
             >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1 sm:flex-none min-w-0 h-11 sm:h-12 px-3 sm:px-8 bg-[#075b7d] hover:bg-[#075b7d] text-white text-sm sm:text-base font-medium rounded-full shadow-lg flex items-center justify-center gap-1 sm:gap-2 hover:shadow-xl transition-all"
              size="lg"
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            </Button>
          </div>
        ) : (
          <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-40 flex gap-2 sm:gap-4">
            <Button
              onClick={() => {
                if (hasUnsavedChanges) {
                  setPendingNavigation({ type: 'step', target: 1 });
                  setShowExitWarning(true);
                } else {
                  setCurrentStep(1);
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
                handleOffsiteSubmit(true);
              }}
              disabled={isSubmitting || completedTasks === 0 || isInvitedUser() || isSurveyClosed}
              className="flex-1 sm:flex-none min-w-0 h-11 sm:h-12 px-3 sm:px-8 bg-[#075b7d] hover:bg-[#075b7d] text-white text-sm sm:text-base font-medium disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full shadow-lg flex items-center justify-center gap-1 sm:gap-2 hover:shadow-xl transition-all"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white flex-shrink-0"></div>
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Continue to Facility Entrance</span>
                  <span className="sm:hidden">Continue</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Floating Save Button */}
        {!isInvitedUser() && (
          <div className="fixed bottom-24 sm:bottom-[100px] right-4 sm:right-6 z-30 flex flex-col items-end gap-2">
            <Button
              onClick={() => handleOffsiteSubmit(false)}
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

        {/* Email Request Modal */}
        <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Send Document Request Email</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="recipient">Recipient Email</Label>
                        <Input
                            id="recipient"
                            value={emailForm.recipient}
                            onChange={(e) => setEmailForm({ ...emailForm, recipient: e.target.value })}
                            placeholder="Enter recipient email address"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                            id="subject"
                            value={emailForm.subject}
                            onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                            placeholder="Enter email subject"
                        />
                    </div>
                    
                    <div className="grid gap-2">
                        <Label>Requested Documents (Multi-select)</Label>
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCombobox}
                                    className="w-full justify-between"
                                >
                                    {selectedRequirements.length > 0
                                        ? `${selectedRequirements.length} documents selected`
                                        : "Select documents to request..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0">
                                <Command>
                                    <CommandInput placeholder="Search documents..." />
                                    <CommandList className="max-h-[300px] sm:max-h-[400px] overflow-y-auto">
                                        <CommandEmpty>No document found.</CommandEmpty>
                                        <CommandGroup>
                                            {requirementsListItems.map((item) => (
                                                <CommandItem
                                                    key={item.id}
                                                    value={item.label}
                                                    onSelect={() => {
                                                        setSelectedRequirements((prev) =>
                                                            prev.includes(item.id)
                                                                ? prev.filter((id) => id !== item.id)
                                                                : [...prev, item.id]
                                                        );
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedRequirements.includes(item.id)
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                        )}
                                                    /> 
                                                    {item.label}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            value={emailForm.message}
                            onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                            placeholder="Enter your message"
                            rows={8}
                        />
                    </div> 
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowEmailModal(false)}>Cancel</Button>
                    <Button onClick={handleSendEmail} className="bg-[#075b7d] hover:bg-[#075b7d] text-white">Send Request</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {isLoadingData && (
            <div className="fixed inset-0 flex items-center justify-center z-[60] backdrop-blur-sm">
                <div className="absolute inset-0 bg-black/20" />
                <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center z-10">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#075b7d] mb-4"></div>
                    <h3 className="text-lg font-semibold text-gray-900">Loading Offsite Preparation Data</h3>
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
        onConfirm={async () => {
          // Save changes before navigating
          await handleOffsiteSubmit(false);
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

      {/* Floating Home Button */}
      <FloatingHomeButton
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={() => handleOffsiteSubmit(false)}
        onClearUnsavedChanges={() => setHasUnsavedChanges(false)}
      />
      </div>
    )
};

export default OffsitePreparation;
