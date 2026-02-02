import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import {
  Popover,
  PopoverContent,  
  PopoverTrigger,
} from "./popover"

export function DatePicker({ 
  date, 
  onSelect, 
  placeholder = "Pick a date",
  className,
  ...props 
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={"outline"}
          className={cn(
            "w-full h-10 justify-start text-left font-normal border-gray-300 hover:bg-gray-50",
            !date && "text-gray-500",
            className
          )}
          {...props}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export function DateRangePicker({ 
  dateRange, 
  onSelect, 
  placeholder = "Select dates",
  className,
  ...props 
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={"outline"}
          className={cn(
            "flex items-center space-x-2 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium",
            className
          )}
          {...props}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")}
                </>
              ) : (
                format(dateRange.from, "MMM dd, yyyy")
              )
            ) : (
              placeholder
            )}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Select Date Range</h4>
            <p className="text-xs text-gray-500">Choose start and end dates for your filter</p>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onSelect}
            numberOfMonths={1}
            className="rounded-md"
          />
          {dateRange?.from && dateRange?.to && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")}
                </span>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onSelect(undefined)}
                  variant="ghost"
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
} 