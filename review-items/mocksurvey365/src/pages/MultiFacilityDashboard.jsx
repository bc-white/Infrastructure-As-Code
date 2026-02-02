import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useFeatureGate } from "../contexts/FeatureGateContext";
import { useDebounce } from "../hooks/useDebounce";
import { toast } from 'sonner';
import api from '../service/api'; 
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale 
} from 'chart.js';
import {
  Line,
  Bar,
  Doughnut,
  Radar,
  Scatter
} from 'react-chartjs-2';
import BenchmarkComparison from '../components/charts/BenchmarkComparison';
import RiskAnalysis from '../components/charts/RiskAnalysis';
import {
  Building2, 
  TrendingDown,
  AlertTriangle,
  FileText,
  BarChart3,
  Target,
  Award,
  Activity,
  Shield,
  PieChart,
  LineChart,
  BarChart,
  ArrowRight,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Heart,
  Stethoscope,
  UserCheck,
  ClipboardCheck,
  Star,
  DollarSign,
  MapPin,
  Thermometer,
  Gauge,
  Bed,
  Hospital,
  Syringe,
  CreditCard,
  TrendingUp,
  Search,
  X,
  AlertCircle,
  RefreshCw
} from "lucide-react";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

const MultiFacilityDashboard = () => { 
  const navigate = useNavigate();
  const { canAccessMultiFacility } = useFeatureGate();
  const [facilities, setFacilities] = useState([]);
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasNoResults, setHasNoResults] = useState(false);
  
  const isLegacyFormat = apiData && !!apiData.overview;
  const isNewFormat = apiData && !apiData?.overview && typeof apiData?.totalFacilities !== "undefined";

  const formatNumber = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "N/A";
    }
    return new Intl.NumberFormat().format(Number(value));
  };

  const formatDecimal = (value, decimals = 1) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "N/A";
    }
    return Number(value).toFixed(decimals);
  };

  const formatPercentage = (value, decimals = 1) => {
    const formatted = formatDecimal(value, decimals);
    return formatted === "N/A" ? formatted : `${formatted}%`;
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "N/A";
    }
    return `$${formatNumber(value)}`;
  };

  // Debounce search term with 500ms delay
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // All users can access multi-facility features now
  // Backend will handle actual data restrictions

  // Map icon components based on metric label
  const getIconForMetric = (label) => {
    const iconMap = {
      'Total Facilities': Building2,
      'Average Star Rating': Star,
      'Average Occupancy': Users, 
      'Risk Score': Shield,
      'Satisfaction Score': Heart,
      'Staffing Score': UserCheck,
      'Active Surveys': FileText
    };
    return iconMap[label] || Building2;
  };

const formatColumnLabel = (key = "") => {
  if (!key) return "";
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

  // Fetch multi-facility metrics from API
  const fetchMultiFacilityMetrics = async (filters = {}, searchTermValue = "") => {
    try {
      setLoading(true);
      const response = await api.facility.getMultiFacilityMetrics(filters);
      
      // Handle case when API returns status: false with a message (e.g., no facilities found)
      if (response && response.status === false && response.statusCode === 400) {
        setApiData(null);
        setHasNoResults(true);
        if (searchTermValue) {
          toast.info(response.message || `No facilities found matching "${searchTermValue}"`, { position: 'top-right' });
        }  
        return;
      }
      
      // Handle case when API returns status: true but with empty data object (no facilities found)
      if (response && response.status === true && response.data && Object.keys(response.data).length === 0) {
        setApiData(null);
        setHasNoResults(true);
        if (searchTermValue) {
          toast.info(response.message || `No facilities found matching "${searchTermValue}"`, { position: 'top-right' });
        }  
        return;
      }
      
      if (response && response.status && response.data && Object.keys(response.data).length > 0) {
        setApiData(response.data);
        
        const facilityCount =
          response.data.metadata?.totalFacilities ||
          response.data.overview?.totalFacilities?.value ||
          response.data.totalFacilities ||
          0;
        if (facilityCount > 0) {
          setHasNoResults(false);
          const filterInfo = searchTermValue ? ` (filtered by "${searchTermValue}")` : '';
          toast.success(response.message || `Loaded metrics for ${facilityCount} facilities${filterInfo}`, { position: 'top-right' });
        } else {
          setHasNoResults(searchTermValue ? true : false);
          if (searchTermValue) {
            toast.info(`No facilities found matching "${searchTermValue}"`, { position: 'top-right' });
          } 
        }
      } else {
        setApiData(null);
        setHasNoResults(searchTermValue ? true : false);
        toast.warning('No metrics data available for analytics', { position: 'top-right' });
      }
    } catch (error) {
      
      setApiData(null);
      setHasNoResults(searchTermValue ? true : false);
      toast.error('Failed to load multi-facility metrics', { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when debounced search term changes
  useEffect(() => {
    const filters = {};
    if (debouncedSearchTerm.trim()) {
      filters.facilityName = debouncedSearchTerm.trim();
    }
    fetchMultiFacilityMetrics(filters, debouncedSearchTerm);
     
  }, [debouncedSearchTerm]);

  // Enhanced CMS-style metrics with comprehensive data
  // Transform API response to component format
  const metrics = useMemo(() => {
    if (isLegacyFormat && apiData?.overview) {
      const overview = apiData.overview;
      const metricOrder = [
        "totalFacilities",
        "averageStarRating",
        "averageOccupancy",
        "totalDeficiencies",
        "riskScore",
        "satisfactionScore",
        "staffingScore",
        "activeSurveys"
      ];

      return metricOrder
        .map((key) => {
          const metric = overview[key];
          if (!metric) return null;

          const value = typeof metric.value === "number" ? metric.value.toString() : metric.value;

          const trend = key.includes("Deficiencies") || key === "riskScore" ? "down" : "up";
          const change =
            key.includes("Deficiencies")
              ? -8
              : key === "riskScore"
              ? -5
              : key === "activeSurveys"
              ? -3
              : key === "totalFacilities"
              ? 12
              : key.includes("Rating")
              ? 0.3
              : key.includes("Occupancy")
              ? 2.5
              : key.includes("Satisfaction")
              ? 3.2
              : 1.8;
          const changeText = key === "totalFacilities" ? "vs last quarter" : "vs last month";

          return {
            title: metric.label,
            value,
            change,
            changeText,
            trend,
            icon: getIconForMetric(metric.label),
            color:
              key === "totalFacilities"
                ? "blue"
                : key.includes("Star")
                ? "yellow"
                : key.includes("Occupancy")
                ? "green"
                : key.includes("Deficiencies")
                ? "red"
                : key.includes("Risk")
                ? "purple"
                : key.includes("Satisfaction")
                ? "pink"
                : key.includes("Staffing")
                ? "indigo"
                : "teal",
            subtitle: metric.subtitle
          };
        })
        .filter(Boolean);
    }

    if (isNewFormat && apiData) {
      const {
        totalFacilities,
        avgOverallRating,
        avgStaffingHours,
        avgQMRating,
        avgTurnover,
        totalDeficiencies,
        totalCertifiedBeds,
        totalFinesInDollars
      } = apiData;

      const fallbackDeficiencies = Array.isArray(apiData.deficiencyBreakdown)
        ? apiData.deficiencyBreakdown.reduce((sum, item) => sum + (Number(item?.count) || 0), 0)
        : 0;
      const safeTotalDeficiencies =
        totalDeficiencies !== null && totalDeficiencies !== undefined && !Number.isNaN(Number(totalDeficiencies))
          ? Number(totalDeficiencies)
          : fallbackDeficiencies;

      return [
        {
          title: "Total Facilities",
          value: formatNumber(totalFacilities),
          change: "—",
          changeText: "Current total",
          trend: "up",
          icon: Building2,
          color: "blue",
          subtitle: "Active facilities"
        },
        {
          title: "Average Overall Rating",
          value: formatDecimal(avgOverallRating, 1),
          change: "—",
          changeText: "CMS star rating",
          trend: "neutral",
          icon: Star,
          color: "yellow",
          subtitle: "CMS 5-star rating"
        },
        {
          title: "Average Staffing Hours",
          value: formatDecimal(avgStaffingHours, 2),
          change: "—",
          changeText: "Hours / resident / day",
          trend: "neutral",
          icon: Users,
          color: "green",
          subtitle: "Hours per resident day"
        },
        {
          title: "Average QM Rating",
          value: formatDecimal(avgQMRating, 1),
          change: "—",
          changeText: "Quality measures",
          trend: "neutral",
          icon: Award,
          color: "indigo",
          subtitle: "Quality measure rating"
        },
        {
          title: "Average Turnover",
          value: formatPercentage(avgTurnover, 1),
          change: "—",
          changeText: "Staff turnover",
          trend: "down",
          icon: RefreshCw,
          color: "purple",
          subtitle: "Turnover rate"
        },
        {
          title: "Total Fines (USD)",
          value: formatCurrency(totalFinesInDollars),
          change: "—",
          changeText: "Cumulative fines",
          trend: "neutral",
          icon: CreditCard,
          color: "teal",
          subtitle: "All reported fines"
        },
        {
          title: "Total Deficiencies",
          value: formatNumber(safeTotalDeficiencies),
          change: "—",
          changeText: "Across facilities",
          trend: "down",
          icon: AlertTriangle,
          color: "red",
       
        },
        {
          title: "Total Certified Beds",
          value: formatNumber(totalCertifiedBeds),
          change: "—",
          changeText: "Certified capacity",
          trend: "neutral",
          icon: Bed,
          color: "pink",
          subtitle: "Certified beds"
        }
      ];
    }

    if (facilities.length === 0) return [];

    const totalFacilities = facilities.length;
    const avgStarRating =
      facilities.reduce((sum, f) => sum + (f.starRating || 3.5), 0) / totalFacilities;
    const avgOccupancy =
      facilities.reduce((sum, f) => sum + (f.occupancyRate || 85), 0) / totalFacilities;
    const totalDeficiencies = facilities.reduce((sum, f) => sum + (f.deficiencyCount || 0), 0);
    const avgRiskScore =
      facilities.reduce((sum, f) => sum + (f.riskScore || 70), 0) / totalFacilities;
    const avgSatisfaction =
      facilities.reduce((sum, f) => sum + (f.satisfactionScore || 85), 0) / totalFacilities;
    const avgStaffing =
      facilities.reduce((sum, f) => sum + (f.staffingScore || 80), 0) / totalFacilities;

    return [
      {
        title: "Total Facilities",
        value: totalFacilities.toString(),
        change: 12,
        changeText: "vs last quarter",
        trend: "up",
        icon: Building2,
        color: "blue",
        subtitle: "Active facilities"
      },
      {
        title: "Average Star Rating",
        value: avgStarRating.toFixed(1),
        change: 0.3,
        changeText: "vs last month",
        trend: "up",
        icon: Star,
        color: "yellow",
        subtitle: "CMS 5-star rating"
      },
      {
        title: "Average Occupancy",
        value: `${avgOccupancy.toFixed(1)}%`,
        change: 2.5,
        changeText: "vs last month",
        trend: "up",
        icon: Users,
        color: "green",
        subtitle: "Bed utilization"
      },
      {
        title: "Total Deficiencies",
        value: totalDeficiencies.toString(),
        change: -8,
        changeText: "vs last quarter",
        trend: "down",
        icon: AlertTriangle,
        color: "red",
      
      },
      {
        title: "Risk Score",
        value: avgRiskScore.toFixed(0),
        change: -5,
        changeText: "vs last month",
        trend: "down",
        icon: Shield,
        color: "purple",
        subtitle: "Overall risk level"
      },
      {
        title: "Satisfaction Score",
        value: `${avgSatisfaction.toFixed(1)}%`,
        change: 3.2,
        changeText: "vs last month",
        trend: "up",
        icon: Heart,
        color: "pink",
        subtitle: "Resident satisfaction"
      },
      {
        title: "Staffing Score",
        value: `${avgStaffing.toFixed(1)}%`,
        change: 1.8,
        changeText: "vs last month",
        trend: "up",
        icon: UserCheck,
        color: "indigo",
        subtitle: "Staff adequacy"
      },
      {
        title: "Active Surveys",
        value: facilities.reduce((sum, f) => sum + (f.surveyCount || 0), 0).toString(),
        change: -3,
        changeText: "vs last month",
        trend: "down",
        icon: FileText,
        color: "teal",
        subtitle: "In progress"
      }
    ];
  }, [apiData, facilities, isLegacyFormat, isNewFormat]);

  // Enhanced analytics with CMS-style comprehensive data
  // Transform API response to analytics format
  const legacyAnalytics = useMemo(() => {
    if (isLegacyFormat && apiData) {
      const totalFacilities =
        apiData.metadata?.totalFacilities || apiData.overview?.totalFacilities?.value || 0;

      const qualityMetrics = apiData.qualityOfCare?.qualitySummary
        ? {
            rehospitalizationRate: parseFloat(
              apiData.qualityOfCare.qualitySummary.rehospitalizationRate?.value?.replace("%", "") ||
                "0"
            ),
            pressureUlcerRate: parseFloat(
              apiData.qualityOfCare.qualitySummary.pressureUlcerRate?.value?.replace("%", "") ||
                "0"
            ),
            fallRate: parseFloat(
              apiData.qualityOfCare.qualitySummary.fallRate?.value?.replace("%", "") || "0"
            ),
            infectionRate: parseFloat(
              apiData.qualityOfCare?.clinicalQualityIndicators?.data?.[3] || "0"
            ),
            painManagement: parseFloat(
              apiData.qualityOfCare.qualitySummary.painManagement?.value?.replace("%", "") || "0"
            )
          }
        : null;

      const staffingMetrics = apiData.staffingWorkforce?.staffingSummary
        ? {
            rnHprd: parseFloat(apiData.staffingWorkforce.staffingSummary.rnHprd?.value || "0"),
            lpnHprd: parseFloat(apiData.staffingWorkforce.staffingSummary.lpnHprd?.value || "0"),
            cnaHprd: parseFloat(apiData.staffingWorkforce.staffingSummary.cnaHprd?.value || "0"),
            turnoverRate: parseFloat(
              apiData.staffingWorkforce.staffingSummary.turnoverRate?.value?.replace("%", "") || "0"
            ),
            staffingCompliance: 78.5
          }
        : null;

      const complianceMetrics = {
        deficiencyCount: apiData.overview?.totalDeficiencies?.value || 0,
        scopeSeverity: {
          immediateJeopardy: 0,
          actualHarm: 0,
          noActualHarm: 0,
          standard: 0
        },
        fTagDistribution: {
          f880: 0,
          f812: 0,
          f689: 0,
          f684: 0
        }
      };

      const operationalMetrics = {
        avgOccupancy: parseFloat(
          apiData.overview?.averageOccupancy?.value?.replace("%", "") || "0"
        ),
        payerMix: {
          medicare: 35,
          medicaid: 45,
          privatePay: 20
        },
        operatingMargin: 5.2,
        costPerResidentDay: 285
      };

      const experienceMetrics = {
        residentSatisfaction: parseFloat(
          apiData.overview?.satisfactionScore?.value?.replace("%", "") || "0"
        ),
        familySatisfaction: 82,
        complaintRate: 2.3,
        grievanceResolutionDays: 7.5
      };

      const riskData = apiData.facilityOverview?.riskAssessmentDistribution;
      const riskAssessment = {
        highRisk: riskData?.data?.[0] || 0,
        mediumRisk: riskData?.data?.[1] || 0,
        lowRisk: riskData?.data?.[2] || 0,
        avgRiskScore: parseFloat(apiData.overview?.riskScore?.value || "0")
      };

      const starData = apiData.facilityOverview?.starRatingDistribution;
      const starDistribution = {
        fiveStar: starData?.data?.[0] || 0,
        fourStar: starData?.data?.[1] || 0,
        threeStar: starData?.data?.[2] || 0,
        twoStar: starData?.data?.[3] || 0,
        oneStar: starData?.data?.[4] || 0
      };

      const statusDistribution = {};

      return {
        totalFacilities,
        qualityMetrics:
          qualityMetrics || {
            rehospitalizationRate: 15.2,
            pressureUlcerRate: 8.5,
            fallRate: 12.3,
            infectionRate: 3.8,
            painManagement: 88.5
          },
        staffingMetrics:
          staffingMetrics || {
            rnHprd: 0.8,
            lpnHprd: 0.6,
            cnaHprd: 2.1,
            turnoverRate: 45.2,
            staffingCompliance: 78.5
          },
        complianceMetrics,
        operationalMetrics,
        experienceMetrics,
        riskAssessment,
        statusDistribution,
        starDistribution
      };
    }

    if (facilities.length === 0) return null;

    const totalFacilities = facilities.length;

    const qualityMetrics = {
      rehospitalizationRate:
        facilities.reduce((sum, f) => sum + (f.rehospitalizationRate || 15.2), 0) / totalFacilities,
      pressureUlcerRate:
        facilities.reduce((sum, f) => sum + (f.pressureUlcerRate || 8.5), 0) / totalFacilities,
      fallRate: facilities.reduce((sum, f) => sum + (f.fallRate || 12.3), 0) / totalFacilities,
      infectionRate: facilities.reduce((sum, f) => sum + (f.infectionRate || 3.8), 0) / totalFacilities,
      painManagement: facilities.reduce((sum, f) => sum + (f.painManagement || 88.5), 0) / totalFacilities
    };

    const staffingMetrics = {
      rnHprd: facilities.reduce((sum, f) => sum + (f.rnHprd || 0.8), 0) / totalFacilities,
      lpnHprd: facilities.reduce((sum, f) => sum + (f.lpnHprd || 0.6), 0) / totalFacilities,
      cnaHprd: facilities.reduce((sum, f) => sum + (f.cnaHprd || 2.1), 0) / totalFacilities,
      turnoverRate: facilities.reduce((sum, f) => sum + (f.turnoverRate || 45.2), 0) / totalFacilities,
      staffingCompliance:
        facilities.reduce((sum, f) => sum + (f.staffingCompliance || 78.5), 0) / totalFacilities
    };

    const complianceMetrics = {
      deficiencyCount: facilities.reduce((sum, f) => sum + (f.deficiencyCount || 8), 0),
      scopeSeverity: {
        immediateJeopardy: facilities.filter((f) => f.scopeSeverity === "J").length,
        actualHarm: facilities.filter((f) => f.scopeSeverity === "G").length,
        noActualHarm: facilities.filter((f) => f.scopeSeverity === "D").length,
        standard: facilities.filter((f) => f.scopeSeverity === "A").length
      },
      fTagDistribution: {
        f880: facilities.reduce((sum, f) => sum + (f.f880Count || 0), 0),
        f812: facilities.reduce((sum, f) => sum + (f.f812Count || 0), 0),
        f689: facilities.reduce((sum, f) => sum + (f.f689Count || 0), 0),
        f684: facilities.reduce((sum, f) => sum + (f.f684Count || 0), 0)
      }
    };

    const operationalMetrics = {
      avgOccupancy:
        facilities.reduce((sum, f) => sum + (f.occupancyRate || 85), 0) / totalFacilities,
      payerMix: {
        medicare:
          facilities.reduce((sum, f) => sum + (f.medicarePercent || 35), 0) / totalFacilities,
        medicaid:
          facilities.reduce((sum, f) => sum + (f.medicaidPercent || 45), 0) / totalFacilities,
        privatePay:
          facilities.reduce((sum, f) => sum + (f.privatePayPercent || 20), 0) / totalFacilities
      },
      operatingMargin:
        facilities.reduce((sum, f) => sum + (f.operatingMargin || 5.2), 0) / totalFacilities,
      costPerResidentDay:
        facilities.reduce((sum, f) => sum + (f.costPerResidentDay || 285), 0) / totalFacilities
    };

    const experienceMetrics = {
      residentSatisfaction:
        facilities.reduce((sum, f) => sum + (f.residentSatisfaction || 85), 0) / totalFacilities,
      familySatisfaction:
        facilities.reduce((sum, f) => sum + (f.familySatisfaction || 82), 0) / totalFacilities,
      complaintRate:
        facilities.reduce((sum, f) => sum + (f.complaintRate || 2.3), 0) / totalFacilities,
      grievanceResolutionDays:
        facilities.reduce((sum, f) => sum + (f.grievanceResolutionDays || 7.5), 0) / totalFacilities
    };

    const riskAssessment = {
      highRisk: facilities.filter((f) => (f.riskScore || 70) >= 80).length,
      mediumRisk: facilities.filter((f) => (f.riskScore || 70) >= 60 && (f.riskScore || 70) < 80).length,
      lowRisk: facilities.filter((f) => (f.riskScore || 70) < 60).length,
      avgRiskScore: facilities.reduce((sum, f) => sum + (f.riskScore || 70), 0) / totalFacilities
    };

    const statusDistribution = facilities.reduce((acc, f) => {
      const status = f.status?.toLowerCase().replace(" ", "-") || "pending";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const starDistribution = {
      fiveStar: facilities.filter((f) => (f.starRating || 3.5) >= 4.5).length,
      fourStar: facilities.filter(
        (f) => (f.starRating || 3.5) >= 3.5 && (f.starRating || 3.5) < 4.5
      ).length,
      threeStar: facilities.filter(
        (f) => (f.starRating || 3.5) >= 2.5 && (f.starRating || 3.5) < 3.5
      ).length,
      twoStar: facilities.filter(
        (f) => (f.starRating || 3.5) >= 1.5 && (f.starRating || 3.5) < 2.5
      ).length,
      oneStar: facilities.filter((f) => (f.starRating || 3.5) < 1.5).length
    };

    return {
      totalFacilities,
      qualityMetrics,
      staffingMetrics,
      complianceMetrics,
      operationalMetrics,
      experienceMetrics,
      riskAssessment,
      statusDistribution,
      starDistribution
    };
  }, [apiData, facilities, isLegacyFormat]);

  const newAnalytics = useMemo(() => {
    if (!isNewFormat || !apiData) return null;

    const toNumber = (value) => {
      if (value === null || value === undefined || value === "") return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const deficiencyBreakdown = Array.isArray(apiData.deficiencyBreakdown)
      ? apiData.deficiencyBreakdown.map((item) => ({
          deficiency: item?.deficiency || "Unknown",
          count: toNumber(item?.count) ?? 0
        }))
      : [];

    const rawFacilityComparison = Array.isArray(apiData.facilityComparison)
      ? apiData.facilityComparison
      : [];

    const facilityComparison = rawFacilityComparison
      .map((facility) => {
        if (!facility) return null;

        const normalized = {
          name: facility.name || facility.facility || "",
          overallRating: toNumber(facility.overallRating ?? facility.rating),
          qmRating: toNumber(facility.qmRating),
          staffingHours: toNumber(facility.staffingHours),
          turnover: toNumber(facility.turnover),
          inspectionScore: toNumber(facility.inspectionScore),
          certifiedBeds: toNumber(facility.certifiedBeds),
          city: facility.city || "",
          numberOfFines: toNumber(facility.Number_of_Fines ?? facility.numberOfFines),
          totalFineAmount: toNumber(
            facility.Total_Amount_of_Fines_in_Dollars ?? facility.totalFineAmount
          ),
          raw: facility
        };

        return normalized;
      })
      .filter((facility) => {
        if (!facility) return false;
        const rawData = facility.raw && typeof facility.raw === "object" ? facility.raw : {};
        const hasName =
          facility.name?.trim() ||
          rawData.name?.trim() ||
          rawData.facility?.trim() ||
          rawData.Facility?.trim();
        const hasMetrics = [
          "overallRating",
          "qmRating",
          "staffingHours",
          "turnover",
          "inspectionScore",
          "certifiedBeds",
          "numberOfFines",
          "totalFineAmount"
        ].some((field) => facility[field] !== null && facility[field] !== undefined);
        const hasRawData = Object.values(rawData).some((value) => {
          if (value === null || value === undefined) return false;
          if (typeof value === "string") {
            return value.trim() !== "" && value.trim().toLowerCase() !== "undefined";
          }
          return true;
        });
        return Boolean(hasName || hasMetrics || hasRawData);
      });

    const performanceGroups = apiData.performanceGroups || {
      topPerformers: [],
      averagePerformers: [],
      lowPerformers: []
    };

    const averages = {
      overallRating: toNumber(apiData.avgOverallRating) ?? 0,
      staffingHours: toNumber(apiData.avgStaffingHours) ?? 0,
      qmRating: toNumber(apiData.avgQMRating) ?? 0,
      turnover: toNumber(apiData.avgTurnover) ?? 0,
      certifiedBeds: toNumber(apiData.totalCertifiedBeds) ?? 0
    };

    const totalDeficienciesFromBreakdown = deficiencyBreakdown.reduce(
      (sum, item) => sum + (item.count || 0),
      0
    );

    const totals = {
      totalFacilities: toNumber(apiData.totalFacilities) ?? 0,
      totalDeficiencies:
        toNumber(apiData.totalDeficiencies) ?? totalDeficienciesFromBreakdown,
      totalFinesInDollars: toNumber(apiData.totalFinesInDollars) ?? 0
    };

    const derivedRatings = facilityComparison
      .map((facility) => facility?.overallRating)
      .filter((value) => typeof value === "number" && !Number.isNaN(value));

    const derivedStaffing = facilityComparison
      .map((facility) => facility?.staffingHours)
      .filter((value) => typeof value === "number" && !Number.isNaN(value));

    const computedRatingGap =
      derivedRatings.length >= 2
        ? Math.max(...derivedRatings) - Math.min(...derivedRatings)
        : derivedRatings.length === 1
        ? 0
        : null;

    const computedStaffingGap =
      derivedStaffing.length >= 2
        ? Math.max(...derivedStaffing) - Math.min(...derivedStaffing)
        : derivedStaffing.length === 1
        ? 0
        : null;

    const highestRatedFacility = Object.keys(apiData.highestRatedFacility || {}).length
      ? apiData.highestRatedFacility
      : derivedRatings.length
      ? (() => {
          const highest = facilityComparison.reduce((best, facility) => {
            if (facility.overallRating === null) return best;
            if (!best) return facility;
            return facility.overallRating > best.overallRating ? facility : best;
          }, null);
          return highest
            ? {
                name: highest.name,
                rating: highest.overallRating,
                city: highest.city
              }
            : {};
        })()
      : {};

    const lowestRatedFacility = Object.keys(apiData.lowestRatedFacility || {}).length
      ? apiData.lowestRatedFacility
      : derivedRatings.length
      ? (() => {
          const lowest = facilityComparison.reduce((worst, facility) => {
            if (facility.overallRating === null) return worst;
            if (!worst) return facility;
            return facility.overallRating < worst.overallRating ? facility : worst;
          }, null);
          return lowest
            ? {
                name: lowest.name,
                rating: lowest.overallRating,
                city: lowest.city
              }
            : {};
        })()
      : {};

    const ratingGap =
      apiData.ratingGap !== null && apiData.ratingGap !== undefined
        ? toNumber(apiData.ratingGap)
        : computedRatingGap;

    const staffingGap =
      apiData.staffingGap !== null && apiData.staffingGap !== undefined
        ? toNumber(apiData.staffingGap)
        : computedStaffingGap ?? 0;

    return {
      deficiencyBreakdown,
      facilityComparison,
      performanceGroups,
      averages,
      totals,
      trendInsight: apiData.trendInsight,
      highestRatedFacility,
      lowestRatedFacility,
      ratingGap,
      staffingGap
    };
  }, [apiData, isNewFormat]);

  const facilityComparisonColumns = useMemo(() => {
    if (!newAnalytics?.facilityComparison?.length) return [];

    const normalizedKeys = [
      "name",
      "overallRating",
      "qmRating",
      "staffingHours",
      "turnover",
      "inspectionScore",
      "certifiedBeds",
      "city",
      "numberOfFines",
      "totalFineAmount"
    ];

    const priorityOrder = [
      "name",
      "facility",
      "Facility",
      "city",
      "City",
      "overallRating",
      "qmRating",
      "staffingHours",
      "turnover",
      "inspectionScore",
      "certifiedBeds",
      "Number_of_Fines",
      "numberOfFines",
      "Total_Amount_of_Fines_in_Dollars",
      "totalFineAmount"
    ];

    const collectedKeys = new Set(normalizedKeys);

    newAnalytics.facilityComparison.forEach((facility) => {
      if (facility?.raw && typeof facility.raw === "object") {
        Object.keys(facility.raw)
          .filter(Boolean)
          .forEach((key) => collectedKeys.add(key));
      }
    });

    const seen = new Set();
    const orderedKeys = [];

    const addKey = (key) => {
      if (!key || seen.has(key) || !collectedKeys.has(key)) return;
      orderedKeys.push(key);
      seen.add(key);
    };

    priorityOrder.forEach(addKey);

    Array.from(collectedKeys)
      .filter((key) => !seen.has(key))
      .sort((a, b) => a.localeCompare(b))
      .forEach(addKey);

    return orderedKeys.map((key) => ({
      key,
      label: formatColumnLabel(key)
    }));
  }, [newAnalytics]);

  const hasMeaningfulValue = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return false;
      const lowered = trimmed.toLowerCase();
      return lowered !== "undefined" && lowered !== "null" && lowered !== "nan";
    }
    return true;
  };

  const applyNumericFormatting = (key, numericValue) => {
    if (numericValue === null || numericValue === undefined || Number.isNaN(numericValue)) {
      return "—";
    }

    const lowerKey = key.toLowerCase();

    if (
      lowerKey.includes("turnover") ||
      lowerKey.includes("percent") ||
      lowerKey.includes("percentage") ||
      lowerKey.endsWith("%")
    ) {
      return formatPercentage(numericValue, 1);
    }

    if (lowerKey.includes("hours")) {
      return formatDecimal(numericValue, 2);
    }

    if (lowerKey.includes("rating") && !lowerKey.includes("cycle")) {
      return formatDecimal(numericValue, 1);
    }

    if (
      lowerKey.includes("fine") ||
      lowerKey.includes("amount") ||
      lowerKey.includes("dollar") ||
      lowerKey.includes("penalty")
    ) {
      return `$${formatNumber(numericValue)}`;
    }

    if (lowerKey.includes("score")) {
      return formatDecimal(numericValue, lowerKey.includes("inspection") ? 0 : 1);
    }

    if (
      lowerKey.includes("beds") ||
      lowerKey.includes("count") ||
      lowerKey.includes("number") ||
      lowerKey.includes("incidents") ||
      lowerKey.includes("deficien")
    ) {
      return formatNumber(numericValue);
    }

    if (!Number.isInteger(numericValue)) {
      return formatDecimal(numericValue, 2);
    }

    return formatNumber(numericValue);
  };

  const formatFacilityComparisonValue = (key, value) => {
    if (!hasMeaningfulValue(value)) return "—";

    if (typeof value === "number") {
      return applyNumericFormatting(key, value);
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      const numericCandidate = Number(trimmed.replace(/,/g, ""));

      if (!Number.isNaN(numericCandidate) && trimmed !== "") {
        const formatted = applyNumericFormatting(key, numericCandidate);
        return formatted === "—" ? trimmed : formatted;
      }

      return trimmed;
    }

    return String(value);
  };

  const getFacilityComparisonValue = (facility, columnKey) => {
    if (!facility) return "—";

    const directValue = facility[columnKey];
    if (hasMeaningfulValue(directValue)) {
      return formatFacilityComparisonValue(columnKey, directValue);
    }

    if (facility.raw && hasMeaningfulValue(facility.raw[columnKey])) {
      return formatFacilityComparisonValue(columnKey, facility.raw[columnKey]);
    }

    return "—";
  };

  const newPerformanceStats = useMemo(() => {
    if (!newAnalytics) return [];

    const {
      averages: { overallRating, staffingHours, qmRating, turnover, certifiedBeds },
      totals: { totalFacilities, totalDeficiencies, totalFinesInDollars }
    } = newAnalytics;
    const { highestRatedFacility, lowestRatedFacility, ratingGap, staffingGap } = newAnalytics;

    return [
      {
        label: "Average Overall Rating",
        value: formatDecimal(overallRating, 1)
      },
      {
        label: "Average QM Rating",
        value: formatDecimal(qmRating, 1)
      },
      {
        label: "Average Staffing Hours",
        value: formatDecimal(staffingHours, 2)
      },
      {
        label: "Average Turnover",
        value: formatPercentage(turnover, 1)
      },
      {
        label: "Total Certified Beds",
        value: formatNumber(certifiedBeds)
      },
      {
        label: "Total Facilities",
        value: formatNumber(totalFacilities)
      },
      {
        label: "Total Deficiencies",
        value: formatNumber(totalDeficiencies)
      },
      {
        label: "Total Fines (USD)",
        value: formatCurrency(totalFinesInDollars)
      },
      {
        label: "Rating Gap",
        value: formatDecimal(ratingGap, 2)
      },
      {
        label: "Staffing Gap (hrs)",
        value: formatDecimal(staffingGap, 2)
      }
    ];
  }, [newAnalytics]);

  const newFacilityHighlights = useMemo(() => {
    if (!newAnalytics) return null;
    const { highestRatedFacility, lowestRatedFacility, ratingGap, staffingGap } = newAnalytics;

    const formatFacility = (facility) => ({
      name: facility?.name || facility?.facility || "N/A",
      rating: formatDecimal(facility?.rating ?? facility?.overallRating, 1),
      city: facility?.city || "—"
    });

    return {
      highest: formatFacility(highestRatedFacility),
      lowest: formatFacility(lowestRatedFacility),
      ratingGap: formatDecimal(ratingGap, 2),
      staffingGap: formatDecimal(staffingGap, 2)
    };
  }, [newAnalytics]);

  const newTrendInsight = useMemo(() => {
    if (!newAnalytics?.trendInsight) return null;
    return newAnalytics.trendInsight.replace(/undefined|NaN/g, "N/A").trim();
  }, [newAnalytics]);

  // Chart data preparation
  const legacyChartData = useMemo(() => {
    if (!legacyAnalytics) return null;

    const qualityChartData = apiData?.qualityOfCare?.clinicalQualityIndicators;
    const staffingChartData = apiData?.staffingWorkforce?.hprdByCategory;
    const starChartData = apiData?.facilityOverview?.starRatingDistribution;
    const riskChartData = apiData?.facilityOverview?.riskAssessmentDistribution;

    return {
      qualityCareData: {
        labels:
          qualityChartData?.labels || [
            "Rehospitalization",
            "Pressure Ulcers",
            "Falls",
            "Infections",
            "Pain Management"
          ],
        datasets: [
          {
            label: "Current Rate (%)",
            data:
              qualityChartData?.data || [
                legacyAnalytics.qualityMetrics.rehospitalizationRate,
                legacyAnalytics.qualityMetrics.pressureUlcerRate,
                legacyAnalytics.qualityMetrics.fallRate,
                legacyAnalytics.qualityMetrics.infectionRate,
                100 - legacyAnalytics.qualityMetrics.painManagement
              ],
            backgroundColor: ["#ef4444", "#f97316", "#eab308", "#dc2626", "#22c55e"],
            borderColor: ["#dc2626", "#ea580c", "#ca8a04", "#b91c1c", "#16a34a"],
            borderWidth: 1
          }
        ]
      },
      staffingData: {
        labels: staffingChartData?.labels || ["RN", "LPN", "CNA"],
        datasets: [
          {
            label: "Hours Per Resident Day",
            data:
              staffingChartData?.data || [
                legacyAnalytics.staffingMetrics.rnHprd,
                legacyAnalytics.staffingMetrics.lpnHprd,
                legacyAnalytics.staffingMetrics.cnaHprd
              ],
            backgroundColor: ["#3b82f6", "#8b5cf6", "#06b6d4"],
            borderColor: ["#2563eb", "#7c3aed", "#0891b2"],
            borderWidth: 1
          }
        ]
      },
      complianceData: {
        labels: ["Immediate Jeopardy", "Actual Harm", "No Actual Harm", "Standard"],
        datasets: [
          {
            label: "Deficiency Count",
            data: [
              legacyAnalytics.complianceMetrics.scopeSeverity.immediateJeopardy,
              legacyAnalytics.complianceMetrics.scopeSeverity.actualHarm,
              legacyAnalytics.complianceMetrics.scopeSeverity.noActualHarm,
              legacyAnalytics.complianceMetrics.scopeSeverity.standard
            ],
            backgroundColor: ["#dc2626", "#f97316", "#eab308", "#22c55e"],
            borderColor: ["#b91c1c", "#ea580c", "#ca8a04", "#16a34a"],
            borderWidth: 1
          }
        ]
      },
      experienceData: {
        labels: ["Resident Satisfaction", "Family Satisfaction"],
        datasets: [
          {
            data: [
              legacyAnalytics.experienceMetrics.residentSatisfaction,
              legacyAnalytics.experienceMetrics.familySatisfaction
            ],
            backgroundColor: ["#3b82f6", "#8b5cf6"],
            borderColor: ["#2563eb", "#7c3aed"],
            borderWidth: 2
          }
        ]
      },
      starRatingData: {
        labels: starChartData?.labels || ["5 Star", "4 Star", "3 Star", "2 Star", "1 Star"],
        datasets: [
          {
            data:
              starChartData?.data || [
                legacyAnalytics.starDistribution.fiveStar,
                legacyAnalytics.starDistribution.fourStar,
                legacyAnalytics.starDistribution.threeStar,
                legacyAnalytics.starDistribution.twoStar,
                legacyAnalytics.starDistribution.oneStar
              ],
            backgroundColor: ["#22c55e", "#3b82f6", "#eab308", "#f97316", "#dc2626"],
            borderColor: ["#16a34a", "#2563eb", "#ca8a04", "#ea580c", "#b91c1c"],
            borderWidth: 1
          }
        ]
      },
      riskAssessmentData: {
        labels: riskChartData?.labels || ["High Risk", "Medium Risk", "Low Risk"],
        datasets: [
          {
            data:
              riskChartData?.data || [
                legacyAnalytics.riskAssessment.highRisk,
                legacyAnalytics.riskAssessment.mediumRisk,
                legacyAnalytics.riskAssessment.lowRisk
              ],
            backgroundColor: ["#dc2626", "#eab308", "#22c55e"],
            borderColor: ["#b91c1c", "#ca8a04", "#16a34a"],
            borderWidth: 1
          }
        ]
      }
    };
  }, [legacyAnalytics, apiData]);

  const newChartData = useMemo(() => {
    if (!newAnalytics) return null;

    const deficiencyLabels = newAnalytics.deficiencyBreakdown.map((item) => item.deficiency);
    const deficiencyCounts = newAnalytics.deficiencyBreakdown.map((item) => item.count);

    return {
      deficiencyData: {
        labels: deficiencyLabels,
        datasets: [
          {
            label: "Deficiency Count",
            data: deficiencyCounts,
            backgroundColor: deficiencyCounts.map(
              (_, index) =>
                ["#2563eb", "#7c3aed", "#f97316", "#22c55e", "#ef4444", "#0ea5e9", "#facc15", "#d946ef"][
                  index % 8
                ]
            ),
            borderColor: deficiencyCounts.map(
              (_, index) =>
                ["#1d4ed8", "#5b21b6", "#ea580c", "#16a34a", "#dc2626", "#0284c7", "#ca8a04", "#a21caf"][
                  index % 8
                ]
            ),
            borderWidth: 1
          }
        ]
      }
    };
  }, [newAnalytics]);

  // Analytics Handlers
  const handleGenerateReport = () => {
    const reportSource = legacyAnalytics || newAnalytics;

    if (!reportSource) {
      alert("No facilities data available to generate report.");
      return;
    }

    if (legacyAnalytics) {
      const totalFacilities = legacyAnalytics.totalFacilities || 0;
      const avgRiskScore =
        legacyAnalytics.riskAssessment?.avgRiskScore?.toFixed(0) ||
        legacyAnalytics.riskAssessment?.avgRiskScore ||
        "N/A";
      const totalDeficiencies = legacyAnalytics.complianceMetrics?.deficiencyCount || 0;
      const criticalIssues = legacyAnalytics.riskAssessment?.highRisk || 0;
      const activeSurveys = metrics?.find((m) => m.title === "Active Surveys")?.value || "0";

      alert(
        `Analytics Report Generated!\n\nTotal Facilities: ${totalFacilities}\nAverage Risk Score: ${avgRiskScore}\nTotal Deficiencies: ${totalDeficiencies}\nCritical Issues (High Risk): ${criticalIssues}\nActive Surveys: ${activeSurveys}`
      );
      return;
    }

    const totalFacilities = newAnalytics?.totals.totalFacilities || 0;
    const totalDeficiencies = newAnalytics?.totals.totalDeficiencies || 0;
    const avgOverallRating = formatDecimal(newAnalytics?.averages.overallRating, 1);
    const avgStaffing = formatDecimal(newAnalytics?.averages.staffingHours, 2);
    const avgTurnover = formatPercentage(newAnalytics?.averages.turnover, 1);

    alert(
      `Analytics Snapshot Generated!\n\nTotal Facilities: ${totalFacilities}\nAverage Overall Rating: ${avgOverallRating}\nAverage Staffing Hours: ${avgStaffing}\nAverage Turnover: ${avgTurnover}\nTotal Deficiencies: ${totalDeficiencies}`
    );
  };

  // Loading state
  return (
    <div className="min-h-screen relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Multi-Facility Analytics
                </h1>
                <p className="text-gray-500 text-sm sm:text-base">
                  Comprehensive insights and metrics across all your facilities
                </p>
              </div>
            </div>
          </div>
         
        </div>

        {/* Search Filter */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search facilities by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 h-11"
              disabled={loading}
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
              </div>
            )}
            {!loading && searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Searching Message */}
        {loading && debouncedSearchTerm && (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-gray-500">
              Searching facilities...
            </p>
          </div>
        )}

           {/* Clean Metrics Cards */}
           {!hasNoResults && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {loading ? (
              // Skeleton loaders while loading
              Array.from({ length: 8 }).map((_, index) => (
                <Card key={`skeleton-${index}`} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-gray-200 rounded-lg animate-pulse">
                      <div className="w-5 h-5 bg-gray-300 rounded"></div>
                    </div>
                    <div className="w-12 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </Card>
              ))
            ) : (
              metrics.slice(0, 8).map((metric, index) => {
                const IconComponent = metric.icon;
                const trendSymbol =
                  metric.trend === "up" ? "↑" : metric.trend === "down" ? "↓" : "•";
                const changeDisplay =
                  typeof metric.change === "number"
                    ? `${Math.abs(metric.change)}%`
                    : metric.change || "—";
                const trendClass =
                  metric.trend === "up"
                    ? "bg-green-100 text-green-700"
                    : metric.trend === "down"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-600";

                return (
                  <Card key={index} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-muted rounded-lg">
                        <IconComponent className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className={`text-xs font-medium px-2 py-1 rounded-full ${trendClass}`}>
                        {trendSymbol} {changeDisplay}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-3xl font-bold text-foreground">
                        {metric.value}
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {metric.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {metric.subtitle}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Analytics Panels */}
        {!hasNoResults && !loading && legacyAnalytics && legacyChartData && (
          <div className="space-y-6">
            {/* 1. Facility Overview Panel */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Building2 className="w-6 h-6" />
                  Facility Overview
                </h2>
                <MapPin className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Star Rating Distribution */}
                <div>
                  <h3 className="text-lg font-medium mb-4">CMS Star Rating Distribution</h3>
                  <div className="h-64">
                    <Doughnut 
                      data={legacyChartData.starRatingData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                          title: {
                            display: true,
                            text: 'Facility Star Ratings'
                          }
                        }
                      }}
                    />
                  </div>
                </div>
                
                {/* Risk Assessment */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Risk Assessment Distribution</h3>
                  <div className="h-64">
                    <Bar 
                      data={legacyChartData.riskAssessmentData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          },
                          title: {
                            display: true,
                            text: 'Risk Level Distribution'
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. Quality of Care Panel */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Heart className="w-6 h-6" />
                  Quality of Care Metrics
                </h2>
                <Stethoscope className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quality Metrics Bar Chart */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Clinical Quality Indicators</h3>
                  <div className="h-64">
                    <Bar 
                      data={legacyChartData.qualityCareData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          },
                          title: {
                            display: true,
                            text: 'Quality Metrics vs Benchmarks'
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 20
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Quality Metrics Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Quality Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {apiData?.qualityOfCare?.qualitySummary ? (
                      <>
                        <Card className="p-4">
                          <div className="text-2xl font-bold">
                            {apiData.qualityOfCare.qualitySummary.rehospitalizationRate?.value || legacyAnalytics.qualityMetrics.rehospitalizationRate.toFixed(1) + '%'}
                          </div>
                          <div className="text-sm text-muted-foreground">{apiData.qualityOfCare.qualitySummary.rehospitalizationRate?.label || 'Rehospitalization Rate'}</div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-2xl font-bold">
                            {apiData.qualityOfCare.qualitySummary.pressureUlcerRate?.value || legacyAnalytics.qualityMetrics.pressureUlcerRate.toFixed(1) + '%'}
                          </div>
                          <div className="text-sm text-muted-foreground">{apiData.qualityOfCare.qualitySummary.pressureUlcerRate?.label || 'Pressure Ulcer Rate'}</div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-2xl font-bold">
                            {apiData.qualityOfCare.qualitySummary.fallRate?.value || legacyAnalytics.qualityMetrics.fallRate.toFixed(1) + '%'}
                          </div>
                          <div className="text-sm text-muted-foreground">{apiData.qualityOfCare.qualitySummary.fallRate?.label || 'Fall Rate'}</div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-2xl font-bold">
                            {apiData.qualityOfCare.qualitySummary.painManagement?.value || legacyAnalytics.qualityMetrics.painManagement.toFixed(1) + '%'}
                          </div>
                          <div className="text-sm text-muted-foreground">{apiData.qualityOfCare.qualitySummary.painManagement?.label || 'Pain Management'}</div>
                        </Card>
                      </>
                    ) : (
                      <>
                        <Card className="p-4">
                          <div className="text-2xl font-bold">
                            {legacyAnalytics.qualityMetrics.rehospitalizationRate.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Rehospitalization Rate</div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-2xl font-bold">
                            {legacyAnalytics.qualityMetrics.pressureUlcerRate.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Pressure Ulcer Rate</div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-2xl font-bold">
                            {legacyAnalytics.qualityMetrics.fallRate.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Fall Rate</div>
                        </Card>
                        <Card className="p-4">
                          <div className="text-2xl font-bold">
                            {legacyAnalytics.qualityMetrics.painManagement.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Pain Management</div>
                        </Card>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* 3. Staffing & Workforce Panel */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Staffing & Workforce
                </h2>
                <UserCheck className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Staffing Hours Chart */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-medium mb-4">Hours Per Resident Day (HPRD)</h3>
                  <div className="h-64">
                    <Bar 
                      data={legacyChartData.staffingData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          },
                          title: {
                            display: true,
                            text: 'Staffing Levels by Category'
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true 
                          } 
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Staffing Metrics */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Staffing Summary</h3>
                  <div className="space-y-3">
                    {apiData?.staffingWorkforce?.staffingSummary ? (
                      <>
                        <Card className="p-3">
                          <div className="text-lg font-bold">
                            {apiData.staffingWorkforce.staffingSummary.rnHprd?.value || legacyAnalytics.staffingMetrics.rnHprd.toFixed(1)}
                          </div>
                          <div className="text-sm text-muted-foreground">{apiData.staffingWorkforce.staffingSummary.rnHprd?.label || 'RN HPRD'}</div>
                        </Card>
                        <Card className="p-3">
                          <div className="text-lg font-bold">
                            {apiData.staffingWorkforce.staffingSummary.lpnHprd?.value || legacyAnalytics.staffingMetrics.lpnHprd.toFixed(1)}
                          </div>
                          <div className="text-sm text-muted-foreground">{apiData.staffingWorkforce.staffingSummary.lpnHprd?.label || 'LPN HPRD'}</div>
                        </Card>
                        <Card className="p-3">
                          <div className="text-lg font-bold">
                            {apiData.staffingWorkforce.staffingSummary.cnaHprd?.value || legacyAnalytics.staffingMetrics.cnaHprd.toFixed(1)}
                          </div>
                          <div className="text-sm text-muted-foreground">{apiData.staffingWorkforce.staffingSummary.cnaHprd?.label || 'CNA HPRD'}</div>
                        </Card>
                        <Card className="p-3">
                          <div className="text-lg font-bold">
                            {apiData.staffingWorkforce.staffingSummary.turnoverRate?.value || legacyAnalytics.staffingMetrics.turnoverRate.toFixed(1) + '%'}
                          </div>
                          <div className="text-sm text-muted-foreground">{apiData.staffingWorkforce.staffingSummary.turnoverRate?.label || 'Turnover Rate'}</div>
                        </Card>
                      </>
                    ) : (
                      <>
                        <Card className="p-3">
                          <div className="text-lg font-bold">
                            {legacyAnalytics.staffingMetrics.rnHprd.toFixed(1)}
                          </div>
                          <div className="text-sm text-muted-foreground">RN HPRD</div>
                        </Card>
                        <Card className="p-3">
                          <div className="text-lg font-bold">
                            {legacyAnalytics.staffingMetrics.lpnHprd.toFixed(1)}
                          </div>
                          <div className="text-sm text-muted-foreground">LPN HPRD</div>
                        </Card>
                        <Card className="p-3">
                          <div className="text-lg font-bold">
                            {legacyAnalytics.staffingMetrics.cnaHprd.toFixed(1)}
                          </div>
                          <div className="text-sm text-muted-foreground">CNA HPRD</div>
                        </Card>
                        <Card className="p-3">
                          <div className="text-lg font-bold">
                            {legacyAnalytics.staffingMetrics.turnoverRate.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Turnover Rate</div>
                        </Card>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* 4. Compliance & Survey Panel */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <ClipboardCheck className="w-6 h-6" />
                  Compliance & Survey Results
                </h2>
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scope & Severity Chart */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Scope & Severity Distribution</h3>
                  <div className="h-64">
                    <Bar 
                      data={legacyChartData.complianceData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
                          },
                          title: {
                            display: true,
                            text: 'Deficiency Severity Levels'
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Compliance Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Compliance Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <div className="text-2xl font-bold">
                        {legacyAnalytics.complianceMetrics.scopeSeverity.immediateJeopardy}
                      </div>
                      <div className="text-sm text-muted-foreground">Immediate Jeopardy</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-2xl font-bold">
                        {legacyAnalytics.complianceMetrics.scopeSeverity.actualHarm}
                      </div>
                      <div className="text-sm text-muted-foreground">Actual Harm</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-2xl font-bold">
                        {legacyAnalytics.complianceMetrics.scopeSeverity.noActualHarm}
                      </div>
                      <div className="text-sm text-muted-foreground">No Actual Harm</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-2xl font-bold">
                        {legacyAnalytics.complianceMetrics.scopeSeverity.standard}
                      </div>
                      <div className="text-sm text-muted-foreground">Standard</div>
                    </Card>
                  </div>
                  <Card className="p-4 bg-muted/50">
                    <div className="text-2xl font-bold">
                      {legacyAnalytics.complianceMetrics.deficiencyCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Deficiencies</div>
            </Card>
                </div>
              </div>
            </Card>

            {/* 5. Resident Experience Panel */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Heart className="w-6 h-6" />
                  Resident Experience
                </h2>
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Satisfaction Chart */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Satisfaction Scores</h3>
                  <div className="h-64">
                    <Doughnut 
                      data={legacyChartData.experienceData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                          title: {
                            display: true,
                            text: 'Satisfaction Distribution'
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Experience Metrics */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Experience Summary</h3>
              <div className="space-y-3">
                    <Card className="p-4">
                      <div className="text-2xl font-bold">
                        {legacyAnalytics.experienceMetrics.residentSatisfaction.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Resident Satisfaction</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-2xl font-bold">
                        {legacyAnalytics.experienceMetrics.familySatisfaction.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Family Satisfaction</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-2xl font-bold">
                        {legacyAnalytics.experienceMetrics.complaintRate.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">Complaints per 100 Residents</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-2xl font-bold">
                        {legacyAnalytics.experienceMetrics.grievanceResolutionDays.toFixed(1)}
                    </div>
                      <div className="text-sm text-muted-foreground">Avg Resolution Days</div>
                    </Card>
                  </div>
                </div>
              </div>
            </Card>

            {/* 6. Financial & Operational Panel */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <DollarSign className="w-6 h-6" />
                  Financial & Operational Metrics
                </h2>
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Card className="p-4">
                  <div className="text-2xl font-bold">
                    {legacyAnalytics.operationalMetrics.avgOccupancy.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Average Occupancy</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold">
                    {legacyAnalytics.operationalMetrics.payerMix.medicare.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Medicare Mix</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold">
                    {legacyAnalytics.operationalMetrics.payerMix.medicaid.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Medicaid Mix</div>
                </Card>
                <Card className="p-4">
                  <div className="text-2xl font-bold">
                    ${legacyAnalytics.operationalMetrics.costPerResidentDay.toFixed(0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Cost per Resident Day</div>
                </Card>
              </div>
            </Card>

            {/* 7. Short Stay Metrics Panel */}
            {apiData?.shortStayMetrics && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Bed className="w-6 h-6" />
                    Short Stay Metrics
                  </h2>
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(apiData.shortStayMetrics).map(([key, metric]) => (
                    <Card key={key} className="p-4">
                      <div className="text-2xl font-bold">
                        {metric.value}
                      </div>
                      <div className="text-sm font-medium text-muted-foreground mt-1">
                        {metric.label}
                      </div>
                      {metric.subtitle && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {metric.subtitle}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </Card>
            )}

            {/* 8. Long Stay Metrics Panel */}
            {apiData?.longStayMetrics && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Hospital className="w-6 h-6" />
                    Long Stay Metrics
                  </h2>
                  <Users className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(apiData.longStayMetrics).map(([key, metric]) => (
                    <Card key={key} className="p-4">
                      <div className="text-2xl font-bold">
                        {metric.value}
                      </div>
                      <div className="text-sm font-medium text-muted-foreground mt-1">
                        {metric.label}
                      </div>
                      {metric.subtitle && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {metric.subtitle}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </Card>
            )}

            {/* 9. Payment & Readmissions Panel */}
            {apiData?.paymentAndReadmissions && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <CreditCard className="w-6 h-6" />
                    Payment & Readmissions
                  </h2>
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {Object.entries(apiData.paymentAndReadmissions).map(([key, metric]) => (
                    <Card key={key} className="p-6">
                      <div className="text-3xl font-bold">
                        {metric.value}
                      </div>
                      <div className="text-base font-medium text-muted-foreground mt-2">
                        {metric.label}
                      </div>
                      {metric.subtitle && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {metric.subtitle}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* New-format Analytics Panels */}
        {!hasNoResults && !loading && newAnalytics && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  Performance Overview
                </h2>
                <Gauge className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {newPerformanceStats.map((stat, index) => (
                  <Card key={index} className="p-4">
                    <div className="text-2xl font-bold">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {stat.label}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
            {newFacilityHighlights && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Award className="w-6 h-6" />
                    Rating Highlights
                  </h2>
                  <Star className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-lg border border-muted p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-emerald-600">Highest Rated</span>
                      <span className="text-sm text-muted-foreground">Rating</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {newFacilityHighlights.highest.rating}
                    </div>
                    <div className="mt-2 text-sm font-medium text-foreground">
                      {newFacilityHighlights.highest.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {newFacilityHighlights.highest.city}
                    </div>
                  </div>
                  <div className="rounded-lg border border-muted p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-amber-600">Lowest Rated</span>
                      <span className="text-sm text-muted-foreground">Rating</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {newFacilityHighlights.lowest.rating}
                    </div>
                    <div className="mt-2 text-sm font-medium text-foreground">
                      {newFacilityHighlights.lowest.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {newFacilityHighlights.lowest.city}
                    </div>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Rating Gap</div>
                    <div className="text-xl font-semibold text-foreground">
                      {newFacilityHighlights.ratingGap}
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-sm text-muted-foreground">Staffing Gap (hrs)</div>
                    <div className="text-xl font-semibold text-foreground">
                      {newFacilityHighlights.staffingGap}
                    </div>
                  </Card>
                </div>
              </Card>
            )}

          

            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  Performance Groups
                </h2>
                <Target className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { key: "topPerformers", label: "Top Performers", color: "text-emerald-600" },
                  { key: "averagePerformers", label: "Average Performers", color: "text-blue-600" },
                  { key: "lowPerformers", label: "Low Performers", color: "text-amber-600" }
                ].map((group) => {
                  const facilities = newAnalytics.performanceGroups?.[group.key] || [];
                  return (
                    <div key={group.key} className="space-y-3">
                      <h3 className={`text-sm font-semibold uppercase tracking-wide ${group.color}`}>
                        {group.label}
                      </h3>
                      {facilities.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                          {facilities.map((facility, index) => (
                            <li key={`${group.key}-${facility}-${index}`} className="rounded-lg border border-muted px-3 py-2">
                              {facility}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No facilities in this group.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {newAnalytics.facilityComparison.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Building2 className="w-6 h-6" />
                    Facility Comparison
                  </h2>
                  <BarChart className="w-5 h-5 text-muted-foreground" />
                </div>
                {facilityComparisonColumns.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-muted text-sm">
                      <thead className="bg-muted/40">
                        <tr>
                          {facilityComparisonColumns.map(({ key, label }) => (
                            <th
                              key={key}
                              className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap"
                            >
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-muted/60">
                        {newAnalytics.facilityComparison.map((facility, index) => {
                          const nameCandidate =
                            facility.name ||
                            facility.raw?.name ||
                            facility.raw?.facility ||
                            facility.raw?.Facility ||
                            "";
                          const rowKey = `${nameCandidate || "facility"}-${index}`;

                          return (
                            <tr key={rowKey} className="bg-background">
                              {facilityComparisonColumns.map(({ key }, cellIndex) => {
                                const cellValue = getFacilityComparisonValue(facility, key);
                                const isPrimaryColumn = cellIndex === 0;
                                return (
                                  <td
                                    key={`${rowKey}-${key}`}
                                    className={`px-4 py-3 ${
                                      isPrimaryColumn ? "text-foreground font-medium" : "text-muted-foreground"
                                    } whitespace-nowrap`}
                                  >
                                    {cellValue}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No facility comparison data available.
                  </div>
                )}
              </Card>
            )}

            {newTrendInsight && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Trend Insight
                  </h2>
                  <LineChart className="w-5 h-5 text-muted-foreground" />
                </div>
                <ul className="list-disc space-y-2 pl-6 text-sm text-muted-foreground">
                  {newTrendInsight
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line, index) => (
                      <li key={`trend-line-${index}`}>{line}</li>
                    ))}
                </ul>
              </Card>
            )}
          </div>
        )}

        {/* No Results Found Message */}
        {hasNoResults && !loading && debouncedSearchTerm && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-600">
                No facilities found matching <span className="font-medium text-gray-900">"{debouncedSearchTerm}"</span>
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="text-sm text-[#075b7d] hover:text-[#075b7d]/80 underline"
              >
                Reset
              </button>
            </div>
          </div>
        )}

     
      </div>
    </div>
  );
};

export default MultiFacilityDashboard;

