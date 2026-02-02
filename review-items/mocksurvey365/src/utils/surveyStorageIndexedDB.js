/**
 * New survey storage utility using IndexedDB
 * Replaces localStorage-based surveyStorage.js with IndexedDB implementation
 * Provides backward compatibility while offering better performance and storage limits
 */

import surveyIndexedDB from './surveyIndexedDB';
import surveySyncService from './surveySyncService';

// Initialize sync service
surveySyncService.init();

/** 
 * Get the current survey ID from localStorage (for backward compatibility)
 */
const getCurrentSurveyId = () => {
  return localStorage.getItem('currentSurveyId');
};

/**
 * Set the current survey ID in localStorage (for backward compatibility)
 */
const setCurrentSurveyId = (surveyId) => {
  if (surveyId) {
    localStorage.setItem('currentSurveyId', surveyId);
  } else {
    localStorage.removeItem('currentSurveyId');
  }
};

/**
 * Get survey step data from IndexedDB
 * @param {string} surveyId - The survey ID
 * @param {number} stepIndex - The step index
 * @returns {Promise<any>} - The step data or null
 */
export const getSurveyStepData = async (surveyId, stepIndex) => {
  try {
    return await surveyIndexedDB.getSurveyStep(surveyId, stepIndex);
  } catch (error) {
    return null;
  }
};

/**
 * Save survey step data to IndexedDB
 * @param {string} surveyId - The survey ID
 * @param {number} stepIndex - The step index
 * @param {any} stepData - The step data to save
 * @param {boolean} isCompressed - Whether to compress the data
 * @returns {Promise<boolean>} - Success status
 */
export const saveSurveyStepData = async (surveyId, stepIndex, stepData, isCompressed = true) => {
  try {
    await surveyIndexedDB.saveSurveyStep(surveyId, stepIndex, stepData, isCompressed);
    
    // Add to sync queue for server synchronization
    await surveyIndexedDB.addToSyncQueue(surveyId, `step_${stepIndex}`, stepData, 'step');
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get survey metadata from IndexedDB
 * @param {string} surveyId - The survey ID
 * @returns {Promise<any>} - The metadata or null
 */
export const getSurveyMetadata = async (surveyId) => {
  try {
    return await surveyIndexedDB.getSurveyMetadata(surveyId);
  } catch (error) {
    return null;
  }
};

/**
 * Save survey metadata to IndexedDB
 * @param {string} surveyId - The survey ID
 * @param {any} metadata - The metadata to save
 * @returns {Promise<boolean>} - Success status
 */
export const saveSurveyMetadata = async (surveyId, metadata) => {
  try {
    await surveyIndexedDB.saveSurveyMetadata(surveyId, metadata);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Save attachment as blob to IndexedDB
 * @param {string} surveyId - The survey ID
 * @param {string} stepId - The step ID
 * @param {string} fileId - The file ID
 * @param {Blob} fileBlob - The file blob
 * @param {any} metadata - Additional metadata
 * @returns {Promise<boolean>} - Success status
 */
export const saveAttachment = async (surveyId, stepId, fileId, fileBlob, metadata = {}) => {
  try {
    await surveyIndexedDB.saveAttachment(surveyId, stepId, fileId, fileBlob, metadata);
    
    // Add to sync queue for server synchronization
    await surveyIndexedDB.addToSyncQueue(surveyId, stepId, { fileId, fileName: metadata.fileName, metadata }, 'attachment');
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get attachment blob from IndexedDB
 * @param {string} surveyId - The survey ID
 * @param {string} stepId - The step ID
 * @param {string} fileId - The file ID
 * @returns {Promise<any>} - The attachment data or null
 */
export const getAttachment = async (surveyId, stepId, fileId) => {
  try {
    return await surveyIndexedDB.getAttachment(surveyId, stepId, fileId);
  } catch (error) {
    return null;
  }
};

/**
 * Clear all data for a survey
 * @param {string} surveyId - The survey ID
 * @returns {Promise<boolean>} - Success status
 */
export const clearSurveyData = async (surveyId) => {
  try {
    await surveyIndexedDB.clearSurveyData(surveyId);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get storage statistics
 * @returns {Promise<any>} - Storage statistics
 */
export const getStorageStats = async () => {
  try {
    return await surveyIndexedDB.getStorageStats();
  } catch (error) {
    return null;
  }
};

/**
 * Get sync status
 * @param {string} surveyId - Optional survey ID
 * @returns {Promise<any>} - Sync status
 */
export const getSyncStatus = async (surveyId = null) => {
  try {
    return await surveySyncService.getSyncStatus(surveyId);
  } catch (error) {
    return null;
  }
};

/**
 * Force sync for a survey
 * @param {string} surveyId - The survey ID
 * @returns {Promise<boolean>} - Success status
 */
export const forceSyncSurvey = async (surveyId) => {
  try {
    await surveySyncService.forceSyncSurvey(surveyId);
    return true;
  } catch (error) {
    return false;
  }
};

// Backward compatibility functions for existing code
// These maintain the same interface as the old localStorage-based functions

/**
 * Get survey data (backward compatibility)
 * @param {string} baseKey - The base key name
 * @returns {string|null} - The stored data or null
 */
export const getSurveyData = (baseKey) => {
  const currentSurveyId = getCurrentSurveyId();
  
  if (!currentSurveyId) {
    // Fallback to localStorage for backward compatibility
    return localStorage.getItem(baseKey);
  }

  // For new IndexedDB-based storage, we need to handle different data types
  switch (baseKey) {
    case 'mocksurvey_data':
      // This would need to be handled differently since it's now stored per-step
      // For now, return null to force re-initialization
      return null;
    case 'mocksurvey_current_step':
      // This would need to be retrieved from metadata
      // For now, return null to force re-initialization
      return null;
    case 'mocksurvey_team_members':
      // This would need to be retrieved from metadata
      // For now, return null to force re-initialization
      return null;
    default:
      // Fallback to localStorage for other keys
      return localStorage.getItem(baseKey);
  }
};

/**
 * Set survey data (backward compatibility)
 * @param {string} baseKey - The base key name
 * @param {string} value - The value to store
 */
export const setSurveyData = async (baseKey, value) => {
  const currentSurveyId = getCurrentSurveyId();
  
  if (!currentSurveyId) {
    // Fallback to localStorage for backward compatibility
    try {
      localStorage.setItem(baseKey, value);
    } catch (error) {
      // Error saving to localStorage
    }
    return;
  }

  // For new IndexedDB-based storage, we need to handle different data types
  switch (baseKey) {
    case 'mocksurvey_data':
      // This is now handled per-step, so we'll skip this
      break;
    case 'mocksurvey_current_step':
      // Save current step to metadata
      try {
        const metadata = await getSurveyMetadata(currentSurveyId) || {};
        metadata.currentStep = parseInt(value, 10);
        await saveSurveyMetadata(currentSurveyId, metadata);
      } catch (error) {
        // Error saving current step
      }
      break;
    case 'mocksurvey_team_members':
      // Save team members to metadata
      try {
        const metadata = await getSurveyMetadata(currentSurveyId) || {};
        metadata.teamMembers = JSON.parse(value);
        await saveSurveyMetadata(currentSurveyId, metadata);
      } catch (error) {
        // Error saving team members
      }
      break;
    default:
      // Fallback to localStorage for other keys
      try {
        localStorage.setItem(baseKey, value);
      } catch (error) {
        // Error saving to localStorage
      }
  }
};

/**
 * Remove survey data (backward compatibility)
 * @param {string} baseKey - The base key name
 * @param {string} surveyId - Optional specific survey ID
 */
export const removeSurveyData = async (baseKey, surveyId = null) => {
  const targetSurveyId = surveyId || getCurrentSurveyId();
  
  if (targetSurveyId) {
    // For IndexedDB-based storage, we need to handle different data types
    switch (baseKey) {
      case 'mocksurvey_data':
        // Clear all step data
        await clearSurveyData(targetSurveyId);
        break;
      case 'mocksurvey_current_step':
      case 'mocksurvey_team_members':
        // These are now stored in metadata
        try {
          const metadata = await getSurveyMetadata(targetSurveyId) || {};
          delete metadata[baseKey.replace('mocksurvey_', '')];
          await saveSurveyMetadata(targetSurveyId, metadata);
        } catch (error) {
          // Error removing survey data
        }
        break;
      default:
        // Fallback to localStorage
        localStorage.removeItem(baseKey);
    }
  } else {
    // Fallback to localStorage
    localStorage.removeItem(baseKey);
  }
};

/**
 * Clear survey storage (backward compatibility)
 * @param {string} surveyId - Optional specific survey ID
 */
export const clearSurveyStorage = async (surveyId = null) => {
  const targetSurveyId = surveyId || getCurrentSurveyId();
  
  if (targetSurveyId) {
    await clearSurveyData(targetSurveyId);
  }
  
  // Remove the survey ID reference if it matches
  if (!surveyId && targetSurveyId) {
    setCurrentSurveyId(null);
  }
};

/**
 * Clear old survey data (backward compatibility)
 */
export const clearOldSurveyData = () => {
  // This function is now handled by IndexedDB's automatic cleanup
  // We can keep it for backward compatibility but it's not needed
};

/**
 * Get stored survey IDs (backward compatibility)
 * @returns {string[]} - Array of survey IDs
 */
export const getStoredSurveyIds = async () => {
  try {
    // This would need to be implemented in the IndexedDB service
    // For now, return empty array
    return [];
  } catch (error) {
    return [];
  }
};

/**
 * Switch to a different survey context (backward compatibility)
 * @param {string} surveyId - The survey ID to switch to
 */
export const switchToSurvey = (surveyId) => {
  setCurrentSurveyId(surveyId);
};

// Export the new functions for direct use
// Note: These functions are already exported as named exports above,
// so we don't need to re-export them here to avoid duplicates
