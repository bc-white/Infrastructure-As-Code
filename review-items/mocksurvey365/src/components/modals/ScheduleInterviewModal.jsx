import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { X, Users } from "lucide-react";
import { toast } from "sonner";

const ScheduleInterviewModal = ({
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
    const type = document.getElementById("interviewType")?.value;
    const residentName = document.getElementById("residentName")?.value;
    const email = document.getElementById("residentEmail")?.value;
    const scheduledDate = document.getElementById("scheduledDate")?.value;
    const notes = document.getElementById("interviewNotes")?.value;

    return { type, residentName, email, scheduledDate, notes };
  };

  const handleSubmit = () => {
    const { type, residentName, email, scheduledDate, notes } = getFormValues();

    if (!type || !residentName || !scheduledDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Create new interview with proper resident association
    const newInterview = {
      id: Date.now().toString(),
      type,
      residentName,
      email,
      date: scheduledDate,
      notes,
      status: "Scheduled",
      residentId: selectedResident?.id || null,
      timestamp: new Date().toISOString(),
      // Add required fields for proper integration
      responses: {},
      interviewDate: new Date().toISOString(),
      areas: selectedResident?.interviewAreas || [],
    };

    const currentInterviews = surveyData?.residentInterviews || [];
    const updatedInterviews = [...currentInterviews, newInterview];

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
            scheduleInterviewType: type,
            scheduleInterviewEmail: email,
            scheduleInterviewDateTime: scheduledDate,
            scheduleInterviewNotes: notes,
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

    // Update both top-level and nested locations to maintain consistency
    handleSurveyDataChange("residentInterviews", updatedInterviews);
    handleSurveyDataChange("initialPoolProcess", {
      ...surveyData.initialPoolProcess,
      residentInterviews: updatedInterviews,
      residents: updatedResidents,
    });

    // Clear selected resident if this was a specific resident interview
    if (selectedResident) {
      setSelectedResident(null);
    }

    onClose();
    toast.success("Interview scheduled successfully!");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            Schedule Interview
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
                  Interview for: {selectedResident.name} -{" "}
                  {selectedResident.room}
                </span>
              </div>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Interview Type *
            </Label>
            <select
              id="interviewType"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d]"
            >
              <option value="">Select interview type</option>
              <option value="RI">Resident Interview (RI)</option>
              <option value="RRI">Representative Interview (RRI)</option>
              {/* <option value="SI">Staff Interview (SI)</option> */}
            </select>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Resident/Representative Name *
            </Label>
            <Input
              id="residentName"
              placeholder="Enter name"
              className="w-full"
              defaultValue={selectedResident?.name || ""}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Email
            </Label>
            <Input
              id="residentEmail"
              placeholder="Enter email"
              className="w-full"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Scheduled Date & Time *
            </Label>
            <Input
              id="scheduledDate"
              type="datetime-local"
              className="w-full"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Notes
            </Label>
            <textarea
              id="interviewNotes"
              placeholder="Interview goals, rationale, or special considerations"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#075b7d] focus:border-[#075b7d] resize-none"
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
            Schedule Interview
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleInterviewModal;
