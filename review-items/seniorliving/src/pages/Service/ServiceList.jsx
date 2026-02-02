import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Edit, Trash2, MoreVertical, Wrench } from "lucide-react"
import { toast } from "sonner"
import { useConfirm } from "../../hooks/useConfirm"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ServiceList() {
  const navigate = useNavigate()
  const { confirm, ConfirmDialog } = useConfirm()
  const [services, setServices] = useState([])
  const [filteredServices, setFilteredServices] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Mock services data
  useEffect(() => {
    const mockServices = [
      {
        id: "service-1",
        name: "Resident Care Services",
        description: "Comprehensive care services for residents including ADL assistance",
        category: "Care Services",
        status: "Active",
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: "2024-01-15T10:00:00Z"
      },
      {
        id: "service-2",
        name: "Medication Management",
        description: "Medication administration and monitoring services",
        category: "Medical Services",
        status: "Active",
        createdAt: "2024-01-14T14:30:00Z",
        updatedAt: "2024-01-14T14:30:00Z"
      },
      {
        id: "service-3",
        name: "Transportation Services",
        description: "Scheduled transportation for medical appointments and activities",
        category: "Support Services",
        status: "Active",
        createdAt: "2024-01-13T09:15:00Z",
        updatedAt: "2024-01-13T09:15:00Z"
      },
      {
        id: "service-4",
        name: "Housekeeping Services",
        description: "Regular housekeeping and maintenance services",
        category: "Support Services",
        status: "Inactive",
        createdAt: "2024-01-12T16:45:00Z",
        updatedAt: "2024-01-12T16:45:00Z"
      }
    ]
    setServices(mockServices)
    setFilteredServices(mockServices)
  }, [])

  useEffect(() => {
    filterServices()
  }, [services, searchTerm])

  const filterServices = () => {
    let filtered = [...services]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        service =>
          service.name.toLowerCase().includes(term) ||
          service.description.toLowerCase().includes(term) ||
          service.category.toLowerCase().includes(term)
      )
    }

    setFilteredServices(filtered)
  }

  const handleCreateNew = () => {
    navigate("/service/new")
  }

  const handleEdit = (serviceId) => {
    navigate(`/service/edit/${serviceId}`)
  }

  const handleDelete = async (serviceId) => {
    const confirmed = await confirm("Are you sure you want to delete this service? This action cannot be undone.", {
      title: "Delete Service",
      variant: "destructive",
      confirmText: "Delete"
    })
    if (!confirmed) return

    try {
      setServices(services.filter(s => s.id !== serviceId))
      toast.success("Service deleted successfully")
    } catch (error) {
      console.error("Failed to delete service:", error)
      toast.error("Failed to delete service")
    }
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "Active":
        return "default"
      case "Inactive":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-muted-foreground mt-1">
            Manage facility services and offerings
          </p>
        </div>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create New Service
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "No services match your search"
                  : "No services yet. Create your first service to get started."}
              </p>
              {!searchTerm && (
                <Button onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Service
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredServices.map((service) => (
            <Card key={service.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{service.name}</CardTitle>
                      <Badge variant={getStatusBadgeVariant(service.status)}>
                        {service.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-base">
                      {service.description}
                    </CardDescription>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(service.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(service.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Category:</span>
                    <span>{service.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Last Updated:</span>
                    <span>{formatDate(service.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ConfirmDialog />
    </div>
  )
}

