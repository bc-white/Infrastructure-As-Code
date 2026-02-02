import { useAuthStore } from "@/store/auth";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useEffect } from "react";

import { resolveToken } from "@/utils/resolveToken";
import { tokens } from "@/styles/theme";
import { getTheme } from "@/styles/getTheme";
import {
  TrendingUp,
  Tag,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react"; 

 const MerchantDashboard = () => {
  const user = useAuthStore((state) => state.user);
  const currentOrganizationId = useAuthStore(
    (state) => state.currentOrganizationId
  );
  const setCurrentOrganization = useAuthStore(
    (state) => state.setCurrentOrganization
  );
  const theme = getTheme();

  // Mock data for Mock Survey 365 internal usage statistics
  const analyticsData = {
    totalFTags: 178,
    totalResources: 245,
    totalCriticalElements: 32,
    totalUsers: 128,
    systemUsage: {
      totalUploads: 8452,
      totalDownloads: 12340,
      totalEdits: 3241,
      totalDeletes: 456,
    },
    activityTrend: [
      { month: "Jan", uploads: 120, edits: 45, deletes: 8 },
      { month: "Feb", uploads: 145, edits: 52, deletes: 12 },
      { month: "Mar", uploads: 168, edits: 61, deletes: 15 },
      { month: "Apr", uploads: 182, edits: 68, deletes: 18 },
      { month: "May", uploads: 195, edits: 75, deletes: 22 },
      { month: "Jun", uploads: 215, edits: 82, deletes: 28 },
    ],
    systemStats: {
      byCategory: [
        { category: "FTAG Setups", count: 178, percentage: 39 },
        { category: "Resources", count: 245, percentage: 54 },
        { category: "Critical Elements", count: 32, percentage: 7 },
      ],
      byType: [
        { type: "Long Term Regulations", count: 70, percentage: 29 },
        { type: "CMS-672", count: 45, percentage: 18 },
        { type: "CMS-802", count: 38, percentage: 16 },
        { type: "CMS-671", count: 32, percentage: 13 },
        { type: "Critical Elements", count: 32, percentage: 13 },
        { type: "Other", count: 28, percentage: 11 },
      ],
    },
  };
  
  // Get organizations from user (localStorage)
  const userOrganizations = user?.organizations || [];

  // Initialize currentOrganizationId if not set
  useEffect(() => {
    if (!currentOrganizationId && userOrganizations.length > 0) {
      setCurrentOrganization(userOrganizations[0].id);
    }
  }, [currentOrganizationId, userOrganizations, setCurrentOrganization]);

  return (
    <div
      className="min-h-screen"
      style={{
        background: resolveToken(
          theme === "dark"
            ? tokens.Dark.Surface.Primary
            : tokens.Light.Surface.Primary
        ),
      }}
    > 
      {/* Main Content */}
      <main
        // style={{ backgroundColor: resolveToken(theme === 'dark' ? tokens.Dark.Surface.Primary : tokens.Light.Surface.Primary) }}
        className="container mx-auto md:px-9 px-5 pt-24"
      >
      {/* Header */}
      <div className="flex flex-col gap-1 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
              <h1
                className="md:text-[25px] font-[500] text-[22px]"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
               Hello, {user?.name || "Super Admin"}
            </h1>
              <p
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                }}
                className="text-[16px] font-[400]"
              >
                Internal control system dashboard for managing Mock Survey 365 
            </p>
          </div>
        </div>
      </div>

        {/* Date Range Selector */}
        <div className="mb-8">
       
          <Tabs defaultValue="today" className="w-auto">
            <TabsList
              className="grid grid-cols-4 gap-1 p-1 w-full max-w-[462px]"
              style={{
                background: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Highlight["HIghhlight Gray"][50]
                    : tokens.Light.Highlight["HIghhlight Gray"][50]
                ),
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark["text/soft-400"]
                    : tokens.Light["text/soft-400"]
                ),
                borderRadius: "6px",
                padding: "4px",
              }}
            >
              <TabsTrigger value="today" className="tabs-trigger rounded-md">
                Today
              </TabsTrigger>
              <TabsTrigger value="week" className="tabs-trigger rounded-lg">
                This Week
              </TabsTrigger>
              <TabsTrigger value="month" className="tabs-trigger rounded-lg">
                This Month
              </TabsTrigger>
              <TabsTrigger value="select" className="tabs-trigger rounded-lg">
                Select Date
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

      

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div
            className="rounded-2xl p-6"
            style={{
                background: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Surface.Foreground
                    : tokens.Light.Surface.Foreground
                ),
                borderRadius: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Radius["Radius-lg"]
                    : tokens.Light.Radius["Radius-lg"]
                ),
              }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="p-3 rounded-lg"
                style={{
                  background: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Highlight["HIghhlight Gray"][50]
                      : tokens.Light.Highlight["HIghhlight Gray"][50]
                  ),
                }}
              >
                <Activity
                  size={20}
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button.Primary
                        : tokens.Light.Button.Primary
                    ),
                  }}
                />
              </div>
              <span
                className="text-sm font-medium"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                }}
              >
                +12.5%
              </span>
            </div>
            <h3
              className="text-2xl font-bold mb-1"
              style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Heading
                    : tokens.Light.Typography.Heading
                ),
              }}
            >
              {analyticsData.totalFTags.toLocaleString()}
            </h3>
            <p
              className="text-sm"
              style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                ),
              }}
            >
              Total FTAGs
            </p>
          </div>

          <div
            className="rounded-2xl p-6"
            style={{
                background: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Surface.Foreground
                    : tokens.Light.Surface.Foreground
                ),
                borderRadius: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Radius["Radius-lg"]
                    : tokens.Light.Radius["Radius-lg"]
                ),
              }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="p-3 rounded-lg"
                style={{
                  background: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Highlight["HIghhlight Gray"][50]
                      : tokens.Light.Highlight["HIghhlight Gray"][50]
                  ),
                }}
              >
                <Tag
                  size={20}
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button.Primary
                        : tokens.Light.Button.Primary
                    ),
                  }}
                />
              </div>
              <span
                className="text-sm font-medium"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                }}
              >
                +8.2%
              </span>
            </div>
            <h3
              className="text-2xl font-bold mb-1"
              style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Heading
                    : tokens.Light.Typography.Heading
                ),
              }}
            >
              {analyticsData.totalResources.toLocaleString()}
            </h3>
            <p
              className="text-sm"
              style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                ),
              }}
            >
              Total Resources
            </p>
          </div>

          <div
            className="rounded-2xl p-6"
           style={{
            background: resolveToken(
              theme === "dark"
                ? tokens.Dark.Surface.Foreground
                : tokens.Light.Surface.Foreground
            ),
            borderRadius: resolveToken(
              theme === "dark"
                ? tokens.Dark.Radius["Radius-lg"]
                : tokens.Light.Radius["Radius-lg"]
            ),
          }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="p-3 rounded-lg"
                style={{
                  background: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Highlight["HIghhlight Gray"][50]
                      : tokens.Light.Highlight["HIghhlight Gray"][50]
                  ),
                }}
              >
                <TrendingUp
                  size={20}
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button.Primary
                        : tokens.Light.Button.Primary
                    ),
                  }}
                />
              </div>
              <span
                className="text-sm font-medium"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                }}
              >
                +18.7%
              </span>
            </div>
            <h3
              className="text-2xl font-bold mb-1"
              style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Heading
                    : tokens.Light.Typography.Heading
                ),
              }}
            >
              {analyticsData.totalCriticalElements.toLocaleString()}
            </h3>
            <p
              className="text-sm"
              style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                ),
              }}
            >
              Critical Elements
            </p>
          </div>

          <div
            className="rounded-2xl p-6"
           style={{
            background: resolveToken(
              theme === "dark"
                ? tokens.Dark.Surface.Foreground
                : tokens.Light.Surface.Foreground
            ),
            borderRadius: resolveToken(
              theme === "dark"
                ? tokens.Dark.Radius["Radius-lg"]
                : tokens.Light.Radius["Radius-lg"]
            ),
          }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="p-3 rounded-lg"
                style={{
                  background: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Highlight["HIghhlight Gray"][50]
                      : tokens.Light.Highlight["HIghhlight Gray"][50]
                  ),
                }}
              >
                <BarChart3
                  size={20}
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button.Primary
                        : tokens.Light.Button.Primary
                    ),
                  }}
                />
              </div>
              <span
                className="text-sm font-medium"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                }}
              >
                +22.1%
              </span>
            </div>
            <h3
              className="text-2xl font-bold mb-1"
              style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Heading
                    : tokens.Light.Typography.Heading
                ),
              }}
            >
              {analyticsData.totalUsers.toLocaleString()}
            </h3>
            <p
              className="text-sm"
              style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                ),
              }}
            >
              Total Users
            </p>
          </div>
        </div>

        {/* Charts and Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
          {/* Redemption Rates Chart */}
          <div
            className="rounded-2xl p-6"
           style={{
            background: resolveToken(
              theme === "dark"
                ? tokens.Dark.Surface.Foreground
                : tokens.Light.Surface.Foreground
            ),
            borderRadius: resolveToken(
              theme === "dark"
                ? tokens.Dark.Radius["Radius-lg"]
                : tokens.Light.Radius["Radius-lg"]
            ),
          }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-semibold"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                System Activity Trend 
              </h3>
          
            </div>

            {/* Activity Chart */}
            <div className="space-y-3">
              {analyticsData.activityTrend.map((item, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-sm font-medium w-12"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Subtext
                            : tokens.Light.Typography.Subtext
                        ),
                      }}
                    > 
                      {item.month}
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Subtext
                            : tokens.Light.Typography.Subtext
                        ),
                      }}
                    >
                      Uploads: {item.uploads} | Edits: {item.edits} | Deletes: {item.deletes}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        background: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Highlight["HIghhlight Gray"][50]
                            : tokens.Light.Highlight["HIghhlight Gray"][50]
                        ),
                      }}
                    >
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${(item.uploads / 215) * 100}%`,
                          background: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Button.Primary
                              : tokens.Light.Button.Primary
                          ),
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Surveys by Type */}
          <div
            className="rounded-2xl p-6"
           style={{
            background: resolveToken(
              theme === "dark"
                ? tokens.Dark.Surface.Foreground
                : tokens.Light.Surface.Foreground
            ),
            borderRadius: resolveToken(
              theme === "dark"
                ? tokens.Dark.Radius["Radius-lg"]
                : tokens.Light.Radius["Radius-lg"]
            ),
          }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3
                className="text-lg font-semibold"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }} 
              >
                Content by Category
              </h3>
              <PieChart
                size={20}
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Button.Primary
                      : tokens.Light.Button.Primary
                  ),
                }}
              />
            </div>

            {/* Content Categories */}
            <div className="space-y-3">
              {analyticsData.systemStats.byCategory.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span
                    className="text-sm font-medium flex-1 truncate"
                    style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Subtext
                          : tokens.Light.Typography.Subtext
                      ),
                    }}
                  >
                    {item.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-16 rounded-full"
                      style={{
                        background: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Highlight["HIghhlight Gray"][50]
                            : tokens.Light.Highlight["HIghhlight Gray"][50]
                        ),
                      }}
                    >
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${item.percentage}%`,
                          background: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Button.Primary
                              : tokens.Light.Button.Primary
                          ),
                        }}
                      />
                    </div>
                    <span
                      className="text-sm font-semibold w-12 text-right"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    >
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

       
    </main>
    </div>
  );
};

export default MerchantDashboard;
