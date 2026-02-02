import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"

export default function LibraryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [selectedTag, setSelectedTag] = useState("all")

  // Mock library data - in real app, this would come from an API
  const library = {
    id: id || "library-1",
    name: "Survey Templates Library",
    description: "Collection of pre-built survey templates for various regulatory requirements",
    itemCount: 15,
    tags: ["Surveys", "Templates", "Regulations"],
    category: "Surveys",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    content: `This comprehensive library contains pre-built survey templates designed to help assisted living facilities meet various regulatory requirements across different states. The templates are regularly updated to reflect the latest compliance standards and best practices.

The Survey Templates Library is an essential resource for facility administrators, compliance officers, and quality assurance teams. It provides ready-to-use templates that can be customized to meet specific state requirements while maintaining consistency in documentation and reporting.

**Key Features:**
- State-specific survey templates for all 50 states
- Regular updates to reflect current regulatory standards
- Customizable templates that can be adapted to your facility's needs
- Comprehensive coverage of all survey types including standard surveys, complaint surveys, and follow-up surveys

**Who Should Use This Library:**
- Facility administrators preparing for state surveys
- Compliance officers ensuring regulatory adherence
- Quality assurance teams maintaining documentation standards
- Training coordinators educating staff on survey processes

**Benefits:**
- Save time with pre-built templates
- Ensure consistency across all survey documentation
- Stay current with regulatory requirements
- Reduce errors in survey preparation
- Improve survey outcomes through proper documentation`
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Blog Style */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
          {/* Back Link */}
          <button
            onClick={() => navigate("/libraries")}
            className="text-blue-600 hover:text-blue-800 hover:underline text-sm mb-8 inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Libraries
          </button>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4 leading-tight">
            {library.name}
          </h1>

          {/* Subtitle/Description */}
          <p className="text-xl sm:text-2xl text-gray-600 mb-6 leading-relaxed">
            {library.description}
          </p>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b">
            <div className="flex items-center gap-2">
              <span className="font-medium">Category:</span>
              <Badge variant="secondary">{library.category}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Items:</span>
              <span className="font-semibold text-gray-900">{library.itemCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Updated:</span>
              <span>{formatDate(library.updatedAt)}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {library.tags?.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs sm:text-sm"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content - Blog Style */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Library Content */}
        <article className="prose prose-lg max-w-none">
          <div className="text-base sm:text-lg text-gray-700 leading-relaxed whitespace-pre-line">
            {library.content}
          </div>
        </article>
      </div>
    </div>
  )
}
