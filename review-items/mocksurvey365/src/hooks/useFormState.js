import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing form state with dirty tracking and websocket update protection
 * 
 * This hook separates "server state" from "user state" to prevent websocket updates
 * from overwriting in-progress user edits.
 * 
 * Features:
 * - Separates serverData (from API/websocket) from formData (user edits)
 * - Tracks isDirty state to know when user is editing
 * - Tracks pendingRemoteUpdate when server data arrives while user is editing
 * - Persists to localStorage to survive page reloads
 * - Restores from localStorage on mount
 * - Version-based update acceptance (scalable approach)
 */ 
export function useFormState(initialData = null, storageKey = 'formState') {
  // Server data - the "source of truth" from backend/websocket
  const [serverData, setServerData] = useState(initialData);
  
  // Form data - what the user is currently editing
  const [formData, setFormData] = useState(initialData);
  
  // Tracks if user has unsaved changes
  const [isDirty, setIsDirty] = useState(false);
  
  // Tracks if a remote update arrived while user was editing
  const [pendingRemoteUpdate, setPendingRemoteUpdate] = useState(false);
  
  // Track last server version (e.g., updatedAt timestamp or version number)
  const [lastServerVersion, setLastServerVersion] = useState(null);
  
  // Ref to track if we've restored from localStorage (prevent overwriting on initial load)
  const hasRestoredRef = useRef(false);
  
  // Version-based acceptance: When accepting updates, we set a minimum version to accept
  // Any update with version >= this minimum will be applied immediately
  // This is more scalable than timeout-based flags
  const minAcceptVersionRef = useRef(null);

  // Track when we accepted an update to maintain acceptance window
  const acceptedUpdateTimestampRef = useRef(null);
  const ACCEPTANCE_WINDOW_MS = 5000; // 5 second window after accepting updates
  
  // Restore from localStorage on mount - MUST run before any server data initialization
  // This runs synchronously during render to ensure it happens first
  useEffect(() => {
    if (hasRestoredRef.current) return;
    
    try {
      const storedFormData = localStorage.getItem(`${storageKey}_formData`);
      const storedServerData = localStorage.getItem(`${storageKey}_serverData`);
      const storedIsDirty = localStorage.getItem(`${storageKey}_isDirty`);
      const storedPendingUpdate = localStorage.getItem(`${storageKey}_pendingRemoteUpdate`);
      const storedServerVersion = localStorage.getItem(`${storageKey}_lastServerVersion`);
      
      if (storedFormData) {
        const parsed = JSON.parse(storedFormData);
        setFormData(parsed);
        
        // Also restore serverData if available (for comparison)
        if (storedServerData) {
          try {
            const parsedServerData = JSON.parse(storedServerData);
            setServerData(parsedServerData);
          } catch (e) {
            // If serverData restore fails, use formData as fallback
            setServerData(parsed);
          }
        } else {
          // If no serverData stored, use formData as serverData
          setServerData(parsed);
        }
        
        // If we have dirty state, restore it - this is critical!
        if (storedIsDirty === 'true') {
          setIsDirty(true);
        }
        
        // If we have pending update, restore it
        if (storedPendingUpdate === 'true') {
          setPendingRemoteUpdate(true);
        }
        
        // Restore server version
        if (storedServerVersion) {
          setLastServerVersion(storedServerVersion);
        }
      }
      
      hasRestoredRef.current = true;
    } catch (error) {
      hasRestoredRef.current = true; // Mark as restored even on error to prevent loops
    }
  }, [storageKey]);
  
  // Persist to localStorage whenever formData, serverData, isDirty, or pendingRemoteUpdate changes
  useEffect(() => {
    if (!hasRestoredRef.current) return; // Don't persist before initial restore
    
    try {
      if (formData !== null) {
        localStorage.setItem(`${storageKey}_formData`, JSON.stringify(formData));
      }
      if (serverData !== null) {
        localStorage.setItem(`${storageKey}_serverData`, JSON.stringify(serverData));
      }
      localStorage.setItem(`${storageKey}_isDirty`, String(isDirty));
      localStorage.setItem(`${storageKey}_pendingRemoteUpdate`, String(pendingRemoteUpdate));
      if (lastServerVersion !== null) {
        localStorage.setItem(`${storageKey}_lastServerVersion`, String(lastServerVersion));
      }
    } catch (error) {
      // Error persisting form state
    }
  }, [formData, serverData, isDirty, pendingRemoteUpdate, lastServerVersion, storageKey]);
  
  /**
   * Compare two versions to determine which is newer
   * Supports timestamps (ISO strings, numbers) and version numbers
   */
  const compareVersions = useCallback((version1, version2) => {
    if (!version1 && !version2) return 0;
    if (!version1) return -1; // version2 is newer
    if (!version2) return 1;  // version1 is newer
    
    // Try to parse as dates (ISO strings or timestamps)
    const date1 = new Date(version1).getTime();
    const date2 = new Date(version2).getTime();
    
    // If both are valid dates, compare them
    if (!isNaN(date1) && !isNaN(date2)) {
      return date1 - date2; // Negative if version1 < version2 (version2 is newer)
    }
    
    // Fallback to string/number comparison
    if (typeof version1 === 'number' && typeof version2 === 'number') {
      return version1 - version2;
    }
    
    // String comparison
    return String(version1).localeCompare(String(version2));
  }, []);
  
  /**
   * Receive new data from server/websocket
   * Only applies to formData if user is NOT editing
   */
  const receiveServerData = useCallback((newData, version = null) => {
    // Extract version from data if not provided
    const dataVersion = version || newData?.updatedAt || newData?.version || newData?._id;

    // Update serverData for comparison (always do this)
    setServerData(newData);

    if (dataVersion) {
      setLastServerVersion(dataVersion);
    }

    // SCALABLE APPROACH: Version-based acceptance with time window
    // Check if we're within the acceptance window (5 seconds after user clicked "Accept")
    const isWithinAcceptanceWindow = acceptedUpdateTimestampRef.current !== null &&
      (Date.now() - acceptedUpdateTimestampRef.current) < ACCEPTANCE_WINDOW_MS;

    if (minAcceptVersionRef.current !== null || isWithinAcceptanceWindow) {
      // When in acceptance mode or within acceptance window, apply all updates immediately
      // This ensures that multiple WebSocket messages after accepting don't revert the data
      setFormData(newData);
      setPendingRemoteUpdate(false);
      setIsDirty(false);

      // Keep the acceptance mode active for the time window
      // Don't clear minAcceptVersionRef immediately - let the window expire naturally

      return;
    }

    // If acceptance window has expired, clear the refs
    if (acceptedUpdateTimestampRef.current !== null &&
        (Date.now() - acceptedUpdateTimestampRef.current) >= ACCEPTANCE_WINDOW_MS) {
      minAcceptVersionRef.current = null;
      acceptedUpdateTimestampRef.current = null;
    }
    
    // CRITICAL: Always check localStorage FIRST to catch cases where state hasn't updated yet
    // This is essential for preventing overwrites after page refresh or during initialization
    let storedIsDirty = false;
    let storedFormData = null;
    
    try {
      storedIsDirty = localStorage.getItem(`${storageKey}_isDirty`) === 'true';
      const storedFormDataStr = localStorage.getItem(`${storageKey}_formData`);
      if (storedFormDataStr) {
        storedFormData = JSON.parse(storedFormDataStr);
      }
    } catch (e) {
      // If localStorage read fails, continue with state check
    }
    
    // Check both state and localStorage - if either says dirty, protect the form
    const isCurrentlyDirty = isDirty || storedIsDirty;
    
    // If user has unsaved changes (either in state or localStorage), don't overwrite their form
    if (isCurrentlyDirty) {
      // Update isDirty state if it was only in localStorage
      if (!isDirty && storedIsDirty) {
        setIsDirty(true);
        // Also restore formData if we have it in localStorage and it's different
        if (storedFormData && JSON.stringify(storedFormData) !== JSON.stringify(formData)) {
          setFormData(storedFormData);
        }
      }
      // Mark that a remote update is available
      setPendingRemoteUpdate(true);
      // CRITICAL: Don't update formData - user's edits are preserved
      return; // Early return to prevent any formData updates
    } else {
      // User is not editing → safe to auto-sync
      // But check if we have stored formData that's different (means it was dirty before refresh)
      if (storedFormData) {
        try {
          const storedDataStr = JSON.stringify(storedFormData);
          const newDataStr = JSON.stringify(newData);
          if (storedDataStr !== newDataStr) {
            // We have stored formData that's different - this means we restored dirty state
            // Don't overwrite it - preserve the user's work
            setFormData(storedFormData);
            setIsDirty(true);
            setPendingRemoteUpdate(true);
            return;
          }
        } catch (e) {
          // If comparison fails, continue with normal update
        }
      }
      
      // Also check if current formData is different from newData (safety check)
      if (formData) {
        try {
          const currentDataStr = JSON.stringify(formData);
          const newDataStr = JSON.stringify(newData);
          if (currentDataStr !== newDataStr && currentDataStr !== '{}' && currentDataStr !== 'null') {
            // Current formData exists and is different - might be restored data
            // Check if it matches stored formData
            if (storedFormData) {
              const storedDataStr = JSON.stringify(storedFormData);
              if (storedDataStr === currentDataStr) {
                // Current formData matches stored - it was restored, protect it
                setIsDirty(true);
                setPendingRemoteUpdate(true);
                return;
              }
            }
          }
        } catch (e) {
          // If comparison fails, continue with normal update
        }
      }
      
      // Safe to update
      setFormData(newData);
      setPendingRemoteUpdate(false);
    }
  }, [isDirty, storageKey, compareVersions, formData]);
  
  /**
   * Update form data (user is editing)
   * Marks the form as dirty
   */
  const updateFormData = useCallback((updates) => {
    setFormData(prev => {
      if (typeof updates === 'function') {
        return updates(prev);
      }
      return { ...prev, ...updates };
    });
    setIsDirty(true);
  }, []);
  
  /**
   * Update a specific field in form data
   */
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
  }, []);
  
  /**
   * Save form data (after successful save to backend)
   * Resets dirty flag, syncs with server data, and clears localStorage
   */
  const markAsSaved = useCallback(() => {
    setIsDirty(false);
    setPendingRemoteUpdate(false);
    // After save, formData becomes the new serverData
    setServerData(formData);
    
    // Clear localStorage since data is now saved to backend
    try {
      localStorage.removeItem(`${storageKey}_formData`);
      localStorage.removeItem(`${storageKey}_serverData`);
      localStorage.removeItem(`${storageKey}_isDirty`);
      localStorage.removeItem(`${storageKey}_pendingRemoteUpdate`);
      localStorage.removeItem(`${storageKey}_lastServerVersion`);
    } catch (error) {
      // Error clearing localStorage after save
    }
  }, [formData, storageKey]);
  
  /**
   * Accept pending remote update
   * Discards user's unsaved changes and applies server data
   * Also clears localStorage since we're syncing with server
   * 
   * SCALABLE APPROACH: Uses version-based acceptance instead of timeouts
   */
  const acceptRemoteUpdate = useCallback(() => {
    // Get the current server version as the minimum version to accept
    const currentServerVersion = lastServerVersion || serverData?.updatedAt || serverData?.version || serverData?._id;

    // Set minimum acceptance version - any update with version >= this will be applied
    // This is more reliable than timeouts and scales better
    minAcceptVersionRef.current = currentServerVersion;

    // Set acceptance timestamp to maintain a time window for auto-accepting updates
    // This prevents multiple WebSocket messages from reverting the accepted data
    acceptedUpdateTimestampRef.current = Date.now();

    // Apply current server data immediately
    setFormData(serverData);
    setIsDirty(false);
    setPendingRemoteUpdate(false);

    // Clear localStorage since we're syncing with server data
    try {
      localStorage.removeItem(`${storageKey}_formData`);
      localStorage.removeItem(`${storageKey}_serverData`);
      localStorage.removeItem(`${storageKey}_isDirty`);
      localStorage.removeItem(`${storageKey}_pendingRemoteUpdate`);
      localStorage.removeItem(`${storageKey}_lastServerVersion`);
    } catch (error) {
      // Error clearing localStorage after accepting update
    }
  }, [serverData, storageKey, lastServerVersion]);
  
  /**
   * Discard pending remote update
   * Keeps user's edits and clears the pending flag
   */
  const discardRemoteUpdate = useCallback(() => {
    setPendingRemoteUpdate(false);
    // Update serverData to match current formData so version check works
    setServerData(formData);
    if (formData?.updatedAt) {
      setLastServerVersion(formData.updatedAt);
    }
    // Clear acceptance mode and timestamp
    minAcceptVersionRef.current = null;
    acceptedUpdateTimestampRef.current = null;
  }, [formData]);
  
  /**
   * Reset form state (e.g., when starting a new survey)
   */
  const resetFormState = useCallback((newInitialData = null) => {
    setServerData(newInitialData);
    setFormData(newInitialData);
    setIsDirty(false);
    setPendingRemoteUpdate(false);
    setLastServerVersion(null);
    minAcceptVersionRef.current = null;
    acceptedUpdateTimestampRef.current = null;
    
    // Clear localStorage
    try {
      localStorage.removeItem(`${storageKey}_formData`);
      localStorage.removeItem(`${storageKey}_serverData`);
      localStorage.removeItem(`${storageKey}_isDirty`);
      localStorage.removeItem(`${storageKey}_pendingRemoteUpdate`);
      localStorage.removeItem(`${storageKey}_lastServerVersion`);
    } catch (error) {
      // Error clearing form state from localStorage
    }
  }, [storageKey]);
  
  /**
   * Initialize with server data (e.g., on initial load)
   * Only updates if form is not dirty AND we haven't restored dirty state from localStorage
   */
  const initializeWithServerData = useCallback((data, version = null) => {
    // Check localStorage directly to see if we have dirty state
    // This works even if the restore useEffect hasn't run yet
    const storedIsDirty = localStorage.getItem(`${storageKey}_isDirty`);
    const wasDirty = storedIsDirty === 'true';
    
    if (!hasRestoredRef.current) {
      // If we haven't restored yet, check localStorage directly
      if (wasDirty) {
        // Form was dirty - don't initialize with server data
        // The restore useEffect will handle restoring the formData
        // Just set serverData for comparison
        setServerData(data);
        const dataVersion = version || data?.updatedAt || data?.version || data?._id;
        if (dataVersion) {
          setLastServerVersion(dataVersion);
        }
        return; // Don't overwrite formData
      } else {
        // Form was not dirty - safe to initialize
        setServerData(data);
        setFormData(data);
        const dataVersion = version || data?.updatedAt || data?.version || data?._id;
        if (dataVersion) {
          setLastServerVersion(dataVersion);
        }
        return;
      }
    }
    
    // After restore, check current dirty state
    if (isDirty) {
      // Form is currently dirty - don't overwrite
      // Just update serverData for comparison
      setServerData(data);
      const dataVersion = version || data?.updatedAt || data?.version || data?._id;
      if (dataVersion) {
        setLastServerVersion(dataVersion);
      }
      // Check if this is a newer version
      const currentVersion = lastServerVersion || formData?.updatedAt || formData?._id;
      const newVersion = version || data?.updatedAt || data?.version || data?._id;
      if (newVersion && newVersion !== currentVersion) {
        setPendingRemoteUpdate(true);
      }
    } else {
      // Form is not dirty, safe to sync
      receiveServerData(data, version);
    }
  }, [receiveServerData, storageKey, isDirty, lastServerVersion, formData]);
  
  // Function to check if we just accepted an update (for components to know)
  const hasJustAcceptedUpdate = useCallback(() => {
    // Check if we're within the acceptance window
    if (acceptedUpdateTimestampRef.current !== null) {
      const isWithinWindow = (Date.now() - acceptedUpdateTimestampRef.current) < ACCEPTANCE_WINDOW_MS;
      return isWithinWindow;
    }
    return minAcceptVersionRef.current !== null;
  }, []);

  return {
    // State
    serverData,
    formData,
    isDirty,
    pendingRemoteUpdate,
    lastServerVersion,
    
    // Actions
    receiveServerData,
    updateFormData,
    updateField,
    markAsSaved,
    acceptRemoteUpdate,
    discardRemoteUpdate,
    resetFormState,
    initializeWithServerData,
    hasJustAcceptedUpdate,
    
    // Direct setters (use with caution)
    setFormData,
    setServerData,
    setIsDirty,
  };
}
