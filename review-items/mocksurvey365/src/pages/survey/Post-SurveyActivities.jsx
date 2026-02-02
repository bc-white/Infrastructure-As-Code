import React, { useState, useEffect, useCallback, useRef } from "react";
import { useBeforeUnload } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { ChevronLeft, Download, ChevronRight, Eye, Loader2, FileText, Lock } from "lucide-react";
import { toast } from "sonner";

import api from "../../service/api";
import surveyIndexedDB from "../../utils/surveyIndexedDB";
import surveySyncService from "../../utils/surveySyncService";
import useSurveyStore from "../../stores/useSurveyStore";
import usePlanOfCorrectionStore from "../../stores/usePlanOfCorrectionStore";
import useEducationPresentationStore from "../../stores/useEducationPresentationStore";
import UnsavedChangesModal from "../../components/UnsavedChangesModal";
import FloatingHomeButton from "../../components/FloatingHomeButton";
import { useBrowserNavigationBlocker } from "../../hooks/useBrowserNavigationBlocker";
import useSurveyAccess from "../../hooks/useSurveyAccess";

const PostSurveyActivities = ({ 
  sectionData,
  surveyData,
  setCurrentStep, 
  canContinueFromStep,
  handleSurveyDataChange,
  isInvitedUser: isInvitedUserProp = () => false,
  }) => {
  // Get surveyId for POC store and access check
  const surveyId = surveyData?.surveyId || surveyData?.id || surveyData?._id || localStorage.getItem("currentSurveyId");
  
  // Use the survey access hook to determine user access type
  const { isInvitedUser: isInvitedUserFromHook, isLoading: isAccessLoading } = useSurveyAccess(surveyId);
  
  // Use hook-based isInvitedUser, fall back to prop if hook is still loading
  const isInvitedUser = isAccessLoading ? isInvitedUserProp : isInvitedUserFromHook;

  // Check if survey is closed
  const isSurveyClosed = surveyData?.surveyClosed || 
                         surveyData?.surveyClosureSurvey?.surveyClosed || 
                         surveyData?.surveyClosureSurvey?.surveyCompleted ||
                         surveyData?.surveyCompleted || false;



  // POC Store
  const { getPocData, savePocGenerationResult, updateEditablePocData, hasPocData } = usePlanOfCorrectionStore();

  // Education Presentation Store
  const { getEducationPresentations, savePresentation, getPresentation: getStoredPresentation } = useEducationPresentationStore();

  // State for presentation parameters
  const [presentationParams, setPresentationParams] = useState(null);
  const [loadingParams, setLoadingParams] = useState(false);

  // State for user-selected presentation options
  const [presentationOptions, setPresentationOptions] = useState({
    textMode: "generate",
    format: "presentation",
    themeName: "Oasis",
    numCards: "20",
    cardSplit: "auto",
    exportAs: "pptx",
    language: "en",
    imageSource: "aiGenerated",
    imageModel: "imagen-4-pro",
    cardDimensions: "fluid",
  });
  
  // State for generation loading modal
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({
    stage: "initializing",
    message: "Initializing...",
    elapsedTime: 0,
    attempts: 0
  });

  // State for Plan of Correction
  const [pocFile, setPocFile] = useState(null);
  const [pocGenerating, setPocGenerating] = useState(false);
  const [pocGenerated, setPocGenerated] = useState(null);
  const [editablePocData, setEditablePocData] = useState(null);
  const [isContinueClicked, setIsContinueClicked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingPocData, setLoadingPocData] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const hasUnsavedChangesRef = useRef(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Sync hasUnsavedChangesRef with state
  useEffect(() => {
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

  // Helper function to get friendly display name for image sources
  const getImageSourceDisplayName = (source) => {
    const displayNames = {
      aiGenerated: "Generated Images",
      pictographic: "Pictographic",
      unsplash: "Unsplash",
      giphy: "Giphy",
      webAllImages: "Web Images (All)",
      webFreeToUse: "Web Images (Free)",
      webFreeToUseCommercially: "Web Images (Commercial)",
      placeholder: "Placeholder",
      noImages: "No Images",
    };
    return displayNames[source] || source;
  };

  // Fetch saved Plan of Corrections from API on mount
  // Always fetch from API first to get the latest data, fall back to store only if offline
  useEffect(() => {
    const fetchSavedPocData = async () => {
      if (!surveyId) return;
      
      // Skip if we already have editable POC data loaded in this session
      if (editablePocData) return;
      
      setLoadingPocData(true);
      try {
        // Check if online - if offline, try to load from store
        if (!navigator.onLine) {
          const storedData = getPocData(surveyId);
          if (storedData?.editablePocData) {
            setEditablePocData(storedData.editablePocData);
            if (storedData.pocGenerated) {
              setPocGenerated(storedData.pocGenerated);
            }
          }
          setLoadingPocData(false);
          return;
        }

        // Fetch fresh data from API
        const response = await api.survey.viewPlanOfCorrections(surveyId);

        if (response.success && response.data) {
          // Handle the API response structure:
          // { success, data: { accessType, surveyData, corrections: [{ summary, plansOfCorrection, education }] } }
          const apiData = response.data;
          
          // Get the most recent correction (first in array)
          const latestCorrection = apiData.corrections?.[0];
          
          if (latestCorrection) {
            const normalizedData = {
              summary: latestCorrection.summary || { executiveSummary: '', estimatedCompletionDate: '' },
              plansOfCorrection: latestCorrection.plansOfCorrection || [],
              disclaimer: latestCorrection.disclaimer || ''
            };
            
            setEditablePocData(normalizedData);
            setPocGenerated({ data: { data: normalizedData } });
            
            // Save to store for offline persistence
            savePocGenerationResult(surveyId, {
              editablePocData: normalizedData,
              pocGenerated: { data: { data: normalizedData } },
              fileName: null,
              pdfUrl: null,
              apiMessage: response.message,
              apiSuccess: true,
            });
            
            // Load education presentations from API response
            if (latestCorrection.education) {
              const apiEducation = latestCorrection.education;
              const currentEducation = surveyData?.planOfCorrectionSurvey?.education || {};
              
              // Merge API education data into surveyData
              const educationUpdates = {};
              let hasEducationUpdates = false;
              
              ['staffTraining', 'leadershipBriefing', 'customPresentation'].forEach(type => {
                if (apiEducation[type] && apiEducation[type].generationId) {
                  educationUpdates[type] = {
                    ...currentEducation[type],
                    ...apiEducation[type],
                  };
                  hasEducationUpdates = true;
                }
              });
              
              if (hasEducationUpdates) {
                updatePlanOfCorrectionSurvey({
                  education: {
                    ...currentEducation,
                    ...educationUpdates,
                  },
                });
                
                // Also save to education store for offline persistence
                Object.entries(educationUpdates).forEach(([type, data]) => {
                  if (data?.generationId) {
                    savePresentation(surveyId, type, data);
                  }
                });
              }
            }
          }
        }
      } catch (error) {
        // API failed - try to load from store as fallback
       
        const storedData = getPocData(surveyId);
        if (storedData?.editablePocData) {
          setEditablePocData(storedData.editablePocData);
          if (storedData.pocGenerated) {
            setPocGenerated(storedData.pocGenerated);
          }
        }
      } finally {
        setLoadingPocData(false);
      }
    };
    fetchSavedPocData();
  }, [surveyId, getPocData, savePocGenerationResult]);

  // Load education presentations from store on mount
  useEffect(() => {
    if (!surveyId) return;
    
    const storedEducation = getEducationPresentations(surveyId);
    if (storedEducation) {
      // Check if surveyData doesn't already have this data
      const currentEducation = surveyData?.planOfCorrectionSurvey?.education;
      
      // Merge stored presentations into surveyData if they have generationId
      const educationUpdates = {};
      let hasUpdates = false;
      
      ['staffTraining', 'leadershipBriefing', 'customPresentation'].forEach(type => {
        const stored = storedEducation[type];
        const current = currentEducation?.[type];
        
        // If stored has generationId but current doesn't, use stored
        if (stored?.generationId && !current?.generationId) {
          educationUpdates[type] = { ...current, ...stored };
          hasUpdates = true;
        }
      });
      
      if (hasUpdates) {
        updatePlanOfCorrectionSurvey({
          education: {
            ...currentEducation,
            ...educationUpdates,
          },
        });
      }
    }
  }, [surveyId, getEducationPresentations]);

  // Fetch presentation parameters on component mount
  useEffect(() => {
    const fetchParameters = async () => {
      setLoadingParams(true);
      try {
        const params = await getPresentationParameters();
        if (params) {
          setPresentationParams(params.data);
        }
      } catch (error) {
        // Failed to fetch presentation parameters
      } finally {
        setLoadingParams(false);
      }
    };

    fetchParameters();
  }, []);

  // Initialize editable POC data from store or surveyData
  useEffect(() => {
    // Skip if already loading from API or already have data
    if (loadingPocData || editablePocData) return;
    
    // First, try to load from the POC store (persisted data)
    if (surveyId && hasPocData(surveyId)) {
      const storedPocData = getPocData(surveyId);
      if (storedPocData?.editablePocData && !editablePocData) {
        setEditablePocData(JSON.parse(JSON.stringify(storedPocData.editablePocData)));
        if (storedPocData.pocGenerated) {
          setPocGenerated(storedPocData.pocGenerated);
        }
        return;
      }
    }

    // Fallback: Initialize from surveyData if available
    const pocData = surveyData?.planOfCorrectionSurvey?.planOfCorrection?.generatedData?.data?.data || surveyData.planOfCorrection?.generatedData?.data?.data;
    const pocDisclaimer = surveyData?.planOfCorrectionSurvey?.planOfCorrection?.generatedData?.disclaimer || surveyData.planOfCorrection?.generatedData?.disclaimer || '';
    if (pocData && !editablePocData) {
      // Handle both array and object structures
      let normalizedData;
      if (Array.isArray(pocData)) {
        // If pocData is an array, wrap it in the expected structure
        normalizedData = {
          summary: { executiveSummary: '' },
          plansOfCorrection: pocData,
          disclaimer: pocDisclaimer
        };
      } else {
        // If pocData is already an object with plansOfCorrection
        normalizedData = {
          summary: pocData.summary || { executiveSummary: '' },
          plansOfCorrection: pocData.plansOfCorrection || [],
          disclaimer: pocData.disclaimer || pocDisclaimer
        };
      }
      setEditablePocData(JSON.parse(JSON.stringify(normalizedData)));
      
      // Also save to store for persistence
      if (surveyId) {
        savePocGenerationResult(surveyId, {
          editablePocData: normalizedData,
          pocGenerated: surveyData?.planOfCorrectionSurvey?.planOfCorrection?.generatedData || null,
          fileName: surveyData?.planOfCorrectionSurvey?.planOfCorrection?.file || null,
          pdfUrl: surveyData?.planOfCorrectionSurvey?.planOfCorrection?.pdfUrl || null,
          apiMessage: surveyData?.planOfCorrectionSurvey?.planOfCorrection?.apiMessage || null,
          apiSuccess: surveyData?.planOfCorrectionSurvey?.planOfCorrection?.apiSuccess || false,
        });
      }
    }
  }, [surveyData.planOfCorrection, surveyData.planOfCorrectionSurvey, editablePocData, surveyId, hasPocData, getPocData, savePocGenerationResult, loadingPocData]); 

  // Sync editablePocData changes to the store (debounced)
  useEffect(() => {
    if (!surveyId || !editablePocData) return;
    
    // Debounce the store update to avoid too many writes
    const timeoutId = setTimeout(() => {
      updateEditablePocData(surveyId, editablePocData);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [editablePocData, surveyId, updateEditablePocData]);

  // Track unsaved changes when editablePocData is modified by user
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  useEffect(() => {
    if (editablePocData && !initialDataLoaded) {
      // Mark initial data as loaded after first render
      setInitialDataLoaded(true);
      return;
    }
    if (editablePocData && initialDataLoaded) {
      setHasUnsavedChanges(true);
    }
  }, [editablePocData, initialDataLoaded]);

  // Clear unsaved changes flag after successful save
  const handleCompleteSurveyWithClear = async (isContinue = false) => {
    await handleCompleteSurvey(isContinue);
    setHasUnsavedChanges(false);
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("mocksurvey_token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  // Helper function to update planOfCorrectionSurvey nested structure
  const updatePlanOfCorrectionSurvey = (updates) => {
    handleSurveyDataChange("planOfCorrectionSurvey", {
      ...(surveyData.planOfCorrectionSurvey || {}),
      ...updates,
    });
  };

  // Helper function to poll presentation status until ready
  const pollPresentationStatus = async (
    generationId,
    maxAttempts = 60,
    intervalMs = 3000
  ) => {
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      const elapsedTime = attempts * (intervalMs / 1000);

      try {
        // Update modal progress
        setGenerationProgress({
          stage: "polling",
          message: `Checking presentation status... (${attempts}/${maxAttempts})`,
          elapsedTime: elapsedTime,
          attempts: attempts
        });
        
        const presentation = await getPresentation(generationId);

        // Check if we have a valid response
        if (!presentation || !presentation.status) {
          setGenerationProgress({
            stage: "retrying",
            message: "Connection issue, retrying...",
            elapsedTime: elapsedTime,
            attempts: attempts
          });
          await new Promise((resolve) => setTimeout(resolve, intervalMs));
          continue;
        }

        // Check if presentation is ready (has URLs = completed)
        if (presentation.data && (presentation.data.gammaUrl || presentation.data.exportUrl)) {
          setGenerationProgress({
            stage: "completed",
            message: "Presentation ready!",
            elapsedTime: elapsedTime,
            attempts: attempts
          });
          return presentation;
        }

        // Check explicit completed status
        if (presentation.data && (presentation.data.status === "completed" || presentation.data.status === "success")) {
          setGenerationProgress({
            stage: "completed",
            message: "Presentation completed!",
            elapsedTime: elapsedTime,
            attempts: attempts
          });
          return presentation;
        }

        // If still pending or processing, continue polling
        if (presentation.data && (presentation.data.status === "pending" || presentation.data.status === "processing" || presentation.data.status === "generating")) {
          setGenerationProgress({
            stage: presentation.data.status,
            message: `Presentation ${presentation.data.status}... Please wait.`,
            elapsedTime: elapsedTime,
            attempts: attempts
          });
          await new Promise((resolve) => setTimeout(resolve, intervalMs));
          continue;
        }

        // If failed status
        if (presentation.data && (presentation.data.status === "failed" || presentation.data.status === "error")) {
          throw new Error(`Presentation generation failed with status: ${presentation.data.status}`);
        }

        // Unknown status - keep polling
        setGenerationProgress({
          stage: "unknown",
          message: `Processing... (Status: ${presentation.data?.status || 'checking'})`,
          elapsedTime: elapsedTime,
          attempts: attempts
        });
        await new Promise((resolve) => setTimeout(resolve, intervalMs));

      } catch (error) {
        // If it's the last attempt, throw the error
        if (attempts >= maxAttempts) {
          throw error;
        }

        // For network errors or API errors, keep retrying
        setGenerationProgress({
          stage: "error",
          message: "Error occurred, retrying...",
          elapsedTime: elapsedTime,
          attempts: attempts
        });
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }

    throw new Error(
      `Presentation generation timed out after ${maxAttempts} attempts (${(maxAttempts * intervalMs) / 1000} seconds)`
    );
  };

  // Helper function to create presentation via API and fetch it
  const createPresentation = async (presentationData) => {
    // Show modal instead of toast
    setShowGenerationModal(true);
    setGenerationProgress({
      stage: "initializing",
      message: "Initializing presentation generation...",
      elapsedTime: 0,
      attempts: 0
    });
    
    try {
      // Step 1: Create the presentation and get generationId
      setGenerationProgress({
        stage: "creating",
        message: "Sending request to generate presentation...",
        elapsedTime: 0,
        attempts: 0
      });
      
      const response = await fetch(
        "https://www.api.mocksurvey365.com/api/v1/health-assistant/gamma",
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(presentationData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create presentation");
      }

      const result = await response.json();

      // Step 2: Extract generationId from response
      if (result.status && result.data?.generationId) {
        const generationId = result.data.generationId;
        const initialStatus = result.data.status;

        setGenerationProgress({
          stage: "processing",
          message: `Presentation queued! ID: ${generationId}`,
          elapsedTime: 0,
          attempts: 0
        });

        // Step 3: Poll until presentation is ready
        const presentation = await pollPresentationStatus(generationId);
        
        // Close modal after successful completion
        setShowGenerationModal(false);

        return {
          success: true,
          generationId: generationId,
          message: result.message,
          presentationData: presentation,
        };
      } else {
        throw new Error("Invalid response format - no generationId received");
      }
    } catch (error) {
      setShowGenerationModal(false);
      throw error;
    }
  };

  // Helper function to get presentation parameters
  const getPresentationParameters = async () => {
    try {
      const response = await fetch(
        "https://www.api.mocksurvey365.com/api/v1/health-assistant/getGammaParameters",
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        // Silently fail - this endpoint may not be available for all users
        return null;
      }

      const parameters = await response.json();
      return parameters;
    } catch (error) {
      // Silently fail - presentation parameters are optional
      return null;
    }
  };

  // Helper function to get specific presentation
  const getPresentation = async (presentationId) => {
    try {
      const response = await fetch(
        `https://www.api.mocksurvey365.com/api/v1/health-assistant/getGamma/${presentationId}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to get presentation");
      }

      const presentation = await response.json();
      return presentation;
    } catch (error) {
      throw error;
    }
  };




  // Download POC as Word document
  const handleDownloadPoc = () => {
    if (!editablePocData) {
      toast.error("No Plan of Correction data to download");
      return;
    }

    const summary = editablePocData.summary || {};
    const pocs = editablePocData.plansOfCorrection || [];
    const disclaimer = editablePocData.disclaimer || '';
    const facilityName = surveyData.facilityName || surveyData.facility?.name || 'Facility';

    // Helper function to format F-Tag properly (avoid "FF")
    const formatFTag = (ftag) => {
      const tagStr = String(ftag || '').replace(/^F+/i, '');
      return `F${tagStr}`;
    };

    // Generate table of contents
    const tableOfContents = pocs.map((poc, index) => 
      `<p style="margin: 0.08in 0;">${index + 1}. ${formatFTag(poc.ftag)} – ${poc.regulation || 'Plan of Correction'}</p>`
    ).join('');

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Plan of Correction - ${facilityName}</title>
      <style>
        @page { size: letter; margin: 1in 1in 1in 1in; }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #000;
        }
        
        /* Header */
        .doc-header {
          margin-bottom: 0.2in;
        }
        .header-row {
          display: flex;
          align-items: center;
          margin-bottom: 0.08in;
        }
        .logo-img {
          width: 8px;
          height: 8px;
          margin-right: 6px;
          vertical-align: middle;
        }
        .company-name {
          font-size: 10pt;
          color: #075b7d;
          font-weight: bold;
          display: inline;
          vertical-align: middle;
        }
        .report-title { 
          font-size: 24pt;
          font-weight: bold;
          color: #000;
          margin: 0.1in 0 0.05in 0;
        }
        .facility-name {
          font-size: 16pt;
          color: #147eb7ff;
          margin: 0;
        }
        .divider {
          border-top: 1px solid #000;
          margin: 0.1in 0 0.2in 0;
        }
        
        /* Table of Contents */
        .toc-title {
          font-size: 11pt;
          font-weight: bold;
          margin: 0.2in 0 0.15in 0;
        }
        
        /* F-Tag Headers */
        .ftag-header {
          color: #075b7d;
          font-size: 12pt;
          font-weight: bold;
          margin: 0.4in 0 0.15in 0;
          page-break-inside: avoid;
        }
        
        /* Section Labels */
        .section-label {
          font-size: 11pt;
          font-weight: bold;
          margin: 0.15in 0 0.05in 0;
        }
        
        /* Content */
        p {
          margin: 0.05in 0;
          text-align: left;
        }
        
        /* Lists */
        ul {
          margin: 0.08in 0 0.08in 0.25in;
          padding-left: 0.2in;
        }
        li {
          margin: 0.05in 0;
        }
        
        /* Disclaimer */
        .disclaimer {
           padding: 0.15in;
            font-style: italic;
            font-size: 9pt;
            color: #666;
        }
      </style>
    </head>
    <body> 
      <!-- Header -->
      <div class="doc-header">
        <div class="header-row">
          <img src="https://www.mocksurvey365.com/logo.png" alt="Logo" class="logo-img">
        
        </div>
        <p class="report-title">Plan of Correction</p>
        <p class="facility-name">${facilityName}</p>
        <div class="divider"></div>
      </div>

      <!-- Table of Contents -->
      <p class="toc-title">Table of Contents</p>
      ${tableOfContents}
      
      <div class="divider" style="margin-top: 0.3in;"></div>

      <!-- Executive Summary -->
      ${summary.executiveSummary ? `
        <div class="ftag-header">Executive Summary</div>
        <p>${summary.executiveSummary}</p>
      ` : ''}

    

      <!-- Detailed POCs -->
      ${pocs.map((poc, index) => `
        <div class="ftag-header">${formatFTag(poc.ftag)} – ${poc.regulation || ''}</div>
        
        <p class="section-label">Responsible Person:</p>
        <p>${poc.responsiblePerson || 'Not assigned'}</p>
        
        <p class="section-label">Compliance Date:</p>
        <p>${poc.complianceDate || 'TBD'}</p>

        ${poc.regulatoryReference ? `
          <p class="section-label">Regulatory Reference:</p>
          <p>${poc.regulatoryReference}</p>
        ` : ''}
        
        <p class="section-label">Identification of Deficiency:</p>
        <p>${poc.identification || 'No identification provided.'}</p>

        <p class="section-label">Corrective Action - Affected Residents:</p>
        <p>${poc.correctiveActionAffected || 'No corrective action specified.'}</p>

        <p class="section-label">Corrective Action - Potential Residents:</p>
        <p>${poc.correctiveActionPotential || 'No corrective action specified.'}</p>

        <p class="section-label">Systems Change:</p>
        <p>${poc.systemsChange || 'No systems change specified.'}</p>

        <p class="section-label">Monitoring Plan:</p>
        <p>${poc.monitoringPlan || 'No monitoring plan specified.'}</p>
      `).join('')}

      <!-- Disclaimer -->
      ${disclaimer ? `
      <div >
        <p class="section-label">Disclaimer</p>
        <p class="disclaimer">${disclaimer}</p>
      </div>
      ` : ''}
    </body>
    </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Plan_of_Correction_${facilityName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Plan of Correction downloaded successfully!");
  };

  //Get facility information - fetches from API if needed
  const getFacilityInfo = async () => {
    let facilityName = surveyData.facilityName || 'Unknown Facility';
    let facilityCcn = surveyData.ccn || '';
    
    if (surveyData.facilityId && !surveyData.facilityName) {
      try {
        const facilityResponse = await api.facility.getFacility(surveyData.facilityId);
        if (facilityResponse?.status && facilityResponse?.data) {
          facilityName = facilityResponse.data.name || facilityName;
          facilityCcn = facilityResponse.data.providerNumber || facilityCcn;
        }
      } catch {
        // Use fallback values if fetch fails
      }
    }
    return { facilityName, facilityCcn };
  };

  /**
   * Get POC data from various sources
   */
  const getPocDataForPresentation = () => {
    return editablePocData || 
           surveyData?.planOfCorrectionSurvey?.planOfCorrection?.generatedData?.data?.data || 
           surveyData?.planOfCorrection?.generatedData?.data?.data || 
           null;
  };

  /**
   * Build base survey context for presentations
   */
  const buildSurveyContext = (facilityName, facilityCcn) => {
    const pocData = getPocDataForPresentation();
    const complianceStatus = surveyData.exitConference?.outcomes?.selectedOutcome === "substantialCompliance"
      ? "Substantial Compliance"
      : "Non-Compliance";

    return {
      facilityName,
      facilityCcn,
      surveyCategory: surveyData.surveyCategory || 'Standard Survey',
      surveyType: surveyData.surveyType || 'Annual',
      surveyDate: surveyData.surveyCreationDate || new Date().toISOString(),
      totalInvestigations: surveyData?.investigationSurvey?.investigations?.length || 0,
      complianceStatus,
      isCertified: complianceStatus === "Substantial Compliance",
      totalCitations: pocData?.plansOfCorrection?.length || surveyData.citations?.length || 0,
      pocSummary: pocData?.summary || null,
      plansOfCorrection: pocData?.plansOfCorrection || [],
    };
  };

  /**
   * Build presentation prompt based on type
   */
  const buildPresentationPrompt = (type, context, options = {}) => {
    const { facilityName, facilityCcn, surveyCategory, surveyDate, complianceStatus, 
            totalCitations, pocSummary, plansOfCorrection, totalInvestigations, isCertified } = context;

    const prompts = {
      staffTraining: () => {
        let prompt = `# Staff Training Presentation: Survey Compliance & Corrective Actions

## Facility Information
- **Facility**: ${facilityName}
- **CCN**: ${facilityCcn || 'N/A'}
- **Survey Date**: ${surveyDate}
- **Survey Category**: ${surveyCategory}
- **Compliance Status**: ${complianceStatus}
- **Total Citations**: ${totalCitations}

## Training Objectives
1. Understand survey findings and their impact on resident care
2. Learn specific corrective actions required for each citation
3. Implement best practices to prevent future citations
4. Know your role in the Plan of Correction

`;
        // Add Executive Summary
        if (pocSummary?.executiveSummary) {
          prompt += `## Executive Summary
${pocSummary.executiveSummary}

**Target Completion Date**: ${pocSummary.estimatedCompletionDate || 'To be determined'}

`;
        }

        // Add detailed POC information
        if (plansOfCorrection.length > 0) {
          prompt += `## Detailed Corrective Actions by F-Tag

`;
          plansOfCorrection.forEach((poc, index) => {
            prompt += `### ${index + 1}. F-Tag ${poc.ftag}: ${poc.regulation || 'Regulation'}
**Regulatory Reference**: ${poc.regulatoryReference || 'N/A'}
**Responsible Person**: ${poc.responsiblePerson || 'To be assigned'}
**Compliance Date**: ${poc.complianceDate || 'TBD'}

**What Happened (Deficiency)**:
${poc.identification || 'Details not provided'}

**What We're Doing About It**:
- *For Affected Residents*: ${poc.correctiveActionAffected || 'See care plan updates'}
- *For Potentially Affected*: ${poc.correctiveActionPotential || 'Preventive measures in place'}

**System Changes Being Made**:
${poc.systemsChange || 'Policy and procedure updates underway'}

**How We'll Monitor Compliance**:
${poc.monitoringPlan || 'QAPI monitoring to be established'}

---
`;
          });
        }

        // Add optional sections based on user selections
        if (options.includeCitations && surveyData.citations?.length > 0) {
          prompt += `## Citation Summary
`;
          surveyData.citations.forEach((citation) => {
            prompt += `- **${citation.fFlag}**: ${citation.deficiency} (Severity: ${citation.severity})\n`;
          });
          prompt += '\n';
        }

        if (options.includeBestPractices) {
          prompt += `## Best Practices for Compliance
- Maintain thorough and timely documentation
- Communicate changes in resident condition immediately
- Follow care plans precisely and update as needed
- Participate in ongoing training and education
- Report concerns through proper channels
- Know your facility's policies and procedures

`;
        }

        if (options.includeActionItems) {
          prompt += `## Your Action Items
1. Review updated policies and procedures in your department
2. Complete required training by specified deadlines
3. Implement new documentation practices immediately
4. Participate in quality monitoring activities
5. Report any barriers to compliance to your supervisor

`;
        }

        prompt += `## Questions & Discussion
- What questions do you have about these changes?
- How can leadership support you in implementing these improvements?
- What resources do you need to be successful?`;

        return prompt;
      },

      leadershipBriefing: () => {
        let prompt = `# Executive Leadership Briefing: Survey Results & Strategic Response

## Facility Overview
- **Facility**: ${facilityName}
- **CCN**: ${facilityCcn || 'N/A'}
- **Survey Date**: ${surveyDate}
- **Survey Type**: ${context.surveyType}
- **Certification Status**: ${isCertified ? 'Certified' : 'Requires Corrective Action'}
- **Compliance Status**: ${complianceStatus}
- **Total Citations**: ${totalCitations}

`;
        // Executive Summary
        if (pocSummary?.executiveSummary) {
          prompt += `## Executive Summary
${pocSummary.executiveSummary}

**Projected Completion**: ${pocSummary.estimatedCompletionDate || 'To be determined'}

`;
        }

        // High-level citation summary
        if (plansOfCorrection.length > 0) {
          prompt += `## Citations Overview

| F-Tag | Regulation | Responsible | Due Date |
|-------|------------|-------------|----------|
`;
          plansOfCorrection.forEach((poc) => {
            prompt += `| ${poc.ftag} | ${(poc.regulation || 'N/A').substring(0, 30)}... | ${poc.responsiblePerson || 'TBD'} | ${poc.complianceDate || 'TBD'} |\n`;
          });
          prompt += '\n';
        }

        // Strategic implications if selected
        if (options.includeStrategicImplications) {
          prompt += `## Strategic Implications

### Operational Impact
- Resource reallocation may be required for corrective actions
- Staff training initiatives need prioritization
- Quality metrics will be closely monitored

### Regulatory Considerations
- CMS follow-up survey likely within 60-90 days
- State agency oversight will increase
- Documentation requirements are heightened

### Reputation & Market Position
- Survey results are publicly available on Care Compare
- Star ratings may be impacted
- Family and referral source confidence considerations

`;
        }

        // Compliance timeline if selected
        if (options.includeComplianceTimeline) {
          prompt += `## Compliance Timeline

### Immediate Actions (0-30 Days)
- Address all immediate jeopardy situations
- Implement critical corrective actions
- Begin staff re-education programs
- Update high-priority policies

### Short-Term (30-90 Days)
- Complete all staff training requirements
- Implement monitoring systems
- Finalize policy revisions
- Prepare for revisit survey

### Long-Term (90+ Days)
- Sustain improvements through QAPI
- Continue ongoing monitoring
- Embed changes into facility culture
- Document sustained compliance

`;
        }

        // Resource requirements if selected
        if (options.includeResourceRequirements) {
          prompt += `## Resource Requirements

### Human Resources
- Additional training hours for staff
- Possible consultant engagement
- Dedicated compliance monitoring staff time

### Financial Considerations
- Training program costs
- Technology/system upgrades
- Potential consultant fees
- Overtime for implementation

### Technology & Systems
- EHR documentation enhancements
- Audit and monitoring tools
- Communication systems

`;
        }

        prompt += `## Recommended Leadership Actions
1. Approve resource allocation for corrective action implementation
2. Communicate commitment to compliance to all staff
3. Schedule regular progress updates
4. Engage medical director and department heads
5. Monitor QAPI metrics weekly until revisit

## Next Steps & Discussion
- Review and approve resource requests
- Identify barriers to implementation
- Set expectations for department accountability`;

        return prompt;
      },

      custom: () => {
        const { title, audience, focusAreas = [] } = options;
        
        let prompt = `# ${title}

## Presentation for: ${audience?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}

## Facility Context
- **Facility**: ${facilityName}
- **Survey Date**: ${surveyDate}
- **Compliance Status**: ${complianceStatus}
- **Total Citations**: ${totalCitations}

`;
        // Add executive summary if available
        if (pocSummary?.executiveSummary) {
          prompt += `## Overview
${pocSummary.executiveSummary}

`;
        }

        // Add content based on selected focus areas
        if (focusAreas.includes('Citation Analysis') && plansOfCorrection.length > 0) {
          prompt += `## Citation Analysis
`;
          plansOfCorrection.forEach((poc) => {
            prompt += `- **${poc.ftag}**: ${poc.regulation || 'Regulation'} - Due: ${poc.complianceDate || 'TBD'}\n`;
          });
          prompt += '\n';
        }

        if (focusAreas.includes('Compliance Requirements')) {
          prompt += `## Compliance Requirements
- Address all identified deficiencies within specified timeframes
- Implement systemic changes to prevent recurrence
- Document all corrective actions taken
- Participate in monitoring activities

`;
        }

        if (focusAreas.includes('Corrective Actions') && plansOfCorrection.length > 0) {
          prompt += `## Corrective Actions Summary
`;
          plansOfCorrection.slice(0, 5).forEach((poc) => {
            prompt += `### ${poc.ftag}: ${poc.regulation || 'Regulation'}
- **Action Required**: ${(poc.correctiveActionAffected || 'See Plan of Correction').substring(0, 200)}...
- **Responsible**: ${poc.responsiblePerson || 'TBD'}

`;
          });
        }

        if (focusAreas.includes('Best Practices')) {
          prompt += `## Best Practices
- Maintain comprehensive documentation at all times
- Follow established policies and procedures
- Report changes in condition promptly
- Participate in quality improvement activities
- Engage in continuous learning and training

`;
        }

        if (focusAreas.includes('Quality Improvement')) {
          prompt += `## Quality Improvement Initiatives
- Establish baseline metrics for all cited areas
- Implement regular auditing processes
- Track progress through QAPI committee
- Celebrate improvements and address barriers
- Use data to drive decision-making

`;
        }

        if (focusAreas.includes('Risk Management')) {
          prompt += `## Risk Management Considerations
- Identify high-risk areas from survey findings
- Implement preventive measures
- Enhance monitoring for at-risk residents
- Review and update risk assessments regularly
- Train staff on risk identification and reporting

`;
        }

        if (focusAreas.includes('Staff Training')) {
          prompt += `## Staff Training Requirements
- All staff to complete training on corrective actions
- Department-specific training for cited areas
- Competency validation required
- Ongoing education to maintain compliance

`;
        }

        if (focusAreas.includes('Policy Updates')) {
          prompt += `## Policy Updates Required
- Review and revise all policies related to citations
- Communicate changes to all affected staff
- Ensure policies align with current regulations
- Implement effective dates and training

`;
        }

        prompt += `## Key Takeaways
- Understand the importance of compliance
- Know your role in corrective actions
- Participate in quality improvement
- Ask questions and seek support when needed`;

        return prompt;
      }
    };

    return prompts[type]?.() || '';
  };

  /**
   * Generate presentation with standardized flow
   */
  const generatePresentation = async (type, options = {}) => {
    try {
      const { facilityName, facilityCcn } = await getFacilityInfo();
      const context = buildSurveyContext(facilityName, facilityCcn);
      const inputText = buildPresentationPrompt(type, context, options);

      if (!inputText) {
        throw new Error('Failed to build presentation prompt');
      }

      // Determine audience and tone based on type
      const typeConfig = {
        staffTraining: {
          audience: 'facility staff, healthcare professionals, nurses, CNAs',
          tone: 'professional, educational, encouraging',
          additionalInstructions: 'Create a clear, actionable training presentation. Use bullet points for key actions. Include practical examples. Make it engaging for frontline staff.',
        },
        leadershipBriefing: {
          audience: 'facility leadership, executives, board members, administrators',
          tone: 'professional, executive, strategic',
          additionalInstructions: 'Create an executive-level briefing. Focus on strategic implications, resource needs, and high-level action items. Use charts and tables where appropriate.',
        },
        custom: {
          audience: options.audience?.replace(/-/g, ' ') || 'general audience',
          tone: 'professional, informative, clear',
          additionalInstructions: `Create a presentation tailored for ${options.audience?.replace(/-/g, ' ')}. Focus on: ${options.focusAreas?.join(', ') || 'general overview'}. Make it relevant and actionable for this specific audience.`,
        },
      };

      const config = typeConfig[type] || typeConfig.custom;

      const result = await createPresentation({
        inputText,
        textMode: presentationOptions.textMode,
        format: presentationOptions.format,
        themeName: presentationOptions.themeName,
        numCards: parseInt(presentationOptions.numCards),
        cardSplit: presentationOptions.cardSplit,
        exportAs: presentationOptions.exportAs,
        additionalInstructions: config.additionalInstructions,
        textOptions: {
          amount: 'detailed',
          tone: config.tone,
          audience: config.audience,
          language: presentationOptions.language,
        },
        imageOptions: {
          source: presentationOptions.imageSource,
          model: presentationOptions.imageModel,
          style: 'professional',
        },
        cardOptions: {
          dimensions: presentationOptions.cardDimensions,
        },
      });

      return result;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Handle presentation creation with UI updates
   */
  const handleCreatePresentation = async (type, educationKey) => {
    // Use type as educationKey if not provided
    const key = educationKey || type;
    
    try {
      const options = surveyData.planOfCorrectionSurvey?.education?.[key] || {};
      
      const result = await generatePresentation(type, options);

      if (result.success && result.generationId) {
        const presentationData = result.presentationData?.data;

        const presentationInfo = {
          generationId: result.generationId,
          gammaUrl: presentationData?.gammaUrl,
          exportUrl: presentationData?.exportUrl,
          status: presentationData?.status || 'completed',
          credits: presentationData?.credits,
          createdAt: new Date().toISOString(),
          message: result.message,
          // Include user options for context
          ...options,
        };

        // Save to store for persistence across page refreshes
        if (surveyId) {
          savePresentation(surveyId, key, presentationInfo);
        }

        // Update survey data with presentation info
        updatePlanOfCorrectionSurvey({
          education: {
            ...surveyData.planOfCorrectionSurvey?.education,
            [key]: {
              ...surveyData.planOfCorrectionSurvey?.education?.[key],
              ...presentationInfo,
            },
          },
        });

        // Show success message
        const typeNames = {
          staffTraining: 'Staff Training Presentation',
          leadershipBriefing: 'Leadership Briefing',
          customPresentation: 'Custom Presentation',
        };
        toast.success(`${typeNames[key] || 'Presentation'} created successfully!`);

        return true;
      } else {
        throw new Error('Failed to get generation ID');
      }
    } catch (error) {
      toast.error('Failed to create presentation. Please try again.');
      return false;
    }
  };

  // ============================================
  // END PRESENTATION GENERATION HELPERS
  // ============================================

  // Handle Plan of Correction upload and generation
  const handlePocUploadAndGenerate = async (file) => {
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    setPocGenerating(true);
    const loadingToast = toast.loading("Uploading and processing Plan of Correction...", {
      position: "top-right",
    });

    try {
      // Get survey ID
      const surveyId =
        surveyData.surveyId ||
        surveyData.id ||
        surveyData._id ||
        localStorage.getItem("currentSurveyId");

      // Step 1: Upload the file
      toast.loading("Uploading file...", {
        id: loadingToast,
        position: "top-right",
      });

      const uploadResponse = await api.user.uploadFile(file);

      if (!uploadResponse || !uploadResponse.data) {
        throw new Error("File upload failed - no URL received");
      }

      // Handle both response formats: direct string or object with pdflink
      const pdfUrl = typeof uploadResponse.data === 'string' 
        ? uploadResponse.data 
        : uploadResponse.data.pdflink;

      // Step 2: Generate Plan of Correction
      toast.loading("Generating Plan of Correction analysis...", {
        id: loadingToast,
        position: "top-right",
      });

      const pocPayload = {
        pdfurl: pdfUrl,
      };

      // Add surveyId if available
      if (surveyId) {
        pocPayload.surveyId = surveyId;
      }

      const pocResponse = await api.healthAssistant.generatePlanOfCorrection(pocPayload);
    

      // Handle the new API response structure
      // New structure: { status, statusCode, message, data: { success, message, data: { summary, plansOfCorrection } } }
      if (pocResponse.statusCode === 200 && pocResponse.data) {
        const innerData = pocResponse.data.data; // The actual POC data
        
        // Store POC data in survey data with full response
        updatePlanOfCorrectionSurvey({
          planOfCorrection: {
            file: file.name,
            pdfUrl: pdfUrl,
            generatedData: pocResponse,
            apiMessage: pocResponse.message || "Plan of Correction processed successfully",
            apiSuccess: pocResponse.status,
            generatedAt: new Date().toISOString(),
          },
        });

        // Check if the inner data exists
        if (innerData) {
          setPocGenerated(pocResponse);
          // Initialize editable data - handle both array and object structures
          // API might return { summary, plansOfCorrection } OR just the array directly
          // Disclaimer is at pocResponse.disclaimer (root level, sibling to data)
          const disclaimer = pocResponse.disclaimer || '';
          
          let normalizedData;
          if (Array.isArray(innerData)) {
            // If innerData is an array, wrap it in the expected structure
            normalizedData = { 
              summary: { executiveSummary: '' },
              plansOfCorrection: innerData,
              disclaimer: disclaimer
            };
          } else {
            // If innerData is already an object with plansOfCorrection
            normalizedData = {
              summary: innerData.summary || { executiveSummary: '' },
              plansOfCorrection: innerData.plansOfCorrection || [],
              disclaimer: disclaimer
            };
          }
          setEditablePocData(JSON.parse(JSON.stringify(normalizedData)));
          
          // Save to POC store for persistence across page reloads
          if (surveyId) {
            savePocGenerationResult(surveyId, {
              editablePocData: normalizedData,
              pocGenerated: pocResponse,
              fileName: file.name,
              pdfUrl: pdfUrl,
              apiMessage: pocResponse.message || "Plan of Correction processed successfully",
              apiSuccess: pocResponse.status,
            });
          }
          
          toast.success(pocResponse.message || "Plan of Correction generated successfully!", {
            id: loadingToast,
            position: "top-right",
            duration: 5000,
          });
        } else {
          setPocGenerated(pocResponse);
          toast.warning("Plan of Correction processed but no data was returned", {
            id: loadingToast,
            position: "top-right",
            duration: 7000,
          });
        }
      } else {
        throw new Error(pocResponse.message || "Failed to generate Plan of Correction");
      } 
    } catch (error) {
      toast.error(
        error.message || "Failed to process Plan of Correction. Please try again.",
        {
          id: loadingToast,
          position: "top-right",
        }
      );
    } finally {
      setPocGenerating(false);
    }
  };


  // Save post survey activities survey data
  const handleCompleteSurvey = async (isContinueClicked = false) => {
    setIsSubmitting(true);
    try {
      // Get survey ID (use component-level surveyId)
      const currentSurveyId = surveyId || surveyData.surveyId || surveyData.id || surveyData._id || localStorage.getItem('currentSurveyId');
      
      if (!currentSurveyId) {
        toast.error("Survey ID not found. Please refresh and try again.", { position: 'top-right' });
        setIsSubmitting(false);
        return;
      }

      // Prepare the new API payload format for Plan of Correction
      const payload = {
        surveyId: currentSurveyId, // optional per API docs
        status: "plan-of-correction",
        summary: editablePocData?.summary || {
          executiveSummary: "",
          estimatedCompletionDate: ""
        },
        plansOfCorrection: (editablePocData?.plansOfCorrection || []).map(poc => ({
          identification: poc.identification || "",
          correctiveActionAffected: poc.correctiveActionAffected || "",
          correctiveActionPotential: poc.correctiveActionPotential || "",
          systemsChange: poc.systemsChange || "",
          monitoringPlan: poc.monitoringPlan || "",
          complianceDate: poc.complianceDate || "",
          responsiblePerson: poc.responsiblePerson || "",
          ftag: poc.ftag || "",
          regulatoryReference: poc.regulatoryReference || "",
          regulation: poc.regulation || ""
        })),
        // Education & Training Presentations
        education: {
          staffTraining: surveyData.planOfCorrectionSurvey?.education?.staffTraining ? {
            generationId: surveyData.planOfCorrectionSurvey.education.staffTraining.generationId || null,
            gammaUrl: surveyData.planOfCorrectionSurvey.education.staffTraining.gammaUrl || null,
            exportUrl: surveyData.planOfCorrectionSurvey.education.staffTraining.exportUrl || null,
            status: surveyData.planOfCorrectionSurvey.education.staffTraining.status || null,
            createdAt: surveyData.planOfCorrectionSurvey.education.staffTraining.createdAt || null,
            includeCompetencyBased: surveyData.planOfCorrectionSurvey.education.staffTraining.includeCompetencyBased || false,
            includeRegulatoryFocus: surveyData.planOfCorrectionSurvey.education.staffTraining.includeRegulatoryFocus || false,
            includeBestPractices: surveyData.planOfCorrectionSurvey.education.staffTraining.includeBestPractices || false
          } : null,
          leadershipBriefing: surveyData.planOfCorrectionSurvey?.education?.leadershipBriefing ? {
            generationId: surveyData.planOfCorrectionSurvey.education.leadershipBriefing.generationId || null,
            gammaUrl: surveyData.planOfCorrectionSurvey.education.leadershipBriefing.gammaUrl || null,
            exportUrl: surveyData.planOfCorrectionSurvey.education.leadershipBriefing.exportUrl || null,
            status: surveyData.planOfCorrectionSurvey.education.leadershipBriefing.status || null,
            createdAt: surveyData.planOfCorrectionSurvey.education.leadershipBriefing.createdAt || null,
            includeStrategicImplications: surveyData.planOfCorrectionSurvey.education.leadershipBriefing.includeStrategicImplications || false,
            includeComplianceTimeline: surveyData.planOfCorrectionSurvey.education.leadershipBriefing.includeComplianceTimeline || false,
            includeResourceRequirements: surveyData.planOfCorrectionSurvey.education.leadershipBriefing.includeResourceRequirements || false
          } : null,
          customPresentation: surveyData.planOfCorrectionSurvey?.education?.customPresentation ? {
            generationId: surveyData.planOfCorrectionSurvey.education.customPresentation.generationId || null,
            gammaUrl: surveyData.planOfCorrectionSurvey.education.customPresentation.gammaUrl || null,
            exportUrl: surveyData.planOfCorrectionSurvey.education.customPresentation.exportUrl || null,
            status: surveyData.planOfCorrectionSurvey.education.customPresentation.status || null,
            createdAt: surveyData.planOfCorrectionSurvey.education.customPresentation.createdAt || null,
            title: surveyData.planOfCorrectionSurvey.education.customPresentation.title || "",
            audience: surveyData.planOfCorrectionSurvey.education.customPresentation.audience || "",
            focusAreas: surveyData.planOfCorrectionSurvey.education.customPresentation.focusAreas || []
          } : null
        },
        disclaimer: editablePocData?.disclaimer || ""
      };

      // Show loading toast
      isContinueClicked && toast.loading("Saving Plan of Correction...", { position: 'top-right' });

      // Check if online before making API call
      if (!navigator.onLine) {
        // Save offline and inform user
        const saveOfflineData = async (offlinePayload) => {
          try {
            const offlineData = {
              ...offlinePayload,
              submittedAt: new Date().toISOString(),
              apiEndpoint: "submitPlanOfCorrection",
              apiMethod: "survey",
            };

            // Step 1: Save to IndexedDB sync queue (permanent storage)
            let syncQueueId = null;
            const stepId = "post-survey-activities";
            const syncItem = await surveyIndexedDB.addToSyncQueue(
              currentSurveyId,
              stepId,
              offlineData,
              "api_post_survey_activities"
            );
            syncQueueId = syncItem.id;

            // Step 2: Update Zustand store (UI state) with sync queue ID
            useSurveyStore.getState().setOfflineData({
              ...offlineData,
              syncQueueId,
            });

            // Step 3: If online, trigger sync attempt
            if (navigator.onLine) {
              surveySyncService.syncUnsyncedData(currentSurveyId).catch(
                (error) => {
                  // console.log("Sync attempt failed, data saved offline:", error);
                }
              );
            }
          } catch (error) {
          
            useSurveyStore.getState().setOfflineData({
              ...offlinePayload,
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
        setIsSubmitting(false);
        return;
      }

      // Submit to API using Plan of Correction endpoint (only if online)
      const response = await api.survey.submitPlanOfCorrection(payload);

      if (response.success || response.status) {
        // Update survey data with the new structure
        const updatedPocData = {
          planOfCorrection: {
            ...surveyData?.planOfCorrectionSurvey?.planOfCorrection,
            generatedData: {
              data: {
                data: editablePocData
              }
            }
          },
          postSurveyCompleted: true
        };
        
        handleSurveyDataChange("planOfCorrectionSurvey", {
          ...surveyData.planOfCorrectionSurvey,
          ...updatedPocData
        });
        handleSurveyDataChange("postSurveyCompleted", true);

        toast.dismiss();
        
        if (isContinueClicked) {
          toast.success("Plan of Correction saved successfully! Moving to next step...", { position: 'top-right', duration: 5000 }); 
          setCurrentStep(12);
          setIsContinueClicked(false);
        } else {
          toast.success("Plan of Correction saved successfully!", { position: 'top-right', duration: 3000 });
        }
      } else {
        toast.dismiss();
        throw new Error(response.message || 'Failed to save Plan of Correction');
      }

    } catch (error) {
      toast.dismiss();
      toast.error(error.message || "Failed to save Plan of Correction. Please try again.", { position: 'top-right' });
    } finally {
      setIsSubmitting(false);
    }
  }; 

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"> 
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-2">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
            {sectionData[10].title}
          </h2>
          {isSurveyClosed && (
            <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300 self-start sm:self-auto">
              <Lock className="w-3 h-3 mr-1" />
              Survey Closed
            </Badge>
          )}
        </div>
        <p className="text-gray-500 text-xs sm:text-sm leading-tight max-w-5xl">
          {sectionData[10].description}
        </p>
      </div>

      <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8">
        <div className="space-y-6 sm:space-y-8">
        
          {/* Plan Of Correction 365 */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
             Plan Of Correction 365
            </h3>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-6 lg:p-8 text-center hover:border-gray-400 transition-colors bg-white">
              <div className="mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  > 
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Upload Plan Of Correction Document
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Supported formats: .pdf
                </p>
              </div> 

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto text-gray-600 border-gray-600 hover:bg-gray-50 text-sm"
                  disabled={pocGenerating || isInvitedUser() || isSurveyClosed}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".pdf";
                    input.onchange = (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setPocFile(file);
                      }
                    };
                    input.click();
                  }}
                >
                  Choose file
                </Button>

                {pocFile && (
                  <Button
                    className="w-full sm:w-auto bg-[#075b7d] hover:bg-[#064d63] text-white text-sm"
                    disabled={pocGenerating || isInvitedUser() || isSurveyClosed}
                    onClick={() => handlePocUploadAndGenerate(pocFile)}
                  >
                    {pocGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span className="hidden sm:inline">Processing...</span>
                        <span className="sm:hidden">Processing</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Generate POC Analysis</span>
                        <span className="sm:hidden">Generate</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="pt-3 border-t border-gray-200 mt-4">
                <p className="text-xs text-gray-500">
                  {pocFile ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-gray-600 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {pocFile.name}
                    </span>
                  ) : surveyData.planOfCorrection?.file ? (
                    <span className="flex items-center justify-center text-green-600">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {surveyData.planOfCorrection.file} - Processed
                    </span>
                  ) : (
                    "No file selected"
                  )}
                </p>
              </div>
            </div>

            {/* Show Generated POC Results */}
            {(pocGenerated || surveyData?.planOfCorrectionSurvey?.planOfCorrection?.generatedData) && (
              <div className="mt-4 sm:mt-6 bg-gray-50 rounded-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
                  <h4 className="text-sm sm:text-base font-medium text-gray-900">
                    Plan of Correction Analysis Results
                  </h4>
                  {surveyData?.planOfCorrectionSurvey?.planOfCorrection?.pdfUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(surveyData?.planOfCorrectionSurvey?.planOfCorrection?.pdfUrl, "_blank")}
                      className="w-full sm:w-auto text-gray-600 border-gray-300 hover:bg-gray-50 bg-[#075b7d] hover:bg-[#064d63] text-white text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">View Original Document</span>
                      <span className="sm:hidden">View Document</span>
                    </Button>
                  )}
                </div>

                {/* API Message */}
                {surveyData?.planOfCorrectionSurvey?.planOfCorrection?.apiMessage && (
                  <div className={`mb-4 p-4 rounded-lg border ${
                    surveyData?.planOfCorrectionSurvey?.planOfCorrection?.apiSuccess 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 ${
                        surveyData?.planOfCorrectionSurvey?.planOfCorrection?.apiSuccess 
                          ? 'text-green-600' 
                          : 'text-yellow-600'
                      }`}>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className={`text-sm font-medium ${
                          surveyData?.planOfCorrectionSurvey?.planOfCorrection?.apiSuccess 
                            ? 'text-green-800' 
                            : 'text-yellow-800'
                        }`}>
                          {surveyData?.planOfCorrectionSurvey?.planOfCorrection?.apiMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                {editablePocData && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 mb-4">
                    <Button
                      onClick={handleDownloadPoc}
                      className="bg-[#075b7d] hover:bg-[#064d63] text-white"
                    >
                     
                      Download as Word
                    </Button>
                  </div>
                )}

                {/* Data Display */}
                {editablePocData ? (
                  <div className="space-y-4">
                    {/* Executive Summary - Collapsible */}
                    <details className="bg-white rounded-lg border border-gray-200 group" open>
                      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors list-none [&::-webkit-details-marker]:hidden">
                        <div className="flex items-center">
                          <span className="w-6 h-6 bg-[#075b7d] text-white rounded-full flex items-center justify-center text-xs mr-3 flex-shrink-0">1</span>
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900">Executive Summary</h3>
                        </div>
                        <svg className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-4 pb-4 border-t border-gray-100">
                        <textarea
                          value={editablePocData.summary?.executiveSummary || ''}
                          onChange={(e) => setEditablePocData({
                            ...editablePocData,
                            summary: {
                              ...editablePocData.summary,
                              executiveSummary: e.target.value
                            }
                          })}
                          disabled={isInvitedUser() || isSurveyClosed}
                          className="w-full mt-4 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] min-h-[120px] text-sm disabled:opacity-60 disabled:cursor-not-allowed resize-y"
                          placeholder="Enter executive summary..."
                        />
                        {editablePocData.summary?.estimatedCompletionDate && (
                          <p className="text-xs text-gray-500 mt-2">
                            Estimated Completion: {editablePocData.summary.estimatedCompletionDate}
                          </p>
                        )}
                      </div>
                    </details>

                    {/* Detailed Plans of Correction - Accordion */}
                    {editablePocData.plansOfCorrection?.length > 0 && (
                      <div className="bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                          <div className="flex items-center">
                            <span className="w-6 h-6 bg-[#075b7d] text-white rounded-full flex items-center justify-center text-xs mr-3 flex-shrink-0">2</span>
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                              Detailed Plans of Correction ({editablePocData.plansOfCorrection.length})
                            </h3>
                          </div>
                        </div>
                        
                        <div className="divide-y divide-gray-200">
                          {editablePocData.plansOfCorrection.map((poc, index) => (
                            <details key={index} className="group">
                              <summary className="flex items-start justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors list-none [&::-webkit-details-marker]:hidden">
                                <div className="flex-1 min-w-0 space-y-2">
                                  {/* Row 1: F-Tag Badge */}
                                  <div>
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#075b7d] text-white">
                                      F{poc.ftag?.toString().replace(/^F+/i, '')}
                                    </span>
                                  </div>
                                  
                                  {/* Row 2: Regulation Title */}
                                  <p className="text-sm font-medium text-gray-900 leading-snug">
                                    {poc.regulation || 'Regulation'}
                                  </p>
                                  
                                  {/* Row 3: Description/Identification Preview */}
                                  {poc.identification && (
                                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                      {poc.identification.length > 150 
                                        ? `${poc.identification.substring(0, 150)}...` 
                                        : poc.identification}
                                    </p>
                                  )}
                                  
                                  {/* Row 4: Date and Responsible Person */}
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      {poc.complianceDate || 'No date set'}
                                    </span>
                                   
                                    
                                  </div>
                                </div>
                                <svg className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-180 flex-shrink-0 ml-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </summary>
                              
                              <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-4">
                                {/* Header Info */}
                                {poc.regulatoryReference && (
                                  <p className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-md inline-block">
                                    <span className="font-medium">Reference:</span> {poc.regulatoryReference}
                                  </p>
                                )}
                                
                                {/* Responsible Person & Compliance Date */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Responsible Person</Label>
                                    <Input
                                      value={poc.responsiblePerson || ''}
                                      onChange={(e) => {
                                        const updated = [...editablePocData.plansOfCorrection];
                                        updated[index] = { ...updated[index], responsiblePerson: e.target.value };
                                        setEditablePocData({ ...editablePocData, plansOfCorrection: updated });
                                      }}
                                      disabled={isInvitedUser() || isSurveyClosed}
                                      className="w-full text-sm bg-white"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Compliance Date</Label>
                                    <Input
                                      value={poc.complianceDate || ''}
                                      onChange={(e) => {
                                        const updated = [...editablePocData.plansOfCorrection];
                                        updated[index] = { ...updated[index], complianceDate: e.target.value };
                                        setEditablePocData({ ...editablePocData, plansOfCorrection: updated });
                                      }}
                                      disabled={isInvitedUser() || isSurveyClosed}
                                      className="w-full text-sm bg-white"
                                    />
                                  </div>
                                </div>

                                {/* Identification of Deficiency - Full Width */}
                                <div>
                                  <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Identification of Deficiency</Label>
                                  <textarea
                                    value={poc.identification || ''}
                                    onChange={(e) => {
                                      const updated = [...editablePocData.plansOfCorrection];
                                      updated[index] = { ...updated[index], identification: e.target.value };
                                      setEditablePocData({ ...editablePocData, plansOfCorrection: updated });
                                    }}
                                    disabled={isInvitedUser() || isSurveyClosed}
                                    className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] disabled:opacity-60 disabled:cursor-not-allowed resize-y bg-white min-h-[80px]"
                                  />
                                </div>

                                {/* Corrective Actions - Two Column */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Corrective Action for Affected Residents</Label>
                                    <textarea
                                      value={poc.correctiveActionAffected || ''}
                                      onChange={(e) => {
                                        const updated = [...editablePocData.plansOfCorrection];
                                        updated[index] = { ...updated[index], correctiveActionAffected: e.target.value };
                                        setEditablePocData({ ...editablePocData, plansOfCorrection: updated });
                                      }}
                                      disabled={isInvitedUser() || isSurveyClosed}
                                      className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] disabled:opacity-60 disabled:cursor-not-allowed resize-y bg-white min-h-[100px]"
                                    />
                                  </div>

                                  <div>
                                    <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Corrective Action for Potentially Affected</Label>
                                    <textarea
                                      value={poc.correctiveActionPotential || ''}
                                      onChange={(e) => {
                                        const updated = [...editablePocData.plansOfCorrection];
                                        updated[index] = { ...updated[index], correctiveActionPotential: e.target.value };
                                        setEditablePocData({ ...editablePocData, plansOfCorrection: updated });
                                      }}
                                      disabled={isInvitedUser() || isSurveyClosed}
                                      className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] disabled:opacity-60 disabled:cursor-not-allowed resize-y bg-white min-h-[100px]"
                                    />
                                  </div>
                                </div>

                                {/* Systems Change - Full Width */}
                                <div>
                                  <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Systems Change</Label>
                                  <textarea
                                    value={poc.systemsChange || ''}
                                    onChange={(e) => {
                                      const updated = [...editablePocData.plansOfCorrection];
                                      updated[index] = { ...updated[index], systemsChange: e.target.value };
                                      setEditablePocData({ ...editablePocData, plansOfCorrection: updated });
                                    }}
                                    disabled={isInvitedUser() || isSurveyClosed}
                                    className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] disabled:opacity-60 disabled:cursor-not-allowed resize-y bg-white min-h-[100px]"
                                  />
                                </div>

                                {/* Monitoring Plan - Full Width */}
                                <div>
                                  <Label className="text-xs font-medium text-gray-700 mb-1.5 block">Monitoring Plan</Label>
                                  <textarea
                                    value={poc.monitoringPlan || ''}
                                    onChange={(e) => {
                                      const updated = [...editablePocData.plansOfCorrection];
                                      updated[index] = { ...updated[index], monitoringPlan: e.target.value };
                                      setEditablePocData({ ...editablePocData, plansOfCorrection: updated });
                                    }}
                                    disabled={isInvitedUser() || isSurveyClosed}
                                    className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] disabled:opacity-60 disabled:cursor-not-allowed resize-y bg-white min-h-[80px]"
                                  />
                                </div>
                              </div>
                            </details>
                          ))}
                        </div>
                      </div> 
                    )}

                    {/* Disclaimer Section */}
                    {editablePocData.disclaimer && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                         
                          <div>
                            <h4 className="text-sm font-semibold text-amber-800 mb-1"> Disclaimer</h4>
                            <p className="text-sm text-amber-700 leading-relaxed">
                              {editablePocData.disclaimer}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (pocGenerated?.data?.data || surveyData.planOfCorrection?.generatedData?.data?.data) ? (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    {(() => {
                      const pocData = pocGenerated?.data?.data || surveyData.planOfCorrection?.generatedData?.data?.data;
                      if (!pocData) return null;

                      return (
                        <div className="space-y-6">
                          {/* Executive Summary */}
                          {pocData.summary && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">Executive Summary</h4>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {pocData.summary.executiveSummary}
                              </p>
                            </div>
                          )}


                          {/* Plans of Correction */}
                          {pocData.plansOfCorrection && pocData.plansOfCorrection.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">Plans of Correction</h4>
                              <div className="space-y-4">
                                {pocData.plansOfCorrection.map((plan, index) => (
                                  <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                                    <div className="flex items-center justify-between mb-3">
                                      <Badge variant="outline" className="text-xs">
                                        {plan.ftag}
                                      </Badge>
                                      <span className="text-xs text-gray-500">
                                        Due: {plan.complianceDate || 'TBD'}
                                      </span>
                                    </div>
                                    
                                    <div className="space-y-3">
                                      <div>
                                        <h5 className="font-medium text-gray-900 mb-2">Regulation</h5>
                                        <p className="text-sm text-gray-700">{plan.regulation || 'N/A'}</p>
                                        {plan.regulatoryReference && (
                                          <p className="text-xs text-gray-500 mt-1"><strong>Reference:</strong> {plan.regulatoryReference}</p>
                                        )}
                                      </div>
                                      
                                      <div>
                                        <h5 className="font-medium text-gray-900 mb-2">Identification</h5>
                                        <p className="text-sm text-gray-700">{plan.identification || 'No identification provided'}</p>
                                      </div>
                                      
                                      {plan.correctiveActionAffected && (
                                        <div>
                                          <h5 className="font-medium text-gray-900 mb-2">Corrective Action for Affected Residents</h5>
                                          <p className="text-sm text-gray-700">{plan.correctiveActionAffected}</p>
                                        </div>
                                      )}
                                      
                                      {plan.correctiveActionPotential && (
                                        <div>
                                          <h5 className="font-medium text-gray-900 mb-2">Corrective Action for Potentially Affected Residents</h5>
                                          <p className="text-sm text-gray-700">{plan.correctiveActionPotential}</p>
                                        </div>
                                      )}
                                      
                                      {plan.systemsChange && (
                                        <div>
                                          <h5 className="font-medium text-gray-900 mb-2">Systems Change</h5>
                                          <p className="text-sm text-gray-700">{plan.systemsChange}</p>
                                        </div>
                                      )}
                                      
                                      {plan.monitoringPlan && (
                                        <div>
                                          <h5 className="font-medium text-gray-900 mb-2">Monitoring Plan</h5>
                                          <p className="text-sm text-gray-700">{plan.monitoringPlan}</p>
                                        </div>
                                      )}
                                      
                                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                        <span className="text-xs text-gray-500">
                                          Responsible: {plan.responsiblePerson || 'Not assigned'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Summary Stats */}
                          {pocData && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{pocData.plansOfCorrection?.length || 0}</div>
                                <div className="text-xs text-gray-500">Total Citations</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{pocData.plansOfCorrection?.length || 0}</div>
                                <div className="text-xs text-gray-500">Plans Created</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-medium text-gray-900">
                                  {pocData.summary?.estimatedCompletionDate || 'TBD'}
                                </div>
                                <div className="text-xs text-gray-500">Est. Completion</div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm text-gray-600">
                      No citation data found in the document
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      The document was processed but did not contain extractable citation information
                    </p>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-3">
                  Processed on:{" "}
                  {new Date(
                    surveyData.planOfCorrection?.generatedAt || Date.now()
                  ).toLocaleString()}
                </p>
              </div>
            )}
          </div>


          {/* Education & Training Presentations */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Education & Training Presentations
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700 mb-3">
                  <strong>Note:</strong> Create educational presentations to
                  help facility staff understand survey findings and implement
                  corrective actions.
                </p>
              </div>

              {/* Presentation Settings */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <details className="group">
                  <summary className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-[#075b7d] mb-3 flex items-center justify-between">
                    <span>Presentation Settings (Optional)</span>
                    <span className="text-xs text-gray-500 group-open:hidden">
                      Click to customize
                    </span>
                  </summary>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Format */}
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1 block">
                        Format
                      </Label>
                      <Select
                        value={presentationOptions.format}
                        onValueChange={(value) =>
                          setPresentationOptions({
                            ...presentationOptions,
                            format: value,
                          })
                        }
                        disabled={isInvitedUser() || isSurveyClosed}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select format..." />
                        </SelectTrigger>
                        <SelectContent>
                          {presentationParams?.format?.map((item) => (
                            <SelectItem key={item.id} value={item.name}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Theme */}
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1 block">
                        Theme
                      </Label>
                      <Select
                        value={presentationOptions.themeName}
                        onValueChange={(value) =>
                          setPresentationOptions({
                            ...presentationOptions,
                            themeName: value,
                          })
                        }
                        disabled={isInvitedUser() || isSurveyClosed}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select theme..." />
                        </SelectTrigger>
                        <SelectContent>
                          {presentationParams?.themeName?.map((item) => (
                            <SelectItem key={item.id} value={item.name}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Number of Cards */}
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1 block">
                        Number of Cards
                      </Label>
                      <Select
                        value={presentationOptions.numCards}
                        onValueChange={(value) =>
                          setPresentationOptions({
                            ...presentationOptions,
                            numCards: value,
                          })
                        }
                        disabled={isInvitedUser() || isSurveyClosed}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select cards..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                          {/* Support 1-20 cards */}
                          {Array.from({length: 20}, (_, i) => i + 1).map(num => (
                            <SelectItem key={num} value={String(num)}>
                              {num} {num === 1 ? 'card' : 'cards'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Language */}
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1 block">
                        Language
                      </Label>
                      <Select
                        value={presentationOptions.language}
                        onValueChange={(value) =>
                          setPresentationOptions({
                            ...presentationOptions,
                            language: value,
                          })
                        }
                        disabled={isInvitedUser() || isSurveyClosed}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select language..." />
                        </SelectTrigger>
                        <SelectContent>
                          {presentationParams?.textOptionsLanguage?.map(
                            (item) => (
                              <SelectItem key={item.id} value={item.key}>
                                {item.language}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Image Source */}
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1 block">
                        Image Source
                      </Label>
                      <Select
                        value={presentationOptions.imageSource}
                        onValueChange={(value) =>
                          setPresentationOptions({
                            ...presentationOptions,
                            imageSource: value,
                          })
                        }
                        disabled={isInvitedUser() || isSurveyClosed}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select image source..." />
                        </SelectTrigger>
                        <SelectContent>
                          {presentationParams?.imageOptions?.map((item) => (
                            <SelectItem key={item.id} value={item.source}>
                              {getImageSourceDisplayName(item.source)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Image Model */}
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1 block">
                        Image Model
                      </Label>
                      <Select
                        value={presentationOptions.imageModel}
                        onValueChange={(value) =>
                          setPresentationOptions({
                            ...presentationOptions,
                            imageModel: value,
                          })
                        }
                        disabled={isInvitedUser() || isSurveyClosed}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select model..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                          {presentationParams?.imageModelStyle?.map((item) => (
                            <SelectItem key={item.id} value={item.model}>
                              {item.model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Card Dimensions */}
                    <div>
                      <Label className="text-xs font-medium text-gray-700 mb-1 block">
                        Card Dimensions
                      </Label>
                      <Select
                        value={presentationOptions.cardDimensions}
                        onValueChange={(value) =>
                          setPresentationOptions({
                            ...presentationOptions,
                            cardDimensions: value,
                          })
                        }
                        disabled={isInvitedUser() || isSurveyClosed}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select dimensions..." />
                        </SelectTrigger>
                        <SelectContent>
                          {presentationParams?.cardOptions?.map((item) => (
                            <SelectItem key={item.id} value={item.dimensions}>
                              {item.dimensions}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </details>
              </div>

              {/* Presentation Types */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Staff Training Presentation */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Staff Training Presentation
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Create a comprehensive training presentation for facility
                    staff covering survey findings, compliance requirements, and
                    best practices.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={
                          surveyData.planOfCorrectionSurvey?.education?.staffTraining
                            ?.includeCitations || false
                        }
                        onChange={(e) =>
                          updatePlanOfCorrectionSurvey({
                            education: {
                              ...surveyData.planOfCorrectionSurvey?.education,
                              staffTraining: {
                                ...surveyData.planOfCorrectionSurvey?.education?.staffTraining,
                                includeCitations: e.target.checked,
                              },
                            },
                          })
                        }
                        disabled={isInvitedUser() || isSurveyClosed}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700">
                        Include citation details
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={
                          surveyData.planOfCorrectionSurvey?.education?.staffTraining
                            ?.includeBestPractices || false
                        }
                        onChange={(e) =>
                          updatePlanOfCorrectionSurvey({
                            education: {
                              ...surveyData.planOfCorrectionSurvey?.education,
                              staffTraining: {
                                ...surveyData.planOfCorrectionSurvey?.education?.staffTraining,
                                includeBestPractices: e.target.checked,
                              },
                            },
                          })
                        }
                        disabled={isInvitedUser() || isSurveyClosed}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700">
                        Include best practices
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={
                          surveyData.planOfCorrectionSurvey?.education?.staffTraining
                            ?.includeActionItems || false
                        }
                        onChange={(e) =>
                          updatePlanOfCorrectionSurvey({
                            education: {
                              ...surveyData.planOfCorrectionSurvey?.education,
                              staffTraining: {
                                ...surveyData.planOfCorrectionSurvey?.education?.staffTraining,
                                includeActionItems: e.target.checked,
                              },
                            },
                          })
                        }
                        disabled={isInvitedUser() || isSurveyClosed}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700">
                        Include action items
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCreatePresentation('staffTraining', 'staffTraining')}
                    disabled={isInvitedUser() || isSurveyClosed}
                    className="w-fit hover:bg-gray-50 mt-4"
                    variant="outline"
                  >
                    Create Staff Training Presentation
                  </Button>
                </div>

                {/* Leadership Briefing */}
                <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Leadership Briefing
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Generate an executive-level presentation for facility
                    leadership focusing on strategic implications and compliance
                    requirements.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={
                          surveyData.planOfCorrectionSurvey?.education?.leadershipBriefing
                            ?.includeStrategicImplications || false
                        }
                        onChange={(e) =>
                          updatePlanOfCorrectionSurvey({
                            education: {
                              ...surveyData.planOfCorrectionSurvey?.education,
                              leadershipBriefing: {
                                ...surveyData.planOfCorrectionSurvey?.education?.leadershipBriefing,
                                includeStrategicImplications: e.target.checked,
                              },
                            },
                          })
                        }
                        disabled={isInvitedUser() || isSurveyClosed}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700">
                        Include strategic implications
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={
                          surveyData.planOfCorrectionSurvey?.education?.leadershipBriefing
                            ?.includeComplianceTimeline || false
                        }
                        onChange={(e) =>
                          updatePlanOfCorrectionSurvey({
                            education: {
                              ...surveyData.planOfCorrectionSurvey?.education,
                              leadershipBriefing: {
                                ...surveyData.planOfCorrectionSurvey?.education?.leadershipBriefing,
                                includeComplianceTimeline: e.target.checked,
                              },
                            },
                          })
                        }
                        disabled={isInvitedUser() || isSurveyClosed}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700">
                        Include compliance timeline
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={
                          surveyData.planOfCorrectionSurvey?.education?.leadershipBriefing
                            ?.includeResourceRequirements || false
                        }
                        onChange={(e) =>
                          updatePlanOfCorrectionSurvey({
                            education: {
                              ...surveyData.planOfCorrectionSurvey?.education,
                              leadershipBriefing: {
                                ...surveyData.planOfCorrectionSurvey?.education?.leadershipBriefing,
                                includeResourceRequirements: e.target.checked,
                              },
                            },
                          })
                        }
                        disabled={isInvitedUser() || isSurveyClosed}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      />
                      <span className="text-sm text-gray-700">
                        Include resource requirements
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCreatePresentation('leadershipBriefing')}
                    disabled={isInvitedUser() || isSurveyClosed}
                    className="w-fit hover:bg-gray-50 mt-4"
                    variant="outline"
                  >
                    Create Leadership Briefing
                  </Button>
                </div>
              </div>

              {/* Custom Presentation */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">
                  Custom Presentation
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Presentation Title
                    </Label>
                    <Input
                      placeholder="Enter presentation title..."
                      value={
                        surveyData.planOfCorrectionSurvey?.education?.customPresentation?.title || ""
                      }
                      onChange={(e) =>
                        updatePlanOfCorrectionSurvey({
                          education: {
                            ...surveyData.planOfCorrectionSurvey?.education,
                            customPresentation: {
                              ...surveyData.planOfCorrectionSurvey?.education?.customPresentation,
                              title: e.target.value,
                            },
                          },
                        })
                      }
                      disabled={isInvitedUser() || isSurveyClosed}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Target Audience
                    </Label>
                    <Select
                      value={
                        surveyData.planOfCorrectionSurvey?.education?.customPresentation?.audience || ""
                      }
                      onValueChange={(value) =>
                        updatePlanOfCorrectionSurvey({
                          education: {
                            ...surveyData.planOfCorrectionSurvey?.education,
                            customPresentation: {
                              ...surveyData.planOfCorrectionSurvey?.education?.customPresentation,
                              audience: value,
                            },
                          },
                        })
                      }
                      disabled={isInvitedUser() || isSurveyClosed}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select audience..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nursing-staff">
                          Nursing Staff
                        </SelectItem>
                        <SelectItem value="medical-staff">
                          Medical Staff
                        </SelectItem>
                        <SelectItem value="administrative-staff">
                          Administrative Staff
                        </SelectItem>
                        <SelectItem value="support-staff">
                          Support Staff
                        </SelectItem>
                        <SelectItem value="board-members">
                          Board Members
                        </SelectItem>
                        <SelectItem value="stakeholders">
                          Stakeholders
                        </SelectItem>
                        <SelectItem value="regulatory-agencies">
                          Regulatory Agencies
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Key Focus Areas
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "Citation Analysis",
                        "Compliance Requirements",
                        "Corrective Actions",
                        "Best Practices",
                        "Quality Improvement",
                        "Risk Management",
                        "Staff Training",
                        "Policy Updates",
                      ].map((focus) => (
                        <label
                          key={focus}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={
                              surveyData.planOfCorrectionSurvey?.education?.customPresentation?.focusAreas?.includes(
                                focus
                              ) || false
                            }
                            onChange={(e) => {
                              const currentFocusAreas =
                                surveyData.planOfCorrectionSurvey?.education?.customPresentation
                                  ?.focusAreas || [];
                              const updatedFocusAreas = e.target.checked
                                ? [...currentFocusAreas, focus]
                                : currentFocusAreas.filter(
                                    (area) => area !== focus
                                  );
                              
                              updatePlanOfCorrectionSurvey({
                                education: {
                                  ...surveyData.planOfCorrectionSurvey?.education,
                                  customPresentation: {
                                    ...surveyData.planOfCorrectionSurvey?.education?.customPresentation,
                                    focusAreas: updatedFocusAreas,
                                  },
                                },
                              });
                            }}
                            disabled={isInvitedUser() || isSurveyClosed}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                          <span className="text-sm text-gray-700">{focus}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCreatePresentation('customPresentation')} 
                    disabled={
                      isInvitedUser() || 
                      isSurveyClosed ||
                      !surveyData.planOfCorrectionSurvey?.education?.customPresentation?.title ||
                      !surveyData.planOfCorrectionSurvey?.education?.customPresentation?.audience
                    }
                    className="w-fit hover:bg-gray-50 mt-4"
                    variant="outline"
                  >
                    Create Custom Presentation 
                  </Button>
                </div>
              </div>

              {/* Created Presentations */}
              {(surveyData.planOfCorrectionSurvey?.education?.staffTraining?.generationId ||
                surveyData.planOfCorrectionSurvey?.education?.leadershipBriefing?.generationId ||
                surveyData.planOfCorrectionSurvey?.education?.customPresentation?.generationId) && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Created Presentations
                  </h4>
                  <div className="space-y-3">
                    {/* Staff Training Presentation */}
                    {surveyData.planOfCorrectionSurvey?.education?.staffTraining?.generationId && (
                      <div className="p-3 bg-white rounded border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm text-gray-700 font-medium">
                              Staff Training Presentation
                            </span>
                          
                            {/* {surveyData.education.staffTraining.credits && (
                              <p className="text-xs text-gray-500">
                                Credits:{" "}
                                {
                                  surveyData.education.staffTraining.credits
                                    .deducted
                                }{" "}
                                used |{" "}
                                {
                                  surveyData.education.staffTraining.credits
                                    .remaining
                                }{" "}
                                remaining
                              </p>
                            )} */}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {surveyData.planOfCorrectionSurvey?.education?.staffTraining?.exportUrl && (
                        <Button
                              onClick={() =>
                                window.open(
                                  surveyData.planOfCorrectionSurvey?.education?.staffTraining?.exportUrl,
                                  "_blank"
                                )
                              }
                          size="sm"
                          variant="outline"
                          className="text-gray-600 border-gray-300 hover:bg-gray-50"
                        >
                             
                              Preview
                        </Button>
                          )}
                          {surveyData.planOfCorrectionSurvey?.education?.staffTraining?.exportUrl && (
                            <Button
                              onClick={() => {
                                window.open(
                                  surveyData.planOfCorrectionSurvey?.education?.staffTraining?.exportUrl,
                                  "_blank"
                                );
                                toast.success("Opening presentation file...");
                              }}
                              size="sm"
                              variant="outline"
                              className="text-gray-600 border-gray-300 hover:bg-gray-50"
                            >
                             
                               Download File
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Leadership Briefing */}
                    {surveyData.planOfCorrectionSurvey?.education?.leadershipBriefing?.generationId && (
                      <div className="p-3 bg-white rounded border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm text-gray-700 font-medium">
                              Leadership Briefing
                            </span>
                           
                            {/* {surveyData.education.leadershipBriefing
                              .credits && (
                              <p className="text-xs text-gray-500">
                                Credits:{" "}
                                {
                                  surveyData.education.leadershipBriefing
                                    .credits.deducted
                                }{" "}
                                used |{" "}
                                {
                                  surveyData.education.leadershipBriefing
                                    .credits.remaining
                                }{" "}
                                remaining
                              </p>
                            )} */}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {surveyData.planOfCorrectionSurvey?.education?.leadershipBriefing?.exportUrl && (
                        <Button
                              onClick={() =>
                                window.open(
                                  surveyData.planOfCorrectionSurvey?.education?.leadershipBriefing
                                    .exportUrl,
                                  "_blank"
                                )
                              }
                          size="sm"
                          variant="outline"
                          className="text-gray-600 border-gray-300 hover:bg-gray-50"
                        >
                             
                              Preview
                        </Button>
                          )}
                          {surveyData.planOfCorrectionSurvey?.education?.leadershipBriefing
                            .exportUrl && (
                            <Button
                              onClick={() => {
                                window.open(
                                  surveyData.planOfCorrectionSurvey?.education?.leadershipBriefing
                                    .exportUrl,
                                  "_blank"
                                );
                                toast.success("Opening presentation file...");
                              }}
                              size="sm"
                              variant="outline"
                              className="text-gray-600 border-gray-300 hover:bg-gray-50"
                            >
                              
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Custom Presentation */}
                    {surveyData.planOfCorrectionSurvey?.education?.customPresentation?.generationId && (
                      <div className="p-3 bg-white rounded border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm text-gray-700 font-medium">
                              {surveyData.planOfCorrectionSurvey?.education?.customPresentation?.title ||
                                "Custom Presentation"}
                            </span>
                           
                            {/* {surveyData.education.customPresentation
                              .credits && (
                              <p className="text-xs text-gray-500">
                                Credits:{" "}
                                {
                                  surveyData.education.customPresentation
                                    .credits.deducted
                                }{" "}
                                used |{" "}
                                {
                                  surveyData.planOfCorrectionSurvey?.education?.customPresentation
                                    .credits.remaining
                                }{" "}
                                remaining
                              </p>
                            )} */}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {surveyData.planOfCorrectionSurvey?.education?.customPresentation?.exportUrl && (
                        <Button
                              onClick={() =>
                                window.open(
                                  surveyData.planOfCorrectionSurvey?.education?.customPresentation
                                    .exportUrl,
                                  "_blank"
                                )
                              }
                          size="sm"
                          variant="outline"
                          className="text-gray-600 border-gray-300 hover:bg-gray-50"
                        >
                             
                              Preview
                        </Button>
                          )}
                          {surveyData.planOfCorrectionSurvey?.education?.customPresentation
                            .exportUrl && (
                            <Button
                              onClick={() => {
                                window.open(
                                  surveyData.planOfCorrectionSurvey?.education?.customPresentation 
                                    ?.exportUrl,
                                  "_blank"
                                );
                                toast.success("Opening presentation file...");
                              }}
                              size="sm"
                              variant="outline"
                              className="text-gray-600 border-gray-300 hover:bg-gray-50"
                            >
                             
                              Download
                            </Button>
                          )}
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

      {/* Floating Save Button */}
       {
        !isInvitedUser() && (
          <div className="fixed bottom-[100px]  right-6 z-40 flex flex-col items-end gap-2">
        <Button
          onClick={() => handleCompleteSurveyWithClear(false)}
          disabled={isSubmitting || isSurveyClosed || surveyData.surveyClosureSurvey?.surveyCompleted}
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
        )
       }

      {/* Navigation Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex gap-4">
        <Button
          onClick={() => {
            if (hasUnsavedChanges) {
              setShowUnsavedChangesModal(true);
              setPendingNavigation(() => () => setCurrentStep(10));
            } else {
              setCurrentStep(10);
            }
          }}
          className="h-12 px-8 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium rounded-full shadow-lg flex items-center gap-2 hover:shadow-xl transition-all"
          size="lg"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </Button>

        {isInvitedUser() ? (
          <Button
            onClick={() => setCurrentStep(12)}
            className="h-12 px-8 bg-[#075b7d] hover:bg-[#075b7d] text-white font-medium rounded-full shadow-lg flex items-center gap-2 hover:shadow-xl transition-all"
            size="lg"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </Button>
        ) : (
          <Button
            onClick={() => {
              handleCompleteSurvey(true);
              setIsContinueClicked(true);
            }}
            disabled={isSubmitting || isSurveyClosed || surveyData.surveyClosureSurvey?.surveyCompleted}
            className="flex-1 sm:flex-none h-11 sm:h-12 px-4 sm:px-8 bg-[#075b7d] hover:bg-sky-800 text-white text-sm sm:text-base font-medium rounded-full shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all"
            size="lg"
          >  
            <span className="hidden sm:inline">
               Continue to Survey Closure
              </span>
            <span className="sm:hidden">Closure</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        )}
      </div>

      {/* Generation Loading Modal */}
      {showGenerationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-lg mx-4 shadow-2xl border border-gray-200">
            <div className="flex flex-col items-center">
              {/* Animated loader */}
              <div className="relative mb-4 sm:mb-6">
                <div className="w-16 h-16 sm:w-24 sm:h-24 border-4 border-gray-200 rounded-full"></div>
                <div className="w-16 h-16 sm:w-24 sm:h-24 border-4 border-[#075b7d] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
              
              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
                Generating Presentation
              </h3>
              
              {/* Stage indicator */}
              <div className="mb-4 text-center">
                <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-2"></div>
                  <span className="text-xs sm:text-sm font-medium text-blue-800 capitalize">
                    {generationProgress.stage}
                  </span>
                </div>
              </div>
              
              {/* Progress Message */}
              <p className="text-xs sm:text-sm text-gray-600 text-center mb-4">
                {generationProgress.message}
              </p>
              
              {/* Progress Stats */}
              <div className="w-full bg-gray-100 rounded-lg p-3 sm:p-4 mb-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-[#075b7d]">{Math.floor(generationProgress.elapsedTime)}s</p>
                    <p className="text-xs text-gray-600">Elapsed Time</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-[#075b7d]">{generationProgress.attempts}</p>
                    <p className="text-xs text-gray-600">Status Checks</p>
                  </div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-4">
                <div 
                  className="bg-[#075b7d] h-full rounded-full transition-all duration-300 animate-pulse" 
                  style={{ width: `${Math.min((generationProgress.attempts / 60) * 100, 95)}%` }}
                ></div>
              </div>
              
              {/* Additional info */}
              <p className="text-xs text-gray-500 text-center">
                Presentations typically take 30-90 seconds to generate.
                <br />
                Please do not close or refresh this page.
              </p>
            </div> 
          </div>
        </div>
      )}

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        open={showUnsavedChangesModal}
        onOpenChange={setShowUnsavedChangesModal}
        onCancel={() => {
          setShowUnsavedChangesModal(false);
          setPendingNavigation(null);
        }}
        onConfirm={async () => {
          await handleCompleteSurveyWithClear(false);
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
        onSave={() => handleCompleteSurveyWithClear(false)}
        onClearUnsavedChanges={() => setHasUnsavedChanges(false)}
      />
    </div>
  );
};

export default PostSurveyActivities;
