import { X } from "lucide-react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { DateRangePicker } from "./ui/date-picker";
import { DataTableViewOptions } from "./data-table-view-options";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";

// Define filter options for surveys
const surveyStatuses = [
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "pending",
    label: "Pending",
  },
  {
    value: "in-progress",
    label: "In Progress",
  },
];

const surveyTypes = [
  {
    value: "standard",
    label: "Standard Survey",
  },
  {
    value: "follow-up",
    label: "Follow-up Survey",
  },
  {
    value: "complaint",
    label: "Complaint Survey",
  },
];

export function DataTableToolbar({ table, searchPlaceholder = "Search...", searchColumn = "name", filters = [], dateRange, onDateRangeChange, onApplyFilters, onResetFilters }) {
  const isFiltered = table.getState().columnFilters.length > 0;
  
  // Early return if table is not ready
  if (!table || !table.getAllColumns || table.getAllColumns().length === 0) {
    return null;
  }

  // Check if search column exists before trying to use it
  const searchColumnObj = searchColumn ? table.getColumn(searchColumn) : null;


  return (
    <div className="flex flex-col gap-3 sm:gap-4 py-3 sm:py-4 data-table-toolbar">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-1 items-center flex-wrap gap-2 w-full sm:w-auto"> 
          {searchColumnObj && (
            <Input
              placeholder={searchPlaceholder}
              value={searchColumnObj.getFilterValue() ?? ""}
              onChange={(event) =>
                searchColumnObj.setFilterValue(event.target.value)
              }
              className="h-8 w-full sm:w-[150px] lg:w-[250px] text-xs sm:text-sm"
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <DataTableViewOptions table={table} />
        </div>
      </div>
      <div className="flex items-center flex-wrap gap-2">
          {filters.map((filter) => {
            const column = table.getColumn(filter.column);
            if (!column) {
            
              return null;
            }
            
            return (
              <DataTableFacetedFilter
                key={filter.column}
                column={column}
                title={filter.title}
                options={filter.options}
              />
            );
          })}
          {onDateRangeChange && (
            <DateRangePicker
              dateRange={(dateRange?.startDate || dateRange?.endDate) ? {
                from: dateRange?.startDate ? new Date(dateRange.startDate) : undefined,
                to: dateRange?.endDate ? new Date(dateRange.endDate) : undefined,
              } : undefined}
              onSelect={(range) => {
                // Don't auto-trigger API calls, just update local state
                if (!range || (!range.from && !range.to)) {
                  onDateRangeChange({ startDate: '', endDate: '' });
                  return;
                }
                const toYmd = (d) => d ? new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0,10) : '';
                onDateRangeChange({ startDate: toYmd(range.from), endDate: toYmd(range.to) });
              }}
              placeholder="Filter by date range"
              className="h-8"
            />
          )}
          {onApplyFilters && (
            <Button
              variant="default"
              size="sm"
              onClick={onApplyFilters}
              className="h-8 px-3 text-xs sm:text-sm bg-[#075b7d] hover:bg-[#075b7d]"
            >
              Search
            </Button>
          )}
          {onResetFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="h-8 px-3 text-xs sm:text-sm"
            >
              Reset All
            </Button>
          )}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-2 lg:px-3 text-xs sm:text-sm"
            >
              Reset
              <X className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
    </div>
  );
} 