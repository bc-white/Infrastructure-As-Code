import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Combobox } from "@/components/ui/combobox"
import { mockAuthService } from "../services/mockAuthService"
import { 
  Building2, 
  FileText, 
  AlertCircle, 
  TrendingUp, 
  Info,
  Calendar,
  CheckCircle,
  Clock,
  Users,
  ClipboardCheck,
  Shield,
  Activity
} from "lucide-react"
import { format, subDays } from "date-fns"
import { useUser } from "../context/UserContext"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

const COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  gray: "#6b7280"
}

export default function MultiFacility() {
  const { facility: userFacility } = useUser()
  const [facilities, setFacilities] = useState([])
  const [selectedFacilityId, setSelectedFacilityId] = useState(null)
  const [dateRange, setDateRange] = useState("30")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadFacilities()
  }, [])

  useEffect(() => {
    if (facilities.length > 0 && !selectedFacilityId) {
      const defaultFacility = userFacility 
        ? facilities.find(f => f.id === userFacility.id) || facilities[0]
        : facilities[0]
      setSelectedFacilityId(defaultFacility?.id || facilities[0]?.id)
    }
  }, [facilities, userFacility])

  const loadFacilities = () => {
    try {
      const allFacilities = mockAuthService.getAllFacilities()
      setFacilities(allFacilities)
    } catch (error) {
      console.error("Failed to load facilities:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedFacility = facilities.find(f => f.id === selectedFacilityId)

  // Generate assisted living facility-specific metrics
  const getFacilityMetrics = (facilityId) => {
    const seed = facilityId ? facilityId.charCodeAt(facilityId.length - 1) : 0
    const days = parseInt(dateRange)
    const endDate = new Date()
    const startDate = subDays(endDate, days)
    
    // Survey completion metrics
    const totalSurveys = 12 + (seed % 8)
    const completedOnTime = Math.floor(totalSurveys * (0.85 + (seed % 10) / 100))
    const completedLate = Math.floor(totalSurveys * (0.10 + (seed % 5) / 100))
    const inProgress = totalSurveys - completedOnTime - completedLate
    
    const previousOnTime = Math.floor(completedOnTime * 0.80)
    const onTimeChange = ((completedOnTime - previousOnTime) / previousOnTime * 100).toFixed(0)
    
    // Deficiency trends over time
    const deficiencyData = Array.from({ length: Math.floor(days / 7) }, (_, i) => ({
      date: format(subDays(endDate, (Math.floor(days / 7) - i - 1) * 7), "MMM dd"),
      critical: 1 + (seed % 3),
      high: 2 + (seed % 4),
      medium: 4 + (seed % 5),
      low: 6 + (seed % 6)
    }))
    
    // Resident occupancy and capacity
    const facilityCapacity = selectedFacility?.capacity || 50
    const currentResidents = Math.floor(facilityCapacity * (0.85 + (seed % 15) / 100))
    const occupancyRate = (currentResidents / facilityCapacity) * 100
    
    const occupancyData = Array.from({ length: Math.floor(days / 7) }, (_, i) => ({
      date: format(subDays(endDate, (Math.floor(days / 7) - i - 1) * 7), "MMM dd"),
      residents: currentResidents + (i % 3) - 1,
      capacity: facilityCapacity
    }))
    
    // Staff-to-resident ratio
    const totalStaff = Math.floor(currentResidents / (3.5 + (seed % 2) / 10))
    const staffRatio = (currentResidents / totalStaff).toFixed(1)
    
    // Compliance score over time
    const complianceData = Array.from({ length: Math.floor(days / 7) }, (_, i) => ({
      date: format(subDays(endDate, (Math.floor(days / 7) - i - 1) * 7), "MMM dd"),
      score: Math.min(100, 75 + (i * 2) + (seed % 10))
    }))
    
    // POC (Plan of Correction) status
    const totalPOCs = 8 + (seed % 5)
    const completedPOCs = Math.floor(totalPOCs * (0.60 + (seed % 20) / 100))
    const inProgressPOCs = Math.floor(totalPOCs * (0.25 + (seed % 10) / 100))
    const pendingPOCs = totalPOCs - completedPOCs - inProgressPOCs
    
    const pocData = [
      { name: "Completed", value: completedPOCs },
      { name: "In Progress", value: inProgressPOCs },
      { name: "Pending", value: pendingPOCs }
    ]
    
    // Survey results over time
    const surveyData = Array.from({ length: Math.floor(days / 7) }, (_, i) => ({
      date: format(subDays(endDate, (Math.floor(days / 7) - i - 1) * 7), "MMM dd"),
      stateSurvey: 85 + (i % 5) + (seed % 5),
      fireInspection: 90 + (i % 3) + (seed % 3),
      healthReview: 88 + (i % 4) + (seed % 4)
    }))
    
    // Recent surveys and inspections
    const recentSurveys = [
      { id: 1, name: "State Survey - Annual", status: "Completed", date: "Sep 5, 2024", score: 92, type: "State" },
      { id: 2, name: "Fire Safety Inspection", status: "Upcoming", date: "Sep 20, 2024", score: null, type: "Fire" },
      { id: 3, name: "Health Department Review", status: "In progress", date: "Sep 10, 2024", score: null, type: "Health" },
      { id: 4, name: "Medication Review", status: "Completed", date: "Aug 28, 2024", score: 95, type: "Medication" },
      { id: 5, name: "Quality Assurance Audit", status: "Awaiting report", date: "Sep 8, 2024", score: null, type: "Quality" }
    ]
    
    // Key metrics summary
    const activeDeficiencies = deficiencyData[deficiencyData.length - 1].critical + 
                               deficiencyData[deficiencyData.length - 1].high +
                               deficiencyData[deficiencyData.length - 1].medium +
                               deficiencyData[deficiencyData.length - 1].low
    
    const complianceScore = complianceData[complianceData.length - 1].score
    
    return {
      totalSurveys,
      completedOnTime,
      completedLate,
      inProgress,
      onTimeChange,
      deficiencyData,
      facilityCapacity,
      currentResidents,
      occupancyRate,
      occupancyData,
      totalStaff,
      staffRatio,
      complianceData,
      complianceScore,
      totalPOCs,
      completedPOCs,
      inProgressPOCs,
      pendingPOCs,
      pocData,
      surveyData,
      recentSurveys,
      activeDeficiencies,
      startDate,
      endDate
    }
  }

  const metrics = selectedFacility ? getFacilityMetrics(selectedFacility.id) : null

  const facilityOptions = facilities.map(f => f.name)

  const handleFacilityChange = (facilityName) => {
    const facility = facilities.find(f => f.name === facilityName)
    if (facility) {
      setSelectedFacilityId(facility.id)
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      "Completed": "bg-green-50 text-green-700 border-green-200",
      "Upcoming": "bg-blue-50 text-blue-700 border-blue-200",
      "In progress": "bg-amber-50 text-amber-700 border-amber-200",
      "Awaiting report": "bg-gray-50 text-gray-700 border-gray-200"
    }
    
    return (
      <Badge variant="outline" className={colors[status] || "bg-gray-50 text-gray-700 border-gray-200"}>
        {status}
      </Badge>
    )
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            Multi-Facility Overview
            <Info className="h-5 w-5 text-gray-400" />
          </h1>
        </div>
      </div>

      {/* Date Range and Facility Selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
          </select>
          {metrics && (
            <span className="text-sm text-gray-600">
              ({format(metrics.startDate, "MMM dd, yyyy")} - {format(metrics.endDate, "MMM dd, yyyy")})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-500" />
          <Combobox
            options={facilityOptions}
            value={selectedFacility?.name || ""}
            onChange={handleFacilityChange}
            placeholder="Select facility..."
            className="w-64"
          />
        </div>
      </div>

      {selectedFacility && metrics ? (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.complianceScore}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.complianceScore >= 90 ? "Excellent" : metrics.complianceScore >= 75 ? "Good" : "Needs Improvement"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Deficiencies</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeDeficiencies}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.activeDeficiencies <= 5 ? "Low" : metrics.activeDeficiencies <= 10 ? "Moderate" : "High"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(metrics.occupancyRate)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.currentResidents} of {metrics.facilityCapacity} residents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Staff-to-Resident Ratio</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1:{metrics.staffRatio}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.floor(metrics.currentResidents / parseFloat(metrics.staffRatio))} staff members
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Survey Completion Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Survey completion rate within deadline over the last {dateRange} days
              </CardTitle>
              <CardDescription>
                How often surveys are completed on time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completed on time</span>
                    <Info className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-3xl font-bold">{Math.round((metrics.completedOnTime / metrics.totalSurveys) * 100)}%</div>
                  <div className="text-sm text-gray-600">
                    {metrics.completedOnTime} of {metrics.totalSurveys} surveys
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${(metrics.completedOnTime / metrics.totalSurveys) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {parseFloat(metrics.onTimeChange) > 0 ? (
                      <>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-green-600 font-medium">{Math.abs(metrics.onTimeChange)}%</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                        <span className="text-red-600 font-medium">{Math.abs(metrics.onTimeChange)}%</span>
                      </>
                    )}
                    <span className="text-gray-600">vs previous period</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Completed late</span>
                    <Info className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-3xl font-bold">{Math.round((metrics.completedLate / metrics.totalSurveys) * 100)}%</div>
                  <div className="text-sm text-gray-600">
                    {metrics.completedLate} of {metrics.totalSurveys} surveys
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-amber-500 h-2 rounded-full transition-all"
                      style={{ width: `${(metrics.completedLate / metrics.totalSurveys) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-gray-600">Requires attention</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">In progress</span>
                    <Info className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-3xl font-bold">{Math.round((metrics.inProgress / metrics.totalSurveys) * 100)}%</div>
                  <div className="text-sm text-gray-600">
                    {metrics.inProgress} of {metrics.totalSurveys} surveys
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(metrics.inProgress / metrics.totalSurveys) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-gray-600">Currently active</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Deficiency Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Deficiency trends</CardTitle>
                <CardDescription>Deficiencies over time grouped by severity level</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics.deficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="critical" stackId="a" fill="#ef4444" name="Critical" />
                    <Bar dataKey="high" stackId="a" fill="#f59e0b" name="High" />
                    <Bar dataKey="medium" stackId="a" fill="#eab308" name="Medium" />
                    <Bar dataKey="low" stackId="a" fill="#10b981" name="Low" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* POC Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Plan of Correction status</CardTitle>
                <CardDescription>Distribution of POCs by completion status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.pocData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {metrics.pocData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.name === "Completed" ? COLORS.success :
                            entry.name === "In Progress" ? COLORS.warning :
                            COLORS.danger
                          } 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{metrics.completedPOCs}</div>
                    <div className="text-xs text-gray-600">Completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600">{metrics.inProgressPOCs}</div>
                    <div className="text-xs text-gray-600">In Progress</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{metrics.pendingPOCs}</div>
                    <div className="text-xs text-gray-600">Pending</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance Score Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Compliance score trend</CardTitle>
                <CardDescription>Overall compliance score over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.complianceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="score" 
                      stroke={COLORS.primary} 
                      fill={COLORS.primary}
                      fillOpacity={0.2}
                      name="Compliance Score"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Resident Occupancy Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resident occupancy</CardTitle>
                <CardDescription>Current residents vs facility capacity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.occupancyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="residents" 
                      stroke={COLORS.success} 
                      strokeWidth={2}
                      name="Current Residents"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="capacity" 
                      stroke={COLORS.gray} 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Capacity"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Survey Results Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Survey results trend</CardTitle>
              <CardDescription>Survey scores over time by type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.surveyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="stateSurvey" 
                    stroke={COLORS.primary} 
                    strokeWidth={2}
                    name="State Survey"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="fireInspection" 
                    stroke={COLORS.danger} 
                    strokeWidth={2}
                    name="Fire Inspection"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="healthReview" 
                    stroke={COLORS.success} 
                    strokeWidth={2}
                    name="Health Review"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Select a facility to view metrics and data
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
