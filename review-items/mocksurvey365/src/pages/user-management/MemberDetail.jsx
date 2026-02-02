import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogBody } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { DataTable } from '../../components/data-table';
import { userManagementAPI } from '../../service/api';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import Loader from '../../components/loader';
import { AlertTriangle, UserX, UserCheck } from 'lucide-react';

const MemberDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [workloadData, setWorkloadData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [allMembers, setAllMembers] = useState([]);
  const [assignedSurveys, setAssignedSurveys] = useState([]);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [showEnableConfirm, setShowEnableConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      loadMemberData();
    }
  }, [id]);

  const loadMemberData = async () => {
    setLoading(true);
    let memberLoaded = false;
    
    try {
      // Load member data first (most important)
      try {
        const memberResponse = await userManagementAPI.getUserById(id);
        setMember(memberResponse.data?.user);
        memberLoaded = true;
      } catch (error) {
        toast.error("Failed to load member data");
        return; // Don't continue if we can't load the member
      }

    } catch (error) {
      if (!memberLoaded) {
        toast.error("Failed to load member data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUnblock = async () => {
    setActionLoading(true);
    try {
      await userManagementAPI.blockUnblockUser(member?._id, !member?.isLocked);
      setMember(prev => ({ ...prev, isLocked: !prev.isLocked }));
      toast.success(`User ${!member.isLocked ? "blocked" : "unblocked"} successfully`);
    } catch (error) {
      toast.error("Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisableUser = async () => {
    setActionLoading(true);
    try {
      await userManagementAPI.disableUser(member?._id);
      setMember(prev => ({ ...prev, isDisabled: true, isLocked: true }));
      toast.success("User disabled successfully");
      setShowDisableConfirm(false);
    } catch (error) {
      toast.error("Failed to disable user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnableUser = async () => {
    setActionLoading(true);
    try {
      await userManagementAPI.enableUser(member?._id);
      setMember(prev => ({ ...prev, isDisabled: false, isLocked: false }));
      toast.success("User enabled successfully");
      setShowEnableConfirm(false);
    } catch (error) {
      toast.error("Failed to enable user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditMember = async (formData) => {
    setActionLoading(true);
    try {
      // Update member data
      setMember(prev => ({
        ...prev,
        fullName: formData.fullName,
        email: formData.email,
        specialty: formData.specialty,
        // Add other fields as needed
      }));
      setIsEditModalOpen(false);
      toast.success("Member updated successfully");
    } catch (error) {
      toast.error("Failed to update member");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (isLocked, isDisabled) => {
    if (isDisabled) return 'bg-gray-100 text-gray-800';
    if (isLocked) return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusLabel = (isLocked, isDisabled) => {
    if (isDisabled) return 'Disabled';
    if (isLocked) return 'Blocked';
    return 'Active';
  };

  const getWorkloadColor = (workload) => {
    if (workload >= 90) return 'bg-red-100 text-red-800';
    if (workload >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getPerformanceColor = (performance) => {
    if (performance >= 90) return 'bg-green-100 text-green-800';
    if (performance >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Activity data state
  const [activityData, setActivityData] = useState([]);

  // Surveys Table Columns
  const surveysColumns = [
    {
      accessorKey: "surveyName",
      header: "Survey Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("surveyName")}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status");
        const statusColors = {
          'completed': 'bg-green-100 text-green-800',
          'in-progress': 'bg-yellow-100 text-yellow-800',
          'pending': 'bg-gray-100 text-gray-800',
          'not-started': 'bg-red-100 text-red-800',
          'exit-conference': 'bg-blue-100 text-blue-800',
          'life-safety-survey': 'bg-purple-100 text-purple-800'
        };
        return (
          <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "assignedDate",
      header: "Assigned Date",
      cell: ({ row }) => (
        <span>{new Date(row.getValue("assignedDate")).toLocaleDateString()}</span>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => {
        const dueDate = row.getValue("dueDate");
        return dueDate ? (
          <span>{new Date(dueDate).toLocaleDateString()}</span>
        ) : (
          <span className="text-gray-500">No due date</span>
        );
      },
    },
    {
      accessorKey: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const progress = row.getValue("progress") || 0;
        return (
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-gray-600" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600">{progress}%</span>
          </div>
        );
      },
    },
    {
      accessorKey: "facilityName",
      header: "Facility",
      cell: ({ row }) => (
        <span>{row.getValue("facilityName") || 'N/A'}</span>
      ),
    },
  ];

  // Activity Table Columns
  const activityColumns = [
    {
      accessorKey: "timestamp",
      header: "Timestamp",
      cell: ({ row }) => (
        <span>{new Date(row.getValue("timestamp")).toLocaleString()}</span>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("action")}</Badge>
      ),
    },
    {
      accessorKey: "details",
      header: "Details",
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          {row.getValue("details")}
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type");
        const colors = {
          success: "bg-green-100 text-green-800",
          info: "bg-blue-100 text-blue-800", 
          warning: "bg-yellow-100 text-yellow-800"
        };
        return (
          <Badge className={colors[type] || "bg-gray-100 text-gray-800"}>
            {type}
          </Badge>
        );
      },
    },
  ];



  if (!member && !loading) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Member Not Found</h1>
        <p className="text-gray-600">The member you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/user-management')} className="mt-4">
          Back to Team Members
        </Button>
      </div>
    );
  }

  const displayName = member?.fullName || member?.email || 'Unknown User';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
         
          <div className="h-12 w-12 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-lg font-medium text-gray-700">
              {initials}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-gray-600">{member?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Temporarily show all buttons for testing */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleBlockUnblock}
              variant={!member?.isLocked ? "default" : "destructive"}
              disabled={loading || actionLoading}
              className={`${!member?.isLocked ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} text-white`}
            >
              {actionLoading ? "Loading..." : (!member?.isLocked ? "Disable User" : "Enable User")}
            </Button>
          </div>
          
         
        </div>
      </div>

      {/* Member Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(member?.isLocked, member?.isDisabled)}>
              {getStatusLabel(member?.isLocked, member?.isDisabled)}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              Since {new Date(member?.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{member?.roleId?.name || 'Unknown Role'}</div>
            <p className="text-xs text-muted-foreground">
              Team member
            </p>
          </CardContent>
        </Card>
        
      
      </div>

      {/* Member Details Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
         
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Member Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-sm">{displayName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm">{member?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Role</label>
                    <p className="text-sm">{member?.roleId?.name || 'Unknown Role'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Fields of Expertise</label>
                    <p className="text-sm">{member?.specialty || 'General'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <Badge className={getStatusColor(member?.isLocked, member?.isDisabled)}>
                      {getStatusLabel(member?.isLocked, member?.isDisabled)}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Member Since</label>
                    <p className="text-sm">{new Date(member?.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="text-sm">{new Date(member?.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

         
          </div>
        </TabsContent>

   
      </Tabs>

      {/* Edit Member Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}> 
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update member information for {displayName}.
            </DialogDescription>
          </DialogHeader>
          
          <DialogBody>
            <EditMemberForm onSubmit={handleEditMember} initialData={member} loading={actionLoading} />
          </DialogBody>
        </DialogContent>
      </Dialog>

   

      {/* Enable User Confirmation Dialog */}
      <Dialog open={showEnableConfirm} onOpenChange={setShowEnableConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              Enable User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to enable this user? This will restore their access to the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEnableConfirm(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleEnableUser}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? "Enabling..." : "Enable User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <Loader />
            <h3 className="text-lg font-medium text-gray-900 mb-2 mt-4">
              Loading Member Details
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

// Edit Member Form Component
const EditMemberForm = ({ onSubmit, initialData, loading }) => {
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || initialData?.email || "",
    email: initialData?.email || "",
    specialty: initialData?.specialty || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled
          className="bg-gray-100 text-gray-500"
        />
        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
      </div>
      
      <div>
        <Label htmlFor="specialty">Fields of Expertise</Label>
        <Input
          id="specialty"
          type="text"
          value={formData.specialty}
          onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
          placeholder="e.g., Life Safety, Quality Assurance, Compliance"
        />
        <p className="text-xs text-gray-500 mt-1">Areas this member is good at</p>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Member"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default MemberDetail;
