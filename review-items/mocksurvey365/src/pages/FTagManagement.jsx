import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { DataTable } from '../components/data-table';
import { 
  RefreshCw,  
  AlertTriangle,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fTagAPI } from '../service/api';
import { toast } from 'sonner';

const FTagManagement = () => {
  const navigate = useNavigate();
  const [ftags, setFtags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    ftag: '',
    category: '',
    startDate: '',
    endDate: ''
  });
  
  // Sorting state - Default to F-Tag ascending
  const [sorting, setSorting] = useState({
    sortBy: 'ftag',
    sortOrder: 'asc' // 'asc' or 'desc'
  });
  
  // Reset key for DataTable
  const [resetKey, setResetKey] = useState(0);




  // Fetch F-Tags from API using the new endpoint
  const fetchFTags = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit
      };
      
      // Add filters to params
      if (filters.ftag) params.ftag = filters.ftag;
      if (filters.category) params.category = filters.category;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      // Add sorting to params (only if not sorting by F-Tag - we'll do F-Tag sorting client-side)
      if (sorting.sortBy && sorting.sortBy !== 'ftag') {
        params.sortBy = sorting.sortBy;
        params.sortOrder = sorting.sortOrder || 'asc';
      }
      
      // Use the existing endpoint
      const response = await fTagAPI.getAllFTags(params);

 
      
      if (response.status && response.data) {
        let sortedFtags = response.data.ftags || [];
        
        // Always sort by F-Tag numerically if sorting by F-Tag (extract number from F-Tag string)
        if (sorting.sortBy === 'ftag') {
          sortedFtags = [...sortedFtags].sort((a, b) => {
            // Extract numeric part from F-Tag (e.g., "F550" -> 550)
            const getNumericPart = (ftag) => {
              const match = ftag?.ftag?.match(/\d+/);
              return match ? parseInt(match[0], 10) : 0;
            };
            
            const numA = getNumericPart(a);
            const numB = getNumericPart(b);
            
            if (sorting.sortOrder === 'asc' || !sorting.sortOrder) {
              return numA - numB;
            } else {
              return numB - numA;
            }
          });
        }
        
        setFtags(sortedFtags);
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination
        }));
      } else {
        toast.error(response.message || 'Failed to fetch F-Tags');
      }
    } catch (err) {
     
      toast.error(err.message || 'Failed to fetch F-Tags');
    } finally {
      setLoading(false);
    }
  };



  // Filter configuration for DataTable
  const dataTableFilters = useMemo(() => [
    {
      column: "category",
      title: "Category",
      options: [
        { value: "Food and Nutrition Services", label: "Food and Nutrition Services" },
        { value: "Dental Services", label: "Dental Services" },
        { value: "Laboratory, Radiology, and Other Diagnostic Services", label: "Laboratory, Radiology, and Other Diagnostic Services" },
        { value: "Resident Rights", label: "Resident Rights" },
        { value: "Quality of Life", label: "Quality of Life" },
        { value: "Quality of Care", label: "Quality of Care" },
        { value: "Nursing Services", label: "Nursing Services" },
        { value: "Pharmacy Services", label: "Pharmacy Services" },
        { value: "Physical Environment", label: "Physical Environment" },
        { value: "Administration", label: "Administration" }
      ]
    }
  ], []);

  // Sortable Header Component
  const SortableHeader = ({ column, children }) => {
    const accessorKey = column.id || column.columnDef.accessorKey;
    const isSorted = sorting.sortBy === accessorKey;
    const sortOrder = isSorted ? sorting.sortOrder : null;

    const handleSort = () => {
      let newSortOrder = 'asc';
      if (isSorted && sortOrder === 'asc') {
        newSortOrder = 'desc';
      } else if (isSorted && sortOrder === 'desc') {
        // Clear sorting
        setSorting({ sortBy: '', sortOrder: '' });
        setPagination(prev => ({ ...prev, currentPage: 1 }));
        return;
      }
      
      setSorting({ sortBy: accessorKey, sortOrder: newSortOrder });
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    return (
      <Button
        variant="ghost"
        onClick={handleSort}
        className="h-auto p-0 font-medium hover:bg-transparent cursor-pointer"
      >
        <span className="flex items-center space-x-1">
          <span>{children}</span>
          {sortOrder === "desc" ? (
            <ArrowDown className="h-4 w-4" />
          ) : sortOrder === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowUpDown className="h-4 w-4 opacity-50" />
          )}
        </span>
      </Button>
    );
  };

  // Table columns
  const columns = useMemo(
    () => [
      {
        accessorKey: "ftag",
        header: ({ column }) => (
          <SortableHeader column={column}>
            F-Tag
          </SortableHeader>
        ),
        enableSorting: false, // We handle sorting via API
        cell: ({ row }) => (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate(`/f-tag/${row.original._id}`)}
              className="font-mono font-bold text-red-600 text-lg hover:text-red-800 hover:underline cursor-pointer transition-colors"
            >
              {row.getValue("ftag")}
            </button>
          </div>
        ),
      },
      {
        accessorKey: "definitions",
        header: ({ column }) => (
          <SortableHeader column={column}>
            Title
          </SortableHeader>
        ),
        enableSorting: false, // We handle sorting via API
        cell: ({ row }) => (
          <div className="max-w-xs">
            <div className="font-medium text-gray-900 truncate">
              {row.getValue("definitions") || 'No title available'}
            </div>
            <div className="text-sm text-gray-500 truncate">
              {row.original.rev_and_date || 'No revision date'}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: ({ column }) => (
          <SortableHeader column={column}>
            Category
          </SortableHeader>
        ),
        enableSorting: false, // We handle sorting via API
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs">
            {row.getValue("category") || 'No category'}
          </Badge>
        ),
      },   
      {
        id: "actions",
        enableHiding: false,
        enableSorting: false,
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(`/f-tag/${row.original._id}`)}
              className="hover:bg-blue-50 cursor-pointer border-2 border-gray-300 rounded-md "
            >
              <Eye className="w-4 h-4" />
            </Button>
           
          </div>
        ),
      },
    ]
  );



  // Filter handlers
  const handleFiltersChange = (newFilters) => {
    // Extract filter values from DataTable filters
    const categoryFilter = newFilters.find(f => f.id === 'category');
    const ftagFilter = newFilters.find(f => f.id === 'ftag');
    
    setFilters(prev => ({
      ...prev,
      category: categoryFilter?.value?.[0] || '',
      ftag: ftagFilter?.value || ''
    }));
  };

  const handleDateRangeChange = (dateRange) => {
    setFilters(prev => ({
      ...prev,
      startDate: dateRange.startDate || '',
      endDate: dateRange.endDate || ''
    }));
  };

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchFTags();
  };

  const handleResetFilters = async () => {
    // Clear all filters
    const clearedFilters = {
      ftag: '',
      category: '',
      startDate: '',
      endDate: ''
    };
    
    setFilters(clearedFilters);
    setSorting({ sortBy: 'ftag', sortOrder: 'asc' }); // Reset to default sort
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    setResetKey(prev => prev + 1); // Force DataTable to reset
    
    // Make API call with cleared filters
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: 1,
        limit: pagination.limit
      };
      
      // Don't add any filter parameters - this will get all data
      // F-Tag sorting will be done client-side
      const response = await fTagAPI.getAllFTags(params);

    
      
      if (response.status && response.data) {
        let sortedFtags = response.data.ftags || [];
        
        // Sort by F-Tag numerically for reset
        sortedFtags = [...sortedFtags].sort((a, b) => {
          const getNumericPart = (ftag) => {
            const match = ftag?.ftag?.match(/\d+/);
            return match ? parseInt(match[0], 10) : 0;
          };
          
          const numA = getNumericPart(a);
          const numB = getNumericPart(b);
          return numA - numB; // Always ascending on reset
        });
        
        setFtags(sortedFtags);
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination,
          currentPage: 1
        }));
      } else {
        toast.error(response.message || 'Failed to reset F-Tags');
      }
    } catch (err) {
  
      toast.error(err.message || 'Failed to reset F-Tags');
    } finally {
      setLoading(false);
    }
  };

  // Pagination handlers for API pagination
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handlePageSizeChange = (newLimit) => {
    setPagination(prev => ({ ...prev, limit: newLimit, currentPage: 1 }));
  };

  useEffect(() => {
    fetchFTags();
  }, [pagination.currentPage, pagination.limit, sorting.sortBy, sorting.sortOrder]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-10">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3"> 
              F-Tag Library
            </h1>
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
            Search and browse CMS nursing home regulations
            </p>
          </div>
        </div>

        {/* F-Tag Database */}
        <div className="bg-white rounded-[10px] border border-gray-200">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading F-Tags...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading F-Tags</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={fetchFTags} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                <DataTable 
                  key={resetKey}
                  columns={columns} 
                  data={ftags}
                  searchPlaceholder="Search F-Tags..."
                  searchColumn="ftag"
                  filters={dataTableFilters}
                  onFiltersChange={handleFiltersChange}
                  dateRange={{
                    startDate: filters.startDate,
                    endDate: filters.endDate
                  }}
                  onDateRangeChange={handleDateRangeChange}
                  onApplyFilters={handleApplyFilters}
                  onResetFilters={handleResetFilters}
                  disablePagination={true}
                />
                
                {/* API Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-2">
                    {/* Page Size Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">Show:</span>
                      <select
                        value={pagination.limit}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className="text-sm text-gray-700">per page</span>
                    </div>

                    {/* Pagination Info */}
                    <div className="text-sm text-gray-700">
                      Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} results
                    </div>

                    {/* Pagination Buttons */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={pagination.currentPage === 1}
                        className="p-2"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="p-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1 mx-2">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.currentPage >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = pagination.currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === pagination.currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="p-2"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.totalPages)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="p-2"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      
      </div>
    </div>
  );
};

export default FTagManagement;
