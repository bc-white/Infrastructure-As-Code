import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange && onOpenChange(false)}
      />
      
      {/* Dialog Wrapper */}
      <div className="relative z-50 w-full max-w-lg animate-in fade-in-0 zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  )
}

const DialogHeader = ({ children, className, onClose }) => {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6 pb-4 relative", className)}>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
      {children}
    </div>
  )
}

const DialogTitle = ({ children, className }) => {
  return (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
      {children}
    </h2>
  )
}

const DialogContent = ({ children, className }) => {
  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 overflow-hidden", className)}>
      {children}
    </div>
  )
}

const DialogDescription = ({ children, className }) => {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  )
}

const DialogTrigger = ({ asChild, children, ...props }) => {
  if (asChild) {
    // If asChild is true, clone the child element and pass props
    return React.cloneElement(React.Children.only(children), props)
  }
  return <button {...props}>{children}</button>
}

export { Dialog, DialogHeader, DialogTitle, DialogContent, DialogDescription, DialogTrigger }

