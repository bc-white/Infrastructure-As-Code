import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { DatePicker } from "../../components/ui/date-picker";
import { Textarea } from "../../components/ui/textarea";
import { Checkbox } from "../../components/ui/checkbox";
import {
  CheckSquare,
  AlertTriangle,
  FileText,
  Shield,
  Flame,
  Save,
  Download,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Lock,
} from "lucide-react";
import React, { useState, useEffect, useCallback, memo } from "react";
import { surveyAPI } from "../../service/api";
import surveyIndexedDB from "../../utils/surveyIndexedDB";
import surveySyncService from "../../utils/surveySyncService";
import useSurveyStore from "../../stores/useSurveyStore";
import { toast } from "sonner";

// Life Safety Question component - memoized to prevent re-renders
const LifeSafetyQuestion = memo(
  ({
    category,
    field,
    question,
    type = "text",
    options = [],
    value,
    onChange = () => {},
    isDisabled = false,
  }) => {
    return (
      <div className="space-y-2">
        <Label className="text-xs sm:text-sm font-medium text-slate-700">
          {question}
        </Label>
        {type === "text" && (
          <Input
            value={value || ""}
            onChange={(e) => onChange(category, field, e.target.value)}
            placeholder="Enter response..."
            disabled={isDisabled}
            className="h-8 sm:h-9 text-xs sm:text-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
          />
        )}
        {type === "textarea" && (
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(category, field, e.target.value)}
            placeholder="Enter detailed response..."
            rows={3}
            disabled={isDisabled}
            className="w-full text-xs sm:text-sm bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
          />
        )}
        {type === "select" && (
          <select
            value={value || ""}
            onChange={(e) => onChange(category, field, e.target.value)}
            disabled={isDisabled}
            className="w-full h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm border border-slate-200 rounded-md focus:border-slate-400 focus:ring-1 focus:ring-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">Select an option...</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
        {type === "radio" && (
          <div className="space-y-2">
            {options.map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-2 ${
                  isDisabled
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer"
                }`}
              >
                <input
                  type="radio"
                  name={`${category}-${field}`}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange(category, field, e.target.value)}
                  disabled={isDisabled}
                  className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs sm:text-sm text-slate-700">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  }
);

LifeSafetyQuestion.displayName = "LifeSafetyQuestion";

// Scope and Severity Matrix Component - memoized
const ScopeSeverityMatrix = memo(
  ({
    sectionId,
    kTagId,
    scopeSeverity,
    onScopeSeverityChange = () => {},
    isDisabled = false,
  }) => {
    const severityOptions = [
      {
        value: "A",
        label: "A - No actual harm with potential for minimal harm (Isolated)",
        color: "bg-green-100 text-green-800 border-green-200",
      },
      {
        value: "B",
        label: "B - No actual harm with potential for minimal harm (Pattern)",
        color: "bg-green-100 text-green-800 border-green-200",
      },
      {
        value: "C",
        label:
          "C - No actual harm with potential for minimal harm (Widespread)",
        color: "bg-green-100 text-green-800 border-green-200",
      },
      {
        value: "D",
        label:
          "D - No actual harm with potential for more than minimal harm (Isolated)",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      {
        value: "E",
        label:
          "E - No actual harm with potential for more than minimal harm (Pattern)",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      {
        value: "F",
        label:
          "F - No actual harm with potential for more than minimal harm (Widespread)",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      {
        value: "G",
        label: "G - Actual harm that is not Immediate Jeopardy (Isolated)",
        color: "bg-orange-100 text-orange-800 border-orange-200",
      },
      {
        value: "H",
        label: "H - Actual harm that is not Immediate Jeopardy (Pattern)",
        color: "bg-orange-100 text-orange-800 border-orange-200",
      },
      {
        value: "I",
        label: "I - Actual harm that is not Immediate Jeopardy (Widespread)",
        color: "bg-orange-100 text-orange-800 border-orange-200",
      },
      {
        value: "J",
        label: "J - Immediate Jeopardy to resident health or safety (Isolated)",
        color: "bg-red-100 text-red-800 border-red-200",
      },
      {
        value: "K",
        label: "K - Immediate Jeopardy to resident health or safety (Pattern)",
        color: "bg-red-100 text-red-800 border-red-200",
      },
      {
        value: "L",
        label:
          "L - Immediate Jeopardy to resident health or safety (Widespread)",
        color: "bg-red-100 text-red-800 border-red-200",
      },
    ];

    return (
      <div className="space-y-3">
        <div>
          <Label className="text-xs font-medium text-slate-700 mb-2 block">
            Scope & Severity Rating
          </Label>
          <select
            value={scopeSeverity || ""}
            onChange={(e) =>
              onScopeSeverityChange(
                sectionId,
                kTagId,
                "scopeSeverity",
                e.target.value
              )
            }
            disabled={isDisabled}
            className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md focus:border-slate-400 focus:ring-1 focus:ring-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">Select scope & severity...</option>
            {severityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {scopeSeverity && (
          <div className="p-2 sm:p-3 rounded-lg border text-xs">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`px-2 py-1 rounded text-xs font-medium border flex-shrink-0 ${
                  severityOptions.find((opt) => opt.value === scopeSeverity)
                    ?.color || "bg-gray-100 text-gray-800 border-gray-200"
                }`}
              >
                {scopeSeverity}
              </span>
              <span className="font-medium text-slate-700 flex-shrink-0">
                Scope & Severity
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed break-words">
              {severityOptions
                .find((opt) => opt.value === scopeSeverity)
                ?.label.split(" - ")[1] || ""}
            </p>
          </div>
        )}
      </div>
    );
  }
);

ScopeSeverityMatrix.displayName = "ScopeSeverityMatrix";

// K-Tag Assessment Component - memoized
const KTagAssessment = memo(
  ({
    sectionId,
    kTagId,
    title,
    description,
    fTag,
    isCustom = false,
    status,
    remarks,
    scopeSeverity,
    onStatusChange = () => {},
    onRemarksChange = () => {},
    onScopeSeverityChange = () => {},
    isDisabled = false,
  }) => {
    return (
      <div className="bg-slate-50 rounded-lg p-3 sm:p-4 border border-slate-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-mono bg-white border border-slate-200 px-2 py-1 rounded text-slate-700 flex-shrink-0">
                {kTagId}
              </span>
              {fTag && (
                <span className="text-xs font-mono bg-blue-50 border border-blue-200 px-2 py-1 rounded text-blue-700 flex-shrink-0">
                  {fTag}
                </span>
              )}
              {isCustom && (
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  Custom
                </Badge>
              )}
            </div>
            <h4 className="text-xs sm:text-sm font-medium text-slate-900 mb-1 break-words">{title}</h4>
            <p className="text-xs text-slate-600 leading-relaxed break-words">
              {description}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs font-medium text-slate-700 mb-2 block">
              Compliance Status
            </Label>
            <select
              value={status || ""}
              onChange={(e) =>
                onStatusChange(sectionId, kTagId, "status", e.target.value)
              }
              disabled={isDisabled}
              className="w-full h-8 px-2 text-xs border border-slate-200 rounded-md focus:border-slate-400 focus:ring-1 focus:ring-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">Select status...</option>
              <option value="Compliant">Compliant</option>
              <option value="Non-Compliant">Non-Compliant</option>
              <option value="Not Applicable">Not Applicable</option>
              <option value="Not Observed">Not Observed</option>
            </select>
          </div>

          {status === "Non-Compliant" && (
            <ScopeSeverityMatrix
              sectionId={sectionId}
              kTagId={kTagId}
              scopeSeverity={scopeSeverity}
              onScopeSeverityChange={onScopeSeverityChange}
              isDisabled={isDisabled}
            />
          )}

          <div>
            <Label className="text-xs font-medium text-slate-700 mb-2 block">
              Surveyor Remarks
            </Label>
            <Textarea
              value={remarks || ""}
              onChange={(e) =>
                onRemarksChange(sectionId, kTagId, "remarks", e.target.value)
              }
              placeholder="Enter observations, findings, or additional notes..."
              rows={2}
              disabled={isDisabled}
              className="w-full text-xs bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    );
  }
);

KTagAssessment.displayName = "KTagAssessment";

const LifeSafetySurvey = () => {
  // Standalone state management
  const [surveyData, setSurveyData] = useState({
    lifeSafetySurvey: {
      facilityInfo: {
        providerNumber: "",
        medicaidId: "",
        facilityName: "",
        surveyDate: null,
        multipleConstruction: "",
        fullySprinklered: "",
      },
      crucialData: {
        providerNumber: "",
        facilityName: "",
        surveyDate: null,
        meetsLSC: [],
        doesNotMeetLSC: "",
      },
      // Life Safety Question Categories
      documentationPolicy: {
        fireSafetyPlan: "",
        lastFireDrill: "",
        fireDrillParticipants: "",
        smokingPolicy: "",
        smokingPolicyEnforced: "",
        fireAlarmTestingRecords: "",
        sprinklerInspectionRecords: "",
        emergencyPowerTestRecords: "",
        additionalNotes: "",
      },
      exitEgress: {
        egressPathsClear: "",
        exitSignsIlluminated: "",
        exitSignsVisible: "",
        doorHardwareFunctioning: "",
        exitDischargeAreasClear: "",
        additionalNotes: "",
      },
      fireProtectionSystems: {
        sprinklerSystemCondition: "",
        sprinklerSystemInspected: "",
        fireAlarmsWorking: "",
        smokeDetectorsWorking: "",
        pullStationsWorking: "",
        hornsStrobesWorking: "",
        indicatorValvesTested: "",
        waterFlowAlarmsTested: "",
        supervisorySignalsTested: "",
        hoodSuppressionMaintained: "",
        dampersInPlace: "",
        dampersTested: "",
        additionalNotes: "",
      },
      electricalEmergencyPower: {
        generatorAvailable: "",
        generatorAutoStart: "",
        powerTransferTime: "",
        circuitBreakersMaintained: "",
        circuitBreakersInspected: "",
        receptaclesTested: "",
        additionalNotes: "",
      },
      fireBarriersConstruction: {
        fireRatedWallsIntact: "",
        fireRatedDoorsIntact: "",
        fireRatedCeilingsIntact: "",
        doorsSelfClosing: "",
        doorsSelfLatching: "",
        correctDoorHardware: "",
        dampersFirestopsInPlace: "",
        interiorFinishesCompliant: "",
        additionalNotes: "",
      },
      emergencyEvacuationPreparedness: {
        evacuationPlanExists: "",
        mobilityImpairedAccounted: "",
        drillFrequency: "",
        drillDocumentation: "",
        alternateEmergencyPlans: "",
        staffTrainingOnEvacuation: "",
        additionalNotes: "",
      },
      testsInspectionsMaintenance: {
        fireAlarmTestFrequency: "",
        fireAlarmTestReports: "",
        sprinklerInspectionRecords: "",
        sprinklerMaintenanceRecords: "",
        fireExtinguisherMonthlyInspection: "",
        fireExtinguisherAnnualService: "",
        generatorTestLogs: "",
        generatorWeeklyTestRuns: "",
        generatorLoadTests: "",
        kitchenHoodMaintenance: "",
        additionalNotes: "",
      },
      surveyorEntranceOnsiteReview: {
        facilityFloorPlansAvailable: "",
        keyPersonnelIdentified: "",
        recentRemodelingConstruction: "",
        remodelingImpactAssessment: "",
        lscWaiversInPlace: "",
        additionalNotes: "",
      },
      waivers: [],
    },
  });

  const [expandedSections, setExpandedSections] = useState({});
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [currentWaiver, setCurrentWaiver] = useState(null);
  const [showFacilityDataLoaded, setShowFacilityDataLoaded] = useState(false);
  const [showFacilityInfo, setShowFacilityInfo] = useState(false);
  const [showCustomKTagModal, setShowCustomKTagModal] = useState(false);
  const [currentCustomKTag, setCurrentCustomKTag] = useState(null);
  const [currentSection, setCurrentSection] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [isClosingSurvey, setIsClosingSurvey] = useState(false);
  const [closureData, setClosureData] = useState({
    surveyClosed: false,
    closureNotes: "",
    closureSignature: {
      signedBy: "",
      title: "",
      signedDate: new Date(),
      confirmed: false,
    },
  });
  const [surveyClosed, setSurveyClosed] = useState(false);

  // Handle survey data changes
  const handleSurveyDataChange = (key, value) => {
    setSurveyData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Handle life safety question changes
  const handleLifeSafetyQuestionChange = useCallback(
    (category, field, value) => {
      setSurveyData((prev) => ({
        ...prev,
        lifeSafetySurvey: {
          ...prev.lifeSafetySurvey,
          [category]: {
            ...prev.lifeSafetySurvey[category],
            [field]: value,
          },
        },
      }));
    },
    []
  );

  // Save survey data to backend
  const saveSurveyData = async () => {
    try {
      setIsSaving(true);
      const surveyId =
        localStorage.getItem("currentSurveyId") ||
        new URLSearchParams(window.location.search).get("surveyId");

      if (!surveyId) {
        toast.error("No survey found. Please create a survey first.", {
          position: "top-right",
        });
        return;
      }

      // Remove facilityInfo and completedAt from payload since we get facilityInfo from surveyId and completedAt goes at root level
      const {
        facilityInfo,
        completedAt,
        ...lifeSafetyDataWithoutFacilityInfo
      } = surveyData.lifeSafetySurvey;

      const payload = {
        currentStep: "life-safety-survey",
        stepData: {
          surveyId: surveyId,
          ...lifeSafetyDataWithoutFacilityInfo,
          submittedAt: new Date().toISOString(),
        },
        completedAt: new Date().toISOString(),
      };

      // Check if online before making API call
      if (!navigator.onLine) {
        // Save offline and inform user
        const saveOfflineData = async (payload, surveyId) => {
          try {
            const offlineData = {
              ...payload,
              submittedAt: new Date().toISOString(),
              apiEndpoint: "updateLifeSafetySurvey", // Store which API to call (will try update first)
              apiFallbackEndpoint: "submitLifeSafetySurvey", // Fallback API endpoint
              apiMethod: "survey", // Store API method/namespace
              existingSurveyId: surveyId || null, // Store existing survey ID if updating
            };

            // Step 1: Save to IndexedDB sync queue (permanent storage)
            let syncQueueId = null;
            const tempSurveyId = surveyId || `temp_life_safety_${Date.now()}`; // Temporary ID for life safety survey creation
            const stepId = payload.currentStep || "life-safety-survey";
            const syncItem = await surveyIndexedDB.addToSyncQueue(
              tempSurveyId,
              stepId,
              offlineData,
              "api_life_safety_survey" // type for API-based life safety survey
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

        await saveOfflineData(payload, surveyId);
        toast.success("Internet connectivity issues detected. Data saved offline and will sync when connection is restored.", {
          position: "top-right",
          duration: 5000,
        });
        setIsSaving(false);
        return; // Exit early - data is saved offline
      }

      // Try to update existing survey first, then create new if needed (only if online)
      try {
        await surveyAPI.updateLifeSafetySurvey(surveyId, payload);
        toast.success("Survey data saved successfully!", {
          description: "Your life safety survey has been updated.",
          position: "top-right",
        });
      } catch (updateError) {
        // If update fails, try to create new
        await surveyAPI.submitLifeSafetySurvey(payload);
        toast.success("Survey data created successfully!", {
          description: "Your life safety survey has been created.",
          position: "top-right",
        });
      }
    } catch (error) {
     
      toast.error(`Error saving survey: ${error.message}`, {
        position: "top-right",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Load saved data
  useEffect(() => {
   
    const loadSurveyData = async () => {

      try {
        setIsLoading(true);
        // Get survey ID from localStorage or URL params
        const surveyId =
          localStorage.getItem("currentSurveyId") ||
          new URLSearchParams(window.location.search).get("surveyId");

   

        if (surveyId) {
          try {
            // Try to get the survey wizard data for facility info
            const wizardResponse = await surveyAPI.getSurveyWizard(surveyId);
            if (wizardResponse.statusCode === 200 && wizardResponse.data) {
              const wizardData = wizardResponse.data;

              setShowFacilityDataLoaded(true);
              setTimeout(() => setShowFacilityDataLoaded(false), 5000);

              // Check if survey is closed from wizard response
              const isClosed =
                wizardResponse?.data?.surveyClosureSurvey?.surveyClosed ||
                wizardResponse?.data?.surveyClosureSurvey?.surveyCompleted ||
                wizardResponse?.data?.surveyCompleted;
              if (isClosed) {
                setSurveyClosed(true);
              }

              // Update facility info from wizard data
              setSurveyData((prev) => ({
                ...prev,
                lifeSafetySurvey: {
                  ...prev.lifeSafetySurvey,
                  facilityInfo: {
                    ...prev.lifeSafetySurvey.facilityInfo,
                    facilityName: wizardData.facilityInfo?.facilityName || "",
                    providerNumber: wizardData.facilityInfo?.ccn || "",
                    surveyDate: wizardData.surveyCreationDate || null,
                    medicaidId: wizardData.facilityInfo?.medicaidId || "",
                    multipleConstruction:
                      wizardData.facilityInfo?.multipleConstruction || "",
                    fullySprinklered:
                      wizardData.facilityInfo?.fullySprinklered || "",
                  },
                  crucialData: {
                    ...prev.lifeSafetySurvey.crucialData,
                    facilityName: wizardData.facilityInfo?.facilityName || "",
                    providerNumber: wizardData.facilityInfo?.ccn || "",
                    surveyDate: wizardData.surveyCreationDate || null,
                  },
                },
              }));
            }

            // Try to get the life safety survey data
            const response = await surveyAPI.getLifeSafetySurvey(surveyId);
            if (response.statusCode === 200 && response.data) {
              // Merge the loaded data with existing state
              let loadedData = {};
              if (response.data.stepData) {
                loadedData = response.data.stepData;
              } else if (response.data.lifeSafetySurvey) {
                loadedData = response.data.lifeSafetySurvey;
              } else {
                loadedData = response.data;
              }

              // Exclude completedAt from loaded data when setting state
              const {
                completedAt: _,
                surveyId: __,
                submittedAt: ___,
                ...surveyDataOnly
              } = loadedData;

              // If the loaded data has lifeSafetySurvey nested (e.g., { lifeSafetySurvey: {...} }), extract it
              if (surveyDataOnly.lifeSafetySurvey) {
                setSurveyData((prev) => ({
                  ...prev,
                  lifeSafetySurvey: {
                    ...prev.lifeSafetySurvey,
                    ...surveyDataOnly.lifeSafetySurvey,
                  },
                }));
              } else {
                // If it's the direct lifeSafetySurvey data (without nesting), merge it
                setSurveyData((prev) => ({
                  ...prev,
                  lifeSafetySurvey: {
                    ...prev.lifeSafetySurvey,
                    ...surveyDataOnly,
                  },
                }));
              }
            }

            // Try to get survey closure status
            try {
              const closureResponse = await surveyAPI.getSurveyClosure(
                surveyId
              );
              if (closureResponse.statusCode === 200 && closureResponse.data) {
                const closure =
                  closureResponse.data.stepData || closureResponse.data;
                if (closure.surveyClosed) {
                  setSurveyClosed(true);
                  const signature = closure.closureSignature || {};
                  setClosureData({
                    surveyClosed: closure.surveyClosed || false,
                    closureNotes: closure.closureNotes || "",
                    closureSignature: {
                      signedBy: signature.signedBy || "",
                      title: signature.title || "",
                      signedDate: signature.signedDate
                        ? new Date(signature.signedDate)
                        : null,
                      confirmed: signature.confirmed || false,
                    },
                  });
                }
              }
            } catch (closureError) {
              // Closure not found is okay, survey might not be closed yet
             // console.log("Survey closure not found or not yet closed");
            }
          } catch (error) {
            //console.error("Error loading survey data:", error);
          }
        }
      } catch (error) {
       // console.error("Error loading survey data:", error);
        toast.error("Failed to load survey data");
      } finally {
        setIsLoading(false);
      }
    };

    loadSurveyData();
  }, []);

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Handle K-tag assessment change
  const handleKTagChange = useCallback((sectionId, kTagId, field, value) => {
    setSurveyData((prev) => {
      const currentData = prev?.lifeSafetySurvey?.[sectionId] || {};
      const currentKTag = currentData[kTagId] || {};

      const updatedKTag = {
        ...currentKTag,
        [field]: value,
      };

      const updatedSection = {
        ...currentData,
        [kTagId]: updatedKTag,
      };

      return {
        ...prev,
        lifeSafetySurvey: {
          ...(prev?.lifeSafetySurvey || {}),
          [sectionId]: updatedSection,
        },
      };
    });
  }, []);

  // Handle waiver addition
  const handleAddWaiver = () => {
    setCurrentWaiver({
      provisionNumber: "",
      justification: "",
    });
    setShowWaiverModal(true);
  };

  const handleSaveWaiver = () => {
    if (
      !handleSurveyDataChange ||
      !currentWaiver?.provisionNumber ||
      !currentWaiver?.justification
    )
      return;

    const currentWaivers = surveyData?.lifeSafetySurvey?.waivers || [];
    const newWaiver = {
      id: Date.now().toString(),
      ...currentWaiver,
      dateAdded: new Date().toISOString(),
    };

    handleSurveyDataChange("lifeSafetySurvey", {
      ...(surveyData?.lifeSafetySurvey || {}),
      waivers: [...currentWaivers, newWaiver],
    });

    setShowWaiverModal(false);
    setCurrentWaiver(null);
  };

  // Handle custom K-tag addition
  const handleAddCustomKTag = (sectionId) => {
    setCurrentSection(sectionId);
    setCurrentCustomKTag({
      kTagId: "",
      title: "",
      description: "",
      fTag: "",
    });
    setShowCustomKTagModal(true);
  };

  const handleSaveCustomKTag = () => {
    if (
      !currentCustomKTag?.kTagId ||
      !currentCustomKTag?.title ||
      !currentSection
    )
      return;

    const currentData = surveyData?.lifeSafetySurvey?.[currentSection] || {};
    const customKTagData = {
      status: "",
      remarks: "",
      isCustom: true,
      title: currentCustomKTag.title,
      description: currentCustomKTag.description,
      fTag: currentCustomKTag.fTag,
    };

    const updatedSection = {
      ...currentData,
      [currentCustomKTag.kTagId]: customKTagData,
    };

    handleSurveyDataChange("lifeSafetySurvey", {
      ...(surveyData?.lifeSafetySurvey || {}),
      [currentSection]: updatedSection,
    });

    setShowCustomKTagModal(false);
    setCurrentCustomKTag(null);
    setCurrentSection(null);
  };

  // Section header component
  const SectionHeader = ({
    sectionId,
    title,
    description,
    kTagCount,
    isDisabled = false,
  }) => {
    const isExpanded = expandedSections[sectionId];

    return (
      <button
        className={`w-full p-3 sm:p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
          isDisabled
            ? "cursor-not-allowed opacity-60"
            : "hover:bg-gray-20 cursor-pointer"
        }`}
        onClick={() => toggleSection(sectionId)}
        disabled={isDisabled}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-slate-900 text-xs sm:text-sm truncate">
                {title}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed hidden sm:block">
                {description}
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500 px-2 py-1 rounded-md font-medium flex-shrink-0">
            {kTagCount}
          </span>
        </div>
      </button>
    );
  };

  // Function to render custom K-tags for a section
  const renderCustomKTags = (sectionId) => {
    const sectionData = surveyData?.lifeSafetySurvey?.[sectionId] || {};
    const customKTags = Object.entries(sectionData).filter(
      ([kTagId, data]) => data.isCustom
    );

    return customKTags.map(([kTagId, data]) => (
      <KTagAssessment
        key={kTagId}
        sectionId={sectionId}
        kTagId={kTagId}
        title={data.title}
        description={data.description}
        fTag={data.fTag}
        isCustom={true}
        status={data.status}
        remarks={data.remarks}
        scopeSeverity={data.scopeSeverity}
        onStatusChange={handleKTagChange}
        onRemarksChange={handleKTagChange}
        onScopeSeverityChange={handleKTagChange}
        isDisabled={surveyClosed}
      />
    ));
  };

  // Handle survey closure
  const handleCloseSurvey = async () => {
    // Ensure signedDate is set to current date
    const currentDate = new Date();

    if (
      !closureData.closureSignature.signedBy ||
      !closureData.closureSignature.title
    ) {
      toast.error("Please complete all signature fields", {
        description: "Signed By and Title are required.",
        position: "top-right",
      });
      return;
    }

    if (!closureData.closureSignature.confirmed) {
      toast.error(
        "Please confirm that all survey activities have been completed",
        {
          position: "top-right",
        }
      );
      return;
    }

    try {
      setIsClosingSurvey(true);
      const surveyId =
        localStorage.getItem("currentSurveyId") ||
        new URLSearchParams(window.location.search).get("surveyId");

      if (!surveyId) {
        toast.error("No survey found. Please create a survey first.", {
          position: "top-right",
        });
        return;
      }

      const payload = {
        currentStep: "survey-closure",
        stepData: {
          surveyId: surveyId,
          surveyClosed: true,
          closureNotes: closureData.closureNotes,
          closureSignature: {
            signedBy: closureData.closureSignature.signedBy,
            title: closureData.closureSignature.title,
            signedDate: currentDate.toISOString(),
            confirmed: closureData.closureSignature.confirmed,
          },
          closedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          closedFromStep: "life-safety-survey",
        },
        completedAt: new Date().toISOString(),
        surveyCompleted: true,
      };

      // Try to update existing closure first, then create new if needed
      try {
        await surveyAPI.updateSurveyClosure(surveyId, payload);
        toast.success("Survey closed successfully!", {
          description: "The survey has been marked as closed.",
          position: "top-right",
        });
      } catch (updateError) {
        // If update fails, try to create new
        await surveyAPI.submitSurveyClosure(payload);
        toast.success("Survey closed successfully!", {
          description: "The survey has been marked as closed.",
          position: "top-right",
        });
      }

      setSurveyClosed(true);
      setShowClosureModal(false);
    } catch (error) {
    
      toast.error(`Error closing survey: ${error.message}`, {
        position: "top-right",
      });
    } finally {
      setIsClosingSurvey(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-white z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                onClick={() => (window.location.href = "/mocksurvey365")}
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-900 text-xs sm:text-sm flex-shrink-0"
              >
                ← Back
              </Button>
              <div className="h-4 sm:h-6 w-px bg-slate-300 flex-shrink-0"></div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-900 truncate">
                  Life Safety Survey
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 hidden sm:block">
                  NFPA 101 & NFPA 99 Assessment
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
              {surveyClosed && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 border-green-200 text-xs sm:text-sm"
                >
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Survey Closed
                </Badge>
              )}
              {!surveyClosed && (
                <Button
                  onClick={() => {
                    // Reset signature date to current date when opening modal
                    setClosureData((prev) => ({
                      ...prev,
                      closureSignature: {
                        ...prev.closureSignature,
                        signedDate: new Date(),
                      },
                    }));
                    setShowClosureModal(true);
                  }}
                  disabled={
                    isSaving || !localStorage.getItem("currentSurveyId")
                  }
                  className="h-8 sm:h-9 px-3 sm:px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg disabled:opacity-50 text-xs sm:text-sm"
                >
                  <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Close Survey</span>
                  <span className="sm:hidden">Close</span>
                </Button>
              )}
              <Button
                onClick={saveSurveyData}
                disabled={
                  isSaving ||
                  surveyClosed ||
                  !localStorage.getItem("currentSurveyId")
                }
                className="h-8 sm:h-9 px-3 sm:px-4 bg-sky-800 hover:bg-sky-700 text-white font-medium rounded-lg disabled:opacity-50 text-xs sm:text-sm"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                    <span className="hidden sm:inline">Saving...</span>
                    <span className="sm:hidden">Save</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Save Survey</span>
                    <Save className="w-4 h-4 sm:hidden" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex max-w-7xl mx-auto pt-20 sm:pt-24">
        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 pb-8 pr-0 lg:pr-6">
          {/* Success Notification */}
          {showFacilityDataLoaded && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-emerald-50 border-l-4 border-emerald-400 rounded-r-lg">
              <div className="flex items-start">
                <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm sm:text-base font-medium text-emerald-900 mb-1">
                    Facility data imported successfully
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-700">
                    Your facility information has been automatically populated
                    from the survey setup.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Assessment Sections */}
          <div className="space-y-6 sm:space-y-8">
            {/* Part I Header */}
            <div className="pb-2">
              <h2 className="text-base sm:text-lg font-medium text-slate-900">
                Part I — Life Safety Survey Questions
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Comprehensive fire safety and life safety code compliance
                assessment
              </p>
            </div>

            {/* Assessment sections container */}
            <div className="space-y-6">
              {/* Section 1 - Documentation & Policy */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <SectionHeader
                  sectionId="documentationPolicy"
                  title="Documentation & Policy"
                  description="Fire safety plans, policies, and record keeping requirements"
                  kTagCount={8}
                  isDisabled={surveyClosed}
                />

                {expandedSections.documentationPolicy && (
                  <div className="border-t border-slate-100 p-4 sm:p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <LifeSafetyQuestion
                        category="documentationPolicy"
                        field="fireSafetyPlan"
                        question="Do you have the Fire Safety Plan in writing?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Partial", label: "Partial" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.documentationPolicy
                            ?.fireSafetyPlan
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="documentationPolicy"
                        field="lastFireDrill"
                        question="When was your last fire drill?"
                        type="text"
                        value={
                          surveyData?.lifeSafetySurvey?.documentationPolicy
                            ?.lastFireDrill
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="documentationPolicy"
                        field="fireDrillParticipants"
                        question="Who participated in the last fire drill?"
                        type="textarea"
                        value={
                          surveyData?.lifeSafetySurvey?.documentationPolicy
                            ?.fireDrillParticipants
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="documentationPolicy"
                        field="smokingPolicy"
                        question="Is there a smoking policy in place?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.documentationPolicy
                            ?.smokingPolicy
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="documentationPolicy"
                        field="smokingPolicyEnforced"
                        question="Is the smoking policy enforced?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Partially", label: "Partially" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.documentationPolicy
                            ?.smokingPolicyEnforced
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="documentationPolicy"
                        field="fireAlarmTestingRecords"
                        question="Do you keep records of fire alarm testing?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.documentationPolicy
                            ?.fireAlarmTestingRecords
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="documentationPolicy"
                        field="sprinklerInspectionRecords"
                        question="Do you keep records of sprinkler inspections?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.documentationPolicy
                            ?.sprinklerInspectionRecords
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="documentationPolicy"
                        field="emergencyPowerTestRecords"
                        question="Do you keep records of emergency power tests?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.documentationPolicy
                            ?.emergencyPowerTestRecords
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />
                    </div>

                    <LifeSafetyQuestion
                      category="documentationPolicy"
                      field="additionalNotes"
                      question="Additional Notes"
                      type="textarea"
                      value={
                        surveyData?.lifeSafetySurvey?.documentationPolicy
                          ?.additionalNotes
                      }
                      onChange={handleLifeSafetyQuestionChange}
                    />

                    {/* K-Tags Section */}
                    <div className="border-t border-slate-200 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-slate-900">
                          K-Tag Assessments
                        </h4>
                        <Button
                          onClick={() =>
                            handleAddCustomKTag("documentationPolicy")
                          }
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 text-xs"
                          disabled={surveyClosed}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add K-Tag
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {/* Predefined K-Tags */}
                        <KTagAssessment
                          sectionId="documentationPolicy"
                          kTagId="K48"
                          title="Emergency Plan and Fire Drills"
                          description="There is a written plan for the protection of all patients and for their evacuation in the event of an emergency."
                          fTag="18.7.1.1, 19.7.1.1"
                          status={
                            surveyData?.lifeSafetySurvey?.documentationPolicy
                              ?.K48?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey?.documentationPolicy
                              ?.K48?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey?.documentationPolicy
                              ?.K48?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        <KTagAssessment
                          sectionId="documentationPolicy"
                          kTagId="K50"
                          title="Fire Drill Procedures"
                          description="Fire drills are held at unexpected times under varying conditions, at least quarterly on each shift. The staff is familiar with procedures and is aware that drills are part of established routine."
                          fTag="18.7.1.2, 19.7.1.2"
                          status={
                            surveyData?.lifeSafetySurvey?.documentationPolicy
                              ?.K50?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey?.documentationPolicy
                              ?.K50?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey?.documentationPolicy
                              ?.K50?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        <KTagAssessment
                          sectionId="documentationPolicy"
                          kTagId="K66"
                          title="Smoking Regulations"
                          description="Smoking regulations shall be adopted and shall include provisions for prohibited areas, supervision requirements, ashtray specifications, and safe disposal containers."
                          fTag="18.7.4, 19.7.4"
                          status={
                            surveyData?.lifeSafetySurvey?.documentationPolicy
                              ?.K66?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey?.documentationPolicy
                              ?.K66?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey?.documentationPolicy
                              ?.K66?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        {/* Custom K-Tags */}
                        {renderCustomKTags("documentationPolicy")}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2 - Exit & Egress */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <SectionHeader
                  sectionId="exitEgress"
                  title="Exit & Egress"
                  description="Exit routes, signage, and egress path requirements"
                  kTagCount={5}
                  isDisabled={surveyClosed}
                />

                {expandedSections.exitEgress && (
                  <div className="border-t border-slate-100 p-4 sm:p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <LifeSafetyQuestion
                        category="exitEgress"
                        field="egressPathsClear"
                        question="Are all egress paths (hallways, stairwells, exit doors) free of obstruction?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Partial", label: "Partial" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.exitEgress
                            ?.egressPathsClear
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="exitEgress"
                        field="exitSignsIlluminated"
                        question="Are exit signs illuminated?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Some", label: "Some" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.exitEgress
                            ?.exitSignsIlluminated
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="exitEgress"
                        field="exitSignsVisible"
                        question="Are exit signs visible from all required locations?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Some", label: "Some" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.exitEgress
                            ?.exitSignsVisible
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="exitEgress"
                        field="doorHardwareFunctioning"
                        question="Do doors along egress routes latch appropriately (door hardware functioning)?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Some", label: "Some" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.exitEgress
                            ?.doorHardwareFunctioning
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="exitEgress"
                        field="exitDischargeAreasClear"
                        question="Are exit discharge areas (outside the building exits) clear and safe?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Partial", label: "Partial" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.exitEgress
                            ?.exitDischargeAreasClear
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />
                    </div>

                    <LifeSafetyQuestion
                      category="exitEgress"
                      field="additionalNotes"
                      question="Additional Notes"
                      type="textarea"
                      value={
                        surveyData?.lifeSafetySurvey?.exitEgress
                          ?.additionalNotes
                      }
                      onChange={handleLifeSafetyQuestionChange}
                    />

                    {/* K-Tags Section */}
                    <div className="border-t border-slate-200 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-slate-900">
                          K-Tag Assessments
                        </h4>
                        <Button
                          onClick={() => handleAddCustomKTag("exitEgress")}
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 text-xs"
                          disabled={surveyClosed}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add K-Tag
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {/* Predefined K-Tags */}
                        <KTagAssessment
                          sectionId="exitEgress"
                          kTagId="K18"
                          title="Corridor Doors - Existing (2000)"
                          description="Doors protecting corridor openings in other than required enclosures of vertical openings, exits, or hazardous areas shall be substantial doors, such as those constructed of 1¾ inch solid-bonded core wood, or capable of resisting fire for at least 20 minutes."
                          fTag="19.3.6.3"
                          status={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K18
                              ?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K18
                              ?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K18
                              ?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        <KTagAssessment
                          sectionId="exitEgress"
                          kTagId="K22"
                          title="Exit Access Marking"
                          description="Access to exits shall be marked by approved, readily visible signs in all cases where the exit or way to reach exit is not readily apparent to the occupants."
                          fTag="7.10.1.4"
                          status={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K22
                              ?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K22
                              ?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K22
                              ?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        <KTagAssessment
                          sectionId="exitEgress"
                          kTagId="K38"
                          title="Exit Access Arrangement"
                          description="Exit access is so arranged that exits are readily accessible at all times in accordance with 7.1."
                          fTag="18.2.1, 19.2.1"
                          status={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K38
                              ?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K38
                              ?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K38
                              ?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        <KTagAssessment
                          sectionId="exitEgress"
                          kTagId="K39"
                          title="Corridor Width - Existing (2000)"
                          description="Width of aisles or corridors (clear and unobstructed) serving as exit access shall be at least 4 feet."
                          fTag="19.2.3.3"
                          status={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K39
                              ?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K39
                              ?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K39
                              ?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        <KTagAssessment
                          sectionId="exitEgress"
                          kTagId="K40"
                          title="Exit Door Width - Existing (2000)"
                          description="Exit access doors and exit doors used by health care occupants are of the swinging type and are at least 32 inches in clear width."
                          fTag="19.2.3.5"
                          status={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K40
                              ?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K40
                              ?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K40
                              ?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        <KTagAssessment
                          sectionId="exitEgress"
                          kTagId="K43"
                          title="Patient Room Door Arrangement"
                          description="Patient room doors are arranged such that the patients can open the door from inside without using a key. Special door locking arrangements are permitted in health facilities."
                          fTag="18.2.2.2.4, 18.2.2.2.5"
                          status={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K43
                              ?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K43
                              ?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K43
                              ?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        <KTagAssessment
                          sectionId="exitEgress"
                          kTagId="K45"
                          title="Illumination of Means of Egress"
                          description="Illumination of means of egress, including exit discharge, is arranged so that failure of any single lighting fixture (bulb) will not leave the area in darkness."
                          fTag="18.2.8, 19.2.8, 7.8"
                          status={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K45
                              ?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K45
                              ?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K45
                              ?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        <KTagAssessment
                          sectionId="exitEgress"
                          kTagId="K47"
                          title="Exit and Directional Signs"
                          description="Exit and directional signs are displayed in accordance with 7.10 with continuous illumination also served by the emergency lighting system."
                          fTag="19.2.10.1"
                          status={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K47
                              ?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K47
                              ?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K47
                              ?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        <KTagAssessment
                          sectionId="exitEgress"
                          kTagId="K72"
                          title="Means of Egress Obstructions"
                          description="Means of egress shall be continuously maintained free of all obstructions or impediments to full instant use in the case of fire or other emergency."
                          fTag="7.1.10"
                          status={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K72
                              ?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K72
                              ?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey?.exitEgress?.K72
                              ?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        {/* Custom K-Tags */}
                        {renderCustomKTags("exitEgress")}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Part II */}
          <div className="space-y-8 mt-12">
            {/* Part II Header */}
            <div className="pb-2">
              <h2 className="text-lg font-medium text-slate-900">
                Part II — Fire Protection & Safety Systems
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Fire protection systems, electrical systems, and building
                construction requirements
              </p>
            </div>

            <div className="space-y-6">
              {/* Section 3 - Fire Protection Systems */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <SectionHeader
                  sectionId="fireProtectionSystems"
                  title="Fire Protection Systems"
                  description="Sprinkler systems, alarms, and fire suppression equipment"
                  kTagCount={12}
                  isDisabled={surveyClosed}
                />

                {expandedSections.fireProtectionSystems && (
                  <div className="border-t border-slate-100 p-4 sm:p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <LifeSafetyQuestion
                        category="fireProtectionSystems"
                        field="sprinklerSystemCondition"
                        question="Are sprinkler systems in good working condition?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Partial", label: "Partial" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.fireProtectionSystems
                            ?.sprinklerSystemCondition
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="fireProtectionSystems"
                        field="sprinklerSystemInspected"
                        question="Are sprinkler systems inspected and tested as required?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Partial", label: "Partial" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.fireProtectionSystems
                            ?.sprinklerSystemInspected
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="fireProtectionSystems"
                        field="fireAlarmsWorking"
                        question="Are fire alarms working correctly?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Some", label: "Some" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.fireProtectionSystems
                            ?.fireAlarmsWorking
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="fireProtectionSystems"
                        field="smokeDetectorsWorking"
                        question="Are smoke detectors working correctly?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Some", label: "Some" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.fireProtectionSystems
                            ?.smokeDetectorsWorking
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="fireProtectionSystems"
                        field="pullStationsWorking"
                        question="Are pull stations working correctly?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Some", label: "Some" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.fireProtectionSystems
                            ?.pullStationsWorking
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="fireProtectionSystems"
                        field="hornsStrobesWorking"
                        question="Are horns/strobes working correctly?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Some", label: "Some" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.fireProtectionSystems
                            ?.hornsStrobesWorking
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="fireProtectionSystems"
                        field="indicatorValvesTested"
                        question="Is there a routine for testing indicator valves?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.fireProtectionSystems
                            ?.indicatorValvesTested
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="fireProtectionSystems"
                        field="waterFlowAlarmsTested"
                        question="Are water flow alarms tested regularly?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.fireProtectionSystems
                            ?.waterFlowAlarmsTested
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="fireProtectionSystems"
                        field="supervisorySignalsTested"
                        question="Are supervisory signals tested regularly?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.fireProtectionSystems
                            ?.supervisorySignalsTested
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="fireProtectionSystems"
                        field="hoodSuppressionMaintained"
                        question="Are hood suppression systems in kitchens maintained?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "N/A", label: "N/A" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.fireProtectionSystems
                            ?.hoodSuppressionMaintained
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="fireProtectionSystems"
                        field="dampersInPlace"
                        question="Are dampers in place where required?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Some", label: "Some" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.fireProtectionSystems
                            ?.dampersInPlace
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="fireProtectionSystems"
                        field="dampersTested"
                        question="Are dampers tested regularly?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.fireProtectionSystems
                            ?.dampersTested
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />
                    </div>

                    <LifeSafetyQuestion
                      category="fireProtectionSystems"
                      field="additionalNotes"
                      question="Additional Notes"
                      type="textarea"
                      value={
                        surveyData?.lifeSafetySurvey?.fireProtectionSystems
                          ?.additionalNotes
                      }
                      onChange={handleLifeSafetyQuestionChange}
                    />

                    {/* K-Tags Section */}
                    <div className="border-t border-slate-200 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-slate-900">
                          K-Tag Assessments
                        </h4>
                        <Button
                          onClick={() =>
                            handleAddCustomKTag("fireProtectionSystems")
                          }
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 text-xs"
                          disabled={surveyClosed}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add K-Tag
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {/* Predefined K-Tags */}
                        <KTagAssessment
                          sectionId="fireProtectionSystems"
                          kTagId="K51"
                          title="Fire Alarm System - Existing (2000)"
                          description="A fire alarm system with approved component, devices or equipment installed according to NFPA 72, National Fire Alarm Code to provide effective warning of fire in any part of the building."
                          fTag="19.3.4, 9.6"
                          status={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K51?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K51?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K51?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        <KTagAssessment
                          sectionId="fireProtectionSystems"
                          kTagId="K52"
                          title="Fire Alarm System Maintenance"
                          description="A fire alarm system required for life safety shall be installed, tested, and maintained in accordance with NFPA 70 National Electrical Code and NFPA 72."
                          fTag="9.6.1.4"
                          status={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K52?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K52?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K52?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        <KTagAssessment
                          sectionId="fireProtectionSystems"
                          kTagId="K53"
                          title="Smoke Detection System - Existing (2000)"
                          description="In an existing nursing home, not fully sprinklered, the resident sleeping rooms and public areas are to be equipped with single station battery-operated smoke detectors."
                          fTag="CFR 483.70"
                          status={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K53?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K53?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K53?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        <KTagAssessment
                          sectionId="fireProtectionSystems"
                          kTagId="K56"
                          title="Automatic Sprinkler Systems - Existing (2000)"
                          description="Where required by section 19.1.6, Health care facilities shall be protected throughout by an approved, supervised automatic sprinkler system in accordance with section 9.7."
                          fTag="19.3.5, NFPA 13"
                          status={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K56?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K56?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K56?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        <KTagAssessment
                          sectionId="fireProtectionSystems"
                          kTagId="K62"
                          title="Sprinkler System Maintenance"
                          description="Automatic sprinkler systems are continuously maintained in reliable operating condition and are inspected and tested periodically."
                          fTag="18.7.6, 19.7.6, 4.6.12, NFPA 13, NFPA 25, 9.7.5"
                          status={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K62?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K62?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K62?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        <KTagAssessment
                          sectionId="fireProtectionSystems"
                          kTagId="K64"
                          title="Portable Fire Extinguishers"
                          description="Portable fire extinguishers shall be provided in all health care occupancies in accordance with 9.7.4.1, NFPA 10."
                          fTag="18.3.5.6, 19.3.5.6"
                          status={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K64?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K64?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K64?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        <KTagAssessment
                          sectionId="fireProtectionSystems"
                          kTagId="K154"
                          title="Sprinkler System Out of Service"
                          description="Where a required automatic sprinkler system is out of service for more than 4 hours in a 24-hour period, the authority having jurisdiction shall be notified."
                          fTag="9.7.6.1"
                          status={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K154?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K154?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K154?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        <KTagAssessment
                          sectionId="fireProtectionSystems"
                          kTagId="K155"
                          title="Fire Alarm System Out of Service"
                          description="Where a required fire alarm system is out of service for more than 4 hours in a 24-hour period, the authority having jurisdiction shall be notified."
                          fTag="9.6.1.8"
                          status={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K155?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K155?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey?.fireProtectionSystems
                              ?.K155?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        {/* Custom K-Tags */}
                        {renderCustomKTags("fireProtectionSystems")}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 4 - Electrical / Emergency Power */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <SectionHeader
                  sectionId="electricalEmergencyPower"
                  title="Electrical / Emergency Power"
                  description="Backup power systems, generators, and electrical safety"
                  kTagCount={6}
                  isDisabled={surveyClosed}
                />

                {expandedSections.electricalEmergencyPower && (
                  <div className="border-t border-slate-100 p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <LifeSafetyQuestion
                        category="electricalEmergencyPower"
                        field="generatorAvailable"
                        question="Is there a generator or other backup power source?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.electricalEmergencyPower
                            ?.generatorAvailable
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="electricalEmergencyPower"
                        field="generatorAutoStart"
                        question="Does the generator start automatically as required?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "N/A", label: "N/A" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.electricalEmergencyPower
                            ?.generatorAutoStart
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="electricalEmergencyPower"
                        field="powerTransferTime"
                        question="How quickly does power transfer after power loss?"
                        type="text"
                        value={
                          surveyData?.lifeSafetySurvey?.electricalEmergencyPower
                            ?.powerTransferTime
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="electricalEmergencyPower"
                        field="circuitBreakersMaintained"
                        question="Are circuit breakers or panels attached to the emergency / life safety branch maintained?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.electricalEmergencyPower
                            ?.circuitBreakersMaintained
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="electricalEmergencyPower"
                        field="circuitBreakersInspected"
                        question="Are circuit breakers inspected regularly?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.electricalEmergencyPower
                            ?.circuitBreakersInspected
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="electricalEmergencyPower"
                        field="receptaclesTested"
                        question="Are receptacles (electrical outlets) tested according to code (especially in patient care areas)?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.electricalEmergencyPower
                            ?.receptaclesTested
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />
                    </div>

                    <LifeSafetyQuestion
                      category="electricalEmergencyPower"
                      field="additionalNotes"
                      question="Additional Notes"
                      type="textarea"
                      value={
                        surveyData?.lifeSafetySurvey?.electricalEmergencyPower
                          ?.additionalNotes
                      }
                      onChange={handleLifeSafetyQuestionChange}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Part III - Additional Safety Categories */}
          <div className="space-y-8 mt-12">
            {/* Part III Header */}
            <div className="pb-2">
              <h2 className="text-lg font-medium text-slate-900">
                Part III — Building Construction & Emergency Preparedness
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Fire barriers, construction integrity, evacuation planning, and
                maintenance records
              </p>
            </div>

            <div className="space-y-6">
              {/* Section 5 - Fire Barriers, Construction, & Building Integrity */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <SectionHeader
                  sectionId="fireBarriersConstruction"
                  title="Fire Barriers, Construction, & Building Integrity"
                  description="Fire rated walls, doors, ceilings, and building construction requirements"
                  kTagCount={8}
                  isDisabled={surveyClosed}
                />

                {expandedSections.fireBarriersConstruction && (
                  <div className="border-t border-slate-100 p-4 sm:p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <LifeSafetyQuestion
                        category="fireBarriersConstruction"
                        field="fireRatedWallsIntact"
                        question="Are fire rated walls intact (no holes, penetrations, missing fire caulk, etc.)?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Partial", label: "Partial" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.fireBarriersConstruction
                            ?.fireRatedWallsIntact
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="fireBarriersConstruction"
                        field="fireRatedDoorsIntact"
                        question="Are fire rated doors intact and properly maintained?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Partial", label: "Partial" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.fireBarriersConstruction
                            ?.fireRatedDoorsIntact
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="fireBarriersConstruction"
                        field="fireRatedCeilingsIntact"
                        question="Are fire rated ceilings intact and properly maintained?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Partial", label: "Partial" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.fireBarriersConstruction
                            ?.fireRatedCeilingsIntact
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="fireBarriersConstruction"
                        field="doorsSelfClosing"
                        question="Are doors self-closing where required?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Some", label: "Some" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.fireBarriersConstruction
                            ?.doorsSelfClosing
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="fireBarriersConstruction"
                        field="doorsSelfLatching"
                        question="Are doors self-latching where required?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Some", label: "Some" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.fireBarriersConstruction
                            ?.doorsSelfLatching
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="fireBarriersConstruction"
                        field="correctDoorHardware"
                        question="Are doors equipped with the correct hardware?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Some", label: "Some" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.fireBarriersConstruction
                            ?.correctDoorHardware
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="fireBarriersConstruction"
                        field="dampersFirestopsInPlace"
                        question="Are dampers/firestops in place around penetrations (pipes, ducts, wiring)?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Partial", label: "Partial" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.fireBarriersConstruction
                            ?.dampersFirestopsInPlace
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="fireBarriersConstruction"
                        field="interiorFinishesCompliant"
                        question="Are interior finishes (flooring, walls, ceiling materials) compliant with flame spread, smoke developed index requirements?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Unknown", label: "Unknown" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey?.fireBarriersConstruction
                            ?.interiorFinishesCompliant
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />
                    </div>

                    <LifeSafetyQuestion
                      category="fireBarriersConstruction"
                      field="additionalNotes"
                      question="Additional Notes"
                      type="textarea"
                      value={
                        surveyData?.lifeSafetySurvey?.fireBarriersConstruction
                          ?.additionalNotes
                      }
                      onChange={handleLifeSafetyQuestionChange}
                    />

                    {/* K-Tags Section */}
                    <div className="border-t border-slate-200 pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-slate-900">
                          K-Tag Assessments
                        </h4>
                        <Button
                          onClick={() =>
                            handleAddCustomKTag("fireBarriersConstruction")
                          }
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 text-xs"
                          disabled={surveyClosed}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add K-Tag
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {/* Predefined K-Tags */}
                        <KTagAssessment
                          sectionId="fireBarriersConstruction"
                          kTagId="K20"
                          title="Vertical Openings - Existing (2000)"
                          description="Stairways, elevator shafts, light and ventilation shafts, chutes, and other vertical openings between floors are enclosed with construction having a fire resistance rating of at least one hour."
                          fTag="19.3.1.1"
                          status={
                            surveyData?.lifeSafetySurvey
                              ?.fireBarriersConstruction?.K20?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey
                              ?.fireBarriersConstruction?.K20?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey
                              ?.fireBarriersConstruction?.K20?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        <KTagAssessment
                          sectionId="fireBarriersConstruction"
                          kTagId="K23"
                          title="Smoke Compartmentation - Existing (2000)"
                          description="Smoke barriers shall be provided to form at least two smoke compartments on every sleeping room floor for more than 30 patients."
                          fTag="19.3.7.1, 19.3.7.2"
                          status={
                            surveyData?.lifeSafetySurvey
                              ?.fireBarriersConstruction?.K23?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey
                              ?.fireBarriersConstruction?.K23?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey
                              ?.fireBarriersConstruction?.K23?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        <KTagAssessment
                          sectionId="fireBarriersConstruction"
                          kTagId="K28"
                          title="Smoke Barrier Doors - Existing (2000)"
                          description="Door openings in smoke barriers shall provide a minimum clear width of 32 inches (81 cm) for swinging or horizontal doors."
                          fTag="19.3.7.5, 19.3.7.7"
                          status={
                            surveyData?.lifeSafetySurvey
                              ?.fireBarriersConstruction?.K28?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey
                              ?.fireBarriersConstruction?.K28?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey
                              ?.fireBarriersConstruction?.K28?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        <KTagAssessment
                          sectionId="fireBarriersConstruction"
                          kTagId="K29"
                          title="Hazardous Area Protection - Existing (2000)"
                          description="One hour fire rated construction (with ¾ hour fire-rated doors) or an approved automatic fire extinguishing system protects hazardous areas."
                          fTag="19.3.2.1"
                          status={
                            surveyData?.lifeSafetySurvey
                              ?.fireBarriersConstruction?.K29?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey
                              ?.fireBarriersConstruction?.K29?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey
                              ?.fireBarriersConstruction?.K29?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        <KTagAssessment
                          sectionId="fireBarriersConstruction"
                          kTagId="K30"
                          title="Gift Shop Protection"
                          description="Gift shops shall be protected as hazardous areas when used for storage or display of combustibles in quantities considered hazardous."
                          fTag="18.3.2.5, 19.3.2.5"
                          status={
                            surveyData?.lifeSafetySurvey
                              ?.fireBarriersConstruction?.K30?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey
                              ?.fireBarriersConstruction?.K30?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey
                              ?.fireBarriersConstruction?.K30?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        <KTagAssessment
                          sectionId="fireBarriersConstruction"
                          kTagId="K31"
                          title="Laboratory Protection"
                          description="Laboratories employing quantities of flammable, combustible, or hazardous materials that are considered a severe hazard shall be protected in accordance with NFPA 99."
                          fTag="10.5.1"
                          status={
                            surveyData?.lifeSafetySurvey
                              ?.fireBarriersConstruction?.K31?.status
                          }
                          remarks={
                            surveyData?.lifeSafetySurvey
                              ?.fireBarriersConstruction?.K31?.remarks
                          }
                          scopeSeverity={
                            surveyData?.lifeSafetySurvey
                              ?.fireBarriersConstruction?.K31?.scopeSeverity
                          }
                          onStatusChange={handleKTagChange}
                          onRemarksChange={handleKTagChange}
                          onScopeSeverityChange={handleKTagChange}
                          isDisabled={surveyClosed}
                        />

                        {/* Custom K-Tags */}
                        {renderCustomKTags("fireBarriersConstruction")}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 6 - Emergency Evacuation & Preparedness */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <SectionHeader
                  sectionId="emergencyEvacuationPreparedness"
                  title="Emergency Evacuation & Preparedness"
                  description="Evacuation plans, drills, and emergency preparedness procedures"
                  kTagCount={6}
                  isDisabled={surveyClosed}
                />

                {expandedSections.emergencyEvacuationPreparedness && (
                  <div className="border-t border-slate-100 p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <LifeSafetyQuestion
                        category="emergencyEvacuationPreparedness"
                        field="evacuationPlanExists"
                        question="Do you have an evacuation plan (for immediate area, for compartment, full building)?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Partial", label: "Partial" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey
                            ?.emergencyEvacuationPreparedness
                            ?.evacuationPlanExists
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="emergencyEvacuationPreparedness"
                        field="mobilityImpairedAccounted"
                        question="How are mobility-impaired persons accounted for in evacuation plans?"
                        type="textarea"
                        value={
                          surveyData?.lifeSafetySurvey
                            ?.emergencyEvacuationPreparedness
                            ?.mobilityImpairedAccounted
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="emergencyEvacuationPreparedness"
                        field="drillFrequency"
                        question="How often are drills held?"
                        type="text"
                        value={
                          surveyData?.lifeSafetySurvey
                            ?.emergencyEvacuationPreparedness?.drillFrequency
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="emergencyEvacuationPreparedness"
                        field="drillDocumentation"
                        question="Is there documentation of drill participation and results?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Partial", label: "Partial" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey
                            ?.emergencyEvacuationPreparedness
                            ?.drillDocumentation
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="emergencyEvacuationPreparedness"
                        field="alternateEmergencyPlans"
                        question="Do you have alternate plans for emergencies (natural disasters, fire)?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Partial", label: "Partial" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey
                            ?.emergencyEvacuationPreparedness
                            ?.alternateEmergencyPlans
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="emergencyEvacuationPreparedness"
                        field="staffTrainingOnEvacuation"
                        question="Are staff trained on their roles in an evacuation or fire situation?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Partial", label: "Partial" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey
                            ?.emergencyEvacuationPreparedness
                            ?.staffTrainingOnEvacuation
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />
                    </div>

                    <LifeSafetyQuestion
                      category="emergencyEvacuationPreparedness"
                      field="additionalNotes"
                      question="Additional Notes"
                      type="textarea"
                      value={
                        surveyData?.lifeSafetySurvey
                          ?.emergencyEvacuationPreparedness?.additionalNotes
                      }
                      onChange={handleLifeSafetyQuestionChange}
                    />
                  </div>
                )}
              </div>

              {/* Section 7 - Tests / Inspections / Maintenance */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <SectionHeader
                  sectionId="testsInspectionsMaintenance"
                  title="Tests / Inspections / Maintenance"
                  description="Regular testing, inspection schedules, and maintenance records"
                  kTagCount={10}
                  isDisabled={surveyClosed}
                />

                {expandedSections.testsInspectionsMaintenance && (
                  <div className="border-t border-slate-100 p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <LifeSafetyQuestion
                        category="testsInspectionsMaintenance"
                        field="fireAlarmTestFrequency"
                        question="How often do you test the fire alarm system?"
                        type="text"
                        value={
                          surveyData?.lifeSafetySurvey
                            ?.testsInspectionsMaintenance
                            ?.fireAlarmTestFrequency
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="testsInspectionsMaintenance"
                        field="fireAlarmTestReports"
                        question="Are fire alarm test reports available?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey
                            ?.testsInspectionsMaintenance?.fireAlarmTestReports
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="testsInspectionsMaintenance"
                        field="sprinklerInspectionRecords"
                        question="Are sprinkler system inspection records available?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey
                            ?.testsInspectionsMaintenance
                            ?.sprinklerInspectionRecords
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="testsInspectionsMaintenance"
                        field="sprinklerMaintenanceRecords"
                        question="Are sprinkler system maintenance records available?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey
                            ?.testsInspectionsMaintenance
                            ?.sprinklerMaintenanceRecords
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="testsInspectionsMaintenance"
                        field="fireExtinguisherMonthlyInspection"
                        question="Are fire extinguishers inspected monthly?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey
                            ?.testsInspectionsMaintenance
                            ?.fireExtinguisherMonthlyInspection
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="testsInspectionsMaintenance"
                        field="fireExtinguisherAnnualService"
                        question="Are fire extinguishers serviced annually?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey
                            ?.testsInspectionsMaintenance
                            ?.fireExtinguisherAnnualService
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="testsInspectionsMaintenance"
                        field="generatorTestLogs"
                        question="Are generator test logs available?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey
                            ?.testsInspectionsMaintenance?.generatorTestLogs
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="testsInspectionsMaintenance"
                        field="generatorWeeklyTestRuns"
                        question="Are weekly generator test runs documented?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey
                            ?.testsInspectionsMaintenance
                            ?.generatorWeeklyTestRuns
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="testsInspectionsMaintenance"
                        field="generatorLoadTests"
                        question="Are generator load tests documented?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey
                            ?.testsInspectionsMaintenance?.generatorLoadTests
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="testsInspectionsMaintenance"
                        field="kitchenHoodMaintenance"
                        question="Is kitchen hood & suppression systems maintenance documented?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "N/A", label: "N/A" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey
                            ?.testsInspectionsMaintenance
                            ?.kitchenHoodMaintenance
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />
                    </div>

                    <LifeSafetyQuestion
                      category="testsInspectionsMaintenance"
                      field="additionalNotes"
                      question="Additional Notes"
                      type="textarea"
                      value={
                        surveyData?.lifeSafetySurvey
                          ?.testsInspectionsMaintenance?.additionalNotes
                      }
                      onChange={handleLifeSafetyQuestionChange}
                    />
                  </div>
                )}
              </div>

              {/* Section 8 - Surveyor Entrance / On-site Review */}
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <SectionHeader
                  sectionId="surveyorEntranceOnsiteReview"
                  title="Surveyor Entrance / On-site Review"
                  description="Facility documentation, personnel, and construction impact assessment"
                  kTagCount={5}
                  isDisabled={surveyClosed}
                />

                {expandedSections.surveyorEntranceOnsiteReview && (
                  <div className="border-t border-slate-100 p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <LifeSafetyQuestion
                        category="surveyorEntranceOnsiteReview"
                        field="facilityFloorPlansAvailable"
                        question="Can you provide facility floor plans showing exits, exits discharge, smoke compartments, exit routes?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "Partial", label: "Partial" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey
                            ?.surveyorEntranceOnsiteReview
                            ?.facilityFloorPlansAvailable
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="surveyorEntranceOnsiteReview"
                        field="keyPersonnelIdentified"
                        question="Who are the key personnel responsible for fire safety / plant operations?"
                        type="textarea"
                        value={
                          surveyData?.lifeSafetySurvey
                            ?.surveyorEntranceOnsiteReview
                            ?.keyPersonnelIdentified
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="surveyorEntranceOnsiteReview"
                        field="recentRemodelingConstruction"
                        question="Has there been any remodeling or construction since last survey?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey
                            ?.surveyorEntranceOnsiteReview
                            ?.recentRemodelingConstruction
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="surveyorEntranceOnsiteReview"
                        field="remodelingImpactAssessment"
                        question="Does recent construction impact fire sprinklers, exits, egress, barriers?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                          { value: "N/A", label: "N/A" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey
                            ?.surveyorEntranceOnsiteReview
                            ?.remodelingImpactAssessment
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />

                      <LifeSafetyQuestion
                        category="surveyorEntranceOnsiteReview"
                        field="lscWaiversInPlace"
                        question="Are there any waivers of LSC requirements in place?"
                        type="radio"
                        options={[
                          { value: "Yes", label: "Yes" },
                          { value: "No", label: "No" },
                        ]}
                        value={
                          surveyData?.lifeSafetySurvey
                            ?.surveyorEntranceOnsiteReview?.lscWaiversInPlace
                        }
                        onChange={handleLifeSafetyQuestionChange}
                        isDisabled={surveyClosed}
                      />
                    </div>

                    <LifeSafetyQuestion
                      category="surveyorEntranceOnsiteReview"
                      field="additionalNotes"
                      question="Additional Notes"
                      type="textarea"
                      value={
                        surveyData?.lifeSafetySurvey
                          ?.surveyorEntranceOnsiteReview?.additionalNotes
                      }
                      onChange={handleLifeSafetyQuestionChange}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Part IV - Waiver Recommendations */}
          <div className="mt-12">
            <div className="pb-2 mb-6">
              <h2 className="text-lg font-medium text-slate-900">
                Part IV — Waiver Recommendations
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Specific Life Safety Code provisions recommended for waiver
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                For each item recommended for waiver, provide the survey report
                form item number and explain why: (a) rigid application would
                result in unreasonable hardship, and (b) the waiver will not
                adversely affect patient health and safety.
              </p>

              <div className="space-y-4">
                {surveyData.lifeSafetySurvey?.waivers?.map((waiver, index) => (
                  <div
                    key={waiver.id}
                    className="p-4 border border-slate-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-mono bg-white border border-slate-200 px-2 py-1 rounded text-slate-700">
                            {waiver.provisionNumber}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(waiver.dateAdded).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {waiver.justification}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          const updatedWaivers =
                            surveyData.lifeSafetySurvey.waivers.filter(
                              (w) => w.id !== waiver.id
                            );
                          handleSurveyDataChange("lifeSafetySurvey", {
                            ...surveyData.lifeSafetySurvey,
                            waivers: updatedWaivers,
                          });
                        }}
                        size="sm"
                        variant="outline"
                        disabled={surveyClosed}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleAddWaiver}
                  disabled={surveyClosed}
                  className="w-full h-12 border-2 border-dashed border-slate-300 hover:border-slate-400 bg-white hover:bg-gray-20 rounded-lg transition-colors flex items-center justify-center gap-2 text-slate-600 hover:text-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Add Waiver Recommendation
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Part IV - Crucial Data Extract */}
          <div className="mt-12">
            <div className="pb-2 mb-6">
              <h2 className="text-lg font-medium text-slate-900">
                Part IV — Fire Safety Survey Report
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Crucial data extract for official records
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-3 block">
                    Facility Meets LSC Based On
                  </Label>
                  <div className="space-y-3">
                    {[
                      { id: "A1", label: "Compliance with ALL provisions" },
                      { id: "A2", label: "Acceptable Plan of Correction" },
                      { id: "A3", label: "Approved waivers" },
                      { id: "A4", label: "Fire Safety Evaluation System" },
                      { id: "A5", label: "Performance-based design" },
                    ].map((option) => (
                      <label
                        key={option.id}
                        className="flex items-start gap-3 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={
                            surveyData.lifeSafetySurvey?.crucialData?.meetsLSC?.includes(
                              option.id
                            ) || false
                          }
                          disabled={surveyClosed}
                          onChange={(e) => {
                            const currentMeetsLSC =
                              surveyData.lifeSafetySurvey?.crucialData
                                ?.meetsLSC || [];
                            const updatedMeetsLSC = e.target.checked
                              ? [...currentMeetsLSC, option.id]
                              : currentMeetsLSC.filter(
                                  (id) => id !== option.id
                                );

                            handleSurveyDataChange("lifeSafetySurvey", {
                              ...surveyData.lifeSafetySurvey,
                              crucialData: {
                                ...surveyData.lifeSafetySurvey?.crucialData,
                                meetsLSC: updatedMeetsLSC,
                              },
                            });
                          }}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 mt-0.5"
                        />
                        <span className="text-sm text-slate-700">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-3 block">
                    If Facility Does Not Meet LSC
                  </Label>
                  <div className="space-y-3">
                    {[
                      { id: "A", label: "Fully sprinklered building" },
                      { id: "B", label: "Partially sprinklered building" },
                      { id: "C", label: "Non-sprinklered building" },
                    ].map((option) => (
                      <label
                        key={option.id}
                        className="flex items-start gap-3 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="doesNotMeetLSC"
                          value={option.id}
                          checked={
                            surveyData.lifeSafetySurvey?.crucialData
                              ?.doesNotMeetLSC === option.id
                          }
                          disabled={surveyClosed}
                          onChange={(e) =>
                            handleSurveyDataChange("lifeSafetySurvey", {
                              ...surveyData.lifeSafetySurvey,
                              crucialData: {
                                ...surveyData.lifeSafetySurvey?.crucialData,
                                doesNotMeetLSC: e.target.value,
                              },
                            })
                          }
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 mt-0.5"
                        />
                        <span className="text-sm text-slate-700">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Custom K-Tag Modal */}
      {showCustomKTagModal && (
        <div className="fixed inset-0 bg-slate-900/50  backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
              <h3 className="text-base sm:text-lg font-medium text-slate-900 break-words">
                Add Custom K-Tag
              </h3>
              <Button
                onClick={() => setShowCustomKTagModal(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <Label className="text-xs sm:text-sm font-medium text-slate-700 mb-2 block">
                  K-Tag ID
                </Label>
                <Input
                  value={currentCustomKTag?.kTagId || ""}
                  onChange={(e) =>
                    setCurrentCustomKTag({
                      ...currentCustomKTag,
                      kTagId: e.target.value,
                    })
                  }
                  placeholder="e.g., K999"
                  className="h-9 sm:h-10 text-xs sm:text-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                />
              </div>

              <div>
                <Label className="text-xs sm:text-sm font-medium text-slate-700 mb-2 block">
                  Title
                </Label>
                <Input
                  value={currentCustomKTag?.title || ""}
                  onChange={(e) =>
                    setCurrentCustomKTag({
                      ...currentCustomKTag,
                      title: e.target.value,
                    })
                  }
                  placeholder="Enter the K-tag title"
                  className="h-9 sm:h-10 text-xs sm:text-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                />
              </div>

              <div>
                <Label className="text-xs sm:text-sm font-medium text-slate-700 mb-2 block">
                  Description
                </Label>
                <Textarea
                  value={currentCustomKTag?.description || ""}
                  onChange={(e) =>
                    setCurrentCustomKTag({
                      ...currentCustomKTag,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter the requirement description..."
                  rows={3}
                  className="w-full text-xs sm:text-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                />
              </div>

              <div>
                <Label className="text-xs sm:text-sm font-medium text-slate-700 mb-2 block">
                  F-Tag Reference (Optional)
                </Label>
                <Input
                  value={currentCustomKTag?.fTag || ""}
                  onChange={(e) =>
                    setCurrentCustomKTag({
                      ...currentCustomKTag,
                      fTag: e.target.value,
                    })
                  }
                  placeholder="e.g., 18.1.1.4.3"
                  className="h-9 sm:h-10 text-xs sm:text-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-slate-200">
              <Button
                onClick={() => setShowCustomKTagModal(false)}
                variant="outline"
                className="h-9 px-4 text-xs sm:text-sm w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCustomKTag}
                className="h-9 px-4 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              >
                Add K-Tag
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Facility Info Modal */}
      {showFacilityInfo && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
              <h3 className="text-base sm:text-lg font-medium text-slate-900 break-words">
                Connected Facility
              </h3>
              <Button
                onClick={() => setShowFacilityInfo(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-emerald-500 rounded-full flex-shrink-0"></div>
                <span className="text-xs sm:text-sm font-medium text-emerald-700 break-words">
                  Facility data loaded successfully
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                    Facility Name
                  </Label>
                  <p className="text-xs sm:text-sm text-slate-900 mt-1 break-words">
                    {surveyData?.lifeSafetySurvey?.facilityInfo?.facilityName ||
                      "Not specified"}
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                    Provider Number
                  </Label>
                  <p className="text-xs sm:text-sm text-slate-900 mt-1 break-words">
                    {surveyData?.lifeSafetySurvey?.facilityInfo
                      ?.providerNumber || "Not specified"}
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                    Survey Date
                  </Label>
                  <p className="text-xs sm:text-sm text-slate-900 mt-1 break-words">
                    {surveyData?.lifeSafetySurvey?.facilityInfo?.surveyDate
                      ? new Date(
                          surveyData.lifeSafetySurvey.facilityInfo.surveyDate
                        ).toLocaleDateString()
                      : "Not specified"}
                  </p>
                </div>

                {surveyData?.lifeSafetySurvey?.facilityInfo?.medicaidId && (
                  <div>
                    <Label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                      Medicaid ID
                    </Label>
                    <p className="text-xs sm:text-sm text-slate-900 mt-1 break-words">
                      {surveyData.lifeSafetySurvey.facilityInfo.medicaidId}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end p-4 sm:p-6 border-t border-slate-200">
              <Button
                onClick={() => setShowFacilityInfo(false)}
                className="h-9 px-4 text-xs sm:text-sm bg-gray-200 hover:bg-gray-300 text-white w-full sm:w-auto"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Waiver Modal */}
      {showWaiverModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
              <h3 className="text-base sm:text-lg font-medium text-slate-900 break-words">
                Add Waiver Recommendation
              </h3>
              <Button
                onClick={() => setShowWaiverModal(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <Label className="text-xs sm:text-sm font-medium text-slate-700 mb-2 block">
                  Provision Number
                </Label>
                <Input
                  value={currentWaiver?.provisionNumber || ""}
                  onChange={(e) =>
                    setCurrentWaiver({
                      ...currentWaiver,
                      provisionNumber: e.target.value,
                    })
                  }
                  placeholder="e.g., K400"
                  className="h-9 sm:h-10 text-xs sm:text-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                />
              </div>

              <div>
                <Label className="text-xs sm:text-sm font-medium text-slate-700 mb-2 block">
                  Justification
                </Label>
                <Textarea
                  value={currentWaiver?.justification || ""}
                  onChange={(e) =>
                    setCurrentWaiver({
                      ...currentWaiver,
                      justification: e.target.value,
                    })
                  }
                  placeholder="Explain why the provision should be waived and how it won't affect health and safety..."
                  rows={4}
                  className="w-full text-xs sm:text-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-slate-200">
              <Button
                onClick={() => setShowWaiverModal(false)}
                variant="outline"
                className="h-9 px-4 text-xs sm:text-sm w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveWaiver}
                className="h-9 px-4 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              >
                Add Waiver
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Survey Closure Modal */}
      {showClosureModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 break-words">
                Close Survey
              </h3>
              <Button
                onClick={() => setShowClosureModal(false)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-semibold text-amber-900 mb-1">
                      Important Notice
                    </h4>
                    <p className="text-xs sm:text-sm text-amber-800 break-words">
                      Once you close this survey, it will be marked as complete
                      and you will not be able to make further changes. Please
                      ensure all survey activities have been completed and
                      documented before closing.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-slate-700 mb-2 block">
                    Closure Notes (Optional)
                  </Label>
                  <Textarea
                    value={closureData.closureNotes}
                    onChange={(e) =>
                      setClosureData((prev) => ({
                        ...prev,
                        closureNotes: e.target.value,
                      }))
                    }
                    placeholder="Enter any additional notes about the survey closure..."
                    rows={3}
                    className="w-full text-xs sm:text-sm bg-white border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                  />
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 mb-3 sm:mb-4">
                    Closure Signature
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-slate-700 mb-2 block">
                        Signed By <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={closureData.closureSignature.signedBy}
                        onChange={(e) =>
                          setClosureData((prev) => ({
                            ...prev,
                            closureSignature: {
                              ...prev.closureSignature,
                              signedBy: e.target.value,
                            },
                          }))
                        }
                        placeholder="Enter name of person closing survey..."
                        className="w-full text-xs sm:text-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      />
                    </div>

                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-slate-700 mb-2 block">
                        Title/Position <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={closureData.closureSignature.title}
                        onChange={(e) =>
                          setClosureData((prev) => ({
                            ...prev,
                            closureSignature: {
                              ...prev.closureSignature,
                              title: e.target.value,
                            },
                          }))
                        }
                        placeholder="Enter title or position..."
                        className="w-full text-xs sm:text-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      />
                    </div>

                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-slate-700 mb-2 block">
                        Signature Date <span className="text-red-500">*</span>
                      </Label>
                      <DatePicker
                        date={
                          closureData.closureSignature.signedDate || new Date()
                        }
                        onSelect={(date) =>
                          setClosureData((prev) => ({
                            ...prev,
                            closureSignature: {
                              ...prev.closureSignature,
                              signedDate: date,
                            },
                          }))
                        }
                        disabled={true}
                        placeholder="Current date"
                        className="w-full"
                      />
                      <p className="text-xs text-slate-500 mt-1 break-words">
                        Automatically set to today's date
                      </p>
                    </div>

                    <div className="flex items-start space-x-2 sm:space-x-3 pt-2">
                      <Checkbox
                        id="confirmClosure"
                        checked={closureData.closureSignature.confirmed}
                        onCheckedChange={(checked) =>
                          setClosureData((prev) => ({
                            ...prev,
                            closureSignature: {
                              ...prev.closureSignature,
                              confirmed: checked,
                            },
                          }))
                        }
                        className="mt-1 flex-shrink-0"
                      />
                      <Label
                        htmlFor="confirmClosure"
                        className="text-xs sm:text-sm text-slate-700 cursor-pointer leading-relaxed flex-1 break-words"
                      >
                        I confirm that all survey activities have been completed
                        and documented. This survey is ready to be closed.
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-slate-200">
              <Button
                onClick={() => setShowClosureModal(false)}
                variant="outline"
                className="h-9 px-4 text-xs sm:text-sm w-full sm:w-auto"
                disabled={isClosingSurvey}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCloseSurvey}
                disabled={isClosingSurvey}
                className="h-9 px-4 text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
              >
                {isClosingSurvey ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 flex-shrink-0"></div>
                    <span className="hidden sm:inline">Closing Survey...</span>
                    <span className="sm:hidden">Closing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline">Close Survey</span>
                    <span className="sm:hidden">Close</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div> 
  );
};

export default LifeSafetySurvey;
