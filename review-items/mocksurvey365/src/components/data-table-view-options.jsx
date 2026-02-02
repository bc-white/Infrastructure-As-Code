import { SlidersHorizontal } from "lucide-react"

import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

export function DataTableViewOptions({ table }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-8 flex border-gray-200 hover:bg-gray-50 text-xs sm:text-sm"
        >
          <SlidersHorizontal className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline">View</span>
          <span className="sm:hidden">Columns</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px] sm:w-[200px] bg-white border border-gray-200 shadow-lg" side="bottom" sideOffset={4}>
        <DropdownMenuLabel className="px-2 py-1.5 text-xs sm:text-sm font-semibold text-gray-900">Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator className="h-px bg-gray-200" />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide()
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="text-xs sm:text-sm cursor-pointer hover:bg-gray-100 focus:bg-gray-100 flex items-center gap-2 sm:gap-3 min-h-[32px] sm:min-h-[36px]"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                <span>
                  {column.id
                    .replace(/([A-Z])/g, ' $1')
                    .replace(/^./, str => str.toUpperCase())
                    .trim()}
                </span>
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 