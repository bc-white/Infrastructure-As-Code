import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

// Simplified feature gate context - all features available to all users
// Backend will handle actual data restrictions

export const FeatureGateContext = createContext();

export const FeatureGateProvider = ({ children }) => {
  const { user } = useAuth();

  // All features are available - backend handles restrictions
  const hasFeature = (feature) => {
    return true; // All features available
  };

  const canCreateSurvey = () => {
    return true; // All users can create surveys
  };

  const canExportReport = () => {
    return true; // All users can export reports
  };

  const canUseAI = () => {
    return true; // All users can use AI features
  };

  const canUsePOCTools = () => {
    return true; // All users can use POC tools
  };

  const canAccessMultiFacility = () => {
    return true; // All users can access multi-facility features
  };

  const canUseAdvancedAnalytics = () => {
    return true; // All users can use advanced analytics
  };

  const canAccessResources = () => {
    return true; // All users can access resources
  };

  const canAccessFTagLibrary = () => {
    return true; // All users can access F-Tag library
  };

  const canAccessFTagManagement = () => {
    return true; // All users can access F-Tag management
  };

  const canAccessTeamCollaboration = () => {
    return true; // All users can access team collaboration
  };

  const canAccessViewOnlyReports = () => {
    return true; // All users can access view-only reports
  };

  // Usage tracking - simplified, backend handles actual limits
  const getRemainingUsage = () => {
    return {
      surveysRemaining: -1, // unlimited
      exportsRemaining: -1, // unlimited
      facilitiesRemaining: -1, // unlimited
      teamMembersRemaining: -1 // unlimited
    };
  };

  // No upgrade messages needed - all features available
  const getUpgradeMessage = (feature) => {
    return null; // No upgrade needed
  };

  // Usage tracking functions - simplified
  const trackSurveyCreation = () => {
    // Backend handles tracking
    return true;
  };

  const trackReportExport = () => {
    // Backend handles tracking
    return true;
  };

  // No watermarks for any user
  const hasWatermarks = () => {
    return false; // No watermarks
  };

  // Get current plan info for display purposes only
  const getPlanName = () => {
    return user?.subscription?.planId || 'demo';
  };

  // Get plan limits for display purposes only
  const getPlanLimits = () => {
    return {
      surveysPerMonth: -1, // unlimited
      exportsPerMonth: -1, // unlimited
      facilitiesCount: -1, // unlimited
      teamMembers: -1 // unlimited
    };
  };

  const value = useMemo(() => ({
    // Feature checks - all return true
    hasFeature,
    canCreateSurvey,
    canExportReport,
    canUseAI,
    canUsePOCTools,
    canAccessMultiFacility,
    canUseAdvancedAnalytics,
    canAccessResources,
    canAccessFTagLibrary,
    canAccessFTagManagement,
    canAccessTeamCollaboration,
    canAccessViewOnlyReports,
    
    // Usage and limits
    getRemainingUsage,
    getUpgradeMessage,
    trackSurveyCreation,
    trackReportExport,
    hasWatermarks,
    getPlanName,
    getPlanLimits,
    
    // Context info
    isFeatureGated: false, // No feature gates
    allFeaturesAvailable: true
  }), [user]);

  return (
    <FeatureGateContext.Provider value={value}>
      {children}
    </FeatureGateContext.Provider>
  );
};

export const useFeatureGate = () => {
  const context = useContext(FeatureGateContext);
  if (!context) {
    throw new Error('useFeatureGate must be used within a FeatureGateProvider');
  }
  return context;
};

// HOC for feature gating - simplified to always allow access
export const withFeatureGate = (WrappedComponent, requiredFeature, fallbackComponent = null) => {
  return (props) => {
    // Always render the wrapped component - backend handles restrictions
    return <WrappedComponent {...props} />;
  };
}; 