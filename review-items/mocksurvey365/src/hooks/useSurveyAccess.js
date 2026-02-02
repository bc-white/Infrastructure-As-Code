import { useState, useEffect, useCallback, useRef } from 'react';
import { surveyAPI, getCurrentUser } from '../service/api';

/**
 * Access types returned by the API
 */
export const ACCESS_TYPES = {
  CREATOR: 'CREATOR',
  TEAM_LEAD: 'TEAM_LEAD',
  TEAM_MEMBER: 'TEAM_MEMBER',
  OWNER: 'OWNER',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Hook to determine the current user's access type for a survey
 * Replaces the prop-based isInvitedUser pattern with API-based access check
 * 
 * @param {string} surveyId - The survey ID to check access for
 * @returns {Object} - Access state and helper functions
 */
export const useSurveyAccess = (surveyId) => {
  const [accessType, setAccessType] = useState(ACCESS_TYPES.UNKNOWN);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessData, setAccessData] = useState(null);
  const [isTeamCoordinator, setIsTeamCoordinator] = useState(false);
  
  // Ref to prevent duplicate fetches
  const hasFetchedRef = useRef(false);
  const currentSurveyIdRef = useRef(surveyId);

  // Get current user
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?._id || currentUser?.id;

  /**
   * Fetch access type from API
   */
  const fetchAccessType = useCallback(async (forceRefresh = false) => {
    const effectiveSurveyId = surveyId || localStorage.getItem('currentSurveyId');
    
    if (!effectiveSurveyId || !currentUserId) {
      setIsLoading(false);
      setAccessType(ACCESS_TYPES.UNKNOWN);
      return;
    }

    // Prevent duplicate fetches unless forced
    if (hasFetchedRef.current && !forceRefresh && currentSurveyIdRef.current === effectiveSurveyId) {
      return;
    }

    hasFetchedRef.current = true;
    currentSurveyIdRef.current = effectiveSurveyId;
    setIsLoading(true);
    setError(null);

    try {
      const response = await surveyAPI.getTeamMemberSurveyAccess(effectiveSurveyId, currentUserId);
      
      if (response.statusCode === 200 && response.data) {
        const data = response.data;
        setAccessData(data);
        
        // Set teamCoordinator flag from user object
        if (data.user?.teamCoordinator) {
          setIsTeamCoordinator(true);
        }
        
        // Determine access type from response
        if (data.accessType) {
          // Direct accessType field from API (CREATOR, TEAM_MEMBER, TEAM_LEAD, etc.)
          const type = data.accessType.toUpperCase();
          setAccessType(type);
        } else if (data.isTeamLead === true || data.role === 'TEAM_LEAD') {
          setAccessType(ACCESS_TYPES.TEAM_LEAD);
        } else if (data.isTeamMember === true || data.role === 'TEAM_MEMBER') {
          setAccessType(ACCESS_TYPES.TEAM_MEMBER);
        } else if (data.isOwner === true || data.role === 'OWNER' || data.role === 'CREATOR') {
          setAccessType(ACCESS_TYPES.CREATOR);
        } else {
          // Default to CREATOR if no specific role found (backwards compatibility)
          setAccessType(ACCESS_TYPES.CREATOR);
        }
      } else {
        // If API doesn't return expected data, default to CREATOR (owner behavior)
        setAccessType(ACCESS_TYPES.CREATOR);
      }
    } catch (err) {
     
      setError(err.message || 'Failed to fetch access type');
      // Default to CREATOR on error (fail-open for survey creators)
      setAccessType(ACCESS_TYPES.CREATOR);
    } finally {
      setIsLoading(false);
    }
  }, [surveyId, currentUserId]);

  // Fetch on mount and when surveyId changes
  useEffect(() => {
    // Reset fetch ref when surveyId changes
    if (currentSurveyIdRef.current !== surveyId) {
      hasFetchedRef.current = false;
    }
    fetchAccessType();
  }, [fetchAccessType, surveyId]);

  /**
   * Check if current user is an invited user (team member, not creator/team lead)
   * This replaces the isInvitedUser prop pattern
   */
  const isInvitedUser = useCallback(() => {
    return accessType === ACCESS_TYPES.TEAM_MEMBER;
  }, [accessType]);

  /**
   * Check if current user is a team lead or creator (full access)
   */
  const isTeamLead = useCallback(() => {
    return accessType === ACCESS_TYPES.TEAM_LEAD || 
           accessType === ACCESS_TYPES.CREATOR || 
           accessType === ACCESS_TYPES.OWNER;
  }, [accessType]);

  /**
   * Check if current user is the survey creator/owner
   */
  const isCreator = useCallback(() => {
    return accessType === ACCESS_TYPES.CREATOR || accessType === ACCESS_TYPES.OWNER;
  }, [accessType]);

  /**
   * Check if current user is a team coordinator
   */
  const checkIsTeamCoordinator = useCallback(() => {
    return isTeamCoordinator;
  }, [isTeamCoordinator]);

  /**
   * Refresh access type from API
   */
  const refreshAccess = useCallback(() => {
    hasFetchedRef.current = false;
    return fetchAccessType(true);
  }, [fetchAccessType]);

  return {
    // Access type state
    accessType,
    isLoading,
    error,
    accessData,
    isTeamCoordinator,
    
    // Helper functions (these can be passed to components)
    isInvitedUser,
    isTeamLead,
    isCreator,
    checkIsTeamCoordinator,
    
    // Refresh function
    refreshAccess,
    
    // Current user info
    currentUser,
    currentUserId,
  };
};

export default useSurveyAccess;
