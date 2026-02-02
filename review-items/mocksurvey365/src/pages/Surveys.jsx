import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { DataTable } from "../components/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAuth } from "../contexts/AuthContext";
import { Calendar, ArrowUpDown, Trash2, Edit, Plus, Eye, ArrowRight, FileText, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { surveyAPI, facilityAPI } from "../service/api";
import { switchToSurvey, clearSurveyStorage } from "../utils/surveyStorageIndexedDB";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

const Surveys = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("30 days");
  const [selectedTab, setSelectedTab] = useState("All");
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    facility: null,
    category: null,
    status: null,
    startDate: '',
    endDate: ''
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [surveyToDelete, setSurveyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [downloadingNotes, setDownloadingNotes] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10
  });

  const timePeriods = ["12 months", "30 days", "7 days", "24 hours"];

  // Helper function to determine if user is an invited user
  const isInvitedUser = () => {
    if (!user) return false;
    
    // Check if user has the invited flag set to "true" (string) or true (boolean)
    return user.invited === "true" || user.invited === true;
  };

  // Survey-focused stats - dynamically calculated from API data
  const stats = useMemo(() => {
    // Use pagination total for accurate count across all pages
    const totalSurveys = pagination.total || surveys.length;
    const completedSurveys = surveys.filter(s => s.status === 'completed').length;
    const inProgressSurveys = surveys.filter(s => s.status === 'in-progress').length; 
    const setupSurveys = surveys.filter(s => s.status === 'setup').length;
    
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
  }, [surveys, user, pagination.total]);

  // Load surveys from API
  const loadSurveys = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Prepare filters with pagination
      const filtersWithPagination = {
        ...filters,
        page: pagination.currentPage,
        limit: pagination.limit
      };
      
      // Fetch surveys from single endpoint
      const response = await surveyAPI.getUserSurveyList(filtersWithPagination);
      
      let allSurveys = [];
      let totalCount = 0;
      let maxTotalPages = 1;

      // Process Surveys
      const surveyList = response?.data?.surveyData || response?.data?.userSurveyList;
      
      if (response?.status && surveyList) {
        allSurveys = surveyList;
        
        // Extract pagination info
        if (response.data?.pagination) {
          totalCount = response.data.pagination.total || 0;
          maxTotalPages = response.data.pagination.totalPages || 1;
        } else {
          totalCount = allSurveys.length;
        }
      }

      setSurveys(allSurveys);
      
      // Update pagination state
      setPagination(prev => ({
        ...prev,
        // Use the max total pages to allow navigation through the longer list
        totalPages: maxTotalPages,
        total: totalCount,
        // Keep current page
        currentPage: prev.currentPage
      }));

    } catch (err) {
     
      setError('Failed to load surveys. Please try again.');
      setSurveys([]);
      setPagination(prev => ({ ...prev, total: 0, totalPages: 1, currentPage: 1 }));
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.limit]);

  // Load surveys on component mount and when filters change or user changes
  useEffect(() => {
    if (user) {
      loadSurveys();
    }
  }, [user, loadSurveys]);

  // Load filter options (facilities and categories)
  useEffect(() => {
    const loadOptions = async () => {
      try {
        // Facilities
        const facRes = await facilityAPI.getUserFacilities();
        let facList = [];
        if (facRes?.status && Array.isArray(facRes?.data)) {
          facList = facRes.data;
        } else if (facRes?.status && Array.isArray(facRes?.data?.facilities)) {
          facList = facRes.data.facilities;
        } else if (Array.isArray(facRes)) {
          facList = facRes;
        }
        setFacilities(facList);

        // Categories
        const catRes = await surveyAPI.getSurveyCategories();
        let catList = [];
        if (catRes?.status && Array.isArray(catRes?.data)) {
          catList = catRes.data;
        } else if (Array.isArray(catRes)) {
          catList = catRes;
        }
        setCategories(catList);
      } catch (e) {
        // Fallbacks from current survey data if available
        const uniqueFacilities = Array.from(
          new Map(
            surveys
              .filter(s => s?.facilityId)
              .map(s => [s.facilityId?._id, s.facilityId])
          ).values()
        );
        const uniqueCategories = Array.from(
          new Set(surveys.map(s => s.surveyCategory).filter(Boolean))
        );
        if (uniqueFacilities.length) setFacilities(uniqueFacilities);
        if (uniqueCategories.length) setCategories(uniqueCategories);
      }
    };
    loadOptions();
    // intentionally not depending on surveys to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle tab change
  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    
    // Map tab to API status filter - note: API uses 'setup' status
    const statusMap = {
      'All': null,
      'Completed': 'completed',
      'In Progress': 'in-progress',
      'Setup': 'setup', // Add setup status
      'Offsite Prep': 'offsite-preparation',
      'Pending': 'pending'
    };
    
    setFilters(prev => ({
      ...prev,
      status: statusMap[tab]
    }));
    
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Note: Filtering is now handled server-side via API filters
  // No client-side filtering needed for pagination

  // Build faceted filter options for DataTableToolbar
  const facetedFilters = useMemo(() => {
    if (!surveys || surveys.length === 0) {
      return [];
    }

    const facilityOptions = Array.from(
      new Map(
        surveys
          .filter(s => s?.facilityId)
          .map(s => [s.facilityId?._id, {
            value: s.facilityId?._id,
            label: s.facilityId?.name || 'Unknown Facility'
          }])
      ).values()
    );

    const categoryOptions = Array.from(new Set(surveys.map(s => s.surveyCategory).filter(Boolean)))
      .map(c => ({ value: c, label: c }));

    const statusOptions = [
      { value: 'setup', label: 'Setup' },
      { value: 'in-progress', label: 'In Progress' },
      { value: 'offsite-preparation', label: 'Offsite Prep' },
      { value: 'completed', label: 'Completed' },
      { value: 'pending', label: 'Pending' },
    ];

    return [
      { column: 'facilityId._id', title: 'Facility', options: facilityOptions },
      { column: 'surveyCategory', title: 'Category', options: categoryOptions },
      { column: 'status', title: 'Status', options: statusOptions },
    ];
  }, [surveys]);

  // Local state for date range (not auto-triggering API)
  const [localDateRange, setLocalDateRange] = useState({ startDate: '', endDate: '' });

  // Sync faceted toolbar selections to API filters
  const handleTableFiltersChange = (columnFilters) => {
    const findFirst = (id) => {
      const entry = columnFilters.find(f => f.id === id);
      if (!entry) return null;
      return Array.isArray(entry.value) ? (entry.value[0] || null) : (entry.value || null);
    };
    setFilters(prev => ({
      ...prev,
      facility: findFirst('facilityId._id'),
      category: findFirst('surveyCategory'),
      status: findFirst('status'),
    }));
    
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Apply all filters including date range
  const handleApplyFilters = () => {
    setFilters(prev => ({
      ...prev,
      startDate: localDateRange.startDate,
      endDate: localDateRange.endDate,
    }));
    
    // Reset to first page when filters change
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      facility: null,
      category: null,
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

  // Handle delete survey
  const handleDeleteClick = useCallback((survey) => {
    setSurveyToDelete(survey);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!surveyToDelete || !surveyToDelete._id) {
      return;
    }

    setDeleting(true);
    try {
      await surveyAPI.deleteSurveyWizard(surveyToDelete._id);
      // Refresh the survey list
      await loadSurveys();
      setDeleteDialogOpen(false);
      setSurveyToDelete(null);
    } catch (err) {
      setError(err.message || 'Failed to delete survey. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSurveyToDelete(null);
  };

  // Handle download survey notes
  const handleDownloadNotes = useCallback(async (survey) => {
    if (!survey || !survey._id) {
      setError('Survey ID is missing');
      return;
    }

    setDownloadingNotes(survey._id);
    setError(null);

    try {
      await surveyAPI.downloadSurveyNotes(survey._id);
    } catch (err) {
      setError(err.message || 'Failed to download survey notes. Please try again.');
    } finally {
      setDownloadingNotes(null);
    }
  }, []);

  // Column definitions for TanStack React Table
  const columns = useMemo(
    () => [
      // Hidden helper column to enable faceted filter by facility id
      {
        id: "facilityId._id",
        accessorFn: (row) => row.facilityId?._id,
        header: () => null,
        cell: () => null,
        enableHiding: true,
      },
      {
        id: "facilityId.name",
        accessorFn: (row) => row.facilityId?.name,
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Facility
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                {row.original.facilityId?.name?.slice(0,20) || 'Unknown Facility'}
              </div>
              <div className="text-[12px] sm:text-[13px] text-gray-500 truncate">
                {row.original.surveyCategory || 'Standard'} 
              </div>
              <div className="text-[12px] sm:text-[11px] text-gray-600 font-medium">
                Team Members: {row.original.teamMembers?.length || 0} • Created: {new Date(row.original.createdAt).toLocaleDateString('en-US')}
              </div>
              {/* Show survey creator for invited users */}
              {row.original.teamCoordinator && (
                <div className="text-xs text-gray-500 truncate">
                 Coordinator: {row.original.teamCoordinator || 'Unassigned'}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "surveyCategory",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="hidden sm:flex"
            >
              Category
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="text-xs sm:text-sm capitalize hidden sm:block">
            <Badge variant="outline" className="text-xs">
              {row.original.surveyCategory || 'Standard'}
            </Badge>
          </div>
        ),
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      {
        accessorKey: "accessType",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="hidden sm:flex"
            >
              Access
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
           const accessType = row.original.accessType;
           if (!accessType) return null;
           
           const accessConfig = {
             OWNER: { color: "bg-emerald-100 text-emerald-800", label: "Owner" },
             TEAM_MEMBER: { color: "bg-indigo-100 text-indigo-800", label: "Team Member" },
             VIEWER: { color: "bg-gray-100 text-gray-800", label: "Viewer" },
           };

           const config = accessConfig[accessType] || { color: "bg-gray-100 text-gray-800", label: accessType };

          return (
            <div className="text-xs sm:text-sm hidden sm:block">
              <Badge className={`${config.color} hover:${config.color} text-xs border-0`}>
                {config.label}
              </Badge>
            </div>
          );
        },
      },
      { 
        accessorKey: "surveyCreationDate",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              <span className="hidden sm:inline">Survey Date</span>
              <span className="sm:hidden">Date</span>
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="text-xs sm:text-sm">
            {new Date(row.original.surveyCreationDate).toLocaleDateString('en-US')}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Status
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const status = row.original.status || 'setup';
          const statusConfig = {
            setup: { color: "bg-blue-100 text-blue-800", label: "Setup" },
            completed: { color: "bg-green-100 text-green-800", label: "Completed" },
            "in-progress": { color: "bg-yellow-100 text-yellow-800", label: "In Progress" },
            "offsite-preparation": { color: "bg-purple-100 text-purple-800", label: "Offsite Prep" },
            pending: { color: "bg-gray-100 text-gray-800", label: "Pending" },
          };
          
          return (
            <Badge className={`${statusConfig[status]?.color} hover:${statusConfig[status]?.color} text-xs`}>
             
              {statusConfig[status]?.label || status}
            </Badge>
          );
        },
        filterFn: (row, id, value) => {
          return value.includes(row.getValue(id));
        },
      },
      
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const survey = row.original;

          const handleViewSurvey = () => {
            // Store the survey ID for the SurveyBuilder to load
            if (survey._id) {
              // Use utility function to properly switch survey context
              switchToSurvey(survey._id);
              
              // Check survey category and redirect to appropriate page if needed
              const surveyCategory = survey.surveyCategory || "";
              const surveyStatus = survey.status || "";
              
              // Redirect to Life Safety Survey page if survey category is "Life Safety Survey"
              // or status is "life-safety-survey"
              if (surveyCategory === "Life Safety Survey" || surveyStatus === "life-safety-survey") {
                navigate("/life-safety-survey");
                return;
              }
              
              // Redirect to Facility Initiated Survey page if survey category is "Facility Initiated Survey"
              // or status is "facility-initiated-survey"
              if (surveyCategory === "Facility Initiated Survey" || surveyStatus === "facility-initiated-survey") {
                navigate("/risk-based-survey");
                return;
              }
              
              // For invited surveys, always start at step 1 (Survey Setup)
              // For owned surveys, use status-based step mapping
              let suggestedStep = 1; // Default to step 1
              
              if (!isInvitedUser()) {
                // Only use status mapping for survey owners
                const statusToStepMap = {
                  'setup': 1,
                  'pre-survey': 1,
                  'offsite-preparation': 2,
                  'facility-entrance': 3,
                  'initial-pool-process': 4,
                  'sample-selection': 5,
                  'investigations': 6,
                  'facility-tasks': 7,
                  'team-meetings': 8,
                  'citation': 9,
                  'exit-conference': 10,
                  'resources-help': 11,
                  'post-survey': 12,
                  'completed': 13
                };
                
                suggestedStep = statusToStepMap[survey.status] || 1;
              }
              
              // Note: Current step is now managed by IndexedDB in SurveyBuilder
            }
            navigate('/mocksurvey365');
          };

          return (
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleViewSurvey}
                className="text-[#075b7d] hover:text-[#064d63] font-medium hover:underline transition-colors duration-200 underline cursor-pointer border border-[#075b7d] rounded-md p-2 hover:bg-[#075b7d] hover:text-white"
                title="View Survey Details"
              >
                 <ArrowRight className="w-4 h-4" />
              </button>
             
              {!isInvitedUser() && (row.original.accessType === 'OWNER' || row.original.accessType === 'CREATOR') && (
                <button
                  onClick={() => handleDeleteClick(survey)}
                  className="text-red-600 hover:text-red-700 font-medium transition-colors duration-200 cursor-pointer flex items-center gap-1 border border-red-600 rounded-md p-2 hover:bg-red-600 hover:text-white"
                  title="Delete Survey "
                >
                  <Trash2 className="w-4 h-4" />
                 
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [navigate, user, handleDeleteClick, handleDownloadNotes, downloadingNotes]
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Surveys</h1>
            </div>
            <p className="text-gray-500 text-sm sm:text-base">
              Manage your surveys and view surveys you've been invited to.
            </p>
          </div>
          <div className="flex-shrink-0">
            {!isInvitedUser() && (
              <Button
                className="w-full sm:w-auto bg-[#075b7d] hover:bg-[#075b7d] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-[8px] font-medium cursor-pointer text-sm sm:text-base"
                onClick={async () => {
                  // Clear any existing survey data and start fresh
                  await clearSurveyStorage();
                  navigate("/mocksurvey365");
                }}
                
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Survey
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

        {/* Survey List Section */}
        <div className="bg-white">
          <div className="border border-gray-200 rounded-lg">
            <div className="p-4 sm:p-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Survey List
              </h2>
            </div>
            
            {/* Survey Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-b border-gray-200 p-4">
              <div className="w-full sm:w-auto overflow-x-auto">
                <div className="flex items-center bg-gray-100 border border-gray-200 rounded-[8px] min-w-fit">
                  {['All', 'Setup', 'In Progress', 'Offsite Prep', 'Completed', 'Pending'].map((tab) => (
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
              {/* Date range now handled in DataTable toolbar */}
            </div>

            {/* Data Table */}
            <div className="p-2 sm:p-4">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-gray-500">Loading surveys...</div>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-red-500">{error}</div>
                </div>
              ) : (
                <>
                  <DataTable
                    columns={columns}
                    data={surveys}
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
                  
                  {/* Server-side Pagination Controls */}
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
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Survey</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the survey for{" "}
              <strong>{surveyToDelete?.facilityId?.name || "this facility"}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Surveys; 