import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"

export function DatePicker({ date, onSelect, className, placeholder = "Pick a date", disabled, error }) {
  const [open, setOpen] = React.useState(false)
  const popoverRef = React.useRef(null)

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  return (
    <div className="relative" ref={popoverRef}>
      <Button
        variant="outline"
        type="button"
        className={cn(
          "w-full justify-start text-left font-normal",
          !date && "text-muted-foreground",
          error && "border-red-500",
          className
        )}
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? format(date, "PPP") : <span>{placeholder}</span>}
      </Button>
      {open && (
        <div className="absolute z-50 mt-2 w-auto rounded-md border bg-white p-4 shadow-md">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selectedDate) => {
              onSelect(selectedDate)
              setOpen(false)
            }}
            initialFocus
            disabled={(date) => date > new Date()}
          />
        </div>
      )}
    </div>
  )
}

