import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { DataTable } from "../components/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "../components/ui/alert-dialog";
import { surveyAPI, profileAPI } from "../service/api";
import { toast } from "sonner";
import {
  FileText,
  Loader2,
  Plus,
  ArrowUpDown,
  ArrowRight,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

const RiskBaseList = () => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState("All");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInvited, setIsInvited] = useState(false);
  const [localDateRange, setLocalDateRange] = useState({ startDate: '', endDate: '' });
  const [filters, setFilters] = useState({
    status: null,
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  // Get facility ID from localStorage
  const facilityId = useMemo(() => {
    const user = JSON.parse(localStorage.getItem("mocksurvey_user") || "{}");
    return user?.facility || "";
  }, []);

  // Determine survey status
  const getSurveyStatus = (survey) => {
    const status = survey?.status || "setup";
    if (status === "facility-initiated-survey") return "in-progress";
    return status;
  };

  // Check if user is invited
  useEffect(() => {
    const checkInvitedStatus = async () => {
      try {
        const profileResponse = await profileAPI.getProfile();
        if (profileResponse?.data) {
          setIsInvited(String(profileResponse.data.invited) === 'true' || profileResponse.data.invited === true);
        } else {
          const user = JSON.parse(localStorage.getItem("mocksurvey_user") || "{}");
          setIsInvited(String(user.invited) === 'true' || user.invited === true);
        }
      } catch (error) {
        const user = JSON.parse(localStorage.getItem("mocksurvey_user") || "{}");
        setIsInvited(String(user.invited) === 'true' || user.invited === true);
      }
    };
    checkInvitedStatus();
  }, []);

  // Fetch all risk-based surveys
  const fetchSurveys = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const startDateStr = filters.startDate || '';
      const endDateStr = filters.endDate || '';

      let response;
      if (isInvited) {
        response = await surveyAPI.getInvitedUsersSurveyRiskBasedList(
          facilityId,
          startDateStr,
          endDateStr
        );
      } else {
        response = await surveyAPI.getAllRiskBasedSetups(
          facilityId,
          startDateStr,
          endDateStr
        );
      }

      let allSurveys = [];
      
      // Extract surveys from nested data structure
      if (response?.data?.userSurveyList && Array.isArray(response.data.userSurveyList)) {
        allSurveys = response.data.userSurveyList;
      } else if (response?.data?.surveys && Array.isArray(response.data.surveys)) {
        allSurveys = response.data.surveys.map(item => item.surveyDetails);
      }

      // Apply status filter if set
      if (filters.status) {
        allSurveys = allSurveys.filter(survey => {
          const status = getSurveyStatus(survey);
          return status === filters.status;
        });
      }

      setSurveys(allSurveys);
      setPagination(prev => ({
        ...prev,
        total: allSurveys.length,
        totalPages: Math.ceil(allSurveys.length / prev.limit) || 1
      }));
    } catch (error) {
      setError("Failed to load surveys. Please try again.");
      toast.error("Failed to load surveys", {
        description: error.message || "Please try again later",
        position: "top-right",
      });
      setSurveys([]);
    } finally {
      setIsLoading(false);
    }
  }, [facilityId, isInvited, filters]);

  // Initial load
  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  // Stats
  const stats = useMemo(() => {
    const totalSurveys = surveys.length;
    const completedSurveys = surveys.filter(s => getSurveyStatus(s) === 'completed').length;
    const inProgressSurveys = surveys.filter(s => getSurveyStatus(s) === 'in-progress').length;
    const setupSurveys = surveys.filter(s => getSurveyStatus(s) === 'setup').length;

    return [
      {
        title: "Total Surveys",
        value: totalSurveys.toString(),
        change: 0,
        changeText: "available",
        trend: "up",
      },
      {
        title: "Completed",
        value: completedSurveys.toString(),
        change: completedSurveys > 0 ? 15 : 0,
        changeText: "completed",
        trend: completedSurveys > 0 ? "up" : "down",
      },
      {
        title: "Active Surveys",
        value: (setupSurveys + inProgressSurveys).toString(),
        change: setupSurveys + inProgressSurveys > 0 ? 5 : -5,
        changeText: "active",
        trend: setupSurveys + inProgressSurveys > 0 ? "up" : "down",
      },
    ];
  }, [surveys]);

  // Handle tab change
  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    
    const statusMap = {
      'All': null,
      'Completed': 'completed',
      'In Progress': 'in-progress',
      'Setup': 'setup',
    };
    
    setFilters(prev => ({
      ...prev,
      status: statusMap[tab]
    }));
    
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Handle view survey
  const handleViewSurvey = (survey) => {
    localStorage.setItem("currentSurveyId", survey._id);
    navigate(`/risk-based-survey?surveyId=${survey._id}`);
  };

  // Handle delete survey
  const handleDeleteClick = useCallback((survey) => {
    setSurveyToDelete(survey);
    setShowDeleteDialog(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!surveyToDelete) return;

    try {
      setIsDeleting(true);
      await surveyAPI.deleteRiskBasedSurvey(surveyToDelete._id);
      
      toast.success("Survey deleted successfully", {
        description: `"${surveyToDelete.facilityId?.name || 'Survey'}" has been removed.`,
        position: "top-right",
      });

      setSurveys((prev) => prev.filter((s) => s._id !== surveyToDelete._id));
    } catch (error) {
      toast.error("Failed to delete survey", {
        description: error.message || "Please try again later",
        position: "top-right",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setSurveyToDelete(null);
    }
  };

  // Handle filters
  const handleTableFiltersChange = (columnFilters) => {
    const findFirst = (id) => {
      const entry = columnFilters.find(f => f.id === id);
      if (!entry) return null;
      return Array.isArray(entry.value) ? (entry.value[0] || null) : (entry.value || null);
    };
    setFilters(prev => ({
      ...prev,
      status: findFirst('status'),
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleApplyFilters = () => {
    setFilters(prev => ({
      ...prev,
      startDate: localDateRange.startDate,
      endDate: localDateRange.endDate,
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      status: null,
      startDate: '',
      endDate: ''
    });
    setLocalDateRange({ startDate: '', endDate: '' });
    setSelectedTab('All');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handlePageSizeChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: newLimit, currentPage: 1 }));
  };

  // Paginated data
  const paginatedSurveys = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.limit;
    const end = start + pagination.limit;
    return surveys.slice(start, end);
  }, [surveys, pagination.currentPage, pagination.limit]);

  // Faceted filters
  const facetedFilters = useMemo(() => {
    const statusOptions = [
      { value: 'setup', label: 'Setup' },
      { value: 'in-progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
      { value: 'closed', label: 'Closed' },
    ];

    return [
      { column: 'status', title: 'Status', options: statusOptions },
    ];
  }, []);

  // Column definitions
  const columns = useMemo(
    () => [
      {
        id: "facilityId.name",
        accessorFn: (row) => row.facilityId?.name,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Facility
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                {row.original.facilityId?.name?.slice(0, 25) || 'Unknown Facility'}
              </div>
              <div className="text-[12px] sm:text-[13px] text-gray-500 truncate">
                {row.original.surveyCategory || 'Risk Based Survey'}
              </div>
              <div className="text-[12px] sm:text-[11px] text-gray-600 font-medium">
                Team Members: {row.original.teamMembers?.length || 0} • Created: {new Date(row.original.createdAt).toLocaleDateString('en-US')}
              </div>
              {row.original.teamCoordinator && (
                <div className="text-xs text-gray-500 truncate">
                  Coordinator: {row.original.teamCoordinator}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "surveyCategory",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hidden sm:flex"
          >
            Category
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-xs sm:text-sm capitalize hidden sm:block">
            <Badge variant="outline" className="text-xs">
              {row.original.surveyCategory || 'Risk Based'}
            </Badge>
          </div>
        ),
      },
      {
        accessorKey: "teamMembers",
        header: "Team",
        cell: ({ row }) => (
          <div className="text-xs sm:text-sm hidden md:block">
            {row.original.teamMembers?.length || 0} member{row.original.teamMembers?.length !== 1 ? 's' : ''}
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <span className="hidden sm:inline">Created Date</span>
            <span className="sm:hidden">Date</span>
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="text-xs sm:text-sm">
            {row.original.createdAt
              ? new Date(row.original.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              : 'N/A'}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const status = getSurveyStatus(row.original);
          const statusConfig = {
            setup: { color: "bg-purple-100 text-purple-800", label: "Setup" },
            completed: { color: "bg-green-100 text-green-800", label: "Completed" },
            "in-progress": { color: "bg-blue-100 text-blue-800", label: "In Progress" },
            closed: { color: "bg-gray-100 text-gray-800", label: "Closed" },
          };

          return (
            <Badge className={`${statusConfig[status]?.color || 'bg-gray-100 text-gray-800'} hover:${statusConfig[status]?.color} text-xs border-0`}>
              {statusConfig[status]?.label || status}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value.includes(getSurveyStatus(row.original));
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const survey = row.original;

          return (
            <div className="flex items-center justify-end gap-2 sm:gap-3">
              <button
                onClick={() => handleViewSurvey(survey)}
                className="text-[#075b7d] hover:text-[#064d63] font-medium hover:underline transition-colors duration-200 cursor-pointer border border-[#075b7d] rounded-md p-2 hover:bg-[#075b7d] hover:text-white"
                title="View Survey"
              >
                <ArrowRight className="w-4 h-4" />
              </button>

              {!isInvited && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(survey);
                  }}
                  className="text-red-600 hover:text-red-700 font-medium transition-colors duration-200 cursor-pointer border border-red-600 rounded-md p-2 hover:bg-red-600 hover:text-white"
                  title="Delete Survey"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [handleDeleteClick, isInvited]
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                Risk Based Process
              </h1>
            </div>
            <p className="text-gray-500 text-sm sm:text-base">
              Manage your risk-based process surveys and reviews.
            </p>
          </div>
          <div className="flex-shrink-0">
            {!isInvited && (
              <Button
                className="w-full sm:w-auto bg-[#075b7d] hover:bg-[#075b7d]/90 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-[8px] font-medium cursor-pointer text-sm sm:text-base"
                onClick={() => {
                  localStorage.removeItem("currentSurveyId");
                  localStorage.removeItem("riskBasedProcessSurveyId");
                  localStorage.removeItem("riskBasedProcessSetup");
                  localStorage.removeItem("riskBasedProcessTeamMembers");
                  localStorage.removeItem("riskBasedProcessTeamLeaders");
                  localStorage.removeItem("riskBasedProcessTeamLead");
                  navigate("/risk-based-process");
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Risk Based
              </Button>
            )}
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
                          stat.trend === "up" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {stat.trend === "up" ? "↗" : "↘"} {Math.abs(stat.change)}%
                      </span>
                      <span className="text-sm text-gray-500">{stat.changeText}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Survey List Section */}
        <div className="bg-white">
          <div className="border border-gray-200 rounded-lg">
            <div className="p-4 sm:p-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Risk Based Surveys
              </h2>
            </div>

            {/* Survey Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-b border-gray-200 p-4">
              <div className="w-full sm:w-auto overflow-x-auto">
                <div className="flex items-center bg-gray-100 border border-gray-200 rounded-[8px] min-w-fit">
                  {['All', 'Setup', 'In Progress', 'Completed'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTabChange(tab)}
                      className={`px-4 sm:px-6 lg:px-8 py-2.5 rounded-[8px] transition-all duration-200 text-sm font-medium cursor-pointer whitespace-nowrap ${
                        selectedTab === tab
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="p-2 sm:p-4">
              {isLoading ? (
                <div className="flex justify-center items-center py-12 sm:py-24">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-xs sm:text-sm text-gray-600">Loading surveys...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-red-500">{error}</div>
                </div>
              ) : surveys.length === 0 ? (
                <div className="text-center py-12 sm:py-24 px-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                  {filters.status || filters.startDate || filters.endDate ? (
                    <>
                      <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2 break-words">
                        No surveys found
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-6 break-words">
                        No surveys match your current filters. Try adjusting your filters or reset them to see all surveys.
                      </p>
                      <Button
                        onClick={handleResetFilters}
                        variant="outline"
                        className="text-xs sm:text-sm font-normal px-4 sm:px-6 h-9"
                      >
                        Reset Filters
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2 break-words">
                        Start your first risk-based review
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mb-6 break-words">
                        Create comprehensive risk-based process reviews to ensure facility compliance and quality of care.
                      </p>
                      {!isInvited && (
                        <Button
                          onClick={() => navigate("/risk-based-process")}
                          className="bg-[#075b7d] hover:bg-[#075b7d]/90 text-white text-xs sm:text-sm font-normal px-4 sm:px-6 h-9"
                        >
                          <span className="hidden sm:inline">Create Risk-Based Review</span>
                          <span className="sm:hidden">Create Review</span>
                        </Button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <>
                  <DataTable
                    columns={columns}
                    data={paginatedSurveys}
                    searchPlaceholder="Search by facility"
                    searchColumn="facilityId.name"
                    filters={facetedFilters}
                    dateRange={localDateRange}
                    onDateRangeChange={setLocalDateRange}
                    onFiltersChange={handleTableFiltersChange}
                    onApplyFilters={handleApplyFilters}
                    onResetFilters={handleResetFilters}
                    disablePagination={true}
                  />

                  {/* Pagination Controls */}
                  {pagination.totalPages > 1 || pagination.total > 0 ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 px-2 pt-4 border-t border-gray-200">
                      <div className="flex-1 text-xs sm:text-sm text-gray-600">
                        Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{" "}
                        {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of{" "}
                        {pagination.total} survey{pagination.total !== 1 ? 's' : ''}
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 lg:gap-8 w-full sm:w-auto">
                        <div className="flex items-center space-x-2">
                          <p className="text-xs sm:text-sm font-medium text-gray-700">Rows per page</p>
                          <Select
                            value={`${pagination.limit}`}
                            onValueChange={(value) => handlePageSizeChange(Number(value))}
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
            <AlertDialogTitle>Delete Risk-Based Survey</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this survey for{" "}
              <span className="font-medium text-gray-900">
                {surveyToDelete?.facilityId?.name || "this facility"}
              </span>
              ? This action cannot be undone.
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

export default RiskBaseList;
