import { Link, useLocation } from "react-router-dom"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Breadcrumbs() {
  const location = useLocation()
  
  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split("/").filter((x) => x)
    const breadcrumbs = [{ label: "Dashboard", path: "/dashboard" }]

    // Build breadcrumbs from path segments
    let currentPath = ""
    pathnames.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Convert segment to readable label
      const label = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

      // Special cases for known routes
      let displayLabel = label
      if (segment === "builder") displayLabel = "Survey Builder"
      else if (segment === "take") displayLabel = "Taking Surveys"
      else if (segment === "instances") displayLabel = "Survey Instances"
      else if (segment === "poc") displayLabel = "Plans of Correction"
      else if (segment === "deficiencies") displayLabel = "Deficiencies"
      else if (segment === "documents") displayLabel = "Documents"
      else if (segment === "settings") displayLabel = "Settings"
      else if (segment === "surveys") displayLabel = "Surveys"

      breadcrumbs.push({
        label: displayLabel,
        path: currentPath,
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()
  const isLast = (index) => index === breadcrumbs.length - 1

  if (breadcrumbs.length <= 1) {
    return null // Don't show breadcrumbs if we're on the main dashboard
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground px-4 lg:px-6 py-3 bg-gray-50 border-b">
      <Link
        to="/dashboard"
        className="hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.path} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {isLast(index) ? (
            <span className="font-medium text-foreground">{breadcrumb.label}</span>
          ) : (
            <Link
              to={breadcrumb.path}
              className="hover:text-foreground transition-colors"
            >
              {breadcrumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}

