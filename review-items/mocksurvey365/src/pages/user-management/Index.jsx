import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  Shield,
  ShieldOff,
  Eye,
  CheckCircle,
  UserSearch,
  Mail,
  Clock,
} from "lucide-react";
import { userManagementAPI, authAPI, surveyAPI } from "../../service/api";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import InviteUserModal from "../../components/user-management/InviteUserModal";
import Loader from "../../components/loader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { DataTable } from "../../components/data-table";

const UserManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [teamOverview, setTeamOverview] = useState(null);

  // Check if current user is admin
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersResponse, overviewResponse] = await Promise.all([
        userManagementAPI.getUsers(),
        //userManagementAPI.getTeamOverview(),
      ]);

      // Add workload and performance data to users
      const usersData = usersResponse.data?.user || usersResponse.user || [];
      const usersWithMetrics = usersData.map((user) => ({
        ...user,
        workload: Math.floor(Math.random() * 100), // Mock workload for now
        performance: Math.floor(Math.random() * 100), // Mock performance for now
        lastLogin: "2 hours ago", // Mock last login for now
      }));

      setUsers(usersWithMetrics);
      //setTeamOverview(overviewResponse.data || overviewResponse);
    } catch (error) {
      toast.error("Failed to load user data");
      // Set empty arrays instead of mock data
      setUsers([]);
      setTeamOverview(null);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const rolesResponse = await authAPI.getRoles();
      setRoles(rolesResponse.data);
    } catch (error) {
      toast.error("Failed to load roles");
      setRoles([]);
    }
  };

  const handleBlockUnblock = async (userId, isLocked) => {
    try {
      await userManagementAPI.blockUnblockUser(userId, !isLocked);
      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, isLocked: !isLocked } : user
        )
      );
      toast.success(`User ${!isLocked ? "blocked" : "unblocked"} successfully`);
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const handleInviteUser = async (inviteData) => {
    try {
      // Transform the data to match the survey wizard API format
      const surveyInviteData = {
        name: inviteData.name,
        email: inviteData.email,
        role: inviteData.roleId,
      };

      await surveyAPI.inviteTeamMembers(surveyInviteData);
      toast.success("Invitation sent successfully");
      setShowInviteModal(false);
      loadData(); // Refresh data to show new user
    } catch (error) {
      toast.error("Failed to send invitation");
    }
  };

  const getStatusColor = (isLocked) => {
    return isLocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800";
  };

  const getStatusLabel = (isLocked) => {
    return isLocked ? "Blocked" : "Active";
  };

  const getWorkloadColor = (workload) => {
    if (workload >= 90) return "bg-red-100 text-red-800";
    if (workload >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getPerformanceColor = (performance) => {
    if (performance >= 90) return "bg-green-100 text-green-800";
    if (performance >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // Table columns definition
  const columns = [
    {
      accessorKey: "email",
      header: "User",
      cell: ({ row }) => {
        const user = row.original;
        const displayName = user.fullName || user.email;
        const initials = displayName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-700">
                {initials}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900">{displayName}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "roleId",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.roleId.name}</Badge>
      ),
    },
    {
      accessorKey: "isLocked",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={getStatusColor(row.getValue("isLocked"))}>
          {getStatusLabel(row.getValue("isLocked"))}
        </Badge>
      ),
    },
    {
      accessorKey: "workload",
      header: "Workload",
      cell: ({ row }) => (
        <Badge className={getWorkloadColor(row.getValue("workload"))}>
          {row.getValue("workload")}%
        </Badge>
      ),
    },
    {
      accessorKey: "performance",
      header: "Performance",
      cell: ({ row }) => (
        <Badge className={getPerformanceColor(row.getValue("performance"))}>
          {row.getValue("performance")}%
        </Badge>
      ),
    },
    {
      accessorKey: "lastLogin",
      header: "Last Login",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span>{row.getValue("lastLogin")}</span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/user-management/${row.original._id}`)}
            className="flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleBlockUnblock(row.original._id, row.original.isLocked)
              }
              className={
                row.original.isLocked
                  ? "text-green-600 hover:text-green-900"
                  : "text-red-600 hover:text-red-900"
              }
            >
              {row.original.isLocked ? (
                <Shield className="h-4 w-4" />
              ) : (
                <ShieldOff className="h-4 w-4" />
              )}
            </Button>
          )}
        </div> 
      ),
    },
  ];


  return (
    <div className="space-y-6 relative">
      {/* Header with Add User Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600">
            Manage team members, track workload, and monitor performance
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            loadRoles();
            setShowInviteModal(true);
          }}
          disabled={loading}
          className="bg-[#075b7d] hover:bg-[#075b7d] text-white w-fit mt-2 md:mt-0 border-none"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserSearch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamOverview?.totalUsers || users.length}
            </div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamOverview?.activeUsers ||
                users.filter((u) => !u.isLocked).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Invites
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamOverview?.pendingInvites || 0}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Users</CardTitle>
            <ShieldOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamOverview?.blockedUsers ||
                users.filter((u) => u.isLocked).length}
            </div>
            <p className="text-xs text-muted-foreground">Access restricted</p>
          </CardContent>
        </Card>
      </div>

      {/* User Data Table */}
      <Card>
        <CardContent>
          {users.length > 0 ? (
            <DataTable
              data={users}
              columns={columns}
              searchPlaceholder="Search users, email, or role..."
              searchColumn="email"
              filters={[
                {
                  column: "isLocked",
                  title: "Status",
                  options: [
                    { label: "Active", value: "false" },
                    { label: "Blocked", value: "true" },
                  ],
                },
                {
                  column: "roleId",
                  title: "Role",
                  options: roles.map((role) => ({
                    label: role.name,
                    value: role.name,
                  })),
                },
              ]}
            />
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Team Members Found
              </h3>
              <p className="text-gray-500 mb-4">
                Get started by inviting your first team member.
              </p>
              <Button
                onClick={() => {
                  loadRoles();
                  setShowInviteModal(true);
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Team Member
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteUser}
          roles={roles}
        />
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <Loader />
            <h3 className="text-lg font-medium text-gray-900 mb-2 mt-4">
              Loading Team Members
            </h3>
            <p className="text-gray-500">
              Please wait while we fetch the latest data...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
