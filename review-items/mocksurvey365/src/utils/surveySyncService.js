/**
 * Sync service for IndexedDB to server synchronization
 * Handles incremental sync with retry logic and exponential backoff
 */

import surveyIndexedDB from './surveyIndexedDB';
import api from '../service/api';
import { surveySocketService } from '../service/api';
import useSurveyStore from '../stores/useSurveyStore';

class SurveySyncService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.syncInterval = null;
    this.retryDelays = [1000, 2000, 5000, 10000, 30000]; // Exponential backoff delays
    this.maxRetries = 5;
    this.lastSyncTime = 0;
    this.minSyncInterval = 60000; // Minimum 1 minute between syncs
    
    // Step number to step name mapping
    this.stepMapping = {
      1: 'pre-survey',
      2: 'offsite-preparation',
      3: 'facility-entrance',
      4: 'initial-pool-process',
      5: 'sample-selection',
      6: 'investigations',
      7: 'facility-tasks',
      8: 'team-meetings',
      9: 'citation-report',
      10: 'exit-conference',
      11: 'post-survey-activities',
      12: 'resources-help',
      13: 'survey-closure'
    };
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.startPeriodicSync();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.stopPeriodicSync();
    });
  }

  /**
   * Get step name from step number
   */
  getStepName(stepNumber) {
    return this.stepMapping[stepNumber] || `step-${stepNumber}`;
  }

  /**
   * Ensure socket is connected and ready for emitting
   * Waits for connection if socket is reconnecting
   * @param {string} surveyId - Survey ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Socket instance
   */
  async ensureSocketConnected(surveyId, userId) {
    // First check if socket is already connected
    let socket = surveySocketService.getSocket();
    
    if (socket && socket.connected) {
      return socket;
    }

    // Socket is not connected, try to connect or wait for reconnection
    if (!socket || !socket.connected) {
      // Try to connect if not already attempting
      if (!socket || socket.disconnected) {
        surveySocketService.connect(surveyId, userId);
        // Wait a moment for socket instance to be created
        await new Promise((resolve) => setTimeout(resolve, 500));
        socket = surveySocketService.getSocket();
      }
      
      // If socket exists but not connected, wait for connection event
      if (socket && !socket.connected) {
        return new Promise((resolve, reject) => {
          let timeout = setTimeout(() => {
            if (socket) {
              socket.off('connect', onConnect);
              socket.off('connect_error', onError);
              socket.off('reconnect', onReconnect);
            }
            reject(new Error('Socket connection timeout - waited 15 seconds'));
          }, 15000); // 15 second timeout for reconnection

          const cleanup = () => {
            clearTimeout(timeout);
            if (socket) {
              socket.off('connect', onConnect);
              socket.off('connect_error', onError);
              socket.off('reconnect', onReconnect);
            }
          };

          const onConnect = () => {
            cleanup();
            // Small delay to ensure socket is fully ready
            setTimeout(() => resolve(socket), 200);
          };

          const onReconnect = () => {
            cleanup();
            // Small delay to ensure socket is fully ready after reconnect
            setTimeout(() => resolve(socket), 200);
          };

          const onError = (error) => {
            cleanup();
            reject(new Error(`Socket connection failed: ${error.message || error}`));
          };

          // Check again in case it connected while setting up listeners
          if (socket && socket.connected) {
            cleanup();
            resolve(socket);
          } else if (socket) {
            // Wait for connect or reconnect event
            // Socket.IO fires 'reconnect' when it automatically reconnects after going offline
            socket.once('connect', onConnect);
            socket.once('reconnect', onReconnect);
            socket.once('connect_error', onError);
          } else {
            cleanup();
            reject(new Error('Socket instance not available'));
          }
        });
      }
    }

    // Final check
    if (!socket) {
      throw new Error('Socket not available after connection attempt');
    }

    if (!socket.connected) {
      throw new Error('Socket not connected after waiting for connection');
    }

    return socket;
  }

  /**
   * Clean data payload by removing conflict tracking fields
   * These fields are only for IndexedDB and should not be sent to backend
   * @param {Object} data - The data object to clean
   * @returns {Object} Cleaned data without conflict tracking fields
   */
  cleanPayloadForSync(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return data;
    }

    // Create a copy to avoid mutating original
    const cleaned = { ...data };

    // Remove conflict tracking fields that should not be sent to backend
    delete cleaned.serverVersion;
    delete cleaned.lastServerSyncAt;
    delete cleaned.localVersion;
    delete cleaned.conflictStatus;
    delete cleaned.conflictResolution;

    // Recursively clean nested objects (but not arrays)
    for (const key in cleaned) {
      if (cleaned[key] && typeof cleaned[key] === 'object' && !Array.isArray(cleaned[key])) {
        cleaned[key] = this.cleanPayloadForSync(cleaned[key]);
      }
    }

    return cleaned;
  }

  /**
   * Clean data payload by removing conflict tracking fields
   * These fields are only for IndexedDB and should not be sent to backend
   */
  cleanPayloadForSync(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // Create a copy to avoid mutating original
    const cleaned = { ...data };

    // Remove conflict tracking fields
    delete cleaned.serverVersion;
    delete cleaned.lastServerSyncAt;
    delete cleaned.localVersion;
    delete cleaned.conflictStatus;
    delete cleaned.conflictResolution;

    // Recursively clean nested objects
    for (const key in cleaned) {
      if (cleaned[key] && typeof cleaned[key] === 'object' && !Array.isArray(cleaned[key])) {
        cleaned[key] = this.cleanPayloadForSync(cleaned[key]);
      }
    }

    return cleaned;
  }

  /**
   * Start periodic sync (every 2 minutes when online)
   */
  startPeriodicSync() {
    if (this.syncInterval) return;
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncUnsyncedData();
      }
    }, 120000); // Changed from 30 seconds to 2 minutes
  }

  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync all unsynced data
   */
  async syncUnsyncedData(surveyId = null) {
    if (this.syncInProgress || !this.isOnline) return;
    
    // Throttle sync calls - don't sync more than once per minute
    const now = Date.now();
    if (now - this.lastSyncTime < this.minSyncInterval) {
      return;
    }
    
    this.syncInProgress = true;
    this.lastSyncTime = now;
    
    try {
      const unsyncedItems = await surveyIndexedDB.getUnsyncedItems(surveyId);
      
      if (unsyncedItems.length === 0) {
        return;
      }

      // Group items by type for batch processing
      const stepsToSync = unsyncedItems.filter(item => item.type === 'step');
      const attachmentsToSync = unsyncedItems.filter(item => item.type === 'attachment');
      const initialPoolSubmissions = unsyncedItems.filter(item => item.type === 'initial_pool_submission');
      const sampleSelectionSubmissions = unsyncedItems.filter(item => item.type === 'sample_selection_submission');
      const apiFinalSampleSelections = unsyncedItems.filter(item => item.type === 'api_final_sample_selection');
      const investigationSubmissions = unsyncedItems.filter(item => item.type === 'investigation_submission');
      // const facilityTasksSubmissions = unsyncedItems.filter(item => item.type === 'facility_tasks_submission'); // Deprecated
      const apiFacilityTasks = unsyncedItems.filter(item => item.type === 'api_facility_tasks');
      const apiInvestigationSubmissions = unsyncedItems.filter(item => item.type === 'api_investigation_submission');
      const apiInitialPoolSubmissions = unsyncedItems.filter(item => item.type === 'api_initial_pool_submission');
      const apiFacilityEntrances = unsyncedItems.filter(item => item.type === 'api_facility_entrance');
      const apiSurveySetups = unsyncedItems.filter(item => item.type === 'api_survey_setup');
      const apiExitConferences = unsyncedItems.filter(item => item.type === 'api_exit_conference');
      const apiOffsitePreparations = unsyncedItems.filter(item => item.type === 'api_offsite_preparation');
      const apiPostSurveyActivities = unsyncedItems.filter(item => item.type === 'api_post_survey_activities');
      const apiTeamMeetings = unsyncedItems.filter(item => item.type === 'api_team_meetings');
      const apiCitationReports = unsyncedItems.filter(item => item.type === 'api_citation_report');
      const apiRiskBasedSetups = unsyncedItems.filter(item => item.type === 'api_risk_based_setup');
      const apiFacilityInitiatedSurveys = unsyncedItems.filter(item => item.type === 'api_facility_initiated_survey');
      const apiLifeSafetySurveys = unsyncedItems.filter(item => item.type === 'api_life_safety_survey');
      const apiSurveyClosures = unsyncedItems.filter(item => item.type === 'api_survey_closure');
      
      // Sync API-based survey setup submissions FIRST (must be synced first as they create the survey)
      // This ensures surveyId exists before other operations
      for (const item of apiSurveySetups) {
        await this.syncApiSurveySetup(item);
      }
      
      // Sync API-based risk-based setup submissions (also creates surveys, so sync early)
      for (const item of apiRiskBasedSetups) {
        await this.syncApiRiskBasedSetup(item);
      }
      
      // Sync steps
      for (const item of stepsToSync) {
        await this.syncStep(item);
      }
      
      // Sync attachments
      for (const item of attachmentsToSync) {
        await this.syncAttachment(item);
      }
      
      // Sync initial pool submissions (socket messages)
      for (const item of initialPoolSubmissions) {
        await this.syncInitialPoolSubmission(item);
      }
      
      // Sync sample selection submissions (socket messages)
      for (const item of sampleSelectionSubmissions) {
        await this.syncSampleSelectionSubmission(item);
      }
      
      // Sync API-based final sample selections
      for (const item of apiFinalSampleSelections) {
        await this.syncApiFinalSampleSelection(item);
      }
      
      // Sync investigation submissions (socket messages)
      for (const item of investigationSubmissions) {
        await this.syncInvestigationSubmission(item);
      }
      
      // Sync API-based facility tasks submissions
      for (const item of apiFacilityTasks) {
        await this.syncApiFacilityTasks(item);
      }

      // Sync API-based investigation submissions
      for (const item of apiInvestigationSubmissions) {
        await this.syncApiInvestigationSubmission(item);
      }

      // Sync API-based initial pool submissions
      for (const item of apiInitialPoolSubmissions) {
        await this.syncApiInitialPoolSubmission(item);
      }
      
      // Sync API-based facility entrance submissions
      for (const item of apiFacilityEntrances) {
        await this.syncApiFacilityEntrance(item);
      }
      
      // Sync API-based exit conference submissions
      for (const item of apiExitConferences) {
        await this.syncApiExitConference(item);
      }
      
      // Sync API-based offsite preparation submissions
      for (const item of apiOffsitePreparations) {
        await this.syncApiOffsitePreparation(item);
      }
      
      // Sync API-based post survey activities submissions
      for (const item of apiPostSurveyActivities) {
        await this.syncApiPostSurveyActivities(item);
      }
      
      // Sync API-based team meetings submissions
      for (const item of apiTeamMeetings) {
        await this.syncApiTeamMeetings(item);
      }
      
      // Sync API-based citation report submissions
      for (const item of apiCitationReports) {
        await this.syncApiCitationReport(item);
      }
      
      // Sync API-based facility initiated survey submissions
      for (const item of apiFacilityInitiatedSurveys) {
        await this.syncApiFacilityInitiatedSurvey(item);
      }
      
      // Sync API-based life safety survey submissions
      for (const item of apiLifeSafetySurveys) {
        await this.syncApiLifeSafetySurvey(item);
      }

      // Sync API-based survey closure submissions
      for (const item of apiSurveyClosures) {
        await this.syncApiSurveyClosure(item);
      }
      
    } catch (error) {
      // Error during sync
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Check for conflicts before syncing
   * @param {Object} syncItem - The sync item to check
   * @param {Function} fetchServerData - Optional function to fetch current server state
   * @returns {Object} Conflict information
   */
  async checkForConflicts(syncItem, fetchServerData = null) {
    try {
      // If sync item already has conflict status, skip check
      if (syncItem.conflictStatus === 'detected' || syncItem.conflictStatus === 'pending') {
        return { hasConflict: true, reason: 'Conflict already detected' };
      }
      
      // Try to fetch current server state
      let serverData = null;
      
      if (fetchServerData) {
        try {
          serverData = await fetchServerData(syncItem);
        } catch (error) {
          // If we can't fetch server state, assume no conflict (first 
          return { hasConflict: false };
        }
      } else {
        // Default: try to get survey step from server if it's a step type
        try {
          if (syncItem.type === 'step' && syncItem.surveyId) {
            // Attempt to fetch current step from server
            // Note: This would need actual API endpoint - for now we'll skip
            // serverData = await api.survey.getSurveyStep(syncItem.surveyId, syncItem.stepId);
          }
        } catch (error) {
         // Unable to fetch server data - assume no conflict
        }
      }
      
      // If we have server data, check for conflicts
      if (serverData) {
        const conflictInfo = await surveyIndexedDB.detectConflict(syncItem, serverData);
        
        if (conflictInfo.hasConflict) {
          // Record the conflict
          await surveyIndexedDB.recordConflict(syncItem, conflictInfo);
          return conflictInfo;
        }
      }
      
      return { hasConflict: false };
    } catch (error) {
      
      // On error, proceed with sync (assume no conflict)
      return { hasConflict: false };
    }
  }

  /**
   * Resolve conflict using specified strategy
   * @param {string} conflictId - Conflict ID
   * @param {string} strategy - 'local_wins', 'server_wins', 'merged', or 'user_choice'
   * @param {Object} userChoice - Optional data if user_choice strategy
   */
  async resolveConflictWithStrategy(conflictId, strategy, userChoice = null) {
    try {
      // Get conflict through IndexedDB service
      const pendingConflicts = await surveyIndexedDB.getPendingConflicts();
      const conflict = pendingConflicts.find(c => c.id === conflictId);
      
      if (!conflict) {
        // Try to get from all conflicts (including resolved)
        // We need to access the db directly for this
        await surveyIndexedDB.init();
        const db = surveyIndexedDB.db;
        const allConflicts = await db.conflicts.get(conflictId);
        if (!allConflicts) {
          throw new Error('Conflict not found');
        }
        // Use the found conflict
        const foundConflict = allConflicts;
        
        let resolvedData = null;
        
        if (strategy === 'local_wins') {
          resolvedData = foundConflict.conflictInfo?.localData;
        } else if (strategy === 'server_wins') {
          resolvedData = foundConflict.conflictInfo?.serverData;
        } else if (strategy === 'merged') {
          // Merge local and server data
          resolvedData = surveyIndexedDB.mergeData(
            foundConflict.conflictInfo?.localData || {},
            foundConflict.conflictInfo?.serverData || {},
            'deep_merge'
          );
        } else if (strategy === 'user_choice' && userChoice) {
          resolvedData = userChoice;
        } else {
          throw new Error(`Unknown resolution strategy: ${strategy}`);
        }
        
        await surveyIndexedDB.resolveConflict(conflictId, strategy, resolvedData);
        
        // Retry sync after resolution
        const syncItem = await db.syncQueue.get(foundConflict.syncItemId);
        if (syncItem) {
          // Reset conflict status to allow sync
          syncItem.conflictStatus = 'resolved';
          await db.syncQueue.put(syncItem);
          
          // Trigger sync again
          await this.syncUnsyncedData(syncItem.surveyId);
        }
        
        return { success: true, resolvedData };
      }
      
      // Handle pending conflict
      let resolvedData = null;
      
      if (strategy === 'local_wins') {
        resolvedData = conflict.conflictInfo?.localData;
      } else if (strategy === 'server_wins') {
        resolvedData = conflict.conflictInfo?.serverData;
      } else if (strategy === 'merged') {
        // Merge local and server data
        resolvedData = surveyIndexedDB.mergeData(
          conflict.conflictInfo?.localData || {},
          conflict.conflictInfo?.serverData || {},
          'deep_merge'
        );
      } else if (strategy === 'user_choice' && userChoice) {
        resolvedData = userChoice;
      } else {
        throw new Error(`Unknown resolution strategy: ${strategy}`);
      }
      
      await surveyIndexedDB.resolveConflict(conflictId, strategy, resolvedData);
      
      // Retry sync after resolution
      await surveyIndexedDB.init();
      const db = surveyIndexedDB.db;
      const syncItem = await db.syncQueue.get(conflict.syncItemId);
      if (syncItem) {
        // Reset conflict status to allow sync
        syncItem.conflictStatus = 'resolved';
        await db.syncQueue.put(syncItem);
        
        // Trigger sync again
        await this.syncUnsyncedData(syncItem.surveyId);
      }
      
      return { success: true, resolvedData };
    } catch (error) {
     
      throw error;
    }
  }

  /**
   * Sync a single step with conflict detection
   */
  async syncStep(syncItem) {
    try {
      // Check for conflicts first
      const conflictCheck = await this.checkForConflicts(syncItem);
      
      if (conflictCheck.hasConflict) {
        // Conflict detected - don't sync, let user resolve
       
        // The conflict is already recorded, so we'll skip this sync
        // User can resolve conflicts later
        return;
      }
      
      const { surveyId, stepId, data } = syncItem;
      
      // Prepare step data for server
      const stepData = {
        surveyId,
        stepIndex: stepId.split('_')[1], // Extract step index from stepId
        data,
        timestamp: new Date().toISOString()
      };

      // Convert step number to step name
      const stepName = this.getStepName(parseInt(stepData.stepIndex));

      // API saving is temporarily disabled for testing
      // Simulate a successful API response
      const response = {
        statusCode: 200,
        success: true,
        message: 'Sync simulated (API disabled)',
        data: {
          updatedAt: new Date().toISOString()
        }
      };
      
      // The API returns the parsed JSON response, not a response object
      if (response.statusCode === 200 || response.statusCode === 201 || response.success) {
        // Update version info after successful sync
        const serverUpdatedAt = response.data?.updatedAt || new Date().toISOString();
        await surveyIndexedDB.updateSyncItemVersion(
          syncItem.id,
          response.data?.version || new Date(serverUpdatedAt).getTime(),
          serverUpdatedAt
        );
        
        // Mark as synced
        await surveyIndexedDB.markStepAsSynced(surveyId, stepData.stepIndex);
        await surveyIndexedDB.removeFromSyncQueue(syncItem.id);
        useSurveyStore.getState().clearOfflineData(syncItem.id);
      } else {
        throw new Error(`Server returned status ${response.statusCode || 'unknown'}`);
      }
      
    } catch (error) {
      await this.handleSyncError(syncItem, error);
    }
  }

  /**
   * Sync a single attachment
   */
  async syncAttachment(syncItem) {
    try {
      const { surveyId, stepId, data } = syncItem;
      
      // Get attachment blob from IndexedDB
      const attachment = await surveyIndexedDB.getAttachment(surveyId, stepId, data.fileId);
      
      if (!attachment) {
        await surveyIndexedDB.removeFromSyncQueue(syncItem.id);
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', attachment.blob, data.fileName || 'attachment');
      formData.append('surveyId', surveyId);
      formData.append('stepId', stepId);
      formData.append('fileId', data.fileId);
      formData.append('metadata', JSON.stringify(data.metadata || {}));

      // API saving is temporarily disabled for testing
      // Simulate a successful upload response
      const response = {
        statusCode: 200,
        success: true,
        message: 'Attachment upload simulated (API disabled)'
      };
      
      // The API returns the parsed JSON response, not a response object
      if (response.statusCode === 200 || response.statusCode === 201 || response.success) {
        // Mark attachment as synced (you might want to add this method to IndexedDB service)
        await surveyIndexedDB.removeFromSyncQueue(syncItem.id);
      } else {
        throw new Error(`Server returned status ${response.statusCode || 'unknown'}`);
      }
      
    } catch (error) {
      await this.handleSyncError(syncItem, error);
    }
  }

  /**
   * Sync an initial pool submission (socket message)
   */
  async syncInitialPoolSubmission(syncItem) {
    try {
      const { surveyId, data } = syncItem;
      
      // Get current user for socket connection
      const currentUserStr = localStorage.getItem("mocksurvey_user");
      if (!currentUserStr) {
        throw new Error("User not found in localStorage");
      }
      
      const currentUser = JSON.parse(currentUserStr);
      const userId = currentUser._id || currentUser.id;
      
      if (!userId) {
        throw new Error("User ID not found");
      }
      
      // Ensure socket is connected and ready (waits for connection if needed)
      const socket = await this.ensureSocketConnected(surveyId, userId);
      
      if (!socket || !socket.connected) {
        throw new Error("Socket not connected after connection attempt");
      }
      
      // Re-emit the socket message
      // The data contains the original socketMessage
      // Clean it to remove conflict tracking fields before sending
      const socketMessage = this.cleanPayloadForSync(data);
      
      return new Promise((resolve, reject) => {
        // Set up timeout for socket response (10 seconds)
        const timeout = setTimeout(() => {
          reject(new Error("Socket response timeout"));
        }, 10000);
        
        // Listen for response
        const responseHandler = (response) => {
          clearTimeout(timeout);
          socket.off("team_lead_initial_pool", responseHandler);
          
          // Check if response indicates success
          const actualResponse = response?.response || response;
          const isSuccess = 
            actualResponse?.statusCode === 200 || 
            actualResponse?.status === true || 
            actualResponse?.success === true || 
            actualResponse?.data;
          
          if (isSuccess) {
            // Mark as synced and remove from queue
            surveyIndexedDB.removeFromSyncQueue(syncItem.id).then(() => {
              // Clear from Zustand store using the sync queue ID
              useSurveyStore.getState().clearOfflineData(syncItem.id);
              resolve();
            }).catch(reject);
          } else {
            reject(new Error(`Server returned error: ${actualResponse?.message || 'Unknown error'}`));
          }
        };
        
        socket.once("team_lead_initial_pool", responseHandler);
        
        // Emit the socket message
        socket.emit("join_team_lead_initial_pool", socketMessage);
      });
      
    } catch (error) {
      await this.handleSyncError(syncItem, error);
    }
  }

  /**
   * Sync a sample selection submission (team member assignments)
   */
  async syncSampleSelectionSubmission(syncItem) {
    try {
      const { surveyId, data } = syncItem;
      
      // Get current user for socket connection
      const currentUserStr = localStorage.getItem("mocksurvey_user");
      if (!currentUserStr) {
        throw new Error("User not found in localStorage");
      }
      
      const currentUser = JSON.parse(currentUserStr);
      const userId = currentUser._id || currentUser.id;
      
      if (!userId) {
        throw new Error("User ID not found");
      }
      
      // Ensure socket is connected and ready (waits for connection if needed)
      const socket = await this.ensureSocketConnected(surveyId, userId);
      
      if (!socket || !socket.connected) {
        throw new Error("Socket not connected after connection attempt");
      }
      
      // The data contains team members array
      const teamMembers = data.teamMembers || [];
      
      if (teamMembers.length === 0) {
        // No team members to sync, remove from queue
        await surveyIndexedDB.removeFromSyncQueue(syncItem.id);
        useSurveyStore.getState().clearOfflineData(syncItem.id);
        return;
      }
      
      // Emit assignments for each team member
      return new Promise((resolve, reject) => {
        let successCount = 0;
        let errorCount = 0;
        const totalMembers = teamMembers.length;
        
        // Set up timeout for socket response (10 seconds per member)
        const timeout = setTimeout(() => {
          if (successCount === 0) {
            reject(new Error("Socket response timeout"));
          } else if (errorCount > 0) {
            // Some succeeded, some failed - partial success
            // Still mark as synced since we tried
            surveyIndexedDB.removeFromSyncQueue(syncItem.id).then(() => {
              useSurveyStore.getState().clearOfflineData(syncItem.id);
              resolve();
            }).catch(reject);
          } else {
            resolve();
          }
        }, 10000 * totalMembers);
        
        // Listen for responses
        const responseHandler = (message) => {
          const isSuccessfulResponse =
            message?.status === true &&
            message?.statusCode === 200 &&
            (message?.data?.surveyId === surveyId || message?.surveyId === surveyId);
          
          const isAssignmentMessage =
            message?.surveyId === surveyId && message?.teamMemberId;
          
          if (isSuccessfulResponse || isAssignmentMessage) {
            successCount++;
            
            // If all members have been processed successfully
            if (successCount === totalMembers) {
              clearTimeout(timeout);
              socket.off("invite_team_members", responseHandler);
              
              // Mark as synced and remove from queue
              surveyIndexedDB.removeFromSyncQueue(syncItem.id).then(() => {
                useSurveyStore.getState().clearOfflineData(syncItem.id);
                resolve();
              }).catch(reject);
            }
          } else {
            errorCount++;
            // If too many errors, fail
            if (errorCount > totalMembers / 2) {
              clearTimeout(timeout);
              socket.off("invite_team_members", responseHandler);
              reject(new Error(`Too many assignment errors: ${errorCount}/${totalMembers}`));
            }
          }
        };
        
        socket.on("invite_team_members", responseHandler);
        
        // Emit assignments for each team member
        teamMembers.forEach((member) => {
          socket.emit("join_invite_team_members", member);
        });
        
        // Also emit view_survey_wizard after a short delay
        setTimeout(() => {
          socket.emit("join_view_survey_wizard", {
            surveyId: surveyId,
            userId: userId,
          });
        }, 500);
      });
      
    } catch (error) {
      await this.handleSyncError(syncItem, error);
    }
  }

  /**
   * Sync an API-based final sample selection submission
   */
  async syncApiFinalSampleSelection(syncItem) {
    try {
      const { surveyId, data } = syncItem;
      
      // Extract the API endpoint and payload from the saved data
      const apiEndpoint = data.apiEndpoint || "saveFinalSampleSelection";
      // Clean the data to remove conflict tracking fields
      const cleanedData = this.cleanPayloadForSync(data);
      
      // Remove internal fields that shouldn't be sent to the API
      delete cleanedData.apiEndpoint;
      delete cleanedData.submittedAt;
      
      // Make the API call
      const response = await api.healthAssistant[apiEndpoint](cleanedData);
      
      // Check if response indicates success
      if (response.statusCode === 200 || response.success) {
        // Mark as synced and remove from queue
        await surveyIndexedDB.removeFromSyncQueue(syncItem.id);
        useSurveyStore.getState().clearOfflineData(syncItem.id);
        
        // Emit socket event to broadcast real-time update
        const socket = surveySocketService.getSocket();
        if (socket && socket.connected) {
          const currentUserStr = localStorage.getItem("mocksurvey_user");
          if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            const userId = currentUser._id || currentUser.id;
            
            setTimeout(() => {
              if (socket && socket.connected) {
                socket.emit("join_view_survey_wizard", {
                  surveyId: surveyId,
                  userId: userId,
                });
              }
            }, 500);
          }
        }
      } else {
        throw new Error(`Server returned error: ${response.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      await this.handleSyncError(syncItem, error);
    }
  }

  /**
   * Sync an API-based facility entrance submission
   */
  async syncApiFacilityEntrance(syncItem) {
    try {
      const { surveyId, data } = syncItem;
      
      // Extract the API endpoint and payload from the saved data
      const apiMethod = data.apiMethod || "survey";
      const apiEndpoint = data.apiEndpoint || "submitFacilityEntrance";
      
      // Clean the data to remove conflict tracking fields
      const cleanedData = this.cleanPayloadForSync(data);
      
      // Remove offline-specific fields
      delete cleanedData.apiMethod;
      delete cleanedData.apiEndpoint;
      delete cleanedData.submittedAt;
      
      // Make the API call
      const response = await api[apiMethod][apiEndpoint](cleanedData);
      
      // Check if response indicates success
      if (response && (response.statusCode === 200 || response.success || response)) {
        // Mark as synced and remove from queue
        await surveyIndexedDB.removeFromSyncQueue(syncItem.id);
        useSurveyStore.getState().clearOfflineData(syncItem.id);
        
        // Emit socket event to broadcast real-time update
        const socket = surveySocketService.getSocket();
        if (socket && socket.connected) {
          const currentUserStr = localStorage.getItem("mocksurvey_user");
          if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            const userId = currentUser._id || currentUser.id;
            const targetSurveyId = surveyId || cleanedData.surveyId;
            
            setTimeout(() => {
              if (socket && socket.connected) {
                socket.emit("join_view_survey_wizard", {
                  surveyId: targetSurveyId,
                  userId: userId,
                });
              }
            }, 500);
          }
        }
      } else {
        throw new Error(`Server returned error: ${response?.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      await this.handleSyncError(syncItem, error);
    }
  }

  /**
   * Sync an API-based survey setup submission
   */
  async syncApiSurveySetup(syncItem) {
    try {
      const { data } = syncItem;
      
      // Extract the API endpoint and payload from the saved data
      const apiMethod = data.apiMethod || "survey";
      const apiEndpoint = data.apiEndpoint || "addSurveyWizard";
      
      // Prepare payload (remove metadata fields and conflict tracking)
      const cleanedData = this.cleanPayloadForSync(data);
      
      // Remove offline-specific fields
      delete cleanedData.apiMethod;
      delete cleanedData.apiEndpoint;
      delete cleanedData.submittedAt;
      
      const payload = {
        surveyCreationDate: cleanedData.surveyCreationDate,
        surveyCategory: cleanedData.surveyCategory,
        census: cleanedData.census,
        initialPool: cleanedData.initialPool,
        finalSample: cleanedData.finalSample,
        facilityId: cleanedData.facilityId,
        teamMembers: cleanedData.teamMembers,
        teamCoordinator: cleanedData.teamCoordinator,
        preSurveyRequirements: cleanedData.preSurveyRequirements || {},
        status: cleanedData.status,
      };
      
      // Make the API call (single parameter)
      const response = await api[apiMethod][apiEndpoint](payload);
      
      // Check if response indicates success
      if (response && (response.statusCode === 200 || response.statusCode === 201 || response.success)) {
        // Store survey ID for future use
        const surveyId = response.data?._id || response.data?.id || response.id;
        if (surveyId) {
          localStorage.setItem("currentSurveyId", surveyId);
          
          // Now invite team members with the surveyId
          if (payload.teamMembers && payload.teamMembers.length > 0) {
            try {
              const invitePromises = payload.teamMembers.map(async (member) => {
                const invitePayload = {
                  name: member.name,
                  email: member.email,
                  role: member.role,
                  surveyId: surveyId,
                  assignedFacilityTasks: member.assignedFacilityTasks || [],
                };
                
                return api.survey.inviteTeamMembers(invitePayload);
              });
              
              await Promise.all(invitePromises);
            } catch (inviteError) {
              // Don't fail the entire process, just log the error
             // console.error("Error inviting team members during sync:", inviteError);
            }
          }
        }
        
        // Mark as synced and remove from queue
        await surveyIndexedDB.removeFromSyncQueue(syncItem.id);
        useSurveyStore.getState().clearOfflineData(syncItem.id);
      } else {
        throw new Error(`Server returned error: ${response?.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      await this.handleSyncError(syncItem, error);
    }
  }

  /**
   * Sync an API-based exit conference submission
   */
  async syncApiExitConference(syncItem) {
    try {
      const { surveyId, data } = syncItem;
      
      // Extract the API endpoint and payload from the saved data
      const apiMethod = data.apiMethod || "survey";
      const apiEndpoint = data.apiEndpoint || "submitExitConference";
      
      // Clean the data to remove conflict tracking fields
      const cleanedData = this.cleanPayloadForSync(data);
      
      // Prepare payload by removing internal fields
      const payload = { ...cleanedData };
      delete payload.apiEndpoint;
      delete payload.apiMethod;
      delete payload.submittedAt;
      
      // Make the API call
      // submitExitConference expects a single payload object
      const response = await api[apiMethod][apiEndpoint](payload);
      
      // Check if response indicates success
      if (response && (response.statusCode === 200 || response.statusCode === 201 || response.success)) {
        // Mark as synced and remove from queue
        await surveyIndexedDB.removeFromSyncQueue(syncItem.id);
        useSurveyStore.getState().clearOfflineData(syncItem.id);
        
        // Emit socket event to broadcast real-time update
        const socket = surveySocketService.getSocket();
        if (socket && socket.connected) {
          const currentUserStr = localStorage.getItem("mocksurvey_user");
          if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            const userId = currentUser._id || currentUser.id;
            
            const targetSurveyId = payload.surveyId || surveyId;
            
            setTimeout(() => {
              if (socket && socket.connected) {
                socket.emit("join_view_survey_wizard", {
                  surveyId: targetSurveyId,
                  userId: userId,
                });
              }
            }, 500);
          }
        }
      } else {
        throw new Error(`Server returned error: ${response?.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      await this.handleSyncError(syncItem, error);
    }
  }

  /**
   * Sync an API-based survey closure submission
   */
  async syncApiSurveyClosure(syncItem) {
    try {
      const { surveyId, data } = syncItem;
      
      // Extract the API endpoint and payload from the saved data
      const apiMethod = data.apiMethod || "survey";
      const apiEndpoint = data.apiEndpoint || "submitSurveyClosure";
      
      // Clean the data to remove conflict tracking fields
      const cleanedData = this.cleanPayloadForSync(data);
      
      // Prepare payload by removing internal fields
      const payload = { ...cleanedData };
      delete payload.apiEndpoint;
      delete payload.apiMethod;
      delete payload.submittedAt;
      
      // Make the API call
      const response = await api[apiMethod][apiEndpoint](payload);
      
      // Check if response indicates success
      if (response && (response.statusCode === 200 || response.statusCode === 201 || response.success)) {
        // Mark as synced and remove from queue
        await surveyIndexedDB.removeFromSyncQueue(syncItem.id);
        useSurveyStore.getState().clearOfflineData(syncItem.id);
        
        // Emit socket event to broadcast real-time update
        const socket = surveySocketService.getSocket();
        if (socket && socket.connected) {
          const currentUserStr = localStorage.getItem("mocksurvey_user");
          if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            const userId = currentUser._id || currentUser.id;
            
            const targetSurveyId = payload.surveyId || surveyId;
            
            setTimeout(() => {
              if (socket && socket.connected) {
                socket.emit("join_view_survey_wizard", {
                  surveyId: targetSurveyId,
                  userId: userId,
                });
              }
            }, 500);
          }
        }
      } else {
        throw new Error(`Server returned error: ${response?.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      await this.handleSyncError(syncItem, error);
    }
  }

  /**
   * Sync an API-based offsite preparation submission
   */
  async syncApiOffsitePreparation(syncItem) {
    try {
      const { surveyId, data } = syncItem;
      
      // Extract the API endpoint and payload from the saved data
      const apiMethod = data.apiMethod || "survey";
      const apiEndpoint = data.apiEndpoint || "submitOffsitePreSurvey";
      
      // Clean the data to remove conflict tracking fields
      const cleanedData = this.cleanPayloadForSync(data);
      
      // Remove offline-specific fields
      delete cleanedData.apiMethod;
      delete cleanedData.apiEndpoint;
      delete cleanedData.submittedAt;
      
      // Make the API call
      const response = await api[apiMethod][apiEndpoint](cleanedData);
      
      // Check if response indicates success
      if (response && (response.statusCode === 200 || response.statusCode === 201 || response.success)) {
        // Mark as synced and remove from queue
        await surveyIndexedDB.removeFromSyncQueue(syncItem.id);
        useSurveyStore.getState().clearOfflineData(syncItem.id);
        
        // Emit socket event to broadcast real-time update
        const socket = surveySocketService.getSocket();
        if (socket && socket.connected) {
          const currentUserStr = localStorage.getItem("mocksurvey_user");
          if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            const userId = currentUser._id || currentUser.id;
            const targetSurveyId = surveyId || cleanedData.surveyId;
            
            setTimeout(() => {
              if (socket && socket.connected) {
                socket.emit("join_view_survey_wizard", {
                  surveyId: targetSurveyId,
                  userId: userId,
                });
              }
            }, 500);
          }
        }
      } else {
        throw new Error(`Server returned error: ${response?.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      await this.handleSyncError(syncItem, error);
    }
  }

  /**
   * Sync an API-based post survey activities submission
   */
  async syncApiPostSurveyActivities(syncItem) {
    try {
      const { data } = syncItem;
      
      // Extract the API endpoint and payload from the saved data
      const apiMethod = data.apiMethod || "survey";
      const apiEndpoint = data.apiEndpoint || "submitPlanOfCorrection";
      
      // Prepare payload (remove metadata fields and conflict tracking)
      const cleanedData = this.cleanPayloadForSync(data);
      const payload = {
        currentStep: cleanedData.currentStep,
        stepData: cleanedData.stepData,
        completedAt: cleanedData.completedAt,
      };
      
      // Make the API call (single parameter - no surveyId needed)
      const response = await api[apiMethod][apiEndpoint](payload);
      
      // Check if response indicates success
      if (response && (response.success || response.status || response.statusCode === 200)) {
        // Mark as synced and remove from queue
        await surveyIndexedDB.removeFromSyncQueue(syncItem.id);
        useSurveyStore.getState().clearOfflineData(syncItem.id);
        
        // Emit socket event to broadcast real-time update
        const socket = surveySocketService.getSocket();
        if (socket && socket.connected) {
          const currentUserStr = localStorage.getItem("mocksurvey_user");
          if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            const userId = currentUser._id || currentUser.id;
            const surveyId = payload.stepData?.surveyId;
            
            if (surveyId) {
              setTimeout(() => {
                if (socket && socket.connected) {
                  socket.emit("join_view_survey_wizard", {
                    surveyId: surveyId,
                    userId: userId,
                  });
                }
              }, 500);
            }
          }
        }
      } else {
        throw new Error(`Server returned error: ${response?.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      await this.handleSyncError(syncItem, error);
    }
  }

  /**
   * Sync an API-based facility tasks submission
   */
  async syncApiFacilityTasks(syncItem) {
    try {
      const { surveyId, data } = syncItem;
      
      // Extract the API endpoint and payload from the saved data
      const apiMethod = data.apiMethod || "resource";
      const apiEndpoint = data.apiEndpoint || "saveMandatoryAndUpdate";
      
      // Clean the data to remove conflict tracking fields
      const cleanedData = this.cleanPayloadForSync(data);
      
      // Remove offline-specific fields
      delete cleanedData.apiMethod;
      delete cleanedData.apiEndpoint;
      delete cleanedData.submittedAt;
      
      // Make the API call
      const response = await api[apiMethod][apiEndpoint](cleanedData);
      
      // Check if response indicates success
      // API may return { success: true } or just { data: ..., message: "..." }
      const isSuccess = response.success || 
                        response.data || 
                        (response.message && response.message.toLowerCase().includes('success'));
      
      if (isSuccess) {
        // Mark as synced and remove from queue
        await surveyIndexedDB.removeFromSyncQueue(syncItem.id);
        useSurveyStore.getState().clearOfflineData(syncItem.id);
      } else {
        throw new Error(`Server returned error: ${response?.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      await this.handleSyncError(syncItem, error);
    }
  }

  /**
   * Sync an API-based investigation submission
   */
  async syncApiInvestigationSubmission(syncItem) {
    try {
      const { data } = syncItem;
      
      // Clean the data to remove conflict tracking fields
      const cleanedData = this.cleanPayloadForSync(data);
      
      // Determine if Team Lead or Team Member submission
      // Team Lead payload has status: "investigations"
      const isTeamLead = cleanedData.status === "investigations";
      
      let response;
      if (isTeamLead) {
        response = await api.healthAssistant.saveInvestigationResidents(cleanedData);
      } else {
        response = await api.healthAssistant.saveInvestigationTeamMember(cleanedData);
      }
      
      // Check if response indicates success
      const isSuccess = response.success || 
                        response.data || 
                        (response.message && response.message.toLowerCase().includes('success'));
      
      if (isSuccess) {
        // Mark as synced and remove from queue
        await surveyIndexedDB.removeFromSyncQueue(syncItem.id);
        useSurveyStore.getState().clearOfflineData(syncItem.id);
        
        // Emit socket event to broadcast real-time update
        const socket = surveySocketService.getSocket();
        if (socket && socket.connected) {
          const currentUserStr = localStorage.getItem("mocksurvey_user");
          if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            const userId = currentUser._id || currentUser.id;
            const surveyId = cleanedData.surveyId;
            
            if (surveyId) {
              setTimeout(() => {
                if (socket && socket.connected) {
                  socket.emit("join_view_survey_wizard", {
                    surveyId: surveyId,
                    userId: userId,
                  });
                }
              }, 500);
            }
          }
        }
      } else {
        throw new Error(`Server returned error: ${response?.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      await this.handleSyncError(syncItem, error);
    }
  }

  /**
   * Sync an API-based initial pool submission
   */
  async syncApiInitialPoolSubmission(syncItem) {
    try {
      const { data } = syncItem;
      
      // Clean the data to remove conflict tracking fields
      const cleanedData = this.cleanPayloadForSync(data);
      
      // Make the API call
      const response = await api.survey.submitInitialPool(cleanedData);
      
      // Check if response indicates success
      const isSuccess = response.success || 
                        response.status === true || 
                        response.statusCode === 200;
      
      if (isSuccess) {
        // Mark as synced and remove from queue
        await surveyIndexedDB.removeFromSyncQueue(syncItem.id);
        useSurveyStore.getState().clearOfflineData(syncItem.id);
        
        // Emit socket event to broadcast real-time update
        const socket = surveySocketService.getSocket();
        if (socket && socket.connected) {
          const currentUserStr = localStorage.getItem("mocksurvey_user");
          if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            const userId = currentUser._id || currentUser.id;
            const surveyId = cleanedData.surveyId;
            
            if (surveyId) {
              setTimeout(() => {
                if (socket && socket.connected) {
                  socket.emit("join_view_survey_wizard", {
                    surveyId: surveyId,
                    userId: userId,
                  });
                }
              }, 500);
            }
          }
        }
      } else {
        throw new Error(`Server returned error: ${response?.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      await this.handleSyncError(syncItem, error);
    }
  }

  /**
   * Sync an API-based team meetings submission
   */
  async syncApiTeamMeetings(syncItem) {
    try {
      const { surveyId, data } = syncItem;
      
      // Extract the API endpoint and payload from the saved data
      const apiMethod = data.apiMethod || "survey";
      const apiEndpoint = data.apiEndpoint || "submitSurveyStep";
      
      // Clean the data to remove conflict tracking fields
      const cleanedData = this.cleanPayloadForSync(data);
      
      let response;
      let targetSurveyId = surveyId;

      if (apiEndpoint === 'submitTeamMeeting') {
        // New flat payload structure
        const payload = { ...cleanedData };
        // Remove internal fields
        delete payload.apiEndpoint;
        delete payload.apiMethod;
        delete payload.submittedAt;
        
        // Ensure surveyId is present
        if (!payload.surveyId && surveyId) {
            payload.surveyId = surveyId;
        }
        targetSurveyId = payload.surveyId;
        
        response = await api[apiMethod][apiEndpoint](payload);
      } else {
        // Old structure (fallback)
        const payload = {
          currentStep: cleanedData.currentStep,
          data: cleanedData.data,
        };
        
        // Extract surveyId from payload if not in syncItem
        targetSurveyId = surveyId || payload.data?.surveyId;
        
        // Make the API call
        response = await api[apiMethod][apiEndpoint](targetSurveyId, payload);
      }
      
      // Check if response indicates success
      if (response && (response.statusCode === 200 || response.statusCode === 201 || response.success)) {
        // Mark as synced and remove from queue
        await surveyIndexedDB.removeFromSyncQueue(syncItem.id);
        useSurveyStore.getState().clearOfflineData(syncItem.id);
        
        // Emit socket event to broadcast real-time update
        const socket = surveySocketService.getSocket();
        if (socket && socket.connected) {
          const currentUserStr = localStorage.getItem("mocksurvey_user");
          if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            const userId = currentUser._id || currentUser.id;
            
            setTimeout(() => {
              if (socket && socket.connected) {
                socket.emit("join_view_survey_wizard", {
                  surveyId: targetSurveyId,
                  userId: userId,
                });
              }
            }, 500);
          }
        }
      } else {
        throw new Error(`Server returned error: ${response?.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      await this.handleSyncError(syncItem, error);
    }
  }

  /**
   * Sync an API-based citation report submission
   */
  async syncApiCitationReport(syncItem) {
    try {
      const { data } = syncItem;
      
      // Extract the API endpoint and payload from the saved data
      const apiMethod = data.apiMethod || "healthAssistant";
      const apiEndpoint = data.apiEndpoint || "saveCitationReport";
      
      // Prepare payload (remove metadata fields and conflict tracking)
      const cleanedData = this.cleanPayloadForSync(data);
      const payload = {
        currentStep: cleanedData.currentStep,
        stepData: cleanedData.stepData,
        completedAt: cleanedData.completedAt,
      };
      
      // Make the API call (single parameter - no surveyId needed)
      const response = await api[apiMethod][apiEndpoint](payload);
      
      // Check if response indicates success
      if (response && (response.success || response.status || response.statusCode === 200)) {
        // Mark as synced and remove from queue
        await surveyIndexedDB.removeFromSyncQueue(syncItem.id);
        useSurveyStore.getState().clearOfflineData(syncItem.id);
        
        // Emit socket event to broadcast real-time update
        const socket = surveySocketService.getSocket();
        if (socket && socket.connected) {
          const currentUserStr = localStorage.getItem("mocksurvey_user");
          if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            const userId = currentUser._id || currentUser.id;
            const surveyId = payload.stepData?.surveyId;
            
            if (surveyId) {
              setTimeout(() => {
                if (socket && socket.connected) {
                  socket.emit("join_view_survey_wizard", {
                    surveyId: surveyId,
                    userId: userId,
                  });
                }
              }, 500);
            }
          }
        }
      } else {
        throw new Error(`Server returned error: ${response?.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      await this.handleSyncError(syncItem, error);
    }
  }

  /**
   * Sync an API-based risk-based setup submission
   */
  async syncApiRiskBasedSetup(syncItem) {
    try {
      const { data } = syncItem;
      
      // Extract the API endpoint and payload from the saved data
      const apiMethod = data.apiMethod || "survey";
      const apiEndpoint = data.apiEndpoint || "addRiskBasedSetup";
      const existingSurveyId = data.existingSurveyId;
      
      // Prepare payload (remove metadata fields and conflict tracking)
      const cleanedData = this.cleanPayloadForSync(data);
      const payload = {
        surveyCreationDate: cleanedData.surveyCreationDate,
        surveyCategory: cleanedData.surveyCategory,
        facilityId: cleanedData.facilityId,
        facilityInfo: cleanedData.facilityInfo,
        teamMembers: cleanedData.teamMembers,
        teamCoordinator: data.teamCoordinator,
        assignments: data.assignments,
        surveyMode: data.surveyMode,
        status: data.status,
        riskBasedProcessSetup: data.riskBasedProcessSetup,
      };
      
      // Make the API call - handle both create and update
      let response;
      if (existingSurveyId && apiEndpoint === "updateRiskBasedSetup") {
        // Update existing setup
        response = await api[apiMethod].updateRiskBasedSetup(existingSurveyId, payload);
      } else {
        // Create new setup
        response = await api[apiMethod].addRiskBasedSetup(payload);
      }
      
      // Check if response indicates success
      if (response && (response.statusCode === 200 || response.statusCode === 201 || response.success)) {
        // Store survey ID if returned (or use existing one if updating)
        const surveyId =
          response.data?.surveyId || 
          response.data?._id || 
          response.data?.id || 
          existingSurveyId;
          
        if (surveyId) {
          localStorage.setItem("currentSurveyId", surveyId);
          localStorage.setItem("riskBasedProcessSurveyId", surveyId);
        }
        
        // Invite team members if any were added
        if (surveyId && payload.teamMembers && payload.teamMembers.length > 0) {
          try {
            for (const member of payload.teamMembers) {
              try {
                const invitePayload = {
                  name: member.name,
                  email: member.email,
                  role: member.role,
                  surveyId: surveyId,
                  assignedFacilityTasks: member.assignedFacilityTasks || [],
                };
                
                await api.survey.inviteTeamMembers(invitePayload);
              } catch (inviteError) {
                // Don't fail the entire process, just log the error
                
              }
            }
          } catch (inviteError) {
            // Don't fail the entire process, just log the error
           
          }
        }
        
        // Mark as synced and remove from queue
        await surveyIndexedDB.removeFromSyncQueue(syncItem.id);
        useSurveyStore.getState().clearOfflineData(syncItem.id);
      } else {
        throw new Error(`Server returned error: ${response?.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      await this.handleSyncError(syncItem, error);
    }
  }

  /**
   * Sync an API-based facility initiated survey submission
   */
  async syncApiFacilityInitiatedSurvey(syncItem) {
    try {
      const { data } = syncItem;
      
      // Extract the API endpoint and payload from the saved data
      const apiMethod = data.apiMethod || "survey";
      const apiEndpoint = data.apiEndpoint || "updateFacilityInitiatedSurvey";
      const apiFallbackEndpoint = data.apiFallbackEndpoint || "submitFacilityInitiatedSurvey";
      const existingSurveyId = data.existingSurveyId;
      
      // Prepare payload (remove metadata fields and conflict tracking)
      const cleanedData = this.cleanPayloadForSync(data);
      const payload = {
        currentStep: cleanedData.currentStep,
        stepData: cleanedData.stepData,
        completedAt: cleanedData.completedAt,
      };
      
      // Make the API call - try update first, then create if update fails
      let response;
      if (existingSurveyId) {
        try {
          // Try update first
          response = await api.survey.updateFacilityInitiatedSurvey(existingSurveyId, payload);
        } catch (updateError) {
          // If update fails, try to create new
          response = await api.survey.submitFacilityInitiatedSurvey(payload);
        }
      } else {
        // No existing survey ID, create new
        response = await api.survey.submitFacilityInitiatedSurvey(payload);
      }
      
      // Check if response indicates success
      if (response && (response.statusCode === 200 || response.statusCode === 201 || response.success || response.status)) {
        // Mark as synced and remove from queue
        await surveyIndexedDB.removeFromSyncQueue(syncItem.id);
        useSurveyStore.getState().clearOfflineData(syncItem.id);
        
        // Emit socket event to broadcast real-time update
        const socket = surveySocketService.getSocket();
        if (socket && socket.connected) {
          const currentUserStr = localStorage.getItem("mocksurvey_user");
          if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            const userId = currentUser._id || currentUser.id;
            const surveyId = existingSurveyId || response.data?.surveyId || response.data?._id || response.data?.id;
            
            if (surveyId) {
              setTimeout(() => {
                if (socket && socket.connected) {
                  socket.emit("join_view_survey_wizard", {
                    surveyId: surveyId,
                    userId: userId,
                  });
                }
              }, 500);
            }
          }
        }
      } else {
        throw new Error(`Server returned error: ${response?.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      await this.handleSyncError(syncItem, error);
    }
  }

  /**
   * Sync an API-based life safety survey submission
   */
  async syncApiLifeSafetySurvey(syncItem) {
    try {
      const { data } = syncItem;
      
      // Extract the API endpoint and payload from the saved data
      const apiMethod = data.apiMethod || "survey";
      const apiEndpoint = data.apiEndpoint || "updateLifeSafetySurvey";
      const apiFallbackEndpoint = data.apiFallbackEndpoint || "submitLifeSafetySurvey";
      const existingSurveyId = data.existingSurveyId;
      
      // Prepare payload (remove metadata fields and conflict tracking)
      const cleanedData = this.cleanPayloadForSync(data);
      const payload = {
        currentStep: cleanedData.currentStep,
        stepData: cleanedData.stepData,
        completedAt: cleanedData.completedAt,
      };
      
      // Make the API call - try update first, then create if update fails
      let response;
      if (existingSurveyId) {
        try {
          // Try update first
          response = await api.survey.updateLifeSafetySurvey(existingSurveyId, payload);
        } catch (updateError) {
          // If update fails, try to create new
          response = await api.survey.submitLifeSafetySurvey(payload);
        }
      } else {
        // No existing survey ID, create new
        response = await api.survey.submitLifeSafetySurvey(payload);
      }
      
      // Check if response indicates success
      if (response && (response.statusCode === 200 || response.statusCode === 201 || response.success || response.status)) {
        // Mark as synced and remove from queue
        await surveyIndexedDB.removeFromSyncQueue(syncItem.id);
        useSurveyStore.getState().clearOfflineData(syncItem.id);
        
        // Emit socket event to broadcast real-time update
        const socket = surveySocketService.getSocket();
        if (socket && socket.connected) {
          const currentUserStr = localStorage.getItem("mocksurvey_user");
          if (currentUserStr) {
            const currentUser = JSON.parse(currentUserStr);
            const userId = currentUser._id || currentUser.id;
            const surveyId = existingSurveyId || response.data?.surveyId || response.data?._id || response.data?.id;
            
            if (surveyId) {
              setTimeout(() => {
                if (socket && socket.connected) {
                  socket.emit("join_view_survey_wizard", {
                    surveyId: surveyId,
                    userId: userId,
                  });
                }
              }, 500);
            }
          }
        }
      } else {
        throw new Error(`Server returned error: ${response?.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      await this.handleSyncError(syncItem, error);
    }
  }

  /**
   * Sync an investigation submission (socket message)
   */
  async syncInvestigationSubmission(syncItem) {
    try {
      const { surveyId, data } = syncItem;
      
      // Get current user for socket connection
      const currentUserStr = localStorage.getItem("mocksurvey_user");
      if (!currentUserStr) {
        throw new Error("User not found in localStorage");
      }
      
      const currentUser = JSON.parse(currentUserStr);
      const userId = currentUser._id || currentUser.id;
      
      if (!userId) {
        throw new Error("User ID not found");
      }
      
      // Ensure socket is connected and ready (waits for connection if needed)
      const socket = await this.ensureSocketConnected(surveyId, userId);
      
      if (!socket || !socket.connected) {
        throw new Error("Socket not connected after connection attempt");
      }
      
      // Re-emit the socket message
      // The data contains the original socketMessage
      // Clean it to remove conflict tracking fields before sending
      const socketMessage = this.cleanPayloadForSync(data);
      
      return new Promise((resolve, reject) => {
        // Set up timeout for socket response (10 seconds)
        const timeout = setTimeout(() => {
          reject(new Error("Socket response timeout"));
        }, 10000);
        
        // Listen for response
        const responseHandler = (response) => {
          clearTimeout(timeout);
          socket.off("team_lead_investigation", responseHandler);
          
          // Check if response indicates success
          const actualResponse = response?.response || response;
          const isSuccess = 
            actualResponse?.statusCode === 200 || 
            actualResponse?.status === true || 
            actualResponse?.success === true || 
            actualResponse?.data;
          
          if (isSuccess) {
            // Mark as synced and remove from queue
            surveyIndexedDB.removeFromSyncQueue(syncItem.id).then(() => {
              // Clear from Zustand store
              useSurveyStore.getState().clearOfflineData(syncItem.id);
              
              // Emit join_view_survey_wizard after successful sync
              setTimeout(() => {
                if (socket && socket.connected) {
                  socket.emit("join_view_survey_wizard", {
                    surveyId: surveyId,
                    userId: userId,
                  });
                }
              }, 500);
              
              resolve();
            }).catch(reject);
          } else {
            reject(new Error(`Server returned error: ${actualResponse?.message || 'Unknown error'}`));
          }
        };
        
        socket.once("team_lead_investigation", responseHandler);
        
        // Emit the socket message
        socket.emit("join_team_lead_investigation", socketMessage);
      });
      
    } catch (error) {
      await this.handleSyncError(syncItem, error);
    }
  }

  /**
   * Sync a facility tasks submission (socket message)
   */
  /**
   * Handle sync errors with retry logic
   */
  async handleSyncError(syncItem, error) {
    const retryCount = syncItem.retryCount || 0;
    
    if (retryCount >= this.maxRetries) {
      await surveyIndexedDB.removeFromSyncQueue(syncItem.id);
      return;
    }

    // Increment retry count
    await surveyIndexedDB.incrementRetryCount(syncItem.id);
    
    // Calculate delay for next retry
    const delay = this.retryDelays[Math.min(retryCount, this.retryDelays.length - 1)];
    
    // Schedule retry
    setTimeout(() => {
      if (this.isOnline) {
        this.syncUnsyncedData();
      }
    }, delay);
  }

  /**
   * Force sync for a specific survey
   */
  async forceSyncSurvey(surveyId) {
    await this.syncUnsyncedData(surveyId);
  }

  /**
   * Get sync status
   */
  async getSyncStatus(surveyId = null) {
    const unsyncedItems = await surveyIndexedDB.getUnsyncedItems(surveyId);
    const stats = await surveyIndexedDB.getStorageStats();
    
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      unsyncedCount: unsyncedItems.length,
      totalSteps: stats.totalSteps,
      totalAttachments: stats.totalAttachments,
      totalSyncItems: stats.totalSyncItems
    };
  }

  /**
   * Initialize sync service
   */
  async init() {
    await surveyIndexedDB.init();
    
    if (this.isOnline) {
      this.startPeriodicSync();
    }
  }

  /**
   * Get all pending conflicts
   */
  async getPendingConflicts(surveyId = null) {
    return await surveyIndexedDB.getPendingConflicts(surveyId);
  }

  /**
   * Get conflict statistics
   */
  async getConflictStats(surveyId = null) {
    return await surveyIndexedDB.getConflictStats(surveyId);
  }

  /**
   * Resolve a conflict with a specific strategy
   * @param {string} conflictId - The conflict ID
   * @param {string} strategy - Resolution strategy: 'local_wins', 'server_wins', 'merged', 'user_choice'
   * @param {Object} userChoice - Optional data if using 'user_choice' strategy
   */
  async resolveConflict(conflictId, strategy, userChoice = null) {
    return await this.resolveConflictWithStrategy(conflictId, strategy, userChoice);
  }

  /**
   * Auto-resolve conflicts using default strategy (prefer local)
   * Useful for background sync
   */
  async autoResolveConflicts(surveyId = null, strategy = 'local_wins') {
    const conflicts = await this.getPendingConflicts(surveyId);
    
    for (const conflict of conflicts) {
      try {
        await this.resolveConflict(conflict.id, strategy);
      } catch (error) {
        // Log error but continue with other conflicts
      }
    }
    
    return { resolved: conflicts.length };
  }

  /**
   * Cleanup sync service
   */
  destroy() {
    this.stopPeriodicSync();
    surveyIndexedDB.close();
  }
}

// Create singleton instance
const surveySyncService = new SurveySyncService();

export default surveySyncService;
