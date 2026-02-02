import React from 'react';
import { XCircle, Shield, ShieldOff, Mail, Calendar, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogBody, 
  DialogFooter, 
  DialogClose 
} from '../ui/dialog';

const UserDetailsModal = ({ user, onClose, onBlockUnblock }) => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  
  // Handle missing fullName field
  const displayName = user?.fullName || user?.email || 'Unknown User';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const getWorkloadColor = (workload) => {
    if (workload >= 90) return 'text-red-600 bg-red-100';
    if (workload >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getPerformanceColor = (performance) => {
    if (performance >= 90) return 'text-green-600 bg-green-100';
    if (performance >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium text-gray-700">
                {initials}
              </span>
            </div>
            <div>
              <div className="text-xl font-semibold text-gray-900">{displayName}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </DialogTitle>
          <DialogDescription>
            View detailed information about this team member
          </DialogDescription>
        </DialogHeader>
        
        <DialogBody>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Basic Information
              </h4>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Full Name:</span>
                  <p className="font-medium text-gray-900">{displayName}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Email:</span>
                  <p className="font-medium text-gray-900">{user.email}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Role:</span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 ml-2">
                    {user.roleId?.name || 'Unknown Role'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                    user.isLocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {user.isLocked ? 'Blocked' : 'Active'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Member Since:</span>
                  <p className="font-medium text-gray-900">{user.createdAt}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Last Login:</span>
                  <p className="font-medium text-gray-900">{user.lastLogin}</p>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Performance Metrics
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-500">Workload</span>
                    <span className={`text-sm font-semibold ${getWorkloadColor(user.workload)} px-2 py-1 rounded-full`}>
                      {user.workload}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        user.workload >= 90 ? 'bg-red-500' : 
                        user.workload >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${user.workload}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-500">Performance</span>
                    <span className={`text-sm font-semibold ${getPerformanceColor(user.performance)} px-2 py-1 rounded-full`}>
                      {user.performance}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        user.performance >= 90 ? 'bg-green-500' : 
                        user.performance >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${user.performance}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity & Statistics */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Activity Statistics
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{user.surveysCompleted}</div>
                  <div className="text-sm text-gray-500">Surveys Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{user.avgResponseTime}</div>
                  <div className="text-sm text-gray-500">Avg Response Time</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Recent Activity
              </h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Completed survey</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Updated profile</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Started new survey</p>
                    <p className="text-xs text-gray-500">3 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </DialogBody>
        
        <DialogFooter>
          {isAdmin && (
            <Button
              onClick={() => onBlockUnblock(user._id, user.isLocked)}
              variant={user.isLocked ? "default" : "destructive"}
              className="flex items-center"
            >
              {user.isLocked ? (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Unblock User
                </>
              ) : (
                <>
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Block User
                </>
              )}
            </Button>
          )}
          <DialogClose asChild>
            <Button variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;
