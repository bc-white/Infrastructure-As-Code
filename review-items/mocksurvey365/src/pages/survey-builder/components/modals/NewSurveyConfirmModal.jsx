import React from "react";
import { X } from "lucide-react";

/**
 * New Survey Confirmation Modal
 * Separated from SurveyBuilder for better maintainability
 */
const NewSurveyConfirmModal = ({
  isOpen,
  currentStep,
  totalSteps,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const progressPercentage = Math.round(
    ((currentStep - 1) / (totalSteps - 1)) * 100
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Start New Survey?
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div>
              <p className="text-gray-900 font-medium">
                Warning: This will clear all progress
              </p>
              <p className="text-sm text-gray-600">
                Starting a new survey will permanently delete your current
                progress, including all entered data, team members, and
                completed steps.
              </p>
            </div>
          </div>

          {currentStep > 1 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>Current progress:</strong> Step {currentStep} of{" "}
                {totalSteps} ({progressPercentage}% complete)
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Start New Survey
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewSurveyConfirmModal;

