import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { DatePicker } from "../../components/ui/date-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../components/ui/command";
import { toast } from "sonner";
import api from "../../service/api";
import surveyIndexedDB from "../../utils/surveyIndexedDB";
import surveySyncService from "../../utils/surveySyncService";
import useSurveyStore from "../../stores/useSurveyStore";
import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import FloatingHomeButton from "../../components/FloatingHomeButton";
import { useBeforeUnload } from "react-router-dom";
import UnsavedChangesModal from "../../components/UnsavedChangesModal";
import { useBrowserNavigationBlocker } from "../../hooks/useBrowserNavigationBlocker";
import useSurveyAccess from "../../hooks/useSurveyAccess";
import AddResidentModal from "../../components/modals/AddResidentModal";

import {
  Calendar,
  Users,
  FileText,
  ChevronLeft,
  ChevronRight,
  Shield,
  Info,
  Upload,
  Plus,
  X,
  CheckSquare,
  AlertTriangle,
  Building,
  FileCheck,
  Loader2,
  Lock,
  ArrowRight,
  Pencil,
} from "lucide-react";

const FacilityEntrance = ({
  sectionData,
  setCurrentStep,
  canContinueFromStep,
  setShowUploadResidentModal,
  isInvitedUser: isInvitedUserProp = () => false,
}) => {
  // Get current survey ID for access check
  const currentSurveyId = localStorage.getItem("currentSurveyId");
  
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

  // Local state for facility entrance data
  const [facilityEntranceData, setFacilityEntranceData] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  // Local state for survey info (replacing surveyData prop)
  const [surveyInfo, setSurveyInfo] = useState(null);
  const [newAgendaItem, setNewAgendaItem] = useState("");

  // Helper function to update local facility entrance data
  const updateFacilityEntranceData = (updates, markAsDirty = true) => {
    if (markAsDirty) {
      setHasUnsavedChanges(true);
    }
    setFacilityEntranceData((prev) => ({
      ...prev,
      ...updates,
    }));
  };


  // Fetch facility entrance data on mount
  React.useEffect(() => {
    const fetchFacilityEntranceData = async () => {
      const surveyId = localStorage.getItem("currentSurveyId");
      if (!surveyId) return;

      try {
        setIsLoadingData(true);
        const response = await api.survey.getFacilityEntrance(surveyId);
        if (response && response.data) {
          if (response.data.surveyData) {
            setSurveyInfo(response.data.surveyData);
          }
          let dataToSet = response.data;

          // Handle new API response structure
          if (
            response.data.facilityEntrance &&
            Array.isArray(response.data.facilityEntrance)
          ) {
            const facilityEntrance = response.data.facilityEntrance[0] || {};
            const residents = (response.data.residentEntrance || []).map(
              (r) => ({
                ...r,
                id: r._id || r.id,
              })
            );
            const documents = response.data.documentsToUpload || [];
            const requestedItems = response.data.requestEntranceItems || [];
            const assessments = response.data.initialAssessment || [];

            dataToSet = {
              ...facilityEntrance,
              residents,
              documentsToUpload: documents,
              requestedEntranceItems: requestedItems,
              initialAssessments: assessments,
            };
          }

          // Transform Agenda from API array to UI object structure
          if (
            Array.isArray(dataToSet.entranceAgenda) &&
            dataToSet.entranceAgenda.length > 0
          ) {
            const apiAgenda = dataToSet.entranceAgenda;
            const uiAgenda = {
              isGenerated: true,
              isEditing: false,
              standardItems: [],
              standardSubItems: {},
              customItems: [],
            };

            apiAgenda.forEach((item, index) => {
              uiAgenda.standardItems.push(item.title);
              if (item.items && Array.isArray(item.items)) {
                uiAgenda.standardSubItems[index] = item.items.map(
                  (i) => i.description
                );
              }
            });

            dataToSet.entranceAgenda = uiAgenda;
          }

          setFacilityEntranceData(dataToSet);
        }
      } catch (error) {
      
        toast.error("Failed to load facility entrance data");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchFacilityEntranceData();
  }, []);

  // Helper function to get residents from the correct location
  const getResidents = () => {
    return facilityEntranceData?.residents || [];
  };

  // Check if survey is closed
  const isSurveyClosed =
    surveyInfo?.status === "closed" ||
    surveyInfo?.surveyClosed ||
    surveyInfo?.surveyClosureSurvey?.surveyClosed ||
    surveyInfo?.surveyClosureSurvey?.surveyCompleted ||
    surveyInfo?.surveyCompleted ||
    false;

  // Helper function to get requested items from the correct location
  const getRequestedItems = () => {
    // Transform array to object map if needed, or return array directly depending on usage
    // The new API returns requestedEntranceItems as an array
    const items = facilityEntranceData?.requestedEntranceItems || [];
    if (Array.isArray(items)) {
      return items.reduce((acc, item) => {
        acc[item.shortName || item.type] = item;
        return acc;
      }, {});
    }
    return items;
  };

  const getDocumentsToUpload = () => {
    // The new API returns documentsToUpload as an array
    const docs = facilityEntranceData?.documentsToUpload || [];
    if (Array.isArray(docs)) {
      return docs.reduce((acc, doc) => {
        acc[doc.type] = doc;
        return acc;
      }, {});
    }
    return docs;
  };

  const getKitchenQuickVisit = () => {
    // Assuming initialAssessments is an array in new structure
    const assessments = facilityEntranceData?.initialAssessments || [];
    const kitchenVisit = assessments.find(a => a.type === 'kitchenQuickVisit');
    return kitchenVisit || {};
  };

  const getFacilityEnvironmentalTour = () => {
    // Assuming initialAssessments is an array in new structure
    const assessments = facilityEntranceData?.initialAssessments || [];
    const envTour = assessments.find(a => a.type === 'facilityEnvironmentalTour');
    return envTour || {};
  };

  // Helper functions to update local state
  const updateLocalRequestedItem = (itemType, updates) => {
    setFacilityEntranceData((prev) => {
      if (!prev) return prev;
      const items = Array.isArray(prev.requestedEntranceItems) ? prev.requestedEntranceItems : [];
      const itemIndex = items.findIndex(
        (i) => (i.shortName || i.type) === itemType
      );

      let newItems;
      if (itemIndex >= 0) {
        newItems = [...items];
        newItems[itemIndex] = { ...newItems[itemIndex], ...updates };
      } else {
        newItems = [
          ...items,
          { type: itemType, shortName: itemType, ...updates },
        ];
      }

      return {
        ...prev,
        requestedEntranceItems: newItems,
      };
    });
  };

  const updateLocalInitialAssessment = (assessmentType, updates) => {
    setFacilityEntranceData((prev) => {
      if (!prev) return prev;
      const assessments = Array.isArray(prev.initialAssessments) ? prev.initialAssessments : [];
      const index = assessments.findIndex((a) => a.type === assessmentType);

      let newAssessments;
      if (index >= 0) {
        newAssessments = [...assessments];
        newAssessments[index] = { ...newAssessments[index], ...updates };
      } else {
        newAssessments = [...assessments, { type: assessmentType, ...updates }];
      }

      return {
        ...prev,
        initialAssessments: newAssessments,
      };
    });
  };

  const updateLocalDocument = (docType, updates) => {
    setFacilityEntranceData((prev) => {
      if (!prev) return prev;
      const docs = Array.isArray(prev.documentsToUpload) ? prev.documentsToUpload : [];
      const index = docs.findIndex((d) => d.type === docType);

      let newDocs;
      if (index >= 0) {
        newDocs = [...docs];
        newDocs[index] = { ...newDocs[index], ...updates };
      } else {
        newDocs = [...docs, { type: docType, ...updates }];
      }

      return {
        ...prev,
        documentsToUpload: newDocs,
      };
    });
  };

  // API call states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingFTag, setIsLoadingFTag] = useState(false);
  const [loadingProbeKey, setLoadingProbeKey] = useState(null);
  const [isLoadingFacility, setIsLoadingFacility] = useState(false);
  const [facilityName, setFacilityName] = useState("");
  const [isContinueClicked, setIsContinueClicked] = useState(false);

  // State for resident modal
  const [showResidentModal, setShowResidentModal] = useState(false);
  const [editingResident, setEditingResident] = useState(null);

  // Fetch facility name from API
  const fetchFacilityName = async () => {
    const surveyId = localStorage.getItem("currentSurveyId");
    if (!surveyId) {
      setFacilityName("");
      return;
    }

    try {
      setIsLoadingFacility(true);
      const response = await api.survey.getSurveyFirstPage(surveyId);

      if (
        response &&
        response.data &&
        response.data.surveyData &&
        response.data.surveyData.facilityId &&
        response.data.surveyData.facilityId.name
      ) {
        setFacilityName(response.data.surveyData.facilityId.name);
        setSurveyInfo(response.data.surveyData);
      } else {
        setFacilityName("");
      }
    } catch (error) {
     
      setFacilityName("");
      // toast.error("Failed to fetch facility name", { position: "top-right" });
    } finally {
      setIsLoadingFacility(false);
    }
  };

  // Handle adding custom agenda item with toast
  const handleAddCustomAgendaItem = () => {
    if (newAgendaItem?.trim()) {
      const currentAgenda = facilityEntranceData?.entranceAgenda || {
        facilityName: facilityName || "Facility Name",
        surveyDate: surveyInfo?.surveyCreationDate
          ? new Date(surveyInfo.surveyCreationDate).toLocaleDateString()
          : new Date().toLocaleDateString(),
        agendaItems: [
          "Introduction and Team Introductions",
          "Facility Overview and Demographics",
          "Survey Process and Timeline",
          "Document Review and Verification",
          "Staff Interviews and Observations",
          "Resident Care and Services Review",
          "Quality Assurance and Compliance",
          "Questions and Clarifications",
          "Next Steps and Schedule",
        ],
        customItems: [],
        isGenerated: false,
      };

      const updatedAgenda = {
        ...currentAgenda,
        customItems: [
          ...(currentAgenda.customItems || []),
          newAgendaItem.trim(),
        ],
      };

      updateFacilityEntranceData({
        entranceAgenda: updatedAgenda,
      });
      setNewAgendaItem("");
      toast.success(
        `Added custom agenda item: "${newAgendaItem.trim()}"`,
        { position: "top-right" }
      );
    } else {
      toast.warning("Please enter an agenda item before adding", {
        position: "top-right",
      });
    }
  };

  // Handle removing custom agenda item with toast
  const handleRemoveCustomAgendaItem = (index) => {
    const currentAgenda = facilityEntranceData?.entranceAgenda;
    if (currentAgenda && currentAgenda.customItems) {
      const removedItem = currentAgenda.customItems[index];
      const updatedCustomItems = currentAgenda.customItems.filter(
        (_, i) => i !== index
      );
      const updatedAgenda = {
        ...currentAgenda,
        customItems: updatedCustomItems,
      };
      updateFacilityEntranceData({
        entranceAgenda: updatedAgenda,
      });
      toast.info(`Removed agenda item: "${removedItem}"`, {
        position: "top-right",
      });
    }
  };

  // Handle generating entrance agenda or saving changes with toast
  const handleGenerateEntranceAgenda = () => {
    if (facilityEntranceData?.entranceAgenda?.isEditing) {
      // Save changes and return to generated view
      // Ensure we preserve the edited standardItems and customItems
      const updatedAgenda = {
        ...facilityEntranceData.entranceAgenda,
        isGenerated: true,
        isEditing: false,
        // Preserve edited standard items if they exist, otherwise use defaults
        standardItems: facilityEntranceData.entranceAgenda
          ?.standardItems || [
          "Introduction & Team Introductions",
          "Facility Overview & Demographics",
          "Survey Process & Timeline",
          "Document Review & Verification",
          "Staff Interviews & Observations",
          "Resident Care & Services Review",
          "Quality Assurance & Compliance",
          "Questions & Clarifications",
          "Next Steps & Schedule",
        ],
        // Preserve sub-menu items
        standardSubItems:
          facilityEntranceData.entranceAgenda?.standardSubItems || {},
        // Preserve custom items
        customItems:
          facilityEntranceData.entranceAgenda?.customItems || [],
      };
      updateFacilityEntranceData({
        entranceAgenda: updatedAgenda,
      });
      toast.success("Entrance agenda changes saved successfully", {
        position: "top-right",
      });
    } else {
      // Generate new agenda
      const currentAgenda = {
        facilityName: facilityName || "Facility Name",
        surveyDate: surveyInfo?.surveyCreationDate
          ? new Date(surveyInfo.surveyCreationDate).toLocaleDateString()
          : new Date().toLocaleDateString(),
        standardItems: [
          "Welcome and Introductions ",
          "Overview of Survey Process ",
          "Facility Overview ",
          "Required Documents Review ",
          "Unit and Departmental Rounds ",
          "Interviews and Record Reviews ",
          "Preliminary Feedback and Next Steps ",
        ],
        standardSubItems: {
          0: [
            "Introduce the mock survey team and facility leadership",
            "State the purpose of the mock survey (to identify opportunities for improvement and ensure survey readiness)",
          ],
          1: [
            "Brief explanation of mock survey objectives and process",
            "Outline expected timelines, areas of focus, and interview procedures",
          ],
          2: [
            "Provide a brief description of the facility (number of beds, census, units, specialty areas such as ventilator, memory care, etc.)",
            "Review recent changes in leadership, staffing, or ownership",
            "Share any current or pending Plans of Correction or Directed Plans of Correction",
          ],
          3: [
            "Facility census list and room numbers",
            "Current facility assessment",
            "Infection control plan",
            "Current staffing schedule and master schedule for past two weeks",
            "QAPI meeting minutes (last 3 months)",
            "List of residents with pressure injuries, falls, infections, or significant weight changes",
            "Current grievance log and incident/accident log",
          ],
          4: [
            "Environmental and nursing unit tours",
            "Dining and kitchen observations (if applicable)",
            "Medication room and storage inspection",
          ],
          5: [
            "Resident and staff interviews",
            "Review of clinical records (3–5 residents initially, more as needed)",
          ],
          6: [
            "Establish a plan for daily or end-of-day feedback",
            "Identify point of contact for questions or requests",
          ],
        },
        customItems:
          facilityEntranceData?.entranceAgenda?.customItems || [],
        isGenerated: true,
        isEditing: false,
      };

      updateFacilityEntranceData({
        entranceAgenda: currentAgenda,
      });
      toast.success("Entrance agenda generated successfully", {
        position: "top-right",
      });
    }
  };

  // Handle document file uploads with toast
  const handleDocumentFileUpload = async (documentType, files) => {
    if (files && files.length > 0) {
      const file = files[0];

      // Show loading toast
      const loadingToast = toast.loading(`Uploading ${file.name}...`, {
        position: "top-right",
      });

      try {
        // Upload file to server
        const uploadResponse = await api.user.uploadFile(file);

        if (uploadResponse && uploadResponse.statusCode === 200) {
          const fileData = {
            // name: file.name,
            // size: file.size,
            // type: file.type,
            // lastModified: file.lastModified,
            // fileName: file.name,
            docUrl: uploadResponse.data, // Store the uploaded file URL directly from data field
          };

          updateLocalDocument(documentType, {
            ...fileData,
            uploaded: true,
            uploadTimestamp: new Date().toISOString(),
          });

          toast.dismiss(loadingToast);
          toast.success(`Document uploaded successfully: ${file.name}`, {
            position: "top-right",
          });
        } else {
          throw new Error(uploadResponse?.message || "Upload failed");
        }
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error(`Failed to upload ${file.name}: ${error.message}`, {
          position: "top-right",
        });
      }
    } else {
      toast.error("Please select a file to upload", { position: "top-right" });
    }
  };

  // Handle document removal
  const handleDocumentRemove = (documentType) => {
    const currentDocuments = getDocumentsToUpload();
    const updatedDocuments = {
      ...currentDocuments,
      [documentType]: {
        uploaded: false,
        uploadTimestamp: null,
        docUrl: null,
      },
    };

    updateFacilityEntranceData({
      documentsToUpload: updatedDocuments,
    });
    toast.success("Document removed successfully", { position: "top-right" });
  };

  // Handle removing resident
  const handleRemoveResident = async (residentId) => {
    const surveyId = localStorage.getItem("currentSurveyId");
    if (!surveyId) return;

    const currentResidents = getResidents();
    
    // Optimistic update
    const updatedResidents = currentResidents.filter(
      (r) => r.id !== residentId
    );

    updateFacilityEntranceData({
      residents: updatedResidents,
    });

    // Only call API if it's a backend ID (not a temp ID)
    if (residentId && !String(residentId).startsWith('resident_')) {
      try {
        await api.survey.removeResidentFacilityEntrance({
          residentId: residentId,
          surveyId: surveyId,
        });
        toast.success("Resident removed from pool", { position: "top-right" });
      } catch (error) {
       
        // Revert on failure
        updateFacilityEntranceData({
          residents: currentResidents,
        });
        toast.error("Failed to remove resident", { position: "top-right" });
      }
    } else {
      toast.success("Resident removed from pool", { position: "top-right" });
    }
  };

  const handleAddResident = useCallback((residentData) => {
    // Auto-detect if this is a new admission (within last 30 days)
    const admissionDate = new Date(residentData.admissionDate);
    const isNewAdmission =
      new Date() - admissionDate <= 30 * 24 * 60 * 60 * 1000;

    if (editingResident) {
      const currentResidents = getResidents();
      const updatedResidents = currentResidents.map((r) => {
        if (r.id === editingResident.id) {
          return {
            ...r,
            ...residentData,
            admissionDate: residentData.admissionDate.toLocaleDateString("en-GB"),
            isNewAdmission: isNewAdmission,
          };
        }
        return r;
      });

      updateFacilityEntranceData({
        residents: updatedResidents,
      });
      toast.success("Resident updated successfully", {
        position: "top-right",
      });
    } else {
      const resident = {
        id: `resident_${Date.now()}`,
        ...residentData,
        admissionDate: residentData.admissionDate.toLocaleDateString("en-GB"),
        included: true,
        isNewAdmission: isNewAdmission,
        fiFlagged: false,
        ijHarm: false,
        surveyorNotes: "",
      };

      const currentResidents = getResidents();
      const updatedResidents = [...currentResidents, resident];

      updateFacilityEntranceData({
        residents: updatedResidents,
      });

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
    }

    setEditingResident(null);
    setShowResidentModal(false);
  }, [editingResident, getResidents, updateFacilityEntranceData]);

  const handleEditResident = useCallback((resident) => {
    // Parse date string "DD/MM/YYYY" back to Date object
    let dateObj = null;
    if (resident.admissionDate) {
      const parts = resident.admissionDate.split("/");
      if (parts.length === 3) {
        const [day, month, year] = parts;
        dateObj = new Date(`${year}-${month}-${day}`);
      }
    }

    setEditingResident({
      ...resident,
      admissionDate: dateObj,
    });
    setShowResidentModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowResidentModal(false);
    setEditingResident(null);
  }, []);

  // Initialize documentsToUpload structure if it doesn't exist
  React.useEffect(() => {
    const currentDocuments = getDocumentsToUpload();
    if (!currentDocuments || Object.keys(currentDocuments).length === 0) {
      updateFacilityEntranceData({ documentsToUpload: {} }, false);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Fetch facility name when component mounts or facilityId changes
  React.useEffect(() => {
    fetchFacilityName();
  }, []);

  // Handle facility entrance submission with API
  const handleFacilityEntranceSubmit = async (isContinueClicked = false) => {
    const surveyId = localStorage.getItem("currentSurveyId"); 

    if (!surveyId) {
      toast.error("Survey ID not found. Please start from the beginning.", {
        position: "top-right",
      });
      return;
    }


    setIsSubmitting(true);
    const loadingToast = toast.loading("Saving facility entrance data...", {
      position: "top-right",
    });

    try {
      // Prepare facility entrance payload (new API structure)
      const facilityEntrancePayload = {
        surveyId,
        status: "facility-entrance",
        entranceDate: facilityEntranceData?.entranceDate,
        entranceTime: facilityEntranceData?.entranceTime,
        entranceAttendees: (() => {
          const attendees = facilityEntranceData?.entranceAttendees || {};
          const { otherAttendees, ...attendeesWithoutOther } = attendees;
          const finalAttendees = { ...attendeesWithoutOther };
          if (
            otherAttendees &&
            Array.isArray(otherAttendees) &&
            otherAttendees.length > 0
          ) {
            const otherTitles = otherAttendees
              .filter((attendee) => attendee.title && attendee.title.trim())
              .map((attendee) => attendee.title.trim())
              .join(", ");
            if (otherTitles) {
              finalAttendees.other = true;
              finalAttendees.otherName = otherTitles;
            } else {
              finalAttendees.other = false;
              finalAttendees.otherName = "";
            }
          } else {
            // Keep existing other/otherName if present in fetched data
            if (attendees.other === undefined) finalAttendees.other = false;
            if (attendees.otherName === undefined) finalAttendees.otherName = "";
          }
          return finalAttendees;
        })(),
        facilityId:
          facilityEntranceData?.facilityId?._id ||
          facilityEntranceData?.facilityId ||
          surveyInfo?.facilityId?._id ||
          surveyInfo?.facilityId,
        customItems: facilityEntranceData?.customItems || [],
        isGenerated: facilityEntranceData?.isGenerated || false,
        isEditing: facilityEntranceData?.isEditing || false,
        entranceNotes: facilityEntranceData?.entranceNotes || "",
        entranceAgenda: (() => {
          const agendaObj = facilityEntranceData?.entranceAgenda;
          // If it's already an array (from API and not yet transformed/edited), return it
          if (Array.isArray(agendaObj)) return agendaObj;
          
          if (!agendaObj || !agendaObj.isGenerated) return [];

          const apiAgenda = [];

          // Standard Items
          if (
            agendaObj.standardItems &&
            Array.isArray(agendaObj.standardItems)
          ) {
            agendaObj.standardItems.forEach((title, index) => {
              apiAgenda.push({
                title,
                items: (agendaObj.standardSubItems?.[index] || []).map(
                  (desc) => ({ description: desc })
                ),
              });
            });
          }

          // Custom Items
          if (agendaObj.customItems && Array.isArray(agendaObj.customItems)) {
            agendaObj.customItems.forEach((title) => {
              apiAgenda.push({
                title,
                items: [],
              });
            });
          }

          return apiAgenda;
        })(),
        bindingArbitration: facilityEntranceData?.bindingArbitration || {},
        residents: getResidents().map((resident) => {
          const { _id, id, ...rest } = resident;
          
          const residentPayload = {
            ...rest,
            specialTypesOthers: Array.isArray(resident.specialTypesOthers)
              ? resident.specialTypesOthers
              : resident.specialTypesOthers
              ? [resident.specialTypesOthers]
              : [],
          };

          // Only include residentId if it's an existing resident (not a temporary frontend ID)
          const residentId = _id || resident.residentId || (id && !id.toString().startsWith("resident_") ? id : undefined);
          
          if (residentId) {
            residentPayload.residentId = residentId;
          }

          return residentPayload;
        }),
        documentsToUpload: (facilityEntranceData?.documentsToUpload || []).map(
          (doc) => {
            const { _id, ...rest } = doc;
            return {
              ...rest,
              documentId: _id || doc.documentId,
            };
          }
        ),
        requestedEntranceItems: (
          facilityEntranceData?.requestedEntranceItems || []
        ).map((item) => {
          const { _id, ...rest } = item;
          return {
            ...rest,
            requestedEntranceItemId: _id || item.requestedEntranceItemId,
          };
        }),
        initialAssessments: (
          facilityEntranceData?.initialAssessments || []
        ).map((assessment) => {
          const { _id, ...rest } = assessment;
          return {
            ...rest,
            initialAssessmentId: _id || assessment.initialAssessmentId,
          };
        }),
      };

      // Check if online before making API call
      if (!navigator.onLine) {
        // Save offline and inform user
        const saveOfflineData = async (payload) => {
          try {
            const offlineData = {
              ...payload,
              submittedAt: new Date().toISOString(),
              apiEndpoint: "submitFacilityEntrance", // Store which API to call
              apiMethod: "survey", // Store API method/namespace
            };

            // Step 1: Save to IndexedDB sync queue (permanent storage)
            let syncQueueId = null;
            if (surveyId) {
              const stepId = "facility-entrance";
              const syncItem = await surveyIndexedDB.addToSyncQueue(
                surveyId,
                stepId,
                offlineData,
                "api_facility_entrance" // type for API-based facility entrance
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

        await saveOfflineData(facilityEntrancePayload);
        toast.dismiss(loadingToast);
        toast.success("Internet connectivity issues detected. Data saved offline and will sync when connection is restored.", {
          position: "top-right",
          duration: 5000,
        });
        setIsSubmitting(false);
        return; // Exit early - data is saved offline
      }

      

      // Submit the step data (only if online)
      const response = await api.survey.submitFacilityEntrance(facilityEntrancePayload);

      if (response) {
        toast.dismiss(loadingToast);

        // Clear unsaved changes after successful save
        setHasUnsavedChanges(false);

        isContinueClicked &&
          toast.success(
            "Facility entrance data saved successfully! Moving to next step...",
            {
              position: "top-right",
              duration: 5000,
            }
          );

        // Move to next step
        // check if user clicked the continue button
        if (isContinueClicked) {
          setCurrentStep(4);
          setIsContinueClicked(false);
        }
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      isContinueClicked &&
        toast.error(
          error.message ||
            "Failed to save facility entrance data. Please try again.",
          { position: "top-right", duration: 5000 }
        );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle probe response with F-Tag API integration
  const handleProbeResponse = async (
    probeKey,
    question,
    answer,
    probeItem,
    currentProbeList,
    section = "kitchenQuickVisit"
  ) => {
    setIsLoadingFTag(true);
    setLoadingProbeKey(probeKey);

    // Show thinking indicator
    const thinkingToast = toast.loading("Analyzing probe response...", {
      position: "top-right",
      duration: Infinity,
    });

    try {
      // Call the F-Tag API to get citation information
      const fTagResponse = await api.healthAssistant.getFTagInfo(
        question,
        answer
      );

      // Dismiss thinking toast
      toast.dismiss(thinkingToast);

      if (fTagResponse.success && fTagResponse.data) {
        const { ftag, citation, compliant, explanation } = fTagResponse.data;

        // Update the probe with API response data
        const updatedProbes = {
          ...currentProbeList,
          [probeKey]: {
            ...currentProbeList[probeKey],
            status: answer,
            probe: question,
            fTag: ftag || probeItem.fTag,
            citation: citation || "",
            compliant: compliant,
            explanation: explanation || "",
            citationNote: citation || "",
            lastUpdated: new Date().toISOString(),
          },
        };

        // Update local state immediately
        if (section === "facilityEnvironmentalTour") {
          updateLocalInitialAssessment("facilityEnvironmentalTour", {
            probeList: updatedProbes,
          });
        } else {
          updateLocalInitialAssessment("kitchenQuickVisit", {
            probeList: updatedProbes,
          });
        }

        // Show success toast with F-Tag information
        if (ftag) {
          toast.success(`Probe response recorded successfully`, {
            position: "top-right",
            duration: 5000,
          });
        } else {
          toast.success("Probe response recorded successfully", {
            position: "top-right",
          });
        }
      } else {
        throw new Error(
          fTagResponse.message || "Failed to get F-Tag information"
        );
      }
    } catch (error) {
      // Dismiss thinking toast
      toast.dismiss(thinkingToast);

      // Fallback to original behavior if API fails
      const updatedProbes = {
        ...currentProbeList,
        [probeKey]: {
          ...currentProbeList[probeKey],
          status: answer,
          probe: question,
          fTag:
            (probeItem.citeOnYes && answer === "Yes") ||
            (!probeItem.citeOnYes && answer === "No")
              ? probeItem.fTag
              : null,
          citationNote:
            (probeItem.citeOnYes && answer === "Yes") ||
            (!probeItem.citeOnYes && answer === "No")
              ? `${question} - ${probeItem.fTag} citation required`
              : "",
          apiError: error.message,
          lastUpdated: new Date().toISOString(),
        },
      };

      // Update the appropriate section based on the section parameter
      if (section === "facilityEnvironmentalTour") {
        updateLocalInitialAssessment("facilityEnvironmentalTour", {
          probeList: updatedProbes,
        });
      } else {
        updateLocalInitialAssessment("kitchenQuickVisit", {
          probeList: updatedProbes,
        });
      }

      toast.warning(`Probe recorded (API unavailable): ${error.message}`, {
        position: "top-right",
      });
    } finally {
      setIsLoadingFTag(false);
      setLoadingProbeKey(null);
    }
  };

  const handleNext = () => {
    if (hasUnsavedChanges) {
      setPendingNavigation({ type: 'step', target: 4 });
      setShowExitWarning(true);
    } else {
      setCurrentStep(4);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 sm:pb-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
              {sectionData[2].title}
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm leading-tight">
              {sectionData[2].description}
            </p>
          </div>
        </div>
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

      <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Entrance Conference Details */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-600" />
              Entrance Conference Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Entrance Date
                </Label>
                <DatePicker
                  date={
                    facilityEntranceData?.entranceDate
                      ? new Date(facilityEntranceData.entranceDate)
                      : undefined
                  }
                  onSelect={(date) =>
                    updateFacilityEntranceData({
                      entranceDate: date ? date.toISOString().split("T")[0] : null,
                    })
                  }
                  placeholder="Select entrance date"
                  className="w-full"
                  disabled={isInvitedUser() || isSurveyClosed}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Entrance Time
                </Label>
                <Input
                  type="time"
                  disabled={isInvitedUser() || isSurveyClosed}
                  value={facilityEntranceData?.entranceTime || ""}
                  onChange={(e) =>
                    updateFacilityEntranceData({ entranceTime: e.target.value })
                  }
                  className="h-10"
                />
              </div>
            </div>
            {/* Entrance Conference Attendees */}
            <div className="mb-4 mt-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-600" />
                Entrance Conference Attendees
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {Object.entries({
                  administrator: "Administrator",
                  directorOfNursing: "Director of Nursing",
                  socialServicesDirector: "Social Services Director",
                  medicalDirector: "Medical Director",
                  qualityAssuranceDirector: "Quality Assurance Director",
                }).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center py-3 px-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      disabled={isInvitedUser() || isSurveyClosed}
                      checked={
                        facilityEntranceData?.entranceAttendees?.[key] || false
                      }
                      onChange={(e) => {
                        const currentAttendees =
                          facilityEntranceData?.entranceAttendees || {};
                        const updatedAttendees = {
                          ...currentAttendees,
                          [key]: e.target.checked,
                        };

                        updateFacilityEntranceData({
                          entranceAttendees: updatedAttendees,
                        });
                      }}
                      className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500 mr-3"
                    />
                    <span className="text-gray-900">{label}</span>
                  </label>
                ))}

                {/* Other Attendee Option */}
                <div className="md:col-span-2">
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
                      <span className="text-sm sm:text-base text-gray-900 font-medium">
                        Other Attendees
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const currentAttendees =
                            facilityEntranceData?.entranceAttendees || {};
                          const currentOthers =
                            currentAttendees.otherAttendees || [];
                          const updatedAttendees = {
                            ...currentAttendees,
                            otherAttendees: [...currentOthers, { title: "" }],
                          };

                          updateFacilityEntranceData({
                            entranceAttendees: updatedAttendees,
                          });
                        }}
                        disabled={isInvitedUser() || isSurveyClosed}
                        className="w-full sm:w-auto text-xs sm:text-sm text-gray-600 border-gray-300 hover:bg-gray-50"
                      >
                        + Add Other Attendee
                      </Button>
                    </div>

                    {(
                      facilityEntranceData?.entranceAttendees?.otherAttendees ||
                      []
                    ).map((attendee, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-2 mb-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <Input
                            placeholder="Enter attendee title..."
                            value={attendee.title || ""}
                            onChange={(e) => {
                              const currentAttendees =
                                facilityEntranceData?.entranceAttendees || {};
                              const currentOthers = [
                                ...(currentAttendees.otherAttendees || []),
                              ];
                              currentOthers[index] = {
                                ...currentOthers[index],
                                title: e.target.value,
                              };
                              const updatedAttendees = {
                                ...currentAttendees,
                                otherAttendees: currentOthers,
                              };

                              updateFacilityEntranceData({
                                entranceAttendees: updatedAttendees,
                              });
                            }}
                            className="h-9"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentAttendees =
                              facilityEntranceData?.entranceAttendees || {};
                            const currentOthers = [
                              ...(currentAttendees.otherAttendees || []),
                            ];
                            currentOthers.splice(index, 1);
                            const updatedAttendees = {
                              ...currentAttendees,
                              otherAttendees: currentOthers,
                            };

                            updateFacilityEntranceData({
                              entranceAttendees: updatedAttendees,
                            });
                          }}
                          className="text-red-600 border-red-300 hover:bg-red-50 px-2"
                        >
                          ×
                        </Button>
                      </div>
                    ))}

                    {(!facilityEntranceData?.entranceAttendees
                      ?.otherAttendees ||
                      facilityEntranceData.entranceAttendees.otherAttendees
                        .length === 0) && (
                      <p className="text-gray-500 text-sm italic ml-4">
                        No other attendees added yet. Click "Add Other Attendee"
                        to add one.
                      </p>
                    )}

                    {facilityEntranceData?.entranceAttendees?.other &&
                      facilityEntranceData?.entranceAttendees?.otherName && (
                        <div className="ml-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium text-blue-900">
                              {facilityEntranceData.entranceAttendees.otherName}
                            </span>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>

            {/* Facility Entrance Conference */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-600" />
                Facility Entrance Conference
              </h4>

              <div className="space-y-4">
                {!facilityEntranceData?.entranceAgenda?.isGenerated ||
                facilityEntranceData?.entranceAgenda?.isEditing ? (
                  <>
                    <p className="text-sm text-gray-600">
                      {facilityEntranceData?.entranceAgenda?.isEditing
                        ? "Edit your generated agenda. Make changes below and click 'Save Changes' to update."
                        : "Generate a comprehensive mock entrance agenda for the facility entrance conference."}
                    </p>

                    {/* Facility Information */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-3">
                        Facility Information
                      </h5>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4 text-gray-600" />
                          <div>
                            <span className="text-xs font-medium text-gray-700">
                              Facility Name:
                            </span>
                            <span className="ml-2 text-sm text-gray-900 font-medium">
                              {facilityName || "No facility selected"}
                            </span>
                          </div>
                          {!facilityName && (
                            <p className="text-xs text-gray-600 mt-1">
                              Please select a facility in Survey Setup first
                            </p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-600" />
                          <div>
                            <span className="text-xs font-medium text-gray-700">
                              Survey Date:
                            </span>
                            <span className="ml-2 text-sm text-gray-900">
                              {surveyInfo?.surveyCreationDate
                                ? new Date(
                                    surveyInfo.surveyCreationDate
                                  ).toLocaleDateString()
                                : new Date().toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Standard Agenda Items Preview */}
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <h5 className="font-medium text-gray-900">
                            {facilityEntranceData?.entranceAgenda?.isEditing
                              ? "Edit Standard Agenda Items"
                              : "Standard Agenda Items (will be included):"}
                          </h5>
                          {facilityEntranceData?.entranceAgenda?.isEditing && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-blue-100 text-blue-800 border-blue-200"
                            >
                              Edit Mode
                            </Badge>
                          )}
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                            >
                              <Info className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-96 p-4 max-h-80">
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 mb-3">
                                Standard Agenda Items Details
                              </h4>
                              <div className="space-y-3 text-sm overflow-y-auto max-h-56 pr-2">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    1. Welcome and Introductions 
                                  </div>
                                  <ul className="ml-4 mt-1 space-y-1 text-gray-600">
                                    <li>
                                      • Introduce the mock survey team and
                                      facility leadership
                                    </li>
                                    <li>
                                      • State the purpose of the mock survey (to
                                      identify opportunities for improvement and
                                      ensure survey readiness)
                                    </li>
                                  </ul>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    2. Overview of Survey Process 
                                  </div>
                                  <ul className="ml-4 mt-1 space-y-1 text-gray-600">
                                    <li>
                                      • Brief explanation of mock survey
                                      objectives and process
                                    </li>
                                    <li>
                                      • Outline expected timelines, areas of
                                      focus, and interview procedures
                                    </li>
                                  </ul>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    3. Facility Overview (10 minutes)
                                  </div>
                                  <ul className="ml-4 mt-1 space-y-1 text-gray-600">
                                    <li>
                                      • Provide a brief description of the
                                      facility (number of beds, census, units,
                                      specialty areas such as ventilator, memory
                                      care, etc.)
                                    </li>
                                    <li>
                                      • Review recent changes in leadership,
                                      staffing, or ownership
                                    </li>
                                    <li>
                                      • Share any current or pending Plans of
                                      Correction or Directed Plans of Correction
                                    </li>
                                  </ul>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    4. Required Documents Review 
                                  </div>
                                  <ul className="ml-4 mt-1 space-y-1 text-gray-600">
                                    <li>
                                      • Facility census list and room numbers
                                    </li>
                                    <li>• Current facility assessment</li>
                                    <li>• Infection control plan</li>
                                    <li>
                                      • Current staffing schedule and master
                                      schedule for past two weeks
                                    </li>
                                    <li>
                                      • QAPI meeting minutes (last 3 months)
                                    </li>
                                    <li>
                                      • List of residents with pressure
                                      injuries, falls, infections, or
                                      significant weight changes
                                    </li>
                                    <li>
                                      • Current grievance log and
                                      incident/accident log
                                    </li>
                                  </ul>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    5. Unit and Departmental Rounds (20–30
                                    minutes)
                                  </div>
                                  <ul className="ml-4 mt-1 space-y-1 text-gray-600">
                                    <li>
                                      • Environmental and nursing unit tours
                                    </li>
                                    <li>
                                      • Dining and kitchen observations (if
                                      applicable)
                                    </li>
                                    <li>
                                      • Medication room and storage inspection
                                    </li>
                                  </ul>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    6. Interviews and Record Reviews (Time as
                                    Needed)
                                  </div>
                                  <ul className="ml-4 mt-1 space-y-1 text-gray-600">
                                    <li>• Resident and staff interviews</li>
                                    <li>
                                      • Review of clinical records (3–5
                                      residents initially, more as needed)
                                    </li>
                                  </ul>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    7. Preliminary Feedback and Next Steps (5
                                    minutes)
                                  </div>
                                  <ul className="ml-4 mt-1 space-y-1 text-gray-600">
                                    <li>
                                      • Establish a plan for daily or end-of-day
                                      feedback
                                    </li>
                                    <li>
                                      • Identify point of contact for questions
                                      or requests
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Show editable interface when in edit mode */}
                      {facilityEntranceData?.entranceAgenda?.isEditing ? (
                        <div className="mt-4 space-y-3">
                          <div className="text-sm text-gray-700 mb-3">
                            <p>
                              Edit the standard agenda items and their sub-menu
                              details below. Make changes and click 'Save
                              Changes' to update.
                            </p>
                          </div>
                          <div className="space-y-3">
                            {[
                              "Welcome and Introductions ",
                              "Overview of Survey Process",
                              "Facility Overview",
                              "Required Documents Review ",
                              "Unit and Departmental Rounds ",
                              "Interviews and Record Reviews ",
                              "Preliminary Feedback and Next Steps ",
                            ].map((item, index) => (
                              <div
                                key={index}
                                className="p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="font-medium text-gray-900 mb-3">
                                  {index + 1}.{" "}
                                  {facilityEntranceData?.entranceAgenda
                                    ?.standardItems?.[index] || item}
                                </div>

                                {/* Main Item Title */}
                                <div className="mb-3">
                                  <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Main Item Title:
                                  </label>
                                  <textarea
                                    value={
                                      facilityEntranceData?.entranceAgenda
                                        ?.standardItems?.[index] || item
                                    }
                                    onChange={(e) => {
                                      const currentStandardItems = facilityEntranceData
                                        .entranceAgenda?.standardItems || [
                                        "Welcome and Introductions ",
                                        "Overview of Survey Process ",
                                        "Facility Overview ",
                                        "Required Documents Review ",
                                        "Unit and Departmental Rounds ",
                                        "Interviews and Record Reviews ",
                                        "Preliminary Feedback and Next Steps ",
                                      ];
                                      const updatedStandardItems = [
                                        ...currentStandardItems,
                                      ];
                                      updatedStandardItems[index] =
                                        e.target.value;

                                      const currentAgenda =
                                        facilityEntranceData?.entranceAgenda ||
                                        {};
                                      const updatedAgenda = {
                                        ...currentAgenda,
                                        standardItems: updatedStandardItems,
                                      };

                                      updateFacilityEntranceData({
                                        entranceAgenda: updatedAgenda,
                                      });
                                    }}
                                    placeholder={item}
                                    rows={2}
                                    disabled={isInvitedUser() || isSurveyClosed}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </div>

                                {/* Sub-menu Items */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-2">
                                    Sub-menu Details:
                                  </label>
                                  <div className="space-y-2">
                                    {(() => {
                                      // Get default sub-items based on index
                                      const getDefaultSubItems = (idx) => {
                                        const defaults = {
                                          0: [
                                            "Introduce the mock survey team and facility leadership",
                                            "State the purpose of the mock survey (to identify opportunities for improvement and ensure survey readiness)",
                                          ],
                                          1: [
                                            "Brief explanation of mock survey objectives and process",
                                            "Outline expected timelines, areas of focus, and interview procedures",
                                          ],
                                          2: [
                                            "Provide a brief description of the facility (number of beds, census, units, specialty areas such as ventilator, memory care, etc.)",
                                            "Review recent changes in leadership, staffing, or ownership",
                                            "Share any current or pending Plans of Correction or Directed Plans of Correction",
                                          ],
                                          3: [
                                            "Facility census list and room numbers",
                                            "Current facility assessment",
                                            "Infection control plan",
                                            "Current staffing schedule and master schedule for past two weeks",
                                            "QAPI meeting minutes (last 3 months)",
                                            "List of residents with pressure injuries, falls, infections, or significant weight changes",
                                            "Current grievance log and incident/accident log",
                                          ],
                                          4: [
                                            "Environmental and nursing unit tours",
                                            "Dining and kitchen observations (if applicable)",
                                            "Medication room and storage inspection",
                                          ],
                                          5: [
                                            "Resident and staff interviews",
                                            "Review of clinical records (3–5 residents initially, more as needed)",
                                          ],
                                          6: [
                                            "Establish a plan for daily or end-of-day feedback",
                                            "Identify point of contact for questions or requests",
                                          ],
                                        };
                                        return defaults[idx] || [];
                                      };

                                      // Get current sub-items or use defaults
                                      const currentSubItems =
                                        facilityEntranceData?.entranceAgenda
                                          ?.standardSubItems || {};
                                      const currentItemSubItems =
                                        currentSubItems[index] ||
                                        getDefaultSubItems(index);

                                      return currentItemSubItems.map(
                                        (subItem, subIndex) => (
                                          <div
                                            key={subIndex}
                                            className="flex items-center space-x-2"
                                          >
                                            <span className="text-xs text-gray-500 w-4">
                                              •
                                            </span>
                                            <textarea
                                              value={subItem}
                                              onChange={(e) => {
                                                const updatedSubItems = [
                                                  ...currentItemSubItems,
                                                ];
                                                updatedSubItems[subIndex] =
                                                  e.target.value;

                                                const currentAgenda =
                                                  facilityEntranceData?.entranceAgenda ||
                                                  {};
                                                const updatedAgenda = {
                                                  ...currentAgenda,
                                                  standardSubItems: {
                                                    ...currentSubItems,
                                                    [index]: updatedSubItems,
                                                  },
                                                };

                                                updateFacilityEntranceData({
                                                  entranceAgenda: updatedAgenda,
                                                });
                                              }}
                                              placeholder="Enter sub-menu item"
                                              rows={1}
                                              disabled={
                                                isInvitedUser() ||
                                                isSurveyClosed
                                              }
                                              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 resize-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                            <Button
                                              onClick={() => {
                                                const updatedSubItems =
                                                  currentItemSubItems.filter(
                                                    (_, i) => i !== subIndex
                                                  );

                                                const currentAgenda =
                                                  facilityEntranceData?.entranceAgenda ||
                                                  {};
                                                const updatedAgenda = {
                                                  ...currentAgenda,
                                                  standardSubItems: {
                                                    ...currentSubItems,
                                                    [index]: updatedSubItems,
                                                  },
                                                };

                                                updateFacilityEntranceData({
                                                  entranceAgenda: updatedAgenda,
                                                });
                                              }}
                                              disabled={
                                                isInvitedUser() ||
                                                isSurveyClosed
                                              }
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              <X className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        )
                                      );
                                    })()}
                                  </div>

                                  {/* Add New Sub-menu Item Button */}
                                  <div className="mt-3">
                                    <Button
                                      onClick={() => {
                                        const getDefaultSubItems = (idx) => {
                                          const defaults = {
                                            0: [
                                              "Survey team member introductions",
                                              "Facility leadership introductions",
                                              "Meeting purpose and objectives",
                                            ],
                                            1: [
                                              "Facility size and capacity",
                                              "Current census and occupancy",
                                              "Specialized care units",
                                            ],
                                            2: [
                                              "Survey methodology overview",
                                              "Daily schedule and expectations",
                                              "Communication protocols",
                                            ],
                                            3: [
                                              "Required documentation review",
                                              "Policy and procedure verification",
                                              "Compliance documentation check",
                                            ],
                                            4: [
                                              "Staff interview schedule",
                                              "Observation protocols",
                                              "Documentation requirements",
                                            ],
                                            5: [
                                              "Care plan review process",
                                              "Service delivery assessment",
                                              "Quality indicators review",
                                            ],
                                            6: [
                                              "QAPI program review",
                                              "Compliance monitoring",
                                              "Performance improvement initiatives",
                                            ],
                                            7: [
                                              "Open discussion period",
                                              "Process clarification",
                                              "Facility concerns and questions",
                                            ],
                                            8: [
                                              "Tomorrow's schedule",
                                              "Preparation requirements",
                                              "Contact information and protocols",
                                            ],
                                          };
                                          return defaults[idx] || [];
                                        };

                                        const currentSubItems =
                                          facilityEntranceData?.entranceAgenda
                                            ?.standardSubItems || {};
                                        const currentItemSubItems =
                                          currentSubItems[index] ||
                                          getDefaultSubItems(index);
                                        const newSubItem = "New sub-menu item";
                                        const updatedSubItems = [
                                          ...currentItemSubItems,
                                          newSubItem,
                                        ];

                                        const currentAgenda =
                                          facilityEntranceData?.entranceAgenda ||
                                          {};
                                        const updatedAgenda = {
                                          ...currentAgenda,
                                          standardSubItems: {
                                            ...currentSubItems,
                                            [index]: updatedSubItems,
                                          },
                                        };

                                        updateFacilityEntranceData({
                                          entranceAgenda: updatedAgenda,
                                        });
                                      }}
                                      disabled={
                                        isInvitedUser() || isSurveyClosed
                                      }
                                      size="sm"
                                      variant="outline"
                                      className="h-6 px-2 text-xs text-gray-600 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Add Sub-item
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Custom Items - Editable in Edit Mode */}
                          {facilityEntranceData?.entranceAgenda?.customItems &&
                            facilityEntranceData.entranceAgenda.customItems
                              .length > 0 && (
                              <div className="mt-6 pt-4 border-t border-gray-200">
                                <h6 className="font-medium text-gray-800 mb-3">
                                  Custom Agenda Items:
                                </h6>
                                <div className="space-y-3">
                                  {facilityEntranceData.entranceAgenda.customItems.map(
                                    (item, index) => (
                                      <div
                                        key={index}
                                        className="p-3 bg-gray-50 rounded-lg"
                                      >
                                        <div className="font-medium text-gray-900 mb-2">
                                          {index + 10}. {item}
                                        </div>
                                        <textarea
                                          value={item}
                                          onChange={(e) => {
                                            const currentCustomItems = [
                                              ...facilityEntranceData
                                                .entranceAgenda.customItems,
                                            ];
                                            currentCustomItems[index] =
                                              e.target.value;

                                            const currentAgenda =
                                              facilityEntranceData
                                                ?.entranceAgenda || {};
                                            const updatedAgenda = {
                                              ...currentAgenda,
                                              customItems: currentCustomItems,
                                            };

                                            updateFacilityEntranceData({
                                              entranceAgenda: updatedAgenda,
                                            });
                                          }}
                                          placeholder="Enter custom agenda item"
                                          rows={3}
                                          disabled={
                                            isInvitedUser() || isSurveyClosed
                                          }
                                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-gray-700">
                          <p>
                            7 standard agenda items will be automatically
                            included in your generated agenda.
                          </p>
                          <p className="text-xs mt-1">
                            Click "View Details" to see the complete breakdown
                            of each item.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Add Custom Agenda Item */}
                    <div className="p-4  border border-gray-200 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-3">
                        Add Custom Agenda Item
                      </h5>
                      <div className="flex space-x-2">
                        <Input
                          value={newAgendaItem}
                          onChange={(e) => setNewAgendaItem(e.target.value)}
                          placeholder="Enter custom agenda item..."
                          className="flex-1 h-10"
                          disabled={isInvitedUser() || isSurveyClosed}
                        />
                        <Button
                          onClick={handleAddCustomAgendaItem}
                          disabled={
                            !newAgendaItem.trim() ||
                            isInvitedUser() ||
                            isSurveyClosed
                          }
                          variant="outline"
                          className="h-10 px-4 bg-[#075b7d] text-white border-[#075b7d] hover:bg-[#075b7d]/90 disabled:bg-gray-300 disabled:border-gray-300 disabled:text-gray-500"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Item
                        </Button>
                      </div>

                      {/* Display existing custom items with remove option */}
                      {facilityEntranceData?.entranceAgenda?.customItems &&
                        facilityEntranceData.entranceAgenda.customItems.length >
                          0 && (
                          <div className="mt-4 space-y-2">
                            <h6 className="text-sm font-medium text-gray-700">
                              Current Custom Items:
                            </h6>
                            {facilityEntranceData.entranceAgenda.customItems.map(
                              (item, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded"
                                >
                                  <span className="text-sm text-gray-900">
                                    {index + 10}. {item}
                                  </span>
                                  <Button
                                    onClick={() =>
                                      handleRemoveCustomAgendaItem(index)
                                    }
                                    disabled={isInvitedUser() || isSurveyClosed}
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              )
                            )}
                          </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2">
                      {facilityEntranceData?.entranceAgenda?.isEditing && (
                        <Button
                          onClick={() => {
                            // Cancel editing and return to generated view
                            const currentAgenda =
                              facilityEntranceData?.entranceAgenda || {};
                            const updatedAgenda = {
                              ...currentAgenda,
                              isGenerated: true,
                              isEditing: false,
                            };

                            updateFacilityEntranceData({
                              entranceAgenda: updatedAgenda,
                            });
                          }}
                          disabled={isSurveyClosed}
                          variant="outline"
                          className="px-6 h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </Button>
                      )}

                      <Button
                        onClick={handleGenerateEntranceAgenda}
                        disabled={ isInvitedUser() || isSurveyClosed }
                        variant="default"
                        className="px-8 h-10 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {facilityEntranceData?.entranceAgenda?.isEditing
                          ? "Save Changes"
                          : "Generate Mock Entrance Agenda"}
                      </Button>
                    </div>

                    {!surveyInfo?.facilityId &&
                      !facilityEntranceData?.facilityId && (
                        <p className="text-sm text-gray-500 text-center mt-2">
                          Please select a facility in Survey Setup to generate an
                          agenda
                        </p>
                      )}
                  </>
                ) : (
                  <>
                    {/* Generated Agenda Display */}
                    <div id="printable-agenda" className="space-y-4">
                      {/* Success Message */}
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex ">
                          <CheckSquare className="w-5 h-5 text-gray-600 mr-2 mt-1" />
                          <div>
                            <h5 className="font-medium text-gray-900">
                              Agenda Generated Successfully!
                            </h5>
                            <p className="text-sm text-gray-700">
                              Your mock entrance conference agenda is ready. You
                              can now edit, print, export, or delete it as
                              needed.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Header Information */}
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <h5 className="font-semibold text-gray-900 mb-2">
                          {facilityName || "Facility Name"} - Mock Survey
                          Entrance Conference
                        </h5>
                        <p className="text-sm text-gray-700 mb-2">
                          Survey Date:{" "}
                          {surveyInfo?.surveyCreationDate
                            ? new Date(
                                surveyInfo.surveyCreationDate
                              ).toLocaleDateString()
                            : new Date().toLocaleDateString()}
                        </p>
                      </div>

                      {/* Conference Attendees */}
                      <div className="p-4 bg-white border border-gray-200 rounded-lg">
                        <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                          <Users className="w-4 h-4 mr-2 text-gray-600" />
                          Conference Attendees
                        </h5>
                        <div className="space-y-2">
                          {/* Standard Attendees */}
                          {Object.entries({
                            administrator: "Administrator",
                            directorOfNursing: "Director of Nursing",
                            socialServicesDirector: "Social Services Director",
                            medicalDirector: "Medical Director",
                            qualityAssuranceDirector:
                              "Quality Assurance Director",
                          }).map(([key, label]) => {
                            if (
                              (facilityEntranceData?.entranceAttendees || {})[
                                key
                              ]
                            ) {
                              return (
                                <div
                                  key={key}
                                  className="flex items-center text-sm text-gray-700"
                                >
                                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                                  {label}
                                </div>
                              );
                            }
                            return null;
                          })}

                          {/* Other Attendees */}
                          {facilityEntranceData?.entranceAttendees?.other &&
                            facilityEntranceData?.entranceAttendees
                              ?.otherName && (
                              <div className="flex items-center text-sm text-gray-700">
                                <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                                {
                                  facilityEntranceData.entranceAttendees
                                    .otherName
                                }
                              </div>
                            )}

                          {/* No attendees selected message */}
                          {!Object.values(
                            facilityEntranceData?.entranceAttendees || {}
                          ).some((val) =>
                            typeof val === "boolean"
                              ? val
                              : Array.isArray(val) && val.length > 0
                          ) && (
                            <p className="text-sm text-gray-500 italic">
                              No attendees selected yet.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Standard Agenda Items with Bullet Points */}
                      <div className="space-y-3">
                        <h5 className="font-medium text-gray-900">
                          Standard Agenda Items:
                        </h5>
                        <div className="space-y-3">
                          {( 
                            facilityEntranceData?.entranceAgenda
                              ?.standardItems || [
                              "Welcome and Introductions ",
                              "Overview of Survey Process ",
                              "Facility Overview ",
                              "Required Documents Review ",
                              "Unit and Departmental Rounds ",
                              "Interviews and Record Reviews ",
                              "Preliminary Feedback and Next Steps ",
                            ]
                          ).map((item, index) => (
                            <div
                              key={index}
                              className="p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="font-medium text-gray-900 mb-2">
                                {index + 1}. {item}
                              </div>
                              <ul className="ml-4 space-y-1 text-sm text-gray-700">
                                {(
                                  facilityEntranceData?.entranceAgenda
                                    ?.standardSubItems?.[index] ||
                                  (index === 0
                                    ? [
                                        "Introduce the mock survey team and facility leadership",
                                        "State the purpose of the mock survey (to identify opportunities for improvement and ensure survey readiness)",
                                      ]
                                    : index === 1
                                    ? [
                                        "Brief explanation of mock survey objectives and process",
                                        "Outline expected timelines, areas of focus, and interview procedures",
                                      ]
                                    : index === 2
                                    ? [
                                        "Provide a brief description of the facility (number of beds, census, units, specialty areas such as ventilator, memory care, etc.)",
                                        "Review recent changes in leadership, staffing, or ownership",
                                        "Share any current or pending Plans of Correction or Directed Plans of Correction",
                                      ]
                                    : index === 3
                                    ? [
                                        "Facility census list and room numbers",
                                        "Current facility assessment",
                                        "Infection control plan",
                                        "Current staffing schedule and master schedule for past two weeks",
                                        "QAPI meeting minutes (last 3 months)",
                                        "List of residents with pressure injuries, falls, infections, or significant weight changes",
                                        "Current grievance log and incident/accident log",
                                      ]
                                    : index === 4
                                    ? [
                                        "Environmental and nursing unit tours",
                                        "Dining and kitchen observations (if applicable)",
                                        "Medication room and storage inspection",
                                      ]
                                    : index === 5
                                    ? [
                                        "Resident and staff interviews",
                                        "Review of clinical records (3–5 residents initially, more as needed)",
                                      ]
                                    : index === 6
                                    ? [
                                        "Establish a plan for daily or end-of-day feedback",
                                        "Identify point of contact for questions or requests",
                                      ]
                                    : [])
                                ).map((subItem, subIndex) => (
                                  <li key={subIndex}>• {subItem}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Custom Agenda Items */}
                      {facilityEntranceData?.entranceAgenda?.customItems &&
                        facilityEntranceData.entranceAgenda.customItems.length >
                          0 && (
                          <div className="space-y-2">
                            <h5 className="font-medium text-gray-900">
                              Custom Agenda Items:
                            </h5>
                            <div className="space-y-2">
                              {facilityEntranceData.entranceAgenda.customItems.map(
                                (item, index) => (
                                  <div
                                    key={index}
                                    className="p-3 bg-gray-50 rounded-lg border-l-4 border-gray-300"
                                  >
                                    <div className="font-medium text-gray-900">
                                      {index + 10}. {item}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Action Buttons */}
                      <div className=" pt-4">
                        <div className="flex flex-wrap gap-2 ">
                          <Button
                            onClick={() => {
                              // Switch to edit mode while preserving all agenda data
                              const currentAgenda =
                                facilityEntranceData?.entranceAgenda || {};
                              const updatedAgenda = {
                                ...currentAgenda,
                                isGenerated: false,
                                isEditing: true,
                              };

                              updateFacilityEntranceData({
                                entranceAgenda: updatedAgenda,
                              });
                            }}
                            variant="outline"
                            className="px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isInvitedUser() || isSurveyClosed}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Edit Agenda
                          </Button>

                          <Button
                            onClick={() => {
                              const printContent =
                                document.getElementById("printable-agenda");
                              if (printContent) {
                                const printWindow = window.open("", "_blank");
                                printWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>${
                                          facilityName || "Facility Name"
                                        } - Entrance Conference Agenda</title>
                                        <style>
                                          body { font-family: Arial, sans-serif; margin: 20px; }
                                          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                                          .agenda-item { margin-bottom: 20px; }
                                          .agenda-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; }
                                          .agenda-bullets { margin-left: 20px; }
                                          .custom-item { background-color: #f0f9ff; padding: 10px; border-left: 4px solid #0ea5e9; margin-bottom: 15px; }
                                          @media print { body { margin: 0; } }
                                        </style>
                                      </head>
                                      <body>
                                        ${printContent.innerHTML}
                                      </body>
                                    </html>
                                  `);
                                printWindow.document.close();
                                printWindow.focus();
                                printWindow.print();
                              }
                            }}
                            variant="outline"
                            className="px-6 py-2"
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Print Agenda
                          </Button>

                          <Button
                            onClick={() => {
                              toast.error(
                                "Are you sure you want to delete this agenda?",
                                {
                                  description: "This action cannot be undone.",
                                  action: {
                                    label: "Delete",
                                    onClick: () => {
                                      const resetAgenda = {
                                        facilityName:
                                          facilityName || "Facility Name",
                                        surveyDate:
                                          surveyInfo?.surveyCreationDate
                                            ? new Date(
                                                surveyInfo.surveyCreationDate
                                              ).toLocaleDateString()
                                            : new Date().toLocaleDateString(),
                                        customItems: [],
                                        isGenerated: false,
                                        isEditing: false,
                                        standardItems: undefined,
                                        standardSubItems: undefined,
                                      };

                                      updateFacilityEntranceData({
                                        entranceAgenda: resetAgenda,
                                      });
                                      setNewAgendaItem("");
                                      toast.success(
                                        "Agenda deleted successfully"
                                      );
                                    },
                                  },
                                  cancel: {
                                    label: "Cancel",
                                    onClick: () => {
                                      // User cancelled deletion
                                    },
                                  },
                                  duration: 10000, // 10 seconds to give user time to decide
                                }
                              );
                            }}
                            variant="outline"
                            className="px-6 py-2 text-red-600 border-red-300 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isInvitedUser() || isSurveyClosed}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Delete Agenda
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4">
              <Label className="text-lg font-medium text-gray-700 mb-2 block">
                Entrance Notes
              </Label>
              <textarea
                value={facilityEntranceData?.entranceNotes || ""}
                onChange={(e) => {
                  updateFacilityEntranceData({
                    entranceNotes: e.target.value,
                  });
                }}
                disabled={isInvitedUser()}
                placeholder="Document entrance conference details, attendees, and initial observations..."
                rows={4}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none transition-colors"
              />
            </div>
          </div>

          {/* Tracking Items */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-600" />
              Tracking Items
            </h3>

            <div className="space-y-4">
              {[
                { id: "conferenceWorksheet", label: "Completed Entrance Conference Worksheet", placeholder: "Add notes..." },
                { id: "policies", label: "Policies and Procedures", placeholder: "Add notes..." },
                { id: "matrix", label: "Completed New Admissions Matrix (Form 802)", placeholder: "Add notes...", showMatrixWarning: true },
                { id: "smokersList", label: "List of Smokers", placeholder: "Add notes..." },
                { id: "bindingArbitration", label: "Binding Arbitration Policy", placeholder: "Add notes..." },
                { id: "qapiPlan", label: "QAPI Plan and Minutes", placeholder: "Add notes..." },
                { id: "casperQmIqies", label: "Casper/ QM/ IQIES Report (Last 3 months and 6 months)", placeholder: "Add notes..." },
                {
                  id: "671Forms",
                  label: "671 Forms",
                  placeholder: "Add notes...",
                },
                { id: "other", label: "Other Documentation", placeholder: "Specify other item and add notes..." },
              ].map((item) => {
                const itemData = getRequestedItems()?.[item.id] || {};
                return (
                  <div key={item.id} className="p-3 sm:p-4 border border-gray-200 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <span className="text-sm sm:text-base font-medium text-gray-900 break-words min-w-0 flex-1">
                        {item.label}
                      </span>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-4 flex-shrink-0">
                        <label className="flex items-center text-sm">
                          <input
                            type="radio"
                            name={item.id}
                            checked={itemData?.requested === true}
                            onChange={() => {
                              updateLocalRequestedItem(item.id, {
                                requested: true,
                                received: false,
                                requestedTimestamp: new Date().toISOString(),
                                receivedTimestamp: undefined,
                              });
                            }}
                            disabled={isInvitedUser() || isSurveyClosed}
                            className="w-4 h-4 text-[#075b7d] border-gray-300 focus:ring-[#075b7d] mr-2"
                          />
                          Requested
                        </label>
                        <label className="flex items-center text-sm">
                          <input
                            type="radio"
                            name={item.id}
                            checked={itemData?.received === true}
                            onChange={() => {
                              updateLocalRequestedItem(item.id, {
                                requested: false,
                                received: true,
                                receivedTimestamp: new Date().toISOString(),
                                requestedTimestamp: undefined,
                              });
                            }}
                            disabled={isInvitedUser() || isSurveyClosed}
                            className="w-4 h-4 text-[#075b7d] border-gray-300 focus:ring-[#075b7d] mr-2"
                          />
                          Received
                        </label>
                      </div>
                    </div>

                    {/* Timestamps - Show based on status */}
                    <div className="mb-3 text-xs text-gray-600">
                      {itemData?.received && itemData?.receivedTimestamp ? (
                        <div>
                          <span className="font-medium">Received:</span>
                          <span className="ml-2">
                            {new Date(itemData.receivedTimestamp).toLocaleString()}
                          </span>
                        </div>
                      ) : itemData?.requested && itemData?.requestedTimestamp ? (
                        <div>
                          <span className="font-medium">Requested:</span>
                          <span className="ml-2">
                            {new Date(itemData.requestedTimestamp).toLocaleString()}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <Input
                      placeholder={item.placeholder}
                      value={itemData?.notes || ""}
                      onChange={(e) => {
                        updateLocalRequestedItem(item.id, {
                          notes: e.target.value,
                        });
                      }}
                      disabled={isInvitedUser() || isSurveyClosed}
                      className="h-8 text-sm"
                    />

                    {item.showMatrixWarning && itemData?.type === "fullMatrix" && (
                      <p className="text-xs text-amber-600 mt-2">
                        Full matrix must be received within 4 hours
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enhanced Initial Assessments */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-600" />
              Initial Assessments
            </h3>

            <div className="space-y-4">
              {/* Facility Environmental Tour */}
              <div className="p-3 sm:p-4 border border-gray-200 rounded-lg">
                <label className="flex items-center py-2 sm:py-3 px-3 sm:px-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={getFacilityEnvironmentalTour()?.completed || false}
                    onChange={(e) => {
                      updateLocalInitialAssessment("facilityEnvironmentalTour", {
                        completed: e.target.checked,
                      });
                    }}
                    disabled={isInvitedUser() || isSurveyClosed}
                    className="w-4 h-4 text-[#075b7d] border-gray-300 rounded focus:ring-[#075b7d] mr-2 sm:mr-3 flex-shrink-0"
                  />
                  <span className="text-sm sm:text-base text-gray-900 font-medium break-words">
                    Facility Environmental Tour
                  </span>
                </label>

                {(getFacilityEnvironmentalTour()?.completed || false) && (
                  <div className="mt-3 ml-0 sm:ml-7 space-y-3">
                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">
                        Facility Environmental Tour Notes
                      </Label>
                      <textarea
                        value={getFacilityEnvironmentalTour()?.notes || ""}
                        onChange={(e) => {
                          updateLocalInitialAssessment("facilityEnvironmentalTour", {
                            notes: e.target.value,
                          });
                        }}
                        disabled={isInvitedUser() || isSurveyClosed}
                        placeholder="Document facility environmental tour observations, findings, and any concerns..."
                        rows={3}
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none transition-colors"
                      />
                    </div>

                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-gray-700 mb-2 block">
                        Facility Environmental Tour – Probe List with F-Tags
                      </Label>

                      {/* Overall Citation Status */}
                      <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                          <h6 className="text-xs sm:text-sm font-medium text-gray-800">
                            Overall Citation Status
                          </h6>
                          {(() => {
                            const probeList =
                              getFacilityEnvironmentalTour()?.probeList || {};
                            const totalProbes = Object.keys(probeList).length;
                            const citations = Object.values(probeList).filter(
                              (item) => {
                                return item.compliant === false;
                              }
                            );
                            const compliant = Object.values(probeList).filter(
                              (item) => {
                                return item.compliant === true;
                              }
                            ).length;

                            if (totalProbes === 0) {
                              return (
                                <Badge
                                  variant="outline"
                                  className="text-xs border-gray-300 text-gray-600 flex-shrink-0"
                                >
                                  No probes completed
                                </Badge>
                              );
                            }

                            return (
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="default"
                                  className="text-xs bg-green-100 text-green-800 flex-shrink-0"
                                >
                                  {compliant} Compliant
                                </Badge>
                                <Badge
                                  variant="destructive"
                                  className="text-xs flex-shrink-0"
                                >
                                  {citations.length} Citations
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-xs border-gray-300 text-gray-600 flex-shrink-0"
                                >
                                  {totalProbes} Total
                                </Badge>
                              </div>
                            );
                          })()}
                        </div>
                        <p className="text-xs text-gray-600">
                          Complete the probe list below to generate citations
                          based on individual responses.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {/* General Environment */}
                        <div className="border border-gray-200 rounded-lg p-3">
                          <h6 className="text-sm sm:text-base font-medium text-gray-900 mb-2">
                            General Environment Tour
                          </h6>
                          <div className="space-y-2">
                            {[
                              {
                                probe: "Cleanliness, clutter, odors",
                                fTag: "F584",
                                citeOnYes: true, // Yes = problems present = cite
                              },
                              {
                                probe: "Adequate lighting, ventilation, temps",
                                fTag: "F584",
                                citeOnYes: false, // No = not adequate = cite
                              },
                              {
                                probe: "Trip hazards, blocked exits",
                                fTag: "F689",
                                citeOnYes: true, // Yes = hazards present = cite
                              },
                              {
                                probe: "Fire safety compliance",
                                fTag: "F689",
                                citeOnYes: false, // No = not compliant = cite
                              },
                            ].map((item, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-2">
                                  <div className="relative flex-shrink-0">
                                    <select
                                      value={
                                        getFacilityEnvironmentalTour()
                                          ?.probeList?.[`general_${index}`]
                                          ?.status || ""
                                      }
                                      onChange={async (e) => {
                                        const currentProbeList =
                                          getFacilityEnvironmentalTour()
                                            ?.probeList || {};
                                        await handleProbeResponse(
                                          `general_${index}`,
                                          item.probe,
                                          e.target.value,
                                          item,
                                          currentProbeList,
                                          "facilityEnvironmentalTour"
                                        );
                                      }}
                                      disabled={
                                        isLoadingFTag ||
                                        isInvitedUser() ||
                                        isSurveyClosed
                                      }
                                      className="w-full sm:w-20 h-8 sm:h-6 px-2 sm:px-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <option value="">Select</option>
                                      <option value="Yes">Yes</option>
                                      <option value="No">No</option>
                                     
                                    </select>
                                    {loadingProbeKey === `general_${index}` && (
                                      <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 hidden sm:block">
                                        <Loader2 className="w-3 h-3 animate-spin text-[#075b7d]" />
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-700 flex-1 min-w-0 break-words">
                                    {item.probe}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 flex-shrink-0">
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-gray-600 border-gray-300"
                                    >
                                      {item.fTag}
                                    </Badge>
                                    {(() => {
                                      const probeData =
                                        getFacilityEnvironmentalTour()
                                          ?.probeList?.[`general_${index}`];

                                      // Show API response F-Tag if available, otherwise fall back to original logic
                                      if (probeData?.fTag) {
                                        return (
                                          <Badge
                                            variant={
                                              probeData.compliant
                                                ? "default"
                                                : "destructive"
                                            }
                                            className="text-xs"
                                          >
                                            {probeData.fTag}
                                          </Badge>
                                        );
                                      }

                                      // Fallback to original citation logic
                                      const shouldShowCitation =
                                        probeData &&
                                        ((item.citeOnYes &&
                                          probeData.status === "Yes") ||
                                          (!item.citeOnYes &&
                                            probeData.status === "No"));
                                      return shouldShowCitation ? (
                                        <Badge
                                          variant="destructive"
                                          className="text-xs"
                                        >
                                          {item.fTag}
                                        </Badge>
                                      ) : null;
                                    })()}
                                  </div>
                                </div>

                                {/* Full-width citation and explanation display */}
                                {(() => {
                                  const probeData =
                                    getFacilityEnvironmentalTour()?.probeList?.[
                                      `general_${index}`
                                    ];

                                  if (probeData?.fTag) {
                                    return (
                                      <div className="space-y-2 ml-0 sm:ml-7">
                                        {probeData.citation && (
                                          <div className="text-xs text-gray-700 bg-blue-50 p-2 sm:p-3 rounded border-l-4 border-blue-200">
                                            <div className="font-medium text-blue-800 mb-1">
                                              Citation:
                                            </div>
                                            <div className="text-gray-600 break-words">
                                              {probeData.citation}
                                            </div>
                                          </div>
                                        )}
                                        {probeData.explanation && (
                                          <div className="text-xs text-gray-700 bg-green-50 p-2 sm:p-3 rounded border-l-4 border-green-200">
                                            <div className="font-medium text-green-800 mb-1">
                                              Explanation:
                                            </div>
                                            <div className="text-gray-600 break-words">
                                              {probeData.explanation}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Resident Rooms */}
                        <div className="border border-gray-200 rounded-lg p-3">
                          <h6 className="text-sm sm:text-base font-medium text-gray-900 mb-2">
                            Resident Rooms
                          </h6>
                          <div className="space-y-2">
                            {[
                              {
                                probe: "Call bells accessible",
                                fTag: "F684",
                                citeOnYes: false, // No = not accessible = cite
                              },
                              {
                                probe: "Bed condition/positioning",
                                fTag: "F700, F684",
                                citeOnYes: false, // No = poor condition = cite
                              },
                              {
                                probe: "Privacy (curtains, dignity)",
                                fTag: "F550",
                                citeOnYes: false, // No = no privacy = cite
                              },
                              {
                                probe: "Personal items accessible",
                                fTag: "F584",
                                citeOnYes: false, // No = not accessible = cite
                              },
                              {
                                probe: "Clean linens, mattresses",
                                fTag: "F584",
                                citeOnYes: false, // No = not clean = cite
                              },
                            ].map((item, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-2">
                                  <div className="relative flex-shrink-0">
                                    <select
                                      value={
                                        getFacilityEnvironmentalTour()
                                          ?.probeList?.[`rooms_${index}`]
                                          ?.status || ""
                                      }
                                      onChange={async (e) => {
                                        const currentProbeList =
                                          getFacilityEnvironmentalTour()
                                            ?.probeList || {};
                                        await handleProbeResponse(
                                          `rooms_${index}`,
                                          item.probe,
                                          e.target.value,
                                          item,
                                          currentProbeList,
                                          "facilityEnvironmentalTour"
                                        );
                                      }}
                                      disabled={
                                        isLoadingFTag ||
                                        isInvitedUser() ||
                                        isSurveyClosed
                                      }
                                      className="w-full sm:w-20 h-8 sm:h-6 px-2 sm:px-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <option value="">Select</option>
                                      <option value="Yes">Yes</option>
                                      <option value="No">No</option>
                                      
                                    </select>
                                    {loadingProbeKey === `rooms_${index}` && (
                                      <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 hidden sm:block">
                                        <Loader2 className="w-3 h-3 animate-spin text-[#075b7d]" />
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-700 flex-1 min-w-0 break-words">
                                    {item.probe}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 flex-shrink-0">
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-gray-600 border-gray-300"
                                    >
                                      {item.fTag}
                                    </Badge>
                                    {(() => {
                                      const probeData =
                                        getFacilityEnvironmentalTour()
                                          ?.probeList?.[`rooms_${index}`];

                                      // Show API response F-Tag if available, otherwise fall back to original logic
                                      if (probeData?.fTag) {
                                        return (
                                          <Badge
                                            variant={
                                              probeData.compliant
                                                ? "default"
                                                : "destructive"
                                            }
                                            className="text-xs"
                                          >
                                            {probeData.fTag}
                                          </Badge>
                                        );
                                      }

                                      // Fallback to original citation logic
                                      const shouldShowCitation =
                                        probeData &&
                                        ((item.citeOnYes &&
                                          probeData.status === "Yes") ||
                                          (!item.citeOnYes &&
                                            probeData.status === "No"));
                                      return shouldShowCitation ? (
                                        <Badge
                                          variant="destructive"
                                          className="text-xs"
                                        >
                                          {item.fTag}
                                        </Badge>
                                      ) : null;
                                    })()}
                                  </div>
                                </div>

                                {/* Full-width citation and explanation display */}
                                {(() => {
                                  const probeData =
                                    getFacilityEnvironmentalTour()?.probeList?.[
                                      `rooms_${index}`
                                    ];

                                  if (probeData?.fTag) {
                                    return (
                                      <div className="space-y-2 ml-0 sm:ml-7">
                                        {probeData.citation && (
                                          <div className="text-xs text-gray-700 bg-blue-50 p-2 sm:p-3 rounded border-l-4 border-blue-200">
                                            <div className="font-medium text-blue-800 mb-1">
                                              Citation:
                                            </div>
                                            <div className="text-gray-600 break-words">
                                              {probeData.citation}
                                            </div>
                                          </div>
                                        )}
                                        {probeData.explanation && (
                                          <div className="text-xs text-gray-700 bg-green-50 p-2 sm:p-3 rounded border-l-4 border-green-200">
                                            <div className="font-medium text-green-800 mb-1">
                                              Explanation:
                                            </div>
                                            <div className="text-gray-600 break-words">
                                              {probeData.explanation}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Bathrooms */}
                        <div className="border border-gray-200 rounded-lg p-3">
                          <h6 className="text-sm sm:text-base font-medium text-gray-900 mb-2">
                            Bathrooms
                          </h6>
                          <div className="space-y-2">
                            {[
                              {
                                probe: "Grab bars, non-slip mats",
                                fTag: "F689",
                                citeOnYes: false, // No = not available = cite
                              },
                              {
                                probe: "Safe water temperatures",
                                fTag: "F689, F584",
                                citeOnYes: false, // No = not safe = cite
                              },
                              {
                                probe: "Toilets/sinks clean & working",
                                fTag: "F584",
                                citeOnYes: false, // No = not clean/working = cite
                              },
                              {
                                probe: "Adequate supplies (soap, TP)",
                                fTag: "F584",
                                citeOnYes: false, // No = not adequate = cite
                              },
                            ].map((item, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-2">
                                  <div className="relative flex-shrink-0">
                                    <select
                                      value={
                                        getFacilityEnvironmentalTour()
                                          ?.probeList?.[`bathrooms_${index}`]
                                          ?.status || ""
                                      }
                                      onChange={async (e) => {
                                        const currentProbeList =
                                          getFacilityEnvironmentalTour()
                                            ?.probeList || {};
                                        await handleProbeResponse(
                                          `bathrooms_${index}`,
                                          item.probe,
                                          e.target.value,
                                          item,
                                          currentProbeList,
                                          "facilityEnvironmentalTour"
                                        );
                                      }}
                                      disabled={
                                        isLoadingFTag ||
                                        isInvitedUser() ||
                                        isSurveyClosed
                                      }
                                      className="w-full sm:w-20 h-8 sm:h-6 px-2 sm:px-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <option value="">Select</option>
                                      <option value="Yes">Yes</option>
                                      <option value="No">No</option>
                                     
                                    </select>
                                    {loadingProbeKey ===
                                      `bathrooms_${index}` && (
                                      <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 hidden sm:block">
                                        <Loader2 className="w-3 h-3 animate-spin text-[#075b7d]" />
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-700 flex-1 min-w-0 break-words">
                                    {item.probe}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 flex-shrink-0">
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-gray-600 border-gray-300"
                                    >
                                      {item.fTag}
                                    </Badge>
                                    {(() => {
                                      const probeData =
                                        getFacilityEnvironmentalTour()
                                          ?.probeList?.[`bathrooms_${index}`];

                                      // Show API response F-Tag if available, otherwise fall back to original logic
                                      if (probeData?.fTag) {
                                        return (
                                          <Badge
                                            variant={
                                              probeData.compliant
                                                ? "default"
                                                : "destructive"
                                            }
                                            className="text-xs"
                                          >
                                            {probeData.fTag}
                                          </Badge>
                                        );
                                      }

                                      // Fallback to original citation logic
                                      const shouldShowCitation =
                                        probeData &&
                                        ((item.citeOnYes &&
                                          probeData.status === "Yes") ||
                                          (!item.citeOnYes &&
                                            probeData.status === "No"));
                                      return shouldShowCitation ? (
                                        <Badge
                                          variant="destructive"
                                          className="text-xs"
                                        >
                                          {item.fTag}
                                        </Badge>
                                      ) : null;
                                    })()}
                                  </div>
                                </div>

                                {/* Full-width citation and explanation display */}
                                {(() => {
                                  const probeData =
                                    getFacilityEnvironmentalTour()?.probeList?.[
                                      `bathrooms_${index}`
                                    ];

                                  if (probeData?.fTag) {
                                    return (
                                      <div className="space-y-2 ml-0 sm:ml-7">
                                        {probeData.citation && (
                                          <div className="text-xs text-gray-700 bg-blue-50 p-2 sm:p-3 rounded border-l-4 border-blue-200">
                                            <div className="font-medium text-blue-800 mb-1">
                                              Citation:
                                            </div>
                                            <div className="text-gray-600 break-words">
                                              {probeData.citation}
                                            </div>
                                          </div>
                                        )}
                                        {probeData.explanation && (
                                          <div className="text-xs text-gray-700 bg-green-50 p-2 sm:p-3 rounded border-l-4 border-green-200">
                                            <div className="font-medium text-green-800 mb-1">
                                              Explanation:
                                            </div>
                                            <div className="text-gray-600 break-words">
                                              {probeData.explanation}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Infection Control */}
                        <div className="border border-gray-200 rounded-lg p-3">
                          <h6 className="text-sm sm:text-base font-medium text-gray-900 mb-2">
                            Infection Control
                          </h6>
                          <div className="space-y-2">
                            {[
                              {
                                probe: "Hand hygiene stations stocked",
                                fTag: "F880",
                                citeOnYes: false, // No = not stocked = cite
                              },
                              {
                                probe: "PPE available outside isolation rooms",
                                fTag: "F880",
                                citeOnYes: false, // No = not available = cite
                              },
                              {
                                probe: "Soiled linens or trash left out",
                                fTag: "F880",
                                citeOnYes: true, // Yes = soiled items present = cite
                              },
                              {
                                probe: "Utility rooms clean, secured",
                                fTag: "F880",
                                citeOnYes: false, // No = not clean/secured = cite
                              },
                            ].map((item, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-2">
                                  <div className="relative flex-shrink-0">
                                    <select
                                      value={
                                        getFacilityEnvironmentalTour()
                                          ?.probeList?.[`infection_${index}`]
                                          ?.status || ""
                                      }
                                      onChange={async (e) => {
                                        const currentProbeList =
                                          getFacilityEnvironmentalTour()
                                            ?.probeList || {};
                                        await handleProbeResponse(
                                          `infection_${index}`,
                                          item.probe,
                                          e.target.value,
                                          item,
                                          currentProbeList,
                                          "facilityEnvironmentalTour"
                                        );
                                      }}
                                      disabled={
                                        isLoadingFTag ||
                                        isInvitedUser() ||
                                        isSurveyClosed
                                      }
                                      className="w-full sm:w-20 h-8 sm:h-6 px-2 sm:px-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <option value="">Select</option>
                                      <option value="Yes">Yes</option>
                                      <option value="No">No</option>
                                     
                                    </select>
                                    {loadingProbeKey ===
                                      `infection_${index}` && (
                                      <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 hidden sm:block">
                                        <Loader2 className="w-3 h-3 animate-spin text-[#075b7d]" />
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-700 flex-1 min-w-0 break-words">
                                    {item.probe}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 flex-shrink-0">
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-gray-600 border-gray-300"
                                    >
                                      {item.fTag}
                                    </Badge>
                                    {(() => {
                                      const probeData =
                                        getFacilityEnvironmentalTour()
                                          ?.probeList?.[`infection_${index}`];

                                      // Show API response F-Tag if available, otherwise fall back to original logic
                                      if (probeData?.fTag) {
                                        return (
                                          <Badge
                                            variant={
                                              probeData.compliant
                                                ? "default"
                                                : "destructive"
                                            }
                                            className="text-xs"
                                          >
                                            {probeData.fTag}
                                          </Badge>
                                        );
                                      }

                                      // Fallback to original citation logic
                                      const shouldShowCitation =
                                        probeData &&
                                        ((item.citeOnYes &&
                                          probeData.status === "Yes") ||
                                          (!item.citeOnYes &&
                                            probeData.status === "No"));
                                      return shouldShowCitation ? (
                                        <Badge
                                          variant="destructive"
                                          className="text-xs"
                                        >
                                          {item.fTag}
                                        </Badge>
                                      ) : null;
                                    })()}
                                  </div>
                                </div>

                                {/* Full-width citation and explanation display */}
                                {(() => {
                                  const probeData =
                                    getFacilityEnvironmentalTour()?.probeList?.[
                                      `infection_${index}`
                                    ];

                                  if (probeData?.fTag) {
                                    return (
                                      <div className="space-y-2 ml-0 sm:ml-7">
                                        {probeData.citation && (
                                          <div className="text-xs text-gray-700 bg-blue-50 p-2 sm:p-3 rounded border-l-4 border-blue-200">
                                            <div className="font-medium text-blue-800 mb-1">
                                              Citation:
                                            </div>
                                            <div className="text-gray-600 break-words">
                                              {probeData.citation}
                                            </div>
                                          </div>
                                        )}
                                        {probeData.explanation && (
                                          <div className="text-xs text-gray-700 bg-green-50 p-2 sm:p-3 rounded border-l-4 border-green-200">
                                            <div className="font-medium text-green-800 mb-1">
                                              Explanation:
                                            </div>
                                            <div className="text-gray-600 break-words">
                                              {probeData.explanation}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Nursing Units */}
                        <div className="border border-gray-200 rounded-lg p-3">
                          <h6 className="text-sm sm:text-base font-medium text-gray-900 mb-2">
                            Nursing Units
                          </h6>
                          <div className="space-y-2">
                            {[
                              {
                                probe: "Med carts secured",
                                fTag: "F755",
                                citeOnYes: false, // No = not secured = cite
                              },
                              {
                                probe: "Oxygen tanks stored safely",
                                fTag: "F689",
                                citeOnYes: false, // No = not stored safely = cite
                              },
                              {
                                probe: "Crash cart stocked/ready",
                                fTag: "F684",
                                citeOnYes: false, // No = not stocked/ready = cite
                              },
                              {
                                probe: "Supplies within expiration",
                                fTag: "F756, F812",
                                citeOnYes: false, // No = expired = cite
                              },
                            ].map((item, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-2">
                                  <div className="relative flex-shrink-0">
                                    <select
                                      value={
                                        getFacilityEnvironmentalTour()
                                          ?.probeList?.[`nursing_${index}`]
                                          ?.status || ""
                                      }
                                      onChange={async (e) => {
                                        const currentProbeList =
                                          getFacilityEnvironmentalTour()
                                            ?.probeList || {};
                                        await handleProbeResponse(
                                          `nursing_${index}`,
                                          item.probe,
                                          e.target.value,
                                          item,
                                          currentProbeList,
                                          "facilityEnvironmentalTour"
                                        );
                                      }}
                                      disabled={
                                        isLoadingFTag ||
                                        isInvitedUser() ||
                                        isSurveyClosed
                                      }
                                      className="w-full sm:w-20 h-8 sm:h-6 px-2 sm:px-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <option value="">Select</option>
                                      <option value="Yes">Yes</option>
                                      <option value="No">No</option>
                                    
                                    </select>
                                    {loadingProbeKey === `nursing_${index}` && (
                                      <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 hidden sm:block">
                                        <Loader2 className="w-3 h-3 animate-spin text-[#075b7d]" />
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-700 flex-1 min-w-0 break-words">
                                    {item.probe}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 flex-shrink-0">
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-gray-600 border-gray-300"
                                    >
                                      {item.fTag}
                                    </Badge>
                                    {(() => {
                                      const probeData =
                                        getFacilityEnvironmentalTour()
                                          ?.probeList?.[`nursing_${index}`];

                                      // Show API response F-Tag if available, otherwise fall back to original logic
                                      if (probeData?.fTag) {
                                        return (
                                          <Badge
                                            variant={
                                              probeData.compliant
                                                ? "default"
                                                : "destructive"
                                            }
                                            className="text-xs"
                                          >
                                            {probeData.fTag}
                                          </Badge>
                                        );
                                      }

                                      // Fallback to original citation logic
                                      const shouldShowCitation =
                                        probeData &&
                                        ((item.citeOnYes &&
                                          probeData.status === "Yes") ||
                                          (!item.citeOnYes &&
                                            probeData.status === "No"));
                                      return shouldShowCitation ? (
                                        <Badge
                                          variant="destructive"
                                          className="text-xs"
                                        >
                                          {item.fTag}
                                        </Badge>
                                      ) : null;
                                    })()}
                                  </div>
                                </div>

                                {/* Full-width citation and explanation display */}
                                {(() => {
                                  const probeData =
                                    getFacilityEnvironmentalTour()?.probeList?.[
                                      `nursing_${index}`
                                    ];

                                  if (probeData?.fTag) {
                                    return (
                                      <div className="space-y-2 ml-0 sm:ml-7">
                                        {probeData.citation && (
                                          <div className="text-xs text-gray-700 bg-blue-50 p-2 sm:p-3 rounded border-l-4 border-blue-200">
                                            <div className="font-medium text-blue-800 mb-1">
                                              Citation:
                                            </div>
                                            <div className="text-gray-600 break-words">
                                              {probeData.citation}
                                            </div>
                                          </div>
                                        )}
                                        {probeData.explanation && (
                                          <div className="text-xs text-gray-700 bg-green-50 p-2 sm:p-3 rounded border-l-4 border-green-200">
                                            <div className="font-medium text-green-800 mb-1">
                                              Explanation:
                                            </div>
                                            <div className="text-gray-600 break-words">
                                              {probeData.explanation}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Dining & Common Areas */}
                        <div className="border border-gray-200 rounded-lg p-3">
                          <h6 className="text-sm sm:text-base font-medium text-gray-900 mb-2">
                            Dining & Common Areas
                          </h6>
                          <div className="space-y-2">
                            {[
                              {
                                probe: "Dining room cleanliness, setup",
                                fTag: "F812",
                                citeOnYes: false, // No = not clean/proper setup = cite
                              },
                              {
                                probe: "Snacks/drinks safely available",
                                fTag: "F812",
                                citeOnYes: false, // No = not safely available = cite
                              },
                              {
                                probe: "Activity areas safe/accessible",
                                fTag: "F679, F584",
                                citeOnYes: false, // No = not safe/accessible = cite
                              },
                            ].map((item, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-2">
                                  <div className="relative flex-shrink-0">
                                    <select
                                      value={
                                        getFacilityEnvironmentalTour()
                                          ?.probeList?.[`dining_${index}`]
                                          ?.status || ""
                                      }
                                      onChange={async (e) => {
                                        const currentProbeList =
                                          getFacilityEnvironmentalTour()
                                            ?.probeList || {};
                                        await handleProbeResponse(
                                          `dining_${index}`,
                                          item.probe,
                                          e.target.value,
                                          item,
                                          currentProbeList,
                                          "facilityEnvironmentalTour"
                                        );
                                      }}
                                      disabled={
                                        isLoadingFTag ||
                                        isInvitedUser() ||
                                        isSurveyClosed
                                      }
                                      className="w-full sm:w-20 h-8 sm:h-6 px-2 sm:px-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <option value="">Select</option>
                                      <option value="Yes">Yes</option>
                                      <option value="No">No</option>
                                     
                                    </select>
                                    {loadingProbeKey === `dining_${index}` && (
                                      <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 hidden sm:block">
                                        <Loader2 className="w-3 h-3 animate-spin text-[#075b7d]" />
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-700 flex-1 min-w-0 break-words">
                                    {item.probe}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 flex-shrink-0">
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-gray-600 border-gray-300"
                                    >
                                      {item.fTag}
                                    </Badge>
                                    {(() => {
                                      const probeData =
                                        getFacilityEnvironmentalTour()
                                          ?.probeList?.[`dining_${index}`];

                                      // Show API response F-Tag if available, otherwise fall back to original logic
                                      if (probeData?.fTag) {
                                        return (
                                          <Badge
                                            variant={
                                              probeData.compliant
                                                ? "default"
                                                : "destructive"
                                            }
                                            className="text-xs"
                                          >
                                            {probeData.fTag}
                                          </Badge>
                                        );
                                      }

                                      // Fallback to original citation logic
                                      const shouldShowCitation =
                                        probeData &&
                                        ((item.citeOnYes &&
                                          probeData.status === "Yes") ||
                                          (!item.citeOnYes &&
                                            probeData.status === "No"));
                                      return shouldShowCitation ? (
                                        <Badge
                                          variant="destructive"
                                          className="text-xs"
                                        >
                                          {item.fTag}
                                        </Badge>
                                      ) : null;
                                    })()}
                                  </div>
                                </div>

                                {/* Full-width citation and explanation display */}
                                {(() => {
                                  const probeData =
                                    getFacilityEnvironmentalTour()?.probeList?.[
                                      `dining_${index}`
                                    ];

                                  if (probeData?.fTag) {
                                    return (
                                      <div className="space-y-2 ml-0 sm:ml-7">
                                        {probeData.citation && (
                                          <div className="text-xs text-gray-700 bg-blue-50 p-2 sm:p-3 rounded border-l-4 border-blue-200">
                                            <div className="font-medium text-blue-800 mb-1">
                                              Citation:
                                            </div>
                                            <div className="text-gray-600 break-words">
                                              {probeData.citation}
                                            </div>
                                          </div>
                                        )}
                                        {probeData.explanation && (
                                          <div className="text-xs text-gray-700 bg-green-50 p-2 sm:p-3 rounded border-l-4 border-green-200">
                                            <div className="font-medium text-green-800 mb-1">
                                              Explanation:
                                            </div>
                                            <div className="text-gray-600 break-words">
                                              {probeData.explanation}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Laundry/Housekeeping */}
                        <div className="border border-gray-200 rounded-lg p-3">
                          <h6 className="text-sm sm:text-base font-medium text-gray-900 mb-2">
                            Laundry/Housekeeping
                          </h6>
                          <div className="space-y-2">
                            {[
                              {
                                probe: "Clean vs. soiled separation",
                                fTag: "F880",
                                citeOnYes: false, // No = not separated = cite
                              },
                              {
                                probe: "Chemicals secured/locked",
                                fTag: "F689",
                                citeOnYes: false, // No = not secured = cite
                              },
                              {
                                probe: "Laundry areas sanitary, pest-free",
                                fTag: "F880",
                                citeOnYes: false, // No = not sanitary/pest-free = cite
                              },
                            ].map((item, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-2">
                                  <div className="relative flex-shrink-0">
                                    <select
                                      value={
                                        getFacilityEnvironmentalTour()
                                          ?.probeList?.[`laundry_${index}`]
                                          ?.status || ""
                                      }
                                      onChange={async (e) => {
                                        const currentProbeList =
                                          getFacilityEnvironmentalTour()
                                            ?.probeList || {};
                                        await handleProbeResponse(
                                          `laundry_${index}`,
                                          item.probe,
                                          e.target.value,
                                          item,
                                          currentProbeList,
                                          "facilityEnvironmentalTour"
                                        );
                                      }}
                                      disabled={
                                        isLoadingFTag ||
                                        isInvitedUser() ||
                                        isSurveyClosed
                                      }
                                      className="w-full sm:w-20 h-8 sm:h-6 px-2 sm:px-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <option value="">Select</option>
                                      <option value="Yes">Yes</option>
                                      <option value="No">No</option>
                                     
                                    </select>
                                    {loadingProbeKey === `laundry_${index}` && (
                                      <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 hidden sm:block">
                                        <Loader2 className="w-3 h-3 animate-spin text-[#075b7d]" />
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-700 flex-1 min-w-0 break-words">
                                    {item.probe}
                                  </span>
                                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 flex-shrink-0">
                                    <Badge
                                      variant="outline"
                                      className="text-xs text-gray-600 border-gray-300"
                                    >
                                      {item.fTag}
                                    </Badge>
                                    {(() => {
                                      const probeData =
                                        getFacilityEnvironmentalTour()
                                          ?.probeList?.[`laundry_${index}`];

                                      // Show API response F-Tag if available, otherwise fall back to original logic
                                      if (probeData?.fTag) {
                                        return (
                                          <Badge
                                            variant={
                                              probeData.compliant
                                                ? "default"
                                                : "destructive"
                                            }
                                            className="text-xs"
                                          >
                                            {probeData.fTag}
                                          </Badge>
                                        );
                                      }

                                      // Fallback to original citation logic
                                      const shouldShowCitation =
                                        probeData &&
                                        ((item.citeOnYes &&
                                          probeData.status === "Yes") ||
                                          (!item.citeOnYes &&
                                            probeData.status === "No"));
                                      return shouldShowCitation ? (
                                        <Badge
                                          variant="destructive"
                                          className="text-xs"
                                        >
                                          {item.fTag}
                                        </Badge>
                                      ) : null;
                                    })()}
                                  </div>
                                </div>

                                {/* Full-width citation and explanation display */}
                                {(() => {
                                  const probeData =
                                    getFacilityEnvironmentalTour()?.probeList?.[
                                      `laundry_${index}`
                                    ];

                                  if (probeData?.fTag) {
                                    return (
                                      <div className="space-y-2 ml-0 sm:ml-7">
                                        {probeData.citation && (
                                          <div className="text-xs text-gray-700 bg-blue-50 p-2 sm:p-3 rounded border-l-4 border-blue-200">
                                            <div className="font-medium text-blue-800 mb-1">
                                              Citation:
                                            </div>
                                            <div className="text-gray-600 break-words">
                                              {probeData.citation}
                                            </div>
                                          </div>
                                        )}
                                        {probeData.explanation && (
                                          <div className="text-xs text-gray-700 bg-green-50 p-2 sm:p-3 rounded border-l-4 border-green-200">
                                            <div className="font-medium text-green-800 mb-1">
                                              Explanation:
                                            </div>
                                            <div className="text-gray-600 break-words">
                                              {probeData.explanation}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Citation Summary */}
                        <div className="border border-gray-200 rounded-lg p-3">
                          <h6 className="text-sm sm:text-base font-medium text-gray-900 mb-2">
                            Citation Summary
                          </h6>
                          {(() => {
                            const probeList =
                              getFacilityEnvironmentalTour()?.probeList || {};
                            const citations = Object.values(probeList).filter(
                              (item) => {
                                return item.compliant === false;
                              }
                            );

                            if (citations.length === 0) {
                              return (
                                <p className="text-xs text-gray-500 italic">
                                  No citations required. All probe items are
                                  compliant.
                                </p>
                              );
                            }

                            return (
                              <div className="space-y-2">
                                <p className="text-xs text-gray-600 mb-2">
                                  <strong>
                                    {citations.length} citation(s) required:
                                  </strong>
                                </p>
                                {citations.map((citation, index) => (
                                  <div
                                    key={index}
                                    className="p-2 bg-red-50 border border-red-200 rounded text-xs"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <Badge
                                        variant="destructive"
                                        className="text-xs"
                                      >
                                        {citation.fTag}
                                      </Badge>
                                      <span className="text-red-700 font-medium">
                                        Citation Required
                                      </span>
                                    </div>
                                    <p className="text-red-800">
                                      {citation.probe}
                                    </p>
                                    {citation.citationNote && (
                                      <p className="text-red-700 mt-1 italic">
                                        {citation.citationNote}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Comments for Other selections */}
                        <div className="border border-gray-200 rounded-lg p-3">
                          <h6 className="font-medium text-gray-900 mb-2">
                            Additional Comments
                          </h6>
                          <textarea
                            value={
                              getFacilityEnvironmentalTour()
                                ?.additionalComments || ""
                            }
                            onChange={(e) =>
                              updateLocalInitialAssessment(
                                "facilityEnvironmentalTour",
                                {
                                  additionalComments: e.target.value,
                                }
                              )
                            }
                            disabled={isInvitedUser() || isSurveyClosed}
                            placeholder="Add any additional comments or observations..."
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Resident Summary */}
          <div className="p-4 bg-sky-100 border border-white rounded-lg mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">
                Surveyor Initiated Sample Residents
              </h4>
              <Button
                onClick={() => setShowResidentModal(true)}
                disabled={isInvitedUser()}
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Manage Residents
              </Button>
            </div>

            {(() => {
              const residents = getResidents();

              if (!residents || residents.length === 0) {
                return (
                  <div className="text-center py-4">
                    <div className="text-sm text-gray-500 mb-2">
                      No residents added yet
                    </div>
                    <div className="text-xs text-gray-400">
                      Click "Manage Residents" to add residents to the pool
                    </div>
                  </div>
                );
              }

              return (
                <div className="flex flex-wrap gap-1">
                  {residents.map((resident) => (
                    <div key={resident.id} className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {resident.name} ({resident.room})
                      </Badge>
                      <button
                        onClick={() => handleEditResident(resident)}
                        className="text-gray-400 hover:text-blue-500 transition-colors p-1 cursor-pointer"
                        title="Edit resident"
                        disabled={isInvitedUser() || isSurveyClosed}
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRemoveResident(resident.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                        title="Remove resident"
                        disabled={isInvitedUser() || isSurveyClosed}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()} 
          </div>
          {/* Documents to Upload */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-2 flex items-center">
              <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-600" />
              Documents to Upload
            </h3>
            <span className="text-[12px] mb-3 text-gray-600 block">
              Kindly upload PDF copies of the following documents.
            </span>

            <div className="space-y-4">
              {/* Completed 802 form */}
              <div className="p-3 sm:p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm sm:text-base font-medium text-gray-900 break-words">
                    Completed 802 form
                  </span>
                  {/* <div className="flex items-center space-x-2">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={
                          getDocumentsToUpload()?.form802?.uploaded ||
                          false
                        }
                        onChange={(e) => {
                          updateLocalDocument("form802", {
                            uploaded: e.target.checked,
                            uploadTimestamp: e.target.checked
                              ? new Date().toISOString()
                              : null,
                          });
                        }}
                        className="w-4 h-4 text-[#075b7d] border-gray-300 rounded focus:ring-[#075b7d] mr-2"
                      />
                      Uploaded
                    </label>
                  </div> */}
                </div>

                {getDocumentsToUpload()?.form802?.uploadTimestamp && (
                  <div className="text-xs text-gray-600 mb-2">
                    Uploaded:{" "}
                    {new Date(
                      getDocumentsToUpload().form802.uploadTimestamp
                    ).toLocaleString()}
                  </div>
                )}

                <div className="space-y-2">
                  {/* File Upload */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-2">
                    <input
                      type="file"
                      onChange={(e) =>
                        handleDocumentFileUpload("form802", e.target.files)
                      }
                      className="hidden"
                      id="file-upload-form802"
                      accept=".pdf"
                      disabled={isInvitedUser() || isSurveyClosed}
                    />
                    <label
                      htmlFor="file-upload-form802"
                      className={`inline-flex items-center justify-center px-3 py-1 text-xs bg-[#075b7d]/10 text-[#075b7d] rounded border border-[#075b7d]/20 transition-colors flex-shrink-0 ${
                        isInvitedUser() || isSurveyClosed
                          ? "opacity-50 cursor-not-allowed pointer-events-none"
                          : "cursor-pointer hover:bg-[#075b7d]/20"
                      }`}
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      Choose File
                    </label>
                    {getDocumentsToUpload()?.form802?.docUrl && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-gray-600">
                          File uploaded successfully
                        </span>
                        {getDocumentsToUpload().form802.docUrl &&
                          !isInvitedUser() && (
                            <a
                              href={getDocumentsToUpload().form802.docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                            >
                              View File
                            </a>
                          )}
                        {!isInvitedUser() && (
                          <button
                            onClick={() => handleDocumentRemove("form802")}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Notes Input */}
                  <Input
                    placeholder="Add notes..."
                    value={getDocumentsToUpload()?.form802?.notes || ""}
                    onChange={(e) => {
                      updateLocalDocument("form802", {
                        notes: e.target.value,
                      });
                    }}
                    disabled={isInvitedUser() || isSurveyClosed}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* CASPER/QM/IQIES Reports */}
              <div className="p-3 sm:p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm sm:text-base font-medium text-gray-900 break-words">
                    CASPER/QM/IQIES Reports (Last 3 months)
                  </span>
                </div>

                {getDocumentsToUpload()?.casperQmIqies?.uploadTimestamp && (
                  <div className="text-xs text-gray-600 mb-2">
                    Uploaded:{" "}
                    {new Date(
                      getDocumentsToUpload().casperQmIqies.uploadTimestamp
                    ).toLocaleString()}
                  </div>
                )}

                <div className="space-y-2">
                  {/* File Upload */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-2">
                    <input
                      type="file"
                      onChange={(e) =>
                        handleDocumentFileUpload(
                          "casperQmIqies",
                          e.target.files
                        )
                      }
                      disabled={isInvitedUser() || isSurveyClosed}
                      className="hidden"
                      id="file-upload-casperQmIqies"
                      accept=".pdf"
                    />
                    <label
                      htmlFor="file-upload-casperQmIqies"
                      className={`inline-flex items-center justify-center px-3 py-1 text-xs bg-[#075b7d]/10 text-[#075b7d] rounded border border-[#075b7d]/20 transition-colors flex-shrink-0 ${
                        isInvitedUser() || isSurveyClosed
                          ? "opacity-50 cursor-not-allowed pointer-events-none"
                          : "cursor-pointer hover:bg-[#075b7d]/20"
                      }`}
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      Choose File
                    </label>
                    {getDocumentsToUpload()?.casperQmIqies?.docUrl &&
                      !isInvitedUser() && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-gray-600">
                            File uploaded successfully
                          </span>
                          <a
                            href={getDocumentsToUpload().casperQmIqies.docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                          >
                            View File
                          </a>
                          <button
                            onClick={() =>
                              handleDocumentRemove("casperQmIqies")
                            }
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                  </div>

                  {/* Notes Input */}
                  <Input
                    placeholder="Add notes..."
                    value={getDocumentsToUpload()?.casperQmIqies?.notes || ""}
                    onChange={(e) => {
                      updateLocalDocument("casperQmIqies", {
                        notes: e.target.value,
                      });
                    }}
                    disabled={isInvitedUser() || isSurveyClosed}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

             
            </div>
          </div>

          {/* Navigation */}
          {isInvitedUser() ? (
            <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-40 flex gap-2 sm:gap-4">
              <Button
                onClick={() => {
                  if (hasUnsavedChanges) {
                    setPendingNavigation({ type: 'step', target: 2 });
                    setShowExitWarning(true);
                  } else {
                    setCurrentStep(2);
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
                    setPendingNavigation({ type: 'step', target: 2 });
                    setShowExitWarning(true);
                  } else {
                    setCurrentStep(2);
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
                  handleFacilityEntranceSubmit(true);
                  setIsContinueClicked(true);
                }}
                disabled={isSubmitting || isSurveyClosed}
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
                    <span className="hidden sm:inline">Continue to Initial Pool Process</span>
                    <span className="sm:hidden">Continue</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Save Button */}
      {!isInvitedUser() && (
        <div className="fixed bottom-[100px]  right-6 z-40 flex flex-col items-end gap-2">
          <Button
            onClick={() => handleFacilityEntranceSubmit(false)}
            disabled={isSubmitting || isSurveyClosed}
            className="h-12 px-6 bg-[#075b7d] hover:bg-[#075b7d] text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full shadow-lg flex items-center gap-2 hover:shadow-xl transition-all"
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
                <FileCheck className="w-4 h-4 sm:w-5 sm:h-5 md:hidden" />
                <span className="hidden sm:inline">Save Progress</span>
                <span className="sm:hidden">Save</span>
              </>
            )}
          </Button>
        
        </div>
      )}

      {/* Resident Management Modal */}
      <AddResidentModal
        isOpen={showResidentModal}
        onClose={handleCloseModal}
        onSave={handleAddResident}
        initialData={editingResident}
        isDisabled={isInvitedUser() || isSurveyClosed}
        title={editingResident ? "Edit Resident" : "Add New Resident"}
        saveButtonText={editingResident ? "Update Resident" : "Add Resident"}
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
          await handleFacilityEntranceSubmit(false);
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
      {/* Loading Modal for Facility Entrance Data */}
      {isLoadingData && (
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
                Loading Facility Entrance Data
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 text-center mb-4">
                Please wait while we fetch the facility entrance data...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Home Button */}
      <FloatingHomeButton
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={() => handleFacilityEntranceSubmit(false)}
        onClearUnsavedChanges={() => setHasUnsavedChanges(false)}
      />
    </div>
  );
};

export default FacilityEntrance;
