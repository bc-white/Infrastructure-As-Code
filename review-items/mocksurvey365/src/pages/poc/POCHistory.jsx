import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { DataTable } from "../../components/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {  
  Calendar, 
  ArrowUpDown, 
  Plus, 
  Eye, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Download,
  RefreshCw,
  Loader2,
  MoreHorizontal,
  Trash2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "../../components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { toast } from "sonner";
import api from "../../service/api";

const POCHistory = () => {
  const navigate = useNavigate();
  
  // State for POC history data
  const [pocHistory, setPocHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pocToDelete, setPocToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  // Stats - dynamically calculated from API data
  const stats = useMemo(() => {
    const totalPocs = pagination.total || pocHistory.length;
    const withEducation = pocHistory.filter(p => p.education?.staffTraining || p.education?.leadershipBriefing).length;
    const recentPocs = pocHistory.filter(p => {
      const createdDate = new Date(p.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdDate >= weekAgo;
    }).length;
    
    return [
      {
        title: "Total POCs",
        value: totalPocs.toString(),
        change: 0,
        changeText: "available",
        trend: "up",
      },
      {
        title: "With Education",
        value: withEducation.toString(),
        change: withEducation > 0 ? 15 : 0,
        changeText: "with training",
        trend: withEducation > 0 ? "up" : "down",
      } 
    ];
  }, [pocHistory, pagination.total]);

  // Fetch POC history from API
  const fetchPocHistory = useCallback(async (isBackground = false) => {
    try {
      if (isBackground) {
        setIsSyncing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await api.survey.getMyPlanOfCorrections({
        page: pagination.currentPage,
        limit: pagination.limit
      });
      
      if (response.success && response.data) {
        // Handle nested data structure: data.planofcorrection
        const pocData = response.data.planofcorrection || response.data;
        setPocHistory(Array.isArray(pocData) ? pocData : []);
        
        // Update pagination from API response
        if (response.data.pagination) {
          setPagination(prev => ({
            ...prev,
            total: response.data.pagination.total || 0,
            totalPages: response.data.pagination.totalPages || 1,
            currentPage: response.data.pagination.currentPage || 1
          }));
        }
        
        if (isBackground) {
          toast.success("POC history synced successfully");
        }
      } 
    } catch (err) {
     
      setError("Failed to load POC history");
      if (!isBackground) {
        toast.error("Failed to load POC history");
      }
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [pagination.currentPage, pagination.limit]);

  // Load data on component mount
  useEffect(() => {
    fetchPocHistory();
  }, [fetchPocHistory]);

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handlePageSizeChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: newLimit, currentPage: 1 }));
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

  // Handle view POC details
  const handleViewDetails = useCallback((poc) => {
    if (!poc._id && !poc.id) {
      toast.error("Cannot view POC: Missing ID");
      return;
    }
    
    const pocId = poc._id || poc.id;
    
    // Navigate with ID in URL - Index.jsx will fetch the POC data
    navigate(`/plan-of-correction/add/${pocId}`);
  }, [navigate]);

  // Handle download POC as Word document
  const handleDownload = useCallback((poc) => {
    const summary = poc.summary || {};
    const pocs = poc.plansOfCorrection || [];

    if (!summary.executiveSummary && pocs.length === 0) {
      toast.error("No Plan of Correction data to download");
      return;
    }

    const facilityName = poc.createdBy?.organization || 'Facility';

    // Generate table of contents
    const tableOfContents = pocs.map((p, index) => 
      `<p style="margin: 0.08in 0;">${index + 1}. ${p.ftag} – ${p.regulation || 'Plan of Correction'}</p>`
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

      ${summary.timelineOverview ? `
        <p class="section-label">Timeline Overview:</p>
        <p>${summary.timelineOverview}</p>
      ` : ''}

      <!-- Detailed POCs -->
      ${pocs.map((p, index) => `
        <div class="ftag-header">F${p.ftag} – ${p.regulation || ''}</div>
        
        <p class="section-label">Responsible Person:</p>
        <p>${p.responsiblePerson || 'Not assigned'}</p>
        
        <p class="section-label">Compliance Date:</p>
        <p>${p.complianceDate || 'TBD'}</p>

        ${p.regulatoryReference ? `
          <p class="section-label">Regulatory Reference:</p>
          <p>${p.regulatoryReference}</p>
        ` : ''}
        
        <p class="section-label">Identification of Deficiency:</p>
        <p>${p.identification || 'No identification provided.'}</p>

        <p class="section-label">Corrective Action - Affected Residents:</p>
        <p>${p.correctiveActionAffected || 'No corrective action specified.'}</p>

        <p class="section-label">Corrective Action - Potential Residents:</p>
        <p>${p.correctiveActionPotential || 'No corrective action specified.'}</p>

        <p class="section-label">Systems Change:</p>
        <p>${p.systemsChange || 'No systems change specified.'}</p>

        <p class="section-label">Monitoring Plan:</p>
        <p>${p.monitoringPlan || 'No monitoring plan specified.'}</p>
      `).join('')}

      <!-- Disclaimer -->
      ${poc.disclaimer ? `
        <div>
          <p class="section-label">Disclaimer</p>
          <p class="disclaimer"> ${poc.disclaimer}</p>
        </div>
      ` : ''}
    </body>
    </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Plan_of_Correction_${facilityName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("POC document downloaded successfully");
  }, []);

  // Handle download Education PPT
  const handleDownloadEducation = useCallback((poc) => {
    const exportUrl = poc.education?.staffTraining?.exportUrl || 
                      poc.education?.leadershipBriefing?.exportUrl || 
                      poc.education?.customPresentation?.exportUrl;
    
    if (exportUrl) {
      window.open(exportUrl, "_blank");
      toast.success("Opening education presentation...");
    } else {
      toast.error("No education presentation available");
    }
  }, []);

  // Handle delete POC
  const handleDeleteClick = useCallback((poc) => {
    setPocToDelete(poc);
    setShowDeleteDialog(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!pocToDelete) return;

    try {
      setIsDeleting(true);
      await api.survey.deletePlanOfCorrection(pocToDelete._id || pocToDelete.id);
      
      toast.success("POC deleted successfully", {
        description: "The Plan of Correction has been removed.",
        position: "top-right",
      });

      setPocHistory((prev) => prev.filter((p) => (p._id || p.id) !== (pocToDelete._id || pocToDelete.id)));
      setPagination(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1)
      }));
    } catch (error) {
      toast.error("Failed to delete POC", {
        description: error.message || "Please try again later",
        position: "top-right",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setPocToDelete(null);
    }
  };

  // Column definitions for TanStack React Table
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
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2">
                {row.original.summary?.executiveSummary?.substring(0, 50) || 'No summary'}...
              </div>
              <div className="text-[12px] sm:text-[13px] text-gray-500">
                Est. Completion: {formatDate(row.original.summary?.estimatedCompletionDate)}
              </div>
              
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
              className="hidden sm:flex"
            >
              F-Tags
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="hidden sm:flex flex-wrap gap-1">
            {row.original.plansOfCorrection?.slice(0, 3).map((plan, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {plan.ftag}
              </Badge>
            ))}
            {row.original.plansOfCorrection?.length > 3 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Badge variant="outline" className="text-xs bg-gray-100 cursor-pointer hover:bg-gray-200">
                    +{row.original.plansOfCorrection.length - 3} more
                  </Badge>
                </PopoverTrigger>
                <PopoverContent className="w-auto max-w-xs p-3">
                  <div className="text-xs">
                    <p className="font-medium text-gray-900 mb-2">Additional F-Tags:</p>
                    <div className="flex flex-wrap gap-1">
                      {row.original.plansOfCorrection.slice(3).map((plan, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {plan.ftag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
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
            <div className="text-sm font-medium">
              {row.original.createdBy?.firstName} {row.original.createdBy?.lastName}
            </div>
            <div className="text-xs text-gray-500">
              {row.original.createdBy?.organization || 'N/A'}
            </div>
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
          <div className="text-xs sm:text-sm">
            <div>{formatDate(row.original.createdAt)}</div>
            <div className="text-xs text-gray-500 capitalize">
              {row.original.accessType?.toLowerCase()}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "education",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="hidden sm:flex"
            >
              Education
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const hasStaffTraining = row.original.education?.staffTraining;
          const hasLeadershipBriefing = row.original.education?.leadershipBriefing;
          const hasCustomPresentation = row.original.education?.customPresentation;
          
          return (
            <div className="hidden sm:flex flex-wrap gap-1">
              {hasStaffTraining && (
                <Badge className="bg-green-100 text-green-800 border-0 text-xs">
                  Staff
                </Badge>
              )}
              {hasLeadershipBriefing && (
                <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">
                  Leadership
                </Badge>
              )}
              {hasCustomPresentation && (
                <Badge className="bg-purple-100 text-purple-800 border-0 text-xs">
                  Custom
                </Badge>
              )}
              {!hasStaffTraining && !hasLeadershipBriefing && !hasCustomPresentation && (
                <span className="text-xs text-gray-400">None</span>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const poc = row.original;
          const hasEducation = poc.education?.staffTraining?.exportUrl || 
                               poc.education?.leadershipBriefing?.exportUrl || 
                               poc.education?.customPresentation?.exportUrl;
          
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleViewDetails(poc)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/plan-of-correction/add/${poc._id}`)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Edit POC
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload(poc)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download POC Report
                </DropdownMenuItem>
                {hasEducation && (
                  <DropdownMenuItem onClick={() => handleDownloadEducation(poc)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Download Education PPT
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => handleDeleteClick(poc)}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete POC
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [handleViewDetails, handleDownload, handleDownloadEducation, handleDeleteClick, navigate]
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Plan of Correction</h1>
            </div>
            <p className="text-gray-500 text-sm sm:text-base">
              Manage and track your Plan of Correction documents
            </p>
          </div>
          <div className="flex-shrink-0 flex gap-2">
           
            <Button
              className="bg-[#075b7d] hover:bg-[#075b7d] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-[8px] font-medium cursor-pointer text-sm sm:text-base"
              onClick={() => navigate('/plan-of-correction/add')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New POC
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-4 sm:p-6 border border-gray-200">
              <CardContent className="p-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
                      {stat.value}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-sm ${
                          stat.trend === "up"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {stat.trend === "up" ? "↗" : "↘"}{" "}
                        {Math.abs(stat.change)}%
                      </span>
                      <span className="text-sm text-gray-500">
                        {stat.changeText}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Data Table */}
        <div className="bg-white">
          <div className="border border-gray-200 rounded-lg">
           

            {/* Table Content */}
            <div className="p-2 sm:p-4">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-500">Loading POC history...</div>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-red-500">{error}</div>
                </div>
              ) : (
                <>
                  <DataTable
                    columns={columns}
                    data={pocHistory}
                    searchPlaceholder="Search POCs"
                    searchColumn="summary.executiveSummary"
                    disablePagination={true}
                  />
                  
                  {/* Custom Pagination */}
                  {pagination.totalPages > 1 || pagination.total > 0 ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 px-2 pt-4 border-t border-gray-200">
                      <div className="flex-1 text-xs sm:text-sm text-gray-600">
                        Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
                        {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of{" "}
                        {pagination.total} POC{pagination.total !== 1 ? 's' : ''}
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 lg:gap-8 w-full sm:w-auto">
                        <div className="flex items-center space-x-2">
                          <p className="text-xs sm:text-sm font-medium text-gray-700">Rows per page</p>
                          <Select
                            value={`${pagination.limit}`}
                            onValueChange={(value) => {
                              handlePageSizeChange(Number(value));
                            }}
                          >
                            <SelectTrigger className="h-8 w-[60px] sm:w-[70px]">
                              <SelectValue placeholder={pagination.limit} />
                            </SelectTrigger>
                            <SelectContent side="top">
                              {[10, 20, 30, 40, 50].map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`}>
                                  {pageSize}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex w-[100px] items-center justify-center text-xs sm:text-sm font-medium text-gray-700">
                          Page {pagination.currentPage} of {pagination.totalPages}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 sm:flex"
                            onClick={() => handlePageChange(1)}
                            disabled={pagination.currentPage === 1}
                          >
                            <span className="sr-only">Go to first page</span>
                            <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                          >
                            <span className="sr-only">Go to previous page</span>
                            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage >= pagination.totalPages}
                          >
                            <span className="sr-only">Go to next page</span>
                            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 sm:flex"
                            onClick={() => handlePageChange(pagination.totalPages)}
                            disabled={pagination.currentPage >= pagination.totalPages}
                          >
                            <span className="sr-only">Go to last page</span>
                            <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan of Correction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this Plan of Correction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default POCHistory;