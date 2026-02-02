import { Button } from "../ui/button";
import { AlertTriangle } from "lucide-react";


const UnassignResidentModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  resident,
  isLoading = false 
}) => {
  if (!isOpen || !resident) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
            Unassign Team Member?
          </h3>
          <p className="text-sm text-center text-gray-600 mb-6">
            Are you sure you want to unassign the team member from{" "}
            <span className="font-medium text-gray-900">{resident.name}</span>?
          </p>
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white border-transparent"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Unassigning...
                </>
              ) : (
                "Unassign"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnassignResidentModal;
