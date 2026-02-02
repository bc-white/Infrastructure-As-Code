import React from "react";
import { Button } from "../../../../components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";

/**
 * E-Send Configuration Modal
 * Separated from SurveyBuilder for better maintainability
 */
const ESendModal = ({ isOpen, surveyData, onClose, onSave }) => {
  if (!isOpen) return null;

  const handleSave = () => {
    if (surveyData?.eSendConfig?.recipientEmail) {
      onSave();
      toast.success("E-send configuration saved!", {
        position: "top-right",
        autoClose: 3000,
      });
    } else {
      toast.error("Please enter a recipient email", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Configure E-Send
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="recipient@facility.com"
              value={surveyData?.eSendConfig?.recipientEmail || ""}
              onChange={(e) => {
                const currentConfig = surveyData?.eSendConfig || {};
                // This will be handled by parent component's handleSurveyDataChange
                // For now, we'll use a callback pattern
                if (onSave) {
                  onSave({
                    eSendConfig: {
                      ...currentConfig,
                      recipientEmail: e.target.value,
                    },
                  });
                }
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Line
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Survey Report - [Facility Name]"
              value={surveyData?.eSendConfig?.subjectLine || ""}
              onChange={(e) => {
                const currentConfig = surveyData?.eSendConfig || {};
                if (onSave) {
                  onSave({
                    eSendConfig: {
                      ...currentConfig,
                      subjectLine: e.target.value,
                    },
                  });
                }
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Please find attached the survey report..."
              value={surveyData?.eSendConfig?.message || ""}
              onChange={(e) => {
                const currentConfig = surveyData?.eSendConfig || {};
                if (onSave) {
                  onSave({
                    eSendConfig: {
                      ...currentConfig,
                      message: e.target.value,
                    },
                  });
                }
              }}
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="tracking"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={surveyData?.eSendConfig?.enableTracking || false}
              onChange={(e) => {
                const currentConfig = surveyData?.eSendConfig || {};
                if (onSave) {
                  onSave({
                    eSendConfig: {
                      ...currentConfig,
                      enableTracking: e.target.checked,
                    },
                  });
                }
              }}
            />
            <label htmlFor="tracking" className="text-sm text-gray-700">
              Enable delivery tracking
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </div>
      </div>
    </div>
  );
};

export default ESendModal;

