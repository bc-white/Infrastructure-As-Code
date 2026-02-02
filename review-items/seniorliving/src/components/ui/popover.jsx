import * as React from "react"
import { cn } from "@/lib/utils"

const Popover = ({ open, onOpenChange, className, children, ...props }) => {
  const [isOpen, setIsOpen] = React.useState(open || false)

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  const handleOpenChange = (newOpen) => {
    setIsOpen(newOpen)
    if (onOpenChange) {
      onOpenChange(newOpen)
    }
  }

  return (
    <div className={cn("relative", className)} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            isOpen,
            onOpenChange: handleOpenChange,
          })
        }
        return child
      })}
    </div>
  )
}

const PopoverTrigger = React.forwardRef(({ asChild, className, children, isOpen, onOpenChange, ...props }, ref) => {
  const handleClick = () => {
    if (onOpenChange) {
      onOpenChange(!isOpen)
    }
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
      ref,
      ...props,
    })
  }

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={cn("cursor-pointer", className)}
      {...props}
    >
      {children}
    </div>
  )
})
PopoverTrigger.displayName = "PopoverTrigger"

const PopoverContent = React.forwardRef(
  ({ className, align = "center", side = "bottom", isOpen, ...props }, ref) => {
    if (!isOpen) return null

    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-50 w-72 rounded-md border bg-white p-4 text-gray-950 shadow-md outline-none",
          side === "bottom" && "top-full mt-2",
          side === "top" && "bottom-full mb-2",
          side === "left" && "right-full mr-2",
          side === "right" && "left-full ml-2",
          className
        )}
        {...props}
      />
    )
  }
)
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }

