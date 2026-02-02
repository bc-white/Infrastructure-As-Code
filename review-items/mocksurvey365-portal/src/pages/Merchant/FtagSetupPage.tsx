{/* Copy of FtagSetup.tsx */}
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Plus, Trash2, Edit, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { tokens } from "@/styles/theme";
import { getTheme } from "@/styles/getTheme";
import { resolveToken } from "@/utils/resolveToken";
import { getAllFtagSetups, deleteFtagSetup } from "@/api/services/ftagSetupService";
import type { FtagSetup, FtagSetupFilters } from "@/api/services/ftagSetupService";

const FtagSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = getTheme();
  
  // State for FTAG setups
  const [ftagSetups, setFtagSetups] = useState<FtagSetup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // State for filters
  const [ftagQuery, setFtagQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // State for applied filters
  const [appliedFtagQuery, setAppliedFtagQuery] = useState<string>("");
  const [appliedCategoryFilter, setAppliedCategoryFilter] = useState<string>("all");
  const [appliedStartDate, setAppliedStartDate] = useState<Date | undefined>(undefined);
  const [appliedEndDate, setAppliedEndDate] = useState<Date | undefined>(undefined);
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  

  // Categories for filtering
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(ftagSetups.map(ftag => ftag.category)));
    return ["all", ...uniqueCategories];
  }, [ftagSetups]);
  
  // Fetch FTAG setups from API
  const fetchFtagSetups = useCallback(async (filters?: FtagSetupFilters) => {
    setIsLoading(true);
    try {
      const apiFtagSetups = await getAllFtagSetups(filters);
      setFtagSetups(apiFtagSetups);
    } catch (error) {
      console.error("Error fetching FTAG setups:", error);
      toast.error("Failed to fetch FTAG setups", {
        description: "Please try again later",
      });
      setFtagSetups([]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Initial data fetch
  useEffect(() => {
    fetchFtagSetups();
  }, [fetchFtagSetups]);
  
  // Initialize applied filters with the initial filter values
  useEffect(() => {
    setAppliedFtagQuery(ftagQuery);
    setAppliedCategoryFilter(categoryFilter);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  }, []);
  
  // Filter FTAG setups based on applied filters
  const filteredFtagSetups = useMemo(() => {
    return ftagSetups.filter((ftagSetup) => {
      const matchesFtag =
        appliedFtagQuery === "" ||
        ftagSetup.ftag.toLowerCase().includes(appliedFtagQuery.toLowerCase());
      
      const matchesCategory = 
        appliedCategoryFilter === "all" || 
        ftagSetup.category === appliedCategoryFilter;
      
      const ftagDate = ftagSetup.createdAt ? new Date(ftagSetup.createdAt) : new Date();
      const matchesStartDate = !appliedStartDate || ftagDate >= appliedStartDate;
      const matchesEndDate = !appliedEndDate || ftagDate <= appliedEndDate;
      
      return matchesFtag && matchesCategory && matchesStartDate && matchesEndDate;
    });
  }, [ftagSetups, appliedFtagQuery, appliedCategoryFilter, appliedStartDate, appliedEndDate]);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredFtagSetups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPagedFtagSetups = filteredFtagSetups.slice(startIndex, endIndex);
  
  // Handle delete FTAG setup
  const handleDelete = async (ftagSetup: FtagSetup) => {
    const confirmToastId = toast(`Are you sure you want to delete "${ftagSetup.ftag}"?`, {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          // Dismiss the confirmation toast
          toast.dismiss(confirmToastId);
          
          try {
            const deletePromise = async () => {
              await deleteFtagSetup(ftagSetup.id);
              
              // Refetch data to update the table
              const apiFilters: FtagSetupFilters = {};
              if (appliedFtagQuery) apiFilters.ftag = appliedFtagQuery;
              if (appliedCategoryFilter !== "all") apiFilters.category = appliedCategoryFilter;
              if (appliedStartDate) apiFilters.startDate = appliedStartDate.toISOString().split('T')[0];
              if (appliedEndDate) apiFilters.endDate = appliedEndDate.toISOString().split('T')[0];
              await fetchFtagSetups(apiFilters);
            };

            toast.promise(deletePromise(), {
              loading: `Deleting "${ftagSetup.ftag}"...`,
              success: "FTAG setup deleted successfully",
              error: (error: any) => {
                const errorMessage = error?.response?.data?.message || error?.message || "Failed to delete FTAG setup";
                return errorMessage;
              },
            });
          } catch (error: any) {
            console.error("Error deleting FTAG setup:", error);
            const errorMessage = error?.response?.data?.message || error?.message || "Please try again later";
            toast.error("Failed to delete FTAG setup", {
              description: errorMessage,
            });
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {
          toast.dismiss(confirmToastId);
        },
      },
      duration: Infinity,
    });
  };
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
    style={{
      background: resolveToken(
        theme === "dark"
          ? tokens.Dark.Surface.Primary
          : tokens.Light.Surface.Primary
      ),
    }}
    className="container mx-auto md:px-9 px-5 pt-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1
          className="md:text-[25px] font-[500] text-[22px] mb-4 md:mb-0"
          style={{
            color: resolveToken(
              theme === "dark"
                ? tokens.Dark.Typography.Heading
                : tokens.Light.Typography.Heading
            ),
          }}
        >
          FTAG Setup
        </h1>
        <Button
          onClick={() => navigate("/dashboard/ftag-setup/add")}
          className="flex items-center gap-2"
          style={{
            background: resolveToken(
              theme === "dark"
                ? tokens.Dark.Button.Primary
                : tokens.Light.Button.Primary
            ),
            color: resolveToken(
              theme === "dark"
                ? tokens.Dark.Button["Primary Text"]
                : tokens.Light.Button["Primary Text"]
            ),
            borderRadius: resolveToken(
              theme === "dark"
                ? tokens.Dark.Radius["Radius-200"]
                : tokens.Light.Radius["Radius-200"]
            ),
          }}
        >
          <Plus size={16} />
          Add New FTAG
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
              style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                ),
              }}
            />
            <Input
              placeholder="Search by FTAG number..."
              value={ftagQuery}
              onChange={(e) => setFtagQuery(e.target.value)}
              className="pl-10"
              style={{
                background: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Surface.Foreground
                    : tokens.Light.Surface.Foreground
                ),
                borderColor: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Stroke["Stroke-02"]
                    : tokens.Light.Stroke["Stroke-02"]
                ),
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Heading
                    : tokens.Light.Typography.Heading
                ),
              }}
            />
          </div>
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger
                className="w-[180px]"
                style={{
                  background: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Surface.Foreground
                      : tokens.Light.Surface.Foreground
                  ),
                  borderColor: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Stroke["Stroke-02"]
                      : tokens.Light.Stroke["Stroke-02"]
                  ),
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Date Range Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label
              htmlFor="start-date"
              className="mb-2 block"
              style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Heading
                    : tokens.Light.Typography.Heading
                ),
              }}
            >
              Start Date
            </Label>
            <DatePicker 
              date={startDate} 
              onDateChange={setStartDate} 
              placeholder="Filter from date" 
              className="w-full" 
            />
          </div>
          <div className="flex-1">
            <Label
              htmlFor="end-date"
              className="mb-2 block"
              style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Heading
                    : tokens.Light.Typography.Heading
                ),
              }}
            >
              End Date
            </Label>
            <DatePicker 
              date={endDate} 
              onDateChange={setEndDate} 
              placeholder="Filter to date" 
              className="w-full" 
            />
          </div>
        </div>
        
        {/* Filter Action Buttons */}
        <div className="flex flex-col md:flex-row gap-2 justify-end">
          <Button
            variant="outline"
            onClick={async () => {
              // Reset input filters
              setFtagQuery("");
              setCategoryFilter("all");
              setStartDate(undefined);
              setEndDate(undefined);
              
              // Reset applied filters
              setAppliedFtagQuery("");
              setAppliedCategoryFilter("all");
              setAppliedStartDate(undefined);
              setAppliedEndDate(undefined);
              
              // Reset to first page
              setCurrentPage(1);
              
              // Fetch data without filters
              await fetchFtagSetups();
              
              // Show toast notification
              toast.success("Filters reset", {
                description: "All filters have been cleared"
              });
            }}
            className="h-10"
            style={{
              background: "transparent",
              borderColor: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Stroke["Stroke-02"]
                  : tokens.Light.Stroke["Stroke-02"]
              ),
              color: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Typography.Heading
                  : tokens.Light.Typography.Heading
              ),
            }}
          >
            Reset All Filters
          </Button>
          <Button
            onClick={async () => {
              // Apply the current filter values
              setAppliedFtagQuery(ftagQuery);
              setAppliedCategoryFilter(categoryFilter);
              setAppliedStartDate(startDate);
              setAppliedEndDate(endDate);
              
              // Reset to first page
              setCurrentPage(1);
              
              // Create filters object for API call
              const apiFilters: FtagSetupFilters = {};
              
              if (ftagQuery) apiFilters.ftag = ftagQuery;
              if (categoryFilter !== "all") apiFilters.category = categoryFilter;
              if (startDate) apiFilters.startDate = startDate.toISOString().split('T')[0];
              if (endDate) apiFilters.endDate = endDate.toISOString().split('T')[0];
              
              // Fetch data with filters
              await fetchFtagSetups(apiFilters);
              
              // Show toast notification
              toast.success("Filters applied", {
                description: "The table has been updated with your filters"
              });
            }}
            className="h-10"
            style={{
              background: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Button.Primary
                  : tokens.Light.Button.Primary
              ),
              color: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Button["Primary Text"]
                  : tokens.Light.Button["Primary Text"]
              ),
            }}
          >
            Apply Filters
          </Button>
        </div>
      </div>
      
      {/* Table */}
      <div className="rounded-md border"  style={{
              borderColor: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Stroke["Stroke-02"]
                  : tokens.Light.Stroke["Stroke-02"]
              ),
            }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead
              style={{
                background: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Surface.Secondary
                    : tokens.Light.Surface.Secondary
                ),
              }}>
              <tr>
                <th
                  className="px-4 py-3 text-left text-sm font-medium"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}>
                  FTAG
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}>
                  Category
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}>
                  Definitions
                </th>
                <th
                  className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}>
                  Date
                </th>
                <th
                  className="px-4 py-3 text-right text-sm font-medium"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody
              style={{
                background: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Surface.Foreground
                    : tokens.Light.Surface.Foreground
                ),
              }}>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>
                    Loading FTAG setups...
                  </td>
                </tr>
              ) : currentPagedFtagSetups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}>
                    No FTAG setups found. Try adjusting your filters or add a new FTAG setup.
                  </td>
                </tr>
              ) : (
                currentPagedFtagSetups.map((ftag) => (
                  <tr 
                    key={ftag.id}
                    className="border-t"
                    style={{ 
                      borderColor: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Stroke["Stroke-02"]
                          : tokens.Light.Stroke["Stroke-02"]
                      ),
                    }}
                  >
                    <td className="px-4 py-3 text-sm" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>
                      <div className="font-medium">{ftag.ftag}</div>
                      <div className="text-xs md:hidden mt-1" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}>
                        {ftag.category}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>
                      <Badge variant="outline" className="font-normal">
                        {ftag.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>
                      {ftag.definitions}
                    </td>
                    <td className="px-4 py-3 text-sm hidden md:table-cell" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Heading : tokens.Light.Typography.Heading) }}>
                      {formatDate(ftag.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/dashboard/ftag-setup/edit/${ftag.id}`)}
                          className="h-8 w-8"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Button.Primary
                                : tokens.Light.Button.Primary
                            ),
                          }}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(ftag)}
                          className="h-8 w-8"
                          style={{
                            color: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Highlight["Highlight Red"][500]
                                : tokens.Light.Highlight["Highlight Red"][500]
                            ),
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination */}
      {!isLoading && filteredFtagSetups.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-4">
          <div className="text-sm" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}>
            Showing {startIndex + 1} to {Math.min(endIndex, filteredFtagSetups.length)} of {filteredFtagSetups.length} elements
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
              style={{
                background: "transparent",
                borderColor: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Stroke["Stroke-02"]
                    : tokens.Light.Stroke["Stroke-02"]
                ),
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                ),
              }}
            >
              <ChevronsLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
              style={{
                background: "transparent",
                borderColor: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Stroke["Stroke-02"]
                    : tokens.Light.Stroke["Stroke-02"]
                ),
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                ),
              }}
            >
              <ChevronLeft size={16} />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => 
                page === 1 || 
                page === totalPages || 
                (page >= currentPage - 1 && page <= currentPage + 1)
              )
              .map((page, index, array) => {
                // Add ellipsis
                if (index > 0 && page - array[index - 1] > 1) {
                  return (
                    <React.Fragment key={`ellipsis-${page}`}>
                      <span className="flex items-center justify-center h-8 w-8" style={{ color: resolveToken(theme === "dark" ? tokens.Dark.Typography.Subtext : tokens.Light.Typography.Subtext) }}>...</span>
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        style={
                          currentPage === page
                            ? {
                                backgroundColor: resolveToken(theme === "dark" ? tokens.Dark.Button.Primary : tokens.Light.Button.Primary),
                                color: resolveToken(theme === "dark" ? tokens.Dark.Button.PrimaryText : tokens.Light.Button.PrimaryText),
                              }
                            : {
                                borderColor: resolveToken(theme === "dark" ? tokens.Dark.Button.BorderOutline : tokens.Light.Button.BorderOutline),
                                color: resolveToken(theme === "dark" ? tokens.Dark.Button.TextOutline : tokens.Light.Button.TextOutline),
                              }
                        }
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  );
                }
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    style={
                      currentPage === page
                        ? {
                            backgroundColor: resolveToken(theme === "dark" ? tokens.Dark.Button.Primary : tokens.Light.Button.Primary),
                            color: resolveToken(theme === "dark" ? tokens.Dark.Button.PrimaryText : tokens.Light.Button.PrimaryText),
                          }
                        : {
                            borderColor: resolveToken(theme === "dark" ? tokens.Dark.Button.BorderOutline : tokens.Light.Button.BorderOutline),
                            color: resolveToken(theme === "dark" ? tokens.Dark.Button.TextOutline : tokens.Light.Button.TextOutline),
                          }
                    }
                  >
                    {page}
                  </Button>
                );
              })}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
              style={{
                background: "transparent",
                borderColor: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Stroke["Stroke-02"]
                    : tokens.Light.Stroke["Stroke-02"]
                ),
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                ),
              }}
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
              style={{
                background: "transparent",
                borderColor: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Stroke["Stroke-02"]
                    : tokens.Light.Stroke["Stroke-02"]
                ),
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                ),
              }}
            >
              <ChevronsRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FtagSetupPage;
