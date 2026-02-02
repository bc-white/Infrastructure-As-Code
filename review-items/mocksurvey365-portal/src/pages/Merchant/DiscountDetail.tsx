import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { resolveToken } from "@/utils/resolveToken";
import { tokens } from "@/styles/theme";
import { getTheme } from "@/styles/getTheme";
import { XCircle, Mail, Phone, MapPin, Calendar, Building2, Users, FileText, CreditCard, Ban, Globe } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable } from "@/components/data-table/data-table";
import { getInvitedUsers, getSignedUserById, getFacilitiesUnderUser, getSurveysUnderUser, type InvitedUser, type Facility as ServiceFacility, type Survey as ServiceSurvey } from "@/api/services/usersService";
import {
  type ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

interface Facility {
  id: string;
  name: string;
  type: string;
  location: string;
  status: "active" | "inactive" | "pending";
  memberSince: string;
  members: number;
}

interface Team {
      id: string;
  name: string;
  role: string;
  department: string;
  status: "active" | "inactive";
  joinedDate: string;
  email: string;
}

interface Survey {
  id: string;
  title: string;
  status: "completed" | "pending" | "not_started";
  completedDate?: string;
  startedDate?: string;
  responses: number;
  completionPercentage: number;
}

interface PaymentPlan {
  id: string;
  planName: string;
  status: "active" | "cancelled" | "expired";
  startDate: string;
  endDate?: string;
      amount: number;
  billingCycle: "monthly" | "yearly";
  paymentMethod: string;
}

interface Account {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  registeredDate: string;
  status: "active" | "inactive" | "pending";
  plan: string;
  location: string;
  country?: string;
  age?: number;
  gender?: string;
  isSubscribed?: boolean;
  isEmailVerified?: boolean;
  emailNotification?: boolean;
  agreementConfirmation?: boolean;
  surveyResponsesNotification?: boolean;
  weeklyReportNotification?: boolean;
  activity: {
    lastLogin?: string;
    totalLogins: number;
    surveyCompleted: boolean;
    surveyCompletionDate?: string;
    accountAge: number; // days since registration
  };
  profile: {
    bio?: string;
    preferences: string[];
    interests: string[];
  };
  facilities: Facility[];
  teams: Team[];
  surveys: Survey[];
  paymentPlans: PaymentPlan[];
}

const DiscountDetail = () => {
  const theme = getTheme();
  const navigate = useNavigate();
  const { id } = useParams();

  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [facilitiesLoading, setFacilitiesLoading] = useState(false);
  const [surveysLoading, setSurveysLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Refs to track if data has been loaded to prevent infinite loops
  const facilitiesLoadedRef = useRef(false);
  const teamsLoadedRef = useRef(false);
  const surveysLoadedRef = useRef(false);


  useEffect(() => {
    // Fetch account from API
    const fetchAccount = async () => {
      setLoading(true);
      try {
        if (id) {
          const userData = await getSignedUserById(id);
          
          if (!userData) {
            toast.error("Account not found");
            navigate("/dashboard/accounts");
            return;
          }

          // Determine status based on email verification and last sign in
          let status: "active" | "inactive" | "pending" = "pending";
          if (userData.isEmailVerified) {
            status = userData.lastSignIn ? "active" : "inactive";
          }

          // Calculate account age (days since registration)
          const daysSinceReg = userData.createdAt
            ? Math.floor((new Date().getTime() - new Date(userData.createdAt).getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          // Map API data to Account interface
          const accountData: Account = {
            id: userData.id,
            fullName: `${userData.firstName} ${userData.lastName}`.trim(),
            email: userData.email,
            phone: userData.phoneNumber || "N/A",
            registeredDate: userData.createdAt,
            status: status,
            plan: userData.roleId?.name || "N/A",
            location: userData.city || "Unknown",
            country: userData.countryName || undefined,
            isSubscribed: userData.isSubscribed,
            isEmailVerified: userData.isEmailVerified,
            emailNotification: userData.emailNotification,
            agreementConfirmation: userData.agreementConfirmation,
            surveyResponsesNotification: userData.surveyResponsesNotification,
            weeklyReportNotification: userData.weeklyReportNotification,
      activity: {
              lastLogin: userData.lastSignIn,
              totalLogins: 0, // Not provided by API
              surveyCompleted: false, // Not provided by API
              surveyCompletionDate: undefined,
        accountAge: daysSinceReg,
      },
      profile: {
              bio: `Registered user from ${userData.city || userData.countryName || "Unknown"}. Active member of the platform.`,
        preferences: ["Email Notifications", "SMS Updates", "Weekly Reports"],
              interests: ["Technology", "Education", "Healthcare"],
            },
            facilities: [], // Not provided by API
            teams: [], // Will be populated when Teams tab is active
            surveys: [], // Not provided by API
            paymentPlans: [], // Not provided by API
          };

          setAccount(accountData);
          // Reset refs when account changes
          facilitiesLoadedRef.current = false;
          teamsLoadedRef.current = false;
          surveysLoadedRef.current = false;
        }
      } catch (error: any) {
        console.error("Failed to fetch account:", error);
        toast.error(error?.response?.data?.message || "Failed to load account details");
        navigate("/dashboard/accounts");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAccount();
    }
  }, [id, navigate]);

  // Fetch invited users when Teams tab is active
  useEffect(() => {
    const fetchInvitedUsers = async () => {
      if (activeTab === "teams" && id && account && !teamsLoadedRef.current && account.teams.length === 0) {
        setTeamsLoading(true);
        teamsLoadedRef.current = true; // Mark as loading to prevent duplicate calls
        try {
          const invitedUsers = await getInvitedUsers(id);
          
          // Map invited users to Team interface
          const mappedTeams: Team[] = invitedUsers.map((user: InvitedUser) => ({
            id: user.id,
            name: `${user.firstName} ${user.lastName}`.trim() || user.email,
            role: user.roleId?.name || "N/A",
            department: user.organization || "N/A",
            status: user.lastSignIn ? "active" : "inactive",
            joinedDate: user.createdAt,
            email: user.email,
          }));
          
          // Update account with teams
          setAccount((prevAccount) => {
            if (!prevAccount) return prevAccount;
            return {
              ...prevAccount,
              teams: mappedTeams,
            };
          });
        } catch (error: any) {
          console.error("Failed to fetch invited users:", error);
          toast.error(error?.response?.data?.message || "Failed to load invited users");
          teamsLoadedRef.current = false; // Reset on error so we can retry
        } finally {
          setTeamsLoading(false);
        }
      }
    };

    fetchInvitedUsers();
  }, [activeTab, id]);

  // Fetch facilities when Facilities tab is active
  useEffect(() => {
    const fetchFacilities = async () => {
      if (activeTab === "facilities" && id && account && !facilitiesLoadedRef.current && account.facilities.length === 0) {
        setFacilitiesLoading(true);
        facilitiesLoadedRef.current = true; // Mark as loading to prevent duplicate calls
        try {
          const facilities = await getFacilitiesUnderUser(id);
          
          // Map facilities to Facility interface
          const mappedFacilities: Facility[] = facilities.map((facility: ServiceFacility) => ({
            id: facility.id,
            name: facility.name,
            type: facility.type,
            location: facility.location,
            status: facility.status,
            memberSince: facility.memberSince,
            members: facility.members,
          }));
          
          // Update account with facilities using functional update to avoid dependency issues
          setAccount((prevAccount) => {
            if (!prevAccount) return prevAccount;
            return {
              ...prevAccount,
              facilities: mappedFacilities,
            };
          });
        } catch (error: any) {
          console.error("Failed to fetch facilities:", error);
          toast.error(error?.response?.data?.message || "Failed to load facilities");
          facilitiesLoadedRef.current = false; // Reset on error so we can retry
        } finally {
          setFacilitiesLoading(false);
        }
      }
    };

    fetchFacilities();
  }, [activeTab, id]);

  // Fetch surveys when Surveys tab is active
  useEffect(() => {
    const fetchSurveys = async () => {
      if (activeTab === "surveys" && id && account && !surveysLoadedRef.current && account.surveys.length === 0) {
        setSurveysLoading(true);
        surveysLoadedRef.current = true; // Mark as loading to prevent duplicate calls
        try {
          const surveys = await getSurveysUnderUser(id);
          
          // Map surveys to Survey interface
          const mappedSurveys: Survey[] = surveys.map((survey: ServiceSurvey) => ({
            id: survey.id,
            title: survey.title,
            status: survey.status,
            completedDate: survey.completedDate,
            startedDate: survey.startedDate,
            responses: survey.responses,
            completionPercentage: survey.completionPercentage,
          }));
          
          // Update account with surveys using functional update to avoid dependency issues
          setAccount((prevAccount) => {
            if (!prevAccount) return prevAccount;
            return {
              ...prevAccount,
              surveys: mappedSurveys,
            };
          });
        } catch (error: any) {
          console.error("Failed to fetch surveys:", error);
          toast.error(error?.response?.data?.message || "Failed to load surveys");
          surveysLoadedRef.current = false; // Reset on error so we can retry
        } finally {
          setSurveysLoading(false);
        }
      }
    };

    fetchSurveys();
  }, [activeTab, id]);

  const handleEdit = () => {
    // Navigate to edit page if needed
    toast.info("Edit functionality coming soon");
  };

  const handleDelete = () => {
    // In real app, show confirmation dialog and call delete API
    toast.success("Account deleted successfully");
    navigate("/dashboard/accounts");
  };

  const handleBlock = () => {
    // In real app, show confirmation dialog and call block/unblock API
    const isBlocked = account?.status === "inactive";
    if (isBlocked) {
      toast.success("Account unblocked successfully");
      // In real app, update account status
      if (account) {
        setAccount({ ...account, status: "active" });
      }
    } else {
      toast.success("Account blocked successfully");
      // In real app, update account status
      if (account) {
        setAccount({ ...account, status: "inactive" });
      }
    }
  };

  const handleBack = () => {
    navigate("/dashboard/accounts");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "inactive":
        return "text-red-600 bg-red-100";
      case "pending":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Payment Plans columns
  const paymentPlansColumns: ColumnDef<PaymentPlan>[] = useMemo(() => [
    {
      accessorKey: "planName",
      header: "Plan Name",
      cell: ({ row }) => (
        <div className="font-medium" style={{
          color: resolveToken(
            theme === "dark"
              ? tokens.Dark.Typography.Heading
              : tokens.Light.Typography.Heading
          ),
        }}>
          {row.original.planName}
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-semibold" style={{
          color: resolveToken(
            theme === "dark"
              ? tokens.Dark.Typography.Heading
              : tokens.Light.Typography.Heading
          ),
        }}>
          ${row.original.amount.toFixed(2)}/{row.original.billingCycle === "monthly" ? "mo" : "yr"}
        </span>
      ),
    },
    {
      accessorKey: "billingCycle",
      header: "Billing Cycle",
      cell: ({ row }) => (
        <Badge variant="secondary" style={{
          background: resolveToken(
            theme === "dark"
              ? tokens.Dark.Highlight["HIghhlight Gray"][50]
              : tokens.Light.Highlight["HIghhlight Gray"][50]
          ),
        }}>
          {row.original.billingCycle.charAt(0).toUpperCase() + row.original.billingCycle.slice(1)}
        </Badge>
      ),
    },
    {
      accessorKey: "startDate",
      header: "Start Date",
      cell: ({ row }) => (
        <span style={{
          color: resolveToken(
            theme === "dark"
              ? tokens.Dark.Typography.Subtext
              : tokens.Light.Typography.Subtext
          ),
        }}>
          {formatDate(row.original.startDate)}
        </span>
      ),
    },
    {
      accessorKey: "endDate",
      header: "End Date",
      cell: ({ row }) => (
        <span style={{
          color: resolveToken(
            theme === "dark"
              ? tokens.Dark.Typography.Subtext
              : tokens.Light.Typography.Subtext
          ),
        }}>
          {row.original.endDate ? formatDate(row.original.endDate) : "-"}
        </span>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: "Payment Method",
      cell: ({ row }) => (
        <span style={{
          color: resolveToken(
            theme === "dark"
              ? tokens.Dark.Typography.Subtext
              : tokens.Light.Typography.Subtext
          ),
        }}>
          {row.original.paymentMethod}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={
          row.original.status === "active" ? "bg-green-100 text-green-800" :
          row.original.status === "cancelled" ? "bg-red-100 text-red-800" :
          "bg-gray-100 text-gray-800"
        }>
          {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
        </Badge>
      ),
    },
  ], [theme]);

  // Table instances - MUST be before any conditional returns
  const paymentPlansTable = useReactTable({
    data: account?.paymentPlans || [],
    columns: paymentPlansColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: resolveToken(
            theme === "dark"
              ? tokens.Dark.Surface.Primary
              : tokens.Light.Surface.Primary
          ),
        }}
      >
        <div 
          className="rounded-2xl p-8 text-center"
          style={{
            background: `linear-gradient(180deg, ${resolveToken(
              theme === "dark"
                ? tokens.Dark.Gradient["Gradient Grey 25"]
                : tokens.Light.Gradient["Gradient Grey 25"]
            )} 0%, ${resolveToken(
              theme === "dark"
                ? tokens.Dark.Gradient["Gradient White"]
                : tokens.Light.Gradient["Gradient White"]
            )} 100%)`,
            borderRadius: resolveToken(
              theme === "dark"
                ? tokens.Dark.Radius["Radius-lg"]
                : tokens.Light.Radius["Radius-lg"]
            ),
          }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{
            borderColor: resolveToken(
              theme === "dark"
                ? tokens.Dark.Button.Primary
                : tokens.Light.Button.Primary
            )
          }}></div>
          <p style={{
            color: resolveToken(
              theme === "dark"
                ? tokens.Dark.Typography.Subtext
                : tokens.Light.Typography.Subtext
            )
          }}>Loading account details...</p>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: resolveToken(
            theme === "dark"
              ? tokens.Dark.Surface.Primary
              : tokens.Light.Surface.Primary
          ),
        }}
      >
        <div 
          className="rounded-2xl p-8 text-center"
          style={{
            background: `linear-gradient(180deg, ${resolveToken(
              theme === "dark"
                ? tokens.Dark.Gradient["Gradient Grey 25"]
                : tokens.Light.Gradient["Gradient Grey 25"]
            )} 0%, ${resolveToken(
              theme === "dark"
                ? tokens.Dark.Gradient["Gradient White"]
                : tokens.Light.Gradient["Gradient White"]
            )} 100%)`,
            borderRadius: resolveToken(
              theme === "dark"
                ? tokens.Dark.Radius["Radius-lg"]
                : tokens.Light.Radius["Radius-lg"]
            ),
          }}
        >
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold mb-2" style={{
            color: resolveToken(
              theme === "dark"
                ? tokens.Dark.Typography.Heading
                : tokens.Light.Typography.Heading
            )
          }}>Account Not Found</h2>
          <p style={{
            color: resolveToken(
              theme === "dark"
                ? tokens.Dark.Typography.Subtext
                : tokens.Light.Typography.Subtext
            )
          }}>The account you're looking for doesn't exist or has been removed.</p>
          <Button
            onClick={handleBack}
            className="mt-4"
            style={{
              background: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Button.Primary
                  : tokens.Light.Button.Primary
              ),
              color: resolveToken(
                theme === "dark"
                  ? tokens.Dark.Button["Primary Text"]
                  : tokens.Light.Button["Primary Text"]
              ),
            }}
          >
            Back to Accounts
          </Button>
        </div>
      </div>
    );
  }

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
      {/* Header */}
      <div 
        className="p-4 lg:p-6 border-b"
        style={{
          background: `linear-gradient(180deg, ${resolveToken(
            theme === "dark"
              ? tokens.Dark.Gradient["Gradient Grey 25"]
              : tokens.Light.Gradient["Gradient Grey 25"]
          )} 0%, ${resolveToken(
            theme === "dark"
              ? tokens.Dark.Gradient["Gradient White"]
              : tokens.Light.Gradient["Gradient White"]
          )} 100%)`,
          borderRadius: resolveToken(
            theme === "dark"
              ? tokens.Dark.Radius["Radius-lg"]
              : tokens.Light.Radius["Radius-lg"]
          ),
          borderColor: resolveToken(
            theme === "dark"
              ? tokens.Dark.Surface.Foreground
              : tokens.Light.Surface.Foreground
          ),
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:px-9 px-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium"
                style={{
                  background: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Button.Primary
                      : tokens.Light.Button.Primary
                  ),
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Button["Primary Text"]
                      : tokens.Light.Button["Primary Text"]
                  ),
                }}
              >
                {account.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div>
            <h1 
              className="text-xl sm:text-2xl font-semibold"
              style={{
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Heading
                    : tokens.Light.Typography.Heading
                ),
              }}
            >
                  {account.fullName} 
            </h1>
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
                  {account.email}
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(account.status)}`}>
              {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 text-sm sm:text-base flex-1 sm:flex-none"
              style={{
                background: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button.Primary
                    : tokens.Light.Button.Primary
                ),
                borderColor: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button.Primary
                    : tokens.Light.Button.Primary
                ),
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button["Primary Text"]
                    : tokens.Light.Button["Primary Text"]
                ),
                borderRadius: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Radius["Radius-200"]
                    : tokens.Light.Radius["Radius-200"]
                ),
              }}
            >
              Back
            </Button>
            <Button
              variant="outline"
              onClick={handleEdit}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 text-sm sm:text-base flex-1 sm:flex-none"
              style={{
                background: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button.Primary
                    : tokens.Light.Button.Primary
                ),
                borderColor: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button.Primary
                    : tokens.Light.Button.Primary
                ),
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button["Primary Text"]
                    : tokens.Light.Button["Primary Text"]
                ),
              }}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={handleBlock}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 text-sm sm:text-base flex-1 sm:flex-none border-red-200 hover:border-red-300"
              style={{
                background: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Highlight["Highlight Red"][300] || tokens.Dark.Highlight["Highlight Red"][400] || tokens.Dark.Highlight["Highlight Red"][500]
                    : tokens.Light.Highlight["Highlight Red"][300] || tokens.Light.Highlight["Highlight Red"][400] || tokens.Light.Highlight["Highlight Red"][500]
                ),
                borderColor: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Highlight["Highlight Red"][300] || tokens.Dark.Highlight["Highlight Red"][400] || tokens.Dark.Highlight["Highlight Red"][500]
                    : tokens.Light.Highlight["Highlight Red"][300] || tokens.Light.Highlight["Highlight Red"][400] || tokens.Light.Highlight["Highlight Red"][500]
                ),
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Button["Primary Text"]
                    : tokens.Light.Button["Primary Text"]
                ),
              }}
            > 
              <Ban size={16} />
              {account?.status === "inactive" ? "Unblock" : "Block"}
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 text-sm sm:text-base flex-1 sm:flex-none border-red-200 hover:border-red-300"
              style={{
                background: "transparent",
                borderColor: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Highlight["Highlight Red"][500]
                    : tokens.Light.Highlight["Highlight Red"][500]
                ),
                color: resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Highlight["Highlight Red"][500]
                    : tokens.Light.Highlight["Highlight Red"][500]
                ),
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto md:px-9 px-5 pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} >
          <TabsList 
            className="w-fit justify-start"
             
          >
            <TabsTrigger 
              value="overview"
                style={{
                background: activeTab === "overview" ? resolveToken(
                    theme === "dark"
                    ? tokens.Dark.Surface.Primary 
                    : tokens.Light.Surface.Primary
                ) : "transparent",
                
              color: activeTab === "overview" 
                ? resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  )
                : resolveToken(
                    theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                ),
              borderBottom: activeTab === "overview" 
                ? `1px solid ${resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Button.Primary
                      : tokens.Light.Button.Primary
                  )}`
                : "1px solid transparent",
            }}
            className="rounded-sm"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="facilities"
                          style={{
                background: activeTab === "facilities" ? resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Surface.Primary 
                    : tokens.Light.Surface.Primary
                ) : "transparent",
                
              color: activeTab === "facilities" 
                ? resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Typography.Heading
                                : tokens.Light.Typography.Heading
                  )
                : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                ),
              borderBottom: activeTab === "facilities" 
                ? `1px solid ${resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Button.Primary
                      : tokens.Light.Button.Primary
                  )}`
                : "1px solid transparent",
            }}
            className="rounded-sm"
            >
              <Building2 size={16} className="mr-2" />
              Facilities
            </TabsTrigger>
            <TabsTrigger 
              value="teams"
                        style={{
                background: activeTab === "teams" ? resolveToken( 
                            theme === "dark"
                    ? tokens.Dark.Surface.Primary 
                    : tokens.Light.Surface.Primary
                ) : "transparent",
                
              color: activeTab === "teams" 
                ? resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  )
                : resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
              borderBottom: activeTab === "teams" 
                ? `1px solid ${resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Button.Primary
                      : tokens.Light.Button.Primary
                  )}`
                : "1px solid transparent",
            }}
            className="rounded-sm"
            >
              <Users size={16} className="mr-2" />
              Teams
            </TabsTrigger>
            <TabsTrigger 
              value="surveys"
              style={{
                background: activeTab === "surveys" ? resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Surface.Primary 
                    : tokens.Light.Surface.Primary
                ) : "transparent",
                
              color: activeTab === "surveys" 
                ? resolveToken(
                  theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  )
                : resolveToken(
                  theme === "dark"
                    ? tokens.Dark.Typography.Subtext
                    : tokens.Light.Typography.Subtext
                ),
              borderBottom: activeTab === "surveys" 
                ? `1px solid ${resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Button.Primary
                      : tokens.Light.Button.Primary
                  )}`
                : "1px solid transparent",
            }}
            className="rounded-sm"
            >
              <FileText size={16} className="mr-2" />
              Surveys
            </TabsTrigger>
            <TabsTrigger 
              value="payment-plans"
                style={{
                  background: activeTab === "payment-plans" ? resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Surface.Primary 
                      : tokens.Light.Surface.Primary
                  ) : "transparent",
                  
                color: activeTab === "payment-plans" 
                  ? resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                    )
                  : resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Subtext
                      : tokens.Light.Typography.Subtext
                  ),
                borderBottom: activeTab === "payment-plans" 
                  ? `1px solid ${resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button.Primary
                        : tokens.Light.Button.Primary
                    )}`
                  : "1px solid transparent",
              }}
              className="rounded-sm"
            >
              <CreditCard size={16} className="mr-2" />
              Payment Plans
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Information */}
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
              <h2 
                className="text-lg font-semibold mb-4"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                Account Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <Mail size={20} className="flex-shrink-0" style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button.Primary
                        : tokens.Light.Button.Primary
                    )
                  }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium mb-1" style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      )
                    }}>Email</p>
                    <p className="text-sm break-words" style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Subtext
                          : tokens.Light.Typography.Subtext
                      )
                    }}>{account.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 min-w-0">
                  <Phone size={20} className="flex-shrink-0" style={{
                  color: resolveToken(
                    theme === "dark"
                        ? tokens.Dark.Button.Primary
                        : tokens.Light.Button.Primary
                    )
                  }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium mb-1" style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      )
                    }}>Phone</p>
                    <p className="text-sm break-words" style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Subtext
                          : tokens.Light.Typography.Subtext
                      )
                    }}>{account.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 min-w-0">
                  <MapPin size={20} className="flex-shrink-0" style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Button.Primary
                        : tokens.Light.Button.Primary
                    )
                  }} />
                    <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium mb-1" style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        )
                    }}>Location</p>
                    <p className="text-sm break-words" style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Subtext
                          : tokens.Light.Typography.Subtext
                      )
                    }}>{account.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 min-w-0">
                  <Globe size={20} className="flex-shrink-0" style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Button.Primary
                            : tokens.Light.Button.Primary
                        )
                  }} />
                    <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium mb-1" style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        )
                    }}>Country</p>
                    <p className="text-sm break-words" style={{
                        color: resolveToken(
                          theme === "dark"
                          ? tokens.Dark.Typography.Subtext
                          : tokens.Light.Typography.Subtext
                        )
                    }}>{account.country || "N/A"}</p>
                    </div> 
                  </div>
              </div>
            </div>

            {/* Profile Bio */}
            {account.profile.bio && (
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
                <h2 
                  className="text-lg font-semibold mb-3"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}
                >
                  Profile Bio
                </h2>
                <p 
                  className="text-sm leading-relaxed"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    ),
                  }}
                >
                  {account.profile.bio}
                </p>
              </div>
            )}

            {/* Account Activity */}
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
                      <h2 
                        className="text-lg font-semibold mb-4"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      >
                Account Activity
                      </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    )
                  }}>Total Logins</span>
                  <span className="text-sm font-semibold" style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    )
                  }}>{account.activity.totalLogins}</span>
                </div>
                {account.activity.lastLogin && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{
                            color: resolveToken(
                              theme === "dark"
                          ? tokens.Dark.Typography.Subtext
                          : tokens.Light.Typography.Subtext
                      )
                    }}>Last Login</span>
                    <span className="text-sm font-semibold" style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                      )
                    }}>{formatDateTime(account.activity.lastLogin)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Subtext
                                  : tokens.Light.Typography.Subtext
                    )
                  }}>Survey Status</span>
                  <Badge className={account.activity.surveyCompleted ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                    {account.activity.surveyCompleted ? "Completed" : "Pending"}
                  </Badge>
                        </div>
                {account.activity.surveyCompletionDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Subtext
                                  : tokens.Light.Typography.Subtext
                      )
                    }}>Survey Completed</span>
                    <span className="text-sm font-semibold" style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      )
                    }}>{formatDate(account.activity.surveyCompletionDate)}</span>
                  </div>
                        )}
                      </div>
            </div>
          </div>

          {/* Right Column - Additional Info */}
          <div className="space-y-6">
            {/* Registration Details */}
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
              <h3 
                className="text-lg font-semibold mb-4 flex items-center gap-2"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                <Calendar size={20} />
                Registration Details
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium" style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    )
                  }}>Registered Date</p>
                  <p className="text-sm" style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    )
                  }}>{formatDate(account.registeredDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    )
                  }}>Account Age</p>
                  <p className="text-sm" style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    )
                  }}>{account.activity.accountAge} days</p>
                </div>
              </div>
            </div>

            {/* Subscription */}
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
              <h3 
                className="text-lg font-semibold mb-4"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                Subscription
              </h3>
              {(() => {
                const activeSubscription = account.paymentPlans.find(
                  (plan) => plan.status === "active"
                );
                
                if (activeSubscription) {
                  return (
              <Badge
                variant="secondary"
                className="text-base px-4 py-2"
                    style={{
                      background: resolveToken(
                        theme === "dark"
                      ? tokens.Dark.Button.Primary
                      : tokens.Light.Button.Primary
                      ),
                      color: resolveToken(
                        theme === "dark"
                      ? tokens.Dark.Button["Primary Text"]
                      : tokens.Light.Button["Primary Text"]
                      ),
                    }}
                  >
                      {activeSubscription.planName}
              </Badge>
                  );
                }
                
                return (
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
                    No subscription yet
                  </p>
                );
              })()}
                </div>

            {/* Account Settings */}
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
                <h3 
                className="text-lg font-semibold mb-4"
                  style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    ),
                  }}
                >
                Account Settings
                </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{
                    color: resolveToken(
                          theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    )
                  }}>Email Verified</span>
                  <Badge className={account.isEmailVerified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {account.isEmailVerified ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    )
                  }}>Subscribed</span>
                  <Badge className={account.isSubscribed ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {account.isSubscribed ? "Yes" : "No"}
                    </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    )
                  }}>Agreement Confirmed</span>
                  <Badge className={account.agreementConfirmation ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {account.agreementConfirmation ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    )
                  }}>Email Notifications</span>
                  <Badge className={account.emailNotification ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {account.emailNotification ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    )
                  }}>Survey Responses Notifications</span>
                  <Badge className={account.surveyResponsesNotification ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {account.surveyResponsesNotification ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    )
                  }}>Weekly Report Notifications</span>
                  <Badge className={account.weeklyReportNotification ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {account.weeklyReportNotification ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
              </div>

            {/* Statistics */}
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
              <h3 
                className="text-lg font-semibold mb-4"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    )
                  }}>Account Status</span>
                  <Badge className={getStatusColor(account.status)}>
                    {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
                  </Badge>
                </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Subtext
                          : tokens.Light.Typography.Subtext
                      )
                  }}>Total Logins</span>
                    <span className="text-sm font-semibold" style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Heading
                          : tokens.Light.Typography.Heading
                      )
                  }}>{account.activity.totalLogins}</span>
                  </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    )
                  }}>Registered</span>
                  <span className="text-sm font-semibold" style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    )
                  }}>{formatDate(account.registeredDate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Subtext
                        : tokens.Light.Typography.Subtext
                    )
                  }}>Account ID</span>
                  <span className="text-sm font-semibold font-mono" style={{
                    color: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Typography.Heading
                        : tokens.Light.Typography.Heading
                    )
                  }}>#{account.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
          </TabsContent>

          {/* Facilities Tab */}
          <TabsContent value="facilities" className="mt-6">
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
              <h2 
                className="text-lg font-semibold mb-6 flex items-center gap-2"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                <Building2 size={20} />
                Facilities ({account.facilities.length})
              </h2>
              {facilitiesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{
                      borderColor: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Button.Primary
                          : tokens.Light.Button.Primary
                      )
                    }}></div>
                    <p style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Subtext
                          : tokens.Light.Typography.Subtext
                      )
                    }}>Loading facilities...</p>
                  </div>
                </div>
              ) : (
                <div
                  className="overflow-hidden rounded-2xl border"
                  style={{
                    borderColor: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Stroke["Stroke-02"]
                        : tokens.Light.Stroke["Stroke-02"]
                    ),
                    borderRadius: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Radius["Radius-lg"]
                        : tokens.Light.Radius["Radius-lg"]
                    ),
                  }}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr
                          className="border-b"
                          style={{
                            borderColor: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Stroke["Stroke-02"]
                                : tokens.Light.Stroke["Stroke-02"]
                            ),
                            background: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Surface.Foreground
                                : tokens.Light.Surface.Foreground
                            ),
                          }}
                        >
                          <th
                            className="text-left py-4 px-6 font-semibold text-sm"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Facility Name
                          </th>
                          <th
                            className="text-left py-4 px-6 font-semibold text-sm"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Type
                          </th>
                          <th
                            className="text-left py-4 px-6 font-semibold text-sm"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Location
                          </th>
                          <th
                            className="text-left py-4 px-6 font-semibold text-sm"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Member Since
                          </th>
                          <th
                            className="text-left py-4 px-6 font-semibold text-sm"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Members
                          </th>
                          <th
                            className="text-left py-4 px-6 font-semibold text-sm"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {account.facilities.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center" style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Subtext
                                  : tokens.Light.Typography.Subtext
                              ),
                            }}>
                              No facilities found
                            </td>
                          </tr>
                        ) : (
                          account.facilities.map((facility, index) => (
                            <tr
                              key={facility.id}
                              className={`border-b transition-colors hover:bg-opacity-50 ${
                                index % 2 === 0 ? "bg-opacity-0" : "bg-opacity-5"
                              }`}
                              style={{
                                borderColor: resolveToken(
                                  theme === "dark"
                                    ? tokens.Dark.Stroke["Stroke-02"]
                                    : tokens.Light.Stroke["Stroke-02"]
                                ),
                                background:
                                  index % 2 === 0
                                    ? "transparent"
                                    : resolveToken(
                                        theme === "dark"
                                          ? tokens.Dark.Highlight[
                                              "HIghhlight Gray"
                                            ][50]
                                          : tokens.Light.Highlight[
                                              "HIghhlight Gray"
                                            ][50]
                                      ),
                              }}
                            >
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center"
                                    style={{
                                      background: resolveToken(
                                        theme === "dark"
                                          ? tokens.Dark.Highlight[
                                              "HIghhlight Gray"
                                            ][100]
                                          : tokens.Light.Highlight[
                                              "HIghhlight Gray"
                                            ][100]
                                      ),
                                    }}
                                  >
                                    <span
                                      className="text-sm font-semibold"
                                      style={{
                                        color: resolveToken(
                                          theme === "dark"
                                            ? tokens.Dark.Typography.Heading
                                            : tokens.Light.Typography.Heading
                                        ),
                                      }}
                                    >
                                      {facility.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()
                                        .slice(0, 2)}
                                    </span>
                                  </div>
                                  <div>
                                    <p
                                      className="font-semibold text-sm"
                                      style={{
                                        color: resolveToken(
                                          theme === "dark"
                                            ? tokens.Dark.Typography.Heading
                                            : tokens.Light.Typography.Heading
                                        ),
                                      }}
                                    >
                                      {facility.name}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <Badge variant="secondary" style={{
                                  background: resolveToken(
                                    theme === "dark"
                                      ? tokens.Dark.Highlight["HIghhlight Gray"][50]
                                      : tokens.Light.Highlight["HIghhlight Gray"][50]
                                  ),
                                }}>
                                  {facility.type}
                                </Badge>
                              </td>
                              <td className="py-4 px-6">
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
                                  {facility.location}
                                </p>
                              </td>
                              <td className="py-4 px-6">
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
                                  {formatDate(facility.memberSince)}
                                </p>
                              </td>
                              <td className="py-4 px-6">
                                <p
                                  className="text-sm"
                                  style={{
                                    color: resolveToken(
                                      theme === "dark"
                                        ? tokens.Dark.Typography.Heading
                                        : tokens.Light.Typography.Heading
                                    ),
                                  }}
                                >
                                  {facility.members}
                                </p>
                              </td>
                              <td className="py-4 px-6">
                                <Badge className={
                                  facility.status === "active" 
                                    ? "bg-green-100 text-green-800"
                                    : facility.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }>
                                  {facility.status.charAt(0).toUpperCase() + facility.status.slice(1)}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="mt-6">
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
              <h2 
                className="text-lg font-semibold mb-6 flex items-center gap-2"
                        style={{
                          color: resolveToken(
                            theme === "dark"
                              ? tokens.Dark.Typography.Heading
                              : tokens.Light.Typography.Heading
                          ),
                        }}
                      >
                <Users size={20} />
                Teams ({account.teams.length})
              </h2>
              {teamsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{
                      borderColor: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Button.Primary
                          : tokens.Light.Button.Primary
                      )
                    }}></div>
                    <p style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Subtext
                          : tokens.Light.Typography.Subtext
                      )
                    }}>Loading invited users...</p>
                  </div>
                </div>
              ) : (
                <div
                  className="overflow-hidden rounded-2xl border"
                  style={{
                    borderColor: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Stroke["Stroke-02"]
                        : tokens.Light.Stroke["Stroke-02"]
                    ),
                    borderRadius: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Radius["Radius-lg"]
                        : tokens.Light.Radius["Radius-lg"]
                    ),
                  }}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr
                          className="border-b"
                          style={{
                            borderColor: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Stroke["Stroke-02"]
                                : tokens.Light.Stroke["Stroke-02"]
                            ),
                            background: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Surface.Foreground
                                : tokens.Light.Surface.Foreground
                            ),
                          }}
                        >
                          <th
                            className="text-left py-4 px-6 font-semibold text-sm"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Team Name
                          </th>
                          <th
                            className="text-left py-4 px-6 font-semibold text-sm"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Role
                          </th>
                          <th
                            className="text-left py-4 px-6 font-semibold text-sm"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Department
                          </th>
                          <th
                            className="text-left py-4 px-6 font-semibold text-sm"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Email
                          </th>
                          <th
                            className="text-left py-4 px-6 font-semibold text-sm"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Joined
                          </th>
                          <th
                            className="text-left py-4 px-6 font-semibold text-sm"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {account.teams.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center" style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Subtext
                                  : tokens.Light.Typography.Subtext
                              ),
                            }}>
                              No team members found
                            </td>
                          </tr>
                        ) : (
                          account.teams.map((team, index) => (
                            <tr
                              key={team.id}
                              className={`border-b transition-colors hover:bg-opacity-50 ${
                                index % 2 === 0 ? "bg-opacity-0" : "bg-opacity-5"
                              }`}
                              style={{
                                borderColor: resolveToken(
                                  theme === "dark"
                                    ? tokens.Dark.Stroke["Stroke-02"]
                                    : tokens.Light.Stroke["Stroke-02"]
                                ),
                                background:
                                  index % 2 === 0
                                    ? "transparent"
                                    : resolveToken(
                                        theme === "dark"
                                          ? tokens.Dark.Highlight[
                                              "HIghhlight Gray"
                                            ][50]
                                          : tokens.Light.Highlight[
                                              "HIghhlight Gray"
                                            ][50]
                                      ),
                              }}
                            >
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center"
                                    style={{
                                      background: resolveToken(
                                        theme === "dark"
                                          ? tokens.Dark.Highlight[
                                              "HIghhlight Gray"
                                            ][100]
                                          : tokens.Light.Highlight[
                                              "HIghhlight Gray"
                                            ][100]
                                      ),
                                    }}
                                  >
                                    <span
                                      className="text-sm font-semibold"
                                      style={{
                                        color: resolveToken(
                                          theme === "dark"
                                            ? tokens.Dark.Typography.Heading
                                            : tokens.Light.Typography.Heading
                                        ),
                                      }}
                                    >
                                      {team.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()
                                        .slice(0, 2)}
                                    </span>
                                  </div>
                                  <div>
                                    <p
                                      className="font-semibold text-sm"
                                      style={{
                                        color: resolveToken(
                                          theme === "dark"
                                            ? tokens.Dark.Typography.Heading
                                            : tokens.Light.Typography.Heading
                                        ),
                                      }}
                                    >
                                      {team.name}
                                    </p>
                                    <p
                                      className="text-xs"
                                      style={{
                                        color: resolveToken(
                                          theme === "dark"
                                            ? tokens.Dark.Typography.Subtext
                                            : tokens.Light.Typography.Subtext
                                        ),
                                      }}
                                    >
                                      {team.email}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6">
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
                                  {team.role}
                                </p>
                              </td>
                              <td className="py-4 px-6">
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
                                  {team.department}
                                </p>
                              </td>
                              <td className="py-4 px-6">
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
                                  {team.email}
                                </p>
                              </td>
                              <td className="py-4 px-6">
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
                                  {formatDate(team.joinedDate)}
                                </p>
                              </td>
                              <td className="py-4 px-6">
                                <Badge className={team.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                  {team.status.charAt(0).toUpperCase() + team.status.slice(1)}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
                    </div>
          </TabsContent>

          {/* Surveys Tab */}
          <TabsContent value="surveys" className="mt-6">
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
              <h2 
                className="text-lg font-semibold mb-6 flex items-center gap-2"
                style={{
                  color: resolveToken(
                    theme === "dark"
                      ? tokens.Dark.Typography.Heading
                      : tokens.Light.Typography.Heading
                  ),
                }}
              >
                <FileText size={20} />
                Surveys ({account.surveys.length})
              </h2>
              {surveysLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{
                      borderColor: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Button.Primary
                          : tokens.Light.Button.Primary
                      )
                    }}></div>
                    <p style={{
                      color: resolveToken(
                        theme === "dark"
                          ? tokens.Dark.Typography.Subtext
                          : tokens.Light.Typography.Subtext
                      )
                    }}>Loading surveys...</p>
                  </div>
                </div>
              ) : (
                <div
                  className="overflow-hidden rounded-2xl border"
                  style={{
                    borderColor: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Stroke["Stroke-02"]
                        : tokens.Light.Stroke["Stroke-02"]
                    ),
                    borderRadius: resolveToken(
                      theme === "dark"
                        ? tokens.Dark.Radius["Radius-lg"]
                        : tokens.Light.Radius["Radius-lg"]
                    ),
                  }}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr
                          className="border-b"
                          style={{
                            borderColor: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Stroke["Stroke-02"]
                                : tokens.Light.Stroke["Stroke-02"]
                            ),
                            background: resolveToken(
                              theme === "dark"
                                ? tokens.Dark.Surface.Foreground
                                : tokens.Light.Surface.Foreground
                            ),
                          }}
                        >
                          <th
                            className="text-left py-4 px-6 font-semibold text-sm"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Survey Title
                          </th>
                          <th
                            className="text-left py-4 px-6 font-semibold text-sm"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Status
                          </th>
                          <th
                            className="text-left py-4 px-6 font-semibold text-sm"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Started
                          </th>
                          <th
                            className="text-left py-4 px-6 font-semibold text-sm"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Completed
                          </th>
                          <th
                            className="text-left py-4 px-6 font-semibold text-sm"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Responses
                          </th>
                          <th
                            className="text-left py-4 px-6 font-semibold text-sm"
                            style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Heading
                                  : tokens.Light.Typography.Heading
                              ),
                            }}
                          >
                            Completion
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {account.surveys.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center" style={{
                              color: resolveToken(
                                theme === "dark"
                                  ? tokens.Dark.Typography.Subtext
                                  : tokens.Light.Typography.Subtext
                              ),
                            }}>
                              No surveys found
                            </td>
                          </tr>
                        ) : (
                          account.surveys.map((survey, index) => (
                            <tr
                              key={survey.id}
                              className={`border-b transition-colors hover:bg-opacity-50 ${
                                index % 2 === 0 ? "bg-opacity-0" : "bg-opacity-5"
                              }`}
                              style={{
                                borderColor: resolveToken(
                                  theme === "dark"
                                    ? tokens.Dark.Stroke["Stroke-02"]
                                    : tokens.Light.Stroke["Stroke-02"]
                                ),
                                background:
                                  index % 2 === 0
                                    ? "transparent"
                                    : resolveToken(
                                        theme === "dark"
                                          ? tokens.Dark.Highlight[
                                              "HIghhlight Gray"
                                            ][50]
                                          : tokens.Light.Highlight[
                                              "HIghhlight Gray"
                                            ][50]
                                      ),
                              }}
                            >
                              <td className="py-4 px-6">
                                <p
                                  className="font-semibold text-sm"
                                  style={{
                                    color: resolveToken(
                                      theme === "dark"
                                        ? tokens.Dark.Typography.Heading
                                        : tokens.Light.Typography.Heading
                                    ),
                                  }}
                                >
                                  {survey.title}
                                </p>
                              </td>
                              <td className="py-4 px-6">
                                <Badge className={
                                  survey.status === "completed" 
                                    ? "bg-green-100 text-green-800"
                                    : survey.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }>
                                  {survey.status.charAt(0).toUpperCase() + survey.status.slice(1).replace('_', ' ')}
                                </Badge>
                              </td>
                              <td className="py-4 px-6">
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
                                  {survey.startedDate ? formatDate(survey.startedDate) : "-"}
                                </p>
                              </td>
                              <td className="py-4 px-6">
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
                                  {survey.completedDate ? formatDate(survey.completedDate) : "-"}
                                </p>
                              </td>
                              <td className="py-4 px-6">
                                <p
                                  className="text-sm"
                                  style={{
                                    color: resolveToken(
                                      theme === "dark"
                                        ? tokens.Dark.Typography.Heading
                                        : tokens.Light.Typography.Heading
                                    ),
                                  }}
                                >
                                  {survey.responses}
                                </p>
                              </td>
                              <td className="py-4 px-6">
                                <p
                                  className="text-sm font-medium"
                                  style={{
                                    color: resolveToken(
                                      theme === "dark"
                                        ? tokens.Dark.Typography.Heading
                                        : tokens.Light.Typography.Heading
                                    ),
                                  }}
                                >
                                  {survey.completionPercentage}%
                                </p>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
                    </div>
          </TabsContent>

          {/* Payment Plans Tab */}
          <TabsContent value="payment-plans" className="mt-6">
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
              <h2 
                className="text-lg font-semibold mb-6 flex items-center gap-2"
                      style={{
                        color: resolveToken(
                          theme === "dark"
                            ? tokens.Dark.Typography.Heading
                            : tokens.Light.Typography.Heading
                        ),
                      }}
                    >
                <CreditCard size={20} />
                Payment Plans History ({account.paymentPlans.length})
              </h2>
              <DataTable table={paymentPlansTable} />
                  </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DiscountDetail;
