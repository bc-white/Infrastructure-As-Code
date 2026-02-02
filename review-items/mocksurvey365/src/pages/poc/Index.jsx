import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { DataTable } from "../../components/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Download,
  Loader2,
  Plus,
  Eye,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Save
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import api from "../../service/api";

const PostSurveyActivities = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: pocIdFromUrl } = useParams();

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

  // State for POC list
  const [pocList, setPocList] = useState([]);
  const [pocListLoading, setPocListLoading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local state for storing data
  const [localData, setLocalData] = useState({
    facilityName: 'Sample Facility',
    ccn: '123456',
    surveyType: 'Standard Survey',
    surveyCreationDate: new Date().toLocaleDateString(),
    citations: [],
    investigations: [],
    planOfCorrection: null,
    education: {
      staffTraining: null,
      leadershipBriefing: null,
      customPresentation: null
    }
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

  // Fetch POC list on component mount
  useEffect(() => {
    fetchPocList();
  }, []);

  // Handle navigation state - load POC data from history page
  useEffect(() => {
    if (location.state?.viewPoc && location.state?.pocData) {
      const data = location.state.pocData;

      // Set the POC data in local state
      setLocalData(prev => ({
        ...prev,
        planOfCorrection: {
          ...data,
          _id: data._id,
          generatedData: data.plansOfCorrection || data.plans || data.generatedData,
        },
        education: {
          staffTraining: data.education?.staffTraining || null,
          leadershipBriefing: data.education?.leadershipBriefing || null,
          customPresentation: data.education?.customPresentation || null
        }
      }));

      // Set editable data for the form - use the full data object with summary and plansOfCorrection
      setEditablePocData({
        _id: data._id,
        summary: data.summary || {},
        plansOfCorrection: data.plansOfCorrection || data.plans || data.generatedData || [],
        education: data.education || {},
        disclaimer: data.disclaimer || null
      });

      // Set POC as generated so form shows
      setPocGenerated({
        ...data,
        _id: data._id
      });

      // Clear the state to prevent re-loading on navigation
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Fetch POC by ID from URL parameter
  useEffect(() => {
    const fetchPocById = async () => {
      if (!pocIdFromUrl) return;

      setPocListLoading(true);
      try {
        const response = await api.survey.viewMyPlanOfCorrection(pocIdFromUrl);
        if (response.success && response.data) {
          const data = response.data;

          // Set the POC data in local state (including _id for updates)
          setLocalData(prev => ({
            ...prev,
            planOfCorrection: {
              ...data,
              _id: data._id,
              generatedData: data.plansOfCorrection || data.plans || data.generatedData,
            },
            education: {
              staffTraining: data.education?.staffTraining || null,
              leadershipBriefing: data.education?.leadershipBriefing || null,
              customPresentation: data.education?.customPresentation || null
            }
          }));

          // Set editable data for the form - use the full data object with summary and plansOfCorrection
          setEditablePocData({
            _id: data._id,
            summary: data.summary || {},
            plansOfCorrection: data.plansOfCorrection || data.plans || data.generatedData || [],
            education: data.education || {},
            disclaimer: data.disclaimer || null
          });

          // Set POC as generated so form shows (include _id)
          setPocGenerated({
            ...data,
            _id: data._id
          });

          toast.success('Plan of Correction loaded successfully');
        } else {
          toast.error('Failed to load Plan of Correction');
        }
      } catch (error) {
       
        toast.error('Failed to load Plan of Correction');
      } finally {
        setPocListLoading(false);
      }
    };

    fetchPocById();
  }, [pocIdFromUrl]);

  // Function to fetch POC list
  const fetchPocList = async () => {
    setPocListLoading(true);
    try {
      const response = await api.survey.getMyPlanOfCorrections();
      if (response.success && response.data) {
        // Handle the nested data structure: data.planofcorrection
        const pocData = response.data.planofcorrection || response.data;
        setPocList(Array.isArray(pocData) ? pocData : []);
      } else {
        setPocList([]);
      }
    } catch (error) {

      toast.error('Failed to load Plan of Corrections');
      setPocList([]);
    } finally {
      setPocListLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle view POC details - fetches single POC from API and opens for viewing/editing
  const handleViewPoc = useCallback(async (poc) => {
    const pocId = poc._id || poc.id;

    if (!pocId) {
      toast.error('POC ID not found');
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading('Loading Plan of Correction...');

    try {
      // Fetch single POC from API
      const response = await api.survey.viewMyPlanOfCorrection(pocId);

      toast.dismiss(loadingToast);

      if (response.success && response.data) {
        const fetchedPoc = response.data;

        // Set the POC data to display in the editor (including disclaimer)
        const pocData = {
          summary: fetchedPoc.summary,
          plansOfCorrection: fetchedPoc.plansOfCorrection,
          disclaimer: fetchedPoc.disclaimer || null
        };

        // Set the editable data with disclaimer
        setEditablePocData(JSON.parse(JSON.stringify(pocData)));

        // Store POC info in local data, including education at the top level for UI access
        setLocalData(prev => ({
          ...prev,
          // Populate education at top level for UI components to access
          education: fetchedPoc.education || prev.education,
          planOfCorrection: {
            file: 'Loaded from history',
            generatedData: {
              data: {
                data: pocData
              }
            },
            apiMessage: "Plan of Correction loaded successfully",
            apiSuccess: true,
            generatedAt: fetchedPoc.createdAt,
            pocId: fetchedPoc._id,
            surveyId: fetchedPoc.surveyId,
            education: fetchedPoc.education
          },
          disclaimer: fetchedPoc.disclaimer || ''
        }));

        // Set pocGenerated to trigger the display
        setPocGenerated({
          data: {
            data: pocData
          }
        });

        toast.success(`POC loaded successfully`);
      } else {
        toast.error(response.message || 'Failed to load Plan of Correction');
      }
    } catch (error) {
      toast.dismiss(loadingToast);

      toast.error('Failed to load Plan of Correction. Please try again.');
    }
  }, []);

  // Handle download POC from list
  const handleDownloadPocFromList = useCallback(
    (poc) => {
      // Check for education/export URL in the POC data
      const exportUrl =
        poc.exportUrl || poc.educationUrl || poc.education?.exportUrl;

      if (exportUrl) {
        window.open(exportUrl, "_blank");
        toast.success("Opening POC document...");
        return;
      }

      // Fallback: Generate Word document from POC data (match POCHistory Word layout)
      const summary = poc.summary || {};
      const pocs = poc.plansOfCorrection || [];

      if (!summary.executiveSummary && pocs.length === 0) {
        toast.error("No Plan of Correction data to download");
        return;
      }

      const facilityName = poc.createdBy?.organization || "Facility";

      const tableOfContents = pocs
        .map(
          (p, index) =>
            `<p style="margin: 0.08in 0;">${index + 1}. ${p.ftag} – ${
              p.regulation || "Plan of Correction"
            }</p>`
        )
        .join("");

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
            .doc-header {
              margin-bottom: 0.2in;
            }
            .divider {
              border-top: 1px solid #000;
              margin: 0.1in 0 0.2in 0;
            }
            .toc-title {
              font-size: 11pt;
              font-weight: bold;
              margin: 0.2in 0 0.15in 0;
            }
            .ftag-header {
              color: #075b7d;
              font-size: 12pt;
              font-weight: bold;
              margin: 0.4in 0 0.15in 0;
              page-break-inside: avoid;
            }
            .section-label {
              font-size: 11pt;
              font-weight: bold;
              margin: 0.15in 0 0.05in 0;
            }
            p {
              margin: 0.05in 0;
              text-align: left;
            }
            ul {
              margin: 0.08in 0 0.08in 0.25in;
              padding-left: 0.2in;
            }
            li {
              margin: 0.05in 0;
            }
            .disclaimer {
              margin: 0.3in 0;
              padding: 0.15in;
              border: 1px solid #000;
              font-size: 9pt;
            }
          </style>
        </head>
        <body>
          <div class="doc-header">
            <img src="https://www.mocksurvey365.com/logo.png" alt="Logo" style="width: 20px; height: 20px;">
            <p class="ftag-header">${facilityName}</p>
            <div class="divider"></div>
          </div>

          <p class="toc-title">Table of Contents</p>
          ${tableOfContents}

          <div class="divider" style="margin-top: 0.3in;"></div>

          ${
            summary.executiveSummary
              ? `
            <div class="ftag-header">Executive Summary</div>
            <p>${summary.executiveSummary}</p>
          `
              : ""
          }

          ${
            summary.timelineOverview
              ? `
            <p class="section-label">Timeline Overview:</p>
            <p>${summary.timelineOverview}</p>
          `
              : ""
          }

          ${pocs
            .map(
              (p) => `
            <div class="ftag-header">F${p.ftag} – ${p.regulation || ""}</div>

            <p class="section-label">Responsible Person:</p>
            <p>${p.responsiblePerson || "Not assigned"}</p>

            <p class="section-label">Compliance Date:</p>
            <p>${p.complianceDate || "TBD"}</p>

            ${
              p.regulatoryReference
                ? `
              <p class="section-label">Regulatory Reference:</p>
              <p>${p.regulatoryReference}</p>
            `
                : ""
            }

            <p class="section-label">Identification of Deficiency:</p>
            <p>${p.identification || "No identification provided."}</p>

            <p class="section-label">Corrective Action - Affected Residents:</p>
            <p>${p.correctiveActionAffected || "No corrective action specified."}</p>

            <p class="section-label">Corrective Action - Potential Residents:</p>
            <p>${p.correctiveActionPotential || "No corrective action specified."}</p>

            <p class="section-label">Systems Change:</p>
            <p>${p.systemsChange || "No systems change specified."}</p>

            <p class="section-label">Monitoring Plan:</p>
            <p>${p.monitoringPlan || "No monitoring plan specified."}</p>
          `
            )
            .join("")}

         
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Plan_of_Correction_${formatDate(poc.createdAt)}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("POC document downloaded successfully");
    },
    [formatDate]
  );

  // Handle save POC
  const handleSavePoc = async () => {
    if (!editablePocData) {
      toast.error("No POC data to save");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("Saving Plan of Correction...", { position: 'top-right' });

    try {
      // Get survey ID from local data or localStorage
      const currentSurveyId = localData.planOfCorrection?.surveyId || localStorage.getItem('currentSurveyId');

      // Prepare the API payload format for Plan of Correction
      const payload = {
        surveyId: "",
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
        education: localData.education || {
          staffTraining: null,
          leadershipBriefing: null,
          customPresentation: null
        },
        disclaimer: editablePocData?.disclaimer || ""
      };

      // Submit to API using Plan of Correction endpoint
      const response = await api.survey.submitPlanOfCorrection(payload);

      if (response.success || response.status) {
        // Update local data with the saved info
        setLocalData(prev => ({
          ...prev,
          planOfCorrection: {
            ...prev.planOfCorrection,
            apiMessage: "Plan of Correction saved successfully",
            apiSuccess: true,
            savedAt: new Date().toISOString()
          }
        }));

        toast.success("Plan of Correction saved successfully!", {
          id: loadingToast,
          position: 'top-right',
          duration: 3000
        });

        // Refresh the POC list
        fetchPocList();
      } else {
        throw new Error(response.message || 'Failed to save Plan of Correction');
      }
    } catch (error) {
      toast.error(error.message || "Failed to save Plan of Correction. Please try again.", {
        id: loadingToast,
        position: 'top-right'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Column definitions for DataTable (TanStack React Table)
  const columns = useMemo(
    () => [
      {
        id: "summary.executiveSummary",
        accessorFn: (row) => row.summary?.executiveSummary,
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Summary
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="max-w-xs min-w-0">
            <div className="font-medium text-gray-900 line-clamp-2 text-sm">
              {row.original.summary?.executiveSummary?.substring(0, 100) || 'No summary'}...
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Est. Completion: {formatDate(row.original.summary?.estimatedCompletionDate)}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "plansOfCorrection",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              F-Tags
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.plansOfCorrection?.slice(0, 3).map((plan, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {plan.ftag}
              </Badge>
            ))}
            {row.original.plansOfCorrection?.length > 3 && (
              <Badge variant="outline" className="text-xs bg-gray-100">
                +{row.original.plansOfCorrection.length - 3} more
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "complianceDate",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              <span className="hidden sm:inline">Compliance Date</span>
              <span className="sm:hidden">Date</span>
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="text-sm font-medium flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(row.original.plansOfCorrection?.[0]?.complianceDate)}
          </div>
        ),
      },
      {
        accessorKey: "createdBy.firstName",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="hidden sm:flex"
            >
              Created By
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="hidden sm:block">
            <div className="text-sm font-medium">{row.original.createdBy?.firstName} {row.original.createdBy?.lastName}</div>
            <div className="text-xs text-gray-500">{row.original.createdBy?.organization || 'N/A'}</div>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Created
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div>
            <div className="text-sm">{formatDate(row.original.createdAt)}</div>
            <div className="text-xs text-gray-500 capitalize">{row.original.accessType?.toLowerCase()}</div>
          </div>
        ),
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const poc = row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => handleViewPoc(poc)}
                className="text-[#075b7d] hover:text-[#064d63] font-medium transition-colors duration-200 cursor-pointer border border-[#075b7d] rounded-md p-2 hover:bg-[#075b7d] hover:text-white"
                title="View POC Details"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDownloadPocFromList(poc)}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200 cursor-pointer border border-blue-600 rounded-md p-2 hover:bg-blue-600 hover:text-white"
                title="Download POC"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          );
        },
      },
    ],
    [handleViewPoc, handleDownloadPocFromList]
  );

  // Initialize editable POC data from local data if available
  useEffect(() => {
    const pocData = localData.planOfCorrection?.generatedData?.data?.data;
    if (pocData && !editablePocData) {
      setEditablePocData(JSON.parse(JSON.stringify(pocData)));
    }
  }, [localData.planOfCorrection, editablePocData]);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("mocksurvey_token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
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
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to get presentation parameters"
        );
      }

      const parameters = await response.json();
      return parameters;
    } catch (error) {
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
    const facilityName = localData.facilityName || "Facility";

    const tableOfContents = pocs
      .map(
        (p, index) =>
          `<p style="margin: 0.08in 0;">${index + 1}. ${p.ftag} – ${
            p.regulation || "Plan of Correction"
          }</p>`
      )
      .join("");

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
          .doc-header {
            margin-bottom: 0.2in;
          }
          .divider {
            border-top: 1px solid #000;
            margin: 0.1in 0 0.2in 0;
          }
          .toc-title {
            font-size: 11pt;
            font-weight: bold;
            margin: 0.2in 0 0.15in 0;
          }
          .ftag-header {
            color: #075b7d;
            font-size: 12pt;
            font-weight: bold;
            margin: 0.4in 0 0.15in 0;
            page-break-inside: avoid;
          }
          .section-label {
            font-size: 11pt;
            font-weight: bold;
            margin: 0.15in 0 0.05in 0;
          }
          p {
            margin: 0.05in 0;
            text-align: left;
          }
          .disclaimer {
            padding: 0.15in;
            font-style: italic;
            font-size: 9pt;
          }
        </style> 
      </head>
      <body>
        <div class="doc-header">
          <img src="https://www.mocksurvey365.com/logo.png" alt="Logo" style="width: 20px; height: 20px;">
          <p class="ftag-header">${facilityName}</p>
          <div class="divider"></div>
        </div>

        <p class="toc-title">Table of Contents</p>
        ${tableOfContents}

        <div class="divider" style="margin-top: 0.3in;"></div>

        ${
          summary.executiveSummary
            ? `
          <div class="ftag-header">Executive Summary</div>
          <p>${summary.executiveSummary}</p>
        `
            : ""
        }

        ${
          summary.timelineOverview
            ? `
          <p class="section-label">Timeline Overview:</p>
          <p>${summary.timelineOverview}</p>
        `
            : ""
        }

        ${pocs
          .map(
            (p) => `
          <div class="ftag-header">${p.ftag} – ${p.regulation || ""}</div>

          <p class="section-label">Responsible Person:</p>
          <p>${p.responsiblePerson || "Not assigned"}</p>

          <p class="section-label">Compliance Date:</p>
          <p>${p.complianceDate || "TBD"}</p>

          ${
            p.regulatoryReference
              ? `
            <p class="section-label">Regulatory Reference:</p>
            <p>${p.regulatoryReference}</p>
          `
              : ""
          }

          <p class="section-label">Identification of Deficiency:</p>
          <p>${p.identification || "No identification provided."}</p>

          <p class="section-label">Corrective Action - Affected Residents:</p>
          <p>${p.correctiveActionAffected || "No corrective action specified."}</p>

          <p class="section-label">Corrective Action - Potential Residents:</p>
          <p>${p.correctiveActionPotential || "No corrective action specified."}</p>

          <p class="section-label">Systems Change:</p>
          <p>${p.systemsChange || "No systems change specified."}</p>

          <p class="section-label">Monitoring Plan:</p>
          <p>${p.monitoringPlan || "No monitoring plan specified."}</p>
        `
          )
          .join("")}

${editablePocData.disclaimer ? `
        <div>
          <p class="section-label">Disclaimer</p>
          <p  class="disclaimer">${editablePocData.disclaimer}</p>
        </div>
        ` : ''}
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Plan_of_Correction_${new Date()
      .toISOString()
      .split("T")[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Plan of Correction downloaded successfully!");
  };

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
      const surveyId = localStorage.getItem("currentSurveyId") || 'sample-survey-id';

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

        // Store POC data in local data with full response
        setLocalData(prev => ({
          ...prev,
          planOfCorrection: {
            file: file.name,
            pdfUrl: pdfUrl,
            generatedData: pocResponse,
            apiMessage: pocResponse.message || "Plan of Correction processed successfully",
            apiSuccess: pocResponse.status,
            generatedAt: new Date().toISOString(),
          }
        }));

        // Check if the inner data exists
        if (innerData) {
          setPocGenerated(pocResponse);
          // Initialize editable data with disclaimer
          const normalizedData = {
            ...JSON.parse(JSON.stringify(innerData)),
            disclaimer: pocResponse.disclaimer || innerData.disclaimer || null,
          };
          setEditablePocData(normalizedData);
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


  return (
    <div className=" mx-auto">
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Plan Of Correction
            </h2>
            <p className="text-gray-500 text-sm leading-tight">
              Upload your CMS 2567 to generate an editable Plan of Correction.
            </p>
          </div>
          {/* Link to POC History */}
         <div className="flex flex-wrap items-center gap-4 mt-4 md:mt-0">
           <Button
            onClick={() => navigate('/plan-of-correction')}
            variant="outline"
            className="text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
          >
            Back to POC History
          </Button>
            {(editablePocData || pocGenerated || localData.planOfCorrection?.generatedData) && (
              <Button
                  variant="outline"
                  onClick={() => {
                    setPocGenerated(null);
                    setEditablePocData(null);
                    setLocalData(prev => ({
                      ...prev,
                      planOfCorrection: null,
                      education: {
                        staffTraining: null,
                        leadershipBriefing: null,
                        customPresentation: null
                      }
                    }));
                    setPocFile(null);
                  }}
                  className="text-white hover:text-gray-900 bg-sky-800"
                >

                  Start New POC
                </Button>
            )}
         </div>

        </div>

      </div>

      <div className="bg-white rounded-2xl">
        <div className="space-y-8">

          <div>
          

            <div>


              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors bg-white">
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

                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    className="text-gray-600 border-gray-600 hover:bg-gray-50 text-sm"
                    disabled={pocGenerating}
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
                      className="bg-[#075b7d] hover:bg-[#064d63] text-white text-sm"
                      disabled={pocGenerating}
                      onClick={() => handlePocUploadAndGenerate(pocFile)}
                    >
                      {pocGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Generate POC Analysis"
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
                    ) : localData.planOfCorrection?.file ? (
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
                        {localData.planOfCorrection.file} - Processed
                      </span>
                    ) : (
                      "No file selected"
                    )}
                  </p>
                </div>
              </div>

              {/* Show Generated POC Results */}
              {(pocGenerated || localData.planOfCorrection?.generatedData) && (
                <div className="mt-6 bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">
                      Plan of Correction Analysis Results
                    </h4>
                    {localData.planOfCorrection?.pdfUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(localData.planOfCorrection.pdfUrl, "_blank")}
                        className="text-gray-600 border-gray-300 hover:bg-gray-50 bg-[#075b7d] hover:bg-[#064d63] text-white"
                      >

                        View Original Document
                      </Button>
                    )}
                  </div>

                  {/* API Message */}
                  {localData.planOfCorrection?.apiMessage && (
                    <div className={`mb-4 p-4 rounded-lg border ${localData.planOfCorrection.apiSuccess
                        ? 'bg-green-50 border-green-200'
                        : 'bg-yellow-50 border-yellow-200'
                      }`}>
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 ${localData.planOfCorrection.apiSuccess
                            ? 'text-green-600'
                            : 'text-yellow-600'
                          }`}>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className={`text-sm font-medium ${localData.planOfCorrection.apiSuccess
                              ? 'text-green-800'
                              : 'text-yellow-800'
                            }`}>
                            {localData.planOfCorrection.apiMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons - Download only, Save is floating */}
                  {editablePocData && (
                    <div className="flex items-center justify-end gap-3 mb-4">
                      <Button
                        onClick={handleDownloadPoc}
                        className="bg-[#075b7d] hover:bg-[#064d63] text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download as Word
                      </Button>
                    </div>
                  )}

                  {/* Floating Save Button - Fixed on right side */}
                  {editablePocData && (
                    <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50">
                      <Button
                        onClick={handleSavePoc}
                        disabled={isSubmitting}
                        className="bg-[#075b7d] hover:bg-[#064d63] text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12 px-4 md:px-6 rounded-full md:rounded-lg"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 md:mr-2 animate-spin" />
                            <span className="hidden md:inline">Saving...</span>
                          </>
                        ) : (
                          <>
                          
                            <span className="hidden md:inline">Save POC</span>
                          </>
                        )}
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
                            className="w-full mt-4 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] min-h-[120px] text-sm resize-y"
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
                                        {poc.ftag}
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
                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
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
                                      className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-y bg-white min-h-[80px]"
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
                                        className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-y bg-white min-h-[100px]"
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
                                        className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-y bg-white min-h-[100px]"
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
                                      className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-y bg-white min-h-[100px]"
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
                                      className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-y bg-white min-h-[80px]"
                                    />
                                  </div>
                                </div>
                              </details>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (pocGenerated?.data?.data || localData.planOfCorrection?.generatedData?.data?.data) ? (
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      {(() => {
                        const pocData = pocGenerated?.data?.data || localData.planOfCorrection?.generatedData?.data?.data;
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

                    {/* Disclaimer Section */}
                      {editablePocData.disclaimer && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                          <div className="flex items-start">
                           
                            <div>
                              <h4 className="text-sm font-semibold text-amber-800 mb-1"> Disclaimer</h4>
                              <p className="text-sm text-amber-700 leading-relaxed">
                                {editablePocData.disclaimer}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                  <p className="text-xs text-gray-500 mt-3">
                    Processed on:{" "}
                    {new Date(
                      localData.planOfCorrection?.generatedAt || Date.now()
                    ).toLocaleString()}
                  </p>
                </div>
              )}
            </div>


            {/* Education & Training Presentations */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6 mt-10 flex items-center">
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
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select cards..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px] overflow-y-auto">
                            {/* Support 1-20 cards */}
                            {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
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
                            localData.education?.staffTraining
                              ?.includeCitations || false
                          }
                          onChange={(e) =>
                            setLocalData(prev => ({
                              ...prev,
                              education: {
                                ...prev.education,
                                staffTraining: {
                                  ...prev.education?.staffTraining,
                                  includeCitations: e.target.checked,
                                },
                              },
                            }))
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          Include citation details
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={
                            localData.education?.staffTraining
                              ?.includeBestPractices || false
                          }
                          onChange={(e) =>
                            setLocalData(prev => ({
                              ...prev,
                              education: {
                                ...prev.education,
                                staffTraining: {
                                  ...prev.education?.staffTraining,
                                  includeBestPractices: e.target.checked,
                                },
                              },
                            }))
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          Include best practices
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={
                            localData.education?.staffTraining
                              ?.includeActionItems || false
                          }
                          onChange={(e) =>
                            setLocalData(prev => ({
                              ...prev,
                              education: {
                                ...prev.education,
                                staffTraining: {
                                  ...prev.education?.staffTraining,
                                  includeActionItems: e.target.checked,
                                },
                              },
                            }))
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          Include action items
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={async () => {
                        try {
                          // Build detailed input text for the presentation
                          let inputText = `Create a comprehensive staff training presentation for ${localData.facilityName
                            }.

Survey Overview:
- Survey Type: ${localData.surveyType}
- Survey Date: ${localData.surveyCreationDate}
- Total Investigations: ${localData.investigations?.length || 0}
- Compliance Status: Non-Compliance`;

                          // Add citations if selected
                          if (
                            localData.education?.staffTraining
                              ?.includeCitations &&
                            localData.citations?.length > 0
                          ) {
                            inputText += `\n\nKey Citations:\n`;
                            localData.citations.forEach((citation) => {
                              inputText += `- ${citation.fFlag}: ${citation.deficiency} (${citation.severity})\n`;
                            });
                          }

                          // Add best practices if selected
                          if (
                            localData.education?.staffTraining
                              ?.includeBestPractices
                          ) {
                            inputText += `\n\nBest Practices:
- Maintain comprehensive documentation
- Implement regular staff training programs
- Conduct routine quality assessments
- Establish clear communication protocols`;
                          }

                          // Add action items if selected
                          if (
                            localData.education?.staffTraining
                              ?.includeActionItems
                          ) {
                            inputText += `\n\nAction Items:
- Review and update policies
- Schedule staff training sessions
- Implement monitoring systems
- Establish quality improvement processes`;
                          }

                          // Create presentation using the user-selected options
                          const result = await createPresentation({
                            inputText: inputText,
                            textMode: presentationOptions.textMode,
                            format: presentationOptions.format,
                            themeName: presentationOptions.themeName,
                            numCards: parseInt(presentationOptions.numCards),
                            cardSplit: presentationOptions.cardSplit,
                            exportAs: presentationOptions.exportAs,
                            additionalInstructions:
                              "Make the presentation clear, professional, and easy to understand for facility staff. Focus on actionable insights and compliance requirements.",
                            textOptions: {
                              amount: "detailed",
                              tone: "professional, educational",
                              audience:
                                "facility staff, healthcare professionals",
                              language: presentationOptions.language,
                            },
                            imageOptions: {
                              source: presentationOptions.imageSource,
                              model: presentationOptions.imageModel,
                              style: "professional",
                            },
                            cardOptions: {
                              dimensions: presentationOptions.cardDimensions,
                            },
                          });

                          if (result.success && result.generationId) {
                            const presentationData =
                              result.presentationData?.data;

                            toast.success(
                              "Staff training presentation created successfully!"
                            );

                            // Store presentation reference with all URLs and metadata
                            setLocalData(prev => ({
                              ...prev,
                              education: {
                                ...prev.education,
                                staffTraining: {
                                  ...prev.education?.staffTraining,
                                  generationId: result.generationId,
                                  gammaUrl: presentationData?.gammaUrl,
                                  exportUrl: presentationData?.exportUrl,
                                  status: presentationData?.status || "completed",
                                  credits: presentationData?.credits,
                                  createdAt: new Date().toISOString(),
                                  message: result.message,
                                },
                              }
                            }));

                            // Don't auto-open - let user preview/download manually
                            toast.success("Presentation ready! Use the Preview or Download buttons below.", {
                              duration: 5000
                            });
                          } else {
                            throw new Error("Failed to get generation ID");
                          }
                        } catch (error) {
                          toast.error(
                            "Failed to create presentation. Please try again."
                          );
                        }
                      }}
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
                            localData.education?.leadershipBriefing
                              ?.includeStrategicImplications || false
                          }
                          onChange={(e) =>
                            setLocalData(prev => ({
                              ...prev,
                              education: {
                                ...prev.education,
                                leadershipBriefing: {
                                  ...prev.education?.leadershipBriefing,
                                  includeStrategicImplications: e.target.checked,
                                },
                              },
                            }))
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          Include strategic implications
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={
                            localData.education?.leadershipBriefing
                              ?.includeComplianceTimeline || false
                          }
                          onChange={(e) =>
                            setLocalData(prev => ({
                              ...prev,
                              education: {
                                ...prev.education,
                                leadershipBriefing: {
                                  ...prev.education?.leadershipBriefing,
                                  includeComplianceTimeline: e.target.checked,
                                },
                              },
                            }))
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          Include compliance timeline
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={
                            localData.education?.leadershipBriefing
                              ?.includeResourceRequirements || false
                          }
                          onChange={(e) =>
                            setLocalData(prev => ({
                              ...prev,
                              education: {
                                ...prev.education,
                                leadershipBriefing: {
                                  ...prev.education?.leadershipBriefing,
                                  includeResourceRequirements: e.target.checked,
                                },
                              },
                            }))
                          }
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          Include resource requirements
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={async () => {
                        try {
                          // Build detailed input text for executive summary
                          let inputText = `Create an executive leadership briefing presentation for ${localData.facilityName
                            }.

Executive Summary:
- Facility CCN: ${localData.ccn}
- Survey Type: ${localData.surveyType}
- Survey Date: ${localData.surveyCreationDate}
- Compliance Status: Non-Compliance
- Certification Status: Not Certified
- Total Citations: ${localData.citations?.length || 0}`;

                          // Add strategic implications if selected
                          if (
                            localData.education?.leadershipBriefing
                              ?.includeStrategicImplications
                          ) {
                            inputText += `\n\nStrategic Implications:
- Impact on facility operations and resource allocation
- Quality improvement initiatives required
- Compliance monitoring systems implementation
- Long-term strategic planning requirements`;
                          }

                          // Add compliance timeline if selected
                          if (
                            localData.education?.leadershipBriefing
                              ?.includeComplianceTimeline
                          ) {
                            inputText += `\n\nCompliance Timeline:
- Immediate actions (0-30 days): Critical citation resolution
- Short-term improvements (30-90 days): Policy updates and staff training
- Long-term strategic changes (90+ days): System improvements and quality initiatives
- Ongoing monitoring and continuous assessment`;
                          }

                          // Add resource requirements if selected
                          if (
                            localData.education?.leadershipBriefing
                              ?.includeResourceRequirements
                          ) {
                            inputText += `\n\nResource Requirements:
- Staff training and professional development programs
- Technology and system infrastructure upgrades
- Policy and procedure comprehensive updates
- Quality assurance and monitoring systems`;
                          }

                          // Create presentation using the user-selected options
                          const result = await createPresentation({
                            inputText: inputText,
                            textMode: presentationOptions.textMode,
                            format: presentationOptions.format,
                            themeName: presentationOptions.themeName,
                            numCards: parseInt(presentationOptions.numCards),
                            cardSplit: presentationOptions.cardSplit,
                            exportAs: presentationOptions.exportAs,
                            additionalInstructions:
                              "Make this an executive-level presentation focusing on strategic implications, high-level overview, and actionable recommendations for leadership decision-making.",
                            textOptions: {
                              amount: "detailed",
                              tone: "professional, executive",
                              audience:
                                "facility leadership, executives, board members",
                              language: presentationOptions.language,
                            },
                            imageOptions: {
                              source: presentationOptions.imageSource,
                              model: presentationOptions.imageModel,
                              style: "professional",
                            },
                            cardOptions: {
                              dimensions: presentationOptions.cardDimensions,
                            },
                          });

                          if (result.success && result.generationId) {
                            const presentationData =
                              result.presentationData?.data;

                            toast.success(
                              "Leadership briefing created successfully!"
                            );

                            // Store presentation reference with all URLs and metadata
                            setLocalData(prev => ({
                              ...prev,
                              education: {
                                ...prev.education,
                                leadershipBriefing: {
                                  ...prev.education?.leadershipBriefing,
                                  generationId: result.generationId,
                                  gammaUrl: presentationData?.gammaUrl,
                                  exportUrl: presentationData?.exportUrl,
                                  status: presentationData?.status || "completed",
                                  credits: presentationData?.credits,
                                  createdAt: new Date().toISOString(),
                                  message: result.message,
                                },
                              }
                            }));

                            // Don't auto-open - let user preview/download manually
                            toast.success("Presentation ready! Use the Preview or Download buttons below.", {
                              duration: 5000
                            });
                          } else {
                            throw new Error("Failed to get generation ID");
                          }
                        } catch (error) {
                          toast.error(
                            "Failed to create presentation. Please try again."
                          );
                        }
                      }}
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
                          localData.education?.customPresentation?.title || ""
                        }
                        onChange={(e) =>
                          setLocalData(prev => ({
                            ...prev,
                            education: {
                              ...prev.education,
                              customPresentation: {
                                ...prev.education?.customPresentation,
                                title: e.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Target Audience
                      </Label>
                      <Select
                        value={
                          localData.education?.customPresentation?.audience || ""
                        }
                        onValueChange={(value) =>
                          setLocalData(prev => ({
                            ...prev,
                            education: {
                              ...prev.education,
                              customPresentation: {
                                ...prev.education?.customPresentation,
                                audience: value,
                              },
                            },
                          }))
                        }
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
                                localData.education?.customPresentation?.focusAreas?.includes(
                                  focus
                                ) || false
                              }
                              onChange={(e) => {
                                const currentFocusAreas =
                                  localData.education?.customPresentation
                                    ?.focusAreas || [];
                                const updatedFocusAreas = e.target.checked
                                  ? [...currentFocusAreas, focus]
                                  : currentFocusAreas.filter(
                                    (area) => area !== focus
                                  );

                                setLocalData(prev => ({
                                  ...prev,
                                  education: {
                                    ...prev.education,
                                    customPresentation: {
                                      ...prev.education?.customPresentation,
                                      focusAreas: updatedFocusAreas,
                                    },
                                  },
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{focus}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={async () => {
                        try {
                          if (
                            !localData.education?.customPresentation?.title ||
                            !localData.education?.customPresentation?.audience
                          ) {
                            toast.error(
                              "Please provide a title and select an audience"
                            );
                            return;
                          }

                          // Build custom presentation input text based on focus areas
                          const focusAreas =
                            localData.education.customPresentation.focusAreas ||
                            [];
                          const audience =
                            localData.education.customPresentation.audience;

                          let inputText = localData.education.customPresentation.title

                          // Create presentation using the user-selected options
                          const result = await createPresentation({
                            inputText: inputText,
                            textMode: presentationOptions.textMode,
                            format: presentationOptions.format,
                            themeName: presentationOptions.themeName,
                            numCards:
                              focusAreas.length > 5
                                ? 12
                                : parseInt(presentationOptions.numCards),
                            cardSplit: presentationOptions.cardSplit,
                            exportAs: presentationOptions.exportAs,
                            additionalInstructions: `Create a custom presentation tailored for ${audience}. Focus on the selected areas: ${focusAreas.join(
                              ", "
                            )}. Make it clear, actionable, and relevant to the audience.`,
                            textOptions: {
                              amount: "detailed",
                              tone: "professional, informative",
                              audience: audience,
                              language: presentationOptions.language,
                            },
                            imageOptions: {
                              source: presentationOptions.imageSource,
                              model: presentationOptions.imageModel,
                              style: "professional",
                            },
                            cardOptions: {
                              dimensions: presentationOptions.cardDimensions,
                            },
                          });

                          if (result.success && result.generationId) {
                            const presentationData =
                              result.presentationData?.data;

                            toast.success(
                              "Custom presentation created successfully!"
                            );

                            // Store presentation reference with all URLs and metadata
                            setLocalData(prev => ({
                              ...prev,
                              education: {
                                ...prev.education,
                                customPresentation: {
                                  ...prev.education?.customPresentation,
                                  generationId: result.generationId,
                                  gammaUrl: presentationData?.gammaUrl,
                                  exportUrl: presentationData?.exportUrl,
                                  status: presentationData?.status || "completed",
                                  credits: presentationData?.credits,
                                  createdAt: new Date().toISOString(),
                                  message: result.message,
                                },
                              }
                            }));

                            // Don't auto-open - let user preview/download manually
                            toast.success("Presentation ready! Use the Preview or Download buttons below.", {
                              duration: 5000
                            });
                          } else {
                            throw new Error("Failed to get generation ID");
                          }
                        } catch (error) {
                          toast.error(
                            "Failed to create presentation. Please try again."
                          );
                        }
                      }}
                      disabled={
                        !localData.education?.customPresentation?.title ||
                        !localData.education?.customPresentation?.audience
                      }
                      className="w-fit hover:bg-gray-50 mt-4"
                      variant="outline"
                    >
                      Create Custom Presentation
                    </Button>
                  </div>
                </div>

                {/* Created Presentations */}
                {(localData.education?.staffTraining?.generationId ||
                  localData.education?.leadershipBriefing?.generationId ||
                  localData.education?.customPresentation?.generationId) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Created Presentations
                      </h4>
                      <div className="space-y-3">
                        {/* Staff Training Presentation */}
                        {localData.education?.staffTraining?.generationId && (
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
                              {localData.education.staffTraining.exportUrl && (
                                <Button
                                  onClick={() =>
                                    window.open(
                                      localData.education.staffTraining.exportUrl,
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
                              {localData.education.staffTraining.exportUrl && (
                                <Button
                                  onClick={() => {
                                    window.open(
                                      localData.education.staffTraining.exportUrl,
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
                        {localData.education?.leadershipBriefing?.generationId && (
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
                              {localData.education.leadershipBriefing.exportUrl && (
                                <Button
                                  onClick={() =>
                                    window.open(
                                      localData.education.leadershipBriefing
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
                              {localData.education.leadershipBriefing
                                .exportUrl && (
                                  <Button
                                    onClick={() => {
                                      window.open(
                                        localData.education.leadershipBriefing
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
                        {localData.education?.customPresentation?.generationId && (
                          <div className="p-3 bg-white rounded border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="text-sm text-gray-700 font-medium">
                                  {localData.education.customPresentation.title ||
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
                                  surveyData.education.customPresentation
                                    .credits.remaining
                                }{" "}
                                remaining
                              </p>
                            )} */}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {localData.education.customPresentation.exportUrl && (
                                <Button
                                  onClick={() =>
                                    window.open(
                                      localData.education.customPresentation
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
                              {localData.education.customPresentation
                                .exportUrl && (
                                  <Button
                                    onClick={() => {
                                      window.open(
                                        localData.education.customPresentation
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
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Generation Loading Modal */}
      {showGenerationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl border border-gray-200">
            <div className="flex flex-col items-center">
              {/* Animated loader */}
              <div className="relative mb-6">
                <div className="w-24 h-24 border-4 border-gray-200 rounded-full"></div>
                <div className="w-24 h-24 border-4 border-[#075b7d] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Generating Presentation
              </h3>

              {/* Stage indicator */}
              <div className="mb-4 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-2"></div>
                  <span className="text-sm font-medium text-blue-800 capitalize">
                    {generationProgress.stage}
                  </span>
                </div>
              </div>

              {/* Progress Message */}
              <p className="text-sm text-gray-600 text-center mb-4">
                {generationProgress.message}
              </p>

              {/* Progress Stats */}
              <div className="w-full bg-gray-100 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-[#075b7d]">{Math.floor(generationProgress.elapsedTime)}s</p>
                    <p className="text-xs text-gray-600">Elapsed Time</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#075b7d]">{generationProgress.attempts}</p>
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
    </div>
  );
};

export default PostSurveyActivities;
