import { useAuth } from "../context/AuthContext"
import { useUser } from "../context/UserContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export default function Dashboard() {
  const { user } = useAuth()
  const { facility, getRoleName } = useUser()
  const navigate = useNavigate()

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.name || user?.email}!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              <span className="font-medium">Email:</span> {user?.email}
            </p>
            <p className="text-sm">
              <span className="font-medium">Name:</span> {user?.name || "Not set"}
            </p>
            <p className="text-sm">
              <span className="font-medium">Role:</span> {getRoleName()}
            </p>
          </CardContent>
        </Card>

        {facility && (
          <Card>
            <CardHeader>
              <CardTitle>Facility Information</CardTitle>
              <CardDescription>Your facility details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Name:</span> {facility.name}
              </p>
              <p className="text-sm">
                <span className="font-medium">Address:</span> {facility.address}
              </p>
              <p className="text-sm">
                <span className="font-medium">City:</span> {facility.city}, {facility.state}
              </p>
              <p className="text-sm">
                <span className="font-medium">License:</span> {facility.licenseNumber}
              </p>
              <p className="text-sm">
                <span className="font-medium">Capacity:</span> {facility.capacity} residents
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Dashboard features will be implemented in Phase 2.
            </p>
          </CardContent>
        </Card>
      </div>

      {!user?.onboardingCompleted && (
        <Card className="mt-6 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Onboarding Incomplete</CardTitle>
            <CardDescription className="text-yellow-700">
              Please complete your onboarding to access all features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/onboarding")}>
              Complete Onboarding
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

