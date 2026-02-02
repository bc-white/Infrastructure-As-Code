import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { facilityAPI } from "../service/api";
import { clearSurveyStorage } from "../utils/surveyStorageIndexedDB";
import { DataTable } from "../components/data-table";
import { Badge } from "../components/ui/badge";
import { DateRangePicker } from "../components/ui/date-picker";
import {
  AlertTriangle,
  Plus,
  Building2,
  CheckCircle,
  FileText,
  ExternalLink,
} from "lucide-react";
import { format as formatDate } from "date-fns";

const numberFormatter = new Intl.NumberFormat("en-US");

const formatMetricValue = (value) => {
  if (value === null || value === undefined) return "0";

  if (typeof value === "number") {
    return numberFormatter.format(value);
  }

  if (typeof value === "string") {
    const numericValue = Number(value);
    if (!Number.isNaN(numericValue)) {
      return numberFormatter.format(numericValue);
    }
    return value;
  }

  return String(value);
};

const extractFileNameFromUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  try {
    const pathname = new URL(url).pathname;
    const fileName = pathname.split("/").filter(Boolean).pop();
    if (!fileName) return url;
    return decodeURIComponent(fileName);
  } catch {
    const fallback = url.split("/").filter(Boolean).pop();
    return fallback ? decodeURIComponent(fallback) : url;
  }
};

const normalizeMetricDetails = (metricValue, fallbackValue = 0) => {
  const fallback = fallbackValue ?? 0;

  if (metricValue === null || metricValue === undefined) {
    return {
      value: fallback,
      formattedValue: formatMetricValue(fallback),
      changeLabel: null,
      description: null,
      trend: fallback > 0 ? "up" : "neutral",
    };
  }

  if (typeof metricValue === "number" || typeof metricValue === "string") {
    const numericValue =
      typeof metricValue === "number" ? metricValue : Number(metricValue);
    return {
      value: numericValue,
      formattedValue: formatMetricValue(metricValue),
      changeLabel: null,
      description: null,
      trend: Number.isFinite(numericValue)
        ? numericValue >= fallback
          ? "up"
          : "down"
        : "neutral",
    };
  }

  if (typeof metricValue === "object") {
    const rawValue =
      metricValue.value ??
      metricValue.total ??
      metricValue.count ??
      metricValue.amount ??
      metricValue.number ??
      metricValue.metric ??
      fallback;

    const changeRaw =
      metricValue.change ??
      metricValue.delta ??
      metricValue.difference ??
      metricValue.changePercent ??
      metricValue.changePercentage ??
      metricValue.percentageChange ??
      metricValue.mom ??
      null;

    let changeLabel =
      metricValue.changeText ??
      metricValue.caption ??
      metricValue.changeLabel ??
      metricValue.helperText ??
      null;

    if (!changeLabel && typeof changeRaw === "number") {
      const rounded = Math.round(changeRaw * 100) / 100;
      changeLabel = `${rounded > 0 ? "+" : ""}${rounded}`;
    } else if (!changeLabel && typeof changeRaw === "string") {
      changeLabel = changeRaw;
    }

    const description =
      metricValue.description ??
      metricValue.context ??
      metricValue.period ??
      metricValue.comparison ??
      metricValue.subtitle ??
      null;

    const trend =
      metricValue.trend ??
      metricValue.direction ??
      (typeof changeRaw === "number"
        ? changeRaw >= 0
          ? "up"
          : "down"
        : "neutral");

    return {
      value: rawValue,
      formattedValue: formatMetricValue(rawValue),
      changeLabel,
      description,
      trend,
    };
  }

  return {
    value: fallback,
    formattedValue: formatMetricValue(fallback),
    changeLabel: null,
    description: null,
    trend: "neutral",
  };
};

const findMetricValue = (data, keyCandidates, maxDepth = 3) => {
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const visited = new Set();

  const search = (node, depth) => {
    if (
      node === null ||
      node === undefined ||
      typeof node !== "object" ||
      depth > maxDepth ||
      visited.has(node)
    ) {
      return undefined;
    }

    visited.add(node);

    if (Array.isArray(node)) {
      for (const item of node) {
        const result = search(item, depth + 1);
        if (result !== undefined) {
          return result;
        }
      }
      return undefined;
    }

    for (const key of keyCandidates) {
      if (Object.prototype.hasOwnProperty.call(node, key)) {
        return node[key];
      }
    }

    for (const value of Object.values(node)) {
      const result = search(value, depth + 1);
      if (result !== undefined) {
        return result;
      }
    }

    return undefined;
  };

  return search(data, 0);
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState(null);
  const [metricsLastUpdated, setMetricsLastUpdated] = useState(null);
  const [facilityNameFilter, setFacilityNameFilter] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState();


  // Helper function to determine if user is an invited user
  const isInvitedUser = () => {
    if (!user) return false;

    // Check if user has the invited flag set to "true" (string) or true (boolean)
    return user.invited === "true" || user.invited === true;
  };

  const loadDashboardMetrics = useCallback(async (filters = {}) => {
    setMetricsLoading(true);
    setMetricsError(null);

    try {
      const response = await facilityAPI.getDashboardMatrix(filters);

      if (response?.status === false) {
        setDashboardMetrics(null);
        setMetricsLastUpdated(null);
        setMetricsError(
          response?.message || "Dashboard metrics are unavailable right now."
        );
        return;
      }

      const resolvedMetrics =
        response?.data ??
        response?.metrics ??
        response?.overview ??
        response ??
        null;

      if (
        !resolvedMetrics ||
        (typeof resolvedMetrics === "object" &&
          Object.keys(resolvedMetrics).length === 0)
      ) {
        setDashboardMetrics(null);
        setMetricsLastUpdated(null);
     
        return;
      }

      const totalSurveyMetric = normalizeMetricDetails(
        findMetricValue(resolvedMetrics, [
          "totalSurveys",
          "totalSurveyCount",
          "total",
          "surveysTotal",
        ]),
        0
      );

      setDashboardMetrics(resolvedMetrics);
      setMetricsLastUpdated(new Date());
      
    } catch (err) {
      setDashboardMetrics(null);
      setMetricsLastUpdated(null);
      setMetricsError(
        err?.message || "Failed to load dashboard metrics. Please try again."
      );
      
    } finally {
      setMetricsLoading(false);
    }
  }, []);




  useEffect(() => {
    if (user) {
      loadDashboardMetrics();
    }
  }, [user, loadDashboardMetrics]);

  const buildFiltersFromState = useCallback(() => {
    const filters = {};

    if (facilityNameFilter.trim()) {
      filters.facilityName = facilityNameFilter.trim();
    }
    if (dateRangeFilter?.from) {
      filters.startDate = formatDate(dateRangeFilter.from, "yyyy-MM-dd");
    }
    if (dateRangeFilter?.to) {
      filters.endDate = formatDate(dateRangeFilter.to, "yyyy-MM-dd");
    }

    return filters;
  }, [facilityNameFilter, dateRangeFilter]);

  const handleApplyFilters = useCallback(
    async (event) => {
      if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
      }

      if (
        dateRangeFilter?.from &&
        dateRangeFilter?.to &&
        dateRangeFilter.from > dateRangeFilter.to
      ) {
        setMetricsError("Start date must be on or before end date.");
        return;
      }

      await loadDashboardMetrics(buildFiltersFromState());
    },
    [buildFiltersFromState, dateRangeFilter, loadDashboardMetrics]
  );

  const handleClearFilters = useCallback(async () => {
    setFacilityNameFilter("");
    setDateRangeFilter(undefined);
    setMetricsError(null);
    await loadDashboardMetrics();
  }, [loadDashboardMetrics]);

  const facilityComparisonData = useMemo(() => {
    if (
      !dashboardMetrics ||
      !Array.isArray(dashboardMetrics.facilityComparison)
    ) {
      return [];
    }

    return dashboardMetrics.facilityComparison.map((entry) => ({
      facilityId: entry?.facilityId || entry?._id || entry?.id || "",
      facilityName: entry?.facilityName || entry?.name || "Unnamed Facility",
      surveyCount: Number(
        entry?.surveyCount ?? entry?.totalSurveys ?? entry?.count ?? 0
      ),
      deficiencyCount: Number(
        entry?.deficiencyCount ?? entry?.totalDeficiencies ?? 0
      ),
    }));
  }, [dashboardMetrics]);

  const totalSurveysFromComparison = useMemo(
    () =>
      facilityComparisonData.reduce(
        (accumulator, entry) =>
          accumulator +
          (Number.isFinite(entry.surveyCount) ? entry.surveyCount : 0),
        0
      ),
    [facilityComparisonData]
  );

  const documentLinks = useMemo(() => {
    if (!dashboardMetrics) {
      return [];
    }

    const rawDocs =
      dashboardMetrics.docUrls ||
      dashboardMetrics.documents ||
      dashboardMetrics.resources ||
      [];

    if (!Array.isArray(rawDocs)) {
      return [];
    }

    return rawDocs
      .filter((url) => typeof url === "string" && url.trim().length > 0)
      .map((url, index) => ({
        id: `${url}-${index}`,
        url,
        name: extractFileNameFromUrl(url),
      }));
  }, [dashboardMetrics]);

  const metricsSummary = useMemo(() => {
    const metricsSource = dashboardMetrics;

    const totalMetric = normalizeMetricDetails(
      metricsSource
        ? findMetricValue(metricsSource, [
            "totalSurveys",
            "totalSurveyCount",
            "total",
            "surveysTotal",
          ])
        : undefined,
      totalSurveysFromComparison
    );

    const deficiencyMetric = normalizeMetricDetails(
      metricsSource
        ? findMetricValue(metricsSource, [
            "totalDeficiencies",
            "deficiencyCount",
            "deficiencies",
            "totalDeficiencyCount",
          ])
        : undefined,
      facilityComparisonData.reduce(
        (accumulator, entry) =>
          accumulator +
          (Number.isFinite(entry.deficiencyCount) ? entry.deficiencyCount : 0),
        0
      )
    );

    const totalNumeric = Number(totalMetric.value) || 0;

    return {
      stats: [
        {
          key: "total",
          title: "Total Surveys",
          icon: FileText,
          accentClass: "bg-[#075b7d]/10 text-[#075b7d]",
          ...totalMetric,
        },
        {
          key: "deficiencies",
          title: "Total Deficiencies",
          icon: AlertTriangle,
          accentClass: "bg-rose-50 text-rose-600",
          ...deficiencyMetric,
        },
      ],
      hasFacilities: totalNumeric > 0 || totalSurveysFromComparison > 0,
    };
  }, [dashboardMetrics, facilityComparisonData, totalSurveysFromComparison]);

  const stats = metricsSummary.stats;
  const hasFacilities = metricsSummary.hasFacilities;

  // Column definitions for active surveys table
  const columns = useMemo( 
    () => [
      {
        accessorKey: "facilityName",
        header: "Facility",
        cell: ({ row }) => (
          <div className="py-2">
            <div className="font-semibold text-gray-900 text-sm">
              {row.original.facilityName}
            </div>
           
          </div>
        ),
      },
      {
        accessorKey: "surveyCount",
        header: "Active Surveys",
        cell: ({ row }) => (
          <div className="py-2 text-sm font-medium text-gray-900">
            {formatMetricValue(row.original.surveyCount)}
          </div>
        ),
      },
      {
        accessorKey: "deficiencyCount",
        header: "Deficiencies",
        cell: ({ row }) => {
          const deficiencyCount = Number(row.original.deficiencyCount) || 0;
          const badgeClass =
            deficiencyCount === 0
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : "bg-rose-50 text-rose-600 border-rose-200";
          const badgeLabel =
            deficiencyCount === 0
              ? "No Deficiencies"
              : `${deficiencyCount} open`;

          return (
            <div className="py-2">
              <Badge
                variant="outline"
                className={`${badgeClass} border text-xs px-3 py-1 font-medium`}
              >
                {badgeLabel}
              </Badge>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Dashboard
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">
              {hasFacilities
                ? "Healthcare survey simulation and management"
                : "Welcome to MockSurvey 365! Get started by creating your first survey"}
            </p>
          </div>
          <div className="flex-shrink-0">
            {hasFacilities && (
              <Button
                className="w-full sm:w-auto bg-[#075b7d] hover:bg-[#075b7d] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium cursor-pointer text-sm sm:text-base "
                onClick={async () => {
                  // Clear any existing survey data and start fresh
                  await clearSurveyStorage();
                  navigate("/mocksurvey365");
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Survey
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white ">
            <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Survey Overview
                  </h2>
                  <p className="text-sm text-gray-500">
                    Real-time visibility into your survey program health.
                  </p>
                </div>
                <form
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                  onSubmit={handleApplyFilters}
                >
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="dashboard-filter-facility"
                      className="text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      Facility Name
                    </label>
                    <input
                      id="dashboard-filter-facility"
                      type="text"
                      value={facilityNameFilter}
                      onChange={(event) => setFacilityNameFilter(event.target.value)}
                      placeholder="Search facility"
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors focus:border-[#075b7d] focus:outline-none focus:ring-2 focus:ring-[#075b7d]/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1 sm:col-span-1 lg:col-span-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Date Range
                    </span>
                    <DateRangePicker
                      dateRange={dateRangeFilter}
                      onSelect={(range) => setDateRangeFilter(range ?? undefined)}
                      placeholder="Select date range"
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2 sm:justify-start lg:col-span-1 lg:justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={metricsLoading}
                      className="w-full sm:w-auto bg-[#075b7d] text-white hover:bg-[#075b7d]/90"
                    >
                      Apply Filters
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={metricsLoading}
                      onClick={handleClearFilters}
                      className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      Clear
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            <div className="px-4 py-6 sm:px-6">
              {metricsLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`metrics-skeleton-${index}`}
                      className="animate-pulse rounded-lg border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="h-3 w-20 rounded bg-gray-200" />
                      <div className="mt-4 h-6 w-32 rounded bg-gray-200" />
                      <div className="mt-3 h-3 w-24 rounded bg-gray-200" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {metricsError && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-rose-500" />
                          <div>
                            <p className="text-sm font-semibold text-rose-600">
                              {metricsError}
                            </p>
                            <p className="mt-1 text-xs text-rose-500">
                              Showing the latest available figures while we reconnect.
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApplyFilters()}
                          className="border-rose-500 text-rose-600 hover:bg-rose-500 hover:text-white"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {stats.map((stat) => {
                      const Icon = stat.icon;
                      const trendClass =
                        stat.trend === "down"
                          ? "text-rose-600"
                          : stat.trend === "up"
                          ? "text-emerald-600"
                          : "text-gray-500";
                      const trendSymbol =
                        stat.trend === "down"
                          ? "▼"
                          : stat.trend === "up"
                          ? "▲"
                          : "•";
                      const displayValue =
                        stat.formattedValue ?? formatMetricValue(stat.value);

                      return (
                        <div
                          key={stat.key}
                          className="rounded-lg border border-gray-200 bg-white p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                {stat.title}
                              </p>
                              <p className="mt-2 text-2xl font-semibold text-gray-900">
                                {displayValue}
                              </p>
                            </div>
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full ${stat.accentClass}`}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                          </div>

                          {(stat.changeLabel || stat.description) && (
                            <div className="mt-3 space-y-1 text-xs">
                              {stat.changeLabel && (
                                <div
                                  className={`flex items-center font-medium ${trendClass}`}
                                >
                                  <span className="mr-1 text-sm">
                                    {trendSymbol}
                                  </span>
                                  <span>{stat.changeLabel}</span>
                                </div>
                              )}
                              {stat.description && (
                                <p className="text-gray-500">
                                  {stat.description}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white ">
            <div className="flex flex-col gap-2 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Facility Survey Snapshot
                </h2>
                <p className="text-sm text-gray-500">
                  Compare active survey activity and open deficiencies by
                  facility.
                </p>
              </div>
            </div>
            <div className="px-4 py-6 sm:px-6">
              {metricsLoading && facilityComparisonData.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-500">
                  Loading facility metrics...
                </div>
              ) : metricsError && facilityComparisonData.length === 0 ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
                  {metricsError}
                </div>
              ) : facilityComparisonData.length > 0 ? (
                <DataTable
                  data={facilityComparisonData}
                  columns={columns}
                  searchPlaceholder="Search facilities..."
                  searchColumn="facilityName"
                  disablePagination
                />
              ) : (
                <div className="py-10 text-center text-sm text-gray-500">
                  No survey activity recorded for this period. Start a new
                  survey to populate this overview.
                </div>
              )}
            </div>
          </section>

          {documentLinks.length > 0 && (
            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Reference Documents
                  </h2>
                  <p className="text-sm text-gray-500">
                    Download supporting files linked to your dashboard metrics.
                  </p>
                </div>
              </div>
              <div className="px-4 py-6 sm:px-6">
                <ul className="space-y-3">
                  {documentLinks.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex flex-col gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="truncate pr-0 sm:pr-4">{doc.name}</span>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto border-[#075b7d] text-[#075b7d] hover:bg-[#075b7d] hover:text-white"
                      > 
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open
                        </a>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </div>
      </div>

     
    </div>
  );
};

export default Dashboard;
