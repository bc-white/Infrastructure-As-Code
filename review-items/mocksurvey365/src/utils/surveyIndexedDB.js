/**
 * IndexedDB service for survey data management using Dexie.js
 * Replaces localStorage with IndexedDB for better handling of large survey data
 * Features: per-step persistence, compression, blob storage, incremental sync
 */

import Dexie, { liveQuery } from 'dexie';
import LZString from 'lz-string';

const DB_NAME = 'MockSurvey365DB';
const DB_VERSION = 2; // Incremented for conflict handling schema

// Define the database schema using Dexie
class SurveyDatabase extends Dexie {
  constructor() {
    super(DB_NAME);
    
    this.version(1).stores({
      surveySteps: 'id, surveyId, stepIndex, updatedAt',
      surveyMetadata: 'surveyId, createdAt, updatedAt',
      attachments: 'id, surveyId, stepId',
      syncQueue: 'id, surveyId, retryCount, createdAt'
    });
    
    // Version 2: Add conflict tracking fields
    this.version(2).stores({
      surveySteps: 'id, surveyId, stepIndex, updatedAt',
      surveyMetadata: 'surveyId, createdAt, updatedAt',
      attachments: 'id, surveyId, stepId',
      syncQueue: 'id, surveyId, retryCount, createdAt, serverVersion, lastServerSyncAt',
      conflicts: 'id, surveyId, stepId, type, createdAt, resolvedAt'
    });
  }
}

// Create database instance
const db = new SurveyDatabase();

class SurveyIndexedDB {
  constructor() {
    this._db = db;
  }

  /**
   * Get database instance
   */
  get db() {
    return this._db;
  }

  /**
   * Initialize IndexedDB connection (Dexie handles this automatically)
   */
  async init() {
    // Dexie automatically initializes, but we can ensure it's ready
    await this._db.open();
    return this._db;
  }

  /**
   * Compress JSON data using LZ-String
   */
  compressData(data) {
    try {
      const jsonString = JSON.stringify(data);
      return LZString.compress(jsonString);
    } catch (error) {
      return JSON.stringify(data);
    }
  }

  /**
   * Decompress data using LZ-String
   */
  decompressData(compressedData) {
    try {
      return JSON.parse(LZString.decompress(compressedData));
    } catch (error) {
      return JSON.parse(compressedData);
    }
  }

  /**
   * Save survey step data
   */
  async saveSurveyStep(surveyId, stepIndex, stepData, isCompressed = true) {
    await this.init();
    
    const stepRecord = {
      id: `${surveyId}_step_${stepIndex}`,
      surveyId,
      stepIndex,
      data: isCompressed ? this.compressData(stepData) : stepData,
      isCompressed,
      updatedAt: new Date().toISOString(),
      synced: false
    };

    await this._db.surveySteps.put(stepRecord);
    return stepRecord;
  }

  /**
   * Get survey step data
   */
  async getSurveyStep(surveyId, stepIndex) {
    await this.init();
    
    const stepRecord = await this._db.surveySteps.get(`${surveyId}_step_${stepIndex}`);
    
    if (!stepRecord) {
      return null;
    }

    const stepData = stepRecord.isCompressed 
      ? this.decompressData(stepRecord.data)
      : stepRecord.data;
    
    return stepData;
  }

  /**
   * Get survey step data reactively using liveQuery
   * Returns an observable that updates when data changes
   * @param {string} surveyId - Survey ID
   * @param {string} stepIndex - Step index
   * @returns {Observable} Observable that emits step data
   */
  observeSurveyStep(surveyId, stepIndex) {
    return liveQuery(async () => {
      await this.init();
      
      const stepRecord = await this._db.surveySteps.get(`${surveyId}_step_${stepIndex}`);
      
      if (!stepRecord) {
        return null;
      }

      const stepData = stepRecord.isCompressed 
        ? this.decompressData(stepRecord.data)
        : stepRecord.data;
      
      return stepData;
    });
  }

  /**
   * Observe all survey steps for a survey reactively
   * @param {string} surveyId - Survey ID
   * @returns {Observable} Observable that emits array of step data
   */
  observeAllSurveySteps(surveyId) {
    return liveQuery(async () => {
      await this.init();
      
      const steps = await this._db.surveySteps
        .where('surveyId')
        .equals(surveyId)
        .toArray();
      
      return steps.map(step => ({
        ...step,
        data: step.isCompressed ? this.decompressData(step.data) : step.data
      }));
    });
  }

  /**
   * Observe investigation data reactively
   * @param {string} surveyId - Survey ID
   * @returns {Observable} Observable that emits investigation data
   */
  observeInvestigationData(surveyId) {
    return liveQuery(async () => {
      await this.init();
      
      const stepRecord = await this._db.surveySteps.get(`${surveyId}_step_investigations`);
      
      if (!stepRecord) {
        return null;
      }

      const stepData = stepRecord.isCompressed 
        ? this.decompressData(stepRecord.data)
        : stepRecord.data;
      
      return stepData;
    });
  }

  /**
   * Observe sync queue items reactively
   * @param {string} surveyId - Optional survey ID to filter
   * @returns {Observable} Observable that emits array of sync items
   */
  observeSyncQueue(surveyId = null) {
    return liveQuery(async () => {
      await this.init();
      
      let query = this._db.syncQueue.where('retryCount').below(5);
      
      if (surveyId) {
        query = query.filter(item => item.surveyId === surveyId);
      }
      
      return await query.toArray();
    });
  }

  /**
   * Observe pending conflicts reactively
   * @param {string} surveyId - Optional survey ID to filter
   * @returns {Observable} Observable that emits array of conflicts
   */
  observePendingConflicts(surveyId = null) {
    return liveQuery(async () => {
      await this.init();
      
      let query = this._db.conflicts.where('status').equals('pending');
      
      if (surveyId) {
        query = query.filter(conflict => conflict.surveyId === surveyId);
      }
      
      return await query.toArray();
    });
  }

  /**
   * Get all steps for a survey
   */
  async getAllSurveySteps(surveyId) {
    await this.init();
    
    const steps = await this.db.surveySteps
      .where('surveyId')
      .equals(surveyId)
      .toArray();
    
    return steps.map(step => ({
      ...step,
      data: step.isCompressed ? this.decompressData(step.data) : step.data
    }));
  }

  /**
   * Save survey metadata
   */
  async saveSurveyMetadata(surveyId, metadata) {
    await this.init();
    
    const metadataRecord = {
      surveyId,
      ...metadata,
      updatedAt: new Date().toISOString()
    };

    await this._db.surveyMetadata.put(metadataRecord);
    return metadataRecord;
  }

  /**
   * Get survey metadata
   */
  async getSurveyMetadata(surveyId) {
    await this.init();
    
    return await this._db.surveyMetadata.get(surveyId);
  }

  /**
   * Save attachment as blob
   */
  async saveAttachment(surveyId, stepId, fileId, fileBlob, metadata = {}) {
    await this.init();
    
    const attachmentRecord = {
      id: `${surveyId}_${stepId}_${fileId}`,
      surveyId,
      stepId,
      fileId,
      blob: fileBlob,
      metadata,
      uploadedAt: new Date().toISOString(),
      synced: false
    };

    await this._db.attachments.put(attachmentRecord);
    return attachmentRecord;
  }

  /**
   * Get attachment blob
   */
  async getAttachment(surveyId, stepId, fileId) {
    await this.init();
    
    return await this._db.attachments.get(`${surveyId}_${stepId}_${fileId}`);
  }

  /**
   * Add item to sync queue with version tracking for conflict detection
   */
  async addToSyncQueue(surveyId, stepId, data, type = 'step', options = {}) {
    await this.init();
    
    const now = new Date().toISOString();
    const timestamp = Date.now();
    
    // Check if there's an existing item for this survey/step combination
    const existingItems = await this._db.syncQueue
      .where('surveyId')
      .equals(surveyId)
      .filter(item => item.stepId === stepId && item.type === type)
      .toArray();
    
    // If updating existing item, preserve server version info
    let serverVersion = options.serverVersion || null;
    let lastServerSyncAt = options.lastServerSyncAt || null;
    
    if (existingItems.length > 0) {
      const existing = existingItems[0];
      // Preserve server version if it exists
      if (existing.serverVersion) {
        serverVersion = existing.serverVersion;
      }
      if (existing.lastServerSyncAt) {
        lastServerSyncAt = existing.lastServerSyncAt;
      }
      // Remove old items for same step (keep only latest)
      const oldIds = existingItems.map(item => item.id);
      await this._db.syncQueue.bulkDelete(oldIds);
    }
    
    const syncItem = {
      id: `${surveyId}_${stepId}_${timestamp}`,
      surveyId,
      stepId,
      type,
      data,
      retryCount: 0,
      createdAt: now,
      lastRetryAt: null,
      // Conflict tracking fields
      serverVersion: serverVersion, // Server's version/timestamp when this was last synced
      lastServerSyncAt: lastServerSyncAt, // When we last successfully synced with server
      localVersion: timestamp, // Local version (timestamp when saved offline)
      conflictStatus: null, // 'none', 'detected', 'resolved', 'pending'
      conflictResolution: null // 'local_wins', 'server_wins', 'merged', 'user_choice'
    };

    await this._db.syncQueue.put(syncItem);
    return syncItem;
  }

  /**
   * Get unsynced items from sync queue
   */
  async getUnsyncedItems(surveyId = null) {
    await this.init();
    
    let items;
    
    if (surveyId) {
      // Filter by both surveyId and retryCount
      items = await this.db.syncQueue
        .where('surveyId')
        .equals(surveyId)
        .filter(item => item.retryCount < 5) // Max 5 retries
        .toArray();
    } else {
      // Filter only by retryCount
      items = await this.db.syncQueue
        .where('retryCount')
        .below(5) // Max 5 retries
        .toArray();
    }
    
    return items;
  }

  /**
   * Mark step as synced
   */
  async markStepAsSynced(surveyId, stepIndex) {
    await this.init();
    
    const stepId = `${surveyId}_step_${stepIndex}`;
    const stepRecord = await this.db.surveySteps.get(stepId);
    
    if (stepRecord) {
      stepRecord.synced = true;
      await this._db.surveySteps.put(stepRecord);
    }
  }

  /**
   * Remove item from sync queue
   */
  async removeFromSyncQueue(itemId) {
    await this.init();
    
    await this._db.syncQueue.delete(itemId);
  }

  /**
   * Increment retry count for sync item
   */
  async incrementRetryCount(itemId) {
    await this.init();
    
    const syncItem = await this._db.syncQueue.get(itemId);
    
    if (syncItem) {
      syncItem.retryCount += 1;
      syncItem.lastRetryAt = new Date().toISOString();
      await this._db.syncQueue.put(syncItem);
    }
  }

  /**
   * Clear all data for a survey
   */
  async clearSurveyData(surveyId) {
    await this.init();
    
    // Clear steps
    await this._db.surveySteps
      .where('surveyId')
      .equals(surveyId)
      .delete();
    
    // Clear metadata
    await this._db.surveyMetadata.delete(surveyId);
    
    // Clear attachments
    await this._db.attachments
      .where('surveyId')
      .equals(surveyId)
      .delete();
    
    // Clear sync queue
    const syncItems = await this.db.syncQueue
      .where('surveyId')
      .equals(surveyId)
      .toArray();
    
    const syncIds = syncItems.map(item => item.id);
    await this._db.syncQueue.bulkDelete(syncIds);
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats() {
    await this.init();
    
    const stats = {
      totalSteps: await this._db.surveySteps.count(),
      totalAttachments: await this._db.attachments.count(),
      totalSyncItems: await this._db.syncQueue.count(),
      estimatedSize: 0
    };

    return stats;
  }

  /**
   * Check for conflicts by comparing local and server versions
   * @param {Object} syncItem - The sync item to check
   * @param {Object} serverData - Current server data with version info
   * @returns {Object} Conflict information
   */
  async detectConflict(syncItem, serverData) {
    await this.init();
    
    // If no server version info, no conflict (first sync)
    if (!serverData || !serverData.updatedAt) {
      return {
        hasConflict: false,
        reason: null,
        localVersion: syncItem.localVersion,
        serverVersion: null
      };
    }
    
    const serverVersion = new Date(serverData.updatedAt).getTime();
    const localVersion = syncItem.localVersion || new Date(syncItem.createdAt).getTime();
    const lastServerSync = syncItem.lastServerSyncAt 
      ? new Date(syncItem.lastServerSyncAt).getTime() 
      : 0;
    
    // Conflict exists if server was updated after we last synced
    const hasConflict = serverVersion > lastServerSync && serverVersion > localVersion;
    
    return {
      hasConflict,
      reason: hasConflict 
        ? `Server data was updated at ${serverData.updatedAt} after local save at ${new Date(localVersion).toISOString()}`
        : null,
      localVersion: new Date(localVersion).toISOString(),
      serverVersion: serverData.updatedAt,
      serverData: serverData,
      localData: syncItem.data
    };
  }

  /**
   * Record a conflict for user review
   */
  async recordConflict(syncItem, conflictInfo) {
    await this.init();
    
    const conflict = {
      id: `conflict_${syncItem.surveyId}_${syncItem.stepId}_${Date.now()}`,
      surveyId: syncItem.surveyId,
      stepId: syncItem.stepId,
      type: syncItem.type,
      syncItemId: syncItem.id,
      conflictInfo,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      resolution: null,
      status: 'pending'
    };
    
    await this._db.conflicts.put(conflict);
    
    // Update sync item conflict status
    syncItem.conflictStatus = 'detected';
    await this._db.syncQueue.put(syncItem);
    
    return conflict;
  }

  /**
   * Get all pending conflicts
   */
  async getPendingConflicts(surveyId = null) {
    await this.init();
    
    let query = this._db.conflicts.where('status').equals('pending');
    
    if (surveyId) {
      query = query.filter(conflict => conflict.surveyId === surveyId);
    }
    
    return await query.toArray();
  }

  /**
   * Resolve a conflict
   */
  async resolveConflict(conflictId, resolution, resolvedData = null) {
    await this.init();
    
    const conflict = await this._db.conflicts.get(conflictId);
    if (!conflict) {
      throw new Error('Conflict not found');
    }
    
    conflict.status = 'resolved';
    conflict.resolvedAt = new Date().toISOString();
    conflict.resolution = resolution;
    
    if (resolvedData) {
      conflict.resolvedData = resolvedData;
    }
    
    await this._db.conflicts.put(conflict);
    
    // Update sync item
    const syncItem = await this.db.syncQueue.get(conflict.syncItemId);
    if (syncItem) {
      syncItem.conflictStatus = 'resolved';
      syncItem.conflictResolution = resolution;
      
      // Update data if merged resolution
      if (resolution === 'merged' && resolvedData) {
        syncItem.data = resolvedData;
      }
      
      // Update server version after resolution
      if (conflict.conflictInfo?.serverVersion) {
        syncItem.serverVersion = new Date(conflict.conflictInfo.serverVersion).getTime();
        syncItem.lastServerSyncAt = new Date().toISOString();
      }
      
      await this._db.syncQueue.put(syncItem);
    }
    
    return conflict;
  }

  /**
   * Merge local and server data (simple field-level merge)
   * This is a basic implementation - can be customized per data type
   */
  mergeData(localData, serverData, strategy = 'prefer_local') {
    if (strategy === 'prefer_local') {
      return { ...serverData, ...localData };
    } else if (strategy === 'prefer_server') {
      return { ...localData, ...serverData };
    } else if (strategy === 'deep_merge') {
      // Deep merge - combine nested objects
      const merged = { ...serverData };
      for (const key in localData) {
        if (typeof localData[key] === 'object' && !Array.isArray(localData[key]) && localData[key] !== null) {
          merged[key] = this.mergeData(localData[key], serverData[key] || {}, 'deep_merge');
        } else {
          merged[key] = localData[key];
        }
      }
      return merged;
    } else {
      // Default: prefer local
      return { ...serverData, ...localData };
    }
  }

  /**
   * Update sync item with server version after successful sync
   */
  async updateSyncItemVersion(syncItemId, serverVersion, serverUpdatedAt) {
    await this.init();
    
    const syncItem = await this._db.syncQueue.get(syncItemId);
    if (syncItem) {
      syncItem.serverVersion = serverVersion || new Date(serverUpdatedAt).getTime();
      syncItem.lastServerSyncAt = new Date().toISOString();
      syncItem.conflictStatus = 'none';
      await this._db.syncQueue.put(syncItem);
    }
  }

  /**
   * Get conflict statistics
   */
  async getConflictStats(surveyId = null) {
    await this.init();
    
    let conflictsQuery = this._db.conflicts;
    if (surveyId) {
      conflictsQuery = conflictsQuery.where('surveyId').equals(surveyId);
    }
    
    const allConflicts = await conflictsQuery.toArray();
    
    return {
      total: allConflicts.length,
      pending: allConflicts.filter(c => c.status === 'pending').length,
      resolved: allConflicts.filter(c => c.status === 'resolved').length,
      byResolution: {
        local_wins: allConflicts.filter(c => c.resolution === 'local_wins').length,
        server_wins: allConflicts.filter(c => c.resolution === 'server_wins').length,
        merged: allConflicts.filter(c => c.resolution === 'merged').length
      }
    };
  }

  /**
   * Close database connection
   */
  close() {
    if (this._db && this._db.isOpen()) {
      this._db.close();
    }
  }
}

// Create singleton instance
const surveyIndexedDB = new SurveyIndexedDB();

export default surveyIndexedDB;

// Export individual methods for backward compatibility
export const {
  saveSurveyStep,
  getSurveyStep,
  getAllSurveySteps,
  saveSurveyMetadata,
  getSurveyMetadata,
  saveAttachment,
  getAttachment,
  addToSyncQueue,
  getUnsyncedItems,
  markStepAsSynced,
  removeFromSyncQueue,
  incrementRetryCount,
  clearSurveyData,
  getStorageStats,
  detectConflict,
  recordConflict,
  getPendingConflicts,
  resolveConflict,
  mergeData,
  updateSyncItemVersion,
  getConflictStats,
  observeSurveyStep,
  observeAllSurveySteps,
  observeInvestigationData,
  observeSyncQueue,
  observePendingConflicts
} = surveyIndexedDB;

// Export liveQuery for direct use
export { liveQuery };
