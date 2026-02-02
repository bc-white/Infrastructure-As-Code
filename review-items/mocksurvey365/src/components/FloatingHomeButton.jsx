import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import UnsavedChangesModal from "./UnsavedChangesModal";

/**
 * FloatingHomeButton - A reusable floating home button component
 * that handles unsaved changes detection and saving before navigation.
 * 
 * @param {boolean} hasUnsavedChanges - Whether the current page has unsaved changes
 * @param {function} onSave - Async function to save the current page's data. Should clear unsaved changes state.
 * @param {function} onClearUnsavedChanges - Function to clear unsaved changes state before navigation
 * @param {string} navigateTo - Path to navigate to (default: "/surveys")
 */
const FloatingHomeButton = ({ 
  hasUnsavedChanges = false, 
  onSave,
  onClearUnsavedChanges,
  navigateTo = "/surveys" 
}) => {
  const navigate = useNavigate();
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [shouldNavigate, setShouldNavigate] = useState(false);
  
  // Effect to navigate after hasUnsavedChanges becomes false
  useEffect(() => {
   
    if (shouldNavigate && !hasUnsavedChanges) {
     
      setShouldNavigate(false);
      
      // Use setTimeout to let React finish all state updates and cleanup effects
      // before navigating (this allows useBrowserNavigationBlocker to clean up first)
      setTimeout(() => {
        
        navigate(navigateTo, { replace: true });
      }, 50);
    }
  }, [shouldNavigate, hasUnsavedChanges, navigate, navigateTo]);

  const handleHomeClick = () => {
   
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true);
    } else {
      navigate(navigateTo);
    }
  };

  const handleCancel = () => {
    setShowUnsavedModal(false);
  };

  const handleConfirm = async () => {
  
    setShowUnsavedModal(false);
    
    if (onSave) {
      try {
       
        const saveSucceeded = await onSave();
        
        // Only proceed with navigation if save was successful
        if (saveSucceeded === false) {
          // Save failed (validation error, API error, etc.) - don't navigate
          return;
        }
       
      } catch (error) {
        // console.error("[FloatingHomeButton] Error saving data:", error);
        // Don't navigate if save threw an error
        return;
      }
    }
    
    // Clear unsaved changes state before navigation to prevent beforeunload dialog
    if (onClearUnsavedChanges) {
     
      onClearUnsavedChanges();
    }
    
    // Set flag to navigate - the useEffect will handle navigation once hasUnsavedChanges becomes false
   
    setShouldNavigate(true);
  };

  return (
    <>
      {/* Floating Home Button */}
      <button
        onClick={handleHomeClick}
        className="fixed bottom-40 md:bottom-40 right-6 z-20 flex items-center gap-2 px-4 py-3 bg-cyan-700 hover:bg-cyan-800 text-white rounded-full shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 cursor-pointer"
        title="Exit current survey and return to surveys list"
      >
        <Home className="w-5 h-5 md:hidden" />
        <span className="font-medium text-sm hidden md:inline">Exit Survey</span>
      </button>

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        open={showUnsavedModal}
        onOpenChange={setShowUnsavedModal}
        onCancel={handleCancel}
        onConfirm={
            handleConfirm
        }
      />
    </>
  );
};

export default FloatingHomeButton;
