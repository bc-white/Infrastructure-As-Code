import React from "react";
import { X, CalendarIcon, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { cn } from "../lib/utils";
import { format } from "date-fns";

// Filter options for facilities
const facilityStatuses = [
  {
    value: "Pending",
    label: "Pending",
  },
  {
    value: "Active",
    label: "Active",
  },
  {
    value: "Compliant",
    label: "Compliant",
  },
  {
    value: "Attention Needed",
    label: "Attention Needed",
  },
  {
    value: "Watch List",
    label: "Watch List",
  },
  {
    value: "Excellent",
    label: "Excellent",
  },
];

const states = [
  { value: "AK", label: "Alaska" },
  { value: "AL", label: "Alabama" },
  { value: "AR", label: "Arkansas" },
  { value: "AZ", label: "Arizona" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "IA", label: "Iowa" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "MA", label: "Massachusetts" },
  { value: "MD", label: "Maryland" },
  { value: "ME", label: "Maine" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MO", label: "Missouri" },
  { value: "MS", label: "Mississippi" },
  { value: "MT", label: "Montana" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "NE", label: "Nebraska" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NV", label: "Nevada" },
  { value: "NY", label: "New York" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VA", label: "Virginia" },
  { value: "VT", label: "Vermont" },
  { value: "WA", label: "Washington" },
  { value: "WI", label: "Wisconsin" },
  { value: "WV", label: "West Virginia" },
  { value: "WY", label: "Wyoming" },
];

export function FacilityDataTableToolbar({ 
  table, 
  filters, 
  onFiltersChange, 
  onApplyFilters,
  isLoading 
}) {
  const isFiltered = table.getState().columnFilters.length > 0 || 
    Object.values(filters || {}).some(val => val && val !== '');

  const handleInputChange = (key, value) => {
    onFiltersChange?.({ ...filters, [key]: value });
  };

  const handleDateChange = (key, date) => {
    onFiltersChange?.({ 
      ...filters, 
      [key]: date ? format(date, "yyyy-MM-dd") : "" 
    });
  };

  const clearAllFilters = () => {
   
    table.resetColumnFilters();
    const clearedFilters = {
      name: "",
      status: "",
      state: "",
      city: "",
      startDate: "",
      endDate: ""
    };
    onFiltersChange?.(clearedFilters);
    // Auto-apply the cleared filters to fetch unfiltered data
    onApplyFilters?.(clearedFilters);
  };

  return (
    <div className="space-y-4">
      {/* Search and Basic Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-1 items-center flex-wrap gap-2">
          <Input
            placeholder="Search facilities by name..."
            value={filters?.name || ""}
            onChange={(event) => handleInputChange("name", event.target.value)}
            className="h-8 w-[150px] lg:w-[250px] text-sm"
          />
          
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <DataTableViewOptions table={table} />
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-wrap items-center gap-2 p-4 bg-gray-50 rounded-lg border">
        <div className="text-sm font-medium text-gray-700 mr-2">Filters:</div>
        
        {/* City Filter */}
        <div className="flex items-center gap-1">
          <MapPin className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="City"
            value={filters?.city || ""}
            onChange={(event) => handleInputChange("city", event.target.value)}
            className="h-8 w-[120px] text-sm"
          />
        </div>

        {/* State Filter */}
        <DataTableFacetedFilter
          column={{
            getFilterValue: () => filters?.state ? [filters.state] : [],
            setFilterValue: (value) => handleInputChange("state", value?.[0] || ""),
            getFacetedUniqueValues: () => new Map()
          }}
          title="State"
          options={states}
        />

        {/* Start Date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 border-dashed text-sm",
                !filters?.startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              Start Date
              {filters?.startDate && (
                <span className="ml-2 text-xs">
                  {format(new Date(filters.startDate), "MMM dd")}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters?.startDate ? new Date(filters.startDate) : undefined}
              onSelect={(date) => handleDateChange("startDate", date)}
            />
          </PopoverContent>
        </Popover>

        {/* End Date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 border-dashed text-sm",
                !filters?.endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              End Date
              {filters?.endDate && (
                <span className="ml-2 text-xs">
                  {format(new Date(filters.endDate), "MMM dd")}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters?.endDate ? new Date(filters.endDate) : undefined}
              onSelect={(date) => handleDateChange("endDate", date)}
            />
          </PopoverContent>
        </Popover>

        {/* Apply Filters Button */}
        <Button
          onClick={() => onApplyFilters(filters)}
          size="sm"
          className="h-8"
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? "Loading..." : "Apply Filters"}
        </Button>
      </div>
    </div>
  );
}
