import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Hook to manage real-time synchronization and conflict resolution for investigations.
 * Handles the complex logic of merging server updates while preserving local unsaved changes.
 */
export const useInvestigationSync = ({
  investigations,
  surveyData,
  serverData,
  hasJustAcceptedUpdate,
  handleSurveyDataChange,
  isInvitedUser,
  currentUser,
  currentUserId
}) => {
  // State for update confirmation modal
  const [showAcceptUpdateConfirm, setShowAcceptUpdateConfirm] = useState(false);
  // Local state to track pending updates detected while user is editing
  const [localPendingUpdate, setLocalPendingUpdate] = useState(false);
  // State to track if editing is in progress
  const [editingInProgress, setEditingInProgress] = useState(false);

  // Refs for tracking state and synchronization
  const updateToastShownRef = useRef(false);
  const currentUpdateToastIdRef = useRef(null);
  const recentlyReopenedRef = useRef(new Set());
  const localUnsavedChangesRef = useRef(new Map());
  const isMakingLocalEditRef = useRef(false);
  const lastSyncedServerDataRef = useRef(null);
  const lastKnownInvestigationsRef = useRef(null);
  const socketBroadcastReceivedRef = useRef(false);
  const isUpdatingFromLocalEditRef = useRef(false);
  const isEditingRef = useRef(false);
  const editingInvestigationsRef = useRef(new Set());

  // Keep ref in sync with state for socket handlers (which are closures)
  useEffect(() => {
    isEditingRef.current = editingInProgress;
  }, [editingInProgress]);

  // Handlers for editing state
  const handleEditStart = useCallback((investigationId) => {
    if (investigationId) {
      editingInvestigationsRef.current.add(investigationId);
      setEditingInProgress(true);
      isMakingLocalEditRef.current = true;
      isUpdatingFromLocalEditRef.current = true;
    }
  }, []);

  const handleEditEnd = useCallback(() => {
    isMakingLocalEditRef.current = false;
    isUpdatingFromLocalEditRef.current = false;
  }, []);

  // Wrapper function to handle investigation selection with editing protection
  const handleSelectInvestigation = useCallback((investigation) => {
    if (investigation) {
      // CRITICAL: Mark that user is now editing this investigation
      // This protects unfinished changes from being overridden by server data
      editingInvestigationsRef.current.add(investigation.id);
      setEditingInProgress(true);
    } else {
      // When deselecting, clear editing flags for all investigations
      // User is no longer editing any investigation
      editingInvestigationsRef.current.clear();
      setEditingInProgress(false);
      // Also clear recently reopened flags since user is done editing
      recentlyReopenedRef.current.clear();
      localUnsavedChangesRef.current.clear();
    }
  }, []);

  // Effect to restore local unsaved changes after accepting remote update
  useEffect(() => {
    // Check if user just accepted an update
    if (!hasJustAcceptedUpdate || !hasJustAcceptedUpdate()) {
      return;
    }

    // CRITICAL: Clear all editing flags when accepting updates
    // This ensures fresh start after accepting updates
    editingInvestigationsRef.current.clear();
    setEditingInProgress(false);
    isMakingLocalEditRef.current = false;
    isUpdatingFromLocalEditRef.current = false;
    recentlyReopenedRef.current.clear();

    // Check if we have any local unsaved changes stored
    if (localUnsavedChangesRef.current.size === 0) {
      return;
    }

    // Get all stored unsaved changes from ref
    const localUnsavedChanges = new Map(localUnsavedChangesRef.current);

    if (localUnsavedChanges.size === 0) {
      return;
    }

    // Wait a bit for acceptRemoteUpdate to complete, then restore unsaved changes
    setTimeout(() => {
      // Merge back the local unsaved changes
      if (isInvitedUser()) {
        handleSurveyDataChange("investigationSurvey", {
          ...surveyData?.investigationSurvey,
          teamMemberPayload: (
            surveyData?.investigationSurvey?.teamMemberPayload || []
          ).map((payload) => {
            if (
              String(payload.teamMemberId) === String(currentUserId) ||
              String(payload.userId) === String(currentUserId) ||
              payload.teamMemberEmail === currentUser?.email
            ) {
              const mergedInvestigations = (payload.investigations || []).map(
                (serverInv) => {
                  const localChange = localUnsavedChanges.get(serverInv.id);
                  // If we have a local change and it's more recent (reopened), use it
                  if (localChange && localChange.reopenedAt) {
                    return localChange;
                  }
                  return serverInv;
                }
              );

              // Add any local changes not in server data
              localUnsavedChanges.forEach((localInv) => {
                if (
                  !mergedInvestigations.find((inv) => inv.id === localInv.id)
                ) {
                  mergedInvestigations.push(localInv);
                }
              });

              return {
                ...payload,
                investigations: mergedInvestigations,
              };
            }
            return payload;
          }),
        });
      } else {
        // Team Lead: Merge into investigations array
        const mergedInvestigations = (
          surveyData?.investigationSurvey?.investigations || []
        ).map((serverInv) => {
          const localChange = localUnsavedChanges.get(serverInv.id);
          // If we have a local change and it's more recent (reopened), use it
          if (localChange && localChange.reopenedAt) {
            return localChange;
          }
          return serverInv;
        });

        // Add any local changes not in server data
        localUnsavedChanges.forEach((localInv) => {
          if (!mergedInvestigations.find((inv) => inv.id === localInv.id)) {
            mergedInvestigations.push(localInv);
          }
        });

        handleSurveyDataChange("investigationSurvey", {
          ...surveyData?.investigationSurvey,
          investigations: mergedInvestigations,
        });
      }

    }, 300); // Wait for acceptRemoteUpdate to complete and surveyData to update
  }, [
    hasJustAcceptedUpdate,
    surveyData?.investigationSurvey?.investigations,
    surveyData?.investigationSurvey?.teamMemberPayload,
    isInvitedUser,
    investigations,
    handleSurveyDataChange,
    currentUser,
    currentUserId
  ]);

  return {
    // State
    showAcceptUpdateConfirm,
    setShowAcceptUpdateConfirm,
    localPendingUpdate,
    setLocalPendingUpdate,
    editingInProgress,
    setEditingInProgress,

    // Refs (exposed if needed, but preferably encapsulated)
    editingInvestigationsRef,
    isMakingLocalEditRef,
    isUpdatingFromLocalEditRef,
    recentlyReopenedRef,
    localUnsavedChangesRef,

    // Handlers
    handleEditStart,
    handleEditEnd,
    handleSelectInvestigation
  };
};
