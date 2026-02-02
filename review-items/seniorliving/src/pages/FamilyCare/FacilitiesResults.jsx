import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MapPin, Phone, Star, CheckCircle, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

// Mock facilities data - in real app, this would come from an API
const generateMockFacilities = (formData) => {
  const baseFacilities = [
    {
      id: "facility-1",
      name: "Sunset Assisted Living",
      address: "123 Main Street",
      city: formData?.preferredLocation?.split(",")[0]?.trim() || "Miami",
      state: formData?.state || "Florida",
      zipCode: "33101",
      phone: "(305) 555-1234",
      distance: "2.5 miles",
      rating: 4.8,
      reviews: 127,
      priceRange: "$3,500 - $5,200/month",
      specialties: ["Memory Care", "Physical Therapy", "24/7 Nursing"],
      amenities: ["Private Rooms", "Garden", "Dining Hall", "Activity Center"],
      availability: "3 rooms available",
      matchScore: 95,
      description: "Sunset Assisted Living provides compassionate care in a warm, homelike environment. Our dedicated staff ensures residents receive personalized attention while maintaining their independence."
    },
    {
      id: "facility-2",
      name: "Golden Years Care Center",
      address: "456 Oak Avenue",
      city: formData?.preferredLocation?.split(",")[0]?.trim() || "Tampa",
      state: formData?.state || "Florida",
      zipCode: "33602",
      phone: "(813) 555-5678",
      distance: "5.1 miles",
      rating: 4.6,
      reviews: 89,
      priceRange: "$2,800 - $4,500/month",
      specialties: ["Long-term Care", "Rehabilitation", "Hospice Care"],
      amenities: ["Semi-Private Rooms", "Library", "Chapel", "Recreation Room"],
      availability: "5 rooms available",
      matchScore: 88,
      description: "Golden Years Care Center offers comprehensive care services with a focus on rehabilitation and long-term wellness. Our facility features modern amenities and experienced healthcare professionals."
    },
    {
      id: "facility-3",
      name: "Harmony Senior Living",
      address: "789 Pine Street",
      city: formData?.preferredLocation?.split(",")[0]?.trim() || "Orlando",
      state: formData?.state || "Florida",
      zipCode: "32801",
      phone: "(407) 555-9012",
      distance: "3.8 miles",
      rating: 4.9,
      reviews: 203,
      priceRange: "$4,200 - $6,000/month",
      specialties: ["Assisted Living", "Memory Care", "Respite Care"],
      amenities: ["Private Suites", "Spa", "Fitness Center", "Restaurant"],
      availability: "2 rooms available",
      matchScore: 92,
      description: "Harmony Senior Living combines luxury living with exceptional care. Our upscale facility offers resort-style amenities and personalized care plans tailored to each resident's needs."
    },
    {
      id: "facility-4",
      name: "Serenity Care Home",
      address: "321 Elm Boulevard",
      city: formData?.preferredLocation?.split(",")[0]?.trim() || "Jacksonville",
      state: formData?.state || "Florida",
      zipCode: "32202",
      phone: "(904) 555-3456",
      distance: "7.2 miles",
      rating: 4.7,
      reviews: 156,
      priceRange: "$3,200 - $4,800/month",
      specialties: ["Skilled Nursing", "Physical Therapy", "Occupational Therapy"],
      amenities: ["Private & Shared Rooms", "Therapy Gym", "Beauty Salon", "Café"],
      availability: "4 rooms available",
      matchScore: 85,
      description: "Serenity Care Home provides skilled nursing and rehabilitation services in a peaceful, supportive environment. Our team of therapists and nurses work together to promote recovery and wellness."
    }
  ]

  // Sort by match score
  return baseFacilities.sort((a, b) => b.matchScore - a.matchScore)
}

export default function FacilitiesResults() {
  const location = useLocation()
  const navigate = useNavigate()
  const formData = location.state?.formData || {}
  const facilities = generateMockFacilities(formData)

  // State for detail dialog
  const [selectedFacility, setSelectedFacility] = useState(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  // Redirect if no form data
  useEffect(() => {
    if (!location.state?.formData) {
      navigate("/family-care")
    }
  }, [location.state, navigate])

  const handleViewDetails = (facility) => {
    setSelectedFacility(facility)
    setShowDetailDialog(true)
  }

  const handleContactFacility = (facilityId) => {
    const facility = facilities.find(f => f.id === facilityId)
    toast.success(`Contacting ${facility?.name}...`)
    // In real app, this would initiate contact
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
              <h1 className="text-xl font-semibold">Mock Assisted Living</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            We Found {facilities.length} Perfect Matches!
          </h2>
          <p className="text-lg text-gray-600">
            Based on {formData?.firstName} {formData?.lastName}'s profile and preferences
          </p>
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((facility) => (
            <Card key={facility.id} className="flex flex-col h-full transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg font-semibold">{facility.name}</CardTitle>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {facility.matchScore}% Match
                      </Badge>
                    </div>
                <CardDescription className="text-sm">
                  <span className="flex items-center gap-1 mb-1">
                    <MapPin className="h-3 w-3" />
                    {facility.city}, {facility.state}
                      </span>
                      <span>{facility.distance} away</span>
                    </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col pb-4">
                <div className="space-y-3 mb-4">
                  {/* Rating */}
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-sm">{facility.rating}</span>
                    <span className="text-xs text-gray-500">({facility.reviews} reviews)</span>
                  </div>

                  {/* Price and Availability */}
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Price Range</p>
                    <p className="font-semibold text-sm text-primary">{facility.priceRange}</p>
                    <p className="text-xs text-green-600">{facility.availability}</p>
                  </div>

                  {/* Specialties - Limited */}
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Specialties</p>
                    <div className="flex flex-wrap gap-1">
                      {facility.specialties.slice(0, 2).map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {facility.specialties.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{facility.specialties.length - 2} more
                        </Badge>
                      )}
                    </div>
                    </div>
                  </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-auto pt-4 border-t">
                    <Button
                      onClick={() => handleContactFacility(facility.id)}
                    size="sm"
                    className="flex-1 text-xs"
                    >
                    <Phone className="h-3 w-3 mr-1" />
                    Contact
                    </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => handleViewDetails(facility)}
                  >
                    Details
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Need help choosing? Our care advisors are here to assist you.
          </p>
          <Button variant="outline" size="lg">
            Speak with a Care Advisor
          </Button>
        </div>
      </main>

      {/* Facility Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader onClose={() => setShowDetailDialog(false)} className="px-6 pt-6 pb-4">
            <DialogTitle className="text-2xl">{selectedFacility?.name}</DialogTitle>
            <DialogDescription>
              {selectedFacility?.address}, {selectedFacility?.city}, {selectedFacility?.state} {selectedFacility?.zipCode}
            </DialogDescription>
          </DialogHeader>
          
          {selectedFacility && (
            <div className="space-y-6 px-6 pb-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {selectedFacility.matchScore}% Match
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{selectedFacility.rating}</span>
                    <span className="text-sm text-gray-500">({selectedFacility.reviews} reviews)</span>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm text-gray-500">{selectedFacility.distance} away</p>
                  <p className="text-sm text-gray-500">{selectedFacility.phone}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-sm text-gray-600">{selectedFacility.description}</p>
              </div>

              {/* Price and Availability */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Price Range</p>
                  <p className="font-semibold text-lg text-primary">{selectedFacility.priceRange}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Availability</p>
                  <p className="font-semibold text-lg text-green-600">{selectedFacility.availability}</p>
                </div>
              </div>

              {/* Specialties */}
              <div>
                <h3 className="font-semibold mb-3">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedFacility.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="font-semibold mb-3">Amenities</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedFacility.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Button */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                <Button
                  onClick={() => {
                    setShowDetailDialog(false)
                    handleContactFacility(selectedFacility.id)
                  }}
                  className="flex-1"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Facility
                </Button>
                <Button variant="outline" onClick={() => setShowDetailDialog(false)} className="flex-1 sm:flex-initial">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
