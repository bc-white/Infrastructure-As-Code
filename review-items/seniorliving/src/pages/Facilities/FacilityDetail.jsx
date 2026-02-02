import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Building2, MapPin, Phone, Mail, TrendingUp } from "lucide-react"
import { mockAuthService } from "../../services/mockAuthService"
import { toast } from "sonner"

export default function FacilityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [facility, setFacility] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  // Mock data for metrics, services, staff, and residents
  const [metrics] = useState({
    totalResidents: 45,
    occupancyRate: 90,
    totalStaff: 28,
    staffToResidentRatio: "1:1.6",
    complianceScore: 98,
    surveysCompleted: 12,
    surveysPending: 2
  })

  const [staffMembers] = useState([
    { id: 1, name: "Sarah Johnson", role: "Administrator", email: "sarah.j@facility.com", phone: "(555) 123-4567", status: "Active" },
    { id: 2, name: "Michael Chen", role: "Director of Nursing", email: "michael.c@facility.com", phone: "(555) 123-4568", status: "Active" },
    { id: 3, name: "Emily Rodriguez", role: "Activities Coordinator", email: "emily.r@facility.com", phone: "(555) 123-4569", status: "Active" },
    { id: 4, name: "David Thompson", role: "Maintenance Supervisor", email: "david.t@facility.com", phone: "(555) 123-4570", status: "Active" },
    { id: 5, name: "Lisa Anderson", role: "Registered Nurse", email: "lisa.a@facility.com", phone: "(555) 123-4571", status: "Active" }
  ])

  const [residents] = useState([
    { id: 1, name: "John Smith", room: "101", admissionDate: "2023-01-15", status: "Active", careLevel: "Assisted Living" },
    { id: 2, name: "Mary Johnson", room: "102", admissionDate: "2023-02-20", status: "Active", careLevel: "Memory Care" },
    { id: 3, name: "Robert Williams", room: "103", admissionDate: "2023-03-10", status: "Active", careLevel: "Assisted Living" },
    { id: 4, name: "Patricia Brown", room: "201", admissionDate: "2023-04-05", status: "Active", careLevel: "Skilled Nursing" },
    { id: 5, name: "James Davis", room: "202", admissionDate: "2023-05-12", status: "Active", careLevel: "Assisted Living" }
  ])

  useEffect(() => {
    loadFacility()
  }, [id])

  const loadFacility = () => {
    try {
      const allFacilities = mockAuthService.getAllFacilities()
      const foundFacility = allFacilities.find(f => f.id === id)
      
      if (foundFacility) {
        setFacility(foundFacility)
      } else {
        toast.error("Facility not found")
        navigate("/facilities")
      }
    } catch (error) {
      console.error("Failed to load facility:", error)
      toast.error("Failed to load facility")
      navigate("/facilities")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading facility details...</p>
        </div>
      </div>
    )
  }

  if (!facility) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 break-words">
                {facility.name || "Facility Details"}
              </h1>
              <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                {facility.city && facility.state 
                  ? `${facility.city}, ${facility.state}`
                  : facility.address || "Location information"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/facilities/edit/${facility.id}`)}
              className="shrink-0"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Facility Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Facility Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">License Number</label>
                    <p className="text-sm font-semibold mt-1">{facility.licenseNumber || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Capacity</label>
                    <p className="text-sm font-semibold mt-1">{facility.capacity || "N/A"} residents</p>
                  </div>
                  {facility.address && (
                    <div className="sm:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Address
                      </label>
                      <p className="text-sm mt-1">{facility.address}</p>
                      {facility.city && facility.state && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {facility.city}, {facility.state} {facility.zipCode || ""}
                        </p>
                      )}
                    </div>
                  )}
                  {facility.phone && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        Phone
                      </label>
                      <p className="text-sm mt-1">{facility.phone}</p>
                    </div>
                  )}
                  {facility.email && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        Email
                      </label>
                      <p className="text-sm mt-1">{facility.email}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </TabsContent>

          {/* Key Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Key Metrics
                </CardTitle>
                <CardDescription>Performance and operational metrics for this facility</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Metrics Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <label className="text-sm font-medium text-muted-foreground">Total Residents</label>
                    <p className="text-2xl font-bold mt-2">{metrics.totalResidents}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <label className="text-sm font-medium text-muted-foreground">Occupancy Rate</label>
                    <p className="text-2xl font-bold mt-2">{metrics.occupancyRate}%</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <label className="text-sm font-medium text-muted-foreground">Total Staff</label>
                    <p className="text-2xl font-bold mt-2">{metrics.totalStaff}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <label className="text-sm font-medium text-muted-foreground">Staff:Resident Ratio</label>
                    <p className="text-2xl font-bold mt-2">{metrics.staffToResidentRatio}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <label className="text-sm font-medium text-muted-foreground">Compliance Score</label>
                    <p className="text-2xl font-bold mt-2 text-green-600">{metrics.complianceScore}%</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <label className="text-sm font-medium text-muted-foreground">Surveys Completed</label>
                    <p className="text-2xl font-bold mt-2">{metrics.surveysCompleted}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <label className="text-sm font-medium text-muted-foreground">Surveys Pending</label>
                    <p className="text-2xl font-bold mt-2">{metrics.surveysPending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}
