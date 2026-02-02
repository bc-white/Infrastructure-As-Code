import { useMemo } from 'react';

/**
 * Hook to access the current user context from local storage.
 * Used to determine the current user's identity, name, and ID for investigations.
 */
export const useInvestigationUserContext = () => {
  const currentUser = useMemo(() => {
    const userStr = localStorage.getItem("mocksurvey_user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
       
        return null;
      }
    }
    return null;
  }, []);

  const currentUserName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
    : "Unknown User";
    
  const currentUserId = currentUser?._id || null;

  return {
    currentUser,
    currentUserName,
    currentUserId
  };
};
