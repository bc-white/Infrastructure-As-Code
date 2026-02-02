import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { X, Users } from "lucide-react";
import { toast } from "sonner";

const AddObservationModal = ({
  isOpen,
  onClose,
  selectedResident,
  setSelectedResident,
  surveyData,
  handleSurveyDataChange,
  setHasUnsavedChanges,
  setUnsavedChanges,
}) => {
  if (!isOpen) return null;

  const getFormValues = () => {
    const location = document.getElementById("observationLocation")?.value;
    const description = document.getElementById("observationDescription")?.value;
    const timestamp = document.getElementById("observationTimestamp")?.value;

    return { location, description, timestamp };
  };

  const handleSubmit = () => {
    const { location, description, timestamp } = getFormValues();

    if (!location || !timestamp) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Create new observation with proper resident association
    const newObservation = {
      id: Date.now().toString(),
      location,
      description,
      timestamp: new Date(timestamp).toLocaleString(),
      residentId: selectedResident?.id || null,
      residentName: selectedResident?.name || "Unknown",
      createdAt: new Date().toISOString(),
      // Add required fields for proper integration
      observationType: "general",
      notes: description,
      dateTime: new Date(timestamp).toISOString(),
    };

    const updatedObservations = [
      ...(surveyData?.initialPoolProcess?.observations || []),
      newObservation,
    ];

    // Update resident specific fields if a resident is selected
    let updatedResidents = surveyData?.initialPoolProcess?.residents || [];
    if (selectedResident && selectedResident.id) {
      updatedResidents = updatedResidents.map((r) => {
        if (
          r.id === selectedResident.id ||
          (selectedResident._id && r._id === selectedResident._id) ||
          (selectedResident.generatedId && r.generatedId === selectedResident.generatedId)
        ) {
          return {
            ...r,
            scheduleObservationArea: location,
            scheduleObservationDescription: description,
            scheduleObservationDateTime: new Date(timestamp).toISOString(),
          };
        }
        return r;
      });
    }

    // Mark as having unsaved changes to protect from server overwrites
    if (setHasUnsavedChanges) {
      setHasUnsavedChanges(true);
    }
    if (setUnsavedChanges && selectedResident?.id) {
      setUnsavedChanges(prev => ({
        ...prev,
        [String(selectedResident.id)]: true
      }));
    }

    handleSurveyDataChange("initialPoolProcess", {
      ...surveyData.initialPoolProcess,
      observations: updatedObservations,
      residents: updatedResidents,
    });

    // Clear selected resident if this was a specific resident observation
    if (selectedResident) {
      setSelectedResident(null);
    }

    onClose();
    toast.success("Observation added successfully!");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Add Observation (RO)
          </h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Resident Selection */}
          {selectedResident && (
            <div className="p-3 bg-[#075b7d]/10 border border-[#075b7d]/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#075b7d]" />
                <span className="text-sm font-medium text-[#075b7d]">
                  Observation for: {selectedResident.name} -{" "}
                  {selectedResident.room}
                </span>
              </div>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Location/Area *
            </Label>
            <Input
              placeholder="e.g., Dining Room, Common Area, Nursing Station"
              className="w-full"
              id="observationLocation"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Observation Description
            </Label>
            <textarea
              placeholder="Describe what you observed (care observations, common areas, etc.)"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none"
              id="observationDescription"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Timestamp *
            </Label>
            <Input
              type="datetime-local"
              className="w-full"
              id="observationTimestamp"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-4 py-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#075b7d] hover:bg-[#075b7d] text-white"
          >
            Add Observation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddObservationModal;
