import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { DataTableSimple } from "../components/data-table-simple";
import { DataTableFacetedFilter } from "../components/data-table-faceted-filter";
import AddResourceModal from "../components/AddResourceModal";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

import { DateRangePicker } from "../components/ui/date-picker";
import { resourceAPI } from "../service/api";
import {
  Search,
  Download,
  FileText,
  Shield,
  ClipboardCheck,
  Filter,
  AlertCircle,
  BookOpen,
  Video,
  FileSpreadsheet,
  ArrowUpDown,
  TrendingUp,
  Clock,
  Upload,
  Loader2,
  RefreshCw,
  X,
  MapPin,
  FileType,
  ChevronDown,
  CheckSquare,
} from "lucide-react";

const ResourceCenter = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedState, setSelectedState] = useState("Florida"); // Default to Florida as shown in image
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });

  // API state management
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState("");
  const [stateSearchTerm, setStateSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("regulations");

  // Critical Elements state management
  const [criticalElements, setCriticalElements] = useState([]);
  const [criticalElementsLoading, setCriticalElementsLoading] = useState(false);
  const [criticalElementsError, setCriticalElementsError] = useState(null);
  const [criticalElementsPagination, setCriticalElementsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });
  const [criticalElementsSearchTerm, setCriticalElementsSearchTerm] = useState("");

  // Facility Task CE Pathways state management
  const [facilityTaskCEPathways, setFacilityTaskCEPathways] = useState([]);
  const [facilityTaskCEPathwaysLoading, setFacilityTaskCEPathwaysLoading] = useState(false);
  const [facilityTaskCEPathwaysError, setFacilityTaskCEPathwaysError] = useState(null);
  const [facilityTaskCEPathwaysPagination, setFacilityTaskCEPathwaysPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
  });
  const [facilityTaskCEPathwaysSearchTerm, setFacilityTaskCEPathwaysSearchTerm] = useState("");

  // US States list
  const usStates = [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "District of Columbia",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
  ];

  // Filtered states based on search term
  const filteredStates = useMemo(() => {
    if (!stateSearchTerm) return usStates;
    return usStates.filter((state) =>
      state.toLowerCase().includes(stateSearchTerm.toLowerCase())
    );
  }, [stateSearchTerm]);

  // Fetch regulations from API
  const fetchRegulations = async (
    customFilters = {},
    isFilterChange = false
  ) => {
    try {
      setError(null);
      if (isFilterChange) {
        setFilterLoading(true);
      }

      // Build filter parameters
      const apiFilters = {
        page: pagination.currentPage,
        limit: pagination.limit,
        ...customFilters,
      };

      // Add search term if provided (unless explicitly null/undefined)
      if (customFilters.name !== undefined && customFilters.name !== null) {
        apiFilters.name = customFilters.name;
      } else if (customFilters.name === undefined && searchTerm) {
        apiFilters.name = searchTerm;
      }

      // Add state filter if provided (unless explicitly null/undefined)
      if (customFilters.state !== undefined && customFilters.state !== null) {
        apiFilters.state = customFilters.state;
      } else if (customFilters.state === undefined && selectedState) {
        apiFilters.state = selectedState;
      }

      // Add category filter if provided (unless explicitly null/undefined)
      if (
        customFilters.category !== undefined &&
        customFilters.category !== null
      ) {
        apiFilters.category = customFilters.category;
      } else if (
        customFilters.category === undefined &&
        selectedCategory !== "all"
      ) {
        apiFilters.category = selectedCategory;
      }

      // Add type filter if provided (unless explicitly null/undefined)
      if (customFilters.type !== undefined && customFilters.type !== null) {
        apiFilters.type = customFilters.type;
      } else if (customFilters.type === undefined && selectedType !== "all") {
        apiFilters.type = selectedType;
      }

      // Add date range if provided (unless explicitly null/undefined)
      if (
        customFilters.startDate !== undefined &&
        customFilters.startDate !== null
      ) {
        apiFilters.startDate = customFilters.startDate;
      } else if (customFilters.startDate === undefined && dateRange.from) {
        apiFilters.startDate = dateRange.from.toISOString().split("T")[0];
      }

      if (
        customFilters.endDate !== undefined &&
        customFilters.endDate !== null
      ) {
        apiFilters.endDate = customFilters.endDate;
      } else if (customFilters.endDate === undefined && dateRange.to) {
        apiFilters.endDate = dateRange.to.toISOString().split("T")[0];
      }

      // Remove undefined and null values from API filters
      const cleanApiFilters = Object.fromEntries(
        Object.entries(apiFilters).filter(
          ([_, value]) => value !== undefined && value !== null
        )
      );

      const response = await resourceAPI.getAllLongTermRegulations(
        cleanApiFilters
      );

      if (response.status && response.data) {
        // Transform API data to match our component structure
        const transformedResources = response.data.longTermRegulations.map(
          (regulation, index) => ({
            id: regulation._id,
            title: regulation.name,
            category: "cms-resources", // All regulations are CMS resources
            type: "pdf", // All regulations are PDFs
            description:
              regulation.description ||
              "State-specific long-term care facility regulations and compliance requirements.",
            downloadUrl: regulation.pdflink,
            fileSize: "N/A", // Not provided by API
            downloads: Math.floor(Math.random() * 1000) + 100, // Mock data for now
            rating: 4.5 + Math.random() * 0.5, // Mock rating
            lastUpdated: regulation.date,
            featured: index < 3, // First 3 are featured
            icon: Shield,
            tags: [
              regulation.state,
              "Regulations",
              "Compliance",
              "Long-term Care",
            ],
            author: `${regulation.state} Department of Health`,
            version: "1.0",
            detailedDescription: `Comprehensive regulations for long-term care facilities in ${regulation.state}. This document contains all state-specific requirements, standards, and compliance guidelines.`,
            contents: [
              "Facility licensing requirements",
              "Staff qualifications and training",
              "Resident care standards",
              "Environmental safety requirements",
              "Quality assurance protocols",
              "Inspection and survey procedures",
            ],
            relatedFTags: ["F880", "F441", "F156", "F725"],
            status: "active",
            state: regulation.state,
          })
        );

        setResources(transformedResources);
        setPagination(
          response.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            total: transformedResources.length,
            limit: 10,
          }
        );
      }
    } catch (err) {
      setError(err.message || "Failed to fetch regulations");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setFilterLoading(false);
    }
  };

  // Fetch facility task CE pathways from API
  const fetchFacilityTaskCEPathways = async (customFilters = {}) => {
    try {
      setFacilityTaskCEPathwaysError(null);
      setFacilityTaskCEPathwaysLoading(true);

      // Build filter parameters
      const apiFilters = {
        page: facilityTaskCEPathwaysPagination.currentPage,
        limit: facilityTaskCEPathwaysPagination.limit,
        ...customFilters,
      };

      // Add search term if provided
      if (customFilters.name !== undefined && customFilters.name !== null) {
        apiFilters.name = customFilters.name;
      } else if (customFilters.name === undefined && facilityTaskCEPathwaysSearchTerm) {
        apiFilters.name = facilityTaskCEPathwaysSearchTerm;
      }

      // Add date range if provided
      if (customFilters.startDate !== undefined && customFilters.startDate !== null) {
        apiFilters.startDate = customFilters.startDate;
      } else if (customFilters.startDate === undefined && dateRange.from) {
        apiFilters.startDate = dateRange.from.toISOString().split("T")[0];
      }

      if (customFilters.endDate !== undefined && customFilters.endDate !== null) {
        apiFilters.endDate = customFilters.endDate;
      } else if (customFilters.endDate === undefined && dateRange.to) {
        apiFilters.endDate = dateRange.to.toISOString().split("T")[0];
      }

      // Remove undefined and null values from API filters
      const cleanApiFilters = Object.fromEntries(
        Object.entries(apiFilters).filter(
          ([_, value]) => value !== undefined && value !== null
        )
      );

      const response = await resourceAPI.getFacilityTaskCEPathways(cleanApiFilters);

      if (response.status && response.data) {
        // Handle the actual API response structure - uses 'criticalelements' key
        const pathwaysData = response.data.criticalelements || 
                           response.data.facilityTaskCEPathways || 
                           response.data.pathways || 
                           response.data.data ||
                           (Array.isArray(response.data) ? response.data : []);
        
        // Transform API data to match our component structure
        const transformedPathways = pathwaysData.map(
          (pathway, index) => ({
            id: pathway._id,
            title: pathway.name,
            category: "facility-task-ce-pathways",
            type: "pdf",
            description: `Facility task critical elements pathway file: ${pathway.name}`,
            downloadUrl: pathway.pdflink,
            fileSize: "N/A",
            downloads: Math.floor(Math.random() * 500) + 50,
            rating: 4.0 + Math.random() * 1.0,
            lastUpdated: pathway.createdAt || pathway.date,
            featured: index < 3,
            icon: ClipboardCheck,
            tags: ["Facility Task", "Critical Elements", "Pathway", "CMS", "Compliance"],
            author: "CMS",
            version: "1.0",
            detailedDescription: `Facility task critical elements pathway file for ${pathway.name}. This document provides guidance on facility task critical elements for survey compliance.`,
            contents: [
              "Facility task identification",
              "Critical elements pathway guidance",
              "Survey pathway guidance",
              "Compliance requirements",
              "Best practices",
            ],
            relatedFTags: ["F880", "F441", "F156", "F725"],
            status: pathway.status ? "active" : "inactive",
            createdAt: pathway.createdAt,
          })
        ) || [];

        setFacilityTaskCEPathways(transformedPathways);
        setFacilityTaskCEPathwaysPagination(
          response.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            total: transformedPathways.length,
            limit: 10,
          }
        );
      }
    } catch (err) {
      setFacilityTaskCEPathwaysError(err.message || "Failed to fetch facility task CE pathways");
    } finally {
      setFacilityTaskCEPathwaysLoading(false);
    }
  };

  // Fetch critical elements from API
  const fetchCriticalElements = async (customFilters = {}) => {
    try {
      setCriticalElementsError(null);
      setCriticalElementsLoading(true);

      // Build filter parameters
      const apiFilters = {
        page: criticalElementsPagination.currentPage,
        limit: criticalElementsPagination.limit,
        ...customFilters,
      };

      // Add search term if provided
      if (customFilters.name !== undefined && customFilters.name !== null) {
        apiFilters.name = customFilters.name;
      } else if (customFilters.name === undefined && criticalElementsSearchTerm) {
        apiFilters.name = criticalElementsSearchTerm;
      }

      // Add date range if provided
      if (customFilters.startDate !== undefined && customFilters.startDate !== null) {
        apiFilters.startDate = customFilters.startDate;
      } else if (customFilters.startDate === undefined && dateRange.from) {
        apiFilters.startDate = dateRange.from.toISOString().split("T")[0];
      }

      if (customFilters.endDate !== undefined && customFilters.endDate !== null) {
        apiFilters.endDate = customFilters.endDate;
      } else if (customFilters.endDate === undefined && dateRange.to) {
        apiFilters.endDate = dateRange.to.toISOString().split("T")[0];
      }

      // Remove undefined and null values from API filters
      const cleanApiFilters = Object.fromEntries(
        Object.entries(apiFilters).filter(
          ([_, value]) => value !== undefined && value !== null
        )
      );

      const response = await resourceAPI.getCriticalElements(cleanApiFilters);

      if (response.status && response.data) {
        // Transform API data to match our component structure
        const transformedElements = response.data.criticalelements.map(
          (element, index) => ({
            id: element._id,
            title: element.name,
            category: "critical-elements",
            type: "pdf",
            description: `Critical elements pathway file: ${element.name}`,
            downloadUrl: element.pdflink,
            fileSize: "N/A",
            downloads: Math.floor(Math.random() * 500) + 50,
            rating: 4.0 + Math.random() * 1.0,
            lastUpdated: element.createdAt,
            featured: index < 3,
            icon: ClipboardCheck,
            tags: ["Critical Elements", "Pathway", "CMS", "Compliance"],
            author: "CMS",
            version: "1.0",
            detailedDescription: `Critical elements pathway file for ${element.name}. This document provides guidance on critical elements for survey compliance.`,
            contents: [
              "Critical elements identification",
              "Survey pathway guidance",
              "Compliance requirements",
              "Best practices",
            ],
            relatedFTags: ["F880", "F441", "F156", "F725"],
            status: element.status ? "active" : "inactive",
            createdAt: element.createdAt,
          })
        );

        setCriticalElements(transformedElements);
        setCriticalElementsPagination(
          response.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            total: transformedElements.length,
            limit: 10,
          }
        );
      }
    } catch (err) {
      setCriticalElementsError(err.message || "Failed to fetch critical elements");
    } finally {
      setCriticalElementsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchRegulations();
  }, []);

  // Load critical elements when component mounts
  useEffect(() => {
    fetchCriticalElements();
  }, []);

  // Load facility task CE pathways when the tab becomes active
  useEffect(() => {
    if (activeTab === "facility-task-ce-pathways") {
      fetchFacilityTaskCEPathways();
    }
  }, [activeTab]);

  // Refresh data
  const handleRefresh = () => {
    setRefreshing(true);
    fetchRegulations();
  };

  // Handle search with current filters
  const handleSearch = () => {
    fetchRegulations({}, true); // Pass isFilterChange = true
  };

  // Handle critical elements search
  const handleCriticalElementsSearch = () => {
    fetchCriticalElements({});
  };

  // Handle facility task CE pathways search
  const handleFacilityTaskCEPathwaysSearch = () => {
    fetchFacilityTaskCEPathways({});
  };

  // Clear critical elements filters
  const clearCriticalElementsFilters = () => {
    setCriticalElementsSearchTerm("");
    setDateRange({ from: undefined, to: undefined });
    // Call API to reset data with no filters
    fetchCriticalElements({
      name: null,
      startDate: null,
      endDate: null,
    });
  };

  // Clear facility task CE pathways filters
  const clearFacilityTaskCEPathwaysFilters = () => {
    setFacilityTaskCEPathwaysSearchTerm("");
    setDateRange({ from: undefined, to: undefined });
    // Call API to reset data with no filters
    fetchFacilityTaskCEPathways({
      name: null,
      startDate: null,
      endDate: null,
    });
  };

  // Handle add resource modal
  const handleAddResource = () => {
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleAddSuccess = () => {
    // Refresh the data after successful addition based on active tab
    if (activeTab === "critical-elements") {
      fetchCriticalElements({});
    } else if (activeTab === "facility-task-ce-pathways") {
      fetchFacilityTaskCEPathways({});
    } else {
      fetchRegulations({}, true);
    }
  };

  const categories = [
    { id: "all", name: "All Categories", icon: FileText },
    { id: "audit-checklists", name: "Audit Checklists", icon: ClipboardCheck },
    { id: "cms-resources", name: "CMS Resources", icon: Shield },
    { id: "training-materials", name: "Training Materials", icon: BookOpen },
    { id: "quick-tips", name: "Quick Tips", icon: AlertCircle },
  ];

  const categoryOptions = [
    { label: "CMS Resources", value: "cms-resources", icon: Shield },
    {
      label: "Audit Checklists",
      value: "audit-checklists",
      icon: ClipboardCheck,
    },
    {
      label: "Training Materials",
      value: "training-materials",
      icon: BookOpen,
    },
    { label: "Quick Tips", value: "quick-tips", icon: AlertCircle },
  ];

  const typeOptions = [
    { label: "PDF Documents", value: "pdf", icon: FileText },
    { label: "Excel Tools", value: "excel", icon: FileSpreadsheet },
    { label: "Video Training", value: "video", icon: Video },
    { label: "Checklists", value: "checklist", icon: ClipboardCheck },
    { label: "Templates", value: "template", icon: FileType },
  ];

  const handleViewPdf = (resource) => {
    if (resource.downloadUrl) {
      // Check if the URL ends with .pdf
      if (resource.downloadUrl.toLowerCase().endsWith(".pdf")) {
        setSelectedPdfUrl(resource.downloadUrl);
        setShowPdfModal(true);
      } else {
        // Open non-PDF links in a new tab
        window.open(resource.downloadUrl, "_blank");
      }
    }
  };

  const handleClosePdfModal = () => {
    setShowPdfModal(false);
    setSelectedPdfUrl("");
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedType("all");
    setSelectedStates([]);
    setDateRange({ from: undefined, to: undefined });
    // Call API to reset data with no filters - use a fresh call without any state
    fetchRegulations(
      {
        name: null,
        state: null,
        category: null,
        type: null,
        startDate: null,
        endDate: null,
      },
      true
    );
  };

  // Handle state selection
  const handleStateSelect = (state) => {
    setSelectedState(state);
    fetchRegulations({ state }, true);
  };

  // Check if any filters are active
  const hasActiveFilters =
    searchTerm ||
    selectedCategory !== "all" ||
    selectedType !== "all" ||
    selectedStates.length > 0 ||
    dateRange.from ||
    dateRange.to;

  // Check if critical elements filters are active
  const hasActiveCriticalElementsFilters =
    criticalElementsSearchTerm ||
    dateRange.from ||
    dateRange.to;

  // Check if facility task CE pathways filters are active
  const hasActiveFacilityTaskCEPathwaysFilters =
    facilityTaskCEPathwaysSearchTerm ||
    dateRange.from ||
    dateRange.to;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#075b7d]" />
          <p className="text-gray-600">Loading regulations...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Resources
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={handleRefresh}
            className="bg-[#075b7d] hover:bg-[#075b7d] text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white ">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="bg-white mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Resource Center</h1>
          <p className="text-gray-600 mt-2">
            Access long-term care regulations and compliance resources by state
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {localStorage.getItem("mocksurvey_user")?.roleId ===
            "super_admin" && (
            <Button
              onClick={handleAddResource}
              className="bg-sky-800 hover:bg-sky-900 text-white px-6 py-2 rounded-lg mb-6 md:mb-0"
            >
              <Upload className="w-4 h-4 mr-2" />
              Add Resource
            </Button>
          )}
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 w-full sm:w-auto">
          <TabsTrigger value="regulations" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">
              Long Term Care State Regulations
            </span>
            <span className="sm:hidden">Regulations</span>
          </TabsTrigger>
          <TabsTrigger value="critical-elements" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">
              Resident Level CE Pathways 
            </span>
            <span className="sm:hidden">Resident Level CE Pathways</span>
          </TabsTrigger>
          <TabsTrigger value="facility-task-ce-pathways" className="text-xs sm:text-sm">
            <span className="hidden sm:inline">
              Facility Task CE Pathways
            </span>
            <span className="sm:hidden">Facility Task CE</span>
          </TabsTrigger>
          {/* <TabsTrigger value="resources" className="text-xs sm:text-sm">
            Other Resources
          </TabsTrigger> */}
        </TabsList>

        <TabsContent value="regulations" className="mt-0">
          <div className="flex flex-col lg:flex-row border border-gray-200">
            {/* Left Sidebar - State Navigation - Hidden on mobile */}
            <div className="hidden lg:flex w-80 bg-gray-50 border-r border-gray-200 flex-col h-screen">
              {/* Sidebar Header */}
              <div className="p-3 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-semibold text-gray-900">
                    Long Term Care State Regulations
                  </h2>
                </div>
              </div>

              {/* States List */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="p-3 space-y-2">
                  {usStates.map((state) => (
                    <button
                      key={state}
                      onClick={() => handleStateSelect(state)}
                      className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
                        selectedState === state
                          ? "bg-sky-800 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-sky-800 hover:text-white border border-gray-200"
                      }`}
                    >
                      {state}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile State Selector */}
            <div className="lg:hidden bg-gray-50 border-b border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select State
              </label>
              <Select value={selectedState} onValueChange={handleStateSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {/* Search Input */}
                  <div className="p-2 border-b border-gray-200">
                    <Input
                      placeholder="Search states..."
                      value={stateSearchTerm}
                      onChange={(e) => setStateSearchTerm(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  {/* States List */}
                  <div className="max-h-48 overflow-y-auto scrollbar-hide">
                    {filteredStates.length > 0 ? (
                      filteredStates.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500 text-center">
                        No states found
                      </div>
                    )}
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-auto lg:h-screen">
              {/* Breadcrumbs */}
              <div className="hidden sm:block bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
                <nav className="text-xs sm:text-sm text-gray-600">
                  <span>State Regulations</span>
                  <span className="mx-1 sm:mx-2">/</span>
                  <span className="hidden sm:inline">
                    Long Term Care State Regulations
                  </span>
                  <span className="sm:hidden">LTC Regulations</span>
                  <span className="mx-1 sm:mx-2">/</span>
                  <span className="text-gray-900 font-medium">
                    {selectedState}
                  </span>
                </nav>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {selectedState} long term care state regulations
                </p>
              </div>

              {/* Main Content Header */}
              <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                      {selectedState} Regulations
                    </h1>
                  </div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
                <div className="flex flex-col gap-4">
                  {/* Search Bar */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search regulations..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSearch();
                            }
                          }}
                          className="pl-10 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSearch}
                        disabled={filterLoading}
                        variant="outline"
                        className="border-sky-800 text-sky-800 px-4 sm:px-6 text-sm"
                      >
                        {filterLoading ? (
                          <Loader2 className="w-4 h-4 mr-1 sm:mr-2 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4 mr-1 sm:mr-2" />
                        )}
                        <span className="hidden sm:inline">Search</span>
                      </Button>
                      {hasActiveFilters && (
                        <Button
                          onClick={clearAllFilters}
                          variant="outline"
                          size="sm"
                          className="h-10 px-2 sm:px-3 text-sm"
                        >
                          <X className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Clear</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Filter Row */}
                  <div className="flex flex-wrap gap-3 items-center">
                    {/* Filter Status Indicator */}
                    {hasActiveFilters && (
                      <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                        <Filter className="w-3 h-3 mr-1" />
                        Filters applied
                      </div>
                    )}

                    {/* Category Filter */}
                    <DataTableFacetedFilter
                      column={{
                        getFacetedUniqueValues: () => new Map(),
                        getFilterValue: () =>
                          selectedCategory === "all" ? [] : [selectedCategory],
                        setFilterValue: (value) =>
                          setSelectedCategory(
                            value && value.length > 0 ? value[0] : "all"
                          ),
                      }}
                      title="Category"
                      options={categoryOptions}
                    />

                    {/* Type Filter */}
                    <DataTableFacetedFilter
                      column={{
                        getFacetedUniqueValues: () => new Map(),
                        getFilterValue: () =>
                          selectedType === "all" ? [] : [selectedType],
                        setFilterValue: (value) =>
                          setSelectedType(
                            value && value.length > 0 ? value[0] : "all"
                          ),
                      }}
                      title="Type"
                      options={typeOptions}
                    />

                    {/* Date Range Filter */}
                    <DateRangePicker
                      dateRange={dateRange}
                      onSelect={setDateRange}
                      placeholder="Select date range"
                      className="h-8 border-dashed"
                    />

                    {/* Apply Filters Button */}
                    <Button
                      onClick={handleSearch}
                      disabled={filterLoading}
                      variant="outline"
                      size="sm"
                      className="h-8 border-dashed"
                    >
                      {filterLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4 mr-2" />
                      )}
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </div>

              {/* Regulations List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">
                      Loading regulations...
                    </span>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Error Loading Regulations
                    </h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Button
                      onClick={handleRefresh}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                ) : resources.length > 0 ? (
                  <div className="space-y-4">
                    {resources.map((regulation) => (
                      <div
                        key={regulation.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                              <span className="text-xs sm:text-sm font-medium text-gray-500">
                                {new Date(
                                  regulation.lastUpdated
                                ).toLocaleDateString()}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs bg-blue-50 text-blue-600 border-blue-300 w-fit"
                              >
                                {regulation.state}
                              </Badge>
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                              {regulation.title}
                            </h3>
                            <p className="text-gray-600 text-xs sm:text-sm mb-4">
                              {regulation.description}
                            </p>
                            <div className="flex items-center space-x-4">
                              {regulation.downloadUrl && (
                                <button
                                  onClick={() => handleViewPdf(regulation)}
                                  className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium flex items-center space-x-1 cursor-pointer"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>View PDF</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No regulations found
                    </h3>
                    <p className="text-gray-600">
                      No regulations are currently available for {selectedState}
                      .
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="critical-elements" className="mt-0">
          <div className="flex flex-col lg:flex-row border border-gray-200">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-auto lg:h-screen">
              {/* Breadcrumbs */}
              <div className="hidden sm:block bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
                <nav className="text-xs sm:text-sm text-gray-600">
                  <span>Resources</span>
                  <span className="mx-1 sm:mx-2">/</span>
                  <span className="text-gray-900 font-medium">
                    Resident Level CE Pathways
                  </span>
                </nav>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  CMS critical elements pathway files for survey compliance
                </p>
              </div>

              {/* Main Content Header */}
              <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                      Resident Level CE Pathways
                    </h1>
                  </div>
                  <div className="flex items-center space-x-4">
                    {localStorage.getItem("mocksurvey_user")?.roleId ===
                      "super_admin" && (
                      <Button
                        onClick={handleAddResource}
                        className="bg-sky-800 hover:bg-sky-900 text-white px-6 py-2 rounded-lg"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Add Critical Element
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
                <div className="flex flex-col gap-4">
                  {/* Search Bar */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search critical elements..."
                          value={criticalElementsSearchTerm}
                          onChange={(e) => setCriticalElementsSearchTerm(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleCriticalElementsSearch();
                            }
                          }}
                          className="pl-10 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCriticalElementsSearch}
                        disabled={criticalElementsLoading}
                        variant="outline"
                        className="border-sky-800 text-sky-800 px-4 sm:px-6 text-sm"
                      >
                        {criticalElementsLoading ? (
                          <Loader2 className="w-4 h-4 mr-1 sm:mr-2 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4 mr-1 sm:mr-2" />
                        )}
                        <span className="hidden sm:inline">Search</span>
                      </Button>
                      {hasActiveCriticalElementsFilters && (
                        <Button
                          onClick={clearCriticalElementsFilters}
                          variant="outline"
                          size="sm"
                          className="h-10 px-2 sm:px-3 text-sm"
                        >
                          <X className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Clear</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Date Range Filter */}
                  <div className="flex flex-wrap gap-3 items-center">
                    {/* Filter Status Indicator */}
                    {hasActiveCriticalElementsFilters && (
                      <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                        <Filter className="w-3 h-3 mr-1" />
                        Filters applied
                      </div>
                    )}

                    <DateRangePicker
                      dateRange={dateRange}
                      onSelect={setDateRange}
                      placeholder="Select date range"
                      className="h-8 border-dashed"
                    />

                    {/* Apply Filters Button */}
                    <Button
                      onClick={handleCriticalElementsSearch}
                      disabled={criticalElementsLoading}
                      variant="outline"
                      size="sm"
                      className="h-8 border-dashed"
                    >
                      {criticalElementsLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4 mr-2" />
                      )}
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </div>

              {/* Critical Elements List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide">
                {criticalElementsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">
                      Loading critical elements...
                    </span>
                  </div>
                ) : criticalElementsError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Error Loading Critical Elements
                    </h3>
                    <p className="text-gray-600 mb-4">{criticalElementsError}</p>
                    <Button
                      onClick={() => fetchCriticalElements()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                ) : criticalElements.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {criticalElements.map((element) => (
                        <div
                          key={element.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                                <span className="text-xs sm:text-sm font-medium text-gray-500">
                                  {new Date(element.lastUpdated).toLocaleDateString()}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-purple-50 text-purple-600 border-purple-300 w-fit"
                                >
                                  Critical Elements
                                </Badge>
                              </div>
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                                {element.title}
                              </h3>
                              <p className="text-gray-600 text-xs sm:text-sm mb-4">
                                {element.description}
                              </p>
                              <div className="flex items-center space-x-4">
                                {element.downloadUrl && (
                                  <button
                                    onClick={() => handleViewPdf(element)}
                                    className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Download className="w-4 h-4" />
                                    <span>View PDF</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {criticalElementsPagination.totalPages > 1 && (
                      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                          Showing {((criticalElementsPagination.currentPage - 1) * criticalElementsPagination.limit) + 1} to{" "}
                          {Math.min(criticalElementsPagination.currentPage * criticalElementsPagination.limit, criticalElementsPagination.total)} of{" "}
                          {criticalElementsPagination.total} results
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (criticalElementsPagination.currentPage > 1) {
                                setCriticalElementsPagination(prev => ({
                                  ...prev,
                                  currentPage: prev.currentPage - 1
                                }));
                                fetchCriticalElements({
                                  page: criticalElementsPagination.currentPage - 1
                                });
                              }
                            }}
                            disabled={criticalElementsPagination.currentPage === 1 || criticalElementsLoading}
                            className="h-8 px-3"
                          >
                            Previous
                          </Button>
                          
                          {/* Page Numbers */}
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, criticalElementsPagination.totalPages) }, (_, i) => {
                              let pageNum;
                              if (criticalElementsPagination.totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (criticalElementsPagination.currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (criticalElementsPagination.currentPage >= criticalElementsPagination.totalPages - 2) {
                                pageNum = criticalElementsPagination.totalPages - 4 + i;
                              } else {
                                pageNum = criticalElementsPagination.currentPage - 2 + i;
                              }
                              
                              return (
                                <Button
                                  key={pageNum}
                                  variant={criticalElementsPagination.currentPage === pageNum ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => {
                                    if (criticalElementsPagination.currentPage !== pageNum) {
                                      setCriticalElementsPagination(prev => ({
                                        ...prev,
                                        currentPage: pageNum
                                      }));
                                      fetchCriticalElements({
                                        page: pageNum
                                      });
                                    }
                                  }}
                                  disabled={criticalElementsLoading}
                                  className={`h-8 w-8 px-0 ${
                                    criticalElementsPagination.currentPage === pageNum 
                                      ? "bg-blue-600 text-white" 
                                      : "bg-white text-gray-700 border-gray-300"
                                  }`}
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (criticalElementsPagination.currentPage < criticalElementsPagination.totalPages) {
                                setCriticalElementsPagination(prev => ({
                                  ...prev,
                                  currentPage: prev.currentPage + 1
                                }));
                                fetchCriticalElements({
                                  page: criticalElementsPagination.currentPage + 1
                                });
                              }
                            }}
                            disabled={criticalElementsPagination.currentPage === criticalElementsPagination.totalPages || criticalElementsLoading}
                            className="h-8 px-3"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <ClipboardCheck className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No critical elements found
                    </h3>
                    <p className="text-gray-600">
                      No critical elements pathway files are currently available.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="facility-task-ce-pathways" className="mt-0">
          <div className="flex flex-col lg:flex-row border border-gray-200">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-auto lg:h-screen">
              {/* Breadcrumbs */}
              <div className="hidden sm:block bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
                <nav className="text-xs sm:text-sm text-gray-600">
                  <span>Resources</span>
                  <span className="mx-1 sm:mx-2">/</span>
                  <span className="text-gray-900 font-medium">
                    Facility Task Critical Elements Pathway Files
                  </span>
                </nav>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  CMS facility task critical elements pathway files for survey compliance
                </p>
              </div>

              {/* Main Content Header */}
              <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                      Facility Task Critical Elements Pathway Files
                    </h1>
                  </div>
                  <div className="flex items-center space-x-4">
                    {localStorage.getItem("mocksurvey_user")?.roleId ===
                      "super_admin" && (
                      <Button
                        onClick={handleAddResource}
                        className="bg-sky-800 hover:bg-sky-900 text-white px-6 py-2 rounded-lg"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Add Facility Task CE Pathway
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
                <div className="flex flex-col gap-4">
                  {/* Search Bar */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search facility task CE pathways..."
                          value={facilityTaskCEPathwaysSearchTerm}
                          onChange={(e) => setFacilityTaskCEPathwaysSearchTerm(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleFacilityTaskCEPathwaysSearch();
                            }
                          }}
                          className="pl-10 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleFacilityTaskCEPathwaysSearch}
                        disabled={facilityTaskCEPathwaysLoading}
                        variant="outline"
                        className="border-sky-800 text-sky-800 px-4 sm:px-6 text-sm"
                      >
                        {facilityTaskCEPathwaysLoading ? (
                          <Loader2 className="w-4 h-4 mr-1 sm:mr-2 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4 mr-1 sm:mr-2" />
                        )}
                        <span className="hidden sm:inline">Search</span>
                      </Button>
                      {hasActiveFacilityTaskCEPathwaysFilters && (
                        <Button
                          onClick={clearFacilityTaskCEPathwaysFilters}
                          variant="outline"
                          size="sm"
                          className="h-10 px-2 sm:px-3 text-sm"
                        >
                          <X className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Clear</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Date Range Filter */}
                  <div className="flex flex-wrap gap-3 items-center">
                    {/* Filter Status Indicator */}
                    {hasActiveFacilityTaskCEPathwaysFilters && (
                      <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                        <Filter className="w-3 h-3 mr-1" />
                        Filters applied
                      </div>
                    )}

                    <DateRangePicker
                      dateRange={dateRange}
                      onSelect={setDateRange}
                      placeholder="Select date range"
                      className="h-8 border-dashed"
                    />

                    {/* Apply Filters Button */}
                    <Button
                      onClick={handleFacilityTaskCEPathwaysSearch}
                      disabled={facilityTaskCEPathwaysLoading}
                      variant="outline"
                      size="sm"
                      className="h-8 border-dashed"
                    >
                      {facilityTaskCEPathwaysLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4 mr-2" />
                      )}
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </div>

              {/* Facility Task CE Pathways List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide">
                {facilityTaskCEPathwaysLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">
                      Loading facility task CE pathways...
                    </span>
                  </div>
                ) : facilityTaskCEPathwaysError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Error Loading Facility Task CE Pathways
                    </h3>
                    <p className="text-gray-600 mb-4">{facilityTaskCEPathwaysError}</p>
                    <Button
                      onClick={() => fetchFacilityTaskCEPathways()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                ) : facilityTaskCEPathways.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {facilityTaskCEPathways.map((pathway) => (
                        <div
                          key={pathway.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                                <span className="text-xs sm:text-sm font-medium text-gray-500">
                                  {new Date(pathway.lastUpdated).toLocaleDateString()}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-green-50 text-green-600 border-green-300 w-fit"
                                >
                                  Facility Task CE Pathway
                                </Badge>
                              </div>
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                                {pathway.title}
                              </h3>
                              <p className="text-gray-600 text-xs sm:text-sm mb-4">
                                {pathway.description}
                              </p>
                              <div className="flex items-center space-x-4">
                                {pathway.downloadUrl && (
                                  <button
                                    onClick={() => handleViewPdf(pathway)}
                                    className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Download className="w-4 h-4" />
                                    <span>View PDF</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {facilityTaskCEPathwaysPagination.totalPages > 1 && (
                      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-gray-600">
                          Showing {((facilityTaskCEPathwaysPagination.currentPage - 1) * facilityTaskCEPathwaysPagination.limit) + 1} to{" "}
                          {Math.min(facilityTaskCEPathwaysPagination.currentPage * facilityTaskCEPathwaysPagination.limit, facilityTaskCEPathwaysPagination.total)} of{" "}
                          {facilityTaskCEPathwaysPagination.total} results
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (facilityTaskCEPathwaysPagination.currentPage > 1) {
                                setFacilityTaskCEPathwaysPagination(prev => ({
                                  ...prev,
                                  currentPage: prev.currentPage - 1
                                }));
                                fetchFacilityTaskCEPathways({
                                  page: facilityTaskCEPathwaysPagination.currentPage - 1
                                });
                              }
                            }}
                            disabled={facilityTaskCEPathwaysPagination.currentPage === 1 || facilityTaskCEPathwaysLoading}
                            className="h-8 px-3"
                          >
                            Previous
                          </Button>
                          
                          {/* Page Numbers */}
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, facilityTaskCEPathwaysPagination.totalPages) }, (_, i) => {
                              let pageNum;
                              if (facilityTaskCEPathwaysPagination.totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (facilityTaskCEPathwaysPagination.currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (facilityTaskCEPathwaysPagination.currentPage >= facilityTaskCEPathwaysPagination.totalPages - 2) {
                                pageNum = facilityTaskCEPathwaysPagination.totalPages - 4 + i;
                              } else {
                                pageNum = facilityTaskCEPathwaysPagination.currentPage - 2 + i;
                              }
                              
                              return (
                                <Button
                                  key={pageNum}
                                  variant={facilityTaskCEPathwaysPagination.currentPage === pageNum ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => {
                                    if (facilityTaskCEPathwaysPagination.currentPage !== pageNum) {
                                      setFacilityTaskCEPathwaysPagination(prev => ({
                                        ...prev,
                                        currentPage: pageNum
                                      }));
                                      fetchFacilityTaskCEPathways({
                                        page: pageNum
                                      });
                                    }
                                  }}
                                  disabled={facilityTaskCEPathwaysLoading}
                                  className={`h-8 w-8 px-0 ${
                                    facilityTaskCEPathwaysPagination.currentPage === pageNum 
                                      ? "bg-blue-600 text-white" 
                                      : "bg-white text-gray-700 border-gray-300"
                                  }`}
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (facilityTaskCEPathwaysPagination.currentPage < facilityTaskCEPathwaysPagination.totalPages) {
                                setFacilityTaskCEPathwaysPagination(prev => ({
                                  ...prev,
                                  currentPage: prev.currentPage + 1
                                }));
                                fetchFacilityTaskCEPathways({
                                  page: facilityTaskCEPathwaysPagination.currentPage + 1
                                });
                              }
                            }}
                            disabled={facilityTaskCEPathwaysPagination.currentPage === facilityTaskCEPathwaysPagination.totalPages || facilityTaskCEPathwaysLoading}
                            className="h-8 px-3"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <ClipboardCheck className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No facility task CE pathways found
                    </h3>
                    <p className="text-gray-600">
                      No facility task critical elements pathway files are currently available.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="mt-0">
          <div className="flex flex-col lg:flex-row border border-gray-200">
            {/* Left Sidebar - Resource Categories */}
            <div className="hidden lg:flex w-80 bg-gray-50 border-r border-gray-200 flex-col h-screen">
              {/* Sidebar Header */}
              <div className="p-3 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-semibold text-gray-900">
                    Resource Categories
                  </h2>
                </div>
              </div>

              {/* Resource Categories List */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <div className="p-3 space-y-2">
                  {[
                    {
                      name: "Coming soon",
                      color: "text-blue-600",
                    },
                    
                  ].map((category, index) => (
                    <button
                      key={category.name}
                      className="w-full text-left px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer bg-gray-100 text-gray-700 hover:bg-sky-800 hover:text-white border border-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                       
                        <span>{category.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Resource Category Selector */}
            <div className="lg:hidden bg-gray-50 border-b border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Resource Category
              </label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compliance">Compliance Guides</SelectItem>
                 
                </SelectContent>
              </Select>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-auto lg:h-screen">
              {/* Breadcrumbs */}
              <div className="hidden sm:block bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
                <nav className="text-xs sm:text-sm text-gray-600">
                  <span>Resources</span>
                  <span className="mx-1 sm:mx-2">/</span>
                  <span className="text-gray-900 font-medium">
                    Other Resources
                  </span>
                </nav>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Additional compliance resources and tools
                </p>
              </div>

              {/* Main Content Header */}
              <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                      Other Resources
                    </h1>
                  </div>
                </div>
              </div>

              {/* Coming Soon Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-hide">
                <div className="text-center py-12">
                 
                  <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
                    Coming Soon
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    We're working hard to bring you additional compliance
                    resources, training materials, and tools. Stay tuned for
                    updates!
                  </p>

                
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Resource Modal */}
      <AddResourceModal
        isOpen={showAddModal}
        onClose={handleCloseAddModal}
        onSuccess={handleAddSuccess}
        resourceType={
          activeTab === "critical-elements" 
            ? "critical-element" 
            : activeTab === "facility-task-ce-pathways"
            ? "critical-element"
            : "regulation"
        }
      />

      {/* PDF Viewer Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                PDF Viewer
              </h3>
              <button
                onClick={handleClosePdfModal}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* PDF Content */}
            <div className="flex-1 p-4">
              <iframe
                src={selectedPdfUrl}
                className="w-full h-full border-0 rounded"
                title="PDF Viewer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceCenter;
