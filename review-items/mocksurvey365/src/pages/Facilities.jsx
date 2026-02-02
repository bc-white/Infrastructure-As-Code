import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { FacilityDataTable } from "../components/facility-data-table";
import { toast } from 'sonner';
import api from '../service/api';
import Loader from '../components/loader'; 
import {
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Eye,
  Edit,
  MapPin,
  Trash2,
} from "lucide-react";

const Facilities = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    limit: 10,
    currentPage: 1
  });

  // Filter state for API calls
  const [filters, setFilters] = useState({
    name: "",
    status: "",
    state: "",
    city: "",
    startDate: "",
    endDate: ""
  });

  // Fetch facilities from API
  const fetchFacilities = async (filterParams = {}) => {
    try {
      setLoading(true);
      const response = await api.facility.getAllFacilities(filterParams);
      
      if (response && response.status && response.data) {
        // Use API data directly without transformation
        setFacilities(response.data.facilities || []);
        setPagination(response.data.pagination || {
          total: 0,
          totalPages: 1,
          limit: 10,
          currentPage: 1
        });
        
        // Show success message if we got real data
        if (response.data.facilities && response.data.facilities.length > 0) {
          toast.success(`Loaded ${response.data.facilities.length} facilities successfully`, { position: 'top-center' }, { duration: 100 });
        } else {
          toast.info('No facilities found', { position: 'top-center' }, { duration: 100 });
        }
      } else {
        // No fallback - just show empty state
        setFacilities([]);
        toast.warning('No facilities data available', { position: 'top-center' }, { duration: 100 });
      }
    } catch (error) {
      // No fallback - just show empty state
      setFacilities([]);
      toast.error('Failed to load facilities', { position: 'top-center' }, { duration: 100 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  // Handle filter changes
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Apply filters
  const handleApplyFilters = (filtersToApply = null) => {
    // Use provided filters or current state filters
    const filtersToUse = filtersToApply || filters;
    
    // Only send non-empty filter values
    const activeFilters = Object.entries(filtersToUse).reduce((acc, [key, value]) => {
      // Check if value is a string and not empty after trimming
      if (typeof value === 'string' && value.trim() !== '') {
        acc[key] = value.trim();
      }
      // Handle array values (from faceted filters)
      else if (Array.isArray(value) && value.length > 0) {
        acc[key] = value[0]; // Take the first selected value
      }
      return acc;
    }, {});

    fetchFacilities(activeFilters);
  };

  // Since we're doing server-side filtering, we don't need client-side filtering anymore
  // We can keep this for backwards compatibility or local search
  const filteredFacilities = useMemo(() => {
    return facilities.filter((facility) => {
      // Only apply local search if no server filters are active
      const hasServerFilters = Object.values(filters).some(val => val && val !== '');
      if (hasServerFilters) {
        return true; // Don't filter locally when server is filtering
      }
      const matchesSearch =
        facility.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${facility.address?.city || ''}, ${facility.address?.state || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facility.type?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facility.providerNumber?.toLowerCase().includes(searchTerm.toLowerCase());

      const normalizedStatus = facility.status?.toLowerCase().replace(' ', '-') || 'pending';
      const matchesFilter =
        selectedFilter === "all" ||
        (selectedFilter === "compliant" && normalizedStatus === "compliant") ||
        (selectedFilter === "attention" && normalizedStatus === "attention-needed") ||
        (selectedFilter === "watch-list" && normalizedStatus === "watch-list") ||
        (selectedFilter === "excellent" && normalizedStatus === "excellent") ||
        (selectedFilter === "pending" && normalizedStatus === "pending");

      return matchesSearch && matchesFilter;
    });
  }, [facilities, searchTerm, selectedFilter, filters]);

  const getStatusBadge = (status) => {
    const normalizedStatus = status?.toLowerCase().replace(' ', '-') || 'pending';
    const statusConfig = {
      compliant: {
        color: "bg-green-100 text-green-700 border",
        label: "Compliant",
      },
      "attention-needed": {
        color: "bg-yellow-100 text-yellow-700 border",
        label: "Needs Attention",
      },
      "watch-list": {
        color: "bg-red-100 text-red-700 border",
        label: "Watch List",
      },
      excellent: {
        color: "bg-blue-100 text-blue-700 border",
        label: "Excellent",
      },
      pending: {
        color: "bg-gray-100 text-gray-700 border",
        label: "Pending",
      },
    };

    const config = statusConfig[normalizedStatus] || statusConfig["pending"];
    return (
      <Badge className={`${config.color} font-medium`}>{config.label}</Badge>
    );
  };

  const getRiskScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-gray-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  // Handle delete facility
  const handleDeleteFacility = async (facilityId) => {
    toast.error('Are you sure you want to delete this facility?', {
      description: 'This action cannot be undone.',
      duration: 0,
      position: 'top-center',
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            const response = await api.facility.deleteFacility(facilityId);
            if (response) {
              toast.success("Facility deleted successfully", { position: 'top-center' }, { duration: 100 });
              // Refresh the facilities list
              fetchFacilities();
            }
          } catch (error) {
           
            toast.error(error.message || "Failed to delete facility", { position: 'top-center' }, { duration: 100 });
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {
          // User cancelled the action
        },
      },
    });
  };

  // Table columns
  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-gray-100 text-gray-700 font-medium"
          >
            Facility
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button> 
        ),
        cell: ({ row }) => (
          <div className="flex items-center space-x-3 min-w-0">
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-900 text-sm truncate">
                {row.original.name}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <MapPin className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {`${row.original.address?.city || ''}, ${row.original.address?.state || ''}`}
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                {row.original.type?.name && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700"
                  >
                    {row.original.type.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "providerNumber",
        header: "Provider #",
        cell: ({ row }) => (
          <div className="text-sm font-medium text-gray-900">
            {row.original.providerNumber || 'N/A'}
          </div>
        ),
      },
      { 
        accessorKey: "lastSurvey",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-gray-100 text-gray-700 font-medium "
          >
            Last Survey
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const lastSurvey = row.getValue("lastSurvey");
          if (!lastSurvey) {
            return (
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500">
                  No Survey
                </Badge>
              </div>
            );
          }
          
          const surveyDate = new Date(lastSurvey);
          const formattedDate = surveyDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          });
          
          // Calculate days since last survey
          const daysSince = Math.floor((new Date() - surveyDate) / (1000 * 60 * 60 * 24));
          
          return (
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-gray-900">
                {formattedDate}
              </span>
              <span className={`text-xs ${
                daysSince > 365 ? 'text-red-500' : 
                daysSince > 180 ? 'text-yellow-600' : 
                'text-gray-500'
              }`}>
                {daysSince > 0 ? `${daysSince} days ago` : 'Today'}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/facility/${row.original._id}`)}
              className="hover:bg-gray-100 border border-gray-200"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/facility/${row.original._id}/edit`)}
              className="hover:bg-gray-100 border border-gray-200"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteFacility(row.original._id)}
              className="hover:bg-red-50 border border-gray-200 text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    [navigate]
  );

  // Loading state
  return (
    <div className="min-h-screen relative">
      {/* Loading Modal Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center shadow-xl">
            <Loader />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Loading Facilities
            </h3>
            <p className="text-gray-600">
              Please wait while we fetch your facility data...
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Facilities
                </h1>
                <p className="text-gray-500 text-sm sm:text-base">
                  Manage all your client facilities from one centralized location
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => window.location.href = "/facility/add"}
              className="bg-[#075b7d] hover:bg-[#075b7d] text-white h-12 px-6 text-base"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Facility
            </Button>
          </div>
        </div>

        {/* Facilities Table */}
        <div className="bg-white rounded-xl border border-gray-200 ">
         
          {/* Data Table */}
          <div className="p-6">
            <FacilityDataTable 
              columns={columns} 
              data={filteredFacilities}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onApplyFilters={handleApplyFilters}
              isLoading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Facilities;
