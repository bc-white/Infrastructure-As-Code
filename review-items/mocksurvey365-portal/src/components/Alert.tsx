import * as React from "react"
import { cn } from "@/lib/utils"
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react"
import { Button } from "./ui/button"

export type AlertStatus = "error" | "warning" | "success" | "info"
export type AlertSize = "xsmall" | "small" | "large"
export type AlertStyle = "filled" | "light" | "lighter" | "stroke"

interface AlertProps {
  status: AlertStatus
  size?: AlertSize
  style?: AlertStyle
  title?: string
  description?: string
  onClose?: () => void
  className?: string
}

const statusIcons = {
  error: AlertCircle,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
}

const statusColors = {
  error: {
    filled: "bg-red-600 text-white",
    light: "bg-red-50 text-red-800",
    lighter: "bg-red-25 text-red-700",
    stroke: "border-red-300 text-red-700 bg-white",
  },
  warning: {
    filled: "bg-amber-500 text-white",
    light: "bg-amber-50 text-amber-800",
    lighter: "bg-amber-25 text-amber-700",
    stroke: "border-amber-300 text-amber-700 bg-white",
  },
  success: {
    filled: "bg-green-600 text-white",
    light: "bg-green-50 text-green-800",
    lighter: "bg-green-25 text-green-700",
    stroke: "border-green-300 text-green-700 bg-white",
  },
  info: {
    filled: "bg-blue-600 text-white",
    light: "bg-blue-50 text-blue-800",
    lighter: "bg-blue-25 text-blue-700",
    stroke: "border-blue-300 text-blue-700 bg-white",
  },
}

const sizeClasses = {
  xsmall: "p-2 text-xs",
  small: "py-2 px-[10px] text-sm",
  large: "pt-[14px] pb-4 px-[14px] text-[14px]",
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      status = "info",
      size = "large",
      style = "light",
      title,
      description,
      onClose,
      className,
      ...props
    },
    ref
  ) => {
    const Icon = statusIcons[status]
    const colorClasses = statusColors[status][style]
    const borderClass = style === "stroke" ? "border" : "border-0"

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex flex-col w-[390px] items-start rounded-lg",
          colorClasses,
          sizeClasses[size],
          borderClass,
          className
        )}
        {...props}
      >
        <div className="flex flex-1 gap-3 border">
          <Icon className={cn(
            "h-5 w-5 flex-shrink-0 border",
            size === "large" && "h-5 w-5",
            style === "filled" ? "text-white" : ""
          )} />
          <div className="flex-1">
            <h3 className={cn(
              "font-medium",
              size === "large" && "text-lg font-semibold"
            )}>
              {title}
            </h3>
            {description && (
              <p className={cn(
                "",
                size === "xsmall" ? "text-xs" : "text-sm",
                style === "filled" ? "text-white/90" : "text-current"
              )}>
                {description}
              </p>
            )}
          </div>
        </div>

        {onClose && (
          <Button
            variant="primary"
            styleType={"ghost"}
            size="icon"
            onClick={onClose}
            className={cn(
              "absolute right-2 top-2 h-6 w-6 rounded-full",
              style === "filled" ? "text-white hover:bg-white/20" : "hover:bg-black/10"
            )}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        )}
      </div>
    )
  }
)

Alert.displayName = "Alert"