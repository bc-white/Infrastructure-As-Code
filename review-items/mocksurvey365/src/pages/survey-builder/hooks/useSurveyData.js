import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import api from "../../../service/api";
import {
  getSurveyData,
  setSurveyData as saveSurveyData,
  getSurveyStepData,
  saveSurveyStepData,
} from "../../../utils/surveyStorageIndexedDB";

/**
 * Custom hook for managing survey data
 * Separates data fetching and state management from UI components
 */
export const useSurveyData = (surveyId) => {
  const [surveyData, setSurveyData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load survey data
  const loadSurveyData = useCallback(async () => {
    if (!surveyId) {
      // Initialize with default data if no survey ID
      setSurveyData(getDefaultSurveyData());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to load from IndexedDB first
      const savedData = await getSurveyData("mocksurvey_data");
      
      if (savedData) {
        setSurveyData(JSON.parse(savedData));
      } else {
        // Fetch from API
        const response = await api.survey.getSurveyWizard(surveyId);
        if (response?.data) {
          setSurveyData(response.data);
        }
      }
    } catch (err) {
      setError(err.message);
      toast.error("Failed to load survey data", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [surveyId]);

  // Update survey data
  const updateSurveyData = useCallback(
    async (field, value) => {
      const updatedData = {
        ...surveyData,
        [field]: value,
      };
      setSurveyData(updatedData);

      // Save to IndexedDB
      try {
        await saveSurveyData("mocksurvey_data", JSON.stringify(updatedData));
      } catch (err) {
        // Log but don't block UI
      }
    },
    [surveyData]
  );

  // Save current step data
  const saveStepData = useCallback(
    async (stepIndex, stepData) => {
      if (!surveyId) return;

      try {
        await saveSurveyStepData(surveyId, stepIndex, stepData);
      } catch (err) {
       
        toast.error("Failed to save step data");
      }
    },
    [surveyId]
  );

  // Load step data
  const loadStepData = useCallback(
    async (stepIndex) => {
      if (!surveyId) return null;

      try {
        return await getSurveyStepData(surveyId, stepIndex);
      } catch (err) {
       
        return null;
      }
    },
    [surveyId]
  );

  // Initialize on mount
  useEffect(() => {
    loadSurveyData();
  }, [loadSurveyData]);

  return {
    surveyData,
    isLoading,
    error,
    updateSurveyData,
    saveStepData,
    loadStepData,
    reloadSurveyData: loadSurveyData,
  };
};

/**
 * Default survey data structure
 */
const getDefaultSurveyData = () => ({
  surveyCreationDate: new Date().toISOString().split("T")[0],
  facilityName: "",
  ccn: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  phone: "",
  email: "",
  surveyCategory: "",
  teamMembers: [],
  teamCoordinator: "",
  preSurveyRequirements: {
    ehr_access: { requested: false, received: false },
    cms_2567: { requested: false, received: false },
    self_reports: { requested: false, received: false },
    casper_report: { requested: false, received: false },
    quality_measures: { requested: false, received: false },
    risk_indicators: { requested: false, received: false },
    specialist_focus: { requested: false, received: false },
  },
  // Add other default fields as needed
});

