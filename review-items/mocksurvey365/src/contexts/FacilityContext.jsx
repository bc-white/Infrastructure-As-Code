import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { facilityAPI } from '../service/api';
import { useAuth } from './AuthContext';

const FacilityContext = createContext();

export const useFacility = () => {
  const context = useContext(FacilityContext);
  if (!context) {
    throw new Error('useFacility must be used within a FacilityProvider');
  }
  return context;
};

export const FacilityProvider = ({ children }) => {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [facilityUsers, setFacilityUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock facility data for development/fallback
  const mockFacilities = [
    {
      id: 1,
      name: 'Sunset Manor Nursing Home',
      type: 'Skilled Nursing Facility (SNF)',
      location: 'Springfield, IL',
      beds: 120,
      occupancy: 95,
      lastSurvey: '2024-01-15',
      nextSurvey: '2024-07-15',
      status: 'compliant',
      riskScore: 85,
      recentFindings: 3,
      criticalFindings: 0,
      surveyCount: 12,
      avgSurveyScore: 4.2,
      contact: 'Sarah Johnson',
      phone: '(555) 123-4567',
      contractStart: '2023-01-01',
      monthlyFee: 2500,
      tags: ['Standard Care', 'Memory Care'],
      trend: 'up',
      address: {
        street: '123 Sunset Blvd',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701'
      },
      size: {
        squareFootage: '45000',
        floors: 3
      },
      notes: 'Primary client facility with excellent compliance record'
    },
    {
      id: 2,
      name: 'Green Valley Medical Center',
      type: 'Nursing Home',
      location: 'Chicago, IL',
      beds: 180,
      occupancy: 88,
      lastSurvey: '2024-01-10',
      nextSurvey: '2024-06-10',
      status: 'attention-needed',
      riskScore: 72,
      recentFindings: 8,
      criticalFindings: 2,
      surveyCount: 18,
      avgSurveyScore: 3.8,
      contact: 'Michael Davis',
      phone: '(555) 987-6543',
      contractStart: '2022-06-15',
      monthlyFee: 3200,
      tags: ['Rehabilitation', 'Long-term Care'],
      trend: 'down',
      address: {
        street: '456 Green Valley Dr',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601'
      },
      size: {
        squareFootage: '65000',
        floors: 4
      },
      notes: 'Large facility requiring attention to compliance issues'
    }
  ];

  // Mock facility users for development/fallback
  const mockFacilityUsers = {
    1: [
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
      }
    ],
    2: [
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
      }
    ]
  };

  // Fetch user facilities from API
  const fetchUserFacilities = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from API first
      const response = await facilityAPI.getUserFacilities();
      
      if (response.statusCode === 200 && response.data) {

        setFacilities(response.data); // this is a mock data for development
        // If API returns facility users, use them; otherwise use mock
        if (response.facilityUsers) {
          setFacilityUsers(response.facilityUsers);
        } else {
          
          setFacilityUsers(mockFacilityUsers);
        }
      } else {
        // API responded but no data - user has no facilities
    
        setFacilities([mockFacilities]);
        setFacilityUsers({});
      }
    } catch (error) {
      
      // API failed - don't set mock facilities, let user see "Add Facility" flow
      setFacilities([mockFacilities]);
      setFacilityUsers({});
      setError('Using development data - API not available');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initialize facilities on mount and user change
  useEffect(() => {
    if (user) {
      fetchUserFacilities();
    }
  }, [user, fetchUserFacilities]);

  // Facility operations with API integration
  const addFacility = useCallback(async (facilityData) => {
    try {
      setLoading(true);
      
      // Try to add via API first
      const response = await facilityAPI.addFacility(facilityData);
      
      if (response.statusCode === 201 && response.data) {
        const newFacility = {
          ...response.data,
          id: response.data._id || response.data.id,
          status: 'compliant',
          riskScore: 85,
          recentFindings: 0,
          criticalFindings: 0,
          surveyCount: 0,
          avgSurveyScore: 0,
          trend: 'up',
          occupancy: 0
        };
        
        setFacilities(prev => [...prev, newFacility]);
        toast.success('Facility added successfully!');
        return newFacility;
      } else {
        throw new Error(response.message || 'Failed to add facility');
      }
    } catch (error) {
      
      
      // Fallback to local state update for development
      const newFacility = {
        ...facilityData,
        id: Date.now(),
        status: 'compliant',
        riskScore: 85,
        recentFindings: 0,
        criticalFindings: 0,
        surveyCount: 0,
        avgSurveyScore: 0,
        trend: 'up',
        occupancy: 0
      };
      
      setFacilities(prev => [...prev, newFacility]);
      toast.success('Facility added successfully! (Development Mode)');
      return newFacility;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFacility = useCallback(async (id, updates) => {
    try {
      setLoading(true);
      
      // Try to update via API first
      const response = await facilityAPI.updateFacility(id, updates);
      
      if (response.statusCode === 200) {
        setFacilities(prev => 
          prev.map(facility => 
            facility.id === id ? { ...facility, ...updates } : facility
          )
        );
        toast.success('Facility updated successfully!');
      } else {
        throw new Error(response.message || 'Failed to update facility');
      }
    } catch (error) {
     
      
      // Fallback to local state update for development
      setFacilities(prev => 
        prev.map(facility => 
          facility.id === id ? { ...facility, ...updates } : facility
        )
      );
      toast.success('Facility updated successfully! (Development Mode)');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFacility = useCallback(async (id) => {
    try {
      setLoading(true);
      
      // Try to delete via API first
      const response = await facilityAPI.deleteFacility(id);
      
      if (response.statusCode === 200) {
        setFacilities(prev => prev.filter(facility => facility.id !== id));
        setFacilityUsers(prev => {
          const newUsers = { ...prev };
          delete newUsers[id];
          return newUsers;
        });
        toast.success('Facility deleted successfully!');
      } else {
        throw new Error(response.message || 'Failed to delete facility');
      }
    } catch (error) {
   
      
      // Fallback to local state update for development
      setFacilities(prev => prev.filter(facility => facility.id !== id));
      setFacilityUsers(prev => {
        const newUsers = { ...prev };
        delete newUsers[id];
        return newUsers;
      });
      toast.success('Facility deleted successfully! (Development Mode)');
    } finally {
      setLoading(false);
    }
  }, []);

  const getFacility = useCallback((id) => {
    return facilities.find(facility => facility.id === parseInt(id));
  }, [facilities]);

  // User operations with API integration
  const addUserToFacility = useCallback(async (facilityId, userData) => {
    try {
      setLoading(true);
      
      // Try to add via API first
      const response = await facilityAPI.addUserToFacility(facilityId, userData);
      
      if (response.statusCode === 201 && response.data) {
        const newUser = {
          ...response.data,
          id: response.data._id || response.data.id,
          status: 'active',
          lastActive: new Date().toISOString()
        };
        
        setFacilityUsers(prev => ({
          ...prev,
          [facilityId]: [...(prev[facilityId] || []), newUser]
        }));
        
        toast.success(`User ${newUser.name} added to facility successfully!`);
        return newUser;
      } else {
        throw new Error(response.message || 'Failed to add user to facility');
      }
    } catch (error) {
     
      
      // Fallback to local state update for development
      const newUser = {
        ...userData,
        id: Date.now(),
        status: 'active',
        lastActive: new Date().toISOString()
      };
      
      setFacilityUsers(prev => ({
        ...prev,
        [facilityId]: [...(prev[facilityId] || []), newUser]
      }));
      
      toast.success(`User ${newUser.name} added to facility successfully! (Development Mode)`);
      return newUser;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserInFacility = useCallback(async (facilityId, userId, updates) => {
    try {
      setLoading(true);
      
      // Try to update via API first
      const response = await facilityAPI.updateUserInFacility(facilityId, userId, updates);
      
      if (response.statusCode === 200) {
        setFacilityUsers(prev => ({
          ...prev,
          [facilityId]: (prev[facilityId] || []).map(user =>
            user.id === userId ? { ...user, ...updates } : user
          )
        }));
        
        toast.success('User updated successfully!');
      } else {
        throw new Error(response.message || 'Failed to update user');
      }
    } catch (error) {
    
      
      // Fallback to local state update for development
      setFacilityUsers(prev => ({
        ...prev,
        [facilityId]: (prev[facilityId] || []).map(user =>
          user.id === userId ? { ...user, ...updates } : user
        )
      }));
      
      toast.success('User updated successfully! (Development Mode)');
    } finally {
      setLoading(false);
    }
  }, []);

  const removeUserFromFacility = useCallback(async (facilityId, userId) => {
    try {
      setLoading(true);
      
      // Try to remove via API first
      const response = await facilityAPI.removeUserFromFacility(facilityId, userId);
      
      if (response.statusCode === 200) {
        setFacilityUsers(prev => ({
          ...prev,
          [facilityId]: (prev[facilityId] || []).filter(user => user.id !== userId)
        }));
        
        toast.success('User removed from facility successfully!');
      } else {
        throw new Error(response.message || 'Failed to remove user from facility');
      }
    } catch (error) {
    
      
      // Fallback to local state update for development
      setFacilityUsers(prev => ({
        ...prev,
        [facilityId]: (prev[facilityId] || []).filter(user => user.id !== userId)
      }));
      
      toast.success('User removed from facility successfully! (Development Mode)');
    } finally {
      setLoading(false);
    }
  }, []);

  const getFacilityUsers = useCallback((facilityId) => {
    return facilityUsers[facilityId] || [];
  }, [facilityUsers]);

  // Get user's accessible facilities
  const getUserFacilities = useCallback(() => {
    if (!user) return [];
    
    // In a real app, this would filter based on user permissions
    const isConsultant = user.roleId?.name === 'Consultant';
    
    // If user is not a consultant, they can't have facilities
    if (!isConsultant) return [];
    
    // If there's an error (API failed), we're using mock data
    // In this case, treat as if user has no facilities
    if (error) {
      return [];
    }
    
    // If no facilities exist, return empty array
    if (!facilities || facilities.length === 0) {
      return [];
    }
    
 
    return facilities;
  }, [user, facilities, error]);

  // Check if user has access to any facilities
  const userHasFacilities = useCallback(() => {
    const userFacs = getUserFacilities();
  
    const hasFacs = userFacs && userFacs.length > 0;
    return hasFacs;
  }, [getUserFacilities]);

  // Analytics and reporting
  const getFacilityStats = useCallback(() => {
    const userFacs = getUserFacilities();
    
    // Handle case where userFacs might be undefined or null
    if (!userFacs || userFacs.length === 0) {
      return {
        totalFacilities: 0,
        excellentCount: 0,
        compliantCount: 0,
        attentionCount: 0,
        watchListCount: 0,
        avgRiskScore: 0,
        totalSurveys: 0,
        totalCriticalIssues: 0
      };
    }
    
    const totalFacilities = userFacs.length;
    const excellentCount = userFacs.filter(f => f.status === 'excellent').length;
    const compliantCount = userFacs.filter(f => f.status === 'compliant').length;
    const attentionCount = userFacs.filter(f => f.status === 'attention-needed').length;
    const watchListCount = userFacs.filter(f => f.status === 'watch-list').length;
    
    const avgRiskScore = userFacs.reduce((sum, f) => sum + f.riskScore, 0) / totalFacilities;
    const totalSurveys = userFacs.reduce((sum, f) => sum + f.surveyCount, 0);
    const totalCriticalIssues = userFacs.reduce((sum, f) => sum + f.criticalFindings, 0);
    
    return {
      totalFacilities,
      excellentCount,
      compliantCount,
      attentionCount,
      watchListCount,
      avgRiskScore: Math.round(avgRiskScore),
      totalSurveys,
      totalCriticalIssues
    };
  }, [getUserFacilities]);

  const getFacilitiesByStatus = useCallback((status) => {
    const userFacs = getUserFacilities();
    if (!userFacs || userFacs.length === 0) return [];
    return userFacs.filter(facility => facility.status === status);
  }, [getUserFacilities]);

  const searchFacilities = useCallback((searchTerm, filters = {}) => {
    const userFacs = getUserFacilities();
    if (!userFacs || userFacs.length === 0) return [];
    
    return userFacs.filter(facility => {
      const matchesSearch = 
        facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facility.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facility.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !filters.status || facility.status === filters.status;
      const matchesType = !filters.type || facility.type === filters.type;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [getUserFacilities]);

  const value = {
    // State
    facilities,
    facilityUsers,
    loading,
    error,
    
    // User-specific facility access
    getUserFacilities,
    userHasFacilities,
    
    // Facility operations
    addFacility,
    updateFacility,
    deleteFacility,
    getFacility,
    
    // User operations
    addUserToFacility,
    updateUserInFacility,
    removeUserFromFacility,
    getFacilityUsers,
    
    // Analytics
    getFacilityStats,
    getFacilitiesByStatus,
    searchFacilities,
    
    // Refresh data
    refreshFacilities: fetchUserFacilities
  };

  return (
    <FacilityContext.Provider value={value}>
      {children}
    </FacilityContext.Provider>
  );
}; 