import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { mockAuthService } from "../../services/mockAuthService"
import { Plus, Search, Building2, Filter, ChevronDown, ArrowUpDown, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

export default function FacilitiesList() {
  const navigate = useNavigate()
  const [facilities, setFacilities] = useState([])
  const [filteredFacilities, setFilteredFacilities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("createdDate")
  const [sortOrder, setSortOrder] = useState("desc")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    loadFacilities()
  }, [])

  useEffect(() => {
    filterAndSortFacilities()
  }, [facilities, searchTerm, sortBy, sortOrder, dateFilter])

  const loadFacilities = () => {
    try {
      const allFacilities = mockAuthService.getAllFacilities()
      setFacilities(allFacilities)
    } catch (error) {
      console.error("Failed to load facilities:", error)
      toast.error("Failed to load facilities")
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortFacilities = () => {
    let filtered = [...facilities]

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        facility =>
          facility.name?.toLowerCase().includes(term) ||
          facility.address?.toLowerCase().includes(term) ||
          facility.city?.toLowerCase().includes(term) ||
          facility.state?.toLowerCase().includes(term) ||
          facility.licenseNumber?.toLowerCase().includes(term) ||
          facility.id?.toLowerCase().includes(term)
      )
    }

    // Date filter
    if (dateFilter === "month") {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      filtered = filtered.filter(facility => {
        const createdDate = new Date(facility.createdAt || facility.createdDate)
        return createdDate >= startOfMonth
      })
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case "name":
          aValue = a.name?.toLowerCase() || ""
          bValue = b.name?.toLowerCase() || ""
          break
        case "createdDate":
          aValue = new Date(a.createdAt || a.createdDate || 0)
          bValue = new Date(b.createdAt || b.createdDate || 0)
          break
        case "capacity":
          aValue = a.capacity || 0
          bValue = b.capacity || 0
          break
        case "city":
          aValue = a.city?.toLowerCase() || ""
          bValue = b.city?.toLowerCase() || ""
          break
        default:
          aValue = new Date(a.createdAt || a.createdDate || 0)
          bValue = new Date(b.createdAt || b.createdDate || 0)
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0
      }
    })

    setFilteredFacilities(filtered)
  }

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      return format(date, "d MMM yyyy, h:mm a")
    } catch {
      return dateString
    }
  }

  const formatShortDate = (dateString) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      return format(date, "d MMM yyyy")
    } catch {
      return dateString
    }
  }

  const getSortIcon = (column) => {
    if (sortBy !== column) return null
    return <ArrowUpDown className="h-3 w-3 ml-1 inline" />
  }

  const handleCreateNew = () => {
    navigate("/facilities/new")
  }

  const handleViewDetail = (facilityId) => {
    navigate(`/facilities/${facilityId}`)
  }


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading facilities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Facilities</h1>
          <p className="text-muted-foreground">
            View, filter and export facilities in your account.{" "}
            <a href="#" className="text-primary hover:underline">Learn more</a>
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by Reference, Facility Name, or Location"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 text-base bg-white border-gray-200"
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={dateFilter === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateFilter(dateFilter === "month" ? "all" : "month")}
            >
              {dateFilter === "month" ? "Month to date" : "All time"}
            </Button>
            
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>

            <div className="relative">
              <Button variant="outline" size="sm" className="min-w-[200px] justify-between">
                <span>
                  {sortBy === "createdDate" && "Created Date"}
                  {sortBy === "name" && "Name"}
                  {sortBy === "capacity" && "Capacity"}
                  {sortBy === "city" && "City"}
                  {" "}
                  ({sortOrder === "desc" ? "newest first" : "oldest first"})
                </span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <div className="ml-auto">
              <Button onClick={handleCreateNew} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Facility
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        {filteredFacilities.length === 0 ? (
          <div className="text-center py-12 border border-gray-200 rounded-lg">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground text-lg mb-4">
              {searchTerm
                ? "No facilities match your search"
                : "No facilities yet. Add your first facility to get started."}
            </p>
            {!searchTerm && (
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Add Facility
              </Button>
            )}
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("id")}
                        className="flex items-center hover:text-gray-900"
                      >
                        Ref #
                        {getSortIcon("id")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center hover:text-gray-900"
                      >
                        Facility Name
                        {getSortIcon("name")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("city")}
                        className="flex items-center hover:text-gray-900"
                      >
                        Location
                        {getSortIcon("city")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      License Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("capacity")}
                        className="flex items-center hover:text-gray-900"
                      >
                        Capacity
                        {getSortIcon("capacity")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort("createdDate")}
                        className="flex items-center hover:text-gray-900"
                      >
                        Created Date
                        {getSortIcon("createdDate")}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFacilities.map((facility) => (
                    <tr key={facility.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetail(facility.id)}
                          className="text-primary hover:text-primary/80 hover:underline font-medium"
                        >
                          #{facility.id?.slice(-8).toUpperCase() || "N/A"}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {facility.name || "Unnamed Facility"}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {facility.city && facility.state
                            ? `${facility.city}, ${facility.state}`
                            : facility.address || "N/A"}
                        </div>
                        {facility.address && facility.city && (
                          <div className="text-xs text-gray-500 mt-1">
                            {facility.address}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {facility.licenseNumber || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {facility.capacity || 0} residents
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatShortDate(facility.createdAt || facility.createdDate)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(facility.createdAt || facility.createdDate).split(", ")[1]}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Active
                        </Badge>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleViewDetail(facility.id)}
                          className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
                        >
                          View
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
