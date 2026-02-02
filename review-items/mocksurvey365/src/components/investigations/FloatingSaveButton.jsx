import React from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";


const FloatingSaveButton = ({
  onSave,
  isLoading = false,
  isSaving = false,
  disabled = false,
  label = "Save Progress",
  savingLabel = "Saving...",
  position = "bottom-20 sm:bottom-[100px]",
  showHelperText = false,
  className = "",
  buttonClassName = "",
  ...props
}) => {
  const isDisabled = isLoading || isSaving || disabled;
  const isCurrentlySaving = isLoading || isSaving;

  return (
    <div className={`fixed bottom-[100px]  right-6 z-40 flex flex-col items-end gap-2`}>
      <Button
        onClick={onSave}
        disabled={isDisabled}
        className={`h-11 sm:h-12 px-4 sm:px-6 bg-[#075b7d] hover:bg-[#075b7d] text-white text-sm sm:text-base font-medium disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full shadow-lg flex items-center gap-2 hover:shadow-xl transition-all ${buttonClassName}`}
        size="lg"
        title="Save your progress without navigating away"
        {...props}
      >
        {isCurrentlySaving ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span className="hidden sm:inline">{savingLabel}</span>
            <span className="sm:hidden">{savingLabel}</span>
          </>
        ) : (
          <>
            <FileText className="w-4 h-4 sm:w-5 sm:h-5  md:hidden" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">Save</span>
          </>
        )}
      </Button>
     
    </div>
  );
};

export default FloatingSaveButton;
