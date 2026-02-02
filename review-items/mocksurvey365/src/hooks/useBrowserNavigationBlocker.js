import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to block browser back button navigation when there are unsaved changes.
 * Uses the history.pushState hack to trap the back button.
 * 
 * @param {boolean|object} hasUnsavedChangesOrOptions - Whether to block navigation, or options object
 * @param {function} onBlock - Callback when navigation is blocked (user pressed back)
 * @returns {object} - { restoreBlocker, disableBlocker } functions
 */
export function useBrowserNavigationBlocker(hasUnsavedChangesOrOptions, onBlock) {
  // Support both old API (boolean, callback) and new API (object with isBlocked, onBlock)
  const isOptionsObject = typeof hasUnsavedChangesOrOptions === 'object' && hasUnsavedChangesOrOptions !== null;
  const hasUnsavedChanges = isOptionsObject ? hasUnsavedChangesOrOptions.isBlocked : hasUnsavedChangesOrOptions;
  const onBlockCallback = isOptionsObject ? hasUnsavedChangesOrOptions.onBlock : onBlock;

  const isBlockedRef = useRef(false);
  const onBlockRef = useRef(onBlockCallback);
  const isNavigatingAwayRef = useRef(false); // Track if we're navigating away programmatically

  // Update the ref whenever onBlock changes
  useEffect(() => {
    onBlockRef.current = onBlockCallback;
  }, [onBlockCallback]);

  // Handle the popstate event (user clicking back)
  const handlePopState = useCallback((event) => {
    if (isBlockedRef.current && !isNavigatingAwayRef.current) {
      // User tried to go back, but we are now at the "previous" state (visually the same)
      // The dummy state we pushed has been popped.
      isBlockedRef.current = false;
      
      // Trigger the blocking UI
      if (onBlockRef.current) {
        onBlockRef.current();
      }
    }
  }, []);

  useEffect(() => {
    if (hasUnsavedChanges) {
      // Push a dummy state to the history stack
      // This makes the "current" page the top of the stack
      window.history.pushState(null, "", window.location.href);
      isBlockedRef.current = true;

      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      
      isBlockedRef.current = false;
    };
  }, [hasUnsavedChanges, handlePopState]);

  // Call this before programmatic navigation to prevent the blocker from interfering
  const disableBlocker = useCallback(() => {
    isNavigatingAwayRef.current = true;
    isBlockedRef.current = false;
  }, []);

  const restoreBlocker = useCallback(() => {
    isNavigatingAwayRef.current = false;
    if (hasUnsavedChanges && !isBlockedRef.current) {
      window.history.pushState(null, "", window.location.href);
      isBlockedRef.current = true;
    }
  }, [hasUnsavedChanges]);

  return { restoreBlocker, disableBlocker };
}
