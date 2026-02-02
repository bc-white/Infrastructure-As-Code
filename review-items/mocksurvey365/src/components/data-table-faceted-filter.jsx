import * as React from "react"
import { Check, Plus } from "lucide-react"

import { cn } from "../lib/utils"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover"
import { Separator } from "./ui/separator"

export function DataTableFacetedFilter({
  column,
  title,
  options,
}) {
  const facets = column?.getFacetedUniqueValues()
  const selectedValues = new Set(column?.getFilterValue())

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed text-xs sm:text-sm">
          <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">{title}</span>
          <span className="sm:hidden">{title.split(' ')[0]}</span>
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal text-xs sm:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 sm:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] sm:w-[200px] p-0 bg-white border border-gray-200 shadow-lg" align="start" side="bottom" sideOffset={4}>
        <Command className="bg-white">
          <CommandInput placeholder={title} className="border-b border-gray-200" />
          <CommandList className="bg-white">
            <CommandEmpty className="py-6 text-center text-xs sm:text-sm text-gray-500">No results found.</CommandEmpty>
            <CommandGroup className="bg-white">
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    className="flex items-center space-x-2 px-2 py-1.5 text-xs sm:text-sm cursor-pointer hover:bg-gray-100"
                    onSelect={() => {
                      if (isSelected) {
                        selectedValues.delete(option.value)
                      } else {
                        selectedValues.add(option.value)
                      }
                      const filterValues = Array.from(selectedValues)
                      column?.setFilterValue(
                        filterValues.length ? filterValues : undefined
                      )
                    }}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 [&_svg]:invisible"
                      )}
                    >
                      <Check className={cn("h-3 w-3")} />
                    </div>
                    <span className="flex-1">{option.label}</span>
                    {facets?.get(option.value) && (
                      <span className="ml-auto text-xs text-gray-500 font-mono">
                        {facets.get(option.value)}
                      </span>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator className="h-px bg-gray-200" />
                <CommandGroup className="bg-white">
                  <CommandItem
                    onSelect={() => column?.setFilterValue(undefined)}
                    className="justify-center text-center py-2 text-xs sm:text-sm cursor-pointer hover:bg-gray-100 text-gray-600"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 