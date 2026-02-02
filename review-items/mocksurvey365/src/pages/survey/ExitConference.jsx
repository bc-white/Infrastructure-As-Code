import React, { useCallback } from "react";
import { useBeforeUnload } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { DatePicker } from "../../components/ui/date-picker";
import UnsavedChangesModal from "../../components/UnsavedChangesModal";
import FloatingHomeButton from "../../components/FloatingHomeButton";
import { useBrowserNavigationBlocker } from "../../hooks/useBrowserNavigationBlocker";
import useSurveyAccess from "../../hooks/useSurveyAccess";
import {
  ChevronLeft, 
  Plus,
  Edit,
  Trash2,
  X,
  Upload,
  Download,
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Shield,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
  Printer,
  FileDown,
  Star,
  Flag,
  AlertCircle,
  CheckSquare,
  Square,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  Settings,
  Save,
  Send,
  Copy,
  ExternalLink,
  Info,
  BookOpen,
  LifeBuoy,
  Zap,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../service/api";
import surveyIndexedDB from "../../utils/surveyIndexedDB";
import surveySyncService from "../../utils/surveySyncService";
import useSurveyStore from "../../stores/useSurveyStore";

const ExitConference = ({
  sectionData,
  surveyData,
  setCurrentStep,
  canContinueFromStep,
  handleSurveyDataChange,
  setShowAddExitConferenceResidentModal,
  isInvitedUser: isInvitedUserProp = () => false,
}) => {
  // Get current survey ID for access check
  const currentSurveyId = surveyData?.surveyId || surveyData?.id || surveyData?._id || localStorage.getItem("currentSurveyId");
  
  // Use the survey access hook to determine user access type
  const { isInvitedUser: isInvitedUserFromHook, isLoading: isAccessLoading } = useSurveyAccess(currentSurveyId);
  
  // Use hook-based isInvitedUser, fall back to prop if hook is still loading
  const isInvitedUser = isAccessLoading ? isInvitedUserProp : isInvitedUserFromHook;

  // Normalize the exitConference data structure
  // Handle cases where data might be nested as exitConference.exitConference
  const exitConferenceData = React.useMemo(() => {
    if (!surveyData?.exitConference) {
      return {};
    }

    // Check for double nesting: exitConference.exitConference.exitConference
    if (surveyData.exitConference.exitConference?.exitConference) {
      return surveyData.exitConference.exitConference.exitConference;
    }

    // Check for single nesting: exitConference.exitConference
    if (surveyData.exitConference.exitConference) {
      return surveyData.exitConference.exitConference;
    }

    return surveyData.exitConference;
  }, [surveyData?.exitConference]);

  // Auto-populate exit date and time on first visit
  React.useEffect(() => {
    // Only auto-populate if both are empty (first visit)
    if (!surveyData.exitDate && !surveyData.exitTime) {
      const now = new Date();
      const currentDate = now.toISOString().split("T")[0];
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

      handleSurveyDataChange("exitDate", currentDate);
      handleSurveyDataChange("exitTime", currentTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Fix nested data structure if it exists
  React.useEffect(() => {
    if (surveyData?.exitConference?.exitConference) {
      // Extract the deeply nested data
      const correctData =
        surveyData.exitConference.exitConference.exitConference ||
        surveyData.exitConference.exitConference;

      // Extract exitDate and exitTime from nested structure if they exist
      const exitDate =
        surveyData.exitDate || surveyData.exitConference.exitDate || "";
      const exitTime =
        surveyData.exitTime || surveyData.exitConference.exitTime || "";

      // Update with flattened structure
      handleSurveyDataChange("exitConference", correctData);

      if (exitDate && !surveyData.exitDate) {
        handleSurveyDataChange("exitDate", exitDate);
      }
      if (exitTime && !surveyData.exitTime) {
        handleSurveyDataChange("exitTime", exitTime);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyData?.exitConference?.exitConference]); // Only run when nesting is detected

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

  // Helper to merge server data with local data intelligently
  const mergeExitConferenceData = (serverData, localData, unsavedMap) => {
    if (!serverData) return localData;
    if (!localData) return serverData;

    const merged = { ...serverData }; // Start with server as base

    // If we have unsaved changes, override server data with local data
    Object.keys(unsavedMap).forEach((key) => {
      if (unsavedMap[key]) {
        merged[key] = localData[key];
      }
    });

    return merged;
  };

  // Fetch exit conference data with background sync support
  const fetchExitConferenceData = React.useCallback(async (isBackgroundSync = false) => {
      const currentSurveyData = surveyDataRef.current;
      const surveyId =
        currentSurveyData.surveyId ||
        currentSurveyData.id ||
        currentSurveyData._id ||
        localStorage.getItem("currentSurveyId");

      if (!surveyId) return;

      try {
        const response = await api.survey.viewExitConference(surveyId);
        if (
          response &&
          (response.statusCode === 200 || response.success) &&
          response.data
        ) {
          // Handle the specific API structure: data.existConference is an array
          const conferenceArray = response.data.existConference || response.data.exitConference;
          
          if (Array.isArray(conferenceArray) && conferenceArray.length > 0) {
            const conferenceData = conferenceArray[0];
            
            // Extract the inner exitConference object which contains attendees, outcomes, etc.
            const serverInnerData = conferenceData.exitConference || {};
            const currentInnerData = currentSurveyData.exitConference || {};

            // Merge server data with local data (respecting unsaved changes)
            const mergedInnerData = mergeExitConferenceData(
              serverInnerData, 
              currentInnerData, 
              unsavedChangesRef.current
            );
            
            // Update the main exitConference data if changed
            if (JSON.stringify(mergedInnerData) !== JSON.stringify(currentInnerData)) {
               handleSurveyDataChangeRef.current("exitConference", mergedInnerData);
            }
            
            // Update exitDate and exitTime from the outer object
            if (conferenceData.exitDate && conferenceData.exitDate !== currentSurveyData.exitDate) {
              handleSurveyDataChangeRef.current("exitDate", conferenceData.exitDate);
            }
            if (conferenceData.exitTime && conferenceData.exitTime !== currentSurveyData.exitTime) {
              handleSurveyDataChangeRef.current("exitTime", conferenceData.exitTime);
            }
          } else {
             // Fallback for other potential structures
             const fetchedData = response.data.exitConference || response.data;
             if (fetchedData && !Array.isArray(fetchedData)) {
                 const currentInnerData = currentSurveyData.exitConference || {};
                 const mergedInnerData = mergeExitConferenceData(
                    fetchedData, 
                    currentInnerData, 
                    unsavedChangesRef.current
                 );
                 if (JSON.stringify(mergedInnerData) !== JSON.stringify(currentInnerData)) {
                    handleSurveyDataChangeRef.current("exitConference", mergedInnerData);
                 }
             }
          }
        }
      } catch (error) {
        // console.error("Error fetching exit conference data:", error);
      }
  }, []); // Empty dependency array - uses refs for all dependencies

  // Initial fetch - runs only once on mount
  React.useEffect(() => {
    fetchExitConferenceData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Email preview modal state
  const [showEmailPreview, setShowEmailPreview] = React.useState(false);
  const [emailPreviewData, setEmailPreviewData] = React.useState(null);
  const [isContinueClicked, setIsContinueClicked] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Navigation blocking state
  const [showExitWarning, setShowExitWarning] = React.useState(false);
  const [pendingNavigation, setPendingNavigation] = React.useState(null);

  // Check if there are unsaved changes
  const hasUnsavedChanges = Object.keys(unsavedChanges).length > 0;
  const hasUnsavedChangesRef = React.useRef(false);

  // Sync hasUnsavedChangesRef with state
  React.useEffect(() => {
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
  const isSurveyClosed = surveyData?.surveyClosed || 
                         surveyData?.surveyClosureSurvey?.surveyClosed || 
                         surveyData?.surveyClosureSurvey?.surveyCompleted ||
                         surveyData?.surveyCompleted || false;

  // Document attachment state
  const [attachedDocument, setAttachedDocument] = React.useState(null);
  const fileInputRef = React.useRef(null);

  // Helper function to update exitConference data
  const updateExitConference = React.useCallback(
    (updates) => {
      // Mark updated fields as unsaved
      setUnsavedChanges(prev => {
          const newUnsaved = { ...prev };
          Object.keys(updates).forEach(key => {
              newUnsaved[key] = true;
          });
          return newUnsaved;
      });

      handleSurveyDataChange("exitConference", {
        ...exitConferenceData,
        ...updates,
      });
    },
    [exitConferenceData, handleSurveyDataChange]
  );

  // Auto-generate talking points based on survey findings
  const generateTalkingPoints = (data) => {
    // Return the standard exit conference talking points structure
    return [
      {
        category: "Opening Remarks",
        summary: "Thank the facility leadership and staff for their participation and cooperation during the mock survey.",
        keyPoints: [
          "Thank the facility leadership and staff for their participation and cooperation during the mock survey.",
          "Emphasize that this process is non-punitive and designed to support regulatory compliance, continuous quality improvement, and readiness for the official state or federal survey.",
        ],
        recommendations:
          "Set a positive, collaborative tone for the exit conference.",
      },
      {
        category: "Overview of the Mock Survey Process",
        summary: "Summarize the mock survey's scope and findings.",
        keyPoints: [
          "Summarize the mock survey's scope (dates, units/areas observed, number of records reviewed, and staff/residents interviewed).",
          "Reiterate that findings reflect a snapshot in time and that opportunities for improvement are intended to guide quality and compliance efforts.",
        ],
        recommendations:
          "Provide context for the findings that will be discussed.",
      },
      {
        category: "Strengths and Positive Observations",
        summary: "Highlight specific strengths identified during the mock survey.",
        keyPoints: [
          "Staff engagement and responsiveness.",
          "Clean, well-maintained environment.",
          "Consistent infection control practices.",
          "Effective leadership presence and communication.",
          "Reinforce that these areas reflect strong facility culture and should be sustained.",
        ],
        recommendations:
          "Reinforce positive practices and encourage continued excellence in these areas.",
      },
      {
        category: "Opportunities for Improvement",
        summary: "Frame findings as opportunities for improvement, not deficiencies. Reference corresponding F-Tags where applicable.",
        keyPoints: [
          "F684 – Quality of Care: Clarify consistent implementation of individualized care plans.",
          "F689 – Accidents and Supervision: Review rounding and resident supervision protocols.",
          "F812 – Food Safety: Ensure food storage temperatures and labeling meet standards.",
          "F880 – Infection Control: Reinforce hand hygiene monitoring during resident care.",
          "For each area:",
          "  • Briefly describe the observation or documentation gap.",
          "  • Discuss the regulatory expectation.",
          "  • Suggest potential corrective action or system improvement.",
        ],
        recommendations:
          "Focus on educational opportunities and system improvements rather than punitive measures.",
      },
      {
        category: "Next Steps and Plan of Correction Guidance",
        summary: "Encourage the team to use findings to develop or update a Plan of Correction (POC) with the five CMS-required elements.",
        keyPoints: [
          "Corrective action for residents affected.",
          "Identification of others potentially affected.",
          "Systemic changes or policy updates.",
          "Monitoring and QAPI tracking.",
          "Responsible person and completion date.",
          "Recommend prioritizing any potential G-level or immediate jeopardy risks first.",
        ],
        recommendations:
          "Ensure facility understands the POC requirements and has resources to develop a comprehensive plan.",
      },
      {
        category: "QAPI Integration and Education",
        summary: "Advise incorporating findings into the QAPI plan, assigning follow-up audits, and including the results in the next QAPI meeting minutes.",
        keyPoints: [
          "Advise incorporating findings into the QAPI plan, assigning follow-up audits, and including the results in the next QAPI meeting minutes.",
          "Suggest targeted education sessions for staff to reinforce deficient areas.",
        ],
        recommendations:
          "Integrate findings into continuous quality improvement processes.",
      },
      {
        category: "Closing Remarks",
        summary: "Reiterate appreciation for the team's transparency and collaboration.",
        keyPoints: [
          "Reiterate appreciation for the team's transparency and collaboration.",
          "Encourage staff to view the mock survey as a learning tool and a proactive step toward excellence.",
          "End with an invitation for questions and a reminder that detailed written findings will be shared.",
        ],
        recommendations:
          "End on a positive, supportive note that encourages ongoing improvement.",
      },
    ];
  };

  const getTalkingPoints = () => {
    // If we have generated talking points or are editing, return the current talking points
    if (
      exitConferenceData?.talkingPointsGenerated ||
      exitConferenceData?.talkingPointsEditing
    ) {
      return exitConferenceData.talkingPoints || [];
    }

    // Otherwise, return a default structure
    return [
      {
        category: "Opening Remarks",
        summary: "Thank the facility leadership and staff for their participation and cooperation during the mock survey.",
        keyPoints: [
          "Thank the facility leadership and staff for their participation and cooperation during the mock survey.",
          "Emphasize that this process is non-punitive and designed to support regulatory compliance, continuous quality improvement, and readiness for the official state or federal survey.",
        ],
        recommendations:
          "Set a positive, collaborative tone for the exit conference.",
      },
      {
        category: "Overview of the Mock Survey Process",
        summary: "Summarize the mock survey's scope and findings.",
        keyPoints: [
          "Summarize the mock survey's scope (dates, units/areas observed, number of records reviewed, and staff/residents interviewed).",
          "Reiterate that findings reflect a snapshot in time and that opportunities for improvement are intended to guide quality and compliance efforts.",
        ],
        recommendations:
          "Provide context for the findings that will be discussed.",
      },
      {
        category: "Strengths and Positive Observations",
        summary: "Highlight specific strengths identified during the mock survey.",
        keyPoints: [
          "Staff engagement and responsiveness.",
          "Clean, well-maintained environment.",
          "Consistent infection control practices.",
          "Effective leadership presence and communication.",
          "Reinforce that these areas reflect strong facility culture and should be sustained.",
        ],
        recommendations:
          "Reinforce positive practices and encourage continued excellence in these areas.",
      },
      {
        category: "Opportunities for Improvement",
        summary: "Frame findings as opportunities for improvement, not deficiencies. Reference corresponding F-Tags where applicable.",
        keyPoints: [
          "F684 – Quality of Care: Clarify consistent implementation of individualized care plans.",
          "F689 – Accidents and Supervision: Review rounding and resident supervision protocols.",
          "F812 – Food Safety: Ensure food storage temperatures and labeling meet standards.",
          "F880 – Infection Control: Reinforce hand hygiene monitoring during resident care.",
          "For each area:",
          "  • Briefly describe the observation or documentation gap.",
          "  • Discuss the regulatory expectation.",
          "  • Suggest potential corrective action or system improvement.",
        ],
        recommendations:
          "Focus on educational opportunities and system improvements rather than punitive measures.",
      },
      {
        category: "Next Steps and Plan of Correction Guidance",
        summary: "Encourage the team to use findings to develop or update a Plan of Correction (POC) with the five CMS-required elements.",
        keyPoints: [
          "Corrective action for residents affected.",
          "Identification of others potentially affected.",
          "Systemic changes or policy updates.",
          "Monitoring and QAPI tracking.",
          "Responsible person and completion date.",
          "Recommend prioritizing any potential G-level or immediate jeopardy risks first.",
        ],
        recommendations:
          "Ensure facility understands the POC requirements and has resources to develop a comprehensive plan.",
      },
      {
        category: "QAPI Integration and Education",
        summary: "Advise incorporating findings into the QAPI plan, assigning follow-up audits, and including the results in the next QAPI meeting minutes.",
        keyPoints: [
          "Advise incorporating findings into the QAPI plan, assigning follow-up audits, and including the results in the next QAPI meeting minutes.",
          "Suggest targeted education sessions for staff to reinforce deficient areas.",
        ],
        recommendations:
          "Integrate findings into continuous quality improvement processes.",
      },
      {
        category: "Closing Remarks",
        summary: "Reiterate appreciation for the team's transparency and collaboration.",
        keyPoints: [
          "Reiterate appreciation for the team's transparency and collaboration.",
          "Encourage staff to view the mock survey as a learning tool and a proactive step toward excellence.",
          "End with an invitation for questions and a reminder that detailed written findings will be shared.",
        ],
        recommendations:
          "End on a positive, supportive note that encourages ongoing improvement.",
      },
    ];
  };

  const handleAddCustomTalkingPoint = () => {
    if (
      surveyData.newTalkingPoint &&
      surveyData.newTalkingPoint.trim() !== ""
    ) {
      const currentTalkingPoints = getTalkingPoints();
      const newPoint = {
        category: surveyData.newTalkingPoint.trim(),
        summary: "",
        keyPoints: [],
        recommendations: "",
        isCustom: true,
      };
      updateExitConference({
        talkingPoints: [...currentTalkingPoints, newPoint],
        talkingPointsEditing: true,
      });
      handleSurveyDataChange("newTalkingPoint", "");
    }
  };

  const handleRemoveCustomTalkingPoint = (index) => {
    const currentTalkingPoints = getTalkingPoints();
    const updatedTalkingPoints = currentTalkingPoints.filter(
      (_, i) => i !== index
    );
    updateExitConference({
      talkingPoints: updatedTalkingPoints,
      talkingPointsEditing: true,
    });
  };

  const handleGenerateTalkingPoints = () => {
    const currentTalkingPoints = getTalkingPoints();

    if (exitConferenceData?.talkingPointsEditing) {
      // Save changes and return to generated view
      updateExitConference({
        talkingPoints: currentTalkingPoints,
        talkingPointsGenerated: true,
        talkingPointsEditing: false,
        talkingPointsGeneratedAt: new Date().toISOString(),
      });
      toast.success("Talking points updated successfully!");
    } else {
      // Generate new talking points with contextual data
      const contextualTalkingPoints = generateTalkingPoints(surveyData);

      // Add any custom talking points that were previously added
      const customTalkingPoints = currentTalkingPoints.filter(
        (point) => point.isCustom
      );
      const allTalkingPoints = [
        ...contextualTalkingPoints,
        ...customTalkingPoints,
      ];

      updateExitConference({
        talkingPoints: allTalkingPoints,
        talkingPointsGenerated: true,
        talkingPointsEditing: false,
        talkingPointsGeneratedAt: new Date().toISOString(),
      });
      toast.success("Talking points generated successfully!");
    }
  };

  // Handle adding other attendee
  // Handle adding other attendee
  const handleAddOtherAttendee = () => {
    if (exitConferenceData?.attendees?.newAttendee?.trim()) {
      const currentAttendees =
        exitConferenceData?.attendees?.otherAttendees || [];
      const newAttendee = exitConferenceData.attendees.newAttendee.trim();

      updateExitConference({
        attendees: {
          ...exitConferenceData.attendees,
          otherAttendees: [...currentAttendees, newAttendee],
          newAttendee: "",
        },
      });
      toast.success("Attendee added successfully!");
    }
  };

  // Handle removing other attendee
  const handleRemoveOtherAttendee = (index) => {
    const currentAttendees =
      exitConferenceData?.attendees?.otherAttendees || [];
    const updatedAttendees = currentAttendees.filter((_, i) => i !== index);

    updateExitConference({
      attendees: {
        ...exitConferenceData.attendees,
        otherAttendees: updatedAttendees,
      },
    });
    toast.success("Attendee removed successfully!");
  };

  // Handle adding email recipient
  const handleAddEmailRecipient = () => {
    if (exitConferenceData?.emailRecipients?.newEmail?.trim()) {
      const currentEmails =
        exitConferenceData?.emailRecipients?.otherEmails || [];
      const newEmail = exitConferenceData.emailRecipients.newEmail.trim();

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        toast.error("Please enter a valid email address");
        return;
      }

      updateExitConference({
        emailRecipients: {
          ...exitConferenceData.emailRecipients,
          otherEmails: [...currentEmails, newEmail],
          newEmail: "",
        },
      });
      toast.success("Email address added successfully!");
    }
  };

  // Handle removing email recipient
  const handleRemoveEmailRecipient = (index) => {
    const currentEmails =
      exitConferenceData?.emailRecipients?.otherEmails || [];
    const updatedEmails = currentEmails.filter((_, i) => i !== index);

    updateExitConference({
      emailRecipients: {
        ...exitConferenceData.emailRecipients,
        otherEmails: updatedEmails,
      },
    });
    toast.success("Email address removed successfully!");
  };

  // Handle file attachment
  const handleFileAttachment = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      // Check file type (allow common document types)
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "image/jpeg",
        "image/png",
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error(
          "Invalid file type. Please upload PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, or PNG files."
        );
        return;
      }

      setAttachedDocument(file);
      toast.success(`File "${file.name}" attached successfully!`);
    }
  };

  // Handle removing file attachment
  const handleRemoveAttachment = () => {
    setAttachedDocument(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Attachment removed");
  };

  // Handle adding family member or caregiver
  const handleAddFamilyMember = () => {
    if (
      exitConferenceData?.attendees?.newFamilyMember?.name?.trim() &&
      exitConferenceData?.attendees?.newFamilyMember?.relationship &&
      exitConferenceData?.attendees?.newFamilyMember?.residentName?.trim()
    ) {
      const currentMembers = exitConferenceData?.attendees?.familyMembers || [];
      const newMember = {
        name: exitConferenceData.attendees.newFamilyMember.name.trim(),
        relationship: exitConferenceData.attendees.newFamilyMember.relationship,
        residentName:
          exitConferenceData.attendees.newFamilyMember.residentName.trim(),
      };

      updateExitConference({
        attendees: {
          ...exitConferenceData.attendees,
          familyMembers: [...currentMembers, newMember],
          newFamilyMember: {
            name: "",
            relationship: "",
            residentName: "",
          },
        },
      });
      toast.success("Family member/caregiver added successfully!");
    }
  };

  // Handle removing family member or caregiver
  const handleRemoveFamilyMember = (index) => {
    const currentMembers = exitConferenceData?.attendees?.familyMembers || [];
    const updatedMembers = currentMembers.filter((_, i) => i !== index);

    updateExitConference({
      attendees: {
        ...exitConferenceData.attendees,
        familyMembers: updatedMembers,
      },
    });
    toast.success("Family member/caregiver removed successfully!");
  };

 
  // Handle exit conference submission
  const handleExitConferenceSubmit = async (isContinueClicked = false) => {
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

      const payload = {
        surveyId: surveyId,
        status: "exit-conference",
        exitDate: surveyData.exitDate || "",
        exitTime: surveyData.exitTime || "",
        exitConference: surveyData.exitConference || {},
      };

      // Show loading toast
      isContinueClicked &&
        toast.loading("Submitting exit conference...", {
          position: "top-right",
        });

      // Check if online before making API call
      if (!navigator.onLine) {
        // Save offline and inform user
        const saveOfflineData = async (payload) => {
          try {
            const offlineData = {
              ...payload,
             
              apiEndpoint: "submitExitConference", // Store which API to call
              apiMethod: "survey", // Store API method/namespace
            };

            // Step 1: Save to IndexedDB sync queue (permanent storage)
            let syncQueueId = null;
            if (payload.surveyId || surveyId) {
              const stepId = "exit-conference";
              const syncItem = await surveyIndexedDB.addToSyncQueue(
                payload.surveyId || surveyId,
                stepId,
                offlineData,
                "api_exit_conference" // type for API-based exit conference
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
        toast.dismiss();
        toast.success("Internet connectivity issues detected. Data saved offline and will sync when connection is restored.", {
          position: "top-right",
          duration: 5000,
        });
        setUnsavedChanges({}); // Clear unsaved changes
        setIsSubmitting(false);
        return; // Exit early - data is saved offline
      }

      // Submit the step data (only if online)
      const response = await api.survey.submitExitConference(payload);

      if (response && (response.statusCode === 200 || response.success)) {
        toast.dismiss();
        setUnsavedChanges({}); // Clear unsaved changes
        
        if (isContinueClicked) {
          toast.success("Exit conference submitted successfully! Moving to next step...", {
            position: "top-right",
            duration: 5000,
          });
          // Update survey data with response
          if (response.data) {
            // Handle the exitConference data properly - don't nest it
            if (response.data.exitConference) {
              handleSurveyDataChange(
                "exitConference",
                response.data.exitConference
              );
            }

            // Update exitDate and exitTime at root level if they exist
            if (response.data.exitDate) {
              handleSurveyDataChange("exitDate", response.data.exitDate);
            }
            if (response.data.exitTime) {
              handleSurveyDataChange("exitTime", response.data.exitTime);
            }

            // Update other fields
            if (response.data.status) {
              handleSurveyDataChange("status", response.data.status);
            }
            if (response.data.submittedAt) {
              handleSurveyDataChange("submittedAt", response.data.submittedAt);
            }
            if (response.data.completedAt) {
              handleSurveyDataChange("completedAt", response.data.completedAt);
            }
          }
          // Move to next step
          setCurrentStep(11);
          setIsContinueClicked(false);
        } else {
          toast.success("Progress saved successfully!", {
            position: "top-right",
            duration: 3000,
          });
        }
      } else {
        toast.error(response?.message || "Submission failed", {
          position: "top-right",
        });
      }
    } catch (error) {
      toast.error(
        error.message ||
          "Failed to submit exit conference. Please try again.",
        { position: "top-right", duration: 5000 }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-2">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
            {sectionData[9].title}
          </h2>
          {isSurveyClosed && (
            <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300 self-start sm:self-auto">
              <Lock className="w-3 h-3 mr-1" />
              Survey Closed
            </Badge>
          )}
        </div>
        <p className="text-gray-500 text-xs sm:text-sm leading-tight max-w-5xl">
          {sectionData[9].description}
        </p>
      </div>

      <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Exit Conference Details */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-600 flex-shrink-0" />
              Exit Conference Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Exit Date
                </Label>
                <DatePicker
                  date={
                    surveyData.exitDate
                      ? new Date(surveyData.exitDate)
                      : undefined
                  }
                  onSelect={(date) =>
                    handleSurveyDataChange(
                      "exitDate",
                      date ? date.toISOString().split("T")[0] : null
                    )
                  }
                  disabled={isInvitedUser() || isSurveyClosed}
                  placeholder="Select exit date"
                  className="w-full"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Exit Time
                </Label>
                <Input
                  type="time"
                  value={surveyData.exitTime || ""}
                  onChange={(e) =>
                    handleSurveyDataChange("exitTime", e.target.value)
                  }
                  disabled={isInvitedUser() || isSurveyClosed}
                  className="h-10"
                />
              </div>
            </div>

            {/* Exit Conference Invitations */}
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 mt-4">
              Exit Conference Invitations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Required Attendees */}
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3">
                  Required Attendees
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center py-2 px-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={
                        exitConferenceData?.attendees?.administrator || false
                      }
                      onChange={(e) =>
                        updateExitConference({
                          attendees: {
                            ...exitConferenceData.attendees,
                            administrator: e.target.checked,
                          },
                        })
                      }
                      disabled={isInvitedUser() || isSurveyClosed}
                      className="w-4 h-4 text-[#075b7d] border-gray-300 rounded focus:ring-[#075b7d] mr-3"
                    />
                    <span className="text-gray-900">Administrator</span>
                  </label>

                  <label className="flex items-center py-2 px-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={
                        exitConferenceData?.attendees?.medicalDirector || false
                      }
                      onChange={(e) =>
                        updateExitConference({
                          attendees: {
                            ...exitConferenceData.attendees,
                            medicalDirector: e.target.checked,
                          },
                        })
                      }
                      disabled={isInvitedUser() || isSurveyClosed}
                      className="w-4 h-4 text-[#075b7d] border-gray-300 rounded focus:ring-[#075b7d] mr-3"
                    />
                    <span className="text-gray-900">Medical Director</span>
                  </label>

                  <label className="flex items-center py-2 px-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={
                        exitConferenceData?.attendees?.directorOfNursing ||
                        false
                      }
                      onChange={(e) =>
                        updateExitConference({
                          attendees: {
                            ...exitConferenceData.attendees,
                            directorOfNursing: e.target.checked,
                          },
                        })
                      }
                      disabled={isInvitedUser() || isSurveyClosed}
                      className="w-4 h-4 text-[#075b7d] border-gray-300 rounded focus:ring-[#075b7d] mr-3"
                    />
                    <span className="text-gray-900">Director of Nursing</span>
                  </label>
                </div>
              </div>

              {/* Optional Attendees */}
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-3">
                  Optional Attendees
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center py-2 px-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={
                        exitConferenceData?.attendees?.ombudsman || false
                      }
                      onChange={(e) =>
                        updateExitConference({
                          attendees: {
                            ...exitConferenceData.attendees,
                            ombudsman: e.target.checked,
                          },
                        })
                      }
                      disabled={isInvitedUser() || isSurveyClosed}
                      className="w-4 h-4 text-[#075b7d] border-gray-300 rounded focus:ring-[#075b7d] mr-3"
                    />
                    <span className="text-gray-900">Ombudsman</span>
                  </label>

                  <label className="flex items-center py-2 px-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={
                        exitConferenceData?.attendees?.residentGroupOfficer ||
                        false
                      }
                      onChange={(e) =>
                        updateExitConference({
                          attendees: {
                            ...exitConferenceData.attendees,
                            residentGroupOfficer: e.target.checked,
                          },
                        })
                      }
                      disabled={isInvitedUser() || isSurveyClosed}
                      className="w-4 h-4 text-[#075b7d] border-gray-300 rounded focus:ring-[#075b7d] mr-3"
                    />
                    <span className="text-gray-900">
                      Resident Group Officer
                    </span>
                  </label>

                  {/* Other Attendees Option */}
                  <div>
                    <label className="flex items-center py-2 px-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={exitConferenceData?.attendees?.other || false}
                        onChange={(e) =>
                          updateExitConference({
                            attendees: {
                              ...exitConferenceData.attendees,
                              other: e.target.checked,
                            },
                          })
                        }
                        disabled={isInvitedUser() || isSurveyClosed}
                        className="w-4 h-4 text-[#075b7d] border-gray-300 rounded focus:ring-[#075b7d] mr-3"
                      />
                      <span className="text-gray-900">Other Attendees</span>
                    </label>
                    {exitConferenceData?.attendees?.other && (
                      <div className="ml-7 mt-2 space-y-3">
                        {/* Display Added Attendees */}
                        {(exitConferenceData?.attendees?.otherAttendees || [])
                          .length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-600 font-medium">
                              Added Attendees:
                            </p>
                            {(
                              exitConferenceData?.attendees?.otherAttendees ||
                              []
                            ).map((attendee, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                              >
                                <span className="text-gray-700">
                                  {attendee}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() =>
                                    handleRemoveOtherAttendee(index)
                                  }
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add New Attendee Input */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                          <Input
                            placeholder="Enter attendee name and title..."
                            value={
                              exitConferenceData?.attendees?.newAttendee || ""
                            }
                            onChange={(e) =>
                              updateExitConference({
                                attendees: {
                                  ...exitConferenceData.attendees,
                                  newAttendee: e.target.value,
                                },
                              })
                            }
                            onKeyPress={(e) =>
                              e.key === "Enter" && handleAddOtherAttendee()
                            }
                            disabled={isInvitedUser() || isSurveyClosed}
                            className="h-10 text-sm"
                          />
                          <Button
                            onClick={handleAddOtherAttendee}
                            size="sm"
                            variant="outline"
                            className="px-4 h-10"
                            disabled={isInvitedUser() || isSurveyClosed}
                          >
                            Add
                          </Button>
                        </div>

                        <p className="text-xs text-gray-500">
                          Example: "John Smith, Director of Maintenance"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Resident Invitations */}
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-700 mb-3">
                Resident Invitations (Up to 2)
              </h4>
              <div className="space-y-3">
                {(exitConferenceData?.attendees?.residents || []).map(
                  (resident, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <span className="text-sm text-gray-600">
                          {resident.name}
                        </span>
                        {resident.familyMember && (
                          <span className="text-xs text-gray-500 ml-2">
                            (Family Member: {resident.familyMember})
                          </span>
                        )}
                        {resident.caregiver && (
                          <span className="text-xs text-gray-500 ml-2">
                            (Caregiver: {resident.caregiver})
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const currentResidents =
                            exitConferenceData?.attendees?.residents || [];
                          const updatedResidents = currentResidents.filter(
                            (_, i) => i !== index
                          );
                          updateExitConference({
                            attendees: {
                              ...exitConferenceData?.attendees,
                              residents: updatedResidents,
                            },
                          });
                        }}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  )
                )}

                {(exitConferenceData?.attendees?.residents || []).length <
                  2 && (
                  <button
                    onClick={() => setShowAddExitConferenceResidentModal(true)}
                    disabled={isInvitedUser() || isSurveyClosed}
                    className="px-3 py-2 bg-[#075b7d]/10 text-[#075b7d] rounded-lg text-sm hover:bg-[#075b7d]/20 transition-colors"
                  >
                    + Add Resident
                  </button>
                )}
              </div>
            </div>

            {/* Family Members and Caregivers */}
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-700 mb-3">
                Family Members & Caregivers (When Resident Cannot Attend)
              </h4>
              <div className="space-y-3">
                {/* Display Added Family Members and Caregivers */}
                {(exitConferenceData?.attendees?.familyMembers || []).length >
                  0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-600 font-medium">
                      Added Family Members & Caregivers:
                    </p>
                    {(exitConferenceData?.attendees?.familyMembers || []).map(
                      (member, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                        >
                          <div className="flex-1">
                            <span className="text-gray-700">{member.name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({member.relationship} - {member.residentName})
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveFamilyMember(index)}
                            disabled={isInvitedUser() || isSurveyClosed}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Add New Family Member or Caregiver */}
                <div className="p-3 bg-gray-10 border border-gray-200 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <Input
                        placeholder="Family member or caregiver name..."
                        value={
                          exitConferenceData?.attendees?.newFamilyMember
                            ?.name || ""
                        }
                        onChange={(e) =>
                          updateExitConference({
                            attendees: {
                              ...exitConferenceData.attendees,
                              newFamilyMember: {
                                ...exitConferenceData?.attendees
                                  ?.newFamilyMember,
                                name: e.target.value,
                              },
                            },
                          })
                        }
                        disabled={isInvitedUser() || isSurveyClosed}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Relationship
                      </label>
                      <select
                        value={
                          exitConferenceData?.attendees?.newFamilyMember
                            ?.relationship || ""
                        }
                        onChange={(e) =>
                          updateExitConference({
                            attendees: {
                              ...exitConferenceData.attendees,
                              newFamilyMember: {
                                ...exitConferenceData?.attendees
                                  ?.newFamilyMember,
                                relationship: e.target.value,
                              },
                            },
                          })
                        }
                        disabled={isInvitedUser() || isSurveyClosed}
                        className="h-8 text-xs border border-gray-300 rounded px-2 focus:outline-none focus:ring-1 focus:ring-[#075b7d] focus:border-[#075b7d]"
                      >
                        <option value="">Select relationship...</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Child">Child</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Grandchild">Grandchild</option>
                        <option value="Power of Attorney">
                          Power of Attorney
                        </option>
                        <option value="Guardian">Guardian</option>
                        <option value="Caregiver">Caregiver</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Resident Name
                      </label>
                      <Input
                        placeholder="Resident they represent..."
                        value={
                          exitConferenceData?.attendees?.newFamilyMember
                            ?.residentName || ""
                        }
                        onChange={(e) =>
                          updateExitConference({
                            attendees: {
                              ...exitConferenceData.attendees,
                              newFamilyMember: {
                                ...exitConferenceData?.attendees
                                  ?.newFamilyMember,
                                residentName: e.target.value,
                              },
                            },
                          })
                        }
                        disabled={isInvitedUser() || isSurveyClosed}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <Button
                      onClick={handleAddFamilyMember}
                      size="sm"
                      variant="outline"
                      className="px-4 h-8 text-xs"
                      disabled={
                        !exitConferenceData?.attendees?.newFamilyMember?.name ||
                        !exitConferenceData?.attendees?.newFamilyMember
                          ?.relationship ||
                        !exitConferenceData?.attendees?.newFamilyMember
                          ?.residentName ||
                        isInvitedUser()
                      }
                    >
                      Add Family Member/Caregiver
                    </Button>
                  </div>
                </div>
              </div>
            </div>

           
          </div>

          {/* Conference Outcomes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Conference Outcomes
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-800 mb-3">
                  <strong>Note:</strong> Select one outcome. Substantial
                  compliance leads to certification, while potential citations
                  prevent certification and suppress S/S specifics except IJ.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    exitConferenceData?.outcomes?.selectedOutcome ===
                    "substantialCompliance"
                      ? "border-gray-500 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="outcome"
                    value="substantialCompliance"
                    checked={
                      exitConferenceData?.outcomes?.selectedOutcome ===
                      "substantialCompliance"
                    }
                    onChange={(e) =>
                      updateExitConference({
                        outcomes: {
                          ...surveyData.exitConference.outcomes,
                          selectedOutcome: e.target.value,
                          substantialCompliance: true,
                          potentialCitations: false,
                        },
                      })
                    }
                    disabled={isInvitedUser() || isSurveyClosed}
                    className="w-4 h-4 text-[#075b7d] border-gray-300 focus:ring-[#075b7d] mr-3"
                  />
                  <div>
                    <span className="font-medium text-gray-900">
                      Substantial Compliance
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      Facility will be certified
                    </p>
                  </div>
                </label>

                <label
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    exitConferenceData?.outcomes?.selectedOutcome ===
                    "potentialCitations"
                      ? "border-gray-500 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="outcome"
                    value="potentialCitations"
                    checked={
                      exitConferenceData?.outcomes?.selectedOutcome ===
                      "potentialCitations"
                    }
                    onChange={(e) =>
                      updateExitConference({
                        outcomes: {
                          ...surveyData.exitConference.outcomes,
                          selectedOutcome: e.target.value,
                          substantialCompliance: false,
                          potentialCitations: true,
                        },
                      })
                    }
                    disabled={isInvitedUser() || isSurveyClosed}
                    className="w-4 h-4 text-[#075b7d] border-gray-300 focus:ring-[#075b7d] mr-3"
                  />
                  <div>
                    <span className="text-gray-900">Potential Citations</span>
                    <p className="text-sm text-gray-700 mt-1">
                      Facility will not be certified
                    </p>
                    <p className="text-xs text-gray-700 mt-1">
                      S/S specifics suppressed except IJ
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Auto-Generated Talking Points */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Exit Conference Talking Points
            </h3>

            <div className="space-y-4">
              {!exitConferenceData?.talkingPointsGenerated ||
              exitConferenceData?.talkingPointsEditing ? (
                <>
                  <div className="p-4 bg-gray-10 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-800 mb-3">
                      <strong>Note:</strong>{" "}
                      {exitConferenceData?.talkingPointsEditing
                        ? "Edit your talking points below and click 'Save Changes' to update."
                        : "Create comprehensive talking points based on survey findings to assist during the exit conference."}
                    </p>
                  </div>

                  {/* Standard Talking Points Preview */}
                  <div className="p-4 bg-gray-10 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h5 className="font-medium text-gray-900">
                          {exitConferenceData?.talkingPointsEditing
                            ? "Edit Talking Points"
                            : "Standard Talking Points (will be included):"}
                        </h5>
                        {exitConferenceData?.talkingPointsEditing && (
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
                    {exitConferenceData?.talkingPointsEditing ? (
                      <div className="mt-4 space-y-3">
                        <div className="text-sm text-gray-700 mb-3">
                          <p>
                            Edit the talking points and their details below.
                            Make changes and click 'Save Changes' to update.
                          </p>
                        </div>
                        <div className="space-y-3">
                          {getTalkingPoints().map((point, index) => (
                            <div
                              key={index}
                              className="p-3 bg-gray-10 rounded-lg"
                            >
                              <div className="font-medium text-gray-900 mb-3">
                                {index + 1}. {point.category}
                              </div>

                              {/* Category Title */}
                              <div className="mb-3">
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                  Category Title:
                                </label>
                                <textarea
                                  value={point.category}
                                  onChange={(e) => {
                                    const currentTalkingPoints =
                                      getTalkingPoints();
                                    const updatedTalkingPoints = [
                                      ...currentTalkingPoints,
                                    ];
                                    updatedTalkingPoints[index] = {
                                      ...updatedTalkingPoints[index],
                                      category: e.target.value,
                                    };

                                    updateExitConference({
                                      talkingPoints: updatedTalkingPoints,
                                      talkingPointsEditing: true,
                                    });
                                  }}
                                  placeholder="Enter category title"
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none transition-colors"
                                />
                              </div>

                              {/* Summary */}
                              <div className="mb-3">
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                  Summary:
                                </label>
                                <textarea
                                  value={point.summary}
                                  onChange={(e) => {
                                    const currentTalkingPoints =
                                      getTalkingPoints();
                                    const updatedTalkingPoints = [
                                      ...currentTalkingPoints,
                                    ];
                                    updatedTalkingPoints[index] = {
                                      ...updatedTalkingPoints[index],
                                      summary: e.target.value,
                                    };

                                    updateExitConference({
                                      talkingPoints: updatedTalkingPoints,
                                      talkingPointsEditing: true,
                                    });
                                  }}
                                  placeholder="Enter summary"
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none transition-colors"
                                />
                              </div>

                              {/* Key Points */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                  Key Points:
                                </label>
                                <div className="space-y-2">
                                  {point.keyPoints.map((keyPoint, kIndex) => (
                                    <div
                                      key={kIndex}
                                      className="flex items-center space-x-2"
                                    >
                                      <span className="text-xs text-gray-500 w-4">
                                        •
                                      </span>
                                      <textarea
                                        value={keyPoint}
                                        onChange={(e) => {
                                          const currentTalkingPoints =
                                            getTalkingPoints();
                                          const updatedTalkingPoints = [
                                            ...currentTalkingPoints,
                                          ];
                                          const updatedKeyPoints = [
                                            ...updatedTalkingPoints[index]
                                              .keyPoints,
                                          ];
                                          updatedKeyPoints[kIndex] =
                                            e.target.value;
                                          updatedTalkingPoints[index] = {
                                            ...updatedTalkingPoints[index],
                                            keyPoints: updatedKeyPoints,
                                          };

                                          updateExitConference({
                                            talkingPoints: updatedTalkingPoints,
                                            talkingPointsEditing: true,
                                          });
                                        }}
                                        placeholder="Enter key point"
                                        rows={1}
                                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 resize-none transition-colors"
                                      />
                                      <Button
                                        onClick={() => {
                                          const currentTalkingPoints =
                                            getTalkingPoints();
                                          const updatedTalkingPoints = [
                                            ...currentTalkingPoints,
                                          ];
                                          const updatedKeyPoints =
                                            updatedTalkingPoints[
                                              index
                                            ].keyPoints.filter(
                                              (_, i) => i !== kIndex
                                            );
                                          updatedTalkingPoints[index] = {
                                            ...updatedTalkingPoints[index],
                                            keyPoints: updatedKeyPoints,
                                          };

                                          updateExitConference({
                                            talkingPoints: updatedTalkingPoints,
                                            talkingPointsEditing: true,
                                          });
                                        }}
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>

                                {/* Add New Key Point Button */}
                                <div className="mt-3">
                                  <Button
                                    onClick={() => {
                                      const currentTalkingPoints =
                                        getTalkingPoints();
                                      const updatedTalkingPoints = [
                                        ...currentTalkingPoints,
                                      ];
                                      const updatedKeyPoints = [
                                        ...updatedTalkingPoints[index]
                                          .keyPoints,
                                        "New key point",
                                      ];
                                      updatedTalkingPoints[index] = {
                                        ...updatedTalkingPoints[index],
                                        keyPoints: updatedKeyPoints,
                                      };

                                      updateExitConference({
                                        talkingPoints: updatedTalkingPoints,
                                        talkingPointsEditing: true,
                                      });
                                    }}
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs text-gray-600 border-gray-300 hover:bg-gray-50"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Key Point
                                  </Button>
                                </div>
                              </div>

                              {/* Recommendations */}
                              <div className="mt-3">
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                  Recommendations:
                                </label>
                                <textarea
                                  value={point.recommendations}
                                  onChange={(e) => {
                                    const currentTalkingPoints =
                                      getTalkingPoints();
                                    const updatedTalkingPoints = [
                                      ...currentTalkingPoints,
                                    ];
                                    updatedTalkingPoints[index] = {
                                      ...updatedTalkingPoints[index],
                                      recommendations: e.target.value,
                                    };

                                    updateExitConference({
                                      talkingPoints: updatedTalkingPoints,
                                      talkingPointsEditing: true,
                                    });
                                  }}
                                  placeholder="Enter recommendations"
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none transition-colors"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-sm text-gray-700">
                        <p>
                          6 standard talking point categories will be
                          automatically included in your generated talking
                          points.
                        </p>
                        <p className="text-xs mt-1">
                          Click "Generate Talking Points" to create your exit
                          conference talking points.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2">
                    {exitConferenceData?.talkingPointsEditing && (
                      <Button
                        onClick={() => {
                          // Cancel editing and return to generated view
                          updateExitConference({
                            talkingPointsGenerated: true,
                            talkingPointsEditing: false,
                          });
                        }}
                        variant="outline"
                        className="px-6 h-10"
                      >
                        Cancel
                      </Button>
                    )}

                    <Button
                      onClick={handleGenerateTalkingPoints}
                      variant="outline"
                      className="hover:bg-gray-50 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      disabled={isInvitedUser() || isSurveyClosed}
                    >
                      {exitConferenceData?.talkingPointsEditing
                        ? "Save Changes"
                        : "Generate Talking Points"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Generated Talking Points Display */}
                  <div id="printable-talking-points" className="space-y-4">
                    {/* Header Information */}
                    <div className="text-left p-4 bg-gray-10 rounded-lg">
                      <h5 className="font-semibold text-gray-900 mb-2">
                        Exit Conference Talking Points
                      </h5>
                      <p className="text-sm text-gray-700 mb-2">
                        Generated:{" "}
                        {surveyData.exitConference.talkingPointsGeneratedAt &&
                          new Date(
                            surveyData.exitConference.talkingPointsGeneratedAt
                          ).toLocaleString()}
                      </p>
                    </div>

                    {/* Talking Points List */}
                    <div className="space-y-3">
                      {getTalkingPoints().map((point, index) => (
                        <div
                          key={index}
                          className="border-l-4 border-gray-500 pl-4"
                        >
                          <h5 className="font-medium text-gray-900 mb-2">
                            {index + 1}. {point.category}
                          </h5>
                          <p className="text-sm text-gray-700 mb-2">
                            {point.summary}
                          </p>
                          <div className="space-y-2">
                            {point.keyPoints.map((keyPoint, kIndex) => (
                              <div
                                key={kIndex}
                                className="flex items-start space-x-2"
                              >
                                <div className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span className="text-sm text-gray-600">
                                  {keyPoint}
                                </span>
                              </div>
                            ))}
                          </div>
                          {point.recommendations && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-xs font-medium text-gray-800 mb-2">
                                Recommendations:
                              </p>
                              <p className="text-xs text-gray-700">
                                {point.recommendations}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => {
                            // Switch to edit mode while preserving all talking points data
                            updateExitConference({
                              talkingPointsGenerated: false,
                              talkingPointsEditing: true,
                            });
                          }}
                          variant="outline"
                          className="px-6 py-2"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Edit Talking Points
                        </Button>

                        <Button
                          onClick={() => {
                            toast.error(
                              "Are you sure you want to delete these talking points?",
                              {
                                description: "This action cannot be undone.",
                                action: {
                                  label: "Delete",
                                  onClick: () => {
                                    updateExitConference({
                                      talkingPoints: [],
                                      talkingPointsGenerated: false,
                                      talkingPointsEditing: false,
                                      talkingPointsGeneratedAt: null,
                                    });
                                    handleSurveyDataChange(
                                      "newTalkingPoint",
                                      ""
                                    );
                                    toast.success(
                                      "Talking points deleted successfully"
                                    );
                                  },
                                },
                                cancel: {
                                  label: "Cancel",
                                  onClick: () => {
                                    // User cancelled deletion
                                  },
                                },
                                duration: 10000,
                              }
                            );
                          }}
                          variant="outline"
                          className="px-6 py-2 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Delete Talking Points
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        


          {/* Conference Findings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Conference Findings
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exit Conference Summary
              </label>
              <textarea
                value={exitConferenceData?.findings || ""}
                onChange={(e) =>
                  updateExitConference({ findings: e.target.value })
                }
                placeholder="Document the key findings, citations issued, and discussions held during the exit conference..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] resize-none transition-colors"
                disabled={isInvitedUser() || isSurveyClosed}
              />
            </div>
          </div>

          {/* Key Findings Summary */}
          {surveyData.citations?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Key Findings
              </h3>

              <div className="space-y-4">
                {surveyData.citations.map((citation, index) => (
                  <div
                    key={citation.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">
                        {citation.fFlag}
                      </h4>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          citation.severity === "Immediate Jeopardy"
                            ? "bg-gray-100 text-gray-800"
                            : citation.severity === "Widespread"
                            ? "bg-gray-100 text-gray-800"
                            : citation.severity === "Pattern"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {citation.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {citation.deficiency}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {
        !isInvitedUser() && (
          <>
          {/* Floating Save Button */}
      <div className="fixed bottom-[100px]  right-6 z-40 flex flex-col items-end gap-2">
      <Button
        onClick={() => handleExitConferenceSubmit(false)}
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
    </>
        )
      }

      {/* Navigation Buttons */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-40 flex gap-2 sm:gap-4">
        <Button
          onClick={() => {
            if (hasUnsavedChanges) {
              setPendingNavigation({ type: 'step', target: 9 });
              setShowExitWarning(true);
            } else {
              setCurrentStep(9);
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
            onClick={() => {
              if (hasUnsavedChanges) {
                setPendingNavigation({ type: 'step', target: 11 });
                setShowExitWarning(true);
              } else {
                setCurrentStep(11);
              }
            }}
            className="flex-1 sm:flex-none h-11 sm:h-12 px-4 sm:px-8 bg-[#075b7d] hover:bg-[#075b7d] text-white text-sm sm:text-base font-medium rounded-full shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all"
            size="lg"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        ) : (
          <Button
            onClick={() => {
              handleExitConferenceSubmit(true);
              setIsContinueClicked(true);
            }}
            disabled={isSubmitting || isSurveyClosed}
            className="flex-1 sm:flex-none h-11 sm:h-12 px-4 sm:px-8 bg-[#075b7d] hover:bg-[#075b7d] text-white text-sm sm:text-base font-medium disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all"
            size="lg"
          >
            <span className="hidden sm:inline">Post-Survey Activities</span>
            <span className="sm:hidden">Continue</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        )}
      </div>

      {/* Email Preview Modal */}
      {showEmailPreview && emailPreviewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Email Preview
              </h3>
              <Button
                onClick={() => setShowEmailPreview(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Recipients Section */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Recipients
                </h4>
                <div className="space-y-2">
                  {emailPreviewData.recipients.map((recipient, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {recipient.role}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {recipient.email}
                        </span>
                      </div>
                      {recipient.isCustom && (
                        <Badge variant="secondary" className="text-xs">
                          Custom Email
                        </Badge>
                      )}
                    </div>
                  ))}
                  {emailPreviewData.recipients.length === 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        No recipients selected
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Subject Section */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Subject
                </h4>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-900">
                    {emailPreviewData.subject}
                  </p>
                </div>
              </div>

              {/* Message Section */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Message
                </h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <pre className="text-sm text-gray-900 whitespace-pre-wrap font-sans">
                    {emailPreviewData.message}
                  </pre>
                </div>
              </div>

              {/* Attachment Section */}
              {emailPreviewData.attachment && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Attachment
                  </h4>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          {emailPreviewData.attachment.name}
                        </p>
                        <p className="text-xs text-blue-700">
                          Size:{" "}
                          {(emailPreviewData.attachment.size / 1024).toFixed(2)}{" "}
                          KB | Type: {emailPreviewData.attachment.type}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Citations Summary */}
              {surveyData.citations && surveyData.citations.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Citations Summary
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {
                          surveyData.citations.filter(
                            (c) => c.severity === "Immediate Jeopardy"
                          ).length
                        }
                      </div>
                      <div className="text-xs text-red-800">
                        Immediate Jeopardy
                      </div>
                    </div>
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {
                          surveyData.citations.filter(
                            (c) => c.severity === "Widespread"
                          ).length
                        }
                      </div>
                      <div className="text-xs text-orange-800">Widespread</div>
                    </div>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {
                          surveyData.citations.filter(
                            (c) => c.severity === "Pattern"
                          ).length
                        }
                      </div>
                      <div className="text-xs text-yellow-800">Pattern</div>
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {
                          surveyData.citations.filter(
                            (c) => c.severity === "Isolated"
                          ).length
                        }
                      </div>
                      <div className="text-xs text-blue-800">Isolated</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:space-x-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
              <Button
                onClick={() => {
                  const previewContent = `Recipients: ${emailPreviewData.recipients
                    .map((r) => `${r.role} (${r.email})`)
                    .join(", ")}\n\nSubject: ${
                    emailPreviewData.subject
                  }\n\nMessage:\n${emailPreviewData.message}`;

                  // Copy to clipboard
                  navigator.clipboard
                    .writeText(previewContent)
                    .then(() => {
                      toast.success("Email preview copied to clipboard!", {
                        position: "top-right",
                      });
                    })
                    .catch(() => {
                      // Fallback for older browsers
                      const textarea = document.createElement("textarea");
                      textarea.value = previewContent;
                      document.body.appendChild(textarea);
                      textarea.select();
                      document.execCommand("copy");
                      document.body.removeChild(textarea);
                      toast.success("Email preview copied to clipboard!", {
                        position: "top-right",
                      });
                    });
                }}
                variant="outline"
                className="w-full sm:w-auto flex items-center justify-center text-sm"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </Button>
              <Button
                onClick={() => setShowEmailPreview(false)}
                className="w-full sm:w-auto bg-[#075b7d] hover:bg-[#075b7d] text-white text-sm"
              >
                Close
              </Button>
            </div>
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
          await handleExitConferenceSubmit(false);
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
        onSave={() => handleExitConferenceSubmit(false)}
        onClearUnsavedChanges={() => setUnsavedChanges({})}
      />
    </div> 
  );
};

export default ExitConference;
