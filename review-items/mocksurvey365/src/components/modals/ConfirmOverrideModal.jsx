import { Button } from "../ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

/**
 * Reusable confirmation modal for warning users about overriding existing data
 * Can be used for Initial Pool, Final Sample, Investigations, etc.
 */
const ConfirmOverrideModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Override Existing Data?",
  message = "You have already generated data. Proceeding will override your current data.",
  confirmText = "Proceed",
  cancelText = "Cancel",
  isLoading = false,
  variant = "warning", // "warning" | "danger"
}) => {
  if (!isOpen) return null;

  const iconBgColor = variant === "danger" ? "bg-red-100" : "bg-amber-100";
  const iconColor = variant === "danger" ? "text-red-600" : "text-amber-600";
  const confirmBtnColor = variant === "danger" 
    ? "bg-red-600 hover:bg-red-700" 
    : "bg-amber-600 hover:bg-amber-700";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className={`flex items-center justify-center w-12 h-12 mx-auto ${iconBgColor} rounded-full mb-4`}>
            <AlertTriangle className={`w-6 h-6 ${iconColor}`} />
          </div>
          <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-sm text-center text-gray-600 mb-6">
            {message}
          </p>
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              onClick={onConfirm}
              className={`flex-1 ${confirmBtnColor} text-white border-transparent`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmOverrideModal;
