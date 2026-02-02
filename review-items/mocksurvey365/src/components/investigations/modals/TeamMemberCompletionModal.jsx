import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TeamMemberCompletionModal = ({
  isOpen,
  onClose,
  currentUserId,
  updateTaskStatus,
  saveInvestigationSurveyData,
  getCurrentUserAssignedResidents,
  investigations,
}) => {
  if (!isOpen) return null;

  const assignedResidents = getCurrentUserAssignedResidents();
  const completedInvestigationsCount = investigations.filter((inv) =>
    assignedResidents.includes(inv.residentId)
  ).length;

  const handleMarkComplete = async () => {
    try {
      await updateTaskStatus(currentUserId, "completed");

      // Also save the investigation data to update teamMemberPayload
      await saveInvestigationSurveyData();
      onClose();
      toast.success("Work marked as complete!");
    } catch (error) {
      toast.error("Failed to mark work as complete");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Mark Work Complete
          </h2>
          <p className="text-gray-600">
            Are you sure you want to mark your investigation work as complete?
          </p>
        </div>

        {/* Work Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h3 className="font-medium text-gray-900">Work Summary</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Assigned Residents: {assignedResidents.length}</div>
            <div>Investigations Completed: {completedInvestigationsCount}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleMarkComplete}
            className="w-full h-12 text-white font-medium text-base rounded-lg"
            style={{ backgroundColor: "#075b7d" }}
          >
            Mark Complete
          </Button>

          <Button
            onClick={onClose}
            variant="outline"
            className="w-full h-12 font-medium text-base rounded-lg"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberCompletionModal;
