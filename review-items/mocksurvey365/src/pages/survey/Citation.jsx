import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { healthAssistantAPI } from "../../service/api";
import api from "../../service/api";
import surveyIndexedDB from "../../utils/surveyIndexedDB";
import surveySyncService from "../../utils/surveySyncService";
import useSurveyStore from "../../stores/useSurveyStore";
import useCitationReportStore from "../../stores/useCitationReportStore";
import { Loader2, FileText, Lock, ChevronLeft, ChevronRight, Download, ChevronDown, Pencil, X, Check, Plus, Trash2 } from "lucide-react";
import { useBeforeUnload } from "react-router-dom";
import UnsavedChangesModal from "../../components/UnsavedChangesModal";
import FloatingHomeButton from "../../components/FloatingHomeButton";
import { useBrowserNavigationBlocker } from "../../hooks/useBrowserNavigationBlocker";
import useSurveyAccess from "../../hooks/useSurveyAccess";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";

const Citation = ({
  sectionData,
  surveyData,
  handleSurveyDataChange,
  setCurrentStep,
  isInvitedUser: isInvitedUserProp = () => false,
}) => {
  // Get surveyId for access check
  const surveyId = surveyData?.surveyId || surveyData?.id || surveyData?._id || localStorage.getItem('currentSurveyId');
  
  // Use the survey access hook to determine user access type
  const { isInvitedUser: isInvitedUserFromHook, isLoading: isAccessLoading } = useSurveyAccess(surveyId);
  
  // Use hook-based isInvitedUser, fall back to prop if hook is still loading
  const isInvitedUser = isAccessLoading ? isInvitedUserProp : isInvitedUserFromHook;

  const [isGenerating, setIsGenerating] = useState(false);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Citation report data state for preview
  const [citationReportData, setCitationReportData] = useState(null);
  
  // Accordion state for findings preview
  const [openAccordionItem, setOpenAccordionItem] = useState(null);
  
  // Edit state for findings
  const [editingFindingIndex, setEditingFindingIndex] = useState(null);
  const [editedFinding, setEditedFinding] = useState(null);

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

  // Citation Report Store
  const { saveCitationReport } = useCitationReportStore();

  // Check if survey is closed
  const isSurveyClosed = surveyData?.surveyClosed || 
                         surveyData?.surveyClosureSurvey?.surveyClosed || 
                         surveyData?.surveyClosureSurvey?.surveyCompleted ||
                         surveyData?.surveyCompleted || false;

  // Loading state for fetching citation report
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Fetch existing citation report on mount
  useEffect(() => {
    const fetchCitationReport = async () => {
      if (!surveyId) return;
      
      setIsLoadingReport(true);
      try {
        const response = await api.survey.viewCitationReport(surveyId);
        
        if ((response.success || response.status) && response.data) {
          const responseData = response.data;
          
          // The citationReport is an array - get the latest one (first item)
          const citationReportArray = responseData.citationReport;
          const latestReport = Array.isArray(citationReportArray) && citationReportArray.length > 0 
            ? citationReportArray[0] 
            : null;
          
          if (latestReport && latestReport.professionalFindings && latestReport.professionalFindings.length > 0) {
            setCitationReportData({
              totalFTags: latestReport.totalFTags || latestReport.professionalFindings.length,
              totalFindings: latestReport.totalFindings || latestReport.professionalFindings.length,
              surveyData: latestReport.surveyData || responseData.surveyData || null,
              professionalFindings: latestReport.professionalFindings,
              disclaimer: latestReport.disclaimer || null,
            });
          }
        }
      } catch (error) {
        // Silently fail - user can generate new report
        // console.error("Failed to fetch citation report:", error);
      } finally {
        setIsLoadingReport(false);
      }
    };

    fetchCitationReport();
  }, [surveyId]);

  // Download citation report as Word document
  const handleDownloadCitationReport = useCallback(() => {
    if (!citationReportData) {
      toast.error("No citation report data to download");
      return;
    }

    const { surveyData: surveyInfo, professionalFindings, totalFTags, totalFindings, disclaimer } = citationReportData;
    const facilityName = surveyInfo?.facilityId?.name || 'Facility';

    // Generate table of contents
    const tableOfContents = (professionalFindings || []).map((finding, index) => 
      `<p style="margin: 0.08in 0;">${index + 1}. ${finding.ftag?.toString().startsWith('F') ? finding.ftag : `F${finding.ftag}`} – ${finding.title || 'Finding'}</p>`
    ).join('');

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Citation Report - ${facilityName}</title>
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
          width: 16px;
          height: 16px;
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
          font-size: 14pt;
          font-weight: bold;
          color: #000;
          margin: 0.1in 0 0.05in 0;
        }
        .facility-name {
          font-size: 11pt;
          color: #333;
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
        .toc-item {
          margin: 0.06in 0 0.06in 0.3in;
          font-size: 11pt;
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
        
        /* Page break */
        .page-break {
          page-break-before: always;
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="doc-header">
        <div class="header-row">
          <img src="https://www.mocksurvey365.com/logo.png" alt="Logo" class="logo-img">
          <span class="company-name">MockSurvey365</span>
        </div>
        <p class="report-title">Citation Report</p>
        <p class="facility-name">${facilityName}</p>
        <div class="divider"></div>
      </div>

      <!-- Table of Contents -->
      <p class="toc-title">Table of Contents</p>
      ${tableOfContents}
      
      <div class="divider" style="margin-top: 0.3in;"></div>

      <!-- Citation Findings -->
      ${(professionalFindings || []).map((finding, index) => `
        <div class="ftag-header">${finding.ftag?.toString().startsWith('F') ? finding.ftag : `F${finding.ftag}`} – ${finding.title || ''}</div>
        
        <p class="section-label">Regulatory Requirement:</p>
        <p>${finding.regulatoryRequirement || 'N/A'}</p>
        
        <p class="section-label">Intent of the Regulation:</p>
        <p>${finding.intent || 'N/A'}</p>
        
        <p class="section-label">Deficiency Statement:</p>
        <p>${finding.deficiencyStatement || 'N/A'}</p>
        
        ${finding.detailedFindings && finding.detailedFindings.length > 0 ? `
          <p class="section-label">Findings:</p>
          <ul>
            ${finding.detailedFindings.map(detail => `<li>${detail}</li>`).join('')}
          </ul>
        ` : ''}
      `).join('')}

      ${disclaimer ? `
      <div class="divider" style="margin-top: 0.4in;"></div>
      <p class="section-label">Disclaimer:</p>
      <p style="font-size: 9pt; color: #666; font-style: italic;">${disclaimer}</p>
      ` : ''}
    </body>
    </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Citation_Report_${facilityName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Citation report downloaded successfully!');
  }, [citationReportData]);

  // Start editing a finding
  const handleStartEdit = (index) => {
    const finding = citationReportData.professionalFindings[index];
    setEditedFinding({
      ...finding,
      detailedFindings: finding.detailedFindings ? [...finding.detailedFindings] : [],
    });
    setEditingFindingIndex(index);
    setOpenAccordionItem(`item-${index}`);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingFindingIndex(null);
    setEditedFinding(null);
  };

  // Save edited finding
  const handleSaveEdit = () => {
    if (editingFindingIndex === null || !editedFinding) return;

    const updatedFindings = [...citationReportData.professionalFindings];
    updatedFindings[editingFindingIndex] = editedFinding;

    setCitationReportData({
      ...citationReportData,
      professionalFindings: updatedFindings,
    });

    setHasUnsavedChanges(true);
    setEditingFindingIndex(null);
    setEditedFinding(null);
    toast.success('Finding updated successfully!');
  };

  // Update edited finding field
  const handleEditField = (field, value) => {
    setEditedFinding((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Add a new detailed finding
  const handleAddDetailedFinding = () => {
    setEditedFinding((prev) => ({
      ...prev,
      detailedFindings: [...(prev.detailedFindings || []), ''],
    }));
  };

  // Update a detailed finding
  const handleUpdateDetailedFinding = (detailIndex, value) => {
    setEditedFinding((prev) => {
      const newDetailedFindings = [...prev.detailedFindings];
      newDetailedFindings[detailIndex] = value;
      return {
        ...prev,
        detailedFindings: newDetailedFindings,
      };
    });
  };

  // Remove a detailed finding
  const handleRemoveDetailedFinding = (detailIndex) => {
    setEditedFinding((prev) => ({
      ...prev,
      detailedFindings: prev.detailedFindings.filter((_, i) => i !== detailIndex),
    }));
  };

  // Check if citation report was previously generated (by checking surveyData)
  const hasPreviousReport = surveyData?.citationReportSurvey?.citationReportGenerated || false;

  // Generate final survey citations report
  const generateFinalCitationsReport = async () => {
    setIsGenerating(true);
    setShowGeneratingModal(true);

    try {
      // Use component-level surveyId
      const currentSurveyId = surveyId || localStorage.getItem("currentSurveyId");

      if (!currentSurveyId) {
        toast.error("Survey ID is required to generate citations report");
        setIsGenerating(false);
        setShowGeneratingModal(false);
        return;
      }

      // Call the API to generate final citations
      const response = await healthAssistantAPI.generateCitationReport(
        currentSurveyId
      );

      if ((response.success || response.status) && response.data) {
        // Store the full report data for preview and Word download (including disclaimer from response root)
      
        setCitationReportData({
          ...response.data,
          disclaimer: response.disclaimer || null,
        });

        const reportData = {
          citationReportGenerated: true,
          totalFTags: response.data.totalFTags || null,
          totalFindings: response.data.totalFindings || null,
          completedAt: new Date().toISOString(),
        };

        // Save to store for persistence across page refreshes
        saveCitationReport(currentSurveyId, reportData);

        // Mark as having unsaved changes
        setHasUnsavedChanges(true);

        // Store in survey data
        handleSurveyDataChange("citationReportSurvey", {
          ...surveyData.citationReportSurvey,
          ...reportData,
        });

        toast.success("Citation report generated successfully!");
      } else {
        throw new Error(response.message || "Failed to generate citations");
      }
    } catch (error) {
      
      toast.error(
        error.message ||
          "Failed to generate final citations report. Please try again."
      );
    } finally {
      setIsGenerating(false);
      setShowGeneratingModal(false);
    }
  };

  const handleContinueToExitConference = async (isContinueClicked = false) => {
    setIsSubmitting(true);
    try {
      // Use component-level surveyId
      const currentSurveyId = surveyId || localStorage.getItem("currentSurveyId");

      if (!currentSurveyId) {
        toast.error("Survey ID not found. Please refresh and try again.", {
          position: "top-right",
        });
        setIsSubmitting(false);
        return;
      }

      // Check if citation report has been generated
      const hasCitationReport = !!citationReportData;

      // Prepare citation report data in the API format
      const payload = {
        surveyId: currentSurveyId,
        status: "citation-report",
        citationReportGenerated: hasCitationReport,
        totalFTags: citationReportData?.totalFTags || 0,
        totalFindings: citationReportData?.totalFindings || 0,
        surveyData: citationReportData?.surveyData || null,
        professionalFindings: citationReportData?.professionalFindings || [],
        disclaimer: citationReportData?.disclaimer || null,
      };

      // Show loading toast
      toast.loading("Saving citation report...", { position: "top-right" });

      // Check if online before making API call
      if (!navigator.onLine) {
        // Save offline and inform user
        const saveOfflineData = async (offlinePayload) => {
          try {
            const offlineData = {
              ...offlinePayload,
              submittedAt: new Date().toISOString(),
              apiEndpoint: "submitCitationReport",
              apiMethod: "survey",
            };

            // Step 1: Save to IndexedDB sync queue (permanent storage)
            let syncQueueId = null;
            const stepId = "citation-report";
            const syncItem = await surveyIndexedDB.addToSyncQueue(
              currentSurveyId,
              stepId,
              offlineData,
              "api_citation_report"
            );
            syncQueueId = syncItem.id;

            // Step 2: Update Zustand store (UI state) with sync queue ID
            useSurveyStore.getState().setOfflineData({
              ...offlineData,
              syncQueueId,
            });

            // Step 3: If online, trigger sync attempt
            if (navigator.onLine) {
              surveySyncService.syncUnsyncedData(currentSurveyId).catch(() => {});
            }
          } catch (error) {
            // Still try to save to Zustand even if IndexedDB fails
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

      // Submit to API using the citation report endpoint (only if online)
      const response = await api.survey.submitCitationReport(payload);

      if (response.success || response.status) {
        // Clear unsaved changes flag
        setHasUnsavedChanges(false);

        // Update survey data with citation report data
        handleSurveyDataChange("citationReportSurvey", {
          ...surveyData.citationReportSurvey,
          citationReportGenerated: hasCitationReport,
          totalFTags: citationReportData?.totalFTags || 0,
          totalFindings: citationReportData?.totalFindings || 0,
          completedAt: new Date().toISOString(),
        });

        toast.dismiss();
        
        if (isContinueClicked) {
          toast.success("Citation report saved successfully! Moving to next step...", {
            position: "top-right",
            duration: 5000,
          });
          // Navigate to next step
          setCurrentStep(10);
        } else {
          toast.success("Progress saved successfully!", {
            position: "top-right",
            duration: 3000,
          });
        }
      } else {
        toast.dismiss();
        throw new Error(response.message || "Failed to save citation report");
      }
    } catch (error) {
      toast.dismiss();
      toast.error(
        error.message || "Failed to save citation report. Please try again.",
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
            {sectionData[8].title}
          </h2>
          {isSurveyClosed && (
            <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300 self-start sm:self-auto">
              <Lock className="w-3 h-3 mr-1" />
              Survey Closed
            </Badge>
          )}
        </div>
        <p className="text-gray-500 text-xs sm:text-sm leading-tight max-w-5xl">
          {sectionData[8].description}
        </p>
      </div> 

      {/* Confidentiality Notice */}
      <div className="border border-amber-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex items-start">
          <div className="flex-1">
            <h3 className="text-xs sm:text-sm font-medium text-red-800">
              Patient Confidentiality Notice
            </h3>
            <div className="mt-2 text-xs sm:text-sm text-amber-700">
              <p>
                This report contains sensitive resident information. Ensure
                proper handling and maintain confidentiality during the exit
                conference.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Generation Section */}
      <div className="bg-white rounded-2xl mb-6 sm:mb-8">
        <div className="space-y-4">
        
          {/* Loading State */}
          {isLoadingReport && (
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                <span className="text-sm text-gray-600">Loading citation report...</span>
              </div>
            </div>
          )}
        
          {/* Citation Report Generated Section */}
          {!isLoadingReport && citationReportData && (
            <div className="mb-4 sm:mb-6 space-y-4">
              {/* Report Summary Card */}
              <div className="bg-green-50 border border-green-600 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">
                      Citation Report Generated
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-700">
                      <div>
                        <strong>Total F-Tags:</strong> {citationReportData.totalFTags || 0}
                      </div>
                      <div>
                        <strong>Total Findings:</strong> {citationReportData.totalFindings || 0}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleDownloadCitationReport}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 h-auto flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline font-medium">Download Report</span>
                    <span className="sm:hidden font-medium">Download</span>
                  </Button>
                </div>
              </div>

              {/* Findings Preview Accordion */}
              <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
                  <h4 className="text-sm font-bold text-gray-900">
                    Citation Findings Preview
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">Click on any finding to view or edit details</p>
                </div>
                
                {(citationReportData.professionalFindings && citationReportData.professionalFindings.length > 0) ? (
                  <div className="w-full">
                    {citationReportData.professionalFindings.map((finding, index) => {
                      const isOpen = openAccordionItem === `item-${index}`;
                      const isEditing = editingFindingIndex === index;
                      const displayFinding = isEditing ? editedFinding : finding;
                      
                      return (
                        <div key={index} className="border-b border-gray-200 last:border-b-0">
                          <button
                            className="w-full px-4 py-3 hover:bg-gray-50 transition-colors"
                            onClick={() => setOpenAccordionItem(isOpen ? null : `item-${index}`)}
                          >
                            <div className="flex items-center justify-between gap-3 text-left">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <span className="shrink-0 px-2 py-1 bg-black text-white text-xs font-bold">
                                  {displayFinding.ftag?.toString().startsWith('F') ? displayFinding.ftag : `F${displayFinding.ftag}`}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-gray-900">{displayFinding.title}</p>
                                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                                    {displayFinding.deficiencyStatement}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {!isEditing && !isInvitedUser() && !isSurveyClosed && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 hover:bg-gray-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartEdit(index);
                                    }}
                                    title="Edit finding"
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-gray-600" />
                                  </Button>
                                )}
                                <ChevronDown className={`h-4 w-4 shrink-0 text-gray-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                              </div>
                            </div>
                          </button>
                          
                          {isOpen && (
                            <div className="px-4 pb-4 pt-0 bg-gray-50">
                              {isEditing ? (
                                // Edit Mode
                                <div className="space-y-4 pl-4 sm:pl-8">
                                  {/* Edit Actions */}
                                  <div className="flex items-center justify-end gap-2 pb-2 border-b border-gray-200">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-3 text-xs"
                                      onClick={handleCancelEdit}
                                    >
                                      <X className="h-3 w-3 mr-1" />
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                                      onClick={handleSaveEdit}
                                    >
                                      <Check className="h-3 w-3 mr-1" />
                                      Save Changes
                                    </Button>
                                  </div>

                                  {/* Title */}
                                  <div>
                                    <label className="text-xs font-bold text-gray-900 mb-1 block">
                                      TITLE
                                    </label>
                                    <Input
                                      value={editedFinding?.title || ''}
                                      onChange={(e) => handleEditField('title', e.target.value)}
                                      className="text-xs"
                                      placeholder="Enter finding title"
                                    />
                                  </div>

                                  {/* Deficiency Statement */}
                                  <div>
                                    <label className="text-xs font-bold text-gray-900 mb-1 block">
                                      DEFICIENCY STATEMENT
                                    </label>
                                    <Textarea
                                      value={editedFinding?.deficiencyStatement || ''}
                                      onChange={(e) => handleEditField('deficiencyStatement', e.target.value)}
                                      className="text-xs min-h-[80px]"
                                      placeholder="Enter deficiency statement"
                                    />
                                  </div>

                                  {/* Regulatory Requirement */}
                                  <div>
                                    <label className="text-xs font-bold text-gray-900 mb-1 block">
                                      REGULATORY REQUIREMENT
                                    </label>
                                    <Textarea
                                      value={editedFinding?.regulatoryRequirement || ''}
                                      onChange={(e) => handleEditField('regulatoryRequirement', e.target.value)}
                                      className="text-xs min-h-[80px]"
                                      placeholder="Enter regulatory requirement"
                                    />
                                  </div>

                                  {/* Intent */}
                                  <div>
                                    <label className="text-xs font-bold text-gray-900 mb-1 block">
                                      INTENT
                                    </label>
                                    <Textarea
                                      value={editedFinding?.intent || ''}
                                      onChange={(e) => handleEditField('intent', e.target.value)}
                                      className="text-xs min-h-[80px]"
                                      placeholder="Enter intent of the regulation"
                                    />
                                  </div>

                                  {/* Key Findings */}
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="text-xs font-bold text-gray-900">
                                        KEY FINDINGS
                                      </label>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-xs"
                                        onClick={handleAddDetailedFinding}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Finding
                                      </Button>
                                    </div>
                                    <div className="space-y-2">
                                      {(editedFinding?.detailedFindings || []).map((detail, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                          <span className="text-gray-500 mt-2.5 text-xs">•</span>
                                          <Textarea
                                            value={detail}
                                            onChange={(e) => handleUpdateDetailedFinding(i, e.target.value)}
                                            className="text-xs min-h-[60px] flex-1"
                                            placeholder="Enter finding detail"
                                          />
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleRemoveDetailedFinding(i)}
                                            title="Remove finding"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </Button>
                                        </div>
                                      ))}
                                      {(!editedFinding?.detailedFindings || editedFinding.detailedFindings.length === 0) && (
                                        <p className="text-xs text-gray-500 italic">No key findings added. Click "Add Finding" to add one.</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                // View Mode
                                <div className="space-y-3 pl-8">
                                  {/* Deficiency Statement */}
                                  <div>
                                    <p className="text-xs font-bold text-gray-900 mb-1">
                                      DEFICIENCY STATEMENT
                                    </p>
                                    <p className="text-xs text-gray-700 leading-relaxed">
                                      {finding.deficiencyStatement}
                                    </p>
                                  </div>

                                  {/* Regulatory Requirement */}
                                  {finding.regulatoryRequirement && (
                                    <div>
                                      <p className="text-xs font-bold text-gray-900 mb-1">
                                        REGULATORY REQUIREMENT
                                      </p>
                                      <p className="text-xs text-gray-700 leading-relaxed">
                                        {finding.regulatoryRequirement}
                                      </p>
                                    </div>
                                  )}

                                  {/* Intent */}
                                  {finding.intent && (
                                    <div>
                                      <p className="text-xs font-bold text-gray-900 mb-1">
                                        INTENT
                                      </p>
                                      <p className="text-xs text-gray-700 leading-relaxed">
                                        {finding.intent}
                                      </p>
                                    </div>
                                  )}

                                  {/* Key Findings */}
                                  {finding.detailedFindings?.length > 0 && (
                                    <div>
                                      <p className="text-xs font-bold text-gray-900 mb-1">
                                        KEY FINDINGS
                                      </p>
                                      <ul className="space-y-1">
                                        {finding.detailedFindings.map((detail, i) => (
                                          <li key={i} className="text-xs text-gray-700 leading-relaxed flex items-start gap-2">
                                            <span className="text-gray-500 mt-0.5">•</span>
                                            <span className="flex-1">{detail}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Edit button at bottom */}
                                  {!isInvitedUser() && !isSurveyClosed && (
                                    <div className="pt-3 border-t border-gray-200">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-3 text-xs"
                                        onClick={() => handleStartEdit(index)}
                                      >
                                        <Pencil className="h-3 w-3 mr-1" />
                                        Edit Finding
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-sm text-gray-500">No findings in this report</p>
                  </div>
                )}
              </div>

              {/* Disclaimer Section */}
              {citationReportData.disclaimer && (
                <div className="border border-amber-300 bg-amber-50 rounded-lg p-4">
                  <h4 className="text-xs font-bold text-amber-800 mb-2 uppercase tracking-wide">
                    Disclaimer
                  </h4>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    {citationReportData.disclaimer}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Generate Final Report Button */}
          <div className="flex justify-end pb-32 sm:pb-40">
            <Button
              onClick={generateFinalCitationsReport}
              disabled={isGenerating || isInvitedUser() || isSurveyClosed}
              className="w-full sm:w-auto bg-transparent border border-gray-300 hover:bg-gray-400 hover:text-white text-gray-700 px-4 sm:px-8 py-2 sm:py-3 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Generating Final Report...</span>
                  <span className="sm:hidden">Generating...</span>
                </>
              ) : (
                <>Generate Citations</>
              )}
            </Button>
          </div>
        </div>
      </div> 

      {/* Generating Report Modal */}
      {showGeneratingModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white border rounded-lg p-4 sm:p-6 w-full max-w-xs sm:w-64 shadow-lg">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-gray-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-700">
                Generating report...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Save Button */}
     {
      !isInvitedUser() && (
        <div className="fixed bottom-[100px]  right-6 z-40 flex flex-col items-end gap-2">
        <Button
          onClick={() => handleContinueToExitConference(false)}
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
      )
     }

      {/* Navigation Buttons */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 left-4 sm:left-auto z-40 flex gap-2 sm:gap-4">
        <Button
          onClick={() => {
            if (hasUnsavedChanges) {
              setPendingNavigation({ type: 'step', target: 8 });
              setShowExitWarning(true);
            } else {
              setCurrentStep(8);
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
                setPendingNavigation({ type: 'step', target: 10 });
                setShowExitWarning(true);
              } else {
                setCurrentStep(10);
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
            onClick={() => handleContinueToExitConference(true)}
            disabled={isSubmitting || isSurveyClosed}
            className="flex-1 sm:flex-none h-11 sm:h-12 px-4 sm:px-8 bg-[#075b7d] hover:bg-[#075b7d] text-white text-sm sm:text-base font-medium disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all"
            size="lg"
          >
            <span className="hidden sm:inline">Continue to Exit Conference</span>
            <span className="sm:hidden">Continue</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        )}
      </div>

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
          await handleContinueToExitConference(false);
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
        onSave={() => handleContinueToExitConference(false)}
        onClearUnsavedChanges={() => setHasUnsavedChanges(false)} 
      />
    </div>
  );
};

export default Citation;
