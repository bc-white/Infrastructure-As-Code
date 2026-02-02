import React, { useCallback } from "react";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { DatePicker } from "../../components/ui/date-picker";
import { ChevronRight, FileText, Lock, ChevronLeft, Save, Mail, Plus, Trash2, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useBeforeUnload } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import api from "../../service/api";
import surveyIndexedDB from "../../utils/surveyIndexedDB";
import surveySyncService from "../../utils/surveySyncService";
import useSurveyStore from "../../stores/useSurveyStore";
import UnsavedChangesModal from "../../components/UnsavedChangesModal";
import FloatingHomeButton from "../../components/FloatingHomeButton";
import { useBrowserNavigationBlocker } from "../../hooks/useBrowserNavigationBlocker";
import useSurveyAccess from "../../hooks/useSurveyAccess";

const SurveyClosure = ({
  sectionData,
  surveyData,
  setCurrentStep,
  canContinueFromStep,
  handleSurveyDataChange,
  isInvitedUser: isInvitedUserProp = () => false,
}) => {
  // Get current survey ID for access check
  const currentSurveyId = surveyData?.surveyId || surveyData?.id || surveyData?._id || localStorage.getItem("currentSurveyId");
  
  // Use the survey access hook to determine user access type
  const { isInvitedUser: isInvitedUserFromHook, isLoading: isAccessLoading } = useSurveyAccess(currentSurveyId);
  
  // Use hook-based isInvitedUser, fall back to prop if hook is still loading
  const isInvitedUser = isAccessLoading ? isInvitedUserProp : isInvitedUserFromHook;

  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const persistedSurveyClosed = React.useMemo(
    () =>
      Boolean(
        surveyData?.surveyClosureSurvey?.surveyCompleted ||
          surveyData?.surveyCompleted ||
          (surveyData?.surveyClosureSurvey?.surveyClosed &&
            surveyData?.surveyClosureSurvey?.closedAt)
      ),
    [
      surveyData?.surveyClosureSurvey?.surveyCompleted,
      surveyData?.surveyCompleted,
      surveyData?.surveyClosureSurvey?.surveyClosed,
      surveyData?.surveyClosureSurvey?.closedAt,
    ]
  );

  const [draftSurveyClosed, setDraftSurveyClosed] = React.useState(() => {
    if (surveyData?.surveyClosed !== undefined) {
      return surveyData?.surveyClosed;
    }
    return surveyData?.surveyClosureSurvey?.surveyClosed || false;
  });

  React.useEffect(() => {
    if (surveyData?.surveyClosed !== undefined) {
      setDraftSurveyClosed(surveyData?.surveyClosed);
    } else {
      setDraftSurveyClosed(
        surveyData?.surveyClosureSurvey?.surveyClosed || false
      );
    }
  }, [surveyData?.surveyClosed, surveyData?.surveyClosureSurvey?.surveyClosed]);

  // Email/Report State
  const [showEmailModal, setShowEmailModal] = React.useState(false);
  const [reports, setReports] = React.useState([]);
  const [newReportName, setNewReportName] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef(null);

  const [emailForm, setEmailForm] = React.useState({
    recipient: "",
    subject: "Survey Closure Reports & Findings",
    message: `Dear Team,

Please find attached the comprehensive reports and findings from our recent mock survey.

These documents include:
- Detailed analysis of survey results
- Identified areas for improvement
- Compliance status updates

Please review these materials at your earliest convenience.

Best regards,
Mock Survey 365 Team`
  });

  // Update email content with facility details when available
  React.useEffect(() => {
    if (surveyData?.facilityName) {
      const facilityName = surveyData.facilityName;
      const surveyDate = surveyData.surveyCreationDate ? new Date(surveyData.surveyCreationDate).toLocaleDateString() : 'recent';
      
      setEmailForm(prev => {
        // Only update if it's still the default message to avoid overwriting user edits
        if (prev.message.includes("recent mock survey") || prev.message === "Please find the attached survey reports.") {
             return {
                ...prev,
                subject: `Survey Closure Reports - ${facilityName}`,
                message: `Dear Team,

Please find attached the comprehensive reports and findings from the mock survey conducted at ${facilityName} (Date: ${surveyDate}).

These documents include:
- Detailed analysis of survey results
- Identified areas for improvement
- Compliance status updates

Please review these materials at your earliest convenience.

Best regards,
Mock Survey 365 Team`
             };
        }
        return prev;
      });
    }
  }, [surveyData?.facilityName, surveyData?.surveyCreationDate]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Auto-populate name if empty
      if (!newReportName) {
        setNewReportName(file.name);
      }
    }
  };

  const handleAddReport = async () => {
    if (!newReportName.trim()) {
        toast.error("Please enter a report name");
        return;
    }

    if (selectedFile) {
        // Upload file first
        setIsUploading(true);
        const loadingToast = toast.loading("Uploading file...");
        
        try {
            const response = await api.user.uploadFile(selectedFile);
            
            toast.dismiss(loadingToast);
            
            // Handle specific API response format: { status: true, statusCode: 200, data: "url_string" }
            if (response && (response.statusCode === 200 || response.status === true) && response.data) {
                const fileUrl = response.data;
                
                if (!fileUrl) {
                    throw new Error("No file URL returned from server");
                }

                setReports([...reports, { 
                    id: Date.now(), 
                    name: newReportName, 
                    url: fileUrl,
                    fileName: selectedFile.name
                }]);
                
                setNewReportName("");
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                toast.success("Report Uploaded & Added");
            } else {
                throw new Error(response?.message || "Upload failed");
            }
        } catch (error) {
            toast.dismiss(loadingToast);
           
            toast.error("Failed to upload file: " + (error.message || "Unknown error"));
        } finally {
            setIsUploading(false);
        }
    } else {
        // Just add as text reference (legacy behavior or if no file needed)
        setReports([...reports, { id: Date.now(), name: newReportName }]);
        setNewReportName("");
        toast.success("Report Added");
    }
  };

  const handleRemoveReport = (id) => {
    setReports(reports.filter(r => r.id !== id));
    toast.success("Report Removed");
  };

  const handleSendEmail = async () => {
    if (!emailForm.recipient || !emailForm.subject || !emailForm.message) {
        toast.error("Missing Information", {
            description: "Please fill in all required fields.",
            position: 'top-right'
        });
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailForm.recipient)) {
        toast.error("Invalid Email", {
            description: "Please enter a valid email address.",
            position: 'top-right'
        });
        return;
    }

    const loadingToast = toast.loading("Sending email...", { position: 'top-right'});

    try {
        // Format message with reports list
        let finalMessage = (emailForm.message || "").replace(/\n/g, '<br>');
        
        if (reports.length > 0) {
            finalMessage += "<br><br><strong>Included Reports:</strong><br>";
            reports.forEach(report => {
                if (report.url) {
                    // Use explicit download link text to ensure visibility
                    finalMessage += `• ${report.name} - <a href="${report.url}" target="_blank" style="color: blue; text-decoration: underline; font-weight: bold;">Download File</a><br>`;
                } else {
                    finalMessage += `• ${report.name}<br>`;
                }
            });
        }

        const response = await api.survey.requestEmail({
            to: emailForm.recipient,
            subject: emailForm.subject,
            message: finalMessage,
            surveyId: surveyData._id || localStorage.getItem("currentSurveyId")
        });

        toast.dismiss(loadingToast);

        if (response && (response.status === 200 || response.status === 201 || response.statusCode === 200 || response.status === true || response.success)) {
            toast.success("Email Sent Successfully!", {
                description: `Reports sent to ${emailForm.recipient}`,
                duration: 3000,
                position: 'top-right'
            });
            setShowEmailModal(false);
            setReports([]); // Clear attached reports on success
            // Reset form but keep reports? Or clear? Let's keep reports.
            // Don't reset message to simple string to preserve dynamic template
            // setEmailForm(prev => ({ ...prev, message: "Please find the attached survey reports." }));
        } else {
            throw new Error(response?.message || "Failed to send email");
        }
    } catch (error) {
        toast.dismiss(loadingToast);
       
        toast.error("Failed to Send Email", {
            description: error.message || "An error occurred while sending the email.",
            duration: 4000,
            position: 'top-right'
        });
    }
  };

  // Track unsaved changes for local buffer strategy
  const [unsavedChanges, setUnsavedChanges] = React.useState({});
  const unsavedChangesRef = React.useRef({});
  const surveyDataRef = React.useRef(surveyData);
  const handleSurveyDataChangeRef = React.useRef(handleSurveyDataChange);

  // Sync refs
  React.useEffect(() => {
    unsavedChangesRef.current = unsavedChanges;
  }, [unsavedChanges]);

  React.useEffect(() => {
    surveyDataRef.current = surveyData;
  }, [surveyData]);

  React.useEffect(() => {
    handleSurveyDataChangeRef.current = handleSurveyDataChange;
  }, [handleSurveyDataChange]);

  // State for navigation blocking modal
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = React.useState(false);
  const [pendingNavigation, setPendingNavigation] = React.useState(null);

  // Check if there are unsaved changes
  const hasUnsavedChanges = Object.keys(unsavedChanges).length > 0;
  const hasUnsavedChangesRef = React.useRef(false);

  // Sync hasUnsavedChangesRef with state
  React.useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

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

  // Wrapper for data changes to track unsaved state
  const onDataChange = React.useCallback((key, value) => {
    setUnsavedChanges(prev => ({ ...prev, [key]: true }));
    handleSurveyDataChange(key, value);
  }, [handleSurveyDataChange]);

  // Helper to merge server data with local data intelligently
  const mergeSurveyClosureData = (serverData, localData, unsavedMap) => {
    if (!serverData) return localData;
    if (!localData) return serverData;

    const merged = { ...serverData };

    // If we have unsaved changes, override server data with local data
    Object.keys(unsavedMap).forEach((key) => {
      if (unsavedMap[key]) {
        // Map flat keys to object structure if needed, but here we mostly sync the whole object or specific fields
        // The unsavedMap keys correspond to what we pass to handleSurveyDataChange
        // If we update "closureNotes", it might be on root or inside surveyClosureSurvey
        // This is a bit tricky because handleSurveyDataChange updates root or nested based on implementation
        // But here we are merging into "surveyClosureSurvey" object.
        
        // If the key exists in the local data object, use it
        if (localData[key] !== undefined) {
            merged[key] = localData[key];
        }
      }
    });

    return merged;
  };

  // Fetch survey closure data
  const fetchClosureData = React.useCallback(async (isBackgroundSync = false) => {
      const currentSurveyData = surveyDataRef.current;
      const surveyId =
        currentSurveyData.surveyId ||
        currentSurveyData.id ||
        currentSurveyData._id ||
        localStorage.getItem("currentSurveyId");

      if (!surveyId) return;

      try {
        const response = await api.survey.viewSurveyClosure(surveyId);
        if (
          response &&
          (response.statusCode === 200 || response.success) &&
          response.data
        ) {
          // Extract the closure data from the response array
          const serverClosureData = response.data.closing?.[0];
          
          if (serverClosureData) {
            const currentClosureData = currentSurveyData.surveyClosureSurvey || {};
            

            
            // Let's construct a "local view" of the closure data from surveyData
            const localView = {
                ...currentClosureData,
                closureNotes: currentSurveyData.closureNotes !== undefined ? currentSurveyData.closureNotes : currentClosureData.closureNotes,
                closureSignature: currentSurveyData.closureSignature || currentClosureData.closureSignature,
                surveyClosed: currentSurveyData.surveyClosed !== undefined ? currentSurveyData.surveyClosed : currentClosureData.surveyClosed,
            };

            const mergedData = mergeSurveyClosureData(
                serverClosureData,
                localView,
                unsavedChangesRef.current
            );
            
            // Update surveyData with the fetched/merged closure data
            // We update the container object "surveyClosureSurvey"
            if (JSON.stringify(mergedData) !== JSON.stringify(currentClosureData)) {
                handleSurveyDataChangeRef.current("surveyClosureSurvey", mergedData);
            }
            
            // Also update local state if needed and NOT unsaved
            if (!unsavedChangesRef.current["surveyClosed"] && mergedData.surveyClosed !== undefined) {
              setDraftSurveyClosed(mergedData.surveyClosed);
            }
          }
        }
      } catch (error) {
        // console.error("Failed to fetch survey closure data", error);
      }
  }, []);

  React.useEffect(() => {
    // Initial fetch
    fetchClosureData(false);
  }, [fetchClosureData]);

  const isSurveyClosed = persistedSurveyClosed;

  // Helper functions to get current values (prioritize flattened structure)
  const getSurveyClosed = React.useCallback(
    () => draftSurveyClosed,
    [draftSurveyClosed]
  );

  const getClosureNotes = () => {
    return (
      surveyData?.closureNotes !== undefined
        ? surveyData?.closureNotes
        : surveyData?.surveyClosureSurvey?.closureNotes
    ) || "";
  };

  const getClosureSignature = () => {
    return (
      surveyData?.closureSignature ||
      surveyData?.surveyClosureSurvey?.closureSignature || {
        signedBy: "",
        title: "",
        signedDate: "",
        confirmed: false,
      }
    );
  };

  // Handle save and return to dashboard
  const handleSaveAndReturn = async (isContinueClicked = false) => {
    const surveyId =
      surveyData.surveyId ||
      surveyData.id ||
      surveyData._id ||
      localStorage.getItem("currentSurveyId");

    if (!surveyId) {
      toast.error("Survey ID not found. Please refresh and try again.", {
        position: "top-right",
      });
      return;
    }

    if (isSurveyClosed) {
      toast.error("Survey is already closed. Please refresh and try again.", {
        position: "top-right",
      });
      return;
    }

    // Only validate signature fields if closing the survey
    if (getSurveyClosed()) {
      if (!getClosureSignature().signedBy || !getClosureSignature().title) {
        toast.error("Please complete all signature fields", {
          description: "Signed By and Title are required to close the survey.",
          position: "top-right",
        });
        return;
      }

      if (!getClosureSignature().signedDate) {
        toast.error("Please select a signature date", {
          position: "top-right",
        });
        return;
      }

      if (!getClosureSignature().confirmed) {
        toast.error("Please confirm that all survey activities have been completed", {
          position: "top-right",
        });
        return;
      }
    }

    setIsSubmitting(true);
    const loadingToast = isContinueClicked && toast.loading("Completing survey closure...", {
      position: "top-right",
    });

    try {
      // Prepare payload for Survey Closure endpoint
      const payload = {
        surveyId,
        status: "survey-closure",
        surveyClosed: getSurveyClosed(),
        closureNotes: getClosureNotes(),
        closureSignature: getClosureSignature(),
        surveyCompleted: getSurveyClosed() && getClosureSignature().confirmed,
      };

      // Check if online before making API call
      if (!navigator.onLine) {
        // Save offline and inform user
        const saveOfflineData = async (payload) => {
          try {
            const offlineData = {
              ...payload,
              apiEndpoint: "submitSurveyClosure", // Store which API to call
              apiMethod: "survey", // Store API method/namespace
            };

            // Step 1: Save to IndexedDB sync queue (permanent storage)
            let syncQueueId = null;
            if (payload.surveyId || surveyId) {
              const stepId = "survey-closure";
              const syncItem = await surveyIndexedDB.addToSyncQueue(
                payload.surveyId || surveyId,
                stepId,
                offlineData,
                "api_survey_closure" // type for API-based survey closure
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
        toast.dismiss(loadingToast);
        toast.success("Internet connectivity issues detected. Data saved offline and will sync when connection is restored.", {
          position: "top-right",
          duration: 5000,
        });
        setUnsavedChanges({}); // Clear unsaved changes
        setIsSubmitting(false);
        return; // Exit early - data is saved offline
      }

      // Submit the step data using Survey Closure endpoint
      const response = await api.survey.submitSurveyClosure(payload);

      if (response.status || response.success) {
        toast.dismiss(loadingToast);
        setUnsavedChanges({}); // Clear unsaved changes
        
        if (isContinueClicked) {
          toast.success("Survey closure saved successfully!", {
            description: "Moving to Resources & Help...",
            position: "top-right",
          });
          // Navigate to next step
          setCurrentStep(13);
        } else {
          toast.success("Progress saved successfully!", {
            position: "top-right",
            duration: 3000,
          });
        }
      } else {
        throw new Error(response.message || "Failed to save survey closure");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(
        error.message || "Failed to save survey closure. Please try again.",
        { position: "top-right" }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-2">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
            {sectionData[11].title}
          </h2>
          {isSurveyClosed && (
            <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300 self-start sm:self-auto">
              <Lock className="w-3 h-3 mr-1" />
              Survey Closed
            </Badge>
          )}
        </div>
        <p className="text-gray-500 text-xs sm:text-sm leading-tight">
          {sectionData[11].description}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Left Column - Survey Closure */}
        <div className="space-y-4 sm:space-y-6">
        

          {/* Closure Notes */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              Closure Notes
            </h3>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Final Survey Notes
                </Label>
                <textarea
                  disabled={isInvitedUser() || isSurveyClosed}
                  value={getClosureNotes()}
                  onChange={(e) =>
                    onDataChange("closureNotes", e.target.value)
                  }
                  placeholder="Enter any final notes or observations about the survey..."
                  rows="4"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Reports & Distribution */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
             
              Reports & Distribution
            </h3>

            <p className="text-sm text-gray-500 mb-4">
              Upload and attach survey reports here. These files will be included as download links in the email.
            </p>

            <div className="space-y-4">
              {/* Add Report Section */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Add New Report
                </Label>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2 items-start">
                     {/* File Select Button */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        id="report-file-upload"
                    />
                    <Button
                        variant="outline"
                        className="shrink-0 bg-white"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isInvitedUser() || isSurveyClosed || isUploading}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        {selectedFile ? "Change File" : "Select File"}
                    </Button>
                    
                    {/* Name Input */}
                    <div className="flex-1">
                        <Input
                            value={newReportName}
                            onChange={(e) => setNewReportName(e.target.value)}
                            placeholder="Report Name (e.g. Facility Report)"
                            className="w-full bg-white"
                            disabled={isInvitedUser() || isSurveyClosed || isUploading}
                            onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddReport();
                            }
                            }}
                        />
                    </div>

                    {/* Add Button */}
                    <Button
                        onClick={handleAddReport}
                        disabled={!newReportName.trim() || isInvitedUser() || isSurveyClosed || isUploading}
                        className="bg-[#075b7d] hover:bg-[#064b69] shrink-0"
                    >
                        {isUploading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                            <Plus className="w-4 h-4" />
                        )}
                    </Button>
                  </div>
                  
                  {/* Selected File Indicator */}
                  {selectedFile && (
                      <div className="text-xs text-[#075b7d] flex items-center bg-blue-50 p-2 rounded border border-blue-100">
                          <FileText className="w-3 h-3 mr-2" />
                          <span className="font-medium">Ready to upload:</span>
                          <span className="ml-1 truncate">{selectedFile.name}</span>
                      </div>
                  )}
                </div>
              </div>

              {/* Reports List */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 block">
                  Attached Reports ({reports.length})
                </Label>
                
                {reports.length > 0 ? (
                  <div className="space-y-2">
                    {reports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200  hover:border-[#075b7d]/30 transition-colors">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                             <FileText className="w-4 h-4 text-[#075b7d]" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm text-gray-900 font-medium truncate">{report.name}</span>
                            {report.url && (
                                <a href={report.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#075b7d] hover:underline truncate flex items-center">
                                    View Document
                                </a>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleRemoveReport(report.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                          disabled={isInvitedUser() || isSurveyClosed}
                        > 
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50/50">
                    <div className="mx-auto h-10 w-10 text-gray-300 mb-2">
                        <FileText className="w-full h-full" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">No reports attached yet</p>
                    <p className="text-xs text-gray-400 mt-1">Add reports above to include them in the email</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <Button
                  onClick={() => setShowEmailModal(true)}
                  className="w-full bg-[#075b7d] hover:bg-[#064b69] text-white h-11"
                  disabled={isInvitedUser() || reports.length === 0}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Reports ({reports.length})
                </Button>
                {reports.length === 0 && (
                    <p className="text-xs text-center text-amber-600 mt-2">
                        Please attach at least one report to send an email.
                    </p>
                )}
              </div>
            </div>
          </div>

          {/* Survey Closure */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
              Survey Closure
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Close Survey</span>
                <button
                  disabled={isInvitedUser() || isSurveyClosed}
                  onClick={() => {
                    const nextValue = !draftSurveyClosed;
                    setDraftSurveyClosed(nextValue);
                    onDataChange("surveyClosed", nextValue);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    draftSurveyClosed ? "bg-green-600" : "bg-gray-200"
                  } ${isSurveyClosed ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      draftSurveyClosed ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {draftSurveyClosed && (
                <div className="p-3 bg-gray-10 border border-gray-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <div className="text-xs text-gray-800">
                      <p className="font-medium">Survey Closed Successfully</p>
                      <p>This survey has been marked as complete and closed</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Closure Signature & Next Steps */}
        <div className="space-y-4 sm:space-y-6">
          {/* Closure Signature */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              Closure Signature
            </h3>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Signed By
                </Label>
                <input
                  disabled={isInvitedUser() || isSurveyClosed}
                  type="text"
                  value={getClosureSignature().signedBy || ""}
                  onChange={(e) =>
                    onDataChange("closureSignature", {
                      ...getClosureSignature(),
                      signedBy: e.target.value,
                    })
                  } 
                  placeholder="Enter name of person closing survey..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Title/Position
                </Label>
                <input
                  disabled={isInvitedUser() || isSurveyClosed}
                  type="text"
                  value={getClosureSignature().title || ""}
                  onChange={(e) =>
                    onDataChange("closureSignature", {
                      ...getClosureSignature(),
                      title: e.target.value,
                    })
                  }
                  placeholder="Enter title or position..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Signature Date
                </Label>
                <DatePicker
                  date={
                    getClosureSignature().signedDate
                      ? new Date(getClosureSignature().signedDate)
                      : null
                  }
                  onSelect={(date) =>
                    onDataChange("closureSignature", {
                      ...getClosureSignature(),
                      signedDate: date ? date.toISOString() : "",
                    })
                  }
                  disabled={isInvitedUser() || isSurveyClosed}
                  placeholder="Select signature date"
                  className="w-full"
                />
              </div>

              <div className="flex items-start gap-2 sm:gap-3 pt-2">
                <input
                  type="checkbox"
                  id="confirmSignature"
                  checked={getClosureSignature().confirmed || false}
                  onChange={(e) => {
                    onDataChange("closureSignature", {
                      ...getClosureSignature(),
                      confirmed: e.target.checked,
                    });
                  }}
                  disabled={isInvitedUser() || isSurveyClosed}
                  className="w-4 h-4 mt-0.5 text-[#075b7d] border-gray-300 rounded focus:ring-[#075b7d] flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <label
                  htmlFor="confirmSignature"
                  className={`text-xs sm:text-sm text-gray-700 leading-relaxed ${isSurveyClosed ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  I confirm that all survey activities have been completed and
                  documented
                </label>
              </div>

              {getClosureSignature().confirmed && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <div className="text-xs text-green-800">
                      <p className="font-medium">Signature Confirmed</p>
                      <p>Survey closure has been officially signed</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        
        </div>
      </div>

      {/* Floating Save Button */}
      {!isInvitedUser() && (
        <div className="fixed bottom-[100px]  right-6 z-40 flex flex-col items-end gap-2">
          <Button
            onClick={() => handleSaveAndReturn(false)}
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

      {/* Navigation Buttons */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-40 flex gap-2 sm:gap-4">
        <Button
          onClick={() => {
            if (hasUnsavedChanges) {
              setShowUnsavedChangesModal(true);
              setPendingNavigation(() => () => setCurrentStep(11));
            } else {
              setCurrentStep(11);
            }
          }}
          variant="outline"
          className="flex-1 sm:flex-none shadow-lg bg-white hover:bg-gray-50 text-gray-700 border-gray-200 rounded-full px-4 sm:px-6 h-11 sm:h-12 text-sm sm:text-base"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        <Button
          onClick={() => {
            if (isInvitedUser() || isSurveyClosed) {
              setCurrentStep(13);
            } else {
              handleSaveAndReturn(true);
            }
          }}
          disabled={isSubmitting}
          className="flex-1 sm:flex-none shadow-lg bg-[#075b7d] hover:bg-[#064d63] text-white rounded-full px-4 sm:px-6 h-11 sm:h-12 text-sm sm:text-base"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              <span className="hidden sm:inline">Saving...</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline">{isInvitedUser() ? "Next" : "Continue to Resources & Help"}</span>
              <span className="sm:hidden">{isInvitedUser() ? "Next" : "Continue"}</span>
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
      {/* Email Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Email Reports</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Email</Label>
              <Input
                id="recipient"
                placeholder="Enter email address"
                value={emailForm.recipient}
                onChange={(e) => setEmailForm({ ...emailForm, recipient: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Email subject"
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message..."
                value={emailForm.message}
                onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                rows={12}
              />
            </div>
            {reports.length > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">Attached Reports:</p>
                    <ul className="text-xs text-gray-600 list-disc list-inside">
                        {reports.map(r => (
                            <li key={r.id}>{r.name}</li>
                        ))}
                    </ul>
                </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} className="bg-[#075b7d] hover:bg-[#064b69] text-white">
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        open={showUnsavedChangesModal}
        onOpenChange={setShowUnsavedChangesModal}
        onCancel={() => {
          setShowUnsavedChangesModal(false);
          setPendingNavigation(null);
        }}
        onConfirm={async () => {
          await handleSaveAndReturn(false);
          setShowUnsavedChangesModal(false);
          if (pendingNavigation) {
            pendingNavigation();
            setPendingNavigation(null);
          }
        }}
      />

      {/* Floating Home Button */}
      <FloatingHomeButton
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={() => handleSaveAndReturn(false)}
        onClearUnsavedChanges={() => setUnsavedChanges({})}
      />
    </div>
  );
};

export default SurveyClosure;
