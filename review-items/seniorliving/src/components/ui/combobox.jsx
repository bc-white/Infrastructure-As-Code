import { useState, useRef, useEffect } from "react"
import { Input } from "./input"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function Combobox({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  className,
  disabled = false,
  error = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  
  // Reset search term when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("")
      setHighlightedIndex(-1)
    }
  }, [isOpen])

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get display value
  const displayValue = value || ""

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm("")
        setHighlightedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedItem = listRef.current.children[highlightedIndex]
      if (highlightedItem) {
        highlightedItem.scrollIntoView({ block: "nearest" })
      }
    }
  }, [highlightedIndex])

  const handleSelect = (option) => {
    onChange(option)
    setIsOpen(false)
    setSearchTerm("")
    setHighlightedIndex(-1)
  }

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value)
    setHighlightedIndex(-1)
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case "Enter":
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex])
        } else if (filteredOptions.length === 1) {
          handleSelect(filteredOptions[0])
        }
        break
      case "Escape":
        e.preventDefault()
        setIsOpen(false)
        setSearchTerm("")
        setHighlightedIndex(-1)
        break
      default:
        break
    }
  }

  const displayText = isOpen ? searchTerm : displayValue

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={displayText}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={displayValue ? placeholder : searchPlaceholder}
          disabled={disabled}
          readOnly={!isOpen}
          className={cn(
            "pr-10 cursor-pointer",
            error && "border-red-500",
            isOpen && "ring-2 ring-ring ring-offset-2",
            !isOpen && "cursor-pointer"
          )}
        />
        <button
          type="button"
          onClick={() => {
            if (!disabled) {
              setIsOpen(!isOpen)
              if (!isOpen) {
                setSearchTerm("")
              }
            }
          }}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md max-h-60 overflow-auto">
          <div ref={listRef} className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                No states found
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center justify-between",
                    value === option && "bg-primary/10 text-primary",
                    highlightedIndex === index && "bg-gray-100"
                  )}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span>{option}</span>
                  {value === option && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

