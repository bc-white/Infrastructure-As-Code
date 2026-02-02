import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const AddInvestigationModal = ({
  isOpen,
  onClose,
  selectedResidents,
  selectedResident,
  residents,
  newInvestigationData,
  setNewInvestigationData,
  isSurveyClosed,
  careAreas,
  handleBulkInvestigation,
  handleAddInvestigation,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Add New Investigation
          </h3>
          <Button
            onClick={() => {
              onClose();
              setNewInvestigationData({
                careArea: "",
                fTag: "",
                reason: "",
              });
            }}
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
          >
            ✕
          </Button>
        </div>

        {selectedResidents.size === 0 && !selectedResident ? (
          <div className="text-center py-4">
            <p className="text-gray-500">Please select residents first</p>
          </div>
        ) : (
          <>
            {/* Selected Residents Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              {selectedResidents.size > 0 ? (
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Selected Residents:</strong>{" "}
                    {selectedResidents.size} resident
                    {selectedResidents.size !== 1 ? "s" : ""}
                  </p>
                  <div className="text-xs text-gray-500">
                    {Array.from(selectedResidents)
                      .slice(0, 3)
                      .map((residentId) => {
                        const resident = residents.find(
                          (r) => r.id === residentId
                        );
                        return resident
                          ? `${resident.name} (Room ${resident.room})`
                          : "";
                      })
                      .filter(Boolean)
                      .join(", ")}
                    {selectedResidents.size > 3 &&
                      ` +${selectedResidents.size - 3} more`}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  <strong>Resident:</strong> {selectedResident.name} (Room{" "}
                  {selectedResident.room})
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Care Area *
                </Label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  onChange={(e) =>
                    setNewInvestigationData((prev) => ({
                      ...prev,
                      careArea: e.target.value,
                    }))
                  }
                  value={newInvestigationData.careArea}
                  disabled={isSurveyClosed}
                >
                  <option value="">Select Care Area</option>
                  {careAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  F-Tag (Optional)
                </Label>
                <Input
                  placeholder="e.g., F686, F689"
                  className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  onChange={(e) =>
                    setNewInvestigationData((prev) => ({
                      ...prev,
                      fTag: e.target.value,
                    }))
                  }
                  value={newInvestigationData.fTag}
                  disabled={isSurveyClosed}
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Investigation Reason
                </Label>
                <textarea
                  placeholder="Describe why this investigation is needed..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  onChange={(e) =>
                    setNewInvestigationData((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  value={newInvestigationData.reason}
                  disabled={isSurveyClosed}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={() => {
                    onClose();
                    setNewInvestigationData({
                      careArea: "",
                      fTag: "",
                      reason: "",
                    });
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!newInvestigationData.careArea) {
                      toast.error("Please select a care area");
                      return;
                    }

                    if (selectedResidents.size > 0) {
                      // Bulk investigation for multiple residents
                      handleBulkInvestigation(
                        newInvestigationData.careArea,
                        newInvestigationData.fTag,
                        newInvestigationData.reason
                      );
                    } else if (selectedResident) {
                      // Single investigation
                      handleAddInvestigation(
                        selectedResident.id,
                        newInvestigationData.careArea,
                        newInvestigationData.fTag,
                        newInvestigationData.reason
                      );
                    }
                  }}
                  disabled={!newInvestigationData.careArea || isSurveyClosed}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedResidents.size > 0
                    ? "Add to All Selected"
                    : "Add Investigation"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddInvestigationModal;
