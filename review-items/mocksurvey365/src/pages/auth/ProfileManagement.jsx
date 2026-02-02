import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useAuth, USER_ROLES } from '../../contexts/AuthContext';
import { User, Bell, Shield, Loader2, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { getPlan } from '../../../util/plan.js';
import { profileAPI } from '../../service/api';
import { toast } from 'sonner';

// Constants
const NOTIFICATION_SETTINGS = [
  {
    key: 'surveyResponsesNotification',
    label: 'Survey Responses',
    description: 'Get notified when someone responds to your surveys'
  },
  {
    key: 'weeklyReportNotification',
    label: 'Weekly Reports',
    description: 'Receive weekly summary reports'
  },
  { 
    key: 'emailNotification',
    label: 'Email Notifications',
    description: 'Receive general email notifications'
  }
];

const ROLE_DISPLAY_NAMES = {
  [USER_ROLES.ADMIN]: 'Administrator',
  [USER_ROLES.CONSULTANT]: 'Consultant',
  [USER_ROLES.CLINICAL_TEAM]: 'Clinical Team Member',
  [USER_ROLES.DEMO]: 'Demo User'
}; 

const PLAN_BADGE_STYLES = {
  demo: 'bg-gray-100 text-gray-800',
  monthly: 'bg-green-100 text-green-800',
  annual: 'bg-purple-100 text-purple-800',
  consultant: 'bg-orange-100 text-orange-800',
  default: 'bg-blue-100 text-blue-800'
};

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
];

// Helper Components
const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
};

const FormField = ({ label, id, error, children, required = false }) => (
  <div className="space-y-2">
    <Label htmlFor={id}>
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </Label>
    {children}
    {error && <p className="text-sm text-red-600">{error}</p>}
  </div>
);

const UserAvatar = ({ firstName, lastName, picture, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 md:w-16 md:h-16 text-lg md:text-xl',
    lg: 'w-20 h-20 text-2xl'
  };
  
  const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  
  if (picture) {
    return (
      <div className={`rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <img 
          src={picture} 
          alt={`${firstName || ''} ${lastName || ''}`}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  
  return (
    <div className={`bg-[#075b7d] rounded-full flex items-center justify-center ${sizeClasses[size]}`}>
      <span className="text-white font-bold">{initials || '?'}</span>
    </div>
  );
};

const StatusBadge = ({ children, variant = 'default' }) => {
  const variants = {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    default: 'bg-blue-100 text-blue-800'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

const ProfileManagement = () => {
  const { user, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    organization: ''
  });
  
  const [preferences, setPreferences] = useState({
    emailNotification: true,
    surveyResponsesNotification: true,
    weeklyReportNotification: true
  });
  
  // UI state - initialize from URL param if present
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return ['profile', 'security', 'preferences'].includes(tabParam) ? tabParam : 'profile';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [errors, setErrors] = useState({});
  
  // Refs
  const preferencesLoadedRef = useRef(false);

  // Memoized values
  const currentPlan = useMemo(() => {
    try {
      return getPlan(user?.subscription?.planId || 'demo');
    } catch {
      return getPlan('demo');
    }
  }, [user?.subscription?.planId]);

  const getRoleDisplayName = useCallback((role) => {
    if (!role) return 'User';
    const roleName = typeof role === 'string' ? role : role.name;
    return ROLE_DISPLAY_NAMES[roleName] || roleName || 'User';
  }, []);

  const getPlanBadgeStyle = useCallback((planId) => {
    return PLAN_BADGE_STYLES[planId] || PLAN_BADGE_STYLES.default;
  }, []);

  // Initialize form data with user info
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        organization: user.organization || ''
      }));
      
      setPreferences({
        emailNotification: user.emailNotification ?? true,
        surveyResponsesNotification: user.surveyResponsesNotification ?? true,
        weeklyReportNotification: user.weeklyReportNotification ?? true
      });
    }
  }, [user]);

  // Load user preferences
  useEffect(() => {
    let isMounted = true;
    
    const loadPreferences = async () => {
      if (preferencesLoadedRef.current || preferencesLoading) return;
      
      preferencesLoadedRef.current = true;
      
      try {
        setPreferencesLoading(true);
        const response = await profileAPI.getProfile();
        
        if (!isMounted) return;
        
        // Handle both response structures: { statusCode, data: {...} } and direct user object
        const userData = response.data || response;
        
        if (response.statusCode === 200 || userData._id) {
          
          setPreferences({
            emailNotification: userData.emailNotification ?? true,
            surveyResponsesNotification: userData.surveyResponsesNotification ?? true,
            weeklyReportNotification: userData.weeklyReportNotification ?? true
          });
          
          if (updateUser && JSON.stringify(user) !== JSON.stringify(userData)) {
            updateUser(userData);
          }
        }
      } catch (error) {
        if (isMounted) {
          toast.error('Failed to load preferences');
        }
      } finally {
        if (isMounted) {
          setPreferencesLoading(false);
        }
      }
    };

    if (user && !preferencesLoadedRef.current) {
      loadPreferences();
    }

    return () => { isMounted = false; };
  }, [user, updateUser]);

  // Handlers
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  }, [errors, message.text]);

  const validateProfileForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;
    
    setIsLoading(true);
    
    try {
      const response = await profileAPI.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        organization: formData.organization,
        phoneNumber: formData.phoneNumber
      });
      
      if (response.statusCode === 200) {
        updateUser({
          ...user,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          organization: formData.organization
        });
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        toast.success('Profile updated successfully!');
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update profile' });
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = useCallback((key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, []);

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setPreferencesLoading(true);
    
    try {
      const response = await profileAPI.updatePreferences(preferences);
      
      if (response.statusCode === 200) {
        setMessage({ type: 'success', text: 'Preferences updated successfully!' });
        toast.success('Preferences updated successfully!');
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update preferences' });
        toast.error(response.message || 'Failed to update preferences');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update preferences' });
      toast.error(error.message || 'Failed to update preferences');
    } finally {
      setPreferencesLoading(false);
    }
  };

  const handleTabChange = useCallback((value) => {
    setActiveTab(value);
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  }, [message.text]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Not available';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  // Loading state
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto text-[#075b7d]" />
          <p className="mt-4 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Account details configuration
  const accountDetails = [
    { 
      label: 'Email', 
      value: user.email,
    },
    { 
      label: 'Email Verified', 
      value: user.isEmailVerified ? 'Verified' : 'Not Verified',
      badge: true,
      variant: user.isEmailVerified ? 'success' : 'error'
    },
    { label: 'Organization', value: user.organization },
    { label: 'Phone Number', value: user.phoneNumber },
  ];

  return (
    <div className="mx-auto p-4 md:p-6 space-y-4 md:space-y-6 max-w-4xl">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Profile Management</h1>
        <p className="text-sm md:text-base text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <UserAvatar firstName={user.firstName} lastName={user.lastName} picture={user.picture} />
              <div className="min-w-0">
                <h3 className="text-lg md:text-xl font-semibold truncate">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-sm md:text-base text-gray-600 truncate">{user.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <StatusBadge>{getRoleDisplayName(user.roleId?.name)}</StatusBadge>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanBadgeStyle(currentPlan.id)}`}>
                    {currentPlan.displayName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accountDetails.map((detail, index) => (
              <div key={index} className="space-y-1">
                <Label className="text-sm font-medium text-gray-500">{detail.label}</Label>
                {detail.badge ? (
                  <StatusBadge variant={detail.variant}>{detail.value}</StatusBadge>
                ) : (
                  <p className="text-sm text-gray-900">{detail.value || 'Not specified'}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {message.text && (
        <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-50 border border-gray-200 rounded-lg h-auto">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center justify-center gap-2 py-3 px-2 cursor-pointer data-[state=active]:bg-white data-[state=active]:text-gray-900 rounded-lg text-xs md:text-sm"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="First Name" id="firstName" error={errors.firstName} required>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="h-10"
                    />
                  </FormField>
                  <FormField label="Last Name" id="lastName" error={errors.lastName} required>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="h-10"
                    />
                  </FormField>
                </div>

                <FormField label="Email Address" id="email" error={errors.email}>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="h-10 bg-gray-50"
                  />
                </FormField>

                <FormField label="Phone Number" id="phoneNumber">
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="h-10"
                  />
                </FormField>

                <FormField label="Organization" id="organization">
                  <Input
                    id="organization"
                    name="organization"
                    value={formData.organization}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="h-10"
                  />
                </FormField>

                <Button type="submit" disabled={isLoading} className="bg-[#075b7d] hover:bg-[#064a66]">
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Update Profile'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
           
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Delete Account */}
              <div className="flex items-start space-x-4 p-4 bg-red-50 border border-red-200 rounded-lg">
               
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-900">Delete Account</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <div className="mt-4">
                    <Button 
                      variant="outline"
                      disabled
                      className="border-red-300 text-red-400 cursor-not-allowed opacity-50"
                    >
                     
                      Delete Account
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Account deletion is currently disabled. Contact support for assistance.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent>
              {preferencesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner className="text-[#075b7d]" />
                  <span className="ml-2 text-gray-600">Loading preferences...</span>
                </div>
              ) : (
                <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                  <div className="space-y-4">
                    {NOTIFICATION_SETTINGS.map((setting) => (
                      <div key={setting.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                        <div className="flex-1">
                          <Label className="text-sm font-medium">{setting.label}</Label>
                          <p className="text-sm text-gray-500">{setting.description}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences[setting.key]}
                          onChange={(e) => handlePreferenceChange(setting.key, e.target.checked)}
                          className="h-5 w-5 rounded border-gray-300 text-[#075b7d] focus:ring-[#075b7d]"
                        />
                      </div>
                    ))}
                  </div>

                  <Button type="submit" disabled={preferencesLoading} className="bg-[#075b7d] hover:bg-[#064a66]">
                    {preferencesLoading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Preferences'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
};

export default ProfileManagement;
