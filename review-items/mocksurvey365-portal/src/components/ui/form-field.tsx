import * as React from "react"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label: string
  description?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, description, error, required, children, className }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        {children}
        {description && !error && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {error && (
          <p className="text-sm font-medium text-destructive">{error}</p>
        )}
      </div>
    )
  }
)
FormField.displayName = "FormField"

export { FormField } 