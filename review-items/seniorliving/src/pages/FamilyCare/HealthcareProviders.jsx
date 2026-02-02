import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, MapPin, Phone, Star, Stethoscope, UserPlus, Search, CheckCircle } from "lucide-react"
import { toast } from "sonner"

// Mock healthcare providers data
const generateMockProviders = (searchQuery = "", specialty = "") => {
  const baseProviders = [
    {
      id: "provider-1",
      name: "Dr. Sarah Johnson",
      title: "Family Medicine Physician",
      specialty: "Family Medicine",
      organization: "Community Health Center",
      address: "456 Medical Plaza",
      city: "Miami",
      state: "Florida",
      zipCode: "33101",
      phone: "(305) 555-0101",
      email: "sarah.johnson@healthcenter.com",
      rating: 4.9,
      reviews: 142,
      distance: "2.1 miles",
      acceptsNewPatients: true,
      languages: ["English", "Spanish"],
      services: ["General checkups", "Preventive care", "Chronic disease management", "Wellness exams"],
      insurance: ["Medicare", "Medicaid", "Blue Cross", "Aetna"],
      availability: "Available within 2 weeks"
    },
    {
      id: "provider-2",
      name: "Dr. Michael Chen",
      title: "Geriatric Specialist",
      specialty: "Geriatrics",
      organization: "Senior Care Medical Group",
      address: "789 Elder Care Drive",
      city: "Miami",
      state: "Florida",
      zipCode: "33102",
      phone: "(305) 555-0102",
      email: "m.chen@seniorcare.com",
      rating: 4.8,
      reviews: 98,
      distance: "3.5 miles",
      acceptsNewPatients: true,
      languages: ["English", "Mandarin"],
      services: ["Geriatric assessments", "Memory care", "Medication management", "Fall prevention"],
      insurance: ["Medicare", "Medicaid", "United Healthcare"],
      availability: "Available within 1 week"
    },
    {
      id: "provider-3",
      name: "Nurse Practitioner Lisa Martinez",
      title: "Primary Care Nurse Practitioner",
      specialty: "Primary Care",
      organization: "Home Health Solutions",
      address: "123 Wellness Avenue",
      city: "Miami",
      state: "Florida",
      zipCode: "33103",
      phone: "(305) 555-0103",
      email: "l.martinez@homehealth.com",
      rating: 4.7,
      reviews: 76,
      distance: "1.8 miles",
      acceptsNewPatients: true,
      languages: ["English", "Spanish"],
      services: ["Home visits", "Health monitoring", "Lab work", "Prescription management"],
      insurance: ["Medicare", "Medicaid", "Humana"],
      availability: "Available within 3 days"
    },
    {
      id: "provider-4",
      name: "Dr. Robert Williams",
      title: "Cardiologist",
      specialty: "Cardiology",
      organization: "Heart Care Associates",
      address: "321 Cardiovascular Center",
      city: "Miami",
      state: "Florida",
      zipCode: "33104",
      phone: "(305) 555-0104",
      email: "r.williams@heartcare.com",
      rating: 4.9,
      reviews: 203,
      distance: "4.2 miles",
      acceptsNewPatients: false,
      languages: ["English"],
      services: ["Cardiac evaluations", "EKG", "Heart monitoring", "Cardiac rehabilitation"],
      insurance: ["Medicare", "Blue Cross", "Aetna", "Cigna"],
      availability: "Available within 3 weeks"
    },
    {
      id: "provider-5",
      name: "Dr. Jennifer Kim",
      title: "Physical Therapist",
      specialty: "Physical Therapy",
      organization: "Rehabilitation Services Inc.",
      address: "654 Recovery Road",
      city: "Miami",
      state: "Florida",
      zipCode: "33105",
      phone: "(305) 555-0105",
      email: "j.kim@rehabservices.com",
      rating: 4.6,
      reviews: 89,
      distance: "2.8 miles",
      acceptsNewPatients: true,
      languages: ["English", "Korean"],
      services: ["Physical therapy", "Mobility training", "Pain management", "Home exercise programs"],
      insurance: ["Medicare", "Medicaid", "Blue Cross"],
      availability: "Available within 1 week"
    },
    {
      id: "provider-6",
      name: "Dr. Patricia Brown",
      title: "Home Health Physician",
      specialty: "Home Health",
      organization: "Visiting Physicians Network",
      address: "987 Home Care Boulevard",
      city: "Miami",
      state: "Florida",
      zipCode: "33106",
      phone: "(305) 555-0106",
      email: "p.brown@visitingphysicians.com",
      rating: 4.8,
      reviews: 156,
      distance: "3.1 miles",
      acceptsNewPatients: true,
      languages: ["English"],
      services: ["Home visits", "Chronic care management", "Post-hospital care", "Telemedicine"],
      insurance: ["Medicare", "Medicaid", "United Healthcare", "Humana"],
      availability: "Available within 5 days"
    }
  ]

  let filtered = baseProviders

  // Filter by search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(
      provider =>
        provider.name.toLowerCase().includes(query) ||
        provider.specialty.toLowerCase().includes(query) ||
        provider.organization.toLowerCase().includes(query) ||
        provider.services.some(service => service.toLowerCase().includes(query))
    )
  }

  // Filter by specialty
  if (specialty && specialty !== "all") {
    filtered = filtered.filter(provider => provider.specialty === specialty)
  }

  return filtered.sort((a, b) => b.rating - a.rating)
}

export default function HealthcareProviders() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [specialty, setSpecialty] = useState("all")
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false)

  const providers = generateMockProviders(searchQuery, specialty)
  const specialties = ["All Specialties", "Family Medicine", "Geriatrics", "Primary Care", "Cardiology", "Physical Therapy", "Home Health"]

  const handleViewDetails = (provider) => {
    setSelectedProvider(provider)
    setShowDetailDialog(true)
  }

  const handleAssignProvider = (provider) => {
    setSelectedProvider(provider)
    setShowDetailDialog(false)
    setShowAssignmentDialog(true)
  }

  const handleConfirmAssignment = () => {
    // In a real app, this would assign the provider to a family member
    toast.success(`Successfully assigned ${selectedProvider?.name} to your family member!`)
    setShowAssignmentDialog(false)
    setSelectedProvider(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Stethoscope className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-semibold">Find Healthcare Providers</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Link to Healthcare Providers
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            We help you connect with qualified healthcare professionals who can assist with medical evaluations, home health services, nursing support, therapy services, and ongoing health monitoring.
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Providers</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by name, specialty, or service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Specialty</Label>
              <select
                id="specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value === "All Specialties" ? "all" : e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {specialties.map((spec) => (
                  <option key={spec} value={spec === "All Specialties" ? "all" : spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="mb-6">
          <p className="text-gray-600">
            Found <span className="font-semibold">{providers.length}</span> healthcare provider{providers.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Providers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <Card key={provider.id} className="flex flex-col h-full transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold">{provider.name}</CardTitle>
                    <CardDescription className="text-sm mt-1">{provider.title}</CardDescription>
                  </div>
                  {provider.acceptsNewPatients && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      Accepting New Patients
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm">
                  <span className="font-medium">{provider.organization}</span>
                  <span className="flex items-center gap-1 mt-1 text-xs">
                    <MapPin className="h-3 w-3" />
                    {provider.city}, {provider.state} • {provider.distance}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pb-4">
                <div className="space-y-3 mb-4">
                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-sm">{provider.rating}</span>
                    <span className="text-xs text-gray-500">({provider.reviews} reviews)</span>
                  </div>

                  {/* Specialty */}
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Specialty</p>
                    <Badge variant="secondary" className="text-xs">
                      {provider.specialty}
                    </Badge>
                  </div>

                  {/* Key Services - Limited */}
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Services</p>
                    <div className="flex flex-wrap gap-1">
                      {provider.services.slice(0, 2).map((service, index) => (
                        <span key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                          {service}
                        </span>
                      ))}
                      {provider.services.length > 2 && (
                        <span className="text-xs text-gray-500">+{provider.services.length - 2} more</span>
                      )}
                    </div>
                  </div>

                  {/* Availability */}
                  <p className="text-xs text-gray-600">{provider.availability}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-auto pt-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => handleViewDetails(provider)}
                  >
                    Details
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs bg-primary hover:bg-primary/90"
                    onClick={() => handleAssignProvider(provider)}
                    disabled={!provider.acceptsNewPatients}
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Assign
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {providers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No healthcare providers found matching your criteria.</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setSpecialty("all")
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </main>

      {/* Provider Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader onClose={() => setShowDetailDialog(false)} className="px-6 pt-6 pb-4">
            <DialogTitle className="text-2xl">{selectedProvider?.name}</DialogTitle>
            <DialogDescription>
              {selectedProvider?.title} • {selectedProvider?.organization}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProvider && (
            <div className="space-y-6 px-6 pb-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedProvider.acceptsNewPatients && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Accepting New Patients
                    </Badge>
                  )}
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{selectedProvider.rating}</span>
                    <span className="text-sm text-gray-500">({selectedProvider.reviews} reviews)</span>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-gray-500">{selectedProvider.distance} away</p>
                  <p className="text-sm text-gray-500">{selectedProvider.phone}</p>
                  <p className="text-sm text-gray-500">{selectedProvider.email}</p>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="font-semibold mb-2">Location</h3>
                <p className="text-sm text-gray-600">
                  {selectedProvider.address}, {selectedProvider.city}, {selectedProvider.state} {selectedProvider.zipCode}
                </p>
              </div>

              {/* Specialty */}
              <div>
                <h3 className="font-semibold mb-2">Specialty</h3>
                <Badge variant="secondary">{selectedProvider.specialty}</Badge>
              </div>

              {/* Services */}
              <div>
                <h3 className="font-semibold mb-3">Services</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedProvider.services.map((service, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{service}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <h3 className="font-semibold mb-2">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProvider.languages.map((lang, index) => (
                    <Badge key={index} variant="outline">{lang}</Badge>
                  ))}
                </div>
              </div>

              {/* Insurance */}
              <div>
                <h3 className="font-semibold mb-2">Accepted Insurance</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProvider.insurance.map((ins, index) => (
                    <Badge key={index} variant="secondary">{ins}</Badge>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Availability</p>
                <p className="text-sm text-gray-600">{selectedProvider.availability}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                <Button
                  onClick={() => handleAssignProvider(selectedProvider)}
                  className="flex-1"
                  disabled={!selectedProvider.acceptsNewPatients}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign to Family Member
                </Button>
                <Button variant="outline" onClick={() => setShowDetailDialog(false)} className="flex-1 sm:flex-initial">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader onClose={() => setShowAssignmentDialog(false)} className="px-6 pt-6 pb-4">
            <DialogTitle>Assign Healthcare Provider</DialogTitle>
            <DialogDescription>
              Assign {selectedProvider?.name} to a family member
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 px-6 pb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>{selectedProvider?.name}</strong> will be assigned to your family member. You can manage assignments from your dashboard.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={handleConfirmAssignment}
                className="flex-1 order-2 sm:order-1"
              >
                Confirm Assignment
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAssignmentDialog(false)}
                className="flex-1 sm:flex-initial order-1 sm:order-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

