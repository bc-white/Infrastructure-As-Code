import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { DataTable } from '../data-table';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Eye, 
  Edit, 
  Trash2, 
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle
} from 'lucide-react';

const UserManagement = ({ facility, onUserAdd, onUserUpdate, onUserRemove }) => {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    accessLevel: 'viewer',
    startDate: '',
    notes: ''
  });

  const roles = [
    { value: 'consultant', label: 'Consultant', description: 'Full access to all features and data' },
    { value: 'admin', label: 'Administrator', description: 'Manage facility data and users' },
    { value: 'viewer', label: 'Viewer', description: 'View-only access to facility data' },
    { value: 'surveyor', label: 'Surveyor', description: 'Create and manage surveys' },
    { value: 'reporter', label: 'Reporter', description: 'Generate and export reports' }
  ];

  const accessLevels = [
    { value: 'full', label: 'Full Access', description: 'All features and data' },
    { value: 'limited', label: 'Limited Access', description: 'Selected features only' },
    { value: 'viewer', label: 'View Only', description: 'Read-only access' }
  ];

  // Mock user data - in real app, this would come from props or API
  const facilityUsers = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@facility.com',
      phone: '(555) 123-4567',
      role: 'consultant',
      accessLevel: 'full',
      startDate: '2023-01-01',
      status: 'active',
      lastActive: '2024-01-20',
      permissions: ['surveys', 'reports', 'users', 'settings'],
      notes: 'Primary consultant for this facility'
    },
    {
      id: 2,
      name: 'Michael Davis',
      email: 'michael.davis@facility.com',
      phone: '(555) 987-6543',
      role: 'admin',
      accessLevel: 'limited',
      startDate: '2023-06-15',
      status: 'active',
      lastActive: '2024-01-19',
      permissions: ['surveys', 'reports', 'users'],
      notes: 'Facility administrator'
    },
    {
      id: 3,
      name: 'Jennifer Lee',
      email: 'jennifer.lee@facility.com',
      phone: '(555) 456-7890',
      role: 'viewer',
      accessLevel: 'viewer',
      startDate: '2023-09-01',
      status: 'active',
      lastActive: '2024-01-18',
      permissions: ['surveys', 'reports'],
      notes: 'Quality assurance team member'
    }
  ];

  const handleAddUser = () => {
    if (newUser.name && newUser.email && newUser.role) {
      const userToAdd = {
        ...newUser,
        id: Date.now(),
        status: 'active',
        lastActive: new Date().toISOString(),
        permissions: getPermissionsForRole(newUser.role)
      };
      
      onUserAdd(userToAdd);
      setNewUser({
        name: '',
        email: '',
        phone: '',
        role: '',
        accessLevel: 'viewer',
        startDate: '',
        notes: ''
      });
      setShowAddUserModal(false);
    }
  };

  const handleUpdateUser = () => {
    if (editingUser && editingUser.name && editingUser.email && editingUser.role) {
      onUserUpdate(editingUser);
      setEditingUser(null);
    }
  };

  const handleRemoveUser = (userId) => {
    if (window.confirm('Are you sure you want to remove this user from the facility?')) {
      onUserRemove(userId);
    }
  };

  const getPermissionsForRole = (role) => {
    const rolePermissions = {
      consultant: ['surveys', 'reports', 'users', 'settings', 'analytics'],
      admin: ['surveys', 'reports', 'users'],
      viewer: ['surveys', 'reports'],
      surveyor: ['surveys', 'reports'],
      reporter: ['reports']
    };
    return rolePermissions[role] || [];
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      consultant: { color: 'bg-purple-100 text-purple-700 border border-purple-200', label: 'Consultant' },
      admin: { color: 'bg-blue-100 text-blue-700 border border-blue-200', label: 'Administrator' },
      viewer: { color: 'bg-gray-100 text-gray-700 border border-gray-200', label: 'Viewer' },
      surveyor: { color: 'bg-green-100 text-green-700 border border-green-200', label: 'Surveyor' },
      reporter: { color: 'bg-orange-100 text-orange-700 border border-orange-200', label: 'Reporter' }
    };
    
    const config = roleConfig[role] || roleConfig.viewer;
    return (
      <Badge className={`${config.color} font-medium text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const getAccessLevelBadge = (level) => {
    const levelConfig = {
      full: { color: 'bg-green-100 text-green-700 border border-green-200', label: 'Full Access' },
      limited: { color: 'bg-yellow-100 text-yellow-700 border border-yellow-200', label: 'Limited Access' },
      viewer: { color: 'bg-gray-100 text-gray-700 border border-gray-200', label: 'View Only' }
    };
    
    const config = levelConfig[level] || levelConfig.viewer;
    return (
      <Badge className={`${config.color} font-medium text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-700 border border-green-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-700 border border-red-200">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  // Table columns for users
  const columns = [
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.original.name}</div>
            <div className="text-sm text-gray-500">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => getRoleBadge(row.getValue("role")),
    },
    {
      accessorKey: "accessLevel",
      header: "Access Level",
      cell: ({ row }) => getAccessLevelBadge(row.getValue("accessLevel")),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "lastActive",
      header: "Last Active",
      cell: ({ row }) => (
        <div className="text-sm text-gray-500">
          {new Date(row.getValue("lastActive")).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingUser(row.original)}
            className="hover:bg-gray-100"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRemoveUser(row.original.id)}
            className="hover:bg-red-50 text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage user access and permissions for {facility?.name}</p>
        </div>
        <Button onClick={() => setShowAddUserModal(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Facility Users ({facilityUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={facilityUsers} />
        </CardContent>
      </Card>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New User</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-xs text-gray-500">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="accessLevel">Access Level</Label>
                <Select value={newUser.accessLevel} onValueChange={(value) => setNewUser(prev => ({ ...prev, accessLevel: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select access level" />
                  </SelectTrigger>
                  <SelectContent>
                    {accessLevels.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        <div>
                          <div className="font-medium">{level.label}</div>
                          <div className="text-xs text-gray-500">{level.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newUser.startDate}
                  onChange={(e) => setNewUser(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={newUser.notes}
                  onChange={(e) => setNewUser(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this user"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowAddUserModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser}>
                Add User
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit User</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="editName">Full Name *</Label>
                <Input
                  id="editName"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <Label htmlFor="editEmail">Email *</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <Label htmlFor="editPhone">Phone</Label>
                <Input
                  id="editPhone"
                  value={editingUser.phone}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <Label htmlFor="editRole">Role *</Label>
                <Select value={editingUser.role} onValueChange={(value) => setEditingUser(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-xs text-gray-500">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="editAccessLevel">Access Level</Label>
                <Select value={editingUser.accessLevel} onValueChange={(value) => setEditingUser(prev => ({ ...prev, accessLevel: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select access level" />
                  </SelectTrigger>
                  <SelectContent>
                    {accessLevels.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        <div>
                          <div className="font-medium">{level.label}</div>
                          <div className="text-xs text-gray-500">{level.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="editNotes">Notes</Label>
                <Input
                  id="editNotes"
                  value={editingUser.notes}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this user"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUser}>
                Update User
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 