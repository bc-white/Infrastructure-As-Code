/**
 * Utility functions for survey-specific localStorage management
 * This allows multiple surveys to maintain their own separate state
 */

/**
 * Get the survey-specific storage key
 * @param {string} baseKey - The base key name
 * @returns {string} - The survey-specific key or base key if no current survey
 */
export const getSurveyStorageKey = (baseKey) => {
  const currentSurveyId = localStorage.getItem('currentSurveyId');
  return currentSurveyId ? `${baseKey}_${currentSurveyId}` : baseKey;
};

/**
 * Get data from localStorage with survey-specific fallback
 * @param {string} baseKey - The base key name
 * @returns {string|null} - The stored data or null
 */
export const getSurveyData = (baseKey) => {
  const currentSurveyId = localStorage.getItem('currentSurveyId');
  let data = null;
  
  // Try survey-specific key first
  if (currentSurveyId) {
    data = localStorage.getItem(`${baseKey}_${currentSurveyId}`);
  }
  
  // Fallback to global key for backward compatibility
  if (!data) {
    data = localStorage.getItem(baseKey);
  }
  
  return data;
};

/**
 * Set data to localStorage with survey-specific storage
 * @param {string} baseKey - The base key name
 * @param {string} value - The value to store
 */
export const setSurveyData = (baseKey, value) => {
  const currentSurveyId = localStorage.getItem('currentSurveyId');
  
  try {
    if (currentSurveyId) {
      // Clear old data first to free up space
      try {
        localStorage.removeItem(`${baseKey}_${currentSurveyId}`);
        localStorage.removeItem(baseKey);
      } catch (e) {
        // Silent - clearing might fail but that's ok
      }
      
      // Try to save survey-specific first (priority)
      try {
        localStorage.setItem(`${baseKey}_${currentSurveyId}`, value);
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          // Don't throw - just skip storage
          return;
        }
        throw error;
      }
      
      // Try to save global for backward compatibility (best effort)
      try {
        localStorage.setItem(baseKey, value);
      } catch (error) {
        // Silent fail for global - survey-specific is priority
      }
    } else {
      // Clear old data first
      try {
        localStorage.removeItem(baseKey);
      } catch (e) {
        // Silent - clearing might fail but that's ok
      }
      
      // Only save global if no survey ID
      try {
        localStorage.setItem(baseKey, value);
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          return;
        }
        throw error;
      }
    }
  } catch (error) {
    // Final catch - don't break the app
  }
};

/**
 * Remove survey-specific data from localStorage
 * @param {string} baseKey - The base key name
 * @param {string} surveyId - Optional specific survey ID, uses current if not provided
 */
export const removeSurveyData = (baseKey, surveyId = null) => {
  const targetSurveyId = surveyId || localStorage.getItem('currentSurveyId');
  
  if (targetSurveyId) {
    localStorage.removeItem(`${baseKey}_${targetSurveyId}`);
  }
  
  // Also remove global key
  localStorage.removeItem(baseKey);
};

/**
 * Clear all survey-specific data for a given survey
 * @param {string} surveyId - Optional specific survey ID, uses current if not provided
 */
export const clearSurveyStorage = (surveyId = null) => {
  const targetSurveyId = surveyId || localStorage.getItem('currentSurveyId');
  
  const baseKeys = [
    'mocksurvey_data',
    'mocksurvey_current_step',
    'mocksurvey_team_members'
  ];
  
  baseKeys.forEach(baseKey => {
    removeSurveyData(baseKey, targetSurveyId);
  });
  
  // Remove the survey ID reference if it matches
  if (!surveyId && targetSurveyId) {
    localStorage.removeItem('currentSurveyId');
  }
};

/**
 * Get all survey IDs that have stored data
 * @returns {string[]} - Array of survey IDs
 */
export const getStoredSurveyIds = () => {
  const surveyIds = new Set();
  const baseKeys = [
    'mocksurvey_data',
    'mocksurvey_current_step',
    'mocksurvey_team_members'
  ];
  
  // Check all localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    
    // Check if key matches pattern: baseKey_surveyId
    baseKeys.forEach(baseKey => {
      if (key && key.startsWith(`${baseKey}_`) && key !== baseKey) {
        const surveyId = key.substring(baseKey.length + 1);
        if (surveyId) {
          surveyIds.add(surveyId);
        }
      }
    });
  }
  
  return Array.from(surveyIds);
};

/**
 * Switch to a different survey context
 * @param {string} surveyId - The survey ID to switch to
 */
export const switchToSurvey = (surveyId) => {
  if (surveyId) {
    localStorage.setItem('currentSurveyId', surveyId);
  } else {
    localStorage.removeItem('currentSurveyId');
  }
};

/**
 * Clear old survey data, keeping only current survey and global keys
 */
export const clearOldSurveyData = () => {
  try {
    const currentSurveyId = localStorage.getItem('currentSurveyId');
    
    // Get all localStorage keys
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mocksurvey_')) {
        // Keep current survey data and global keys, remove old survey data
        if (currentSurveyId && key.includes(currentSurveyId)) {
          // Keep current survey data
          continue;
        } else if (key === 'currentSurveyId' || 
                  key === 'mocksurvey_data' || 
                  key === 'mocksurvey_token' ||
                  key === 'mocksurvey_refresh_token' ||
                  key === 'mocksurvey_user' ||
                  key === 'mocksurvey_session_expiry' ||
                  key === 'mocksurvey_team_members' ||
                  key === 'mocksurvey_current_step') {
          // Keep global/current survey keys
          continue;
        } else {
          // Remove old survey-specific data
          keysToRemove.push(key);
        }
      }
    }
    
    // Remove old survey data
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Silent error handling
      }
    });
  } catch (error) {
    // Error clearing old survey data
  }
};
